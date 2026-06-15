import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import PageSkeleton from "@/components/PageSkeleton";
import { routeLoaders, prefetchIdle } from "@/lib/route-prefetch";
import AuthGuard from "@/components/AuthGuard";

const Index = lazy(routeLoaders["/"]);
const NotFound = lazy(() => import("./pages/NotFound"));
const Login = lazy(routeLoaders["/login"]);
const Signup = lazy(routeLoaders["/signup"]);
const ForgotPassword = lazy(routeLoaders["/forgot-password"]);
const ResetPassword = lazy(routeLoaders["/reset-password"]);
const Dashboard = lazy(routeLoaders["/dashboard"]);
const FanDashboard = lazy(routeLoaders["/fan"]);
const ProfileSettings = lazy(routeLoaders["/dashboard/settings"]);
const ManageProducts = lazy(routeLoaders["/dashboard/products"]);
const ManageSubscriptions = lazy(routeLoaders["/dashboard/subscriptions"]);
const Explore = lazy(routeLoaders["/explore"]);
const CreatorProfile = lazy(routeLoaders["/creator-profile"]);
const Marketplace = lazy(() => import("./pages/Marketplace"));
const Analytics = lazy(routeLoaders["/dashboard/analytics"]);
const ManageLinks = lazy(routeLoaders["/dashboard/links"]);
const Onboarding = lazy(routeLoaders["/onboarding"]);
const Terms = lazy(routeLoaders["/terms"]);
const Privacy = lazy(routeLoaders["/privacy"]);
const Refunds = lazy(() => import("./pages/Refunds"));
const Admin = lazy(routeLoaders["/dashboard/admin"]);
const ManageContent = lazy(routeLoaders["/dashboard/content"]);
const Membership = lazy(routeLoaders["/membership"]);
const Product = lazy(routeLoaders["/product"]);
const Payouts = lazy(() => import("./pages/dashboard/Payouts"));
const SubscriptionSuccess = lazy(() => import("./pages/SubscriptionSuccess"));
const UpgradePro = lazy(() => import("./pages/UpgradePro"));
const Billing = lazy(() => import("./pages/dashboard/Billing"));
const Verification = lazy(() => import("./pages/dashboard/Verification"));

const queryClient = new QueryClient();

// Handles OAuth redirect + warms likely next routes so navigation feels instant.
const AUTH_PAGES = new Set(["/login", "/signup"]);

const RouteOptimizer = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Global hover/focus prefetch: warm any internal link's chunk before the click.
    const handler = (e: Event) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.("a") as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/") || href.startsWith("//")) return;
      const path = href.split("?")[0].split("#")[0];
      import("@/lib/route-prefetch").then(({ prefetchPath }) => prefetchPath(path));
    };
    document.addEventListener("mouseover", handler, { passive: true });
    document.addEventListener("focusin", handler, { passive: true });
    document.addEventListener("touchstart", handler, { passive: true });

    const redirectAuthedAway = async (userId: string) => {
      // Only redirect if currently sitting on /login or /signup
      if (!AUTH_PAGES.has(window.location.pathname)) return;
      let accountType: string | null = null;
      try {
        const profilePromise = supabase
          .from("profiles")
          .select("account_type")
          .eq("id", userId)
          .maybeSingle();
        const timeout = new Promise<{ data: null }>((resolve) =>
          setTimeout(() => resolve({ data: null }), 1500)
        );
        const result: any = await Promise.race([profilePromise, timeout]);
        accountType = result?.data?.account_type ?? null;
      } catch {
        // ignore
      }
      navigate(accountType === "fan" ? "/fan" : "/dashboard", { replace: true });
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        prefetchIdle([
          "/dashboard",
          "/dashboard/settings",
          "/dashboard/links",
          "/dashboard/analytics",
          "/dashboard/products",
        ]);
        const provider = session.user.app_metadata?.provider;
        // Only force onboarding redirect on first sign-in (not every page load),
        // and never if the user is already on /onboarding (would cause a loop).
        if (
          event === "SIGNED_IN" &&
          provider && provider !== "email" &&
          window.location.pathname !== "/onboarding"
        ) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("onboarding_completed, username")
            .eq("id", session.user.id)
            .maybeSingle();
          // Only redirect when profile exists AND onboarding is explicitly false.
          // If profile is missing, the trigger will create it; don't bounce the user.
          if (profile && profile.onboarding_completed === false) {
            navigate("/onboarding");
            return;
          }
        }
        // Auto-redirect away from /login or /signup
        redirectAuthedAway(session.user.id);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        prefetchIdle(["/dashboard", "/dashboard/settings", "/dashboard/links", "/dashboard/analytics"]);
        redirectAuthedAway(session.user.id);
      } else {
        prefetchIdle(["/login", "/signup", "/explore"]);
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
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/settings" element={<ProfileSettings />} />
            <Route path="/dashboard/products" element={<ManageProducts />} />
            <Route path="/dashboard/subscriptions" element={<ManageSubscriptions />} />
            <Route path="/dashboard/analytics" element={<Analytics />} />
            <Route path="/dashboard/marketplace" element={<Marketplace />} />
            <Route path="/dashboard/links" element={<ManageLinks />} />
            <Route path="/dashboard/content" element={<ManageContent />} />
            <Route path="/dashboard/admin" element={<Admin />} />
            <Route path="/dashboard/payouts" element={<Payouts />} />
            <Route path="/dashboard/upgrade" element={<AuthGuard><UpgradePro /></AuthGuard>} />
            <Route path="/dashboard/billing" element={<AuthGuard><Billing /></AuthGuard>} />
            <Route path="/dashboard/verification" element={<AuthGuard><Verification /></AuthGuard>} />
            <Route path="/pro" element={<AuthGuard><UpgradePro /></AuthGuard>} />
            <Route path="/subscription/success" element={<SubscriptionSuccess />} />
            <Route path="/fan" element={<FanDashboard />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/:username" element={<CreatorProfile />} />
            <Route path="/:username/membership" element={<Membership />} />
            <Route path="/:username/p/:productId" element={<Product />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
