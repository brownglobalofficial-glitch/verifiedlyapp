-- The profiles table historically had a public SELECT policy. PostgreSQL table-
-- level SELECT grants can override column revokes, so replace broad grants with
-- an explicit public allow-list. Detailed identity outputs remain available to
-- service-role Edge Functions and consented OAuth responses only.

REVOKE SELECT ON public.profiles FROM anon, authenticated, PUBLIC;

GRANT SELECT (
  id,
  username,
  display_name,
  bio,
  website,
  avatar_url,
  social_links,
  account_type,
  category,
  theme_color,
  id_verified,
  verified_at,
  created_at,
  updated_at,
  link_layout
) ON public.profiles TO anon;

GRANT SELECT (
  id,
  username,
  display_name,
  bio,
  website,
  avatar_url,
  social_links,
  account_type,
  category,
  theme_color,
  id_verified,
  verified_at,
  created_at,
  updated_at,
  link_layout,
  onboarding_completed,
  is_pro,
  is_elite,
  is_featured
) ON public.profiles TO authenticated;

GRANT SELECT ON public.profiles TO service_role;

-- Owners may edit profile content, but identity, billing, trust, role, and
-- internal status fields are server-controlled. RLS still limits these column
-- grants to the user's own row.
REVOKE INSERT, UPDATE ON public.profiles FROM anon, authenticated, PUBLIC;

GRANT INSERT (
  id,
  username,
  display_name,
  bio,
  website,
  avatar_url,
  social_links,
  account_type,
  category,
  theme_color,
  onboarding_completed,
  link_layout
) ON public.profiles TO authenticated;

GRANT UPDATE (
  username,
  display_name,
  bio,
  website,
  avatar_url,
  social_links,
  account_type,
  category,
  theme_color,
  onboarding_completed,
  link_layout
) ON public.profiles TO authenticated;

GRANT INSERT, UPDATE ON public.profiles TO service_role;
