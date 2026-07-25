# confirm-tap-checkout

Authenticated return-page fallback for a paid Verifiedly Tap Card preorder.

The signed Stripe webhooks are the primary recording path. This function retrieves the Checkout Session, confirms the signed-in user owns it, checks payment status, and calls the same idempotent database order function so the customer can see the preorder immediately after returning from Stripe.
