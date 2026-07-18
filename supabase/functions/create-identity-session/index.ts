import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
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

const allowedOrigins = () => new Set([
  "https://verifiedly.app",
  "https://www.verifiedly.app",
  "https://id-preview--173dd0e3-02ca-4666-9958-5d8eb32162c8.lovable.app",
  ...(Deno.env.get("VERIFIEDLY_ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
]);

const safeOrigin = (value: string | null) => {
  if (!value) return "https://verifiedly.app";
  try {
    const url = new URL(value);
    const allowed = allowedOrigins().has(url.origin)
      || url.hostname === "localhost"
      || url.hostname === "127.0.0.1";
    return allowed ? url.origin : "https://verifiedly.app";
  } catch {
    return "https://verifiedly.app";
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const flowId = Deno.env.get("STRIPE_IDENTITY_FLOW_ID");
    if (!stripeKey || !flowId) throw new Error("Stripe Identity is not configured yet.");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Please sign in again." }, 401);

    const anon = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );
    const { data: userData } = await anon.auth.getUser(authHeader.replace("Bearer ", ""));
    const user = userData.user;
    if (!user) return json({ error: "Please sign in again." }, 401);

    const body = await req.json().catch(() => ({}));
    const checkoutSessionId = typeof body?.checkout_session_id === "string"
      ? body.checkout_session_id
      : null;
    if (!checkoutSessionId) return json({ error: "Missing checkout confirmation." }, 400);

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const checkout = await stripe.checkout.sessions.retrieve(checkoutSessionId);
    if (
      checkout.payment_status !== "paid"
      || checkout.metadata?.type !== "verifiedly_identity_payment"
      || checkout.metadata?.user_id !== user.id
    ) {
      return json({ error: "The verification payment could not be confirmed." }, 403);
    }

    const { data: profile } = await admin.from("profiles")
      .select("id_verified")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.id_verified) return json({ status: "verified" });

    const { data: billing } = await admin.from("verifiedly_billing")
      .select("identity_attempt_count, identity_last_session_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (billing?.identity_last_session_id) {
      const existing = await stripe.identity.verificationSessions.retrieve(
        billing.identity_last_session_id,
      );
      if (existing.status === "verified") return json({ status: "verified" });
      if (existing.status === "processing") return json({ status: "processing" });
      if (existing.status === "requires_input" && existing.url) {
        return json({ status: "requires_input", url: existing.url, reused: true });
      }
    }

    const attempts = billing?.identity_attempt_count ?? 0;
    if (attempts >= 2) {
      return json({
        error: "The included verification attempts have been used. Contact support for review.",
        code: "attempt_limit",
      }, 409);
    }

    const origin = safeOrigin(req.headers.get("origin"));
    const verification = await stripe.identity.verificationSessions.create({
      verification_flow: flowId,
      return_url: `${origin}/dashboard/verification?identity=returned`,
      metadata: {
        user_id: user.id,
        checkout_session_id: checkoutSessionId,
      },
    });

    await admin.from("verifiedly_billing").upsert({
      user_id: user.id,
      stripe_customer_id: typeof checkout.customer === "string" ? checkout.customer : checkout.customer?.id,
      verification_payment_status: "paid",
      verification_checkout_session_id: checkoutSessionId,
      identity_status: verification.status === "requires_input" ? "requires_input" : "processing",
      identity_attempt_count: attempts + 1,
      identity_last_session_id: verification.id,
    }, { onConflict: "user_id" });

    await admin.from("profiles").update({
      stripe_identity_session_id: verification.id,
      verification_status: verification.status === "requires_input" ? "requires_input" : "processing",
    }).eq("id", user.id);

    return json({ status: verification.status, url: verification.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to begin identity verification.";
    return json({ error: message }, 500);
  }
});
