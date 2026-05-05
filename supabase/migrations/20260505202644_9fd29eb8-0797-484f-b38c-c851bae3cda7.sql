
-- 1) Add tips_enabled to profiles (default ON for creators/businesses)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tips_enabled boolean NOT NULL DEFAULT true;

-- 2) Lock down SECURITY DEFINER functions: revoke EXECUTE from PUBLIC and
-- anon for everything; grant back to authenticated only where users need it.

-- Helpers / RLS-supporting functions: keep callable by authenticated only
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_my_referral_code() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_my_referral_code() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_my_private_data() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_my_private_data() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.creator_has_payments(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.creator_has_payments(uuid) TO anon, authenticated;
-- ^ public profile pages need this for logged-out viewers (Tip button visibility)

REVOKE EXECUTE ON FUNCTION public.get_creator_payout_status(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_creator_payout_status(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.record_stripe_agreement(text, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.record_stripe_agreement(text, text, text) TO authenticated;

-- Trigger-only functions: revoke from everyone, triggers run as table owner
REVOKE EXECUTE ON FUNCTION public.generate_referral_code()       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_follower_count()        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column()     FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_link_clicks()        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()              FROM PUBLIC, anon, authenticated;

-- Email queue helpers: only the service role / cron should call these
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint)               FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb)               FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb)   FROM PUBLIC, anon, authenticated;
