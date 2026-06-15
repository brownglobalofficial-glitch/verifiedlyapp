import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Clock, CheckCircle2, XCircle, Eye } from "lucide-react";

const STATUS_META: Record<string, { label: string; Icon: any; cls: string }> = {
  pending:   { label: "Pending",   Icon: Clock, cls: "bg-muted text-muted-foreground" },
  reviewing: { label: "Reviewing", Icon: Eye, cls: "bg-secondary text-foreground border border-border" },
  resolved:  { label: "Resolved",  Icon: CheckCircle2, cls: "bg-foreground text-background" },
  rejected:  { label: "Rejected",  Icon: XCircle, cls: "bg-destructive text-destructive-foreground" },
};

const Disputes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [socials, setSocials] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [signalType, setSignalType] = useState("social");
  const [socialId, setSocialId] = useState("");
  const [reason, setReason] = useState("");

  const load = async (uid: string) => {
    const [{ data: d }, { data: vs }] = await Promise.all([
      (supabase.from("verification_disputes" as any).select("*").eq("user_id", uid).order("created_at", { ascending: false }) as any),
      (supabase.from("verified_socials" as any).select("*").eq("user_id", uid) as any),
    ]);
    setDisputes(d || []);
    setSocials(vs || []);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/login"); return; }
      setUserId(session.user.id);
      load(session.user.id);
    });
  }, [navigate]);

  const submit = async () => {
    if (!userId || reason.trim().length < 10) {
      toast({ title: "Add more detail", description: "Please describe what happened (10+ characters).", variant: "destructive" });
      return;
    }
    setBusy(true);
    const { data: p } = await supabase.from("profiles").select("is_pro,is_elite").eq("id", userId).maybeSingle() as any;
    const priority = !!(p?.is_pro || p?.is_elite);
    const { error } = await (supabase.from("verification_disputes" as any) as any).insert({
      user_id: userId,
      signal_type: signalType,
      social_id: signalType === "social" && socialId ? socialId : null,
      reason: reason.trim(),
      priority,
    });
    setBusy(false);
    if (error) {
      toast({ title: "Couldn't submit", description: error.message, variant: "destructive" });
      return;
    }
    setReason("");
    setSocialId("");
    await load(userId);
    toast({ title: "Dispute submitted", description: priority ? "Priority queue — typically reviewed within 24h." : "Reviewed in the order received." });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <Link to="/dashboard/verification" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to verification
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-2">Verification disputes</h1>
          <p className="text-sm text-muted-foreground">
            Think a verification check unfairly failed? Submit a dispute and a Verifiedly admin will
            manually review the signal.
          </p>
        </div>

        <Card className="p-6 mb-6">
          <h2 className="font-display font-semibold mb-4">Request a re-check</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="signal_type" className="text-xs">Signal</Label>
              <select
                id="signal_type"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm mt-1"
                value={signalType}
                onChange={(e) => setSignalType(e.target.value)}
              >
                <option value="social">Verified social</option>
                <option value="domain">Domain verification</option>
                <option value="stripe">Stripe payouts</option>
                <option value="other">Other signal</option>
              </select>
            </div>
            {signalType === "social" && socials.length > 0 && (
              <div>
                <Label htmlFor="social_id" className="text-xs">Which social?</Label>
                <select
                  id="social_id"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm mt-1"
                  value={socialId}
                  onChange={(e) => setSocialId(e.target.value)}
                >
                  <option value="">Select…</option>
                  {socials.map(s => (
                    <option key={s.id} value={s.id}>{s.platform} · @{s.handle} ({s.verification_status})</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <Label htmlFor="reason" className="text-xs">What happened?</Label>
              <Textarea
                id="reason"
                placeholder="The verification code is in my bio but the check keeps failing…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="mt-1"
                maxLength={1000}
              />
              <p className="text-[11px] text-muted-foreground mt-1">{reason.length}/1000</p>
            </div>
            <Button onClick={submit} disabled={busy}>
              {busy ? "Submitting…" : "Submit dispute"}
            </Button>
          </div>
        </Card>

        <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Your disputes</h2>
        {disputes.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-sm text-muted-foreground">No disputes yet.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {disputes.map(d => {
              const meta = STATUS_META[d.status] || STATUS_META.pending;
              const Icon = meta.Icon;
              return (
                <Card key={d.id} className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold capitalize">{d.signal_type} signal</p>
                      <p className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleString()}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${meta.cls}`}>
                      <Icon className="w-3 h-3" /> {meta.label}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{d.reason}</p>
                  {d.admin_note && (
                    <div className="mt-3 p-3 rounded-md bg-secondary text-xs">
                      <p className="font-semibold mb-1">Admin response</p>
                      <p className="whitespace-pre-wrap">{d.admin_note}</p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Disputes;