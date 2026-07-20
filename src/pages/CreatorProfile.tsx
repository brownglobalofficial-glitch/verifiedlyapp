import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import {
  Award,
  BriefcaseBusiness,
  Check,
  ExternalLink,
  FileBadge,
  Globe,
  GraduationCap,
  Mail,
  MapPin,
  Share2,
  ShieldCheck,
  Link as LinkIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import SocialIcon from "@/components/SocialIcon";
import VerifiedBadge from "@/components/VerifiedBadge";
import { BusinessVerificationBadge } from "@/components/VerificationClaimBadge";
import logoMark from "@/assets/verifiedly-mark.png";
import {
  hasVisibleSectionData,
  isProfileEditorSectionKind,
  PROFILE_EDITOR_SECTION_KINDS,
  PROFILE_SECTION_DEFINITIONS,
  safeExternalUrl,
  type ProfileSection,
  type ProfileSectionKind,
} from "@/lib/profile-sections";

const PUBLIC_PROFILE_FIELDS = "id, username, display_name, bio, category, account_type, avatar_url, website, social_links, theme_color, link_layout, id_verified, verified_at, updated_at, organization_legal_name, organization_industry, organization_country, business_verified, business_verified_at, business_verification_expires_at, business_verification_provider";

interface PublicProfile {
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
  link_layout: string | null;
  id_verified: boolean;
  verified_at: string | null;
  updated_at: string;
  organization_legal_name: string | null;
  organization_industry: string | null;
  organization_country: string | null;
  business_verified: boolean;
  business_verified_at: string | null;
  business_verification_expires_at: string | null;
  business_verification_provider: string | null;
}

interface FeaturedLink {
  id: string;
  title: string;
  url: string;
  thumbnail_url: string | null;
  icon: string | null;
}

const THEME_CLASSES: Record<string, { page: string; card: string; muted: string; border: string; soft: string }> = {
  default: { page: "bg-neutral-50 text-neutral-950", card: "bg-white", muted: "text-neutral-500", border: "border-neutral-200", soft: "bg-neutral-100/80" },
  mono: { page: "bg-white text-black", card: "bg-white", muted: "text-neutral-500", border: "border-neutral-300", soft: "bg-neutral-100" },
  midnight: { page: "bg-slate-950 text-slate-50", card: "bg-slate-900", muted: "text-slate-400", border: "border-slate-800", soft: "bg-slate-800/70" },
  sunset: { page: "bg-orange-50 text-stone-950", card: "bg-white/90", muted: "text-stone-500", border: "border-orange-200", soft: "bg-orange-100/70" },
  forest: { page: "bg-emerald-50 text-emerald-950", card: "bg-white/90", muted: "text-emerald-700/70", border: "border-emerald-200", soft: "bg-emerald-100/70" },
  ocean: { page: "bg-sky-50 text-slate-950", card: "bg-white/90", muted: "text-sky-800/60", border: "border-sky-200", soft: "bg-sky-100/70" },
  lavender: { page: "bg-violet-50 text-violet-950", card: "bg-white/90", muted: "text-violet-800/60", border: "border-violet-200", soft: "bg-violet-100/70" },
  blush: { page: "bg-rose-50 text-rose-950", card: "bg-white/90", muted: "text-rose-800/60", border: "border-rose-200", soft: "bg-rose-100/70" },
  sand: { page: "bg-amber-50 text-stone-950", card: "bg-white/90", muted: "text-stone-500", border: "border-amber-200", soft: "bg-amber-100/70" },
  neon: { page: "bg-zinc-950 text-fuchsia-50", card: "bg-zinc-900", muted: "text-zinc-400", border: "border-fuchsia-900/50", soft: "bg-zinc-800/80" },
};

const PUBLIC_SOCIAL_KEYS = new Set(["instagram", "youtube", "tiktok", "facebook", "twitter", "x"]);

const sectionHeading = (section: ProfileSection) => {
  const data = section.data || {};
  switch (section.kind) {
    case "work": return data.role || data.organization || "Work";
    case "education": return data.program || data.school || "Education";
    case "accomplishment": return data.title || "Accomplishment";
    case "credential": return data.name || "Credential";
    case "project": return data.name || "Project";
    default: return "Profile detail";
  }
};

const sectionMeta = (section: ProfileSection) => {
  const data = section.data || {};
  const dateRange = [data.start || data.issued || data.date, data.end || data.expires].filter(Boolean).join(" – ");
  switch (section.kind) {
    case "work": return [data.organization, dateRange].filter(Boolean).join(" · ");
    case "education": return [data.school, dateRange].filter(Boolean).join(" · ");
    case "accomplishment": return data.date || "";
    case "credential": return [data.issuer, dateRange].filter(Boolean).join(" · ");
    case "project": return [data.role, data.description].filter(Boolean).join(" · ");
    default: return "";
  }
};

const SECTION_ICONS: Record<ProfileSectionKind, typeof BriefcaseBusiness> = {
  about: FileBadge,
  work: BriefcaseBusiness,
  education: GraduationCap,
  accomplishment: Award,
  credential: FileBadge,
  project: FileBadge,
};

const socialUrl = (platform: string, value: string) => {
  const direct = safeExternalUrl(value);
  if (value.startsWith("http://") || value.startsWith("https://")) return direct;
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
  const [featuredLinks, setFeaturedLinks] = useState<FeaturedLink[]>([]);
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
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!username) return;
    const load = async () => {
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

      const { data: currentLinks } = await supabase
        .from("bio_links")
        .select("id, title, url, thumbnail_url, icon, is_active, sort_order")
        .eq("creator_id", currentProfile.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      setProfile(currentProfile as PublicProfile);
      setSections((currentSections || []).map((section) => ({
        ...section,
        kind: section.kind as ProfileSectionKind,
        data: (section.data || {}) as Record<string, string>,
      })).filter((section) => (isProfileEditorSectionKind(section.kind) || section.kind === "project") && hasVisibleSectionData(section)));
      setFeaturedLinks((currentLinks || []) as FeaturedLink[]);
      setLoading(false);
      void supabase.from("page_views").insert({ creator_id: currentProfile.id });
    };
    void load();
  }, [username]);

  const socialValues = useMemo(() => (profile?.social_links || {}) as Record<string, string>, [profile?.social_links]);
  const socials = useMemo(() => Object.entries(socialValues)
    .filter(([platform]) => PUBLIC_SOCIAL_KEYS.has(platform))
    .map(([platform, value]) => ({ platform, url: socialUrl(platform, String(value)) }))
    .filter((item): item is { platform: string; url: string } => !!item.url), [socialValues]);
  const publicEmail = useMemo(() => {
    const value = String(socialValues.email || "").trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : null;
  }, [socialValues]);
  const location = String(socialValues.location || "").trim() || null;

  if (loading) {
    return <div className="min-h-screen bg-background px-4 py-16"><div className="mx-auto max-w-5xl space-y-5"><Skeleton className="h-80 rounded-[2rem]" /><div className="grid gap-5 md:grid-cols-2"><Skeleton className="h-56 rounded-3xl" /><Skeleton className="h-56 rounded-3xl" /></div></div></div>;
  }

  if (notFound || !profile) {
    return <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4 text-center"><img src={logoMark} alt="Verifiedly" className="h-10 w-10" /><h1 className="text-2xl font-display font-bold">Profile not found</h1><p className="text-sm text-muted-foreground">This Verifiedly handle does not exist.</p><Button asChild variant="outline"><Link to="/">Go to Verifiedly</Link></Button></div>;
  }

  const theme = THEME_CLASSES[profile.theme_color || "default"] || THEME_CLASSES.default;
  const displayName = profile.display_name || profile.username;
  const isOrganization = profile.account_type === "business";
  const website = isOrganization ? safeExternalUrl(profile.website) : null;
  const description = profile.category ? `${displayName} · ${profile.category}` : `Official Verifiedly profile for ${displayName}.`;
  const profileUrl = `https://verifiedly.app/${profile.username}`;
  const shareImage = profile.avatar_url || new URL(logoMark, window.location.origin).href;
  const isOwner = viewerUserId === profile.id;
  const hasOfficialLinks = !!(website || publicEmail || socials.length);

  const shareProfile = async () => {
    try {
      if (navigator.share) await navigator.share({ title: `${displayName} on Verifiedly`, text: description, url: profileUrl });
      else {
        await navigator.clipboard.writeText(profileUrl);
        setLinkCopied(true);
        window.setTimeout(() => setLinkCopied(false), 1800);
      }
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
  };

  return (
    <div className={`min-h-screen ${theme.page}`}>
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
        <script type="application/ld+json">{JSON.stringify({ "@context": "https://schema.org", "@type": isOrganization ? "Organization" : "Person", name: displayName, url: profileUrl, image: profile.avatar_url || undefined, sameAs: [...socials.map((social) => social.url), website].filter(Boolean) })}</script>
      </Helmet>

      <header className={`border-b ${theme.border} backdrop-blur`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold"><img src={logoMark} alt="" className="h-6 w-6" /> Verifiedly</Link>
          <div className="flex items-center gap-2">
            <Button type="button" onClick={() => void shareProfile()} size="sm" variant="ghost" className="h-8 gap-1.5 rounded-full px-3 text-xs">{linkCopied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}{linkCopied ? "Copied" : "Share"}</Button>
            <Button asChild size="sm" variant="outline" className={`h-8 rounded-full text-xs ${theme.card} ${theme.border}`}><Link to={isOwner ? "/dashboard" : "/signup"}>{isOwner ? "Edit profile" : "Create yours"}</Link></Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
        <Card className={`relative overflow-hidden rounded-[2rem] border shadow-[0_24px_70px_-40px_rgba(0,0,0,0.35)] ${theme.card} ${theme.border}`}>
          <div className={`absolute inset-x-0 top-0 h-28 ${theme.soft}`} />
          <section className="relative px-5 pb-7 pt-12 text-center sm:px-10 sm:pb-9 sm:pt-14">
            <Avatar className={`mx-auto h-28 w-28 border-4 shadow-lg sm:h-32 sm:w-32 ${theme.card} ${theme.border}`}>
              {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={displayName} className="object-cover" />}
              <AvatarFallback className="text-4xl font-display font-bold">{displayName[0]?.toUpperCase() || "?"}</AvatarFallback>
            </Avatar>
            <div className="mx-auto mt-5 flex max-w-3xl flex-wrap items-center justify-center gap-2">
              <h1 className="break-words font-display text-3xl font-bold tracking-tight sm:text-4xl">{displayName}</h1>
              {profile.id_verified && <VerifiedBadge className="h-7 w-7 shrink-0" label="Verifiedly identity verified" />}
              {isOrganization && profile.business_verified && <BusinessVerificationBadge compact />}
              {isOwner && !profile.id_verified && <Link to="/dashboard/verification" className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-medium ${theme.muted} ${theme.border}`}><ShieldCheck className="h-3 w-3" /> Get verified</Link>}
            </div>
            {profile.category && <p className="mt-2 text-base font-medium sm:text-lg">{profile.category}</p>}
            <p className={`mt-1 text-sm ${theme.muted}`}>@{profile.username}</p>
            {location && <p className={`mt-3 inline-flex items-center gap-1.5 text-xs ${theme.muted}`}><MapPin className="h-3.5 w-3.5" />{location}</p>}

            {profile.bio && <p className={`mx-auto mt-4 max-w-xl whitespace-pre-line text-sm leading-relaxed sm:text-[15px]`}>{profile.bio}</p>}

            {hasOfficialLinks && (
              <div className="mx-auto mt-6 max-w-2xl">
                <p className={`mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] ${theme.muted}`}>Official links</p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {website && <a href={website} target="_blank" rel="noopener noreferrer" className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-xs font-medium transition hover:-translate-y-0.5 ${theme.card} ${theme.border}`}><Globe className="h-4 w-4" /> Website</a>}
                  {publicEmail && <a href={`mailto:${publicEmail}`} className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-xs font-medium transition hover:-translate-y-0.5 ${theme.card} ${theme.border}`}><Mail className="h-4 w-4" /> Email</a>}
                  {socials.map(({ platform, url }) => <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition hover:-translate-y-0.5 ${theme.card} ${theme.border}`} aria-label={platform} title={platform}><SocialIcon platform={platform} className="h-4 w-4" /></a>)}
                </div>
              </div>
            )}
          </section>

          {isOrganization && (profile.organization_legal_name || profile.organization_industry || profile.organization_country) && (
            <section className={`grid gap-4 border-t px-5 py-5 text-center sm:grid-cols-3 sm:px-10 ${theme.border} ${theme.soft}`}>
              {profile.organization_legal_name && <div><p className={`text-[10px] uppercase tracking-[0.14em] ${theme.muted}`}>Official name</p><p className="mt-1 text-sm font-semibold">{profile.organization_legal_name}</p></div>}
              {profile.organization_industry && <div><p className={`text-[10px] uppercase tracking-[0.14em] ${theme.muted}`}>Industry</p><p className="mt-1 text-sm font-semibold">{profile.organization_industry}</p></div>}
              {profile.organization_country && <div><p className={`text-[10px] uppercase tracking-[0.14em] ${theme.muted}`}>Country</p><p className="mt-1 text-sm font-semibold">{profile.organization_country}</p></div>}
            </section>
          )}
        </Card>

        {featuredLinks.length > 0 && (
          <section className="mt-6">
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="font-display text-sm font-semibold uppercase tracking-[0.16em]">Featured links</h2>
              <span className={`text-[11px] ${theme.muted}`}>{featuredLinks.length} {featuredLinks.length === 1 ? "link" : "links"}</span>
            </div>
            <div className={`grid gap-3 ${profile.link_layout === "compact" ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
              {featuredLinks.map((link) => {
                const href = safeExternalUrl(link.url);
                if (!href) return null;
                return (
                  <a
                    key={link.id}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group flex items-center gap-3 rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${theme.card} ${theme.border}`}
                  >
                    {link.thumbnail_url ? (
                      <img src={link.thumbnail_url} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover" />
                    ) : (
                      <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${theme.soft}`}><LinkIcon className="h-4 w-4" /></span>
                    )}
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{link.title}</span>
                    <ExternalLink className={`h-4 w-4 shrink-0 transition group-hover:translate-x-0.5 ${theme.muted}`} />
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {(() => {
          const aboutSection = sections.find((s) => s.kind === "about");
          const aboutText = String(aboutSection?.data?.text || "").trim();
          if (!aboutText) return null;
          return (
            <Card className={`mt-6 rounded-3xl border p-5 shadow-sm sm:p-6 ${theme.card} ${theme.border}`}>
              <div className="mb-3 flex items-center gap-3">
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${theme.soft}`}><FileBadge className="h-5 w-5" /></span>
                <h2 className="font-display text-lg font-bold">About</h2>
              </div>
              <p className="whitespace-pre-line text-sm leading-relaxed">{aboutText}</p>
            </Card>
          );
        })()}

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {([...PROFILE_EDITOR_SECTION_KINDS, "project" as ProfileSectionKind]).map((kind) => {
            const entries = sections.filter((section) => section.kind === kind);
            if (!entries.length) return null;
            const Icon = SECTION_ICONS[kind];
            return (
              <Card key={kind} className={`rounded-3xl border p-5 shadow-sm sm:p-6 ${theme.card} ${theme.border}`}>
                <div className="mb-5 flex items-center gap-3">
                  <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${theme.soft}`}><Icon className="h-5 w-5" /></span>
                  <div><h2 className="font-display text-lg font-bold">{PROFILE_SECTION_DEFINITIONS[kind].label}</h2><p className={`text-[11px] ${theme.muted}`}>{entries.length} {entries.length === 1 ? "entry" : "entries"}</p></div>
                </div>
                <div className="space-y-3">
                  {entries.map((section) => {
                    const heading = sectionHeading(section);
                    const meta = sectionMeta(section);
                    const url = safeExternalUrl(section.data?.url);
                    return <article key={section.id} className={`group rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-sm ${theme.border}`}><div className="flex items-start gap-3"><div className="min-w-0 flex-1"><h3 className="text-sm font-semibold leading-snug">{heading}</h3>{meta && <p className={`mt-1 text-xs leading-relaxed ${theme.muted}`}>{meta}</p>}</div>{url && <a href={url} target="_blank" rel="noopener noreferrer" className={`shrink-0 rounded-full p-1.5 transition group-hover:opacity-100 ${theme.muted}`} aria-label={`Open supporting link for ${heading}`}><ExternalLink className="h-4 w-4" /></a>}</div></article>;
                  })}
                </div>
              </Card>
            );
          })}
        </div>

        {!sections.length && <Card className={`mt-6 rounded-3xl border p-10 text-center ${theme.card} ${theme.border}`}><p className="font-display text-lg font-semibold">Official profile ready</p><p className={`mx-auto mt-2 max-w-md text-sm ${theme.muted}`}>Work, education, accomplishments, and credentials can be added here.</p></Card>}

        <footer className={`mt-7 text-center text-[11px] ${theme.muted}`}>
          <div className="flex items-center justify-center gap-4"><Link to="/terms">Terms</Link><Link to="/privacy">Privacy</Link><Link to="/login">Sign in</Link></div>
        </footer>
      </main>
    </div>
  );
};

export default CreatorProfile;
