import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { CheckCircle2, FileSignature } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  getLatestStripeAgreement,
  recordStripeAgreement,
  STRIPE_AGREEMENT_VERSION,
  type StripeAgreementRecord,
} from "@/lib/stripe-agreement";

/** Shows the creator's Stripe agreement acceptance status with a re-prompt. */
export default function StripeAgreementStatus({ userId }: { userId: string }) {
  const [agreement, setAgreement] = useState<StripeAgreementRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) return;
    getLatestStripeAgreement(userId).then((rec) => {
      setAgreement(rec);
      setLoading(false);
    });
  }, [userId]);

  const handleAccept = async () => {
    if (!agreed) return;
    setSaving(true);
    try {
      await recordStripeAgreement(userId, "dashboard");
      const fresh = await getLatestStripeAgreement(userId);
      setAgreement(fresh);
      toast({ title: "Recorded", description: "Your acceptance has been logged." });
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to record acceptance", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  const currentVersion = agreement?.agreement_version === STRIPE_AGREEMENT_VERSION;

  if (agreement && currentVersion) {
    return (
      <Card className="p-4 mb-6 border-green-200 bg-green-50/40 dark:bg-green-950/10 dark:border-green-900">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold">Stripe agreement on file</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Accepted {new Date(agreement.accepted_at).toLocaleString()} · version{" "}
              <span className="font-mono">{agreement.agreement_version}</span>
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 mb-6 border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-800">
      <div className="flex items-start gap-3 mb-3">
        <FileSignature className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="font-semibold">
            {agreement ? "Updated Stripe agreement available" : "Stripe agreement required"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {agreement
              ? `You previously accepted version ${agreement.agreement_version}. Please re-confirm to keep accepting payments.`
              : "To accept payments through Verifiedly, please confirm the Stripe Connected Account Agreement and our Terms."}
          </p>
        </div>
      </div>
      <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border bg-background cursor-pointer">
        <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="mt-0.5" />
        <span className="text-xs text-muted-foreground leading-relaxed">
          I agree to the{" "}
          <a href="https://stripe.com/connect-account/legal" target="_blank" rel="noopener noreferrer" className="underline text-foreground hover:opacity-70">Stripe Connected Account Agreement</a>
          , the{" "}
          <a href="https://stripe.com/legal/ssa" target="_blank" rel="noopener noreferrer" className="underline text-foreground hover:opacity-70">Stripe Services Agreement</a>
          , and Verifiedly's{" "}
          <Link to="/terms" className="underline text-foreground hover:opacity-70">Terms</Link>{" "}and{" "}
          <Link to="/refunds" className="underline text-foreground hover:opacity-70">Refund Policy</Link>.
          I understand I am the merchant of record for my own sales.
        </span>
      </label>
      <div className="mt-3 flex justify-end">
        <Button size="sm" onClick={handleAccept} disabled={!agreed || saving}>
          {saving ? "Recording…" : "Confirm acceptance"}
        </Button>
      </div>
    </Card>
  );
}