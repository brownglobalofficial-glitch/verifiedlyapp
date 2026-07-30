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
      admin.from("verifiedly_billing")
        .select("stripe_customer_id, annual_card_credit_available, annual_card_credit_granted_at")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);
    const compTier = (profileRow?.comp_tier as string | null) || null;
    const compActive = compTier === "pro" || compTier === "elite";

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    let customerId = billingRow?.stripe_customer_id ?? null;
    if (!customerId) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      customerId = customers.data[0]?.id ?? null;
    }

    if (!customerId) {
      await Promise.all([
        admin.from("profiles").update({
          is_pro: compActive,
          is_elite: compTier === "elite",
        }).eq("id", user.id),
        admin.from("verifiedly_billing").upsert({
          user_id: user.id,
          pro_status: compActive ? "active" : "inactive",
          pro_interval: null,
        }, { onConflict: "user_id" }),
      ]);
      return json({
        subscribed: compActive,
        membership: compActive,
        tier: compActive ? "membership" : "free",
        comp: compActive,
        interval: null,
        annual_card_credit_available: billingRow?.annual_card_credit_available === true,
      });
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

    let selected: Stripe.Subscription | null = null;
    let selectedKind: "membership" | "legacy_pro" | "legacy_elite" | null = null;

    for (const status of rankedStatuses) {
      for (const subscription of subscriptions.data.filter((item) => item.status === status)) {
        const product = subscription.items.data[0]?.price?.product;
        const productId = typeof product === "string" ? product : product?.id;
        const metadataTier = subscription.metadata?.tier;
        const metadataType = subscription.metadata?.type;

        if (metadataType === "verifiedly_membership" || metadataTier === "membership") {
          selected = subscription;
          selectedKind = "membership";
          break;
        }
        if (metadataTier === "elite" || (productId && legacyEliteProducts.has(productId))) {
          selected = subscription;
          selectedKind = "legacy_elite";
          break;
        }
        if (
          metadataTier === "pro"
          || metadataType === "verifiedly_pro"
          || (metadataType === "subscription" && metadataTier === "pro")
          || (productId && legacyProProducts.has(productId))
        ) {
          selected = subscription;
          selectedKind = "legacy_pro";
          break;
        }
      }
      if (selected) break;
    }

    const selectedStatus = selected?.status ?? (compActive ? "active" : "inactive");
    const selectedInterval = selected?.items.data[0]?.price?.recurring?.interval === "year"
      ? "year"
      : selected
        ? "month"
        : null;
    const accessActive = Boolean(selected && ["active", "trialing", "past_due"].includes(selected.status)) || compActive;
    const membershipSubscription = selectedKind === "membership" && selectedInterval === "year";
    const eligibleForInitialCardCredit = membershipSubscription
      && Boolean(selected && ["active", "trialing"].includes(selected.status))
      && !billingRow?.annual_card_credit_granted_at;
    const periodEnd = selected?.current_period_end
      ? new Date(selected.current_period_end * 1000).toISOString()
      : null;

    const billingUpdate: Record<string, unknown> = {
      user_id: user.id,
      stripe_customer_id: customerId,
      pro_subscription_id: selected?.id ?? null,
      pro_status: accessActive ? selectedStatus : "inactive",
      pro_interval: selectedInterval,
      pro_current_period_end: periodEnd,
      pro_cancel_at_period_end: Boolean(selected?.cancel_at_period_end),
      pro_started_at: selected?.created ? new Date(selected.created * 1000).toISOString() : null,
    };
    if (eligibleForInitialCardCredit) {
      billingUpdate.annual_card_credit_available = true;
      billingUpdate.annual_card_credit_granted_at = new Date().toISOString();
    }

    await Promise.all([
      admin.from("profiles").update({
        is_pro: accessActive,
        is_elite: selectedKind === "legacy_elite" || compTier === "elite",
      }).eq("id", user.id),
      admin.from("verifiedly_billing").upsert(billingUpdate, { onConflict: "user_id" }),
    ]);

    const product = selected?.items.data[0]?.price?.product;
    const productId = typeof product === "string" ? product : product?.id ?? null;
    return json({
      subscribed: accessActive,
      membership: accessActive,
      tier: accessActive ? "membership" : "free",
      source: selectedKind,
      product_id: productId,
      subscription_end: periodEnd,
      status: accessActive ? selectedStatus : "inactive",
      cancel_at_period_end: Boolean(selected?.cancel_at_period_end),
      subscription_id: selected?.id ?? null,
      interval: selectedInterval,
      comp: compActive && !selected,
      annual_card_credit_available: eligibleForInitialCardCredit
        ? true
        : billingRow?.annual_card_credit_available === true,
      annual_card_credit_granted: Boolean(billingRow?.annual_card_credit_granted_at || eligibleForInitialCardCredit),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[CHECK-MEMBERSHIP]", message);
    return json({ error: message }, 500);
  }
});
