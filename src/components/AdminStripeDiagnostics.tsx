import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Diag {
  stripe: { live: boolean; test: boolean; configured: boolean; ok: boolean; account_id: string | null };
  webhook: { configured: boolean };
  last_event: { stripe_event_id: string; event_type: string; livemode: boolean; received_at: string } | null;
  total_events: number;
}

/** Admin-only banner that confirms live Stripe keys + webhook health. */
export default function AdminStripeDiagnostics() {
  const [data, setData] = useState<Diag | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-diagnostics");
      if (error) throw error;
      setData(data as Diag);
    } catch (e: any) {
      setError(e?.message || "Failed to load diagnostics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <Card className="p-4 mb-6 border-dashed">
        <p className="text-xs text-muted-foreground">Loading Stripe diagnostics…</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 mb-6 border-destructive/40 bg-destructive/5">
        <p className="text-xs text-destructive">Diagnostics error: {error}</p>
      </Card>
    );
  }

  if (!data) return null;

  const allGood = data.stripe.live && data.stripe.ok && data.webhook.configured;

  return (
    <Card className={`p-4 mb-6 ${allGood ? "border-green-500/30 bg-green-50/40 dark:bg-green-950/10" : "border-orange-500/40 bg-orange-50/50 dark:bg-orange-950/20"}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {allGood ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
          )}
          <div className="space-y-1">
            <p className="text-sm font-semibold">
              Admin diagnostics: Stripe {allGood ? "live & healthy" : "needs attention"}
            </p>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              <li>
                Secret key: {data.stripe.live ? "✅ live (sk_live_)" : data.stripe.test ? "⚠️ test (sk_test_)" : "❌ missing"}
                {data.stripe.ok ? ` — verified account ${data.stripe.account_id}` : " — verification failed"}
              </li>
              <li>
                Webhook secret: {data.webhook.configured ? "✅ configured (whsec_)" : "❌ missing"}
              </li>
              <li>
                Last webhook event:{" "}
                {data.last_event ? (
                  <>
                    <span className="font-mono">{data.last_event.event_type}</span>{" "}
                    {data.last_event.livemode ? "(live)" : "(test)"} ·{" "}
                    {new Date(data.last_event.received_at).toLocaleString()}
                  </>
                ) : (
                  <span className="text-orange-600">none received yet</span>
                )}{" "}
                · total {data.total_events}
              </li>
            </ul>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={load} className="gap-1 shrink-0">
          <RefreshCw className="w-3 h-3" /> Refresh
        </Button>
      </div>
    </Card>
  );
}