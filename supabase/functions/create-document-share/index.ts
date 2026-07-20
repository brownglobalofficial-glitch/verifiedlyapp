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

const toHex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes))
  .map((value) => value.toString(16).padStart(2, "0"))
  .join("");

const toBase64Url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes))
  .replaceAll("+", "-")
  .replaceAll("/", "_")
  .replaceAll("=", "");

const hashText = async (value: string) => toHex(
  await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
);

const derivePassword = async (password: string, salt: Uint8Array) => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 210_000, hash: "SHA-256" },
    key,
    256,
  );
  return toHex(bits);
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
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
    const documentId = typeof body?.document_id === "string" ? body.document_id : null;
    const password = typeof body?.password === "string" ? body.password.trim() : "";
    if (!documentId) return json({ error: "Choose a document to share." }, 400);
    if (password && (password.length < 8 || password.length > 128)) {
      return json({ error: "Use a password between 8 and 128 characters." }, 400);
    }

    const { data: billing } = await admin.from("verifiedly_billing")
      .select("documents_status, documents_current_period_end")
      .eq("user_id", user.id)
      .maybeSingle();
    const active = ["active", "trialing"].includes(billing?.documents_status ?? "")
      && (!billing?.documents_current_period_end || new Date(billing.documents_current_period_end) > new Date());
    if (!active) return json({ error: "An active Documents plan is required." }, 403);

    const { data: document } = await admin.from("documents")
      .select("id")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!document) return json({ error: "Document not found." }, 404);

    const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
    const token = toBase64Url(tokenBytes);
    const tokenHash = await hashText(token);
    const salt = password ? crypto.getRandomValues(new Uint8Array(16)) : null;
    const passwordHash = password && salt ? await derivePassword(password, salt) : null;

    const { data: share, error } = await admin.from("document_share_links").insert({
      document_id: documentId,
      owner_user_id: user.id,
      token_hash: tokenHash,
      password_salt: salt ? toBase64Url(salt) : null,
      password_hash: passwordHash,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      max_views: 10,
    }).select("id, expires_at").single();
    if (error || !share) throw error ?? new Error("Unable to create link.");

    await admin.from("document_access_events").insert({
      owner_user_id: user.id,
      document_id: documentId,
      share_link_id: share.id,
      event_type: "link_created",
    });

    return json({
      path: `/documents/shared/${token}`,
      expires_at: share.expires_at,
      password_protected: !!password,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create a secure link.";
    return json({ error: message }, 500);
  }
});
