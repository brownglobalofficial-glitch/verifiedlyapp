import { ReactNode } from "react";
import { Lock, Crown, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface TierLockProps {
  /** The feature requires at least this tier. */
  requires: "pro" | "elite";
  /** Current user tier. */
  userTier: "free" | "pro" | "elite";
  title: string;
  description?: string;
  children: ReactNode;
}

/**
 * Wraps a feature so it's only usable on Pro/Elite. When the user doesn't
 * meet the tier, shows a polished upsell card instead of the children.
 */
const TierLock = ({ requires, userTier, title, description, children }: TierLockProps) => {
  const order = { free: 0, pro: 1, elite: 2 } as const;
  const allowed = order[userTier] >= order[requires];
  if (allowed) return <>{children}</>;

  const Icon = requires === "elite" ? Crown : Sparkles;
  return (
    <Card className="p-6 border-2 border-dashed border-muted-foreground/20 bg-muted/20 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-background border mb-3">
        <Icon className={`w-5 h-5 ${requires === "elite" ? "text-amber-500" : ""}`} />
      </div>
      <h3 className="font-display font-semibold text-lg flex items-center justify-center gap-1.5">
        <Lock className="w-3.5 h-3.5" /> {title}
      </h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
        {description || `This is a Verifiedly ${requires === "elite" ? "Elite" : "Pro"} feature.`}
      </p>
      <Link to="/pro">
        <Button size="sm" className="mt-4 gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          Upgrade to {requires === "elite" ? "Elite" : "Pro"}
        </Button>
      </Link>
    </Card>
  );
};

export default TierLock;