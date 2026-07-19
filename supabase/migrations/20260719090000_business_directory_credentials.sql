-- Verifiedly organization profiles, opt-in discovery, and provider-controlled
-- credential verification. Background screening is intentionally not included.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS search_visible BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS accepts_verification_requests BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS organization_legal_name TEXT,
  ADD COLUMN IF NOT EXISTS organization_industry TEXT,
  ADD COLUMN IF NOT EXISTS organization_country TEXT,
  ADD COLUMN IF NOT EXISTS business_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS business_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS business_verification_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS business_verification_provider TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_business_verification_consistency'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_business_verification_consistency CHECK (
        business_verified = false
        OR (
          account_type = 'business'
          AND business_verified_at IS NOT NULL
          AND business_verification_provider IS NOT NULL
        )
      );
  END IF;
END $$;

-- These fields are safe public claims. Discovery preferences remain available
-- only to signed-in users, while verification results remain server-controlled.
GRANT SELECT (
  organization_legal_name,
  organization_industry,
  organization_country,
  business_verified,
  business_verified_at,
  business_verification_expires_at,
  business_verification_provider
) ON public.profiles TO anon;

GRANT SELECT (
  search_visible,
  accepts_verification_requests,
  organization_legal_name,
  organization_industry,
  organization_country,
  business_verified,
  business_verified_at,
  business_verification_expires_at,
  business_verification_provider
) ON public.profiles TO authenticated;

GRANT UPDATE (
  search_visible,
  accepts_verification_requests,
  organization_legal_name,
  organization_industry,
  organization_country
) ON public.profiles TO authenticated;

CREATE INDEX IF NOT EXISTS idx_profiles_opt_in_directory
  ON public.profiles(search_visible, account_type, updated_at DESC)
  WHERE search_visible = true;

-- Public-safe verification claims. Provider order IDs and raw reports must
-- remain in the external provider or a separate service-role-only system.
CREATE TABLE IF NOT EXISTS public.credential_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.profile_sections(id) ON DELETE CASCADE,
  credential_type TEXT NOT NULL CHECK (credential_type IN ('education', 'license', 'certification')),
  provider TEXT NOT NULL DEFAULT 'checkr' CHECK (provider IN ('checkr', 'national_student_clearinghouse', 'issuing_registry')),
  provider_name TEXT NOT NULL DEFAULT 'Checkr',
  status TEXT NOT NULL DEFAULT 'provider_setup_required'
    CHECK (status IN ('provider_setup_required', 'pending', 'in_review', 'verified', 'needs_action', 'failed', 'expired')),
  verified_title TEXT NOT NULL,
  verified_issuer TEXT,
  display_public BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(section_id)
);

ALTER TABLE public.credential_verifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.credential_verifications FROM anon, authenticated, PUBLIC;
GRANT SELECT ON public.credential_verifications TO anon, authenticated;
GRANT UPDATE (display_public) ON public.credential_verifications TO authenticated;
GRANT ALL ON public.credential_verifications TO service_role;

DROP POLICY IF EXISTS "Public reads verified credential claims" ON public.credential_verifications;
CREATE POLICY "Public reads verified credential claims"
  ON public.credential_verifications FOR SELECT
  USING (
    auth.uid() = user_id
    OR (
      status = 'verified'
      AND display_public = true
      AND EXISTS (
        SELECT 1
        FROM public.profile_sections AS section
        WHERE section.id = section_id
          AND section.is_public = true
      )
    )
  );

DROP POLICY IF EXISTS "Owners change credential visibility" ON public.credential_verifications;
CREATE POLICY "Owners change credential visibility"
  ON public.credential_verifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_credential_verifications_updated ON public.credential_verifications;
CREATE TRIGGER trg_credential_verifications_updated
  BEFORE UPDATE ON public.credential_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_credential_verifications_public
  ON public.credential_verifications(user_id, credential_type, verified_at DESC)
  WHERE status = 'verified' AND display_public = true;

