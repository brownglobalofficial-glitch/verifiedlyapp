import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import logo from "@/assets/verifiedly-logo.webp";

const ProfileSettings = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [youtube, setYoutube] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [facebook, setFacebook] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/login"); return; }
      fetchProfile(session.user.id);
    });
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (data) {
      setProfile(data);
      setDisplayName(data.display_name || "");
      setBio(data.bio || "");
      setWebsite(data.website || "");
      setInstagram(data.social_links?.instagram || "");
      setTwitter(data.social_links?.twitter || "");
      setYoutube(data.social_links?.youtube || "");
      setTiktok(data.social_links?.tiktok || "");
      setFacebook(data.social_links?.facebook || "");
      setPaypalEmail(data.paypal_email || "");
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      display_name: displayName,
      bio,
      website,
      social_links: { instagram, twitter, youtube, tiktok, facebook },
      paypal_email: paypalEmail,
    }).eq("id", profile.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved!", description: "Profile updated successfully." });
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border h-16 flex items-center px-4">
        <div className="container mx-auto flex items-center gap-4">
          <Link to="/dashboard"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <img src={logo} alt="Verifiedly" className="h-7" />
          <span className="font-display font-semibold">Profile Settings</span>
        </div>
      </nav>

      <div className="container mx-auto py-8 px-4 max-w-2xl space-y-6">
        <div>
          <Label>Display Name</Label>
          <Input value={displayName} onChange={e => setDisplayName(e.target.value)} />
        </div>
        <div>
          <Label>Bio</Label>
          <Textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} placeholder="Tell your fans about yourself..." />
        </div>
        <div>
          <Label>Website</Label>
          <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://yourwebsite.com" />
        </div>
        <div>
          <Label>PayPal Email (for receiving tips)</Label>
          <Input value={paypalEmail} onChange={e => setPaypalEmail(e.target.value)} placeholder="your@paypal.email" type="email" />
        </div>

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
      </div>
    </div>
  );
};

export default ProfileSettings;
