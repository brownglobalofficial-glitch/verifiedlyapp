## Verifiedly refinement pass

### 1. Pricing & fees
- Change ID verification fee: **$5.99 → $4.99** (create new Stripe one-time price; swap `VERIFY_PRICE_ID` in `create-identity-checkout`).
- Verifiedly Pro stays **$9.99/mo** but changes from 0% → **3% platform fee** (new Stripe subscription price). Update `src/lib/stripe-config.ts`, pricing page, upgrade modal, and any fee calc helpers.
- Pro now **includes free ID verification**: if a Pro subscriber hasn't paid the $4.99 fee, skip Checkout in `Verification.tsx` and go straight to `create-identity-session`. Backend `create-identity-session` gets a Pro bypass alongside the existing admin bypass.
- Free tier: still 10% platform fee.

### 2. Verification: Individual vs Business (single account type)
- Signup flow unchanged — one universal account.
- On `/dashboard/verification`, the unverified state shows two cards side-by-side:
  - **Individual** → Stripe Identity (`document` + selfie, current flow).
  - **Business** → Stripe Financial Connections / Identity for company (owner/representative also does an ID scan). Creates a business verification session via Stripe and stores `verification_kind = 'business' | 'individual'`, plus `verified_business_name`, `verified_business_country`, `verified_business_tax_id_last4`.
- Public profile shows a business badge variant (same blue check, but tooltip reads "Verified business") when `verification_kind = 'business'`.
- OAuth `identity` scope returns `verification_kind` so partner sites know person vs business.

### 3. Pro pill removal from public surfaces
- Remove Pro pill from `CreatorProfile.tsx` header and Explore/FeaturedCreators cards. Keep the small "Pro" indicator only inside the dashboard (owner-only) so users know their own plan.
- Public verified checkmark is strictly `id_verified = true`, unchanged.

### 4. Homepage → minimal splash
- Replace current landing (`Index.tsx` renders Navbar/Hero/FeaturedCreators/Pricing/Footer) with a minimal splash: centered V logo, one-line tagline "Prove you're real. Once.", `Sign in` and `Sign up` buttons, tiny footer with Terms/Privacy links.
- Move current pricing content to `/pricing` (accessible from footer). Keep `/developers` intact.
- Signed-in users still auto-redirect to `/dashboard`.

### 5. Monetization QA pass
- **Stripe Connect**: add account-status refresh on `Monetization.tsx` mount + focus (already there — verify it clears "Connect" CTA immediately after webhook). Add explicit error surface if `charges_enabled = false`.
- **Digital product download**: audit `download-product` edge function → confirm signed URL TTL, MIME headers, and `Purchases.tsx` shows a working "Download" button for each `purchases` row. Fix if broken.
- **Membership perks**: audit `subscription_perks` delivery — active subscription must reveal locked `bio_links` (discord/content/discount) on the creator's public profile AND surface them in the buyer's `/dashboard/purchases`. Add a "Perks" section on Purchases showing link + code per active subscription.
- **Tips**: verify `create-tip` uses destination charges to creator's Connect account with the platform fee (3% for Pro creators, 10% for Free).
- **Non-Stripe payouts**: not adding this pass — Stripe Connect only. (Noted for future; Lovable-managed payments don't have a Connect alternative yet.)

### 6. Dashboard & edit profile polish; remove Status
- Delete `StatusRing`, `StatusComposer`, `creator_status` table + storage policies. Remove ring from `CreatorProfile.tsx`.
- Clean `ProfileSettings.tsx`: group into three cards (Basics: display name/username/bio/avatar · Links: bio_links manager · Theme: color/theme picker). Remove any leftover Trust Score toggles, category selector, follower-privacy toggles that are already deprecated.
- Sidebar order: Profile · Verification · Monetization · Purchases · Settings.
- Sidebar collapses cleanly on mobile (audit `DashboardShell` for viewport <768px).

### 7. Legal & 18+ (light touch this pass)
- Signup: add DOB field (required) — client-side enforce 18+ before allowing account creation. Store `date_of_birth` on `profiles` (private column, service-role only).
- Update `Terms.tsx` / `Privacy.tsx` copy to reflect: BrownGlobal Holdings LLC, one-time $4.99 non-refundable verification fee, 3% Pro fee, Stripe Identity + Financial Connections as subprocessors, 18+ requirement, no under-18 accounts.

### 8. Cache/versioning
- Existing service-worker unregister + cache clear in `main.tsx` stays. Bump asset hash version so this deploy invalidates old clients.

---

### Technical details

**DB migration (one file):**
- `ALTER TABLE profiles ADD COLUMN verification_kind text CHECK (verification_kind IN ('individual','business')) DEFAULT 'individual'`
- `ADD COLUMN verified_business_name text`, `verified_business_country text`, `verified_business_tax_id_last4 text`, `date_of_birth date`
- Column-level revoke `date_of_birth` from anon/authenticated.
- `DROP TABLE creator_status CASCADE` + storage bucket cleanup.

**Stripe:**
- Create new products: `$4.99` one-time (ID verify), `$9.99/mo` Pro v2 (3% fee semantic — the fee is enforced at charge time in edge functions, not on the price).
- Store new price IDs in `src/lib/stripe-config.ts` and the identity checkout function.
- Update `create-tip`, `create-product-checkout`, `create-subscription-checkout` fee logic: Pro → 3%, Free → 10%.

**Edge functions to touch:**
- `create-identity-checkout` (price change + Pro bypass)
- `create-identity-session` (Pro bypass, business branch)
- `stripe-webhook` (handle business verification events + new subscription price)
- `create-tip`, `create-product-checkout`, `create-subscription-checkout` (3% fee for Pro creators)
- `oauth-userinfo` (add `verification_kind`)

**Files to delete:** `src/components/StatusRing.tsx`, `src/components/dashboard/StatusComposer.tsx`, related refs in `CreatorProfile.tsx` and `Dashboard.tsx`.

**Out of scope this pass (queued for next):** Instagram/YouTube/TikTok OAuth APIs (skipped — you chose handles-as-links), PayPal/crypto payouts (skipped — Stripe Connect only), full legal rewrite audit (light copy pass only), international payment rails beyond Stripe.

Approve to build?
