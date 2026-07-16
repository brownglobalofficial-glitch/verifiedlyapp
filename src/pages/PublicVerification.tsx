import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, ExternalLink } from "lucide-react";
import VerifiedBadge from "@/components/VerifiedBadge";

const PLATFORM_URL: Record<string, (h: string) => string> = {
  instagram: (h) => `https://instagram.com/${h}`,
  tiktok:    (h) => `https://tiktok.com/@${h}`,
  x:         (h) => `https://x.com/${h}`,
  youtube:   (h) => `https://youtube.com/@${h}`,
  twitch:    (h) => `https://twitch.tv/${h}`,
  linkedin:  (h) => `https://linkedin.com/in/${h}`,
  github:    (h) => `https://github.com/${h}`,
};

const PublicVerification = () => {
  const { username } = useParams();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [socials, setSocials] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, id_verified, verified_at, show_legal_name, verified_full_name")
        .eq("username", username)
        .maybeSingle();
      if (!p) { setLoading(false); return; }
      const { data: vs } = await (supabase.from("verified_socials" as any).select("platform, handle, verification_status").eq("user_id", p.id) as any);
      setProfile(p);
      setSocials(vs || []);
      setLoading(false);
    })();
  }, [username]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="p-6 text-center"><p>Profile not found.</p></Card>
    </div>
  );

  const isVerified = !!profile.id_verified;
  const connectedSocials = socials.filter((s: any) => s.verification_status === "verified");
  const ogTitle = isVerified
    ? `@${profile.username} · Verified identity on Verifiedly`
    : `@${profile.username} · Verifiedly`;
  const ogDesc = isVerified
    ? `${profile.display_name || profile.username} has completed identity verification via Stripe Identity on Verifiedly.`
    : `${profile.display_name || profile.username} has not completed identity verification on Verifiedly.`;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{ogTitle}</title>
        <meta name="description" content={ogDesc} />
        <link rel="canonical" href={`https://verifiedly.app/verify/${profile.username}`} />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDesc} />
        <meta property="og:url" content={`https://verifiedly.app/verify/${profile.username}`} />
        <meta property="og:type" content="profile" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <div className="container mx-auto px-4 py-10 max-w-xl">
        <Link to={`/${profile.username}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to profile
        </Link>

        <Card className="p-8 text-center">
          {profile.avatar_url && (
            <img src={profile.avatar_url} alt="" className="w-20 h-20 rounded-full mx-auto mb-4 object-cover" />
          )}
          <h1 className="text-2xl font-display font-bold tracking-tight">
            {profile.display_name || profile.username}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">@{profile.username}</p>

          {isVerified ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground text-background mb-3">
              <VerifiedBadge className="w-5 h-5" />
              <span className="text-sm font-medium">Verified identity</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-muted-foreground mb-3">
              <span className="text-sm font-medium">Not identity verified</span>
            </div>
          )}

          {isVerified && profile.verified_at && (
            <p className="text-xs text-muted-foreground">
              Verified {new Date(profile.verified_at).toLocaleDateString()}
            </p>
          )}

          {isVerified && profile.show_legal_name && profile.verified_full_name && (
            <p className="text-xs text-muted-foreground mt-1">Legal name: {profile.verified_full_name}</p>
          )}

          <Link
            to={`/${profile.username}`}
            className="inline-flex items-center gap-1 text-xs underline mt-4 text-muted-foreground hover:text-foreground"
          >
            View profile <ExternalLink className="w-3 h-3" />
          </Link>
        </Card>

        {connectedSocials.length > 0 && (
          <Card className="p-5 mt-4">
            <p className="text-xs uppercase tracking-wider font-medium text-muted-foreground mb-3">Connected accounts</p>
            <ul className="space-y-1.5">
              {connectedSocials.map((s: any) => {
                const urlFn = PLATFORM_URL[s.platform];
                return (
                  <li key={`${s.platform}-${s.handle}`} className="flex items-center justify-between text-sm">
                    <span className="capitalize">{s.platform} · @{s.handle}</span>
                    {urlFn && (
                      <a href={urlFn(s.handle)} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                        Visit <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="text-[11px] text-muted-foreground mt-3">Connected means the account was linked — not identity verified.</p>
          </Card>
        )}

        <p className="text-[11px] text-muted-foreground text-center mt-6 leading-relaxed">
          Identity check powered by Stripe Identity. This confirms identity, not endorsement.
        </p>
      </div>
    </div>
  );
};

export default PublicVerification;