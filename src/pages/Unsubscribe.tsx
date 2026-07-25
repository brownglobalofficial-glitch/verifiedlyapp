import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type State = "loading" | "valid" | "invalid" | "already" | "success" | "error";

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [state, setState] = useState<State>("loading");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setState("invalid"); return; }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON } }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) { setState("invalid"); return; }
        if (data.reason === "already_unsubscribed") { setState("already"); return; }
        setState(data.valid ? "valid" : "invalid");
      } catch { setState("error"); }
    })();
  }, [token]);

  const confirm = async () => {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
      if (error) throw error;
      if (data?.success) setState("success");
      else if (data?.reason === "already_unsubscribed") setState("already");
      else setState("error");
    } catch { setState("error"); }
    setSubmitting(false);
  };

  return (
    <main className="min-h-dvh flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border p-8 text-center">
        <h1 className="text-2xl font-display font-bold mb-3">Unsubscribe</h1>
        {state === "loading" && <p className="text-sm text-muted-foreground">Checking your link…</p>}
        {state === "invalid" && <p className="text-sm text-muted-foreground">This unsubscribe link is invalid or has expired.</p>}
        {state === "already" && <p className="text-sm text-muted-foreground">You are already unsubscribed.</p>}
        {state === "error" && <p className="text-sm text-destructive">Something went wrong. Please try again.</p>}
        {state === "valid" && (
          <>
            <p className="text-sm text-muted-foreground mb-6">Click below to stop receiving these emails.</p>
            <Button onClick={confirm} disabled={submitting} className="w-full">
              {submitting ? "Unsubscribing…" : "Confirm unsubscribe"}
            </Button>
          </>
        )}
        {state === "success" && <p className="text-sm">You have been unsubscribed.</p>}
      </div>
    </main>
  );
}