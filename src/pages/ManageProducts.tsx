import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, Edit2, Image, ShoppingBag, Upload, FileIcon, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import logo from "@/assets/verifiedly-logo.webp";

const CATEGORIES = [
  { value: "", label: "No category" },
  { value: "presets", label: "Presets & Filters" },
  { value: "templates", label: "Templates" },
  { value: "ebooks", label: "E-books & Guides" },
  { value: "courses", label: "Courses" },
  { value: "music", label: "Music & Audio" },
  { value: "art", label: "Art & Design" },
  { value: "software", label: "Software & Tools" },
  { value: "other", label: "Other" },
];

const ManageProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
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

  const resetForm = () => {
    setName(""); setDescription(""); setPrice(""); setCategory(""); setImageUrl(""); setFileUrl(""); setFileName(""); setEditingId(null);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB for cover images.", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${userId}/covers/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-files").upload(path, file);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("product-files").getPublicUrl(path);
    setImageUrl(publicUrl);
    setUploading(false);
    toast({ title: "Cover uploaded!" });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 20MB for product files.", variant: "destructive" });
      return;
    }
    setUploading(true);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${userId}/files/${Date.now()}_${safeName}`;
    const { error } = await supabase.storage.from("product-files").upload(path, file);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("product-files").getPublicUrl(path);
    setFileUrl(publicUrl);
    setFileName(file.name);
    setUploading(false);
    toast({ title: "File uploaded!" });
  };

  const handleSave = async () => {
    if (!name || !price) return;
    setSaving(true);
    const payload = {
      name,
      description,
      price: parseFloat(price),
      category: category || null,
      image_url: imageUrl || null,
      file_url: fileUrl || null,
      is_published: true,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("products").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("products").insert({ ...payload, creator_id: userId }));
    }
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingId ? "Product updated!" : "Product created!" });
      resetForm();
      setOpen(false);
      fetchProducts(userId);
    }
  };

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    setName(product.name);
    setDescription(product.description || "");
    setPrice(String(product.price));
    setCategory(product.category || "");
    setImageUrl(product.image_url || "");
    setFileUrl(product.file_url || "");
    setFileName(product.file_url ? product.file_url.split("/").pop() || "Attached file" : "");
    setOpen(true);
  };

  const handleTogglePublish = async (id: string, published: boolean) => {
    await supabase.from("products").update({ is_published: published }).eq("id", id);
    setProducts(products.map(p => p.id === id ? { ...p, is_published: published } : p));
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
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" /> New Product</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editingId ? "Edit Product" : "Create Product"}</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <div><Label>Name *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Photography Preset Pack" /></div>
                <div><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="What's included..." /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Price (USD) *</Label><Input type="number" value={price} onChange={e => setPrice(e.target.value)} min="0" step="0.01" /></div>
                  <div>
                    <Label>Category</Label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    >
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Cover Image Upload */}
                <div>
                  <Label>Cover Image</Label>
                  {imageUrl ? (
                    <div className="relative mt-1">
                      <img src={imageUrl} alt="Cover" className="rounded-lg h-32 w-full object-cover border border-border" />
                      <button
                        onClick={() => setImageUrl("")}
                        className="absolute top-2 right-2 bg-background/80 rounded-full p-1 hover:bg-background"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => coverInputRef.current?.click()}
                      className="mt-1 w-full border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center gap-2 hover:border-muted-foreground/50 transition-colors"
                    >
                      <Image className="w-6 h-6 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Click to upload cover image</span>
                      <span className="text-xs text-muted-foreground">Max 5MB</span>
                    </button>
                  )}
                  <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                </div>

                {/* Product File Upload */}
                <div>
                  <Label>Product File (deliverable)</Label>
                  {fileUrl ? (
                    <div className="mt-1 flex items-center gap-3 p-3 border border-border rounded-lg bg-muted/50">
                      <FileIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm truncate flex-1">{fileName}</span>
                      <button onClick={() => { setFileUrl(""); setFileName(""); }}>
                        <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-1 w-full border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center gap-2 hover:border-muted-foreground/50 transition-colors"
                    >
                      <Upload className="w-6 h-6 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Upload downloadable file</span>
                      <span className="text-xs text-muted-foreground">PDF, ZIP, MP3, etc. — Max 20MB</span>
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                </div>

                {uploading && (
                  <p className="text-sm text-muted-foreground text-center">Uploading...</p>
                )}

                <Button onClick={handleSave} disabled={saving || uploading || !name || !price} className="w-full">
                  {saving ? "Saving..." : editingId ? "Update Product" : "Create Product"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No products yet. Create your first one!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map(product => (
              <Card key={product.id} className={`p-4 transition-opacity ${!product.is_published ? "opacity-60" : ""}`}>
                <div className="flex items-center gap-4">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-16 h-16 rounded-lg object-cover border border-border" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                      <Image className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ${product.price}
                      {product.category && <> · <span className="capitalize">{product.category}</span></>}
                    </p>
                    {product.file_url && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <FileIcon className="w-3 h-3" /> File attached
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={product.is_published}
                      onCheckedChange={(c) => handleTogglePublish(product.id, c)}
                    />
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(product)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageProducts;
