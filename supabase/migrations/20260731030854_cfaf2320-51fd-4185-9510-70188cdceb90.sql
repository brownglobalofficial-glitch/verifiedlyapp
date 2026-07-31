
CREATE TABLE IF NOT EXISTS public.oauth_webhook_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,
  url text NOT NULL,
  signing_secret text NOT NULL,
  events text[] NOT NULL DEFAULT ARRAY['identity.verified','identity.updated']::text[],
  active boolean NOT NULL DEFAULT true,
  last_delivery_at timestamptz,
  last_status integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.oauth_webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id uuid NOT NULL REFERENCES public.oauth_webhook_endpoints(id) ON DELETE CASCADE,
  event text NOT NULL,
  payload jsonb NOT NULL,
  status_code integer,
  ok boolean NOT NULL DEFAULT false,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS oauth_webhook_endpoints_client_idx ON public.oauth_webhook_endpoints(client_id);
CREATE INDEX IF NOT EXISTS oauth_webhook_deliveries_endpoint_idx ON public.oauth_webhook_deliveries(endpoint_id, created_at DESC);

GRANT ALL ON public.oauth_webhook_endpoints TO service_role;
GRANT ALL ON public.oauth_webhook_deliveries TO service_role;

ALTER TABLE public.oauth_webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_webhook_deliveries ENABLE ROW LEVEL SECURITY;

INSERT INTO public.oauth_clients (client_id, client_secret_hash, name, redirect_uris, scopes, is_first_party, active)
VALUES (
  'verifiedly_test',
  'public-pkce-client-no-secret',
  'Verifiedly Sandbox Test App',
  ARRAY[
    'https://verifiedly.app/developers/test',
    'https://verifiedlyapp.lovable.app/developers/test',
    'https://id-preview--173dd0e3-02ca-4666-9958-5d8eb32162c8.lovable.app/developers/test',
    'http://localhost:8080/developers/test'
  ],
  ARRAY['openid','profile','email','identity','age','country'],
  true,
  true
)
ON CONFLICT (client_id) DO UPDATE SET
  redirect_uris = EXCLUDED.redirect_uris,
  scopes = EXCLUDED.scopes,
  active = true;
