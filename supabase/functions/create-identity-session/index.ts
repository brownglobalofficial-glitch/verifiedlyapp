import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Creates a Stripe Identity VerificationSession for a user who has paid the fee.
// Also honors admins (bypass paid gate) so we can test.
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const anon = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");
    const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const authHeader = req.headers.get("Authorization")!;
    const { data } = await anon.auth.getUser(authHeader.replace("Bearer ", ""));
    const user = data.user;
    if (!user) throw new Error("Not authenticated");

    // Optional body: { verification_kind: "individual" | "business", business_name?, business_country? }
    let body: any = {};
    try { body = await req.json(); } catch { /* no body */ }
    const verificationKind = body?.verification_kind === "business" ? "business" : "individual";

    const { data: profile } = await admin.from("profiles")
      .select("verification_status, id_verified, stripe_identity_session_id, is_pro, is_elite")
      .eq("id", user.id).maybeSingle();
    if (!profile) throw new Error("Profile not found");
    if (profile.id_verified) throw new Error("Already verified");

    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
    const isAdmin = !!(roles && roles.length > 0);
    const isPro = !!(profile.is_pro || profile.is_elite);
    if (!isAdmin && !isPro && profile.verification_status !== "paid" && profile.verification_status !== "processing") {
      throw new Error("Payment required. Please complete the verification fee first.");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
    const origin = req.headers.get("origin") || "https://verifiedly.app";

    const vs = await stripe.identity.verificationSessions.create({
      type: "document",
      metadata: {
        user_id: user.id,
        verification_kind: verificationKind,
        business_name: body?.business_name || "",
        business_country: body?.business_country || "",
      },
      options: { document: { require_matching_selfie: true, require_live_capture: true } },
      return_url: `${origin}/dashboard/verification?verified=1`,
    });

    await admin.from("profiles").update({
      stripe_identity_session_id: vs.id,
      verification_status: "processing",
      verification_kind: verificationKind,
      verified_business_name: body?.business_name || null,
      verified_business_country: body?.business_country || null,
    }).eq("id", user.id);

    return new Response(JSON.stringify({ url: vs.url, client_secret: vs.client_secret }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});