
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verification_kind text DEFAULT 'individual' CHECK (verification_kind IN ('individual','business')),
  ADD COLUMN IF NOT EXISTS verified_business_name text,
  ADD COLUMN IF NOT EXISTS verified_business_country text,
  ADD COLUMN IF NOT EXISTS verified_business_tax_id_last4 text,
  ADD COLUMN IF NOT EXISTS date_of_birth date;

REVOKE ALL (date_of_birth) ON public.profiles FROM anon, authenticated;

DROP TABLE IF EXISTS public.creator_status CASCADE;
