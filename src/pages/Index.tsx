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
    let cancelled = false;
    // Safety timeout: never block the landing page on auth more than 1.5s
    const timeout = setTimeout(() => {
      if (!cancelled) setChecking(false);
    }, 1500);

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (cancelled) return;
        clearTimeout(timeout);
        if (session) {
          navigate("/dashboard", { replace: true });
        } else {
          setChecking(false);
        }
      })
      .catch(() => {
        if (cancelled) return;
        clearTimeout(timeout);
        setChecking(false);
      });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [navigate]);

  // Render the landing page even while checking — avoids ever showing a blank screen
  // if Supabase auth is slow, blocked by third-party cookie settings, or offline.

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
