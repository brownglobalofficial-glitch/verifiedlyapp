import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  console.log(`[CHECK-SUBSCRIPTION] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No customer found");
      // Update profile to free tier
      await supabaseClient.from("profiles").update({ is_pro: false, is_elite: false }).eq("id", user.id);
      return new Response(JSON.stringify({ subscribed: false, tier: "free" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 10,
    });

    const PRO_PRODUCT = "prod_URi89hw7irIarX";
    const ELITE_PRODUCT = "prod_URi8z4FUV491Gb";

    let tier = "free";
    let subscriptionEnd = null;
    let productId = null;
    let status: string | null = null;
    let cancelAtPeriodEnd = false;
    let subscriptionId: string | null = null;

    if (subscriptions.data.length > 0) {
      for (const sub of subscriptions.data) {
        const subProductId = sub.items.data[0].price.product as string;
        if (subProductId === ELITE_PRODUCT) {
          tier = "elite";
          productId = subProductId;
          subscriptionEnd = new Date(sub.current_period_end * 1000).toISOString();
          status = sub.status;
          cancelAtPeriodEnd = !!sub.cancel_at_period_end;
          subscriptionId = sub.id;
          break;
        } else if (subProductId === PRO_PRODUCT) {
          tier = "pro";
          productId = subProductId;
          subscriptionEnd = new Date(sub.current_period_end * 1000).toISOString();
          status = sub.status;
          cancelAtPeriodEnd = !!sub.cancel_at_period_end;
          subscriptionId = sub.id;
        }
      }
    } else {
      // Also check past_due / unpaid so users see why payouts are at risk
      const allSubs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 5 });
      const live = allSubs.data.find(s => ["past_due","unpaid","incomplete"].includes(s.status));
      if (live) {
        const pid = live.items.data[0].price.product as string;
        if (pid === ELITE_PRODUCT) tier = "elite";
        else if (pid === PRO_PRODUCT) tier = "pro";
        productId = pid;
        status = live.status;
        subscriptionEnd = new Date(live.current_period_end * 1000).toISOString();
        subscriptionId = live.id;
      }
    }

    logStep("Subscription tier determined", { tier, productId });

    // Update profile
    await supabaseClient.from("profiles").update({
      is_pro: tier === "pro" || tier === "elite",
      is_elite: tier === "elite",
    }).eq("id", user.id);
    logStep("Profile updated");

    return new Response(JSON.stringify({
      subscribed: tier !== "free",
      tier,
      product_id: productId,
      subscription_end: subscriptionEnd,
      status,
      cancel_at_period_end: cancelAtPeriodEnd,
      subscription_id: subscriptionId,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
