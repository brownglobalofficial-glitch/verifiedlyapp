import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// GET with Authorization: Bearer <verifiedly access token>
// -> { sub, username, display_name, avatar_url, trust_score, verified, tier, email? }
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
    .select("username, display_name, avatar_url, is_pro, id_verified, verified_at, verified_country, verified_full_name, show_legal_name")
    .eq("id", tok.user_id).maybeSingle();
  if (!p) return j({ error: "no_profile" }, 404);

  const scopes: string[] = tok.scopes || [];
  const payload: Record<string, unknown> = {
    sub: tok.user_id,
    username: p.username,
    display_name: p.display_name,
    avatar_url: p.avatar_url,
  };
  // Identity: earned via Stripe Identity ID check only. Pro does NOT grant verified.
  if (scopes.includes("identity") || scopes.includes("trust")) {
    payload.verified = !!p.id_verified;
    payload.id_verified = !!p.id_verified;
    payload.verified_at = p.verified_at || null;
    payload.tier = p.is_pro ? "pro" : "free";
  }
  if (scopes.includes("legal_name") && p.show_legal_name) {
    payload.legal_name = p.verified_full_name || null;
  }
  if (scopes.includes("age") && p.id_verified) {
    const { data: over18 } = await admin.rpc("is_age_over", { _user_id: tok.user_id, _years: 18 });
    payload.age_over_18 = !!over18;
  }
  if (scopes.includes("age.21") && p.id_verified) {
    const { data: over21 } = await admin.rpc("is_age_over", { _user_id: tok.user_id, _years: 21 });
    payload.age_over_21 = !!over21;
  }
  if ((scopes.includes("identity") || scopes.includes("country")) && p.verified_country) {
    payload.country = p.verified_country;
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