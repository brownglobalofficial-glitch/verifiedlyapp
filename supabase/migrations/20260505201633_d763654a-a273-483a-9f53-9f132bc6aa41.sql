
CREATE TABLE IF NOT EXISTS public.payout_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type text NOT NULL,
  seller_user_id uuid,
  destination_stripe_account_id text,
  buyer_user_id uuid,
  buyer_email text,
  gross_amount numeric NOT NULL DEFAULT 0,
  platform_fee numeric NOT NULL DEFAULT 0,
  net_amount numeric NOT NULL DEFAULT 0,
  platform_fee_percent numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'usd',
  stripe_event_id text,
  stripe_session_id text,
  stripe_invoice_id text,
  stripe_payment_intent_id text,
  stripe_subscription_id text,
  reference_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS payout_ledger_event_unique
  ON public.payout_ledger (stripe_event_id, transaction_type)
  WHERE stripe_event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS payout_ledger_seller_idx ON public.payout_ledger (seller_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS payout_ledger_type_idx ON public.payout_ledger (transaction_type, created_at DESC);

ALTER TABLE public.payout_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read ledger"
  ON public.payout_ledger FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can insert ledger"
  ON public.payout_ledger FOR INSERT TO public
  WITH CHECK (auth.role() = 'service_role');
