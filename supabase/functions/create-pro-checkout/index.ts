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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe Checkout is not configured yet.");

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
    const interval = body?.interval === "year" ? "year" : "month";
    const amountCents = interval === "year" ? 4999 : 499;

    const [{ data: profile }, { data: billing }] = await Promise.all([
      admin.from("profiles")
        .select("is_pro, display_name, username")
        .eq("id", user.id)
        .maybeSingle(),
      admin.from("verifiedly_billing")
        .select("stripe_customer_id, pro_status")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    if (profile?.is_pro || billing?.pro_status === "active" || billing?.pro_status === "trialing") {
      return json({ already_pro: true });
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
        name: profile?.display_name || undefined,
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
      client_reference_id: user.id,
      mode: "subscription",
      locale: "auto",
      billing_address_collection: "auto",
      allow_promotion_codes: true,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: amountCents,
          recurring: { interval },
          product_data: {
            name: "Verifiedly Pro",
            description: "Advanced profile tools, adult identity-verification eligibility, analytics and Tap Card member pricing",
          },
        },
      }],
      success_url: `${origin}/dashboard/pro?checkout=success`,
      cancel_url: `${origin}/dashboard/pro?checkout=cancelled`,
      metadata: {
        type: "subscription",
        tier: "pro",
        user_id: user.id,
        interval,
      },
      subscription_data: {
        metadata: {
          type: "subscription",
          tier: "pro",
          user_id: user.id,
          interval,
        },
      },
      custom_text: {
        submit: {
          message: "Identity verification is available to eligible adults after Stripe confirms the Pro subscription.",
        },
      },
    });

    return json({ url: session.url, amount_cents: amountCents, interval });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start Verifiedly Pro checkout.";
    console.error("[CREATE-PRO-CHECKOUT]", message);
    return json({ error: message }, 500);
  }
});
