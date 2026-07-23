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

const stripeId = (value: string | { id?: string } | null | undefined) => {
  if (typeof value === "string") return value;
  return value?.id ?? null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe Checkout is not configured yet.");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Please sign in again." }, 401);

    const body = await req.json().catch(() => ({}));
    const sessionId = typeof body?.session_id === "string" ? body.session_id.trim() : "";
    if (!sessionId.startsWith("cs_")) return json({ error: "A valid Checkout Session is required." }, 400);

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
    if (userError || !user) return json({ error: "Please sign in again." }, 401);

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const metadata = session.metadata || {};

    if (metadata.type !== "verifiedly_tap_card") return json({ error: "This is not a Tap Card Checkout Session." }, 400);
    if (metadata.user_id !== user.id || session.client_reference_id !== user.id) {
      return json({ error: "This Checkout Session does not belong to your account." }, 403);
    }
    if (session.payment_status !== "paid") {
      return json({ error: "Payment has not been completed.", status: session.payment_status }, 409);
    }

    const { data: recordResult, error: recordError } = await admin.rpc("record_verifiedly_tap_card_order", {
      p_user_id: user.id,
      p_material: "pvc",
      p_order_source: metadata.order_source || "retail",
      p_amount_cents: session.amount_total ?? 0,
      p_currency: session.currency ?? "usd",
      p_checkout_session_id: session.id,
      p_payment_intent_id: stripeId(session.payment_intent),
      p_shipping_name: metadata.shipping_name || "",
      p_shipping_address: {
        line1: metadata.shipping_line1 || "",
        line2: metadata.shipping_line2 || "",
        city: metadata.shipping_city || "",
        state: metadata.shipping_state || "",
        postal_code: metadata.shipping_postal_code || "",
        country: metadata.shipping_country || "US",
      },
      p_printed_name: metadata.printed_name || "",
      p_printed_title: metadata.printed_title || "",
      p_printed_handle: metadata.printed_handle || "",
      p_template_version: metadata.template_version || "verifiedly-pvc-v2",
      p_preview_approved_at: metadata.preview_approved_at || new Date().toISOString(),
    });
    if (recordError) throw recordError;

    const customerId = stripeId(session.customer);
    if (customerId) {
      await admin.from("verifiedly_billing").upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
      }, { onConflict: "user_id" });
    }

    return json({ ok: true, order: recordResult });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not confirm the Tap Card order.";
    return json({ error: message }, 500);
  }
});
