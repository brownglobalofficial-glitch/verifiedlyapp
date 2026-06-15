import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// POST { client_id, redirect_uri, scope, state } with user JWT
// Validates the request, mints a 60s auth code, returns { code, redirect_to }
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = req.headers.get("authorization") || "";
  const jwt = auth.replace("Bearer ", "").trim();
  if (!jwt) return j({ error: "unauthorized" }, 401);

  const url = Deno.env.get("SUPABASE_URL")!;
  const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return j({ error: "unauthorized" }, 401);

  const body = await req.json().catch(() => ({}));
  const { client_id, redirect_uri, scope, state } = body || {};
  if (!client_id || !redirect_uri) return j({ error: "invalid_request" }, 400);

  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: client } = await admin
    .from("oauth_clients").select("*").eq("client_id", client_id).eq("active", true).maybeSingle();
  if (!client) return j({ error: "invalid_client" }, 400);
  if (!(client.redirect_uris || []).includes(redirect_uri)) {
    return j({ error: "invalid_redirect_uri" }, 400);
  }

  const requested: string[] = (scope ? String(scope).split(/\s+/) : ["profile"])
    .filter((s: string) => (client.scopes || []).includes(s));
  if (requested.length === 0) requested.push("profile");

  const code = "ac_" + crypto.randomUUID().replace(/-/g,"") + crypto.randomUUID().replace(/-/g,"").slice(0,8);
  const expiresAt = new Date(Date.now() + 60_000).toISOString(); // 60s

  const { error } = await admin.from("oauth_codes").insert({
    code, client_id, user_id: user.id, redirect_uri, scopes: requested, expires_at: expiresAt,
  });
  if (error) return j({ error: "db_error", message: error.message }, 500);

  const sep = redirect_uri.includes("?") ? "&" : "?";
  const redirect_to = `${redirect_uri}${sep}code=${encodeURIComponent(code)}${state ? `&state=${encodeURIComponent(state)}` : ""}`;
  return j({ code, redirect_to });
});

function j(p: unknown, status = 200) {
  return new Response(JSON.stringify(p), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}