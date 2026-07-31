import { ArrowLeft, Copy, ShieldCheck } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

import logo from "@/assets/verifiedly-logo.webp";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const ISSUER = "https://pwahrywcgtgfaaghkpoo.supabase.co/auth/v1";
const STANDARD_SCOPES = "openid email profile";

const ENDPOINTS_SNIPPET = `issuer                 = ${ISSUER}
authorization_endpoint = ${ISSUER}/oauth/authorize
token_endpoint         = ${ISSUER}/oauth/token
userinfo_endpoint      = ${ISSUER}/oauth/userinfo
jwks_uri               = ${ISSUER}/.well-known/jwks.json
oidc_discovery         = ${ISSUER}/.well-known/openid-configuration
scopes                  = ${STANDARD_SCOPES}
flow                    = authorization_code + PKCE`;

const SUPABASE_SNIPPET = `const safeReturnPath = requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
  ? requestedPath
  : "/";

const { error } = await supabase.auth.signInWithOAuth({
  provider: "custom:verifiedly" as never,
  options: {
    redirectTo: \`${"${window.location.origin}${safeReturnPath}"}\`,
    scopes: "${STANDARD_SCOPES}",
  },
});

if (error) throw error;`;

const PROVIDER_SNIPPET = `Identifier: custom:verifiedly
Name: Verifiedly
Issuer: ${ISSUER}
Scopes: ${STANDARD_SCOPES}
PKCE: enabled
Email optional: disabled
Client ID: product-specific value
Client secret: product-specific value stored only in Supabase Auth`;

const FN_BASE = "https://pwahrywcgtgfaaghkpoo.supabase.co/functions/v1";

const AUTH_URL_SNIPPET = `// 1. Build the authorization request (Authorization Code + PKCE, S256)
const base64Url = (bytes) =>
  btoa(String.fromCharCode(...bytes)).replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/, "");

const verifier = base64Url(crypto.getRandomValues(new Uint8Array(64)));
const state = base64Url(crypto.getRandomValues(new Uint8Array(24)));
const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
const challenge = base64Url(new Uint8Array(digest));

sessionStorage.setItem("vfy_verifier", verifier);
sessionStorage.setItem("vfy_state", state);

const authorizeUrl = new URL("${ISSUER}/oauth/authorize");
authorizeUrl.searchParams.set("client_id", CLIENT_ID);
authorizeUrl.searchParams.set("redirect_uri", REDIRECT_URI);
authorizeUrl.searchParams.set("response_type", "code");
authorizeUrl.searchParams.set("scope", "openid email profile");
authorizeUrl.searchParams.set("state", state);
authorizeUrl.searchParams.set("code_challenge", challenge);
authorizeUrl.searchParams.set("code_challenge_method", "S256");

window.location.assign(authorizeUrl.toString());`;

const TOKEN_SNIPPET = `// 2. Exchange the code for tokens (server-side for confidential clients)
const params = new URL(request.url).searchParams;
if (params.get("state") !== storedState) throw new Error("State mismatch");

const tokenResponse = await fetch("${ISSUER}/oauth/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "authorization_code",
    code: params.get("code"),
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET, // omit for public PKCE clients
    code_verifier: storedVerifier,
    redirect_uri: REDIRECT_URI,
  }),
});

const tokens = await tokenResponse.json();
if (!tokenResponse.ok) throw new Error(tokens.error_description || tokens.error);`;

const VALIDATE_SNIPPET = `// 3. Validate the response before trusting it
const REQUIRED_SCOPES = ["openid", "profile"];
const granted = (tokens.scope || "").split(" ").filter(Boolean);
const missing = REQUIRED_SCOPES.filter((scope) => !granted.includes(scope));
if (missing.length) throw new Error("Missing scopes: " + missing.join(", "));

const userinfo = await fetch("${ISSUER}/oauth/userinfo", {
  headers: { Authorization: "Bearer " + tokens.access_token },
}).then((response) => response.json());

// Identity claims only arrive when the "identity" scope was granted.
if (granted.includes("identity") && typeof userinfo.id_verified !== "boolean") {
  throw new Error("Identity scope returned no id_verified claim");
}

// userinfo.sub is the stable Verifiedly account ID. Key your local user on it.
const localUser = await upsertUser({
  verifiedly_sub: userinfo.sub,
  email: userinfo.email,
  id_verified: userinfo.id_verified === true,
});`;

const WEBHOOK_SUBSCRIBE_SNIPPET = `# Subscribe to identity events (server-to-server, never from a browser)
curl -X POST ${FN_BASE}/oauth-webhooks \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "subscribe",
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "url": "https://your-app.com/api/verifiedly/webhook",
    "events": ["identity.verified", "identity.updated"]
  }'

# Response (signing_secret is shown once):
# { "id": "...", "url": "...", "events": [...], "signing_secret": "whsec_..." }
#
# Other actions: { "action": "list" } and { "action": "unsubscribe", "endpoint_id": "..." }`;

