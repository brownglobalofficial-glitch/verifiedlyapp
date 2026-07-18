-- Verifiedly Identity + Documents
--
-- Identity evidence is collected and retained by Stripe Identity. Verifiedly
-- stores only provider/session references and a small status record.
--
-- Documents is deliberately limited to professional credentials. Files live
-- in a private bucket and can never be made public through a table flag.

CREATE TABLE IF NOT EXISTS public.verifiedly_billing (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  documents_subscription_id TEXT UNIQUE,
  documents_status TEXT NOT NULL DEFAULT 'inactive'
    CHECK (documents_status IN ('inactive', 'incomplete', 'trialing', 'active', 'past_due', 'canceled')),
  documents_interval TEXT CHECK (documents_interval IN ('month', 'year')),
  documents_current_period_end TIMESTAMPTZ,
  documents_cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  verification_payment_status TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (verification_payment_status IN ('unpaid', 'paid', 'refunded')),
  verification_checkout_session_id TEXT UNIQUE,
  identity_status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (identity_status IN ('unverified', 'processing', 'requires_input', 'verified', 'canceled')),
  identity_attempt_count INTEGER NOT NULL DEFAULT 0
    CHECK (identity_attempt_count >= 0 AND identity_attempt_count <= 2),
  identity_last_session_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.verifiedly_billing ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.verifiedly_billing FROM anon, authenticated, PUBLIC;
GRANT SELECT ON public.verifiedly_billing TO authenticated;
GRANT ALL ON public.verifiedly_billing TO service_role;

DROP POLICY IF EXISTS "Users read own Verifiedly billing" ON public.verifiedly_billing;
CREATE POLICY "Users read own Verifiedly billing"
  ON public.verifiedly_billing FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_verifiedly_billing_updated ON public.verifiedly_billing;
CREATE TRIGGER trg_verifiedly_billing_updated
  BEFORE UPDATE ON public.verifiedly_billing
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Webhook events must be retried after a processing failure. Historical rows
-- predate processing state and are treated as already processed.
ALTER TABLE public.webhook_events
  ADD COLUMN IF NOT EXISTS processing_status TEXT NOT NULL DEFAULT 'processed',
  ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_error TEXT;

UPDATE public.webhook_events
SET processed_at = COALESCE(processed_at, received_at)
WHERE processing_status = 'processed';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'webhook_events_processing_status_check'
  ) THEN
    ALTER TABLE public.webhook_events
      ADD CONSTRAINT webhook_events_processing_status_check
      CHECK (processing_status IN ('processing', 'processed', 'failed'));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.has_active_documents_access()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.verifiedly_billing
    WHERE user_id = auth.uid()
      AND documents_status IN ('active', 'trialing')
      AND (
        documents_current_period_end IS NULL
        OR documents_current_period_end > now()
      )
  );
$$;

REVOKE ALL ON FUNCTION public.has_active_documents_access() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_active_documents_access() TO authenticated, service_role;

-- Ensure the bucket exists and remains private. Restrict the first release to
-- PDF and common image formats, with a 10 MB per-file ceiling.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS original_filename TEXT;

UPDATE public.documents SET is_public = false WHERE is_public = true;
ALTER TABLE public.documents ALTER COLUMN is_public SET DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'documents_never_public'
  ) THEN
    ALTER TABLE public.documents
      ADD CONSTRAINT documents_never_public CHECK (is_public = false);
  END IF;
END $$;

REVOKE ALL ON public.documents FROM anon, authenticated, PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;

DROP POLICY IF EXISTS "Public docs are visible" ON public.documents;
DROP POLICY IF EXISTS "Owners manage own docs" ON public.documents;
DROP POLICY IF EXISTS "Owners read own document records" ON public.documents;
DROP POLICY IF EXISTS "Owners add document records with access" ON public.documents;
DROP POLICY IF EXISTS "Owners update document records with access" ON public.documents;
DROP POLICY IF EXISTS "Owners delete own document records" ON public.documents;

CREATE POLICY "Owners read own document records"
  ON public.documents FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owners add document records with access"
  ON public.documents FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND public.has_active_documents_access()
    AND is_public = false
  );

CREATE POLICY "Owners update document records with access"
  ON public.documents FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND public.has_active_documents_access())
  WITH CHECK (
    auth.uid() = user_id
    AND public.has_active_documents_access()
    AND is_public = false
  );

CREATE POLICY "Owners delete own document records"
  ON public.documents FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners read own documents" ON storage.objects;
