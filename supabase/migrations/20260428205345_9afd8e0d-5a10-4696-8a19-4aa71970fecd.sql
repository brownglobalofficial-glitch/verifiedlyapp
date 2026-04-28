-- Cache Stripe Connect status on creator_private_data so we don't hit Stripe on every page load.
ALTER TABLE public.creator_private_data
  ADD COLUMN IF NOT EXISTS stripe_charges_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_payouts_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_details_submitted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_requirements_currently_due jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS stripe_requirements_past_due jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS stripe_disabled_reason text,
  ADD COLUMN IF NOT EXISTS stripe_status_synced_at timestamptz;

-- Public read for status flags only (so visitors can see whether a creator can accept payments).
-- We expose ONLY the booleans via a view; raw private data stays locked down.
CREATE OR REPLACE VIEW public.creator_payout_status AS
SELECT
  id AS creator_id,
  (stripe_connect_account_id IS NOT NULL) AS has_account,
  stripe_charges_enabled,
  stripe_payouts_enabled,
  stripe_details_submitted,
  (jsonb_array_length(stripe_requirements_past_due) > 0) AS has_past_due,
  stripe_status_synced_at
FROM public.creator_private_data;

-- Anyone can read the booleans (they reveal no PII beyond "can this creator be paid")
GRANT SELECT ON public.creator_payout_status TO anon, authenticated;