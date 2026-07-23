import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, Check, Clock3, ExternalLink, RefreshCw, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import VerifiedBadge from "@/components/VerifiedBadge";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { useToast } from "@/hooks/use-toast";

interface ProfileState {
  username: string;
  id_verified: boolean;
  verified_at: string | null;
  is_pro: boolean | null;
}

interface BillingState {
  pro_status: string;
  identity_status: string;
  identity_attempt_count: number;
}

const Verification = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileState | null>(null);
  const [billing, setBilling] = useState<BillingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [adultConsent, setAdultConsent] = useState(false);
  const [action, setAction] = useState<"start" | "refresh" | null>(null);

  const load = useCallback(async (checkProvider = false) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login?next=/dashboard/verification");
      return;
    }

    const [profileResult, billingResult] = await Promise.all([
      supabase.from("profiles")
        .select("username, id_verified, verified_at, is_pro")
        .eq("id", session.user.id)
        .maybeSingle(),
      (supabase as any).from("verifiedly_billing")
        .select("pro_status, identity_status, identity_attempt_count")
        .eq("user_id", session.user.id)
        .maybeSingle(),
    ]);

    setProfile((profileResult.data || null) as ProfileState | null);
    setBilling((billingResult.data || null) as BillingState | null);

    if (checkProvider) {
      const { data, error } = await supabase.functions.invoke("check-identity-status");
      if (!error && data && !data.error) {
        setBilling((current) => ({
          pro_status: current?.pro_status || "inactive",
          identity_status: data.identity_status || current?.identity_status || "unverified",
          identity_attempt_count: data.identity_attempt_count ?? current?.identity_attempt_count ?? 0,
        }));
        if (data.id_verified) {
          setProfile((current) => current ? { ...current, id_verified: true, verified_at: data.verified_at || current.verified_at } : current);
        }
      }
    }
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    const returned = searchParams.get("identity") === "returned";
    void load(returned);
    if (returned) setSearchParams({}, { replace: true });
  }, [load, searchParams, setSearchParams]);

  const activePro = useMemo(
    () => ["active", "trialing"].includes(billing?.pro_status || "") || !!profile?.is_pro,
    [billing, profile],
  );
  const verified = !!profile?.id_verified || billing?.identity_status === "verified";

  const startIdentity = async () => {
    if (!adultConsent) return;
    setAction("start");
    try {
      const { data, error } = await supabase.functions.invoke("create-identity-session", { body: {} });
      if (error) throw error;
      if (data?.error) {
        if (data.code === "pro_required") navigate("/dashboard/pro");
        throw new Error(data.error);
      }
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
      toast({ title: "Verification could not start", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally {
      setAction(null);
    }
  };

  const refresh = async () => {
    setAction("refresh");
    await load(true);
    setAction(null);
  };

  if (loading) return <DashboardShell title="Verification"><div className="p-8 text-sm text-muted-foreground">Loading…</div></DashboardShell>;

  return (
    <DashboardShell title="Verification">
      <div className="mx-auto max-w-2xl px-4 py-7 sm:py-10">
        {verified ? (
          <Card className="rounded-3xl border-foreground/10 p-8 text-center shadow-sm sm:p-10">
            <VerifiedBadge className="mx-auto h-12 w-12" label="Identity Verified" />
            <h1 className="mt-5 text-2xl font-display font-bold">Identity Verified</h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">Stripe Identity confirmed the account holder's identity. This does not automatically verify employment, education, licenses, organizations, or other profile claims.</p>
            {profile?.verified_at && <p className="mt-4 text-xs text-muted-foreground">Verified {new Date(profile.verified_at).toLocaleDateString()}</p>}
            <Button asChild variant="outline" className="mt-6"><Link to={`/${profile?.username}`} target="_blank">View public badge</Link></Button>
          </Card>
        ) : !activePro ? (
          <Card className="rounded-3xl p-7 shadow-sm sm:p-9">
            <ShieldCheck className="h-9 w-9" />
            <h1 className="mt-5 text-2xl font-display font-bold">Identity verification is included with Verifiedly Pro</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Upgrade for identity-verification eligibility, priority support, analytics, advanced profile tools, and Tap Card benefits. A subscription does not guarantee a badge; the Stripe Identity check must succeed.</p>
            <ul className="mt-6 space-y-3 text-sm">
              {["Stripe-hosted government ID check", "Selfie comparison", "Identity Verified badge after approval", "Up to two included attempts before support review"].map((item) => <li key={item} className="flex items-center gap-2"><Check className="h-4 w-4" />{item}</li>)}
            </ul>
            <Button asChild className="mt-7 w-full"><Link to="/dashboard/pro">View Verifiedly Pro</Link></Button>
          </Card>
        ) : billing?.identity_status === "processing" ? (
          <Card className="rounded-3xl p-8 text-center shadow-sm sm:p-10">
            <Clock3 className="mx-auto h-9 w-9" />
            <h1 className="mt-5 text-2xl font-display font-bold">Verification in progress</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Stripe Identity is reviewing the submission.</p>
            <Button className="mt-6 gap-2" variant="outline" onClick={() => void refresh()} disabled={action === "refresh"}><RefreshCw className={`h-4 w-4 ${action === "refresh" ? "animate-spin" : ""}`} />Check status</Button>
          </Card>
        ) : (
          <Card className="overflow-hidden rounded-3xl border-foreground/10 shadow-sm">
            <div className="bg-foreground px-6 py-7 text-background sm:px-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background/10"><ShieldCheck className="h-5 w-5" /></div>
                <div><p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-65">Verifiedly Pro</p><h1 className="mt-1 text-2xl font-display font-bold">Verify your identity</h1><p className="mt-1 text-xs opacity-70">Identity verification powered by Stripe</p></div>
              </div>
            </div>

            <div className="space-y-6 p-6 sm:p-8">
              <p className="text-sm leading-relaxed text-muted-foreground">Stripe hosts the secure verification flow. Verifiedly stores the result and session reference, not copies of your ID or selfie.</p>
              <ul className="grid gap-3 text-sm sm:grid-cols-2">
                {["Government-issued photo ID", "Selfie identity check", "Secure Stripe-hosted flow", "Badge only after approval"].map((item) => <li className="flex items-center gap-2" key={item}><Check className="h-4 w-4" />{item}</li>)}
              </ul>

              {billing?.identity_status === "requires_input" && <div className="flex gap-3 rounded-2xl bg-amber-50 p-4 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><p className="text-sm">Stripe needs another image or additional information. Continue the existing verification flow.</p></div>}

              <div className="flex items-start gap-3 rounded-2xl border p-4">
                <Checkbox id="identity-eligibility" checked={adultConsent} onCheckedChange={(value) => setAdultConsent(value === true)} className="mt-0.5" />
                <Label htmlFor="identity-eligibility" className="cursor-pointer text-xs font-normal leading-relaxed text-muted-foreground">I am at least 18, I am verifying my own identity, and I consent to Stripe collecting my government ID and selfie for this check.</Label>
              </div>

              <Button className="h-12 w-full gap-2 rounded-xl" onClick={() => void startIdentity()} disabled={!adultConsent || action !== null}>{action === "start" ? "Opening secure verification…" : billing?.identity_status === "requires_input" ? "Continue verification" : "Start identity verification"}<ExternalLink className="h-4 w-4" /></Button>
              <p className="text-center text-[11px] leading-relaxed text-muted-foreground">Identity verification is limited to eligible adults. Contact <Link to="/dashboard/support" className="underline">support</Link> if Stripe cannot complete the check.</p>
            </div>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
};

export default Verification;
