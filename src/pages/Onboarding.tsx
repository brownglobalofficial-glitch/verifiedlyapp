import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Building2, Camera, Check, ShieldCheck, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LEGAL_TERMS_VERSION, VAULT_POLICY_VERSION } from "@/lib/legal";
import logo from "@/assets/verifiedly-logo.webp";

const LEGAL_ACCEPTANCE_STORAGE_KEY = "verifiedly:pending-legal-acceptance";
const AUTH_NEXT_STORAGE_KEY = "verifiedly:auth-next";

type AccountType = "creator" | "business";

type PendingLegalAcceptance = {
  acceptedAt: string;
  termsVersion: string;
  vaultPolicyVersion: string;
};

const safeInternalPath = (value: string | null) =>
  value && value.startsWith("/") && !value.startsWith("//") ? value : null;

const handleFromName = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 30);

const errorMessage = (error: unknown) => error instanceof Error ? error.message : "Please try again.";

const readPendingLegalAcceptance = (): PendingLegalAcceptance | null => {
  try {
    const raw = window.localStorage.getItem(LEGAL_ACCEPTANCE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingLegalAcceptance>;
    if (
      typeof parsed.acceptedAt !== "string" ||
      typeof parsed.termsVersion !== "string" ||
      typeof parsed.vaultPolicyVersion !== "string"
    ) return null;
    return parsed as PendingLegalAcceptance;
  } catch {
    return null;
  }
};

const syncLegalAcceptance = async (userId: string, metadata: Record<string, unknown>) => {
  const metadataAcceptedAt = typeof metadata.legal_terms_accepted_at === "string"
    ? metadata.legal_terms_accepted_at
    : null;
  const pending = readPendingLegalAcceptance();
  const pendingIsCurrent = pending?.termsVersion === LEGAL_TERMS_VERSION
    && pending.vaultPolicyVersion === VAULT_POLICY_VERSION;
  const acceptedAt = metadataAcceptedAt || (pendingIsCurrent ? pending?.acceptedAt : null);

  if (!acceptedAt) return;

  if (!metadataAcceptedAt && pendingIsCurrent) {
    const { error } = await supabase.auth.updateUser({
      data: {
        legal_terms_accepted_at: acceptedAt,
        legal_terms_version: LEGAL_TERMS_VERSION,
        vault_policy_certified: true,
        vault_policy_version: VAULT_POLICY_VERSION,
      },
    });
    if (error) console.warn("Legal acceptance metadata was not synchronized", error);
  }

  const { data: existingAcceptance, error: lookupError } = await supabase
    .from("legal_acceptances")
    .select("user_id")
    .eq("user_id", userId)
    .eq("terms_version", LEGAL_TERMS_VERSION)
    .eq("vault_policy_version", VAULT_POLICY_VERSION)
    .limit(1)
    .maybeSingle();

  if (lookupError) {
    console.warn("Legal acceptance lookup failed", lookupError);
    return;
  }

  if (!existingAcceptance) {
    const { error: insertError } = await supabase.from("legal_acceptances").insert({
      user_id: userId,
      terms_version: LEGAL_TERMS_VERSION,
      vault_policy_version: VAULT_POLICY_VERSION,
      source: metadataAcceptedAt ? "signup" : "oauth_signup",
    });
    if (insertError && insertError.code !== "23505") {
      console.warn("Legal acceptance record was not synchronized", insertError);
      return;
    }
  }

  if (pendingIsCurrent) window.localStorage.removeItem(LEGAL_ACCEPTANCE_STORAGE_KEY);
};

const Onboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = safeInternalPath(searchParams.get("returnTo"))
    || safeInternalPath(window.sessionStorage.getItem(AUTH_NEXT_STORAGE_KEY));
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userId, setUserId] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>("creator");
  const [username, setUsername] = useState("");
  const [handleEdited, setHandleEdited] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [category, setCategory] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const next = encodeURIComponent(window.location.pathname + window.location.search);
        navigate(`/login?next=${next}`, { replace: true });
        return;
      }

      const metadata = (session.user.user_metadata || {}) as Record<string, unknown>;
      const metadataName = (
        (typeof metadata.display_name === "string" && metadata.display_name) ||
        (typeof metadata.full_name === "string" && metadata.full_name) ||
        (typeof metadata.name === "string" && metadata.name) ||
        ""
      );
      const metadataAvatar = (
        (typeof metadata.avatar_url === "string" && metadata.avatar_url) ||
        (typeof metadata.picture === "string" && metadata.picture) ||
        ""
      );

      setUserId(session.user.id);
      setDisplayName(metadataName);
      setAvatarUrl(metadataAvatar);
      if (metadata.account_type === "business") setAccountType("business");

      const { data, error } = await supabase
        .from("profiles")
        .select("username, display_name, category, account_type, avatar_url, onboarding_completed")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) {
        toast({ title: "Profile details could not be loaded", description: error.message, variant: "destructive" });
        return;
      }

      if (data?.onboarding_completed) {
        navigate(returnTo || "/dashboard", { replace: true });
        return;
      }

      const autoGenerated = /^[a-f0-9]{32}$/.test(data?.username || "");
      if (data?.username && !autoGenerated) {
        setUsername(data.username);
        setHandleEdited(true);
      } else if (metadataName) {
        setUsername(handleFromName(metadataName));
      }
      if (data?.display_name) setDisplayName(data.display_name);
      if (data?.category) setCategory(data.category);
      if (data?.account_type === "business") setAccountType("business");
      if (data?.avatar_url) setAvatarUrl(data.avatar_url);
    };

    void load();
  }, [navigate, returnTo, toast]);

  useEffect(() => {
    if (!userId || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    const timer = window.setTimeout(async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username.toLowerCase())
        .neq("id", userId)
        .maybeSingle();
      setUsernameAvailable(error ? null : !data);
      setCheckingUsername(false);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [username, userId]);

  const changeDisplayName = (value: string) => {
    setDisplayName(value);
    if (!handleEdited) setUsername(handleFromName(value));
  };

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
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
    if (!userId || !displayName.trim() || username.length < 3 || usernameAvailable !== true) {
      toast({ title: "Add your name and an available handle", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const cleanName = displayName.trim();
      const cleanUsername = username.toLowerCase();
      const cleanCategory = category.trim() || null;

      const { error: profileError } = await supabase.from("profiles").upsert({
        id: userId,
        username: cleanUsername,
        display_name: cleanName,
        category: cleanCategory,
        account_type: accountType,
        avatar_url: avatarUrl || null,
        onboarding_completed: true,
      }, { onConflict: "id" });
      if (profileError) throw profileError;

      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          username: cleanUsername,
          preferred_username: cleanUsername,
          display_name: cleanName,
          full_name: cleanName,
          name: cleanName,
          avatar_url: avatarUrl || null,
          picture: avatarUrl || null,
          account_type: accountType,
        },
      });
      if (metadataError) throw metadataError;

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await syncLegalAcceptance(session.user.id, (session.user.user_metadata || {}) as Record<string, unknown>);
      }

      window.sessionStorage.removeItem(AUTH_NEXT_STORAGE_KEY);
      toast({ title: "Your official profile is ready" });
      navigate(returnTo || "/dashboard", { replace: true });
    } catch (error: unknown) {
      toast({ title: "Profile not created", description: errorMessage(error), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const canCreate = displayName.trim().length > 0
    && username.length >= 3
    && usernameAvailable === true
    && !checkingUsername
    && !saving;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b border-border h-16 flex items-center px-4">
        <div className="container mx-auto max-w-xl">
          <img src={logo} alt="Verifiedly" className="h-7" />
        </div>
      </nav>

      <main className="container mx-auto max-w-xl flex-1 px-4 py-8 sm:py-12">
        <div className="mb-7 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">About one minute</p>
          <h1 className="mt-2 text-3xl font-display font-bold">Create your official profile</h1>
          <p className="mt-2 text-sm text-muted-foreground">Start with the essentials. Work, education, credentials, links, and verification can be added later.</p>
        </div>

        <Card className="rounded-3xl p-5 sm:p-7">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setAccountType("creator")} className={`rounded-2xl border p-4 text-left transition ${accountType === "creator" ? "border-foreground bg-muted/60" : "border-border hover:border-muted-foreground"}`}>
                <UserRound className="mb-3 h-5 w-5" />
                <p className="font-semibold">Person</p>
                <p className="mt-1 text-xs text-muted-foreground">Your individual profile.</p>
              </button>
              <button type="button" onClick={() => setAccountType("business")} className={`rounded-2xl border p-4 text-left transition ${accountType === "business" ? "border-foreground bg-muted/60" : "border-border hover:border-muted-foreground"}`}>
                <Building2 className="mb-3 h-5 w-5" />
                <p className="font-semibold">Organization</p>
                <p className="mt-1 text-xs text-muted-foreground">A business, club, team, or group.</p>
              </button>
            </div>

            <div className="flex items-center gap-4">
              <button type="button" className="group relative rounded-full" onClick={() => fileInputRef.current?.click()} aria-label="Upload profile photo">
                <Avatar className="h-20 w-20">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
                  <AvatarFallback className="text-2xl font-display font-bold">{displayName[0]?.toUpperCase() || "?"}</AvatarFallback>
                </Avatar>
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/55 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                  <Camera className="h-5 w-5 text-background" />
                </span>
              </button>
              <div>
                <p className="text-sm font-medium">{accountType === "business" ? "Logo" : "Profile photo"}</p>
                <p className="text-xs text-muted-foreground">{uploading ? "Uploading…" : "Optional · add or change later"}</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>

            <div>
              <Label htmlFor="display-name">{accountType === "business" ? "Organization name" : "Your name"} *</Label>
              <Input id="display-name" value={displayName} onChange={(event) => changeDisplayName(event.target.value)} className="mt-1.5" maxLength={80} autoFocus />
            </div>

            <div>
              <Label htmlFor="username">Handle *</Label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">verifiedly.app/</span>
                <Input
                  id="username"
                  value={username}
                  onChange={(event) => {
                    setHandleEdited(true);
                    setUsername(event.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase());
                  }}
                  className="pl-[110px]"
                  placeholder="yourname"
                  minLength={3}
                  maxLength={30}
                />
              </div>
              {username.length >= 3 && (
                <p className={`mt-1 text-xs ${checkingUsername || usernameAvailable === null ? "text-muted-foreground" : usernameAvailable ? "text-emerald-600" : "text-destructive"}`}>
                  {checkingUsername ? "Checking…" : usernameAvailable === null ? "Could not check this handle yet" : usernameAvailable ? "Available" : "That handle is taken"}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="category">{accountType === "business" ? "Organization type" : "Professional label"}</Label>
              <Input id="category" value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1.5" placeholder={accountType === "business" ? "Football club, business, nonprofit…" : "Footballer, student, founder…"} maxLength={60} />
            </div>

            <div className="flex gap-3 rounded-2xl border border-dashed border-border p-4 text-xs leading-relaxed text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
              <p>Your profile starts unverified. Eligible adults can complete optional identity verification later. Other apps receive only the account details you approve.</p>
            </div>

            <Button type="button" onClick={() => void finish()} disabled={!canCreate} className="w-full gap-2 rounded-full">
              {saving ? "Creating profile…" : "Create official profile"} <Check className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Onboarding;
