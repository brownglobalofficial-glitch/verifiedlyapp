import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/verifiedly-logo.webp";

const COMPONENT_SNIPPET = `// src/components/SignInWithVerifiedly.tsx
import { Button } from "@/components/ui/button";

type Props = {
  clientId: string;
  redirectUri: string;
  scope?: string;       // "openid profile identity"
  state: string;        // REQUIRED — CSRF token, store and verify on callback
  codeChallenge?: string;       // PKCE S256 challenge (public clients)
  codeChallengeMethod?: "S256"; // always S256 when PKCE is used
};

export function SignInWithVerifiedly({
  clientId, redirectUri, state,
  scope = "openid profile identity",
  codeChallenge, codeChallengeMethod,
}: Props) {
  const url = new URL("https://verifiedly.app/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scope);
  url.searchParams.set("state", state);
  if (codeChallenge) {
    url.searchParams.set("code_challenge", codeChallenge);
    url.searchParams.set("code_challenge_method", codeChallengeMethod ?? "S256");
  }

  return (
    <Button asChild variant="outline">
      <a href={url.toString()}>Sign in with Verifiedly</a>
    </Button>
  );
}`;

const EXCHANGE_SNIPPET = `// SERVER-SIDE ONLY (never in the browser). client_secret must not ship to
// the client — put it in a server env var / edge function secret.
const tokenRes = await fetch("https://pwahrywcgtgfaaghkpoo.supabase.co/functions/v1/oauth-token", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    grant_type: "authorization_code",
    code,
    client_id: process.env.VERIFIEDLY_CLIENT_ID,
    client_secret: process.env.VERIFIEDLY_CLIENT_SECRET, // confidential clients
    // code_verifier: pkceVerifier, // public clients using PKCE instead
    redirect_uri: process.env.VERIFIEDLY_REDIRECT_URI,
  }),
});
const { access_token } = await tokenRes.json();

const userRes = await fetch("https://pwahrywcgtgfaaghkpoo.supabase.co/functions/v1/oauth-userinfo", {
  headers: { Authorization: \`Bearer \${access_token}\` },
});
const user = await userRes.json();
// => {
//   sub, username, display_name, avatar_url,
//   verified, id_verified, verified_at, verification_kind,
//   // only when consented via scope:
//   email?, legal_name?, age_over_18?, age_over_21?, country?
// }`;

const GSN_ENV_SNIPPET = `# GSN — development (.env.local) — CLIENT SIDE ONLY
VITE_GSN_CLIENT_ID=gsn_app
VITE_GSN_REDIRECT_URI=http://localhost:8080/auth/callback

# GSN — production / server env (edge function / server route)
# NEVER expose client_secret through a VITE_* variable or browser bundle.
GSN_CLIENT_ID=gsn_app
GSN_CLIENT_SECRET=paste_rotated_secret_here
GSN_REDIRECT_URI=https://gsnmedia.app/auth/callback`;

const GSN_BUTTON_SNIPPET = `// GSN — start the OAuth flow. state is REQUIRED and MUST be verified on the callback.
const authorize = () => {
  const state = crypto.randomUUID();
  sessionStorage.setItem("verifiedly_oauth_state", state);

  const url = new URL("https://verifiedly.app/oauth/authorize");
  url.searchParams.set("client_id", import.meta.env.VITE_GSN_CLIENT_ID);
  url.searchParams.set("redirect_uri", import.meta.env.VITE_GSN_REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid profile identity");
  url.searchParams.set("state", state);
  window.location.href = url.toString();
};

// On the callback route — validate state BEFORE exchanging the code.
const params = new URLSearchParams(window.location.search);
const expected = sessionStorage.getItem("verifiedly_oauth_state");
if (!expected || params.get("state") !== expected) {
  throw new Error("Invalid OAuth state — possible CSRF");
}
sessionStorage.removeItem("verifiedly_oauth_state");`;

