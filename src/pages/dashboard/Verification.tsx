import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Building2, CheckCircle2, Clock, Loader2, Lock, ShieldCheck, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import VerifiedBadge from "@/components/VerifiedBadge";
import DashboardShell from "@/components/dashboard/DashboardShell";

interface VerificationProfile {
  id: string;
  username: string;
  account_type: string | null;
  verification_status: string;
  id_verified: boolean;
  verified_at: string | null;
  verified_full_name: string | null;
  verified_country: string | null;
}

const messageFor = (error: unknown) => error instanceof Error ? error.message : "Please try again.";

const Verification = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [profile, setProfile] = useState<VerificationProfile | null>(null);

  const refreshStatus = async (checkoutSessionId?: string, showError = true) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    const { data, error } = await supabase.functions.invoke<VerificationProfile>("check-identity-status", {
      body: checkoutSessionId ? { checkout_session_id: checkoutSessionId } : {},
    });
    if (error || !data) {
      if (showError) {
        toast({ title: "Verification status unavailable", description: error?.message || "Please try again.", variant: "destructive" });
      }
      setLoading(false);
      return;
    }

    setProfile(data);
    setLoading(false);
  };

  useEffect(() => {
    const paid = params.get("paid");
    const sessionId = params.get("session_id");
    const verified = params.get("verified");
    void refreshStatus(sessionId || undefined, false);

    if (paid || verified || sessionId || params.get("canceled")) {
      const clean = new URLSearchParams(params);
      clean.delete("paid");
      clean.delete("session_id");
      clean.delete("verified");
      clean.delete("canceled");
      setParams(clean, { replace: true });
    }
    // Run once for the status attached to the return URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCheckout = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke<{ url?: string }>("create-identity-checkout");
      if (error) throw error;
      if (!data?.url) throw new Error("Checkout did not return a secure payment link.");
      window.location.assign(data.url);
    } catch (error: unknown) {
      toast({ title: "Could not start verification", description: messageFor(error), variant: "destructive" });
      setBusy(false);
    }
  };

  const startIdScan = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke<{ url?: string; error?: string }>("create-identity-session", { body: {} });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.url) throw new Error("Stripe did not return a secure verification link.");
      window.location.assign(data.url);
    } catch (error: unknown) {
      toast({ title: "Could not start the ID check", description: messageFor(error), variant: "destructive" });
      setBusy(false);
    }
  };

  if (loading) {
    return <DashboardShell title="Verification"><div className="p-8 text-sm text-muted-foreground">Loading…</div></DashboardShell>;
  }

  if (!profile) {
    return (
      <DashboardShell title="Verification">
        <div className="container mx-auto max-w-2xl px-4 py-8">
          <Card className="p-6 text-center">
            <p className="font-medium">Verification status could not be loaded.</p>
            <Button className="mt-4" variant="outline" onClick={() => { setLoading(true); void refreshStatus(); }}>Try again</Button>
          </Card>
        </div>
      </DashboardShell>
    );
  }

  const status = profile.verification_status || "unverified";
  const isVerified = profile.id_verified;
  const isOrganization = profile.account_type === "business";
  const badgeLabel = isOrganization ? "Account holder verified" : "Identity verified";

  return (
    <DashboardShell title="Verification">
      <div className="container mx-auto max-w-2xl py-8 px-4 space-y-6">
        <Card className="p-6">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Identity verification</p>
          {isVerified ? (
            <div className="flex items-center gap-2">
              <VerifiedBadge className="h-8 w-8" label={badgeLabel} />
              <div>
                <p className="text-2xl font-display font-bold">{badgeLabel}</p>
                <p className="text-xs text-muted-foreground">One blue badge is active on your profile.</p>
              </div>
            </div>
          ) : status === "processing" ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <div><p className="text-2xl font-display font-bold">Reviewing…</p><p className="text-xs text-muted-foreground">Stripe is checking your information.</p></div>
            </div>
          ) : status === "failed" || status === "requires_input" ? (
            <div className="flex items-center gap-2">
              <XCircle className="h-6 w-6 text-destructive" />
              <div><p className="text-2xl font-display font-bold">More information needed</p><p className="text-xs text-muted-foreground">You can retry the secure Stripe check below.</p></div>
            </div>
          ) : status === "paid" ? (
            <div className="flex items-center gap-2">
              <Clock className="h-6 w-6 text-muted-foreground" />
              <div><p className="text-2xl font-display font-bold">Payment complete</p><p className="text-xs text-muted-foreground">Start the secure ID check to finish.</p></div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-muted-foreground" />
              <div><p className="text-2xl font-display font-bold">Not verified</p><p className="text-xs text-muted-foreground">Verification is optional.</p></div>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            {isVerified || status === "processing" ? (
              <Button onClick={() => { setBusy(true); void refreshStatus().finally(() => setBusy(false)); }} disabled={busy} variant={isVerified ? "outline" : "default"}>
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} Refresh status
              </Button>
            ) : status === "paid" || status === "failed" || status === "requires_input" ? (
              <Button onClick={startIdScan} disabled={busy}>
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                {status === "failed" || status === "requires_input" ? "Continue secure ID check" : "Start secure ID check"}
              </Button>
            ) : (
              <Button onClick={startCheckout} disabled={busy} size="lg">
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                Verify identity — $12.99
              </Button>
            )}
          </div>
        </Card>

        {isOrganization && (
          <Card className="p-5">
            <div className="flex gap-3">
              <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Organization profile</p>
                <p className="mt-1 text-xs text-muted-foreground">This check verifies the account holder as an individual. It does not verify the organization as a legal entity.</p>
              </div>
            </div>
          </Card>
        )}

        {!isVerified && (
          <Card className="p-6">
            <h2 className="mb-4 font-display font-semibold">How it works</h2>
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3"><span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground text-xs text-background">1</span><div><p className="font-medium">Pay $12.99 for one attempt</p><p className="text-xs text-muted-foreground">The fee covers the verification attempt, not a guaranteed result.</p></div></li>
              <li className="flex gap-3"><span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground text-xs text-background">2</span><div><p className="font-medium">Continue securely with Stripe Identity</p><p className="text-xs text-muted-foreground">Stripe collects the government ID and selfie used for the check.</p></div></li>
              <li className="flex gap-3"><span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground text-xs text-background">3</span><div><p className="font-medium">A successful check adds one badge</p><p className="text-xs text-muted-foreground">The badge confirms identity, not every statement or credential on the profile.</p></div></li>
            </ol>
          </Card>
        )}

        {isVerified && (
          <Card className="space-y-4 p-6">
            <h2 className="font-display font-semibold">Private verification details</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Legal name</dt><dd className="text-right font-medium">{profile.verified_full_name || "—"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Country</dt><dd className="text-right font-medium">{profile.verified_country || "—"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Verified on</dt><dd className="text-right font-medium">{profile.verified_at ? new Date(profile.verified_at).toLocaleDateString() : "—"}</dd></div>
            </dl>
            <p className="text-xs text-muted-foreground">These details are shown to you here and are not added to your public profile.</p>
          </Card>
        )}

        <Card className="bg-secondary p-4">
          <div className="flex gap-2 text-xs text-muted-foreground">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Verifiedly stores the result and limited verification details. Stripe handles the raw ID document and selfie.</p>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
};

export default Verification;
