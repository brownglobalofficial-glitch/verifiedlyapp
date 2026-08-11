# Verifiedly OAuth / OpenID Connect for BrownGlobal websites

Verifiedly is the shared identity provider for BrownGlobal first-party products. Each consumer website keeps its own Supabase Auth users, database, local roles and Row Level Security policies.

Use Supabase's native OAuth 2.1 server and custom OpenID Connect provider support. Do not use the retired custom token exchange, magic-link session minting, `trust` scope, trust scores, verification claims, payment status or private profile data for sign-in.

## Standard privacy boundary

Every first-party client requests only:

```text
openid email profile
```

Verifiedly sign-in may provide a stable account subject, email and confirmation status, display name and profile image. It must not provide:

- Stripe or billing information
- identity-verification files, provider records or status beyond what is visibly shown on the public profile
- private documents or uploaded evidence
- credentials, licenses, education or work claims
- GSN rankings, player roles or staff permissions
- local admin, organizer, scanner, operator or club permissions
- trust scores or custom `trust` claims

Local permissions always come from the consumer website's own database.

## 1. Verifiedly provider configuration

Verifiedly Supabase project:

```text
pwahrywcgtgfaaghkpoo
```

In **Authentication → OAuth Server**:

1. Enable OAuth 2.1 server capabilities.
2. Set the Auth Site URL to `https://verifiedly.app`.
3. Set the authorization path to `/oauth/authorize`.
4. Use an asymmetric Auth JWT signing key such as RS256 or ES256 before requesting `openid`.
5. Confirm the consent page at `https://verifiedly.app/oauth/authorize` is deployed.

Issuer:

```text
https://pwahrywcgtgfaaghkpoo.supabase.co/auth/v1
```

OIDC discovery:

```text
https://pwahrywcgtgfaaghkpoo.supabase.co/auth/v1/.well-known/openid-configuration
```

## 2. First-party client registry

Create a separate confidential OAuth client for each independent Supabase Auth project. Redirect URIs must match exactly.

| Product | Repository | Consumer Supabase project | Verifiedly client name | Exact callback URI |
| --- | --- | --- | --- | --- |
| GSN | `gsnofficial` | `sjlrxwxewiqholmwllxv` | `GSN` | `https://sjlrxwxewiqholmwllxv.supabase.co/auth/v1/callback` |
| GSN Clubs | `gsn-club-connect` | `wbsbxevbxyawpqgtnvge` | `GSN Clubs` | `https://wbsbxevbxyawpqgtnvge.supabase.co/auth/v1/callback` |
| GSN Tickets | `gsnticketsapp` | `lcgxaidibaihrhmtnyap` | `GSN Tickets` | `https://lcgxaidibaihrhmtnyap.supabase.co/auth/v1/callback` |
| GSN Next | `gsnnext` | `bjkutqlluhsolcvdeihe` | `GSN Next` | `https://bjkutqlluhsolcvdeihe.supabase.co/auth/v1/callback` |
| Kaieteur House and Kaieteur Reader | `kaieteur-publishing-hub`, `kaieteur-reader` | `clfdwcvnohxrvqxattvg` | `Kaieteur House & Reader` | `https://clfdwcvnohxrvqxattvg.supabase.co/auth/v1/callback` |
| BrownGlobal View | `freeview-hub` | `plciefqgckfkrvavjczp` | `BrownGlobal View` | `https://plciefqgckfkrvavjczp.supabase.co/auth/v1/callback` |

Additional first-party clients to register as each product goes live. Replace `<project-ref>` with that product's own Supabase project ref, then use its exact read-only callback URI.

| Product | Verifiedly client name | Callback URI |
| --- | --- | --- |
| GSN Next | `GSN Next` | `https://bjkutqlluhsolcvdeihe.supabase.co/auth/v1/callback` |
| GSN Tickets | `GSN Tickets` | `https://lcgxaidibaihrhmtnyap.supabase.co/auth/v1/callback` |
| BrownGlobal Reach, Studio, Academy (shared auth project) | `BrownGlobal Suite` | `https://ioumcdhslftdxlauqziz.supabase.co/auth/v1/callback` |
| BrownGlobal Wave | `BrownGlobal Wave` | `https://<project-ref>.supabase.co/auth/v1/callback` |
| BrownGlobal Pay | `BrownGlobal Pay` | `https://<project-ref>.supabase.co/auth/v1/callback` |

