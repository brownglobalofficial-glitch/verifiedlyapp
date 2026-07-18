import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  Clock3,
  ExternalLink,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import VerifiedBadge from "@/components/VerifiedBadge";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { useToast } from "@/hooks/use-toast";

type IdentityStatus = "unverified" | "processing" | "requires_input" | "verified" | "canceled";

interface VerificationProfile {
  id: string;
  username: string;
  account_type: string | null;
  id_verified: boolean;
  verified_at: string | null;
}

interface VerificationState {
  verification_payment_status: "unpaid" | "paid" | "refunded";
  verification_checkout_session_id: string | null;
  identity_status: IdentityStatus;
  identity_attempt_count: number;
}

const defaultState: VerificationState = {
  verification_payment_status: "unpaid",
  verification_checkout_session_id: null,
  identity_status: "unverified",
  identity_attempt_count: 0,
};

const Verification = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<"checkout" | "identity" | "refresh" | null>(null);
  const [profile, setProfile] = useState<VerificationProfile | null>(null);
  const [state, setState] = useState<VerificationState>(defaultState);
  const [eligible, setEligible] = useState(false);

  const load = useCallback(async (checkProvider = false) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login?next=/dashboard/verification");
      return;
    }

    const [profileResult, billingResult] = await Promise.all([
      supabase.from("profiles")
        .select("id, username, account_type, id_verified, verified_at")
        .eq("id", session.user.id)
        .maybeSingle(),
      supabase.from("verifiedly_billing")
        .select("verification_payment_status, verification_checkout_session_id, identity_status, identity_attempt_count")
        .eq("user_id", session.user.id)
        .maybeSingle(),
    ]);

    if (profileResult.data) setProfile(profileResult.data as VerificationProfile);
    if (billingResult.data) setState({ ...defaultState, ...(billingResult.data as VerificationState) });

    if (checkProvider) {
      const { data, error } = await supabase.functions.invoke("check-identity-status");
      if (!error && data && !data.error) {
        setState((current) => ({
          ...current,
          verification_payment_status: data.verification_payment_status ?? current.verification_payment_status,
          identity_status: data.identity_status ?? current.identity_status,
          identity_attempt_count: data.identity_attempt_count ?? current.identity_attempt_count,
        }));
        if (data.id_verified) {
          setProfile((current) => current ? {
            ...current,
            id_verified: true,
            verified_at: data.verified_at ?? current.verified_at,
          } : current);
        }
      }
    }

    setLoading(false);
  }, [navigate]);

  const startIdentity = useCallback(async (checkoutSessionId: string) => {
    setAction("identity");
    try {
      const { data, error } = await supabase.functions.invoke("create-identity-session", {
        body: { checkout_session_id: checkoutSessionId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.status === "verified") {
        await load(true);
        return;
      }
      if (data?.url) {
        window.location.assign(data.url);
        return;
      }
      await load(true);
    } catch (error) {
      toast({
        title: "Verification could not start",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setAction(null);
    }
  }, [load, toast]);

  useEffect(() => {
    const checkoutSessionId = searchParams.get("session_id");
    const checkoutSuccess = searchParams.get("checkout") === "success";
    const returnedFromIdentity = searchParams.get("identity") === "returned";

    void (async () => {
      await load(returnedFromIdentity);
      if (checkoutSuccess && checkoutSessionId) {
        setSearchParams({}, { replace: true });
        await startIdentity(checkoutSessionId);
      } else if (returnedFromIdentity) {
        setSearchParams({}, { replace: true });
      }
    })();
  }, [load, searchParams, setSearchParams, startIdentity]);

  const beginCheckout = async () => {
    if (!eligible) return;
    setAction("checkout");
    try {
      const { data, error } = await supabase.functions.invoke("create-identity-checkout");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.already_verified) {
        await load(true);
        return;
      }
      if (data?.already_paid && data.checkout_session_id) {
        await startIdentity(data.checkout_session_id);
        return;
      }
      if (!data?.url) throw new Error("Checkout did not return a secure URL.");
      window.location.assign(data.url);
    } catch (error) {
      toast({
        title: "Checkout could not open",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setAction(null);
    }
  };

  const refresh = async () => {
    setAction("refresh");
    await load(true);
    setAction(null);
  };

  const verified = !!profile?.id_verified || state.identity_status === "verified";
  const isOrganization = profile?.account_type === "business";
  const badgeLabel = isOrganization ? "Account holder identity verified" : "Identity verified";
  const checkoutId = state.verification_checkout_session_id;
  const canContinue = state.verification_payment_status === "paid" && !!checkoutId;
  const verifiedDate = useMemo(() => profile?.verified_at
    ? new Date(profile.verified_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : null, [profile?.verified_at]);

  if (loading) {
    return <DashboardShell title="Verification"><div className="p-8 text-sm text-muted-foreground">Loading…</div></DashboardShell>;
  }

  return (
    <DashboardShell title="Verification">
      <div className="mx-auto max-w-2xl space-y-5 px-4 py-6 sm:py-8">
        {verified ? (
          <Card className="rounded-3xl border-foreground/10 p-7 text-center shadow-sm sm:p-10">
            <VerifiedBadge className="mx-auto h-11 w-11" label={badgeLabel} />
            <h1 className="mt-5 text-2xl font-display font-bold">{badgeLabel}</h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Stripe Identity confirmed the account holder's government ID and selfie. This does not verify every claim on the public profile.
            </p>
            {verifiedDate && <p className="mt-4 text-xs font-medium text-muted-foreground">Checked {verifiedDate}</p>}
          </Card>
        ) : state.identity_status === "processing" ? (
          <Card className="rounded-3xl p-7 text-center shadow-sm sm:p-10">
            <Clock3 className="mx-auto h-9 w-9" />
            <h1 className="mt-5 text-2xl font-display font-bold">Check in progress</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Stripe is reviewing the submitted identity check. Most results arrive shortly.</p>
            <Button className="mt-6 gap-2" variant="outline" onClick={refresh} disabled={action === "refresh"}>
              <RefreshCw className={`h-4 w-4 ${action === "refresh" ? "animate-spin" : ""}`} /> Check status
            </Button>
          </Card>
        ) : (
          <Card className="overflow-hidden rounded-3xl border-foreground/10 shadow-sm">
            <div className="border-b bg-foreground px-6 py-7 text-background sm:px-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background/10">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-65">Verifiedly Identity</p>
                  <h1 className="mt-1 text-2xl font-display font-bold">Verify the person behind the profile</h1>
                </div>
              </div>
            </div>

            <div className="space-y-6 p-6 sm:p-8">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-3xl font-display font-bold">$9.99</p>
                  <p className="mt-1 text-xs text-muted-foreground">One-time Verifiedly service fee</p>
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">One retry when available</span>
              </div>

              <ul className="grid gap-3 text-sm sm:grid-cols-2">
                {[
                  "Government-issued photo ID",
                  "Selfie matched to the ID",
                  "Retry when Stripe requests new input",
                  "One identity badge after approval",
                ].map((item) => (
                  <li className="flex items-center gap-2" key={item}><Check className="h-4 w-4" /> {item}</li>
                ))}
              </ul>

              {state.identity_status === "requires_input" && (
                <div className="flex gap-3 rounded-2xl bg-amber-50 p-4 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p className="text-sm">Stripe needs a clearer image or additional input. Continue the existing check; you will not be charged again.</p>
                </div>
              )}

              {canContinue ? (
                <Button className="h-12 w-full gap-2 rounded-xl" onClick={() => void startIdentity(checkoutId!)} disabled={action !== null}>
                  {action === "identity" ? "Opening secure check…" : "Continue identity check"}
                  <ExternalLink className="h-4 w-4" />
                </Button>
              ) : (
                <>
                  <div className="flex items-start gap-3 rounded-2xl border p-4">
                    <Checkbox id="identity-eligibility" checked={eligible} onCheckedChange={(value) => setEligible(value === true)} className="mt-0.5" />
                    <Label htmlFor="identity-eligibility" className="cursor-pointer text-xs font-normal leading-relaxed text-muted-foreground">
                      I am 18 or older, I am verifying my own identity, and I consent to Stripe collecting my government ID and selfie for this check.
                    </Label>
                  </div>
                  <Button className="h-12 w-full rounded-xl" onClick={beginCheckout} disabled={!eligible || action !== null}>
                    {action === "checkout" ? "Opening secure checkout…" : "Pay $9.99 and verify"}
                  </Button>
                </>
              )}

              <div className="flex gap-3 text-xs leading-relaxed text-muted-foreground">
                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />
                <p>Stripe collects the ID and selfie. Verifiedly stores the session reference, result, and check date—not copies of the ID or selfie.</p>
              </div>
            </div>
          </Card>
        )}

        {isOrganization && (
          <Card className="rounded-2xl p-4 shadow-none">
            <div className="flex gap-3">
              <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Organization profile</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">This checks the identity of the account holder. It does not verify that the organization is legally registered or that the person is authorized to represent it.</p>
              </div>
            </div>
          </Card>
        )}

        <div className="flex items-start gap-3 rounded-2xl bg-muted/50 p-4 text-xs leading-relaxed text-muted-foreground">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <p>The badge means identity checked—not background checked, credential verified, trustworthy, endorsed, or guaranteed by Verifiedly.</p>
        </div>
      </div>
    </DashboardShell>
  );
};

export default Verification;
