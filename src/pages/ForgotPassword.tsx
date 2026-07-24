import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logoMark from "@/assets/verifiedly-v-mark.png";
import { ArrowLeft } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) toast({ title: "Reset email not sent", description: error.message, variant: "destructive" });
    else setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2" aria-label="Verifiedly home">
            <img src={logoMark} alt="" className="h-9 w-9 object-contain" />
            <span className="font-display text-xl font-bold tracking-tight">Verifiedly</span>
          </Link>
          <h1 className="mt-7 text-2xl font-display font-bold">Reset password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {sent ? "Check your email for a reset link." : "Enter your email to receive a secure reset link."}
          </p>
        </div>

        {!sent ? (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              We sent a password reset link to <strong className="text-foreground">{email}</strong>. Check your inbox and spam folder.
            </p>
            <Button variant="outline" className="w-full" onClick={() => setSent(false)}>Try another email</Button>
          </div>
        )}

        <Link to="/login" className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Back to sign in
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
