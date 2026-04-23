import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Production Name.com API. The dev sandbox returns fake results.
const NAME_COM_API = "https://api.name.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const token = Deno.env.get("NAME_COM_API_TOKEN");
    const username = Deno.env.get("NAME_COM_USERNAME");
    if (!token || !username) throw new Error("Name.com credentials not configured");

    const { domain } = await req.json();
    if (!domain || typeof domain !== "string") throw new Error("Domain is required");

    const cleanDomain = domain.toLowerCase().trim().replace(/[^a-z0-9.-]/g, "");

    // Check availability
    const authHeader = "Basic " + btoa(`${username}:${token}`);
    const checkRes = await fetch(`${NAME_COM_API}/v4/domains:checkAvailability`, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ domainNames: [cleanDomain] }),
    });

    if (!checkRes.ok) {
      const err = await checkRes.text();
      console.error("[CHECK-DOMAIN] Name.com error:", err);
      throw new Error("Failed to check domain availability");
    }

    const data = await checkRes.json();
    const results = data.results || [];
    const result = results[0] || null;

    return new Response(JSON.stringify({
      domain: cleanDomain,
      available: result?.purchasable || false,
      premium: result?.premium || false,
      price: result?.purchasePrice || null,
      renewalPrice: result?.renewalPrice || null,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[CHECK-DOMAIN]", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
