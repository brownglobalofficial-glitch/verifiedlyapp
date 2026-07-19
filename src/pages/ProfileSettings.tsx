import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { Camera, Code2, ExternalLink, KeyRound, ShieldCheck } from "lucide-react";
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

const THEMES = [
  { id: "default", label: "Classic", colors: "bg-neutral-50 border-neutral-300" },
  { id: "mono", label: "Mono", colors: "bg-white border-black" },
  { id: "midnight", label: "Midnight", colors: "bg-slate-950 border-slate-500" },
  { id: "sunset", label: "Sunset", colors: "bg-orange-100 border-orange-400" },
  { id: "forest", label: "Forest", colors: "bg-emerald-100 border-emerald-500" },
  { id: "ocean", label: "Ocean", colors: "bg-sky-100 border-sky-500" },
  { id: "lavender", label: "Lavender", colors: "bg-violet-100 border-violet-500" },
  { id: "blush", label: "Blush", colors: "bg-rose-100 border-rose-400" },
  { id: "sand", label: "Sand", colors: "bg-amber-100 border-amber-500" },
  { id: "neon", label: "Neon", colors: "bg-zinc-950 border-fuchsia-500" },
];

interface SettingsProfile {
  id: string;
  username: string;
  display_name: string | null;
  account_type: string | null;
  avatar_url: string | null;
  theme_color: string | null;
  id_verified: boolean;
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
        .select("id, username, display_name, account_type, avatar_url, theme_color, id_verified")
        .eq("id", session.user.id)
        .maybeSingle();
      if (error || !data) {
        toast({ title: "Settings unavailable", description: error?.message, variant: "destructive" });
        return;
      }
      setProfile(data);
      setTheme(data.theme_color || "default");
      setAvatarUrl(data.avatar_url || "");
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

  if (loading) {
    return <DashboardShell title="Settings"><div className="p-8 text-sm text-muted-foreground">Loading…</div></DashboardShell>;
  }

  const displayName = profile?.display_name || profile?.username || "Profile";

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

        <Card className="p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="font-display font-semibold">Profile appearance</h2>
            <p className="mt-1 text-xs text-muted-foreground">Choose a restrained background style. Your information keeps the same clear structure.</p>
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
