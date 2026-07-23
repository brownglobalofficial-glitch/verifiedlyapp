// Verifiedly product pricing shown in the application.
// Stripe Checkout sessions are created server-side; never trust an amount or
// price ID sent by the browser.
export const STRIPE_TIERS = {
  pro: {
    price_id: null,
    product_id: null,
    name: "Pro",
    price: 4.99,
    fee_percent: 0,
    includes_id_verification: true,
  },
  pro_annual: {
    price_id: null,
    product_id: null,
    name: "Pro Annual",
    price: 49.99,
    fee_percent: 0,
    includes_id_verification: true,
  },
  // Legacy tier — grandfathered for pre-existing subscribers only. It is not
  // advertised to new users.
  elite: {
    price_id: "price_1TSoiF1hrOAc8qE8R2dGTqHQ",
    product_id: "prod_URi8z4FUV491Gb",
    name: "Elite (legacy)",
    price: 19.99,
    fee_percent: 0,
  },
  free: {
    price_id: null,
    product_id: null,
    name: "Free",
    price: 0,
    fee_percent: 0,
  },
} as const;

export const PRO_AMOUNTS = { month: 499, year: 4999 } as const;

// Verifiedly Tap is a personalized, non-payment PVC NFC profile card.
export const TAP_CARD_AMOUNTS = {
  retail: 2999,
  pro: 1999,
} as const;

// There is no separate identity-verification product. Eligible adults with an
// active Verifiedly Pro subscription may complete the Stripe Identity flow.
export const IDENTITY_VERIFICATION = {
  price_id: null,
  amount_usd: null,
  included_with_pro: true,
} as const;

export type SubscriptionTier = keyof typeof STRIPE_TIERS;
