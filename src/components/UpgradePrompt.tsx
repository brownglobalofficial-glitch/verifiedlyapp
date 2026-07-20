import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, Crown, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { STRIPE_TIERS } from "@/lib/stripe-config";
import { useToast } from "@/hooks/use-toast";
import VerifiedBadge from "@/components/VerifiedBadge";

interface UpgradePromptProps {
  currentTier: "free" | "pro" | "elite";
  trigger?: React.ReactNode;
}

const UpgradePrompt = ({ currentTier, trigger }: UpgradePromptProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCheckout = async (tier: "pro" | "elite") => {
    setLoading(tier);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: STRIPE_TIERS[tier].price_id },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to start checkout", variant: "destructive" });
    }
    setLoading(null);
  };

  const tiers = [
    {
      id: "free" as const,
      name: "Free",
      price: "$0",
      features: ["Basic link-in-bio", "Digital products", "10% platform fee"],
      icon: null,
    },
    {
      id: "pro" as const,
      name: "Pro",
      price: "$4.99/mo",
      features: ["Verified badge", "5% platform fee", "Priority support", "Custom themes", "Analytics"],
      icon: <VerifiedBadge className="w-5 h-5" />,
    },
    {
      id: "elite" as const,
      name: "Elite",
      price: "$19.99/mo",
      features: ["Verified badge", "0% platform fee", "Featured placement", "Dedicated support", "Early access", "Custom branding"],
      icon: <Crown className="w-5 h-5 text-amber-500" />,
    },
  ];

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Card
          className="p-6 cursor-pointer border-2 border-foreground card-hover"
          onClick={() => setOpen(true)}
        >
          <Zap className="w-8 h-8 mb-3" />
          <h3 className="font-display font-semibold text-lg">Upgrade Plan</h3>
          <p className="text-sm text-muted-foreground">
            {currentTier === "free" ? "Get verified from $4.99/mo" : "Manage your subscription"}
          </p>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display">Choose Your Plan</DialogTitle>
          </DialogHeader>
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            {tiers.map(tier => {
              const isCurrent = tier.id === currentTier;
              return (
                <Card
                  key={tier.id}
                  className={`p-5 relative ${isCurrent ? "border-2 border-primary ring-2 ring-primary/20" : "border"} ${tier.id === "elite" ? "bg-gradient-to-b from-amber-50/50 to-background dark:from-amber-950/20" : ""}`}
                >
                  {isCurrent && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-0.5 rounded-full font-medium">
                      Current
                    </span>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    {tier.icon}
                    <h3 className="font-display font-bold text-lg">{tier.name}</h3>
                  </div>
                  <p className="text-2xl font-display font-bold mb-4">{tier.price}</p>
                  <ul className="space-y-2 mb-6">
                    {tier.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {tier.id !== "free" && !isCurrent && (
                    <Button
                      className="w-full"
                      variant={tier.id === "elite" ? "default" : "outline"}
                      onClick={() => handleCheckout(tier.id)}
                      disabled={loading === tier.id}
                    >
                      {loading === tier.id ? "Loading..." : `Upgrade to ${tier.name}`}
                    </Button>
                  )}
                  {isCurrent && tier.id !== "free" && (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UpgradePrompt;
