import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import logoMark from "@/assets/verifiedly-mark.png";

const Index = () => {
  const navigate = useNavigate();
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled && session) navigate("/dashboard", { replace: true });
    });
    return () => { cancelled = true; };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <Helmet>
        <title>Verifiedly — Prove you're real. Once.</title>
        <meta name="description" content="Government-ID verified identity for the internet. One check, blue badge everywhere." />
      </Helmet>
      <main className="w-full max-w-sm text-center space-y-8">
        <img src={logoMark} alt="Verifiedly" className="h-14 w-14 mx-auto" />
        <div className="space-y-2">
          <h1 className="text-3xl font-display font-bold tracking-tight">Prove you're real.</h1>
          <p className="text-sm text-muted-foreground">Verified identity + link-in-bio for creators, businesses, and people who show up as themselves.</p>
        </div>
        <div className="space-y-2">
          <Link to="/signup" className="block">
            <Button size="lg" className="w-full">Create account</Button>
          </Link>
          <Link to="/login" className="block">
            <Button size="lg" variant="outline" className="w-full">Sign in</Button>
          </Link>
        </div>
      </main>
      <footer className="mt-16 text-xs text-muted-foreground flex gap-4">
        <Link to="/terms" className="hover:text-foreground">Terms</Link>
        <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
        <Link to="/developers" className="hover:text-foreground">Developers</Link>
      </footer>
    </div>
  );
};

export default Index;