const Developers = () => {
  const { toast } = useToast();
  const copy = (s: string) => {
    navigator.clipboard.writeText(s);
    toast({ title: "Copied" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Sign in with Verifiedly — Developer Docs (Beta)</title>
        <meta name="description" content="Add 'Sign in with Verifiedly' to your app. OAuth 2.0 with PKCE, identity verification status, and consented profile fields." />
        <link rel="canonical" href="https://verifiedly.app/developers" />
        <meta property="og:title" content="Sign in with Verifiedly — Developer Docs" />
        <meta property="og:url" content="https://verifiedly.app/developers" />
      </Helmet>

      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur h-14 flex items-center px-4">
        <div className="container mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2"><img src={logo} alt="Verifiedly Logo" className="h-6" /></Link>
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><ArrowLeft className="w-3 h-3" /> Home</Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <span className="inline-block px-3 py-1 rounded-full border border-border text-xs font-medium text-muted-foreground mb-4">Developers · Beta</span>
        <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-3">Sign in with Verifiedly</h1>
        <p className="text-base text-muted-foreground mb-8">
          Let people sign in to your app with their Verifiedly identity. You receive a stable
          user id, handle, avatar, and — only if the user consents — their identity verification
          status and age/country claims. The developer program is currently in beta; first-party
          BrownGlobal integrations (GSN, Globalis) are the initial supported clients.
        </p>

        <Card className="p-6 mb-6">
          <h2 className="font-display font-semibold mb-3">1. Request a client</h2>
          <p className="text-sm text-muted-foreground mb-3">
            Email <a className="underline" href="mailto:support@verifiedly.app">support@verifiedly.app</a> with your
            app name, homepage URL, and one or more redirect URIs. We'll issue a <code className="text-xs bg-muted px-1 py-0.5 rounded">client_id</code> and <code className="text-xs bg-muted px-1 py-0.5 rounded">client_secret</code>.
          </p>
          <p className="text-xs text-muted-foreground">First-party Brown Global apps (GSN, Globalis) are pre-provisioned.</p>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="font-display font-semibold mb-3">2. Drop in the button</h2>
          <div className="relative">
            <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto"><code>{COMPONENT_SNIPPET}</code></pre>
            <Button size="sm" variant="ghost" className="absolute top-2 right-2" onClick={() => copy(COMPONENT_SNIPPET)}><Copy className="w-3 h-3" /></Button>
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="font-display font-semibold mb-3">3. Exchange the code server-side</h2>
          <div className="relative">
            <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto"><code>{EXCHANGE_SNIPPET}</code></pre>
            <Button size="sm" variant="ghost" className="absolute top-2 right-2" onClick={() => copy(EXCHANGE_SNIPPET)}><Copy className="w-3 h-3" /></Button>
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="font-display font-semibold mb-3">Scopes</h2>
          <ul className="text-sm space-y-2">
            <li><code className="text-xs bg-muted px-1 py-0.5 rounded">openid</code> — sub (stable user id)</li>
            <li><code className="text-xs bg-muted px-1 py-0.5 rounded">profile</code> — username, display_name, avatar_url</li>
            <li><code className="text-xs bg-muted px-1 py-0.5 rounded">identity</code> — verified, id_verified, verified_at, verification_kind</li>
            <li><code className="text-xs bg-muted px-1 py-0.5 rounded">email</code> — email address (request only if needed)</li>
            <li><code className="text-xs bg-muted px-1 py-0.5 rounded">age</code> — age_over_18 / age_over_21 booleans</li>
            <li><code className="text-xs bg-muted px-1 py-0.5 rounded">legal_name</code> — verified legal name (only if user opted in on their profile)</li>
            <li><code className="text-xs bg-muted px-1 py-0.5 rounded">country</code> — verified country code</li>
          </ul>
          <p className="text-xs text-muted-foreground mt-3">
            Verifiedly does not expose a "trust score", subscription tier, or endorsement signal via OAuth.
            Identity claims confirm identity only — not honesty, safety, or quality.
          </p>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="font-display font-semibold mb-3">Security requirements</h2>
          <ul className="text-sm space-y-2 list-disc list-inside">
            <li><strong>state</strong> is required on every authorize request and must be verified on the callback (CSRF).</li>
            <li>Public clients (SPA / mobile) must use <strong>Authorization Code + PKCE (S256)</strong> and no <code>client_secret</code>.</li>
            <li>Confidential clients exchange the code from a server; the <code>client_secret</code> must never appear in a <code>VITE_*</code> variable or browser bundle.</li>
            <li>Authorize, token, and userinfo endpoints are rate-limited per client and per IP.</li>
            <li>Authorization codes are single-use and are consumed atomically at token exchange.</li>
          </ul>
        </Card>

        <div className="mt-12 mb-6">
          <span className="inline-block px-3 py-1 rounded-full border border-border text-xs font-medium text-muted-foreground mb-3">First-party</span>
          <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight mb-2">Configure GSN OAuth</h2>
          <p className="text-sm text-muted-foreground">Step-by-step setup for the pre-provisioned GSN client.</p>
        </div>

        <Card className="p-6 mb-6">
          <h2 className="font-display font-semibold mb-3">Step 1 — Get the client secret</h2>
          <p className="text-sm text-muted-foreground">
            Sign in as <code className="text-xs bg-muted px-1 py-0.5 rounded">support@verifiedly.app</code> and open{" "}
            <Link to="/admin/verification" className="underline">/admin/verification</Link> → <strong>OAuth clients</strong> tab.
            Find <strong>GSN</strong> (<code className="text-xs bg-muted px-1 py-0.5 rounded">gsn_app</code>) and click <strong>Rotate secret</strong>.
            Copy the plaintext value immediately — it is shown only once.
          </p>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="font-display font-semibold mb-3">Step 2 — Add env vars in the GSN repo</h2>
          <div className="relative">
            <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto"><code>{GSN_ENV_SNIPPET}</code></pre>
            <Button size="sm" variant="ghost" className="absolute top-2 right-2" onClick={() => copy(GSN_ENV_SNIPPET)}><Copy className="w-3 h-3" /></Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Never commit <code>VITE_GSN_CLIENT_SECRET</code>. In production keep the secret server-side
            (<code>GSN_CLIENT_SECRET</code>) and perform the token exchange from an edge function.
          </p>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="font-display font-semibold mb-3">Step 3 — Allowed redirect URIs</h2>
          <p className="text-sm text-muted-foreground mb-2">The <code>gsn_app</code> client accepts only these callback URLs:</p>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li><code className="text-xs bg-muted px-1 py-0.5 rounded">https://gsnmedia.app/auth/callback</code> (production)</li>
            <li><code className="text-xs bg-muted px-1 py-0.5 rounded">https://globalismaps.lovable.app/auth/callback</code> (Globalis preview)</li>
            <li><code className="text-xs bg-muted px-1 py-0.5 rounded">http://localhost:8080/auth/callback</code> (development only)</li>
          </ul>
          <p className="text-xs text-muted-foreground mt-3">Need another URL (custom domain, staging)? Email support@verifiedly.app to add it.</p>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="font-display font-semibold mb-3">Step 4 — Trigger the flow</h2>
          <div className="relative">
            <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto"><code>{GSN_BUTTON_SNIPPET}</code></pre>
            <Button size="sm" variant="ghost" className="absolute top-2 right-2" onClick={() => copy(GSN_BUTTON_SNIPPET)}><Copy className="w-3 h-3" /></Button>
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="font-display font-semibold mb-3">Step 5 — Handle the callback</h2>
          <p className="text-sm text-muted-foreground">
            A reference implementation lives at <Link to="/auth/callback" className="underline">/auth/callback</Link>{" "}
            (<code className="text-xs bg-muted px-1 py-0.5 rounded">src/pages/AuthCallback.tsx</code>). It validates{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">state</code>, exchanges the{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">code</code> for an access token server-side,
            calls <code className="text-xs bg-muted px-1 py-0.5 rounded">/oauth-userinfo</code>, and checks that the
            returned scopes include <code className="text-xs bg-muted px-1 py-0.5 rounded">profile</code>
            and <code className="text-xs bg-muted px-1 py-0.5 rounded">identity</code> before signing the user in.
          </p>
        </Card>

        <Card className="p-4 bg-secondary">
          <p className="text-xs text-muted-foreground">
            Endpoints — <code>POST /oauth-token</code>, <code>GET /oauth-userinfo</code>, browser flow at <code>/oauth/authorize</code>.
            Tokens expire after 30 days. Rotate <code>client_secret</code> from the admin panel anytime.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Developers;