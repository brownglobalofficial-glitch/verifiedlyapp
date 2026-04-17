
-- 1. Create creator_private_data table with strict owner-only RLS
CREATE TABLE IF NOT EXISTS public.creator_private_data (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_email text,
  paypal_email text,
  stripe_connect_account_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.creator_private_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner can read own private data" ON public.creator_private_data;
CREATE POLICY "Owner can read own private data"
  ON public.creator_private_data FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Owner can insert own private data" ON public.creator_private_data;
CREATE POLICY "Owner can insert own private data"
  ON public.creator_private_data FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Owner can update own private data" ON public.creator_private_data;
CREATE POLICY "Owner can update own private data"
  ON public.creator_private_data FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Backfill existing sensitive data from profiles
INSERT INTO public.creator_private_data (id, contact_email, paypal_email, stripe_connect_account_id)
SELECT id, contact_email, paypal_email, stripe_connect_account_id
FROM public.profiles
WHERE contact_email IS NOT NULL OR paypal_email IS NOT NULL OR stripe_connect_account_id IS NOT NULL
ON CONFLICT (id) DO UPDATE SET
  contact_email = COALESCE(EXCLUDED.contact_email, public.creator_private_data.contact_email),
  paypal_email = COALESCE(EXCLUDED.paypal_email, public.creator_private_data.paypal_email),
  stripe_connect_account_id = COALESCE(EXCLUDED.stripe_connect_account_id, public.creator_private_data.stripe_connect_account_id);

CREATE TRIGGER update_creator_private_data_updated_at
BEFORE UPDATE ON public.creator_private_data
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Revoke sensitive columns on profiles from anon/authenticated so the public SELECT policy
-- cannot expose paypal_email, contact_email, stripe_connect_account_id, or referral_code.
REVOKE SELECT (paypal_email, contact_email, stripe_connect_account_id, referral_code)
  ON public.profiles FROM anon, authenticated;

-- Owners still need to read their own sensitive cols via a SECURITY DEFINER function if needed,
-- but referral_code is shown on the dashboard. Provide a function to fetch it for the owner only.
CREATE OR REPLACE FUNCTION public.get_my_referral_code()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT referral_code FROM public.profiles WHERE id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_my_referral_code() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_referral_code() TO authenticated;

-- 3. Restrict earnings INSERT to service_role only (prevent fabrication)
DROP POLICY IF EXISTS "System can insert earnings" ON public.earnings;
CREATE POLICY "Service role can insert earnings"
  ON public.earnings FOR INSERT
  TO public
  WITH CHECK (auth.role() = 'service_role');
