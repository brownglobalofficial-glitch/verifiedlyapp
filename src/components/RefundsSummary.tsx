import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

/**
 * Plain-language refund disclosure shown above the Pay button on
 * Product and Membership checkout screens. This satisfies the
 * Stripe Connect requirement that the merchant of record's refund
 * policy be visible at the point of sale.
 */
export default function RefundsSummary({
  type,
}: {
  type: "product" | "membership";
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5 text-xs leading-relaxed">
      <div className="flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-foreground/70" />
        <div className="space-y-1.5">
          <p className="font-semibold text-foreground text-[13px]">Refund policy</p>
          {type === "product" ? (
            <p className="text-muted-foreground">
              Digital products are sold by the creator (not Verifiedly). Refunds are handled
              directly by the creator at their discretion. Once a downloadable file has been
              accessed, it is generally non-refundable.
            </p>
          ) : (
            <p className="text-muted-foreground">
              Memberships are sold by the creator (not Verifiedly). You can cancel anytime
              and you'll keep access until the end of your current billing period. Past
              charges are generally non-refundable.
            </p>
          )}
          <Link to="/refunds" className="inline-block underline text-foreground hover:opacity-70">
            Read full refund policy
          </Link>
        </div>
      </div>
    </div>
  );
}