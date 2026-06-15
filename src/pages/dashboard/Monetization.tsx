import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Users, DollarSign, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ConnectPayoutsModal from "@/components/monetization/ConnectPayoutsModal";

export default function Monetization() {
  const [chargesEnabled, setChargesEnabled] = useState(false);
  const [hasAccount, setHasAccount] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async (opts: { sync?: boolean } = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    // Pull latest from Stripe before reading the DB so the UI reflects reality.
    if (opts.sync) {
      await supabase.functions.invoke("sync-connect-status").catch(() => null);
    }
    const { data } = await (supabase
      .from("creator_private_data" as any)
      .select("stripe_connect_account_id, stripe_charges_enabled")
      .eq("id", session.user.id)
      .maybeSingle() as any);
    setHasAccount(!!data?.stripe_connect_account_id);
    setChargesEnabled(!!data?.stripe_charges_enabled);
    setLoading(false);
  };

  useEffect(() => {
    // Initial sync from Stripe so a returning user sees "Payouts ready" right away.
    load({ sync: true });
    const onFocus = () => load({ sync: true });
    const onVisible = () => { if (document.visibilityState === "visible") load({ sync: true }); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    // Clean up the ?stripe_onboarded=true param after we handle it.
    if (typeof window !== "undefined" && window.location.search.includes("stripe_onboarded")) {
      const url = new URL(window.location.href);
      url.searchParams.delete("stripe_onboarded");
      window.history.replaceState({}, "", url.toString());
    }
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const gate = (action: () => void) => () => {
    if (chargesEnabled) action();
    else setConnectOpen(true);
  };

  const features = [
    {
      icon: DollarSign,
      title: "Tips",
      desc: "Let supporters send you one-off tips from your profile.",
      cta: "Enable tips",
      href: "/dashboard/settings#tips",
    },
    {
      icon: ShoppingBag,
      title: "Digital products",
      desc: "Sell e-books, presets, courses & more.",
      cta: "Manage products",
      href: "/dashboard/products",
    },
    {
      icon: Users,
      title: "Subscriptions",
      desc: "Create paid subscriber tiers with exclusive content.",
      cta: "Manage subscriptions",
      href: "/dashboard/subscriptions",
    },
  ];

  return (
    <DashboardShell title="Monetization">
      <div className="container mx-auto max-w-4xl py-8 px-4 space-y-6">
        {/* Payouts status */}
        <Card className={`p-5 border ${chargesEnabled ? "border-foreground/20 bg-foreground/5" : hasAccount ? "border-orange-300 bg-orange-50/50 dark:bg-orange-950/10" : "border-dashed"}`}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3 min-w-0">
              {chargesEnabled ? (
                <CheckCircle2 className="w-5 h-5 text-foreground shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-display font-semibold text-sm">
                  {chargesEnabled ? "Payouts ready" : hasAccount ? "Finish Stripe verification" : "Connect payouts to start earning"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {chargesEnabled
                    ? "Earnings deposit automatically to your bank account."
                    : "You only need to do this once. Takes about 3 minutes."}
                </p>
              </div>
            </div>
            {!chargesEnabled && (
              <Button size="sm" onClick={() => setConnectOpen(true)}>
                {hasAccount ? "Continue setup" : "Connect Stripe"}
              </Button>
            )}
          </div>
        </Card>

        {/* Plan callout */}
        <Card className="p-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Platform fee</p>
              <p className="font-display font-bold text-2xl mt-1">
                10% <span className="text-sm font-normal text-muted-foreground">on Free</span>
                <span className="mx-2 text-muted-foreground">→</span>
                0% <span className="text-sm font-normal text-muted-foreground">on Pro</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">Stripe processing fees (~2.9% + 30¢) apply on both plans.</p>
            </div>
            <Link to="/dashboard/upgrade">
              <Button size="sm" variant="outline" className="gap-1">Compare plans <ArrowRight className="w-3 h-3" /></Button>
            </Link>
          </div>
        </Card>

        {/* Feature cards */}
        <div>
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Ways to earn</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {features.map((f) => (
              <Card key={f.title} className="p-5 flex flex-col">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-3">
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-display font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4 flex-1">{f.desc}</p>
                {chargesEnabled ? (
                  <Link to={f.href}>
                    <Button size="sm" variant="outline" className="w-full">{f.cta}</Button>
                  </Link>
                ) : (
                  <Button size="sm" variant="outline" className="w-full gap-1" onClick={gate(() => {})}>
                    Connect payouts <Badge variant="secondary" className="text-[10px]">required</Badge>
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </div>

        <ConnectPayoutsModal
          open={connectOpen}
          onOpenChange={(v) => { setConnectOpen(v); if (!v) load({ sync: true }); }}
          onReady={() => load({ sync: true })}
        />
        {loading ? null : null}
      </div>
    </DashboardShell>
  );
}