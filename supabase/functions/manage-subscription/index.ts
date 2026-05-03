import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (s: string, d?: any) =>
  console.log(`[MANAGE-SUBSCRIPTION] ${s}${d ? ` - ${JSON.stringify(d)}` : ""}`);

/**
 * Self-serve management for the user's Verifiedly Pro / Elite subscription.
 * Actions:
 *   - cancel  : cancel at period end (keeps perks until renewal date)
 *   - resume  : un-cancel a sub that was scheduled to cancel
 *   - pause   : pause collection (mark_uncollectible) — perks still active until renewal
 *   - unpause : resume normal collection
 *
 * Returns the latest subscription snapshot so the client can re-render.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user?.email) throw new Error("Auth error");
    const user = userData.user;

    const body = await req.json().catch(() => ({}));
    const action: string = body.action;
    if (!["cancel", "resume", "pause", "unpause"].includes(action)) {
      throw new Error("Invalid action");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find this user's customer + their Verifiedly platform subscription.
    const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
    if (!customers.data.length) throw new Error("No Stripe customer for this account");
    const customerId = customers.data[0].id;

    const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 10 });
    const PRO = "prod_URi89hw7irIarX";
    const ELITE = "prod_URi8z4FUV491Gb";
    const sub = subs.data.find((s) => {
      const pid = s.items.data[0]?.price.product as string;
      return (pid === PRO || pid === ELITE) && ["active", "trialing", "past_due", "paused"].includes(s.status);
    });
    if (!sub) throw new Error("No active Verifiedly subscription found");
    log("Found subscription", { id: sub.id, status: sub.status, action });

    let updated: Stripe.Subscription;
    if (action === "cancel") {
      updated = await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true });
    } else if (action === "resume") {
      updated = await stripe.subscriptions.update(sub.id, { cancel_at_period_end: false });
    } else if (action === "pause") {
      updated = await stripe.subscriptions.update(sub.id, {
        pause_collection: { behavior: "mark_uncollectible" },
      });
    } else {
      updated = await stripe.subscriptions.update(sub.id, { pause_collection: "" as any });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        subscription_id: updated.id,
        status: updated.status,
        cancel_at_period_end: updated.cancel_at_period_end,
        paused: !!updated.pause_collection,
        current_period_end: updated.current_period_end
          ? new Date(updated.current_period_end * 1000).toISOString()
          : null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});