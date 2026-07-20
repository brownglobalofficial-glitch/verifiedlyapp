
## Scope this pass covers

Four independent tracks. I'll do them in this order so you're not picking 3 designs blind at once.

### 1. Fee Breakdown component (ship first, no design pick needed)
A single reusable `<FeeBreakdown amount kind={"tip"|"product"|"membership"|"subscription"} />` card used in:
- Monetization → Tips, Products, Memberships tabs (owner preview)
- Product checkout confirm screen
- Membership tier editor

Shows, based on the seller's plan:
- Buyer pays: `$X.XX USD` (or localized currency, see track 4)
- Stripe processing: `~2.9% + $0.30` = `$Y.YY`
- Verifiedly platform fee: `10%` (Free) or `3%` (Pro) = `$Z.ZZ`
- **You receive: `$N.NN`**
- Small "why these fees?" popover linking to `/pricing`

Replaces the old owner-only `FeePreview` slider on public profiles (already removed from public view). Free-tier sellers see a subtle "Save $X.XX per sale on Pro →" nudge.

### 2. Country-aware checkout + language (i18n track)
Two sub-parts:

**a. Country / currency at checkout**
- Detect buyer country via `Accept-Language` + Stripe's IP-based locale on the Checkout Session (Stripe handles this natively when we pass `locale: "auto"` and don't hardcode `currency: "usd"`).
- For MVP: keep listing prices in USD (seller sets USD), let Stripe present localized currency at Checkout via `automatic_payment_methods: { enabled: true }` + `locale: "auto"`. This unlocks local payment methods (iDEAL, Bancontact, SEPA, Klarna, Alipay, etc.) automatically per buyer country.
- Show "Prices shown in USD. Your card will be charged in your local currency at checkout." under buy buttons.
- Update `create-tip`, `create-product-checkout`, `create-subscription-checkout` edge functions to pass `locale: "auto"` and enable automatic payment methods.

**b. UI language**
- Add `react-i18next` with English + Spanish + French + Portuguese + German as day-1 locales (covers ~60% of non-English creator markets).
- Language switcher in dashboard sidebar footer + splash footer. Detects `navigator.language` on first load, persists to `localStorage` + `profiles.preferred_locale`.
- Translate: splash, login/signup, dashboard shell nav, verification page, monetization page, pricing page. Leave long-form legal (Terms/Privacy) English-only with a note.

### 3. Splash + Auth redesign (design pick #1)
Capture current splash, generate 3 directions locked to your existing B&W palette + Space Grotesk/Inter + minimalist layout. Directions vary in:
- Composition (centered vs split vs asymmetric)
- Density (empty poster vs signal-dense with proof points)
- Motion register (static vs subtle vs cinematic)
You pick one → I implement across `/` (Index), `/login`, `/signup`.

### 4. Dashboard shell redesign (design pick #2)
Requires an authenticated screenshot. Two options:
- **A.** You paste a screenshot of your current `/dashboard` on desktop + mobile, I use those as the reference.
- **B.** I sign in a test account (need you to confirm one exists) and capture it myself.

Then 3 directions varying sidebar treatment, header density, and profile-completion card placement.

### 5. ProfileSettings redesign (design pick #3)
Same as above but for `/dashboard/settings`. 3 mobile-first directions: stacked cards, tabbed sheets, or accordion sections. Sticky save bar on mobile in all three.

---

## What I need from you before I start

1. **Ship order?** My recommendation: `[1] Fee Breakdown → [2] i18n → [3] Splash pick → [4] Dashboard pick → [5] Settings pick`. Reply with a different order if you want.
2. **Dashboard screenshot** — paste one, or confirm I can use the test creator account for capture. Without it I can't run design directions on that surface.
3. **Language list ok?** EN, ES, FR, PT, DE. Add/remove any.
4. **Paddle fallback for countries Stripe Connect can't onboard** — still open from last pass. Yes/no?

Once you answer, I'll start with track 1 (Fee Breakdown) immediately since it needs no design pick, then queue up the design-direction rounds one at a time so you're only choosing between 3 previews per message.
