
-- Restrict sensitive PII columns on profiles from public/anon/authenticated readers.
-- Table-level SELECT policy remains true for public bio pages, but sensitive
-- columns are excluded via column-level privilege revocation. service_role
-- retains access for edge functions and admin flows.

REVOKE SELECT (date_of_birth, verified_dob, verified_business_tax_id_last4, stripe_identity_session_id)
  ON public.profiles FROM anon, authenticated, PUBLIC;

-- Ensure service_role can still read these columns
GRANT SELECT (date_of_birth, verified_dob, verified_business_tax_id_last4, stripe_identity_session_id)
  ON public.profiles TO service_role;
