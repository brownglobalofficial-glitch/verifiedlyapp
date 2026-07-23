import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const log = (step: string, details?: unknown) => {
  console.log(`[STRIPE-WEBHOOK] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

const subscriptionStatus = (status: Stripe.Subscription.Status) => {
  if (status === "trialing") return "trialing";
  if (status === "active") return "active";
  if (status === "past_due") return "past_due";
  if (status === "unpaid") return "unpaid";
  if (status === "incomplete") return "incomplete";
  if (status === "paused") return "paused";
  return "canceled";
};

const stripeId = (value: string | { id?: string } | null | undefined) => {
  if (typeof value === "string") return value;
  return value?.id ?? null;
};

serve(async (req) => {
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  let claimedEventId: string | null = null;

  try {
    if (!stripeKey || !webhookSecret) {
      return new Response(JSON.stringify({ error: "Stripe webhook is not configured." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing Stripe signature." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const event = stripe.webhooks.constructEvent(await req.text(), signature, webhookSecret);
    claimedEventId = event.id;
    log("Event received", { id: event.id, type: event.type });

    const now = new Date().toISOString();
    const { error: claimError } = await supabase.from("webhook_events").insert({
      stripe_event_id: event.id,
      event_type: event.type,
      livemode: event.livemode,
      payload_preview: { id: event.id, type: event.type, created: event.created },
      processing_status: "processing",
      attempt_count: 1,
      last_attempt_at: now,
      processed_at: null,
      last_error: null,
    });

    if (claimError) {
      if ((claimError as { code?: string }).code !== "23505") throw claimError;
      const { data: existing, error: existingError } = await supabase
        .from("webhook_events")
        .select("processing_status, attempt_count, last_attempt_at")
        .eq("stripe_event_id", event.id)
        .maybeSingle();
      if (existingError || !existing) throw existingError ?? new Error("Unable to read webhook state.");
      if (existing.processing_status === "processed") {
        return new Response(JSON.stringify({ received: true, duplicate: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      const lastAttemptMs = new Date(existing.last_attempt_at).getTime();
      if (
        existing.processing_status === "processing"
        && Number.isFinite(lastAttemptMs)
        && Date.now() - lastAttemptMs < 5 * 60 * 1000
      ) {
        return new Response(JSON.stringify({ error: "Webhook event is already processing." }), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        });
      }
      const { error: reclaimError } = await supabase.from("webhook_events").update({
        processing_status: "processing",
        attempt_count: (existing.attempt_count ?? 1) + 1,
        last_attempt_at: now,
        last_error: null,
      }).eq("stripe_event_id", event.id);
      if (reclaimError) throw reclaimError;
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata || {};
      const type = metadata.type;

      if (type === "verifiedly_pro" && metadata.user_id && typeof session.subscription === "string") {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        const interval = metadata.interval === "year"
          || subscription.items.data[0]?.price.recurring?.interval === "year"
          ? "year"
          : "month";
        const status = subscriptionStatus(subscription.status);

        await supabase.from("verifiedly_billing").upsert({
          user_id: metadata.user_id,
          stripe_customer_id: stripeId(session.customer),
          pro_subscription_id: subscription.id,
          pro_status: status,
          pro_interval: interval,
          pro_current_period_end: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null,
          pro_cancel_at_period_end: !!subscription.cancel_at_period_end,
          pro_started_at: new Date().toISOString(),
          annual_card_credit_available: interval === "year",
          annual_card_credit_granted_at: interval === "year" ? new Date().toISOString() : null,
        }, { onConflict: "user_id" });

        await supabase.from("profiles").update({ is_pro: ["active", "trialing"].includes(status) })
          .eq("id", metadata.user_id);
        log("Verifiedly Pro subscription confirmed", { userId: metadata.user_id, interval, status });
      }

      if (type === "verifiedly_identity_payment" && metadata.user_id && session.payment_status === "paid") {
        await supabase.from("verifiedly_billing").upsert({
          user_id: metadata.user_id,
          stripe_customer_id: stripeId(session.customer),
          verification_payment_status: "paid",
          verification_checkout_session_id: session.id,
        }, { onConflict: "user_id" });
      }

      if (type === "verifiedly_documents" && metadata.user_id && typeof session.subscription === "string") {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        await supabase.from("verifiedly_billing").upsert({
          user_id: metadata.user_id,
          stripe_customer_id: stripeId(session.customer),
          documents_subscription_id: subscription.id,
          documents_status: subscriptionStatus(subscription.status),
          documents_interval: metadata.interval === "year" ? "year" : "month",
          documents_current_period_end: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null,
          documents_cancel_at_period_end: !!subscription.cancel_at_period_end,
        }, { onConflict: "user_id" });
      }

      if (type === "verifiedly_tap_card" && metadata.user_id && session.payment_status === "paid") {
        const currentSession = await stripe.checkout.sessions.retrieve(session.id);
        const collected = (currentSession as unknown as {
          collected_information?: {
            shipping_details?: { name?: string; address?: Record<string, string | null> };
          };
          shipping_details?: { name?: string; address?: Record<string, string | null> };
        });
        const shipping = collected.collected_information?.shipping_details
          ?? collected.shipping_details
          ?? null;

        const { data: orderResult, error: orderError } = await supabase.rpc(
          "record_verifiedly_tap_card_order",
          {
            p_user_id: metadata.user_id,
            p_material: metadata.material === "metal" ? "metal" : "pvc",
            p_order_source: metadata.order_source || "standard_purchase",
            p_amount_cents: session.amount_total || 0,
            p_currency: session.currency || "usd",
            p_checkout_session_id: session.id,
            p_payment_intent_id: stripeId(session.payment_intent),
            p_shipping_name: shipping?.name || "",
            p_shipping_address: shipping?.address || {},
          },
        );
        if (orderError) throw orderError;
        log("Tap Card order recorded", orderResult);
      }

      if (type === "subscription" && metadata.user_id && ["pro", "elite"].includes(metadata.tier || "")) {
        await supabase.from("profiles").update({
          is_pro: true,
          is_elite: metadata.tier === "elite",
        }).eq("id", metadata.user_id);
      }
    }

    if (
      event.type === "identity.verification_session.verified"
      || event.type === "identity.verification_session.requires_input"
      || event.type === "identity.verification_session.canceled"
    ) {
      const verification = event.data.object as Stripe.Identity.VerificationSession;
      const userId = verification.metadata?.user_id;
      if (userId) {
        const status = event.type === "identity.verification_session.verified"
          ? "verified"
          : event.type === "identity.verification_session.requires_input"
            ? "requires_input"
            : "canceled";

        await supabase.from("verifiedly_billing").upsert({
          user_id: userId,
          identity_status: status,
          identity_last_session_id: verification.id,
        }, { onConflict: "user_id" });

        await supabase.from("profiles").update({
          id_verified: status === "verified",
          verification_status: status,
          verified_at: status === "verified" ? new Date().toISOString() : null,
        }).eq("id", userId);
      }
    }

    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const metadata = (subscription.metadata || {}) as Record<string, string>;
      const userId = metadata.user_id;
      const status = event.type === "customer.subscription.deleted"
        ? "canceled"
        : subscriptionStatus(subscription.status);

      if (userId && metadata.type === "verifiedly_pro") {
        const interval = metadata.interval === "year"
          || subscription.items.data[0]?.price.recurring?.interval === "year"
          ? "year"
          : "month";
        await supabase.from("verifiedly_billing").upsert({
          user_id: userId,
          pro_subscription_id: subscription.id,
          pro_status: status,
          pro_interval: interval,
          pro_current_period_end: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null,
          pro_cancel_at_period_end: !!subscription.cancel_at_period_end,
        }, { onConflict: "user_id" });

        const { data: profile } = await supabase.from("profiles")
          .select("comp_tier")
          .eq("id", userId)
          .maybeSingle();
        const compensated = ["pro", "elite"].includes(profile?.comp_tier || "");
        await supabase.from("profiles").update({
          is_pro: compensated || ["active", "trialing"].includes(status),
          is_elite: profile?.comp_tier === "elite",
        }).eq("id", userId);
      }

      if (userId && metadata.type === "verifiedly_documents") {
        await supabase.from("verifiedly_billing").upsert({
          user_id: userId,
          documents_subscription_id: subscription.id,
          documents_status: status,
          documents_interval: metadata.interval === "year" ? "year" : "month",
          documents_current_period_end: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null,
          documents_cancel_at_period_end: !!subscription.cancel_at_period_end,
        }, { onConflict: "user_id" });
      }

      if (userId && metadata.type === "subscription" && ["pro", "elite"].includes(metadata.tier || "")) {
        const active = ["active", "trialing"].includes(status);
        await supabase.from("profiles").update({
          is_pro: active,
          is_elite: active && metadata.tier === "elite",
        }).eq("id", userId);
      }
    }

    const { error: completeError } = await supabase.from("webhook_events").update({
      processing_status: "processed",
      processed_at: new Date().toISOString(),
      last_error: null,
    }).eq("stripe_event_id", event.id);
    if (completeError) throw completeError;

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log("ERROR", { message });
    if (claimedEventId) {
      await supabase.from("webhook_events").update({
        processing_status: "failed",
        last_error: message.slice(0, 1000),
      }).eq("stripe_event_id", claimedEventId);
    }
    return new Response(JSON.stringify({ error: message }), {
      status: claimedEventId ? 500 : 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
