import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { ExternalLink, Eye, Globe, LinkIcon, Save, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import DashboardShell from "@/components/dashboard/DashboardShell";
import ProfileSectionsEditor from "@/components/profile/ProfileSectionsEditor";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import VerifiedBadge from "@/components/VerifiedBadge";
import { useToast } from "@/hooks/use-toast";
import {
  emptySectionData,
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
  theme_color: string | null;
  id_verified: boolean;
  updated_at: string;
}

const emptyForm: ProfileForm = {
  accountType: "creator",
  displayName: "",
  bio: "",
  category: "",
  website: "",
  socialLinks: {
    instagram: "",
    facebook: "",
    youtube: "",
    tiktok: "",
    twitter: "",
    linkedin: "",
  },
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<DashboardProfile | null>(null);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [sections, setSections] = useState<ProfileSection[]>([]);
  const [linkCount, setLinkCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [busySectionId, setBusySectionId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      setUser(session.user);
      const [{ data: currentProfile, error: profileError }, { data: currentSections }, { count }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, username, display_name, bio, category, account_type, avatar_url, website, social_links, theme_color, id_verified, updated_at")
          .eq("id", session.user.id)
          .maybeSingle(),
        supabase
          .from("profile_sections")
          .select("id, user_id, kind, position, data, is_public, created_at, updated_at")
          .eq("user_id", session.user.id)
          .order("position", { ascending: true }),
        supabase
          .from("bio_links")
          .select("id", { count: "exact", head: true })
          .eq("creator_id", session.user.id),
      ]);

      if (profileError || !currentProfile) {
        toast({
          title: "Could not load your profile",
          description: profileError?.message || "Please finish onboarding first.",
          variant: "destructive",
        });
        navigate("/onboarding");
        return;
      }

      const socials = (currentProfile.social_links || {}) as Record<string, string>;
      setProfile(currentProfile);
      setForm({
        accountType: currentProfile.account_type === "business" ? "business" : "creator",
        displayName: currentProfile.display_name || "",
        bio: currentProfile.bio || "",
        category: currentProfile.category || "",
        website: currentProfile.website || "",
        socialLinks: { ...emptyForm.socialLinks, ...socials },
      });
      setSections((currentSections || []).map((section) => ({
        ...section,
        kind: section.kind as ProfileSectionKind,
        data: (section.data || {}) as Record<string, string>,
      })));
      setLinkCount(count || 0);
      setLoading(false);
    };

    load();
  }, [navigate, toast]);

  const completion = useMemo(() => {
    const checks = [
      !!form.displayName.trim(),
      !!form.bio.trim(),
      !!profile?.avatar_url,
      linkCount > 0,
      sections.some((section) => Object.values(section.data || {}).some((value) => String(value).trim())),
      !!profile?.id_verified,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [form.bio, form.displayName, linkCount, profile?.avatar_url, profile?.id_verified, sections]);

  const saveProfile = async () => {
    if (!profile) return false;
    setSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        account_type: form.accountType,
        display_name: form.displayName.trim(),
        bio: form.bio.trim(),
        category: form.category.trim() || null,
        website: form.website.trim() || null,
        social_links: Object.fromEntries(
          Object.entries(form.socialLinks).filter(([, value]) => value.trim().length > 0),
        ),
      })
      .eq("id", profile.id);
    setSavingProfile(false);

    if (error) {
      toast({ title: "Profile not saved", description: error.message, variant: "destructive" });
      return false;
    }

    setProfile({
      ...profile,
      account_type: form.accountType,
      display_name: form.displayName.trim(),
      bio: form.bio.trim(),
      category: form.category.trim() || null,
      website: form.website.trim() || null,
      social_links: Object.fromEntries(
        Object.entries(form.socialLinks).filter(([, value]) => value.trim().length > 0),
      ),
    });
    toast({ title: "Profile published", description: "Your public page has been updated." });
    return true;
  };

  const addSection = async (kind: ProfileSectionKind) => {
    if (!profile) return;
    const { data, error } = await supabase
      .from("profile_sections")
      .insert({
        user_id: profile.id,
        kind,
        position: sections.length,
        data: emptySectionData(kind),
        is_public: true,
      })
      .select("id, user_id, kind, position, data, is_public, created_at, updated_at")
      .single();

    if (error || !data) {
      toast({ title: "Section not added", description: error?.message, variant: "destructive" });
      return;
    }

    setSections((current) => [...current, {
      ...data,
      kind: data.kind as ProfileSectionKind,
      data: (data.data || {}) as Record<string, string>,
    }]);
  };

  const changeSection = (id: string, key: string, value: string) => {
    setSections((current) => current.map((section) => (
      section.id === id ? { ...section, data: { ...section.data, [key]: value } } : section
    )));
  };

  const saveSection = async (section: ProfileSection) => {
    setBusySectionId(section.id);
    const { error } = await supabase
      .from("profile_sections")
      .update({ data: section.data, is_public: section.is_public })
      .eq("id", section.id)
      .eq("user_id", section.user_id);
    setBusySectionId(null);

    if (error) {
      toast({ title: "Section not saved", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Section saved" });
  };

  const changeVisibility = async (section: ProfileSection, isPublic: boolean) => {
    setSections((current) => current.map((item) => item.id === section.id ? { ...item, is_public: isPublic } : item));
    setBusySectionId(section.id);
    const { error } = await supabase
      .from("profile_sections")
      .update({ is_public: isPublic })
      .eq("id", section.id)
      .eq("user_id", section.user_id);
    setBusySectionId(null);
    if (error) {
      setSections((current) => current.map((item) => item.id === section.id ? { ...item, is_public: section.is_public } : item));
      toast({ title: "Visibility not changed", description: error.message, variant: "destructive" });
    }
  };

  const removeSection = async (section: ProfileSection) => {
    if (!window.confirm("Remove this section from your profile?")) return;
    setBusySectionId(section.id);
    const { error } = await supabase
      .from("profile_sections")
      .delete()
      .eq("id", section.id)
      .eq("user_id", section.user_id);
    setBusySectionId(null);
    if (error) {
      toast({ title: "Section not removed", description: error.message, variant: "destructive" });
      return;
    }
    setSections((current) => current.filter((item) => item.id !== section.id));
  };

  const moveSection = async (section: ProfileSection, direction: -1 | 1) => {
    const from = sections.findIndex((item) => item.id === section.id);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= sections.length) return;

    const reordered = [...sections];
    [reordered[from], reordered[to]] = [reordered[to], reordered[from]];
    const positioned = reordered.map((item, position) => ({ ...item, position }));
    setSections(positioned);
    setBusySectionId(section.id);
    const results = await Promise.all(positioned.map((item) => (
      supabase.from("profile_sections").update({ position: item.position }).eq("id", item.id).eq("user_id", item.user_id)
    )));
    setBusySectionId(null);
    const error = results.find((result) => result.error)?.error;
    if (error) {
      toast({ title: "Order not saved", description: error.message, variant: "destructive" });
    }
  };

  if (loading) {
    return <DashboardShell title="Profile"><div className="p-8 text-sm text-muted-foreground">Loading…</div></DashboardShell>;
  }

  const displayName = form.displayName || user?.user_metadata?.display_name || "Your profile";
  const profileUrl = `/${profile?.username || ""}`;
  const previewSocials = Object.entries(form.socialLinks).filter(([, value]) => value.trim());
  const publishFromPreview = async () => {
    const published = await saveProfile();
    if (published) setPreviewOpen(false);
  };

  return (
    <DashboardShell title="Profile">
      <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
        <Card className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar className="h-16 w-16">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt="" />}
              <AvatarFallback className="text-xl font-display font-bold">{displayName[0]?.toUpperCase() || "?"}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Your official profile</p>
              <h1 className="mt-1 flex items-center gap-2 text-2xl font-display font-bold">
                {displayName}
                {profile?.id_verified && <VerifiedBadge className="h-5 w-5" label={form.accountType === "business" ? "Account holder verified" : "Identity verified"} />}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">verifiedly.app/{profile?.username}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link to="/dashboard/links"><LinkIcon className="h-4 w-4" /> Links</Link>
              </Button>
              <Button asChild size="sm" className="gap-2">
                <a href={profileUrl} target="_blank" rel="noreferrer">View profile <ExternalLink className="h-4 w-4" /></a>
              </Button>
            </div>
          </div>
          <div className="mt-5">
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>Profile completeness</span><span>{completion}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-foreground transition-all" style={{ width: `${completion}%` }} />
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="font-display font-semibold text-lg">Profile header</h2>
            <p className="text-xs text-muted-foreground mt-1">Fill this out in the same order visitors will read it.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="account-type">This profile represents</Label>
              <select
                id="account-type"
                value={form.accountType}
                onChange={(event) => setForm({ ...form, accountType: event.target.value as ProfileForm["accountType"] })}
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="creator">Me</option>
                <option value="business">An organization</option>
              </select>
            </div>
            <div>
              <Label htmlFor="display-name">{form.accountType === "business" ? "Organization name" : "Display name"}</Label>
              <Input id="display-name" value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} maxLength={80} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="category">Professional label</Label>
              <Input id="category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Player, founder, club, organization…" maxLength={60} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="website">Official website</Label>
              <Input id="website" type="url" value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} placeholder="https://…" maxLength={500} className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="bio">One-line introduction</Label>
              <Textarea id="bio" value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} placeholder="A clear sentence about who you are or what your organization does." maxLength={180} className="mt-1 min-h-20" />
              <p className="mt-1 text-right text-[11px] text-muted-foreground">{form.bio.length}/180</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium">Official links</h3>
            <p className="text-xs text-muted-foreground mt-1">Use handles or full URLs. These links are not treated as identity verification.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {Object.entries(form.socialLinks).map(([platform, value]) => (
                <div key={platform}>
                  <Label htmlFor={`social-${platform}`} className="capitalize">{platform === "twitter" ? "X / Twitter" : platform}</Label>
                  <Input
                    id={`social-${platform}`}
                    value={value}
                    onChange={(event) => setForm({ ...form, socialLinks: { ...form.socialLinks, [platform]: event.target.value } })}
                    placeholder={`Your ${platform} handle or URL`}
                    maxLength={500}
                    className="mt-1"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard/settings">Change photo or theme</Link>
            </Button>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => setPreviewOpen(true)} className="gap-2">
                <Eye className="h-4 w-4" /> Preview
              </Button>
              <Button onClick={saveProfile} disabled={savingProfile} className="gap-2">
                <Save className="h-4 w-4" /> {savingProfile ? "Publishing…" : "Publish now"}
              </Button>
            </div>
          </div>
        </Card>


        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Preview your public profile</DialogTitle>
              <DialogDescription>
                This is a draft preview of the header details you entered. Publish when it looks right to make it live on Verifiedly.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-2xl border bg-neutral-50 p-4 text-neutral-950 sm:p-6">
              <div className="rounded-xl border bg-white p-5 text-center shadow-sm">
                <Avatar className="mx-auto h-20 w-20 ring-4 ring-neutral-200">
                  {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={displayName} />}
                  <AvatarFallback className="text-2xl font-display font-bold">{displayName[0]?.toUpperCase() || "?"}</AvatarFallback>
                </Avatar>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <h3 className="text-2xl font-display font-bold">{displayName}</h3>
                  {profile?.id_verified && <VerifiedBadge className="h-5 w-5" label={form.accountType === "business" ? "Account holder verified" : "Identity verified"} />}
                </div>
                <p className="mt-1 text-sm text-neutral-500">@{profile?.username}</p>
                {(form.category || form.accountType === "business") && (
                  <p className="mt-3 text-sm font-medium text-neutral-600">{form.category || "Organization"}</p>
                )}
                {form.bio && <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed">{form.bio}</p>}
                {(previewSocials.length > 0 || form.website.trim()) && (
                  <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs text-neutral-600">
                    {previewSocials.map(([platform]) => (
                      <span key={platform} className="rounded-full border px-3 py-1 capitalize">{platform === "twitter" ? "X / Twitter" : platform}</span>
                    ))}
                    {form.website.trim() && <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1"><Globe className="h-3 w-3" /> Website</span>}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPreviewOpen(false)}>Keep editing</Button>
              <Button type="button" onClick={publishFromPreview} disabled={savingProfile} className="gap-2">
                <Save className="h-4 w-4" /> {savingProfile ? "Publishing…" : "Publish to live profile"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ProfileSectionsEditor
          sections={sections}
          busyId={busySectionId}
          onAdd={addSection}
          onChange={changeSection}
          onSave={saveSection}
          onRemove={removeSection}
          onVisibilityChange={changeVisibility}
          onMove={moveSection}
        />

        <Card className="p-4 bg-secondary">
          <div className="flex gap-3 text-sm">
            <ShieldCheck className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium">Clear verification, without confusing scores.</p>
              <p className="text-xs text-muted-foreground mt-1">
                The Verified badge represents the profile holder's identity check. Work, education, credentials, and accomplishments are supplied by the profile owner unless an official supporting link says otherwise.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
};

export default Dashboard;
