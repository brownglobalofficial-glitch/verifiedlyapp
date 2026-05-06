import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (s: string, d?: unknown) => console.log(`[DOWNLOAD-PRODUCT] ${s}${d ? ` - ${JSON.stringify(d)}` : ""}`);

/**
 * Download a digital product.
 *
 * - Free products ($0): records a `purchases` row (idempotent per buyer+product)
 *   and returns a signed download URL.
 * - Paid products: requires the caller to have a completed `purchases` row,
 *   then returns a fresh signed URL.
 *
 * The `product-files` storage bucket is private; this function is the only
 * supported way to fetch a download link.
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
    if (!authHeader) throw new Error("Please sign in to download this item.");
    const { data: userData, error: userErr } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userErr || !userData.user) throw new Error("Please sign in to download this item.");
    const user = userData.user;

    const { productId } = await req.json();
    if (!productId || typeof productId !== "string") throw new Error("productId required");

    const { data: product, error: prodErr } = await supabase
      .from("products")
      .select("id, creator_id, name, image_url, file_url, price, is_published")
      .eq("id", productId)
      .maybeSingle();
    if (prodErr || !product) throw new Error("Product not found.");
    if (!product.is_published) throw new Error("Product is not available.");
    if (!product.file_url) throw new Error("This product has no downloadable file.");

    const isFree = Number(product.price) === 0;

    // Authorization: free OR completed purchase
    if (!isFree) {
      const { data: existing } = await supabase
        .from("purchases")
        .select("id")
        .eq("buyer_id", user.id)
        .eq("product_id", product.id)
        .eq("status", "completed")
        .limit(1)
        .maybeSingle();
      if (!existing) throw new Error("You must purchase this item before downloading.");
    } else {
      // Idempotent: only record one free "purchase" per (buyer, product)
      const { data: existing } = await supabase
        .from("purchases")
        .select("id")
        .eq("buyer_id", user.id)
        .eq("product_id", product.id)
        .limit(1)
        .maybeSingle();
      if (!existing) {
        await supabase.from("purchases").insert({
          buyer_id: user.id,
          buyer_email: user.email ?? null,
          creator_id: product.creator_id,
          product_id: product.id,
          amount: 0,
          status: "completed",
          product_name: product.name,
          product_image_url: product.image_url ?? null,
          file_url: product.file_url,
        });
        log("Free download recorded", { user: user.id, product: product.id });
      }
    }

    // Resolve storage object key from the stored file_url.
    // file_url may be either a full Supabase storage URL or a bare object key.
    let objectKey = product.file_url as string;
    const marker = "/object/public/product-files/";
    const signedMarker = "/object/sign/product-files/";
    const authMarker = "/object/authenticated/product-files/";
    for (const m of [marker, signedMarker, authMarker]) {
      const idx = objectKey.indexOf(m);
      if (idx !== -1) { objectKey = objectKey.slice(idx + m.length).split("?")[0]; break; }
    }
    // If still a full URL, fall back to last path segments after "product-files/"
    if (objectKey.startsWith("http")) {
      const i = objectKey.indexOf("product-files/");
      if (i !== -1) objectKey = objectKey.slice(i + "product-files/".length).split("?")[0];
    }

    const { data: signed, error: signErr } = await supabase
      .storage.from("product-files")
      .createSignedUrl(objectKey, 60 * 10, { download: product.name || true });
    if (signErr || !signed?.signedUrl) {
      log("Sign error", { error: signErr?.message, key: objectKey });
      throw new Error("Could not generate download link. Please contact support.");
    }

    return new Response(JSON.stringify({ url: signed.signedUrl, fileName: product.name }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
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
