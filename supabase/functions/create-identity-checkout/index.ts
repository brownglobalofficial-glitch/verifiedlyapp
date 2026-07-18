import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Verifiedly Identity Verification fee — one-time $12.99.
// Buys a verification ATTEMPT (not a guaranteed badge).
const VERIFY_PRICE_ID = "price_1TuNUS1hrOAc8qE8OOsyoQ6K";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const authHeader = req.headers.get("Authorization")!;
    const { data } = await supabaseClient.auth.getUser(authHeader.replace("Bearer ", ""));
    const user = data.user;
    if (!user?.email) throw new Error("Not authenticated");

    // Pro subscribers get ID verification free — skip Checkout and mark as paid so
    // the subsequent create-identity-session call can start the ID scan directly.
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const { data: prof } = await admin.from("profiles")
      .select("id_verified, verification_status")
      .eq("id", user.id).maybeSingle();
    if (prof?.id_verified) throw new Error("Already verified");

    // Pro no longer includes a free identity check — every attempt is paid.

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
    const origin = req.headers.get("origin") || "https://verifiedly.app";

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data[0]?.id;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: VERIFY_PRICE_ID, quantity: 1 }],
      mode: "payment",
      metadata: { type: "identity_verification", user_id: user.id },
      payment_intent_data: { metadata: { type: "identity_verification", user_id: user.id } },
      success_url: `${origin}/dashboard/verification?paid=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard/verification?canceled=1`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});