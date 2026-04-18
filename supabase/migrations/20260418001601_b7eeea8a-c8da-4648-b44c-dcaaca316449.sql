
INSERT INTO storage.buckets (id, name, public)
VALUES ('link-thumbnails', 'link-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Link thumbnails are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'link-thumbnails');

CREATE POLICY "Creators can upload own link thumbnails"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'link-thumbnails'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Creators can update own link thumbnails"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'link-thumbnails'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Creators can delete own link thumbnails"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'link-thumbnails'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
