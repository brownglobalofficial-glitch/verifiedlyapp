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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_AMOUNT_CENTS = 50_000; // $500 cap per tip session
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT = 10;
const rateBuckets = new Map<string, number[]>();
function rateLimited(key: string): boolean {
  const now = Date.now();
  const bucket = (rateBuckets.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (bucket.length >= RATE_LIMIT) {
    rateBuckets.set(key, bucket);
    return true;
  }
  bucket.push(now);
  rateBuckets.set(key, bucket);
  return false;
}

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

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";
    if (rateLimited(ip)) {
      return new Response(JSON.stringify({ error: "Too many tip attempts. Please try again later." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 429,
      });
    }

    const { creatorId, amount } = await req.json();
    if (!creatorId || typeof creatorId !== "string" || !UUID_RE.test(creatorId)) {
      throw new Error("Valid creatorId required");
    }
    if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount < 100 || amount > MAX_AMOUNT_CENTS) {
      throw new Error(`amount must be an integer between 100 and ${MAX_AMOUNT_CENTS} cents`);
    }
    logStep("Request parsed", { creatorId, amount });

    // Get creator profile for display info + fee tier
    const { data: creator } = await supabaseClient
      .from("profiles")
      .select("is_pro, is_elite, display_name, username, tips_enabled")
      .eq("id", creatorId)
      .maybeSingle();
    if (!creator) throw new Error("Creator not found");
    if (creator.tips_enabled === false) throw new Error("This creator is not accepting tips");

    // Get stripe connect account from private data
    const { data: privateData } = await supabaseClient.from("creator_private_data").select("stripe_connect_account_id").eq("id", creatorId).single();
    const stripeConnectAccountId = privateData?.stripe_connect_account_id;

    // Calculate platform fee based on tier
    // Fee tiers: Free 10%, Pro 3%, Elite 0% (legacy).
    let feePercent = 10;
    if (creator.is_elite) feePercent = 0;
    else if (creator.is_pro) feePercent = 3;

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
      locale: "auto",
      billing_address_collection: "auto",
      success_url: `${req.headers.get("origin")}/${creator.username}?tip=success`,
      cancel_url: `${req.headers.get("origin")}/${creator.username}`,
      metadata: {
        creator_id: creatorId,
        type: "tip",
        platform_fee_percent: String(feePercent),
      },
    };

    // Use Stripe Connect destination charges if creator has connected account
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
