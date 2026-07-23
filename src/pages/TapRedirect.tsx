import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CreditCard, Loader2, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import verifiedlyMark from "@/assets/verifiedly-v-mark.png";

const blockedStatuses = new Set(["lost", "disabled", "replaced", "canceled", "manual_review"]);

const TapRedirect = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<"loading" | "not_found" | "inactive">("loading");
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      const cleanedToken = (token || "").trim().toLowerCase();
      if (!/^[a-z0-9]{12,64}$/.test(cleanedToken)) {
        setState("not_found");
        return;
      }

      const { data, error } = await (supabase as any).rpc("resolve_verifiedly_tap_card", {
        p_token: cleanedToken,
        p_source: "tap-page",
      });

      if (cancelled) return;
      if (error || !data?.length) {
        setState("not_found");
        return;
      }

      const result = data[0] as {
        profile_username: string | null;
        card_status: string | null;
      };
      const cardStatus = result.card_status || "not_found";
      setStatus(cardStatus);

      if (result.profile_username && !blockedStatuses.has(cardStatus) && cardStatus !== "not_found") {
        navigate(`/${result.profile_username}`, { replace: true });
        return;
      }

      setState(cardStatus === "not_found" ? "not_found" : "inactive");
    };

    void resolve();
    return () => { cancelled = true; };
  }, [navigate, token]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-12">
      <div className="w-full max-w-md text-center">
        <img src={verifiedlyMark} alt="Verifiedly" className="mx-auto h-14 w-14 object-contain" />
        {state === "loading" ? (
          <>
            <Loader2 className="mx-auto mt-8 h-6 w-6 animate-spin" />
            <h1 className="mt-5 font-display text-2xl font-bold">Opening Verifiedly profile</h1>
            <p className="mt-2 text-sm text-muted-foreground">Checking this Tap Card’s live status…</p>
          </>
        ) : state === "not_found" ? (
          <>
            <ShieldAlert className="mx-auto mt-8 h-7 w-7" />
            <h1 className="mt-5 font-display text-2xl font-bold">Tap Card not found</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">This link is invalid or the card is no longer registered with Verifiedly.</p>
          </>
        ) : (
          <>
            <CreditCard className="mx-auto mt-8 h-7 w-7" />
            <h1 className="mt-5 font-display text-2xl font-bold">This Tap Card is inactive</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">The owner has disabled this card or marked it as {status.replaceAll("_", " ")}.</p>
          </>
        )}
        <p className="mt-8 text-[11px] text-muted-foreground">Verifiedly Tap Cards are non-payment profile-sharing accessories.</p>
      </div>
    </main>
  );
};

export default TapRedirect;
