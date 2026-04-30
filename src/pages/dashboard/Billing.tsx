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
  Banknote,
  IdCard,
  RefreshCw,
  ShieldCheck,
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
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  const openStripeOnboarding = async (action: string) => {
    setActionLoading(action);
    try {
      const { data, error } = await supabase.functions.invoke("create-connect-account", {
        body: { return_url: `${window.location.origin}/dashboard/billing` },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
      else throw new Error("No onboarding URL returned");
    } catch (e: any) {
      toast({ title: "Could not open Stripe", description: e?.message || "Try again", variant: "destructive" });
    }
    setActionLoading(null);
  };

  const retryVerification = async () => {
    setActionLoading("retry");
    try {
      const { data, error } = await supabase.functions.invoke("sync-connect-status", { body: {} });
      if (error) throw error;
      setPayouts({
        has_account: !!data?.has_account,
        charges_enabled: !!data?.charges_enabled,
        payouts_enabled: !!data?.payouts_enabled,
        details_submitted: !!data?.details_submitted,
        currently_due: data?.currently_due ?? [],
        past_due: data?.past_due ?? [],
        disabled_reason: data?.disabled_reason ?? null,
      });
      toast({ title: "Verification re-checked", description: "Your latest Stripe status is now in sync." });
    } catch (e: any) {
      toast({ title: "Re-check failed", description: e?.message || "Try again", variant: "destructive" });
    }
    setActionLoading(null);
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
              <RequirementsChecklist
                pastDue={payouts.past_due || []}
                currentlyDue={payouts.currently_due || []}
                disabledReason={payouts.disabled_reason ?? null}
                actionLoading={actionLoading}
                onUpdate={openStripeOnboarding}
                onRetry={retryVerification}
              />
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

/**
 * Maps raw Stripe requirement keys to a human label, an icon, and a
 * recommended one-click action.
 */
function classifyRequirement(key: string): {
  label: string;
  category: "bank" | "identity" | "tax" | "business" | "tos" | "other";
} {
  const k = key.toLowerCase();
  if (k.includes("external_account") || k.includes("bank") || k.includes("routing") || k.includes("account_number")) {
    return { label: humanize(key), category: "bank" };
  }
  if (k.includes("ssn") || k.includes("id_number") || k.includes("verification") || k.includes("dob") || k.includes("document") || k.includes("address")) {
    return { label: humanize(key), category: "identity" };
  }
  if (k.includes("tax") || k.includes("ein") || k.includes("vat")) {
    return { label: humanize(key), category: "tax" };
  }
  if (k.includes("business") || k.includes("company") || k.includes("mcc") || k.includes("url")) {
    return { label: humanize(key), category: "business" };
  }
  if (k.includes("tos") || k.includes("terms")) {
    return { label: humanize(key), category: "tos" };
  }
  return { label: humanize(key), category: "other" };
}

function humanize(key: string) {
  return key
    .replace(/^individual\./, "")
    .replace(/^business_profile\./, "")
    .replace(/^company\./, "")
    .replace(/_/g, " ");
}

const CATEGORY_META: Record<string, { title: string; icon: any; cta: string }> = {
  bank:     { title: "Update bank account",       icon: Banknote,    cta: "Update bank" },
  identity: { title: "Verify your identity",      icon: IdCard,      cta: "Verify identity" },
  tax:      { title: "Add tax information",       icon: ShieldCheck, cta: "Add tax info" },
  business: { title: "Complete business details", icon: ShieldCheck, cta: "Update details" },
  tos:      { title: "Accept Stripe terms",       icon: ShieldCheck, cta: "Accept terms" },
  other:    { title: "Additional information",    icon: AlertTriangle, cta: "Open Stripe" },
};

const RequirementsChecklist = ({
  pastDue,
  currentlyDue,
  disabledReason,
  actionLoading,
  onUpdate,
  onRetry,
}: {
  pastDue: string[];
  currentlyDue: string[];
  disabledReason: string | null;
  actionLoading: string | null;
  onUpdate: (action: string) => void;
  onRetry: () => void;
}) => {
  // Group requirements by category, marking past-due as severe.
  const groups = new Map<string, { items: string[]; severe: boolean }>();
  pastDue.forEach((k) => {
    const c = classifyRequirement(k).category;
    const g = groups.get(c) || { items: [], severe: true };
    g.items.push(k); g.severe = true;
    groups.set(c, g);
  });
  currentlyDue.forEach((k) => {
    const c = classifyRequirement(k).category;
    const g = groups.get(c) || { items: [], severe: false };
    if (!g.items.includes(k)) g.items.push(k);
    groups.set(c, g);
  });

  const hasPastDue = pastDue.length > 0;

  return (
    <div className="mt-4 space-y-3">
      <div className={`rounded-lg border p-4 ${hasPastDue ? "border-destructive/40 bg-destructive/5" : "border-orange-300 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800"}`}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex gap-3 min-w-0">
            <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${hasPastDue ? "text-destructive" : "text-orange-500"}`} />
            <div className="min-w-0">
              <p className="font-semibold text-sm">
                {hasPastDue ? "Action required — payouts on hold" : "Stripe needs more information"}
              </p>
              {disabledReason && (
                <p className="text-xs text-muted-foreground mt-1">Reason: {disabledReason.replace(/_/g, " ")}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Complete each item below — Stripe re-verifies in real time and your status will update automatically.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            disabled={actionLoading === "retry"}
            className="gap-1.5 shrink-0"
          >
            {actionLoading === "retry"
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <RefreshCw className="w-3 h-3" />}
            Retry verification
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {[...groups.entries()].map(([category, g]) => {
          const meta = CATEGORY_META[category] || CATEGORY_META.other;
          const Icon = meta.icon;
          return (
            <div
              key={category}
              className={`rounded-lg border p-3 flex items-start justify-between gap-3 flex-wrap ${
                g.severe ? "border-destructive/30" : "border-border"
              }`}
            >
              <div className="flex gap-3 min-w-0">
                <span className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
                  g.severe ? "bg-destructive/10 text-destructive" : "bg-muted text-foreground"
                }`}>
                  <Icon className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{meta.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    {g.items.map((k) => classifyRequirement(k).label).slice(0, 3).join(" · ")}
                    {g.items.length > 3 ? ` · +${g.items.length - 3} more` : ""}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => onUpdate(category)}
                disabled={actionLoading === category}
                className="gap-1.5 shrink-0"
                variant={g.severe ? "default" : "outline"}
              >
                {actionLoading === category
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <ExternalLink className="w-3 h-3" />}
                {meta.cta}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 flex-wrap">
        <Link to="/dashboard/payouts">
          <Button size="sm" variant="outline">Full payouts checklist</Button>
        </Link>
      </div>
    </div>
  );
};
