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

const allowedOrigins = () => new Set([
  "https://verifiedly.app",
  "https://www.verifiedly.app",
  "https://verifiedlyapp.lovable.app",
  "https://id-preview--173dd0e3-02ca-4666-9958-5d8eb32162c8.lovable.app",
  ...(Deno.env.get("VERIFIEDLY_ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
]);

const safeOrigin = (value: string | null) => {
  if (!value) return "https://verifiedly.app";
  try {
    const url = new URL(value);
    const allowed = allowedOrigins().has(url.origin)
      || url.hostname === "localhost"
      || url.hostname === "127.0.0.1";
    return allowed ? url.origin : "https://verifiedly.app";
  } catch {
    return "https://verifiedly.app";
  }
};

const trimField = (value: unknown, minimum: number, maximum: number, label: string) => {
  if (typeof value !== "string") throw new Error(`${label} is required`);
  const cleaned = value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length < minimum || cleaned.length > maximum) {
    throw new Error(`${label} must be ${minimum}-${maximum} characters`);
  }
  return cleaned;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe Checkout is not configured yet.");

    // Test keys may exercise the complete checkout flow before launch. A live
    // key still requires the explicit production launch flag.
    const isStripeTestMode = /^(sk|rk)_test_/.test(stripeKey);
    if (Deno.env.get("TAP_CARD_ORDERS_ENABLED") !== "true" && !isStripeTestMode) {
      return json({
        error: "Live Tap Card ordering is not open yet. Complete the PVC sample and fulfillment test, then enable TAP_CARD_ORDERS_ENABLED.",
        code: "tap_orders_not_open",
      }, 503);
    }

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

    const { data: userData, error: userError } = await anon.auth.getUser(authHeader.replace("Bearer ", ""));
    const user = userData.user;
    if (userError || !user?.email) return json({ error: "Please sign in again." }, 401);

    const body = await req.json().catch(() => ({}));
    if (body?.preview_approved !== true) {
      return json({ error: "Please approve the Tap Card preview before ordering." }, 400);
    }

    const printedName = trimField(body.printed_name, 2, 40, "Printed name");
    const printedTitle = trimField(body.printed_title, 2, 60, "Printed title");
    const shippingName = trimField(body.shipping_name, 2, 100, "Shipping name");
    const line1 = trimField(body.line1, 2, 200, "Street address");
    const line2 = typeof body.line2 === "string" ? body.line2.trim().slice(0, 200) : "";
    const city = trimField(body.city, 1, 100, "City");
    const state = trimField(body.state, 2, 100, "State");
    const postalCode = trimField(body.postal_code, 2, 20, "ZIP code");
    const country = trimField(body.country, 2, 2, "Country code").toUpperCase();
    if (country !== "US") {
      return json({ error: "Initial Verifiedly Tap Card fulfillment is available to U.S. addresses only." }, 400);
    }

    const [{ data: profile }, { data: billing }] = await Promise.all([
      admin.from("profiles")
        .select("username, display_name, is_pro")
        .eq("id", user.id)
        .maybeSingle(),
      admin.from("verifiedly_billing")
        .select("pro_status, stripe_customer_id")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    if (!profile?.username) return json({ error: "Complete your Verifiedly profile before ordering a card." }, 409);

    const printedHandle = String(profile.username).trim().toLowerCase();
    const isPro = profile.is_pro === true
      || billing?.pro_status === "active"
      || billing?.pro_status === "trialing";
    const amountCents = isPro ? 1999 : 2999;
    const previewApprovedAt = new Date().toISOString();
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const origin = safeOrigin(req.headers.get("origin"));

    const customerFields = billing?.stripe_customer_id
      ? { customer: billing.stripe_customer_id }
      : { customer_email: user.email, customer_creation: "always" as const };

    const session = await stripe.checkout.sessions.create({
      ...customerFields,
      client_reference_id: user.id,
      mode: "payment",
      locale: "auto",
      billing_address_collection: "auto",
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: amountCents,
          product_data: {
            name: "Verifiedly Tap Card",
            description: "Personalized non-payment PVC NFC card linked to a Verifiedly profile",
          },
        },
      }],
      success_url: `${origin}/dashboard/tap-card?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard/tap-card?checkout=cancelled`,
      metadata: {
        type: "verifiedly_tap_card",
        user_id: user.id,
        order_source: isPro ? "pro_member" : "retail",
        printed_name: printedName,
        printed_title: printedTitle,
        printed_handle: printedHandle,
        template_version: "verifiedly-pvc-white-v1",
        preview_approved_at: previewApprovedAt,
        shipping_name: shippingName,
        shipping_line1: line1,
        shipping_line2: line2,
        shipping_city: city,
        shipping_state: state,
        shipping_postal_code: postalCode,
        shipping_country: "US",
      },
      payment_intent_data: {
        description: `Verifiedly Tap Card for @${printedHandle}`,
        metadata: {
          type: "verifiedly_tap_card",
          user_id: user.id,
          printed_handle: printedHandle,
          order_source: isPro ? "pro_member" : "retail",
        },
      },
      custom_text: {
        submit: {
          message: "Personalized non-payment NFC profile card. Review the final total and shipping details before paying.",
        },
      },
    });

    return json({ url: session.url, amount_cents: amountCents, pro_price: isPro });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start Tap Card checkout.";
    console.error("[CREATE-TAP-CHECKOUT]", message);
    return json({ error: message }, 500);
  }
});
