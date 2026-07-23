import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const allowedReturnPaths = new Set([
  "/dashboard",
  "/dashboard/pro",
  "/dashboard/cards",
]);

const logStep = (step: string, details?: unknown) => {
  console.log(`[CUSTOMER-PORTAL] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const { data: billing } = await supabaseClient.from("verifiedly_billing")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();
    let customerId = billing?.stripe_customer_id ?? null;
    if (!customerId) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      customerId = customers.data[0]?.id ?? null;
    }
    if (!customerId) throw new Error("No Stripe customer found for this user");

    const body = await req.json().catch(() => ({}));
    const requestedPath = typeof body?.return_path === "string" ? body.return_path : "/dashboard/pro";
    const returnPath = allowedReturnPaths.has(requestedPath) ? requestedPath : "/dashboard/pro";

    const requestOrigin = req.headers.get("origin") || "https://verifiedly.app";
    let origin = "https://verifiedly.app";
    try {
      const parsed = new URL(requestOrigin);
      const configuredOrigins = (Deno.env.get("VERIFIEDLY_ALLOWED_ORIGINS") ?? "")
        .split(",")
        .map((configuredOrigin) => configuredOrigin.trim())
        .filter(Boolean);
      const allowed = new Set([
        "https://verifiedly.app",
        "https://www.verifiedly.app",
        "https://id-preview--173dd0e3-02ca-4666-9958-5d8eb32162c8.lovable.app",
        ...configuredOrigins,
      ]).has(parsed.origin)
        || parsed.hostname === "localhost"
        || parsed.hostname === "127.0.0.1";
      if (allowed) origin = parsed.origin;
    } catch {
      // Use production origin.
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}${returnPath}`,
    });
    logStep("Portal session created");

    return new Response(JSON.stringify({ url: portalSession.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
