import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Camera, Plus, Trash2, GripVertical, MousePointerClick, Check } from "lucide-react";
import logo from "@/assets/verifiedly-logo.webp";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const THEMES = [
  { id: "default", label: "Classic", bg: "bg-background", accent: "bg-foreground" },
  { id: "midnight", label: "Midnight", bg: "bg-[hsl(230,25%,12%)]", accent: "bg-[hsl(230,60%,60%)]" },
  { id: "sunset", label: "Sunset", bg: "bg-[hsl(20,30%,97%)]", accent: "bg-[hsl(20,90%,55%)]" },
  { id: "forest", label: "Forest", bg: "bg-[hsl(150,20%,96%)]", accent: "bg-[hsl(150,60%,35%)]" },
  { id: "ocean", label: "Ocean", bg: "bg-[hsl(200,30%,96%)]", accent: "bg-[hsl(200,80%,45%)]" },
  { id: "lavender", label: "Lavender", bg: "bg-[hsl(270,30%,96%)]", accent: "bg-[hsl(270,60%,55%)]" },
];

interface BioLink {
  id: string;
  title: string;
  url: string;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
  clicks: number;
}

// Sortable link item component
const SortableLinkItem = ({
  link,
  onToggle,
  onDelete,
}: {
  link: BioLink;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.8 : undefined,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-3 transition-opacity ${!link.is_active ? "opacity-50" : ""} ${isDragging ? "shadow-lg" : ""}`}
    >
      <div className="flex items-center gap-3">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground">
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {link.icon && <span>{link.icon}</span>}
            <p className="font-semibold text-sm truncate">{link.title}</p>
          </div>
          <p className="text-xs text-muted-foreground truncate">{link.url}</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MousePointerClick className="w-3 h-3" />{link.clicks}
        </div>
        <Switch checked={link.is_active} onCheckedChange={(c) => onToggle(link.id, c)} />
        <Button variant="ghost" size="sm" onClick={() => onDelete(link.id)} className="text-destructive hover:text-destructive">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};

const DomainSearchSection = () => {
  const [domainQuery, setDomainQuery] = useState("");
  const [domainResult, setDomainResult] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const { toast } = useToast();

  const checkDomain = async () => {
    if (!domainQuery.trim()) return;
    let domain = domainQuery.trim().toLowerCase();
    if (!domain.includes(".")) domain += ".com";
    setChecking(true);
    setDomainResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("check-domain", {
        body: { domain },
      });
      if (error) throw error;
      setDomainResult(data);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setChecking(false);
    }
  };

  const purchaseDomain = async () => {
    if (!domainResult?.available) return;
    setPurchasing(true);
    try {
      const { data, error } = await supabase.functions.invoke("purchase-domain", {
        body: { domain: domainResult.domain, purchasePrice: domainResult.price },
      });
      if (error) throw error;
      toast({ title: "Domain purchased! 🎉", description: `${domainResult.domain} is now yours and points to your Verifiedly profile.` });
      setDomainResult(null);
      setDomainQuery("");
    } catch (err: any) {
      toast({ title: "Purchase failed", description: err.message, variant: "destructive" });
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="border-t border-border pt-6">
      <h3 className="font-display font-semibold text-lg mb-2">Custom Domain</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Don't have a website? Get a custom domain that redirects to your Verifiedly profile.
      </p>
      <div className="flex gap-2">
        <Input
          value={domainQuery}
          onChange={e => setDomainQuery(e.target.value)}
          placeholder="yourname.com"
          onKeyDown={e => e.key === "Enter" && checkDomain()}
        />
        <Button onClick={checkDomain} disabled={checking || !domainQuery.trim()}>
          {checking ? "Checking..." : "Search"}
        </Button>
      </div>
      {domainResult && (
        <Card className="mt-3 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{domainResult.domain}</p>
              {domainResult.available ? (
                <p className="text-sm text-primary">
                  ✓ Available {domainResult.price ? `— $${domainResult.price}/yr` : ""}
                </p>
              ) : (
                <p className="text-sm text-destructive">✗ Not available</p>
              )}
            </div>
            {domainResult.available && (
              <Button onClick={purchaseDomain} disabled={purchasing} size="sm">
                {purchasing ? "Purchasing..." : "Buy Domain"}
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

const ProfileSettings = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [youtube, setYoutube] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [facebook, setFacebook] = useState("");
  const [stripeConnected, setStripeConnected] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [themeColor, setThemeColor] = useState("default");

  // Bio Links
  const [links, setLinks] = useState<BioLink[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [addingLink, setAddingLink] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/login"); return; }
      fetchProfile(session.user.id);
      fetchLinks(session.user.id);
    });
    // Handle Stripe Connect return
    const params = new URLSearchParams(window.location.search);
    if (params.get("stripe_onboarded") === "true") {
      toast({ title: "Stripe connected! 🎉", description: "Your payout account is now set up." });
      setStripeConnected(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (data) {
      setProfile(data);
      setDisplayName(data.display_name || "");
      setBio(data.bio || "");
      setWebsite(data.website || "");
      setAvatarUrl(data.avatar_url || "");
      setThemeColor(data.theme_color || "default");
      const sl = (data.social_links || {}) as Record<string, string>;
      setInstagram(sl.instagram || "");
      setTwitter(sl.twitter || "");
      setYoutube(sl.youtube || "");
      setTiktok(sl.tiktok || "");
      setFacebook(sl.facebook || "");
      setStripeConnected(!!data.stripe_connect_account_id);
    }

    // Fetch private data (contact_email etc.)
    const { data: privateData } = await supabase.from("creator_private_data").select("contact_email").eq("id", userId).maybeSingle();
    setContactEmail(privateData?.contact_email || "");

    setLoading(false);
  };

  const fetchLinks = async (uid: string) => {
    const { data } = await supabase.from("bio_links").select("*").eq("creator_id", uid).order("sort_order", { ascending: true });
    setLinks((data as BioLink[]) || []);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 2MB.", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${profile.id}/avatar.${ext}`;
    await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").update({ avatar_url: url }).eq("id", profile.id);
    setAvatarUrl(url);
    setUploading(false);
    toast({ title: "Avatar updated!" });
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      display_name: displayName,
      bio,
      website,
      social_links: { instagram, twitter, youtube, tiktok, facebook },
      theme_color: themeColor,
    }).eq("id", profile.id);

    // Save contact_email to private data table
    await supabase.from("creator_private_data").upsert({
      id: profile.id,
      contact_email: contactEmail || null,
    }, { onConflict: "id" });

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved!", description: "Profile updated successfully." });
    }
  };

  // Link management
  const handleAddLink = async () => {
    if (!profile || !newTitle.trim() || !newUrl.trim()) return;
    setAddingLink(true);
    let url = newUrl.trim();
    if (!url.startsWith("http")) url = `https://${url}`;
    const { error } = await supabase.from("bio_links").insert({
      creator_id: profile.id,
      title: newTitle.trim(),
      url,
      icon: newIcon.trim() || null,
      sort_order: links.length,
    });
    setAddingLink(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setNewTitle(""); setNewUrl(""); setNewIcon("");
      fetchLinks(profile.id);
      toast({ title: "Link added!" });
    }
  };

  const handleToggleLink = async (id: string, active: boolean) => {
    await supabase.from("bio_links").update({ is_active: active }).eq("id", id);
    setLinks(links.map(l => l.id === id ? { ...l, is_active: active } : l));
  };

  const handleDeleteLink = async (id: string) => {
    await supabase.from("bio_links").delete().eq("id", id);
    setLinks(links.filter(l => l.id !== id));
    toast({ title: "Link deleted" });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = links.findIndex(l => l.id === active.id);
    const newIndex = links.findIndex(l => l.id === over.id);
    const updated = arrayMove(links, oldIndex, newIndex);
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
          <span className="font-display font-semibold">Settings</span>
        </div>
      </nav>

      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <Tabs defaultValue="profile">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="links">Links</TabsTrigger>
            <TabsTrigger value="theme">Theme</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <Avatar className="w-20 h-20">
                  {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
                  <AvatarFallback className="text-2xl font-display font-bold">
                    {(displayName || profile?.username)?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 rounded-full bg-foreground/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-5 h-5 text-background" />
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>
              <div>
                <p className="font-display font-semibold">{displayName || profile?.username}</p>
                <p className="text-sm text-muted-foreground">{uploading ? "Uploading..." : "Click to change photo"}</p>
              </div>
            </div>

            <div><Label>Display Name</Label><Input value={displayName} onChange={e => setDisplayName(e.target.value)} /></div>
            <div><Label>Bio</Label><Textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} placeholder="Tell your fans about yourself..." /></div>
            <div><Label>Website</Label><Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://yourwebsite.com" /></div>
            <div><Label>Contact Email (shown on profile)</Label><Input value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="contact@you.com" type="email" /></div>
            <div className="border-t border-border pt-6">
              <h3 className="font-display font-semibold text-lg mb-4">Payout Settings</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Connect your Stripe account to receive payouts from product sales, tips, and subscriptions.
              </p>
              {stripeConnected ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <Check className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">Stripe account connected — payouts enabled</span>
                </div>
              ) : (
                <Button
                  onClick={async () => {
                    setStripeLoading(true);
                    try {
                      const { data, error } = await supabase.functions.invoke("create-connect-account");
                      if (error) throw error;
                      if (data.onboarded) {
                        setStripeConnected(true);
                        toast({ title: "Already connected!", description: "Your Stripe account is set up." });
                      } else if (data.url) {
                        window.open(data.url, "_blank");
                      }
                    } catch (err: any) {
                      toast({ title: "Error", description: err.message, variant: "destructive" });
                    } finally {
                      setStripeLoading(false);
                    }
                  }}
                  disabled={stripeLoading}
                  className="w-full"
                >
                  {stripeLoading ? "Setting up..." : "Connect Stripe Account"}
                </Button>
              )}
            </div>

            {/* Domain Purchase */}
            {profile?.account_type !== "fan" && (
              <DomainSearchSection />
            )}

            <div className="border-t border-border pt-6">
              <h3 className="font-display font-semibold text-lg mb-4">Social Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Instagram</Label><Input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@username" /></div>
                <div><Label>Twitter / X</Label><Input value={twitter} onChange={e => setTwitter(e.target.value)} placeholder="@username" /></div>
                <div><Label>YouTube</Label><Input value={youtube} onChange={e => setYoutube(e.target.value)} placeholder="Channel URL" /></div>
                <div><Label>TikTok</Label><Input value={tiktok} onChange={e => setTiktok(e.target.value)} placeholder="@username" /></div>
                <div><Label>Facebook</Label><Input value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="Page URL" /></div>
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </TabsContent>

          <TabsContent value="links" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-display font-bold">Link in Bio</h2>
                <p className="text-sm text-muted-foreground">Drag to reorder your link cards</p>
              </div>
              <Card className="px-3 py-1.5 flex items-center gap-2">
                <MousePointerClick className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs font-medium">{totalClicks} clicks</span>
              </Card>
            </div>

            <Card className="p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><Label>Title</Label><Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="My Latest Video" /></div>
                <div><Label>URL</Label><Input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://..." /></div>
              </div>
              <div className="flex gap-3 items-end">
                <div><Label>Icon (emoji)</Label><Input value={newIcon} onChange={e => setNewIcon(e.target.value)} placeholder="🔗" className="w-20" /></div>
                <Button onClick={handleAddLink} disabled={addingLink || !newTitle.trim() || !newUrl.trim()} className="gap-1">
                  <Plus className="w-4 h-4" /> Add
                </Button>
              </div>
            </Card>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={links.map(l => l.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {links.map(link => (
                    <SortableLinkItem
                      key={link.id}
                      link={link}
                      onToggle={handleToggleLink}
                      onDelete={handleDeleteLink}
                    />
                  ))}
                  {links.length === 0 && <p className="text-center text-muted-foreground py-6 text-sm">No links yet. Add your first link above!</p>}
                </div>
              </SortableContext>
            </DndContext>
          </TabsContent>

          <TabsContent value="theme" className="space-y-6">
            <div>
              <h2 className="text-xl font-display font-bold">Profile Theme</h2>
              <p className="text-sm text-muted-foreground">Choose how your public profile looks</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setThemeColor(t.id)}
                  className={`rounded-xl border-2 p-4 text-center transition-all ${themeColor === t.id ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-muted-foreground/30"}`}
                >
                  <div className={`${t.bg} rounded-lg h-20 mb-2 flex items-end justify-center p-2`}>
                    <div className={`${t.accent} rounded-full h-3 w-12`} />
                  </div>
                  <p className="text-sm font-medium">{t.label}</p>
                  {themeColor === t.id && <Check className="w-4 h-4 mx-auto mt-1 text-primary" />}
                </button>
              ))}
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Saving..." : "Save Theme"}
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfileSettings;
