import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TrendingUp, ArrowRight } from "lucide-react";
import { STRIPE_TIERS } from "@/lib/stripe-config";

interface Props {
  currentTier: "free" | "pro" | "elite";
}

/**
 * Live calculator that shows exactly how much a creator nets per sale or tip
 * under each plan. Helps justify the upgrade by quantifying the fee difference.
 */
const FeePreview = ({ currentTier }: Props) => {
  const [amount, setAmount] = useState(50);

  const rows = useMemo(() => {
    return (["free", "pro", "elite"] as const).map((id) => {
      const fee = STRIPE_TIERS[id].fee_percent;
      const platformCut = (amount * fee) / 100;
      const net = amount - platformCut;
      return { id, name: STRIPE_TIERS[id].name, fee, platformCut, net };
    });
  }, [amount]);

  const proSavings = rows[0].platformCut - rows[1].platformCut;
  const eliteSavings = rows[0].platformCut - rows[2].platformCut;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-display font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Fee preview
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            See exactly what you'd keep on a ${amount} sale or tip.
          </p>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-muted capitalize">
          You: {currentTier}
        </span>
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="text-muted-foreground">Sale amount</span>
          <span className="font-display font-bold">${amount}</span>
        </div>
        <Slider
          value={[amount]}
          min={1}
          max={500}
          step={1}
          onValueChange={(v) => setAmount(v[0])}
          aria-label="Sale amount"
        />
      </div>

      <div className="space-y-2">
        {rows.map((r) => {
          const isCurrent = r.id === currentTier;
          return (
            <div
              key={r.id}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                isCurrent ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{r.name}</span>
                <span className="text-xs text-muted-foreground">{r.fee}% fee</span>
                {isCurrent && (
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                    you
                  </span>
                )}
              </div>
              <div className="text-right">
                <p className="font-display font-bold text-sm">${r.net.toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground">
                  −${r.platformCut.toFixed(2)} fee
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {currentTier === "free" && (proSavings > 0 || eliteSavings > 0) && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">
            On this sale you'd save <span className="font-semibold text-foreground">${proSavings.toFixed(2)}</span> with Pro
            {" "}or <span className="font-semibold text-foreground">${eliteSavings.toFixed(2)}</span> with Elite.
          </p>
          <Link to="/dashboard/upgrade">
            <Button size="sm" className="w-full gap-2">
              Lower my fee <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      )}
    </Card>
  );
};

export default FeePreview;
