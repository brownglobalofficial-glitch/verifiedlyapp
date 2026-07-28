import { ArrowLeft, Copy, ShieldCheck } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

import logo from "@/assets/verifiedly-logo.webp";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const ISSUER = "https://pwahrywcgtgfaaghkpoo.supabase.co/auth/v1";

const ENDPOINTS_SNIPPET = `issuer                 = ${ISSUER}
authorization_endpoint = ${ISSUER}/oauth/authorize
token_endpoint         = ${ISSUER}/oauth/token
userinfo_endpoint      = ${ISSUER}/oauth/userinfo
jwks_uri               = ${ISSUER}/.well-known/jwks.json
oidc_discovery         = ${ISSUER}/.well-known/openid-configuration
scopes                  = openid email profile phone
flow                    = authorization_code + PKCE`;

const KAIETEUR_SNIPPET = `// The Kaieteur Supabase project has a custom OIDC provider named custom:verifiedly.
// Supabase handles state, PKCE, code exchange, token validation, and the local session.
const { error } = await supabase.auth.signInWithOAuth({
  provider: "custom:verifiedly",
  options: {
    redirectTo: window.location.origin + "/account",
    scopes: "openid email profile",
  },
});

if (error) throw error;`;

const GENERIC_SNIPPET = `// Standards-compliant apps should use OIDC discovery rather than hard-coding endpoints.
const issuer = "${ISSUER}";
const discoveryUrl = issuer + "/.well-known/openid-configuration";

// Register an exact redirect URI for the client, then use Authorization Code + PKCE.
// Request only the information your app needs, usually: openid email profile.`;

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
          content="Use Verifiedly as an OAuth 2.1 and OpenID Connect identity provider with Authorization Code, PKCE, standard scopes, discovery, and JWKS."
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
        <span className="mb-4 inline-block rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">Developers · Beta</span>
        <h1 className="text-4xl font-display font-bold tracking-tight md:text-5xl">Sign in with Verifiedly</h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          Verifiedly uses its Supabase Auth project as a native OAuth 2.1 and OpenID Connect identity provider. Partner applications receive a stable account ID and only the standard fields the user approves.
        </p>

        <Card className="mt-8 border-accent/30 bg-secondary/40 p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <h2 className="font-display font-semibold">Privacy boundary</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Sign-in does not share private documents, uploaded evidence, payment information, raw identity files, or a trust score. Kaieteur House requests only <code className="rounded bg-muted px-1 py-0.5 text-xs">openid email profile</code>.
              </p>
            </div>
          </div>
        </Card>

        <Card className="mt-6 p-6">
          <h2 className="font-display font-semibold">1. Register the application</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            During the beta, BrownGlobal registers approved clients in Verifiedly’s OAuth Apps settings. Provide the application name, homepage, environment, client type, and every exact redirect URI. Client secrets are shown once and must remain server-side.
          </p>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            Kaieteur House and Kaieteur Reader share one Supabase Auth project, so they use one confidential Verifiedly client and the Kaieteur Supabase callback URL.
          </p>
        </Card>

        <Card className="mt-6 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display font-semibold">2. Use OIDC discovery</h2>
            <Button size="sm" variant="ghost" onClick={() => void copy(ENDPOINTS_SNIPPET)}><Copy className="h-3.5 w-3.5" /></Button>
          </div>
          <pre className="mt-4 overflow-x-auto rounded-md bg-muted p-4 text-xs"><code>{ENDPOINTS_SNIPPET}</code></pre>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            OpenID Connect ID tokens require Verifiedly’s Supabase project to use an asymmetric JWT signing key so clients can validate tokens through JWKS.
          </p>
        </Card>

        <Card className="mt-6 p-6">
          <h2 className="font-display font-semibold">Standard scopes</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li><code className="rounded bg-muted px-1 py-0.5 text-xs">openid</code> — stable subject identifier and an ID token</li>
            <li><code className="rounded bg-muted px-1 py-0.5 text-xs">email</code> — email address and confirmation status</li>
            <li><code className="rounded bg-muted px-1 py-0.5 text-xs">profile</code> — basic account profile claims such as name and picture</li>
            <li><code className="rounded bg-muted px-1 py-0.5 text-xs">phone</code> — phone claims only when genuinely required</li>
          </ul>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            Custom scopes such as identity documents or credentials are not part of Verifiedly sign-in. Separate, explicit APIs and agreements would be required for any future data-sharing product.
          </p>
        </Card>

        <Card className="mt-6 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display font-semibold">3. Kaieteur implementation</h2>
            <Button size="sm" variant="ghost" onClick={() => void copy(KAIETEUR_SNIPPET)}><Copy className="h-3.5 w-3.5" /></Button>
          </div>
          <pre className="mt-4 overflow-x-auto rounded-md bg-muted p-4 text-xs"><code>{KAIETEUR_SNIPPET}</code></pre>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            The Verifiedly client ID and secret are configured privately in the Kaieteur Supabase custom OIDC provider. They are never included in the website bundle.
          </p>
        </Card>

        <Card className="mt-6 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display font-semibold">4. Other standards-compliant apps</h2>
            <Button size="sm" variant="ghost" onClick={() => void copy(GENERIC_SNIPPET)}><Copy className="h-3.5 w-3.5" /></Button>
          </div>
          <pre className="mt-4 overflow-x-auto rounded-md bg-muted p-4 text-xs"><code>{GENERIC_SNIPPET}</code></pre>
        </Card>

        <Card className="mt-6 p-6">
          <h2 className="font-display font-semibold">Consent screen</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Verifiedly’s authorization page reads the secure <code className="rounded bg-muted px-1 py-0.5 text-xs">authorization_id</code>, confirms the user is signed in, displays the requesting app and scopes, and calls Supabase’s native approve or deny methods. Supabase then returns the authorization result to the exact registered redirect URI.
          </p>
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
