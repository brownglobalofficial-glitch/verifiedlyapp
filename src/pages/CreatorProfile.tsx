import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { Check, ExternalLink, Globe, Mail, MapPin, Share2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import SocialIcon from "@/components/SocialIcon";
import VerifiedBadge from "@/components/VerifiedBadge";
import { BusinessVerificationBadge, CredentialVerificationBadge } from "@/components/VerificationClaimBadge";
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

const PUBLIC_PROFILE_FIELDS = "id, username, display_name, category, account_type, avatar_url, website, social_links, theme_color, id_verified, verified_at, updated_at, organization_legal_name, organization_industry, organization_country, business_verified, business_verified_at, business_verification_expires_at, business_verification_provider";

interface PublicProfile {
  id: string;
  username: string;
  display_name: string | null;
  category: string | null;
  account_type: string | null;
  avatar_url: string | null;
  website: string | null;
  social_links: unknown;
  theme_color: string | null;
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

interface PublicCredentialVerification {
  id: string;
  section_id: string;
  provider_name: string;
  status: string;
  verified_at: string | null;
  expires_at: string | null;
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

const sectionHeading = (section: ProfileSection) => {
  const data = section.data || {};
  switch (section.kind) {
    case "work": return data.role || data.organization || "Work";
    case "education": return data.program || data.school || "Education";
    case "accomplishment": return data.title || "Award";
    case "credential": return data.name || "Credential";
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
    default: return "";
  }
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
  return bases[platform] ? safeExternalUrl(`${bases[platform]}${handle}`) : null;
};

const CreatorProfile = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [sections, setSections] = useState<ProfileSection[]>([]);
  const [credentialVerifications, setCredentialVerifications] = useState<PublicCredentialVerification[]>([]);
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

      const [{ data: currentSections }, { data: currentCredentials }] = await Promise.all([
        supabase
          .from("profile_sections")
          .select("id, user_id, kind, position, data, is_public, created_at, updated_at")
          .eq("user_id", currentProfile.id)
          .eq("is_public", true)
          .order("position", { ascending: true }),
        supabase
          .from("credential_verifications")
          .select("id, section_id, provider_name, status, verified_at, expires_at")
          .eq("user_id", currentProfile.id)
          .eq("status", "verified")
          .eq("display_public", true),
      ]);

      setProfile(currentProfile as PublicProfile);
      setSections((currentSections || []).map((section) => ({
        ...section,
        kind: section.kind as ProfileSectionKind,
        data: (section.data || {}) as Record<string, string>,
      })).filter((section) => isProfileEditorSectionKind(section.kind) && hasVisibleSectionData(section)));
      setCredentialVerifications((currentCredentials as PublicCredentialVerification[] | null) || []);
      setLoading(false);

      void supabase.from("page_views").insert({ creator_id: currentProfile.id });
    };

    void load();
  }, [username]);

  const socialValues = useMemo(() => (profile?.social_links || {}) as Record<string, string>, [profile?.social_links]);

  const socials = useMemo(() => Object.entries(socialValues)
    .filter(([platform]) => platform !== "email" && platform !== "location")
    .map(([platform, value]) => ({ platform, url: socialUrl(platform, String(value)) }))
    .filter((item): item is { platform: string; url: string } => !!item.url), [socialValues]);

  const publicEmail = useMemo(() => {
    const value = String(socialValues.email || "").trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : null;
  }, [socialValues]);

  const location = String(socialValues.location || "").trim() || null;
  const credentialBySection = useMemo(() => new Map(credentialVerifications.map((verification) => [verification.section_id, verification])), [credentialVerifications]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-4 py-16">
        <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border bg-card lg:grid-cols-[minmax(240px,1fr)_minmax(0,2fr)]">
          <div className="space-y-4 border-b p-6 lg:border-b-0 lg:border-r"><Skeleton className="mx-auto h-24 w-24 rounded-full" /><Skeleton className="mx-auto h-8 w-40 rounded-full" /><Skeleton className="h-40 rounded-2xl" /></div>
          <div className="space-y-4 p-6"><Skeleton className="h-16 rounded-2xl" /><Skeleton className="h-16 rounded-2xl" /><Skeleton className="h-56 rounded-2xl" /></div>
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4 text-center">
        <img src={logoMark} alt="Verifiedly" className="h-10 w-10" />
        <h1 className="text-2xl font-display font-bold">Profile not found</h1>
        <p className="text-sm text-muted-foreground">This Verifiedly handle does not exist.</p>
        <Button asChild variant="outline"><Link to="/">Go to Verifiedly</Link></Button>
      </div>
    );
  }

  const theme = THEME_CLASSES[profile.theme_color || "default"] || THEME_CLASSES.default;
  const displayName = profile.display_name || profile.username;
  const isOrganization = profile.account_type === "business";
  const website = safeExternalUrl(profile.website);
  const updatedAt = profile.updated_at ? new Date(profile.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : null;
  const description = profile.category ? `${displayName} · ${profile.category}` : `Official Verifiedly profile for ${displayName}.`;
  const profileUrl = `https://verifiedly.app/${profile.username}`;
  const shareImage = profile.avatar_url || new URL(logoMark, window.location.origin).href;
  const isOwner = viewerUserId === profile.id;

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
        <meta property="og:image:alt" content={profile.avatar_url ? `${displayName}'s profile picture` : "Verifiedly"} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={`${displayName} on Verifiedly`} />
        <meta name="twitter:description" content={description.slice(0, 200)} />
        <meta name="twitter:image" content={shareImage} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": isOrganization ? "Organization" : "Person",
          name: displayName,
          url: profileUrl,
          image: profile.avatar_url || undefined,
          sameAs: [...socials.map((social) => social.url), website].filter(Boolean),
        })}</script>
      </Helmet>

      <header className={`border-b ${theme.border}`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold"><img src={logoMark} alt="" className="h-6 w-6" /> Verifiedly</Link>
          <div className="flex items-center gap-2">
            <Button type="button" onClick={() => void shareProfile()} size="sm" variant="ghost" className="h-8 gap-1.5 rounded-full px-3 text-xs">
              {linkCopied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />} {linkCopied ? "Copied" : "Share"}
            </Button>
            <Button asChild size="sm" variant="outline" className={`h-8 rounded-full text-xs ${theme.card} ${theme.border}`}>
              <Link to={isOwner ? "/dashboard" : "/signup"}>{isOwner ? "Edit profile" : "Create profile"}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 sm:py-8">
        <Card className={`overflow-hidden rounded-3xl shadow-sm ${theme.card} ${theme.border}`}>
          <div className="grid lg:grid-cols-[minmax(240px,1fr)_minmax(0,2fr)]">
            <aside className={`border-b p-5 sm:p-7 lg:border-b-0 lg:border-r ${theme.border}`}>
              <div className="text-center">
                <Avatar className="mx-auto h-24 w-24 bg-muted sm:h-28 sm:w-28">
                  {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={displayName} className="object-cover" />}
                  <AvatarFallback className="text-3xl font-display font-bold">{displayName[0]?.toUpperCase() || "?"}</AvatarFallback>
                </Avatar>

                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  <h1 className="break-words font-display text-2xl font-bold tracking-tight sm:text-3xl">{displayName}</h1>
                  {profile.id_verified && <VerifiedBadge className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" label={isOrganization ? "Account holder verified" : "Identity verified"} />}
                  {isOrganization && profile.business_verified && <BusinessVerificationBadge compact />}
                  {isOwner && !profile.id_verified && (
                    <Link to="/dashboard/verification" className={`inline-flex items-center gap-1 rounded-full border border-dashed px-2 py-1 text-[10px] font-medium transition hover:opacity-70 ${theme.muted} ${theme.border}`} title="Get verified">
                      <ShieldCheck className="h-3 w-3" /> Get verified
                    </Link>
                  )}
                </div>
                <p className={`mt-1 text-xs ${theme.muted}`}>@{profile.username}</p>

                {!!socials.length && (
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2" aria-label="Social profiles">
                    {socials.map(({ platform, url }) => (
                      <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition hover:-translate-y-0.5 hover:opacity-75 ${theme.card} ${theme.border}`} aria-label={platform} title={platform}>
                        <SocialIcon platform={platform} className="h-3.5 w-3.5" />
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <section className={`mt-6 rounded-2xl border p-4 text-left ${theme.border}`}>
                <h2 className={`mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] ${theme.muted}`}>Profile information</h2>
                <div className="space-y-3 text-xs">
                  {profile.category && <p className="text-sm font-medium">{profile.category}</p>}
                  {isOrganization && profile.organization_legal_name && <div><p className={`text-[10px] uppercase tracking-[0.12em] ${theme.muted}`}>Legal name</p><p className="mt-0.5 text-xs font-medium">{profile.organization_legal_name}</p></div>}
                  {isOrganization && profile.organization_industry && <div><p className={`text-[10px] uppercase tracking-[0.12em] ${theme.muted}`}>Industry</p><p className="mt-0.5 text-xs">{profile.organization_industry}</p></div>}
                  {isOrganization && profile.organization_country && <div><p className={`text-[10px] uppercase tracking-[0.12em] ${theme.muted}`}>Registered country</p><p className="mt-0.5 text-xs">{profile.organization_country}</p></div>}
                  {location && <div className="flex items-start gap-2"><MapPin className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${theme.muted}`} /><span>{location}</span></div>}
                  {publicEmail && <a href={`mailto:${publicEmail}`} className="flex items-start gap-2 transition hover:opacity-70"><Mail className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${theme.muted}`} /><span className="break-all">{publicEmail}</span></a>}
                  {website && <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 transition hover:opacity-70"><Globe className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${theme.muted}`} /><span className="break-all">Website</span></a>}
                  {!profile.category && !location && !publicEmail && !website && <p className={theme.muted}>No public profile information yet.</p>}
                </div>
              </section>
            </aside>

            <div className="min-w-0 p-5 sm:p-7">
              <div className="space-y-6" aria-label="Profile details">
                {PROFILE_EDITOR_SECTION_KINDS.map((kind) => {
                  const entries = sections.filter((section) => section.kind === kind);
                  if (!entries.length) return null;
                  return (
                    <section key={kind}>
                      <h2 className={`mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] ${theme.muted}`}>{PROFILE_SECTION_DEFINITIONS[kind].label}</h2>
                      <div className="divide-y divide-border/60 rounded-2xl border px-4 sm:px-5">
                        {entries.map((section) => {
                          const heading = sectionHeading(section);
                          const meta = sectionMeta(section);
                          const url = safeExternalUrl(section.data?.url);
                          const credentialVerification = credentialBySection.get(section.id);
                          return (
                            <article key={section.id} className="py-4">
                              <div className="flex items-start gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold leading-snug">{heading}</h3>{credentialVerification && <CredentialVerificationBadge provider={credentialVerification.provider_name} />}</div>
                                  {meta && <p className={`mt-0.5 text-[11px] leading-relaxed ${theme.muted}`}>{meta}</p>}
                                  {credentialVerification?.verified_at && <p className={`mt-1 text-[10px] ${theme.muted}`}>Checked {new Date(credentialVerification.verified_at).toLocaleDateString()}{credentialVerification.expires_at ? ` · Expires ${new Date(credentialVerification.expires_at).toLocaleDateString()}` : ""}</p>}
                                </div>
                                {url && <a href={url} target="_blank" rel="noopener noreferrer" className={`shrink-0 transition hover:opacity-65 ${theme.muted}`} aria-label={`Open supporting link for ${heading}`}><ExternalLink className="h-3.5 w-3.5" /></a>}
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
                {!sections.length && <p className={`py-10 text-center text-xs ${theme.muted}`}>This profile is ready for experience and credentials.</p>}
              </div>
            </div>
          </div>
        </Card>

        <footer className={`mt-5 text-center text-[11px] ${theme.muted}`}>
          {updatedAt && <p>Updated {updatedAt}</p>}
          <p className="mt-1">Profile details are supplied by the profile owner. Verification labels explain exactly what was checked.</p>
          <div className="mt-3 flex items-center justify-center gap-4"><Link to="/terms">Terms</Link><Link to="/privacy">Privacy</Link><Link to="/login">Sign in</Link></div>
        </footer>
      </main>
    </div>
  );
};

export default CreatorProfile;
