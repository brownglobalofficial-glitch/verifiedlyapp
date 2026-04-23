import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const log = (step: string, details?: any) => {
  console.log(`[STRIPE-WEBHOOK] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

const SITE_NAME = "Verifiedly";
const SENDER_DOMAIN = "notify.brownglobal.app";
const FROM_DOMAIN = "brownglobal.app";

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

    // Persist a lightweight record of the event for the admin diagnostics banner
    try {
      await supabase.from("webhook_events").insert({
        stripe_event_id: event.id,
        event_type: event.type,
        livemode: (event as any).livemode ?? null,
        payload_preview: { id: event.id, type: event.type, created: event.created },
      });
    } catch (e) {
      log("Failed to log webhook event", { error: String(e) });
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

        // Notify creator
        await notifyCreator(supabase, metadata.creator_id,
          `🎉 New subscriber!`,
          `<p style="font-size:15px;color:#333;">Someone just subscribed to your page for <strong>$${totalAmount.toFixed(2)}/mo</strong>.</p>
           <p style="font-size:15px;color:#333;">Your monthly earnings from this: <strong>$${creatorEarnings.toFixed(2)}</strong></p>`
        );

        log("Creator subscription recorded", { amount: totalAmount });
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
