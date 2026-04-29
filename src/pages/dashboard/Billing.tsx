import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Loader2,
  ExternalLink,
  Crown,
} from "lucide-react";
import VerifiedBadge from "@/components/VerifiedBadge";
import logo from "@/assets/verifiedly-logo.webp";
import { useToast } from "@/hooks/use-toast";
import { STRIPE_TIERS } from "@/lib/stripe-config";
import PageSkeleton from "@/components/PageSkeleton";

type SubInfo = {
  subscribed: boolean;
  status?: string;
  product_id?: string | null;
  subscription_end?: string | null;
  tier?: "free" | "pro" | "elite";
};

type PayoutStatus = {
  has_account: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  past_due?: string[];
  currently_due?: string[];
  disabled_reason?: string | null;
};

const Billing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<SubInfo>({ subscribed: false });
  const [payouts, setPayouts] = useState<PayoutStatus | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login?next=/dashboard/billing"); return; }
      const userId = session.user.id;

      const [{ data: profile }, { data: priv }, subRes] = await Promise.all([
        supabase.from("profiles").select("is_pro, is_elite").eq("id", userId).maybeSingle(),
        (supabase.from("creator_private_data" as any)
          .select("stripe_charges_enabled, stripe_payouts_enabled, stripe_details_submitted, stripe_requirements_past_due, stripe_requirements_currently_due, stripe_disabled_reason, stripe_connect_account_id")
          .eq("id", userId)
          .maybeSingle()) as any,
        supabase.functions.invoke("check-subscription").catch((e) => ({ data: null, error: e })),
      ]);

      const tier: "free" | "pro" | "elite" = profile?.is_elite ? "elite" : profile?.is_pro ? "pro" : "free";
      const sub = (subRes as any)?.data || {};
      setInfo({
        subscribed: !!sub.subscribed,
        status: sub.status,
        product_id: sub.product_id,
        subscription_end: sub.subscription_end,
        tier,
      });

      if (priv) {
        setPayouts({
          has_account: !!priv.stripe_connect_account_id,
          charges_enabled: !!priv.stripe_charges_enabled,
          payouts_enabled: !!priv.stripe_payouts_enabled,
          details_submitted: !!priv.stripe_details_submitted,
          past_due: priv.stripe_requirements_past_due || [],
          currently_due: priv.stripe_requirements_currently_due || [],
          disabled_reason: priv.stripe_disabled_reason,
        });
      }
      setLoading(false);
    })();
  }, [navigate]);

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (e: any) {
      toast({ title: "Could not open billing portal", description: e?.message || "Try again", variant: "destructive" });
    }
    setPortalLoading(false);
  };

  if (loading) return <PageSkeleton />;

  const tier = info.tier || "free";
  const t = STRIPE_TIERS[tier];
  const renewalDate = info.subscription_end
    ? new Date(info.subscription_end).toLocaleDateString(undefined, { dateStyle: "long" })
    : null;

  const hasPastDue = (payouts?.past_due?.length || 0) > 0;
  const hasCurrentlyDue = (payouts?.currently_due?.length || 0) > 0;
  const paymentIssue = info.status === "past_due" || info.status === "unpaid" || info.status === "incomplete";

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border h-16 flex items-center px-4">
        <div className="container mx-auto flex items-center gap-4">
          <Link to="/dashboard"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <img src={logo} alt="Verifiedly" className="h-7" />
          <span className="font-display font-semibold">Billing</span>
        </div>
      </nav>

      <div className="container mx-auto max-w-3xl px-4 py-8 space-y-6">
        {/* Plan card */}
        <Card className="p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Current plan</p>
              <h1 className="text-2xl font-display font-bold flex items-center gap-2">
                {tier === "elite" && <Crown className="w-6 h-6 text-amber-500" />}
                {tier === "pro" && <VerifiedBadge className="w-6 h-6" />}
                Verifiedly {t.name}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                ${t.price}{tier !== "free" ? "/mo" : ""} · {t.fee_percent}% platform fee
              </p>
            </div>
            <div className="flex gap-2">
              {tier === "free" ? (
                <Link to="/dashboard/upgrade">
                  <Button>Upgrade plan</Button>
                </Link>
              ) : (
                <Button variant="outline" onClick={openPortal} disabled={portalLoading} className="gap-2">
                  {portalLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
                  Manage in Stripe
                </Button>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mt-6">
            <Stat label={info.status === "active" || !info.status ? "Renews" : "Status"} value={renewalDate || (info.status || "—")} />
            <Stat label="Subscription status" value={info.status || (tier === "free" ? "free plan" : "—")} />
          </div>

          {paymentIssue && (
            <div className="mt-4 rounded-lg border border-orange-300 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800 p-4">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-sm">Payment issue: {info.status}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Your last payment didn't go through. Update your card in Stripe to keep your verified status active.
                  </p>
                  <Button size="sm" className="mt-3" onClick={openPortal} disabled={portalLoading}>
                    Update payment method
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Payouts requirements card */}
        {payouts && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-5 h-5" />
              <h2 className="text-lg font-display font-semibold">Stripe payout status</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              These checks must be green for you to receive payouts from sales, tips, and subscriptions.
            </p>

            <div className="space-y-2">
              <Check label="Stripe account created" ok={payouts.has_account} />
              <Check label="Account details submitted" ok={payouts.details_submitted} />
              <Check label="Charges enabled" ok={payouts.charges_enabled} />
              <Check label="Payouts enabled" ok={payouts.payouts_enabled} />
            </div>

            {(hasPastDue || hasCurrentlyDue || payouts.disabled_reason) && (
              <div className={`mt-4 rounded-lg border p-4 ${hasPastDue ? "border-destructive/40 bg-destructive/5" : "border-orange-300 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800"}`}>
                <div className="flex gap-3">
                  <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${hasPastDue ? "text-destructive" : "text-orange-500"}`} />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">
                      {hasPastDue ? "Action required — past due" : "Information requested"}
                    </p>
                    {payouts.disabled_reason && (
                      <p className="text-xs text-muted-foreground mt-1">Reason: {payouts.disabled_reason}</p>
                    )}
                    {(payouts.past_due?.length || payouts.currently_due?.length) ? (
                      <ul className="text-xs mt-2 space-y-1 list-disc list-inside text-muted-foreground">
                        {[...(payouts.past_due || []), ...(payouts.currently_due || [])]
                          .slice(0, 8)
                          .map((r) => <li key={r}>{r.replace(/_/g, " ")}</li>)}
                      </ul>
                    ) : null}
                    <div className="mt-3 flex gap-2 flex-wrap">
                      <Link to="/dashboard/payouts">
                        <Button size="sm" variant="outline">Open payouts checklist</Button>
                      </Link>
                      <Link to="/dashboard/settings">
                        <Button size="sm">Complete in Stripe</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {payouts.has_account && payouts.payouts_enabled && payouts.charges_enabled && !hasPastDue && !hasCurrentlyDue && (
              <div className="mt-4 rounded-lg border border-green-300 bg-green-50 dark:bg-green-950/20 dark:border-green-800 p-4 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <p className="text-sm">All set — payouts are running normally.</p>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-border p-3">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="font-medium capitalize text-sm mt-0.5">{value}</p>
  </div>
);

const Check = ({ label, ok }: { label: string; ok: boolean }) => (
  <div className="flex items-center gap-2 text-sm">
    {ok ? (
      <CheckCircle2 className="w-4 h-4 text-green-600" />
    ) : (
      <AlertTriangle className="w-4 h-4 text-orange-500" />
    )}
    <span className={ok ? "" : "text-muted-foreground"}>{label}</span>
  </div>
);

export default Billing;
