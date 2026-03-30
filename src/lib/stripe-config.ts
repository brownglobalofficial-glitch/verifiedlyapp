// Stripe tier configuration
export const STRIPE_TIERS = {
  pro: {
    price_id: "price_1TGU161hrOAc8qE8WfnOZA4k",
    product_id: "prod_UExwyZUgIuGTha",
    name: "Pro",
    price: 4.99,
    fee_percent: 5,
  },
  elite: {
    price_id: "price_1TGU1F1hrOAc8qE8Lqvz6I5n",
    product_id: "prod_UExxZm3eKY0170",
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
