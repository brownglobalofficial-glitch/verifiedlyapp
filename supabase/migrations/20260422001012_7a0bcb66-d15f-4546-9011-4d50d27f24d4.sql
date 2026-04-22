
CREATE TABLE public.stripe_agreements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  agreement_version text NOT NULL DEFAULT 'v1-2026-04',
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  context text NOT NULL DEFAULT 'onboarding'
);

ALTER TABLE public.stripe_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own agreement"
ON public.stripe_agreements
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own agreement"
ON public.stripe_agreements
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_stripe_agreements_user ON public.stripe_agreements(user_id, accepted_at DESC);
