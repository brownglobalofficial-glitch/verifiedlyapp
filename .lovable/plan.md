
## What I'll ship this pass

### Dashboard (`src/pages/Dashboard.tsx`)
- Remove the Pro pill from the profile header card (public + dashboard views).
- Remove the `TrustScore` badge from the top of the dashboard.
- Add a **Profile completion** progress bar showing % done and the remaining checklist items: avatar, bio ≥ 10 chars, ≥ 1 link, verified email, verified identity, Stripe payouts connected (only if monetization enabled).
- Copy audit: strip any leftover "0% fee", "Elite", "Trust Score" wording.

### Public profile (`src/pages/CreatorProfile.tsx`)
- Remove `<TrustScore …/>` from the profile header (identity badge from `id_verified` stays).
- Remove the celebration copy that says "0% platform fee is active".
- Remove the Pro pill entirely from public view (confirm previous change stuck).

### Business verification
- On `/dashboard/verification`, keep the Individual / Business toggle. Business path still uses the owner's Stripe Identity ID scan + selfie plus `verified_business_name` / `verified_business_country` — clarify the copy: "Business accounts verify the owner's identity. Your business name and country appear on your public profile once approved."
- `oauth-userinfo` already emits `verification_kind` + `business_name` — no change.

### Stripe Identity actually charging + running
- Verify `create-identity-checkout` returns a `url` for non-Pro users and `pro_bypass:true` for Pro. Fix the client to call `create-identity-session` immediately when `pro_bypass` is returned, and after the Checkout redirect returns with `?paid=1`. Show a clear error if either edge function returns non-2xx (surface `error` field to a toast).
- Add explicit logging + a "Retry ID scan" button on `/dashboard/verification` when `verification_status = 'paid'` but no `stripe_identity_session_id` yet.

### Fees copy (Free 10%, Pro 3%; no 0% anywhere)
- `src/lib/stripe-config.ts`: remove the `elite` entry (or keep only as legacy read for old subscribers — no UI surface).
- Sweep `create-tip`, `create-product-checkout`, `create-subscription-checkout`: keep the `is_elite → 0%` legacy path (grandfathered) but do NOT advertise it. Landing / Pricing / Dashboard show only Free 10% and Pro 3%.
- Add a small "Fees" explainer on the Monetization page: "You (the seller) pay Stripe processing fees (~2.9% + 30¢) + Verifiedly's platform fee (10% Free / 3% Pro) out of each sale. Buyers pay the sticker price."

### Secure digital downloads
- `download-product` edge function: require auth, verify the requesting user has a completed `purchases` row for the product OR an active `subscriptions` row on a tier that includes the product. Return a short-lived signed URL from the `product-files` private bucket (60s TTL). Reject otherwise with 403.
- Update `/dashboard/purchases` UI to call `download-product` (no direct storage URLs).

### Privacy page + linking
- Rewrite `src/pages/Privacy.tsx` with BrownGlobal Holdings LLC, Stripe Identity data handling (DOB, ID doc, selfie retained by Stripe, not us), Cloud/DB storage, cookies, retention, deletion request via `support@verifiedly.app`.
- Ensure Privacy + Terms links appear in: Signup footer, Login footer, Dashboard sidebar footer, ProfileSettings legal section.

### ProfileSettings mobile-first refactor
- Rewrite `src/pages/ProfileSettings.tsx` as a stacked card layout (Basics, Links, Theme, Legal) — single column on mobile, 2-col on ≥ md. Sticky "Save" bar at bottom on mobile. Remove Elite references.

### SEO per-profile
- `CreatorProfile`: dynamic `<title>{display_name} (@{username}) · Verifiedly</title>`, meta description from bio (first 155 chars), canonical `https://verifiedly.app/{username}`, `og:title`, `og:description`, JSON-LD `Person` schema with `@id` and (if verified) `identifier` note.

### Existing users
- All migrations are additive / column-level — no data deletion. `is_elite = true` accounts keep their existing 0% grandfathered rate silently.

---

## Not in this pass — need your call

1. **International payouts beyond Stripe Connect.** Real options: **Paddle** (merchant-of-record, covers ~200 countries including places Stripe Connect Express doesn't payout to — e.g. most of Africa, parts of Asia/LatAm). Downsides: 5% + 50¢ per transaction (higher than Stripe), Paddle's brand appears on statements, restricts some product categories. **Wise Payouts** and **PayPal Payouts** are lower-friction but require our own KYC + money-transmitter posture — not viable for us near-term. My recommendation: keep Stripe Connect as primary, add Paddle as a fallback ONLY for countries Stripe Connect can't onboard. Want me to enable Paddle now or defer?

2. **"Look like top creator monetization platforms"** — too fuzzy to ship blindly. Want me to spin up 2-3 design directions for the dashboard shell + public profile in a follow-up, or is the current B&W minimalist direction locked?

Reply "go" to ship everything in "What I'll ship this pass" and I'll implement it in one batch. Answer #1 and #2 in the same message if you want them included.
