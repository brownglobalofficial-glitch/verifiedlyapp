import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Camera, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LEGAL_TERMS_VERSION, VAULT_POLICY_VERSION } from "@/lib/legal";
import logoMark from "@/assets/verifiedly-v-mark.png";

type AccountType = "creator" | "business";

const normalizeUrl = (value: string) => {
  const candidate = value.trim();
  if (!candidate) return null;
  try {
    const parsed = new URL(/^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
};

const OnboardingMembership = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userId, setUserId] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("creator");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [available, setAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return void navigate("/login");
      const metadata = (session.user.user_metadata || {}) as Record<string, unknown>;
      setUserId(session.user.id);
      setDisplayName(String(metadata.display_name || metadata.full_name || metadata.name || ""));
      if (metadata.account_type === "business") setAccountType("business");
      if (typeof metadata.username === "string" && !/^[a-f0-9]{32}$/.test(metadata.username)) setUsername(metadata.username);

      const { data } = await supabase.from("profiles")
        .select("username, display_name, category, account_type, avatar_url, website, social_links, onboarding_completed")
        .eq("id", session.user.id)
        .maybeSingle();
      if (!data) return;
      if (data.onboarding_completed) return void navigate("/dashboard", { replace: true });
      if (data.username && !/^[a-f0-9]{32}$/.test(data.username)) setUsername(data.username);
      if (data.display_name) setDisplayName(data.display_name);
      if (data.category) setCategory(data.category);
      if (data.account_type === "business") setAccountType("business");
      if (data.avatar_url) setAvatarUrl(data.avatar_url);
      if (data.website) setWebsite(data.website);
      const currentSocials = (data.social_links || {}) as Record<string, string>;
      setSocialLinks(currentSocials);
      setLocation(currentSocials.location || "");
    })();
  }, [navigate]);

  useEffect(() => {
    if (!userId || username.length < 3) {
      setAvailable(null);
      return;
    }
    setChecking(true);
    const timer = window.setTimeout(async () => {
      const { data, error } = await supabase.from("profiles").select("id").eq("username", username).neq("id", userId).maybeSingle();
      setAvailable(error ? null : !data);
      setChecking(false);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [userId, username]);

  const uploadAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;
    if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
      toast({ title: "Choose an image under 2 MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${userId}/avatar.${extension}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) {
      setUploading(false);
      toast({ title: "Photo not uploaded", description: error.message, variant: "destructive" });
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(`${publicUrl}?t=${Date.now()}`);
    setUploading(false);
  };

  const finish = async () => {
    if (!userId || !displayName.trim() || username.length < 3 || available !== true) {
      toast({ title: "Complete the required profile fields", variant: "destructive" });
      return;
    }
    const normalizedWebsite = accountType === "business" && website.trim() ? normalizeUrl(website) : null;
    if (accountType === "business" && website.trim() && !normalizedWebsite) {
      toast({ title: "Enter a valid official website", variant: "destructive" });
      return;
    }

    setSaving(true);
    const nextSocialLinks = { ...socialLinks };
    if (location.trim()) nextSocialLinks.location = location.trim();
    else delete nextSocialLinks.location;

    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      username,
      display_name: displayName.trim(),
      category: category.trim() || null,
      account_type: accountType,
      avatar_url: avatarUrl || null,
      website: normalizedWebsite,
      social_links: nextSocialLinks,
      onboarding_completed: true,
    }, { onConflict: "id" });
    if (error) {
      setSaving(false);
      toast({ title: "Setup not completed", description: error.message, variant: "destructive" });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const acceptedAt = String(session.user.user_metadata?.legal_terms_accepted_at || new Date().toISOString());
      await supabase.from("legal_acceptances").upsert({
        user_id: userId,
        terms_version: LEGAL_TERMS_VERSION,
        vault_policy_version: VAULT_POLICY_VERSION,
        source: session.user.app_metadata?.provider === "email" ? "signup" : "oauth_signup",
      }, { onConflict: "user_id,terms_version,vault_policy_version" }).catch(() => undefined);
      await supabase.auth.updateUser({ data: { account_type: accountType, legal_terms_accepted_at: acceptedAt, legal_terms_version: LEGAL_TERMS_VERSION } }).catch(() => undefined);
    }

    setSaving(false);
    toast({ title: "Your official profile is ready" });
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="flex h-16 items-center border-b px-4"><div className="container mx-auto flex max-w-2xl items-center gap-2"><img src={logoMark} alt="" className="h-7 w-7 object-contain" /><span className="font-display text-sm font-bold">Verifiedly</span></div></nav>
      <main className="container mx-auto max-w-2xl px-4 py-8">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Your official profile, everywhere.</p>
        <h1 className="mt-2 text-3xl font-display font-bold">Finish your profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">Start with the essentials. Work, Education and social links can be added afterward.</p>

        <div className="mt-8 space-y-6">
          <div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setAccountType("creator")} className={`rounded-xl border p-4 text-left ${accountType === "creator" ? "border-foreground bg-muted/60" : "hover:border-muted-foreground"}`}><UserRound className="mb-3 h-5 w-5" /><p className="font-semibold">Person</p><p className="mt-1 text-xs text-muted-foreground">An official profile with optional Work and Education.</p></button><button type="button" onClick={() => setAccountType("business")} className={`rounded-xl border p-4 text-left ${accountType === "business" ? "border-foreground bg-muted/60" : "hover:border-muted-foreground"}`}><Building2 className="mb-3 h-5 w-5" /><p className="font-semibold">Organization</p><p className="mt-1 text-xs text-muted-foreground">A business, club, team, nonprofit or group.</p></button></div>

          <div className="flex items-center gap-4"><button type="button" className="group relative rounded-full" onClick={() => fileInputRef.current?.click()} aria-label="Upload profile photo"><Avatar className="h-20 w-20">{avatarUrl && <AvatarImage src={avatarUrl} alt="" />}<AvatarFallback className="text-2xl font-display font-bold">{displayName[0]?.toUpperCase() || "?"}</AvatarFallback></Avatar><span className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/55 opacity-0 transition group-hover:opacity-100"><Camera className="h-5 w-5 text-background" /></span></button><div><p className="text-sm font-medium">{accountType === "business" ? "Organization logo" : "Profile photo"}</p><p className="mt-1 text-xs text-muted-foreground">Optional · JPG, PNG or WebP under 2 MB</p></div><input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={uploadAvatar} /></div>

          <div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="onboarding-name">{accountType === "business" ? "Organization name" : "Name"}</Label><Input id="onboarding-name" className="mt-2" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={80} /></div><div><Label htmlFor="onboarding-handle">Verifiedly handle</Label><Input id="onboarding-handle" className="mt-2" value={username} onChange={(event) => setUsername(event.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase())} minLength={3} maxLength={30} />{username.length >= 3 && <p className={`mt-1 text-xs ${checking || available === null ? "text-muted-foreground" : available ? "text-emerald-600" : "text-destructive"}`}>{checking ? "Checking…" : available === null ? "Could not check yet" : available ? "Available" : "Handle taken"}</p>}</div></div>
          <div><Label htmlFor="onboarding-label">{accountType === "business" ? "Organization type" : "Professional label"}</Label><Input id="onboarding-label" className="mt-2" value={category} onChange={(event) => setCategory(event.target.value)} maxLength={80} placeholder={accountType === "business" ? "Sports club, publisher, nonprofit…" : "Student, footballer, founder…"} /><p className="mt-1 text-xs text-muted-foreground">Optional</p></div>
          <div><Label htmlFor="onboarding-location">City and country</Label><Input id="onboarding-location" className="mt-2" value={location} onChange={(event) => setLocation(event.target.value)} maxLength={100} placeholder="Atlanta, United States" /><p className="mt-1 text-xs text-muted-foreground">Optional and public when added</p></div>
          {accountType === "business" && <div><Label htmlFor="onboarding-website">Official website</Label><Input id="onboarding-website" className="mt-2" value={website} onChange={(event) => setWebsite(event.target.value)} placeholder="https://example.com" /><p className="mt-1 text-xs text-muted-foreground">Optional</p></div>}
          <Button className="w-full" onClick={() => void finish()} disabled={saving || uploading || checking || available !== true}>{saving ? "Publishing profile…" : "Publish free profile"}</Button>
        </div>
      </main>
    </div>
  );
};

export default OnboardingMembership;
