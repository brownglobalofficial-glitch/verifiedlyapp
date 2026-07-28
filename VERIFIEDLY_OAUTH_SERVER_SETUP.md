# Verifiedly OAuth 2.1 / OpenID Connect activation

Verifiedly uses the existing Supabase Auth project `pwahrywcgtgfaaghkpoo` as the identity provider. The public consent screen is implemented at `/oauth/authorize` and uses the native `supabase.auth.oauth` methods.

## 1. Enable the OAuth server

In the Verifiedly Supabase project:

1. Open **Authentication → OAuth Server**.
2. Enable OAuth 2.1 server capabilities.
3. Set the authorization path to `/oauth/authorize`.
4. Confirm the Auth Site URL is the production Verifiedly origin, `https://verifiedly.app`.
5. Migrate Auth JWT signing to an asymmetric key such as RS256 or ES256 before requesting the `openid` scope.

Issuer:

```text
https://pwahrywcgtgfaaghkpoo.supabase.co/auth/v1
```

OIDC discovery:

```text
https://pwahrywcgtgfaaghkpoo.supabase.co/auth/v1/.well-known/openid-configuration
```

## 2. Register Kaieteur as a Verifiedly OAuth client

In **Authentication → OAuth Apps**, add a confidential client:

- Client name: `Kaieteur House & Reader`
- Client type: `Confidential`
- Redirect URI: use the exact callback URL displayed when creating the `custom:verifiedly` OIDC provider in the Kaieteur Supabase project `clfdwcvnohxrvqxattvg`.
- Requested scopes: `openid email profile`

The client secret is shown once. Store it only in the Kaieteur Supabase Auth provider settings. Do not commit it, place it in a `VITE_*` variable, or expose it to either website.

## 3. Privacy boundary

Verifiedly sign-in shares only the approved standard OpenID Connect claims. It does not share:

- private documents or uploaded evidence
- payment information
- Stripe Identity files or session details
- credential-verification files
- a trust score, endorsement, or safety rating

## 4. Test

1. Start from Kaieteur House or Kaieteur Reader and select **Continue with Verifiedly**.
2. Sign in to Verifiedly using email and password.
3. Confirm the consent screen names `Kaieteur House & Reader` and lists only `openid`, `email`, and `profile`.
4. Approve access.
5. Confirm the user returns to the correct Kaieteur site with a local Kaieteur Supabase session.
6. Deny a second test and confirm no Kaieteur session is created.

BrownGlobal Holdings LLC controls both the Verifiedly OAuth client registration and the Kaieteur custom provider configuration.