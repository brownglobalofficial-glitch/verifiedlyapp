
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stripe_product_id text,
  ADD COLUMN IF NOT EXISTS stripe_price_id text;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS stripe_product_id text,
  ADD COLUMN IF NOT EXISTS stripe_price_month_id text,
  ADD COLUMN IF NOT EXISTS stripe_price_year_id text;

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_event_id text UNIQUE,
  event_type text NOT NULL,
  livemode boolean,
  payload_preview jsonb,
  received_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view webhook events"
ON public.webhook_events FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can insert webhook events"
ON public.webhook_events FOR INSERT TO public
WITH CHECK (auth.role() = 'service_role'::text);

CREATE INDEX IF NOT EXISTS idx_webhook_events_received_at ON public.webhook_events(received_at DESC);

CREATE OR REPLACE FUNCTION public.record_stripe_agreement(
  _context text,
  _ip text,
  _user_agent text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  INSERT INTO public.stripe_agreements (user_id, agreement_version, ip_address, user_agent, context)
  VALUES (auth.uid(), 'v1-2026-04', _ip, _user_agent, COALESCE(_context, 'onboarding'))
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;
