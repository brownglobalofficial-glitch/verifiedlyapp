import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const log = (step: string, details?: any) => {
  console.log(`[STRIPE-WEBHOOK] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

const SITE_NAME = "Verifiedly";
const SENDER_DOMAIN = "notify.brownglobal.app";
const FROM_DOMAIN = "brownglobal.app";

async function getCreatorDestination(supabase: any, creatorId: string): Promise<string | null> {
  try {
    const { data } = await supabase
      .from("creator_private_data")
      .select("stripe_connect_account_id")
      .eq("id", creatorId)
      .maybeSingle();
    return data?.stripe_connect_account_id ?? null;
  } catch { return null; }
}

async function logLedger(supabase: any, row: Record<string, any>) {
  try {
    const { error } = await supabase.from("payout_ledger").insert(row);
    if (error && (error as any).code !== "23505") {
      log("Ledger insert failed", { error: error.message });
    }
  } catch (e) {
    log("Ledger insert exception", { error: String(e) });
  }
}

async function notifyCreator(supabase: any, creatorId: string, subject: string, bodyHtml: string) {
  try {
    // Get contact email from private data table first, then fall back to auth email
    const { data: privateData } = await supabase
      .from("creator_private_data").select("contact_email").eq("id", creatorId).single();

    let email = privateData?.contact_email;
    if (!email) {
      const { data: userData } = await supabase.auth.admin.getUserById(creatorId);
      email = userData?.user?.email;
    }
    if (!email) { log("No email for creator notification", { creatorId }); return; }

    const messageId = crypto.randomUUID();
    await supabase.from("email_send_log").insert({
      message_id: messageId,
      template_name: "creator_notification",
      recipient_email: email,
      status: "pending",
    });

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:500px;margin:0 auto;padding:32px 24px;">
        <img src="https://pwahrywcgtgfaaghkpoo.supabase.co/storage/v1/object/public/avatars/verifiedly-logo.webp" alt="Verifiedly" style="height:28px;margin-bottom:24px;" />
        <h2 style="font-size:20px;font-weight:700;margin-bottom:8px;">${subject}</h2>
        ${bodyHtml}
        <p style="margin-top:24px;font-size:13px;color:#888;">You're receiving this because you're a creator on Verifiedly.</p>
      </div>
    `;

    await supabase.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        message_id: messageId,
        to: email,
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject,
        html,
        text: subject,
        purpose: "transactional",
        label: "creator_notification",
        queued_at: new Date().toISOString(),
      },
    });
    log("Creator notification enqueued", { email, subject });
  } catch (err) {
    log("Failed to send creator notification", { error: String(err) });
  }
}

