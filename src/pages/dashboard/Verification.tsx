import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check, X, Plus, Trash2 } from "lucide-react";
import TrustScore, { TrustSignal } from "@/components/TrustScore";

const PLATFORMS = [
  { id: "instagram", label: "Instagram", urlBase: "https://instagram.com/" },
  { id: "tiktok",    label: "TikTok",    urlBase: "https://tiktok.com/@" },
  { id: "x",         label: "X / Twitter", urlBase: "https://x.com/" },
  { id: "youtube",   label: "YouTube",   urlBase: "https://youtube.com/@" },
  { id: "twitch",    label: "Twitch",    urlBase: "https://twitch.tv/" },
  { id: "linkedin",  label: "LinkedIn",  urlBase: "https://linkedin.com/in/" },
  { id: "github",    label: "GitHub",    urlBase: "https://github.com/" },
] as const;

const Verification = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [stripeOk, setStripeOk] = useState(false);
  const [linksCount, setLinksCount] = useState(0);
  const [socials, setSocials] = useState<any[]>([]);
  const [newPlatform, setNewPlatform] = useState<string>("instagram");
  const [newHandle, setNewHandle] = useState("");

  const load = async (uid: string) => {
    const [{ data: u }, { data: p }, { data: priv }, { count: lc }, { data: vs }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
      (supabase.from("creator_private_data" as any).select("stripe_charges_enabled").eq("id", uid).maybeSingle() as any),
      supabase.from("bio_links").select("*", { count: "exact", head: true }).eq("creator_id", uid),
      (supabase.from("verified_socials" as any).select("*").eq("user_id", uid) as any),
    ]);
    setEmailConfirmed(!!u?.user?.email_confirmed_at);
    setProfile(p);
    setStripeOk(!!priv?.stripe_charges_enabled);
    setLinksCount(lc || 0);
    setSocials(vs || []);
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/login"); return; }
      setUserId(session.user.id);
      load(session.user.id);
    });
  }, [navigate]);

  const recompute = async (uid: string) => {
    await (supabase.rpc as any)("recompute_trust_score", { _user_id: uid });
    await load(uid);
  };

  const addSocial = async () => {
    if (!userId || !newHandle.trim()) return;
    setBusy(true);
    const handle = newHandle.trim().replace(/^@/, "");
    const { error } = await (supabase.from("verified_socials" as any) as any).insert({
      user_id: userId, platform: newPlatform, handle, method: "manual",
    });
    setBusy(false);
    if (error) { toast({ title: "Couldn't add", description: error.message, variant: "destructive" }); return; }
    setNewHandle("");
    toast({ title: "Social added", description: "Your trust score has been updated." });
    await recompute(userId);
  };

  const removeSocial = async (id: string) => {
    if (!userId) return;
    await (supabase.from("verified_socials" as any) as any).delete().eq("id", id);
    await recompute(userId);
  };

  const score = profile?.trust_score ?? 0;
  const isElite = !!profile?.is_elite;

  const hasBio = (profile?.bio?.length ?? 0) >= 10 && linksCount >= 1;
  const hasAvatar = !!profile?.avatar_url;
  const hasUsername = (profile?.username?.length ?? 0) >= 3;
  const socialPts = Math.min(socials.length * 15, 30);

  const signals: TrustSignal[] = [
    { label: "Email confirmed",              done: emailConfirmed, points: 10 },
    { label: "Username claimed",             done: hasUsername,    points: 5 },
    { label: "Avatar uploaded",              done: hasAvatar,      points: 5 },
    { label: "Bio + at least one link",      done: hasBio,         points: 10 },
    { label: "Stripe payouts active",        done: stripeOk,       points: 30 },
    { label: `Verified socials (${socials.length}/2)`, done: socialPts > 0, points: 30 },
    { label: "Domain verified (optional)",   done: !!profile?.domain_verified, points: 10 },
  ];

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-sm text-muted-foreground">Loading…</div></div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-3xl">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-2">Verification</h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            Verifiedly is built on trust. Connect more signals to raise your public Trust Score —
            it appears on your profile and helps fans, brands, and partners see you're real.
          </p>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">Your Trust Score</p>
              <p className="text-5xl font-display font-bold tabular-nums">{score}<span className="text-xl text-muted-foreground">/100</span></p>
            </div>
            <TrustScore score={score} isElite={isElite} signals={signals} />
          </div>
          <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-foreground transition-all" style={{ width: `${score}%` }} />
          </div>
          {userId && (
            <Button variant="outline" size="sm" className="mt-4" onClick={() => recompute(userId)}>
              Recalculate
            </Button>
          )}
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="font-display font-semibold mb-4">Signals</h2>
          <ul className="divide-y divide-border">
            {signals.map((s) => (
              <li key={s.label} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center ${s.done ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}>
                    {s.done ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  </span>
                  <span className="text-sm">{s.label}</span>
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">+{s.points} pts</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-semibold">Verified socials</h2>
              <p className="text-xs text-muted-foreground">15 pts each, up to 30 pts total.</p>
            </div>
          </div>

          {socials.length > 0 && (
            <ul className="space-y-2 mb-4">
              {socials.map((s) => {
                const meta = PLATFORMS.find(p => p.id === s.platform);
                return (
                  <li key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                    <div>
                      <p className="text-sm font-medium">{meta?.label || s.platform}</p>
                      <a href={`${meta?.urlBase || ""}${s.handle}`} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-foreground">
                        @{s.handle}
                      </a>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeSocial(s.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr_auto] gap-2">
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={newPlatform}
              onChange={(e) => setNewPlatform(e.target.value)}
            >
              {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
            <div>
              <Label htmlFor="handle" className="sr-only">Handle</Label>
              <Input id="handle" placeholder="yourhandle" value={newHandle} onChange={(e) => setNewHandle(e.target.value)} />
            </div>
            <Button onClick={addSocial} disabled={busy || !newHandle.trim()} className="gap-1">
              <Plus className="w-4 h-4" /> Add
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">
            We only display what you've connected. You can remove a social at any time and your score
            will recalculate automatically.
          </p>
        </Card>

        {!stripeOk && (
          <Card className="p-4 border-dashed">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">Biggest boost: enable Stripe payouts</p>
                <p className="text-xs text-muted-foreground">+30 points and unlocks paid features.</p>
              </div>
              <Link to="/dashboard/settings"><Button size="sm">Connect Stripe</Button></Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Verification;