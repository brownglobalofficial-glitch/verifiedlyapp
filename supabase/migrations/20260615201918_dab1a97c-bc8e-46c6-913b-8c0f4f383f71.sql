
-- 1. Upgrade verified_socials with real verification fields
ALTER TABLE public.verified_socials
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending','verified','failed')),
  ADD COLUMN IF NOT EXISTS verification_code TEXT,
  ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_error TEXT;

-- Backfill: pre-existing rows had method='manual'; treat them as pending so they can be re-verified.
UPDATE public.verified_socials SET verification_status = 'pending' WHERE verification_status IS NULL;

-- 2. Update recompute to only count *verified* socials
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

  SELECT (email_confirmed_at IS NOT NULL) INTO email_confirmed
    FROM auth.users WHERE id = _user_id;
  IF email_confirmed THEN score := score + 10; END IF;

  IF p.username IS NOT NULL AND length(p.username) >= 3 THEN score := score + 5; END IF;
  IF p.avatar_url IS NOT NULL AND length(p.avatar_url) > 0 THEN score := score + 5; END IF;

  SELECT COUNT(*) INTO links_count FROM public.bio_links WHERE creator_id = _user_id;
  IF p.bio IS NOT NULL AND length(p.bio) >= 10 AND links_count >= 1 THEN score := score + 10; END IF;

  SELECT * INTO cp FROM public.creator_private_data WHERE id = _user_id;
  IF FOUND AND cp.stripe_charges_enabled = true THEN score := score + 30; END IF;

  SELECT COUNT(*) INTO social_count FROM public.verified_socials
    WHERE user_id = _user_id AND verification_status = 'verified';
  score := score + LEAST(social_count * 15, 30);

  IF p.domain_verified = true THEN score := score + 10; END IF;

  score := LEAST(score, 100);
  UPDATE public.profiles SET trust_score = score WHERE id = _user_id;
  RETURN score;
END;
$$;

-- 3. Recompute-all helper for the scheduler
CREATE OR REPLACE FUNCTION public.recompute_all_trust_scores()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n INTEGER := 0; r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.profiles LOOP
    PERFORM public.recompute_trust_score(r.id);
    n := n + 1;
  END LOOP;
  RETURN n;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.recompute_all_trust_scores() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recompute_all_trust_scores() FROM authenticated, anon;

-- 4. pg_cron + nightly job (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'verifiedly-trust-score-nightly') THEN
    PERFORM cron.unschedule('verifiedly-trust-score-nightly');
  END IF;
  PERFORM cron.schedule(
    'verifiedly-trust-score-nightly',
    '17 5 * * *',  -- 05:17 UTC daily
    $cron$ SELECT public.recompute_all_trust_scores(); $cron$
  );
END $$;

-- 5. OAuth client registry (Sign in with Verifiedly)
CREATE TABLE IF NOT EXISTS public.oauth_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL UNIQUE,
  client_secret_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  redirect_uris TEXT[] NOT NULL DEFAULT '{}',
  scopes TEXT[] NOT NULL DEFAULT ARRAY['profile','trust'],
  logo_url TEXT,
  homepage_url TEXT,
  is_first_party BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.oauth_clients TO service_role;
GRANT SELECT (id, client_id, name, redirect_uris, scopes, logo_url, homepage_url, is_first_party, active) ON public.oauth_clients TO authenticated;
ALTER TABLE public.oauth_clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read active oauth clients metadata"
  ON public.oauth_clients FOR SELECT
  TO authenticated
  USING (active = true);
CREATE POLICY "Admins manage oauth clients"
  ON public.oauth_clients FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 6. Authorization codes (short-lived)
CREATE TABLE IF NOT EXISTS public.oauth_codes (
  code TEXT NOT NULL PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES public.oauth_clients(client_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  redirect_uri TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.oauth_codes TO service_role;
ALTER TABLE public.oauth_codes ENABLE ROW LEVEL SECURITY;
-- No client-facing policies — only service_role (edge functions) touch this.

-- 7. Access tokens
CREATE TABLE IF NOT EXISTS public.oauth_tokens (
  access_token TEXT NOT NULL PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES public.oauth_clients(client_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.oauth_tokens TO service_role;
ALTER TABLE public.oauth_tokens ENABLE ROW LEVEL SECURITY;

-- 8. Seed first-party clients (GSN + Globalis). Secrets random; admins rotate later.
INSERT INTO public.oauth_clients (client_id, client_secret_hash, name, redirect_uris, scopes, is_first_party, active)
VALUES
  ('gsn_app', encode(digest(gen_random_uuid()::text || gen_random_uuid()::text,'sha256'),'hex'),
   'GSN', ARRAY['https://gsn.lovable.app/auth/callback','http://localhost:8080/auth/callback'],
   ARRAY['profile','trust'], true, true),
  ('globalis_app', encode(digest(gen_random_uuid()::text || gen_random_uuid()::text,'sha256'),'hex'),
   'Globalis AI Companion', ARRAY['https://globalis.lovable.app/auth/callback','http://localhost:8080/auth/callback'],
   ARRAY['profile','trust'], true, true)
ON CONFLICT (client_id) DO NOTHING;
