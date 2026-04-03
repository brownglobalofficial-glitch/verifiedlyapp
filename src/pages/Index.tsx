import { useEffect, useState } from "react";
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
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard", { replace: true });
      } else {
        setChecking(false);
      }
    });
  }, [navigate]);

  if (checking) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Features />
      <FeaturedCreators />
      <Pricing />
      <Footer />
    </div>
  );
};

export default Index;
