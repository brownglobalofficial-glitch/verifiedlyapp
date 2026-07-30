import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
});

serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_MEMBERSHIP_WEBHOOK_SECRET");
    const signature = req.headers.get("stripe-signature");
    if (!stripeKey || !webhookSecret || !signature) {
      return json({ error: "Membership webhook is not configured" }, 400);
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const rawBody = await req.text();
    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    let subscription: Stripe.Subscription | null = null;
    let userId: string | null = null;
    let customerId: string | null = null;

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.type !== "verifiedly_membership") return json({ received: true, ignored: true });
      userId = session.metadata?.user_id || session.client_reference_id || null;
      customerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      if (subscriptionId) subscription = await stripe.subscriptions.retrieve(subscriptionId);
    } else if (
      event.type === "customer.subscription.created"
      || event.type === "customer.subscription.updated"
      || event.type === "customer.subscription.deleted"
    ) {
      subscription = event.data.object as Stripe.Subscription;
      if (subscription.metadata?.type !== "verifiedly_membership" && subscription.metadata?.tier !== "membership") {
        return json({ received: true, ignored: true });
      }
      userId = subscription.metadata?.user_id || null;
      customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id ?? null;
    } else {
      return json({ received: true, ignored: true });
    }

    if (!subscription || !userId) {
      return json({ error: "Membership event is missing subscription or user metadata" }, 400);
    }

    const interval = subscription.items.data[0]?.price?.recurring?.interval === "year" ? "year" : "month";
    const status = subscription.status;
    const accessActive = ["active", "trialing", "past_due"].includes(status);
    const mayGrantCard = interval === "year" && ["active", "trialing"].includes(status);
    const periodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null;

    const { data: billing } = await admin.from("verifiedly_billing")
      .select("annual_card_credit_granted_at")
      .eq("user_id", userId)
      .maybeSingle();

    const billingUpdate: Record<string, unknown> = {
      user_id: userId,
      stripe_customer_id: customerId,
      pro_subscription_id: subscription.id,
      pro_status: accessActive ? status : "inactive",
      pro_interval: interval,
      pro_current_period_end: periodEnd,
      pro_cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
      pro_started_at: subscription.created ? new Date(subscription.created * 1000).toISOString() : null,
    };
    if (mayGrantCard && !billing?.annual_card_credit_granted_at) {
      billingUpdate.annual_card_credit_available = true;
      billingUpdate.annual_card_credit_granted_at = new Date().toISOString();
    }

    const [{ error: profileError }, { error: billingError }] = await Promise.all([
      admin.from("profiles").update({ is_pro: accessActive, is_elite: false }).eq("id", userId),
      admin.from("verifiedly_billing").upsert(billingUpdate, { onConflict: "user_id" }),
    ]);
    if (profileError) throw profileError;
    if (billingError) throw billingError;

    return json({
      received: true,
      user_id: userId,
      membership_active: accessActive,
      interval,
      first_term_card_granted: Boolean(mayGrantCard && !billing?.annual_card_credit_granted_at),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Membership webhook failed";
    console.error("[MEMBERSHIP-WEBHOOK]", message);
    return json({ error: message }, 400);
  }
});
