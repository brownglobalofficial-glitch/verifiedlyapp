import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import VerifiedBadge from "@/components/VerifiedBadge";
import { Crown, X } from "lucide-react";

interface Props {
  userId: string;
  initialTier: "free" | "pro" | "elite";
  /** Called when tier changes so parent can refresh state. */
  onTierChange?: (tier: "free" | "pro" | "elite") => void;
}

const tierRank = { free: 0, pro: 1, elite: 2 } as const;

/**
 * Listens for live profile updates (webhook flips is_pro / is_elite the moment
 * Stripe confirms payment). When the tier upgrades, shows a celebratory badge
 * animation overlay.
 */
const TierUpgradeCelebration = ({ userId, initialTier, onTierChange }: Props) => {
  const [show, setShow] = useState<null | "pro" | "elite">(null);
  const lastTier = useRef(initialTier);

  useEffect(() => {
    lastTier.current = initialTier;
  }, [initialTier]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`profile-tier-${userId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${userId}` },
        (payload: any) => {
          const next: "free" | "pro" | "elite" = payload.new?.is_elite
            ? "elite"
            : payload.new?.is_pro
            ? "pro"
            : "free";
          const prev = lastTier.current;
          if (tierRank[next] > tierRank[prev] && next !== "free") {
            setShow(next);
            setTimeout(() => setShow(null), 5500);
          }
          lastTier.current = next;
          onTierChange?.(next);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onTierChange]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={() => setShow(null)}
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
            className="relative bg-card border border-border rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShow(null)}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: [0, 1.3, 1], rotate: [0, 15, 0] }}
              transition={{ duration: 0.9, times: [0, 0.6, 1] }}
              className="mx-auto mb-4 inline-flex"
            >
              {show === "elite" ? (
                <Crown className="w-20 h-20 text-amber-500 drop-shadow-lg" />
              ) : (
                <VerifiedBadge className="w-20 h-20" />
              )}
            </motion.div>

            {/* Sparkle ring */}
            <motion.div
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: 2.4, opacity: 0 }}
              transition={{ duration: 1.4, ease: "easeOut" }}
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-2 ${
                show === "elite" ? "border-amber-400" : "border-primary"
              }`}
            />

            <h2 className="text-2xl font-display font-bold">
              You're now {show === "elite" ? "Elite" : "Verifiedly Pro"}!
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              {show === "elite"
                ? "0% platform fee is now active. Your crown is live across the platform."
                : "Your verified badge is live and your fee just dropped to 5%."}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TierUpgradeCelebration;
