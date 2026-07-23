import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import logoMark from "@/assets/verifiedly-mark.png";

const SCOPE_LABELS: Record<string, string> = {
  openid: "Your stable Verifiedly account ID",
  profile: "Your name, handle, and profile photo",
  email: "Your email address",
  phone: "Your phone number, when one is attached to your account",
};

type OAuthClientDetails = {
  name?: string;
  logo_uri?: string | null;
  logo_url?: string | null;
  uri?: string | null;
};

type AuthorizationDetails = {
  authorization_id?: string;
  redirect_url?: string;
  redirect_uri?: string;
  scope?: string;
  client?: OAuthClientDetails;
};

type OAuthMethodResult = {
  data: AuthorizationDetails | null;
  error: { message?: string } | null;
};

type NativeOAuthApi = {
  getAuthorizationDetails: (authorizationId: string) => Promise<OAuthMethodResult>;
  approveAuthorization: (authorizationId: string) => Promise<OAuthMethodResult>;
  denyAuthorization: (authorizationId: string) => Promise<OAuthMethodResult>;
};

const getOAuthApi = () => {
  const oauth = (supabase.auth as unknown as { oauth?: NativeOAuthApi }).oauth;
  if (!oauth) throw new Error("Verifiedly sign-in is not enabled yet.");
  return oauth;
};

const OAuthAuthorize = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") || "";
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"approve" | "deny" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!authorizationId) {
        if (active) {
          setError("This sign-in request is missing its authorization ID.");
          setLoading(false);
        }
        return;
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        const next = encodeURIComponent(window.location.pathname + window.location.search);
        navigate(`/login?next=${next}`, { replace: true });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile?.onboarding_completed) {
        const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
        navigate(`/onboarding?returnTo=${returnTo}`, { replace: true });
        return;
      }

      try {
        const result = await getOAuthApi().getAuthorizationDetails(authorizationId);
        if (!active) return;
        if (result.error || !result.data) {
          setError(result.error?.message || "This authorization request is invalid or expired.");
          setLoading(false);
          return;
        }

        if (!result.data.authorization_id && result.data.redirect_url) {
          window.location.assign(result.data.redirect_url);
          return;
        }

        setDetails(result.data);
        setLoading(false);
      } catch (caught: unknown) {
        if (!active) return;
        setError(caught instanceof Error ? caught.message : "Verifiedly sign-in is not available.");
        setLoading(false);
      }
    };

    void load();
    return () => { active = false; };
  }, [authorizationId, navigate]);

  const decide = async (decision: "approve" | "deny") => {
    setBusy(decision);
    setError(null);
    try {
      const api = getOAuthApi();
      const result = decision === "approve"
        ? await api.approveAuthorization(authorizationId)
        : await api.denyAuthorization(authorizationId);

      if (result.error || !result.data?.redirect_url) {
        throw new Error(result.error?.message || "The authorization request could not be completed.");
      }
      window.location.assign(result.data.redirect_url);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "The authorization request could not be completed.");
      setBusy(null);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Preparing secure sign-in…</div>;
  }

  if (error && !details) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md space-y-4 rounded-3xl p-7 text-center">
          <img src={logoMark} alt="Verifiedly" className="mx-auto h-10 w-10" />
          <h1 className="font-display text-xl font-bold">Sign-in request unavailable</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>Back to Verifiedly</Button>
        </Card>
      </div>
    );
  }

  const clientName = details?.client?.name || "This application";
  const clientLogo = details?.client?.logo_uri || details?.client?.logo_url || null;
  const scopes = (details?.scope || "openid profile").split(/\s+/).filter(Boolean);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md rounded-3xl p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-secondary">
            <img src={logoMark} alt="Verifiedly" className="h-7 w-7" />
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-secondary">
            {clientLogo
              ? <img src={clientLogo} alt={`${clientName} logo`} className="h-full w-full object-cover" />
              : <span className="font-display text-lg font-bold">{clientName[0]?.toUpperCase() || "A"}</span>}
          </div>
        </div>

        <h1 className="text-center font-display text-2xl font-bold">Continue to {clientName}</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">Use your Verifiedly account to sign in. You control what is shared.</p>

        <div className="mt-6 rounded-2xl border border-border p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">This app will receive</p>
          <ul className="mt-3 space-y-2.5">
            {scopes.map((scope) => (
              <li key={scope} className="flex items-start gap-2 text-sm">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{SCOPE_LABELS[scope] || scope}</span>
              </li>
            ))}
          </ul>
        </div>

        {error && <p className="mt-4 rounded-xl bg-destructive/10 px-3 py-2 text-center text-xs text-destructive">{error}</p>}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button type="button" variant="outline" onClick={() => void decide("deny")} disabled={busy !== null}>
            {busy === "deny" ? "Declining…" : "Not now"}
          </Button>
          <Button type="button" onClick={() => void decide("approve")} disabled={busy !== null}>
            {busy === "approve" ? "Continuing…" : "Continue"}
          </Button>
        </div>

        <p className="mt-4 text-center text-[10px] leading-relaxed text-muted-foreground">Verifiedly does not share private documents, payment details, messages, or identity-document images through sign-in.</p>
      </Card>
    </div>
  );
};

export default OAuthAuthorize;
