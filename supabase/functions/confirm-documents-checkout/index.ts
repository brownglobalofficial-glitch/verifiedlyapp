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
    const { data: userData } = await anon.auth.getUser(authHeader.replace("Bearer ", ""));
    const user = userData.user;
    if (!user) return json({ error: "Please sign in again." }, 401);

    const body = await req.json().catch(() => ({}));
    const sessionId = typeof body?.session_id === "string" ? body.session_id : null;
    if (!sessionId) return json({ error: "Missing checkout confirmation." }, 400);

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const checkout = await stripe.checkout.sessions.retrieve(sessionId);
    if (
      checkout.metadata?.type !== "verifiedly_documents"
      || checkout.metadata?.user_id !== user.id
      || typeof checkout.subscription !== "string"
    ) {
      return json({ error: "The Documents subscription could not be confirmed." }, 403);
    }

    const subscription = await stripe.subscriptions.retrieve(checkout.subscription);
    const active = ["active", "trialing"].includes(subscription.status);
    const status = subscription.status === "trialing"
      ? "trialing"
      : active
        ? "active"
        : subscription.status === "past_due"
          ? "past_due"
          : "incomplete";

    await admin.from("verifiedly_billing").upsert({
      user_id: user.id,
      stripe_customer_id: typeof checkout.customer === "string" ? checkout.customer : checkout.customer?.id,
      documents_subscription_id: subscription.id,
      documents_status: status,
      documents_interval: checkout.metadata.interval === "year" ? "year" : "month",
      documents_current_period_end: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
      documents_cancel_at_period_end: !!subscription.cancel_at_period_end,
    }, { onConflict: "user_id" });

    return json({ active, status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to confirm checkout.";
    return json({ error: message }, 500);
  }
});