const WEBHOOK_VERIFY_SNIPPET = `// Verify the signature on every delivery
// Header: x-verifiedly-signature: t=<unix-seconds>,v1=<hex hmac-sha256>
import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyVerifiedlyWebhook(rawBody, header, signingSecret) {
  const parts = Object.fromEntries(header.split(",").map((part) => part.split("=")));
  const age = Math.abs(Date.now() / 1000 - Number(parts.t));
  if (!parts.t || !parts.v1 || age > 300) return false;

  const expected = createHmac("sha256", signingSecret)
    .update(parts.t + "." + rawBody)
    .digest("hex");

  return timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
}

// Event payload
// {
//   "id": "evt uuid",
//   "type": "identity.verified",
//   "created_at": "2026-07-31T00:00:00.000Z",
//   "data": {
//     "sub": "verifiedly account id",
//     "username": "jane",
//     "id_verified": true,
//     "verification_status": "verified",
//     "verification_kind": "individual",
//     "verified_at": "2026-07-31T00:00:00.000Z",
//     "verified_country": "US"
//   }
// }`;

const Developers = () => {
  const { toast } = useToast();
  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    toast({ title: "Copied" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Sign in with Verifiedly — OAuth 2.1 and OpenID Connect</title>
        <meta
          name="description"
          content="Use Verifiedly as an OAuth 2.1 and OpenID Connect identity provider with Authorization Code, PKCE, standard scopes, discovery and JWKS."
        />
        <link rel="canonical" href="https://verifiedly.app/developers" />
        <meta property="og:title" content="Sign in with Verifiedly — Developer Docs" />
        <meta property="og:url" content="https://verifiedly.app/developers" />
      </Helmet>

      <header className="sticky top-0 z-40 flex h-14 items-center border-b border-border bg-background/80 px-4 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2"><img src={logo} alt="Verifiedly" className="h-6" /></Link>
          <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3 w-3" /> Home</Link>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-10">
        <span className="mb-4 inline-block rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">Developers · First-party beta</span>
        <h1 className="text-4xl font-display font-bold tracking-tight md:text-5xl">Continue with Verifiedly</h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          Verifiedly uses its Supabase Auth project as a native OAuth 2.1 and OpenID Connect identity provider. Each connected website keeps its own users, roles, permissions and Row Level Security policies.
        </p>

        <Card className="mt-8 border-accent/30 bg-secondary/40 p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <h2 className="font-display font-semibold">Strict privacy boundary</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                First-party apps request only <code className="rounded bg-muted px-1 py-0.5 text-xs">{STANDARD_SCOPES}</code>. Sign-in does not share private documents, evidence, Stripe data, identity files, subscription status, trust scores, GSN rankings or local staff permissions.
              </p>
            </div>
          </div>
        </Card>

        <Card className="mt-6 p-6">
          <h2 className="font-display font-semibold">1. Register one client per Auth project</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            BrownGlobal registers approved clients in Verifiedly’s OAuth Apps settings. Use a separate confidential client for every independent consumer Supabase Auth project and register the exact callback URI shown by that project.
          </p>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            Client secrets are shown once. Keep each secret only in the matching consumer Supabase custom-provider configuration—never in GitHub, browser code or a <code>VITE_*</code> variable.
          </p>
        </Card>

        <Card className="mt-6 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display font-semibold">2. Use OIDC discovery</h2>
            <Button size="sm" variant="ghost" onClick={() => void copy(ENDPOINTS_SNIPPET)} aria-label="Copy endpoints"><Copy className="h-3.5 w-3.5" /></Button>
          </div>
          <pre className="mt-4 overflow-x-auto rounded-md bg-muted p-4 text-xs"><code>{ENDPOINTS_SNIPPET}</code></pre>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            OpenID Connect ID tokens require Verifiedly’s Supabase project to use an asymmetric JWT signing key such as RS256 or ES256.
          </p>
        </Card>

        <Card className="mt-6 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display font-semibold">3. Configure the consumer provider</h2>
            <Button size="sm" variant="ghost" onClick={() => void copy(PROVIDER_SNIPPET)} aria-label="Copy provider settings"><Copy className="h-3.5 w-3.5" /></Button>
          </div>
          <pre className="mt-4 overflow-x-auto rounded-md bg-muted p-4 text-xs"><code>{PROVIDER_SNIPPET}</code></pre>
        </Card>

        <Card className="mt-6 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display font-semibold">4. Add the sign-in button</h2>
            <Button size="sm" variant="ghost" onClick={() => void copy(SUPABASE_SNIPPET)} aria-label="Copy sign-in code"><Copy className="h-3.5 w-3.5" /></Button>
          </div>
          <pre className="mt-4 overflow-x-auto rounded-md bg-muted p-4 text-xs"><code>{SUPABASE_SNIPPET}</code></pre>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            Supabase manages state, PKCE, code exchange, nonce validation, token validation and the local consumer session. Keep the button hidden behind <code>VITE_VERIFIEDLY_OAUTH_ENABLED</code> until the provider is completely configured.
          </p>
        </Card>

        <Card className="mt-6 p-6">
          <h2 className="font-display font-semibold">5. Protect local permissions</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Verifiedly authenticates the account holder; it does not authorize them as an admin, organizer, operator, scanner, club official or staff member. Every privileged route must still check the consumer website’s own role table or allowlist.
          </p>
        </Card>

        <Card className="mt-6 p-6">
          <h2 className="font-display font-semibold">6. Test approval and denial</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Confirm the consent screen names the correct product, shows only the three standard scopes, returns only to an approved path, creates a session in the correct Supabase project and grants no local privileged role. Denying must create no consumer session.
          </p>
        </Card>


        <Card className="mt-6 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display font-semibold">7. Create the authorization URL (PKCE)</h2>
            <Button size="sm" variant="ghost" onClick={() => void copy(AUTH_URL_SNIPPET)} aria-label="Copy authorization URL example"><Copy className="h-3.5 w-3.5" /></Button>
          </div>
          <pre className="mt-4 overflow-x-auto rounded-md bg-muted p-4 text-xs"><code>{AUTH_URL_SNIPPET}</code></pre>
        </Card>

        <Card className="mt-6 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display font-semibold">8. Exchange the code for tokens</h2>
            <Button size="sm" variant="ghost" onClick={() => void copy(TOKEN_SNIPPET)} aria-label="Copy token exchange example"><Copy className="h-3.5 w-3.5" /></Button>
          </div>
          <pre className="mt-4 overflow-x-auto rounded-md bg-muted p-4 text-xs"><code>{TOKEN_SNIPPET}</code></pre>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            Confidential clients must exchange the code from a server. Never place a client secret in browser code or a <code>VITE_*</code> variable.
          </p>
        </Card>

        <Card className="mt-6 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display font-semibold">9. Validate the response</h2>
            <Button size="sm" variant="ghost" onClick={() => void copy(VALIDATE_SNIPPET)} aria-label="Copy validation example"><Copy className="h-3.5 w-3.5" /></Button>
          </div>
          <pre className="mt-4 overflow-x-auto rounded-md bg-muted p-4 text-xs"><code>{VALIDATE_SNIPPET}</code></pre>
        </Card>

        <Card className="mt-6 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display font-semibold">10. Subscribe to identity webhooks</h2>
            <Button size="sm" variant="ghost" onClick={() => void copy(WEBHOOK_SUBSCRIBE_SNIPPET)} aria-label="Copy webhook subscription example"><Copy className="h-3.5 w-3.5" /></Button>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Stop polling. Register an HTTPS endpoint once and Verifiedly pushes an event whenever a connected user’s identity status changes. Events are only sent for users who have an active authorization with your client.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-md bg-muted p-4 text-xs"><code>{WEBHOOK_SUBSCRIBE_SNIPPET}</code></pre>
        </Card>

        <Card className="mt-6 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display font-semibold">11. Verify webhook signatures</h2>
            <Button size="sm" variant="ghost" onClick={() => void copy(WEBHOOK_VERIFY_SNIPPET)} aria-label="Copy webhook verification example"><Copy className="h-3.5 w-3.5" /></Button>
          </div>
          <pre className="mt-4 overflow-x-auto rounded-md bg-muted p-4 text-xs"><code>{WEBHOOK_VERIFY_SNIPPET}</code></pre>
        </Card>

        <Card className="mt-6 border-accent/30 p-6">
          <h2 className="font-display font-semibold">12. Test the whole flow</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            The sandbox test app runs a real authorization code + PKCE round trip and shows exactly which claims each scope returns.
          </p>
          <Button asChild className="mt-4"><Link to="/developers/test">Open the OAuth sandbox test app</Link></Button>
        </Card>

        <Card className="mt-6 bg-secondary p-4">
          <p className="text-xs leading-5 text-muted-foreground">
            Verifiedly is operated by BrownGlobal Holdings LLC. The OAuth developer program is limited to approved first-party integrations during beta. Contact <a className="underline" href="mailto:support@verifiedly.app">support@verifiedly.app</a> for client registration.
          </p>
        </Card>
      </main>
    </div>
  );
};

export default Developers;