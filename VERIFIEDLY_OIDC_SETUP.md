# Verifiedly OAuth 2.1 / OpenID Connect setup

Verifiedly uses the existing Supabase project as the shared account provider for approved BrownGlobal applications.

- Supabase project reference: `pwahrywcgtgfaaghkpoo`
- Issuer: `https://pwahrywcgtgfaaghkpoo.supabase.co/auth/v1`
- OIDC discovery: `https://pwahrywcgtgfaaghkpoo.supabase.co/auth/v1/.well-known/openid-configuration`
- Consent page: `https://verifiedly.app/oauth/consent`

The application code contains the consent screen and fast profile onboarding. The following dashboard steps must be completed by an authorized BrownGlobal administrator before production clients can sign in.

## 1. Migrate JWT signing to an asymmetric key

The current project uses an HS256 signing key. OpenID Connect ID tokens require an asymmetric signing algorithm.

In the Verifiedly Supabase dashboard:

1. Open **Project Settings → JWT Keys**.
2. Create and migrate to an **RS256** or **ES256** signing key.
3. Allow the recommended overlap period so current sessions can continue during migration.
4. Confirm the JWKS endpoint exposes the new public key.

Do not share the old JWT secret or any private signing key with connected applications.

## 2. Configure the Verifiedly application URLs

In **Authentication → URL Configuration**:

1. Set the production Site URL to `https://verifiedly.app`.
2. Add `https://verifiedly.app/auth/callback` to the permitted redirect URLs.
3. Add the current Lovable production and preview callback URLs needed for testing.
4. Keep production callback URLs on HTTPS.

General Auth redirect URLs and OAuth-client redirect URIs are separate settings.

## 3. Enable the native OAuth 2.1 server

In **Authentication → OAuth Server**:

1. Enable OAuth 2.1 server capabilities.
2. Set the Authorization Path to `/oauth/consent`.
3. Save the configuration.

Supabase will then expose the native authorization, token, discovery, and JWKS endpoints. The Verifiedly frontend handles the consent UI at `/oauth/consent`.

## 4. Register one OAuth client per application

In **Authentication → OAuth Apps**, create separate production clients for the applications that will use **Continue with Verifiedly**.

Recommended clients:

- GSN Media
- GSN Player Network
- GSN Club Network
- GSN Next
- GSN Tickets
- Globalis
- BrownGlobal partner portal, only if a login area is later added

For each client:

1. Use the exact application name and logo.
2. Copy the callback URL shown by that application's Supabase custom-provider setup.
3. Register the full callback URL exactly. OAuth-client redirect URIs do not use wildcards.
4. Use a confidential client when the connected Supabase project will hold the client secret server-side.
5. Save the client ID and the one-time client secret securely.
6. Use separate clients for development, preview, and production when practical.

Do not commit client secrets to GitHub, put them in browser code, or expose them through `VITE_*` variables.

## 5. Configure Verifiedly in each connected Supabase project

In the connected application's Supabase dashboard:

1. Open **Authentication → Providers**.
2. Add a new custom provider.
3. Choose **Auto-discovery (OIDC)**.
4. Use identifier `custom:verifiedly`.
5. Use issuer `https://pwahrywcgtgfaaghkpoo.supabase.co/auth/v1`.
6. Enter the matching Verifiedly OAuth client ID and secret.
7. Request only `openid profile email` for the initial launch.
8. Enable the provider.
9. Add the connected application's own `/auth/callback` URL to its normal Auth redirect allowlist.

The provider screen displays a callback URL. That exact URL must also be registered on the corresponding OAuth client in the Verifiedly project.

## 6. Add the button to a connected application

```ts
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: "custom:verifiedly",
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
});

if (error) throw error;
```

On the connected application's callback route:

```ts
const code = new URLSearchParams(window.location.search).get("code");
if (!code) throw new Error("Missing authorization code");

const { data, error } = await supabase.auth.exchangeCodeForSession(code);
if (error) throw error;
```

The connected application then uses its own local Supabase session, roles, RLS policies, and product-specific tables.

## 7. Data boundaries

The initial OIDC integration uses only standard scopes:

- `openid`: stable account subject
- `profile`: standard name, handle, and profile-picture claims
- `email`: account email

Do not put these items in standard sign-in tokens:

- Stripe Identity session IDs
- identity-document images
- private documents
- credentials or uploaded evidence
- payment methods
- private messages
- subscription or purchase history
- GSN player rankings
- club permissions that have not been confirmed by the connected app

Verifiedly identity verification and organizational-role confirmation remain separate trust features. A connected application must still verify product-specific roles, such as whether a person is authorized to act for a football club.

## 8. Migration from the old custom OAuth code

The repository still contains the older custom OAuth tables and Edge Functions so existing experiments are not deleted abruptly. New first-party integrations must use the native Supabase OAuth 2.1/OIDC server.

After all connected applications have migrated and production sign-in is tested:

1. Confirm no active client uses the old `/functions/v1/oauth-*` endpoints.
2. Revoke old custom tokens and client secrets.
3. Remove the obsolete routes, functions, and tables in a separate reviewed migration.
4. Keep an audit record of the migration.

## 9. Production test checklist

Before enabling the sign-in button publicly, test:

- new email signup and email confirmation
- Google and Apple signup
- one-minute onboarding
- returning-user login
- consent approval and denial
- exact redirect URI enforcement
- PKCE and state handling through Supabase
- revoked or disabled clients
- account sign-out and session revocation
- user metadata updates after profile changes
- mobile and desktop redirects
- RLS in every connected application
- account deletion and privacy-request workflows
