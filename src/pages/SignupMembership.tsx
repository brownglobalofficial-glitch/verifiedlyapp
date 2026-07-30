import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LEGAL_TERMS_VERSION, VAULT_POLICY_VERSION } from "@/lib/legal";
import logoMark from "@/assets/verifiedly-v-mark.png";

const SignupMembership = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const returnTo = searchParams.get("returnTo") || "";
  const referralCode = searchParams.get("ref") || "";

  useEffect(() => {
    if (username.length < 3) {
      setAvailable(null);
      return;
    }
    setChecking(true);
    const timer = window.setTimeout(async () => {
      const { data, error } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
      setAvailable(error ? null : !data);
      setChecking(false);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [username]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (available !== true || !agreed) return;
    setLoading(true);
    const acceptedAt = new Date().toISOString();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: returnTo
          ? `${window.location.origin}${returnTo}`
          : `${window.location.origin}/onboarding`,
        data: {
          username,
          display_name: displayName.trim(),
          account_type: "creator",
          referred_by: referralCode,
          legal_terms_accepted_at: acceptedAt,
          legal_terms_version: LEGAL_TERMS_VERSION,
          // Compatibility fields for the existing legal_acceptances schema.
          vault_policy_certified: true,
          vault_policy_version: VAULT_POLICY_VERSION,
        },
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
      return;
    }
    navigate(`/login?confirmed=pending&email=${encodeURIComponent(email)}${returnTo ? `&next=${encodeURIComponent(returnTo)}` : ""}`, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2" aria-label="Verifiedly home"><img src={logoMark} alt="" className="h-9 w-9 object-contain" /><span className="font-display text-xl font-bold">Verifiedly</span></Link>
          <h1 className="mt-7 text-2xl font-display font-bold">Create your official profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enter the essentials, confirm your email, then publish your free profile.</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div><Label htmlFor="signup-name">Name</Label><Input id="signup-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required maxLength={80} autoComplete="name" placeholder="Your name" /></div>
          <div><Label htmlFor="signup-handle">Requested handle</Label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">verifiedly.app/</span><Input id="signup-handle" value={username} onChange={(event) => setUsername(event.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase())} required minLength={3} maxLength={30} className="pl-[110px]" placeholder="yourname" autoComplete="username" /></div>{username.length >= 3 && <p className={`mt-1 text-xs ${checking || available === null ? "text-muted-foreground" : available ? "text-emerald-600" : "text-destructive"}`}>{checking ? "Checking…" : available === null ? "Could not check this handle yet" : available ? "Available" : "Handle taken"}</p>}</div>
          <div><Label htmlFor="signup-email">Email</Label><Input id="signup-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></div>
          <div><Label htmlFor="signup-password">Password</Label><div className="relative"><Input id="signup-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} className="pr-10" autoComplete="new-password" /><button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div><p className="mt-1 text-[11px] text-muted-foreground">Use at least 8 characters.</p></div>

          <div className="flex items-start gap-2"><Checkbox id="signup-terms" checked={agreed} onCheckedChange={(value) => setAgreed(value === true)} className="mt-0.5" /><Label htmlFor="signup-terms" className="cursor-pointer text-xs font-normal leading-relaxed text-muted-foreground">I agree to the <Link to="/terms" target="_blank" className="text-foreground underline">Terms of Service</Link> and <Link to="/privacy" target="_blank" className="text-foreground underline">Privacy Policy</Link>.</Label></div>
          <p className="rounded-xl border bg-muted/25 p-3 text-[11px] leading-relaxed text-muted-foreground">Verified email is required. We send a single-use confirmation link or code, and the account remains inactive until confirmation. You must be at least 13; a minor must have parent or legal-guardian permission. Stripe Identity is adult-only.</p>
          <Button type="submit" className="w-full" disabled={loading || !agreed || checking || available !== true}>{loading ? "Creating profile…" : "Create free profile"}</Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">Already have an account? <Link to="/login" className="font-medium text-foreground">Sign in</Link></p>
      </div>
    </div>
  );
};

export default SignupMembership;
