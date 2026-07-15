
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
  dob_raw text;
  dob_parsed date;
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

  dob_raw := NULLIF(NEW.raw_user_meta_data->>'date_of_birth', '');
  BEGIN
    dob_parsed := dob_raw::date;
  EXCEPTION WHEN OTHERS THEN
    dob_parsed := NULL;
  END;

  BEGIN
    INSERT INTO public.profiles (id, username, display_name, account_type, category, referred_by, date_of_birth)
    VALUES (
      NEW.id,
      final_username,
      COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Creator'),
      COALESCE(NEW.raw_user_meta_data->>'account_type', 'creator'),
      NULLIF(NEW.raw_user_meta_data->>'category', ''),
      NULLIF(NEW.raw_user_meta_data->>'referred_by', ''),
      dob_parsed
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user profile insert failed for %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$function$;
