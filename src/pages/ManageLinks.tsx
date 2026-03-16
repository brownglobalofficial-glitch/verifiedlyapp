import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, GripVertical, ExternalLink, MousePointerClick } from "lucide-react";
import logo from "@/assets/verifiedly-logo.webp";

interface BioLink {
  id: string;
  title: string;
  url: string;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
  clicks: number;
}

const ManageLinks = () => {
  const [links, setLinks] = useState<BioLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/login"); return; }
      setUserId(session.user.id);
      fetchLinks(session.user.id);
    });
  }, [navigate]);

  const fetchLinks = async (uid: string) => {
    const { data } = await supabase
      .from("bio_links")
      .select("*")
      .eq("creator_id", uid)
      .order("sort_order", { ascending: true });
    setLinks((data as BioLink[]) || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!userId || !newTitle.trim() || !newUrl.trim()) return;
    setSaving(true);
    let url = newUrl.trim();
    if (!url.startsWith("http")) url = `https://${url}`;

    const { error } = await supabase.from("bio_links").insert({
      creator_id: userId,
      title: newTitle.trim(),
      url,
      icon: newIcon.trim() || null,
      sort_order: links.length,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setNewTitle("");
      setNewUrl("");
      setNewIcon("");
      fetchLinks(userId);
      toast({ title: "Link added!" });
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await supabase.from("bio_links").update({ is_active: isActive }).eq("id", id);
    setLinks(links.map(l => l.id === id ? { ...l, is_active: isActive } : l));
  };

  const handleDelete = async (id: string) => {
    await supabase.from("bio_links").delete().eq("id", id);
    setLinks(links.filter(l => l.id !== id));
    toast({ title: "Link deleted" });
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const updated = [...links];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    updated.forEach((l, i) => l.sort_order = i);
    setLinks(updated);
    await Promise.all(updated.map(l =>
      supabase.from("bio_links").update({ sort_order: l.sort_order }).eq("id", l.id)
    ));
  };

  const handleMoveDown = async (index: number) => {
    if (index === links.length - 1) return;
    const updated = [...links];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    updated.forEach((l, i) => l.sort_order = i);
    setLinks(updated);
    await Promise.all(updated.map(l =>
      supabase.from("bio_links").update({ sort_order: l.sort_order }).eq("id", l.id)
    ));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;

  const totalClicks = links.reduce((s, l) => s + l.clicks, 0);

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border h-16 flex items-center px-4">
        <div className="container mx-auto flex items-center gap-4">
          <Link to="/dashboard"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <img src={logo} alt="Verifiedly" className="h-7" />
          <span className="font-display font-semibold">Link in Bio</span>
        </div>
      </nav>

      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold">Your Links</h1>
            <p className="text-muted-foreground mt-1">Customize your link-in-bio page</p>
          </div>
          <Card className="px-4 py-2 flex items-center gap-2">
            <MousePointerClick className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{totalClicks} total clicks</span>
          </Card>
        </div>

        {/* Add new link */}
        <Card className="p-5 mb-6">
          <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Link
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Title</Label>
                <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="My Website" />
              </div>
              <div>
                <Label>URL</Label>
                <Input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://example.com" />
              </div>
            </div>
            <div>
              <Label>Icon (emoji, optional)</Label>
              <Input value={newIcon} onChange={e => setNewIcon(e.target.value)} placeholder="🔗" className="w-24" />
            </div>
            <Button onClick={handleAdd} disabled={saving || !newTitle.trim() || !newUrl.trim()} className="w-full">
              {saving ? "Adding..." : "Add Link"}
            </Button>
          </div>
        </Card>

        {/* Link list */}
        <div className="space-y-3">
          {links.map((link, i) => (
            <Card key={link.id} className={`p-4 transition-opacity ${!link.is_active ? "opacity-50" : ""}`}>
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => handleMoveUp(i)}
                    disabled={i === 0}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs"
                  >▲</button>
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <button
                    onClick={() => handleMoveDown(i)}
                    disabled={i === links.length - 1}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs"
                  >▼</button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {link.icon && <span className="text-lg">{link.icon}</span>}
                    <p className="font-semibold text-sm truncate">{link.title}</p>
                  </div>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:underline truncate block">
                    {link.url}
                  </a>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MousePointerClick className="w-3 h-3" />
                  <span>{link.clicks}</span>
                </div>

                <Switch
                  checked={link.is_active}
                  onCheckedChange={(checked) => handleToggle(link.id, checked)}
                />

                <Button variant="ghost" size="sm" onClick={() => handleDelete(link.id)} className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
          {links.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No links yet. Add your first link above!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageLinks;
