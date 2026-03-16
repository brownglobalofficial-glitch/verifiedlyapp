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

const ManageProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
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
      fetchProducts(session.user.id);
    });
  }, [navigate]);

  const fetchProducts = async (uid: string) => {
    const { data } = await supabase.from("products").select("*").eq("creator_id", uid).order("created_at", { ascending: false });
    setProducts(data || []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!name || !price) return;
    setSaving(true);
    const { error } = await supabase.from("products").insert({
      creator_id: userId,
      name,
      description,
      price: parseFloat(price),
      is_published: true,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Product created!" });
      setName(""); setDescription(""); setPrice(""); setOpen(false);
      fetchProducts(userId);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("products").delete().eq("id", id);
    fetchProducts(userId);
    toast({ title: "Product deleted" });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border h-16 flex items-center px-4">
        <div className="container mx-auto flex items-center gap-4">
          <Link to="/dashboard"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <img src={logo} alt="Verifiedly" className="h-7" />
          <span className="font-display font-semibold">Digital Products</span>
        </div>
      </nav>

      <div className="container mx-auto py-8 px-4 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-display font-bold">Your Products</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" /> New Product</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Product</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
                <div><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} /></div>
                <div><Label>Price (USD)</Label><Input type="number" value={price} onChange={e => setPrice(e.target.value)} min="0" step="0.01" /></div>
                <Button onClick={handleCreate} disabled={saving} className="w-full">{saving ? "Creating..." : "Create Product"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {products.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No products yet. Create your first one!</p>
        ) : (
          <div className="space-y-3">
            {products.map(product => (
              <Card key={product.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-sm text-muted-foreground">${product.price} · {product.is_published ? "Published" : "Draft"}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)}>
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

export default ManageProducts;
