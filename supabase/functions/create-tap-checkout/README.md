# create-tap-checkout

Creates a Stripe-hosted one-time payment for a personalized Verifiedly Tap Card paid preorder.

## Live launch flag

Live charging requires one of these Supabase Edge Function secrets:

```text
TAP_CARD_PREORDERS_ENABLED=true
```

or the backwards-compatible:

```text
TAP_CARD_ORDERS_ENABLED=true
```

Test-mode Stripe keys can exercise the flow while the live flag remains disabled.

## Required secrets

```text
STRIPE_SECRET_KEY
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

The function accepts card payments only, calculates the $29.99 retail or $19.99 active-Pro price on the server, locks the handle to the authenticated profile, and sends the exact approved print and shipping snapshot through Stripe metadata.
