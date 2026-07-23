import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { BadgeCheck, BarChart3, Check, CreditCard, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Interval = "month" | "year";

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
      // Use the normal error message below.
    }
  }
  return error instanceof Error ? error.message : "Stripe Checkout could not open.";
};

const Pro = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [checkoutInterval, setCheckoutInterval] = useState<Interval | null>(null);
  const [isPro, setIsPro] = useState(false);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login?next=/dashboard/pro");
      return;
    }

    await supabase.functions.invoke("check-subscription").catch(() => undefined);
    const [{ data: profile }, { data: billing }] = await Promise.all([
      supabase.from("profiles").select("is_pro").eq("id", session.user.id).maybeSingle(),
      supabase.from("verifiedly_billing").select("pro_status").eq("user_id", session.user.id).maybeSingle(),
    ]);
    setIsPro(profile?.is_pro === true || billing?.pro_status === "active" || billing?.pro_status === "trialing");
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      setSearchParams({}, { replace: true });
      toast({ title: "Verifiedly Pro payment received", description: "Your Pro access may take a few seconds to appear while Stripe confirms the subscription." });
      window.setTimeout(() => void load(), 1500);
    } else if (checkout === "cancelled") {
      setSearchParams({}, { replace: true });
      toast({ title: "Checkout canceled", description: "No subscription was started." });
    }
  }, [load, searchParams, setSearchParams, toast]);

  const beginCheckout = async (interval: Interval) => {
    setCheckoutInterval(interval);
    try {
      const { data, error } = await supabase.functions.invoke("create-pro-checkout", { body: { interval } });
      if (error || data?.error) throw new Error(await readFunctionError(error, data));
      if (data?.already_pro) {
        await load();
        return;
      }
      if (!data?.url) throw new Error("Stripe Checkout did not return a secure URL.");
      window.location.assign(data.url);
    } catch (error) {
      toast({ title: "Pro checkout could not start", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
      setCheckoutInterval(null);
    }
  };

  if (loading) {
    return <DashboardShell title="Verifiedly Pro"><div className="p-8 text-sm text-muted-foreground">Loading Verifiedly Pro…</div></DashboardShell>;
  }

  return (
    <DashboardShell title="Verifiedly Pro">
      <div className="mx-auto max-w-5xl px-4 py-7 sm:py-10">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-background"><Sparkles className="h-6 w-6" /></div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Verifiedly Pro</p>
          <h1 className="mt-2 text-3xl font-display font-bold tracking-tight sm:text-4xl">Build trust around your official profile</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Pro includes advanced profile tools, analytics, Tap Card member pricing and eligibility for Stripe Identity verification for supported adults.
          </p>
        </div>

        {isPro ? (
          <Card className="mx-auto mt-9 max-w-2xl rounded-3xl border-foreground p-7 text-center shadow-sm sm:p-9">
            <BadgeCheck className="mx-auto h-10 w-10" />
            <h2 className="mt-4 text-2xl font-display font-bold">Your Pro membership is active</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Identity verification is available to eligible adults. The verification check appears only after Stripe Identity successfully verifies the account holder.</p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild><Link to="/dashboard/verification">Verify identity</Link></Button>
              <Button asChild variant="outline"><Link to="/dashboard/tap-card">Order Tap Card · $19.99</Link></Button>
            </div>
          </Card>
        ) : (
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <Card className="flex rounded-3xl border-foreground/10 p-6 shadow-sm sm:p-7">
              <div className="flex w-full flex-col">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Monthly</p>
                <p className="mt-3 text-4xl font-display font-bold">$4.99<span className="ml-1 text-sm font-normal text-muted-foreground">/month</span></p>
                <p className="mt-3 text-sm text-muted-foreground">Flexible monthly access. Cancel anytime before the next billing period.</p>
                <Button className="mt-7 h-12 rounded-xl" onClick={() => void beginCheckout("month")} disabled={checkoutInterval !== null}>
                  {checkoutInterval === "month" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Opening Stripe…</> : "Continue with Stripe · $4.99"}
                </Button>
              </div>
            </Card>

            <Card className="flex rounded-3xl border-2 border-foreground p-6 shadow-sm sm:p-7">
              <div className="flex w-full flex-col">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Yearly</p>
                  <span className="rounded-full bg-foreground px-3 py-1 text-[10px] font-semibold text-background">Best value</span>
                </div>
                <p className="mt-3 text-4xl font-display font-bold">$49.99<span className="ml-1 text-sm font-normal text-muted-foreground">/year</span></p>
                <p className="mt-3 text-sm text-muted-foreground">One annual payment with the same Pro tools and identity-verification eligibility.</p>
                <Button className="mt-7 h-12 rounded-xl" onClick={() => void beginCheckout("year")} disabled={checkoutInterval !== null}>
                  {checkoutInterval === "year" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Opening Stripe…</> : "Continue with Stripe · $49.99"}
                </Button>
              </div>
            </Card>
          </div>
        )}

        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [ShieldCheck, "Identity verification", "Eligible adults can complete Stripe Identity verification at no separate Verifiedly fee."],
            [BadgeCheck, "Verification check", "The check is earned only after Stripe returns a successful verification result."],
            [BarChart3, "Profile analytics", "Understand visits and sharing activity as analytics become available."],
            [CreditCard, "Tap Card pricing", "Active Pro members pay $19.99 instead of the regular $29.99 price."],
          ].map(([Icon, title, description]) => {
            const FeatureIcon = Icon as typeof ShieldCheck;
            return (
              <Card key={String(title)} className="rounded-2xl p-5">
                <FeatureIcon className="h-5 w-5" />
                <h3 className="mt-3 text-sm font-semibold">{String(title)}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{String(description)}</p>
              </Card>
            );
          })}
        </div>

        <div className="mx-auto mt-8 max-w-3xl rounded-2xl border bg-muted/25 p-4 text-xs leading-relaxed text-muted-foreground">
          <div className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" /><p>Paying for Pro does not automatically verify an identity. Eligible adult users must separately complete Stripe Identity, and the verification check appears only after approval.</p></div>
        </div>
      </div>
    </DashboardShell>
  );
};

export default Pro;
