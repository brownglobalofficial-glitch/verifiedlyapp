
-- Add new columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS category text DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_type text DEFAULT 'creator';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by text DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_elite boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

-- Generate referral codes for existing profiles
UPDATE public.profiles SET referral_code = LOWER(SUBSTR(MD5(id::text || NOW()::text), 1, 8)) WHERE referral_code IS NULL;

-- Function to auto-generate referral code on new profile
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := LOWER(SUBSTR(MD5(NEW.id::text || NOW()::text), 1, 8));
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER set_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_referral_code();
