import { useEffect, useState } from "react";
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
import logoMark from "@/assets/verifiedly-v-mark.png";
import { Eye, EyeOff } from "lucide-react";

const LEGAL_ACCEPTANCE_STORAGE_KEY = "verifiedly:pending-legal-acceptance";
const googleAuthEnabled = import.meta.env.VITE_ENABLE_GOOGLE_AUTH === "true";
const appleAuthEnabled = import.meta.env.VITE_ENABLE_APPLE_AUTH === "true";
const socialAuthEnabled = googleAuthEnabled || appleAuthEnabled;

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get("ref") || "";
  const returnTo = searchParams.get("returnTo") || "";
  const [loading, setLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const storePendingLegalAcceptance = () => {
    window.localStorage.setItem(LEGAL_ACCEPTANCE_STORAGE_KEY, JSON.stringify({
      acceptedAt: new Date().toISOString(),
      termsVersion: LEGAL_TERMS_VERSION,
      // Retained for compatibility with the current legal_acceptances table.
      vaultPolicyVersion: VAULT_POLICY_VERSION,
    }));
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    if (!agreedTerms) {
      toast({ title: "Agreement required", description: "Review and accept the Terms of Service and Privacy Policy first.", variant: "destructive" });
      return;
    }

    storePendingLegalAcceptance();
    const { error } = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: returnTo ? `${window.location.origin}${returnTo}` : window.location.origin,
    });
    if (error) {
      window.localStorage.removeItem(LEGAL_ACCEPTANCE_STORAGE_KEY);
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
    }
  };

  useEffect(() => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    const timer = window.setTimeout(async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username.toLowerCase())
        .maybeSingle();
      setUsernameAvailable(error ? null : !data);
      setCheckingUsername(false);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [username]);

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    if (username.length < 3) {
      toast({ title: "Handle too short", description: "Use at least 3 characters.", variant: "destructive" });
      return;
    }
    if (usernameAvailable !== true) {
      toast({
        title: usernameAvailable === false ? "Handle taken" : "Handle not checked",
        description: usernameAvailable === false ? "Choose another Verifiedly handle." : "Wait for the handle check and try again.",
        variant: "destructive",
      });
      return;
    }
    if (!agreedTerms) {
      toast({ title: "Terms required", description: "Accept the Terms of Service and Privacy Policy to continue.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const acceptedAt = new Date().toISOString();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: returnTo
            ? `${window.location.origin}${returnTo}`
            : `${window.location.origin}/onboarding`,
          data: {
            username: username.toLowerCase(),
            display_name: displayName.trim(),
            // "creator" remains the current database value for a person profile.
            account_type: "creator",
            referred_by: referralCode,
            legal_terms_accepted_at: acceptedAt,
            legal_terms_version: LEGAL_TERMS_VERSION,
            vault_policy_certified: true,
            vault_policy_version: VAULT_POLICY_VERSION,
          },
        },
      });
      if (error) {
        toast({ title: "Signup failed", description: error.message, variant: "destructive" });
        return;
      }

      navigate(
        `/login?confirmed=pending&email=${encodeURIComponent(email)}${returnTo ? `&next=${encodeURIComponent(returnTo)}` : ""}`,
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
          <Link to="/" className="inline-flex items-center gap-2" aria-label="Verifiedly home">
            <img src={logoMark} alt="" className="h-9 w-9 object-contain" />
            <span className="font-display text-xl font-bold tracking-tight">Verifiedly</span>
          </Link>
          <h1 className="mt-7 text-2xl font-display font-bold">Create your official profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create · Verify · Share</p>
        </div>

        {socialAuthEnabled && (
          <>
            <div className="space-y-3">
              {googleAuthEnabled && (
                <Button variant="outline" className="w-full gap-2" onClick={() => void handleOAuth("google")}>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 0 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Continue with Google
                </Button>
              )}
              {appleAuthEnabled && (
                <Button variant="outline" className="w-full gap-2" onClick={() => void handleOAuth("apple")}>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                  Continue with Apple
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">or</span>
              <Separator className="flex-1" />
            </div>
          </>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <Label htmlFor="displayName">Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
              maxLength={80}
              placeholder="Your name"
              autoComplete="name"
            />
          </div>
          <div>
            <Label htmlFor="username">Verifiedly handle</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">verifiedly.app/</span>
              <Input
                id="username"
                value={username}
                onChange={(event) => setUsername(event.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase())}
                required
                minLength={3}
                maxLength={30}
                className="pl-[110px]"
                placeholder="yourname"
                autoComplete="username"
              />
            </div>
            {username.length >= 3 && (
              <p className={`mt-1 text-xs ${checkingUsername || usernameAvailable === null ? "text-muted-foreground" : usernameAvailable ? "text-emerald-600" : "text-destructive"}`}>
                {checkingUsername ? "Checking…" : usernameAvailable === null ? "Could not check this handle yet" : usernameAvailable ? "Available" : "Handle taken"}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                className="pr-10"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {referralCode && (
            <div className="rounded-lg bg-secondary p-3">
              <p className="text-xs text-muted-foreground">Referral code: <span className="font-mono font-medium text-foreground">{referralCode}</span></p>
            </div>
          )}

          <div className="flex items-start gap-2">
            <Checkbox id="terms" checked={agreedTerms} onCheckedChange={(checked) => setAgreedTerms(checked === true)} className="mt-0.5" />
            <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed">
              I agree to the <Link to="/terms" className="text-foreground underline" target="_blank">Terms of Service</Link> and <Link to="/privacy" className="text-foreground underline" target="_blank">Privacy Policy</Link>.
            </label>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            You must be at least 13. A minor must have permission from a parent or legal guardian. Stripe Identity verification is limited to eligible adults with active Verifiedly Pro.
          </p>
          <Button type="submit" className="w-full" disabled={loading || !agreedTerms || checkingUsername || usernameAvailable !== true}>
            {loading ? "Creating profile…" : "Create free profile"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account? <Link to="/login" className="text-foreground underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
