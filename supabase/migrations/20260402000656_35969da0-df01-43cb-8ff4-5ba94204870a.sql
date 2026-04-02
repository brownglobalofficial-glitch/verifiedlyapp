
CREATE TABLE public.purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID,
  buyer_email TEXT,
  creator_id UUID NOT NULL,
  product_id UUID,
  amount NUMERIC NOT NULL DEFAULT 0,
  stripe_session_id TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  product_name TEXT,
  product_image_url TEXT,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view own purchases"
ON public.purchases FOR SELECT
TO authenticated
USING (auth.uid() = buyer_id);

CREATE POLICY "Creators can view purchases of their products"
ON public.purchases FOR SELECT
TO authenticated
USING (auth.uid() = creator_id);

CREATE POLICY "Service role can insert purchases"
ON public.purchases FOR INSERT
TO public
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update purchases"
ON public.purchases FOR UPDATE
TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

ALTER PUBLICATION supabase_realtime ADD TABLE public.purchases;
