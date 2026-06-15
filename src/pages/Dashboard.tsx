import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DollarSign, ShoppingBag, Users, ExternalLink, LogOut, Settings, BarChart3, Megaphone, LinkIcon, Share2, Copy, AlertCircle, CheckCircle2, Video, CreditCard, Eye } from "lucide-react";
import VerifiedBadge from "@/components/VerifiedBadge";
import TrustScore from "@/components/TrustScore";
import UpgradePrompt from "@/components/UpgradePrompt";
import logo from "@/assets/verifiedly-logo.webp";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";
import { Shield } from "lucide-react";
import AdminStripeDiagnostics from "@/components/AdminStripeDiagnostics";
import StripeAgreementStatus from "@/components/StripeAgreementStatus";
import PayoutsChecklist from "@/components/payouts/PayoutsChecklist";
import TierUpgradeCelebration from "@/components/TierUpgradeCelebration";
import { Sparkles, ArrowRight } from "lucide-react";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({ earnings: 0, views: 0, subs: 0, products: 0 });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) { navigate("/login"); return; }
      setUser(session.user);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/login"); return; }
      setUser(session.user);
      // Fire profile + private data + role + stats fully in parallel; unblock UI on profile only.
      fetchProfile(session.user.id);
      fetchStats(session.user.id);
      // Live-sync Pro/Elite from Stripe so the upgrade banner hides instantly
      // after a successful checkout (does not block initial paint).
      supabase.functions.invoke("check-subscription").then(({ data }) => {
        if (data && (data.tier === "pro" || data.tier === "elite")) {
          setProfile((prev: any) => prev ? {
            ...prev,
            is_pro: data.tier === "pro" || data.tier === "elite",
            is_elite: data.tier === "elite",
            is_verified: true,
          } : prev);
        }
      }).catch(() => {});
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    const [profileRes, refRes, privRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      (supabase.rpc as any)("get_my_referral_code"),
      (supabase.from("creator_private_data" as any).select("stripe_connect_account_id").eq("id", userId).maybeSingle() as any),
      supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin"),
    ]);
    // Fans don't have selling features — bounce to fan dashboard
    if (profileRes.data?.account_type === "fan") {
      navigate("/fan", { replace: true });
      return;
    }
    setProfile({
      ...(profileRes.data || {}),
      referral_code: refRes?.data ?? null,
      stripe_connect_account_id: privRes?.data?.stripe_connect_account_id ?? null,
    });
    if (rolesRes.data && rolesRes.data.length > 0) setIsAdmin(true);
    setLoading(false);
  };

  const fetchStats = async (userId: string) => {
    const [{ data: earnings }, { count: views }, { count: subs }, { count: products }] = await Promise.all([
      supabase.from("earnings").select("amount").eq("creator_id", userId),
      supabase.from("page_views").select("*", { count: "exact", head: true }).eq("creator_id", userId),
      supabase.from("subscriber_events").select("*", { count: "exact", head: true }).eq("creator_id", userId).eq("event_type", "subscribe"),
      supabase.from("products").select("*", { count: "exact", head: true }).eq("creator_id", userId),
    ]);
    setStats({
      earnings: (earnings || []).reduce((s, e) => s + Number(e.amount), 0),
      views: views || 0,
      subs: subs || 0,
      products: products || 0,
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const copyReferralLink = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(`https://verifiedly.app/signup?ref=${profile.referral_code}`);
      toast({ title: "Copied!", description: "Referral link copied to clipboard." });
    }
  };

  const username = profile?.username || user?.user_metadata?.username || "creator";
  const isVerified = profile?.is_verified || profile?.is_pro || profile?.is_elite;
  const currentTier: "free" | "pro" | "elite" = profile?.is_elite ? "elite" : profile?.is_pro ? "pro" : "free";
  const tierLabel = profile?.is_elite ? "Elite" : profile?.is_pro ? "Pro" : "Free";
  const displayName = profile?.display_name || user?.user_metadata?.display_name || "there";

  return (
    <div className="min-h-screen bg-background">
      {user && (
        <TierUpgradeCelebration
          userId={user.id}
          initialTier={currentTier as "free" | "pro" | "elite"}
          onTierChange={() => fetchProfile(user.id)}
        />
      )}
      <nav className="sticky top-0 z-40 border-b border-border h-16 flex items-center px-4 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/dashboard"><img src={logo} alt="Verifiedly" className="h-7" /></Link>
            <div className="hidden md:flex items-center gap-4 text-sm">
              <Link to="/explore" className="text-muted-foreground hover:text-foreground transition-colors">Explore</Link>
              <Link to={`/${username}`} className="text-muted-foreground hover:text-foreground transition-colors">My Profile</Link>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <Link to="/explore" className="md:hidden">
              <Button variant="ghost" size="sm">Explore</Button>
            </Link>
            <Link to={`/${username}`} target="_blank">
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="w-3 h-3" /> Preview
              </Button>
            </Link>
            <Link to="/dashboard/settings">
              <Button variant="ghost" size="sm"><Settings className="w-4 h-4" /></Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout}><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto py-8 px-4 max-w-5xl">
        {/* Premium hero card */}
        <Card className="p-6 md:p-8 mb-6 border-border bg-gradient-to-br from-secondary/40 via-background to-background">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">Welcome back</p>
              <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight flex items-center gap-2">
                {displayName}
                {isVerified && <VerifiedBadge className="w-6 h-6" />}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Link to={`/${username}`} target="_blank" className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
                  verifiedly.app/{username} <ExternalLink className="w-3 h-3" />
                </Link>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                  currentTier === "elite" ? "bg-foreground text-background" :
                  currentTier === "pro" ? "badge-pro" :
                  "bg-secondary text-secondary-foreground"
                }`}>
                  {tierLabel}
                </span>
                <TrustScore score={profile?.trust_score ?? 0} isElite={!!profile?.is_elite} size="sm" />
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {profile?.referral_code && (
                <Button variant="outline" size="sm" className="gap-2" onClick={copyReferralLink}>
                  <Share2 className="w-3 h-3" /> Share referral
                </Button>
              )}
              <Link to="/dashboard/settings">
                <Button size="sm" className="gap-2">
                  Edit profile <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {profile?.referral_code && (
          <Card className="p-4 mb-6 bg-secondary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Your Referral Link</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Earn 10% when someone you refer subscribes to Pro or Elite
                </p>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-background px-2 py-1 rounded border border-border font-mono">
                  verifiedly.app/signup?ref={profile.referral_code}
                </code>
                <Button variant="ghost" size="sm" onClick={copyReferralLink}>
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Upgrade banner — only when not Pro/Elite */}
        {currentTier === "free" && profile?.account_type !== "fan" && (
          <Link to="/dashboard/upgrade" className="block mb-6 group">
            <Card className="p-4 border-2 border-foreground bg-gradient-to-r from-background via-background to-muted/40 hover:to-muted/60 transition-colors">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-foreground text-background flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-sm">Upgrade to Verifiedly Pro</p>
                    <p className="text-xs text-muted-foreground">
                      Get the verified badge and drop your platform fee from 10% to 5% (or 0% on Elite).
                    </p>
                  </div>
                </div>
                <Button size="sm" className="gap-2 shrink-0">
                  Upgrade <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </div>
            </Card>
          </Link>
        )}

        {/* Stripe Connect Status */}
        {!profile?.stripe_connect_account_id && (
          <Card className="p-4 mb-6 border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">Payouts not set up</p>
                  <p className="text-xs text-muted-foreground">Connect your Stripe account to receive payments from sales and tips</p>
                </div>
              </div>
              <Link to="/dashboard/settings">
                <Button size="sm" variant="outline">Set up payouts</Button>
              </Link>
            </div>
          </Card>
        )}
        {profile?.stripe_connect_account_id && (
          <Card className="p-4 mb-6 border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold">Payouts enabled</p>
                <p className="text-xs text-muted-foreground">Your Stripe account is connected — earnings are paid out automatically</p>
              </div>
            </div>
          </Card>
        )}

        {/* Stripe agreement status — re-prompts if missing or outdated */}
        {user && profile?.account_type !== "fan" && (
          <StripeAgreementStatus userId={user.id} />
        )}

        {/* Compact payouts checklist with link to full page */}
        {user && profile?.account_type !== "fan" && (
          <div className="mb-6 space-y-2">
            <PayoutsChecklist userId={user.id} variant="compact" />
            <Link to="/dashboard/payouts" className="text-xs text-muted-foreground hover:text-foreground underline">
              View full payouts checklist →
            </Link>
          </div>
        )}

        {/* Admin-only Stripe diagnostics */}
        {isAdmin && <AdminStripeDiagnostics />}

        {/* Overview stats */}
        <div className="mb-10">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total earnings", value: `$${stats.earnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: DollarSign },
              { label: "Subscribers", value: stats.subs.toLocaleString(), icon: Users },
              { label: "Products", value: stats.products.toLocaleString(), icon: ShoppingBag },
              { label: "Profile views", value: stats.views.toLocaleString(), icon: Eye },
            ].map(stat => (
              <Card key={stat.label} className="p-5 border-border hover:border-foreground/20 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
                  <stat.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-2xl md:text-3xl font-display font-bold tracking-tight">{stat.value}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Earn */}
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Earn</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
          <Link to="/dashboard/products">
            <Card className="p-5 card-hover cursor-pointer h-full border-border hover:border-foreground/30">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-3">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h3 className="font-display font-semibold text-base mb-1">Digital products</h3>
              <p className="text-sm text-muted-foreground">Sell e-books, presets, courses & more</p>
            </Card>
          </Link>
          <Link to="/dashboard/subscriptions">
            <Card className="p-5 card-hover cursor-pointer h-full border-border hover:border-foreground/30">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-3">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-display font-semibold text-base mb-1">Subscriptions</h3>
              <p className="text-sm text-muted-foreground">
                Create paid subscriber tiers and recurring revenue
              </p>
            </Card>
          </Link>
          <Link to="/dashboard/marketplace">
            <Card className="p-5 card-hover cursor-pointer h-full border-border hover:border-foreground/30">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-3">
                <Megaphone className="w-5 h-5" />
              </div>
              <h3 className="font-display font-semibold text-base mb-1">Marketplace</h3>
              <p className="text-sm text-muted-foreground">
                {profile?.account_type === "business"
                  ? "Post sponsorships & affiliate deals"
                  : "Find sponsorships & affiliate deals"}
              </p>
            </Card>
          </Link>
        </div>

        {/* Build */}
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Build your page</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
          <Link to="/dashboard/links">
            <Card className="p-5 card-hover cursor-pointer h-full border-border hover:border-foreground/30">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-3">
                <LinkIcon className="w-5 h-5" />
              </div>
              <h3 className="font-display font-semibold text-base mb-1">Links</h3>
              <p className="text-sm text-muted-foreground">Edit your link-in-bio cards</p>
            </Card>
          </Link>
          <Link to="/dashboard/content">
            <Card className="p-5 card-hover cursor-pointer h-full border-border hover:border-foreground/30">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-3">
                <Video className="w-5 h-5" />
              </div>
              <h3 className="font-display font-semibold text-base mb-1">Content</h3>
              <p className="text-sm text-muted-foreground">Upload videos, go live & post exclusives</p>
            </Card>
          </Link>
          <Link to="/dashboard/settings">
            <Card className="p-5 card-hover cursor-pointer h-full border-border hover:border-foreground/30">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-3">
                <Settings className="w-5 h-5" />
              </div>
              <h3 className="font-display font-semibold text-base mb-1">Profile</h3>
              <p className="text-sm text-muted-foreground">Edit bio, avatar & socials</p>
            </Card>
          </Link>
        </div>

        {/* Manage */}
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Manage</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          <Link to="/dashboard/analytics">
            <Card className="p-5 card-hover cursor-pointer h-full border-border hover:border-foreground/30">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-3">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="font-display font-semibold text-base mb-1">Analytics</h3>
              <p className="text-sm text-muted-foreground">Earnings, views & growth charts</p>
            </Card>
          </Link>
          <Link to="/dashboard/billing">
            <Card className="p-5 card-hover cursor-pointer h-full border-border hover:border-foreground/30">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-3">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="font-display font-semibold text-base mb-1">Billing</h3>
              <p className="text-sm text-muted-foreground">Plan, renewal & payout requirements</p>
            </Card>
          </Link>
          <UpgradePrompt currentTier={currentTier} />
          {isAdmin && (
            <Link to="/dashboard/admin">
              <Card className="p-5 card-hover cursor-pointer h-full border-2 border-primary">
                <div className="w-10 h-10 rounded-lg bg-foreground text-background flex items-center justify-center mb-3">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="font-display font-semibold text-base mb-1">Admin panel</h3>
                <p className="text-sm text-muted-foreground">Users, verification & platform analytics</p>
              </Card>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
