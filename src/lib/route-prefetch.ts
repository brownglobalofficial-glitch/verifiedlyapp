// Centralized lazy route loaders so we can prefetch the same chunk
// that <Suspense>/React.lazy will request later.

export const routeLoaders = {
  "/": () => import("@/pages/Index"),
  "/login": () => import("@/pages/Login"),
  "/signup": () => import("@/pages/SignupMembership"),
  "/forgot-password": () => import("@/pages/ForgotPassword"),
  "/reset-password": () => import("@/pages/ResetPassword"),
  "/onboarding": () => import("@/pages/OnboardingMembership"),
  "/terms": () => import("@/pages/Terms"),
  "/privacy": () => import("@/pages/Privacy"),
  "/dashboard": () => import("@/pages/Dashboard"),
  "/dashboard/settings": () => import("@/pages/ProfileSettings"),
  "/dashboard/admin": () => import("@/pages/Admin"),
  "/dashboard/membership": () => import("@/pages/dashboard/Membership"),
  "/dashboard/verification": () => import("@/pages/dashboard/Verification"),
  "/dashboard/tap-card": () => import("@/pages/dashboard/MembershipTapCard"),
  "/directory": () => import("@/pages/Directory"),
  "/pricing": () => import("@/pages/Pricing"),
  "/creator-profile": () => import("@/pages/CreatorProfile"),
} as const;

export type PrefetchKey = keyof typeof routeLoaders;

const started = new Set<string>();
export const prefetchRoute = (key: PrefetchKey) => {
  if (started.has(key)) return;
  started.add(key);
  const loader = routeLoaders[key];
  if (loader) loader().catch(() => started.delete(key));
};

export const prefetchPath = (path: string) => {
  if (path in routeLoaders) {
    prefetchRoute(path as PrefetchKey);
    return;
  }
  const segs = path.split("/").filter(Boolean);
  if (segs.length === 1) prefetchRoute("/creator-profile");
  else if (segs.length >= 2 && (segs[1] === "membership" || segs[1] === "p")) prefetchRoute("/creator-profile");
};

export const prefetchIdle = (keys: PrefetchKey[]) => {
  const run = () => keys.forEach(prefetchRoute);
  const w = window as Window & {
    requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  };
  if (typeof w.requestIdleCallback === "function") {
    w.requestIdleCallback(run, { timeout: 2000 });
  } else {
    setTimeout(run, 600);
  }
};
