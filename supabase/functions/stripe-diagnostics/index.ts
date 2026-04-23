import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    // Admin gate
    const { data: roles } = await supabase
      .from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin");
    if (!roles || roles.length === 0) throw new Error("Forbidden");

    const sk = Deno.env.get("STRIPE_SECRET_KEY") || "";
    const wh = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

    const skLive = sk.startsWith("sk_live_");
    const skTest = sk.startsWith("sk_test_");
    const whValid = wh.startsWith("whsec_");

    // Try to verify the secret key works
    let stripeOk = false;
    let stripeAccountId: string | null = null;
    try {
      const stripe = new Stripe(sk, { apiVersion: "2025-08-27.basil" });
      const acct = await stripe.accounts.retrieve();
      stripeOk = true;
      stripeAccountId = acct.id;
    } catch (e) {
      stripeOk = false;
    }

    // Last webhook event
    const { data: lastEvent } = await supabase
      .from("webhook_events")
      .select("stripe_event_id, event_type, livemode, received_at")
      .order("received_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { count: eventCount } = await supabase
      .from("webhook_events").select("*", { count: "exact", head: true });

    return new Response(JSON.stringify({
      stripe: { live: skLive, test: skTest, configured: !!sk, ok: stripeOk, account_id: stripeAccountId },
      webhook: { configured: whValid },
      last_event: lastEvent || null,
      total_events: eventCount || 0,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});