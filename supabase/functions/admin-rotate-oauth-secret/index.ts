import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function randomSecret(bytes = 32) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256(input: string) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json(401, { error: "unauthorized" });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

  // Identify caller and verify admin role
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json(401, { error: "unauthorized" });

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: roles, error: roleErr } = await adminClient
    .from("user_roles").select("role")
    .eq("user_id", userData.user.id).eq("role", "admin");
  if (roleErr || !roles?.length) return json(403, { error: "forbidden" });

  let body: { client_id?: string } = {};
  try { body = await req.json(); } catch { return json(400, { error: "invalid_json" }); }
  const { client_id } = body;
  if (!client_id || typeof client_id !== "string") return json(400, { error: "missing_client_id" });

  const newSecret = randomSecret(32);
  const hash = await sha256(newSecret);

  const { error: updErr, data: upd } = await adminClient
    .from("oauth_clients")
    .update({ client_secret_hash: hash, rotated_at: new Date().toISOString() })
    .eq("client_id", client_id)
    .select("client_id, name")
    .maybeSingle();

  if (updErr || !upd) return json(404, { error: "client_not_found" });

  await adminClient.from("verification_audit_log").insert({
    actor_id: userData.user.id,
    action: "oauth_secret_rotated",
    details: { client_id, name: upd.name },
  });

  return json(200, { client_id, client_secret: newSecret });
});