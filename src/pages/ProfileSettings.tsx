import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { Camera, Code2, ExternalLink, KeyRound, Search, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import DashboardShell from "@/components/dashboard/DashboardShell";
import SocialIcon from "@/components/SocialIcon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import VerifiedBadge from "@/components/VerifiedBadge";
import { useToast } from "@/hooks/use-toast";

const THEMES = [
  { id: "default", label: "Classic", colors: "bg-neutral-50 border-neutral-300", page: "bg-neutral-50 text-neutral-950", surface: "border-neutral-200 bg-white", muted: "text-neutral-500" },
  { id: "mono", label: "Mono", colors: "bg-white border-black", page: "bg-white text-black", surface: "border-neutral-300 bg-white", muted: "text-neutral-500" },
  { id: "midnight", label: "Midnight", colors: "bg-slate-950 border-slate-500", page: "bg-slate-950 text-slate-50", surface: "border-slate-800 bg-slate-900", muted: "text-slate-400" },
  { id: "sunset", label: "Sunset", colors: "bg-orange-100 border-orange-400", page: "bg-orange-50 text-stone-950", surface: "border-orange-200 bg-white/90", muted: "text-stone-500" },
  { id: "forest", label: "Forest", colors: "bg-emerald-100 border-emerald-500", page: "bg-emerald-50 text-emerald-950", surface: "border-emerald-200 bg-white/90", muted: "text-emerald-700/70" },
  { id: "ocean", label: "Ocean", colors: "bg-sky-100 border-sky-500", page: "bg-sky-50 text-slate-950", surface: "border-sky-200 bg-white/90", muted: "text-sky-800/60" },
  { id: "lavender", label: "Lavender", colors: "bg-violet-100 border-violet-500", page: "bg-violet-50 text-violet-950", surface: "border-violet-200 bg-white/90", muted: "text-violet-800/60" },
  { id: "blush", label: "Blush", colors: "bg-rose-100 border-rose-400", page: "bg-rose-50 text-rose-950", surface: "border-rose-200 bg-white/90", muted: "text-rose-800/60" },
  { id: "sand", label: "Sand", colors: "bg-amber-100 border-amber-500", page: "bg-amber-50 text-stone-950", surface: "border-amber-200 bg-white/90", muted: "text-stone-500" },
  { id: "neon", label: "Neon", colors: "bg-zinc-950 border-fuchsia-500", page: "bg-zinc-950 text-fuchsia-50", surface: "border-fuchsia-900/50 bg-zinc-900", muted: "text-zinc-400" },
];

interface SettingsProfile {
  id: string;
  username: string;
  display_name: string | null;
  account_type: string | null;
  avatar_url: string | null;
  category: string | null;
  website: string | null;
  social_links: unknown;
  theme_color: string | null;
  id_verified: boolean;
  search_visible: boolean;
  accepts_verification_requests: boolean;
  business_verified: boolean;
}

const ProfileSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<SettingsProfile | null>(null);
  const [theme, setTheme] = useState("default");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [acceptsVerificationRequests, setAcceptsVerificationRequests] = useState(false);
  const [savingDiscovery, setSavingDiscovery] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      setUser(session.user);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, account_type, avatar_url, category, website, social_links, theme_color, id_verified, search_visible, accepts_verification_requests, business_verified")
        .eq("id", session.user.id)
        .maybeSingle();
      if (error || !data) {
        toast({ title: "Settings unavailable", description: error?.message, variant: "destructive" });
        return;
      }
      setProfile(data);
      setTheme(data.theme_color || "default");
      setAvatarUrl(data.avatar_url || "");
      setSearchVisible(data.search_visible);
      setAcceptsVerificationRequests(data.accepts_verification_requests);
      setLoading(false);
    };
    load();
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
    toast({ title: "Profile photo updated" });
  };

  const saveTheme = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ theme_color: theme }).eq("id", profile.id);
    setSaving(false);
    if (error) {
      toast({ title: "Theme not saved", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Theme saved" });
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

  const saveDiscovery = async () => {
    if (!profile) return;
    setSavingDiscovery(true);
    const nextAcceptsRequests = searchVisible && acceptsVerificationRequests;
    const { error } = await supabase.from("profiles").update({
      search_visible: searchVisible,
      accepts_verification_requests: nextAcceptsRequests,
    }).eq("id", profile.id);
    setSavingDiscovery(false);
    if (error) {
      toast({ title: "Discovery settings not saved", description: error.message, variant: "destructive" });
      return;
    }
    setAcceptsVerificationRequests(nextAcceptsRequests);
    setProfile({ ...profile, search_visible: searchVisible, accepts_verification_requests: nextAcceptsRequests });
    toast({ title: searchVisible ? "Profile added to opt-in search" : "Profile removed from search" });
  };

  if (loading) {
    return <DashboardShell title="Settings"><div className="p-8 text-sm text-muted-foreground">Loading…</div></DashboardShell>;
  }

  const displayName = profile?.display_name || profile?.username || "Profile";
  const selectedTheme = THEMES.find((option) => option.id === theme) || THEMES[0];
  const profileSocials = (profile?.social_links || {}) as Record<string, string>;
  const previewSocials = ["instagram", "youtube", "tiktok", "facebook", "twitter"]
    .filter((platform) => String(platform === "twitter" ? profileSocials.twitter || profileSocials.x || "" : profileSocials[platform] || "").trim());

  return (
    <DashboardShell title="Settings">
      <div className="container mx-auto max-w-3xl px-4 py-8 space-y-6">
        <Card className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative w-fit">
              <Avatar className="h-20 w-20">
                {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
                <AvatarFallback className="text-2xl font-display font-bold">{displayName[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background shadow" aria-label="Change profile photo">
                <Camera className="h-4 w-4" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={uploadAvatar} className="hidden" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-display font-bold">{displayName}</h1>
                {profile?.id_verified && <VerifiedBadge className="h-5 w-5" label={profile.account_type === "business" ? "Account holder verified" : "Identity verified"} />}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">@{profile?.username}</p>
              <p className="mt-2 text-xs text-muted-foreground">{uploading ? "Uploading photo…" : "JPG, PNG, or WebP · maximum 2 MB"}</p>
            </div>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <a href={`/${profile?.username}`} target="_blank" rel="noreferrer">View profile <ExternalLink className="h-4 w-4" /></a>
            </Button>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <Search className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-display font-semibold">Profile discovery</h2>
                  <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">Discovery is off by default. When enabled, signed-in organization accounts can find the same public information already shown on your profile. There are no job applications, rankings, connections, or background checks.</p>
                </div>
                <Switch checked={searchVisible} onCheckedChange={(value) => { setSearchVisible(value); if (!value) setAcceptsVerificationRequests(false); }} aria-label="Appear in Verifiedly search" />
              </div>

              <div className={`mt-4 flex items-start justify-between gap-4 rounded-2xl border p-4 ${searchVisible ? "" : "opacity-50"}`}>
                <div><p className="text-sm font-medium">Accept verification requests</p><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">Signals that verified organizations may ask you to independently verify a degree or license. You always decide whether to proceed.</p></div>
                <Switch disabled={!searchVisible} checked={acceptsVerificationRequests} onCheckedChange={setAcceptsVerificationRequests} aria-label="Accept verification requests" />
              </div>

              <div className="mt-4 flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] text-muted-foreground">Only information you mark public can appear in discovery.</p>
                <Button onClick={() => void saveDiscovery()} disabled={savingDiscovery} size="sm" className="rounded-full px-5">{savingDiscovery ? "Saving…" : "Save discovery"}</Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="font-display font-semibold">Profile appearance</h2>
            <p className="mt-1 text-xs text-muted-foreground">Choose a restrained background style. Your information keeps the same clear structure.</p>
          </div>
          <div className={`overflow-hidden rounded-3xl border p-5 ${selectedTheme.page}`} aria-label="Live profile appearance preview">
            <div className="mx-auto max-w-md text-center">
              <Avatar className="mx-auto h-20 w-20 bg-muted">
                {avatarUrl && <AvatarImage src={avatarUrl} alt="" className="object-cover" />}
                <AvatarFallback className="text-2xl font-display font-bold">{displayName[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="mt-3 flex items-center justify-center gap-1.5">
                <p className="font-display text-xl font-bold">{displayName}</p>
                {profile?.id_verified && <VerifiedBadge className="h-4 w-4" label={profile.account_type === "business" ? "Account holder verified" : "Identity verified"} />}
              </div>
              <p className={`mt-1 text-xs ${selectedTheme.muted}`}>@{profile?.username}{profile?.category ? ` · ${profile.category}` : ""}</p>
              {!!previewSocials.length && <div className="mt-3 flex justify-center gap-2">{previewSocials.map((platform) => <span key={platform} className={`inline-flex h-8 w-8 items-center justify-center rounded-full border ${selectedTheme.surface}`}><SocialIcon platform={platform} className="h-3.5 w-3.5" /></span>)}</div>}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(140px,0.8fr)_minmax(0,1.4fr)]">
              <div className={`rounded-2xl border p-3 ${selectedTheme.surface}`}><p className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${selectedTheme.muted}`}>{profile?.account_type === "business" ? "Organization information" : "Profile information"}</p><p className="mt-2 text-xs">{profile?.category || "Your professional label"}</p>{profile?.account_type === "business" && profile.website && <p className={`mt-1 text-[11px] ${selectedTheme.muted}`}>Official website</p>}</div>
              <div className="grid grid-cols-2 gap-2">{["Work", "Education", "Credentials", "Awards"].map((label) => <div key={label} className={`rounded-xl border p-3 text-xs font-medium ${selectedTheme.surface}`}>{label}</div>)}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {THEMES.map((option) => (
              <button
                type="button"
                key={option.id}
                onClick={() => setTheme(option.id)}
                className={`rounded-lg border-2 p-2 text-left transition-all ${theme === option.id ? "border-foreground ring-2 ring-foreground/10" : "border-transparent"}`}
              >
                <span className={`block h-14 rounded-md border ${option.colors}`} />
                <span className="mt-2 block text-xs font-medium">{option.label}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-end border-t border-border pt-4">
            <Button onClick={saveTheme} disabled={saving} className="rounded-full px-5">{saving ? "Saving…" : "Save"}</Button>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display font-semibold">Account security</h2>
              <p className="mt-1 text-sm text-muted-foreground">Signed in as {user?.email || "your account"}</p>
            </div>
            <Button variant="outline" onClick={sendPasswordReset} disabled={sendingReset} className="gap-2">
              <KeyRound className="h-4 w-4" /> {sendingReset ? "Sending…" : "Change password"}
            </Button>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <h2 className="font-display font-semibold">Identity verification</h2>
                <p className="mt-1 text-xs text-muted-foreground">Verification status and privacy controls are managed on one dedicated page.</p>
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
                <h2 className="font-display font-semibold">Sign in with Verifiedly (OAuth 2.0 API)</h2>
                <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Developer beta</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Connect an approved app to consented Verifiedly profile and identity-status data. Credentials are issued after redirect-URI review; they are not generated or changed in the browser.</p>

              <div className="mt-5 grid gap-4">
                <div>
                  <Label htmlFor="oauth-client-id">Client ID</Label>
                  <Input id="oauth-client-id" readOnly value="" placeholder="Issued after your app is approved" className="mt-1 rounded-xl font-mono text-xs" />
                </div>
                <div>
                  <Label htmlFor="oauth-client-secret">Client Secret</Label>
                  <Input id="oauth-client-secret" type="password" readOnly value="" placeholder="Shown once when issued or rotated" className="mt-1 rounded-xl font-mono text-xs" autoComplete="off" />
                  <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">Verifiedly stores only a hash. A secret cannot be retrieved later; rotate it if it is lost. Never put it in browser code or a VITE_* variable.</p>
                </div>
                <div>
                  <Label htmlFor="oauth-redirect-uris">Redirect URIs</Label>
                  <Textarea id="oauth-redirect-uris" readOnly value="" placeholder={'https://yourapp.com/auth/callback\nhttp://localhost:3000/auth/callback'} className="mt-1 min-h-20 resize-none rounded-xl font-mono text-xs" />
                  <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">HTTPS is required in production and every callback must exactly match a registered URI. Browser and mobile apps use Authorization Code + PKCE (S256).</p>
                </div>
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