-- A request records interest without taking payment or pretending a provider
-- check has run. A service-role integration will advance the status only after
-- Checkr/NSC is contracted, configured, and returns an authoritative result.
CREATE OR REPLACE FUNCTION public.request_credential_verification(
  _section_id UUID,
  _credential_type TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID := auth.uid();
  _section public.profile_sections%ROWTYPE;
  _verification_id UUID;
  _title TEXT;
  _issuer TEXT;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF _credential_type NOT IN ('education', 'license', 'certification') THEN
    RAISE EXCEPTION 'Unsupported credential type';
  END IF;

  SELECT * INTO _section
  FROM public.profile_sections
  WHERE id = _section_id AND user_id = _user_id;

  IF NOT FOUND OR _section.kind NOT IN ('education', 'credential') THEN
    RAISE EXCEPTION 'Credential section not found';
  END IF;

  IF _section.kind = 'education' AND _credential_type <> 'education' THEN
    RAISE EXCEPTION 'Education entries require education verification';
  END IF;

  _title := CASE
    WHEN _section.kind = 'education' THEN COALESCE(NULLIF(_section.data->>'program', ''), NULLIF(_section.data->>'school', ''), 'Education credential')
    ELSE COALESCE(NULLIF(_section.data->>'name', ''), 'Professional credential')
  END;
  _issuer := CASE
    WHEN _section.kind = 'education' THEN NULLIF(_section.data->>'school', '')
    ELSE NULLIF(_section.data->>'issuer', '')
  END;

  INSERT INTO public.credential_verifications (
    user_id,
    section_id,
    credential_type,
    provider,
    provider_name,
    status,
    verified_title,
    verified_issuer
  ) VALUES (
    _user_id,
    _section_id,
    _credential_type,
    'checkr',
    'Checkr',
    'provider_setup_required',
    _title,
    _issuer
  )
  ON CONFLICT (section_id) DO UPDATE SET
    credential_type = EXCLUDED.credential_type,
    verified_title = EXCLUDED.verified_title,
    verified_issuer = EXCLUDED.verified_issuer,
    updated_at = now()
  RETURNING id INTO _verification_id;

  RETURN _verification_id;
END;
$$;

REVOKE ALL ON FUNCTION public.request_credential_verification(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_credential_verification(UUID, TEXT) TO authenticated;

-- Business verification requests contain no TIN, registration documents, or
-- owner PII. Those inputs must be collected by the contracted KYB provider.
CREATE TABLE IF NOT EXISTS public.business_verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'middesk' CHECK (provider IN ('middesk', 'persona')),
  status TEXT NOT NULL DEFAULT 'provider_setup_required'
    CHECK (status IN ('provider_setup_required', 'pending', 'in_review', 'verified', 'needs_action', 'failed', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.business_verification_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.business_verification_requests FROM anon, authenticated, PUBLIC;
GRANT SELECT ON public.business_verification_requests TO authenticated;
GRANT ALL ON public.business_verification_requests TO service_role;

DROP POLICY IF EXISTS "Organizations read own verification requests" ON public.business_verification_requests;
CREATE POLICY "Organizations read own verification requests"
  ON public.business_verification_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_business_verification_requests_updated ON public.business_verification_requests;
CREATE TRIGGER trg_business_verification_requests_updated
  BEFORE UPDATE ON public.business_verification_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.request_business_verification()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID := auth.uid();
  _profile public.profiles%ROWTYPE;
  _request_id UUID;
  _provider TEXT;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO _profile FROM public.profiles WHERE id = _user_id;
  IF NOT FOUND OR _profile.account_type <> 'business' THEN
    RAISE EXCEPTION 'An organization profile is required';
  END IF;
  IF coalesce(trim(_profile.organization_legal_name), '') = ''
    OR coalesce(trim(_profile.organization_country), '') = ''
    OR coalesce(trim(_profile.website), '') = '' THEN
    RAISE EXCEPTION 'Add a legal name, registered country, and official website first';
  END IF;

  _provider := CASE
    WHEN lower(trim(_profile.organization_country)) IN (
      'us', 'u.s.', 'usa', 'united states', 'united states of america'
    ) THEN 'middesk'
    ELSE 'persona'
  END;

  SELECT id INTO _request_id
  FROM public.business_verification_requests
  WHERE user_id = _user_id
    AND status IN ('provider_setup_required', 'pending', 'in_review', 'needs_action')
  ORDER BY created_at DESC
  LIMIT 1;

  IF _request_id IS NULL THEN
    INSERT INTO public.business_verification_requests (user_id, provider)
    VALUES (_user_id, _provider)
    RETURNING id INTO _request_id;
  END IF;

  RETURN _request_id;
END;
$$;

REVOKE ALL ON FUNCTION public.request_business_verification() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_business_verification() TO authenticated;

-- First-party apps may request public, independently verified credential
-- claims, but only through a distinct user-consented OAuth scope. Raw reports,
-- document files, provider order IDs, and private claims are never included.
UPDATE public.oauth_clients
SET scopes = ARRAY['openid', 'profile', 'identity', 'credentials'],
    updated_at = now()
WHERE client_id IN ('gsn_app', 'globalis_app');
