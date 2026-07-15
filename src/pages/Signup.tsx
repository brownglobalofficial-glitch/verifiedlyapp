import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import logo from "@/assets/verifiedly-logo.webp";
import { Eye, EyeOff } from "lucide-react";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [dob, setDob] = useState(""); // YYYY-MM-DD, must be 18+
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get("ref") || "";
  const returnTo = searchParams.get("returnTo") || "";
  const [loading, setLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleOAuth = async (provider: "google" | "apple") => {
    const { error } = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: returnTo ? `${window.location.origin}${returnTo}` : window.location.origin,
    });
    if (error) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
    }
  };

  useEffect(() => {
    if (username.length < 3) { setUsernameAvailable(null); return; }
    setCheckingUsername(true);
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles").select("id").eq("username", username.toLowerCase()).maybeSingle();
      setUsernameAvailable(!data);
      setCheckingUsername(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [username]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length < 3) {
      toast({ title: "Username too short", description: "Must be at least 3 characters.", variant: "destructive" });
      return;
    }
    if (usernameAvailable === false) {
      toast({ title: "Username taken", description: "Please choose another username.", variant: "destructive" });
      return;
    }
    if (!dob) {
      toast({ title: "Date of birth required", description: "You must be 18 or older to use Verifiedly.", variant: "destructive" });
      return;
    }
    const dobDate = new Date(dob);
    const eighteenYearsAgo = new Date();
    eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
    if (isNaN(dobDate.getTime()) || dobDate > eighteenYearsAgo) {
      toast({ title: "Must be 18 or older", description: "Verifiedly is not available to users under 18.", variant: "destructive" });
      return;
    }
    if (!agreedTerms) {
      toast({ title: "Terms required", description: "You must agree to the Terms of Service and Privacy Policy.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: returnTo
            ? `${window.location.origin}${returnTo}`
            : `${window.location.origin}/onboarding`,
          data: {
            username: username.toLowerCase(),
            display_name: displayName,
            account_type: "creator",
            referred_by: referralCode,
            date_of_birth: dob,
          },
        },
      });
      if (error) {
        toast({ title: "Signup failed", description: error.message, variant: "destructive" });
        return;
      }
      navigate(
        `/login?confirmed=pending&email=${encodeURIComponent(email)}${returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""}`,
        { replace: true }
      );
    } catch (err: any) {
      toast({ title: "Signup failed", description: err?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link to="/">
            <img src={logo} alt="Verifiedly" className="h-8 mx-auto mb-6" />
          </Link>
          <h1 className="text-2xl font-display font-bold">Create your account</h1>
          <p className="text-sm text-muted-foreground mt-1">One link. Every way to get paid.</p>
        </div>

        <div className="space-y-3">
          <Button variant="outline" className="w-full gap-2" onClick={() => handleOAuth("google")}>
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </Button>
          <Button variant="outline" className="w-full gap-2" onClick={() => handleOAuth("apple")}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
            Continue with Apple
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">or</span>
          <Separator className="flex-1" />
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <Label htmlFor="displayName">Display Name</Label>
            <Input id="displayName" value={displayName} onChange={e => setDisplayName(e.target.value)} required placeholder="Your Name" />
          </div>
          <div>
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">verifiedly.app/</span>
              <Input id="username" value={username} onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase())} required className="pl-[110px]" placeholder="username" />
            </div>
            {username.length >= 3 && (
              <p className={`text-xs mt-1 ${checkingUsername ? "text-muted-foreground" : usernameAvailable ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
                {checkingUsername ? "Checking..." : usernameAvailable ? "✓ Available" : "✗ Username taken"}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="pr-10" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label htmlFor="dob">Date of birth</Label>
            <Input id="dob" type="date" value={dob} onChange={e => setDob(e.target.value)} required max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().slice(0,10)} />
            <p className="text-xs text-muted-foreground mt-1">You must be 18 or older to use Verifiedly.</p>
          </div>

          {referralCode && (
            <div className="bg-secondary rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Referred by code: <span className="font-mono font-medium text-foreground">{referralCode}</span></p>
            </div>
          )}

          <div className="flex items-start gap-2">
            <Checkbox id="terms" checked={agreedTerms} onCheckedChange={(c) => setAgreedTerms(c === true)} className="mt-0.5" />
            <label htmlFor="terms" className="text-xs text-muted-foreground leading-tight">
              I agree to the <Link to="/terms" className="underline text-foreground" target="_blank">Terms of Service</Link> and <Link to="/privacy" className="underline text-foreground" target="_blank">Privacy Policy</Link>
            </label>
          </div>
          <Button type="submit" className="w-full" disabled={loading || !agreedTerms}>
            {loading ? "Creating account..." : "Sign up"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account? <Link to="/login" className="text-foreground underline">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
