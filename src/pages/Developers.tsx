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
  scope?: string;       // "openid profile identity credentials"
  state: string;        // REQUIRED — CSRF token, store and verify on callback
  codeChallenge?: string;       // PKCE S256 challenge (public clients)
  codeChallengeMethod?: "S256"; // always S256 when PKCE is used
};

export function SignInWithVerifiedly({
  clientId, redirectUri, state,
  scope = "openid profile identity credentials",
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

const EXCHANGE_SNIPPET = `// Confidential web apps run this exchange server-side. Public browser/mobile
// apps use PKCE and send code_verifier instead of ever receiving a client_secret.
const tokenRes = await fetch("https://pwahrywcgtgfaaghkpoo.supabase.co/functions/v1/oauth-token", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    grant_type: "authorization_code",
    code,
    client_id: process.env.VERIFIEDLY_CLIENT_ID,
    client_secret: process.env.VERIFIEDLY_CLIENT_SECRET, // confidential clients
    // code_verifier: pkceVerifier, // public clients: use this instead
    redirect_uri: process.env.VERIFIEDLY_REDIRECT_URI,
  }),
});
const { access_token } = await tokenRes.json();

const userRes = await fetch("https://pwahrywcgtgfaaghkpoo.supabase.co/functions/v1/oauth-userinfo", {
  headers: { Authorization: \`Bearer \${access_token}\` },
});
const user = await userRes.json();
// => {
//   sub, username?, display_name?, avatar_url?,
//   verified?, id_verified?, verified_at?, verification_kind?,
//   verified_credentials?: [{ type, title, issuer, provider, verified_at, expires_at }],
//   email? // only when separately requested and approved
// }`;

const ENV_SNIPPET = `# Development (.env.local) — CLIENT SIDE ONLY
VITE_VERIFIEDLY_CLIENT_ID=your_client_id
VITE_VERIFIEDLY_REDIRECT_URI=http://localhost:8080/auth/callback

# Production / server env (edge function / server route)
# NEVER expose client_secret through a VITE_* variable or browser bundle.
VERIFIEDLY_CLIENT_ID=your_client_id
VERIFIEDLY_CLIENT_SECRET=paste_rotated_secret_here
VERIFIEDLY_REDIRECT_URI=https://your-app.example.com/auth/callback`;

const BUTTON_SNIPPET = `// Start the OAuth flow. state is REQUIRED and MUST be verified on the callback.
const authorize = () => {
  const state = crypto.randomUUID();
  sessionStorage.setItem("verifiedly_oauth_state", state);

  const url = new URL("https://verifiedly.app/oauth/authorize");
  url.searchParams.set("client_id", import.meta.env.VITE_VERIFIEDLY_CLIENT_ID);
  url.searchParams.set("redirect_uri", import.meta.env.VITE_VERIFIEDLY_REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid profile identity credentials");
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
          Let people sign in to your app with their Verifiedly account. Approved scopes can return a stable
          user ID, public profile fields, and the narrow result of an identity check. The developer program
          is currently in beta; first-party BrownGlobal integrations are the initial supported clients.
        </p>

        <Card className="p-6 mb-6">
          <h2 className="font-display font-semibold mb-3">1. Request a client</h2>
          <p className="text-sm text-muted-foreground mb-3">
            Email <a className="underline" href="mailto:support@verifiedly.app">support@verifiedly.app</a> with your
            app name, homepage URL, app type, and exact redirect URIs. Confidential server apps receive a <code className="text-xs bg-muted px-1 py-0.5 rounded">client_id</code> and one-time <code className="text-xs bg-muted px-1 py-0.5 rounded">client_secret</code>. Browser and mobile apps receive a public client ID and must use PKCE (S256).
          </p>
          <p className="text-xs text-muted-foreground">Approved first-party partners are pre-provisioned by the Verifiedly team.</p>
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
            <li><code className="text-xs bg-muted px-1 py-0.5 rounded">credentials</code> — public, independently verified degree/license claims only</li>
            <li><code className="text-xs bg-muted px-1 py-0.5 rounded">email</code> — email address (request only if needed)</li>
          </ul>
          <p className="text-xs text-muted-foreground mt-3">
            Verifiedly does not expose a "trust score", subscription tier, or endorsement signal via OAuth.
            Identity claims confirm identity only — not honesty, safety, or quality. Credential claims never include uploaded files, raw reports, or provider order IDs.
          </p>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="font-display font-semibold mb-3">Security requirements</h2>
          <ul className="text-sm space-y-2 list-disc list-inside">
            <li><strong>state</strong> is required on every authorize request and must be verified on the callback (CSRF).</li>
            <li>Public clients (SPA / mobile) must use <strong>Authorization Code + PKCE (S256)</strong> and no <code>client_secret</code>.</li>
            <li>Confidential clients exchange the code from a server; the <code>client_secret</code> must never appear in a <code>VITE_*</code> variable or browser bundle.</li>
            <li>Authorization codes are single-use and are consumed atomically at token exchange.</li>
          </ul>
        </Card>

        <div className="mt-12 mb-6">
          <span className="inline-block px-3 py-1 rounded-full border border-border text-xs font-medium text-muted-foreground mb-3">Environment</span>
          <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight mb-2">Configure your app</h2>
          <p className="text-sm text-muted-foreground">Once your client is approved, wire up env vars and trigger the flow.</p>
        </div>

        <Card className="p-6 mb-6">
          <h2 className="font-display font-semibold mb-3">Environment variables</h2>
          <div className="relative">
            <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto"><code>{ENV_SNIPPET}</code></pre>
            <Button size="sm" variant="ghost" className="absolute top-2 right-2" onClick={() => copy(ENV_SNIPPET)}><Copy className="w-3 h-3" /></Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Never commit <code>client_secret</code> or expose it through a <code>VITE_*</code> variable. In production keep it server-side and perform the token exchange from an edge function or backend route.
          </p>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="font-display font-semibold mb-3">Trigger the flow</h2>
          <div className="relative">
            <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto"><code>{BUTTON_SNIPPET}</code></pre>
            <Button size="sm" variant="ghost" className="absolute top-2 right-2" onClick={() => copy(BUTTON_SNIPPET)}><Copy className="w-3 h-3" /></Button>
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="font-display font-semibold mb-3">Handle the callback</h2>
          <p className="text-sm text-muted-foreground">
            Your partner-app callback must compare <code className="text-xs bg-muted px-1 py-0.5 rounded">state</code> before doing anything else.
            Confidential apps then send the code to their own server for exchange; public clients send the saved PKCE verifier.
            After exchange, call <code className="text-xs bg-muted px-1 py-0.5 rounded">/oauth-userinfo</code> and enforce the scopes your app requires.
            The <Link to="/auth/callback" className="underline">Verifiedly reference callback</Link> intentionally contains no client secret.
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
