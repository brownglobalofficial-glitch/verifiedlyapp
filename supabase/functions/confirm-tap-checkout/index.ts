import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), {
  status: s, headers: { ...corsHeaders, "Content-Type": "application/json" },
});

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe not configured");
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Please sign in again." }, 401);

    const { session_id } = await req.json().catch(() => ({}));
    if (!session_id || typeof session_id !== "string") return json({ error: "session_id required" }, 400);

    const anon = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");
    const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { persistSession: false } });
    const { data: userData } = await anon.auth.getUser(authHeader.replace("Bearer ", ""));
    const user = userData.user;
    if (!user) return json({ error: "Please sign in again." }, 401);

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.metadata?.type !== "verifiedly_tap_card") return json({ error: "Not a Tap card session" }, 400);
    if (session.metadata?.user_id !== user.id) return json({ error: "Session does not belong to you" }, 403);
    if (session.payment_status !== "paid") return json({ error: "Payment not completed", status: session.payment_status }, 400);

    const m = session.metadata!;
    const { data, error } = await admin.rpc("record_verifiedly_tap_card_order", {
      p_user_id: user.id,
      p_material: "pvc",
      p_order_source: m.order_source || "retail",
      p_amount_cents: session.amount_total ?? 0,
      p_currency: session.currency ?? "usd",
      p_checkout_session_id: session.id,
      p_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? null),
      p_shipping_name: m.shipping_name,
      p_shipping_address: {
        line1: m.shipping_line1, line2: m.shipping_line2,
        city: m.shipping_city, state: m.shipping_state,
        postal_code: m.shipping_postal_code, country: m.shipping_country,
      },
      p_printed_name: m.printed_name,
      p_printed_title: m.printed_title,
      p_printed_handle: m.printed_handle,
      p_template_version: "verifiedly-pvc-v1",
      p_preview_approved_at: new Date().toISOString(),
    });
    if (error) throw error;
    return json({ ok: true, order: data });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Could not confirm order." }, 500);
  }
});