import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Confirms the result of a checkout/subscription. Used by /subscription/success
 * to show the buyer their plan, renewal date, and any payment issues.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { sessionId } = await req.json().catch(() => ({}));
    if (!sessionId || typeof sessionId !== "string") throw new Error("sessionId required");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "subscription.latest_invoice", "line_items.data.price.product"],
    });

    const subscription = session.subscription as Stripe.Subscription | null;
    const li = session.line_items?.data?.[0];
    const product = (li?.price?.product as Stripe.Product | null) ?? null;

    // Authenticate the caller and only expose the buyer email when it matches.
    const sessionEmail = session.customer_details?.email ?? session.customer_email ?? null;
    let authedEmail: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const anon = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_ANON_KEY") ?? "",
          { global: { headers: { Authorization: authHeader } } }
        );
        const { data } = await anon.auth.getClaims(authHeader.replace("Bearer ", ""));
        authedEmail = (data?.claims?.email as string | undefined)?.toLowerCase() ?? null;
      } catch { /* ignore, treat as unauthenticated */ }
    }
    const canSeeEmail = !!sessionEmail && !!authedEmail && authedEmail === sessionEmail.toLowerCase();

    let creatorUsername: string | null = null;
    const creatorId = session.metadata?.creator_id;
    if (creatorId) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );
      const { data } = await supabase.from("profiles").select("username").eq("id", creatorId).maybeSingle();
      creatorUsername = data?.username ?? null;
    }

    const result = {
      payment_status: session.payment_status,
      status: session.status,
      mode: session.mode,
      customer_email: canSeeEmail ? sessionEmail : null,
      amount_total: session.amount_total,
      currency: session.currency,
      product_name: product?.name ?? li?.description ?? null,
      creator_username: creatorUsername,
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            current_period_end: (subscription as any).current_period_end ?? null,
            cancel_at_period_end: subscription.cancel_at_period_end,
            interval: subscription.items.data[0]?.price.recurring?.interval ?? null,
            latest_invoice_status: (subscription.latest_invoice as Stripe.Invoice | null)?.status ?? null,
          }
        : null,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || String(err) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});