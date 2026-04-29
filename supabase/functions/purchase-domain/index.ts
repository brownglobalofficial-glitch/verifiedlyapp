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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header — please sign in again.");
    const userToken = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(userToken);
    if (userError || !userData.user) throw new Error("Not authenticated");
    const user = userData.user;

    const token = Deno.env.get("NAME_COM_API_TOKEN");
    const username = Deno.env.get("NAME_COM_USERNAME");
    if (!token || !username) throw new Error("Name.com credentials not configured");

    const { domain, purchasePrice } = await req.json();
    if (!domain) throw new Error("Domain is required");

    const cleanDomain = domain.toLowerCase().trim();
    const nameComAuth = "Basic " + btoa(`${username}:${token}`);

    // Get the user's profile for display info
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, username")
      .eq("id", user.id)
      .single();

    // Get contact email from private data
    const { data: privateData } = await supabase
      .from("creator_private_data")
      .select("contact_email")
      .eq("id", user.id)
      .single();

    const contactEmail = privateData?.contact_email || user.email;
    const contactName = profile?.display_name || profile?.username || "Domain Owner";
    const [firstName, ...lastParts] = contactName.split(" ");
    const lastName = lastParts.join(" ") || firstName;

    // Purchase domain
    const purchaseRes = await fetch(`${NAME_COM_API}/v4/domains`, {
      method: "POST",
      headers: {
        "Authorization": nameComAuth,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        domain: {
          domainName: cleanDomain,
        },
        purchasePrice: purchasePrice || undefined,
      }),
    });

    if (!purchaseRes.ok) {
      const err = await purchaseRes.text();
      console.error("[PURCHASE-DOMAIN] Name.com error:", err);
      throw new Error(`Domain purchase failed: ${err}`);
    }

    const domainData = await purchaseRes.json();

    // Set DNS to point to Verifiedly (A record to the user's profile)
    // Point to a simple redirect or the Verifiedly profile
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    
    // Create a CNAME record pointing to verifiedly
    try {
      await fetch(`${NAME_COM_API}/v4/domains/${cleanDomain}/records`, {
        method: "POST",
        headers: {
          "Authorization": nameComAuth,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          host: "",
          type: "URL",
          answer: `https://verifiedly.app/${profile?.username || ""}`,
          ttl: 300,
        }),
      });
    } catch (dnsErr) {
      console.error("[PURCHASE-DOMAIN] DNS setup error:", dnsErr);
      // Non-fatal: domain was still purchased
    }

    return new Response(JSON.stringify({
      success: true,
      domain: cleanDomain,
      expiresAt: domainData.expireDate,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[PURCHASE-DOMAIN]", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
