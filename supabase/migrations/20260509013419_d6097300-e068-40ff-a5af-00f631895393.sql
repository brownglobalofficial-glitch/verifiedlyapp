
-- 1. Revoke EXECUTE on internal SECURITY DEFINER functions (triggers + service-role-only helpers)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_referral_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_follower_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_link_clicks() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;

-- 2. Tighten always-true page_views insert policy
DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;
CREATE POLICY "Anyone can insert valid page views"
  ON public.page_views FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = page_views.creator_id)
  );

-- 3. Seed launch promo code GSN -> grants Elite tier
INSERT INTO public.promo_codes (code, tier, is_active, notes)
VALUES ('GSN', 'elite', true, 'Founder / launch grant')
ON CONFLICT (code) DO UPDATE
  SET tier = EXCLUDED.tier,
      is_active = true,
      notes = COALESCE(public.promo_codes.notes, EXCLUDED.notes);
