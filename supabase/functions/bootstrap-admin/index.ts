import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * One-shot bootstrap: ensure support@verifiedly.app exists, is email-confirmed,
 * has the admin role, Elite tier, and a known password. Idempotent.
 * Protected by BOOTSTRAP_SECRET header.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const expected = Deno.env.get("BOOTSTRAP_SECRET") ?? "verifiedly-launch-2026";
  if (req.headers.get("x-bootstrap-secret") !== expected) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  const email = "support@verifiedly.app";
  const password = "Money4me1!!!!!";

  // Find or create the user
  let userId: string | null = null;
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const existing = list?.users.find((u) => u.email?.toLowerCase() === email);
  if (existing) {
    userId = existing.id;
    await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
      user_metadata: { ...existing.user_metadata, account_type: "creator", display_name: "Verifiedly Support" },
    });
  } else {
    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { account_type: "creator", display_name: "Verifiedly Support", username: "support" },
    });
    if (error || !created.user) {
      return new Response(JSON.stringify({ error: error?.message ?? "create failed" }), { status: 500, headers: corsHeaders });
    }
    userId = created.user.id;
  }

  // Ensure profile exists + Elite + verified + onboarding done
  await admin.from("profiles").upsert({
    id: userId,
    username: "support",
    display_name: "Verifiedly Support",
    account_type: "creator",
    is_pro: true,
    is_elite: true,
    is_verified: true,
    comp_tier: "elite",
    onboarding_completed: true,
  }, { onConflict: "id" });

  // Grant admin role
  await admin.from("user_roles").upsert(
    { user_id: userId, role: "admin" },
    { onConflict: "user_id,role", ignoreDuplicates: true }
  );

  return new Response(JSON.stringify({ ok: true, userId, email }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});