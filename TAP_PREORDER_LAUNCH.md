# Verifiedly Tap paid preorder launch

Verifiedly Tap uses Stripe Checkout for a one-time paid preorder and BrownGlobal manual fulfillment.

## Customer flow

1. The signed-in customer edits the locked white Verifiedly card preview.
2. The customer approves the printed name, title, handle, shipping address, and preorder disclosure.
3. Stripe Checkout charges $29.99, or $19.99 when the server confirms active Verifiedly Pro.
4. A signed Stripe webhook records the order only after payment is confirmed.
5. The paid preorder appears in `/dashboard/admin/tap-orders`.
6. BrownGlobal reviews the approved snapshot and manually places the supplier order using the locked `verifiedly-pvc-white-v1` template.
7. BrownGlobal saves the supplier order ID, production status, tracking number, and tracking URL.
8. The customer sees updates in Verifiedly and can receive status emails.

## Required production deployment

Deploy the latest versions of:

- `create-tap-checkout`
- `confirm-tap-checkout`
- `tap-card-webhook`
- `stripe-webhook`
- `notify-tap-order-status`

The frontend preorder interface is enabled by:

```text
VITE_TAP_CARD_PREORDERS_ENABLED=true
```

Live server-side charging remains protected by:

```text
TAP_CARD_PREORDERS_ENABLED=true
```

Only BrownGlobal's authorized adult should enable the live server flag after completing the checklist below.

## Stripe configuration

Keep all secrets in Supabase Edge Function secrets, never in frontend variables or GitHub:

- `STRIPE_SECRET_KEY`
- `STRIPE_TAP_CARD_WEBHOOK_SECRET`
- `STRIPE_WEBHOOK_SECRET` for the main fallback webhook

The dedicated Tap endpoint is:

```text
https://pwahrywcgtgfaaghkpoo.supabase.co/functions/v1/tap-card-webhook
```

Subscribe it to:

```text
checkout.session.completed
```

The Checkout function accepts card payments only so successful paid preorders can be recorded immediately. The main Stripe webhook remains an idempotent fallback.

## Required test before live preorders

Complete one Stripe test-mode checkout and verify all of these:

- Checkout opens from mobile and desktop.
- The charged amount is $29.99 for Free or $19.99 for active Pro.
- Stripe shows `checkout.session.completed` delivered with HTTP 200.
- Exactly one preorder appears in `verifiedly_tap_card_orders`.
- Exactly one card and NFC redirect are created.
- The preorder appears in the customer account.
- The preorder appears in the admin manual-fulfillment queue.
- The approved name, title, handle, address, QR URL, NFC URL, and template version are correct.
- A duplicate webhook delivery does not create a duplicate order.
- A canceled Checkout Session creates no order.

## Manual supplier process

Use the supplier dashboard manually for the first preorder batch. Every supplier order must use the same locked template and only these variable fields:

- printed name
- printed title
- Verifiedly handle
- QR image
- unique `/t/` NFC URL
- card serial
- shipping address

Record the supplier name and supplier order ID in the admin queue. Use CSV import when the supplier returns tracking in a spreadsheet. Move to an API only after manual fulfillment is reliable and volume makes manual entry inefficient.

## Mobile regression sizes

Check at least:

- 320 × 568
- 360 × 800
- 375 × 812
- 390 × 844
- 412 × 915
- tablet portrait and landscape

Test the Tap preview, print fields, address fields, disclosures, checkout button, Pro button, customer order cards, and admin fulfillment queue. No page should create horizontal scrolling.

## Preorder disclosure

The customer must see before payment that:

- this is a paid personalized preorder;
- Stripe charges the amount now;
- BrownGlobal manually reviews and submits the order to a third-party manufacturer;
- production and delivery timing can vary;
- the customer should not preorder when a fixed delivery date is required; and
- cancellations, refunds, defects, and replacements follow the posted policy.

Have BrownGlobal's authorized adult review Stripe, tax, supplier, fulfillment, terms, and refund settings before public promotion.
