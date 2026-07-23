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

const TAP_RETAIL = "price_1TwRxJ1hrOAc8qE8TBbgyAaJ";
const TAP_PRO = "price_1TwRxL1hrOAc8qE89YDsC42O";

const trimField = (v: unknown, min: number, max: number, label: string) => {
  if (typeof v !== "string") throw new Error(`${label} is required`);
  const t = v.trim();
  if (t.length < min || t.length > max) throw new Error(`${label} must be ${min}-${max} characters`);
  return t;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe is not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Please sign in again." }, 401);

    const anon = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");
    const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { persistSession: false } });
    const { data: userData } = await anon.auth.getUser(authHeader.replace("Bearer ", ""));
    const user = userData.user;
    if (!user?.email) return json({ error: "Please sign in again." }, 401);

    const body = await req.json().catch(() => ({}));
    const printed_name = trimField(body.printed_name, 2, 40, "Printed name");
    const printed_title = trimField(body.printed_title, 2, 60, "Printed title");
    const printed_handle = trimField(body.printed_handle, 2, 40, "Printed handle").toLowerCase();
    const shipping_name = trimField(body.shipping_name, 2, 100, "Shipping name");
    const line1 = trimField(body.line1, 2, 200, "Street address");
    const line2 = typeof body.line2 === "string" ? body.line2.trim().slice(0, 200) : "";
    const city = trimField(body.city, 1, 100, "City");
    const state = typeof body.state === "string" ? body.state.trim().slice(0, 100) : "";
    const postal_code = trimField(body.postal_code, 2, 20, "Postal code");
    const country = trimField(body.country, 2, 2, "Country code").toUpperCase();

    // Determine pricing tier
    const { data: billing } = await admin.from("verifiedly_billing")
      .select("pro_status, pro_interval, annual_card_credit_available, stripe_customer_id")
      .eq("user_id", user.id).maybeSingle();
    const isPro = billing?.pro_status === "active" || billing?.pro_status === "trialing";
    const isAnnualFree = isPro && billing?.pro_interval === "year" && billing?.annual_card_credit_available === true;

    const shipping_address = { line1, line2, city, state, postal_code, country };

    // Free with annual: skip Stripe, record order directly.
    if (isAnnualFree) {
      const syntheticSession = `annual_free_${user.id}_${Date.now()}`;
      const { data: recordResult, error } = await admin.rpc("record_verifiedly_tap_card_order", {
        p_user_id: user.id,
        p_material: "pvc",
        p_order_source: "annual_included",
        p_amount_cents: 0,
        p_currency: "usd",
        p_checkout_session_id: syntheticSession,
        p_payment_intent_id: null,
        p_shipping_name: shipping_name,
        p_shipping_address: shipping_address,
        p_printed_name: printed_name,
        p_printed_title: printed_title,
        p_printed_handle: printed_handle,
        p_template_version: "verifiedly-pvc-v1",
        p_preview_approved_at: new Date().toISOString(),
      });
      if (error) throw error;
      return json({ free: true, order: recordResult });
    }

    // Paid: Stripe Checkout
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    let customerId = billing?.stripe_customer_id ?? null;
    if (!customerId) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      customerId = customers.data[0]?.id ?? (await stripe.customers.create({
        email: user.email, metadata: { verifiedly_user_id: user.id },
      })).id;
      await admin.from("verifiedly_billing").upsert({ user_id: user.id, stripe_customer_id: customerId }, { onConflict: "user_id" });
    }

    const origin = req.headers.get("origin") ?? "https://verifiedly.app";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      line_items: [{ price: isPro ? TAP_PRO : TAP_RETAIL, quantity: 1 }],
      success_url: `${origin}/dashboard/tap-card?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard/tap-card?checkout=cancelled`,
      metadata: {
        type: "verifiedly_tap_card",
        user_id: user.id,
        order_source: isPro ? "pro_member" : "retail",
        printed_name, printed_title, printed_handle,
        shipping_name,
        shipping_line1: line1, shipping_line2: line2,
        shipping_city: city, shipping_state: state,
        shipping_postal_code: postal_code, shipping_country: country,
      },
    });
    return json({ url: session.url });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Could not start checkout." }, 500);
  }
});