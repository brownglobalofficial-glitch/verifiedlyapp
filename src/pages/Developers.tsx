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