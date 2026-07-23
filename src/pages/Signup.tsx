import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { LEGAL_TERMS_VERSION, VAULT_POLICY_VERSION } from "@/lib/legal";
import logo from "@/assets/verifiedly-logo.webp";
import { Eye, EyeOff } from "lucide-react";

const LEGAL_ACCEPTANCE_STORAGE_KEY = "verifiedly:pending-legal-acceptance";
const AUTH_NEXT_STORAGE_KEY = "verifiedly:auth-next";
const GOOGLE_AUTH_ENABLED = import.meta.env.VITE_ENABLE_GOOGLE_AUTH === "true";
const APPLE_AUTH_ENABLED = import.meta.env.VITE_ENABLE_APPLE_AUTH === "true";
const SOCIAL_AUTH_ENABLED = GOOGLE_AUTH_ENABLED || APPLE_AUTH_ENABLED;

const safeInternalPath = (value: string | null) =>
  value && value.startsWith("/") && !value.startsWith("//") ? value : null;

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get("ref") || "";
  const requestedNext = safeInternalPath(searchParams.get("next") || searchParams.get("returnTo"));
  const navigate = useNavigate();
  const { toast } = useToast();

  const rememberLegalAcceptance = () => {
    window.localStorage.setItem(LEGAL_ACCEPTANCE_STORAGE_KEY, JSON.stringify({
      acceptedAt: new Date().toISOString(),
      termsVersion: LEGAL_TERMS_VERSION,
      vaultPolicyVersion: VAULT_POLICY_VERSION,
    }));
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    const enabled = provider === "google" ? GOOGLE_AUTH_ENABLED : APPLE_AUTH_ENABLED;
    if (!enabled) return;

    if (!agreedTerms) {
      toast({
        title: "Agreement required",
        description: "Review and accept the Terms of Service and Privacy Policy first.",
        variant: "destructive",
      });
      return;
    }

    rememberLegalAcceptance();
    window.sessionStorage.setItem(AUTH_NEXT_STORAGE_KEY, requestedNext || "/onboarding");
    const { error } = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: `${window.location.origin}/auth/callback`,
    });
    if (error) {
      window.localStorage.removeItem(LEGAL_ACCEPTANCE_STORAGE_KEY);
      window.sessionStorage.removeItem(AUTH_NEXT_STORAGE_KEY);
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
    }
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!agreedTerms) {
      toast({ title: "Terms required", description: "You must agree before creating an account.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const acceptedAt = new Date().toISOString();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            referred_by: referralCode,
            legal_terms_accepted_at: acceptedAt,
            legal_terms_version: LEGAL_TERMS_VERSION,
            vault_policy_certified: true,
            vault_policy_version: VAULT_POLICY_VERSION,
          },
        },
      });
      if (error) throw error;

      window.sessionStorage.setItem(AUTH_NEXT_STORAGE_KEY, requestedNext || "/onboarding");
      if (data.session) {
        navigate(`/onboarding${requestedNext ? `?returnTo=${encodeURIComponent(requestedNext)}` : ""}`, { replace: true });
        return;
      }

      navigate(
        `/login?confirmed=pending&email=${encodeURIComponent(email.trim())}${requestedNext ? `&next=${encodeURIComponent(requestedNext)}` : ""}`,
        { replace: true },
      );
    } catch (error: unknown) {
      toast({
        title: "Signup failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link to="/">
            <img src={logo} alt="Verifiedly" className="h-8 mx-auto mb-6" />
          </Link>
          <h1 className="text-2xl font-display font-bold">Create your Verifiedly account</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign up now. Your official profile takes about a minute next.</p>
        </div>

        {SOCIAL_AUTH_ENABLED && (
          <>
            <div className="space-y-3">
              {GOOGLE_AUTH_ENABLED && (
                <Button type="button" variant="outline" className="w-full gap-2" onClick={() => void handleOAuth("google")}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Continue with Google
                </Button>
              )}
              {APPLE_AUTH_ENABLED && (
                <Button type="button" variant="outline" className="w-full gap-2" onClick={() => void handleOAuth("apple")}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                  Continue with Apple
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">or use email</span>
              <Separator className="flex-1" />
            </div>
          </>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input id="password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} className="pr-10" />
              <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox id="terms" checked={agreedTerms} onCheckedChange={(checked) => setAgreedTerms(checked === true)} className="mt-0.5" />
            <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed">
              I agree to the <Link to="/terms" className="underline text-foreground" target="_blank">Terms of Service</Link> and <Link to="/privacy" className="underline text-foreground" target="_blank">Privacy Policy</Link>.
            </label>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">You must be at least 13. Where required, a parent or legal guardian must permit a minor's use. Identity verification is limited to eligible adults.</p>
          <Button type="submit" className="w-full" disabled={loading || !agreedTerms}>
            {loading ? "Creating account…" : "Continue"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account? <Link to={`/login${requestedNext ? `?next=${encodeURIComponent(requestedNext)}` : ""}`} className="text-foreground underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
