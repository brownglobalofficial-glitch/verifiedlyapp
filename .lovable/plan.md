
# Verifiedly v2 — Identity-First Profile Pivot

Full pivot. Verifiedly becomes a verified identity card + link-in-bio. No commerce, no followers, no posts.

## 1. What we remove (UI + routes)

- Tips, Digital Products, Subscriptions, Marketplace, Purchases, Memberships, Perks, Earnings, Payouts, Disputes, Refunds, Fee previews.
- Stripe Connect flows: `ConnectPayoutsModal`, `/dashboard/monetization`, `/dashboard/payouts`, `/dashboard/purchases`, `Membership`, `Product`, `ManageProducts`, `ManageSubscriptions`, `ManageContent`, `Marketplace`, `create-connect-account`, `create-tip`, `create-product-checkout`, `create-subscription-checkout`, `download-product`, `sync-connect-status`, `sync-stripe-product`, `verify-checkout-session`, `record-stripe-agreement`, `manage-subscription`.
- Followers/follower_count UI + `FollowButton`. `Explore` (already gone). Trust Score already retired.
- Pro subscription ($9.99/mo) — replaced with new model below.

Tables (`products`, `purchases`, `subscriptions`, `subscription_perks`, `earnings`, `followers`, `creator_content`, `campaigns`, `payout_ledger`, `promo_codes`, `promo_redemptions`) — **kept in DB, unused in UI**, so existing rows aren't destroyed. A follow-up cleanup migration can drop them once we're sure no legacy user needs them.

## 2. Verification — legal answer

**Provider: Stripe Identity stays.** It's the cleanest legally: Stripe is the KYC/data controller for the ID+selfie, we only store the pass/fail result + name/DOB/country. Alternatives (Persona, Veriff, Onfido) cost the same or more and would require us to write our own KYC/AML policy. Plaid Identity ≠ gov ID (it's bank-account owner match). No legitimate free gov-ID verifier exists.

**Can we legally charge? Yes.** Charging a one-time fee for identity verification is legal in the US and most jurisdictions as long as: (a) we disclose that the fee buys a *verification attempt*, not a guaranteed badge; (b) we're not operating as a regulated CRA (we're not — we don't sell reports to third parties); (c) refunds honor the "attempt not badge" language (already in Terms).

**New pricing (identity is now the whole product):**
- **Free:** email + phone + linked social verification (no blue badge, no legal-name display).
- **Verified — $12.99 one-time:** Stripe Identity ID+selfie. Blue badge. Age gates + country available via OAuth.
- **Verifiedly Pro — $4.99/mo (optional):** custom domain, analytics, document vault (below), unlimited section blocks, priority OAuth partner support. Pro does NOT grant a badge — a Pro subscriber still needs the $12.99 ID check.

Rationale for raising to $12.99: Stripe Identity itself costs ~$1.50, plus ongoing infra, and $4.99 left almost no margin. Still cheap for a "once, forever" check.

## 3. Document Vault — the legal question

**What is and isn't legal to store:**
- ✅ **Legal & recommended:** diplomas, certifications (AWS, PMP, etc.), professional licenses (with license number redaction option), CVs, awards, letters. Store encrypted in a private Supabase Storage bucket (`documents`), RLS to owner-only, signed URLs for viewing. Owner chooses per-document whether to display a public "verified document" badge or keep it fully private.
- ⚠️ **Legal but risky:** driver's license images, passport scans. We'll allow these ONLY as private (never public) and gated behind a warning. They're already scanned once by Stripe Identity so storing them again is redundant — we'll **not** offer this by default.
- ❌ **Not doing:** credit cards / payment cards. Storing PANs makes us a **PCI-DSS Level 1+ merchant** even if we tokenize via Stripe — and Stripe's own dashboards don't let cardholders "view their card" for the same reason. Even displaying last-4 back to the user in a "vault" would push us into scope. **Hard no.** Users who want a payment vault should use their bank or Apple/Google Wallet.
- ❌ **Not doing:** SSNs, tax IDs, health records, banking documents. Not our business model, would trigger HIPAA / GLBA / state privacy statutes.

**How the vault works technically:**
- Private storage bucket, AES-256 at rest (Supabase default), TLS in transit.
- RLS: only owner reads. Signed URLs expire in 60s for owner viewing.
- Each doc has: title, type (diploma/cert/license/award/other), issuer, issue_date, expiry_date, is_public, verification_note.
- Public docs render on profile as a card with title + issuer + "Uploaded by owner — not independently verified by Verifiedly" disclaimer (legal shield).
- Pro-only feature.

## 4. New profile builder — "sections"

Fill-in-the-blanks builder. Sections show as empty placeholder cards on the dashboard preview; user fills them and they appear on the public profile.

