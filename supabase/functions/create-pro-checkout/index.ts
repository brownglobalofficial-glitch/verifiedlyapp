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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
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
    const interval = body?.interval === "year" ? "year" : "month";

    const { data: currentBilling } = await admin
      .from("verifiedly_billing")
      .select("stripe_customer_id, pro_status, pro_interval, pro_subscription_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (["active", "trialing"].includes(currentBilling?.pro_status ?? "")) {
      return json({
        already_subscribed: true,
        interval: currentBilling?.pro_interval ?? null,
        subscription_id: currentBilling?.pro_subscription_id ?? null,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    let customerId = currentBilling?.stripe_customer_id ?? null;
    if (!customerId) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      customerId = customers.data[0]?.id ?? null;
    }
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { verifiedly_user_id: user.id },
      });
      customerId = customer.id;
    }

    await admin.from("verifiedly_billing").upsert({
      user_id: user.id,
      stripe_customer_id: customerId,
    }, { onConflict: "user_id" });

    const monthlyPriceId = Deno.env.get("STRIPE_PRO_MONTHLY_PRICE_ID")
      || "price_1TuNUT1hrOAc8qE8Zg1OnTwd";
    const annualPriceId = Deno.env.get("STRIPE_PRO_ANNUAL_PRICE_ID") || "";

    const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = interval === "month"
      ? { price: monthlyPriceId, quantity: 1 }
      : annualPriceId
        ? { price: annualPriceId, quantity: 1 }
        : {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: 4999,
              recurring: { interval: "year" },
              product_data: {
                name: "Verifiedly Pro Annual",
                description: "Official-profile tools, identity-verification eligibility, priority support, analytics, and one included PVC Tap Card credit.",
              },
            },
          };

    const origin = safeOrigin(req.headers.get("origin"));
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      locale: "auto",
      billing_address_collection: "auto",
      line_items: [lineItem],
      success_url: `${origin}/dashboard/pro?checkout=success`,
      cancel_url: `${origin}/dashboard/pro?checkout=cancelled`,
      metadata: {
        type: "verifiedly_pro",
        user_id: user.id,
        interval,
      },
      subscription_data: {
        metadata: {
          type: "verifiedly_pro",
          user_id: user.id,
          interval,
        },
      },
    }, {
      idempotencyKey: `verifiedly-pro-${user.id}-${interval}-${new Date().toISOString().slice(0, 10)}`,
    });

    return json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to open checkout.";
    return json({ error: message }, 500);
  }
});
