import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Polling endpoint — user-triggered. Reads the latest Stripe state and updates
// the profile, so we don't require a webhook for the happy path.
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const anon = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");
    const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const authHeader = req.headers.get("Authorization")!;
    const { data } = await anon.auth.getUser(authHeader.replace("Bearer ", ""));
    const user = data.user;
    if (!user) throw new Error("Not authenticated");

    const { data: profile } = await admin.from("profiles")
      .select("stripe_identity_session_id, verification_status, id_verified").eq("id", user.id).maybeSingle();
    if (!profile) throw new Error("no_profile");

    // Also honor a paid checkout session flag if present in the URL flow.
    const body = await req.json().catch(() => ({}));
    const checkoutSessionId = (body as any).checkout_session_id as string | undefined;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });

    if (checkoutSessionId) {
      try {
        const cs = await stripe.checkout.sessions.retrieve(checkoutSessionId);
        if (cs.payment_status === "paid" && cs.metadata?.user_id === user.id && !profile.id_verified) {
          await admin.from("profiles").update({ verification_status: "paid" }).eq("id", user.id);
        }
      } catch { /* ignore */ }
    }

    if (profile.stripe_identity_session_id) {
      const vs = await stripe.identity.verificationSessions.retrieve(profile.stripe_identity_session_id, {
        expand: ["verified_outputs"],
      });
      if (vs.status === "verified") {
        const out: any = (vs as any).verified_outputs || {};
        const first = out.first_name || null;
        const last = out.last_name || null;
        const dob = out.dob ? `${out.dob.year}-${String(out.dob.month).padStart(2, "0")}-${String(out.dob.day).padStart(2, "0")}` : null;
        const country = out.address?.country || out.id_number?.country || null;
        await admin.from("profiles").update({
          id_verified: true,
          verification_status: "verified",
          verified_at: new Date().toISOString(),
          verified_first_name: first,
          verified_last_name: last,
          verified_full_name: [first, last].filter(Boolean).join(" ") || null,
          verified_dob: dob,
          verified_country: country,
        }).eq("id", user.id);
      } else if (vs.status === "requires_input") {
        await admin.from("profiles").update({ verification_status: "failed" }).eq("id", user.id);
      } else if (vs.status === "canceled") {
        await admin.from("profiles").update({ verification_status: "canceled" }).eq("id", user.id);
      }
    }

    const { data: fresh } = await admin.from("profiles")
      .select("verification_status, id_verified, verified_at, verified_full_name, verified_country, show_legal_name")
      .eq("id", user.id).maybeSingle();

    return new Response(JSON.stringify(fresh), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});