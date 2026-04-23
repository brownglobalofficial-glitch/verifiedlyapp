import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (s: string, d?: any) => console.log(`[SYNC-STRIPE-PRODUCT] ${s}${d ? " " + JSON.stringify(d) : ""}`);

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
    const { data: userData, error: uErr } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (uErr || !userData.user) throw new Error("Not authenticated");
    const userId = userData.user.id;

    const { kind, id } = await req.json();
    if (!kind || !id) throw new Error("kind and id required");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });

    if (kind === "product") {
      const { data: p, error } = await supabase.from("products").select("*").eq("id", id).single();
      if (error || !p) throw new Error("Product not found");
      if (p.creator_id !== userId) throw new Error("Forbidden");

      let stripeProductId = p.stripe_product_id;
      if (stripeProductId) {
        await stripe.products.update(stripeProductId, {
          name: p.name,
          description: p.description || undefined,
          images: p.image_url ? [p.image_url] : undefined,
          active: !!p.is_published,
          metadata: { verifiedly_product_id: p.id, creator_id: p.creator_id },
        });
      } else {
        const created = await stripe.products.create({
          name: p.name,
          description: p.description || undefined,
          images: p.image_url ? [p.image_url] : undefined,
          active: !!p.is_published,
          metadata: { verifiedly_product_id: p.id, creator_id: p.creator_id },
        });
        stripeProductId = created.id;
      }

      // Create a new price if none stored or amount has changed
      const cents = Math.round(Number(p.price) * 100);
      let priceId = p.stripe_price_id;
      if (cents > 0) {
        let needNew = !priceId;
        if (priceId) {
          try {
            const existing = await stripe.prices.retrieve(priceId);
            if (existing.unit_amount !== cents || !existing.active) needNew = true;
          } catch { needNew = true; }
        }
        if (needNew) {
          if (priceId) { try { await stripe.prices.update(priceId, { active: false }); } catch (_) { /* ignore */ } }
          const newPrice = await stripe.prices.create({
            product: stripeProductId,
            unit_amount: cents,
            currency: "usd",
          });
          priceId = newPrice.id;
        }
      } else {
        // Free product — deactivate any existing price
        if (priceId) { try { await stripe.prices.update(priceId, { active: false }); } catch (_) { /* ignore */ } }
        priceId = null;
      }

      await supabase.from("products").update({
        stripe_product_id: stripeProductId,
        stripe_price_id: priceId,
      }).eq("id", id);

      log("Synced product", { id, stripeProductId, priceId });
      return new Response(JSON.stringify({ stripeProductId, stripePriceId: priceId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (kind === "subscription") {
      const { data: s, error } = await supabase.from("subscriptions").select("*").eq("id", id).single();
      if (error || !s) throw new Error("Subscription tier not found");
      if (s.creator_id !== userId) throw new Error("Forbidden");

      const { data: profile } = await supabase
        .from("profiles").select("display_name, username").eq("id", s.creator_id).single();

      let stripeProductId = s.stripe_product_id;
      const productName = `${s.name} — ${profile?.display_name || profile?.username || "Creator"}`;
      if (stripeProductId) {
        await stripe.products.update(stripeProductId, {
          name: productName,
          description: s.description || undefined,
          active: !!s.is_active,
          metadata: { verifiedly_subscription_id: s.id, creator_id: s.creator_id },
        });
      } else {
        const created = await stripe.products.create({
          name: productName,
          description: s.description || undefined,
          active: !!s.is_active,
          metadata: { verifiedly_subscription_id: s.id, creator_id: s.creator_id },
        });
        stripeProductId = created.id;
      }

      const monthlyCents = Math.round(Number(s.price) * 100);
      const yearlyCents = monthlyCents * 10;

      const ensurePrice = async (existing: string | null, amount: number, interval: "month" | "year") => {
        if (existing) {
          try {
            const cur = await stripe.prices.retrieve(existing);
            if (cur.unit_amount === amount && cur.active && cur.recurring?.interval === interval) return existing;
            try { await stripe.prices.update(existing, { active: false }); } catch (_) { /* ignore */ }
          } catch { /* not found, recreate */ }
        }
        const np = await stripe.prices.create({
          product: stripeProductId!,
          unit_amount: amount,
          currency: "usd",
          recurring: { interval },
        });
        return np.id;
      };

      const monthId = monthlyCents > 0 ? await ensurePrice(s.stripe_price_month_id, monthlyCents, "month") : null;
      const yearId = monthlyCents > 0 ? await ensurePrice(s.stripe_price_year_id, yearlyCents, "year") : null;

      await supabase.from("subscriptions").update({
        stripe_product_id: stripeProductId,
        stripe_price_month_id: monthId,
        stripe_price_year_id: yearId,
      }).eq("id", id);

      log("Synced subscription", { id, stripeProductId, monthId, yearId });
      return new Response(JSON.stringify({ stripeProductId, monthPriceId: monthId, yearPriceId: yearId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Unknown kind");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});