DROP POLICY IF EXISTS "Owners upload own documents" ON storage.objects;
DROP POLICY IF EXISTS "Owners update own documents" ON storage.objects;
DROP POLICY IF EXISTS "Owners delete own documents" ON storage.objects;
DROP POLICY IF EXISTS "Subscribers read own document files" ON storage.objects;
DROP POLICY IF EXISTS "Subscribers upload own document files" ON storage.objects;
DROP POLICY IF EXISTS "Subscribers update own document files" ON storage.objects;
DROP POLICY IF EXISTS "Owners delete own document files" ON storage.objects;

CREATE POLICY "Subscribers read own document files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.has_active_documents_access()
  );

CREATE POLICY "Subscribers upload own document files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.has_active_documents_access()
  );

CREATE POLICY "Subscribers update own document files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.has_active_documents_access()
  )
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.has_active_documents_access()
  );

-- Deletion stays available after cancellation so a user can always remove
-- their own stored files.
CREATE POLICY "Owners delete own document files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE TABLE IF NOT EXISTS public.document_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  password_salt TEXT,
  password_hash TEXT,
  failed_attempt_count INTEGER NOT NULL DEFAULT 0
    CHECK (failed_attempt_count BETWEEN 0 AND 10),
  expires_at TIMESTAMPTZ NOT NULL,
  max_views INTEGER NOT NULL DEFAULT 10 CHECK (max_views BETWEEN 1 AND 50),
  view_count INTEGER NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  revoked_at TIMESTAMPTZ,
  last_viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((password_salt IS NULL) = (password_hash IS NULL))
);

ALTER TABLE public.document_share_links ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.document_share_links FROM anon, authenticated, PUBLIC;
GRANT SELECT, UPDATE (revoked_at), DELETE ON public.document_share_links TO authenticated;
GRANT ALL ON public.document_share_links TO service_role;

DROP POLICY IF EXISTS "Owners manage own document share links" ON public.document_share_links;
CREATE POLICY "Owners manage own document share links"
  ON public.document_share_links FOR ALL TO authenticated
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

CREATE INDEX IF NOT EXISTS idx_document_share_links_owner
  ON public.document_share_links(owner_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_share_links_document
  ON public.document_share_links(document_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.document_access_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  share_link_id UUID REFERENCES public.document_share_links(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('link_created', 'viewed', 'revoked', 'denied')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.document_access_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.document_access_events FROM anon, authenticated, PUBLIC;
GRANT SELECT ON public.document_access_events TO authenticated;
GRANT ALL ON public.document_access_events TO service_role;

DROP POLICY IF EXISTS "Owners read own document access events" ON public.document_access_events;
CREATE POLICY "Owners read own document access events"
  ON public.document_access_events FOR SELECT TO authenticated
  USING (auth.uid() = owner_user_id);

CREATE OR REPLACE FUNCTION public.consume_document_share(_token_hash TEXT)
RETURNS TABLE (
  share_link_id UUID,
  document_id UUID,
  owner_user_id UUID,
  storage_path TEXT,
  title TEXT,
  original_filename TEXT,
  mime_type TEXT,
  link_expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH consumed AS (
    UPDATE public.document_share_links AS link
    SET view_count = link.view_count + 1,
        last_viewed_at = now()
    WHERE link.token_hash = _token_hash
      AND link.revoked_at IS NULL
      AND link.expires_at > now()
      AND link.view_count < link.max_views
      AND EXISTS (
        SELECT 1
        FROM public.verifiedly_billing AS billing
        WHERE billing.user_id = link.owner_user_id
          AND billing.documents_status IN ('active', 'trialing')
          AND (
            billing.documents_current_period_end IS NULL
            OR billing.documents_current_period_end > now()
          )
      )
    RETURNING link.*
  )
  SELECT
    consumed.id,
    doc.id,
    doc.user_id,
    doc.storage_path,
    doc.title,
    doc.original_filename,
    doc.mime_type,
    consumed.expires_at
  FROM consumed
  JOIN public.documents AS doc ON doc.id = consumed.document_id;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_document_share(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_document_share(TEXT) TO service_role;

-- Stop password guessing against a shared link. Ten incorrect attempts revoke
-- the link, after which its token can no longer issue a signed URL.
CREATE OR REPLACE FUNCTION public.record_document_share_denial(_token_hash TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  locked BOOLEAN := false;
BEGIN
  UPDATE public.document_share_links AS link
  SET failed_attempt_count = LEAST(link.failed_attempt_count + 1, 10),
      revoked_at = CASE
        WHEN link.failed_attempt_count + 1 >= 10 THEN now()
        ELSE link.revoked_at
      END
  WHERE link.token_hash = _token_hash
    AND link.revoked_at IS NULL
    AND link.expires_at > now()
  RETURNING link.failed_attempt_count >= 10 INTO locked;

  RETURN COALESCE(locked, false);
END;
$$;

REVOKE ALL ON FUNCTION public.record_document_share_denial(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_document_share_denial(TEXT) TO service_role;
