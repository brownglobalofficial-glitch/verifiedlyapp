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
  ExternalLink, LinkIcon, Palette, User as UserIcon, ArrowRight, CheckCircle2, Circle, BadgeCheck,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [linkCount, setLinkCount] = useState(0);
  const [emailConfirmed, setEmailConfirmed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { navigate("/login"); return; }
      setUser(session.user);
      setEmailConfirmed(!!session.user.email_confirmed_at);
      const [{ data: p }, { count: lc }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle(),
        supabase.from("bio_links").select("*", { count: "exact", head: true }).eq("creator_id", session.user.id),
      ]);
      setProfile(p);
      setLinkCount(lc || 0);
      setLoading(false);
    });
  }, [navigate]);

  const username = profile?.username || "creator";
  const displayName = profile?.display_name || user?.user_metadata?.display_name || "there";
  // The blue badge is earned only after a successful Stripe Identity verification.
  const isVerified = !!profile?.id_verified;

  const steps = [
    { label: "Add a profile photo", done: !!profile?.avatar_url, to: "/dashboard/settings" },
    { label: "Write a short bio (10+ chars)", done: !!profile?.bio && profile.bio.length >= 10, to: "/dashboard/settings" },
    { label: "Add at least one link", done: linkCount >= 1, to: "/dashboard/links" },
    { label: "Confirm your email", done: emailConfirmed, to: "/dashboard/settings" },
    { label: "Verify your identity", done: isVerified, to: "/dashboard/verification" },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const pct = Math.round((doneCount / steps.length) * 100);

  return (
    <DashboardShell title="Profile">
      <div className="container mx-auto max-w-5xl py-8 px-4 space-y-6">
        {/* Centered identity header */}
        <Card className="p-6">
          <div className="flex flex-col items-center text-center">
            <Avatar className="w-16 h-16">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
              <AvatarFallback className="text-xl font-display font-bold">
                {displayName?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <p className="mt-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">Welcome back</p>
            <h1 className="mt-1 text-2xl md:text-3xl font-display font-bold tracking-tight flex items-center justify-center gap-2">
              <span>{displayName}</span>
              {isVerified ? (
                <VerifiedBadge className="w-5 h-5 shrink-0" />
              ) : (
                <Link
                  to="/dashboard/verification"
                  aria-label="Get verified"
                  title="Get verified"
                  className="inline-flex shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <BadgeCheck className="w-5 h-5 text-muted-foreground fill-none stroke-[1.8] hover:text-foreground transition-colors" />
                </Link>
              )}
            </h1>
            <a
              href={`/${username}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mt-1"
            >
              verifiedly.app/{username} <ExternalLink className="w-3 h-3" />
            </a>
            {!isVerified && (
              <Link to="/dashboard/verification" className="mt-3 text-xs font-medium text-muted-foreground hover:text-foreground underline underline-offset-4">
                Get verified
              </Link>
            )}
          </div>
        </Card>

        {/* Profile completion */}
        {pct < 100 && (
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-display font-semibold text-sm">Complete your profile</h2>
                <p className="text-xs text-muted-foreground">{doneCount} of {steps.length} done</p>
              </div>
              <span className="text-2xl font-display font-bold tabular-nums">{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden mb-4">
              <div className="h-full bg-foreground transition-all" style={{ width: `${pct}%` }} />
            </div>
            <ul className="space-y-1.5">
              {steps.map((s) => (
                <li key={s.label}>
                  <Link
                    to={s.to}
                    className={`flex items-center gap-2 text-sm py-1.5 px-2 -mx-2 rounded-md transition-colors ${
                      s.done ? "text-muted-foreground" : "hover:bg-muted"
                    }`}
                  >
                    {s.done ? (
                      <CheckCircle2 className="w-4 h-4 text-foreground shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                    <span className={s.done ? "line-through" : ""}>{s.label}</span>
                    {!s.done && <ArrowRight className="w-3 h-3 ml-auto text-muted-foreground" />}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Profile editing */}
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
                  <h2 className="font-display font-semibold">Profile links</h2>
                  <p className="text-xs text-muted-foreground">Links people can use from your official profile.</p>
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
                  <p className="text-xs text-muted-foreground">Choose how your public profile looks.</p>
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