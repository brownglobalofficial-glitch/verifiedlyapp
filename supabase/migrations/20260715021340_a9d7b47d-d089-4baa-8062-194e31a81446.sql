
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS id_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_full_name TEXT,
  ADD COLUMN IF NOT EXISTS verified_first_name TEXT,
  ADD COLUMN IF NOT EXISTS verified_last_name TEXT,
  ADD COLUMN IF NOT EXISTS verified_dob DATE,
  ADD COLUMN IF NOT EXISTS verified_country TEXT,
  ADD COLUMN IF NOT EXISTS stripe_identity_session_id TEXT,
  ADD COLUMN IF NOT EXISTS show_legal_name BOOLEAN NOT NULL DEFAULT false;

-- Restrict DOB reads: revoke from anon/authenticated at column level.
REVOKE SELECT (verified_dob) ON public.profiles FROM anon, authenticated;
GRANT SELECT (verified_dob) ON public.profiles TO service_role;

-- Helper: expose age-band without leaking DOB.
CREATE OR REPLACE FUNCTION public.is_age_over(_user_id UUID, _years INT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN verified_dob IS NULL THEN false
    ELSE (verified_dob <= (CURRENT_DATE - (_years || ' years')::interval))
  END
  FROM public.profiles WHERE id = _user_id;
$$;

GRANT EXECUTE ON FUNCTION public.is_age_over(UUID, INT) TO authenticated, anon, service_role;
