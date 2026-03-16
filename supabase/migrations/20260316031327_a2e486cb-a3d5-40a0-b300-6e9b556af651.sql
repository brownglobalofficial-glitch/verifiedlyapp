
-- Page views tracking
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewer_ip_hash text,
  referrer text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a page view (public profiles)
CREATE POLICY "Anyone can insert page views"
  ON public.page_views FOR INSERT
  TO public
  WITH CHECK (true);

-- Creators can view their own page views
CREATE POLICY "Creators can view own page views"
  ON public.page_views FOR SELECT
  TO authenticated
  USING (auth.uid() = creator_id);

-- Earnings tracking
CREATE TABLE public.earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'tip',
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view own earnings"
  ON public.earnings FOR SELECT
  TO authenticated
  USING (auth.uid() = creator_id);

CREATE POLICY "System can insert earnings"
  ON public.earnings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Subscriber events
CREATE TABLE public.subscriber_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscriber_id uuid REFERENCES public.profiles(id),
  event_type text NOT NULL DEFAULT 'subscribe',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriber_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view own subscriber events"
  ON public.subscriber_events FOR SELECT
  TO authenticated
  USING (auth.uid() = creator_id);

CREATE POLICY "Anyone can subscribe"
  ON public.subscriber_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Social media analytics (linked accounts stats)
CREATE TABLE public.social_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform text NOT NULL,
  followers integer DEFAULT 0,
  clicks integer DEFAULT 0,
  last_synced_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(creator_id, platform)
);

ALTER TABLE public.social_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view own social analytics"
  ON public.social_analytics FOR SELECT
  TO authenticated
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can upsert own social analytics"
  ON public.social_analytics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own social analytics"
  ON public.social_analytics FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id);

-- Add updated_at triggers
CREATE TRIGGER update_social_analytics_updated_at
  BEFORE UPDATE ON public.social_analytics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_earnings_updated_at
  BEFORE UPDATE ON public.earnings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
