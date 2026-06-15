
-- Trust score columns on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trust_score INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS domain_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_domain TEXT;

-- Verified socials table
CREATE TABLE IF NOT EXISTS public.verified_socials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram','tiktok','x','youtube','twitch','github','linkedin')),
  handle TEXT NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  method TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.verified_socials TO authenticated;
GRANT SELECT ON public.verified_socials TO anon;
GRANT ALL ON public.verified_socials TO service_role;

ALTER TABLE public.verified_socials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Verified socials are publicly readable"
  ON public.verified_socials FOR SELECT
  USING (true);

CREATE POLICY "Users manage their own verified socials insert"
  ON public.verified_socials FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage their own verified socials update"
  ON public.verified_socials FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete their own verified socials"
  ON public.verified_socials FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Recompute function: pure, factual signals only
CREATE OR REPLACE FUNCTION public.recompute_trust_score(_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  score INTEGER := 0;
  p RECORD;
  cp RECORD;
  social_count INTEGER := 0;
  links_count INTEGER := 0;
  email_confirmed BOOLEAN := false;
BEGIN
  SELECT * INTO p FROM public.profiles WHERE id = _user_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  -- Email confirmed (via auth.users)
  SELECT (email_confirmed_at IS NOT NULL) INTO email_confirmed
    FROM auth.users WHERE id = _user_id;
  IF email_confirmed THEN score := score + 10; END IF;

  -- Username set (always true once profile exists)
  IF p.username IS NOT NULL AND length(p.username) >= 3 THEN
    score := score + 5;
  END IF;

  -- Avatar uploaded
  IF p.avatar_url IS NOT NULL AND length(p.avatar_url) > 0 THEN
    score := score + 5;
  END IF;

  -- Bio + at least one link
  SELECT COUNT(*) INTO links_count FROM public.bio_links WHERE creator_id = _user_id;
  IF p.bio IS NOT NULL AND length(p.bio) >= 10 AND links_count >= 1 THEN
    score := score + 10;
  END IF;

  -- Stripe Connect active (charges enabled)
  SELECT * INTO cp FROM public.creator_private_data WHERE id = _user_id;
  IF FOUND AND cp.stripe_charges_enabled = true THEN
    score := score + 30;
  END IF;

  -- Verified socials (15 pts each, cap 30)
  SELECT COUNT(*) INTO social_count FROM public.verified_socials WHERE user_id = _user_id;
  score := score + LEAST(social_count * 15, 30);

  -- Domain verified
  IF p.domain_verified = true THEN
    score := score + 10;
  END IF;

  score := LEAST(score, 100);

  UPDATE public.profiles SET trust_score = score WHERE id = _user_id;
  RETURN score;
END;
$$;

GRANT EXECUTE ON FUNCTION public.recompute_trust_score(UUID) TO authenticated;
