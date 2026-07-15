
# Verifiedly Pivot: Identity-First Platform

Reposition Verifiedly from "verified link-in-bio" to "verified identity for the internet." Real ID verification (Stripe Identity) is the single path to the blue badge. Users pay a one-time fee that covers Stripe's cost plus margin.

## New positioning

- **Tagline**: "Prove you're real. Once." (or similar — final copy in build)
- **Product**: Verified identity profile + Sign in with Verifiedly (OAuth). Link-in-bio remains but is secondary.
- **Badge**: Blue checkmark = government-ID verified via Stripe Identity. No other path.
- **Pricing**: One-time verification fee ~$5.99 (Stripe Identity costs ~$1.50, ~$4.49 margin). Verifiedly Pro subscription ($9.99/mo) stays for 0% platform fee + Pro pill; **does not** grant a badge.

## What gets removed

1. **Trust Score system entirely**
   - Delete `/dashboard/verification` checklist, `TrustScore.tsx`, `PublicVerification.tsx` (`/verify/:username`), score badges everywhere.
   - Drop DB columns: `profiles.trust_score`, `trust_score_public`, `signal_breakdown_public`, `verified_socials_public`, `payout_status_public`, `trust_score_opt_out`, `is_elite`.
   - Drop tables: `verified_socials`, `trust_score_errors`, `verification_audit_log`, `verification_disputes`.
   - Drop functions: `recompute_trust_score`, `recompute_all_trust_scores`.
   - Retire `verify-social` edge function.

2. **Marketplace / brand campaigns**
   - Delete `/marketplace` route, `Marketplace.tsx`.
   - Drop tables: `brand_campaigns`, `campaign_applications`.
   - Remove from sidebar and landing.

3. **24h Status feature**
   - Delete `StatusRing.tsx`, `StatusComposer.tsx`, `creator_status` table + storage policies.
   - Remove ring from Explore/Profile/Dashboard.

4. **Custom domain verification** — no longer relevant (was a Trust Score signal). Keep the domain field on profile but drop the verification flow.

## What gets added

1. **Stripe Identity verification flow**
   - New edge function `create-identity-session` that creates a Stripe Identity VerificationSession + a $5.99 Checkout for the verification fee (charged first, session created on success).
   - New edge function `stripe-identity-webhook` handling `identity.verification_session.verified` / `.requires_input` / `.canceled` → writes to `profiles`.
   - New page `/dashboard/verification`: single "Verify my identity" CTA, shows status (unverified / pending / verified / failed) and what data is stored.

2. **Real name on profile**
   - New columns: `profiles.verified_full_name`, `verified_first_name`, `verified_last_name`, `verified_dob` (private), `verified_country`, `verification_status`, `verified_at`, `stripe_identity_session_id`.
   - Profile settings toggle: "Show my legal name publicly" (default off). Public profile shows legal name next to display name when enabled.

3. **Age verification badge (OAuth-exposed)**
   - New computed field `is_18_plus` / `is_21_plus` derived from `verified_dob`.
   - `oauth-userinfo` returns `id_verified`, `age_over_18`, `age_over_21`, `verified_country`, `legal_name` (only if requested scope + user opted in).
   - New OAuth scopes: `identity`, `age`, `age.21`, `legal_name`. Existing `trust` scope removed.

4. **Digital ID share card**
   - New route `/verify/:username`: replaces old public verification page. Shows verified checkmark, display name, optional legal name, country flag, age band (if user opted in), QR code linking back.

## What stays

- Link-in-bio (`/username`, bio_links, themes)
- Tips + memberships + digital products + Stripe Connect payouts (unchanged)
- Pro subscription ($9.99/mo, 0% fee)
- Sign in with Verifiedly OAuth (updated scopes)
- Explore (simplified — sort by verified first, then newest)

## Dashboard sidebar (new)

1. Profile (About / Links / Theme tabs)
2. Verification (single ID check)
3. Monetization (Tips / Products / Memberships)
4. Purchases
5. Settings

## Landing page rewrite

- **Hero**: "Prove you're real. Once. Verify once with your government ID. Get a checkmark that works everywhere — your profile, your links, and any site that supports Sign in with Verifiedly."
- **Sections**: How verification works (3 steps: pay → scan ID + selfie → verified) · What you unlock (blue check, real-name option, age proof, SSO) · Pricing (one-time $5.99 verify + optional $9.99/mo Pro for creators who monetize) · Developers (Sign in with Verifiedly for your app).
- Remove: Trust Score explainer, Marketplace mentions, Status/stories mentions.

## Legal & privacy

- Update Privacy Policy: Stripe Identity is a subprocessor, we store verification result + minimal PII (name, DOB, country), not the ID image.
- Update Terms: one-time verification fee is non-refundable once Stripe Identity has run.
- Age scopes on OAuth require user opt-in per-scope; documented on `/developers`.

## Migration order (build phase)

1. Stripe: create `$5.99 one-time` price for ID verification.
2. DB migration: add new columns, drop old tables/columns/functions (destructive — one migration).
3. Edge functions: `create-identity-session`, `stripe-identity-webhook`, update `oauth-userinfo`.
4. Frontend: rewrite `/dashboard/verification`, replace `/verify/:username`, strip Trust Score / Status / Marketplace, update sidebar, update Explore, update landing + pricing + developers pages.
5. Update memory (`mem://index.md`, product positioning, monetization rules, remove retired memories).

## Open items to confirm before build

None blocking — will proceed with $5.99 verification fee unless you say otherwise, keep Pro at $9.99/mo, and destructively drop Trust Score / Marketplace / Status data (no user-facing content lives in those tables today besides the profile fields being replaced).
