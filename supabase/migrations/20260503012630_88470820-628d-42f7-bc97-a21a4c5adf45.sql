-- Prevent duplicate processing of the same Stripe webhook event
CREATE UNIQUE INDEX IF NOT EXISTS webhook_events_stripe_event_id_unique
  ON public.webhook_events (stripe_event_id)
  WHERE stripe_event_id IS NOT NULL;