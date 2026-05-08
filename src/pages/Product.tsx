import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { ArrowLeft, Download, ShoppingBag, Image as ImageIcon, ShieldCheck, Zap, Star, Check } from "lucide-react";
import VerifiedBadge from "@/components/VerifiedBadge";
import { useToast } from "@/hooks/use-toast";
import RefundsSummary from "@/components/RefundsSummary";

const Product = () => {
  const { username, productId } = useParams<{ username: string; productId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState<any>(null);
  const [creator, setCreator] = useState<any>(null);
  const [otherProducts, setOtherProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    if (!username || !productId) return;
    const fetchData = async () => {
      const { data: prof } = await supabase
        .from("profiles").select("*").eq("username", username.toLowerCase()).maybeSingle();
      if (!prof) { setNotFound(true); setLoading(false); return; }
      setCreator(prof);

      const { data: prod } = await supabase
        .from("products").select("*").eq("id", productId).eq("is_published", true).maybeSingle();
      if (!prod || prod.creator_id !== prof.id) { setNotFound(true); setLoading(false); return; }
      setProduct(prod);

      const { data: others } = await supabase
        .from("products").select("*")
        .eq("creator_id", prof.id).eq("is_published", true).neq("id", productId).limit(4);
      setOtherProducts(others || []);
      setLoading(false);
    };
    fetchData();
  }, [username, productId]);

  const handleBuy = async () => {
    if (!product) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate(`/signup?type=fan&returnTo=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (product.price === 0 && product.file_url) {
      setCheckoutLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("download-product", {
          body: { productId: product.id },
        });
        if (error) throw error;
        if (data?.url) {
          const a = document.createElement("a");
          a.href = data.url;
          a.rel = "noopener noreferrer";
          a.target = "_blank";
          if (data.fileName) a.download = data.fileName;
          document.body.appendChild(a);
          a.click();
          a.remove();
          toast({ title: "Download started", description: "Check your downloads folder. You can re-download anytime from your dashboard." });
        } else throw new Error("Could not generate download link.");
      } catch (err: any) {
        toast({ title: "Download failed", description: err.message || "Please try again.", variant: "destructive" });
      } finally {
        setCheckoutLoading(false);
      }
      return;
    }
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-product-checkout", {
        body: { productId: product.id, creatorId: creator.id },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to start checkout", variant: "destructive" });
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-3xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <h1 className="text-2xl font-display font-bold">Product not found</h1>
        <Link to={`/${username || ""}`}><Button variant="outline">Back to profile</Button></Link>
      </div>
    );
  }

  const isFree = Number(product.price) === 0;
  const isVerified = creator?.is_verified || creator?.is_pro || creator?.is_elite;

  return (
    <div className="min-h-screen bg-background pb-32 md:pb-12">
      {/* Top bar */}
      <div className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to={`/${creator.username}`} className="flex items-center gap-2 text-sm font-medium hover:opacity-70 transition">
            <ArrowLeft className="w-4 h-4" /> Back to {creator.display_name || creator.username}
          </Link>
          <Link to="/" className="text-xs text-muted-foreground hover:opacity-70">Verifiedly</Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6 md:pt-10">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Hero image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="md:sticky md:top-20 self-start"
          >
            <div className="aspect-square rounded-3xl overflow-hidden bg-muted border border-border/60 shadow-sm">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-16 h-16 text-muted-foreground/30" />
                </div>
              )}
            </div>
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="space-y-6"
          >
            {/* Creator */}
            <Link to={`/${creator.username}`} className="inline-flex items-center gap-2.5 group">
              <Avatar className="w-9 h-9">
                {creator.avatar_url ? <AvatarImage src={creator.avatar_url} /> : null}
                <AvatarFallback>{(creator.display_name || creator.username)?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold flex items-center gap-1 group-hover:underline">
                  {creator.display_name || creator.username}
                  {isVerified && <VerifiedBadge className="w-3.5 h-3.5" />}
                </p>
                <p className="text-xs text-muted-foreground">@{creator.username}</p>
              </div>
            </Link>

            {/* Title + meta */}
            <div className="space-y-2">
              {product.category && (
                <span className="inline-block text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  {product.category}
                </span>
              )}
              <h1 className="text-3xl md:text-4xl font-display font-bold leading-tight">{product.name}</h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-current text-foreground" />)}
                </span>
                <span>New release</span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2 pt-2">
              <span className="text-4xl md:text-5xl font-display font-bold">
                {isFree ? "Free" : `$${Number(product.price).toFixed(2)}`}
              </span>
              {!isFree && <span className="text-sm text-muted-foreground">USD · one-time</span>}
            </div>

            {/* Refund summary above Pay button (paid items only) */}
            {!isFree && (
              <div className="hidden md:block">
                <RefundsSummary type="product" />
              </div>
            )}

            {/* CTA — desktop / inline */}
            <div className="hidden md:block">
              <Button
                size="lg"
                onClick={handleBuy}
                disabled={checkoutLoading}
                className="w-full h-14 text-base rounded-2xl gap-2 font-semibold"
              >
                {checkoutLoading ? "Loading…" : isFree ? (
                  <><Download className="w-5 h-5" /> Get it free</>
                ) : (
                  <><ShoppingBag className="w-5 h-5" /> Buy now · ${Number(product.price).toFixed(2)}</>
                )}
              </Button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 text-xs text-center pt-2">
              <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/40">
                <Zap className="w-4 h-4" />
                <span className="font-medium">Instant access</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/40">
                <ShieldCheck className="w-4 h-4" />
                <span className="font-medium">Secure checkout</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/40">
                <Check className="w-4 h-4" />
                <span className="font-medium">Direct support</span>
              </div>
            </div>

            {!isFree && (
              <p className="text-xs text-muted-foreground text-center">
                By purchasing you agree to our{" "}
                <Link to="/terms" className="underline hover:text-foreground">Terms</Link>.
                The creator is the merchant of record for this sale.
              </p>
            )}

            {/* Description */}
            {product.description && (
              <div className="pt-4 border-t border-border/60">
                <h2 className="font-display font-semibold mb-2 text-lg">About this product</h2>
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{product.description}</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* More from creator */}
        {otherProducts.length > 0 && (
          <div className="mt-16 border-t border-border/60 pt-10">
            <h2 className="font-display font-semibold text-xl mb-5">More from {creator.display_name || creator.username}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {otherProducts.map(p => (
                <Link
                  key={p.id}
                  to={`/${creator.username}/p/${p.id}`}
                  className="group rounded-2xl border border-border/60 overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5"
                >
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full aspect-square object-cover" />
                  ) : (
                    <div className="w-full aspect-square bg-muted flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="font-semibold text-sm line-clamp-2 leading-tight">{p.name}</p>
                    <p className="font-display font-bold mt-1.5 text-sm">
                      {Number(p.price) === 0 ? "Free" : `$${Number(p.price).toFixed(2)}`}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky mobile CTA */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur border-t border-border/60 px-4 py-3 pb-safe">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Price</p>
            <p className="font-display font-bold text-lg leading-none">
              {isFree ? "Free" : `$${Number(product.price).toFixed(2)}`}
            </p>
          </div>
          <Button
            onClick={handleBuy}
            disabled={checkoutLoading}
            className="h-12 px-6 rounded-xl gap-2 font-semibold"
          >
            {checkoutLoading ? "Loading…" : isFree ? (
              <><Download className="w-4 h-4" /> Get it free</>
            ) : (
              <><ShoppingBag className="w-4 h-4" /> Buy now</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Product;
