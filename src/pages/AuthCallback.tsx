import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Card } from "@/components/ui/card";
import { Loader2, ShieldCheck, AlertTriangle } from "lucide-react";

// Reference implementation of the Sign-in-with-Verifiedly callback for partner
// apps (GSN, Globalis, etc). Exchanges ?code= for an access_token and verifies
// the returned profile + trust scopes. Drop this page into your app at
// /auth/callback and configure GSN_CLIENT_ID / GSN_CLIENT_SECRET as env vars.
const SUPABASE_FN_BASE = "https://pwahrywcgtgfaaghkpoo.supabase.co/functions/v1";

type Userinfo = {
  sub: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  trust_score?: number;
  tier?: string;
  verified?: boolean;
  scopes?: string[];
};

const REQUIRED_SCOPES = ["profile", "trust"];

const AuthCallback = () => {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [user, setUser] = useState<Userinfo | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const oauthError = params.get("error");
        if (oauthError) throw new Error(oauthError);
        if (!code) throw new Error("Missing authorization code");

        // In production these come from env: import.meta.env.VITE_GSN_CLIENT_ID, etc.
        const clientId = (import.meta.env.VITE_GSN_CLIENT_ID as string) || "gsn_app";
        const clientSecret = import.meta.env.VITE_GSN_CLIENT_SECRET as string | undefined;
        const redirectUri = `${window.location.origin}/auth/callback`;

        if (!clientSecret) {
          // NOTE: client_secret should be exchanged server-side. This client-side
          // demo flow is only for local development / preview.
          throw new Error("VITE_GSN_CLIENT_SECRET is not set. Configure env vars before testing.");
        }

        const tokenRes = await fetch(`${SUPABASE_FN_BASE}/oauth-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grant_type: "authorization_code",
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
          }),
        });
        const tokenJson = await tokenRes.json();
        if (!tokenRes.ok) throw new Error(tokenJson.error || "Token exchange failed");

        const userRes = await fetch(`${SUPABASE_FN_BASE}/oauth-userinfo`, {
          headers: { Authorization: `Bearer ${tokenJson.access_token}` },
        });
        const u: Userinfo = await userRes.json();
        if (!userRes.ok) throw new Error("Userinfo failed");

        // Verify granted scopes include the ones we require.
        const granted = u.scopes || (tokenJson.scope || "").split(" ").filter(Boolean);
        const missing = REQUIRED_SCOPES.filter((s) => !granted.includes(s));
        if (missing.length) throw new Error(`Missing required scopes: ${missing.join(", ")}`);

        // Verify the trust payload is actually present.
        if (typeof u.trust_score !== "number") throw new Error("Trust scope returned no trust_score");

        setUser(u);
        setState("ok");
      } catch (e: any) {
        setError(e?.message || "Authentication failed");
        setState("error");
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Helmet>
        <title>Signing you in… — Verifiedly</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Card className="p-8 w-full max-w-md text-center">
        {state === "loading" && (
          <>
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <h1 className="font-display font-semibold text-lg">Signing you in…</h1>
            <p className="text-sm text-muted-foreground mt-1">Verifying profile and trust scopes.</p>
          </>
        )}
        {state === "ok" && user && (
          <>
            <ShieldCheck className="w-8 h-8 mx-auto mb-4" />
            <h1 className="font-display font-semibold text-lg">Welcome, {user.display_name || user.username}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Trust score <span className="font-semibold text-foreground">{user.trust_score}</span> · {user.verified ? "Verified" : "Unverified"}
            </p>
            <pre className="text-[10px] text-left bg-muted p-3 rounded mt-4 overflow-x-auto">{JSON.stringify(user, null, 2)}</pre>
          </>
        )}
        {state === "error" && (
          <>
            <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-destructive" />
            <h1 className="font-display font-semibold text-lg">Sign-in failed</h1>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </>
        )}
      </Card>
    </div>
  );
};

export default AuthCallback;
