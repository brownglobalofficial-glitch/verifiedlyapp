import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Returns whether the currently signed-in user has a Stripe Connect account
 * configured. Used to gate publish/sell actions on the dashboard.
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
      const { data } = await (supabase
        .from("creator_private_data" as any)
        .select("stripe_connect_account_id")
        .eq("id", session.user.id)
        .maybeSingle() as any);
      if (!cancelled) {
        setStripeConnected(!!data?.stripe_connect_account_id);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { stripeConnected, loading };
}
