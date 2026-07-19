import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// POST { client_id, redirect_uri, response_type, scope, state,
//        code_challenge?, code_challenge_method? } with user JWT
// Validates the request, mints a 60s auth code, returns { code, redirect_to }
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return j({ error: "method_not_allowed" }, 405);

  const auth = req.headers.get("authorization") || "";
  const jwt = auth.replace("Bearer ", "").trim();
  if (!jwt) return j({ error: "unauthorized" }, 401);

  const url = Deno.env.get("SUPABASE_URL")!;
  const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return j({ error: "unauthorized" }, 401);

  const body = await req.json().catch(() => ({} as Record<string, unknown>)) as Record<string, unknown>;
  const clientId = typeof body.client_id === "string" ? body.client_id : "";
  const redirectUri = typeof body.redirect_uri === "string" ? body.redirect_uri : "";
  const responseType = typeof body.response_type === "string" ? body.response_type : "";
  const scope = typeof body.scope === "string" ? body.scope : "openid profile";
  const state = typeof body.state === "string" ? body.state : "";
  const codeChallenge = typeof body.code_challenge === "string" ? body.code_challenge : null;
  const codeChallengeMethod = typeof body.code_challenge_method === "string" ? body.code_challenge_method : null;
  if (!clientId || !redirectUri || responseType !== "code" || state.length < 16) {
    return j({ error: "invalid_request" }, 400);
  }
  if (codeChallenge && (codeChallengeMethod !== "S256" || !/^[A-Za-z0-9_-]{43,128}$/.test(codeChallenge))) {
    return j({ error: "invalid_request", error_description: "Invalid PKCE challenge" }, 400);
  }
  if (!codeChallenge && codeChallengeMethod) {
    return j({ error: "invalid_request", error_description: "PKCE method requires a challenge" }, 400);
  }

  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: client } = await admin
    .from("oauth_clients").select("*").eq("client_id", clientId).eq("active", true).maybeSingle();
  if (!client) return j({ error: "invalid_client" }, 400);
  if (!(client.redirect_uris || []).includes(redirectUri)) {
    return j({ error: "invalid_redirect_uri" }, 400);
  }

  const requested = [...new Set(scope.split(/\s+/).filter(Boolean))];
  if (!requested.length || requested.some((requestedScope) => !(client.scopes || []).includes(requestedScope))) {
    return j({ error: "invalid_scope" }, 400);
  }

  const code = "ac_" + crypto.randomUUID().replace(/-/g,"") + crypto.randomUUID().replace(/-/g,"").slice(0,8);
  const expiresAt = new Date(Date.now() + 60_000).toISOString(); // 60s

  const { error } = await admin.from("oauth_codes").insert({
    code,
    client_id: clientId,
    user_id: user.id,
    redirect_uri: redirectUri,
    scopes: requested,
    expires_at: expiresAt,
    code_challenge: codeChallenge,
    code_challenge_method: codeChallenge ? "S256" : null,
  });
  if (error) return j({ error: "db_error", message: error.message }, 500);

  const sep = redirectUri.includes("?") ? "&" : "?";
  const redirect_to = `${redirectUri}${sep}code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
  return j({ code, redirect_to });
});

function j(p: unknown, status = 200) {
  return new Response(JSON.stringify(p), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
