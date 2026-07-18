// Stripe tier configuration
export const STRIPE_TIERS = {
  pro: {
    price_id: "price_1TuNUT1hrOAc8qE8Zg1OnTwd",
    product_id: "prod_UuBsV3AvLLkgR1",
    name: "Pro",
    price: 4.99,
    // Pro is now identity-first: custom domain, document vault, priority
    // support. It does NOT include the identity check (that's a separate
    // one-time purchase) and no longer sets a platform fee — commerce is
    // being retired from the product.
    fee_percent: 0,
    includes_id_verification: false,
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
    fee_percent: 0,
  },
} as const;

// One-time Stripe Identity verification fee. Purchases a verification
// ATTEMPT, not a guaranteed badge. Non-refundable once the ID scan runs.
export const IDENTITY_VERIFICATION = {
  price_id: "price_1TuNUS1hrOAc8qE8OOsyoQ6K",
  amount_usd: 12.99,
} as const;

export type SubscriptionTier = keyof typeof STRIPE_TIERS;
