import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Info } from "lucide-react";
import { Link } from "react-router-dom";

type Kind = "tip" | "product" | "membership" | "subscription";

interface Props {
  amountUsd: number;
  kind: Kind;
  isPro: boolean;
  /** @deprecated Elite is retired; accepted for backward compatibility only. */
  isElite?: boolean;
  compact?: boolean;
}

// Stripe standard rate for domestic US cards. Non-US buyers may see higher
// processing fees; we show the standard rate here as an estimate.
const STRIPE_PERCENT = 2.9;
const STRIPE_FIXED = 0.3;

const labels: Record<Kind, string> = {
  tip: "tip",
  product: "sale",
  membership: "membership payment",
  subscription: "subscription payment",
};

/**
 * Seller-facing fee breakdown. Shows Stripe processing + Verifiedly platform
 * fee based on the seller's current plan, plus a clear "you receive" total.
 * Used inside the dashboard only — never surfaced on public checkout.
 */
export default function FeeBreakdown({ amountUsd, kind, isPro, isElite: _isElite = false, compact = false }: Props) {
  void _isElite;
  const feePercent = isPro ? 3 : 10;

  const rows = useMemo(() => {
    const amount = Math.max(0, Number(amountUsd) || 0);
    const stripeCut = amount > 0 ? amount * (STRIPE_PERCENT / 100) + STRIPE_FIXED : 0;
    const platformCut = amount * (feePercent / 100);
    const net = Math.max(0, amount - stripeCut - platformCut);
    return { amount, stripeCut, platformCut, net };
  }, [amountUsd, feePercent]);

  const fmt = (n: number) => `$${n.toFixed(2)}`;

  const proSavings = !isPro ? (rows.amount * (10 - 3)) / 100 : 0;

  return (
    <Card className={compact ? "p-3" : "p-4"}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
          Fee breakdown · {labels[kind]}
        </p>
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="text-muted-foreground hover:text-foreground" aria-label="About fees">
              <Info className="w-3.5 h-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="text-xs max-w-[280px]">
            <p className="font-medium mb-1">How fees work</p>
            <p className="text-muted-foreground">
              Buyers pay the sticker price. You (the seller) pay Stripe's processing fees
              plus Verifiedly's platform fee — <span className="font-medium text-foreground">10%</span> on
              Free, <span className="font-medium text-foreground">3%</span> on Pro.
              International cards may cost a bit more; final numbers appear in your Stripe payout.
            </p>
            <Link to="/pricing" className="text-foreground underline mt-1 inline-block">See pricing</Link>
          </PopoverContent>
        </Popover>
      </div>
      <dl className="text-sm space-y-1">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Buyer pays</dt>
          <dd className="font-mono">{fmt(rows.amount)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Stripe processing (~{STRIPE_PERCENT}% + ${STRIPE_FIXED.toFixed(2)})</dt>
          <dd className="font-mono">−{fmt(rows.stripeCut)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">
            Verifiedly platform fee ({feePercent}% · {isPro ? "Pro" : "Free"})
          </dt>
          <dd className="font-mono">−{fmt(rows.platformCut)}</dd>
        </div>
        <div className="flex justify-between pt-2 border-t border-border mt-2">
          <dt className="font-display font-semibold">You receive</dt>
          <dd className="font-mono font-display font-bold">{fmt(rows.net)}</dd>
        </div>
      </dl>
      {proSavings > 0.01 && (
        <Link
          to="/dashboard/upgrade"
          className="mt-3 block text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2"
        >
          Keep an extra {fmt(proSavings)} per {labels[kind]} on Pro →
        </Link>
      )}
      <p className="mt-2 text-[10px] text-muted-foreground">
        Estimate based on US card processing. International buyers may pay in their local currency at checkout.
      </p>
    </Card>
  );
}