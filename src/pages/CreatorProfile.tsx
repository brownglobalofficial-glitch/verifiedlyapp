import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { BadgeCheck, ExternalLink, Heart, ShoppingBag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const socialIcons: Record<string, string> = {
  instagram: "📸",
  twitter: "🐦",
  youtube: "🎬",
  tiktok: "🎵",
  facebook: "👤",
};

const CreatorProfile = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipAmount, setTipAmount] = useState("5");
  const [notFound, setNotFound] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!username) return;
    const fetchData = async () => {
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username.toLowerCase())
        .maybeSingle();
      
      if (!prof) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setProfile(prof);

      const [{ data: prods }, { data: subs }] = await Promise.all([
        supabase.from("products").select("*").eq("creator_id", prof.id).eq("is_published", true),
        supabase.from("subscriptions").select("*").eq("creator_id", prof.id).eq("is_active", true),
      ]);
      setProducts(prods || []);
      setSubscriptions(subs || []);
      setLoading(false);
    };
    fetchData();
  }, [username]);

  const handleTip = () => {
    if (!profile?.paypal_email) {
      toast({ title: "Tips unavailable", description: "This creator hasn't set up tips yet.", variant: "destructive" });
      return;
    }
    const amount = parseFloat(tipAmount);
    if (isNaN(amount) || amount < 1) {
      toast({ title: "Invalid amount", description: "Minimum tip is $1.", variant: "destructive" });
      return;
    }
    window.open(`https://www.paypal.com/paypalme/${profile.paypal_email}/${amount}`, "_blank");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (notFound) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-display font-bold">Creator not found</h1>
      <Link to="/"><Button variant="outline">Go home</Button></Link>
    </div>
  );

  const socialLinks = profile?.social_links || {};

  return (
    <div className="min-h-screen bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg mx-auto py-12 px-4"
      >
        <div className="text-center mb-8">
          <Avatar className="w-24 h-24 mx-auto mb-4 border-2 border-border">
            {profile?.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
            ) : null}
            <AvatarFallback className="text-3xl font-display font-bold">
              {(profile?.display_name || username)?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-2xl font-display font-bold flex items-center justify-center gap-2">
            {profile?.display_name || username}
            {profile?.is_pro && <BadgeCheck className="w-5 h-5 text-pro" />}
          </h1>
          <p className="text-sm text-muted-foreground">@{profile?.username}</p>
          {profile?.bio && <p className="mt-3 text-sm text-muted-foreground max-w-sm mx-auto">{profile.bio}</p>}
        </div>

        {Object.entries(socialLinks).filter(([, v]) => v).length > 0 && (
          <div className="flex justify-center gap-3 mb-8 flex-wrap">
            {Object.entries(socialLinks).filter(([, v]) => v).map(([platform, link]) => (
              <a key={platform} href={String(link).startsWith("http") ? String(link) : `https://${platform}.com/${String(link).replace("@", "")}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-1">
                  {socialIcons[platform] || "🔗"} {platform}
                </Button>
              </a>
            ))}
          </div>
        )}

        {profile?.website && (
          <a href={profile.website} target="_blank" rel="noopener noreferrer" className="block mb-8">
            <Button variant="outline" className="w-full gap-2">
              <ExternalLink className="w-4 h-4" /> {profile.website.replace(/^https?:\/\//, "")}
            </Button>
          </a>
        )}

        <Card className="p-6 mb-6">
          <h3 className="font-display font-semibold mb-3 flex items-center gap-2"><Heart className="w-4 h-4" /> Send a Tip</h3>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input value={tipAmount} onChange={e => setTipAmount(e.target.value)} type="number" min="1" className="pl-7" />
            </div>
            <Button onClick={handleTip} className="gap-1"><Heart className="w-4 h-4" /> Tip</Button>
          </div>
        </Card>

        {subscriptions.length > 0 && (
          <div className="mb-6">
            <h3 className="font-display font-semibold mb-3">Subscriptions</h3>
            <div className="space-y-3">
              {subscriptions.map(sub => (
                <Card key={sub.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{sub.name}</p>
                    <p className="text-sm text-muted-foreground">{sub.description}</p>
                  </div>
                  <Button size="sm">${sub.price}/mo</Button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {products.length > 0 && (
          <div>
            <h3 className="font-display font-semibold mb-3 flex items-center gap-2"><ShoppingBag className="w-4 h-4" /> Digital Products</h3>
            <div className="grid grid-cols-2 gap-3">
              {products.map(product => (
                <Card key={product.id} className="p-4 card-hover cursor-pointer">
                  <p className="font-semibold text-sm">{product.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{product.description?.slice(0, 60)}</p>
                  <p className="font-display font-bold mt-2">${product.price}</p>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="mt-12 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Powered by Verifiedly
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default CreatorProfile;
