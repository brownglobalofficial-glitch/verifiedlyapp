// Centralized lazy route loaders so we can prefetch the same chunk
// that <Suspense>/React.lazy will request later. Calling a loader
// kicks off the dynamic import; the browser caches the module so
// the eventual navigation renders synchronously.

export const routeLoaders = {
  "/": () => import("@/pages/Index"),
  "/login": () => import("@/pages/Login"),
  "/signup": () => import("@/pages/Signup"),
  "/forgot-password": () => import("@/pages/ForgotPassword"),
  "/reset-password": () => import("@/pages/ResetPassword"),
  "/onboarding": () => import("@/pages/Onboarding"),
  "/terms": () => import("@/pages/Terms"),
  "/privacy": () => import("@/pages/Privacy"),
  "/dashboard": () => import("@/pages/Dashboard"),
  "/dashboard/settings": () => import("@/pages/ProfileSettings"),
  "/dashboard/admin": () => import("@/pages/Admin"),
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

// Map an arbitrary URL path to a known prefetch key.
export const prefetchPath = (path: string) => {
  if (path in routeLoaders) {
    prefetchRoute(path as PrefetchKey);
    return;
  }
  // Public and retired profile subroutes all use the profile chunk.
  const segs = path.split("/").filter(Boolean);
  if (segs.length === 1) prefetchRoute("/creator-profile");
  else if (segs.length >= 2 && (segs[1] === "membership" || segs[1] === "p")) prefetchRoute("/creator-profile");
};

// Prefetch a curated set during browser idle time.
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
