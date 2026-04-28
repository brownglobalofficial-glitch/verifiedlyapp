import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, AlertTriangle, Circle, RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export type PayoutStatus = {
  has_account: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  currently_due?: string[];
  past_due?: string[];
  disabled_reason?: string | null;
};

interface Props {
  userId: string;
  variant?: "compact" | "full";
  /** Called when status is loaded so parents can gate features (e.g. subscriptions). */
  onStatusChange?: (s: PayoutStatus) => void;
  /** Optional callback to trigger Stripe Connect onboarding for missing-account state. */
  onConnect?: () => void;
}

const STEP_LABELS = [
  { key: "has_account", label: "Stripe account created" },
  { key: "details_submitted", label: "Personal & business details submitted" },
  { key: "charges_enabled", label: "Charges enabled (can accept payments)" },
  { key: "payouts_enabled", label: "Payouts enabled (bank verified)" },
] as const;

export default function PayoutsChecklist({ userId, variant = "full", onStatusChange, onConnect }: Props) {
  const [status, setStatus] = useState<PayoutStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCached = async () => {
    setError(null);
    const { data } = await (supabase
      .from("creator_private_data" as any)
      .select("stripe_connect_account_id, stripe_charges_enabled, stripe_payouts_enabled, stripe_details_submitted, stripe_requirements_currently_due, stripe_requirements_past_due, stripe_disabled_reason")
      .eq("id", userId)
      .maybeSingle() as any);
    const s: PayoutStatus = {
      has_account: !!data?.stripe_connect_account_id,
      charges_enabled: !!data?.stripe_charges_enabled,
      payouts_enabled: !!data?.stripe_payouts_enabled,
      details_submitted: !!data?.stripe_details_submitted,
      currently_due: (data?.stripe_requirements_currently_due as string[]) ?? [],
      past_due: (data?.stripe_requirements_past_due as string[]) ?? [],
      disabled_reason: data?.stripe_disabled_reason ?? null,
    };
    setStatus(s);
    onStatusChange?.(s);
    setLoading(false);
  };

  const refresh = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-connect-status", { body: {} });
      if (error) throw error;
      const s: PayoutStatus = {
        has_account: !!data?.has_account,
        charges_enabled: !!data?.charges_enabled,
        payouts_enabled: !!data?.payouts_enabled,
        details_submitted: !!data?.details_submitted,
        currently_due: data?.currently_due ?? [],
        past_due: data?.past_due ?? [],
        disabled_reason: data?.disabled_reason ?? null,
      };
      setStatus(s);
      onStatusChange?.(s);
    } catch (e: any) {
      setError(e?.message || "Failed to refresh");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { loadCached(); /* eslint-disable-next-line */ }, [userId]);

  if (loading) {
    return (
      <Card className="p-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading payout status…
      </Card>
    );
  }

  if (!status) return null;

  const allComplete = status.has_account && status.details_submitted && status.charges_enabled && status.payouts_enabled;
  const completedCount = STEP_LABELS.filter(s => (status as any)[s.key]).length;

  if (variant === "compact") {
    return (
      <Card className={`p-3 flex items-center justify-between gap-3 ${allComplete ? "border-green-500/30 bg-green-50/40 dark:bg-green-950/10" : "border-orange-500/30 bg-orange-50/40 dark:bg-orange-950/10"}`}>
        <div className="flex items-center gap-2 text-sm min-w-0">
          {allComplete ? <Check className="w-4 h-4 text-green-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />}
          <span className="font-medium truncate">
            Payouts {completedCount}/{STEP_LABELS.length} {allComplete ? "ready" : "pending"}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={refresh} disabled={refreshing} className="gap-1 shrink-0">
          {refreshing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display font-semibold text-lg">Payouts checklist</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Complete every step to start accepting payments and offering subscriptions.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing} className="gap-1.5 shrink-0">
          {refreshing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Re-check
        </Button>
      </div>

      <ul className="space-y-2">
        {STEP_LABELS.map((s) => {
          const done = !!(status as any)[s.key];
          return (
            <li key={s.key} className="flex items-center gap-3 text-sm">
              {done ? (
                <span className="w-5 h-5 rounded-full bg-green-500/15 text-green-600 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3" />
                </span>
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
              )}
              <span className={done ? "text-foreground" : "text-muted-foreground"}>{s.label}</span>
            </li>
          );
        })}
      </ul>

      {(status.past_due?.length ?? 0) > 0 && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3">
          <p className="text-xs font-semibold text-destructive flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" /> Past-due requirements
          </p>
          <ul className="text-xs text-destructive/90 mt-1 list-disc pl-4">
            {status.past_due!.map((r) => <li key={r}>{r.replace(/_/g, " ")}</li>)}
          </ul>
        </div>
      )}

      {(status.currently_due?.length ?? 0) > 0 && status.has_account && (
        <div className="rounded-md border border-orange-500/30 bg-orange-50/40 dark:bg-orange-950/10 p-3">
          <p className="text-xs font-semibold text-orange-700 dark:text-orange-400">Currently due</p>
          <ul className="text-xs text-muted-foreground mt-1 list-disc pl-4">
            {status.currently_due!.map((r) => <li key={r}>{r.replace(/_/g, " ")}</li>)}
          </ul>
        </div>
      )}

      {!status.has_account && onConnect && (
        <Button onClick={onConnect} className="w-full">Connect Stripe to start</Button>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </Card>
  );
}