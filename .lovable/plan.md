
# Verifiedly v2 — Refine, Verify, Open Up

This plan does four things at once: (1) finishes the verification product so it's safe and disputable, (2) ships SSO as a real drop-in for our sibling apps, (3) locks in the product decisions you made (earned-only badge, Stripe-only money, no wallet), and (4) cuts the fat so the site stops feeling like a kitchen sink.

## Product decisions locked in

- **Badge = earned only.** Trust Score ≥ 80 → "Verified". ≥ 95 → "Elite Verified". No pay-to-verify. The Elite plan stops granting a badge tier; Elite is purely fee structure + perks now. This is the most defensible legal stance — factual signals, no endorsement.
- **No wallet.** All money flows Stripe Connect → creator. Globalis keeps its own credit system; we do not mirror it. Removes money-transmitter licensing exposure entirely.
- **Pricing stays 3 tiers** but reframed: Free (10% fee), Pro $4.99 (5% fee + priority verification re-checks), Elite $19.99 (0% fee + advanced analytics). No badge tied to payment.

## 1. Privacy controls (new page: `/dashboard/privacy`)

Per-creator switches stored on `profiles`:
- Hide trust score from public profile (`trust_score_public`)
- Hide verified socials list from `/verify/:username` (`verified_socials_public`)
- Hide individual signal breakdown, show badge only (`signal_breakdown_public`)
- Hide email-confirmed / Stripe-connected indicators (`payout_status_public`)
- One-click **remove a verified social** (deletes row + recomputes score)
- One-click **opt out of Trust Score entirely** — sets `trust_score_opt_out = true`, badge disappears, public page shows "This creator has opted out of public verification."

`/verify/:username` and `CreatorProfile.tsx` respect each flag.

## 2. Dispute flow

New table `verification_disputes` (user_id, social_id nullable, signal_type, reason, status: `pending|reviewing|resolved|rejected`, admin_note, created_at).

- On a failed `verify_social` attempt, a "Request manual review" button appears.
- Submission goes into the dispute queue; creator sees status in **Verification → Disputes** tab.
- Pro/Elite get priority queue flag.
- Admin resolves → on approve, the social row flips to `verified` and trust score recomputes.

## 3. Admin panel additions (`/admin/verification`)

Gated by existing `has_role(uid, 'admin')`.
- **Disputes queue** — review, approve, reject, leave note.
- **Failed-recompute log** — new `trust_score_errors` table populated by the nightly cron when a recompute throws; admin can re-run per user.
- **OAuth client management** — list `oauth_clients`, view client_id, **rotate client_secret** (regenerates, hashes new, returns plaintext once). GSN + Globalis rows seeded.
- **Manual signal override** — admin can flip a single signal verified/unverified with audit trail (`verification_audit_log`).

## 4. OG metadata with verification state

Add `react-helmet-async` to `CreatorProfile.tsx`:
- `og:title` = "@username · Verified on Verifiedly" (if verified) / "@username on Verifiedly" (otherwise)
- `og:description` includes trust tier
- `og:image` → new edge function `og-card` that renders a 1200×630 PNG with avatar, name, and badge state (verified / pending / unverified). Cached per-username, busted on score change.
- Same on `/verify/:username`.

Note: social crawlers don't run JS, so we also generate a static fallback per profile at build/publish time isn't possible — the edge function returning a real image is the right path. I'll be honest with you: LinkedIn/Slack cache aggressively, so changes take time to propagate.

## 5. Sign in with Verifiedly — drop-in snippet

- New public route `/developers` documenting the OAuth2 flow, scopes (`openid profile trust`), and userinfo response shape.
- Publishable npm-style snippet in docs:
  ```tsx
  <SignInWithVerifiedly clientId="gsn_xxx" redirectUri="..." scope="openid profile trust" />
  ```
- Ships as a copy-paste React component (not a real package — keeps it zero-infra). GSN/Globalis paste it in.
- `oauth-userinfo` already returns `trust_score`, `verified`, `tier` — no changes needed.

## 6. Simplification pass (the big one)

### Remove entirely
- **Marketplace / brand_campaigns / campaign_applications** — barely-used, complicates the value prop. Tables stay (data preserved) but routes + nav entries removed.
- **Social analytics page** — replaced by a single stat on the dashboard.
- **Promo codes from main nav** — moved into Settings.
- **Subscription perks page from main nav** — folded into the subscription tier editor.
- **Explore page** — keep but only visible to logged-in users (per your pick).

### Restructure dashboard nav (5 items, not 12)
```
Home          → overview + quick stats
Profile       → links, products, content
Verification  → score, socials, disputes
Earnings      → payouts, purchases, subscribers
Settings      → privacy, plan, promo codes, perks, account
```

### Copy/wording overhaul
- Hero: "One verified link. Every way to get paid." (kept)
- Sub: "Verifiedly is the verified identity and payments layer for creators. Earn your badge through real signals — no pay-to-verify."
- Pricing reframed around **fee + features**, not badges.
- Footer trimmed to 3 columns.
- Remove every "AI-powered" / "next-gen" / generic-startup phrase.

## 7. Memory + legal

- Update `mem://product/positioning` and `mem://business/monetization-rules` to reflect earned-only badge and no-wallet stance.
- Add one paragraph to Terms: "Verification reflects automated checks of public signals. It is not an endorsement, KYC, or guarantee of identity."

---

## Technical details

**Migrations (one file)**
- `profiles`: add `trust_score_opt_out bool`, `trust_score_public bool default true`, `verified_socials_public bool default true`, `signal_breakdown_public bool default true`, `payout_status_public bool default true`.
- New tables: `verification_disputes`, `trust_score_errors`, `verification_audit_log`. All with GRANTs (authenticated for own rows, service_role for admin/edge), RLS, policies using `has_role(auth.uid(),'admin')` for admin reads.
- `oauth_clients`: add `client_secret_hash` (already there) + `rotated_at`.
- Update `recompute_trust_score`: respect `trust_score_opt_out` (returns 0, skips badge).

**Edge functions**
- New `og-card` — returns PNG using `@vercel/og`-style approach via `npm:satori` + `npm:resvg-wasm` (or simpler: SVG-to-PNG via canvas — final call at build).
- New `dispute-submit`, `admin-resolve-dispute`, `admin-rotate-oauth-secret`, `admin-recompute-user`.
- Update nightly cron: wrap recompute in try/catch, log failures to `trust_score_errors`.

**Frontend**
- New pages: `src/pages/dashboard/Privacy.tsx`, `src/pages/dashboard/Disputes.tsx` (tab inside Verification), `src/pages/admin/VerificationAdmin.tsx`, `src/pages/Developers.tsx`.
- New component: `src/components/SignInWithVerifiedlySnippet.tsx` (a code-block displayer).
- Install `react-helmet-async`, wrap app, update `CreatorProfile.tsx` + `PublicVerification.tsx`.
- Route + nav cleanup in `src/App.tsx` and dashboard layout.

**Out of scope**
- Wallet, credits, KYC, ID checks, paid verification, GSN/Globalis-side integration code (snippet only).

---

Ready to build on approval. After implementation I'll run a Playwright pass on the dashboard nav, /verify/:username, and the OG image endpoint to confirm everything renders cleanly.
