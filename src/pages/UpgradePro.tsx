import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Crown, ArrowLeft, Sparkles, ShieldCheck, TrendingUp, Star, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import VerifiedBadge from "@/components/VerifiedBadge";
import { STRIPE_TIERS } from "@/lib/stripe-config";
import logo from "@/assets/verifiedly-logo.webp";

/**
 * Dedicated Verifiedly Pro / Elite upgrade page.
 * The webhook flips `is_pro` / `is_elite` on the profile the moment Stripe
 * confirms payment, which means the lower platform fee
 * (Pro = 5%, Elite = 0%) is enforced immediately on every subsequent sale.
 */
const UpgradePro = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState<"free" | "pro" | "elite">("free");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login?next=/dashboard/upgrade"); return; }
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_pro, is_elite")
        .eq("id", session.user.id)
        .maybeSingle();
      if (profile?.is_elite) setCurrentTier("elite");
      else if (profile?.is_pro) setCurrentTier("pro");
      setReady(true);
    })();
  }, [navigate]);

  const checkout = async (tier: "pro" | "elite") => {
    setLoading(tier);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: STRIPE_TIERS[tier].price_id },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast({ title: "Checkout error", description: err?.message || "Failed to start checkout", variant: "destructive" });
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

  const benefits = [
    {
      icon: <VerifiedBadge className="w-5 h-5" />,
      title: "Verified badge",
      desc: "A blue check on your profile, products, and link-in-bio — instant credibility for fans and brands.",
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Lower platform fee",
      desc: "Drop from 10% to 5% on Pro, or 0% on Elite. Applied automatically the moment your subscription becomes active.",
    },
    {
      icon: <Star className="w-5 h-5" />,
      title: "Featured placement",
      desc: "Pro & Elite creators get priority in search and the Explore feed.",
    },
    {
      icon: <ShieldCheck className="w-5 h-5" />,
      title: "Brand protection",
      desc: "Verified status helps prevent impersonation and unlocks brand-deal eligibility in the Marketplace.",
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: "Premium themes",
      desc: "Access every profile theme and color preset — set your page apart from free creators.",
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Priority support",
      desc: "Skip the queue. Pro gets fast-tracked email; Elite gets a dedicated channel.",
    },
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

      <div className="container mx-auto max-w-5xl px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-xs font-medium mb-4">
            <VerifiedBadge className="w-4 h-4" />
            Verifiedly Pro
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight">
            Get verified. Keep more of every sale.
          </h1>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            Unlock the blue badge, drop your platform fee, and stand out in search — your new fee
            takes effect the second your subscription is active.
          </p>
        </div>

        {/* Benefits grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-14">
          {benefits.map((b) => (
            <Card key={b.title} className="p-5">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-3">
                {b.icon}
              </div>
              <p className="font-display font-semibold">{b.title}</p>
              <p className="text-sm text-muted-foreground mt-1">{b.desc}</p>
            </Card>
          ))}
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-4">
          {(["free", "pro", "elite"] as const).map((id) => {
            const t = STRIPE_TIERS[id];
            const isCurrent = id === currentTier;
            const featured = id === "elite";
            return (
              <Card
                key={id}
                className={`p-6 relative flex flex-col ${
                  isCurrent ? "border-2 border-primary ring-2 ring-primary/20" : "border"
                } ${featured ? "bg-gradient-to-b from-amber-50/50 to-background dark:from-amber-950/20" : ""}`}
              >
                {isCurrent && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-0.5 rounded-full font-medium">
                    Your plan
                  </span>
                )}
                <div className="flex items-center gap-2 mb-2">
                  {id === "pro" && <VerifiedBadge className="w-5 h-5" />}
                  {id === "elite" && <Crown className="w-5 h-5 text-amber-500" />}
                  <h3 className="font-display font-bold text-xl">{t.name}</h3>
                </div>
                <p className="text-3xl font-display font-bold">
                  ${t.price}
                  <span className="text-sm font-normal text-muted-foreground">{id === "free" ? "" : "/mo"}</span>
                </p>
                <p className="text-xs text-muted-foreground mb-4 mt-1">
                  {t.fee_percent}% platform fee
                </p>
                <ul className="space-y-2 mb-6 text-sm flex-1">
                  {(id === "free"
                    ? ["Link-in-bio", "Sell digital products", "10% platform fee"]
                    : id === "pro"
                    ? ["Verified badge", "5% platform fee — applied instantly", "Premium themes", "Priority support", "Featured in Explore"]
                    : ["Verified badge + Elite crown", "0% platform fee — keep 100%", "Top placement in search", "Dedicated support", "Early access to new features", "Brand-deal priority"]
                  ).map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {!ready ? (
                  <Button variant="outline" disabled className="w-full">Loading…</Button>
                ) : isCurrent ? (
                  id === "free" ? (
                    <Button variant="outline" disabled className="w-full">Current plan</Button>
                  ) : (
                    <Button variant="outline" className="w-full" onClick={openPortal} disabled={loading === "portal"}>
                      {loading === "portal" ? "Opening…" : "Manage subscription"}
                    </Button>
                  )
                ) : id === "free" ? (
                  <Button variant="outline" disabled className="w-full">Default</Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={featured ? "default" : "outline"}
                    onClick={() => checkout(id)}
                    disabled={loading === id}
                  >
                    {loading === id ? "Loading…" : `Upgrade to ${t.name}`}
                  </Button>
                )}
              </Card>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Cancel anytime from the billing portal. Your lower fee applies the moment Stripe confirms
          payment — no waiting period.
        </p>
      </div>
    </div>
  );
};

export default UpgradePro;