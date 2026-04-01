import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ShoppingBag, Image, Download, Globe, ChevronRight, Users, Mail } from "lucide-react";
import SocialIcon from "@/components/SocialIcon";
import VerifiedBadge from "@/components/VerifiedBadge";
import FollowButton from "@/components/FollowButton";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const THEME_STYLES: Record<string, { 
  bg: string; gradient: string; text: string; accent: string; 
  accentText: string; muted: string; linkBg: string; linkHover: string;
}> = {
  default: { 
    bg: "bg-[hsl(0,0%,98%)]", gradient: "from-[hsl(0,0%,95%)] to-[hsl(0,0%,98%)]",
    text: "text-[hsl(0,0%,8%)]", accent: "bg-[hsl(0,0%,8%)]", accentText: "text-white",
    muted: "text-[hsl(0,0%,45%)]", linkBg: "bg-white", linkHover: "hover:bg-[hsl(0,0%,96%)] hover:scale-[1.02]"
  },
  midnight: { 
    bg: "bg-[hsl(230,25%,8%)]", gradient: "from-[hsl(230,40%,18%)] to-[hsl(230,25%,8%)]",
    text: "text-[hsl(230,20%,92%)]", accent: "bg-[hsl(230,60%,60%)]", accentText: "text-white",
    muted: "text-[hsl(230,15%,55%)]", linkBg: "bg-[hsl(230,25%,14%)]", linkHover: "hover:bg-[hsl(230,25%,18%)] hover:scale-[1.02]"
  },
  sunset: { 
    bg: "bg-[hsl(20,40%,97%)]", gradient: "from-[hsl(20,60%,85%)] to-[hsl(20,40%,97%)]",
    text: "text-[hsl(20,30%,12%)]", accent: "bg-[hsl(20,90%,55%)]", accentText: "text-white",
    muted: "text-[hsl(20,15%,50%)]", linkBg: "bg-white", linkHover: "hover:bg-[hsl(20,30%,95%)] hover:scale-[1.02]"
  },
  forest: { 
    bg: "bg-[hsl(150,25%,96%)]", gradient: "from-[hsl(150,35%,82%)] to-[hsl(150,25%,96%)]",
    text: "text-[hsl(150,30%,12%)]", accent: "bg-[hsl(150,60%,35%)]", accentText: "text-white",
    muted: "text-[hsl(150,10%,45%)]", linkBg: "bg-white", linkHover: "hover:bg-[hsl(150,20%,94%)] hover:scale-[1.02]"
  },
  ocean: { 
    bg: "bg-[hsl(200,35%,96%)]", gradient: "from-[hsl(200,50%,82%)] to-[hsl(200,35%,96%)]",
    text: "text-[hsl(200,30%,12%)]", accent: "bg-[hsl(200,80%,45%)]", accentText: "text-white",
    muted: "text-[hsl(200,15%,45%)]", linkBg: "bg-white", linkHover: "hover:bg-[hsl(200,25%,94%)] hover:scale-[1.02]"
  },
  lavender: { 
    bg: "bg-[hsl(270,35%,96%)]", gradient: "from-[hsl(270,40%,85%)] to-[hsl(270,35%,96%)]",
    text: "text-[hsl(270,25%,12%)]", accent: "bg-[hsl(270,60%,55%)]", accentText: "text-white",
    muted: "text-[hsl(270,10%,48%)]", linkBg: "bg-white", linkHover: "hover:bg-[hsl(270,25%,94%)] hover:scale-[1.02]"
  },
};

