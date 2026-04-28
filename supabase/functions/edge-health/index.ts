import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Admin-only runtime self-check: verifies that every column referenced by our
 * payment edge functions still exists in the live database. Catches drift
 * (e.g. a migration removed `profiles.stripe_connect_account_id` but a function
 * still writes to it) BEFORE a real user hits a 500.
 */
const REQUIRED_COLUMNS: Record<string, string[]> = {
  profiles: ["id", "username", "display_name", "is_pro", "is_elite", "onboarding_completed", "account_type"],
  creator_private_data: [
    "id",
    "stripe_connect_account_id",
    "stripe_charges_enabled",
    "stripe_payouts_enabled",
    "stripe_details_submitted",
    "stripe_requirements_past_due",
  ],
  subscriptions: ["id", "creator_id", "name", "price", "is_active", "stripe_price_month_id", "stripe_price_year_id"],
  products: ["id", "creator_id", "name", "price", "is_published", "stripe_price_id"],
  earnings: ["creator_id", "amount", "source"],
  purchases: ["creator_id", "buyer_email", "amount", "stripe_session_id"],
  webhook_events: ["stripe_event_id", "event_type", "livemode"],
  stripe_agreements: ["user_id", "agreement_version", "ip_address", "user_agent"],
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Admin gate
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");
    const { data: userData } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!userData.user) throw new Error("Not authenticated");
    const { data: roles } = await supabase
      .from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin");
    if (!roles || roles.length === 0) throw new Error("Forbidden");

    // Read live schema
    const { data: cols, error } = await supabase
      .from("information_schema_columns_proxy" as any)
      .select("*")
      .limit(0); // we'll use rpc/raw below instead
    void cols; void error;

    // Use a direct PostgREST call via the service role to read information_schema
    const url = `${Deno.env.get("SUPABASE_URL")}/rest/v1/rpc/__noop`;
    void url;

    // Simpler: query each table with select=column_name via a helper
    const issues: { table: string; missing: string[] }[] = [];
    for (const [table, expected] of Object.entries(REQUIRED_COLUMNS)) {
      const { data, error } = await supabase.from(table as any).select(expected.join(",")).limit(1);
      if (error) {
        // Parse missing column from error message
        const msg = error.message || "";
        const missing = expected.filter((c) => msg.toLowerCase().includes(c.toLowerCase()));
        issues.push({ table, missing: missing.length ? missing : [`unknown (error: ${msg})`] });
      }
      void data;
    }

    // Also probe critical edge functions for non-2xx with empty bodies
    const probes: { fn: string; ok: boolean; status: number; error?: string }[] = [];
    const functionsBase = `${Deno.env.get("SUPABASE_URL")}/functions/v1`;
    const probeFns = ["stripe-diagnostics"];
    for (const fn of probeFns) {
      try {
        const r = await fetch(`${functionsBase}/${fn}`, {
          method: "POST",
          headers: { Authorization: authHeader, "Content-Type": "application/json" },
          body: "{}",
        });
        probes.push({ fn, ok: r.ok, status: r.status });
        await r.text();
      } catch (e: any) {
        probes.push({ fn, ok: false, status: 0, error: String(e?.message || e) });
      }
    }

    return new Response(JSON.stringify({
      ok: issues.length === 0 && probes.every((p) => p.ok),
      schema_issues: issues,
      function_probes: probes,
      checked_at: new Date().toISOString(),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || String(err) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});