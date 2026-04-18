import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import PageSkeleton from "@/components/PageSkeleton";

const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const FanDashboard = lazy(() => import("./pages/FanDashboard"));
const ProfileSettings = lazy(() => import("./pages/ProfileSettings"));
const ManageProducts = lazy(() => import("./pages/ManageProducts"));
const ManageSubscriptions = lazy(() => import("./pages/ManageSubscriptions"));
const Explore = lazy(() => import("./pages/Explore"));
const CreatorProfile = lazy(() => import("./pages/CreatorProfile"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const Analytics = lazy(() => import("./pages/Analytics"));
const ManageLinks = lazy(() => import("./pages/ManageLinks"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Admin = lazy(() => import("./pages/Admin"));
const ManageContent = lazy(() => import("./pages/ManageContent"));
const Membership = lazy(() => import("./pages/Membership"));
const Product = lazy(() => import("./pages/Product"));

const queryClient = new QueryClient();

// Handles OAuth redirect: if user signed in via OAuth and hasn't completed onboarding, redirect to /onboarding
const OAuthRedirectHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        const provider = session.user.app_metadata?.provider;
        if (provider && provider !== "email") {
          const { data: profile } = await supabase
            .from("profiles")
            .select("onboarding_completed, username")
            .eq("id", session.user.id)
            .maybeSingle();
          
          if (!profile?.onboarding_completed) {
            navigate("/onboarding");
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <OAuthRedirectHandler />
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
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
