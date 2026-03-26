
-- Update handle_new_user to save new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, account_type, category, referred_by)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', LOWER(REPLACE(NEW.id::text, '-', ''))),
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Creator'),
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'creator'),
    NULLIF(NEW.raw_user_meta_data->>'category', ''),
    NULLIF(NEW.raw_user_meta_data->>'referred_by', '')
  );
  RETURN NEW;
END;
$function$;
