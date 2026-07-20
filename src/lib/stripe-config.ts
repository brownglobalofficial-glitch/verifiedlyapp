// Stripe tier configuration
export const STRIPE_TIERS = {
  pro: {
    price_id: "price_1Tj8n91hrOAc8qE8BRJoXtxv",
    product_id: "prod_UiZxt9S0G6T6LU",
    name: "Pro",
    price: 9.99,
    // Pro creators pay a 3% platform fee (down from 10% Free) AND receive
    // free ID verification as part of their subscription.
    fee_percent: 3,
    includes_id_verification: true,
  },
  // Legacy tier — grandfathered for pre-existing subscribers only. Not
  // advertised in the UI. Fee tables read `is_elite` at runtime to honor it.
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
    fee_percent: 10,
  },
} as const;

// One-time Stripe Identity verification fee. Grants the blue checkmark.
// Non-refundable once the ID scan runs. Free for Verifiedly Pro subscribers.
export const IDENTITY_VERIFICATION = {
  price_id: "price_1TtYw41hrOAc8qE8bFdRF341",
  amount_usd: 4.99,
} as const;

export type SubscriptionTier = keyof typeof STRIPE_TIERS;
