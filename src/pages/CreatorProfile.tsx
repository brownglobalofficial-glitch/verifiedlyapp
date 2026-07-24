import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { BriefcaseBusiness, Check, ExternalLink, FileBadge, Globe, GraduationCap, Mail, MapPin, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import SocialIcon from "@/components/SocialIcon";
import VerifiedBadge from "@/components/VerifiedBadge";
import logoMark from "@/assets/verifiedly-v-mark.png";
import {
  hasVisibleSectionData,
  isProfileEditorSectionKind,
  PROFILE_EDITOR_SECTION_KINDS,
  PROFILE_SECTION_DEFINITIONS,
  safeExternalUrl,
  type ProfileSection,
  type ProfileSectionKind,
} from "@/lib/profile-sections";

const PUBLIC_PROFILE_FIELDS = "id, username, display_name, category, account_type, avatar_url, website, social_links, id_verified, verified_at, updated_at, organization_industry, organization_country";

interface PublicProfile {
  id: string;
  username: string;
  display_name: string | null;
  category: string | null;
  account_type: string | null;
  avatar_url: string | null;
  website: string | null;
  social_links: unknown;
  id_verified: boolean;
  verified_at: string | null;
  updated_at: string;
  organization_industry: string | null;
  organization_country: string | null;
}

const PUBLIC_SOCIAL_KEYS = new Set(["instagram", "youtube", "tiktok", "facebook", "twitter", "x"]);
const SECTION_ICONS: Partial<Record<ProfileSectionKind, typeof BriefcaseBusiness>> = {
  work: BriefcaseBusiness,
  education: GraduationCap,
  credential: FileBadge,
};

const sectionHeading = (section: ProfileSection) => {
  const data = section.data || {};
  if (section.kind === "work") return data.role || data.organization || "Work";
  if (section.kind === "education") return data.program || data.school || "Education";
  if (section.kind === "credential") return data.name || "License or certification";
  return "Profile detail";
};

const sectionMeta = (section: ProfileSection) => {
  const data = section.data || {};
  const dateRange = [data.start || data.issued, data.end || data.expires].filter(Boolean).join(" – ");
  if (section.kind === "work") return [data.organization, dateRange].filter(Boolean).join(" · ");
  if (section.kind === "education") return [data.school, dateRange].filter(Boolean).join(" · ");
  if (section.kind === "credential") return [data.issuer, dateRange].filter(Boolean).join(" · ");
  return "";
};

const socialUrl = (platform: string, value: string) => {
  if (value.startsWith("http://") || value.startsWith("https://")) return safeExternalUrl(value);
  const handle = value.trim().replace(/^@/, "").replace(/^\/+|\/+$/g, "");
  if (!handle) return null;
  const bases: Record<string, string> = {
    instagram: "https://instagram.com/",
    facebook: "https://facebook.com/",
    youtube: "https://youtube.com/@",
    tiktok: "https://tiktok.com/@",
    twitter: "https://x.com/",
    x: "https://x.com/",
  };
  return bases[platform] ? safeExternalUrl(`${bases[platform]}${handle}`) : null;
};

const CreatorProfile = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [sections, setSections] = useState<ProfileSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [viewerUserId, setViewerUserId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setViewerUserId(data.session?.user.id ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setViewerUserId(session?.user.id ?? null);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!username) return;
    const load = async () => {
      setLoading(true);
      const { data: currentProfile, error } = await supabase
        .from("profiles")
        .select(PUBLIC_PROFILE_FIELDS)
        .eq("username", username.toLowerCase())
        .maybeSingle();

      if (error || !currentProfile) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const { data: currentSections } = await supabase
        .from("profile_sections")
        .select("id, user_id, kind, position, data, is_public, created_at, updated_at")
        .eq("user_id", currentProfile.id)
        .eq("is_public", true)
        .order("position", { ascending: true });

      setProfile(currentProfile as PublicProfile);
      setSections(
        (currentSections || [])
          .map((section) => ({
            ...section,
            kind: section.kind as ProfileSectionKind,
            data: (section.data || {}) as Record<string, string>,
          }))
          .filter((section) => isProfileEditorSectionKind(section.kind) && hasVisibleSectionData(section)),
      );
      setNotFound(false);
      setLoading(false);
      void supabase.from("page_views").insert({ creator_id: currentProfile.id });
    };

    void load();
  }, [username]);

  const socialValues = useMemo(() => (profile?.social_links || {}) as Record<string, string>, [profile?.social_links]);
  const socials = useMemo(
    () => Object.entries(socialValues)
      .filter(([platform]) => PUBLIC_SOCIAL_KEYS.has(platform))
      .map(([platform, value]) => ({ platform, url: socialUrl(platform, String(value)) }))
      .filter((item): item is { platform: string; url: string } => Boolean(item.url)),
    [socialValues],
  );
  const publicEmail = useMemo(() => {
    const value = String(socialValues.email || "").trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : null;
  }, [socialValues]);
  const location = String(socialValues.location || "").trim() || null;

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 px-4 py-12">
        <div className="mx-auto max-w-4xl space-y-4">
          <Skeleton className="h-56 rounded-3xl" />
          <Skeleton className="h-72 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <img src={logoMark} alt="Verifiedly" className="h-10 w-10 object-contain" />
        <h1 className="font-display text-2xl font-bold">Profile not found</h1>
        <p className="text-sm text-muted-foreground">This Verifiedly handle does not exist.</p>
        <Button asChild variant="outline"><Link to="/">Go to Verifiedly</Link></Button>
      </div>
    );
  }

  const displayName = profile.display_name || profile.username;
  const isOrganization = profile.account_type === "business";
  const website = isOrganization ? safeExternalUrl(profile.website) : null;
  const description = profile.category ? `${displayName} · ${profile.category}` : `Official Verifiedly profile for ${displayName}.`;
  const profileUrl = `https://verifiedly.app/${profile.username}`;
  const shareImage = profile.avatar_url || new URL(logoMark, window.location.origin).href;
  const isOwner = viewerUserId === profile.id;
  const hasContact = Boolean(location || publicEmail || website || (isOrganization && (profile.organization_industry || profile.organization_country)));

  const shareProfile = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: `${displayName} on Verifiedly`, text: description, url: profileUrl });
      } else {
        await navigator.clipboard.writeText(profileUrl);
        setLinkCopied(true);
        window.setTimeout(() => setLinkCopied(false), 1800);
      }
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950">
      <Helmet>
        <title>{displayName} (@{profile.username}) · Verifiedly</title>
        <meta name="description" content={description.slice(0, 160)} />
        <link rel="canonical" href={profileUrl} />
        <meta property="og:type" content="profile" />
        <meta property="og:title" content={`${displayName} on Verifiedly`} />
        <meta property="og:description" content={description.slice(0, 200)} />
        <meta property="og:url" content={profileUrl} />
        <meta property="og:image" content={shareImage} />
        <meta name="twitter:card" content="summary" />
      </Helmet>

      <header className="border-b border-neutral-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-3 py-2.5 sm:px-4">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold">
            <img src={logoMark} alt="" className="h-6 w-6 object-contain" />
            Verifiedly
          </Link>
          <div className="flex items-center gap-1.5">
            <Button type="button" onClick={() => void shareProfile()} size="sm" variant="ghost" className="h-8 gap-1.5 rounded-full px-3 text-xs">
              {linkCopied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
              {linkCopied ? "Copied" : "Share"}
            </Button>
            <Button asChild size="sm" variant="outline" className="h-8 rounded-full border-neutral-200 bg-white px-3 text-xs">
              <Link to={isOwner ? "/dashboard" : "/signup"}>{isOwner ? "Edit profile" : "Create yours"}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-3 py-4 sm:px-4 sm:py-6">
        <Card className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
          <section className="border-b border-neutral-200 bg-neutral-100/80 px-4 py-5 text-center sm:px-6">
            <Avatar className="mx-auto h-20 w-20 border-2 border-neutral-200 bg-white shadow-sm sm:h-24 sm:w-24">
              {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={displayName} className="object-cover" />}
              <AvatarFallback className="font-display text-2xl font-bold">{displayName[0]?.toUpperCase() || "?"}</AvatarFallback>
            </Avatar>
            <div className="mt-3 flex items-center justify-center gap-1.5">
              <h1 className="break-words text-center font-display text-2xl font-bold tracking-tight sm:text-3xl">{displayName}</h1>
              {profile.id_verified && <VerifiedBadge className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" label="Identity verified" />}
            </div>
            {profile.category && <p className="mt-1 text-sm font-medium">{profile.category}</p>}
            <p className="mt-0.5 text-xs text-neutral-500">@{profile.username}</p>
            {location && <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-neutral-500"><MapPin className="h-3.5 w-3.5" />{location}</p>}
            {!!socials.length && (
              <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
                {socials.map(({ platform, url }) => (
                  <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white transition hover:-translate-y-0.5" aria-label={platform}>
                    <SocialIcon platform={platform} className="h-3.5 w-3.5" />
                  </a>
                ))}
              </div>
            )}
          </section>

          <div className="grid md:grid-cols-[minmax(190px,0.75fr)_minmax(0,2fr)]">
            <aside className="border-b border-neutral-200 p-4 md:border-b-0 md:border-r">
              <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Official information</h2>
              <div className="space-y-2.5 text-xs">
                {publicEmail && <a href={`mailto:${publicEmail}`} className="flex items-start gap-2 hover:opacity-70"><Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-500" /><span className="break-all">{publicEmail}</span></a>}
                {website && <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 hover:opacity-70"><Globe className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-500" /><span>Official website</span></a>}
                {location && <div className="flex items-start gap-2"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-500" /><span>{location}</span></div>}
                {isOrganization && profile.organization_industry && <div><p className="text-[10px] uppercase tracking-wide text-neutral-500">Industry</p><p className="mt-0.5 font-medium">{profile.organization_industry}</p></div>}
                {isOrganization && profile.organization_country && <div><p className="text-[10px] uppercase tracking-wide text-neutral-500">Country</p><p className="mt-0.5 font-medium">{profile.organization_country}</p></div>}
                {!hasContact && <p className="text-neutral-500">No public contact information.</p>}
              </div>
            </aside>

            <section className="min-w-0 p-4 sm:p-5">
              <div className="space-y-4">
                {PROFILE_EDITOR_SECTION_KINDS.map((kind) => {
                  const entries = sections.filter((section) => section.kind === kind);
                  if (!entries.length) return null;
                  const Icon = SECTION_ICONS[kind] || FileBadge;
                  return (
                    <section key={kind}>
                      <div className="mb-2 flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <h2 className="text-xs font-semibold uppercase tracking-[0.12em]">{PROFILE_SECTION_DEFINITIONS[kind].label}</h2>
                      </div>
                      <div className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 px-3">
                        {entries.map((section) => {
                          const heading = sectionHeading(section);
                          const meta = sectionMeta(section);
                          const url = safeExternalUrl(section.data?.url);
                          return (
                            <article key={section.id} className="flex items-start gap-2 py-3">
                              <div className="min-w-0 flex-1">
                                <h3 className="text-sm font-semibold leading-snug">{heading}</h3>
                                {meta && <p className="mt-0.5 text-[11px] text-neutral-500">{meta}</p>}
                              </div>
                              {url && <a href={url} target="_blank" rel="noopener noreferrer" className="text-neutral-500" aria-label={`Open official link for ${heading}`}><ExternalLink className="h-3.5 w-3.5" /></a>}
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
                {!sections.length && <p className="py-8 text-center text-xs text-neutral-500">Work, education, credentials and accomplishments can be added to this profile.</p>}
              </div>
            </section>
          </div>
        </Card>

        <footer className="mt-4 flex items-center justify-center gap-4 text-[11px] text-neutral-500">
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/login">Sign in</Link>
        </footer>
      </main>
    </div>
  );
};

export default CreatorProfile;
