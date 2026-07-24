import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logoMark from "@/assets/verifiedly-v-mark.png";
import { Eye, EyeOff } from "lucide-react";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setIsRecovery(true);
    });
    if (window.location.hash.includes("type=recovery")) setIsRecovery(true);
    return () => subscription.unsubscribe();
  }, []);

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) {
      toast({ title: "Password too short", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: "Password not updated", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Password updated", description: "Your new password is ready to use." });
    navigate("/dashboard");
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="text-center space-y-4">
          <img src={logoMark} alt="Verifiedly" className="mx-auto h-10 w-10 object-contain" />
          <h1 className="text-2xl font-display font-bold">Invalid reset link</h1>
          <p className="text-sm text-muted-foreground">This link may have expired or is invalid.</p>
          <Button asChild variant="outline"><Link to="/forgot-password">Request a new link</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2" aria-label="Verifiedly home">
            <img src={logoMark} alt="" className="h-9 w-9 object-contain" />
            <span className="font-display text-xl font-bold tracking-tight">Verifiedly</span>
          </Link>
          <h1 className="mt-7 text-2xl font-display font-bold">Set a new password</h1>
          <p className="mt-1 text-sm text-muted-foreground">Use at least 8 characters.</p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <Label htmlFor="password">New password</Label>
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
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Updating…" : "Update password"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
