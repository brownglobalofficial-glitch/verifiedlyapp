
-- Public: check if a creator has Stripe Connect set up (boolean only)
CREATE OR REPLACE FUNCTION public.creator_has_payments(_creator_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.creator_private_data
    WHERE id = _creator_id AND stripe_connect_account_id IS NOT NULL
  );
$$;
REVOKE ALL ON FUNCTION public.creator_has_payments(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.creator_has_payments(uuid) TO anon, authenticated;

-- Owner-only: get own private data
CREATE OR REPLACE FUNCTION public.get_my_private_data()
RETURNS TABLE(contact_email text, paypal_email text, stripe_connect_account_id text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT contact_email, paypal_email, stripe_connect_account_id
  FROM public.creator_private_data WHERE id = auth.uid();
$$;
REVOKE ALL ON FUNCTION public.get_my_private_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_private_data() TO authenticated;
