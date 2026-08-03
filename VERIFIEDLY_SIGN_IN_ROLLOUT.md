# Continue with Verifiedly — rollout for the five apps

Verifiedly is the identity provider for BrownGlobal Holdings LLC products. It now runs the
native OAuth 2.1 / OpenID Connect server on the Verifiedly backend. Each product keeps its own
auth project, users, roles and RLS. Verifiedly only supplies account ID, email and basic profile.

## Verifiedly provider facts

```text
Issuer:        https://pwahrywcgtgfaaghkpoo.supabase.co/auth/v1
Discovery:     https://pwahrywcgtgfaaghkpoo.supabase.co/auth/v1/.well-known/openid-configuration
Authorize:     .../auth/v1/oauth/authorize
Token:         .../auth/v1/oauth/token
UserInfo:      .../auth/v1/oauth/userinfo
JWKS:          .../auth/v1/.well-known/jwks.json
Consent page:  https://verifiedly.app/oauth/consent
Scopes:        openid email profile
PKCE:          S256 (required)
Signing:       ES256 (asymmetric, OIDC ready)
Logo (button): https://verifiedly.app/verifiedly-mark.png
```

## One OAuth client per independent auth project

| Verifiedly client name | Products it serves | Exact redirect URI |
| --- | --- | --- |
| `GSN` | GSN | `https://sjlrxwxewiqholmwllxv.supabase.co/auth/v1/callback` |
| `GSN Club Connect` | GSN Club Connect | `https://wbsbxevbxyawpqgtnvge.supabase.co/auth/v1/callback` |
| `BrownGlobal Suite` | BrownGlobal Reach, Studio, Learn (shared auth project) | `https://ioumcdhslftdxlauqziz.supabase.co/auth/v1/callback` |

Create each client as **confidential** in the Verifiedly backend under
Auth → OAuth Apps. The client secret is shown once. Paste it straight into the matching
consumer project's provider settings. Never commit it, never put it in a `VITE_*` variable,
never paste it into chat or a screenshot. Rotate only the affected client if a secret leaks.

## Consumer project provider config (each auth project once)

Auth → Providers → New provider → auto-discovery OIDC:

```text
Identifier:     custom:verifiedly
Name:           Verifiedly
Issuer:         https://pwahrywcgtgfaaghkpoo.supabase.co/auth/v1
Scopes:         openid email profile
PKCE:           enabled
Email optional: disabled
Client ID:      product-specific value
Client secret:  matching product-specific secret
```

Then add the app origins and post-login paths to Auth → URL Configuration → Redirect URLs.

## Button code for every app (primary sign-up and sign-in path)

```tsx
import verifiedlyMark from "@/assets/verifiedly-mark.png"; // or "/verifiedly-mark.png"

export function ContinueWithVerifiedly({ returnPath = "/" }: { returnPath?: string }) {
  const signIn = async () => {
    const safePath = returnPath.startsWith("/") && !returnPath.startsWith("//") ? returnPath : "/";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "custom:verifiedly" as never,
      options: {
        redirectTo: `${window.location.origin}${safePath}`,
        scopes: "openid email profile",
      },
    });
    if (error) console.error(error);
  };

  return (
    <button
      type="button"
      onClick={signIn}
      className="flex h-11 w-full items-center justify-center gap-3 rounded-md border border-border bg-background text-sm font-medium"
    >
      <img src={verifiedlyMark} alt="" className="h-5 w-5 object-contain" aria-hidden="true" />
      Continue with Verifiedly
    </button>
  );
}
```

Rules for the button, matching how Google's button behaves:

- Label is exactly **Continue with Verifiedly**.
- Use the official V mark with a transparent background beside the label.
- It is the primary action on both sign-in and sign-up screens; email/password stays secondary or is removed.
- All account, consent, recovery and error copy says "Verifiedly account".
- Never use "BrownGlobal Sign In" or a separate BrownGlobal identity brand.
- Keep the button hidden behind `VITE_VERIFIEDLY_OAUTH_ENABLED=true` until the provider, client ID and secret exist in that project.

## Per-product test checklist

1. Open the product sign-in page, press **Continue with Verifiedly**.
2. Sign in on Verifiedly; unauthenticated users must return to the same consent URL after sign-in **or** sign-up.
3. Consent screen names the correct product and lists only account ID, email and basic profile.
4. Approve → a local session is created in that product's own auth project, and the user lands on an allowed local path.
5. Deny → no local session.
6. Existing local account with the same confirmed email links as expected.
7. Admin, staff, organizer and club roles still come only from the product's own database.

Verifiedly is owned and operated by BrownGlobal Holdings LLC.