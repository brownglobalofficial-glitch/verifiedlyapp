-- Creator content table for videos, live streams, posts
CREATE TABLE public.creator_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL DEFAULT 'video',
  file_url TEXT,
  thumbnail_url TEXT,
  live_stream_url TEXT,
  visibility TEXT NOT NULL DEFAULT 'subscribers',
  subscription_tier_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.creator_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public content viewable by everyone"
  ON public.creator_content FOR SELECT
  USING (visibility = 'public' AND is_published = true);

CREATE POLICY "Creator content viewable by creator"
  ON public.creator_content FOR SELECT
  TO authenticated
  USING (auth.uid() = creator_id);

CREATE POLICY "Subscriber content viewable by followers"
  ON public.creator_content FOR SELECT
  TO authenticated
  USING (
    is_published = true
    AND visibility = 'subscribers'
    AND EXISTS (
      SELECT 1 FROM public.followers
      WHERE followers.creator_id = creator_content.creator_id
        AND followers.follower_id = auth.uid()
    )
  );

CREATE POLICY "Creators can insert own content"
  ON public.creator_content FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own content"
  ON public.creator_content FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete own content"
  ON public.creator_content FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_id);

-- Subscription perks table
CREATE TABLE public.subscription_perks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  perk_name TEXT NOT NULL,
  perk_description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_perks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view perks"
  ON public.subscription_perks FOR SELECT
  USING (true);

CREATE POLICY "Creators can insert own perks"
  ON public.subscription_perks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own perks"
  ON public.subscription_perks FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete own perks"
  ON public.subscription_perks FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_id);

-- Trigger for updated_at on creator_content
CREATE TRIGGER update_creator_content_updated_at
  BEFORE UPDATE ON public.creator_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for creator videos
INSERT INTO storage.buckets (id, name, public) VALUES ('creator-videos', 'creator-videos', false);

CREATE POLICY "Creators can upload videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'creator-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Creators can view own videos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'creator-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Subscribers can view creator videos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'creator-videos'
    AND EXISTS (
      SELECT 1 FROM public.followers
      WHERE followers.creator_id = (storage.foldername(name))[1]::uuid
        AND followers.follower_id = auth.uid()
    )
  );

CREATE POLICY "Creators can delete own videos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'creator-videos' AND auth.uid()::text = (storage.foldername(name))[1]);
