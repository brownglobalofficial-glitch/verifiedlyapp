-- Use one hosted global KYB provider for the initial organization-verification pilot.
-- Coverage still must be confirmed before checkout or a provider order is created.
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

  SELECT id INTO _request_id
  FROM public.business_verification_requests
  WHERE user_id = _user_id
    AND status IN ('provider_setup_required', 'pending', 'in_review', 'needs_action')
  ORDER BY created_at DESC
  LIMIT 1;

  IF _request_id IS NULL THEN
    INSERT INTO public.business_verification_requests (user_id, provider)
    VALUES (_user_id, 'persona')
    RETURNING id INTO _request_id;
  END IF;

  RETURN _request_id;
END;
$$;

REVOKE ALL ON FUNCTION public.request_business_verification() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_business_verification() TO authenticated;
