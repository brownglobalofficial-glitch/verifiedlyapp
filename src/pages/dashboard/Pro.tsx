import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { BadgeCheck, BarChart3, CreditCard, Headphones, ShieldCheck, Sparkles } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProBilling {
  pro_status: string;
  pro_interval: string | null;
  pro_current_period_end: string | null;
  pro_cancel_at_period_end: boolean;
  annual_card_credit_available: boolean;
}

const features = [
  { icon: ShieldCheck, title: "Identity-verification eligibility", body: "Eligible adults can complete a Stripe-hosted ID and selfie check." },
  { icon: BadgeCheck, title: "Identity Verified badge", body: "The badge appears only after the identity check succeeds." },
  { icon: BarChart3, title: "Profile and Tap Card analytics", body: "See profile activity and aggregate card-tap counts." },
  { icon: Headphones, title: "Priority support", body: "Pro tickets are marked for priority review." },
  { icon: CreditCard, title: "Tap Card benefits", body: "Discounted physical cards; annual Pro includes one PVC card credit." },
  { icon: Sparkles, title: "Advanced profile tools", body: "Premium sharing, privacy, and presentation features as they launch." },
];

const Pro = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [billing, setBilling] = useState<ProBilling | null>(null);
  const [idVerified, setIdVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<"month" | "year" | "portal" | null>(null);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login?next=/dashboard/pro");
      return;
    }

    const [{ data: profile }, { data: currentBilling }] = await Promise.all([
      supabase.from("profiles").select("id_verified").eq("id", session.user.id).maybeSingle(),
      (supabase as any).from("verifiedly_billing")
        .select("pro_status, pro_interval, pro_current_period_end, pro_cancel_at_period_end, annual_card_credit_available")
        .eq("user_id", session.user.id)
        .maybeSingle(),
    ]);

    setIdVerified(!!profile?.id_verified);
    setBilling(currentBilling || null);
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (!checkout) return;
    if (checkout === "success") toast({ title: "Verifiedly Pro activated", description: "Your plan status will update after Stripe confirms the subscription." });
    if (checkout === "cancelled") toast({ title: "Checkout canceled" });
    setSearchParams({}, { replace: true });
    window.setTimeout(() => void load(), 1200);
  }, [load, searchParams, setSearchParams, toast]);

  const active = useMemo(() => ["active", "trialing"].includes(billing?.pro_status || ""), [billing]);

  const subscribe = async (interval: "month" | "year") => {
    setAction(interval);
    try {
      const { data, error } = await supabase.functions.invoke("create-pro-checkout", { body: { interval } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.already_subscribed) {
        toast({ title: "You already have Verifiedly Pro" });
        await load();
        return;
      }
      if (!data?.url) throw new Error("Checkout did not return a secure URL.");
      window.location.assign(data.url);
    } catch (error) {
      toast({ title: "Checkout could not open", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally {
      setAction(null);
    }
  };

  const openPortal = async () => {
    setAction("portal");
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", { body: { return_path: "/dashboard/pro" } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.url) throw new Error("Billing portal did not return a secure URL.");
      window.location.assign(data.url);
    } catch (error) {
      toast({ title: "Billing portal could not open", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
      setAction(null);
    }
  };

  if (loading) return <DashboardShell title="Verifiedly Pro"><div className="p-8 text-sm text-muted-foreground">Loading…</div></DashboardShell>;

  return (
    <DashboardShell title="Verifiedly Pro">
      <div className="mx-auto max-w-5xl px-4 py-7 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Official profile · trust · support</p>
            <h1 className="mt-3 text-3xl font-display font-bold tracking-tight sm:text-4xl">Make your Verifiedly account more useful.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">Pro adds identity-verification eligibility, priority support, analytics, advanced profile tools, and better Tap Card pricing. Payment never guarantees a badge; the Stripe Identity check must succeed.</p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {features.map((feature) => (
                <Card key={feature.title} className="rounded-2xl p-4 shadow-sm">
                  <feature.icon className="h-5 w-5" />
                  <h2 className="mt-3 text-sm font-semibold">{feature.title}</h2>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{feature.body}</p>
                </Card>
              ))}
            </div>
          </div>

          <Card className="h-fit rounded-3xl border-foreground/15 p-6 shadow-sm lg:sticky lg:top-20">
            {active ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Current plan</p>
                    <h2 className="mt-1 text-2xl font-display font-bold">Verifiedly Pro</h2>
                  </div>
                  <span className="rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background">{billing?.pro_interval === "year" ? "Annual" : "Monthly"}</span>
                </div>

                <div className="mt-5 space-y-3 rounded-2xl bg-muted/50 p-4 text-sm">
                  <div className="flex justify-between gap-4"><span className="text-muted-foreground">Status</span><span className="font-medium capitalize">{billing?.pro_status}</span></div>
                  {billing?.pro_current_period_end && <div className="flex justify-between gap-4"><span className="text-muted-foreground">Current period ends</span><span className="font-medium">{new Date(billing.pro_current_period_end).toLocaleDateString()}</span></div>}
                  <div className="flex justify-between gap-4"><span className="text-muted-foreground">Identity badge</span><span className="font-medium">{idVerified ? "Verified" : "Not completed"}</span></div>
                  {billing?.pro_interval === "year" && <div className="flex justify-between gap-4"><span className="text-muted-foreground">PVC card credit</span><span className="font-medium">{billing.annual_card_credit_available ? "Available" : "Used"}</span></div>}
                </div>

                {billing?.pro_cancel_at_period_end && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">Your plan is scheduled to end after the current billing period.</p>}

                <div className="mt-5 grid gap-2">
                  <Button asChild><Link to="/dashboard/verification">{idVerified ? "View verification" : "Verify identity"}</Link></Button>
                  <Button asChild variant="outline"><Link to="/dashboard/cards">Manage Tap Cards</Link></Button>
                  <Button asChild variant="outline"><Link to="/dashboard/support">Contact priority support</Link></Button>
                  <Button variant="ghost" onClick={() => void openPortal()} disabled={action === "portal"}>{action === "portal" ? "Opening billing…" : "Manage billing"}</Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Choose a plan</p>
                <h2 className="mt-2 text-2xl font-display font-bold">Verifiedly Pro</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Your public profile and Verifiedly sign-in stay free. Upgrade for verification eligibility, support, analytics, and physical-card benefits.</p>

                <div className="mt-5 space-y-3">
                  <button type="button" onClick={() => void subscribe("month")} disabled={action !== null} className="w-full rounded-2xl border border-border p-4 text-left transition hover:border-foreground disabled:opacity-60">
                    <div className="flex items-center justify-between"><span className="font-semibold">Monthly</span><span className="text-lg font-display font-bold">$5.99</span></div>
                    <p className="mt-1 text-xs text-muted-foreground">Cancel through the Stripe billing portal.</p>
                  </button>
                  <button type="button" onClick={() => void subscribe("year")} disabled={action !== null} className="w-full rounded-2xl border-2 border-foreground p-4 text-left transition hover:bg-muted/40 disabled:opacity-60">
                    <div className="flex items-center justify-between"><span className="font-semibold">Annual</span><span className="text-lg font-display font-bold">$49.99</span></div>
                    <p className="mt-1 text-xs text-muted-foreground">Includes one PVC Tap Card credit; standard U.S. shipping is charged when claimed.</p>
                  </button>
                </div>

                <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">Identity verification is for eligible adults and is powered by Stripe. Verifiedly does not sell a guaranteed badge. A failed or incomplete check does not activate one.</p>
              </>
            )}
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
};

export default Pro;
