import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useToast } from "@/hooks/use-toast";
import logoMark from "@/assets/verifiedly-v-mark.png";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff } from "lucide-react";
import EmailConfirmationBanner from "@/components/EmailConfirmationBanner";

const googleAuthEnabled = import.meta.env.VITE_ENABLE_GOOGLE_AUTH === "true";
const appleAuthEnabled = import.meta.env.VITE_ENABLE_APPLE_AUTH === "true";
const socialAuthEnabled = googleAuthEnabled || appleAuthEnabled;

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const isPending = searchParams.get("confirmed") === "pending";
  const pendingEmail = searchParams.get("email") || "";
  const nextPath = searchParams.get("next");

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      let email = identifier.trim();
      if (!email.includes("@") || email.startsWith("@")) {
        const handle = email.replace(/^@/, "");
        const { data: lookup, error: lookupError } = await supabase.functions.invoke("lookup-handle", { body: { handle } });
        if (lookupError || !lookup?.email) {
          toast({ title: "Login failed", description: "No account with that handle. Try your email.", variant: "destructive" });
          setLoading(false);
          return;
        }
        email = lookup.email;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: "Login failed", description: error.message, variant: "destructive" });
        setLoading(false);
        return;
      }

      const destination = nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
        ? nextPath
        : "/dashboard";
      navigate(destination, { replace: true });
    } catch (error: unknown) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    const { error } = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    if (error) toast({ title: "Login failed", description: error.message, variant: "destructive" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2" aria-label="Verifiedly home">
            <img src={logoMark} alt="" className="h-9 w-9 object-contain" />
            <span className="font-display text-xl font-bold tracking-tight">Verifiedly</span>
          </Link>
          {!isPending && (
            <>
              <h1 className="mt-7 text-2xl font-display font-bold">Welcome back</h1>
              <p className="mt-1 text-sm text-muted-foreground">Sign in to your official profile.</p>
            </>
          )}
        </div>

        {isPending && <EmailConfirmationBanner email={pendingEmail} />}

        {!isPending && (
          <>
            {socialAuthEnabled && (
              <>
                <div className="space-y-3">
                  {googleAuthEnabled && (
                    <Button variant="outline" className="w-full gap-2" onClick={() => void handleOAuth("google")}>
                      <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.25z" fill="#EA4335"/></svg>
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

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="identifier">Email or @handle</Label>
                <Input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  placeholder="you@example.com or @yourhandle"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  required
                />
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
                    className="pr-10"
                    autoComplete="current-password"
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
              <div className="text-right">
                <Link to="/forgot-password" className="text-xs text-muted-foreground underline hover:text-foreground">Forgot password?</Link>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </>
        )}

        <p className="text-center text-sm text-muted-foreground">
          New to Verifiedly? <Link to="/signup" className="text-foreground underline">Create a free profile</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
