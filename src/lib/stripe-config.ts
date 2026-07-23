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

// Legacy configuration retained only so old, unreachable screens compile.
// New verification enrollment and pricing are paused.
export const IDENTITY_VERIFICATION = {
  price_id: null,
  amount_usd: null,
} as const;

export type SubscriptionTier = keyof typeof STRIPE_TIERS;
