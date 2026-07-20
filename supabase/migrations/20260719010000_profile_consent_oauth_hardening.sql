-- Record legal acceptance as an append-only account event. Signup also stores
-- the same version in auth metadata so an email-confirmation flow does not
-- lose the acceptance before the first authenticated onboarding session.
CREATE TABLE IF NOT EXISTS public.legal_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  terms_version TEXT NOT NULL,
  vault_policy_version TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('signup', 'onboarding', 'settings')),
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.legal_acceptances ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.legal_acceptances FROM anon, authenticated, PUBLIC;
GRANT SELECT, INSERT ON public.legal_acceptances TO authenticated;
GRANT ALL ON public.legal_acceptances TO service_role;

DROP POLICY IF EXISTS "Users record and read own legal acceptances" ON public.legal_acceptances;
CREATE POLICY "Users record and read own legal acceptances"
  ON public.legal_acceptances FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users record own legal acceptances" ON public.legal_acceptances;
CREATE POLICY "Users record own legal acceptances"
  ON public.legal_acceptances FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_legal_acceptances_user_time
  ON public.legal_acceptances(user_id, accepted_at DESC);

-- The UI blocks prohibited labels before upload. This database constraint is a
-- second line of defense against filenames or titles that clearly identify an
-- identity document. It does not replace content scanning.
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS original_filename TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'documents_no_identity_document_labels_v2'
  ) THEN
    ALTER TABLE public.documents
      ADD CONSTRAINT documents_no_identity_document_labels_v2
      CHECK (
        lower(coalesce(title, '') || ' ' || coalesce(original_filename, '')) !~
        '(passport|driver[ _-]*(license|licence)|driving[ _-]*(license|licence)|government[ _-]*issued[ _-]*photo[ _-]*id|national[ _-]*(id|identification)|state[ _-]*id)'
      )
      NOT VALID;
  END IF;
END $$;

-- Authorization Code + PKCE (S256). Confidential clients may continue using
-- a client secret; public browser/mobile clients must bind a code to a verifier.
ALTER TABLE public.oauth_codes
  ADD COLUMN IF NOT EXISTS code_challenge TEXT,
  ADD COLUMN IF NOT EXISTS code_challenge_method TEXT;

-- Rotation time is operational metadata, not the secret or its hash. Existing
-- client metadata grants predate this column, so grant it explicitly.
GRANT SELECT (rotated_at) ON public.oauth_clients TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'oauth_codes_pkce_pair'
  ) THEN
    ALTER TABLE public.oauth_codes
      ADD CONSTRAINT oauth_codes_pkce_pair CHECK (
        (code_challenge IS NULL AND code_challenge_method IS NULL)
        OR (
          code_challenge_method = 'S256'
          AND length(code_challenge) BETWEEN 43 AND 128
          AND code_challenge ~ '^[A-Za-z0-9_-]+$'
        )
      );
  END IF;
END $$;

-- Align the first-party clients with the current, intentionally narrow claim
-- model. Verifiedly does not expose legacy trust-score scopes.
UPDATE public.oauth_clients
SET scopes = ARRAY['openid', 'profile', 'identity'],
    updated_at = now()
WHERE client_id IN ('gsn_app', 'globalis_app');

UPDATE public.oauth_clients
SET redirect_uris = ARRAY[
      'https://gsnmedia.app/auth/callback',
      'http://localhost:8080/auth/callback'
    ],
    updated_at = now()
WHERE client_id = 'gsn_app';

-- Atomically consume a short-lived authorization code after the token endpoint
-- has validated the client secret or PKCE verifier.
CREATE OR REPLACE FUNCTION public.consume_oauth_code(
  _code TEXT,
  _client_id TEXT,
  _redirect_uri TEXT
)
RETURNS TABLE (
  user_id UUID,
  scopes TEXT[],
  code_challenge TEXT,
  code_challenge_method TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.oauth_codes AS authorization_code
  SET used = true
  WHERE authorization_code.code = _code
    AND authorization_code.client_id = _client_id
    AND authorization_code.redirect_uri = _redirect_uri
    AND authorization_code.used = false
    AND authorization_code.expires_at > now()
  RETURNING
    authorization_code.user_id,
    authorization_code.scopes,
    authorization_code.code_challenge,
    authorization_code.code_challenge_method;
$$;

REVOKE ALL ON FUNCTION public.consume_oauth_code(TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_oauth_code(TEXT, TEXT, TEXT) TO service_role;
