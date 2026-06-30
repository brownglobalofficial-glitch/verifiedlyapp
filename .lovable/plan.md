
## 1. New V icon as universal logo mark

- Save the uploaded `Verifiedly_logo.png` as a Lovable asset and export it via a single `<VerifiedlyMark />` component (`src/components/VerifiedlyMark.tsx`) so every icon-only spot uses one source.
- Use the **V mark** anywhere a square/compact icon is needed:
  - Favicon + `apple-touch-icon` + PWA manifest (`index.html`, `public/`)
  - OG/Twitter fallback image
  - OAuth consent screen (`OAuthAuthorize.tsx`) — replace the generic ShieldCheck tile
  - Sign-in / Sign-up header, AuthCallback card, loading spinners, 404
  - Navbar mobile (collapsed) and dashboard sidebar collapsed state
- Keep the **full wordmark** (existing text logo) for: desktop Navbar, Footer, landing Hero, email templates, marketing pages.
- Document the rule in the component file so future spots pick the right variant.

## 2. Remove Explore everywhere

- Delete `src/pages/Explore.tsx` and its route in `src/App.tsx`.
- Remove Explore links from: Navbar (desktop + mobile menu), Footer, Dashboard quick actions, landing CTAs, sitemap.xml, llms.txt, robots/SEO.
- Replace any "Explore creators" CTA with a link to `/marketplace` (already exists) or just remove.
- Remove the **"Everything you need to earn"** features block on the landing page (and any duplicates on Dashboard) — it's outdated.

## 3. Subscriptions → Memberships rename

- Global terminology swap (UI strings only — keep DB table names and Stripe metadata stable to avoid migration churn):
  - Dashboard sidebar: "Subscriptions" → "Memberships"
  - `ManageSubscriptions.tsx` page title + route alias `/dashboard/memberships` (keep old route as redirect)
  - `MembershipTiers.tsx` already named correctly — update copy ("Subscribe" → "Join", "Subscribed" → "Member")
  - Purchases hub: "Active subscriptions" → "Active memberships"
  - Profile section header on `CreatorProfile.tsx`: "Memberships"
- Perks model stays the same (community link, content link, discount code) — no schema change.

## 4. Customizable Tip + Membership CTA buttons on profile

- Add two optional profile fields (single migration on `profiles`):
  - `tip_button_label TEXT` (default `"Tip"`, max 24 chars)
  - `membership_button_label TEXT` (default `"Memberships"`, max 24 chars)
- Surface inputs in **Profile → About** tab of dashboard with live preview and character counter.
- On `CreatorProfile.tsx`, render the tip button using the creator's custom label, and add a second button next to it that scrolls to the memberships section using `membership_button_label` — only shown when the creator has at least one active tier.
- Both buttons share styling so they read as a paired CTA row; stack vertically on mobile (`<sm`) so nothing clips.

## 5. Follower count display rule

- Hide follower count by default. Show it only when `followers_count >= 100` (threshold constant in `src/lib/profile-display.ts`).
- Apply on `CreatorProfile.tsx` header and Marketplace/creator cards.
- No setting toggle — keeps UX simple per memory rule.

## 6. Mobile + SEO polish

- Audit mobile breakpoints on: `CreatorProfile` (header buttons, tier cards), `Dashboard` (sidebar drawer, tour coach-marks), `ManageSubscriptions` perk forms, `Purchases`, `OAuthAuthorize` consent.
  - Common fixes: `flex-wrap`, `min-w-0`, `truncate`, `overflow-x-auto` on horizontal scrollers, larger tap targets (44px), safe-area padding on bottom CTA bars.
- SEO pass:
  - Update titles/meta-descriptions on key pages (Landing, Profile, Memberships, Developers) — keep <60/<160.
  - Replace Explore references in `sitemap.xml`, `public/llms.txt`, `robots.txt`.
  - Set OG image + favicon to the new V mark.
  - Ensure single `<h1>` per page, semantic landmarks intact.

## 7. OAuth handle + password clarification

The existing OAuth flow already does this — when a partner site calls `/oauth/authorize`, unauthenticated users get redirected to `/login` where they enter their Verifiedly **username (handle) + password**, then the consent screen appears. No code change needed beyond:
- Update `Login.tsx` to accept either email **or** `@username` in the email field (lookup username → email via a tiny `lookup-handle` edge function) so partner-site sign-in matches the user's mental model.
- Add helper text on the login form: "Use your Verifiedly handle or email."

## Technical Notes

- **Files created**: `src/components/VerifiedlyMark.tsx`, `src/lib/profile-display.ts`, `supabase/functions/lookup-handle/index.ts`, one migration adding two `profiles` columns.
- **Files deleted**: `src/pages/Explore.tsx`.
- **Files edited (major)**: `App.tsx`, `index.html`, `Navbar.tsx`, `Footer.tsx`, `Hero.tsx`, `Features.tsx` (remove block), `Dashboard.tsx`, `DashboardSidebar.tsx`, `CreatorProfile.tsx`, `MembershipTiers.tsx`, `ManageSubscriptions.tsx`, `Purchases.tsx`, `ProfileSettings.tsx` (or Profile About tab), `OAuthAuthorize.tsx`, `Login.tsx`, `Signup.tsx`, `AuthCallback.tsx`, `sitemap.xml`, `llms.txt`, `robots.txt`.
- **No schema changes** beyond the two new optional profile columns. DB tables `subscription_tiers` / `subscription_perks` stay — rename is UI-only.

## Open questions before I build

1. For the handle-or-email login, OK to add a tiny public edge function that maps `@username → email`? It's the only clean way without exposing the auth.users table to anon.
2. Follower threshold — is **100** the right number, or do you want **500** / always-hidden?
