import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  console.log(`[CREATE-SUBSCRIPTION-CHECKOUT] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const { subscriptionId, creatorId, interval } = await req.json();
    if (!subscriptionId || !creatorId) throw new Error("subscriptionId and creatorId required");
    const billingInterval = interval === "year" ? "year" : "month";

    // Get subscription tier details
    const { data: sub, error: subErr } = await supabase
      .from("subscriptions").select("*").eq("id", subscriptionId).eq("is_active", true).single();
    if (subErr || !sub) throw new Error("Subscription tier not found or inactive");
    logStep("Subscription found", { name: sub.name, price: sub.price });

    // Get creator profile
    const { data: creator } = await supabase
      .from("profiles").select("is_pro, is_elite, display_name, username").eq("id", creatorId).maybeSingle();
    if (!creator) throw new Error("Creator not found");

    // Get stripe connect account from private data
    const { data: privateData } = await supabase
      .from("creator_private_data").select("stripe_connect_account_id").eq("id", creatorId).maybeSingle();
    const stripeConnectAccountId = privateData?.stripe_connect_account_id;
    if (!stripeConnectAccountId) throw new Error("This creator hasn't connected Stripe yet — they need to complete payouts setup.");

    // Calculate platform fee
    let feePercent = 10;
    if (creator.is_elite) feePercent = 0;
    else if (creator.is_pro) feePercent = 5;

    // Annual = monthly price * 10 (~17% off / 2 months free)
    const monthlyAmountCents = Math.round(sub.price * 100);
    const amountCents = billingInterval === "year" ? monthlyAmountCents * 10 : monthlyAmountCents;
    const applicationFee = Math.round(amountCents * (feePercent / 100));
    logStep("Fee calculated", { feePercent, applicationFee, amountCents, billingInterval });

    // Get buyer info if authenticated
    let customerEmail: string | undefined;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabase.auth.getUser(token);
      customerEmail = userData.user?.email || undefined;
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });

    // Check for existing customer
    let customerId: string | undefined;
    if (customerEmail) {
      const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
      if (customers.data.length > 0) customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin") || "https://verifiedlyapp.lovable.app";

    // Prefer the synced Stripe price ID (so memberships show up under the same Stripe product).
    const syncedPriceId = billingInterval === "year" ? (sub as any).stripe_price_year_id : (sub as any).stripe_price_month_id;
    const lineItem: any = syncedPriceId
      ? { price: syncedPriceId, quantity: 1 }
      : {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${sub.name} — ${creator.display_name || creator.username}`,
              description: sub.description || `${billingInterval === "year" ? "Annual" : "Monthly"} subscription to ${creator.display_name || creator.username}`,
            },
            unit_amount: amountCents,
            recurring: { interval: billingInterval },
          },
          quantity: 1,
        };

    const sessionParams: any = {
      customer: customerId,
      customer_email: customerId ? undefined : customerEmail,
      line_items: [lineItem],
      mode: "subscription",
      success_url: `${origin}/${creator.username}?subscribed=true`,
      cancel_url: `${origin}/${creator.username}`,
      metadata: {
        creator_id: creatorId,
        subscription_id: subscriptionId,
        type: "creator_subscription",
        platform_fee_percent: String(feePercent),
        billing_interval: billingInterval,
      },
    };

    // Use Stripe Connect for creator payouts
    if (applicationFee > 0) {
      sessionParams.subscription_data = {
        application_fee_percent: feePercent,
        transfer_data: { destination: stripeConnectAccountId },
      };
    } else {
      sessionParams.subscription_data = {
        transfer_data: { destination: stripeConnectAccountId },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    logStep("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
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
