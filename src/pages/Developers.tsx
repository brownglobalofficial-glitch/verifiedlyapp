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
  scope?: string;       // "openid profile trust"
  state?: string;       // your CSRF token
};

export function SignInWithVerifiedly({ clientId, redirectUri, scope = "openid profile trust", state }: Props) {
  const url = new URL("https://verifiedly.app/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scope);
  if (state) url.searchParams.set("state", state);

  return (
    <Button asChild variant="outline">
      <a href={url.toString()}>
        <svg viewBox="0 0 24 24" className="w-4 h-4 mr-2" fill="currentColor"><path d="M12 2l3 6 6 .8-4.5 4.3 1 6.4L12 16.8 6.5 19.5l1-6.4L3 8.8 9 8z"/></svg>
        Sign in with Verifiedly
      </a>
    </Button>
  );
}`;

const EXCHANGE_SNIPPET = `// On your server (the redirect_uri callback):
const tokenRes = await fetch("https://pwahrywcgtgfaaghkpoo.supabase.co/functions/v1/oauth-token", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    grant_type: "authorization_code",
    code,
    client_id: process.env.VERIFIEDLY_CLIENT_ID,
    client_secret: process.env.VERIFIEDLY_CLIENT_SECRET,
    redirect_uri: process.env.VERIFIEDLY_REDIRECT_URI,
  }),
});
const { access_token } = await tokenRes.json();

const userRes = await fetch("https://pwahrywcgtgfaaghkpoo.supabase.co/functions/v1/oauth-userinfo", {
  headers: { Authorization: \`Bearer \${access_token}\` },
});
const user = await userRes.json();
// => { sub, username, display_name, avatar_url, trust_score, tier, verified }`;

const GSN_ENV_SNIPPET = `# .env.local (development)
VITE_GSN_CLIENT_ID=gsn_app
VITE_GSN_CLIENT_SECRET=paste_rotated_secret_here
VITE_GSN_REDIRECT_URI=http://localhost:8080/auth/callback

# Production (Lovable / Vercel / etc. — server env vars)
GSN_CLIENT_ID=gsn_app
GSN_CLIENT_SECRET=paste_rotated_secret_here
GSN_REDIRECT_URI=https://gsn.lovable.app/auth/callback`;

const GSN_BUTTON_SNIPPET = `// Anywhere in GSN, e.g. src/pages/Login.tsx
const authorize = () => {
  const url = new URL("https://verifiedly.app/oauth/authorize");
  url.searchParams.set("client_id", import.meta.env.VITE_GSN_CLIENT_ID);
  url.searchParams.set("redirect_uri", import.meta.env.VITE_GSN_REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile trust");
  url.searchParams.set("state", crypto.randomUUID()); // store + verify on callback
  window.location.href = url.toString();
};`;

const Developers = () => {
  const { toast } = useToast();
  const copy = (s: string) => {
    navigator.clipboard.writeText(s);
    toast({ title: "Copied" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Sign in with Verifiedly — Developer Docs</title>
        <meta name="description" content="Add 'Sign in with Verifiedly' to your app. OAuth 2.0 + userinfo with Trust Score, verified status, and creator profile." />
        <link rel="canonical" href="https://verifiedly.app/developers" />
        <meta property="og:title" content="Sign in with Verifiedly — Developer Docs" />
        <meta property="og:url" content="https://verifiedly.app/developers" />
      </Helmet>

      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur h-14 flex items-center px-4">
        <div className="container mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2"><img src={logo} alt="Verifiedly" className="h-6" /></Link>
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><ArrowLeft className="w-3 h-3" /> Home</Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <span className="inline-block px-3 py-1 rounded-full border border-border text-xs font-medium text-muted-foreground mb-4">Developers</span>
        <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-3">Sign in with Verifiedly</h1>
        <p className="text-base text-muted-foreground mb-8">
          Let creators sign in to your app with their Verifiedly identity. You get a verified
          handle, avatar, Trust Score, and tier in a single OAuth 2.0 flow.
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
            <li><code className="text-xs bg-muted px-1 py-0.5 rounded">trust</code> — trust_score, tier, verified boolean</li>
            <li><code className="text-xs bg-muted px-1 py-0.5 rounded">email</code> — verified email address (request only if you need it)</li>
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
            <li><code className="text-xs bg-muted px-1 py-0.5 rounded">https://gsn.lovable.app/auth/callback</code></li>
            <li><code className="text-xs bg-muted px-1 py-0.5 rounded">http://localhost:8080/auth/callback</code></li>
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
            (<code className="text-xs bg-muted px-1 py-0.5 rounded">src/pages/AuthCallback.tsx</code>). It exchanges the
            <code className="text-xs bg-muted px-1 py-0.5 rounded mx-1">code</code> for an access token, calls{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">/oauth-userinfo</code>, and verifies that the granted
            scopes include both <code className="text-xs bg-muted px-1 py-0.5 rounded">profile</code> and{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">trust</code> before signing the user in. Copy that file
            into the GSN repo as a starting point.
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