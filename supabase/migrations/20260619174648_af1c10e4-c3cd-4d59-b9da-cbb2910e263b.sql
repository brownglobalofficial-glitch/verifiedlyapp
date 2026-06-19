ALTER TABLE public.subscription_perks
  ADD COLUMN IF NOT EXISTS unlock_url TEXT,
  ADD COLUMN IF NOT EXISTS perk_type TEXT NOT NULL DEFAULT 'standard';

COMMENT ON COLUMN public.subscription_perks.unlock_url IS 'Optional link revealed to active subscribers (e.g. Discord invite, Notion doc, Drive folder).';
COMMENT ON COLUMN public.subscription_perks.perk_type IS 'standard | community | content | discount';