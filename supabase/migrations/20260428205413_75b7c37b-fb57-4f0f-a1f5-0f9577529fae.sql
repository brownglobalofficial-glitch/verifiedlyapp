DROP VIEW IF EXISTS public.creator_payout_status;

-- Returns ONLY the boolean payout-readiness flags. Safe to expose publicly because it
-- reveals no PII beyond "can this creator be paid". Runs as SECURITY INVOKER so RLS applies,
-- but creator_private_data has no public SELECT policy — we read with elevated rights via STABLE+definer.
CREATE OR REPLACE FUNCTION public.get_creator_payout_status(_creator_id uuid)
RETURNS TABLE (
  has_account boolean,
  charges_enabled boolean,
  payouts_enabled boolean,
  details_submitted boolean,
  has_past_due boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (stripe_connect_account_id IS NOT NULL),
    stripe_charges_enabled,
    stripe_payouts_enabled,
    stripe_details_submitted,
    (jsonb_array_length(stripe_requirements_past_due) > 0)
  FROM public.creator_private_data
  WHERE id = _creator_id;
$$;

REVOKE ALL ON FUNCTION public.get_creator_payout_status(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_creator_payout_status(uuid) TO anon, authenticated;