import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Loader2, CheckCircle2, XCircle, Clock, Lock } from "lucide-react";
import VerifiedBadge from "@/components/VerifiedBadge";
import DashboardShell from "@/components/dashboard/DashboardShell";

const Verification = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const load = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/login"); return; }
    const { data: p } = await supabase.from("profiles")
      .select("id, username, verification_status, id_verified, verified_at, verified_full_name, verified_country, show_legal_name")
      .eq("id", session.user.id).maybeSingle();
    setProfile(p);
    setLoading(false);
  };

  const sync = async (checkoutSessionId?: string) => {
    try {
      await supabase.functions.invoke("check-identity-status", {
        body: checkoutSessionId ? { checkout_session_id: checkoutSessionId } : {},
      });
    } catch { /* ignore */ }
    await load();
  };

  useEffect(() => {
    const paid = params.get("paid");
    const sessionId = params.get("session_id");
    const verified = params.get("verified");
    (async () => {
      await load();
      if (paid || verified || sessionId) {
        await sync(sessionId || undefined);
        params.delete("paid"); params.delete("session_id"); params.delete("verified"); params.delete("canceled");
        setParams(params, { replace: true });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCheckout = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-identity-checkout");
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (e: any) {
      toast({ title: "Couldn't start", description: e.message || String(e), variant: "destructive" });
    } finally { setBusy(false); }
  };

  const startIdScan = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-identity-session");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) window.location.href = data.url;
    } catch (e: any) {
      toast({ title: "Couldn't start ID scan", description: e.message || String(e), variant: "destructive" });
    } finally { setBusy(false); }
  };

  const toggleLegalName = async (v: boolean) => {
    if (!profile?.id) return;
    await supabase.from("profiles").update({ show_legal_name: v } as any).eq("id", profile.id);
    setProfile({ ...profile, show_legal_name: v });
  };

  if (loading) {
    return <DashboardShell title="Verification"><div className="p-8 text-sm text-muted-foreground">Loading…</div></DashboardShell>;
  }

  const status = profile?.verification_status || "unverified";
  const isVerified = !!profile?.id_verified;

  return (
    <DashboardShell title="Verification">
      <div className="container mx-auto max-w-2xl py-8 px-4 space-y-6">
        {/* Status card */}
        <Card className="p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">Identity verification</p>
              {isVerified ? (
                <div className="flex items-center gap-2">
                  <VerifiedBadge className="w-8 h-8" />
                  <div>
                    <p className="text-2xl font-display font-bold">Verified</p>
                    <p className="text-xs text-muted-foreground">Blue checkmark active on your profile</p>
                  </div>
                </div>
              ) : status === "processing" ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-display font-bold">Reviewing…</p>
                    <p className="text-xs text-muted-foreground">Stripe is checking your ID. This usually takes a few minutes.</p>
                  </div>
                </div>
              ) : status === "failed" ? (
                <div className="flex items-center gap-2">
                  <XCircle className="w-6 h-6 text-destructive" />
                  <div>
                    <p className="text-2xl font-display font-bold">Try again</p>
                    <p className="text-xs text-muted-foreground">Your ID couldn't be verified. You can retry the scan below.</p>
                  </div>
                </div>
              ) : status === "paid" ? (
                <div className="flex items-center gap-2">
                  <Clock className="w-6 h-6 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-display font-bold">Paid — one step left</p>
                    <p className="text-xs text-muted-foreground">Scan your government ID + take a quick selfie to finish.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-display font-bold">Not verified yet</p>
                    <p className="text-xs text-muted-foreground">Prove you're real to unlock the blue checkmark.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-2">
            {isVerified ? (
              <Button variant="outline" onClick={() => sync()}><CheckCircle2 className="w-4 h-4 mr-2" /> Refresh status</Button>
            ) : status === "processing" ? (
              <Button onClick={() => sync()} disabled={busy}><Loader2 className={`w-4 h-4 mr-2 ${busy ? "animate-spin" : ""}`} /> Check status</Button>
            ) : status === "paid" || status === "failed" ? (
              <Button onClick={startIdScan} disabled={busy}>
                {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                {status === "failed" ? "Retry ID scan" : "Start ID scan"}
              </Button>
            ) : (
              <Button onClick={startCheckout} disabled={busy} size="lg">
                {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                Verify my identity — $5.99
              </Button>
            )}
          </div>
        </Card>

        {/* How it works */}
        {!isVerified && (
          <Card className="p-6">
            <h2 className="font-display font-semibold mb-4">How it works</h2>
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3"><span className="w-6 h-6 rounded-full bg-foreground text-background text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                <div><p className="font-medium">Pay a one-time $5.99 verification fee</p><p className="text-xs text-muted-foreground">Covers the cost of Stripe Identity + a small platform fee. Non-refundable once the ID scan runs.</p></div>
              </li>
              <li className="flex gap-3"><span className="w-6 h-6 rounded-full bg-foreground text-background text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                <div><p className="font-medium">Scan your government ID + a quick selfie</p><p className="text-xs text-muted-foreground">Handled entirely by Stripe Identity — takes about 2 minutes on your phone.</p></div>
              </li>
              <li className="flex gap-3"><span className="w-6 h-6 rounded-full bg-foreground text-background text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                <div><p className="font-medium">Get your blue checkmark</p><p className="text-xs text-muted-foreground">Shows on your profile, your Sign in with Verifiedly OAuth, and any app that reads your identity.</p></div>
              </li>
            </ol>
          </Card>
        )}

        {/* Verified details */}
        {isVerified && (
          <Card className="p-6 space-y-4">
            <h2 className="font-display font-semibold">Verified details</h2>
            <dl className="text-sm space-y-2">
              <div className="flex justify-between"><dt className="text-muted-foreground">Legal name</dt><dd className="font-medium">{profile.verified_full_name || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Country</dt><dd className="font-medium">{profile.verified_country || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Verified on</dt><dd className="font-medium">{profile.verified_at ? new Date(profile.verified_at).toLocaleDateString() : "—"}</dd></div>
            </dl>
            <label className="flex items-start gap-2 p-3 rounded-md border border-border cursor-pointer">
              <input type="checkbox" checked={!!profile.show_legal_name} onChange={(e) => toggleLegalName(e.target.checked)} className="mt-0.5" />
              <span className="text-sm">
                <span className="font-medium">Show my legal name publicly</span>
                <span className="block text-xs text-muted-foreground">Displays next to your display name on your public profile. Off by default.</span>
              </span>
            </label>
          </Card>
        )}

        <Card className="p-4 bg-secondary">
          <div className="flex gap-2 text-xs text-muted-foreground">
            <Lock className="w-4 h-4 shrink-0 mt-0.5" />
            <p>We only store your name, country, and date of birth (for age checks). We don't keep the ID document — Stripe handles that.</p>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
};

export default Verification;
