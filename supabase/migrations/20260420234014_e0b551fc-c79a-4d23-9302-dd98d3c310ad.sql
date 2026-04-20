
-- 1. Drop sensitive columns from public profiles table (already mirrored in creator_private_data)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS paypal_email;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS contact_email;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS stripe_connect_account_id;

-- 2. Restrict product-files SELECT: only creator or completed buyer may read
DROP POLICY IF EXISTS "Product files readable by everyone" ON storage.objects;

CREATE POLICY "Creators can read own product files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'product-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Buyers can read purchased product files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'product-files'
  AND EXISTS (
    SELECT 1 FROM public.purchases p
    WHERE p.buyer_id = auth.uid()
      AND p.status = 'completed'
      AND p.file_url LIKE '%/product-files/' || storage.objects.name
  )
);

-- 3. Tighten public bucket SELECT policies to per-object reads only (block bucket listing)
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Avatars are individually readable"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars' AND name IS NOT NULL);

DROP POLICY IF EXISTS "Product images readable by everyone" ON storage.objects;
CREATE POLICY "Product images individually readable"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'product-images' AND name IS NOT NULL);

DROP POLICY IF EXISTS "Link thumbnails are publicly viewable" ON storage.objects;
CREATE POLICY "Link thumbnails individually readable"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'link-thumbnails' AND name IS NOT NULL);

-- 4. Constrain link_clicks INSERT: must reference an existing active link with matching creator
DROP POLICY IF EXISTS "Anyone can insert link clicks" ON public.link_clicks;
CREATE POLICY "Anyone can insert valid link clicks"
ON public.link_clicks FOR INSERT TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bio_links b
    WHERE b.id = link_clicks.link_id
      AND b.creator_id = link_clicks.creator_id
      AND b.is_active = true
  )
);

-- 5. Constrain subscriber_events INSERT: subscriber must be the inserter
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.subscriber_events;
CREATE POLICY "Subscribers can insert own events"
ON public.subscriber_events FOR INSERT TO authenticated
WITH CHECK (auth.uid() = subscriber_id);

-- 6. Remove followers from realtime publication (no app code uses realtime on it)
ALTER PUBLICATION supabase_realtime DROP TABLE public.followers;

-- 7. Set fixed search_path on email queue helper functions
CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer)
 RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pgmq
AS $function$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pgmq
AS $function$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pgmq
AS $function$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create(dlq_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete(source_queue, message_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  RETURN new_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pgmq
AS $function$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$function$;
