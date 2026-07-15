import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import VerifiedBadge from "@/components/VerifiedBadge";
import DashboardTour from "@/components/dashboard/DashboardTour";
import {
  ExternalLink, LinkIcon, Palette, User as UserIcon, Eye, DollarSign, Users, ArrowRight, Sparkles,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ earnings: 0, views: 0, subs: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { navigate("/login"); return; }
      setUser(session.user);
      const [{ data: p }, { data: earnings }, { count: views }, { count: subs }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle(),
        supabase.from("earnings").select("amount").eq("creator_id", session.user.id),
        supabase.from("page_views").select("*", { count: "exact", head: true }).eq("creator_id", session.user.id),
        supabase.from("subscriber_events").select("*", { count: "exact", head: true }).eq("creator_id", session.user.id).eq("event_type", "subscribe"),
      ]);
      setProfile(p);
      setStats({
        earnings: (earnings || []).reduce((s: number, e: any) => s + Number(e.amount), 0),
        views: views || 0,
        subs: subs || 0,
      });
      setLoading(false);
    });
  }, [navigate]);

  const username = profile?.username || "creator";
  const displayName = profile?.display_name || user?.user_metadata?.display_name || "there";
  // Badge is earned only via Stripe Identity ID verification.
  const isVerified = !!profile?.id_verified;
  const isPro = !!profile?.is_pro;

  return (
    <DashboardShell title="Profile">
      <div className="container mx-auto max-w-5xl py-8 px-4 space-y-6">
        {/* Profile header */}
        <Card className="p-6">
          <div className="flex items-start gap-4 flex-wrap">
            <Avatar className="w-16 h-16">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
              <AvatarFallback className="text-xl font-display font-bold">
                {displayName?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Welcome back</p>
              <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight flex items-center gap-2">
                {displayName}
                {isVerified && <VerifiedBadge className="w-5 h-5" />}
              </h1>
              <a
                href={`/${username}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mt-1"
              >
                verifiedly.app/{username} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                isPro ? "bg-foreground text-background" : "bg-secondary text-secondary-foreground"
              }`}>
                {isPro ? "Pro" : "Free"}
              </span>
            </div>
          </div>
        </Card>

        {/* Upgrade banner */}
        {!isPro && (
          <Link to="/dashboard/upgrade" className="block group">
            <Card className="p-4 border-2 border-foreground bg-gradient-to-r from-background to-muted/40 hover:to-muted/60 transition-colors">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-foreground text-background flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-display font-semibold text-sm">Go Pro — $9.99/mo</p>
                    <p className="text-xs text-muted-foreground truncate">Drop your platform fee from 10% to 3% + free ID verification.</p>
                  </div>
                </div>
                <Button size="sm" className="gap-2 shrink-0">
                  Upgrade <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </div>
            </Card>
          </Link>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Earnings", value: `$${stats.earnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: DollarSign },
            { label: "Subscribers", value: stats.subs.toLocaleString(), icon: Users },
            { label: "Views", value: stats.views.toLocaleString(), icon: Eye },
          ].map((s) => (
            <Card key={s.label} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
                <s.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-xl md:text-2xl font-display font-bold tabular-nums">{s.value}</p>
            </Card>
          ))}
        </div>

        {/* Tabs: About / Links / Theme */}
        <Tabs defaultValue="about" className="w-full">
          <TabsList>
            <TabsTrigger value="about" className="gap-1"><UserIcon className="w-3.5 h-3.5" /> About</TabsTrigger>
            <TabsTrigger value="links" className="gap-1"><LinkIcon className="w-3.5 h-3.5" /> Links</TabsTrigger>
            <TabsTrigger value="theme" className="gap-1"><Palette className="w-3.5 h-3.5" /> Theme</TabsTrigger>
          </TabsList>

          <TabsContent value="about">
            <Card className="p-5">
              <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
                <div>
                  <h2 className="font-display font-semibold">About you</h2>
                  <p className="text-xs text-muted-foreground">Display name, bio, avatar, socials and category.</p>
                </div>
                <Link to="/dashboard/settings"><Button size="sm">Edit profile</Button></Link>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-md bg-muted">
                  <p className="text-xs text-muted-foreground">Bio</p>
                  <p className="mt-1">{profile?.bio || <span className="text-muted-foreground italic">Add a short bio</span>}</p>
                </div>
                <div className="p-3 rounded-md bg-muted">
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="mt-1">{profile?.category || <span className="text-muted-foreground italic">Optional</span>}</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="links">
            <Card className="p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="font-display font-semibold">Link-in-bio</h2>
                  <p className="text-xs text-muted-foreground">The clickable cards on your public profile.</p>
                </div>
                <Link to="/dashboard/links"><Button size="sm">Manage links</Button></Link>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="theme">
            <Card className="p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="font-display font-semibold">Theme</h2>
                  <p className="text-xs text-muted-foreground">Pick a color and style for your public profile.</p>
                </div>
                <Link to="/dashboard/settings#theme"><Button size="sm">Change theme</Button></Link>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
      </div>
      <DashboardTour />
    </DashboardShell>
  );
};

export default Dashboard;
