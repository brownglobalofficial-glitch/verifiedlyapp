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

type Material = "pvc" | "metal";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    if (Deno.env.get("TAP_CARD_ORDERS_ENABLED") !== "true") {
      return json({
        error: "Tap Card ordering is not open yet. Verifiedly is testing card samples and fulfillment before accepting paid orders.",
        code: "orders_not_open",
      }, 503);
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe is not configured yet.");

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
    if (userError || !userData.user?.email) return json({ error: "Please sign in again." }, 401);
    const user = userData.user;

    const body = await req.json().catch(() => ({}));
    const material: Material = body?.material === "metal" ? "metal" : "pvc";
    if (body?.material && !["pvc", "metal"].includes(body.material)) {
      return json({ error: "Unsupported card material." }, 400);
    }

    const [{ data: profile }, { data: billing }] = await Promise.all([
      admin.from("profiles")
        .select("display_name, username, is_pro")
        .eq("id", user.id)
        .maybeSingle(),
      admin.from("verifiedly_billing")
        .select("stripe_customer_id, pro_status, pro_interval, annual_card_credit_available")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    if (!profile) return json({ error: "Complete your Verifiedly profile first." }, 409);

    const activePro = ["active", "trialing"].includes(billing?.pro_status ?? "") || !!profile.is_pro;
    const annualCredit = activePro
      && billing?.pro_interval === "year"
      && billing?.annual_card_credit_available === true;

    let orderSource = "standard_purchase";
    let amountCents = material === "metal" ? 8999 : 2499;
    let description = material === "metal"
      ? "Premium metal NFC profile card with a QR-code fallback and standard U.S. shipping."
      : "PVC NFC profile card with a QR-code fallback and standard U.S. shipping.";

    if (activePro) {
      orderSource = "pro_discount";
      amountCents = material === "metal" ? 6999 : 1499;
    }

    if (annualCredit && material === "pvc") {
      orderSource = "annual_included";
      amountCents = 599;
      description = "Included annual Pro PVC Tap Card; this charge covers standard U.S. shipping and handling.";
    } else if (annualCredit && material === "metal") {
      orderSource = "annual_metal_upgrade";
      amountCents = 5598;
      description = "Annual Pro metal-card upgrade plus standard U.S. shipping and handling.";
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    let customerId = billing?.stripe_customer_id ?? null;
    if (!customerId) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      customerId = customers.data[0]?.id ?? null;
    }
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile.display_name || undefined,
        metadata: { verifiedly_user_id: user.id },
      });
      customerId = customer.id;
    }

    await admin.from("verifiedly_billing").upsert({
      user_id: user.id,
      stripe_customer_id: customerId,
    }, { onConflict: "user_id" });

    const origin = safeOrigin(req.headers.get("origin"));
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      locale: "auto",
      billing_address_collection: "auto",
      shipping_address_collection: { allowed_countries: ["US"] },
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: amountCents,
          product_data: {
            name: material === "metal" ? "Verifiedly Metal Tap Card" : "Verifiedly PVC Tap Card",
            description,
          },
        },
      }],
      success_url: `${origin}/dashboard/cards?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard/cards?checkout=cancelled`,
      metadata: {
        type: "verifiedly_tap_card",
        user_id: user.id,
        material,
        order_source: orderSource,
        uses_annual_credit: String(orderSource.startsWith("annual_")),
      },
      payment_intent_data: {
        metadata: {
          type: "verifiedly_tap_card",
          user_id: user.id,
          material,
          order_source: orderSource,
        },
      },
      custom_text: {
        submit: {
          message: "This is a personalized NFC profile-sharing card. It is not a payment card or government-issued ID.",
        },
      },
    });

    return json({ url: session.url, material, order_source: orderSource, amount_cents: amountCents });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to open card checkout.";
    return json({ error: message }, 500);
  }
});
