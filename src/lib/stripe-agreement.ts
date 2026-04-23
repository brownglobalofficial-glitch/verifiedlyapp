import { supabase } from "@/integrations/supabase/client";

export const STRIPE_AGREEMENT_VERSION = "v1-2026-04";

/**
 * Records that the signed-in user accepted the Stripe Connected Account
 * Agreement and Verifiedly's terms. The edge function captures IP + user
 * agent server-side from request headers, which is more reliable than
 * fetching from a public IP service in the browser.
 */
export async function recordStripeAgreement(
  _userId: string,
  context: "onboarding" | "settings" | "dashboard" = "onboarding"
) {
  const { error } = await supabase.functions.invoke("record-stripe-agreement", {
    body: { context },
  });
  if (error) throw error;
}

export interface StripeAgreementRecord {
  id: string;
  accepted_at: string;
  agreement_version: string;
  context: string;
}

/** Latest agreement acceptance for the current user, or null. */
export async function getLatestStripeAgreement(userId: string): Promise<StripeAgreementRecord | null> {
  const { data } = await (supabase
    .from("stripe_agreements" as any)
    .select("id, accepted_at, agreement_version, context")
    .eq("user_id", userId)
    .order("accepted_at", { ascending: false })
    .limit(1)
    .maybeSingle() as any);
  return (data as StripeAgreementRecord | null) ?? null;
}