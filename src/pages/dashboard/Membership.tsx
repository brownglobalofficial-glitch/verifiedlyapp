import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { BadgeCheck, BarChart3, Building2, Check, Loader2, ShieldCheck, Crown } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MEMBERSHIP_PRICE_LABEL } from "@/lib/stripe-config";

// Live charging is still gated server-side by VERIFIEDLY_MEMBERSHIP_ENABLED.
// The client no longer blocks the flow, so test-mode checkout works end to end.
const readFunctionError = async (error: unknown, data: unknown) => {
  if (data && typeof data === "object" && "error" in data && typeof (data as { error?: unknown }).error === "string") {
    return (data as { error: string }).error;
  }
  const context = error && typeof error === "object" && "context" in error
    ? (error as { context?: unknown }).context
    : null;
  if (context instanceof Response) {
    try {
      const payload = await context.clone().json();
      if (payload?.error && typeof payload.error === "string") return payload.error;
    } catch {
      // Fall through to the generic message below.
    }
  }
  return error instanceof Error ? error.message : "Stripe Checkout could not open.";
};

const benefits: [typeof ShieldCheck, string, string][] = [
  [ShieldCheck, "Identity verification", "Complete the Stripe Identity check as an eligible adult member."],
  [BadgeCheck, "Verified badge", "The Identity Verified badge appears on your profile after a successful check."],
  [Building2, "Organization verification", "Verify a business through the owner or representative identity check."],
  [BarChart3, "Profile analytics", "See how often your official profile is viewed, as analytics become available."],
];

const Membership = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login?next=/dashboard/membership");
      return;
    }

    await supabase.functions.invoke("check-subscription").catch(() => undefined);
    const [{ data: profile }, { data: billing }] = await Promise.all([
      supabase.from("profiles").select("is_pro").eq("id", session.user.id).maybeSingle(),
      supabase.from("verifiedly_billing")
        .select("pro_status, pro_current_period_end, pro_cancel_at_period_end")
        .eq("user_id", session.user.id)
        .maybeSingle(),
    ]);

    setIsMember(profile?.is_pro === true || billing?.pro_status === "active" || billing?.pro_status === "trialing");
    setPeriodEnd(billing?.pro_current_period_end || null);
    setCancelAtPeriodEnd(billing?.pro_cancel_at_period_end === true);
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      setSearchParams({}, { replace: true });
      toast({ title: "Membership payment received", description: "Stripe is confirming your annual Membership." });
      window.setTimeout(() => void load(), 1500);
    } else if (checkout === "cancelled") {
      setSearchParams({}, { replace: true });
      toast({ title: "Checkout canceled", description: "No Membership was started." });
    }
  }, [load, searchParams, setSearchParams, toast]);

  const beginCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-pro-checkout", { body: { interval: "year" } });
      if (error || data?.error) throw new Error(await readFunctionError(error, data));
      if (data?.already_member || data?.already_pro) {
        await load();
        return;
      }
      if (!data?.url) throw new Error("Stripe Checkout did not return a secure URL.");
      window.location.assign(data.url);
    } catch (error) {
      toast({
        title: "Membership checkout could not start",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
      setCheckoutLoading(false);
    }
  };

  const openPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", { body: { return_path: "/dashboard/membership" } });
      if (error || data?.error || !data?.url) throw new Error(await readFunctionError(error, data));
      window.location.assign(data.url);
    } catch (error) {
      toast({
        title: "Billing portal unavailable",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <DashboardShell title="Membership"><div className="p-8 text-sm text-muted-foreground">Loading Membership…</div></DashboardShell>;
  }

  const renewal = periodEnd ? new Date(periodEnd).toLocaleDateString() : null;

  return (
    <DashboardShell title="Membership">
      <div className="mx-auto w-full max-w-4xl overflow-x-hidden px-3 py-7 sm:px-4 sm:py-10">
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-background"><Crown className="h-6 w-6" /></div>
          <h1 className="mt-5 text-3xl font-display font-bold tracking-tight sm:text-4xl">Verifiedly Membership</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {MEMBERSHIP_PRICE_LABEL} a year for identity verification, the verified badge after approval, and priority support.
          </p>
        </div>

        {isMember ? (
          <Card className="mx-auto mt-8 max-w-2xl rounded-3xl border-foreground p-6 text-center shadow-sm sm:p-8">
            <BadgeCheck className="mx-auto h-10 w-10" />
            <h2 className="mt-4 text-2xl font-display font-bold">Your Membership is active</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              {renewal ? `${cancelAtPeriodEnd ? "Access ends" : "Renews"} ${renewal}.` : "Your annual Membership is active."}
            </p>
            <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
              <Button asChild><Link to="/dashboard/verification">Verify your identity</Link></Button>
              <Button variant="outline" onClick={() => void openPortal()}>Manage billing</Button>
            </div>
          </Card>
        ) : (
          <Card className="mx-auto mt-8 max-w-2xl rounded-3xl border-2 border-foreground p-6 shadow-sm sm:p-8">
            <p className="flex items-baseline gap-1 font-display text-4xl font-bold">{MEMBERSHIP_PRICE_LABEL}<span className="text-sm font-normal text-muted-foreground">per year</span></p>
            <ul className="mt-5 space-y-3 text-sm">
              {["Stripe Identity verification for eligible adults", "Identity Verified badge after approval", "Organization verification for business profiles", "Priority account support"].map((item) => (
                <li key={item} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0" /><span>{item}</span></li>
              ))}
            </ul>
            <Button onClick={() => void beginCheckout()} disabled={checkoutLoading} className="mt-7 min-h-11 w-full gap-2">
              {checkoutLoading && <Loader2 className="h-4 w-4 animate-spin" />}Join for {MEMBERSHIP_PRICE_LABEL} a year
            </Button>
            <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
              Charged today and renews annually at {MEMBERSHIP_PRICE_LABEL} until you cancel. Cancel anytime from billing.
            </p>
          </Card>
        )}

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {benefits.map(([Icon, title, description]) => (
            <Card key={title} className="rounded-2xl p-4">
              <Icon className="h-5 w-5" />
              <h3 className="mt-3 font-display text-sm font-semibold">{title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
            </Card>
          ))}
        </div>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-muted-foreground">
          The Identity Verified badge appears only after a successful Stripe Identity check. Verifiedly is operated by BrownGlobal Holdings LLC.
        </p>
      </div>
    </DashboardShell>
  );
};

export default Membership;
