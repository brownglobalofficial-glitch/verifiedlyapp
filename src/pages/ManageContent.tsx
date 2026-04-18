import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, Video, Radio, FileText, Upload, Eye, EyeOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import logo from "@/assets/verifiedly-logo.webp";

const ManageContent = () => {
  const [content, setContent] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contentType, setContentType] = useState("video");
  const [visibility, setVisibility] = useState("subscribers");
  const [liveStreamUrl, setLiveStreamUrl] = useState("");
  const [subscriptionTierId, setSubscriptionTierId] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/login"); return; }
      setUserId(session.user.id);
      fetchContent(session.user.id);
      fetchSubscriptions(session.user.id);
    });
  }, [navigate]);

  const fetchContent = async (uid: string) => {
    const { data } = await supabase
      .from("creator_content")
      .select("*")
      .eq("creator_id", uid)
      .order("created_at", { ascending: false });
    setContent(data || []);
    setLoading(false);
  };

  const fetchSubscriptions = async (uid: string) => {
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("creator_id", uid)
      .eq("is_active", true);
    setSubscriptions(data || []);
  };

  const handleUploadVideo = async (): Promise<string | null> => {
    if (!selectedFile || !userId) return null;
    setUploading(true);
    const ext = selectedFile.name.split(".").pop();
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("creator-videos")
      .upload(path, selectedFile);
    setUploading(false);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      return null;
    }
    const { data: urlData } = supabase.storage.from("creator-videos").getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleCreate = async () => {
    if (!title) return;
    setSaving(true);

    let fileUrl: string | null = null;
    if (contentType === "video" && selectedFile) {
      fileUrl = await handleUploadVideo();
      if (!fileUrl) { setSaving(false); return; }
    }

    const { error } = await supabase.from("creator_content").insert({
      creator_id: userId,
      title,
      description,
      content_type: contentType,
      file_url: fileUrl,
      live_stream_url: contentType === "live_stream" ? liveStreamUrl : null,
      visibility,
      subscription_tier_id: subscriptionTierId || null,
      is_published: isPublished,
    });

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Content created!" });
      resetForm();
      setOpen(false);
      fetchContent(userId);
    }
  };

  const resetForm = () => {
    setTitle(""); setDescription(""); setContentType("video");
    setVisibility("subscribers"); setLiveStreamUrl("");
    setSubscriptionTierId(""); setIsPublished(false); setSelectedFile(null);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("creator_content").delete().eq("id", id);
    fetchContent(userId);
    toast({ title: "Content deleted" });
  };

  const togglePublish = async (id: string, current: boolean) => {
    await supabase.from("creator_content").update({ is_published: !current }).eq("id", id);
    fetchContent(userId);
  };

  const typeIcon = (type: string) => {
    if (type === "video") return <Video className="w-4 h-4" />;
    if (type === "live_stream") return <Radio className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border h-16 flex items-center px-4">
        <div className="container mx-auto flex items-center gap-4">
          <Link to="/dashboard"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <img src={logo} alt="Verifiedly" className="h-7" />
          <span className="font-display font-semibold">Content</span>
        </div>
      </nav>

      <div className="container mx-auto py-8 px-4 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-display font-bold">Your Content</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" /> Add Content</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Add New Content</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Content Type</Label>
                  <Select value={contentType} onValueChange={setContentType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">📹 Video Upload</SelectItem>
                      <SelectItem value="live_stream">🔴 Live Stream</SelectItem>
                      <SelectItem value="post">📝 Post</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Title</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Behind the Scenes" />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your content..." />
                </div>

                {contentType === "video" && (
                  <div>
                    <Label>Video File</Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                    />
                    <Button
                      variant="outline"
                      className="w-full gap-2 mt-1"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4" />
                      {selectedFile ? selectedFile.name : "Choose video file"}
                    </Button>
                  </div>
                )}

                {contentType === "live_stream" && (
                  <div>
                    <Label>Live Stream URL</Label>
                    <Input
                      value={liveStreamUrl}
                      onChange={e => setLiveStreamUrl(e.target.value)}
                      placeholder="YouTube/Twitch/Kick stream URL"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Paste your YouTube Live, Twitch, or Kick stream link
                    </p>
                  </div>
                )}

                <div>
                  <Label>Visibility</Label>
                  <Select value={visibility} onValueChange={setVisibility}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">🌐 Public — everyone can see</SelectItem>
                      <SelectItem value="subscribers">🔒 Subscribers only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {visibility === "subscribers" && subscriptions.length > 0 && (
                  <div>
                    <Label>Required Subscription Tier (optional)</Label>
                    <Select value={subscriptionTierId || "any"} onValueChange={(v) => setSubscriptionTierId(v === "any" ? "" : v)}>
                      <SelectTrigger><SelectValue placeholder="Any subscriber" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any subscriber</SelectItem>
                        {subscriptions.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name} (${s.price}/mo)</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label>Publish immediately</Label>
                  <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                </div>

                <Button onClick={handleCreate} disabled={saving || uploading} className="w-full">
                  {uploading ? "Uploading..." : saving ? "Saving..." : "Create Content"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {content.length === 0 ? (
          <div className="text-center py-12">
            <Video className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No content yet. Upload videos, go live, or create posts for your subscribers.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {content.map(item => (
              <Card key={item.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0 w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                      {typeIcon(item.content_type)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{item.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="capitalize">{item.content_type.replace("_", " ")}</span>
                        <span>·</span>
                        <span>{item.visibility === "public" ? "🌐 Public" : "🔒 Subscribers"}</span>
                        <span>·</span>
                        <span>{item.is_published ? "Published" : "Draft"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePublish(item.id, item.is_published)}
                      title={item.is_published ? "Unpublish" : "Publish"}
                    >
                      {item.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
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

export default ManageContent;
