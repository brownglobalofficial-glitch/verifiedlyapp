import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Check, X, ExternalLink } from "lucide-react";
import TrustScore from "@/components/TrustScore";

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
  const [hasStripe, setHasStripe] = useState(false);
  const [linksCount, setLinksCount] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase.from("profiles").select("*").eq("username", username).maybeSingle();
      if (!p) { setLoading(false); return; }
      const [{ data: vs }, payout, { count: lc }] = await Promise.all([
        (supabase.from("verified_socials" as any).select("*").eq("user_id", p.id) as any),
        (supabase.rpc as any)("creator_has_payments", { _creator_id: p.id }),
        supabase.from("bio_links").select("*", { count: "exact", head: true }).eq("creator_id", p.id),
      ]);
      setProfile(p);
      setSocials(vs || []);
      setHasStripe(!!payout?.data);
      setLinksCount(lc || 0);
      setLoading(false);
    })();
  }, [username]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="p-6 text-center"><p>Creator not found.</p></Card>
    </div>
  );

  const score = profile.trust_score ?? 0;
  const verifiedSocials = socials.filter(s => s.verification_status === "verified");

  const signals = [
    { label: "Username claimed",          done: !!profile.username },
    { label: "Display name + avatar",     done: !!profile.avatar_url && !!profile.display_name },
    { label: "Bio + at least one link",   done: (profile.bio?.length ?? 0) >= 10 && linksCount >= 1 },
    { label: "Stripe payouts active",     done: hasStripe },
    { label: `Verified socials (${verifiedSocials.length})`, done: verifiedSocials.length > 0 },
    { label: "Domain verified",           done: !!profile.domain_verified },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{`Verification · @${profile.username} · Verifiedly`}</title>
        <meta name="description" content={`Public verification status for ${profile.display_name || profile.username} on Verifiedly. Trust Score ${score}/100.`} />
        <link rel="canonical" href={`https://verifiedly.app/verify/${profile.username}`} />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link to={`/${profile.username}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to profile
        </Link>

        <div className="text-center mb-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">Verification status</p>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight">
            {profile.display_name || profile.username}
          </h1>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
          <div className="mt-3 flex justify-center">
            <TrustScore score={score} isElite={!!profile.is_elite} />
          </div>
        </div>

        <Card className="p-6 mb-6">
          <h2 className="font-display font-semibold mb-3">What's verified</h2>
          <ul className="divide-y divide-border">
            {signals.map(s => (
              <li key={s.label} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center ${s.done ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}>
                    {s.done ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  </span>
                  <span className="text-sm">{s.label}</span>
                </div>
                <span className="text-xs text-muted-foreground">{s.done ? "Verified" : "Not yet"}</span>
              </li>
            ))}
          </ul>
        </Card>

        {verifiedSocials.length > 0 && (
          <Card className="p-6 mb-6">
            <h2 className="font-display font-semibold mb-3">Verified socials</h2>
            <ul className="space-y-2">
              {verifiedSocials.map(s => {
                const urlFn = PLATFORM_URL[s.platform];
                return (
                  <li key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                    <div>
                      <p className="text-sm font-medium capitalize">{s.platform}</p>
                      <p className="text-xs text-muted-foreground">@{s.handle}</p>
                    </div>
                    {urlFn && (
                      <a href={urlFn(s.handle)} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                        Visit <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        )}

        <Card className="p-4 text-center bg-secondary">
          <p className="text-xs text-muted-foreground">
            Verifiedly verification is built on factual, opt-in signals — Stripe payout status,
            social account ownership, email confirmation, and more. The creator can remove any
            signal at any time.
          </p>
          <Link to="/" className="text-xs underline mt-2 inline-block">How verification works</Link>
        </Card>
      </div>
    </div>
  );
};

export default PublicVerification;