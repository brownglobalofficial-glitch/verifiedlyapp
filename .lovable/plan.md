# Verifiedly Repositioning Plan

Shift from "creator monetization platform" → **"Verified identity layer for the internet economy."** Monetization stays exactly as-is (Stripe Connect, tiers, products, tips). We add identity, a light Trust Score, "Sign in with Verifiedly" SSO for GSN/Globalis/partners, and an optional embedded Globalis AI companion.

## Legal note on Trust Score
A Trust Score is legal as long as it is **factual, transparent, and not defamatory**. We will:
- Only score signals the user explicitly connected (socials, email, payout, ID-optional).
- Show the user exactly what raises/lowers their score and let them dispute/remove signals.
- Never label anyone "untrustworthy" — only show what *is* verified ("Email verified", "Stripe payouts active", "TikTok connected").
- No score sold to third parties without consent.
This mirrors how LinkedIn "All-Star" or eBay seller ratings work and is well within US/EU law.

## Phase 1 — Verified Identity (ship first)

### New brand frame
- New homepage hero copy: **"One verified link. Every way to get paid."**
- Sub: "Verifiedly is the identity + payments layer for creators, brands, and the apps they use."
- Update landing sections (`Hero`, `Features`, footer tagline) — same B&W aesthetic, no visual redesign.

### Verification signals (light, no government ID)
Add to onboarding + profile settings:
| Signal | Source | Points |
|---|---|---|
| Email confirmed | Supabase auth | 10 |
| Username claimed | profiles | 5 |
| Avatar uploaded | profiles | 5 |
| Bio + ≥1 link | profiles + bio_links | 10 |
| Stripe Connect active (`charges_enabled`) | creator_private_data | 30 |
| ≥1 social verified (Instagram/TikTok/X/YouTube via OAuth or DNS-style code) | new `verified_socials` table | 15 each, cap 30 |
| Domain verified (optional, TXT record) | new column | 10 |

Total visible as **0–100 Trust Score** with three public tiers:
- **Verified** (≥60): black check on profile.
- **Trusted** (≥80): black check + "Trusted" pill.
- **Elite Verified** (≥95 *and* on Elite plan): filled star.

This **replaces** the current Pro/Elite-only checkmark logic but does not remove paid tiers.

### Schema additions
- `verified_socials(id, user_id, platform, handle, verified_at, method)` + RLS.
- `profiles.trust_score int default 0`, `profiles.domain_verified bool default false`.
- DB function `recompute_trust_score(_user_id)` (security definer) called on relevant inserts/updates.

### UI
- New **Verification** tab in dashboard showing each signal + how to complete it.
- Public profile shows score pill + hover popover listing verified items.
- Marketplace (`brand_campaigns` browse) gets a Trust Score filter + sort.

## Phase 2 — Sign in with Verifiedly (SSO for GSN + Globalis)

Verifiedly becomes an **OAuth 2.0 / OIDC provider** for our other apps.

### Approach
Use Supabase as the auth source of truth and expose a thin OIDC layer via two edge functions:
- `oauth-authorize` — handles `/oauth/authorize?client_id=...&redirect_uri=...&state=...&scope=profile+trust`, requires the user to be signed in, shows a consent screen, returns an authorization code.
- `oauth-token` — exchanges the code for an `id_token` (JWT signed with our key) + access token; access token can call `oauth-userinfo` returning `{ sub, username, display_name, avatar, trust_score, verified: bool, email? }`.

New table `oauth_clients(id, client_id, client_secret_hash, name, redirect_uris[], created_by)` — seeded with one row each for GSN and Globalis.
New table `oauth_authorizations(code, user_id, client_id, scopes, expires_at)`.

A small `<SignInWithVerifiedly />` button drop-in (vanilla JS snippet + React component) we paste into GSN and Globalis next.

### Why not just share Supabase auth
Different projects = different Supabase instances. OIDC is the clean way and gives us a real moat.

## Phase 3 — Embedded Globalis AI Companion (opt-in per creator)

Since Globalis is now an AI travel platform with **credit-based chat**, we wire it in as an optional widget, not a default:
- New **AI Assistant** card in dashboard: "Enable a Globalis-powered AI companion on your profile."
- Creator picks persona + topics ("Ask me about my coaching", "Travel Q&A", etc.).
- Visitors get a chat bubble on `verifiedly.app/<username>` powered by a `companion-chat` edge function that:
  - Authenticates via the creator's linked Globalis account (OAuth out — reverse of phase 2, deferred) or uses our shared `LOVABLE_API_KEY` Gemini gateway for free-tier creators, capped.
  - Pro: 100 msgs/mo included. Elite: 1,000 msgs/mo. Free: disabled (upsell).
- New table `ai_companion_config(user_id, enabled, persona, system_prompt, monthly_msgs_used, period_start)`.

This ties the two products together and gives Pro/Elite a tangible new perk.

## Memory + positioning updates
- Update `mem://index.md` Core: change tagline + add "Verifiedly = verified identity + payments layer; SSO provider for sibling apps."
- New memory file `mem://product/positioning` capturing the trust score model + legal stance.
- New memory file `mem://tech/sso-provider` capturing the OIDC contract for GSN/Globalis.

## Out of scope (intentionally)
- Government ID / KYC via Stripe Identity — skipped per your "light" preference.
- Visual redesign — current B&W look stays.
- Removing existing tiers or fees — payments stay live and untouched.
- Wiring GSN/Globalis themselves — that's per-project work; this plan only ships the provider side.

## Suggested build order
1. Trust Score schema + recompute function + Verification dashboard tab + profile pill. *(highest user-visible impact, lowest risk)*
2. Landing copy refresh.
3. OIDC provider edge functions + `oauth_clients` seeding for GSN & Globalis + drop-in button.
4. Globalis AI companion widget + quotas.

Approve and I'll start with step 1.