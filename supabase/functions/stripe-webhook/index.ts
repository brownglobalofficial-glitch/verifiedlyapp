import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const log = (step: string, details?: any) => {
  console.log(`[STRIPE-WEBHOOK] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

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
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    let event: Stripe.Event;
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      // For testing without webhook secret
      event = JSON.parse(body);
    }

    log("Event received", { type: event.type, id: event.id });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata || {};
      const type = metadata.type;

      if (type === "product_purchase") {
        log("Processing product purchase", { product_id: metadata.product_id });

        // Get product details for file_url
        const { data: product } = await supabase
          .from("products").select("name, image_url, file_url").eq("id", metadata.product_id).single();

        // Find buyer by email
        let buyerId: string | null = null;
        if (session.customer_email || metadata.buyer_email) {
          const email = session.customer_email || metadata.buyer_email;
          if (email && email !== "guest") {
            const { data: userData } = await supabase.auth.admin.listUsers();
            const user = userData?.users?.find(u => u.email === email);
            if (user) buyerId = user.id;
          }
        }

        await supabase.from("purchases").insert({
          buyer_id: buyerId,
          buyer_email: session.customer_email || metadata.buyer_email || null,
          creator_id: metadata.creator_id,
          product_id: metadata.product_id,
          amount: (session.amount_total || 0) / 100,
          stripe_session_id: session.id,
          status: "completed",
          product_name: product?.name || "Product",
          product_image_url: product?.image_url || null,
          file_url: product?.file_url || null,
        });

        // Record earnings
        const feePercent = Number(metadata.platform_fee_percent || 10);
        const totalAmount = (session.amount_total || 0) / 100;
        const creatorEarnings = totalAmount * (1 - feePercent / 100);

        await supabase.from("earnings").insert({
          creator_id: metadata.creator_id,
          amount: creatorEarnings,
          source: "product",
          description: `Sale: ${product?.name || "Product"}`,
        });

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

        log("Tip earnings recorded", { amount: creatorEarnings });
      } else if (type === "subscription") {
        log("Processing subscription", metadata);

        // Update profile tier
        const tier = metadata.tier;
        if (tier === "pro" || tier === "elite") {
          await supabase.from("profiles").update({
            is_pro: tier === "pro" || tier === "elite",
            is_elite: tier === "elite",
            is_verified: true,
          }).eq("id", metadata.user_id);

          log("Profile upgraded", { tier, userId: metadata.user_id });
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
