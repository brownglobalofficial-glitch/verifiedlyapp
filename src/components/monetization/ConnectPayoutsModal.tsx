import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { recordStripeAgreement } from "@/lib/stripe-agreement";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Called after payouts are confirmed ready. */
  onReady?: () => void;
  /** Context label passed to the agreement record. */
  context?: "onboarding" | "settings" | "dashboard";
};

/**
 * 3-step Stripe Connect onboarding modal, shown only when a creator tries to
 * enable monetization (tips, subscriptions, paid products).
 */
export default function ConnectPayoutsModal({ open, onOpenChange, onReady, context = "dashboard" }: Props) {
  const { toast } = useToast();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!open) {
      setStep(0);
      setBusy(false);
    }
  }, [open]);

  // When user returns to step 2, poll status until charges enabled.
  useEffect(() => {
    if (!open || step !== 2) return;
    let cancelled = false;
    const tick = async () => {
      const { data } = await supabase.functions.invoke("sync-connect-status").catch(() => ({ data: null as any }));
      const ok = !!(data?.charges_enabled || data?.status?.charges_enabled);
      if (ok && !cancelled) {
        setReady(true);
        onReady?.();
        toast({ title: "Payouts ready", description: "You can now accept payments." });
      }
    };
    tick();
    const id = setInterval(tick, 3000);
    return () => { cancelled = true; clearInterval(id); };
  }, [open, step, onReady, toast]);

  const startStripe = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setBusy(true);
    try {
      await recordStripeAgreement(session.user.id, context).catch(() => {});
      const { data, error } = await supabase.functions.invoke("create-connect-account", {
        body: {
          return_url: `${window.location.origin}${window.location.pathname}?stripe_onboarded=true`,
          refresh_url: `${window.location.origin}${window.location.pathname}`,
        },
      });
      if (error) throw error;
      if (data?.onboarded) {
        setReady(true);
        setStep(2);
        onReady?.();
      } else if (data?.url) {
        window.open(data.url, "_blank");
        setStep(2);
      } else {
        throw new Error(data?.error || "Stripe didn't return a link.");
      }
    } catch (err: any) {
      toast({ title: "Could not start Stripe", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" /> Connect payouts to start earning
          </DialogTitle>
          <DialogDescription>
            A quick three-step setup with Stripe so we can deposit your earnings directly to your bank.
          </DialogDescription>
        </DialogHeader>

        <ol className="space-y-3 text-sm">
          {[
            "Agree to the Stripe Connected Account terms",
            "Verify your identity with Stripe (opens in a new tab)",
            "Return here — we'll confirm you're ready",
          ].map((label, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                step > i ? "bg-foreground text-background" : step === i ? "border-2 border-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {step > i ? <Check className="w-3 h-3" /> : i + 1}
              </span>
              <span className={step === i ? "font-medium" : "text-muted-foreground"}>{label}</span>
            </li>
          ))}
        </ol>

        {step === 0 && (
          <div className="space-y-3">
            <label className="flex items-start gap-2 text-xs text-muted-foreground p-3 rounded-md border border-border">
              <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} />
              <span>
                I agree to the <a href="https://stripe.com/connect-account/legal/full" target="_blank" rel="noreferrer" className="underline">Stripe Connected Account Agreement</a> and Verifiedly's <a href="/terms" target="_blank" className="underline">Terms</a>.
              </span>
            </label>
            <Button className="w-full gap-2" disabled={!agreed || busy} onClick={() => { setStep(1); startStripe(); }}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
              Continue to Stripe
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            {ready ? (
              <div className="p-3 rounded-md bg-foreground/5 border border-foreground/10 text-sm flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5" />
                <div>
                  <p className="font-medium">Payouts are ready.</p>
                  <p className="text-xs text-muted-foreground">You can now accept payments. Earnings deposit automatically.</p>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-md bg-muted text-sm flex items-start gap-2">
                <Loader2 className="w-4 h-4 mt-0.5 animate-spin" />
                <div>
                  <p className="font-medium">Waiting for Stripe…</p>
                  <p className="text-xs text-muted-foreground">Finish onboarding in the Stripe tab. We'll detect it automatically.</p>
                </div>
              </div>
            )}
            <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
              {ready ? "Done" : "Close (we'll save your progress)"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}