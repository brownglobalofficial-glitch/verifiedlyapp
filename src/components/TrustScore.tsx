import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ShieldCheck, Star, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export type TrustTier = "unverified" | "verified" | "trusted" | "elite";

export function trustTierFor(score: number, isElite = false): TrustTier {
  if (score >= 95 && isElite) return "elite";
  if (score >= 80) return "trusted";
  if (score >= 60) return "verified";
  return "unverified";
}

export interface TrustSignal {
  label: string;
  done: boolean;
  points: number;
}

interface TrustScoreProps {
  score: number;
  isElite?: boolean;
  signals?: TrustSignal[];
  size?: "sm" | "md";
  className?: string;
}

const tierMeta: Record<TrustTier, { label: string; Icon: typeof ShieldCheck; classes: string }> = {
  unverified: { label: "Unverified", Icon: ShieldCheck, classes: "bg-muted text-muted-foreground" },
  verified:   { label: "Verified",   Icon: BadgeCheck,  classes: "bg-secondary text-foreground border border-border" },
  trusted:    { label: "Trusted",    Icon: BadgeCheck,  classes: "bg-foreground text-background" },
  elite:      { label: "Elite Verified", Icon: Star,    classes: "bg-foreground text-background ring-2 ring-foreground/30" },
};

const TrustScore = ({ score, isElite = false, signals, size = "md", className }: TrustScoreProps) => {
  const tier = trustTierFor(score, isElite);
  const meta = tierMeta[tier];
  const { Icon } = meta;
  const sizing = size === "sm" ? "px-2 py-0.5 text-[10px] gap-1" : "px-2.5 py-1 text-xs gap-1.5";
  const iconSize = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";

  const pill = (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold",
        sizing,
        meta.classes,
        className,
      )}
      aria-label={`Trust score ${score} of 100, tier ${meta.label}`}
    >
      <Icon className={iconSize} />
      {meta.label}
      <span className="opacity-70 font-normal">· {score}</span>
    </span>
  );

  if (!signals || signals.length === 0) return pill;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full">
          {pill}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="center">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-display font-semibold">Trust Score</p>
            <span className="text-xs text-muted-foreground">{score} / 100</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-foreground rounded-full transition-all"
              style={{ width: `${score}%` }}
            />
          </div>
          <ul className="text-xs space-y-1 pt-2">
            {signals.map((s) => (
              <li key={s.label} className="flex items-center justify-between gap-2">
                <span className={s.done ? "text-foreground" : "text-muted-foreground"}>
                  {s.done ? "✓" : "○"} {s.label}
                </span>
                <span className="text-muted-foreground tabular-nums">+{s.points}</span>
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-muted-foreground pt-1 border-t border-border">
            Only factual signals you've connected. You can remove any of them at any time.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default TrustScore;