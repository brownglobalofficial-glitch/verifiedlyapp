import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { BadgeCheck, BarChart3, Check, CreditCard, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const membershipEnabled = import.meta.env.VITE_VERIFIEDLY_MEMBERSHIP_ENABLED === "true";
const estimatedShipWindow = String(import.meta.env.VITE_TAP_CARD_ESTIMATED_SHIP_WINDOW || "").trim();
const membershipReady = membershipEnabled && estimatedShipWindow.length > 0;

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

const Membership = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);
  const [cardCreditAvailable, setCardCreditAvailable] = useState(false);

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
        .select("pro_status, pro_current_period_end, pro_cancel_at_period_end, annual_card_credit_available")
        .eq("user_id", session.user.id)
        .maybeSingle(),
    ]);

    const active = profile?.is_pro === true || billing?.pro_status === "active" || billing?.pro_status === "trialing";
    setIsMember(active);
    setPeriodEnd(billing?.pro_current_period_end || null);
    setCancelAtPeriodEnd(billing?.pro_cancel_at_period_end === true);
    setCardCreditAvailable(billing?.annual_card_credit_available === true);
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      setSearchParams({}, { replace: true });
      toast({
        title: "Membership payment received",
        description: "Stripe is confirming your annual Membership and first-term Tap Card benefit.",
      });
      window.setTimeout(() => void load(), 1500);
    } else if (checkout === "cancelled") {
      setSearchParams({}, { replace: true });
      toast({ title: "Checkout canceled", description: "No Membership was started." });
    }
  }, [load, searchParams, setSearchParams, toast]);

  const beginCheckout = async () => {
    if (!membershipReady) {
      toast({
        title: "Founding Membership is not open yet",
        description: membershipEnabled
          ? "Verifiedly is confirming the manufacturer-supported Tap Card shipping estimate before collecting payment."
          : "Live annual Membership checkout remains closed while final payment and fulfillment testing is completed.",
      });
      return;
    }

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

  if (loading) {
    return <DashboardShell title="Verifiedly Membership"><div className="p-8 text-sm text-muted-foreground">Loading Membership…</div></DashboardShell>;
  }

  return (
    <DashboardShell title="Verifiedly Membership">
      <div className="mx-auto w-full max-w-5xl overflow-x-hidden px-3 py-7 sm:px-4 sm:py-10">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-background"><Sparkles className="h-6 w-6" /></div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Verifiedly Membership</p>
          <h1 className="mt-2 text-3xl font-display font-bold tracking-tight sm:text-4xl">One annual Membership. The essential Verifiedly experience.</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Membership includes one personalized Tap Card with your first paid term, Stripe Identity verification access for eligible adults, analytics and priority support.
          </p>
        </div>

        {isMember ? (
          <Card className="mx-auto mt-9 max-w-2xl rounded-3xl border-foreground p-6 text-center shadow-sm sm:p-9">
            <BadgeCheck className="mx-auto h-10 w-10" />
            <h2 className="mt-4 text-2xl font-display font-bold">Your Membership is active</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Stripe Identity verification is included for eligible adult members. The Identity Verified badge appears only after successful verification.
            </p>
            {periodEnd && (
              <p className="mt-3 text-xs text-muted-foreground">
                {cancelAtPeriodEnd ? "Membership ends" : "Renews"} {new Date(periodEnd).toLocaleDateString()}.
              </p>
            )}
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild><Link to="/dashboard/verification">Verify identity</Link></Button>
              <Button asChild variant="outline"><Link to="/dashboard/tap-card">{cardCreditAvailable ? "Claim included Tap Card" : "View Tap Card"}</Link></Button>
            </div>
          </Card>
        ) : (
          <Card className="mx-auto mt-10 max-w-2xl rounded-3xl border-2 border-foreground p-6 shadow-sm sm:p-9">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Annual Membership</p>
                <p className="mt-3 text-4xl font-display font-bold">$59.99<span className="ml-1 text-sm font-normal text-muted-foreground">/year</span></p>
              </div>
              <span className="w-fit rounded-full bg-foreground px-3 py-1 text-[10px] font-semibold text-background">First-term Tap Card included</span>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">$59.99 today. Renews annually at $59.99 until canceled. One Tap Card is included with the first paid Membership term only; renewals do not include another card.</p>
            {estimatedShipWindow && <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Included Tap Card estimated shipping: {estimatedShipWindow}. This is an estimate, not a guaranteed delivery date.</p>}
            <Button className="mt-7 min-h-12 w-full rounded-xl" onClick={() => void beginCheckout()} disabled={checkoutLoading || !membershipReady}>
              {checkoutLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Opening Stripe…</> : membershipReady ? "Start annual Membership · $59.99" : "Founding Membership coming soon"}
            </Button>
            {!membershipReady && <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">No payment is collected until Membership payments, the included Tap Card workflow and the manufacturer-supported shipping estimate are ready.</p>}
          </Card>
        )}

        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [CreditCard, "Included Tap Card", "One personalized PVC NFC profile card is included with the first paid Membership term."],
            [ShieldCheck, "Identity verification", "Eligible adult members can complete Stripe Identity verification at no separate Verifiedly fee."],
            [BarChart3, "Basic analytics", "See profile and Tap Card activity as Membership analytics become available."],
            [BadgeCheck, "Priority support", "Members receive priority account support for Membership and Tap Card issues."],
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
          <div className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" /><p>Membership does not automatically verify an identity. Eligible adult members must complete Stripe Identity, and the Identity Verified badge appears only after a successful result.</p></div>
        </div>
        <p className="mt-5 text-center text-xs text-muted-foreground">Verifiedly is operated by BrownGlobal Holdings LLC.</p>
      </div>
    </DashboardShell>
  );
};

export default Membership;
