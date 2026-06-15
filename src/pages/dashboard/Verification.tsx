import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Check, Plus, Trash2, Shield, MessageSquareWarning,
  Mail, AtSign, Image as ImageIcon, FileText, CreditCard, Share2, Globe, ChevronRight, ChevronDown,
} from "lucide-react";
import VerifiedBadge from "@/components/VerifiedBadge";
import DashboardShell from "@/components/dashboard/DashboardShell";

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
  const [expanded, setExpanded] = useState<string | null>(null);
  const [customDomain, setCustomDomain] = useState("");

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
    setCustomDomain(p?.verified_domain || "");
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
      verification_status: "verified",
      last_checked_at: new Date().toISOString(),
    });
    setBusy(false);
    if (error) { toast({ title: "Couldn't add", description: error.message, variant: "destructive" }); return; }
    setNewHandle("");
    toast({ title: "Social verified" });
    await recompute(userId);
  };

  const removeSocial = async (id: string) => {
    if (!userId) return;
    await (supabase.from("verified_socials" as any) as any).delete().eq("id", id);
    await recompute(userId);
  };

  const saveDomain = async () => {
    if (!userId) return;
    const d = customDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(d)) {
      toast({ title: "Enter a valid domain", description: "Example: yourname.com", variant: "destructive" });
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("profiles")
      .update({ verified_domain: d, domain_verified: true } as any)
      .eq("id", userId);
    setBusy(false);
    if (error) { toast({ title: "Couldn't save", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Domain saved", description: "Custom-domain profile unlocked. Point an A record to 185.158.133.1 to go live." });
    await recompute(userId);
  };

  const removeDomain = async () => {
    if (!userId) return;
    await supabase.from("profiles").update({ verified_domain: null, domain_verified: false } as any).eq("id", userId);
    setCustomDomain("");
    await recompute(userId);
  };

  const score = profile?.trust_score ?? 0;
  const hasBio = (profile?.bio?.length ?? 0) >= 10 && linksCount >= 1;
  const hasAvatar = !!profile?.avatar_url;
  const hasUsername = (profile?.username?.length ?? 0) >= 3;
  const verifiedSocials = socials.filter(s => s.verification_status === "verified");

  const checklist = [
    {
      id: "email", icon: Mail, title: "Confirm your email", points: 10, done: emailConfirmed,
      skip: "Without email confirmation we can't recover your account or pay you out.",
      action: emailConfirmed ? null : <p className="text-xs text-muted-foreground">Check your inbox for the confirmation link.</p>,
    },
    {
      id: "username", icon: AtSign, title: "Claim your username", points: 5, done: hasUsername,
      skip: "Skip and your profile URL stays an auto-generated string.",
      action: <Link to="/dashboard/settings"><Button size="sm" variant="outline">Edit username</Button></Link>,
    },
    {
      id: "avatar", icon: ImageIcon, title: "Upload a profile photo", points: 5, done: hasAvatar,
      skip: "Profiles without a photo feel anonymous and convert ~40% worse.",
      action: <Link to="/dashboard/settings"><Button size="sm" variant="outline">Upload photo</Button></Link>,
    },
    {
      id: "bio", icon: FileText, title: "Add a bio + at least one link", points: 10, done: hasBio,
      skip: "Empty profiles look abandoned to fans and brands.",
      action: <Link to="/dashboard/links"><Button size="sm" variant="outline">Add links</Button></Link>,
    },
    {
      id: "stripe", icon: CreditCard, title: "Connect Stripe payouts", points: 30, done: stripeOk,
      skip: "You can't accept payments, tips or subscriptions until this is done.",
      action: <Link to="/dashboard/monetization"><Button size="sm">Connect payouts</Button></Link>,
    },
    {
      id: "socials", icon: Share2, title: `Verify your social accounts (${verifiedSocials.length}/2)`, points: 30, done: verifiedSocials.length > 0,
      skip: "Verified socials are the fastest way to reach the badge threshold.",
      action: null, // handled in tab below
    },
    {
      id: "domain", icon: Globe, title: "Verify your own domain", points: 10, done: !!profile?.domain_verified, optional: true,
      skip: "Optional — gives a small boost and unlocks a custom-domain profile (yourname.com instead of /username).",
      action: (
        <div className="space-y-2 max-w-md">
          {profile?.domain_verified ? (
            <div className="flex items-center justify-between gap-2 p-2 rounded-md bg-secondary">
              <div className="text-xs">
                <p className="font-medium text-foreground">{profile?.verified_domain}</p>
                <p className="text-muted-foreground">Custom-domain profile unlocked.</p>
              </div>
              <Button size="sm" variant="ghost" onClick={removeDomain}><Trash2 className="w-4 h-4" /></Button>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <Input placeholder="yourname.com" value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} />
                <Button size="sm" onClick={saveDomain} disabled={busy}>Verify</Button>
              </div>
              <p className="text-[11px] text-muted-foreground">After saving, point an <code className="px-1 py-0.5 bg-muted rounded">A</code> record to <code className="px-1 py-0.5 bg-muted rounded">185.158.133.1</code> at your registrar.</p>
            </>
          )}
        </div>
      ),
    },
  ];

  const totalPossible = checklist.reduce((s, c) => s + c.points, 0);
  const earned = checklist.reduce((s, c) => s + (c.done ? c.points : 0), 0);
  const percent = Math.min(100, Math.round((score / 80) * 100));
  const isVerified = score >= 80;

  return (
    <DashboardShell title="Verification">
      <div className="container mx-auto max-w-3xl py-8 px-4 space-y-6">
        {loading ? <div className="text-sm text-muted-foreground">Loading…</div> : null}

        {/* Score card */}
        <Card className="p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">Trust Score</p>
              <p className="text-5xl font-display font-bold tabular-nums">{score}<span className="text-xl text-muted-foreground">/100</span></p>
              <p className="text-xs text-muted-foreground mt-2">
                {isVerified ? "You're verified ✓" : `${80 - score} points to the verified badge`}
              </p>
            </div>
            {isVerified && <VerifiedBadge className="w-10 h-10" />}
          </div>

          {/* Progress bar with 80 marker */}
          <div className="mt-5">
            <div className="relative h-3 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-foreground transition-all" style={{ width: `${Math.min(100, score)}%` }} />
              <div className="absolute top-0 bottom-0" style={{ left: "80%" }}>
                <div className="w-px h-full bg-foreground/60" />
              </div>
            </div>
            <div className="relative h-4 mt-1 text-[10px] text-muted-foreground">
              <span className="absolute left-0">0</span>
              <span className="absolute" style={{ left: "calc(80% - 20px)" }}>Verified at 80</span>
              <span className="absolute right-0">100</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            {earned} of {totalPossible} signal points completed.{" "}
            {userId && <button className="underline" onClick={() => recompute(userId)}>Recalculate</button>}
          </p>
        </Card>

        <Tabs defaultValue="checklist">
          <TabsList>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
            <TabsTrigger value="socials">Verified socials</TabsTrigger>
            <TabsTrigger value="more" className="gap-1"><Shield className="w-3.5 h-3.5" /> Privacy &amp; disputes</TabsTrigger>
          </TabsList>

          <TabsContent value="checklist">
            <Card className="p-2 sm:p-3">
              <ul className="divide-y divide-border">
                {checklist.map((c) => {
                  const isOpen = expanded === c.id;
                  return (
                    <li key={c.id}>
                      <button
                        onClick={() => setExpanded(isOpen ? null : c.id)}
                        className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 rounded-md transition-colors"
                      >
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                          c.done ? "bg-foreground text-background" : "border-2 border-border text-muted-foreground"
                        }`}>
                          {c.done ? <Check className="w-3.5 h-3.5" /> : <c.icon className="w-3.5 h-3.5" />}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium flex items-center gap-2">
                            {c.title}
                            {c.optional && <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Optional</span>}
                          </p>
                          {!c.done && !isOpen && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">If skipped: {c.skip}</p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums shrink-0">+{c.points}</span>
                        {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      </button>
                      {isOpen && (
                        <div className="px-12 pb-4 space-y-3">
                          {!c.done && (
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">If you skip this:</span> {c.skip}
                            </p>
                          )}
                          {c.action}
                          {c.id === "socials" && (
                            <p className="text-xs text-muted-foreground">Add and verify socials in the next tab →</p>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Card>
          </TabsContent>

          <TabsContent value="socials">
            <Card className="p-5 space-y-4">
              <div>
                <h2 className="font-display font-semibold">Verified socials</h2>
                <p className="text-xs text-muted-foreground">15 points each, up to 30 points total.</p>
              </div>

              {socials.length > 0 && (
                <ul className="space-y-3">
                  {socials.map((s) => {
                    const meta = PLATFORMS.find(p => p.id === s.platform);
                    return (
                      <li key={s.id} className="p-3 rounded-lg bg-secondary">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium flex items-center gap-2 flex-wrap">
                              {meta?.label || s.platform}
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-background border">
                                <Check className="w-3 h-3" /> verified
                              </span>
                            </p>
                            <a href={`${meta?.urlBase || ""}${s.handle}`} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-foreground">@{s.handle}</a>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => removeSocial(s.id)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr_auto] gap-2">
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={newPlatform} onChange={(e) => setNewPlatform(e.target.value)}>
                  {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
                <div>
                  <Label htmlFor="handle" className="sr-only">Handle</Label>
                  <Input id="handle" placeholder="yourhandle" value={newHandle} onChange={(e) => setNewHandle(e.target.value)} />
                </div>
                <Button onClick={addSocial} disabled={busy || !newHandle.trim()} className="gap-1"><Plus className="w-4 h-4" /> Add</Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="more">
            <div className="grid sm:grid-cols-2 gap-3">
              <Link to="/dashboard/privacy-controls">
                <Card className="p-5 card-hover h-full">
                  <Shield className="w-5 h-5 mb-2" />
                  <p className="font-display font-semibold">Privacy controls</p>
                  <p className="text-xs text-muted-foreground mt-1">Opt out of Trust Score or hide signals from your public page.</p>
                </Card>
              </Link>
              <Link to="/dashboard/disputes">
                <Card className="p-5 card-hover h-full">
                  <MessageSquareWarning className="w-5 h-5 mb-2" />
                  <p className="font-display font-semibold">Disputes</p>
                  <p className="text-xs text-muted-foreground mt-1">Request a manual review if a signal was rejected unfairly.</p>
                </Card>
              </Link>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
};

export default Verification;
