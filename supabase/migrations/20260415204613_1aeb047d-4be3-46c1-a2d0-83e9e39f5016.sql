
-- Remove purchases from realtime (IF EXISTS not supported, so use DO block)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'purchases'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.purchases;
  END IF;
END $$;
