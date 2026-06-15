import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/verifiedly-logo.webp";

/**
 * Verifies a Stripe checkout session result and shows the buyer their plan,
 * renewal date, and any payment problems.
 */
const SubscriptionSuccess = () => {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) { setError("Missing session reference."); setLoading(false); return; }
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("verify-checkout-session", {
          body: { sessionId },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setData(data);
      } catch (e: any) {
        setError(e?.message || "Could not verify your subscription.");
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId]);

  const fmtMoney = (cents: number | null, currency: string | null) => {
    if (cents == null) return "—";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: (currency || "usd").toUpperCase() }).format(cents / 100);
  };
  const fmtDate = (epoch: number | null) =>
    epoch ? new Date(epoch * 1000).toLocaleDateString(undefined, { dateStyle: "long" }) : "—";

  const sub = data?.subscription;
  const paid = data?.payment_status === "paid" || sub?.status === "active" || sub?.status === "trialing";
  const hasIssue = sub?.status === "past_due" || sub?.status === "incomplete" || sub?.status === "unpaid" || sub?.latest_invoice_status === "open";

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border h-16 flex items-center px-4">
        <div className="container mx-auto flex items-center">
          <Link to="/"><img src={logo} alt="Verifiedly" className="h-7" /></Link>
        </div>
      </nav>

      <div className="container mx-auto max-w-xl px-4 py-12">
        {loading && (
          <Card className="p-8 text-center space-y-3">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Confirming your subscription…</p>
          </Card>
        )}

        {!loading && error && (
          <Card className="p-8 text-center space-y-3 border-destructive/40 bg-destructive/5">
            <AlertTriangle className="w-8 h-8 mx-auto text-destructive" />
            <h1 className="text-xl font-display font-bold">We couldn't confirm your subscription</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Link to="/"><Button variant="outline" className="mt-2">Back home</Button></Link>
          </Card>
        )}

        {!loading && !error && data && (
          <Card className={`p-8 space-y-5 ${hasIssue ? "border-orange-500/40" : "border-green-500/30"}`}>
            <div className="text-center space-y-2">
              {hasIssue ? (
                <AlertTriangle className="w-12 h-12 mx-auto text-orange-500" />
              ) : (
                <CheckCircle2 className="w-12 h-12 mx-auto text-green-600" />
              )}
              <h1 className="text-2xl font-display font-bold">
                {hasIssue ? "Action required" : paid ? "You're subscribed!" : "Subscription pending"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {hasIssue
                  ? "There's an issue with your payment — please update your card to continue."
                  : `Thanks for supporting ${data.creator_username ? "@" + data.creator_username : "this creator"}.`}
              </p>
            </div>

            <div className="rounded-lg border border-border divide-y divide-border">
              <Row label="Plan" value={data.product_name || "—"} />
              <Row label="Amount" value={`${fmtMoney(data.amount_total, data.currency)}${sub?.interval ? ` / ${sub.interval}` : ""}`} />
              {sub?.current_period_end && (
                <Row label={sub.cancel_at_period_end ? "Ends on" : "Renews on"} value={fmtDate(sub.current_period_end)} />
              )}
              <Row label="Status" value={sub?.status || data.payment_status || "—"} />
              {data.customer_email && <Row label="Receipt sent to" value={data.customer_email} />}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              {data.creator_username && (
                <Link to={`/${data.creator_username}`} className="flex-1">
                  <Button variant="outline" className="w-full">Back to profile</Button>
                </Link>
              )}
              <Link to="/dashboard" className="flex-1">
                <Button className="w-full">Go to my account</Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between px-4 py-3 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium text-right capitalize">{value}</span>
  </div>
);

export default SubscriptionSuccess;