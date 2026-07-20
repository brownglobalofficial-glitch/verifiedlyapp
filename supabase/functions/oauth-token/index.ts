import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// POST { grant_type:"authorization_code", code, client_id,
//        client_secret? OR code_verifier?, redirect_uri }
// -> { access_token, token_type:"Bearer", expires_in, scope, user_id }
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return j({ error: "method_not_allowed" }, 405);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  let body: Record<string, unknown>;
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    body = await req.json().catch(() => ({} as Record<string, unknown>)) as Record<string, unknown>;
  }
  else {
    const text = await req.text();
    body = Object.fromEntries(new URLSearchParams(text));
  }

  const grantType = typeof body.grant_type === "string" ? body.grant_type : "";
  const code = typeof body.code === "string" ? body.code : "";
  const clientId = typeof body.client_id === "string" ? body.client_id : "";
  const clientSecret = typeof body.client_secret === "string" ? body.client_secret : "";
  const codeVerifier = typeof body.code_verifier === "string" ? body.code_verifier : "";
  const redirectUri = typeof body.redirect_uri === "string" ? body.redirect_uri : "";
  if (grantType !== "authorization_code") return j({ error: "unsupported_grant_type" }, 400);
  if (!code || !clientId || !redirectUri) return j({ error: "invalid_request" }, 400);

  const { data: client } = await admin
    .from("oauth_clients").select("*").eq("client_id", clientId).eq("active", true).maybeSingle();
  if (!client) return j({ error: "invalid_client" }, 401);

  const { data: codeRow } = await admin
    .from("oauth_codes").select("*").eq("code", code).maybeSingle();
  if (!codeRow || codeRow.used || codeRow.client_id !== clientId) return j({ error: "invalid_grant" }, 400);
  if (new Date(codeRow.expires_at).getTime() < Date.now()) return j({ error: "invalid_grant", message: "expired" }, 400);
  if (codeRow.redirect_uri !== redirectUri) return j({ error: "invalid_grant", message: "redirect_uri mismatch" }, 400);

  if (codeRow.code_challenge) {
    if (codeRow.code_challenge_method !== "S256" || !/^[A-Za-z0-9\-._~]{43,128}$/.test(codeVerifier)) {
      return j({ error: "invalid_grant", message: "PKCE verifier required" }, 400);
    }
    const presentedChallenge = await sha256Base64Url(codeVerifier);
    if (!constantTimeEqual(presentedChallenge, codeRow.code_challenge)) {
      return j({ error: "invalid_grant", message: "PKCE verification failed" }, 400);
    }
  } else {
    if (!clientSecret) return j({ error: "invalid_client" }, 401);
    const presentedHash = await sha256Hex(clientSecret);
    if (!constantTimeEqual(presentedHash, client.client_secret_hash)) return j({ error: "invalid_client" }, 401);
  }

  // Consume the code in one database update so concurrent exchanges cannot both win.
  const { data: consumedRows, error: consumeError } = await admin.rpc("consume_oauth_code", {
    _code: code,
    _client_id: clientId,
    _redirect_uri: redirectUri,
  });
  const consumed = consumedRows?.[0];
  if (consumeError || !consumed) return j({ error: "invalid_grant" }, 400);

  const accessToken = "vfy_" + crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const expiresIn = 60 * 60 * 24 * 30; // 30 days
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
  const { error: tokenError } = await admin.from("oauth_tokens").insert({
    access_token: accessToken,
    client_id: clientId,
    user_id: consumed.user_id,
    scopes: consumed.scopes,
    expires_at: expiresAt,
  });
  if (tokenError) return j({ error: "server_error" }, 500);

  return j({
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: expiresIn,
    scope: (consumed.scopes || []).join(" "),
    user_id: consumed.user_id,
  });
});

async function sha256Hex(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
}
async function sha256Base64Url(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  const binary = String.fromCharCode(...new Uint8Array(digest));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return difference === 0;
}
function j(p: unknown, status = 200) {
  return new Response(JSON.stringify(p), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
