import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check, X, Plus, Trash2, Copy, RefreshCw, Clock } from "lucide-react";
import { Shield, MessageSquareWarning } from "lucide-react";
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

  const issueCode = async (socialId: string) => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("verify-social", {
      body: { social_id: socialId, action: "issue" },
    });
    setBusy(false);
    if (error || data?.error) {
      toast({ title: "Couldn't issue code", description: error?.message || data?.message || data?.error, variant: "destructive" });
      return;
    }
    if (userId) await load(userId);
    toast({ title: "Code ready", description: "Paste it into your social bio, then click Verify." });
  };

  const checkCode = async (socialId: string) => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("verify-social", {
      body: { social_id: socialId, action: "check" },
    });
    setBusy(false);
    if (error) {
      toast({ title: "Check failed", description: error.message, variant: "destructive" });
      return;
    }
    if (data?.status === "verified") {
      toast({ title: "Verified ✓", description: data.message });
    } else {
      toast({ title: "Not verified yet", description: data?.message || "Try again in a minute.", variant: "destructive" });
    }
    if (userId) await load(userId);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied", description: "Paste it into your social bio." });
  };

  const score = profile?.trust_score ?? 0;
  const isElite = !!profile?.is_elite;

  const hasBio = (profile?.bio?.length ?? 0) >= 10 && linksCount >= 1;
  const hasAvatar = !!profile?.avatar_url;
  const hasUsername = (profile?.username?.length ?? 0) >= 3;
  const verifiedSocials = socials.filter(s => s.verification_status === "verified");
  const socialPts = Math.min(verifiedSocials.length * 15, 30);

  const signals: TrustSignal[] = [
    { label: "Email confirmed",              done: emailConfirmed, points: 10 },
    { label: "Username claimed",             done: hasUsername,    points: 5 },
    { label: "Avatar uploaded",              done: hasAvatar,      points: 5 },
    { label: "Bio + at least one link",      done: hasBio,         points: 10 },
    { label: "Stripe payouts active",        done: stripeOk,       points: 30 },
    { label: `Verified socials (${verifiedSocials.length}/2)`, done: socialPts > 0, points: 30 },
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
          <div className="mt-4 flex flex-wrap gap-2">
            {userId && (
              <Button variant="outline" size="sm" onClick={() => recompute(userId)}>
                Recalculate
              </Button>
            )}
            <Link to="/dashboard/privacy-controls">
              <Button variant="ghost" size="sm" className="gap-1"><Shield className="w-3.5 h-3.5" /> Privacy controls</Button>
            </Link>
            <Link to="/dashboard/disputes">
              <Button variant="ghost" size="sm" className="gap-1"><MessageSquareWarning className="w-3.5 h-3.5" /> Disputes</Button>
            </Link>
          </div>
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
            <ul className="space-y-3 mb-4">
              {socials.map((s) => {
                const meta = PLATFORMS.find(p => p.id === s.platform);
                const status = s.verification_status as "pending" | "verified" | "failed";
                const statusMeta = status === "verified"
                  ? { label: "Verified",  cls: "bg-foreground text-background", Icon: Check }
                  : status === "failed"
                  ? { label: "Failed",    cls: "bg-destructive text-destructive-foreground", Icon: X }
                  : { label: "Pending",   cls: "bg-muted text-muted-foreground", Icon: Clock };
                const Icon = statusMeta.Icon;
                return (
                  <li key={s.id} className="p-3 rounded-lg bg-secondary space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium">{meta?.label || s.platform}</p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusMeta.cls}`}>
                            <Icon className="w-3 h-3" /> {statusMeta.label}
                          </span>
                        </div>
                        <a href={`${meta?.urlBase || ""}${s.handle}`} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-foreground">
                          @{s.handle}
                        </a>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeSocial(s.id)} aria-label="Remove">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {status !== "verified" && (
                      <div className="rounded-md bg-background border border-border p-3 space-y-2">
                        {s.verification_code ? (
                          <>
                            <p className="text-[11px] text-muted-foreground">
                              Paste this code anywhere in your public {meta?.label || s.platform} bio, save, then click Verify.
                            </p>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 text-xs bg-muted px-2 py-1.5 rounded font-mono truncate">{s.verification_code}</code>
                              <Button variant="outline" size="sm" onClick={() => copyCode(s.verification_code)} aria-label="Copy code">
                                <Copy className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" onClick={() => checkCode(s.id)} disabled={busy} className="gap-1">
                                <RefreshCw className="w-3.5 h-3.5" /> Verify now
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => issueCode(s.id)} disabled={busy}>
                                Regenerate code
                              </Button>
                            </div>
                          </>
                        ) : (
                          <Button size="sm" onClick={() => issueCode(s.id)} disabled={busy}>
                            Get verification code
                          </Button>
                        )}
                        {s.last_error && status === "failed" && (
                          <p className="text-[11px] text-destructive">{s.last_error}</p>
                        )}
                        {status === "failed" && (
                          <Link to="/dashboard/disputes" className="text-[11px] underline text-muted-foreground hover:text-foreground">
                            Request a manual review →
                          </Link>
                        )}
                      </div>
                    )}
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