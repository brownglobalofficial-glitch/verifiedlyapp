import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-internal-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Internal dispatcher: pushes signed identity/verification events to every partner
// webhook endpoint whose OAuth client currently holds a live token for that user.
// Called server-side only with the service-role key in x-internal-key.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return j({ error: "method_not_allowed" }, 405);

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if ((req.headers.get("x-internal-key") || "") !== serviceKey) return j({ error: "unauthorized" }, 401);

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const userId = typeof body.user_id === "string" ? body.user_id : "";
  const event = typeof body.event === "string" ? body.event : "";
  if (!userId || !event) return j({ error: "invalid_request" }, 400);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);

  const { data: profile } = await admin
    .from("profiles")
    .select("username, id_verified, verified_at, verification_status, verification_kind, verified_country")
    .eq("id", userId)
    .maybeSingle();

  const { data: tokens } = await admin
    .from("oauth_tokens")
    .select("client_id, scopes")
    .eq("user_id", userId)
    .eq("revoked", false);

  const clientIds = [...new Set((tokens ?? []).map((token) => token.client_id))];
  if (!clientIds.length) return j({ delivered: 0 });

  const { data: endpoints } = await admin
    .from("oauth_webhook_endpoints")
    .select("id, client_id, url, events, signing_secret")
    .in("client_id", clientIds)
    .eq("active", true);

  let delivered = 0;
  for (const endpoint of endpoints ?? []) {
    if (!(endpoint.events || []).includes(event)) continue;

    const payload = {
      id: crypto.randomUUID(),
      type: event,
      created_at: new Date().toISOString(),
      data: {
        sub: userId,
        username: profile?.username ?? null,
        id_verified: !!profile?.id_verified,
        verification_status: profile?.verification_status ?? null,
        verification_kind: profile?.verification_kind ?? "individual",
        verified_at: profile?.verified_at ?? null,
        verified_country: profile?.verified_country ?? null,
      },
    };
    const raw = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = await hmacHex(endpoint.signing_secret, `${timestamp}.${raw}`);

    let status: number | null = null;
    let ok = false;
    let error: string | null = null;
    try {
      const response = await fetch(endpoint.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-verifiedly-signature": `t=${timestamp},v1=${signature}`,
          "x-verifiedly-event": event,
        },
        body: raw,
      });
      status = response.status;
      ok = response.ok;
    } catch (deliveryError) {
      error = deliveryError instanceof Error ? deliveryError.message : "delivery_failed";
    }

    if (ok) delivered += 1;
    await admin.from("oauth_webhook_deliveries").insert({
      endpoint_id: endpoint.id,
      event,
      payload,
      status_code: status,
      ok,
      error,
    });
    await admin.from("oauth_webhook_endpoints")
      .update({ last_delivery_at: new Date().toISOString(), last_status: status })
      .eq("id", endpoint.id);
  }

  return j({ delivered });
});

async function hmacHex(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function j(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
