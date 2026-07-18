import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
});

const toHex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes))
  .map((value) => value.toString(16).padStart(2, "0"))
  .join("");

const fromBase64Url = (value: string) => {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
};

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

const constantTimeEqual = (left: string, right: string) => {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    const body = await req.json().catch(() => ({}));
    const token = typeof body?.token === "string" ? body.token : "";
    const password = typeof body?.password === "string" ? body.password : "";
    if (token.length < 32 || token.length > 128) return json({ error: "This link is invalid or expired." }, 404);

    const tokenHash = await hashText(token);
    const { data: share } = await admin.from("document_share_links")
      .select("id, owner_user_id, document_id, password_salt, password_hash, failed_attempt_count, expires_at, revoked_at, view_count, max_views")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    const invalid = !share
      || !!share.revoked_at
      || new Date(share.expires_at) <= new Date()
      || share.failed_attempt_count >= 10
      || share.view_count >= share.max_views;
    if (invalid) return json({ error: "This link is invalid or expired." }, 404);

    if (share.password_hash && share.password_salt) {
      if (!password) return json({ password_required: true }, 401);
      const submitted = await derivePassword(password, fromBase64Url(share.password_salt));
      if (!constantTimeEqual(submitted, share.password_hash)) {
        const { data: locked } = await admin.rpc("record_document_share_denial", {
          _token_hash: tokenHash,
        });
        await admin.from("document_access_events").insert({
          owner_user_id: share.owner_user_id,
          document_id: share.document_id,
          share_link_id: share.id,
          event_type: "denied",
        });
        return json({
          error: locked ? "This link is invalid or expired." : "The password is incorrect.",
          password_required: !locked,
        }, locked ? 404 : 403);
      }
    }

    const { data: consumed, error: consumeError } = await admin.rpc("consume_document_share", {
      _token_hash: tokenHash,
    });
    const document = consumed?.[0];
    if (consumeError || !document) return json({ error: "This link is invalid or expired." }, 404);

    const { data: signed, error: signedError } = await admin.storage
      .from("documents")
      .createSignedUrl(document.storage_path, 60, {
        download: document.original_filename || document.title,
      });
    if (signedError || !signed?.signedUrl) throw signedError ?? new Error("Unable to open document.");

    await admin.from("document_access_events").insert({
      owner_user_id: document.owner_user_id,
      document_id: document.document_id,
      share_link_id: document.share_link_id,
      event_type: "viewed",
    });

    return json({
      title: document.title,
      mime_type: document.mime_type,
      url: signed.signedUrl,
      link_expires_at: document.link_expires_at,
      access_expires_in_seconds: 60,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to open this document.";
    return json({ error: message }, 500);
  }
});