BrownGlobal Pay is the shared payment surface for the ecosystem, but it is still an
ordinary OAuth client here: it signs users in with their Verifiedly account and
receives only `openid email profile`. Verifiedly never sends billing state,
saved payment methods, Stripe customer or Connect account IDs, or payout data
through sign-in. Pay resolves its own Stripe customer from the stable Verifiedly
subject (`sub`) in its own database.

### Button asset

Use the official transparent V mark for every "Continue with Verifiedly" button:

```text
https://verifiedly.app/verifiedly-mark.png        (black mark, light UI)
https://verifiedly.app/verifiedly-mark-white.png  (white mark, dark UI)
```

Both are transparent PNGs cropped to the mark, so render them at the button's
icon size (typically 18–20px) with `object-contain` and no background box.

Use confidential clients because the client secret is stored in the consumer Supabase Auth provider configuration. A secret must never be committed, placed in a `VITE_*` variable, copied into browser code, shared between products or pasted into public support messages.

## 3. Websites that intentionally do not receive a client

- **GSN Player Network** remains free and accountless. Player submissions do not require Verifiedly sign-in.
- **BrownGlobal corporate website** currently exposes an admin-only login. Do not add public Verifiedly sign-in until every route has a local admin allowlist or role check. A successful Verifiedly login must never grant BrownGlobal administrative access.
- **Club websites and template previews** do not need a shared-login client unless a real customer-facing account feature is approved later.
- Retired or paused projects should not receive live clients.

## 4. Configure each consumer Supabase project

In **Authentication → Providers → New Provider**, create an auto-discovery OIDC provider:

```text
Identifier: custom:verifiedly
Name: Verifiedly
Issuer: https://pwahrywcgtgfaaghkpoo.supabase.co/auth/v1
Scopes: openid email profile
PKCE: enabled
Email optional: disabled
Client ID: product-specific value from Verifiedly OAuth Apps
Client secret: matching product-specific secret
```

Copy the read-only callback URI shown by the consumer Supabase provider form and confirm it exactly matches the callback registered in Verifiedly.

Under **Authentication → URL Configuration**, add the production origin and only the post-login URLs used by that app. OAuth client callback URIs require exact matches and are separate from ordinary post-login redirect URLs.

## 5. Frontend activation

Consumer repositories use the native Supabase client call:

```ts
const { error } = await supabase.auth.signInWithOAuth({
  provider: "custom:verifiedly" as never,
  options: {
    redirectTo: `${window.location.origin}${safeReturnPath}`,
    scopes: "openid email profile",
  },
});
```

The button stays hidden until the provider is configured. Then set the public build flag and redeploy:

```text
VITE_VERIFIEDLY_OAUTH_ENABLED=true
```

The flag is not a secret. It must not be enabled before the matching custom provider exists, the client ID and secret are installed, and redirect URLs are correct.

## 6. Required end-to-end test for every product

1. Start from the product's sign-in page.
2. Select **Continue with Verifiedly**.
3. Sign in on Verifiedly.
4. Confirm the consent screen names the correct product.
5. Confirm the consent screen lists only account ID, email and basic profile.
6. Approve and confirm a local session is created in the correct consumer Supabase project.
7. Confirm the user returns only to an allowed local path.
8. Sign out and test **Deny**; no local session should be created.
9. Test an existing local account with the same confirmed email before launch.
10. Confirm all staff, organizer, scanner, club and admin roles still come only from the consumer database.
11. Confirm a user with no local privileged role cannot enter privileged routes after Verifiedly sign-in.
12. Test on the production domain and the approved preview environment separately.

## 7. Operational rules

- Use one client per independent Supabase Auth project.
- Use separate clients for production and development when practical.
- Rotate only the affected client's secret if one is exposed.
- Keep the Verifiedly OAuth server and consent page available before enabling consumer buttons.
- Do not copy a secret from one BrownGlobal product to another.
- Do not add custom identity, payment, subscription or authorization claims to ID tokens.
- Keep audit notes of client creation, secret rotation, callback changes and launch tests.

BrownGlobal Holdings LLC is the legal operator. Verifiedly remains the public identity-provider brand.