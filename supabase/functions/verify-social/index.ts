import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PUBLIC_URL: Record<string, (h: string) => string> = {
  instagram: (h) => `https://www.instagram.com/${h}/`,
  tiktok:    (h) => `https://www.tiktok.com/@${h}`,
  x:         (h) => `https://x.com/${h}`,
  youtube:   (h) => `https://www.youtube.com/@${h}`,
  twitch:    (h) => `https://www.twitch.tv/${h}/about`,
  linkedin:  (h) => `https://www.linkedin.com/in/${h}/`,
  github:    (h) => `https://github.com/${h}`,
};

function randomCode() {
  // Short, easy to paste: "verifiedly-xxxxxx"
  const s = crypto.getRandomValues(new Uint8Array(6));
  return "verifiedly-" + Array.from(s).map(b => b.toString(36).padStart(2,"0")).join("").slice(0,8);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("authorization") || "";
    const jwt = auth.replace("Bearer ", "").trim();
    if (!jwt) return json({ error: "unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const { social_id, action } = body as { social_id?: string; action?: "issue" | "check" };
    if (!social_id || !action) return json({ error: "missing_params" }, 400);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: social, error: fetchErr } = await admin
      .from("verified_socials").select("*").eq("id", social_id).maybeSingle();
    if (fetchErr || !social) return json({ error: "not_found" }, 404);
    if (social.user_id !== user.id) return json({ error: "forbidden" }, 403);

    if (action === "issue") {
      const code = randomCode();
      const { error } = await admin.from("verified_socials")
        .update({ verification_code: code, verification_status: "pending", last_error: null })
        .eq("id", social_id);
      if (error) return json({ error: "db_error" }, 500);
      return json({ ok: true, code });
    }

    if (action === "check") {
      const code = social.verification_code;
      if (!code) return json({ error: "no_code", message: "Issue a code first" }, 400);
      const urlFn = PUBLIC_URL[social.platform];
      if (!urlFn) return json({ error: "unsupported_platform" }, 400);

      const url = urlFn(social.handle);
      let html = "";
      try {
        const r = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; VerifiedlyBot/1.0; +https://verifiedly.app)" },
          redirect: "follow",
        });
        if (!r.ok) {
          await admin.from("verified_socials").update({
            verification_status: "failed",
            last_checked_at: new Date().toISOString(),
            last_error: `Profile fetch failed (HTTP ${r.status}). Make sure the handle is correct and public.`,
          }).eq("id", social_id);
          return json({ ok: false, status: "failed", message: `Couldn't load that profile (HTTP ${r.status}). Check the handle and that it's public.` });
        }
        html = await r.text();
      } catch (e) {
        await admin.from("verified_socials").update({
          verification_status: "failed",
          last_checked_at: new Date().toISOString(),
          last_error: `Network error: ${String(e)}`,
        }).eq("id", social_id);
        return json({ ok: false, status: "failed", message: "Network error reaching that profile." });
      }

      const found = html.toLowerCase().includes(code.toLowerCase());
      if (found) {
        await admin.from("verified_socials").update({
          verification_status: "verified",
          last_checked_at: new Date().toISOString(),
          last_error: null,
        }).eq("id", social_id);
        await admin.rpc("recompute_trust_score", { _user_id: user.id });
        return json({ ok: true, status: "verified", message: "Verified! You can now remove the code from your bio." });
      } else {
        await admin.from("verified_socials").update({
          verification_status: "pending",
          last_checked_at: new Date().toISOString(),
          last_error: "Code not found on profile yet.",
        }).eq("id", social_id);
        return json({ ok: false, status: "pending", message: "We couldn't find your code yet. Make sure it's saved in your public bio/description and try again in a minute." });
      }
    }

    return json({ error: "unknown_action" }, 400);
  } catch (e) {
    return json({ error: "server_error", message: String(e) }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}