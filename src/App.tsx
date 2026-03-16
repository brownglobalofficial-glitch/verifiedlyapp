import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
          <Route path="/explore" element={<Explore />} />
          <Route path="/:username" element={<CreatorProfile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
