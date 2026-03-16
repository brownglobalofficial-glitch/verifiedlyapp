
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme_color text DEFAULT 'default';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS product_type text DEFAULT 'digital' NOT NULL;

ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS features text[];
