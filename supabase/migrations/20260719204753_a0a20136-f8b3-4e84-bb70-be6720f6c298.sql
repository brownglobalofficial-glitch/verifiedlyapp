
-- verifiedly_billing: one row per user tracking payments/entitlements
CREATE TABLE IF NOT EXISTS public.verifiedly_billing (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  verification_payment_status TEXT NOT NULL DEFAULT 'unpaid',
  verification_checkout_session_id TEXT,
  identity_status TEXT NOT NULL DEFAULT 'unverified',
  identity_attempt_count INTEGER NOT NULL DEFAULT 0,
  identity_last_session_id TEXT,
  documents_status TEXT NOT NULL DEFAULT 'inactive',
  documents_interval TEXT,
  documents_current_period_end TIMESTAMPTZ,
  documents_cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.verifiedly_billing TO authenticated;
GRANT ALL ON public.verifiedly_billing TO service_role;
ALTER TABLE public.verifiedly_billing ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own billing readable" ON public.verifiedly_billing;
CREATE POLICY "Own billing readable" ON public.verifiedly_billing FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP TRIGGER IF EXISTS trg_verifiedly_billing_updated ON public.verifiedly_billing;
CREATE TRIGGER trg_verifiedly_billing_updated BEFORE UPDATE ON public.verifiedly_billing
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- document_share_links
CREATE TABLE IF NOT EXISTS public.document_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  password_hash TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  max_views INTEGER,
  view_count INTEGER NOT NULL DEFAULT 0,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.document_share_links TO authenticated;
GRANT ALL ON public.document_share_links TO service_role;
ALTER TABLE public.document_share_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner manages shares" ON public.document_share_links;
CREATE POLICY "Owner manages shares" ON public.document_share_links FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
DROP TRIGGER IF EXISTS trg_document_share_links_updated ON public.document_share_links;
CREATE TRIGGER trg_document_share_links_updated BEFORE UPDATE ON public.document_share_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- business_verification_requests
CREATE TABLE IF NOT EXISTS public.business_verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'middesk',
  status TEXT NOT NULL DEFAULT 'provider_setup_required',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.business_verification_requests TO authenticated;
GRANT ALL ON public.business_verification_requests TO service_role;
ALTER TABLE public.business_verification_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Org reads own biz requests" ON public.business_verification_requests;
CREATE POLICY "Org reads own biz requests" ON public.business_verification_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
DROP TRIGGER IF EXISTS trg_business_verification_requests_updated ON public.business_verification_requests;
CREATE TRIGGER trg_business_verification_requests_updated BEFORE UPDATE ON public.business_verification_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RPC: request_credential_verification
CREATE OR REPLACE FUNCTION public.request_credential_verification(_section_id UUID, _credential_type TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _user_id UUID := auth.uid();
  _section public.profile_sections%ROWTYPE;
  _verification_id UUID;
  _title TEXT;
  _issuer TEXT;
BEGIN
  IF _user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF _credential_type NOT IN ('education','license','certification') THEN RAISE EXCEPTION 'Unsupported credential type'; END IF;
  SELECT * INTO _section FROM public.profile_sections WHERE id = _section_id AND user_id = _user_id;
  IF NOT FOUND OR _section.kind NOT IN ('education','credential') THEN RAISE EXCEPTION 'Credential section not found'; END IF;
  _title := CASE WHEN _section.kind = 'education' THEN COALESCE(NULLIF(_section.data->>'program',''), NULLIF(_section.data->>'school',''), 'Education credential')
                 ELSE COALESCE(NULLIF(_section.data->>'name',''), 'Professional credential') END;
  _issuer := CASE WHEN _section.kind = 'education' THEN NULLIF(_section.data->>'school','')
                  ELSE NULLIF(_section.data->>'issuer','') END;
  INSERT INTO public.credential_verifications (user_id, section_id, credential_type, provider, provider_name, status, verified_title, verified_issuer)
    VALUES (_user_id, _section_id, _credential_type, 'checkr', 'Checkr', 'provider_setup_required', _title, _issuer)
    ON CONFLICT (section_id) DO UPDATE SET credential_type = EXCLUDED.credential_type,
      verified_title = EXCLUDED.verified_title, verified_issuer = EXCLUDED.verified_issuer, updated_at = now()
    RETURNING id INTO _verification_id;
  RETURN _verification_id;
END;
$$;
REVOKE ALL ON FUNCTION public.request_credential_verification(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_credential_verification(UUID, TEXT) TO authenticated;

-- RPC: request_business_verification
CREATE OR REPLACE FUNCTION public.request_business_verification()
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _user_id UUID := auth.uid();
  _profile public.profiles%ROWTYPE;
  _request_id UUID;
BEGIN
  IF _user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT * INTO _profile FROM public.profiles WHERE id = _user_id;
  IF NOT FOUND OR _profile.account_type <> 'business' THEN RAISE EXCEPTION 'An organization profile is required'; END IF;
  IF coalesce(trim(_profile.organization_legal_name),'') = ''
     OR coalesce(trim(_profile.organization_country),'') = '' THEN
    RAISE EXCEPTION 'Add a legal name and registered country first';
  END IF;
  INSERT INTO public.business_verification_requests (user_id, provider, status)
    VALUES (_user_id, 'middesk', 'provider_setup_required')
    RETURNING id INTO _request_id;
  RETURN _request_id;
END;
$$;
REVOKE ALL ON FUNCTION public.request_business_verification() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_business_verification() TO authenticated;
