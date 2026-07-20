import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Check, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { STRIPE_TIERS } from "@/lib/stripe-config";
import logo from "@/assets/verifiedly-logo.webp";

/**
 * Two-tier upgrade page: Free vs Pro.
 * Verification badge is earned via Trust Score, never bundled with paid plans.
 */
const UpgradePro = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState<"free" | "pro">("free");
  const [ready, setReady] = useState(false);
  const [promo, setPromo] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login?next=/dashboard/upgrade"); return; }
      const { data: profile } = await supabase
        .from("profiles").select("is_pro, is_elite").eq("id", session.user.id).maybeSingle();
      if (profile?.is_pro || profile?.is_elite) setCurrentTier("pro");
      setReady(true);
    })();
  }, [navigate]);

  const checkout = async () => {
    setLoading("pro");
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: STRIPE_TIERS.pro.price_id, tier: "pro" },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast({ title: "Checkout error", description: err?.message || "Failed", variant: "destructive" });
    }
    setLoading(null);
  };

  const openPortal = async () => {
    setLoading("portal");
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast({ title: "Could not open portal", description: err?.message || "Try again", variant: "destructive" });
    }
    setLoading(null);
  };

  const redeem = async () => {
    if (!promo.trim()) return;
    setRedeeming(true);
    try {
      const { data, error } = await supabase.functions.invoke("redeem-promo", { body: { code: promo.trim() } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({
        title: data?.alreadyRedeemed ? "Already redeemed" : "Pro unlocked!",
        description: data?.alreadyRedeemed ? "You already have Pro from this code." : "Your account now has Pro features.",
      });
      setCurrentTier("pro");
      setPromo("");
    } catch (err: any) {
      toast({ title: "Couldn't redeem", description: err?.message || "Try again", variant: "destructive" });
    } finally {
      setRedeeming(false);
    }
  };

  const freeFeatures = [
    "Public profile + link-in-bio",
    "Sell digital products & accept tips",
    "Earn the verified badge (Trust Score ≥ 80)",
    "10% platform fee on earnings",
  ];
  const proFeatures = [
    "Everything in Free",
    "0% platform fee — keep 100%",
    "Paid subscriptions + exclusive content",
    "Advanced analytics",
    "Priority verification reviews",
    "Priority support",
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border h-16 flex items-center px-4">
        <div className="container mx-auto flex items-center gap-4">
          <Link to="/dashboard"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <img src={logo} alt="Verifiedly" className="h-7" />
          <span className="font-display font-semibold">Upgrade</span>
        </div>
      </nav>

      <div className="container mx-auto max-w-4xl px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight">Keep more of every sale</h1>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            Drop your platform fee from 10% to 0%. The verified badge is always earned — never paid for.
          </p>
        </div>

        {/* Savings example */}
        <Card className="p-5 mb-8 bg-muted/40">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">If you sell $1,000/mo</p>
          <p className="text-sm">Free keeps <span className="font-display font-bold">$900</span> · Pro keeps <span className="font-display font-bold">$1,000</span> minus the $9.99 subscription = <span className="font-display font-bold">$990.01</span>. Pay back the plan after ~$100 in sales.</p>
        </Card>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Free */}
          <Card className={`p-6 flex flex-col ${currentTier === "free" ? "border-2 border-foreground" : ""}`}>
            <h3 className="font-display font-bold text-xl mb-1">Free</h3>
            <p className="text-3xl font-display font-bold">$0<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">10% platform fee</p>
            <ul className="space-y-2 text-sm flex-1">
              {freeFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2"><Check className="w-4 h-4 text-foreground flex-shrink-0 mt-0.5" /> {f}</li>
              ))}
            </ul>
            <Button variant="outline" disabled className="w-full mt-6">
              {currentTier === "free" ? "Your plan" : "Default"}
            </Button>
          </Card>

          {/* Pro */}
          <Card className={`p-6 flex flex-col bg-foreground text-background ${currentTier === "pro" ? "ring-2 ring-foreground/30" : ""}`}>
            <h3 className="font-display font-bold text-xl mb-1">Verifiedly Pro</h3>
            <p className="text-3xl font-display font-bold">${STRIPE_TIERS.pro.price}<span className="text-sm font-normal opacity-60">/mo</span></p>
            <p className="text-xs opacity-60 mt-1 mb-4">0% platform fee</p>
            <ul className="space-y-2 text-sm flex-1">
              {proFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2"><Check className="w-4 h-4 flex-shrink-0 mt-0.5" /> {f}</li>
              ))}
            </ul>
            {!ready ? (
              <Button variant="outline" disabled className="w-full mt-6">Loading…</Button>
            ) : currentTier === "pro" ? (
              <Button variant="outline" className="w-full mt-6 bg-background text-foreground" onClick={openPortal} disabled={loading === "portal"}>
                {loading === "portal" ? "Opening…" : "Manage subscription"}
              </Button>
            ) : (
              <Button className="w-full mt-6 bg-background text-foreground hover:bg-background/90" onClick={checkout} disabled={loading === "pro"}>
                {loading === "pro" ? "Loading…" : "Upgrade to Pro"}
              </Button>
            )}
          </Card>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Stripe processing fees (~2.9% + 30¢) apply on both plans. Cancel anytime.
        </p>

        <Card className="mt-10 p-5 max-w-md mx-auto">
          <p className="font-display font-semibold text-sm mb-1">Have a promo code?</p>
          <p className="text-xs text-muted-foreground mb-3">Redeem a code to unlock Pro for free.</p>
          <div className="flex gap-2">
            <Input value={promo} onChange={(e) => setPromo(e.target.value.toUpperCase())} placeholder="ENTER CODE" className="font-mono uppercase tracking-wider" disabled={redeeming} />
            <Button onClick={redeem} disabled={redeeming || !promo.trim()}>{redeeming ? "Redeeming…" : "Redeem"}</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UpgradePro;
