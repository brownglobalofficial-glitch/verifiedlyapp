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
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");
    const user = userData.user;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });

    // Check if user already has a connect account
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_connect_account_id, display_name, username")
      .eq("id", user.id)
      .single();

    let accountId = profile?.stripe_connect_account_id;

    if (!accountId) {
      // Create a new Express connected account
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

      // Save to profile
      await supabase
        .from("profiles")
        .update({ stripe_connect_account_id: accountId })
        .eq("id", user.id);
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
    const { return_url } = await req.json().catch(() => ({}));
    const returnUrl = return_url || `${origin}/settings?stripe_onboarded=true`;
    const refreshUrl = return_url ? `${origin}/onboarding` : `${origin}/settings`;
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
