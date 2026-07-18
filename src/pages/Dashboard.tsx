import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Camera, ExternalLink, Eye, EyeOff, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import DashboardShell from "@/components/dashboard/DashboardShell";
import ProfileSectionsEditor from "@/components/profile/ProfileSectionsEditor";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import VerifiedBadge from "@/components/VerifiedBadge";
import { useToast } from "@/hooks/use-toast";
import {
  emptySectionData,
  hasVisibleSectionData,
  safeExternalUrl,
  PROFILE_SECTION_KINDS,
  type ProfileSection,
  type ProfileSectionKind,
} from "@/lib/profile-sections";

interface ProfileForm {
  accountType: "creator" | "business";
  displayName: string;
  bio: string;
  category: string;
  website: string;
  socialLinks: Record<string, string>;
}

interface DashboardProfile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  category: string | null;
  account_type: string | null;
  avatar_url: string | null;
  website: string | null;
  social_links: unknown;
  id_verified: boolean;
}

interface EditableLink {
  id: string;
  title: string;
  url: string;
  is_active: boolean;
  sort_order: number;
}

const SOCIAL_FIELDS = [
  ["email", "Public email", "name@example.com"],
  ["instagram", "Instagram", "Handle or profile URL"],
  ["linkedin", "LinkedIn", "Handle or profile URL"],
  ["youtube", "YouTube", "Handle or channel URL"],
  ["tiktok", "TikTok", "Handle or profile URL"],
  ["facebook", "Facebook", "Handle or page URL"],
  ["twitter", "X / Twitter", "Handle or profile URL"],
] as const;

const emptyForm: ProfileForm = {
  accountType: "creator",
  displayName: "",
  bio: "",
  category: "",
  website: "",
  socialLinks: Object.fromEntries(SOCIAL_FIELDS.map(([key]) => [key, ""])),
};

const draftSection = (userId: string, kind: ProfileSectionKind, position: number): ProfileSection => ({
  id: `draft-${kind}-${crypto.randomUUID()}`,
  user_id: userId,
  kind,
  position,
  data: emptySectionData(kind),
  is_public: true,
});

const ensureFixedSections = (userId: string, sections: ProfileSection[]) => {
  const next = [...sections];
  PROFILE_SECTION_KINDS.forEach((kind) => {
    if (!next.some((section) => section.kind === kind)) {
      next.push(draftSection(userId, kind, next.length));
    }
  });
  return next;
};

