# Verifiedly — Live Launch Regression

Date: 2026-05-05  
Entity: BrownGlobal Holdings LLC (Georgia, USA)  
Scope: Subscriptions, tips, digital sales, referrals, payout routing, emails.

All flows below have been wired end-to-end and verified against the
production Stripe account and the Lovable Cloud database.

---

## 1. Verifiedly platform subscriptions (Pro / Elite)

- **Checkout**: `create-checkout` edge function creates a Stripe Checkout
  Session with `mode: "subscription"`. Uses live price IDs from
  `src/lib/stripe-config.ts`. Metadata stamped on both the session and the
  subscription: `type=subscription`, `tier`, `user_id`, `referrer_id`.
- **Activation**: `stripe-webhook` handles
  `customer.subscription.created/updated` → flips `profiles.is_pro` /
  `is_elite` and `is_verified` in real time.
- **Self-serve management**: `manage-subscription` supports
  `cancel | resume | pause | unpause`. Surfaced in `/dashboard/billing`
  with the current renewal date.
- **Cancellation**: `customer.subscription.deleted` → tier reverts to
  `free`.
- **Idempotency**: Every webhook event is recorded in `webhook_events`
  with `stripe_event_id` (unique). Repeat deliveries are no-ops.

## 2. Tips

- **UI**: `Tip` button on every creator/business profile (gated by
  `profiles.tips_enabled` and `creator_has_payments(creator_id)`).
- **Toggle**: Creators/businesses can enable/disable tips in
  `Profile Settings → Profile`.
- **Routing**: `create-tip` builds a Checkout Session with
  `payment_intent_data.transfer_data.destination = creator's connect_id`
  and `application_fee_amount` based on tier (10% Free / 5% Pro / 0% Elite).
- **Ledger**: Webhook writes a `payout_ledger` row of
  `transaction_type='tip'` with gross/net/fee and the destination account.

## 3. Digital product sales

- **Checkout**: `create-product-checkout` (destination charge to seller's
  connected account, application fee per seller's tier). $0 products use
  the free-download flow and bypass Stripe entirely.
- **Fulfilment**: Webhook writes `purchases` row + ledger entry of
  `transaction_type='product'` and emails the buyer their download link
  via the `transactional_emails` queue.

## 4. Referral commissions (10%)

- **Capture**: Signup form stores `referred_by` (the referrer's
  `referral_code`) on the new user's profile.
- **Credit**: When a referred user's first
  `invoice.payment_succeeded` fires for a Verifiedly subscription, the
  webhook records a `payout_ledger` row of `transaction_type='referral'`
  for 10% of the net to the referrer.
- **No double-pay**: The unique index
  `payout_ledger (stripe_event_id, transaction_type)` blocks duplicate
  rows on webhook replays. Subsequent invoices on the same subscription
  do not re-credit (the webhook only credits the first paid invoice for
  the subscription).

## 5. Payout routing

- **Platform subscriptions** (Pro / Elite): paid to Verifiedly directly,
  ledger `transaction_type='platform_subscription'`,
  `destination_stripe_account_id=null`.
- **Tips & sales**: routed via Stripe Connect destination charges to
  the seller's `stripe_connect_account_id` minus the platform application
  fee. Ledger row records the destination account and the exact fee.
- **Creator subscriptions**: same routing as tips/sales.

## 6. Email receipts and lifecycle

- **Auth emails**: signup, magic link, recovery, email change — all
  templated TSX via `auth-email-hook` → enqueued to `auth_emails`.
- **Transactional**: purchase receipts sent through the
  `transactional_emails` queue and processed every 5s by
  `process-email-queue` (cron).
- **Suppression**: `suppressed_emails` blocks bounced/complained
  addresses automatically.

## 7. Role gating

- **Fans**: `Dashboard` route force-redirects `account_type='fan'` to
  `/fan`. Fans can only follow creators and view their own purchases /
  subscriptions / received items. They cannot access Stripe Connect,
  product/content management, or the creator dashboard.
- **Logged-out viewers** on creator/business profiles are redirected to
  `/signup?type=fan&returnTo=…` when they try to follow, tip, or buy.

## 8. Tier gating (Pro / Elite features)

- **Premium themes**: All themes other than Classic and Mono show a
  `Pro` lock badge in `Profile Settings → Theme`. Clicking a locked
  theme routes to `/pro`.
- **Advanced analytics**: `/analytics` is wrapped in `<TierLock requires="pro">`.
- The reusable `<TierLock requires="pro|elite" userTier=…>` component is
  the canonical way to gate any new feature going forward.

## 9. Custom domains (Name.com)

- `check-domain` and `purchase-domain` edge functions are deployed and
  authenticated against Name.com v4 (Basic auth with
  `NAME_COM_USERNAME` + `NAME_COM_API_TOKEN`). `purchase-domain`
  validates `purchasePrice` as a number to satisfy Name.com's strict
  contract.

## 10. Database security

- All `SECURITY DEFINER` helper functions had `EXECUTE` revoked from
  `PUBLIC`/`anon`; only the specific roles that need them have grants.
- Trigger-only functions have `EXECUTE` revoked from all roles.
- `payout_ledger` is admin-readable + service-role-insert-only; no
  client-side access.

---

**Result**: All 10 launch regression areas pass. Platform is live-ready.