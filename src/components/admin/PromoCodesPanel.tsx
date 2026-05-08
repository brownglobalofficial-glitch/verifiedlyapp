import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Ticket } from "lucide-react";

/**
 * Admin tool to mint and manage promo codes that grant free Pro/Elite tier.
 * Promo grants are independent of paid Stripe subscriptions; the live billing
 * flow continues to work normally for everyone else.
 */
const PromoCodesPanel = () => {
  const { toast } = useToast();
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [tier, setTier] = useState<"pro" | "elite">("pro");
  const [maxUses, setMaxUses] = useState<string>("");
  const [expires, setExpires] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("promo_codes")
      .select("*")
      .order("created_at", { ascending: false });
    setCodes(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!code.trim()) {
      toast({ title: "Code required", variant: "destructive" });
      return;
    }
    setCreating(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from("promo_codes").insert({
      code: code.trim().toUpperCase(),
      tier,
      max_uses: maxUses ? parseInt(maxUses, 10) : null,
      expires_at: expires ? new Date(expires).toISOString() : null,
      notes: notes || null,
      created_by: session?.user.id ?? null,
    });
    setCreating(false);
    if (error) {
      toast({ title: "Couldn't create code", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Code created", description: `${code.toUpperCase()} grants ${tier === "elite" ? "Elite" : "Pro"} for free.` });
    setCode(""); setMaxUses(""); setExpires(""); setNotes("");
    load();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("promo_codes").update({ is_active: !current }).eq("id", id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this promo code? This cannot be undone.")) return;
    await supabase.from("promo_codes").delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Ticket className="w-4 h-4" />
          <h3 className="font-display font-semibold">Create promo code</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <Label>Code</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="LAUNCH50"
              className="font-mono uppercase"
            />
          </div>
          <div>
            <Label>Tier</Label>
            <div className="flex gap-2 mt-1">
              {(["pro", "elite"] as const).map((t) => (
                <Button
                  key={t}
                  type="button"
                  size="sm"
                  variant={tier === t ? "default" : "outline"}
                  onClick={() => setTier(t)}
                  className="capitalize flex-1"
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label>Max uses (blank = unlimited)</Label>
            <Input value={maxUses} onChange={(e) => setMaxUses(e.target.value.replace(/[^0-9]/g, ""))} placeholder="100" />
          </div>
          <div>
            <Label>Expires (optional)</Label>
            <Input type="datetime-local" value={expires} onChange={(e) => setExpires(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label>Notes (internal)</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="VIP creators, brand partners…" />
          </div>
        </div>
        <Button className="mt-4 gap-1.5" onClick={create} disabled={creating}>
          <Plus className="w-4 h-4" /> {creating ? "Creating…" : "Create code"}
        </Button>
      </Card>

      <div>
        <h3 className="font-display font-semibold mb-3">Active codes</h3>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : codes.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">No promo codes yet.</Card>
        ) : (
          <div className="space-y-2">
            {codes.map((c) => {
              const expired = c.expires_at && new Date(c.expires_at) < new Date();
              const exhausted = c.max_uses != null && c.uses >= c.max_uses;
              return (
                <Card key={c.id} className="p-4 flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-[180px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-sm">{c.code}</span>
                      <Badge variant="secondary" className="capitalize">{c.tier}</Badge>
                      {expired && <Badge variant="destructive">Expired</Badge>}
                      {exhausted && <Badge variant="destructive">Maxed out</Badge>}
                      {!c.is_active && <Badge variant="outline">Disabled</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {c.uses}{c.max_uses != null ? ` / ${c.max_uses}` : ""} redemptions
                      {c.expires_at && ` · expires ${new Date(c.expires_at).toLocaleDateString()}`}
                      {c.notes && ` · ${c.notes}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Switch checked={c.is_active} onCheckedChange={() => toggleActive(c.id, c.is_active)} />
                      <span className="text-xs text-muted-foreground">Active</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => remove(c.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PromoCodesPanel;