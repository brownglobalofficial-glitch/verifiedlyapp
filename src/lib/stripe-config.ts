// Verifiedly product pricing shown in the application.
// Stripe Checkout sessions are created server-side; never trust an amount or
// price ID sent by the browser.
export const STRIPE_TIERS = {
  membership: {
    price_id: null,
    product_id: null,
    name: "Verifiedly Membership",
    price: 50,
    includes_id_verification: true,
  },
  free: {
    price_id: null,
    product_id: null,
    name: "Verifiedly Free",
    price: 0,
    includes_id_verification: false,
  },
} as const;

// Verifiedly Membership is a single annual plan. Amounts are enforced
// server-side; this constant only drives display copy.
export const MEMBERSHIP_AMOUNT_CENTS = 5000;
export const MEMBERSHIP_PRICE_LABEL = "$50";

// There is no separate identity-verification product. Eligible adults with an
// active Verifiedly Pro subscription may complete the Stripe Identity flow.
export const IDENTITY_VERIFICATION = {
  price_id: null,
  amount_usd: null,
  included_with_pro: true,
} as const;

export type SubscriptionTier = keyof typeof STRIPE_TIERS;
