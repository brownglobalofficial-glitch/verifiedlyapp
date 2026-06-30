ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tip_button_label TEXT,
  ADD COLUMN IF NOT EXISTS membership_button_label TEXT;