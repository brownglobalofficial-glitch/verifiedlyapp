import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import FeaturedCreators from "@/components/landing/FeaturedCreators";
import Pricing from "@/components/landing/Pricing";
import FanCTA from "@/components/landing/FanCTA";
import Footer from "@/components/landing/Footer";

const Index = () => {
  const navigate = useNavigate();

  // Render landing immediately — never block first paint on auth.
  // Auth check runs in background; only redirects logged-in users opportunistically.
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled && session) navigate("/dashboard", { replace: true });
    });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Features />
      <FeaturedCreators />
      <FanCTA />
      <Pricing />
      <Footer />
    </div>
  );
};

export default Index;
