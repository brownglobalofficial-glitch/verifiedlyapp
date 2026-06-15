import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  ShoppingBag,
  Image as ImageIcon,
  Globe,
  ChevronRight,
  Users,
  Video,
  Radio,
  FileText,
  Lock,
  Coins,
  Gift,
  Check,
  Sparkles,
} from "lucide-react";
import SocialIcon from "@/components/SocialIcon";
import VerifiedBadge from "@/components/VerifiedBadge";
import TrustScore from "@/components/TrustScore";
import FollowButton from "@/components/FollowButton";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import MembershipTiers from "@/components/MembershipTiers";
import FeePreview from "@/components/FeePreview";
import TierUpgradeCelebration from "@/components/TierUpgradeCelebration";
import { ToastAction } from "@/components/ui/toast";

type ThemeStyle = {
  bg: string;
  gradient: string;
  text: string;
  accent: string;
  accentText: string;
  muted: string;
  linkBg: string;
  linkHover: string;
  ring: string;
  font: string; // tailwind font-family class applied to the whole page
};

const THEME_STYLES: Record<string, ThemeStyle> = {
  default: {
    bg: "bg-[hsl(0,0%,98%)]",
    gradient: "from-[hsl(0,0%,95%)] to-[hsl(0,0%,98%)]",
    text: "text-[hsl(0,0%,8%)]",
    accent: "bg-[hsl(0,0%,8%)]",
    accentText: "text-white",
    muted: "text-[hsl(0,0%,45%)]",
    linkBg: "bg-white",
    linkHover: "hover:bg-[hsl(0,0%,96%)] hover:scale-[1.02]",
    ring: "ring-white/80",
    font: "font-sans",
  },
  mono: {
    bg: "bg-[hsl(0,0%,100%)]",
    gradient: "from-[hsl(0,0%,100%)] to-[hsl(0,0%,100%)]",
    text: "text-[hsl(0,0%,4%)]",
    accent: "bg-[hsl(0,0%,4%)]",
    accentText: "text-white",
    muted: "text-[hsl(0,0%,40%)]",
    linkBg: "bg-white",
    linkHover: "hover:bg-[hsl(0,0%,96%)] hover:-translate-y-0.5",
    ring: "ring-black/10",
    font: "font-sans",
  },
  midnight: {
    bg: "bg-[hsl(230,25%,8%)]",
    gradient: "from-[hsl(230,40%,18%)] to-[hsl(230,25%,8%)]",
    text: "text-[hsl(230,20%,92%)]",
    accent: "bg-[hsl(230,60%,60%)]",
    accentText: "text-white",
    muted: "text-[hsl(230,15%,55%)]",
    linkBg: "bg-[hsl(230,25%,14%)]",
    linkHover: "hover:bg-[hsl(230,25%,18%)] hover:scale-[1.02]",
    ring: "ring-white/10",
    font: "font-sans",
  },
  sunset: {
    bg: "bg-[hsl(20,40%,97%)]",
    gradient: "from-[hsl(20,60%,85%)] to-[hsl(20,40%,97%)]",
    text: "text-[hsl(20,30%,12%)]",
    accent: "bg-[hsl(20,90%,55%)]",
    accentText: "text-white",
    muted: "text-[hsl(20,15%,50%)]",
    linkBg: "bg-white",
    linkHover: "hover:bg-[hsl(20,30%,95%)] hover:scale-[1.02]",
    ring: "ring-white/80",
    font: "font-serif",
  },
  forest: {
    bg: "bg-[hsl(150,25%,96%)]",
    gradient: "from-[hsl(150,35%,82%)] to-[hsl(150,25%,96%)]",
    text: "text-[hsl(150,30%,12%)]",
    accent: "bg-[hsl(150,60%,35%)]",
    accentText: "text-white",
    muted: "text-[hsl(150,10%,45%)]",
    linkBg: "bg-white",
    linkHover: "hover:bg-[hsl(150,20%,94%)] hover:scale-[1.02]",
    ring: "ring-white/80",
    font: "font-serif",
  },
  ocean: {
    bg: "bg-[hsl(200,35%,96%)]",
    gradient: "from-[hsl(200,50%,82%)] to-[hsl(200,35%,96%)]",
    text: "text-[hsl(200,30%,12%)]",
    accent: "bg-[hsl(200,80%,45%)]",
    accentText: "text-white",
    muted: "text-[hsl(200,15%,45%)]",
    linkBg: "bg-white",
    linkHover: "hover:bg-[hsl(200,25%,94%)] hover:scale-[1.02]",
    ring: "ring-white/80",
    font: "font-sans",
  },
  lavender: {
    bg: "bg-[hsl(270,35%,96%)]",
    gradient: "from-[hsl(270,40%,85%)] to-[hsl(270,35%,96%)]",
    text: "text-[hsl(270,25%,12%)]",
    accent: "bg-[hsl(270,60%,55%)]",
    accentText: "text-white",
    muted: "text-[hsl(270,10%,48%)]",
    linkBg: "bg-white",
    linkHover: "hover:bg-[hsl(270,25%,94%)] hover:scale-[1.02]",
    ring: "ring-white/80",
    font: "font-serif",
  },
  blush: {
    bg: "bg-[hsl(345,40%,97%)]",
    gradient: "from-[hsl(345,55%,88%)] to-[hsl(345,40%,97%)]",
    text: "text-[hsl(345,30%,14%)]",
    accent: "bg-[hsl(345,75%,55%)]",
    accentText: "text-white",
    muted: "text-[hsl(345,15%,50%)]",
    linkBg: "bg-white",
    linkHover: "hover:bg-[hsl(345,30%,95%)] hover:scale-[1.02]",
    ring: "ring-white/80",
    font: "font-serif",
  },
  sand: {
    bg: "bg-[hsl(40,30%,95%)]",
    gradient: "from-[hsl(40,40%,86%)] to-[hsl(40,30%,95%)]",
    text: "text-[hsl(30,30%,14%)]",
    accent: "bg-[hsl(30,40%,30%)]",
    accentText: "text-white",
    muted: "text-[hsl(30,15%,42%)]",
    linkBg: "bg-[hsl(40,40%,98%)]",
    linkHover: "hover:bg-[hsl(40,30%,92%)] hover:scale-[1.02]",
    ring: "ring-white/80",
    font: "font-serif",
  },
  neon: {
    bg: "bg-[hsl(280,15%,6%)]",
    gradient: "from-[hsl(290,80%,18%)] via-[hsl(280,60%,12%)] to-[hsl(280,15%,6%)]",
    text: "text-[hsl(290,30%,96%)]",
    accent: "bg-[hsl(290,90%,60%)]",
    accentText: "text-white",
    muted: "text-[hsl(290,15%,65%)]",
    linkBg: "bg-[hsl(280,20%,12%)]",
    linkHover: "hover:bg-[hsl(280,25%,16%)] hover:scale-[1.02]",
    ring: "ring-[hsl(290,90%,60%)]/30",
    font: "font-mono",
  },
};

