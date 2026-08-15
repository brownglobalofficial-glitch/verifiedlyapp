import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, Check, Clock3, ExternalLink, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import VerifiedBadge from "@/components/VerifiedBadge";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { useToast } from "@/hooks/use-toast";

type IdentityStatus = "unverified" | "processing" | "requires_input" | "verified" | "canceled";
type VerificationProfile = { id: string; username: string; id_verified: boolean; verified_at: string | null; is_pro: boolean | null };
type VerificationState = { identity_status: IdentityStatus; identity_attempt_count: number; pro_status: string | null };

const defaultState: VerificationState = { identity_status: "unverified", identity_attempt_count: 0, pro_status: null };
const identityEnabled = import.meta.env.VITE_STRIPE_IDENTITY_USE_CASE_APPROVED === "true";

const readFunctionError = async (error: unknown, data: unknown) => {
  if (data && typeof data === "object" && "error" in data && typeof (data as { error?: unknown }).error === "string") return (data as { error: string }).error;
  const context = error && typeof error === "object" && "context" in error ? (error as { context?: unknown }).context : null;
  if (context instanceof Response) {
    try {
      const payload = await context.clone().json();
      if (payload?.error && typeof payload.error === "string") return payload.error;
    } catch {
      // Fall through.
    }
  }
  return error instanceof Error ? error.message : "Verification could not start.";
};

