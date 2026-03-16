import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Camera, ChevronRight, ChevronLeft, Check, Plus, Trash2, LinkIcon } from "lucide-react";
import logo from "@/assets/verifiedly-logo.webp";
import { motion, AnimatePresence } from "framer-motion";

const THEMES = [
  { id: "default", label: "Classic", bg: "bg-background", accent: "bg-foreground" },
  { id: "midnight", label: "Midnight", bg: "bg-[hsl(230,25%,12%)]", accent: "bg-[hsl(230,60%,60%)]" },
  { id: "sunset", label: "Sunset", bg: "bg-[hsl(20,30%,97%)]", accent: "bg-[hsl(20,90%,55%)]" },
  { id: "forest", label: "Forest", bg: "bg-[hsl(150,20%,96%)]", accent: "bg-[hsl(150,60%,35%)]" },
  { id: "ocean", label: "Ocean", bg: "bg-[hsl(200,30%,96%)]", accent: "bg-[hsl(200,80%,45%)]" },
  { id: "lavender", label: "Lavender", bg: "bg-[hsl(270,30%,96%)]", accent: "bg-[hsl(270,60%,55%)]" },
];

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [userId, setUserId] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 1: Profile basics
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [youtube, setYoutube] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");

  // Step 2: Links
  const [links, setLinks] = useState<{ title: string; url: string; icon: string }[]>([]);
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkIcon, setNewLinkIcon] = useState("");

  // Step 3: Theme
  const [theme, setTheme] = useState("default");

  // Step 4: First product (optional)
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productCategory, setProductCategory] = useState("");

  const steps = ["Profile", "Links", "Theme", "Product"];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/login"); return; }
      setUserId(session.user.id);
      // Pre-fill from metadata
      setDisplayName(session.user.user_metadata?.display_name || "");
    });
  }, [navigate]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 2MB.", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${userId}/avatar.${ext}`;
    await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").update({ avatar_url: url }).eq("id", userId);
    setAvatarUrl(url);
    setUploading(false);
  };

  const addLink = () => {
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) return;
    let url = newLinkUrl.trim();
    if (!url.startsWith("http")) url = `https://${url}`;
    setLinks([...links, { title: newLinkTitle.trim(), url, icon: newLinkIcon.trim() || "🔗" }]);
    setNewLinkTitle("");
    setNewLinkUrl("");
    setNewLinkIcon("");
  };

  const removeLink = (i: number) => setLinks(links.filter((_, idx) => idx !== i));

  const handleFinish = async () => {
    setSaving(true);

    // Save profile
    await supabase.from("profiles").update({
      display_name: displayName,
      bio,
      social_links: { instagram, twitter, youtube, tiktok },
      paypal_email: paypalEmail,
      theme_color: theme,
      onboarding_completed: true,
    }).eq("id", userId);

    // Save links
    if (links.length > 0) {
      await supabase.from("bio_links").insert(
        links.map((l, i) => ({
          creator_id: userId,
          title: l.title,
          url: l.url,
          icon: l.icon || null,
          sort_order: i,
        }))
      );
    }

    // Save product if filled
    if (productName && productPrice) {
      await supabase.from("products").insert({
        creator_id: userId,
        name: productName,
        description: productDescription,
        price: parseFloat(productPrice) || 0,
        category: productCategory || null,
        is_published: true,
      });
    }

    setSaving(false);
    toast({ title: "You're all set! 🎉", description: "Your creator profile is live." });
    navigate("/dashboard");
  };

  const canProceed = () => {
    if (step === 0) return displayName.trim().length > 0;
    return true;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b border-border h-16 flex items-center px-4">
        <div className="container mx-auto flex items-center">
          <img src={logo} alt="Verifiedly" className="h-7" />
        </div>
      </nav>

      {/* Progress bar */}
      <div className="container mx-auto max-w-2xl px-4 pt-8">
        <div className="flex items-center gap-2 mb-2">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`h-2 rounded-full flex-1 transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`} />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mb-8">
          {steps.map((s, i) => (
            <span key={s} className={i === step ? "text-foreground font-medium" : ""}>{s}</span>
          ))}
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {step === 0 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-display font-bold">Set up your profile</h1>
                  <p className="text-muted-foreground mt-1">Tell your audience who you are</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <Avatar className="w-20 h-20">
                      {avatarUrl ? <AvatarImage src={avatarUrl} /> : null}
                      <AvatarFallback className="text-2xl font-display font-bold">
                        {displayName?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 rounded-full bg-foreground/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-5 h-5 text-background" />
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </div>
                  <p className="text-sm text-muted-foreground">{uploading ? "Uploading..." : "Upload a profile photo"}</p>
                </div>

                <div>
                  <Label>Display Name *</Label>
                  <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your Name" />
                </div>
                <div>
                  <Label>Bio</Label>
                  <Textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Tell your fans about yourself..." />
                </div>
                <div>
                  <Label>PayPal Email (for receiving payments)</Label>
                  <Input value={paypalEmail} onChange={e => setPaypalEmail(e.target.value)} placeholder="your@paypal.email" type="email" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Instagram</Label><Input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@username" /></div>
                  <div><Label>Twitter / X</Label><Input value={twitter} onChange={e => setTwitter(e.target.value)} placeholder="@username" /></div>
                  <div><Label>YouTube</Label><Input value={youtube} onChange={e => setYoutube(e.target.value)} placeholder="Channel URL" /></div>
                  <div><Label>TikTok</Label><Input value={tiktok} onChange={e => setTiktok(e.target.value)} placeholder="@username" /></div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-display font-bold">Add your links</h1>
                  <p className="text-muted-foreground mt-1">These will appear on your profile as clickable cards</p>
                </div>

                <Card className="p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div><Label>Title</Label><Input value={newLinkTitle} onChange={e => setNewLinkTitle(e.target.value)} placeholder="My Website" /></div>
                    <div><Label>URL</Label><Input value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)} placeholder="https://..." /></div>
                  </div>
                  <div className="flex gap-3 items-end">
                    <div>
                      <Label>Icon (emoji)</Label>
                      <Input value={newLinkIcon} onChange={e => setNewLinkIcon(e.target.value)} placeholder="🔗" className="w-20" />
                    </div>
                    <Button onClick={addLink} disabled={!newLinkTitle.trim() || !newLinkUrl.trim()} className="gap-1">
                      <Plus className="w-4 h-4" /> Add
                    </Button>
                  </div>
                </Card>

                <div className="space-y-2">
                  {links.map((link, i) => (
                    <Card key={i} className="p-3 flex items-center gap-3">
                      <span>{link.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{link.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeLink(i)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </Card>
                  ))}
                  {links.length === 0 && (
                    <p className="text-center text-muted-foreground py-6 text-sm">No links yet. You can always add them later.</p>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-display font-bold">Choose your theme</h1>
                  <p className="text-muted-foreground mt-1">Pick a style for your public profile</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {THEMES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`rounded-xl border-2 p-4 text-center transition-all ${theme === t.id ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-muted-foreground/30"}`}
                    >
                      <div className={`${t.bg} rounded-lg h-20 mb-2 flex items-end justify-center p-2`}>
                        <div className={`${t.accent} rounded-full h-3 w-12`} />
                      </div>
                      <p className="text-sm font-medium">{t.label}</p>
                      {theme === t.id && <Check className="w-4 h-4 mx-auto mt-1 text-primary" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-display font-bold">Create your first product</h1>
                  <p className="text-muted-foreground mt-1">Optional — you can skip this and add products later</p>
                </div>

                <div className="space-y-4">
                  <div><Label>Product Name</Label><Input value={productName} onChange={e => setProductName(e.target.value)} placeholder="e.g. Photography Preset Pack" /></div>
                  <div><Label>Description</Label><Textarea value={productDescription} onChange={e => setProductDescription(e.target.value)} placeholder="What's included..." rows={3} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Price (USD)</Label><Input type="number" value={productPrice} onChange={e => setProductPrice(e.target.value)} min="0" step="0.01" placeholder="9.99" /></div>
                    <div>
                      <Label>Category</Label>
                      <select
                        value={productCategory}
                        onChange={e => setProductCategory(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      >
                        <option value="">Select...</option>
                        <option value="presets">Presets & Filters</option>
                        <option value="templates">Templates</option>
                        <option value="ebooks">E-books & Guides</option>
                        <option value="courses">Courses</option>
                        <option value="music">Music & Audio</option>
                        <option value="art">Art & Design</option>
                        <option value="software">Software & Tools</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="border-t border-border bg-background sticky bottom-0">
        <div className="container mx-auto max-w-2xl px-4 py-4 flex justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep(step - 1)}
            disabled={step === 0}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>

          {step < steps.length - 1 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="gap-1"
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={saving} className="gap-1">
              {saving ? "Setting up..." : "Finish Setup"} <Check className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
