
-- Privacy & verification controls + dispute/audit infrastructure
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trust_score_opt_out boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trust_score_public boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS verified_socials_public boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS signal_breakdown_public boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS payout_status_public boolean NOT NULL DEFAULT true;

ALTER TABLE public.oauth_clients
  ADD COLUMN IF NOT EXISTS rotated_at timestamptz;

-- Disputes
CREATE TABLE IF NOT EXISTS public.verification_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  social_id uuid REFERENCES public.verified_socials(id) ON DELETE SET NULL,
  signal_type text NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  priority boolean NOT NULL DEFAULT false,
  admin_note text,
  resolved_by uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.verification_disputes TO authenticated;
GRANT ALL ON public.verification_disputes TO service_role;
ALTER TABLE public.verification_disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own disputes" ON public.verification_disputes
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users create own disputes" ON public.verification_disputes
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins update disputes" ON public.verification_disputes
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Trust score recompute errors
CREATE TABLE IF NOT EXISTS public.trust_score_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  error_message text NOT NULL,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.trust_score_errors TO authenticated;
GRANT ALL ON public.trust_score_errors TO service_role;
ALTER TABLE public.trust_score_errors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view trust errors" ON public.trust_score_errors
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update trust errors" ON public.trust_score_errors
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Verification audit log
CREATE TABLE IF NOT EXISTS public.verification_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id),
  target_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.verification_audit_log TO authenticated;
GRANT ALL ON public.verification_audit_log TO service_role;
ALTER TABLE public.verification_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view audit" ON public.verification_audit_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins insert audit" ON public.verification_audit_log
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_verification_disputes_updated
  BEFORE UPDATE ON public.verification_disputes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update recompute_trust_score to honor opt-out
CREATE OR REPLACE FUNCTION public.recompute_trust_score(_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- Respect opt-out: score forced to 0, no badge
  IF p.trust_score_opt_out = true THEN
    UPDATE public.profiles SET trust_score = 0 WHERE id = _user_id;
    RETURN 0;
  END IF;

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
$function$;
