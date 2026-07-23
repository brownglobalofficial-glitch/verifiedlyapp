// Stripe tier configuration
export const STRIPE_TIERS = {
  pro: {
    price_id: "price_1TwRyJ1hrOAc8qE8cbdavNGI",
    product_id: "prod_UwKd3MLosO6bDT",
    name: "Pro",
    price: 9.99,
    fee_percent: 0,
    includes_id_verification: false,
  },
  pro_annual: {
    price_id: "price_1TwRxM1hrOAc8qE8p1a1O8rk",
    product_id: "prod_UwKcOur9VtceeW",
    name: "Pro Annual",
    price: 99,
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

// Verifiedly Tap NFC card prices in the Verifiedly Stripe account.
export const TAP_CARD_PRICES = {
  retail: "price_1TwRxJ1hrOAc8qE8TBbgyAaJ",   // $19.00
  pro: "price_1TwRxL1hrOAc8qE89YDsC42O",       // $12.00 (Pro members)
} as const;
export const TAP_CARD_AMOUNTS = { retail: 1900, pro: 1200, annual_free: 0 } as const;

// Legacy configuration retained only so old, unreachable screens compile.
// New verification enrollment and pricing are paused.
export const IDENTITY_VERIFICATION = {
  price_id: null,
  amount_usd: null,
} as const;

export type SubscriptionTier = keyof typeof STRIPE_TIERS;
