import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { arrayMove } from "@dnd-kit/sortable";
import {
  Camera,
  Check,
  Copy,
  ExternalLink,
  ImagePlus,
  Palette,
  Share2,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
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
  getProfileTheme,
  normalizeProfileTheme,
  PROFILE_THEME_OPTIONS,
  type ProfileTheme,
} from "@/lib/profile-appearance";
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
  bannerUrl: string;
  profileTheme: ProfileTheme;
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
  ["linkedin", "LinkedIn", "Handle or profile URL"],
  ["instagram", "Instagram", "Handle or profile URL"],
  ["youtube", "YouTube", "Handle or channel URL"],
  ["tiktok", "TikTok", "Handle or profile URL"],
  ["facebook", "Facebook", "Handle or page URL"],
  ["twitter", "X", "Handle or profile URL"],
] as const;

const ALLOWED_SOCIAL_KEYS = new Set([
  "location",
  "email",
  "phone",
  "website",
  "banner_url",
  "profile_theme",
  ...SOCIAL_FIELDS.map(([key]) => key),
]);
const emptySocialLinks = Object.fromEntries([["location", ""], ["email", ""], ["phone", ""], ["website", ""], ...SOCIAL_FIELDS.map(([key]) => [key, ""])]);
const emptyForm: ProfileForm = {
  accountType: "creator",
  displayName: "",
  category: "",
  website: "",
  organizationLegalName: "",
  organizationIndustry: "",
  organizationCountry: "",
  bannerUrl: "",
  profileTheme: "classic",
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
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<DashboardProfile | null>(null);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [sections, setSections] = useState<ProfileSection[]>([]);
  const [deletedSectionIds, setDeletedSectionIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [profileLinkCopied, setProfileLinkCopied] = useState(false);

  const activeKinds = useMemo(() => profileSectionKindsForAccountType(form.accountType), [form.accountType]);
  const selectedTheme = useMemo(() => getProfileTheme(form.profileTheme), [form.profileTheme]);

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
        bannerUrl: String(socials.banner_url || ""),
        profileTheme: normalizeProfileTheme(socials.profile_theme),
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

  const uploadBanner = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !profile) return;
    if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type)) {
      toast({ title: "Choose a JPG, PNG or WebP image", variant: "destructive" });
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast({ title: "Banner is too large", description: "Use an image smaller than 4 MB.", variant: "destructive" });
      return;
    }

    setUploadingBanner(true);
    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${profile.id}/banner.${extension}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, {
      upsert: true,
      contentType: file.type,
      cacheControl: "3600",
    });
    setUploadingBanner(false);
    if (uploadError) {
      toast({ title: "Banner not uploaded", description: uploadError.message, variant: "destructive" });
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    setForm((current) => ({ ...current, bannerUrl: `${publicUrl}?v=${Date.now()}` }));
    toast({ title: "Banner ready", description: "Review the preview, then save your profile." });
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
      const appearanceAndSocials = {
        ...form.socialLinks,
        banner_url: form.bannerUrl.trim(),
        profile_theme: form.profileTheme,
      };
      const cleanSocials = Object.fromEntries(
        Object.entries(appearanceAndSocials)
          .filter(([key, value]) => ALLOWED_SOCIAL_KEYS.has(key) && String(value).trim().length > 0)
          .map(([key, value]) => [key, String(value).trim()]),
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
        <div className="-mx-3 mb-3 grid min-h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-border bg-background/95 px-3 py-2 sm:-mx-5 sm:px-5">
          <div className="flex min-w-0 items-center gap-1">
            <p className="min-w-0 truncate text-xs text-muted-foreground">verifiedly.app/{profile?.username}</p>
            <Tooltip open={profileLinkCopied ? true : undefined}>
              <TooltipTrigger asChild>
                <Button type="button" onClick={() => void copyProfileLink()} variant="ghost" size="sm" className="h-7 w-7 shrink-0 rounded-full p-0 sm:w-auto sm:gap-1 sm:px-2" aria-label="Copy profile link">
                  {profileLinkCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span className="hidden lg:inline">{profileLinkCopied ? "Copied!" : "Copy link"}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs"><p>{profileLinkCopied ? "Copied!" : "Copy link"}</p></TooltipContent>
            </Tooltip>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button type="button" onClick={() => void shareProfile()} variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0 sm:w-auto sm:gap-1.5 sm:px-3" aria-label="Share profile"><Share2 className="h-3.5 w-3.5" /><span className="hidden lg:inline">Share</span></Button>
            <Button asChild variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0 sm:w-auto sm:gap-1.5 sm:px-3"><Link to={`/${profile?.username}`} target="_blank" aria-label="Preview profile"><span className="hidden lg:inline">Preview</span><ExternalLink className="h-3.5 w-3.5" /></Link></Button>
            <Button onClick={() => void save()} disabled={saving} size="sm" className="h-8 rounded-full px-3 text-xs sm:px-5">{saving ? "Saving…" : "Save"}</Button>
          </div>
        </div>

        <Card className="overflow-visible rounded-3xl border-border/80 shadow-sm">
          <div className="flex min-h-16 items-center justify-between gap-3 rounded-t-3xl border-b border-border/70 bg-background/95 px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold">{profileTypeLabel}</p>
              <p className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">Profile type controls which structured sections are available.</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="h-8 shrink-0 gap-1.5 rounded-full px-2.5 text-xs sm:px-3"><Link to="/dashboard/settings"><SlidersHorizontal className="h-3.5 w-3.5" /><span className="hidden sm:inline">Change type</span><span className="sm:hidden">Type</span></Link></Button>
          </div>

          <section className="border-b border-border/70">
            <div className={`relative h-28 overflow-hidden sm:h-36 ${selectedTheme.hero}`}>
              {form.bannerUrl && <img src={form.bannerUrl} alt="Profile banner preview" className="absolute inset-0 h-full w-full object-cover" />}
              <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/20" />
              <div className="absolute right-2 top-2 flex max-w-[calc(100%-16px)] flex-wrap justify-end gap-1.5 sm:right-3 sm:top-3">
                <Button type="button" variant="secondary" size="sm" onClick={() => bannerFileInputRef.current?.click()} disabled={uploadingBanner} className="h-8 gap-1.5 rounded-full bg-white/90 px-3 text-[11px] text-neutral-950 shadow-sm hover:bg-white">
                  <ImagePlus className="h-3.5 w-3.5" />{uploadingBanner ? "Uploading…" : form.bannerUrl ? "Replace banner" : "Add banner"}
                </Button>
                {form.bannerUrl && (
                  <Button type="button" variant="secondary" size="icon" onClick={() => setForm({ ...form, bannerUrl: "" })} className="h-8 w-8 rounded-full bg-white/90 text-neutral-950 shadow-sm hover:bg-white" aria-label="Remove banner"><Trash2 className="h-3.5 w-3.5" /></Button>
                )}
              </div>
              <input ref={bannerFileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadBanner} className="hidden" />
            </div>

            <div className="relative px-4 pb-5 text-center sm:px-6 sm:pb-6">
              <div className="relative mx-auto -mt-10 w-fit sm:-mt-12">
                <Avatar className={`h-20 w-20 border-4 bg-muted shadow-sm sm:h-24 sm:w-24 ${selectedTheme.avatarRing}`}>
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

              <div className="mx-auto mt-4 flex max-w-lg flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"><Palette className="h-3.5 w-3.5" />Profile theme</div>
                <div className="flex flex-wrap items-center justify-center gap-2" aria-label="Profile theme choices">
                  {PROFILE_THEME_OPTIONS.map((option) => (
                    <Tooltip key={option.value}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, profileTheme: option.value })}
                          className={`h-8 w-8 rounded-full border-2 p-0.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 ${form.profileTheme === option.value ? "scale-110 border-foreground" : "border-background shadow-sm hover:scale-105"}`}
                          aria-label={`Use ${option.label} theme`}
                          aria-pressed={form.profileTheme === option.value}
                        >
                          <span className={`block h-full w-full rounded-full ${option.swatch}`} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs"><p>{option.label}</p></TooltipContent>
                    </Tooltip>
                  ))}
                </div>
                <p className="text-[10px] leading-relaxed text-muted-foreground">Banner images are optional. Curated themes keep every profile readable and recognizably Verifiedly.</p>
              </div>
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
                <label className="block"><span className="text-[10px] font-medium text-muted-foreground">Public phone</span><Input type="tel" value={form.socialLinks.phone || ""} onChange={(event) => setForm({ ...form, socialLinks: { ...form.socialLinks, phone: event.target.value } })} placeholder="+1 555 000 0000" maxLength={24} className={inlineInputClass} /></label>
                {form.accountType !== "business" && <label className="block"><span className="text-[10px] font-medium text-muted-foreground">Website</span><Input type="url" value={form.socialLinks.website || ""} onChange={(event) => setForm({ ...form, socialLinks: { ...form.socialLinks, website: event.target.value } })} placeholder="yoursite.com" maxLength={500} className={inlineInputClass} /></label>}
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
