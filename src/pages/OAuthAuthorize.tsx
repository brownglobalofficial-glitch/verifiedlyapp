import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import verifiedlyMark from "@/assets/verifiedly-mark.png.asset.json";

const SCOPE_LABELS: Record<string, string> = {
  openid: "A stable Verifiedly account ID",
  email: "Your email address and whether it is confirmed",
  profile: "Basic public profile information such as your name and profile image",
  phone: "Your phone number, only when specifically requested",
};

type AuthorizationDetails = {
  authorization_id: string;
  redirect_uri?: string;
  scope?: string;
  client?: {
    name?: string;
    logo_uri?: string | null;
    logo_url?: string | null;
    client_name?: string;
  };
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

    (async () => {
      if (!authorizationId) {
        setError("This authorization request is missing its secure authorization ID.");
        setLoading(false);
        return;
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (!active) return;

      if (userError || !userData.user) {
        const next = encodeURIComponent(window.location.pathname + window.location.search);
        navigate(`/login?next=${next}`, { replace: true });
        return;
      }

      const { data, error: detailsError } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;

      if (detailsError || !data) {
        setError(detailsError?.message || "This authorization request is invalid or expired.");
        setLoading(false);
        return;
      }

      if (!("authorization_id" in data)) {
        window.location.replace(data.redirect_url);
        return;
      }

      setDetails(data as AuthorizationDetails);
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [authorizationId, navigate]);

  const scopes = useMemo(
    () => (details?.scope || "openid email profile").split(/\s+/).filter(Boolean),
    [details?.scope],
  );

  const decide = async (decision: "approve" | "deny") => {
    if (!authorizationId) return;
    setBusy(decision);
    setError(null);

    const result = decision === "approve"
      ? await supabase.auth.oauth.approveAuthorization(authorizationId)
      : await supabase.auth.oauth.denyAuthorization(authorizationId);

    if (result.error || !result.data?.redirect_url) {
      setError(result.error?.message || "Verifiedly could not complete this authorization request.");
      setBusy(null);
      return;
    }

    window.location.assign(result.data.redirect_url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading secure authorization…
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md space-y-4 p-6 text-center">
          <ShieldCheck className="mx-auto h-8 w-8" />
          <p className="font-semibold">Authorization could not continue</p>
          <p className="text-sm leading-6 text-muted-foreground">{error || "Unknown application"}</p>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>Back to Verifiedly</Button>
        </Card>
      </div>
    );
  }

  const clientName = details.client?.name || details.client?.client_name || "This application";
  const clientLogo = details.client?.logo_uri || details.client?.logo_url || null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
            <img src={verifiedlyMark.url} alt="Verifiedly" className="h-7 w-7 object-contain" />
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-secondary">
            {clientLogo ? (
              <img src={clientLogo} alt={`${clientName} logo`} className="h-full w-full object-cover" />
            ) : (
              <span className="text-lg font-display font-bold">{clientName.slice(0, 1)}</span>
            )}
          </div>
        </div>

        <h1 className="text-center text-2xl font-display font-bold">Continue to {clientName}</h1>
        <p className="mt-2 text-center text-sm leading-6 text-muted-foreground">
          {clientName} wants to use your Verifiedly account to sign you in.
        </p>

        <div className="mt-6 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">This app will receive</p>
          <ul className="space-y-2">
            {scopes.map((scope) => (
              <li key={scope} className="flex items-start gap-2 text-sm leading-5">
                <span aria-hidden="true">✓</span>
                <span>{SCOPE_LABELS[scope] || scope}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 rounded-lg border border-border bg-secondary/50 p-4 text-xs leading-5 text-muted-foreground">
          Verifiedly does not share private documents, uploaded evidence, payment information, or identity-verification files through sign-in. Only the approved standard account fields above are shared.
        </div>

        {error ? <p className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => void decide("deny")} disabled={busy !== null}>
            {busy === "deny" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Deny
          </Button>
          <Button onClick={() => void decide("approve")} disabled={busy !== null}>
            {busy === "approve" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Allow
          </Button>
        </div>

        <p className="mt-4 text-center text-[10px] leading-4 text-muted-foreground">
          Approve only applications you recognize. You can deny this request without changing your Verifiedly account.
        </p>
      </Card>
    </div>
  );
};

export default OAuthAuthorize;
