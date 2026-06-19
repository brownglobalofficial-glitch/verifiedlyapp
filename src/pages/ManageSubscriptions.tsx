import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, Gift, Info } from "lucide-react";
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
  const [saving, setSaving] = useState(false);
  const [perkName, setPerkName] = useState("");
  const [perkDesc, setPerkDesc] = useState("");
  const [perkUrl, setPerkUrl] = useState("");
  const [perkCode, setPerkCode] = useState("");
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
    const { data, error } = await supabase.from("subscriptions").insert({
      creator_id: userId,
      name,
      description,
      price: parseFloat(price),
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
      setName(""); setDescription(""); setPrice(""); setOpen(false);
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
      unlock_code: perkCode.trim() || null,
      perk_type: perkType,
    } as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Perk added!" });
      setPerkName(""); setPerkDesc(""); setPerkUrl(""); setPerkCode(""); setPerkType("standard"); setPerkOpen(null);
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
                <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  After creating the tier, add what subscribers get as <strong className="font-semibold">Perks</strong> below — Discord links, downloads, discount codes, and more.
                </p>
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

                {/* Perks */}
                <div className="border-t border-border pt-3 mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                      <Gift className="w-3 h-3" /> What subscribers get
                    </p>
                    <Dialog open={perkOpen === sub.id} onOpenChange={(o) => { setPerkOpen(o ? sub.id : null); if (!o) { setPerkName(""); setPerkDesc(""); setPerkUrl(""); setPerkCode(""); setPerkType("standard"); } }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1 h-7 text-xs">
                          <Plus className="w-3 h-3" /> Add Perk
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Add Perk to {sub.name}</DialogTitle></DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div>
                            <Label>Type</Label>
                            <select
                              value={perkType}
                              onChange={e => setPerkType(e.target.value)}
                              className="w-full mt-1 h-10 rounded-md border border-input bg-background px-3 text-sm"
                            >
                              <option value="standard">Standard perk (no link)</option>
                              <option value="community">Community — Discord / Telegram / WhatsApp invite</option>
                              <option value="content">Content — Notion, Drive, private page, etc.</option>
                              <option value="discount">Discount — link + coupon code</option>
                            </select>
                          </div>

                          {/* Inline guide per perk type */}
                          <div className="text-xs bg-muted/50 border border-border rounded-md p-3 flex gap-2">
                            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                            <div className="space-y-1 text-muted-foreground">
                              {perkType === "community" && (
                                <>
                                  <p><strong className="text-foreground">Paste your invite link</strong> — e.g. <code>https://discord.gg/your-invite</code>, a Telegram <code>t.me/...</code> link, or a WhatsApp group link.</p>
                                  <p>Subscribers see it on their Purchases page and a gated "Community" card on your profile.</p>
                                </>
                              )}
                              {perkType === "content" && (
                                <>
                                  <p><strong className="text-foreground">Paste the link</strong> — Notion page, Google Drive folder, private YouTube playlist, Figma file, etc.</p>
                                  <p>Only revealed to active subscribers.</p>
                                </>
                              )}
                              {perkType === "discount" && (
                                <>
                                  <p><strong className="text-foreground">Paste the store link</strong> (e.g. your Shopify URL) and the <strong className="text-foreground">coupon code</strong> subscribers should use at checkout.</p>
                                </>
                              )}
                              {perkType === "standard" && (
                                <p>Use this for perks with no link — monthly Q&amp;A, shoutouts, early access, behind-the-scenes, priority DMs, etc.</p>
                              )}
                            </div>
                          </div>

                          <div>
                            <Label>Perk name</Label>
                            <Input
                              value={perkName}
                              onChange={e => setPerkName(e.target.value)}
                              placeholder={
                                perkType === "community" ? "Private Discord access"
                                : perkType === "content" ? "Behind-the-scenes Notion"
                                : perkType === "discount" ? "20% off my store"
                                : "Monthly Q&A"
                              }
                            />
                          </div>

                          <div>
                            <Label>Description (optional)</Label>
                            <Textarea
                              value={perkDesc}
                              onChange={e => setPerkDesc(e.target.value)}
                              placeholder="A short detail subscribers see next to the perk."
                              rows={2}
                            />
                          </div>

                          {perkType !== "standard" && (
                            <div>
                              <Label>
                                {perkType === "community" ? "Invite link" : perkType === "discount" ? "Store link" : "Content link"}
                              </Label>
                              <Input
                                value={perkUrl}
                                onChange={e => setPerkUrl(e.target.value)}
                                placeholder={
                                  perkType === "community" ? "https://discord.gg/your-invite"
                                  : perkType === "discount" ? "https://yourstore.com"
                                  : "https://notion.so/your-page"
                                }
                              />
                            </div>
                          )}

                          {perkType === "discount" && (
                            <div>
                              <Label>Coupon code</Label>
                              <Input
                                value={perkCode}
                                onChange={e => setPerkCode(e.target.value.toUpperCase())}
                                placeholder="SUBSCRIBER20"
                                className="font-mono uppercase tracking-wider"
                              />
                            </div>
                          )}

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
                            {perk.unlock_url && (
                              <span className="text-muted-foreground ml-2 text-xs">· {perk.unlock_url}</span>
                            )}
                            {perk.unlock_code && (
                              <span className="ml-2 text-xs font-mono bg-foreground text-background px-1.5 py-0.5 rounded">{perk.unlock_code}</span>
                            )}
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
