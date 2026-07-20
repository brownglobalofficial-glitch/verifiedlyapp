import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
});

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Please sign in again." }, 401);

    const anon = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );
    const { data: userData } = await anon.auth.getUser(authHeader.replace("Bearer ", ""));
    const user = userData.user;
    if (!user) return json({ error: "Please sign in again." }, 401);

    const { data: profile } = await admin.from("profiles")
      .select("id_verified, verified_at, stripe_identity_session_id")
      .eq("id", user.id)
      .maybeSingle();
    const { data: billing } = await admin.from("verifiedly_billing")
      .select("verification_payment_status, identity_status, identity_attempt_count, identity_last_session_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const sessionId = billing?.identity_last_session_id ?? profile?.stripe_identity_session_id;
    if (!sessionId || profile?.id_verified) {
      return json({
        id_verified: !!profile?.id_verified,
        verified_at: profile?.verified_at ?? null,
        verification_payment_status: billing?.verification_payment_status ?? "unpaid",
        identity_status: profile?.id_verified ? "verified" : (billing?.identity_status ?? "unverified"),
        identity_attempt_count: billing?.identity_attempt_count ?? 0,
      });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe Identity is not configured yet.");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const verification = await stripe.identity.verificationSessions.retrieve(sessionId);

    const status = verification.status === "verified"
      ? "verified"
      : verification.status === "requires_input"
        ? "requires_input"
        : verification.status === "canceled"
          ? "canceled"
          : "processing";

    await admin.from("verifiedly_billing").upsert({
      user_id: user.id,
      identity_status: status,
      identity_last_session_id: sessionId,
    }, { onConflict: "user_id" });

    const verifiedAt = status === "verified" ? new Date().toISOString() : null;
    await admin.from("profiles").update({
      id_verified: status === "verified",
      verification_status: status,
      verified_at: verifiedAt ?? profile?.verified_at ?? null,
    }).eq("id", user.id);

    return json({
      id_verified: status === "verified",
      verified_at: verifiedAt ?? profile?.verified_at ?? null,
      verification_payment_status: billing?.verification_payment_status ?? "paid",
      identity_status: status,
      identity_attempt_count: billing?.identity_attempt_count ?? 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to check verification status.";
    return json({ error: message }, 500);
  }
});
