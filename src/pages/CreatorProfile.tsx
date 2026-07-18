import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import {
  Award,
  BriefcaseBusiness,
  ChevronRight,
  ExternalLink,
  FileCheck2,
  FolderKanban,
  Globe,
  GraduationCap,
  Info,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import SocialIcon from "@/components/SocialIcon";
import VerifiedBadge from "@/components/VerifiedBadge";
import logoMark from "@/assets/verifiedly-mark.png";
import {
  hasVisibleSectionData,
  safeExternalUrl,
  type ProfileSection,
  type ProfileSectionKind,
} from "@/lib/profile-sections";

const PUBLIC_PROFILE_FIELDS = "id, username, display_name, bio, category, account_type, avatar_url, website, social_links, theme_color, id_verified, verified_at, updated_at";

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
  id_verified: boolean;
  verified_at: string | null;
  updated_at: string;
}

interface PublicLink {
  id: string;
  title: string;
  url: string;
  icon: string | null;
  thumbnail_url: string | null;
  sort_order: number | null;
}

const THEME_CLASSES: Record<string, { page: string; card: string; muted: string; border: string }> = {
  default: { page: "bg-neutral-50 text-neutral-950", card: "bg-white", muted: "text-neutral-500", border: "border-neutral-200" },
  mono: { page: "bg-white text-black", card: "bg-white", muted: "text-neutral-500", border: "border-neutral-300" },
  midnight: { page: "bg-slate-950 text-slate-50", card: "bg-slate-900", muted: "text-slate-400", border: "border-slate-800" },
  sunset: { page: "bg-orange-50 text-stone-950", card: "bg-white/90", muted: "text-stone-500", border: "border-orange-200" },
  forest: { page: "bg-emerald-50 text-emerald-950", card: "bg-white/90", muted: "text-emerald-700/70", border: "border-emerald-200" },
  ocean: { page: "bg-sky-50 text-slate-950", card: "bg-white/90", muted: "text-sky-800/60", border: "border-sky-200" },
  lavender: { page: "bg-violet-50 text-violet-950", card: "bg-white/90", muted: "text-violet-800/60", border: "border-violet-200" },
  blush: { page: "bg-rose-50 text-rose-950", card: "bg-white/90", muted: "text-rose-800/60", border: "border-rose-200" },
  sand: { page: "bg-amber-50 text-stone-950", card: "bg-white/90", muted: "text-stone-500", border: "border-amber-200" },
  neon: { page: "bg-zinc-950 text-fuchsia-50", card: "bg-zinc-900", muted: "text-zinc-400", border: "border-fuchsia-900/50" },
};

const SECTION_ICONS: Record<ProfileSectionKind, typeof Info> = {
  about: Info,
  work: BriefcaseBusiness,
  education: GraduationCap,
  accomplishment: Award,
  credential: FileCheck2,
  project: FolderKanban,
};

const sectionHeading = (section: ProfileSection) => {
  const data = section.data || {};
  switch (section.kind) {
    case "work": return data.role || data.organization || "Work";
    case "education": return data.program || data.school || "Education";
    case "accomplishment": return data.title || "Accomplishment";
    case "credential": return data.name || "Credential";
    case "project": return data.name || "Project";
    default: return "About";
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
    case "project": return data.role || "";
    default: return "";
  }
};

const sectionDescription = (section: ProfileSection) => {
  if (section.kind === "about") return section.data?.text || "";
  return section.data?.description || "";
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
    linkedin: "https://linkedin.com/in/",
  };
  return safeExternalUrl(`${bases[platform] || "https://"}${handle}`);
};

