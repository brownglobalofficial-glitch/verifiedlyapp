import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (s: string, d?: unknown) => console.log(`[REDEEM-PROMO] ${s}${d ? ` - ${JSON.stringify(d)}` : ""}`);

/**
 * Redeem a promo code that grants free Pro or Elite tier on the user's profile.
 *
 * - Does NOT touch Stripe — promo grants are independent of paid subscriptions.
 *   If the user is also a paying subscriber, both states coexist; the webhook
 *   continues to manage `is_pro`/`is_elite` flags via Stripe events. Promo
 *   redemption ALSO sets the same flags so the platform-fee logic and tier
 *   gating immediately treat them as comped, and `comp_tier` records the grant.
 * - Idempotent per (code, user).
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Please sign in to redeem a code.");
    const { data: userData, error: userErr } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userErr || !userData.user) throw new Error("Please sign in to redeem a code.");
    const user = userData.user;

    const body = await req.json().catch(() => ({}));
    const raw = (body?.code ?? "").toString().trim();
    if (!raw) throw new Error("Enter a promo code.");
    const code = raw.toUpperCase();

    const { data: promo, error: promoErr } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", code)
      .maybeSingle();
    if (promoErr) throw promoErr;
    if (!promo) throw new Error("That code isn't valid.");
    if (!promo.is_active) throw new Error("That code is no longer active.");
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) throw new Error("That code has expired.");
    if (promo.max_uses != null && promo.uses >= promo.max_uses) throw new Error("That code has reached its limit.");

    // Idempotent redemption
    const { data: existing } = await supabase
      .from("promo_redemptions")
      .select("id")
      .eq("code", code)
      .eq("user_id", user.id)
      .maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ ok: true, tier: promo.tier, alreadyRedeemed: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tier = promo.tier as "pro" | "elite";

    // Apply tier flags + comp_tier
    const profileUpdate: Record<string, unknown> = {
      is_pro: tier === "pro" || tier === "elite",
      is_elite: tier === "elite",
      comp_tier: tier,
    };
    const { error: profErr } = await supabase
      .from("profiles")
      .update(profileUpdate)
      .eq("id", user.id);
    if (profErr) throw profErr;

    await supabase.from("promo_redemptions").insert({
      code,
      promo_code_id: promo.id,
      user_id: user.id,
      tier,
    });

    await supabase
      .from("promo_codes")
      .update({ uses: promo.uses + 1 })
      .eq("id", promo.id);

    log("Redeemed", { user: user.id, code, tier });

    return new Response(JSON.stringify({ ok: true, tier }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log("ERROR", { msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
