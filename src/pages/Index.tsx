import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import logoMark from "@/assets/verifiedly-v-mark.png";
import { ArrowRight } from "lucide-react";

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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-10 font-sans">
      <Helmet>
        <title>Verifiedly — Your Official Profile, Everywhere</title>
        <meta name="description" content="Create one official profile and share it by link, QR, Verifiedly Tap, or supported Verifiedly sign-in." />
        <meta property="og:title" content="Verifiedly — Your Official Profile, Everywhere" />
        <meta property="og:description" content="Create. Verify. Share your official profile everywhere." />
        <meta property="og:url" content="https://verifiedly.app/" />
        <link rel="canonical" href="https://verifiedly.app/" />
      </Helmet>

      <main className="w-full max-w-sm flex flex-col items-center">
        <div className="text-center mb-14 sm:mb-18">
          <img src={logoMark} alt="Verifiedly" className="h-12 w-12 object-contain mx-auto mb-5" />
          <h1 className="text-4xl font-display font-black tracking-tighter uppercase text-foreground mb-3">
            Verifiedly<span className="sr-only"> — Your Official Profile, Everywhere</span>
          </h1>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
            Your official profile, everywhere.
          </p>
        </div>

        <div className="text-center mb-10 max-w-[320px]">
          <p className="text-lg font-display font-semibold text-foreground">Create · Verify · Share</p>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
            Show who you are and what you have accomplished. Share one official profile by link, QR or Verifiedly Tap.
          </p>
        </div>

        <div className="w-full space-y-3">
          <Link
            to="/signup"
            className="group relative flex items-center justify-center w-full bg-foreground text-background py-4 px-8 text-xs font-bold uppercase tracking-widest transition-all hover:bg-foreground/90"
          >
            <span>Create free profile</span>
            <ArrowRight className="absolute right-6 w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={2} />
          </Link>
          <Link
            to="/login"
            className="flex items-center justify-center w-full bg-transparent border-2 border-foreground text-foreground py-4 px-8 text-xs font-bold uppercase tracking-widest transition-all hover:bg-foreground hover:text-background"
          >
            Sign in
          </Link>
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground leading-relaxed max-w-[310px]">
          Free official profile · Pro $4.99/month or $49.99/year · Adult identity verification included with eligible Pro accounts
        </p>

        <footer className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
          <Link to="/refunds" className="hover:text-foreground transition-colors">Refunds</Link>
          <Link to="/developers" className="hover:text-foreground transition-colors">Developers</Link>
        </footer>
      </main>
    </div>
  );
};

export default Index;
