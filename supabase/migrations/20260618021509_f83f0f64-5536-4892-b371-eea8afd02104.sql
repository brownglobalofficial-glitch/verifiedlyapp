
CREATE TABLE public.creator_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);
CREATE INDEX idx_creator_status_creator_active ON public.creator_status(creator_id, expires_at DESC);
CREATE INDEX idx_creator_status_expires ON public.creator_status(expires_at);

GRANT SELECT ON public.creator_status TO anon, authenticated;
GRANT INSERT, DELETE ON public.creator_status TO authenticated;
GRANT ALL ON public.creator_status TO service_role;

ALTER TABLE public.creator_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active statuses viewable by everyone"
  ON public.creator_status FOR SELECT
  USING (expires_at > now() OR auth.uid() = creator_id);

CREATE POLICY "Creators can post own status"
  ON public.creator_status FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can delete own status"
  ON public.creator_status FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_id);

-- Allow subscribers to see their own subscribe/unsubscribe events
-- so the dashboard "My subscriptions" view works.
CREATE POLICY "Subscribers can view own events"
  ON public.subscriber_events FOR SELECT
  TO authenticated
  USING (auth.uid() = subscriber_id);
