import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShieldCheck, ArrowRight } from "lucide-react";
import VerifiedBadge from "@/components/VerifiedBadge";

const SCOPE_LABELS: Record<string, string> = {
  openid: "A stable user ID",
  profile: "Your username, display name, and avatar",
  identity: "Whether your identity check passed, and when",
  credentials: "Your public, independently verified credential claims",
  email: "Your email address",
};

interface OAuthClient {
  name: string;
  logo_url: string | null;
  homepage_url: string | null;
  redirect_uris: string[];
  scopes: string[];
  is_first_party: boolean;
}

const OAuthAuthorize = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [client, setClient] = useState<OAuthClient | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clientId = params.get("client_id") || "";
  const redirectUri = params.get("redirect_uri") || "";
  const responseType = params.get("response_type") || "";
  const scope = params.get("scope") || "openid profile";
  const state = params.get("state") || "";
  const codeChallenge = params.get("code_challenge") || "";
  const codeChallengeMethod = params.get("code_challenge_method") || "";

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const next = encodeURIComponent(window.location.pathname + window.location.search);
        navigate(`/login?next=${next}`, { replace: true });
        return;
      }
      if (!clientId || !redirectUri || responseType !== "code" || state.length < 16) {
        setError("A valid client_id, redirect_uri, response_type=code, and secure state value are required.");
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("oauth_clients")
        .select("name, logo_url, homepage_url, redirect_uris, scopes, is_first_party")
        .eq("client_id", clientId).eq("active", true).maybeSingle();
      if (error || !data) { setError("Unknown application"); setLoading(false); return; }
      if (!data.redirect_uris.includes(redirectUri)) { setError("This redirect URI isn't registered for this app."); setLoading(false); return; }
      const requestedScopes = scope.split(/\s+/).filter(Boolean);
      if (requestedScopes.some((requestedScope) => !data.scopes.includes(requestedScope))) {
        setError("This application requested a scope that is not approved.");
        setLoading(false);
        return;
      }
      if (codeChallenge && (codeChallengeMethod !== "S256" || !/^[A-Za-z0-9_-]{43,128}$/.test(codeChallenge))) {
        setError("This application sent an invalid PKCE challenge.");
        setLoading(false);
        return;
      }
      if (!codeChallenge && codeChallengeMethod) {
        setError("This application sent a PKCE method without a challenge.");
        setLoading(false);
        return;
      }
      setClient(data);
      setLoading(false);
    })();
  }, [clientId, codeChallenge, codeChallengeMethod, navigate, redirectUri, responseType, scope, state]);

  const allow = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("oauth-authorize", {
      body: {
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: responseType,
        scope,
        state,
        code_challenge: codeChallenge || undefined,
        code_challenge_method: codeChallenge ? codeChallengeMethod : undefined,
      },
    });
    if (error || !data?.redirect_to) {
      setError(error?.message || "Could not authorize");
      setBusy(false); return;
    }
    window.location.href = data.redirect_to;
  };

  const deny = () => {
    const sep = redirectUri.includes("?") ? "&" : "?";
    window.location.href = `${redirectUri}${sep}error=access_denied&state=${encodeURIComponent(state)}`;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  if (error || !client) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="p-6 max-w-md w-full text-center space-y-3">
        <p className="font-semibold">Authorization failed</p>
        <p className="text-sm text-muted-foreground">{error || "Unknown application"}</p>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>Back to dashboard</Button>
      </Card>
    </div>
  );

  const scopes = scope.split(/\s+/).filter(Boolean);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="p-6 sm:p-8 max-w-md w-full">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center overflow-hidden">
            {client.logo_url
              ? <img src={client.logo_url} alt={`${client.name} logo`} className="w-full h-full object-cover" />
              : <span className="text-lg font-display font-bold">{client.name[0]}</span>}
          </div>
        </div>

        <h1 className="text-2xl font-display font-bold text-center flex items-center justify-center gap-1.5">
          {client.name}
          {client.is_first_party && <VerifiedBadge className="w-5 h-5" />}
        </h1>
        <p className="text-sm text-muted-foreground text-center mt-1">
          wants to sign you in with Verifiedly
        </p>

        <div className="mt-6 space-y-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">This app will see</p>
          <ul className="space-y-1.5">
            {scopes.map(s => (
              <li key={s} className="text-sm flex items-start gap-2">
                <span className="text-foreground mt-0.5">✓</span>
                <span>{SCOPE_LABELS[s] || s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={deny} disabled={busy}>Deny</Button>
          <Button onClick={allow} disabled={busy}>{busy ? "Authorizing…" : "Allow"}</Button>
        </div>

        <p className="text-[10px] text-muted-foreground text-center mt-4">
          Approve only applications you recognize. Verifiedly shares only the fields listed above.
        </p>
      </Card>
    </div>
  );
};

export default OAuthAuthorize;
