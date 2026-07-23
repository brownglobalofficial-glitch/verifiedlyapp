import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Loader2, Nfc, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import logoMark from "@/assets/verifiedly-mark.png";

const TapRedirect = () => {
  const { token = "" } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "inactive" | "not_found" | "error">("loading");

  useEffect(() => {
    let active = true;
    const resolve = async () => {
      if (!token) {
        setStatus("not_found");
        return;
      }

      const source = searchParams.get("s") === "qr" ? "qr" : searchParams.get("s") === "nfc" ? "nfc" : "unknown";
      const { data, error } = await (supabase as any).rpc("resolve_verifiedly_tap_card", {
        p_token: token,
        p_source: source,
      });
      if (!active) return;
      if (error) {
        setStatus("error");
        return;
      }
      const result = Array.isArray(data) ? data[0] : data;
      if (!result || result.card_status === "not_found") {
        setStatus("not_found");
        return;
      }
      if (result.card_status !== "active" || !result.profile_username) {
        setStatus("inactive");
        return;
      }
      navigate(`/${result.profile_username}?shared=tap-card`, { replace: true });
    };

    void resolve();
    return () => { active = false; };
  }, [navigate, searchParams, token]);

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /><p className="mt-3 text-sm text-muted-foreground">Opening Verifiedly profile…</p></div></div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm rounded-3xl p-8 text-center">
        <img src={logoMark} alt="Verifiedly" className="mx-auto h-10 w-10" />
        {status === "inactive" ? <Nfc className="mx-auto mt-5 h-8 w-8" /> : <ShieldAlert className="mx-auto mt-5 h-8 w-8" />}
        <h1 className="mt-4 text-xl font-display font-bold">{status === "inactive" ? "This Tap Card is inactive" : status === "not_found" ? "Tap Card not found" : "The profile could not be opened"}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{status === "inactive" ? "The owner may not have activated the card yet, or it may have been disabled, lost, or replaced." : "Check the printed address or ask the card owner to share their current Verifiedly profile link."}</p>
        <Button asChild variant="outline" className="mt-6"><Link to="/">Go to Verifiedly</Link></Button>
        <p className="mt-5 text-[10px] leading-relaxed text-muted-foreground">Verifiedly Tap Cards are profile-sharing accessories. They are not payment cards or government-issued identification.</p>
      </Card>
    </div>
  );
};

export default TapRedirect;
