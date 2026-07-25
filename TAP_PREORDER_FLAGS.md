# Tap Card preorder feature flags

Frontend build flag:

```text
VITE_TAP_CARD_PREORDERS_ENABLED=true
```

Live server charging flag, stored as a Supabase Edge Function secret:

```text
TAP_CARD_PREORDERS_ENABLED=true
```

The frontend flag controls whether the checkout form appears. The server flag independently controls whether a live Stripe key may create a Checkout Session. Both must be enabled for public paid preorders. Test-mode Stripe keys remain usable while the live server flag is off.
