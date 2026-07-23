import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
});

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Please sign in again." }, 401);

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await admin.auth.getUser(token);
    const user = userData.user;
    if (userError || !user?.email) return json({ error: "Please sign in again." }, 401);

    const [{ data: profileRow }, { data: billingRow }] = await Promise.all([
      admin.from("profiles").select("comp_tier").eq("id", user.id).maybeSingle(),
      admin.from("verifiedly_billing").select("stripe_customer_id").eq("user_id", user.id).maybeSingle(),
    ]);
    const compTier = (profileRow?.comp_tier as string | null) || null;
    const compRank = compTier === "elite" ? 2 : compTier === "pro" ? 1 : 0;

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    let customerId = billingRow?.stripe_customer_id ?? null;
    if (!customerId) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      customerId = customers.data[0]?.id ?? null;
    }

    if (!customerId) {
      const tier = compTier || "free";
      await admin.from("profiles").update({
        is_pro: tier === "pro" || tier === "elite",
        is_elite: tier === "elite",
      }).eq("id", user.id);
      await admin.from("verifiedly_billing").upsert({
        user_id: user.id,
        pro_status: tier === "pro" || tier === "elite" ? "active" : "inactive",
      }, { onConflict: "user_id" });
      return json({ subscribed: tier !== "free", tier, comp: !!compTier });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 25,
      expand: ["data.items.data.price.product"],
    });

    const legacyProProducts = new Set(["prod_URi89hw7irIarX", "prod_UwKd3MLosO6bDT", "prod_UwKcOur9VtceeW"]);
    const legacyEliteProducts = new Set(["prod_URi8z4FUV491Gb"]);
    const rankedStatuses = ["active", "trialing", "past_due", "unpaid", "incomplete"];

    let tier = "free";
    let selected: Stripe.Subscription | null = null;

    for (const status of rankedStatuses) {
      for (const subscription of subscriptions.data.filter((item) => item.status === status)) {
        const product = subscription.items.data[0]?.price?.product;
        const productId = typeof product === "string" ? product : product?.id;
        const metadataTier = subscription.metadata?.tier;
        const metadataType = subscription.metadata?.type;

        if (metadataTier === "elite" || (productId && legacyEliteProducts.has(productId))) {
          tier = "elite";
          selected = subscription;
          break;
        }
        if (
          metadataTier === "pro"
          || metadataType === "verifiedly_pro"
          || (metadataType === "subscription" && metadataTier === "pro")
          || (productId && legacyProProducts.has(productId))
        ) {
          tier = "pro";
          selected = subscription;
        }
      }
      if (tier === "elite" || selected) break;
    }

    const stripeRank = tier === "elite" ? 2 : tier === "pro" ? 1 : 0;
    if (compRank > stripeRank) tier = compTier as string;

    const selectedStatus = selected?.status ?? (tier !== "free" && compTier ? "active" : "inactive");
    const interval = selected?.items.data[0]?.price?.recurring?.interval === "year" ? "year" : selected ? "month" : null;
    const periodEnd = selected?.current_period_end
      ? new Date(selected.current_period_end * 1000).toISOString()
      : null;

    await Promise.all([
      admin.from("profiles").update({
        is_pro: tier === "pro" || tier === "elite",
        is_elite: tier === "elite",
      }).eq("id", user.id),
      admin.from("verifiedly_billing").upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        pro_subscription_id: selected?.id ?? null,
        pro_status: tier === "pro" || tier === "elite" ? selectedStatus : "inactive",
        pro_interval: interval,
        pro_current_period_end: periodEnd,
        pro_cancel_at_period_end: !!selected?.cancel_at_period_end,
        pro_started_at: selected?.created ? new Date(selected.created * 1000).toISOString() : null,
      }, { onConflict: "user_id" }),
    ]);

    const product = selected?.items.data[0]?.price?.product;
    const productId = typeof product === "string" ? product : product?.id ?? null;
    return json({
      subscribed: tier !== "free",
      tier,
      product_id: productId,
      subscription_end: periodEnd,
      status: selectedStatus,
      cancel_at_period_end: !!selected?.cancel_at_period_end,
      subscription_id: selected?.id ?? null,
      interval,
      comp: compRank > stripeRank,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[CHECK-SUBSCRIPTION]", message);
    return json({ error: message }, 500);
  }
});
