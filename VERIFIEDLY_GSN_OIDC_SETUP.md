# Verifiedly sign-in for the GSN ecosystem

Verifiedly is the identity provider. Each GSN product keeps its own Supabase Auth project, local users, roles and Row Level Security policies.

Use Supabase's native OAuth 2.1 / OpenID Connect server and custom OIDC provider support. Do not use the retired custom `oauth-token`, `oauth-userinfo`, magic-link exchange, `trust` scope, trust scores or verification claims for sign-in.

## Privacy boundary

Every GSN client requests only:

```text
openid email profile
```

Verifiedly sign-in may share the stable account subject, confirmed email status, display name and profile image. It must not share private documents, Stripe information, identity files, credential evidence, verification provider records, trust scores, subscriptions or payment status.

## 1. Activate Verifiedly as the provider

In the Verifiedly Supabase project `pwahrywcgtgfaaghkpoo`:

1. Open **Authentication → OAuth Server**.
2. Enable OAuth 2.1 server capabilities.
3. Set the Auth Site URL to `https://verifiedly.app`.
4. Set the authorization path to `/oauth/authorize`.
5. Migrate Auth JWT signing to an asymmetric key such as RS256 or ES256 before using the `openid` scope.
6. Confirm the consent page at `https://verifiedly.app/oauth/authorize` is deployed.

Issuer:

```text
https://pwahrywcgtgfaaghkpoo.supabase.co/auth/v1
```

OIDC discovery:

```text
https://pwahrywcgtgfaaghkpoo.supabase.co/auth/v1/.well-known/openid-configuration
```

## 2. Register one confidential Verifiedly client per GSN product

Create separate clients in **Authentication → OAuth Apps**. OAuth redirect URIs must match exactly.

### GSN main website

- Client name: `GSN`
- Redirect URI: `https://sjlrxwxewiqholmwllxv.supabase.co/auth/v1/callback`
- Scopes: `openid email profile`

### GSN Clubs

- Client name: `GSN Clubs`
- Redirect URI: `https://wbsbxevbxyawpqgtnvge.supabase.co/auth/v1/callback`
- Scopes: `openid email profile`

### GSN Tickets

- Client name: `GSN Tickets`
- Redirect URI: `https://lcgxaidibaihrhmtnyap.supabase.co/auth/v1/callback`
- Scopes: `openid email profile`

### GSN Next

- Client name: `GSN Next`
- Redirect URI: `https://bjkutqlluhsolcvdeihe.supabase.co/auth/v1/callback`
- Scopes: `openid email profile`

Use confidential clients. Store each secret only in the matching GSN Supabase custom-provider configuration. Client secrets are shown once and must never be committed, placed in `VITE_*` variables, copied into browser code or shared between products.

GSN Player Network does not receive an OAuth client. Player submissions remain free and accountless; only GSN staff use its private editorial admin.

## 3. Configure each GSN Supabase project

In each consumer project, open **Authentication → Providers → New Provider** and create an auto-discovery OIDC provider:

- Identifier: `custom:verifiedly`
- Name: `Verifiedly`
- Issuer: `https://pwahrywcgtgfaaghkpoo.supabase.co/auth/v1`
- Client ID: the product-specific Verifiedly OAuth client ID
- Client secret: the matching product-specific secret
- Scopes: `openid`, `email`, `profile`
- PKCE: enabled
- Email optional: disabled

Copy the read-only callback URL shown by Supabase and confirm it exactly matches the redirect URI registered in Verifiedly.

Add each production app origin and required post-login paths to the consumer project's **Authentication → URL Configuration → Redirect URLs**.

## 4. Enable the prepared buttons

The GSN repositories hide Verifiedly sign-in until the provider is configured. After completing the dashboard setup, add this public feature flag to the matching project and redeploy:

```text
VITE_VERIFIEDLY_OAUTH_ENABLED=true
```

The flag is not a secret. The OAuth client secret remains only in Supabase Auth provider settings.

## 5. Test every product

For each GSN client:

1. Start from the product's sign-in page and select **Continue with Verifiedly**.
2. Sign in on Verifiedly.
3. Confirm the consent screen names the correct GSN product and lists only account ID, email and basic profile.
4. Approve and confirm a local session is created in the correct GSN Supabase project.
5. Sign out and test denial; no local session should be created.
6. Test an existing local account with the same confirmed email and verify Supabase's account-linking behavior before launch.
7. Verify local roles are not granted from Verifiedly claims. Organizer, operator, scanner and admin permissions must still come from the GSN product's own database.

## Retired flow

Do not reactivate the old `gsn_app` client, custom browser authorization URL, `trust` scope, plaintext custom access-token table or magic-link session minting. Native OIDC is the supported architecture for all new GSN integrations.
