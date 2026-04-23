
-- Harden handle_new_user: auto-resolve username conflicts and never block signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  base_username text;
  final_username text;
  attempt int := 0;
BEGIN
  base_username := LOWER(REGEXP_REPLACE(
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1), REPLACE(NEW.id::text, '-', '')),
    '[^a-z0-9_]', '', 'g'
  ));
  IF base_username IS NULL OR LENGTH(base_username) < 3 THEN
    base_username := 'user' || SUBSTR(REPLACE(NEW.id::text, '-', ''), 1, 8);
  END IF;
  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    attempt := attempt + 1;
    final_username := base_username || SUBSTR(MD5(NEW.id::text || attempt::text), 1, 4);
    IF attempt > 10 THEN
      final_username := base_username || SUBSTR(REPLACE(NEW.id::text, '-', ''), 1, 8);
      EXIT;
    END IF;
  END LOOP;

  BEGIN
    INSERT INTO public.profiles (id, username, display_name, account_type, category, referred_by)
    VALUES (
      NEW.id,
      final_username,
      COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Creator'),
      COALESCE(NEW.raw_user_meta_data->>'account_type', 'creator'),
      NULLIF(NEW.raw_user_meta_data->>'category', ''),
      NULLIF(NEW.raw_user_meta_data->>'referred_by', '')
    );
  EXCEPTION WHEN OTHERS THEN
    -- Never block auth signup if profile insert fails
    RAISE WARNING 'handle_new_user profile insert failed for %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$function$;

-- Backfill missing profiles for existing auth users
INSERT INTO public.profiles (id, username, display_name, account_type)
SELECT
  u.id,
  'user' || SUBSTR(REPLACE(u.id::text, '-', ''), 1, 12),
  COALESCE(u.raw_user_meta_data->>'display_name', u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', 'Creator'),
  COALESCE(u.raw_user_meta_data->>'account_type', 'creator')
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;
