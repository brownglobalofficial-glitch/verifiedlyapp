import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Lets a creator force-refresh their Stripe Connect status (used by the payouts
 * checklist's "Re-check" button). The webhook stays the source of truth, but
 * this guarantees the user sees an up-to-date snapshot on demand.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");
    const { data: userData } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!userData.user) throw new Error("Not authenticated");

    const { data: priv } = await supabase
      .from("creator_private_data")
      .select("stripe_connect_account_id")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (!priv?.stripe_connect_account_id) {
      return new Response(JSON.stringify({ has_account: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
    const acct = await stripe.accounts.retrieve(priv.stripe_connect_account_id);
    const reqs: any = acct.requirements || {};

    await supabase
      .from("creator_private_data")
      .update({
        stripe_charges_enabled: !!acct.charges_enabled,
        stripe_payouts_enabled: !!acct.payouts_enabled,
        stripe_details_submitted: !!acct.details_submitted,
        stripe_requirements_currently_due: reqs.currently_due ?? [],
        stripe_requirements_past_due: reqs.past_due ?? [],
        stripe_disabled_reason: reqs.disabled_reason ?? null,
        stripe_status_synced_at: new Date().toISOString(),
      })
      .eq("id", userData.user.id);

    return new Response(JSON.stringify({
      has_account: true,
      charges_enabled: !!acct.charges_enabled,
      payouts_enabled: !!acct.payouts_enabled,
      details_submitted: !!acct.details_submitted,
      currently_due: reqs.currently_due ?? [],
      past_due: reqs.past_due ?? [],
      disabled_reason: reqs.disabled_reason ?? null,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || String(err) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});