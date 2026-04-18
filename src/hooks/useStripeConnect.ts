import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Returns whether the currently signed-in user has a Stripe Connect account
 * configured (or is an admin, who bypasses the requirement for testing).
 * Used to gate publish/sell actions on the dashboard.
 */
export function useStripeConnect() {
  const [stripeConnected, setStripeConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (!cancelled) { setStripeConnected(false); setLoading(false); }
        return;
      }
      const [{ data: priv }, { data: roles }] = await Promise.all([
        (supabase
          .from("creator_private_data" as any)
          .select("stripe_connect_account_id")
          .eq("id", session.user.id)
          .maybeSingle() as any),
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin"),
      ]);
      const isAdmin = !!(roles && roles.length > 0);
      if (!cancelled) {
        setStripeConnected(isAdmin || !!priv?.stripe_connect_account_id);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { stripeConnected, loading };
}
