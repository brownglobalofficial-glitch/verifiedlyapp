# tap-card-webhook

The dedicated Stripe webhook records a Verifiedly Tap Card preorder after Stripe sends `checkout.session.completed` with `payment_status=paid`.

The database RPC is idempotent on the Checkout Session ID, so Stripe retries and the main webhook fallback do not create duplicate orders.

Required secret:

```text
STRIPE_TAP_CARD_WEBHOOK_SECRET
```

Endpoint:

```text
https://pwahrywcgtgfaaghkpoo.supabase.co/functions/v1/tap-card-webhook
```