Default sections (all optional, reorderable):
1. **Header** — avatar, display name, verified legal name (if opted in), tagline, location, pronouns.
2. **About** — short bio (max 280 chars, still email-blocked via existing trigger).
3. **Socials** — round icons for Instagram, Facebook, YouTube, X, TikTok, LinkedIn, Threads, WhatsApp, Website, Email. Real brand logos, monochrome. Each verifiable via existing `verified_socials` flow.
4. **Links** — link-in-bio blocks (existing `bio_links`).
5. **Accomplishments / Milestones** — timeline: title, date, description, optional link. Free-text, owner-attested.
6. **Work** — role, company, start/end, description.
7. **Education** — school, degree, start/end.
8. **Documents** — Pro only. Public-facing verified documents from the vault.

Bio + About kept as separate: bio = one-line under the name; About = paragraph section. If user prefers just one, they leave the About section empty and it hides.

## 5. OAuth ("Sign in with Verifiedly")

- Keep the current provider. Scopes stay: `openid`, `email`, `profile`, `identity`, `legal_name`, `age`, `age.21`, `country`.
- Fix the `/oauth/authorize` UI: currently shows raw code/JSON blob. Replace with a clean branded consent screen (client logo, "GSN wants to know: name, verified identity, age over 18", Approve / Deny).
- Developers page: keep the docs but move code snippets into a collapsed "Integration guide" — the top of the page is marketing/positioning, not a code dump.

## 6. Monetization summary

Only two revenue streams remain:
- **$12.99 one-time** identity verification (bulk of revenue).
- **$4.99/mo Verifiedly Pro** (custom domain, analytics, document vault, priority support).
- (Future) **B2B OAuth partners** — free for small integrations; paid tiers for high-volume identity API access. Not built this pass.

## 7. Implementation phases

**Phase 1 — Teardown (build mode, first pass):**
- Remove commerce routes/pages/components/functions listed in §1 from the router and sidebar.
- Rewrite `/dashboard` sidebar: Profile, Sections, Verification, Documents (Pro), Settings. Remove Monetization / Purchases / Disputes / Payouts / Billing (fold Billing into Settings).
- Delete `useStripeConnect`, `FeePreview`, `FeeBreakdown`, `MembershipTiers`, `UpgradePrompt`'s commerce framing.

**Phase 2 — Rebuild profile builder:**
- New `sections` table (owner-scoped, RLS, GRANTs). Fields: `id, user_id, kind, position, data jsonb, is_public, created_at, updated_at`.
- New dashboard `Sections` page with drag-reorder + inline edit; each section renders a "how it will look" preview when empty.
- Rewrite `CreatorProfile.tsx` to render header + sections + socials + links.
- Rewrite social icons to clean monochrome brand SVGs (add Threads, WhatsApp).

**Phase 3 — Verification pricing update:**
- New Stripe Price for $12.99 one-time. Update `stripe-config.ts`, `create-identity-checkout`, Verification page copy.
- Rework Pro: $4.99/mo, new Stripe price, no included ID check (removes the "one included check" logic — Pro and ID verification are now independent purchases).
- Update Terms/Privacy/Refunds copy.

**Phase 4 — Document Vault (Pro-gated):**
- Private `documents` bucket + `documents` table (owner-scoped RLS, service_role admin).
- Upload UI (PDF/JPG/PNG, 10MB cap), list, delete, toggle public/private.
- Public profile renders public documents with legal disclaimer.
- Explicitly reject uploads flagged as payment cards / SSN via a client-side warning.

**Phase 5 — OAuth consent polish:**
- Rewrite `/oauth/authorize` page: branded card, no raw JSON, clear scope descriptions.
- Move Developers code samples into collapsible sections.

**Phase 6 — Cleanup:**
- Remove now-unused edge functions.
- Update SEO copy sitewide to "Verified identity. One profile. Everywhere."
- Regression pass on sitemap, sitemap.xml, index.html meta.

## Legal / human-review checklist (out of scope for code)

- Terms update for §2 (attempt-not-badge), §4 (document vault user-attested disclaimer), §4 (no card storage).
- Privacy update: Stripe Identity as sub-processor (already there); document vault storage location (Supabase → AWS us-east); explicit "we do not store payment cards".
- Refunds policy: $12.99 non-refundable once ID scan opens; Pro follows monthly cancel-any-time.
- Confirm with counsel that hosting user-uploaded diplomas with a "not verified by us" disclaimer is acceptable in your jurisdictions.

## Open questions for the user before Phase 3–4

- Confirm $12.99 (or prefer $9.99 / $14.99).
- Confirm $4.99/mo Pro (or a different Pro price).
- Should Documents be Free or Pro-only? Plan assumes Pro-only.
- Should we hard-delete the retired commerce tables now, or leave them dormant for 90 days?
