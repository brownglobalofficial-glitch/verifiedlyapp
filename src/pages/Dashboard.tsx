import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DollarSign, ShoppingBag, Users, ExternalLink, LogOut, Settings, BarChart3, Megaphone, LinkIcon, Share2, Copy } from "lucide-react";
import VerifiedBadge from "@/components/VerifiedBadge";
import UpgradePrompt from "@/components/UpgradePrompt";
import logo from "@/assets/verifiedly-logo.webp";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";
import { Shield } from "lucide-react";

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
      fetchProfile(session.user.id);
      fetchStats(session.user.id);
      supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").then(({ data }) => {
        if (data && data.length > 0) setIsAdmin(true);
      });
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    setProfile(data);
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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;

  const username = profile?.username || user?.user_metadata?.username || "creator";
  const isVerified = profile?.is_verified || profile?.is_pro || profile?.is_elite;
  const currentTier = profile?.is_elite ? "elite" : profile?.is_pro ? "pro" : "free";
  const tierLabel = profile?.is_elite ? "Elite" : profile?.is_pro ? "Pro" : "Free";

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border h-16 flex items-center px-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/dashboard"><img src={logo} alt="Verifiedly" className="h-7" /></Link>
            <div className="hidden md:flex items-center gap-4 text-sm">
              <Link to="/explore" className="text-muted-foreground hover:text-foreground transition-colors">Explore</Link>
              <Link to={`/${username}`} className="text-muted-foreground hover:text-foreground transition-colors">My Profile</Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
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
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold flex items-center gap-2">
              Welcome, {profile?.display_name || "Creator"}
              {isVerified && <VerifiedBadge className="w-6 h-6" />}
            </h1>
            <p className="text-muted-foreground mt-1">
              verifiedly.app/{username}
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                {tierLabel}
              </span>
            </p>
          </div>
          {profile?.referral_code && (
            <Button variant="outline" size="sm" className="gap-2" onClick={copyReferralLink}>
              <Share2 className="w-3 h-3" /> Share Referral
            </Button>
          )}
        </div>

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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Earnings", value: `$${stats.earnings.toLocaleString()}`, icon: DollarSign },
            { label: "Subscribers", value: stats.subs.toLocaleString(), icon: Users },
            { label: "Products", value: stats.products.toLocaleString(), icon: ShoppingBag },
            { label: "Profile Views", value: stats.views.toLocaleString(), icon: ExternalLink },
          ].map(stat => (
            <Card key={stat.label} className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <stat.icon className="w-4 h-4" />
                <span className="text-xs">{stat.label}</span>
              </div>
              <p className="text-2xl font-display font-bold">{stat.value}</p>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link to="/dashboard/products">
            <Card className="p-6 card-hover cursor-pointer h-full">
              <ShoppingBag className="w-8 h-8 mb-3" />
              <h3 className="font-display font-semibold text-lg">Digital Products</h3>
              <p className="text-sm text-muted-foreground">Create and manage your digital products</p>
            </Card>
          </Link>
          <Link to="/dashboard/subscriptions">
            <Card className="p-6 card-hover cursor-pointer h-full">
              <Users className="w-8 h-8 mb-3" />
              <h3 className="font-display font-semibold text-lg">Subscriptions</h3>
              <p className="text-sm text-muted-foreground">
                {profile?.is_pro || profile?.is_elite ? "Manage your subscription tiers" : (
                  <span>Pro/Elite feature — <span className="text-foreground underline">Upgrade</span></span>
                )}
              </p>
            </Card>
          </Link>
          <Link to="/dashboard/analytics">
            <Card className="p-6 card-hover cursor-pointer h-full">
              <BarChart3 className="w-8 h-8 mb-3" />
              <h3 className="font-display font-semibold text-lg">Analytics</h3>
              <p className="text-sm text-muted-foreground">View earnings, views & growth charts</p>
            </Card>
          </Link>
          <Link to="/dashboard/marketplace">
            <Card className="p-6 card-hover cursor-pointer h-full">
              <Megaphone className="w-8 h-8 mb-3" />
              <h3 className="font-display font-semibold text-lg">Marketplace</h3>
              <p className="text-sm text-muted-foreground">
                {profile?.account_type === "business"
                  ? "Post sponsorships & affiliate deals"
                  : "Find sponsorships & affiliate deals"}
              </p>
            </Card>
          </Link>
          <Link to="/dashboard/links">
            <Card className="p-6 card-hover cursor-pointer h-full">
              <LinkIcon className="w-8 h-8 mb-3" />
              <h3 className="font-display font-semibold text-lg">Manage Links</h3>
              <p className="text-sm text-muted-foreground">Edit your link-in-bio cards</p>
            </Card>
          </Link>
          <Link to="/dashboard/settings">
            <Card className="p-6 card-hover cursor-pointer h-full">
              <Settings className="w-8 h-8 mb-3" />
              <h3 className="font-display font-semibold text-lg">Profile Settings</h3>
              <p className="text-sm text-muted-foreground">Edit your bio, links, and profile</p>
            </Card>
          </Link>
          <UpgradePrompt currentTier={currentTier as "free" | "pro" | "elite"} />
          {isAdmin && (
            <Link to="/dashboard/admin">
              <Card className="p-6 card-hover cursor-pointer h-full border-2 border-primary">
                <Shield className="w-8 h-8 mb-3" />
                <h3 className="font-display font-semibold text-lg">Admin Panel</h3>
                <p className="text-sm text-muted-foreground">Manage users, verification, & analytics</p>
              </Card>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
