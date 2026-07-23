# Verifiedly Tap — Build Plan

## Decisions locked in from your answers
- **Product name:** Verifiedly Tap
- **Card pricing:** $19 retail · $12 for Pro members · Free with annual Pro
- **Pro plans:** $9.99/mo (existing) · **$99/yr** new annual (2 months free, includes 1 free Tap card)
- **Stripe:** you'll create a dedicated Verifiedly account under your Stripe Org, then I'll swap `STRIPE_SECRET_KEY`

## What gets built

### 1. Stripe products (created after you swap the key)
- `Verifiedly Tap` — one-time $19 (`price_tap_retail`)
- `Verifiedly Tap — Pro discount` — one-time $12 (`price_tap_pro`)
- `Verifiedly Pro Annual` — recurring $99/yr (`price_pro_annual`)
- Existing $9.99/mo Pro price stays as-is

### 2. Database (new migration)
- `tap_card_orders` — id, user_id, status (`pending|paid|shipping|delivered|cancelled`), price_paid_cents, discount_type (`retail|pro|annual_free`), shipping_name, shipping_line1/line2/city/state/postal/country, tracking_number, stripe_session_id, created_at, updated_at
- `profiles` add: `annual_tap_card_claimed boolean default false` (prevents double-claiming free card)
- RLS: users read/insert own orders; admin (`has_role`) reads/updates all
- GRANTs to `authenticated` and `service_role`

### 3. Edge functions
- `create-tap-checkout` — determines eligibility (Pro? Annual? Already claimed free card?), picks the correct price, creates Stripe Checkout session with shipping address collection, inserts pending order row
- Extend `stripe-webhook` — on `checkout.session.completed` for Tap sessions, mark order paid, capture shipping address, mark `annual_tap_card_claimed=true` if free-card path

### 4. Frontend
- **New route `/dashboard/tap-card`** (sidebar item "Tap card")
  - Explains what it is (NFC card → your Verifiedly profile)
  - Shows current price tier the user qualifies for
  - "Order Tap card" button → checkout
  - Order history with status + tracking
- **Pricing page update**: add Pro Annual toggle (Monthly / Annual), show "Free Tap card included" on annual
- **Landing hero**: add small "Tap card available" line under the CTA (no separate marketing section — keeps splash minimal per your style)
- **Admin page**: new `/admin/tap-orders` for fulfillment (list orders, mark shipped, add tracking number)

### 5. Discount + free-card logic
- If user has `subscribed = true` (any Pro plan) → $12 price
- If user has active annual Pro AND `annual_tap_card_claimed = false` → $0 checkout (Stripe free session, still collects shipping)
- Otherwise → $19 price

## Order of operations
1. You create the Verifiedly Stripe account under your Org, generate a live + test secret key, and paste the test key via the secret update flow.
2. I create the three Stripe products/prices in the new account.
3. I ship the migration, edge functions, and UI in one pass.
4. You test-order a card end-to-end, then flip to live key.

## Out of scope for this pass
- Physical NFC encoding / fulfillment vendor integration (manual admin marks shipped for now — we can automate with a fulfillment provider later)
- International shipping cost tiers (flat rate included in price to start)

Approve and I'll start with the Stripe key swap step.
