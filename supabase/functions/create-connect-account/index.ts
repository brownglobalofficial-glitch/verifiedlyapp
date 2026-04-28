import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    // Parse body first (may contain return_url)
    let body: Record<string, any> = {};
    try { body = await req.json(); } catch { /* no body is fine */ }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header — please sign in again.");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");
    const user = userData.user;

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not configured");
    if (stripeKey.startsWith("rk_")) {
      throw new Error("Stripe key is a restricted key (rk_). A standard secret key (sk_live_ or sk_test_) is required for Connect onboarding.");
    }
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if user already has a connect account (from private data table)
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, username")
      .eq("id", user.id)
      .maybeSingle();

    const { data: privateData } = await supabase
      .from("creator_private_data")
      .select("stripe_connect_account_id")
      .eq("id", user.id)
      .maybeSingle();

    let accountId = privateData?.stripe_connect_account_id;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email,
        metadata: { user_id: user.id },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          name: profile?.display_name || profile?.username || undefined,
        },
      });
      accountId = account.id;

      // Store in private data table
      const { error: privErr } = await supabase
        .from("creator_private_data")
        .upsert({ id: user.id, stripe_connect_account_id: accountId }, { onConflict: "id" });
      if (privErr) {
        console.error("[CREATE-CONNECT-ACCOUNT] Failed to save account id", privErr);
        throw new Error(`Failed to save Stripe account id: ${privErr.message}`);
      }
    }

    // Check if onboarding is complete
    const account = await stripe.accounts.retrieve(accountId);
    if (account.details_submitted) {
      return new Response(JSON.stringify({
        onboarded: true,
        account_id: accountId,
        payouts_enabled: account.payouts_enabled,
        charges_enabled: account.charges_enabled,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create onboarding link
    const origin = req.headers.get("origin") || "https://verifiedlyapp.lovable.app";
    const returnUrl = body.return_url || `${origin}/settings?stripe_onboarded=true`;
    const refreshUrl = body.refresh_url || `${origin}/settings`;
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    return new Response(JSON.stringify({
      onboarded: false,
      url: accountLink.url,
      account_id: accountId,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[CREATE-CONNECT-ACCOUNT]", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
