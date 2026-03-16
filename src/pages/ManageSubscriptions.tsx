import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import logo from "@/assets/verifiedly-logo.webp";

const ManageSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

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
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!name || !price) return;
    setSaving(true);
    const { error } = await supabase.from("subscriptions").insert({
      creator_id: userId,
      name,
      description,
      price: parseFloat(price),
      is_active: true,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Subscription tier created!" });
      setName(""); setDescription(""); setPrice(""); setOpen(false);
      fetchSubs(userId);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("subscriptions").delete().eq("id", id);
    fetchSubs(userId);
    toast({ title: "Subscription deleted" });
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-display font-bold">Subscription Tiers</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" /> New Tier</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Subscription Tier</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Gold Tier" /></div>
                <div><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What subscribers get..." /></div>
                <div><Label>Monthly Price (USD)</Label><Input type="number" value={price} onChange={e => setPrice(e.target.value)} min="0" step="0.01" /></div>
                <Button onClick={handleCreate} disabled={saving} className="w-full">{saving ? "Creating..." : "Create Tier"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {subscriptions.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No subscription tiers yet.</p>
        ) : (
          <div className="space-y-3">
            {subscriptions.map(sub => (
              <Card key={sub.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{sub.name}</p>
                  <p className="text-sm text-muted-foreground">${sub.price}/mo · {sub.is_active ? "Active" : "Inactive"}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(sub.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageSubscriptions;
