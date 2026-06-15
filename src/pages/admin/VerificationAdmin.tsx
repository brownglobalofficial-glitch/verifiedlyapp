import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, RefreshCw, KeyRound, Copy } from "lucide-react";

const VerificationAdmin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [userIdToRecompute, setUserIdToRecompute] = useState("");
  const [rotated, setRotated] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = async () => {
    const [d, e, c] = await Promise.all([
      (supabase.from("verification_disputes" as any).select("*").order("created_at", { ascending: false }).limit(100) as any),
      (supabase.from("trust_score_errors" as any).select("*").eq("resolved", false).order("created_at", { ascending: false }).limit(50) as any),
      (supabase.from("oauth_clients" as any).select("id,client_id,name,redirect_uris,scopes,is_first_party,active,rotated_at,created_at").order("created_at") as any),
    ]);
    setDisputes(d.data || []);
    setErrors(e.data || []);
    setClients(c.data || []);
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { navigate("/login"); return; }
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin");
      if (!roles || roles.length === 0) {
        toast({ title: "Access denied", variant: "destructive" });
        navigate("/dashboard");
        return;
      }
      setAllowed(true);
      await load();
      setLoading(false);
    });
  }, [navigate, toast]);

  const resolveDispute = async (id: string, status: "resolved" | "rejected") => {
    const note = notes[id]?.trim() || null;
    const { data: { session } } = await supabase.auth.getSession();
    const dispute = disputes.find(d => d.id === id);

    const { error } = await (supabase.from("verification_disputes" as any) as any)
      .update({ status, admin_note: note, resolved_by: session?.user.id, resolved_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { toast({ title: "Update failed", description: error.message, variant: "destructive" }); return; }

    // On approval of a social signal, flip verified + recompute
    if (status === "resolved" && dispute?.social_id) {
      await (supabase.from("verified_socials" as any) as any).update({ verification_status: "verified" }).eq("id", dispute.social_id);
      await (supabase.rpc as any)("recompute_trust_score", { _user_id: dispute.user_id });
    }

    await (supabase.from("verification_audit_log" as any) as any).insert({
      actor_id: session?.user.id, target_user_id: dispute?.user_id, action: `dispute_${status}`,
      details: { dispute_id: id, note },
    });

    toast({ title: `Dispute ${status}` });
    load();
  };

  const recomputeOne = async () => {
    if (!userIdToRecompute.trim()) return;
    const { data, error } = await (supabase.rpc as any)("recompute_trust_score", { _user_id: userIdToRecompute.trim() });
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Recomputed", description: `New score: ${data}` });
  };

  const recomputeAll = async () => {
    const { data, error } = await (supabase.rpc as any)("recompute_all_trust_scores");
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Done", description: `${data} profiles recomputed.` });
  };

  const dismissError = async (id: string) => {
    await (supabase.from("trust_score_errors" as any) as any).update({ resolved: true }).eq("id", id);
    load();
  };

  const rotateSecret = async (clientId: string) => {
    const { data, error } = await supabase.functions.invoke("admin-rotate-oauth-secret", { body: { client_id: clientId } });
    if (error || data?.error) {
      toast({ title: "Rotate failed", description: error?.message || data?.error, variant: "destructive" });
      return;
    }
    setRotated({ ...rotated, [clientId]: data.client_secret });
    toast({ title: "Secret rotated", description: "Copy it now — it won't be shown again." });
    load();
  };

  const copy = (s: string) => {
    navigator.clipboard.writeText(s);
    toast({ title: "Copied" });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  if (!allowed) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        <Link to="/dashboard/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to admin
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-2">Verification admin</h1>
          <p className="text-sm text-muted-foreground">Manage disputes, trust score errors, and OAuth clients.</p>
        </div>

        <Tabs defaultValue="disputes">
          <TabsList>
            <TabsTrigger value="disputes">Disputes ({disputes.filter(d => d.status === "pending").length})</TabsTrigger>
            <TabsTrigger value="errors">Errors ({errors.length})</TabsTrigger>
            <TabsTrigger value="recompute">Recompute</TabsTrigger>
            <TabsTrigger value="oauth">OAuth clients</TabsTrigger>
          </TabsList>

          <TabsContent value="disputes" className="mt-6 space-y-3">
            {disputes.length === 0 && <Card className="p-6 text-center"><p className="text-sm text-muted-foreground">No disputes.</p></Card>}
            {disputes.map(d => (
              <Card key={d.id} className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold capitalize">{d.signal_type} — <span className="font-normal">{d.status}</span>{d.priority && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-foreground text-background">PRIORITY</span>}</p>
                    <p className="text-xs text-muted-foreground font-mono">{d.user_id}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleString()}</p>
                </div>
                <p className="text-sm whitespace-pre-wrap mb-3">{d.reason}</p>
                {d.status === "pending" && (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Admin note (shown to creator)…"
                      value={notes[d.id] || ""}
                      onChange={(e) => setNotes({ ...notes, [d.id]: e.target.value })}
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => resolveDispute(d.id, "resolved")}>Approve & verify</Button>
                      <Button size="sm" variant="outline" onClick={() => resolveDispute(d.id, "rejected")}>Reject</Button>
                    </div>
                  </div>
                )}
                {d.admin_note && d.status !== "pending" && (
                  <div className="mt-2 p-2 rounded bg-secondary text-xs"><span className="font-semibold">Note:</span> {d.admin_note}</div>
                )}
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="errors" className="mt-6 space-y-3">
            {errors.length === 0 && <Card className="p-6 text-center"><p className="text-sm text-muted-foreground">No errors. Nightly recompute is healthy.</p></Card>}
            {errors.map(e => (
              <Card key={e.id} className="p-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-mono text-muted-foreground">{e.user_id || "(global)"}</p>
                  <p className="text-sm">{e.error_message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(e.created_at).toLocaleString()}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => dismissError(e.id)}>Dismiss</Button>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="recompute" className="mt-6 space-y-3">
            <Card className="p-4">
              <h3 className="font-display font-semibold mb-2">Recompute one user</h3>
              <div className="flex gap-2">
                <Input placeholder="user_id (uuid)" value={userIdToRecompute} onChange={(e) => setUserIdToRecompute(e.target.value)} />
                <Button onClick={recomputeOne} className="gap-1"><RefreshCw className="w-4 h-4" /> Recompute</Button>
              </div>
            </Card>
            <Card className="p-4">
              <h3 className="font-display font-semibold mb-2">Recompute everyone</h3>
              <p className="text-xs text-muted-foreground mb-3">Same as the nightly cron. Safe to run manually.</p>
              <Button onClick={recomputeAll} variant="outline" className="gap-1"><RefreshCw className="w-4 h-4" /> Run now</Button>
            </Card>
          </TabsContent>

          <TabsContent value="oauth" className="mt-6 space-y-3">
            {clients.map(c => (
              <Card key={c.id} className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{c.name} {c.is_first_party && <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-foreground text-background">1st-party</span>}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{c.client_id}</code>
                      <Button variant="ghost" size="sm" onClick={() => copy(c.client_id)} aria-label="Copy"><Copy className="w-3 h-3" /></Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Redirects: {(c.redirect_uris || []).join(", ") || "—"}</p>
                    <p className="text-xs text-muted-foreground">Last rotated: {c.rotated_at ? new Date(c.rotated_at).toLocaleString() : "never"}</p>
                  </div>
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => rotateSecret(c.client_id)}>
                    <KeyRound className="w-4 h-4" /> Rotate secret
                  </Button>
                </div>
                {rotated[c.client_id] && (
                  <div className="mt-3 p-3 rounded-md border-2 border-foreground bg-secondary space-y-2">
                    <p className="text-xs font-semibold">New client_secret (shown once)</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-background px-2 py-1.5 rounded font-mono truncate">{rotated[c.client_id]}</code>
                      <Button variant="outline" size="sm" onClick={() => copy(rotated[c.client_id])}><Copy className="w-3.5 h-3.5" /></Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Copy now and paste into the partner app's secret manager. It will be hidden after navigating away.</p>
                  </div>
                )}
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default VerificationAdmin;