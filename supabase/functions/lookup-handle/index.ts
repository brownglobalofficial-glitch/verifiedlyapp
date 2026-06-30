import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// POST { handle } -> { email } | { error }
// Looks up the email associated with a Verifiedly @handle so users can sign in
// (and OAuth-authorize) with either their handle or their email address.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { handle } = await req.json();
    const clean = String(handle || "").trim().replace(/^@/, "").toLowerCase();
    if (!clean) return j({ error: "missing_handle" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .ilike("username", clean)
      .maybeSingle();
    if (!profile) return j({ error: "not_found" }, 404);

    const { data: userRes, error } = await admin.auth.admin.getUserById(profile.id);
    if (error || !userRes?.user?.email) return j({ error: "not_found" }, 404);
    return j({ email: userRes.user.email });
  } catch (e: any) {
    return j({ error: "server_error", message: e?.message }, 500);
  }
});

function j(p: unknown, status = 200) {
  return new Response(JSON.stringify(p), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}