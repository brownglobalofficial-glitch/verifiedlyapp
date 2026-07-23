import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Headphones, Send } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Ticket {
  id: string;
  category: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  admin_response: string | null;
  created_at: string;
}

const Support = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState("");
  const [proStatus, setProStatus] = useState("inactive");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [category, setCategory] = useState("account");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login?next=/dashboard/support");
      return;
    }
    setUserId(session.user.id);

    const [billingResult, ticketResult] = await Promise.all([
      (supabase as any).from("verifiedly_billing")
        .select("pro_status")
        .eq("user_id", session.user.id)
        .maybeSingle(),
      (supabase as any).from("verifiedly_support_tickets")
        .select("id, category, subject, message, priority, status, admin_response, created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false }),
    ]);

    setProStatus(billingResult.data?.pro_status || "inactive");
    setTickets((ticketResult.data || []) as Ticket[]);
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  const isPro = useMemo(() => ["active", "trialing"].includes(proStatus), [proStatus]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userId || !subject.trim() || !message.trim()) return;
    setSending(true);
    const { error } = await (supabase as any).from("verifiedly_support_tickets").insert({
      user_id: userId,
      category,
      subject: subject.trim(),
      message: message.trim(),
      priority: isPro ? "priority" : "standard",
    });
    if (error) {
      toast({ title: "Ticket not submitted", description: error.message, variant: "destructive" });
      setSending(false);
      return;
    }
    setSubject("");
    setMessage("");
    toast({ title: isPro ? "Priority support ticket submitted" : "Support ticket submitted" });
    await load();
    setSending(false);
  };

  if (loading) return <DashboardShell title="Support"><div className="p-8 text-sm text-muted-foreground">Loading…</div></DashboardShell>;

  return (
    <DashboardShell title="Support">
      <div className="mx-auto max-w-5xl px-4 py-7 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="h-fit rounded-3xl p-6">
            <Headphones className="h-7 w-7" />
            <h1 className="mt-4 text-2xl font-display font-bold">Verifiedly support</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Ask about your account, profile, identity verification, subscription, OAuth sign-in, or Tap Card order. Never send an ID image, full payment-card number, password, or Social Security number in a support message.</p>

            <div className="mt-5 rounded-2xl bg-muted/50 p-4">
              <p className="text-sm font-semibold">{isPro ? "Priority support active" : "Standard support"}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{isPro ? "Your new tickets are marked for priority review while Pro is active." : "Support remains available on Free. Pro tickets receive priority handling."}</p>
            </div>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="support-category">Category</Label>
                <select id="support-category" value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="account">Account or profile</option>
                  <option value="verification">Identity verification</option>
                  <option value="subscription">Subscription or billing</option>
                  <option value="oauth">Continue with Verifiedly</option>
                  <option value="tap_card">Tap Card order</option>
                  <option value="privacy">Privacy or security</option>
                </select>
              </div>
              <div>
                <Label htmlFor="support-subject">Subject</Label>
                <Input id="support-subject" value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={120} required className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="support-message">Message</Label>
                <Textarea id="support-message" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={4000} required rows={7} className="mt-1.5" />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={sending || !subject.trim() || !message.trim()}>{sending ? "Submitting…" : "Submit ticket"}<Send className="h-4 w-4" /></Button>
            </form>
          </Card>

          <div>
            <h2 className="text-xl font-display font-bold">Your tickets</h2>
            {tickets.length === 0 ? (
              <Card className="mt-4 rounded-3xl p-8 text-center text-sm text-muted-foreground">No support tickets yet.</Card>
            ) : (
              <div className="mt-4 space-y-3">
                {tickets.map((ticket) => (
                  <Card key={ticket.id} className="rounded-2xl p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{ticket.subject}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{new Date(ticket.created_at).toLocaleString()} · {ticket.category.replaceAll("_", " ")}</p>
                      </div>
                      <div className="flex gap-2">
                        {ticket.priority === "priority" && <span className="rounded-full bg-foreground px-2.5 py-1 text-[10px] font-semibold text-background">Priority</span>}
                        <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold capitalize">{ticket.status.replaceAll("_", " ")}</span>
                      </div>
                    </div>
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{ticket.message}</p>
                    {ticket.admin_response && <div className="mt-4 rounded-xl border-l-4 border-foreground bg-muted/40 p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em]">Verifiedly response</p><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{ticket.admin_response}</p></div>}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
};

export default Support;
