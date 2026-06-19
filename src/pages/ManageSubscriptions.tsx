import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, Gift } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import logo from "@/assets/verifiedly-logo.webp";
import { useStripeConnect } from "@/hooks/useStripeConnect";
import StripeRequiredBanner from "@/components/StripeRequiredBanner";

const ManageSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [perks, setPerks] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [perkOpen, setPerkOpen] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [features, setFeatures] = useState("");
  const [saving, setSaving] = useState(false);
  const [perkName, setPerkName] = useState("");
  const [perkDesc, setPerkDesc] = useState("");
  const [perkUrl, setPerkUrl] = useState("");
  const [perkType, setPerkType] = useState<string>("standard");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { stripeConnected } = useStripeConnect();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/login"); return; }
      setUserId(session.user.id);
      fetchSubs(session.user.id);
    });
  }, [navigate]);

  const fetchSubs = async (uid: string) => {
    const { data } = await supabase.from("subscriptions").select("*").eq("creator_id", uid).order("created_at", { ascending: false });
    setSubscriptions(data || []);
    // Fetch perks for all subscriptions
    if (data && data.length > 0) {
      const { data: allPerks } = await supabase
        .from("subscription_perks")
        .select("*")
        .in("subscription_id", data.map(s => s.id))
        .order("sort_order", { ascending: true });
      const grouped: Record<string, any[]> = {};
      (allPerks || []).forEach(p => {
        if (!grouped[p.subscription_id]) grouped[p.subscription_id] = [];
        grouped[p.subscription_id].push(p);
      });
      setPerks(grouped);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!name || !price) return;
    if (!stripeConnected) {
      toast({ title: "Connect Stripe first", description: "Finish payouts setup in settings before creating tiers.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const featuresArr = features.split("\n").map(f => f.trim()).filter(Boolean);
    const { data, error } = await supabase.from("subscriptions").insert({
      creator_id: userId,
      name,
      description,
      price: parseFloat(price),
      features: featuresArr.length > 0 ? featuresArr : null,
      is_active: true,
    }).select("id").single();
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Subscription tier created!" });
      // Sync to Stripe so the tier appears in the Stripe Dashboard (non-fatal)
      if (data?.id) {
        supabase.functions.invoke("sync-stripe-product", { body: { kind: "subscription", id: data.id } })
          .catch((e) => console.warn("Stripe sync failed:", e));
      }
      setName(""); setDescription(""); setPrice(""); setFeatures(""); setOpen(false);
      fetchSubs(userId);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("subscriptions").delete().eq("id", id);
    fetchSubs(userId);
    toast({ title: "Subscription deleted" });
  };

  const handleAddPerk = async (subId: string) => {
    if (!perkName) return;
    const { error } = await supabase.from("subscription_perks").insert({
      subscription_id: subId,
      creator_id: userId,
      perk_name: perkName,
      perk_description: perkDesc || null,
      unlock_url: perkUrl.trim() || null,
      perk_type: perkType,
    } as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Perk added!" });
      setPerkName(""); setPerkDesc(""); setPerkUrl(""); setPerkType("standard"); setPerkOpen(null);
      fetchSubs(userId);
    }
  };

  const handleDeletePerk = async (perkId: string) => {
    await supabase.from("subscription_perks").delete().eq("id", perkId);
    fetchSubs(userId);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border h-16 flex items-center px-4">
        <div className="container mx-auto flex items-center gap-4">
          <Link to="/dashboard"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <img src={logo} alt="Verifiedly" className="h-7" />
          <span className="font-display font-semibold">Subscriptions</span>
        </div>
      </nav>

      <div className="container mx-auto py-8 px-4 max-w-3xl">
        {stripeConnected === false && (
          <StripeRequiredBanner message="Connect Stripe in settings to launch paid subscription tiers." />
        )}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-display font-bold">Subscription Tiers</h1>
          <Dialog open={open} onOpenChange={(o) => { if (o && !stripeConnected) { toast({ title: "Connect Stripe first", description: "Finish payouts setup in settings.", variant: "destructive" }); return; } setOpen(o); }}>
            <DialogTrigger asChild>
              <Button className="gap-2" disabled={!stripeConnected}><Plus className="w-4 h-4" /> New Tier</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Subscription Tier</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Gold Tier" /></div>
                <div><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What subscribers get..." /></div>
                <div><Label>Monthly Price (USD)</Label><Input type="number" value={price} onChange={e => setPrice(e.target.value)} min="0" step="0.01" /></div>
                <div>
                  <Label>Features (one per line)</Label>
                  <Textarea
                    value={features}
                    onChange={e => setFeatures(e.target.value)}
                    placeholder={"Exclusive videos\nEarly access\nMonthly Q&A"}
                    rows={4}
                  />
                </div>
                <Button onClick={handleCreate} disabled={saving} className="w-full">{saving ? "Creating..." : "Create Tier"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {subscriptions.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No subscription tiers yet. Create one to start earning recurring revenue.</p>
        ) : (
          <div className="space-y-4">
            {subscriptions.map(sub => (
              <Card key={sub.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-lg">{sub.name}</p>
                    <p className="text-sm text-muted-foreground">${sub.price}/mo · {sub.is_active ? "Active" : "Inactive"}</p>
                    {sub.description && <p className="text-sm text-muted-foreground mt-1">{sub.description}</p>}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(sub.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Features list */}
                {sub.features && sub.features.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Features</p>
                    <ul className="text-sm space-y-1">
                      {sub.features.map((f: string, i: number) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="text-primary">✓</span> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Perks */}
                <div className="border-t border-border pt-3 mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                      <Gift className="w-3 h-3" /> Subscriber Perks
                    </p>
                    <Dialog open={perkOpen === sub.id} onOpenChange={(o) => setPerkOpen(o ? sub.id : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1 h-7 text-xs">
                          <Plus className="w-3 h-3" /> Add Perk
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Add Perk to {sub.name}</DialogTitle></DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div><Label>Perk Name</Label><Input value={perkName} onChange={e => setPerkName(e.target.value)} placeholder="e.g. Private Discord access" /></div>
                          <div><Label>Description (optional)</Label><Textarea value={perkDesc} onChange={e => setPerkDesc(e.target.value)} placeholder="Details about this perk..." /></div>
                          <div>
                            <Label>Type</Label>
                            <select
                              value={perkType}
                              onChange={e => setPerkType(e.target.value)}
                              className="w-full mt-1 h-10 rounded-md border border-input bg-background px-3 text-sm"
                            >
                              <option value="standard">Standard</option>
                              <option value="community">Community (Discord, Telegram, WhatsApp)</option>
                              <option value="content">Content (Notion, Drive, private page)</option>
                              <option value="discount">Discount / coupon</option>
                            </select>
                          </div>
                          <div>
                            <Label>Unlock link (optional)</Label>
                            <Input
                              value={perkUrl}
                              onChange={e => setPerkUrl(e.target.value)}
                              placeholder="https://discord.gg/your-invite"
                            />
                            <p className="text-[11px] text-muted-foreground mt-1">
                              Only revealed to active subscribers — shown on their Purchases page and your profile.
                            </p>
                          </div>
                          <Button onClick={() => handleAddPerk(sub.id)} className="w-full">Add Perk</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  {(perks[sub.id] || []).length === 0 ? (
                    <p className="text-xs text-muted-foreground">No perks added yet</p>
                  ) : (
                    <div className="space-y-1">
                      {(perks[sub.id] || []).map(perk => (
                        <div key={perk.id} className="flex items-center justify-between text-sm bg-secondary/50 rounded px-3 py-1.5">
                          <div>
                            <span className="font-medium">{perk.perk_name}</span>
                            {perk.perk_description && <span className="text-muted-foreground ml-2">— {perk.perk_description}</span>}
                          </div>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleDeletePerk(perk.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageSubscriptions;
