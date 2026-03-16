import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { BadgeCheck, ExternalLink, Heart, ShoppingBag, Image } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const socialIcons: Record<string, string> = {
  instagram: "📸", twitter: "🐦", youtube: "🎬", tiktok: "🎵", facebook: "👤",
};

const THEME_STYLES: Record<string, { bg: string; card: string; text: string; accent: string; muted: string }> = {
  default: { bg: "bg-background", card: "bg-card border-border", text: "text-foreground", accent: "bg-primary text-primary-foreground", muted: "text-muted-foreground" },
  midnight: { bg: "bg-[hsl(230,25%,10%)]", card: "bg-[hsl(230,25%,16%)] border-[hsl(230,20%,22%)]", text: "text-[hsl(230,20%,90%)]", accent: "bg-[hsl(230,60%,60%)] text-white", muted: "text-[hsl(230,15%,55%)]" },
  sunset: { bg: "bg-[hsl(20,40%,97%)]", card: "bg-white border-[hsl(20,30%,88%)]", text: "text-[hsl(20,30%,15%)]", accent: "bg-[hsl(20,90%,55%)] text-white", muted: "text-[hsl(20,15%,50%)]" },
  forest: { bg: "bg-[hsl(150,25%,96%)]", card: "bg-white border-[hsl(150,15%,85%)]", text: "text-[hsl(150,30%,15%)]", accent: "bg-[hsl(150,60%,35%)] text-white", muted: "text-[hsl(150,10%,45%)]" },
  ocean: { bg: "bg-[hsl(200,35%,96%)]", card: "bg-white border-[hsl(200,20%,85%)]", text: "text-[hsl(200,30%,15%)]", accent: "bg-[hsl(200,80%,45%)] text-white", muted: "text-[hsl(200,15%,45%)]" },
  lavender: { bg: "bg-[hsl(270,35%,96%)]", card: "bg-white border-[hsl(270,20%,87%)]", text: "text-[hsl(270,25%,15%)]", accent: "bg-[hsl(270,60%,55%)] text-white", muted: "text-[hsl(270,10%,48%)]" },
};

