import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/verifiedly-logo.webp";
import { ArrowLeft } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link to="/">
            <img src={logo} alt="Verifiedly" className="h-8 mx-auto mb-6" />
          </Link>
          <h1 className="text-2xl font-display font-bold">Reset password</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {sent ? "Check your email for a reset link" : "Enter your email to get a reset link"}
          </p>
        </div>

        {!sent ? (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send reset link"}
            </Button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              We sent a password reset link to <strong className="text-foreground">{email}</strong>. Check your inbox and spam folder.
            </p>
            <Button variant="outline" className="w-full" onClick={() => setSent(false)}>
              Try another email
            </Button>
          </div>
        )}

        <Link to="/login" className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-3 h-3" /> Back to login
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