const CreatorProfile = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [perks, setPerks] = useState<Record<string, any[]>>({});
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [bioLinks, setBioLinks] = useState<any[]>([]);
  const [publicContent, setPublicContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [buyingProduct, setBuyingProduct] = useState<any>(null);
  const [_buyingSub, setBuyingSub] = useState<any>(null); // retained for handleSubscribe close-noop
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [tipAmount, setTipAmount] = useState(500);
  const [showTipDialog, setShowTipDialog] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!username) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setViewerId(session?.user?.id ?? null);
    });
    const fetchData = async () => {
      const { data: prof } = await supabase
        .from("profiles").select("*").eq("username", username.toLowerCase()).maybeSingle();
      if (!prof) { setNotFound(true); setLoading(false); return; }
      const { data: hasPayments } = await (supabase.rpc as any)("creator_has_payments", { _creator_id: prof.id });
      setProfile({ ...prof, has_payments: !!hasPayments });
      supabase.from("page_views").insert({ creator_id: prof.id }).then(() => {});
      const [{ data: prods }, { data: subs }, { data: blinks }, { data: content }] = await Promise.all([
        supabase.from("products").select("*").eq("creator_id", prof.id).eq("is_published", true),
        supabase.from("subscriptions").select("*").eq("creator_id", prof.id).eq("is_active", true),
        supabase.from("bio_links").select("*").eq("creator_id", prof.id).eq("is_active", true).order("sort_order", { ascending: true }),
        supabase.from("creator_content").select("*").eq("creator_id", prof.id).eq("is_published", true).order("created_at", { ascending: false }),
      ]);
      setProducts(prods || []);
      setSubscriptions(subs || []);
      setBioLinks(blinks || []);
      setPublicContent(content || []);

      if (subs && subs.length > 0) {
        const { data: allPerks } = await supabase
          .from("subscription_perks")
          .select("*")
          .in("subscription_id", subs.map(s => s.id))
          .order("sort_order", { ascending: true });
        const grouped: Record<string, any[]> = {};
        (allPerks || []).forEach(p => {
          if (!grouped[p.subscription_id]) grouped[p.subscription_id] = [];
          grouped[p.subscription_id].push(p);
        });
        setPerks(grouped);

        // Member counts per tier (count of 'subscribe' events minus 'unsubscribe')
        const { data: events } = await supabase
          .from("subscriber_events")
          .select("subscription_id, event_type")
          .in("subscription_id", subs.map(s => s.id));
        const counts: Record<string, number> = {};
        (events || []).forEach((e: any) => {
          if (!e.subscription_id) return;
          counts[e.subscription_id] = (counts[e.subscription_id] || 0) + (e.event_type === "subscribe" ? 1 : -1);
        });
        // clamp at 0
        Object.keys(counts).forEach(k => { if (counts[k] < 0) counts[k] = 0; });
        setMemberCounts(counts);
      }
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
    if (!viewerId) {
      navigate(`/signup?type=fan&returnTo=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
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
    if (!viewerId) {
      navigate(`/signup?type=fan&returnTo=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
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

  const handleSubscribe = async (sub: any, interval: "month" | "year" = "month") => {
    if (!viewerId) {
      navigate(`/signup?type=fan&returnTo=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (!profile?.has_payments) {
      toast({ title: "Not available", description: "This creator hasn't set up payments yet.", variant: "destructive" });
      return;
    }
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-subscription-checkout", {
        body: { subscriptionId: sub.id, creatorId: profile.id, interval },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
      setBuyingSub(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to start subscription", variant: "destructive" });
    }
    setCheckoutLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-background pt-12 pb-12">
      <div className="max-w-md mx-auto px-4 space-y-4">
        <Skeleton className="w-24 h-24 rounded-full mx-auto" />
        <Skeleton className="w-40 h-5 mx-auto" />
        <Skeleton className="w-28 h-3 mx-auto" />
        <Skeleton className="w-64 h-3 mx-auto" />
        <div className="space-y-3 pt-6">
          <Skeleton className="w-full h-14 rounded-2xl" />
          <Skeleton className="w-full h-14 rounded-2xl" />
          <Skeleton className="w-full h-14 rounded-2xl" />
          <Skeleton className="w-full h-14 rounded-2xl" />
        </div>
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
  const trustScore = profile?.trust_score ?? 0;
  const isTrustVerified = trustScore >= 80 && !profile?.trust_score_opt_out;
  const showTrustPill = (profile?.trust_score_public !== false) && !profile?.trust_score_opt_out && trustScore >= 60;

  const contentIcon = (type: string) => {
    if (type === "video") return <Video className="w-4 h-4" />;
    if (type === "live_stream") return <Radio className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.font}`}>
      {profile && (
        <Helmet>
          <title>{`${profile.display_name || profile.username} (@${profile.username})${isTrustVerified ? " · Verified" : ""} · Verifiedly`}</title>
          <meta
            name="description"
            content={(profile.bio || `${profile.display_name || profile.username} on Verifiedly${isTrustVerified ? " — verified identity, Trust Score " + trustScore + "/100." : "."} Links, products, subscriptions.`).slice(0, 158)}
          />
          <link rel="canonical" href={`https://verifiedly.app/${profile.username}`} />
          <meta property="og:type" content="profile" />
          <meta property="og:title" content={`${profile.display_name || profile.username}${isTrustVerified ? " · Verified on Verifiedly" : " on Verifiedly"}`} />
          <meta
            property="og:description"
            content={(profile.bio || `Tips, subscriptions, and products from ${profile.display_name || profile.username}.${isTrustVerified ? " Verified Trust Score " + trustScore + "/100." : ""}`).slice(0, 200)}
          />
          <meta property="og:url" content={`https://verifiedly.app/${profile.username}`} />
          {profile.avatar_url && <meta property="og:image" content={profile.avatar_url} />}
          {profile.avatar_url && <meta name="twitter:image" content={profile.avatar_url} />}
          <meta name="twitter:card" content="summary" />
          <script type="application/ld+json">{JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: profile.display_name || profile.username,
            alternateName: `@${profile.username}`,
            url: `https://verifiedly.app/${profile.username}`,
            image: profile.avatar_url || undefined,
            description: profile.bio || undefined,
          })}</script>
        </Helmet>
      )}
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
            <Avatar className={`w-24 h-24 mx-auto mb-4 ring-4 ${theme.ring} shadow-lg`}>
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

          <div className="flex items-center justify-center gap-3 mt-1.5">
            {profile?.category && (
              <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${theme.muted} border border-current/20`}>
                {profile.category}
              </span>
            )}
            <span className={`text-xs ${theme.muted} flex items-center gap-1`}>
              <Users className="w-3 h-3" /> {profile?.follower_count || 0} followers
            </span>
          </div>

          {showTrustPill && (
            <div className="flex justify-center mt-2">
              <Link to={`/verify/${profile.username}`} aria-label="View verification details">
                <TrustScore score={profile.trust_score} isElite={!!profile.is_elite} size="sm" />
              </Link>
            </div>
          )}

          {profile?.bio && (
            <p className={`mt-3 text-sm ${theme.muted} max-w-xs mx-auto leading-relaxed whitespace-pre-wrap break-words`}>{profile.bio}</p>
          )}

          <div className="flex items-center justify-center gap-2 mt-4">
            <FollowButton creatorId={profile?.id} />
            {profile?.has_payments && profile?.tips_enabled !== false && (
              <Button variant="outline" size="sm" onClick={() => setShowTipDialog(true)} className="gap-1.5 rounded-full">
                <Coins className="w-4 h-4" /> Tip
              </Button>
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
                  aria-label={`Open ${platform}`}
                >
                  <SocialIcon platform={platform} className="w-4 h-4" />
                </button>
              ))}
              {profile?.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer" aria-label="Website">
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
        {viewerId && profile?.id === viewerId && (products.length > 0 || subscriptions.length > 0 || profile?.has_payments) && (
          <div className="mb-6">
            <FeePreview
              currentTier={profile?.is_elite ? "elite" : profile?.is_pro ? "pro" : "free"}
              ownerId={profile?.id}
              viewerId={viewerId}
            />
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              Only you can see this preview.
            </p>
          </div>
        )}
        {viewerId && profile?.id === viewerId && (
          <TierUpgradeCelebration
            userId={viewerId}
            initialTier={profile?.is_elite ? "elite" : profile?.is_pro ? "pro" : "free"}
            showOverlay={false}
            onTierChange={(t) => {
              setProfile((p: any) => p ? { ...p, is_pro: t !== "free", is_elite: t === "elite" } : p);
            }}
            onActivated={(t) => {
              toast({
                title: t === "elite" ? "You're now Verifiedly Elite 👑" : "You're now Verifiedly Pro ✓",
                description:
                  t === "elite"
                    ? "0% platform fee is active. View your plan and renewal date."
                    : "Your verified badge is live and your fee just dropped to 5%.",
                action: (
                  <ToastAction altText="Open billing" onClick={() => navigate("/dashboard/billing")}>
                    View billing
                  </ToastAction>
                ),
              });
            }}
          />
        )}
        {bioLinks.length > 0 && (
          <div className={`mb-6 ${profile?.link_layout === "cards" ? "grid grid-cols-1 gap-4" : "space-y-3"}`}>
            {bioLinks.map((link, i) => {
              const isCard = profile?.link_layout === "cards";
              return (
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
                  {isCard ? (
                    <div className={`${theme.linkBg} rounded-2xl border border-border/50 overflow-hidden cursor-pointer transition-all duration-200 shadow-sm ${theme.linkHover}`}>
                      {link.thumbnail_url ? (
                        <div className="aspect-[16/9] w-full bg-muted overflow-hidden">
                          <img src={link.thumbnail_url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className={`aspect-[16/9] w-full flex items-center justify-center text-5xl ${theme.muted}`}>
                          {link.icon || "🔗"}
                        </div>
                      )}
                      <div className="p-4 flex items-center justify-between gap-3">
                        <span className={`font-semibold ${theme.text}`}>{link.title}</span>
                        <ChevronRight className={`w-4 h-4 ${theme.muted}`} />
                      </div>
                    </div>
                  ) : (
                    <div className={`${theme.linkBg} rounded-2xl border border-border/50 p-4 flex items-center gap-3 cursor-pointer transition-all duration-200 shadow-sm ${theme.linkHover}`}>
                      {link.thumbnail_url ? (
                        <img src={link.thumbnail_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      ) : link.icon ? (
                        <span className="text-xl w-8 text-center">{link.icon}</span>
                      ) : null}
                      <span className={`font-semibold text-sm flex-1 ${theme.text}`}>{link.title}</span>
                      <ChevronRight className={`w-4 h-4 ${theme.muted}`} />
                    </div>
                  )}
                </motion.a>
              );
            })}
          </div>
        )}

        {publicContent.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-6">
            <h3 className={`font-display font-semibold mb-3 text-sm ${theme.text} flex items-center gap-2`}>
              <Video className="w-4 h-4" /> Content
            </h3>
            <div className="space-y-3">
              {publicContent.map(item => (
                <div
                  key={item.id}
                  className={`${theme.linkBg} rounded-2xl border border-border/50 p-4 shadow-sm transition-all ${theme.linkHover}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                      {contentIcon(item.content_type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`font-semibold text-sm ${theme.text} truncate`}>{item.title}</p>
                      <div className={`flex items-center gap-2 text-xs ${theme.muted}`}>
                        <span className="capitalize">{item.content_type.replace("_", " ")}</span>
                        {item.visibility === "subscribers" && (
                          <span className="flex items-center gap-0.5"><Lock className="w-3 h-3" /> Subscribers</span>
                        )}
                      </div>
                    </div>
                    {item.content_type === "live_stream" && item.live_stream_url && item.visibility === "public" && (
                      <a href={item.live_stream_url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="text-xs rounded-full">Watch</Button>
                      </a>
                    )}
                  </div>
                  {item.description && (
                    <p className={`text-xs ${theme.muted} mt-2 line-clamp-2`}>{item.description}</p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {subscriptions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className={`font-display font-semibold text-sm ${theme.text} flex items-center gap-2`}>
                <Sparkles className="w-4 h-4" /> Memberships
              </h3>
              {subscriptions.length > 1 && (
                <Link to={`/${profile?.username}/membership`} className={`text-xs ${theme.muted} hover:opacity-70 transition-opacity flex items-center gap-0.5`}>
                  Compare tiers <ChevronRight className="w-3 h-3" />
                </Link>
              )}
            </div>
            <MembershipTiers
              tiers={subscriptions}
              perks={perks}
              memberCounts={memberCounts}
              onSubscribe={(tier, interval) => handleSubscribe(tier, interval)}
              loadingTierId={checkoutLoading ? subscriptions.find(s => s.id)?.id || null : null}
              variant="compact"
            />
          </motion.div>
        )}

        {products.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <h3 className={`font-display font-semibold mb-3 flex items-center gap-2 text-sm ${theme.text}`}>
              <ShoppingBag className="w-4 h-4" /> Shop
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {products.map((product, i) => {
                const isFree = Number(product.price) === 0;
                return (
                  <motion.button
                    key={product.id}
                    type="button"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.04 }}
                    className={`${theme.linkBg} text-left rounded-2xl border border-border/50 overflow-hidden cursor-pointer transition-all shadow-sm ${theme.linkHover} group`}
                    onClick={() => navigate(`/${profile.username}/p/${product.id}`)}
                  >
                    <div className="relative aspect-square overflow-hidden bg-muted/40">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
                        </div>
                      )}
                      {isFree && (
                        <span className={`absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${theme.accent} ${theme.accentText}`}>
                          Free
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className={`font-semibold text-sm leading-tight ${theme.text} line-clamp-2`}>{product.name}</p>
                      {product.category && <p className={`text-xs ${theme.muted} capitalize mt-0.5`}>{product.category}</p>}
                      <div className="flex items-center justify-between mt-1.5">
                        <p className={`font-display font-bold ${theme.text}`}>
                          {isFree ? "Free" : `$${Number(product.price).toFixed(2)}`}
                        </p>
                        <ChevronRight className={`w-4 h-4 ${theme.muted} opacity-0 group-hover:opacity-100 transition-opacity`} />
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}




        <Dialog open={showTipDialog} onOpenChange={setShowTipDialog}>
          <DialogContent className="rounded-2xl max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5" /> Send a tip to {profile?.display_name}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {[300, 500, 1000, 2000, 5000, 10000].map(amt => (
                <Button
                  key={amt}
                  variant={tipAmount === amt ? "default" : "outline"}
                  onClick={() => setTipAmount(amt)}
                  className="rounded-xl"
                >
                  ${(amt / 100).toFixed(0)}
                </Button>
              ))}
            </div>
            <Button
              onClick={() => handleTip(tipAmount)}
              disabled={checkoutLoading}
              className="w-full mt-4 rounded-xl gap-2"
            >
              <Coins className="w-4 h-4" />
              {checkoutLoading ? "Loading..." : `Send $${(tipAmount / 100).toFixed(0)} Tip`}
            </Button>
          </DialogContent>
        </Dialog>

        <div className="mt-12 text-center">
          {!viewerId ? (
            <div className="space-y-3">
              <Link to="/signup">
                <Button size="sm" className="rounded-full gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Create your own Verifiedly
                </Button>
              </Link>
              <div>
                <Link to="/" className={`text-xs ${theme.muted} hover:opacity-70 transition-opacity`}>
                  Powered by Verifiedly
                </Link>
              </div>
            </div>
          ) : (
            <Link to="/" className={`text-xs ${theme.muted} hover:opacity-70 transition-opacity`}>
              Powered by Verifiedly
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatorProfile;
