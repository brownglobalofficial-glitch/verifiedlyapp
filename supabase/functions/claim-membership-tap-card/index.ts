import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
});

const trimField = (value: unknown, minimum: number, maximum: number, label: string) => {
  if (typeof value !== "string") throw new Error(`${label} is required`);
  const cleaned = value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length < minimum || cleaned.length > maximum) {
    throw new Error(`${label} must be ${minimum}-${maximum} characters`);
  }
  return cleaned;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    if (Deno.env.get("TAP_CARD_FULFILLMENT_ENABLED") !== "true") {
      return json({
        error: "Included Tap Card fulfillment is not open yet.",
        code: "tap_fulfillment_not_enabled",
      }, 503);
    }

    const estimatedShipWindow = (Deno.env.get("TAP_CARD_ESTIMATED_SHIP_WINDOW") ?? "").trim();
    if (!estimatedShipWindow) {
      return json({
        error: "Included Tap Card claims require a manufacturer-supported shipping estimate.",
        code: "tap_shipping_estimate_required",
      }, 503);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Please sign in again." }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const { data: userData, error: userError } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
    const user = userData.user;
    if (userError || !user) return json({ error: "Please sign in again." }, 401);

    const [{ data: profile }, { data: billing }, { data: existingOrder }] = await Promise.all([
      admin.from("profiles")
        .select("username, display_name, is_pro")
        .eq("id", user.id)
        .maybeSingle(),
      admin.from("verifiedly_billing")
        .select("pro_status, pro_interval, annual_card_credit_available, annual_card_credit_granted_at")
        .eq("user_id", user.id)
        .maybeSingle(),
      admin.from("verifiedly_tap_card_orders")
        .select("id, card_id, status, order_source, tracking_number, tracking_url, created_at")
        .eq("user_id", user.id)
        .in("order_source", ["annual_included", "manual_review_credit_conflict"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (existingOrder) {
      return json({
        duplicate: true,
        order: existingOrder,
        estimated_ship_window: estimatedShipWindow,
      });
    }

    const active = profile?.is_pro === true
      || billing?.pro_status === "active"
      || billing?.pro_status === "trialing";
    if (!active || billing?.pro_interval !== "year") {
      return json({ error: "An active annual Verifiedly Membership is required." }, 403);
    }
    if (billing?.annual_card_credit_available !== true || !billing?.annual_card_credit_granted_at) {
      return json({ error: "This Membership does not have an unused included Tap Card benefit." }, 409);
    }
    if (!profile?.username) {
      return json({ error: "Complete your Verifiedly profile before claiming the included card." }, 409);
    }

    const body = await req.json().catch(() => ({}));
    if (body?.preview_approved !== true) {
      return json({ error: "Approve the Tap Card preview before claiming it." }, 400);
    }

    const printedName = trimField(body.printed_name, 2, 40, "Printed name");
    const printedTitle = trimField(body.printed_title, 2, 60, "Printed title");
    const shippingName = trimField(body.shipping_name, 2, 100, "Shipping name");
    const line1 = trimField(body.line1, 2, 200, "Street address");
    const line2 = typeof body.line2 === "string" ? body.line2.trim().slice(0, 200) : "";
    const city = trimField(body.city, 1, 100, "City");
    const state = trimField(body.state, 2, 100, "State");
    const postalCode = trimField(body.postal_code, 2, 20, "ZIP code");
    const country = trimField(body.country, 2, 2, "Country code").toUpperCase();
    if (country !== "US") {
      return json({ error: "Initial included Tap Card fulfillment is available to U.S. addresses only." }, 400);
    }

    const printedHandle = String(profile.username).trim().toLowerCase();
    const creditKey = String(billing.annual_card_credit_granted_at).replace(/[^0-9A-Za-z]/g, "");
    const syntheticCheckoutReference = `membership-card:${user.id}:${creditKey}`;
    const previewApprovedAt = new Date().toISOString();

    const { data: result, error: claimError } = await admin.rpc("record_verifiedly_tap_card_order", {
      p_user_id: user.id,
      p_material: "pvc",
      p_order_source: "annual_included",
      p_amount_cents: 0,
      p_currency: "usd",
      p_checkout_session_id: syntheticCheckoutReference,
      p_payment_intent_id: null,
      p_shipping_name: shippingName,
      p_shipping_address: {
        line1,
        line2,
        city,
        state,
        postal_code: postalCode,
        country: "US",
        estimated_ship_window: estimatedShipWindow,
      },
      p_printed_name: printedName,
      p_printed_title: printedTitle,
      p_printed_handle: printedHandle,
      p_template_version: "verifiedly-pvc-white-v1",
      p_preview_approved_at: previewApprovedAt,
    });
    if (claimError) throw claimError;

    return json({
      duplicate: Boolean(result?.duplicate),
      order_id: result?.order_id ?? null,
      card_id: result?.card_id ?? null,
      order_source: result?.order_source ?? "annual_included",
      estimated_ship_window: estimatedShipWindow,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The included Tap Card could not be claimed.";
    console.error("[CLAIM-MEMBERSHIP-TAP-CARD]", message);
    return json({ error: message }, 500);
  }
});