const CreatorProfile = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [sections, setSections] = useState<ProfileSection[]>([]);
  const [links, setLinks] = useState<PublicLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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

      const [{ data: currentSections }, { data: currentLinks }] = await Promise.all([
        supabase
          .from("profile_sections")
          .select("id, user_id, kind, position, data, is_public, created_at, updated_at")
          .eq("user_id", currentProfile.id)
          .eq("is_public", true)
          .order("position", { ascending: true }),
        supabase
          .from("bio_links")
          .select("id, title, url, icon, thumbnail_url, sort_order")
          .eq("creator_id", currentProfile.id)
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
      ]);

      setProfile(currentProfile as PublicProfile);
      setSections((currentSections || []).map((section) => ({
        ...section,
        kind: section.kind as ProfileSectionKind,
        data: (section.data || {}) as Record<string, string>,
      })).filter(hasVisibleSectionData));
      setLinks(currentLinks || []);
      setLoading(false);

      void supabase.from("page_views").insert({ creator_id: currentProfile.id });
    };

    load();
  }, [username]);

  const socials = useMemo(() => {
    const values = (profile?.social_links || {}) as Record<string, string>;
    return Object.entries(values)
      .map(([platform, value]) => ({ platform, url: socialUrl(platform, String(value)) }))
      .filter((item): item is { platform: string; url: string } => !!item.url);
  }, [profile?.social_links]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-4 py-16">
        <div className="mx-auto max-w-2xl space-y-4">
          <Skeleton className="mx-auto h-24 w-24 rounded-full" />
          <Skeleton className="mx-auto h-8 w-64" />
          <Skeleton className="mx-auto h-4 w-80" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4 text-center">
        <img src={logoMark} alt="Verifiedly" className="h-10 w-10" />
        <h1 className="text-2xl font-display font-bold">Profile not found</h1>
        <p className="text-sm text-muted-foreground">This Verifiedly handle does not exist.</p>
        <Button asChild variant="outline"><Link to="/">Go to Verifiedly</Link></Button>
      </div>
    );
  }

  const theme = THEME_CLASSES[profile?.theme_color || "default"] || THEME_CLASSES.default;
  const displayName = profile?.display_name || profile?.username;
  const isOrganization = profile?.account_type === "business";
  const website = safeExternalUrl(profile?.website);
  const updatedAt = profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : null;

  return (
    <div className={`min-h-screen ${theme.page}`}>
      <Helmet>
        <title>{displayName} (@{profile.username}) · Verifiedly</title>
        <meta name="description" content={(profile.bio || `The official Verifiedly profile for ${displayName}.`).slice(0, 160)} />
        <link rel="canonical" href={`https://verifiedly.app/${profile.username}`} />
        <meta property="og:type" content="profile" />
        <meta property="og:title" content={`${displayName} on Verifiedly`} />
        <meta property="og:description" content={(profile.bio || `Official profile for ${displayName}.`).slice(0, 200)} />
        <meta property="og:url" content={`https://verifiedly.app/${profile.username}`} />
        {profile.avatar_url && <meta property="og:image" content={profile.avatar_url} />}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": isOrganization ? "Organization" : "Person",
          name: displayName,
          url: `https://verifiedly.app/${profile.username}`,
          image: profile.avatar_url || undefined,
          description: profile.bio || undefined,
          sameAs: [...socials.map((social) => social.url), website].filter(Boolean),
        })}</script>
      </Helmet>

      <header className={`border-b ${theme.border}`}>
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold">
            <img src={logoMark} alt="" className="h-6 w-6" /> Verifiedly
          </Link>
          <Button asChild size="sm" variant="outline" className={`${theme.card} ${theme.border}`}>
            <Link to="/signup">Create profile</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <section className="text-center">
          <Avatar className={`mx-auto h-24 w-24 ring-4 ${theme.border}`}>
            {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={displayName} />}
            <AvatarFallback className="text-3xl font-display font-bold">{displayName[0]?.toUpperCase() || "?"}</AvatarFallback>
          </Avatar>
          <div className="mt-5 flex items-center justify-center gap-2">
            <h1 className="text-3xl font-display font-bold tracking-tight">{displayName}</h1>
            {profile.id_verified && <VerifiedBadge className="h-6 w-6" label={isOrganization ? "Account holder verified" : "Identity verified"} />}
          </div>
          <p className={`mt-1 text-sm ${theme.muted}`}>@{profile.username}</p>
          {(profile.category || isOrganization) && (
            <p className={`mt-3 text-sm font-medium ${theme.muted}`}>{profile.category || "Organization"}</p>
          )}
          {profile.bio && <p className="mx-auto mt-4 max-w-xl text-sm sm:text-base leading-relaxed">{profile.bio}</p>}

          {profile.id_verified && (
            <div className={`mx-auto mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${theme.card} ${theme.border}`}>
              <VerifiedBadge className="h-4 w-4" label={isOrganization ? "Account holder verified" : "Identity verified"} />
              {isOrganization ? "Account holder verified" : "Identity verified"}
            </div>
          )}

          {(socials.length > 0 || website) && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {socials.map(({ platform, url }) => (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex h-10 w-10 items-center justify-center rounded-full border transition-transform hover:-translate-y-0.5 ${theme.card} ${theme.border}`}
                  aria-label={platform}
                  title={platform}
                >
                  <SocialIcon platform={platform} className="h-4 w-4" />
                </a>
              ))}
              {website && (
                <a href={website} target="_blank" rel="noopener noreferrer" className={`flex h-10 w-10 items-center justify-center rounded-full border transition-transform hover:-translate-y-0.5 ${theme.card} ${theme.border}`} aria-label="Official website" title="Official website">
                  <Globe className="h-4 w-4" />
                </a>
              )}
            </div>
          )}
        </section>

        {sections.length > 0 && (
          <section className="mt-10 space-y-3" aria-label="Profile information">
            {sections.map((section) => {
              const Icon = SECTION_ICONS[section.kind];
              const heading = sectionHeading(section);
              const meta = sectionMeta(section);
              const description = sectionDescription(section);
              const url = safeExternalUrl(section.data?.url);

              return (
                <Card key={section.id} className={`p-5 shadow-none ${theme.card} ${theme.border}`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${theme.border}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="font-display font-semibold">{heading}</h2>
                          {meta && <p className={`mt-0.5 text-xs ${theme.muted}`}>{meta}</p>}
                        </div>
                        {url && (
                          <a href={url} target="_blank" rel="noopener noreferrer" className={`shrink-0 ${theme.muted}`} aria-label={`Open supporting link for ${heading}`}>
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                      {description && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{description}</p>}
                      {section.kind === "credential" && (
                        <p className={`mt-3 text-[11px] ${theme.muted}`}>
                          Provided by the profile owner{url ? "; use the linked source for supporting information." : "."}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </section>
        )}

        {links.length > 0 && (
          <section className="mt-10" aria-label="Links">
            <h2 className={`mb-3 text-xs font-semibold uppercase tracking-widest ${theme.muted}`}>Links</h2>
            <div className="space-y-3">
              {links.map((link) => {
                const url = safeExternalUrl(link.url);
                if (!url) return null;
                return (
                  <a key={link.id} href={url} target="_blank" rel="noopener noreferrer" className="block" onClick={() => void supabase.from("link_clicks").insert({ link_id: link.id, creator_id: profile.id })}>
                    <Card className={`flex items-center gap-3 p-4 shadow-none transition-transform hover:-translate-y-0.5 ${theme.card} ${theme.border}`}>
                      {link.thumbnail_url ? <img src={link.thumbnail_url} alt="" className="h-10 w-10 rounded-lg object-cover" /> : link.icon ? <span className="w-10 text-center text-xl">{link.icon}</span> : null}
                      <span className="flex-1 text-sm font-semibold">{link.title}</span>
                      <ChevronRight className={`h-4 w-4 ${theme.muted}`} />
                    </Card>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        <footer className={`mt-12 border-t pt-6 text-center text-xs ${theme.border} ${theme.muted}`}>
          {updatedAt && <p>Profile updated {updatedAt}</p>}
          <p className="mt-2">A Verified badge confirms an identity check—not every profile statement.</p>
          <div className="mt-4 flex items-center justify-center gap-4">
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/login">Sign in</Link>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default CreatorProfile;
