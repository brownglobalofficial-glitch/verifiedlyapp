import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { BadgeCheck, Camera, Code2, CreditCard, ExternalLink, KeyRound, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import VerifiedBadge from "@/components/VerifiedBadge";
import { useToast } from "@/hooks/use-toast";

interface SettingsProfile {
  id: string;
  username: string;
  display_name: string | null;
  account_type: string | null;
  avatar_url: string | null;
  category: string | null;
  id_verified: boolean;
  is_pro: boolean | null;
}

interface BillingState {
  pro_status: string | null;
  pro_interval: string | null;
  pro_current_period_end: string | null;
  pro_cancel_at_period_end: boolean | null;
  stripe_customer_id: string | null;
}

const ProfileSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<SettingsProfile | null>(null);
  const [billing, setBilling] = useState<BillingState | null>(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      setUser(session.user);

      await supabase.functions.invoke("check-subscription").catch(() => undefined);
      const [{ data: profileData, error: profileError }, { data: billingData }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, username, display_name, account_type, avatar_url, category, id_verified, is_pro")
          .eq("id", session.user.id)
          .maybeSingle(),
        supabase
          .from("verifiedly_billing")
          .select("pro_status, pro_interval, pro_current_period_end, pro_cancel_at_period_end, stripe_customer_id")
          .eq("user_id", session.user.id)
          .maybeSingle(),
      ]);

      if (profileError || !profileData) {
        toast({ title: "Settings unavailable", description: profileError?.message || "Complete onboarding first.", variant: "destructive" });
        navigate("/onboarding");
        return;
      }

      setProfile(profileData as SettingsProfile);
      setBilling((billingData as BillingState | null) ?? null);
      setAvatarUrl(profileData.avatar_url || "");
      setLoading(false);
    };

    void load();
  }, [navigate, toast]);

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Choose an image file", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Image is too large", description: "Use an image smaller than 2 MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${profile.id}/avatar.${extension}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadError) {
      setUploading(false);
      toast({ title: "Photo not uploaded", description: uploadError.message, variant: "destructive" });
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    const nextUrl = `${publicUrl}?v=${Date.now()}`;
    const { error } = await supabase.from("profiles").update({ avatar_url: nextUrl }).eq("id", profile.id);
    setUploading(false);
    if (error) {
      toast({ title: "Photo not saved", description: error.message, variant: "destructive" });
      return;
    }

    setAvatarUrl(nextUrl);
    setProfile({ ...profile, avatar_url: nextUrl });
    toast({ title: "Profile photo updated" });
  };

  const sendPasswordReset = async () => {
    if (!user?.email) return;
    setSendingReset(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSendingReset(false);
    if (error) {
      toast({ title: "Email not sent", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Password email sent", description: `Check ${user.email}.` });
  };

  const openBillingPortal = async () => {
    setOpeningPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        body: { return_path: "/dashboard/settings" },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message || "Billing portal could not open.");
      if (!data?.url) throw new Error("Stripe did not return a billing portal URL.");
      window.location.assign(data.url);
    } catch (error: unknown) {
      toast({ title: "Billing portal unavailable", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
      setOpeningPortal(false);
    }
  };

  if (loading) {
    return <DashboardShell title="Settings"><div className="p-8 text-sm text-muted-foreground">Loading…</div></DashboardShell>;
  }

  const displayName = profile?.display_name || profile?.username || "Profile";
  const isPro = profile?.is_pro === true || billing?.pro_status === "active" || billing?.pro_status === "trialing";
  const renewalDate = billing?.pro_current_period_end ? new Date(billing.pro_current_period_end).toLocaleDateString() : null;
  const planLabel = billing?.pro_interval === "year" ? "Yearly" : "Monthly";

  return (
    <DashboardShell title="Settings">
      <div className="container mx-auto max-w-3xl space-y-6 px-4 py-8">
        <Card className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative w-fit">
              <Avatar className="h-20 w-20">
                {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
                <AvatarFallback className="text-2xl font-display font-bold">{displayName[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background shadow"
                aria-label="Change profile photo"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={uploadAvatar} className="hidden" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-display font-bold">{displayName}</h1>
                {profile?.id_verified && <VerifiedBadge className="h-5 w-5" label="Identity verified" />}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">@{profile?.username}</p>
              <p className="mt-2 text-xs text-muted-foreground">{uploading ? "Uploading photo…" : "JPG, PNG or WebP · maximum 2 MB"}</p>
            </div>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <a href={`/${profile?.username}`} target="_blank" rel="noreferrer">View profile <ExternalLink className="h-4 w-4" /></a>
            </Button>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display font-semibold">Account security</h2>
              <p className="mt-1 text-sm text-muted-foreground">Signed in as {user?.email || "your account"}</p>
            </div>
            <Button variant="outline" onClick={() => void sendPasswordReset()} disabled={sendingReset} className="gap-2">
              <KeyRound className="h-4 w-4" /> {sendingReset ? "Sending…" : "Change password"}
            </Button>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display font-semibold">Verifiedly Pro</h2>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${isPro ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}>
                    {isPro ? "Active" : "Free"}
                  </span>
                </div>
                {isPro ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {planLabel} plan{renewalDate ? ` · ${billing?.pro_cancel_at_period_end ? "Ends" : "Renews"} ${renewalDate}` : ""}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">$4.99 monthly or $49.99 yearly, with adult identity-verification eligibility and Tap Card member pricing.</p>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild variant={isPro ? "outline" : "default"}><Link to="/dashboard/pro">{isPro ? "View Pro" : "Upgrade to Pro"}</Link></Button>
              {billing?.stripe_customer_id && (
                <Button variant="outline" onClick={() => void openBillingPortal()} disabled={openingPortal} className="gap-2">
                  {openingPortal ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                  Manage billing
                </Button>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              {profile?.id_verified ? <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0" /> : <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />}
              <div>
                <h2 className="font-display font-semibold">Identity verification</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {profile?.id_verified
                    ? "Stripe Identity successfully verified the account holder."
                    : "Eligible adults with active Pro can complete Stripe Identity. Pro does not automatically grant the verification check."}
                </p>
              </div>
            </div>
            <Button asChild variant="outline"><Link to="/dashboard/verification">Open verification</Link></Button>
          </div>
        </Card>

        <Card className="p-5 sm:p-6" id="developer">
          <div className="flex items-start gap-3">
            <Code2 className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display font-semibold">Continue with Verifiedly</h2>
                <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Developer beta</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Approved apps can request only the profile information and identity status a user agrees to share.</p>
              <div className="mt-5 grid gap-4">
                <div><Label htmlFor="oauth-client-id">Client ID</Label><Input id="oauth-client-id" readOnly value="" placeholder="Issued after your app is approved" className="mt-1 rounded-xl font-mono text-xs" /></div>
                <div><Label htmlFor="oauth-client-secret">Client Secret</Label><Input id="oauth-client-secret" type="password" readOnly value="" placeholder="Shown once when issued or rotated" className="mt-1 rounded-xl font-mono text-xs" autoComplete="off" /></div>
                <div><Label htmlFor="oauth-redirect-uris">Redirect URIs</Label><Textarea id="oauth-redirect-uris" readOnly value="" placeholder={'https://yourapp.com/auth/callback\nhttp://localhost:3000/auth/callback'} className="mt-1 min-h-20 resize-none rounded-xl font-mono text-xs" /></div>
              </div>
              <div className="mt-5 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row">
                <Button asChild variant="outline" className="gap-2"><Link to="/developers">Open developer docs <ExternalLink className="h-4 w-4" /></Link></Button>
                <Button asChild variant="ghost"><a href="mailto:support@verifiedly.app?subject=Verifiedly%20OAuth%20client%20request">Request a client</a></Button>
              </div>
            </div>
          </div>
        </Card>

        <div className="text-center">
          <Button asChild variant="ghost"><Link to="/dashboard">Edit profile information</Link></Button>
        </div>
      </div>
    </DashboardShell>
  );
};

export default ProfileSettings;
