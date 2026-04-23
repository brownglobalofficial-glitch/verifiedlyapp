import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  console.log(`[CREATE-PRODUCT-CHECKOUT] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
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

    const { productId, creatorId } = await req.json();
    if (!productId || !creatorId) throw new Error("productId and creatorId required");

    // Get product details
    const { data: product, error: prodErr } = await supabaseClient
      .from("products").select("*").eq("id", productId).eq("is_published", true).single();
    if (prodErr || !product) throw new Error("Product not found or not published");
    if (product.price <= 0) throw new Error("This product is free - no checkout needed");
    logStep("Product found", { name: product.name, price: product.price });

    // Get creator profile for fee calculation
    const { data: creator } = await supabaseClient
      .from("profiles").select("is_pro, is_elite, display_name, username").eq("id", creatorId).single();
    if (!creator) throw new Error("Creator not found");

    // Get stripe connect account from private data
    const { data: privateData } = await supabaseClient
      .from("creator_private_data").select("stripe_connect_account_id").eq("id", creatorId).single();
    const stripeConnectAccountId = privateData?.stripe_connect_account_id;

    let feePercent = 10;
    if (creator.is_elite) feePercent = 0;
    else if (creator.is_pro) feePercent = 5;

    const amountCents = Math.round(product.price * 100);
    const applicationFee = Math.round(amountCents * (feePercent / 100));
    logStep("Fee calculated", { feePercent, applicationFee, amountCents });

    // Optionally get buyer info
    let customerEmail: string | undefined;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabaseClient.auth.getUser(token);
      customerEmail = userData.user?.email || undefined;
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });

    // Check for existing customer
    let customerId: string | undefined;
    if (customerEmail) {
      const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
      if (customers.data.length > 0) customerId = customers.data[0].id;
    }

    // Prefer the synced Stripe Price (so the sale appears under the product in Stripe Dashboard).
    // Fall back to inline price_data if no synced price exists yet.
    const lineItem: any = product.stripe_price_id
      ? { price: product.stripe_price_id, quantity: 1 }
      : {
          price_data: {
            currency: "usd",
            product_data: {
              name: product.name,
              description: product.description || `Digital product by ${creator.display_name || creator.username}`,
              ...(product.image_url ? { images: [product.image_url] } : {}),
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        };

    const sessionParams: any = {
      customer: customerId,
      customer_email: customerId ? undefined : customerEmail,
      line_items: [lineItem],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/${creator.username}?purchase=success&product=${productId}`,
      cancel_url: `${req.headers.get("origin")}/${creator.username}`,
      metadata: {
        creator_id: creatorId,
        product_id: productId,
        type: "product_purchase",
        platform_fee_percent: String(feePercent),
        buyer_email: customerEmail || "guest",
      },
    };

    // Use Stripe Connect destination charges if creator has a connected account
    if (stripeConnectAccountId && applicationFee > 0) {
      sessionParams.payment_intent_data = {
        application_fee_amount: applicationFee,
        transfer_data: { destination: stripeConnectAccountId },
      };
    } else if (stripeConnectAccountId) {
      sessionParams.payment_intent_data = {
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
