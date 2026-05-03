// Stripe tier configuration
export const STRIPE_TIERS = {
  pro: {
    price_id: "price_1TSoiE1hrOAc8qE8Kqpr2Z1h",
    product_id: "prod_URi89hw7irIarX",
    name: "Pro",
    price: 4.99,
    fee_percent: 5,
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
