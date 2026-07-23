import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logoMark from "@/assets/verifiedly-mark.png";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled && session) navigate("/dashboard", { replace: true });
    });
    return () => { cancelled = true; };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-10 font-sans">
      <Helmet>
        <title>Verifiedly — Your official profile and account</title>
        <meta name="description" content="Create an official profile, use one secure account across connected apps, and explore Pro identity-verification and NFC Tap Card benefits." />
        <meta property="og:title" content="Verifiedly — Your official profile and account" />
        <meta property="og:description" content="Create one official profile and use Verifiedly to sign in across connected GSN, Globalis, and BrownGlobal services." />
        <meta property="og:url" content="https://verifiedly.app/" />
        <link rel="canonical" href="https://verifiedly.app/" />
      </Helmet>

      <main className="w-full max-w-sm flex flex-col items-center">
        <div className="text-center mb-12 sm:mb-16">
          <img src={logoMark} alt="Verifiedly" className="h-12 w-12 mx-auto mb-5" />
          <h1 className="text-4xl font-display font-black tracking-tighter uppercase text-foreground mb-3">Verifiedly</h1>
          <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground">Create · Verify · Connect</p>
        </div>

        <div className="text-center mb-9 max-w-[330px]">
          <p className="text-xl font-display font-semibold text-foreground">Your official profile. One secure account.</p>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">Create your profile in about a minute, add the details you choose, and use Verifiedly to sign in to connected GSN, Globalis, and BrownGlobal services.</p>
        </div>

        <div className="mb-8 grid w-full grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl border border-border p-3"><p className="text-xs font-semibold">Create</p><p className="mt-1 text-[10px] text-muted-foreground">Official profile</p></div>
          <div className="rounded-2xl border border-border p-3"><p className="text-xs font-semibold">Verify</p><p className="mt-1 text-[10px] text-muted-foreground">Pro identity check</p></div>
          <div className="rounded-2xl border border-border p-3"><p className="text-xs font-semibold">Connect</p><p className="mt-1 text-[10px] text-muted-foreground">Apps and Tap Cards</p></div>
        </div>

        <div className="w-full space-y-3">
          <Link to="/signup" className="group relative flex items-center justify-center w-full bg-foreground text-background py-4 px-8 text-xs font-bold uppercase tracking-widest transition-all hover:bg-foreground/90">
            <span>Create your profile</span>
            <ArrowRight className="absolute right-6 w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={2} />
          </Link>
          <Link to="/login" className="flex items-center justify-center w-full bg-transparent border-2 border-foreground text-foreground py-4 px-8 text-xs font-bold uppercase tracking-widest transition-all hover:bg-foreground hover:text-background">Sign in</Link>
          <Link to="/pricing" className="flex items-center justify-center py-2 text-xs font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground">Explore Verifiedly Pro and Tap Cards</Link>
        </div>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground leading-relaxed max-w-[315px]"><ShieldCheck className="h-3.5 w-3.5 shrink-0" /> Apps receive only the account information you approve.</p>

        <footer className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
          <Link to="/developers" className="hover:text-foreground transition-colors">Developers</Link>
        </footer>
      </main>
    </div>
  );
};

export default Index;
