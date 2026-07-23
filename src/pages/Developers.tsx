import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Copy, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/verifiedly-logo.webp";

const ISSUER = "https://pwahrywcgtgfaaghkpoo.supabase.co/auth/v1";
const DISCOVERY = `${ISSUER}/.well-known/openid-configuration`;

const SIGN_IN_SNIPPET = `// The connected app already has a custom OIDC provider named custom:verifiedly.
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: "custom:verifiedly",
  options: {
    redirectTo: \`\${window.location.origin}/auth/callback\`,
  },
});

if (error) throw error;`;

const CALLBACK_SNIPPET = `// /auth/callback in the connected app
const params = new URLSearchParams(window.location.search);
const code = params.get("code");

if (!code) throw new Error("Missing authorization code");

const { data, error } = await supabase.auth.exchangeCodeForSession(code);
if (error) throw error;

// data.session is now the local app session for this Verifiedly user.`;

const CONFIG_SNIPPET = `Provider type: Auto-discovery (OIDC)
Identifier: custom:verifiedly
Issuer URL: ${ISSUER}
Scopes: openid profile email
Client ID: <from Verifiedly OAuth Apps>
Client Secret: <store only in the connected app's Supabase dashboard>`;

const Developers = () => {
  const { toast } = useToast();

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    toast({ title: "Copied" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Sign in with Verifiedly — OpenID Connect</title>
        <meta name="description" content="Use Verifiedly as an OAuth 2.1 and OpenID Connect account provider for approved connected applications." />
        <link rel="canonical" href="https://verifiedly.app/developers" />
        <meta property="og:title" content="Sign in with Verifiedly — OpenID Connect" />
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
        <h1 className="text-4xl font-display font-bold tracking-tight md:text-5xl">Sign in with Verifiedly</h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Verifiedly is the shared account provider for approved GSN, Globalis, and BrownGlobal applications. It uses Supabase's native OAuth 2.1 server and OpenID Connect discovery instead of a custom token system.
        </p>

        <Card className="mt-8 rounded-3xl p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <h2 className="font-display font-semibold">What sign-in shares</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Connected apps may request the standard <code className="rounded bg-muted px-1 py-0.5 text-xs">openid</code>, <code className="rounded bg-muted px-1 py-0.5 text-xs">profile</code>, and <code className="rounded bg-muted px-1 py-0.5 text-xs">email</code> scopes. Identity-verification status, credentials, documents, messages, and payment information are not included in the standard sign-in token.</p>
            </div>
          </div>
        </Card>

        <section className="mt-8 space-y-5">
          <Card className="rounded-3xl p-6">
            <h2 className="font-display text-lg font-semibold">1. Register the application</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">An authorized BrownGlobal administrator creates a separate OAuth client in the Verifiedly Supabase project's <strong>Authentication → OAuth Apps</strong> area. Register every production callback URL exactly; wildcards are not used for OAuth-client redirect URIs.</p>
          </Card>

          <Card className="rounded-3xl p-6">
            <h2 className="font-display text-lg font-semibold">2. Configure Verifiedly as the app's OIDC provider</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">In the connected app's Supabase project, add a custom provider using <strong>Auto-discovery (OIDC)</strong>. Copy the provider's callback URL first and register that exact URL on the matching Verifiedly OAuth client.</p>
            <CodeBlock value={CONFIG_SNIPPET} onCopy={copy} />
          </Card>

          <Card className="rounded-3xl p-6">
            <h2 className="font-display text-lg font-semibold">3. Add the sign-in button</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">After the custom provider is enabled, the connected app starts sign-in through its own Supabase client. Supabase handles state, nonce, authorization code flow, and PKCE.</p>
            <CodeBlock value={SIGN_IN_SNIPPET} onCopy={copy} />
          </Card>

          <Card className="rounded-3xl p-6">
            <h2 className="font-display text-lg font-semibold">4. Complete the callback</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">The connected application exchanges the returned code for its own local Supabase session. The local application then stores its own roles and product-specific data separately from Verifiedly.</p>
            <CodeBlock value={CALLBACK_SNIPPET} onCopy={copy} />
          </Card>
        </section>

        <Card className="mt-8 rounded-3xl bg-secondary p-5">
          <h2 className="font-display font-semibold">OpenID Connect endpoints</h2>
          <dl className="mt-3 space-y-2 text-xs">
            <div><dt className="font-semibold">Issuer</dt><dd className="mt-0.5 break-all font-mono text-muted-foreground">{ISSUER}</dd></div>
            <div><dt className="font-semibold">Discovery</dt><dd className="mt-0.5 break-all font-mono text-muted-foreground">{DISCOVERY}</dd></div>
          </dl>
        </Card>

        <div className="mt-8 text-sm leading-relaxed text-muted-foreground">
          <p><strong className="text-foreground">Security:</strong> client secrets belong only in Supabase dashboards or server-side secret storage. Never put one in a <code className="rounded bg-muted px-1 py-0.5 text-xs">VITE_*</code> variable, browser code, a public repository, or a mobile bundle.</p>
          <p className="mt-3">The first integrations are BrownGlobal-owned applications. External developer access remains closed until consent, support, security review, and client-management processes are finalized.</p>
        </div>
      </main>
    </div>
  );
};

const CodeBlock = ({ value, onCopy }: { value: string; onCopy: (value: string) => Promise<void> }) => (
  <div className="relative mt-4">
    <pre className="overflow-x-auto rounded-xl bg-muted p-4 pr-12 text-xs"><code>{value}</code></pre>
    <Button type="button" size="sm" variant="ghost" className="absolute right-2 top-2" onClick={() => void onCopy(value)} aria-label="Copy code"><Copy className="h-3.5 w-3.5" /></Button>
  </div>
);

export default Developers;