serve(async (req) => {
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    let event: Stripe.Event;
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret || !sig) {
      log("ERROR: Webhook secret not configured or signature missing");
      return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      });
    }
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

    log("Event received", { type: event.type, id: event.id });

    // Idempotency: a unique index on stripe_event_id ensures the same event
    // is only processed once. If insert fails with a duplicate, return 200
    // immediately so Stripe stops retrying without re-running side effects.
    const { error: dupErr } = await supabase.from("webhook_events").insert({
      stripe_event_id: event.id,
      event_type: event.type,
      livemode: (event as any).livemode ?? null,
      payload_preview: { id: event.id, type: event.type, created: event.created },
    });
    if (dupErr) {
      const code = (dupErr as any).code;
      if (code === "23505") {
        log("Duplicate event — already processed, skipping", { id: event.id });
        return new Response(JSON.stringify({ received: true, duplicate: true }), {
          headers: { "Content-Type": "application/json" },
          status: 200,
        });
      }
      log("Failed to log webhook event (continuing)", { error: dupErr.message });
    }

    // ── Stripe Connect account.updated → cache payout status on creator_private_data ──
    if (event.type === "account.updated") {
      const acct = event.data.object as Stripe.Account;
      log("Connect account updated", {
        acct: acct.id,
        charges: acct.charges_enabled,
        payouts: acct.payouts_enabled,
        details_submitted: acct.details_submitted,
      });
      const reqs = acct.requirements || ({} as any);
      const { error: updErr } = await supabase
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
        .eq("stripe_connect_account_id", acct.id);
      if (updErr) log("Failed to cache account status", { error: updErr.message });

      // Notify creator when payouts first go live or fall past due
      try {
        const { data: row } = await supabase
          .from("creator_private_data")
          .select("id")
          .eq("stripe_connect_account_id", acct.id)
          .maybeSingle();
        const creatorId = row?.id;
        if (creatorId) {
          if (acct.charges_enabled && acct.payouts_enabled) {
            await notifyCreator(supabase, creatorId,
              "✅ Stripe payouts enabled",
              `<p style="font-size:15px;color:#333;">Your Stripe account is fully verified and payouts are now enabled. You can start accepting payments.</p>`
            );
          } else if ((reqs.past_due ?? []).length > 0) {
            await notifyCreator(supabase, creatorId,
              "⚠️ Action required: Stripe payouts paused",
              `<p style="font-size:15px;color:#333;">Stripe needs additional information from you to keep your payouts active. Please visit your dashboard to complete the required fields.</p>`
            );
          }
        }
      } catch (e) {
        log("Notification step failed", { error: String(e) });
      }
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata || {};
      const type = metadata.type;

      if (type === "product_purchase") {
        log("Processing product purchase", { product_id: metadata.product_id });

        const { data: product } = await supabase
          .from("products").select("name, image_url, file_url").eq("id", metadata.product_id).single();

        let buyerId: string | null = null;
        if (session.customer_email || metadata.buyer_email) {
          const email = session.customer_email || metadata.buyer_email;
          if (email && email !== "guest") {
            const { data: userData } = await supabase.auth.admin.listUsers();
            const user = userData?.users?.find(u => u.email === email);
            if (user) buyerId = user.id;
          }
        }

        const totalAmount = (session.amount_total || 0) / 100;

        await supabase.from("purchases").insert({
          buyer_id: buyerId,
          buyer_email: session.customer_email || metadata.buyer_email || null,
          creator_id: metadata.creator_id,
          product_id: metadata.product_id,
          amount: totalAmount,
          stripe_session_id: session.id,
          status: "completed",
          product_name: product?.name || "Product",
          product_image_url: product?.image_url || null,
          file_url: product?.file_url || null,
        });

        const feePercent = Number(metadata.platform_fee_percent || 10);
        const creatorEarnings = totalAmount * (1 - feePercent / 100);

        await supabase.from("earnings").insert({
          creator_id: metadata.creator_id,
          amount: creatorEarnings,
          source: "product",
          description: `Sale: ${product?.name || "Product"}`,
        });

        await logLedger(supabase, {
          transaction_type: "product",
          seller_user_id: metadata.creator_id,
          destination_stripe_account_id: await getCreatorDestination(supabase, metadata.creator_id),
          buyer_user_id: buyerId,
          buyer_email: session.customer_email || metadata.buyer_email || null,
          gross_amount: totalAmount,
          platform_fee: totalAmount * (feePercent / 100),
          net_amount: creatorEarnings,
          platform_fee_percent: feePercent,
          currency: session.currency || "usd",
          stripe_event_id: event.id,
          stripe_session_id: session.id,
          stripe_payment_intent_id: (session.payment_intent as string) || null,
          reference_id: metadata.product_id || null,
          metadata: { product_name: product?.name || null },
        });

        // Notify creator
        await notifyCreator(supabase, metadata.creator_id,
          `💰 New sale: ${product?.name || "Product"}`,
          `<p style="font-size:15px;color:#333;">Someone just purchased <strong>${product?.name || "your product"}</strong> for <strong>$${totalAmount.toFixed(2)}</strong>.</p>
           <p style="font-size:15px;color:#333;">Your earnings: <strong>$${creatorEarnings.toFixed(2)}</strong></p>`
        );

        log("Product purchase recorded", { buyerId, amount: totalAmount });
      } else if (type === "tip") {
        log("Processing tip", { creator_id: metadata.creator_id });

        const feePercent = Number(metadata.platform_fee_percent || 10);
        const totalAmount = (session.amount_total || 0) / 100;
        const creatorEarnings = totalAmount * (1 - feePercent / 100);

        await supabase.from("earnings").insert({
          creator_id: metadata.creator_id,
          amount: creatorEarnings,
          source: "tip",
          description: `Tip received`,
        });

        await logLedger(supabase, {
          transaction_type: "tip",
          seller_user_id: metadata.creator_id,
          destination_stripe_account_id: await getCreatorDestination(supabase, metadata.creator_id),
          buyer_email: session.customer_email || null,
          gross_amount: totalAmount,
          platform_fee: totalAmount * (feePercent / 100),
          net_amount: creatorEarnings,
          platform_fee_percent: feePercent,
          currency: session.currency || "usd",
          stripe_event_id: event.id,
          stripe_session_id: session.id,
          stripe_payment_intent_id: (session.payment_intent as string) || null,
        });

        // Notify creator
        await notifyCreator(supabase, metadata.creator_id,
          `💰 You received a $${totalAmount.toFixed(2)} tip!`,
          `<p style="font-size:15px;color:#333;">Someone just sent you a tip of <strong>$${totalAmount.toFixed(2)}</strong>.</p>
           <p style="font-size:15px;color:#333;">Your earnings: <strong>$${creatorEarnings.toFixed(2)}</strong></p>`
        );

        log("Tip earnings recorded", { amount: creatorEarnings });
      } else if (type === "subscription") {
        log("Processing subscription", metadata);

        const tier = metadata.tier;
        if (tier === "pro" || tier === "elite") {
          await supabase.from("profiles").update({
            is_pro: tier === "pro" || tier === "elite",
            is_elite: tier === "elite",
            is_verified: true,
          }).eq("id", metadata.user_id);

          log("Profile upgraded", { tier, userId: metadata.user_id });
          // Referral commission is paid out from `invoice.payment_succeeded`
          // (first paid invoice only) — see handler below — to guarantee the
          // payment actually cleared before we credit the referrer.
        }
      } else if (type === "creator_subscription") {
        log("Processing creator subscription", metadata);

        const totalAmount = (session.amount_total || 0) / 100;
        const feePercent = Number(metadata.platform_fee_percent || 10);
        const creatorEarnings = totalAmount * (1 - feePercent / 100);

        // Record subscriber event
        const buyerEmail = session.customer_email;
        let subscriberId: string | null = null;
        if (buyerEmail) {
          const { data: userData } = await supabase.auth.admin.listUsers();
          const user = userData?.users?.find(u => u.email === buyerEmail);
          if (user) subscriberId = user.id;
        }

        await supabase.from("subscriber_events").insert({
          creator_id: metadata.creator_id,
          subscriber_id: subscriberId,
          subscription_id: metadata.subscription_id || null,
          event_type: "subscribe",
        });

        await supabase.from("earnings").insert({
          creator_id: metadata.creator_id,
          amount: creatorEarnings,
          source: "subscription",
          description: `New subscriber`,
        });

        await logLedger(supabase, {
          transaction_type: "creator_subscription",
          seller_user_id: metadata.creator_id,
          destination_stripe_account_id: await getCreatorDestination(supabase, metadata.creator_id),
          buyer_user_id: subscriberId,
          buyer_email: buyerEmail || null,
          gross_amount: totalAmount,
          platform_fee: totalAmount * (feePercent / 100),
          net_amount: creatorEarnings,
          platform_fee_percent: feePercent,
          currency: session.currency || "usd",
          stripe_event_id: event.id,
          stripe_session_id: session.id,
          stripe_subscription_id: (session.subscription as string) || null,
          reference_id: metadata.subscription_id || null,
        });

        // Notify creator
        await notifyCreator(supabase, metadata.creator_id,
          `🎉 New subscriber!`,
          `<p style="font-size:15px;color:#333;">Someone just subscribed to your page for <strong>$${totalAmount.toFixed(2)}/mo</strong>.</p>
           <p style="font-size:15px;color:#333;">Your monthly earnings from this: <strong>$${creatorEarnings.toFixed(2)}</strong></p>`
        );

        log("Creator subscription recorded", { amount: totalAmount });
      }
    }

    // ── Referral commission: credit referrer 10% on the FIRST paid invoice ──
    // Using invoice.payment_succeeded + billing_reason === "subscription_create"
    // ensures we only credit on the genuine first successful charge. The
    // unique webhook_events index above guarantees no duplicate credits even
    // if Stripe retries this event.
    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.billing_reason === "subscription_create" && invoice.subscription) {
        try {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const md = (sub.metadata || {}) as Record<string, string>;
          const referrerId = md.referrer_id;
          const userId = md.user_id;
          const tier = md.tier;
          const paidAmount = (invoice.amount_paid || 0) / 100;

          // Log Verifiedly Pro/Elite platform subscription to ledger.
          // Destination = Verifiedly platform account (null = stays on platform).
          if (userId && (tier === "pro" || tier === "elite")) {
            await logLedger(supabase, {
              transaction_type: "platform_subscription",
              seller_user_id: null,
              destination_stripe_account_id: null,
              buyer_user_id: userId,
              buyer_email: invoice.customer_email || null,
              gross_amount: paidAmount,
              platform_fee: paidAmount,
              net_amount: 0,
              platform_fee_percent: 100,
              currency: invoice.currency || "usd",
              stripe_event_id: event.id,
              stripe_invoice_id: invoice.id,
              stripe_subscription_id: invoice.subscription as string,
              reference_id: tier,
              metadata: { tier, referrer_id: referrerId || null },
            });
          }

          if (referrerId && userId && referrerId !== userId && (tier === "pro" || tier === "elite")) {
            const commission = Math.round(paidAmount * 0.10 * 100) / 100;
            if (commission > 0) {
              await supabase.from("earnings").insert({
                creator_id: referrerId,
                amount: commission,
                source: "referral",
                description: `Referral commission — ${tier === "elite" ? "Elite" : "Pro"} signup`,
              });
              await logLedger(supabase, {
                transaction_type: "referral",
                seller_user_id: referrerId,
                destination_stripe_account_id: await getCreatorDestination(supabase, referrerId),
                buyer_user_id: userId,
                gross_amount: paidAmount,
                platform_fee: paidAmount - commission,
                net_amount: commission,
                platform_fee_percent: 90,
                currency: invoice.currency || "usd",
                stripe_event_id: event.id + ":referral",
                stripe_invoice_id: invoice.id,
                stripe_subscription_id: invoice.subscription as string,
                reference_id: tier,
              });
              await notifyCreator(supabase, referrerId,
                `🎉 Referral commission: $${commission.toFixed(2)}`,
                `<p style="font-size:15px;color:#333;">Someone you referred just upgraded to <strong>Verifiedly ${tier === "elite" ? "Elite" : "Pro"}</strong>. You earned a <strong>$${commission.toFixed(2)}</strong> referral commission.</p>`
              );
              log("Referral commission credited", { referrerId, commission });
            }
          }
        } catch (e) {
          log("Referral handling failed", { error: String(e) });
        }
      }
    }

    // ── Sync profile flags on subscription cancellation / failure ──
    if (event.type === "customer.subscription.deleted" || event.type === "customer.subscription.updated") {
      const sub = event.data.object as Stripe.Subscription;
      const md = (sub.metadata || {}) as Record<string, string>;
      const userId = md.user_id;
      if (userId) {
        const isActive = ["active", "trialing"].includes(sub.status);
        const tier = md.tier;
        if (event.type === "customer.subscription.deleted" || !isActive) {
          // Respect comp_tier (gifted Pro/Elite via promo code) — don't strip
          // those flags when the paid subscription ends.
          const { data: prof } = await supabase
            .from("profiles").select("comp_tier").eq("id", userId).maybeSingle();
          const comp = prof?.comp_tier as "pro" | "elite" | null | undefined;
          await supabase.from("profiles").update({
            is_pro: comp === "pro" || comp === "elite",
            is_elite: comp === "elite",
          }).eq("id", userId);
          log("Profile downgraded — subscription ended", { userId, comp_tier: comp ?? null });
        } else if (tier === "pro" || tier === "elite") {
          await supabase.from("profiles").update({
            is_pro: tier === "pro" || tier === "elite",
            is_elite: tier === "elite",
            is_verified: true,
          }).eq("id", userId);
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
