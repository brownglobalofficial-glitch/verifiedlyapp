import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// POST { grant_type:"authorization_code", code, client_id, client_secret, redirect_uri }
// -> { access_token, token_type:"Bearer", expires_in, scope, user_id }
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return j({ error: "method_not_allowed" }, 405);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  let body: any;
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) body = await req.json().catch(() => ({}));
  else {
    const text = await req.text();
    body = Object.fromEntries(new URLSearchParams(text));
  }

  const { grant_type, code, client_id, client_secret, redirect_uri } = body || {};
  if (grant_type !== "authorization_code") return j({ error: "unsupported_grant_type" }, 400);
  if (!code || !client_id || !client_secret || !redirect_uri) return j({ error: "invalid_request" }, 400);

  const { data: client } = await admin
    .from("oauth_clients").select("*").eq("client_id", client_id).eq("active", true).maybeSingle();
  if (!client) return j({ error: "invalid_client" }, 401);

  const presentedHash = await sha256Hex(client_secret);
  if (presentedHash !== client.client_secret_hash) return j({ error: "invalid_client" }, 401);

  const { data: codeRow } = await admin
    .from("oauth_codes").select("*").eq("code", code).maybeSingle();
  if (!codeRow || codeRow.used || codeRow.client_id !== client_id) return j({ error: "invalid_grant" }, 400);
  if (new Date(codeRow.expires_at).getTime() < Date.now()) return j({ error: "invalid_grant", message: "expired" }, 400);
  if (codeRow.redirect_uri !== redirect_uri) return j({ error: "invalid_grant", message: "redirect_uri mismatch" }, 400);

  // Burn the code & mint a token
  await admin.from("oauth_codes").update({ used: true }).eq("code", code);

  const accessToken = "vfy_" + crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const expiresIn = 60 * 60 * 24 * 30; // 30 days
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
  await admin.from("oauth_tokens").insert({
    access_token: accessToken, client_id, user_id: codeRow.user_id,
    scopes: codeRow.scopes, expires_at: expiresAt,
  });

  return j({
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: expiresIn,
    scope: (codeRow.scopes || []).join(" "),
    user_id: codeRow.user_id,
  });
});

async function sha256Hex(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
}
function j(p: unknown, status = 200) {
  return new Response(JSON.stringify(p), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}