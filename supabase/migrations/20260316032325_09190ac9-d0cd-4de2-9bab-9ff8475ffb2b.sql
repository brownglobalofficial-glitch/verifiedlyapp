
-- Bio links for link-in-bio feature
CREATE TABLE public.bio_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text NOT NULL,
  icon text,
  thumbnail_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bio_links ENABLE ROW LEVEL SECURITY;

-- Public can view active links (needed for creator profile pages)
CREATE POLICY "Active links viewable by everyone"
  ON public.bio_links FOR SELECT
  TO public
  USING (is_active = true OR auth.uid() = creator_id);

-- Creators can manage their own links
CREATE POLICY "Creators can insert own links"
  ON public.bio_links FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own links"
  ON public.bio_links FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete own links"
  ON public.bio_links FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_id);

-- Link click tracking table (separate from bio_links.clicks for detailed analytics)
CREATE TABLE public.link_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES public.bio_links(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referrer text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.link_clicks ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a click (public tracking)
CREATE POLICY "Anyone can insert link clicks"
  ON public.link_clicks FOR INSERT
  TO public
  WITH CHECK (true);

-- Creators can view their own click data
CREATE POLICY "Creators can view own link clicks"
  ON public.link_clicks FOR SELECT
  TO authenticated
  USING (auth.uid() = creator_id);

-- Trigger to update bio_links.clicks count
CREATE OR REPLACE FUNCTION public.increment_link_clicks()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  UPDATE public.bio_links SET clicks = clicks + 1 WHERE id = NEW.link_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_link_click_increment
  AFTER INSERT ON public.link_clicks
  FOR EACH ROW EXECUTE FUNCTION public.increment_link_clicks();

-- Updated at trigger
CREATE TRIGGER update_bio_links_updated_at
  BEFORE UPDATE ON public.bio_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
