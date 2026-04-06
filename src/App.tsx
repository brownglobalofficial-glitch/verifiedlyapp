import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import FanDashboard from "./pages/FanDashboard";
import ProfileSettings from "./pages/ProfileSettings";
import ManageProducts from "./pages/ManageProducts";
import ManageSubscriptions from "./pages/ManageSubscriptions";
import Explore from "./pages/Explore";
import CreatorProfile from "./pages/CreatorProfile";
import Marketplace from "./pages/Marketplace";
import Analytics from "./pages/Analytics";
import ManageLinks from "./pages/ManageLinks";
import Onboarding from "./pages/Onboarding";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Admin from "./pages/Admin";
import ManageContent from "./pages/ManageContent";

const queryClient = new QueryClient();

// Handles OAuth redirect: if user signed in via OAuth and hasn't completed onboarding, redirect to /onboarding
const OAuthRedirectHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        // Check if this is an OAuth user who needs onboarding
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
