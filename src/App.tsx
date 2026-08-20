import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import PageSkeleton from "@/components/PageSkeleton";
import { routeLoaders, prefetchIdle, prefetchPath } from "@/lib/route-prefetch";
import AuthGuard from "@/components/AuthGuard";

const Index = lazy(routeLoaders["/"]);
const NotFound = lazy(() => import("./pages/NotFound"));
const Login = lazy(routeLoaders["/login"]);
const Signup = lazy(routeLoaders["/signup"]);
const ForgotPassword = lazy(routeLoaders["/forgot-password"]);
const ResetPassword = lazy(routeLoaders["/reset-password"]);
const Dashboard = lazy(routeLoaders["/dashboard"]);
const ProfileSettings = lazy(routeLoaders["/dashboard/settings"]);
const CreatorProfile = lazy(routeLoaders["/creator-profile"]);
const Onboarding = lazy(routeLoaders["/onboarding"]);
const Terms = lazy(routeLoaders["/terms"]);
const Privacy = lazy(routeLoaders["/privacy"]);
const Refunds = lazy(() => import("./pages/Refunds"));
const Admin = lazy(routeLoaders["/dashboard/admin"]);
const Verification = lazy(() => import("./pages/dashboard/Verification"));
const Directory = lazy(() => import("./pages/Directory"));
const Pricing = lazy(() => import("./pages/Pricing"));
const OAuthAuthorize = lazy(() => import("./pages/OAuthAuthorize"));
const Developers = lazy(() => import("./pages/Developers"));
const DeveloperTest = lazy(() => import("./pages/DeveloperTest"));
const Legal = lazy(() => import("./pages/Legal"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));

const queryClient = new QueryClient();

const AUTH_PAGES = new Set(["/login", "/signup"]);
const RETIRED_DASHBOARD_PATHS = [
  "/dashboard/products",
  "/dashboard/subscriptions",
  "/dashboard/analytics",
  "/dashboard/marketplace",
  "/dashboard/content",
  "/dashboard/payouts",
  "/dashboard/privacy-controls",
  "/dashboard/disputes",
  "/dashboard/monetization",
  "/dashboard/purchases",
  "/dashboard/credentials",
  "/dashboard/documents",
  "/dashboard/organization-verification",
  "/dashboard/cards",
  "/dashboard/admin/tap-orders",
];

const LegacyProfileRedirect = () => {
  const { username } = useParams<{ username: string }>();
  return <Navigate to={username ? `/${username}` : "/"} replace />;
};

const getSafeAuthNextPath = () => {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
};

const RouteOptimizer = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handler = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.("a") as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/") || href.startsWith("//")) return;
      prefetchPath(href.split("?")[0].split("#")[0]);
    };
    document.addEventListener("mouseover", handler, { passive: true });
    document.addEventListener("focusin", handler, { passive: true });
    document.addEventListener("touchstart", handler, { passive: true });

    const redirectAuthedAway = () => {
      if (!AUTH_PAGES.has(window.location.pathname)) return;
      navigate(getSafeAuthNextPath() || "/dashboard", { replace: true });
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        prefetchIdle(["/dashboard", "/dashboard/settings"]);
        if (AUTH_PAGES.has(window.location.pathname) && getSafeAuthNextPath()) {
          redirectAuthedAway();
          return;
        }
        const provider = session.user.app_metadata?.provider;
        if (
          event === "SIGNED_IN"
          && provider
          && provider !== "email"
          && window.location.pathname !== "/onboarding"
        ) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("onboarding_completed, username")
            .eq("id", session.user.id as any)
            .maybeSingle();
          if (profile && (profile as any).onboarding_completed === false) {
            navigate("/onboarding");
            return;
          }
        }
        redirectAuthedAway();
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        prefetchIdle(["/dashboard", "/dashboard/settings"]);
        redirectAuthedAway();
      } else {
        prefetchIdle(["/login", "/signup"]);
      }
    });

    return () => {
      subscription.unsubscribe();
      document.removeEventListener("mouseover", handler);
      document.removeEventListener("focusin", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [navigate, location.pathname]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <RouteOptimizer />
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/refunds" element={<Refunds />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
            <Route path="/dashboard/settings" element={<AuthGuard><ProfileSettings /></AuthGuard>} />
            <Route path="/dashboard/links" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard/admin" element={<AuthGuard><Admin /></AuthGuard>} />
            <Route path="/dashboard/upgrade" element={<Navigate to="/dashboard/verification" replace />} />
            <Route path="/dashboard/billing" element={<Navigate to="/dashboard/verification" replace />} />
            <Route path="/dashboard/pro" element={<Navigate to="/dashboard/verification" replace />} />
            <Route path="/dashboard/membership" element={<Navigate to="/dashboard/verification" replace />} />
            <Route path="/dashboard/verification" element={<AuthGuard><Verification /></AuthGuard>} />
            <Route path="/directory" element={<AuthGuard><Directory /></AuthGuard>} />
            <Route path="/admin/verification" element={<Navigate to="/dashboard/admin" replace />} />
            <Route path="/developers" element={<Developers />} />
            <Route path="/developers/test" element={<DeveloperTest />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/about" element={<Navigate to="/legal" replace />} />
            <Route path="/oauth/authorize" element={<OAuthAuthorize />} />
            <Route path="/oauth/consent" element={<OAuthAuthorize />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/verify/:username" element={<LegacyProfileRedirect />} />
            <Route path="/pro" element={<Navigate to="/pricing" replace />} />
            <Route path="/membership" element={<Navigate to="/pricing" replace />} />
            <Route path="/subscription/success" element={<Navigate to="/dashboard/verification" replace />} />
            {RETIRED_DASHBOARD_PATHS.map((path) => (
              <Route key={path} path={path} element={<Navigate to="/dashboard" replace />} />
            ))}
            <Route path="/comparison/verifiedly-vs-linktree" element={<Navigate to="/" replace />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/:username" element={<CreatorProfile />} />
            <Route path="/:username/membership" element={<LegacyProfileRedirect />} />
            <Route path="/:username/p/:productId" element={<LegacyProfileRedirect />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
