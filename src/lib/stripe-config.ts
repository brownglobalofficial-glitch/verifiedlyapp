// Verifiedly platform billing configuration.
// Server-side checkout uses environment-configured Stripe Price IDs when
// available and otherwise creates inline prices at the same published amounts.
export const STRIPE_TIERS = {
  pro: {
    monthly_price_id: null,
    annual_price_id: null,
    product_id: null,
    name: "Verifiedly Pro",
    monthly_price: 5.99,
    annual_price: 49.99,
    fee_percent: 0,
    includes_identity_verification_eligibility: true,
    includes_annual_pvc_card_credit: true,
  },
  // Legacy tier retained only so old data and unreachable screens compile.
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

// Identity verification is a trust-and-safety feature within an active Pro
// plan. It is not sold as a standalone guaranteed badge.
export const IDENTITY_VERIFICATION = {
  standalone_price_id: null,
  standalone_amount_usd: null,
  requires_active_pro: true,
  adult_only: true,
} as const;

export const TAP_CARD_PRICING = {
  pvc_free_user: 24.99,
  pvc_pro_user: 14.99,
  annual_pvc_shipping: 5.99,
  metal_free_user: 89.99,
  metal_pro_user: 69.99,
  annual_metal_upgrade_and_shipping: 55.98,
} as const;

export type SubscriptionTier = keyof typeof STRIPE_TIERS;
