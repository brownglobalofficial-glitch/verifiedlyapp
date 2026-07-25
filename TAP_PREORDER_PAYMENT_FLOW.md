# Tap preorder payment and order recording

```text
Customer approves card and address
        ↓
create-tap-checkout validates the authenticated account
        ↓
Stripe Checkout charges the one-time preorder
        ↓
checkout.session.completed reaches signed webhook
        ↓
record_verifiedly_tap_card_order runs idempotently
        ↓
Customer and admin see one paid preorder
        ↓
BrownGlobal manually submits it to the supplier
```

The redirect confirmation is a convenience fallback. Signed webhooks are required for reliable payment recording.
