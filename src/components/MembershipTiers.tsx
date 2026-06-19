import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Gift, Sparkles, Users, Lock, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type Tier = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  features?: string[] | null;
};

export type Perk = {
  id: string;
  subscription_id: string;
  perk_name: string;
  perk_description?: string | null;
  unlock_url?: string | null;
  perk_type?: string | null;
};

type Props = {
  tiers: Tier[];
  perks: Record<string, Perk[]>;
  memberCounts: Record<string, number>;
  onSubscribe: (tier: Tier, interval: "month" | "year") => void;
  loadingTierId?: string | null;
  variant?: "compact" | "full"; // compact = profile, full = dedicated page
  className?: string;
  /** Subscription IDs the current viewer is actively subscribed to. */
  activeSubIds?: string[];
};

/**
 * Patreon-style tier cards.
 * - Monthly / Annual toggle (annual = price * 10, ~17% off / 2 months free)
 * - Member count per tier
 * - "Most popular" highlight on the middle tier (when 3+ tiers)
 * - Clean perks list with Gift / Check icons
 */
export default function MembershipTiers({
  tiers,
  perks,
  memberCounts,
  onSubscribe,
  loadingTierId,
  variant = "compact",
  className,
  activeSubIds = [],
}: Props) {
  const [interval, setInterval] = useState<"month" | "year">("month");

  const popularIndex = useMemo(() => {
    if (tiers.length < 3) return -1;
    // middle tier
    return Math.floor(tiers.length / 2);
  }, [tiers.length]);

  if (tiers.length === 0) return null;

  const formatPrice = (price: number) =>
    interval === "year" ? (price * 10).toFixed(price * 10 % 1 === 0 ? 0 : 2) : price.toFixed(price % 1 === 0 ? 0 : 2);

  return (
    <div className={cn("w-full", className)}>
      {/* Toggle */}
      <div className="flex items-center justify-center gap-3 mb-5">
        <div className="inline-flex items-center rounded-full border border-border bg-background p-1 text-sm">
          <button
            type="button"
            onClick={() => setInterval("month")}
            className={cn(
              "px-4 py-1.5 rounded-full transition-colors",
              interval === "month" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setInterval("year")}
            className={cn(
              "px-4 py-1.5 rounded-full transition-colors flex items-center gap-1.5",
              interval === "year" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Annual
            <span className={cn(
              "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
              interval === "year" ? "bg-background/20 text-background" : "bg-primary/10 text-primary"
            )}>
              2 MONTHS FREE
            </span>
          </button>
        </div>
      </div>

      <div
        className={cn(
          "grid gap-4",
          variant === "full"
            ? tiers.length === 1
              ? "grid-cols-1 max-w-md mx-auto"
              : tiers.length === 2
                ? "grid-cols-1 md:grid-cols-2"
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            : "grid-cols-1"
        )}
      >
        {tiers.map((tier, i) => {
          const isPopular = i === popularIndex;
          const tierPerks = perks[tier.id] || [];
          const count = memberCounts[tier.id] || 0;
          const annualTotal = (tier.price * 10).toFixed(tier.price * 10 % 1 === 0 ? 0 : 2);
          const isSubscribed = activeSubIds.includes(tier.id);

          return (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.3 }}
              className={cn(
                "relative rounded-2xl border bg-card p-5 flex flex-col",
                isSubscribed
                  ? "border-foreground shadow-lg ring-2 ring-foreground/20"
                  : isPopular
                  ? "border-primary/60 shadow-lg ring-1 ring-primary/20"
                  : "border-border shadow-sm"
              )}
            >
              {isSubscribed ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 bg-foreground text-background text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full uppercase">
                  <Check className="w-3 h-3" /> Subscribed
                </span>
              ) : isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full uppercase">
                  <Sparkles className="w-3 h-3" /> Most popular
                </span>
              )}

              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-lg leading-tight">{tier.name}</h3>
                  {tier.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{tier.description}</p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-display font-bold text-2xl leading-none">
                    ${formatPrice(tier.price)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    /{interval === "year" ? "yr" : "mo"}
                  </div>
                  {interval === "year" && (
                    <div className="text-[10px] text-muted-foreground mt-0.5 line-through">
                      ${(tier.price * 12).toFixed(tier.price * 12 % 1 === 0 ? 0 : 2)}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-3">
                <Users className="w-3 h-3" />
                {count.toLocaleString()} {count === 1 ? "member" : "members"}
              </div>

              {(tier.features?.length || tierPerks.length) ? (
                <ul className="mt-4 space-y-2 flex-1">
                  {(tier.features || []).map((f, idx) => (
                    <li key={`f-${idx}`} className="text-sm flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                  {tierPerks.map((perk) => (
                    <li key={perk.id} className="text-sm flex items-start gap-2">
                      <Gift className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div>
                          {perk.perk_name}
                          {perk.perk_description && (
                            <span className="text-muted-foreground"> — {perk.perk_description}</span>
                          )}
                        </div>
                        {perk.unlock_url && (
                          isSubscribed ? (
                            <a
                              href={perk.unlock_url}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-foreground underline underline-offset-2 hover:opacity-70"
                            >
                              Open link <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Lock className="w-3 h-3" /> Link unlocks after subscribing
                            </div>
                          )
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex-1 mt-4" />
              )}

              {isSubscribed ? (
                <Button
                  asChild
                  className="w-full mt-5 rounded-xl"
                  variant="secondary"
                  size="lg"
                >
                  <a href="/dashboard/purchases">
                    <Check className="w-4 h-4 mr-1" /> You're in — view perks
                  </a>
                </Button>
              ) : (
                <Button
                  onClick={() => onSubscribe(tier, interval)}
                  disabled={loadingTierId === tier.id}
                  className="w-full mt-5 rounded-xl"
                  variant={isPopular ? "default" : "outline"}
                  size="lg"
                >
                  {loadingTierId === tier.id
                    ? "Loading..."
                    : `Join for $${formatPrice(tier.price)}/${interval === "year" ? "yr" : "mo"}`}
                </Button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
