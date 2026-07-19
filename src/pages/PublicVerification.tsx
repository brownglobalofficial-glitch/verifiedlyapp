import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, ExternalLink } from "lucide-react";
import VerifiedBadge from "@/components/VerifiedBadge";

interface VerificationProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  id_verified: boolean;
  verified_at: string | null;
  show_legal_name: boolean;
  verified_full_name: string | null;
}

const PublicVerification = () => {
  const { username } = useParams();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<VerificationProfile | null>(null);

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, id_verified, verified_at, show_legal_name, verified_full_name")
        .eq("username", username)
        .maybeSingle();
      if (!p) { setLoading(false); return; }
      setProfile(p as VerificationProfile);
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

        <p className="text-[11px] text-muted-foreground text-center mt-6 leading-relaxed">
          Identity check powered by Stripe Identity. This confirms identity, not endorsement.
        </p>
      </div>
    </div>
  );
};

export default PublicVerification;
