import { supabase } from "@/integrations/supabase/client";

export const STRIPE_AGREEMENT_VERSION = "v1-2026-04";

async function getClientIp(): Promise<string | null> {
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    if (!res.ok) return null;
    const data = await res.json();
    return data.ip || null;
  } catch {
    return null;
  }
}

/**
 * Records that the signed-in user accepted the Stripe Connected Account
 * Agreement and Verifiedly's terms. Stores IP + user agent for audit.
 */
export async function recordStripeAgreement(
  userId: string,
  context: "onboarding" | "settings" | "dashboard" = "onboarding"
) {
  const ip = await getClientIp();
  await (supabase.from("stripe_agreements" as any).insert({
    user_id: userId,
    agreement_version: STRIPE_AGREEMENT_VERSION,
    ip_address: ip,
    user_agent: navigator.userAgent,
    context,
  }) as any);
}