const Verification = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<"identity" | "refresh" | null>(null);
  const [profile, setProfile] = useState<VerificationProfile | null>(null);
  const [state, setState] = useState<VerificationState>(defaultState);
  const [eligible, setEligible] = useState(false);

  const load = useCallback(async (checkProvider = false) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login?next=/dashboard/verification");
      return;
    }

    await supabase.functions.invoke("check-subscription").catch(() => undefined);
    const [profileResult, billingResult] = await Promise.all([
      supabase.from("profiles").select("id, username, id_verified, verified_at, is_pro").eq("id", session.user.id).maybeSingle(),
      supabase.from("verifiedly_billing").select("identity_status, identity_attempt_count, pro_status").eq("user_id", session.user.id).maybeSingle(),
    ]);
    if (profileResult.data) setProfile(profileResult.data as VerificationProfile);
    if (billingResult.data) setState({ ...defaultState, ...(billingResult.data as VerificationState) });

    if (checkProvider) {
      const { data, error } = await supabase.functions.invoke("check-identity-status");
      if (!error && data && !data.error) {
        setState((current) => ({ ...current, identity_status: data.identity_status ?? current.identity_status, identity_attempt_count: data.identity_attempt_count ?? current.identity_attempt_count }));
        if (data.id_verified) setProfile((current) => current ? { ...current, id_verified: true, verified_at: data.verified_at ?? current.verified_at } : current);
      }
    }
    setLoading(false);
  }, [navigate]);

  const startIdentity = useCallback(async () => {
    setAction("identity");
    try {
      const { data, error } = await supabase.functions.invoke("create-identity-session", { body: {} });
      if (error || data?.error) throw new Error(await readFunctionError(error, data));
      if (data?.status === "verified") return void await load(true);
      if (data?.url) return void window.location.assign(data.url);
      await load(true);
    } catch (error) {
      toast({ title: "Verification could not start", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally {
      setAction(null);
    }
  }, [load, toast]);

  useEffect(() => {
    const returned = searchParams.get("identity") === "returned";
    void (async () => {
      await load(returned);
      if (returned) setSearchParams({}, { replace: true });
    })();
  }, [load, searchParams, setSearchParams]);

  const refresh = async () => {
    setAction("refresh");
    await load(true);
    setAction(null);
  };

  const verified = Boolean(profile?.id_verified) || state.identity_status === "verified";
  const hasMembership = profile?.is_pro === true || state.pro_status === "active" || state.pro_status === "trialing";

  if (loading) return <DashboardShell title="Verify identity"><div className="p-8 text-sm text-muted-foreground">Loading…</div></DashboardShell>;

  return (
    <DashboardShell title="Verify identity">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
        {verified ? (
          <Card className="rounded-3xl border-foreground/10 p-8 text-center shadow-sm sm:p-10">
            <VerifiedBadge className="mx-auto h-11 w-11" label="Verifiedly Identity Verified" />
            <h1 className="mt-5 text-2xl font-display font-bold">Identity verified</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Stripe Identity successfully verified the adult account holder. The Identity Verified badge does not automatically verify Work, Education, organization authority or every profile claim.</p>
            {profile?.verified_at && <p className="mt-4 text-xs text-muted-foreground">Verified {new Date(profile.verified_at).toLocaleDateString()}</p>}
          </Card>
        ) : state.identity_status === "processing" ? (
          <Card className="rounded-3xl p-8 text-center shadow-sm sm:p-10">
            <Clock3 className="mx-auto h-9 w-9" />
            <h1 className="mt-5 text-2xl font-display font-bold">Verification in progress</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Stripe Identity is reviewing your submission.</p>
            <Button className="mt-6 gap-2" variant="outline" onClick={refresh} disabled={action === "refresh"}><RefreshCw className={`h-4 w-4 ${action === "refresh" ? "animate-spin" : ""}`} />Check status</Button>
          </Card>
        ) : !hasMembership ? (
          <Card className="overflow-hidden rounded-3xl border-foreground/10 shadow-sm">
            <div className="border-b bg-foreground px-6 py-7 text-background sm:px-8">
              <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-background/10"><Sparkles className="h-5 w-5" /></div><div><p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-65">Included with Verifiedly Membership</p><h1 className="mt-1 text-2xl font-display font-bold">Verify your identity</h1></div></div>
            </div>
            <div className="space-y-6 p-6 sm:p-8">
              <div><p className="text-3xl font-display font-bold">$50<span className="ml-1 text-sm font-normal text-muted-foreground">/year</span></p><p className="mt-1 text-xs text-muted-foreground">The annual Membership includes identity verification access, analytics and priority support.</p></div>
              <ul className="grid gap-3 text-sm sm:grid-cols-2">{["Stripe Identity access for eligible adults", "Badge after successful verification", "Organization verification", "Annual recurring Membership"].map((item) => <li className="flex items-center gap-2" key={item}><Check className="h-4 w-4" />{item}</li>)}</ul>
              <Button asChild className="h-12 w-full rounded-xl"><Link to="/dashboard/membership">View Verifiedly Membership</Link></Button>
              <p className="text-center text-xs leading-relaxed text-muted-foreground">Membership does not automatically grant the badge. Eligible adults must complete Stripe Identity successfully.</p>
            </div>
          </Card>
        ) : (
          <Card className="overflow-hidden rounded-3xl border-foreground/10 shadow-sm">
            <div className="border-b bg-foreground px-6 py-7 text-background sm:px-8">
              <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-background/10"><ShieldCheck className="h-5 w-5" /></div><div><p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-65">Included with your Membership</p><h1 className="mt-1 text-2xl font-display font-bold">Verify your identity</h1><p className="mt-1 text-xs opacity-70">Stripe Identity performs the ID and selfie check.</p></div></div>
            </div>
            <div className="space-y-6 p-6 sm:p-8">
              <div><p className="text-2xl font-display font-bold">No separate verification fee</p><p className="mt-1 text-xs text-muted-foreground">Available while your Verifiedly Membership is active and the supported use case is enabled.</p></div>
              <ul className="grid gap-3 text-sm sm:grid-cols-2">{["Government-issued photo ID", "Selfie identity check", "Secure Stripe Identity flow", "Badge after successful verification"].map((item) => <li className="flex items-center gap-2" key={item}><Check className="h-4 w-4" />{item}</li>)}</ul>
              {state.identity_status === "requires_input" && <div className="flex gap-3 rounded-2xl bg-amber-50 p-4 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><p className="text-sm">Stripe Identity needs another image or additional information. Continue your existing verification.</p></div>}
              <div className="flex items-start gap-3 rounded-2xl border p-4"><Checkbox id="identity-eligibility" checked={eligible} onCheckedChange={(value) => setEligible(value === true)} className="mt-0.5" /><Label htmlFor="identity-eligibility" className="cursor-pointer text-xs font-normal leading-relaxed text-muted-foreground">I am 18 or older, I am verifying my own identity, and I consent to Stripe collecting my government ID and selfie for this verification.</Label></div>
              <Button className="h-12 w-full rounded-xl" onClick={() => void startIdentity()} disabled={!identityEnabled || !eligible || action !== null}>{!identityEnabled ? "Verification temporarily unavailable" : action === "identity" ? "Opening secure verification…" : <>Continue to Stripe Identity <ExternalLink className="ml-2 h-4 w-4" /></>}</Button>
              <p className="text-center text-xs leading-relaxed text-muted-foreground">Stripe handles the identity check. Verifiedly receives the result and does not ordinarily store copies of your ID or selfie.</p>
            </div>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
};

export default Verification;
