import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// GET with Authorization: Bearer <verifiedly access token>
// -> consented profile and identity claims for the access-token scopes.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = req.headers.get("authorization") || "";
  const token = auth.replace("Bearer ", "").trim();
  if (!token) return j({ error: "unauthorized" }, 401);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: tok } = await admin
    .from("oauth_tokens").select("*").eq("access_token", token).maybeSingle();
  if (!tok || tok.revoked) return j({ error: "invalid_token" }, 401);
  if (new Date(tok.expires_at).getTime() < Date.now()) return j({ error: "expired_token" }, 401);

  const { data: p } = await admin
    .from("profiles")
    .select("username, display_name, avatar_url, id_verified, verified_at, verification_kind")
    .eq("id", tok.user_id).maybeSingle();
  if (!p) return j({ error: "no_profile" }, 404);

  const scopes: string[] = tok.scopes || [];
  const payload: Record<string, unknown> = {
    sub: tok.user_id,
  };
  if (scopes.includes("profile")) {
    payload.username = p.username;
    payload.display_name = p.display_name;
    payload.avatar_url = p.avatar_url;
  }
  // Identity is earned through the configured identity check only. Subscription
  // or legacy account tiers are never exposed as identity signals.
  if (scopes.includes("identity")) {
    payload.verified = !!p.id_verified;
    payload.id_verified = !!p.id_verified;
    payload.verified_at = p.verified_at || null;
    payload.verification_kind = p.verification_kind || "individual";
  }
  if (scopes.includes("email")) {
    const { data: u } = await admin.auth.admin.getUserById(tok.user_id);
    payload.email = u?.user?.email;
    payload.email_verified = !!u?.user?.email_confirmed_at;
  }

  return j(payload);
});

function j(p: unknown, status = 200) {
  return new Response(JSON.stringify(p), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
