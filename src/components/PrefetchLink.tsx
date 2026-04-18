import { forwardRef } from "react";
import { Link, LinkProps } from "react-router-dom";
import { prefetchPath } from "@/lib/route-prefetch";

/**
 * Drop-in replacement for react-router's <Link> that warms up the
 * destination route's JS chunk on hover, focus, or touch — so the
 * navigation feels instant instead of waiting on a dynamic import.
 */
const PrefetchLink = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ to, onMouseEnter, onFocus, onTouchStart, ...rest }, ref) => {
    const path = typeof to === "string" ? to : (to as any)?.pathname || "";

    const warm = () => {
      if (path) prefetchPath(path);
    };

    return (
      <Link
        ref={ref}
        to={to}
        onMouseEnter={(e) => {
          warm();
          onMouseEnter?.(e);
        }}
        onFocus={(e) => {
          warm();
          onFocus?.(e);
        }}
        onTouchStart={(e) => {
          warm();
          onTouchStart?.(e);
        }}
        {...rest}
      />
    );
  }
);

PrefetchLink.displayName = "PrefetchLink";

export default PrefetchLink;