const CreatorProfile = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [bioLinks, setBioLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipAmount, setTipAmount] = useState("5");
  const [notFound, setNotFound] = useState(false);
  const [buyingProduct, setBuyingProduct] = useState<any>(null);
  const [buyingSub, setBuyingSub] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!username) return;
    const fetchData = async () => {
      const { data: prof } = await supabase
        .from("profiles").select("*").eq("username", username.toLowerCase()).maybeSingle();
      if (!prof) { setNotFound(true); setLoading(false); return; }
      setProfile(prof);
      supabase.from("page_views").insert({ creator_id: prof.id }).then(() => {});
      const [{ data: prods }, { data: subs }, { data: blinks }] = await Promise.all([
        supabase.from("products").select("*").eq("creator_id", prof.id).eq("is_published", true),
        supabase.from("subscriptions").select("*").eq("creator_id", prof.id).eq("is_active", true),
        supabase.from("bio_links").select("*").eq("creator_id", prof.id).eq("is_active", true).order("sort_order", { ascending: true }),
      ]);
      setProducts(prods || []);
      setSubscriptions(subs || []);
      setBioLinks(blinks || []);
      setLoading(false);
    };
    fetchData();
  }, [username]);

  const handlePayPal = (amount: number, description: string) => {
    if (!profile?.paypal_email) {
      toast({ title: "Payments unavailable", description: "This creator hasn't set up payments yet.", variant: "destructive" });
      return;
    }
    window.open(`https://www.paypal.com/paypalme/${profile.paypal_email}/${amount}`, "_blank");
    // Record earning
    supabase.from("earnings").insert({
      creator_id: profile.id,
      amount,
      source: "product",
      description,
    }).then(() => {});
  };

  const handleTip = () => {
    const amount = parseFloat(tipAmount);
    if (isNaN(amount) || amount < 1) {
      toast({ title: "Invalid amount", description: "Minimum tip is $1.", variant: "destructive" });
      return;
    }
    handlePayPal(amount, "Tip");
  };

  const handleSocialClick = (platform: string, link: string) => {
    if (profile) {
      supabase.from("social_analytics")
        .upsert({ creator_id: profile.id, platform, clicks: 1 }, { onConflict: "creator_id,platform" })
        .then(() => {});
    }
    const url = String(link).startsWith("http") ? String(link) : `https://${platform}.com/${String(link).replace("@", "")}`;
    window.open(url, "_blank");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (notFound) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-display font-bold">Creator not found</h1>
      <Link to="/"><Button variant="outline">Go home</Button></Link>
    </div>
  );

  const theme = THEME_STYLES[profile?.theme_color || "default"] || THEME_STYLES.default;
  const socialLinks = profile?.social_links || {};

  return (
    <div className={`min-h-screen ${theme.bg}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg mx-auto py-12 px-4"
      >
        <div className="text-center mb-8">
          <Avatar className="w-24 h-24 mx-auto mb-4 border-2 border-border">
            {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt={profile.display_name} /> : null}
            <AvatarFallback className="text-3xl font-display font-bold">
              {(profile?.display_name || username)?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h1 className={`text-2xl font-display font-bold flex items-center justify-center gap-2 ${theme.text}`}>
            {profile?.display_name || username}
            {profile?.is_pro && <BadgeCheck className="w-5 h-5 text-pro" />}
          </h1>
          <p className={`text-sm ${theme.muted}`}>@{profile?.username}</p>
          {profile?.bio && <p className={`mt-3 text-sm ${theme.muted} max-w-sm mx-auto`}>{profile.bio}</p>}
        </div>

        {Object.entries(socialLinks).filter(([, v]) => v).length > 0 && (
          <div className="flex justify-center gap-2 mb-8 flex-wrap">
            {Object.entries(socialLinks).filter(([, v]) => v).map(([platform, link]) => (
              <Button
                key={platform}
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => handleSocialClick(platform, String(link))}
              >
                {socialIcons[platform] || "🔗"} {platform}
              </Button>
            ))}
          </div>
        )}

        {/* Bio Links */}
        {bioLinks.length > 0 && (
          <div className="space-y-3 mb-8">
            {bioLinks.map((link, i) => (
              <motion.a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                onClick={() => {
                  supabase.from("link_clicks").insert({ link_id: link.id, creator_id: profile.id }).then(() => {});
                }}
                className="block"
              >
                <Card className={`p-4 card-hover flex items-center gap-3 cursor-pointer border ${theme.card}`}>
                  {link.icon && <span className="text-xl">{link.icon}</span>}
                  <span className={`font-semibold text-sm flex-1 ${theme.text}`}>{link.title}</span>
                  <ExternalLink className={`w-4 h-4 ${theme.muted}`} />
                </Card>
              </motion.a>
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

        {/* Tip */}
        <Card className={`p-6 mb-6 border ${theme.card}`}>
          <h3 className={`font-display font-semibold mb-3 flex items-center gap-2 ${theme.text}`}><Heart className="w-4 h-4" /> Send a Tip</h3>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.muted}`}>$</span>
              <Input value={tipAmount} onChange={e => setTipAmount(e.target.value)} type="number" min="1" className="pl-7" />
            </div>
            <Button onClick={handleTip} className="gap-1"><Heart className="w-4 h-4" /> Tip</Button>
          </div>
        </Card>

        {/* Subscriptions */}
        {subscriptions.length > 0 && (
          <div className="mb-6">
            <h3 className={`font-display font-semibold mb-3 ${theme.text}`}>Subscriptions</h3>
            <div className="space-y-3">
              {subscriptions.map(sub => (
                <Card key={sub.id} className={`p-4 border ${theme.card}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-semibold ${theme.text}`}>{sub.name}</p>
                      <p className={`text-sm ${theme.muted}`}>{sub.description}</p>
                    </div>
                    <Button size="sm" onClick={() => setBuyingSub(sub)}>${sub.price}/mo</Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Products */}
        {products.length > 0 && (
          <div>
            <h3 className={`font-display font-semibold mb-3 flex items-center gap-2 ${theme.text}`}>
              <ShoppingBag className="w-4 h-4" /> Digital Products
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {products.map(product => (
                <Card
                  key={product.id}
                  className={`card-hover cursor-pointer border overflow-hidden ${theme.card}`}
                  onClick={() => setBuyingProduct(product)}
                >
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-28 object-cover" />
                  ) : (
                    <div className="w-full h-28 bg-muted flex items-center justify-center">
                      <Image className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="p-3">
                    <p className={`font-semibold text-sm ${theme.text}`}>{product.name}</p>
                    {product.category && <p className={`text-xs ${theme.muted} capitalize`}>{product.category}</p>}
                    <p className={`font-display font-bold mt-1 ${theme.text}`}>${product.price}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Product purchase dialog */}
        <Dialog open={!!buyingProduct} onOpenChange={() => setBuyingProduct(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>{buyingProduct?.name}</DialogTitle></DialogHeader>
            {buyingProduct?.image_url && (
              <img src={buyingProduct.image_url} alt={buyingProduct.name} className="w-full h-48 object-cover rounded-lg" />
            )}
            <p className="text-sm text-muted-foreground">{buyingProduct?.description || "No description"}</p>
            {buyingProduct?.category && <p className="text-xs text-muted-foreground capitalize">Category: {buyingProduct.category}</p>}
            <div className="flex items-center justify-between mt-4">
              <span className="text-2xl font-display font-bold">${buyingProduct?.price}</span>
              <Button
                onClick={() => {
                  handlePayPal(buyingProduct.price, `Purchase: ${buyingProduct.name}`);
                  setBuyingProduct(null);
                }}
                className="gap-2"
              >
                Buy with PayPal
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Subscription purchase dialog */}
        <Dialog open={!!buyingSub} onOpenChange={() => setBuyingSub(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Subscribe to {buyingSub?.name}</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">{buyingSub?.description || "No description"}</p>
            <div className="flex items-center justify-between mt-4">
              <span className="text-2xl font-display font-bold">${buyingSub?.price}/mo</span>
              <Button
                onClick={() => {
                  handlePayPal(buyingSub.price, `Subscription: ${buyingSub.name}`);
                  setBuyingSub(null);
                }}
                className="gap-2"
              >
                Subscribe via PayPal
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="mt-12 text-center">
          <Link to="/" className={`text-xs ${theme.muted} hover:opacity-70 transition-opacity`}>
            Powered by Verifiedly
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default CreatorProfile;
