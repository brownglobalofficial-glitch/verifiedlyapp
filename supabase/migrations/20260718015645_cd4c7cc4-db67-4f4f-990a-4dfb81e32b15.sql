
-- Profile sections for identity-first builder
CREATE TABLE public.profile_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profile_sections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_sections TO authenticated;
GRANT ALL ON public.profile_sections TO service_role;
ALTER TABLE public.profile_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public sections are visible" ON public.profile_sections FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Owners manage own sections" ON public.profile_sections FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_profile_sections_updated BEFORE UPDATE ON public.profile_sections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_profile_sections_user_pos ON public.profile_sections(user_id, position);

-- Document vault (Pro-only, private storage)
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  doc_type TEXT NOT NULL,
  issuer TEXT,
  issue_date DATE,
  expiry_date DATE,
  storage_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.documents TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public docs are visible" ON public.documents FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Owners manage own docs" ON public.documents FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_documents_updated BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
