import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  console.log(`[CREATE-TIP] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
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

    const { creatorId, amount } = await req.json();
    if (!creatorId || !amount || amount < 100) throw new Error("creatorId and amount (min 100 cents) required");
    logStep("Request parsed", { creatorId, amount });

    // Get creator profile for display info + fee tier
    const { data: creator } = await supabaseClient.from("profiles").select("is_pro, is_elite, display_name, username").eq("id", creatorId).single();
    if (!creator) throw new Error("Creator not found");

    // Get stripe connect account from private data
    const { data: privateData } = await supabaseClient.from("creator_private_data").select("stripe_connect_account_id").eq("id", creatorId).single();
    const stripeConnectAccountId = privateData?.stripe_connect_account_id;

    // Calculate platform fee based on tier
    let feePercent = 10;
    if (creator.is_elite) feePercent = 0;
    else if (creator.is_pro) feePercent = 5;

    const applicationFee = Math.round(amount * (feePercent / 100));
    logStep("Fee calculated", { feePercent, applicationFee });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });

    // Create a simple checkout for tips (no auth required for tippers)
    const sessionParams: any = {
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: `Tip for ${creator.display_name || creator.username}`,
            description: `Support ${creator.display_name || creator.username} on Verifiedly`,
          },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/${creator.username}?tip=success`,
      cancel_url: `${req.headers.get("origin")}/${creator.username}`,
      metadata: {
        creator_id: creatorId,
        type: "tip",
        platform_fee_percent: String(feePercent),
      },
    };

    // Use Stripe Connect destination charges if creator has connected account
    if (creator.stripe_connect_account_id && applicationFee > 0) {
      sessionParams.payment_intent_data = {
        application_fee_amount: applicationFee,
        transfer_data: { destination: creator.stripe_connect_account_id },
      };
    } else if (creator.stripe_connect_account_id) {
      sessionParams.payment_intent_data = {
        transfer_data: { destination: creator.stripe_connect_account_id },
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
