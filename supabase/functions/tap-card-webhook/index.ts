import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
});

const stripeId = (value: string | { id?: string } | null | undefined) => {
  if (typeof value === "string") return value;
  return value?.id ?? null;
};

serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_TAP_CARD_WEBHOOK_SECRET");
    if (!stripeKey || !webhookSecret) {
      return json({ error: "Tap Card webhook is not configured." }, 500);
    }

    const signature = req.headers.get("stripe-signature");
    if (!signature) return json({ error: "Missing Stripe signature." }, 400);

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const event = stripe.webhooks.constructEvent(await req.text(), signature, webhookSecret);

    if (event.type !== "checkout.session.completed") {
      return json({ received: true, ignored: true });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata || {};
    if (metadata.type !== "verifiedly_tap_card") {
      return json({ received: true, ignored: true });
    }
    if (!metadata.user_id || session.payment_status !== "paid") {
      return json({ received: true, pending: session.payment_status !== "paid" });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const { data: orderResult, error: orderError } = await admin.rpc("record_verifiedly_tap_card_order", {
      p_user_id: metadata.user_id,
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
    if (orderError) throw orderError;

    const customerId = stripeId(session.customer);
    if (customerId) {
      await admin.from("verifiedly_billing").upsert({
        user_id: metadata.user_id,
        stripe_customer_id: customerId,
      }, { onConflict: "user_id" });
    }

    console.log("[TAP-CARD-WEBHOOK] Order recorded", {
      event_id: event.id,
      checkout_session_id: session.id,
      user_id: metadata.user_id,
      result: orderResult,
    });

    return json({ received: true, order: orderResult });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to process Tap Card webhook.";
    console.error("[TAP-CARD-WEBHOOK] Error", message);
    return json({ error: message }, 400);
  }
});
