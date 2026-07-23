import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Card } from "@/components/ui/card";
import { Loader2, ShieldCheck, AlertTriangle } from "lucide-react";

// Reference implementation of the Sign-in-with-Verifiedly callback for partner
// apps (GSN, Globalis, etc). Exchanges ?code= for an access_token and verifies
// the returned profile + identity scopes. In production, do the token exchange
// SERVER-SIDE — client_secret must never ship in a VITE_* variable or the
// browser bundle. Also validate the OAuth `state` parameter before exchange.
const SUPABASE_FN_BASE = "https://pwahrywcgtgfaaghkpoo.supabase.co/functions/v1";

type Userinfo = {
  sub: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  verified?: boolean;
  id_verified?: boolean;
  verified_at?: string | null;
  verification_kind?: string;
  scopes?: string[];
};

const REQUIRED_SCOPES = ["profile", "identity"];

const AuthCallback = () => {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [user, setUser] = useState<Userinfo | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const returnedState = params.get("state");
        const oauthError = params.get("error");
        if (oauthError) throw new Error(oauthError);
        if (!code) throw new Error("Missing authorization code");

        // CSRF: verify state matches what we stored before the redirect.
        const expectedState = sessionStorage.getItem("verifiedly_oauth_state");
        if (!expectedState || !returnedState || expectedState !== returnedState) {
          throw new Error("Invalid OAuth state — possible CSRF");
        }
        sessionStorage.removeItem("verifiedly_oauth_state");

        // In production these come from env: import.meta.env.VITE_GSN_CLIENT_ID, etc.
        const clientId = (import.meta.env.VITE_GSN_CLIENT_ID as string) || "gsn_app";
        // NOTE: client_secret MUST NOT ship in a VITE_* variable. In real integrations,
        // POST to your own server which forwards to /oauth-token with the secret.
        const clientSecret = undefined as string | undefined;
        const redirectUri = `${window.location.origin}/auth/callback`;

        if (!clientSecret) {
          throw new Error(
            "Token exchange must happen server-side. Point this callback at your own server endpoint that holds the client_secret."
          );
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

        // Identity payload sanity check.
        if (typeof u.id_verified !== "boolean") throw new Error("Identity scope returned no id_verified");

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
            <p className="text-sm text-muted-foreground mt-1">Verifying profile and identity scopes.</p>
          </>
        )}
        {state === "ok" && user && (
          <>
            <ShieldCheck className="w-8 h-8 mx-auto mb-4" />
            <h1 className="font-display font-semibold text-lg">Welcome, {user.display_name || user.username}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {user.id_verified ? "Identity verified" : "Not identity verified"}
              {user.verified_at ? ` · ${new Date(user.verified_at).toLocaleDateString()}` : ""}
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
