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

    // Individuals only at launch. Business (legal-entity) verification is
    // coming later — an owner ID scan is NOT the same as verifying a business,
    // so we no longer accept the "business" kind here.
    const verificationKind = "individual";

    const { data: profile } = await admin.from("profiles")
      .select("verification_status, id_verified, stripe_identity_session_id, is_pro, is_elite, pro_identity_check_used")
      .eq("id", user.id).maybeSingle();
    if (!profile) throw new Error("Profile not found");
    if (profile.id_verified) throw new Error("Already verified");

    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
    const isAdmin = !!(roles && roles.length > 0);
    const proIncludedAvailable = (profile.is_pro || profile.is_elite) && !profile.pro_identity_check_used;
    if (!isAdmin && !proIncludedAvailable && profile.verification_status !== "paid" && profile.verification_status !== "processing") {
      throw new Error("Payment required. Please complete the verification fee first.");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
    const origin = req.headers.get("origin") || "https://verifiedly.app";

    // Reuse an existing unfinished VerificationSession if one is still active,
    // so we don't create duplicate Stripe records (and don't burn a Pro
    // included check twice).
    if (profile.stripe_identity_session_id) {
      try {
        const existing = await stripe.identity.verificationSessions.retrieve(profile.stripe_identity_session_id);
        if (existing.status === "requires_input" || existing.status === "processing") {
          return new Response(JSON.stringify({ url: existing.url, client_secret: existing.client_secret, reused: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
          });
        }
      } catch { /* fall through and create a new one */ }
    }

    const vs = await stripe.identity.verificationSessions.create({
      type: "document",
      metadata: { user_id: user.id, verification_kind: verificationKind },
      options: { document: { require_matching_selfie: true, require_live_capture: true } },
      return_url: `${origin}/dashboard/verification?verified=1`,
    });

    const update: Record<string, unknown> = {
      stripe_identity_session_id: vs.id,
      verification_status: "processing",
      verification_kind: verificationKind,
    };
    // Mark the Pro included check as consumed the moment we open a new session
    // on Pro's dime. Reuses above don't count.
    if (proIncludedAvailable && !isAdmin) update.pro_identity_check_used = true;

    await admin.from("profiles").update(update).eq("id", user.id);

    return new Response(JSON.stringify({ url: vs.url, client_secret: vs.client_secret }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});