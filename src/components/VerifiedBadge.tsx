import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type VerifiedBadgeVariant = "blue" | "black" | "white" | "outline";

interface VerifiedBadgeProps {
  className?: string;
  label?: string;
  variant?: VerifiedBadgeVariant;
}

const variantClasses: Record<VerifiedBadgeVariant, string> = {
  blue: "text-blue-500",
  black: "text-black",
  white: "text-white",
  outline: "text-current",
};

const VerifiedBadge = forwardRef<SVGSVGElement, VerifiedBadgeProps>(
  ({ className = "h-5 w-5", label = "Verified account", variant = "blue" }, ref) => {
    const outlined = variant === "outline";

    return (
      <svg
        ref={ref}
        viewBox="0 0 24 24"
        className={cn(variantClasses[variant], className)}
        role="img"
        aria-label={label}
      >
        <title>{label}</title>
        <path
          d="M12 1.8l2.1 1.28 2.45-.2 1.15 2.18 2.18 1.15-.2 2.45L21.2 12l-1.52 3.34.2 2.45-2.18 1.15-1.15 2.18-2.45-.2L12 22.2l-2.1-1.28-2.45.2-1.15-2.18-2.18-1.15.2-2.45L2.8 12l1.52-3.34-.2-2.45L6.3 5.06l1.15-2.18 2.45.2L12 1.8Z"
          fill={outlined ? "none" : "currentColor"}
          stroke="currentColor"
          strokeWidth={outlined ? 1.7 : 0}
          strokeLinejoin="round"
        />
        <path
          d="m8.05 12.15 2.42 2.42 5.48-5.48"
          fill="none"
          stroke={outlined ? "currentColor" : "white"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  },
);

VerifiedBadge.displayName = "VerifiedBadge";

export default VerifiedBadge;
