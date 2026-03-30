
-- Add contact_email to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS contact_email text;

-- Create followers table
CREATE TABLE IF NOT EXISTS public.followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(follower_id, creator_id)
);

ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can see followers
CREATE POLICY "Anyone can view followers" ON public.followers FOR SELECT TO public USING (true);

-- Users can follow
CREATE POLICY "Users can follow" ON public.followers FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow
CREATE POLICY "Users can unfollow" ON public.followers FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- Add follower_count to profiles for display
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS follower_count integer DEFAULT 0;

-- Trigger to update follower count
CREATE OR REPLACE FUNCTION public.update_follower_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET follower_count = follower_count + 1 WHERE id = NEW.creator_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET follower_count = GREATEST(0, follower_count - 1) WHERE id = OLD.creator_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_follow_change
AFTER INSERT OR DELETE ON public.followers
FOR EACH ROW EXECUTE FUNCTION public.update_follower_count();

-- Enable realtime for followers
ALTER PUBLICATION supabase_realtime ADD TABLE public.followers;
