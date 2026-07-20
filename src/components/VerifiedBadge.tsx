import { forwardRef } from "react";

const VerifiedBadge = forwardRef<SVGSVGElement, { className?: string; label?: string }>(
  ({ className = "w-5 h-5", label = "Verifiedly identity verified" }, ref) => (
    <svg ref={ref} viewBox="0 0 24 24" className={className} role="img" aria-label={label}>
      <title>{label}</title>
      <path
        d="M12 1.75 14.18 3l2.48-.15 1.18 2.18 2.18 1.18-.15 2.48L21.25 12l-1.38 3.31.15 2.48-2.18 1.18-1.18 2.18-2.48-.15L12 22.25 9.82 21l-2.48.15-1.18-2.18-2.18-1.18.15-2.48L2.75 12l1.38-3.31-.15-2.48 2.18-1.18 1.18-2.18 2.48.15L12 1.75Z"
        fill="hsl(217 91% 58%)"
      />
      <path
        d="M7.45 7.25h2.18L12 13.69l2.37-6.44h2.18l-3.58 9.5h-1.94l-3.58-9.5Z"
        fill="white"
      />
    </svg>
  ),
);

VerifiedBadge.displayName = "VerifiedBadge";

export default VerifiedBadge;
