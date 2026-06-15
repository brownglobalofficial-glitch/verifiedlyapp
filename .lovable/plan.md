
# Dashboard Refactor + Deferred Monetization

## Scope

1. **Sidebar dashboard** — Replace the current dashboard layout with a modern left sidebar (shadcn `Sidebar`). Four nav items only:
   - **Profile** (combines profile fields + Links + Theme as tabs inside one page)
   - **Verification** (Trust Score badge + Stripe-style checklist; Privacy + Disputes as tabs inside)
   - **Monetization** (tips toggle, subscriptions, digital products, payouts/Stripe Connect status)
   - **Settings** (account, email, danger zone)

2. **Deferred Stripe onboarding** — Stripe Connect is NOT prompted during signup/onboarding. Instead:
   - When a creator toggles on tips, creates their first subscription tier, or adds their first paid digital item, a modal appears: "Connect payouts to start earning."
   - Modal walks through 3 steps: (1) accept Stripe terms, (2) open Stripe Connect Express onboarding in new tab, (3) return → we poll account status and confirm "Ready to receive payouts."
   - If they cancel, the monetization item is saved as `inactive` and shown with a "Connect payouts to publish" banner.

3. **Pricing page + upgrade modal** — Two tiers only:
   - **Free** — $0/mo, 10% platform fee + Stripe fees
   - **Pro** — $9/mo, 0% platform fee (Stripe fees still apply)
   - Both: unlimited links, all monetization features, verification eligibility (badge is earned, not bought).
   - Pricing page: clean two-card layout, fee comparison, FAQ shortened.
   - Dashboard upgrade modal (`<UpgradeModal>`) updated with the same two options + clear monthly savings example ("Sell $1000/mo → Free keeps $900, Pro keeps $991").

4. **Verification checklist UI** — Stripe-style:
   - Progress bar (0–100%) + score badge at top
   - Each signal row: icon, title, points value, status (done / available / skipped), one-line "what happens if you skip" caption
   - Expand row → action button (Connect, Verify, Add link, etc.)
   - "Verified at 80" target marker on the progress bar

5. **Cleanup**
   - Delete `/fan` route + `src/pages/Fan*.tsx` files
   - Remove unused onboarding state: `stripeAgreed`, `handleStripeConnect`, related UI in `Onboarding.tsx`
   - Remove fan-specific branches from `Dashboard.tsx`, `App.tsx`

## Technical details

- New components:
  - `src/components/dashboard/DashboardSidebar.tsx`
  - `src/components/dashboard/DashboardLayout.tsx` (SidebarProvider wrapper, used by all `/dashboard/*` routes via `<Outlet />`)
  - `src/components/monetization/ConnectPayoutsModal.tsx` (3-step flow; calls existing `stripe-connect-create` / `stripe-connect-status` edge functions)
  - `src/components/verification/VerificationChecklist.tsx` (reusable, used in dashboard Verification page)
- Pages restructured:
  - `src/pages/dashboard/Profile.tsx` — tabs: About | Links | Theme
  - `src/pages/dashboard/Verification.tsx` — tabs: Checklist | Privacy | Disputes
  - `src/pages/dashboard/Monetization.tsx` — tabs: Tips | Subscriptions | Digital Products | Payouts
- Route changes in `src/App.tsx`:
  - Wrap `/dashboard/*` in `DashboardLayout`
  - Remove `/fan` and any `<FanDashboard>` import
- Gating helper: `useMonetizationGate()` hook → checks `creator_has_payments(uid)`; if false, opens `ConnectPayoutsModal` instead of running the action.
- No schema changes required. No new edge functions required.

## Out of scope

- No changes to verification scoring logic (already earned-only, ≥80)
- No new Stripe products/prices created right now — Pro price is already wired via `STRIPE_PRO_PRICE_ID` env (will confirm and reuse)
- No copy changes to landing hero beyond what's needed for pricing consistency

Confirm and I'll implement.
