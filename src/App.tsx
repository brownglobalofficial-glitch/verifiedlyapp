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
const TapCardOrders = lazy(() => import("./pages/admin/TapCardOrders"));
const Verification = lazy(() => import("./pages/dashboard/Verification"));
const TapCard = lazy(() => import("./pages/dashboard/TapCard"));
const Pro = lazy(() => import("./pages/dashboard/Pro"));
const TapRedirect = lazy(() => import("./pages/TapRedirect"));
const Directory = lazy(() => import("./pages/Directory"));
const Pricing = lazy(() => import("./pages/Pricing"));
const OAuthAuthorize = lazy(() => import("./pages/OAuthAuthorize"));
const Developers = lazy(() => import("./pages/Developers"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));

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
];

const LegacyProfileRedirect = () => {
  const { username } = useParams<{ username: string }>();
  return <Navigate to={username ? `/${username}` : "/"} replace />;
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

    const redirectAuthedAway = async (userId: string) => {
      if (!AUTH_PAGES.has(window.location.pathname)) return;
      void userId;
      navigate("/dashboard", { replace: true });
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        prefetchIdle(["/dashboard", "/dashboard/settings", "/dashboard/tap-card", "/dashboard/pro"]);
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
            .eq("id", session.user.id)
            .maybeSingle();
          if (profile && profile.onboarding_completed === false) {
            navigate("/onboarding");
            return;
          }
        }
        redirectAuthedAway(session.user.id);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        prefetchIdle(["/dashboard", "/dashboard/settings", "/dashboard/tap-card", "/dashboard/pro"]);
        redirectAuthedAway(session.user.id);
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
            <Route path="/dashboard/admin/tap-orders" element={<AuthGuard><TapCardOrders /></AuthGuard>} />
            <Route path="/dashboard/upgrade" element={<Navigate to="/dashboard/pro" replace />} />
            <Route path="/dashboard/billing" element={<Navigate to="/dashboard/pro" replace />} />
            <Route path="/dashboard/pro" element={<AuthGuard><Pro /></AuthGuard>} />
            <Route path="/dashboard/verification" element={<AuthGuard><Verification /></AuthGuard>} />
            <Route path="/dashboard/tap-card" element={<AuthGuard><TapCard /></AuthGuard>} />
            <Route path="/dashboard/cards" element={<Navigate to="/dashboard/tap-card" replace />} />
            <Route path="/directory" element={<AuthGuard><Directory /></AuthGuard>} />
            <Route path="/admin/verification" element={<Navigate to="/dashboard/admin" replace />} />
            <Route path="/developers" element={<Developers />} />
            <Route path="/oauth/authorize" element={<OAuthAuthorize />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/t/:token" element={<TapRedirect />} />
            <Route path="/verify/:username" element={<LegacyProfileRedirect />} />
            <Route path="/pro" element={<Navigate to="/pricing" replace />} />
            <Route path="/subscription/success" element={<Navigate to="/dashboard" replace />} />
            {RETIRED_DASHBOARD_PATHS.map((path) => (
              <Route key={path} path={path} element={<Navigate to="/dashboard" replace />} />
            ))}
            <Route path="/comparison/verifiedly-vs-linktree" element={<Navigate to="/" replace />} />
            <Route path="/pricing" element={<Pricing />} />
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