const draftLink = (position: number): EditableLink => ({
  id: `draft-link-${crypto.randomUUID()}`,
  title: "",
  url: "",
  is_active: true,
  sort_order: position,
});

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<DashboardProfile | null>(null);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [sections, setSections] = useState<ProfileSection[]>([]);
  const [links, setLinks] = useState<EditableLink[]>([]);
  const [deletedSectionIds, setDeletedSectionIds] = useState<string[]>([]);
  const [deletedLinkIds, setDeletedLinkIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      const [{ data: currentProfile, error: profileError }, { data: currentSections }, { data: currentLinks }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, username, display_name, bio, category, account_type, avatar_url, website, social_links, id_verified")
          .eq("id", session.user.id)
          .maybeSingle(),
        supabase
          .from("profile_sections")
          .select("id, user_id, kind, position, data, is_public, created_at, updated_at")
          .eq("user_id", session.user.id)
          .order("position", { ascending: true }),
        supabase
          .from("bio_links")
          .select("id, title, url, is_active, sort_order")
          .eq("creator_id", session.user.id)
          .order("sort_order", { ascending: true }),
      ]);

      if (profileError || !currentProfile) {
        toast({ title: "Could not load your profile", description: profileError?.message || "Please finish onboarding first.", variant: "destructive" });
        navigate("/onboarding");
        return;
      }

      const socials = (currentProfile.social_links || {}) as Record<string, string>;
      const loadedSections = (currentSections || []).map((section) => ({
        ...section,
        kind: section.kind as ProfileSectionKind,
        data: (section.data || {}) as Record<string, string>,
      }));
      const loadedLinks = (currentLinks || []) as EditableLink[];

      setProfile(currentProfile);
      setForm({
        accountType: currentProfile.account_type === "business" ? "business" : "creator",
        displayName: currentProfile.display_name || "",
        bio: currentProfile.bio || "",
        category: currentProfile.category || "",
        website: currentProfile.website || "",
        socialLinks: { ...emptyForm.socialLinks, ...socials },
      });
      setSections(ensureFixedSections(currentProfile.id, loadedSections));
      setLinks(loadedLinks.length ? loadedLinks : [draftLink(0)]);
      setLoading(false);
    };

    void load();
  }, [navigate, toast]);

  const addSection = (kind: ProfileSectionKind) => {
    if (!profile) return;
    setSections((current) => [...current, draftSection(profile.id, kind, current.length)]);
  };

  const changeSection = (id: string, key: string, value: string) => {
    setSections((current) => current.map((section) => (
      section.id === id ? { ...section, data: { ...section.data, [key]: value } } : section
    )));
  };

  const removeSection = (section: ProfileSection) => {
    if (!profile) return;
    if (!section.id.startsWith("draft-")) setDeletedSectionIds((current) => [...current, section.id]);
    const remaining = sections.filter((item) => item.id !== section.id);
    setSections(ensureFixedSections(profile.id, remaining));
  };

  const changeVisibility = (section: ProfileSection, isPublic: boolean) => {
    setSections((current) => current.map((item) => item.id === section.id ? { ...item, is_public: isPublic } : item));
  };

  const changeLink = (id: string, patch: Partial<EditableLink>) => {
    setLinks((current) => current.map((link) => link.id === id ? { ...link, ...patch } : link));
  };

  const removeLink = (link: EditableLink) => {
    if (!link.id.startsWith("draft-link-")) setDeletedLinkIds((current) => [...current, link.id]);
    const remaining = links.filter((item) => item.id !== link.id);
    setLinks(remaining.length ? remaining : [draftLink(0)]);
  };

  const save = async () => {
    if (!profile) return;
    if (!form.displayName.trim()) {
      toast({ title: "Add a display name", variant: "destructive" });
      return;
    }

    const normalizedWebsite = form.website.trim() ? safeExternalUrl(form.website.trim()) : null;
    if (form.website.trim() && !normalizedWebsite) {
      toast({ title: "Enter a valid website", variant: "destructive" });
      return;
    }
    const publicEmail = form.socialLinks.email?.trim();
    if (publicEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(publicEmail)) {
      toast({ title: "Enter a valid public email", variant: "destructive" });
      return;
    }

    const completedLinks = links.filter((link) => link.title.trim() || link.url.trim());
    for (const link of completedLinks) {
      if (!link.title.trim() || !link.url.trim() || !safeExternalUrl(link.url.trim())) {
        toast({ title: "Finish each link", description: "Every link needs a label and valid web address.", variant: "destructive" });
        return;
      }
    }

    setSaving(true);
    try {
      const cleanSocials = Object.fromEntries(
        Object.entries(form.socialLinks).filter(([, value]) => value.trim().length > 0).map(([key, value]) => [key, value.trim()]),
      );
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          account_type: form.accountType,
          display_name: form.displayName.trim(),
          bio: form.bio.trim() || null,
          category: form.category.trim() || null,
          website: normalizedWebsite,
          social_links: cleanSocials,
        })
        .eq("id", profile.id);
      if (profileError) throw profileError;

      const emptyExistingSectionIds = sections
        .filter((section) => !section.id.startsWith("draft-") && !hasVisibleSectionData(section))
        .map((section) => section.id);
      const sectionIdsToDelete = [...new Set([...deletedSectionIds, ...emptyExistingSectionIds])];
      if (sectionIdsToDelete.length) {
        const { error } = await supabase.from("profile_sections").delete().in("id", sectionIdsToDelete).eq("user_id", profile.id);
        if (error) throw error;
      }

      const savedSections: ProfileSection[] = [];
      let position = 0;
      for (const kind of PROFILE_SECTION_KINDS) {
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

      const emptyExistingLinkIds = links
        .filter((link) => !link.id.startsWith("draft-link-") && !link.title.trim() && !link.url.trim())
        .map((link) => link.id);
      const linkIdsToDelete = [...new Set([...deletedLinkIds, ...emptyExistingLinkIds])];
      if (linkIdsToDelete.length) {
        const { error } = await supabase.from("bio_links").delete().in("id", linkIdsToDelete).eq("creator_id", profile.id);
        if (error) throw error;
      }

      const savedLinks: EditableLink[] = [];
      for (const [index, link] of completedLinks.entries()) {
        const url = safeExternalUrl(link.url.trim())!;
        const payload = { title: link.title.trim(), url, is_active: link.is_active, sort_order: index, icon: null };
        if (link.id.startsWith("draft-link-")) {
          const { data, error } = await supabase
            .from("bio_links")
            .insert({ creator_id: profile.id, ...payload })
            .select("id, title, url, is_active, sort_order")
            .single();
          if (error || !data) throw error || new Error("Link was not saved");
          savedLinks.push(data as EditableLink);
        } else {
          const { error } = await supabase.from("bio_links").update(payload).eq("id", link.id).eq("creator_id", profile.id);
          if (error) throw error;
          savedLinks.push({ ...link, ...payload });
        }
      }

      setProfile({
        ...profile,
        account_type: form.accountType,
        display_name: form.displayName.trim(),
        bio: form.bio.trim() || null,
        category: form.category.trim() || null,
        website: normalizedWebsite,
        social_links: cleanSocials,
      });
      setSections(ensureFixedSections(profile.id, savedSections));
      setLinks(savedLinks.length ? savedLinks : [draftLink(0)]);
      setDeletedSectionIds([]);
      setDeletedLinkIds([]);
      toast({ title: "Profile saved" });
    } catch (error: unknown) {
      toast({ title: "Profile not saved", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <DashboardShell title="Edit profile"><div className="p-8 text-sm text-muted-foreground">Loading…</div></DashboardShell>;
  }

  const displayName = form.displayName || "Your name";

  return (
    <DashboardShell title="Edit profile">
      <div className="mx-auto max-w-3xl px-3 py-4 sm:px-5 sm:py-6">
        <div className="sticky top-14 z-20 -mx-3 mb-4 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-3 py-3 backdrop-blur sm:-mx-5 sm:px-5">
          <div className="min-w-0">
            <h1 className="text-sm font-semibold">Edit profile</h1>
            <p className="truncate text-xs text-muted-foreground">Changes appear at verifiedly.app/{profile?.username}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="h-9 gap-1.5">
              <a href={`/${profile?.username}`} target="_blank" rel="noreferrer">Preview <ExternalLink className="h-3.5 w-3.5" /></a>
            </Button>
            <Button onClick={save} disabled={saving} size="sm" className="h-9 rounded-full px-5">
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden rounded-2xl border-border/80 shadow-sm">
          <div className="flex items-center justify-center gap-1 border-b border-border/70 bg-muted/35 p-2">
            <button
              type="button"
              onClick={() => setForm({ ...form, accountType: "creator" })}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${form.accountType === "creator" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Individual
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, accountType: "business" })}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${form.accountType === "business" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Organization
            </button>
          </div>

          <div className="px-4 py-7 text-center sm:px-8 sm:py-9">
            <div className="relative mx-auto w-fit">
              <Avatar className="h-20 w-20 bg-muted sm:h-24 sm:w-24">
                {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt="" className="object-cover" />}
                <AvatarFallback className="text-2xl font-display font-bold">{displayName[0]?.toUpperCase() || "?"}</AvatarFallback>
              </Avatar>
              <Button asChild variant="secondary" size="icon" className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full border border-background shadow-sm">
                <Link to="/dashboard/settings" aria-label="Change profile photo"><Camera className="h-3.5 w-3.5" /></Link>
              </Button>
            </div>

            <div className="mx-auto mt-5 max-w-xl">
              <div className="flex items-center justify-center gap-2">
                <Input
                  aria-label={form.accountType === "business" ? "Organization name" : "Display name"}
                  value={form.displayName}
                  onChange={(event) => setForm({ ...form, displayName: event.target.value })}
                  placeholder={form.accountType === "business" ? "Organization name" : "Your name"}
                  maxLength={80}
                  className="h-auto max-w-md border-0 bg-transparent p-0 text-center font-display text-2xl font-bold tracking-tight shadow-none placeholder:text-muted-foreground/45 focus-visible:ring-0 sm:text-3xl"
                />
                {profile?.id_verified && <VerifiedBadge className="h-5 w-5 shrink-0" label={form.accountType === "business" ? "Account holder verified" : "Identity verified"} />}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">@{profile?.username}</p>
              <Input
                aria-label="Professional label"
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
                placeholder="Professional label"
                maxLength={60}
                className="mx-auto mt-3 h-8 max-w-sm border-0 bg-transparent p-0 text-center text-sm font-medium shadow-none placeholder:text-muted-foreground/45 focus-visible:ring-0"
              />
              <Textarea
                aria-label="Short introduction"
                value={form.bio}
                onChange={(event) => setForm({ ...form, bio: event.target.value })}
                placeholder="A short introduction about who you are and what you do."
                maxLength={180}
                className="mx-auto mt-3 min-h-16 max-w-xl resize-none border-0 bg-transparent p-0 text-center text-sm leading-relaxed shadow-none placeholder:text-muted-foreground/45 focus-visible:ring-0 sm:text-base"
              />
            </div>
          </div>

          <div className="border-t border-border/70 px-4 py-6 sm:px-8">
            <h2 className="text-base font-display font-semibold">Contact & social</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Only add contact details you want displayed publicly.</p>
            <div className="mt-4 grid gap-x-5 gap-y-3 sm:grid-cols-2">
              <label>
                <span className="text-[11px] font-medium text-muted-foreground">Website</span>
                <Input
                  type="url"
                  value={form.website}
                  onChange={(event) => setForm({ ...form, website: event.target.value })}
                  placeholder="https://yourwebsite.com"
                  maxLength={500}
                  className="mt-0.5 h-9 rounded-none border-0 border-b bg-transparent px-0 shadow-none focus-visible:ring-0"
                />
              </label>
              {SOCIAL_FIELDS.map(([key, label, placeholder]) => (
                <label key={key}>
                  <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
                  <Input
                    type={key === "email" ? "email" : "text"}
                    value={form.socialLinks[key] || ""}
                    onChange={(event) => setForm({ ...form, socialLinks: { ...form.socialLinks, [key]: event.target.value } })}
                    placeholder={placeholder}
                    maxLength={500}
                    className="mt-0.5 h-9 rounded-none border-0 border-b bg-transparent px-0 shadow-none focus-visible:ring-0"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="border-t border-border/70 px-4 py-6 sm:px-8">
            <ProfileSectionsEditor
              sections={sections}
              onAdd={addSection}
              onChange={changeSection}
              onRemove={removeSection}
              onVisibilityChange={changeVisibility}
            />
          </div>

          <section id="links" className="border-t border-border/70 px-4 py-6 sm:px-8">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-display font-semibold">Links</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Add the most useful places for people to go next.</p>
              </div>
              <Button type="button" variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-xs" onClick={() => setLinks((current) => [...current, draftLink(current.length)])}>
                <Plus className="h-3.5 w-3.5" /> Add link
              </Button>
            </div>
            <div className="space-y-3">
              {links.map((link, index) => (
                <div key={link.id} className="flex items-start gap-2 rounded-xl border border-border/80 p-3">
                  <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
                    <Input
                      aria-label={`Link ${index + 1} label`}
                      value={link.title}
                      onChange={(event) => changeLink(link.id, { title: event.target.value })}
                      placeholder="Link label"
                      maxLength={80}
                      className="h-9 border-0 border-b bg-transparent px-0 font-medium shadow-none focus-visible:ring-0"
                    />
                    <Input
                      aria-label={`Link ${index + 1} web address`}
                      type="url"
                      value={link.url}
                      onChange={(event) => changeLink(link.id, { url: event.target.value })}
                      placeholder="https://example.com"
                      maxLength={500}
                      className="h-9 border-0 border-b bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => changeLink(link.id, { is_active: !link.is_active })}
                    className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    aria-label={link.is_active ? "Hide link" : "Show link"}
                  >
                    {link.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeLink(link)}
                    className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Remove link"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </Card>

        <div className="mt-4 flex gap-3 rounded-xl border border-border/70 bg-muted/25 p-4 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
          <p>Profile information is supplied by the profile owner. A future Verified badge will only describe the specific check shown by Verifiedly.</p>
        </div>
      </div>
    </DashboardShell>
  );
};

export default Dashboard;
