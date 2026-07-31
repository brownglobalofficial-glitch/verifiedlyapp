import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Server-to-server webhook subscription management for Verifiedly OAuth partners.
// Authenticate with client_id + client_secret (never from a browser).
//
// POST { action: "subscribe" | "list" | "unsubscribe", client_id, client_secret,
//        url?, events?, endpoint_id? }
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return j({ error: "method_not_allowed" }, 405);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const action = str(body.action) || "subscribe";
  const clientId = str(body.client_id);
  const clientSecret = str(body.client_secret);
  if (!clientId || !clientSecret) return j({ error: "invalid_client" }, 401);

  const { data: client } = await admin
    .from("oauth_clients").select("client_id, client_secret_hash, active")
    .eq("client_id", clientId).eq("active", true).maybeSingle();
  if (!client) return j({ error: "invalid_client" }, 401);

  const presented = await sha256Hex(clientSecret);
  if (!constantTimeEqual(presented, client.client_secret_hash ?? "")) {
    return j({ error: "invalid_client" }, 401);
  }

  if (action === "list") {
    const { data } = await admin
      .from("oauth_webhook_endpoints")
      .select("id, url, events, active, last_delivery_at, last_status, created_at")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    return j({ endpoints: data ?? [] });
  }

  if (action === "unsubscribe") {
    const endpointId = str(body.endpoint_id);
    if (!endpointId) return j({ error: "invalid_request" }, 400);
    const { error } = await admin
      .from("oauth_webhook_endpoints")
      .delete()
      .eq("client_id", clientId)
      .eq("id", endpointId);
    if (error) return j({ error: "server_error" }, 500);
    return j({ deleted: true });
  }

  if (action !== "subscribe") return j({ error: "invalid_request" }, 400);

  const url = str(body.url);
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return j({ error: "invalid_request", error_description: "url must be an absolute URL" }, 400);
  }
  if (parsed.protocol !== "https:") {
    return j({ error: "invalid_request", error_description: "url must use https" }, 400);
  }

  const allowedEvents = ["identity.verified", "identity.updated", "identity.revoked", "profile.updated"];
  const requested = Array.isArray(body.events)
    ? (body.events as unknown[]).map((event) => String(event))
    : ["identity.verified", "identity.updated"];
  const events = [...new Set(requested)].filter((event) => allowedEvents.includes(event));
  if (!events.length) return j({ error: "invalid_request", error_description: "no valid events" }, 400);

  const signingSecret = "whsec_" + crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");

  const { data, error } = await admin
    .from("oauth_webhook_endpoints")
    .insert({ client_id: clientId, url: parsed.toString(), events, signing_secret: signingSecret })
    .select("id, url, events, active, created_at")
    .single();
  if (error) return j({ error: "server_error", message: error.message }, 500);

  // The signing secret is returned exactly once.
  return j({ ...data, signing_secret: signingSecret });
});

function str(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
async function sha256Hex(value: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
function j(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
