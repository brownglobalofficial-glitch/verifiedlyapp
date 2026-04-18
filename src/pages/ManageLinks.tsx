import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, GripVertical, MousePointerClick, RefreshCw, ExternalLink } from "lucide-react";
import logo from "@/assets/verifiedly-logo.webp";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface BioLink {
  id: string;
  title: string;
  url: string;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
  clicks: number;
}

const SortableLinkRow = ({
  link,
  onToggle,
  onDelete,
}: {
  link: BioLink;
  onToggle: (id: string, v: boolean) => void;
  onDelete: (id: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto" as const,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-4 transition-opacity ${!link.is_active ? "opacity-50" : ""} ${isDragging ? "shadow-lg ring-1 ring-border" : ""}`}
    >
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground"
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-5 h-5" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {link.icon && <span className="text-lg">{link.icon}</span>}
            <p className="font-semibold text-sm truncate">{link.title}</p>
          </div>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:underline truncate block"
          >
            {link.url}
          </a>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MousePointerClick className="w-3 h-3" />
          <span>{link.clicks}</span>
        </div>

        <Switch checked={link.is_active} onCheckedChange={(v) => onToggle(link.id, v)} />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(link.id)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};

const ManageLinks = () => {
  const [links, setLinks] = useState<BioLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [previewKey, setPreviewKey] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { navigate("/login"); return; }
      setUserId(session.user.id);
      const { data: prof } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", session.user.id)
        .maybeSingle();
      if (prof?.username) setUsername(prof.username);
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

  const refreshPreview = () => setPreviewKey((k) => k + 1);

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
      await fetchLinks(userId);
      refreshPreview();
      toast({ title: "Link added" });
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, is_active: isActive } : l)));
    await supabase.from("bio_links").update({ is_active: isActive }).eq("id", id);
    refreshPreview();
  };

  const handleDelete = async (id: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== id));
    await supabase.from("bio_links").delete().eq("id", id);
    refreshPreview();
    toast({ title: "Link deleted" });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = links.findIndex((l) => l.id === active.id);
    const newIndex = links.findIndex((l) => l.id === over.id);
    const reordered = arrayMove(links, oldIndex, newIndex).map((l, i) => ({ ...l, sort_order: i }));
    setLinks(reordered);

    await Promise.all(
      reordered.map((l) =>
        supabase.from("bio_links").update({ sort_order: l.sort_order }).eq("id", l.id),
      ),
    );
    refreshPreview();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  const totalClicks = links.reduce((s, l) => s + l.clicks, 0);
  const previewUrl = username ? `/${username}` : null;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border h-16 flex items-center px-4">
        <div className="container mx-auto flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <img src={logo} alt="Verifiedly" className="h-7" />
          <span className="font-display font-semibold">Link in Bio</span>
        </div>
      </nav>

      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          {/* Left: editor */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-display font-bold">Your Links</h1>
                <p className="text-muted-foreground mt-1">Drag to reorder. Changes save instantly.</p>
              </div>
              <Card className="px-4 py-2 flex items-center gap-2">
                <MousePointerClick className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{totalClicks} clicks</span>
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
                    <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="My Website" />
                  </div>
                  <div>
                    <Label>URL</Label>
                    <Input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://example.com" />
                  </div>
                </div>
                <div>
                  <Label>Icon (emoji, optional)</Label>
                  <Input value={newIcon} onChange={(e) => setNewIcon(e.target.value)} placeholder="🔗" className="w-24" />
                </div>
                <Button onClick={handleAdd} disabled={saving || !newTitle.trim() || !newUrl.trim()} className="w-full">
                  {saving ? "Adding..." : "Add Link"}
                </Button>
              </div>
            </Card>

            {/* Sortable link list */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={links.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {links.map((link) => (
                    <SortableLinkRow
                      key={link.id}
                      link={link}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {links.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No links yet. Add your first link above.
              </p>
            )}
          </div>

          {/* Right: live phone preview */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold">Live Preview</p>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={refreshPreview} aria-label="Refresh preview">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </Button>
                  {previewUrl && (
                    <Link to={previewUrl} target="_blank">
                      <Button variant="ghost" size="sm" aria-label="Open in new tab">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              {/* Phone frame */}
              <div className="mx-auto w-[320px] h-[640px] rounded-[2.5rem] bg-foreground p-2.5 shadow-2xl">
                <div className="relative w-full h-full rounded-[2rem] overflow-hidden bg-background">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-foreground rounded-b-2xl z-10" />
                  {previewUrl ? (
                    <iframe
                      key={previewKey}
                      src={previewUrl}
                      title="Profile preview"
                      className="w-full h-full border-0"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground p-4 text-center">
                      Set up your profile to see a live preview
                    </div>
                  )}
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-3">
                {username ? `verifiedly.app/${username}` : "Profile preview"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageLinks;
