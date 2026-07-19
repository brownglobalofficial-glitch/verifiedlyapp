
-- Add missing organization + business verification columns and credential verification table
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

GRANT SELECT (organization_legal_name, organization_industry, organization_country,
  business_verified, business_verified_at, business_verification_expires_at, business_verification_provider)
  ON public.profiles TO anon;
GRANT SELECT (search_visible, accepts_verification_requests, organization_legal_name, organization_industry, organization_country,
  business_verified, business_verified_at, business_verification_expires_at, business_verification_provider)
  ON public.profiles TO authenticated;
GRANT UPDATE (search_visible, accepts_verification_requests, organization_legal_name, organization_industry, organization_country)
  ON public.profiles TO authenticated;

CREATE TABLE IF NOT EXISTS public.credential_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.profile_sections(id) ON DELETE CASCADE,
  credential_type TEXT NOT NULL CHECK (credential_type IN ('education', 'license', 'certification')),
  provider TEXT NOT NULL DEFAULT 'checkr',
  provider_name TEXT NOT NULL DEFAULT 'Checkr',
  status TEXT NOT NULL DEFAULT 'provider_setup_required',
  verified_title TEXT NOT NULL,
  verified_issuer TEXT,
  display_public BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(section_id)
);

REVOKE ALL ON public.credential_verifications FROM anon, authenticated, PUBLIC;
GRANT SELECT ON public.credential_verifications TO anon, authenticated;
GRANT UPDATE (display_public) ON public.credential_verifications TO authenticated;
GRANT ALL ON public.credential_verifications TO service_role;
ALTER TABLE public.credential_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads verified credential claims" ON public.credential_verifications;
CREATE POLICY "Public reads verified credential claims"
  ON public.credential_verifications FOR SELECT
  USING (
    auth.uid() = user_id
    OR (status = 'verified' AND display_public = true AND EXISTS (
      SELECT 1 FROM public.profile_sections section
      WHERE section.id = section_id AND section.is_public = true
    ))
  );

DROP POLICY IF EXISTS "Owners change credential visibility" ON public.credential_verifications;
CREATE POLICY "Owners change credential visibility"
  ON public.credential_verifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_credential_verifications_updated ON public.credential_verifications;
CREATE TRIGGER trg_credential_verifications_updated
  BEFORE UPDATE ON public.credential_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
