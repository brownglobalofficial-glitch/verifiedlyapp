
-- Create product-files storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('product-files', 'product-files', false);

-- Allow authenticated creators to upload files to their own folder
CREATE POLICY "Creators can upload product files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow creators to manage their own files
CREATE POLICY "Creators can update own product files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'product-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Creators can delete own product files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'product-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow anyone to read product files (download after purchase handled in app)
CREATE POLICY "Product files readable by everyone"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'product-files');
