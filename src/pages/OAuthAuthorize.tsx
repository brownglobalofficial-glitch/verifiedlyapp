import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShieldCheck, ArrowRight } from "lucide-react";
import VerifiedBadge from "@/components/VerifiedBadge";

const SCOPE_LABELS: Record<string, string> = {
  profile: "Your username, display name and avatar",
  trust:   "Your Trust Score and verified socials",
  email:   "Your email address",
};

const OAuthAuthorize = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [client, setClient] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const client_id = params.get("client_id") || "";
  const redirect_uri = params.get("redirect_uri") || "";
  const scope = params.get("scope") || "profile";
  const state = params.get("state") || "";

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const next = encodeURIComponent(window.location.pathname + window.location.search);
        navigate(`/login?next=${next}`, { replace: true });
        return;
      }
      if (!client_id || !redirect_uri) { setError("Missing client_id or redirect_uri"); setLoading(false); return; }
      const { data, error } = await supabase
        .from("oauth_clients" as any)
        .select("name, logo_url, homepage_url, redirect_uris, scopes, is_first_party")
        .eq("client_id", client_id).eq("active", true).maybeSingle();
      if (error || !data) { setError("Unknown application"); setLoading(false); return; }
      const allowed = (data as any).redirect_uris || [];
      if (!allowed.includes(redirect_uri)) { setError("This redirect URI isn't registered for this app."); setLoading(false); return; }
      setClient(data);
      setLoading(false);
    })();
  }, [client_id, redirect_uri, navigate]);

  const allow = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("oauth-authorize", {
      body: { client_id, redirect_uri, scope, state },
    });
    if (error || !data?.redirect_to) {
      setError(error?.message || "Could not authorize");
      setBusy(false); return;
    }
    window.location.href = data.redirect_to;
  };

  const deny = () => {
    const sep = redirect_uri.includes("?") ? "&" : "?";
    window.location.href = `${redirect_uri}${sep}error=access_denied${state ? `&state=${encodeURIComponent(state)}` : ""}`;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  if (error)   return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="p-6 max-w-md w-full text-center space-y-3">
        <p className="font-semibold">Authorization failed</p>
        <p className="text-sm text-muted-foreground">{error}</p>
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
          You can revoke access anytime from your Verifiedly settings.
        </p>
      </Card>
    </div>
  );
};

export default OAuthAuthorize;