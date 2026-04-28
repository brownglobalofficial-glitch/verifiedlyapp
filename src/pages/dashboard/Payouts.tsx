import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import PayoutsChecklist from "@/components/payouts/PayoutsChecklist";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/verifiedly-logo.webp";

const Payouts = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/login"); return; }
      setUserId(session.user.id);
    });
  }, [navigate]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-connect-account", {
        body: {
          return_url: `${window.location.origin}/dashboard/payouts?stripe_onboarded=true`,
          refresh_url: `${window.location.origin}/dashboard/payouts`,
        },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
      else if (data?.onboarded) toast({ title: "Already connected", description: "Your Stripe account is set up." });
    } catch (e: any) {
      toast({ title: "Stripe connect failed", description: e?.message || "Please try again", variant: "destructive" });
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border h-16 flex items-center px-4">
        <div className="container mx-auto flex items-center justify-between">
          <Link to="/dashboard"><img src={logo} alt="Verifiedly" className="h-7" /></Link>
        </div>
      </nav>

      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-display font-bold">Payouts</h1>
          <p className="text-muted-foreground mt-1">Track your Stripe verification and payout readiness.</p>
        </div>

        {userId && (
          <div className="space-y-4">
            <PayoutsChecklist userId={userId} variant="full" onConnect={handleConnect} />
            <div className="flex items-center justify-end">
              <Button variant="outline" onClick={handleConnect} disabled={connecting}>
                {connecting ? "Opening Stripe…" : "Update Stripe details"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payouts;