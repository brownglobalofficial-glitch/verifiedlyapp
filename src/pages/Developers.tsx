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