const CreatorProfile = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [bioLinks, setBioLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [buyingProduct, setBuyingProduct] = useState<any>(null);
  const [buyingSub, setBuyingSub] = useState<any>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [tipAmount, setTipAmount] = useState(500);
  const [showTipDialog, setShowTipDialog] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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

  const handleSocialClick = (platform: string, link: string) => {
    if (profile) {
      supabase.from("social_analytics")
        .upsert({ creator_id: profile.id, platform, clicks: 1 }, { onConflict: "creator_id,platform" })
        .then(() => {});
    }
    const url = String(link).startsWith("http") ? String(link) : `https://${platform}.com/${String(link).replace("@", "")}`;
    window.open(url, "_blank");
  };

  const handleTip = async (amount: number) => {
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-tip", {
        body: { creatorId: profile.id, amount },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
      setShowTipDialog(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to start tip", variant: "destructive" });
    }
    setCheckoutLoading(false);
  };

  const handleBuyProduct = async (product: any) => {
    if (product.price === 0 && product.file_url) {
      window.open(product.file_url, "_blank");
      return;
    }
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-product-checkout", {
        body: { productId: product.id, creatorId: profile.id },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
      setBuyingProduct(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to start checkout", variant: "destructive" });
    }
    setCheckoutLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-muted" />
        <div className="w-32 h-4 rounded bg-muted" />
        <div className="w-48 h-3 rounded bg-muted" />
      </div>
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <h1 className="text-2xl font-display font-bold">Creator not found</h1>
      <p className="text-muted-foreground">This profile doesn't exist yet.</p>
      <Link to="/"><Button variant="outline">Go home</Button></Link>
    </div>
  );

  const theme = THEME_STYLES[profile?.theme_color || "default"] || THEME_STYLES.default;
  const socialLinks = profile?.social_links || {};
  const activeSocials = Object.entries(socialLinks).filter(([, v]) => v);
  const isVerified = profile?.is_verified || profile?.is_pro || profile?.is_elite;

  return (
    <div className={`min-h-screen ${theme.bg}`}>
      <div className={`bg-gradient-to-b ${theme.gradient} pt-12 pb-8`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md mx-auto px-4 text-center"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Avatar className="w-24 h-24 mx-auto mb-4 ring-4 ring-white/80 shadow-lg">
              {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt={profile.display_name} /> : null}
              <AvatarFallback className="text-3xl font-display font-bold bg-muted">
                {(profile?.display_name || username)?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </motion.div>

          <h1 className={`text-2xl font-display font-bold flex items-center justify-center gap-1.5 ${theme.text}`}>
            {profile?.display_name || username}
            {isVerified && <VerifiedBadge className="w-5 h-5" />}
          </h1>
          <p className={`text-sm ${theme.muted} mt-0.5`}>@{profile?.username}</p>
          
          {/* Follower count & category */}
          <div className="flex items-center justify-center gap-3 mt-1">
            {profile?.category && (
              <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${theme.muted} border border-current/20`}>
                {profile.category}
              </span>
            )}
            <span className={`text-xs ${theme.muted} flex items-center gap-1`}>
              <Users className="w-3 h-3" /> {profile?.follower_count || 0} followers
            </span>
          </div>

          {profile?.bio && (
            <p className={`mt-3 text-sm ${theme.muted} max-w-xs mx-auto leading-relaxed`}>{profile.bio}</p>
          )}

          {/* Follow + Tip + Contact */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <FollowButton creatorId={profile?.id} />
            <Button variant="outline" size="sm" onClick={() => setShowTipDialog(true)} className="gap-1.5">
              💰 Tip
            </Button>
            {profile?.contact_email && (
              <a href={`mailto:${profile.contact_email}`}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Contact
                </Button>
              </a>
            )}
          </div>

          {(activeSocials.length > 0 || profile?.website) && (
            <div className="flex justify-center gap-2 mt-4">
              {activeSocials.map(([platform, link]) => (
                <button
                  key={platform}
                  onClick={() => handleSocialClick(platform, String(link))}
                  className={`w-10 h-10 rounded-full border border-border/50 flex items-center justify-center transition-all ${theme.linkBg} hover:bg-muted/80 hover:scale-110`}
                  title={platform}
                >
                  <SocialIcon platform={platform} className="w-4 h-4" />
                </button>
              ))}
              {profile?.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer">
                  <button className={`w-10 h-10 rounded-full border border-border/50 flex items-center justify-center transition-all ${theme.linkBg} hover:bg-muted/80 hover:scale-110`} title="Website">
                    <Globe className="w-4 h-4" />
                  </button>
                </a>
              )}
            </div>
          )}
        </motion.div>
      </div>

      <div className="max-w-md mx-auto px-4 pb-12 -mt-2">
        {bioLinks.length > 0 && (
          <div className="space-y-3 mb-6">
            {bioLinks.map((link, i) => (
              <motion.a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                onClick={() => {
                  supabase.from("link_clicks").insert({ link_id: link.id, creator_id: profile.id }).then(() => {});
                }}
                className="block"
              >
                <div className={`${theme.linkBg} rounded-2xl border border-border/50 p-4 flex items-center gap-3 cursor-pointer transition-all duration-200 shadow-sm ${theme.linkHover}`}>
                  {link.icon && <span className="text-xl w-8 text-center">{link.icon}</span>}
                  <span className={`font-semibold text-sm flex-1 ${theme.text}`}>{link.title}</span>
                  <ChevronRight className={`w-4 h-4 ${theme.muted}`} />
                </div>
              </motion.a>
            ))}
          </div>
        )}

        {subscriptions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-6">
            <h3 className={`font-display font-semibold mb-3 text-sm ${theme.text}`}>Memberships</h3>
            <div className="space-y-3">
              {subscriptions.map(sub => (
                <div
                  key={sub.id}
                  className={`${theme.linkBg} rounded-2xl border border-border/50 p-5 shadow-sm cursor-pointer transition-all ${theme.linkHover}`}
                  onClick={() => setBuyingSub(sub)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-semibold ${theme.text}`}>{sub.name}</p>
                      {sub.description && <p className={`text-sm mt-0.5 ${theme.muted}`}>{sub.description}</p>}
                    </div>
                    <span className={`font-display font-bold text-lg ${theme.text}`}>${sub.price}<span className={`text-xs ${theme.muted} font-normal`}>/mo</span></span>
                  </div>
                  {sub.features && sub.features.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {sub.features.map((f: string, i: number) => (
                        <li key={i} className={`text-xs ${theme.muted} flex items-center gap-1.5`}>
                          <span className="w-1 h-1 rounded-full bg-current" /> {f}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {products.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <h3 className={`font-display font-semibold mb-3 flex items-center gap-2 text-sm ${theme.text}`}>
              <ShoppingBag className="w-4 h-4" /> Shop
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {products.map(product => (
                <div
                  key={product.id}
                  className={`${theme.linkBg} rounded-2xl border border-border/50 overflow-hidden cursor-pointer transition-all shadow-sm ${theme.linkHover}`}
                  onClick={() => setBuyingProduct(product)}
                >
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-32 object-cover" />
                  ) : (
                    <div className="w-full h-32 bg-muted/50 flex items-center justify-center">
                      <Image className="w-8 h-8 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="p-3">
                    <p className={`font-semibold text-sm leading-tight ${theme.text}`}>{product.name}</p>
                    {product.category && <p className={`text-xs ${theme.muted} capitalize mt-0.5`}>{product.category}</p>}
                    <p className={`font-display font-bold mt-1.5 ${theme.text}`}>
                      {product.price === 0 ? "Free" : `$${product.price}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <Dialog open={!!buyingProduct} onOpenChange={() => setBuyingProduct(null)}>
          <DialogContent className="rounded-2xl">
            <DialogHeader><DialogTitle>{buyingProduct?.name}</DialogTitle></DialogHeader>
            {buyingProduct?.image_url && (
              <img src={buyingProduct.image_url} alt={buyingProduct.name} className="w-full h-48 object-cover rounded-xl" />
            )}
            <p className="text-sm text-muted-foreground">{buyingProduct?.description || "No description"}</p>
            <div className="flex items-center justify-between mt-4">
              <span className="text-2xl font-display font-bold">{buyingProduct?.price === 0 ? "Free" : `$${buyingProduct?.price}`}</span>
              <div className="flex gap-2">
                {buyingProduct?.file_url && buyingProduct?.price === 0 && (
                  <a href={buyingProduct.file_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="gap-2 rounded-xl"><Download className="w-4 h-4" /> Download</Button>
                  </a>
                )}
                <Button disabled variant="outline" className="gap-2 rounded-xl">Payments coming soon</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!buyingSub} onOpenChange={() => setBuyingSub(null)}>
          <DialogContent className="rounded-2xl">
            <DialogHeader><DialogTitle>{buyingSub?.name}</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">{buyingSub?.description || "No description"}</p>
            <div className="flex items-center justify-between mt-4">
              <span className="text-2xl font-display font-bold">${buyingSub?.price}/mo</span>
              <Button disabled variant="outline" className="gap-2 rounded-xl">Payments coming soon</Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="mt-12 text-center">
          <Link to="/" className={`text-xs ${theme.muted} hover:opacity-70 transition-opacity`}>
            Powered by Verifiedly
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CreatorProfile;
