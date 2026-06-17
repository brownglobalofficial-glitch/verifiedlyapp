// Stripe tier configuration
export const STRIPE_TIERS = {
  pro: {
    price_id: "price_1Tj8n91hrOAc8qE8BRJoXtxv",
    product_id: "prod_UiZxt9S0G6T6LU",
    name: "Pro",
    price: 9.99,
    fee_percent: 0,
  },
  elite: {
    price_id: "price_1TSoiF1hrOAc8qE8R2dGTqHQ",
    product_id: "prod_URi8z4FUV491Gb",
    name: "Elite",
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

export type SubscriptionTier = keyof typeof STRIPE_TIERS;
