import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import logoMark from "@/assets/verifiedly-mark.png";

const AUTH_NEXT_STORAGE_KEY = "verifiedly:auth-next";

const safeInternalPath = (value: string | null) =>
  value && value.startsWith("/") && !value.startsWith("//") ? value : null;

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let active = true;

    const complete = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const oauthError = params.get("error_description") || params.get("error");
        if (oauthError) throw new Error(oauthError);

        const code = params.get("code");
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            const { data: existing } = await supabase.auth.getSession();
            if (!existing.session) throw exchangeError;
          }
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.user) {
          throw new Error(sessionError?.message || "The sign-in session could not be completed.");
        }

        const storedNext = safeInternalPath(window.sessionStorage.getItem(AUTH_NEXT_STORAGE_KEY));
        window.sessionStorage.removeItem(AUTH_NEXT_STORAGE_KEY);
        const target = storedNext || "/dashboard";

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", session.user.id)
          .maybeSingle();
        if (profileError) throw profileError;

        if (!active) return;
        if (!profile?.onboarding_completed) {
          navigate(`/onboarding?returnTo=${encodeURIComponent(target)}`, { replace: true });
          return;
        }

        navigate(target, { replace: true });
      } catch (caught: unknown) {
        if (!active) return;
        setError(caught instanceof Error ? caught.message : "Sign-in could not be completed.");
      }
    };

    void complete();
    return () => { active = false; };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Helmet>
        <title>Completing sign-in — Verifiedly</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Card className="w-full max-w-sm rounded-3xl p-8 text-center">
        {!error ? (
          <>
            <img src={logoMark} alt="Verifiedly" className="mx-auto mb-5 h-10 w-10" />
            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
            <h1 className="mt-4 font-display text-lg font-semibold">Completing sign-in…</h1>
            <p className="mt-1 text-sm text-muted-foreground">Securely returning you to your account.</p>
          </>
        ) : (
          <>
            <AlertTriangle className="mx-auto h-8 w-8 text-destructive" />
            <h1 className="mt-4 font-display text-lg font-semibold">Sign-in failed</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <Button className="mt-5" onClick={() => navigate("/login", { replace: true })}>Try again</Button>
          </>
        )}
      </Card>
    </div>
  );
};

export default AuthCallback;
