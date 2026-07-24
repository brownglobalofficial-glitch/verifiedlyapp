import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { arrayMove } from "@dnd-kit/sortable";
import { Camera, Check, Copy, ExternalLink, Share2, SlidersHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import DashboardShell from "@/components/dashboard/DashboardShell";
import ProfileSectionsEditor from "@/components/profile/ProfileSectionsEditor";
import SocialIcon from "@/components/SocialIcon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import VerifiedBadge from "@/components/VerifiedBadge";
import { useToast } from "@/hooks/use-toast";
import {
  emptySectionData,
  hasVisibleSectionData,
  isProfileEditorSectionKind,
  profileSectionKindsForAccountType,
  safeExternalUrl,
  type ProfileSection,
  type ProfileSectionKind,
} from "@/lib/profile-sections";

interface ProfileForm {
  accountType: "creator" | "business";
  displayName: string;
  category: string;
  website: string;
  organizationLegalName: string;
  organizationIndustry: string;
  organizationCountry: string;
  socialLinks: Record<string, string>;
}

interface DashboardProfile {
  id: string;
  username: string;
  display_name: string | null;
  category: string | null;
  account_type: string | null;
  avatar_url: string | null;
  website: string | null;
  social_links: unknown;
  id_verified: boolean;
  organization_legal_name: string | null;
  organization_industry: string | null;
  organization_country: string | null;
}

const SOCIAL_FIELDS = [
  ["instagram", "Instagram", "Handle or profile URL"],
  ["youtube", "YouTube", "Handle or channel URL"],
  ["tiktok", "TikTok", "Handle or profile URL"],
  ["facebook", "Facebook", "Handle or page URL"],
  ["twitter", "X", "Handle or profile URL"],
] as const;

const ALLOWED_SOCIAL_KEYS = new Set(["location", "email", ...SOCIAL_FIELDS.map(([key]) => key)]);
const emptySocialLinks = Object.fromEntries([["location", ""], ["email", ""], ...SOCIAL_FIELDS.map(([key]) => [key, ""])]);
const emptyForm: ProfileForm = {
  accountType: "creator",
  displayName: "",
  category: "",
  website: "",
  organizationLegalName: "",
  organizationIndustry: "",
  organizationCountry: "",
  socialLinks: emptySocialLinks,
};
const inlineInputClass = "h-9 rounded-none border-0 border-b border-border/70 bg-transparent px-0 text-sm shadow-none placeholder:text-muted-foreground/50 focus-visible:border-foreground focus-visible:ring-0";

const draftSection = (userId: string, kind: ProfileSectionKind, position: number): ProfileSection => ({
  id: `draft-${kind}-${crypto.randomUUID()}`,
  user_id: userId,
  kind,
  position,
  data: emptySectionData(kind),
  is_public: true,
});

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<DashboardProfile | null>(null);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [sections, setSections] = useState<ProfileSection[]>([]);
  const [deletedSectionIds, setDeletedSectionIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileLinkCopied, setProfileLinkCopied] = useState(false);

  const activeKinds = useMemo(() => profileSectionKindsForAccountType(form.accountType), [form.accountType]);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      const [{ data: currentProfile, error: profileError }, { data: currentSections }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, username, display_name, category, account_type, avatar_url, website, social_links, id_verified, organization_legal_name, organization_industry, organization_country")
          .eq("id", session.user.id)
          .maybeSingle(),
        supabase
          .from("profile_sections")
          .select("id, user_id, kind, position, data, is_public, created_at, updated_at")
          .eq("user_id", session.user.id)
          .order("position", { ascending: true }),
      ]);

      if (profileError || !currentProfile) {
        toast({ title: "Could not load your profile", description: profileError?.message || "Please finish onboarding first.", variant: "destructive" });
        navigate("/onboarding");
        return;
      }

      const accountType: ProfileForm["accountType"] = currentProfile.account_type === "business" ? "business" : "creator";
      const allowedKinds = profileSectionKindsForAccountType(accountType);
      const socials = (currentProfile.social_links || {}) as Record<string, string>;
      const loadedSections = (currentSections || [])
        .map((section) => ({
          ...section,
          kind: section.kind as ProfileSectionKind,
          data: (section.data || {}) as Record<string, string>,
        }))
        .filter((section) => allowedKinds.includes(section.kind) && isProfileEditorSectionKind(section.kind) && hasVisibleSectionData(section));

      setProfile(currentProfile as DashboardProfile);
      setForm({
        accountType,
        displayName: currentProfile.display_name || "",
        category: currentProfile.category || "",
        website: accountType === "business" ? currentProfile.website || "" : "",
        organizationLegalName: currentProfile.organization_legal_name || "",
        organizationIndustry: currentProfile.organization_industry || "",
        organizationCountry: currentProfile.organization_country || "",
        socialLinks: {
          ...emptySocialLinks,
          ...Object.fromEntries(Object.entries(socials).filter(([key]) => ALLOWED_SOCIAL_KEYS.has(key))),
          twitter: socials.twitter || socials.x || "",
        },
      });
      setSections(loadedSections);
      setLoading(false);
    };

    void load();
  }, [navigate, toast]);

  const addSection = (kind: ProfileSectionKind) => {
    if (!profile || !activeKinds.includes(kind)) return;
    setSections((current) => [...current, draftSection(profile.id, kind, current.length)]);
  };

  const changeSection = (id: string, key: string, value: string) => {
    setSections((current) => current.map((section) => section.id === id ? { ...section, data: { ...section.data, [key]: value } } : section));
  };

  const removeSection = (section: ProfileSection) => {
    if (!section.id.startsWith("draft-")) setDeletedSectionIds((current) => [...current, section.id]);
    setSections((current) => current.filter((item) => item.id !== section.id));
  };

  const changeVisibility = (section: ProfileSection, isPublic: boolean) => {
    setSections((current) => current.map((item) => item.id === section.id ? { ...item, is_public: isPublic } : item));
  };

  const reorderSections = (kind: ProfileSectionKind, activeId: string, overId: string) => {
    setSections((current) => {
      const entries = current.filter((section) => section.kind === kind);
      const oldIndex = entries.findIndex((section) => section.id === activeId);
      const newIndex = entries.findIndex((section) => section.id === overId);
      if (oldIndex < 0 || newIndex < 0) return current;
      const reordered = arrayMove(entries, oldIndex, newIndex);
      let entryIndex = 0;
      return current.map((section) => section.kind === kind ? reordered[entryIndex++] : section);
    });
  };

  const shareProfile = async () => {
    if (!profile) return;
    const url = `https://verifiedly.app/${profile.username}`;
    try {
      if (navigator.share) await navigator.share({ title: form.displayName || profile.username, url });
      else {
        await navigator.clipboard.writeText(url);
        toast({ title: "Profile link copied" });
      }
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast({ title: "Could not share the profile", variant: "destructive" });
    }
  };

  const copyProfileLink = async () => {
    if (!profile) return;
    try {
      await navigator.clipboard.writeText(`https://verifiedly.app/${profile.username}`);
      setProfileLinkCopied(true);
      window.setTimeout(() => setProfileLinkCopied(false), 1800);
    } catch {
      toast({ title: "Could not copy the profile link", variant: "destructive" });
    }
  };

  const save = async () => {
    if (!profile) return;
    if (!form.displayName.trim()) {
      toast({ title: "Add a display name", variant: "destructive" });
      return;
    }

    const normalizedWebsite = form.accountType === "business" && form.website.trim() ? safeExternalUrl(form.website.trim()) : null;
    if (form.accountType === "business" && form.website.trim() && !normalizedWebsite) {
      toast({ title: "Enter a valid website", variant: "destructive" });
      return;
    }
    const publicEmail = form.socialLinks.email?.trim();
    if (publicEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(publicEmail)) {
      toast({ title: "Enter a valid public email", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const cleanSocials = Object.fromEntries(
        Object.entries(form.socialLinks)
          .filter(([key, value]) => ALLOWED_SOCIAL_KEYS.has(key) && value.trim().length > 0)
          .map(([key, value]) => [key, value.trim()]),
      );

      const { error: profileError } = await supabase.from("profiles").update({
        display_name: form.displayName.trim(),
        category: form.category.trim() || null,
        website: normalizedWebsite,
        organization_legal_name: form.accountType === "business" ? form.organizationLegalName.trim() || null : null,
        organization_industry: form.accountType === "business" ? form.organizationIndustry.trim() || null : null,
        organization_country: form.accountType === "business" ? form.organizationCountry.trim() || null : null,
        social_links: cleanSocials,
      }).eq("id", profile.id);
      if (profileError) throw profileError;

      const sectionIdsToDelete = [...new Set(deletedSectionIds)];
      if (sectionIdsToDelete.length) {
        const { error } = await supabase.from("profile_sections").delete().in("id", sectionIdsToDelete).eq("user_id", profile.id);
        if (error) throw error;
      }

      const savedSections: ProfileSection[] = [];
      let position = 0;
      for (const kind of activeKinds) {
        for (const section of sections.filter((item) => item.kind === kind)) {
          if (!hasVisibleSectionData(section)) continue;
          const payload = { data: section.data, is_public: section.is_public, position };
          if (section.id.startsWith("draft-")) {
            const { data, error } = await supabase
              .from("profile_sections")
              .insert({ user_id: profile.id, kind, ...payload })
              .select("id, user_id, kind, position, data, is_public, created_at, updated_at")
              .single();
            if (error || !data) throw error || new Error("Section was not saved");
            savedSections.push({ ...data, kind: data.kind as ProfileSectionKind, data: (data.data || {}) as Record<string, string> });
          } else {
            const { error } = await supabase.from("profile_sections").update(payload).eq("id", section.id).eq("user_id", profile.id);
            if (error) throw error;
            savedSections.push({ ...section, ...payload });
          }
          position += 1;
        }
      }

      setProfile({
        ...profile,
        display_name: form.displayName.trim(),
        category: form.category.trim() || null,
        website: normalizedWebsite,
        organization_legal_name: form.accountType === "business" ? form.organizationLegalName.trim() || null : null,
        organization_industry: form.accountType === "business" ? form.organizationIndustry.trim() || null : null,
        organization_country: form.accountType === "business" ? form.organizationCountry.trim() || null : null,
        social_links: cleanSocials,
      });
      setSections(savedSections);
      setDeletedSectionIds([]);
      toast({ title: "Profile saved" });
    } catch (error: unknown) {
      toast({ title: "Profile not saved", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <DashboardShell title="Edit profile" hidePreview><div className="p-8 text-sm text-muted-foreground">Loading…</div></DashboardShell>;
  }

  const displayName = form.displayName || "Your name";
  const profileTypeLabel = form.accountType === "business" ? "Organization profile" : "Individual profile";

  return (
    <DashboardShell title="Edit profile" hidePreview>
      <div className="mx-auto max-w-6xl px-3 py-3 sm:px-5 sm:py-5">
        <div className="sticky top-14 z-20 -mx-3 mb-3 flex items-center justify-between gap-2 border-b border-border bg-background/95 px-3 py-2.5 backdrop-blur sm:-mx-5 sm:px-5">
          <div className="flex min-w-0 items-center gap-1">
            <p className="min-w-0 truncate text-xs text-muted-foreground">verifiedly.app/{profile?.username}</p>
            <Tooltip open={profileLinkCopied ? true : undefined}>
              <TooltipTrigger asChild>
                <Button type="button" onClick={() => void copyProfileLink()} variant="ghost" size="sm" className="h-7 shrink-0 gap-1 rounded-full px-2 text-[11px]" aria-label="Copy profile link">
                  {profileLinkCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span className="hidden md:inline">{profileLinkCopied ? "Copied!" : "Copy link"}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs"><p>{profileLinkCopied ? "Copied!" : "Copy link"}</p></TooltipContent>
            </Tooltip>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Button type="button" onClick={() => void shareProfile()} variant="ghost" size="sm" className="h-8 gap-1.5 rounded-full px-3 text-xs"><Share2 className="h-3.5 w-3.5" /><span className="hidden sm:inline">Share</span></Button>
            <Button asChild variant="ghost" size="sm" className="h-8 gap-1.5 rounded-full px-3 text-xs"><Link to={`/${profile?.username}`} target="_blank">Preview <ExternalLink className="h-3.5 w-3.5" /></Link></Button>
            <Button onClick={() => void save()} disabled={saving} size="sm" className="h-8 rounded-full px-5 text-xs">{saving ? "Saving…" : "Save"}</Button>
          </div>
        </div>

        <Card className="overflow-visible rounded-3xl border-border/80 shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-border/70 bg-muted/25 px-4 py-2.5 sm:px-6">
            <div>
              <p className="text-[11px] font-semibold">{profileTypeLabel}</p>
              <p className="text-[10px] text-muted-foreground">Profile type controls which structured sections are available.</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="h-8 gap-1.5 rounded-full text-xs"><Link to="/dashboard/settings"><SlidersHorizontal className="h-3.5 w-3.5" /> Change type</Link></Button>
          </div>

          <section className="border-b border-border/70 px-4 py-5 text-center sm:px-6 sm:py-6">
            <div className="relative mx-auto w-fit">
              <Avatar className="h-20 w-20 bg-muted sm:h-24 sm:w-24">
                {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt="" className="object-cover" />}
                <AvatarFallback className="font-display text-2xl font-bold">{displayName[0]?.toUpperCase() || "?"}</AvatarFallback>
              </Avatar>
              <Button asChild variant="secondary" size="icon" className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full border border-background shadow-sm">
                <Link to="/dashboard/settings" aria-label="Change profile photo"><Camera className="h-3.5 w-3.5" /></Link>
              </Button>
            </div>
            <div className="relative mx-auto mt-3 max-w-sm px-7">
              <Input
                value={form.displayName}
                onChange={(event) => setForm({ ...form, displayName: event.target.value })}
                placeholder={form.accountType === "business" ? "Organization name" : "Your name"}
                maxLength={80}
                aria-label={form.accountType === "business" ? "Organization name" : "Name"}
                className="h-9 w-full border-0 bg-transparent p-0 text-center font-display text-2xl font-bold tracking-tight shadow-none placeholder:text-muted-foreground/45 focus-visible:ring-0"
              />
              {profile?.id_verified && <VerifiedBadge className="absolute right-1 top-1/2 h-5 w-5 -translate-y-1/2" label="Identity verified" />}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">@{profile?.username}</p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5" aria-label="Social profiles">
              {SOCIAL_FIELDS.map(([key, label, placeholder]) => {
                const hasValue = !!form.socialLinks[key]?.trim();
                return (
                  <Popover key={key}>
                    <PopoverTrigger asChild>
                      <button type="button" className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition ${hasValue ? "border-foreground/20 bg-foreground text-background" : "border-border bg-background text-muted-foreground hover:border-muted-foreground hover:text-foreground"}`} aria-label={`Edit ${label}`} title={label}>
                        <SocialIcon platform={key} className="h-3.5 w-3.5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="center" className="w-[min(300px,calc(100vw-24px))] p-3">
                      <label><span className="text-xs font-semibold">{label}</span><Input value={form.socialLinks[key] || ""} onChange={(event) => setForm({ ...form, socialLinks: { ...form.socialLinks, [key]: event.target.value } })} placeholder={placeholder} maxLength={500} className="mt-2 h-9" /></label>
                    </PopoverContent>
                  </Popover>
                );
              })}
            </div>
          </section>

          <div className="grid gap-0 lg:grid-cols-[minmax(220px,0.85fr)_minmax(0,2fr)]">
            <aside className="border-b border-border/70 p-4 lg:border-b-0 lg:border-r lg:p-5">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Profile information</p>
              <div className="space-y-3">
                {form.accountType === "business" && (
                  <>
                    <label className="block"><span className="text-[10px] font-medium text-muted-foreground">Legal organization name</span><Input value={form.organizationLegalName} onChange={(event) => setForm({ ...form, organizationLegalName: event.target.value })} placeholder="Registered legal name" maxLength={160} className={inlineInputClass} /></label>
                    <label className="block"><span className="text-[10px] font-medium text-muted-foreground">Industry</span><Input value={form.organizationIndustry} onChange={(event) => setForm({ ...form, organizationIndustry: event.target.value })} placeholder="Sports, media, technology…" maxLength={100} className={inlineInputClass} /></label>
                    <label className="block"><span className="text-[10px] font-medium text-muted-foreground">Registered country</span><Input value={form.organizationCountry} onChange={(event) => setForm({ ...form, organizationCountry: event.target.value })} placeholder="Country" maxLength={100} className={inlineInputClass} /></label>
                  </>
                )}
                <label className="block"><span className="text-[10px] font-medium text-muted-foreground">{form.accountType === "business" ? "Organization type" : "Professional label"}</span><Input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder={form.accountType === "business" ? "Football club, academy, business…" : "Footballer, student, founder…"} maxLength={60} className={inlineInputClass} /></label>
                <label className="block"><span className="text-[10px] font-medium text-muted-foreground">Location</span><Input value={form.socialLinks.location || ""} onChange={(event) => setForm({ ...form, socialLinks: { ...form.socialLinks, location: event.target.value } })} placeholder="City, country" maxLength={120} className={inlineInputClass} /></label>
                <label className="block"><span className="text-[10px] font-medium text-muted-foreground">Public email</span><Input type="email" value={form.socialLinks.email || ""} onChange={(event) => setForm({ ...form, socialLinks: { ...form.socialLinks, email: event.target.value } })} placeholder="name@example.com" maxLength={254} className={inlineInputClass} /></label>
                {form.accountType === "business" && <label className="block"><span className="text-[10px] font-medium text-muted-foreground">Official website</span><Input type="url" value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} placeholder="organization.org" maxLength={500} className={inlineInputClass} /></label>}
              </div>
              <p className="mt-4 text-[10px] leading-relaxed text-muted-foreground">Only add contact details you want shown publicly. Legal organization name is stored for your account but is not displayed on the public profile.</p>
            </aside>

            <main className="min-w-0 p-4 sm:p-5 lg:p-6">
              <div className="mb-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Structured profile</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Add only the sections that strengthen your official profile. Certifications, licenses, awards and achievements are optional.</p>
              </div>
              <ProfileSectionsEditor
                sections={sections}
                kinds={activeKinds}
                onAdd={addSection}
                onChange={changeSection}
                onRemove={removeSection}
                onVisibilityChange={changeVisibility}
                onReorder={reorderSections}
              />
            </main>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
};

export default Dashboard;
