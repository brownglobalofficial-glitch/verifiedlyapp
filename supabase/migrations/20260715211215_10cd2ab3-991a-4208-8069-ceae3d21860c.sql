
-- 1) OAuth clients: remove client_secret_hash from anon/authenticated SELECT
REVOKE SELECT (client_secret_hash) ON public.oauth_clients FROM anon, authenticated;

-- 2) Subscription perks: hide unlock_code and unlock_url from public reads
REVOKE SELECT (unlock_code, unlock_url) ON public.subscription_perks FROM anon, authenticated;

-- 3) Profiles: block email addresses inside the public bio field
CREATE OR REPLACE FUNCTION public.prevent_email_in_bio()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.bio IS NOT NULL AND NEW.bio ~* '[[:alnum:]._%+-]+@[[:alnum:].-]+\.[[:alpha:]]{2,}' THEN
    RAISE EXCEPTION 'Email addresses are not allowed in your bio. Please remove any email address before saving.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_email_in_bio ON public.profiles;
CREATE TRIGGER profiles_prevent_email_in_bio
BEFORE INSERT OR UPDATE OF bio ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_email_in_bio();

-- Sanitize existing offending rows (redact any email-looking token to keep public bios safe)
UPDATE public.profiles
SET bio = regexp_replace(bio, '[[:alnum:]._%+-]+@[[:alnum:].-]+\.[[:alpha:]]{2,}', '[email hidden]', 'gi')
WHERE bio ~* '[[:alnum:]._%+-]+@[[:alnum:].-]+\.[[:alpha:]]{2,}';

-- 4) SECURITY DEFINER functions: revoke public execute from utility/internal functions.
-- Keep user-facing helpers callable by authenticated where needed.
REVOKE EXECUTE ON FUNCTION public.recompute_trust_score(uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recompute_all_trust_scores() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.email_queue_wake() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_referral_code() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_link_clicks() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_follower_count() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_email_in_bio() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.creator_has_payments(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_age_over(uuid, integer) FROM anon, PUBLIC;
