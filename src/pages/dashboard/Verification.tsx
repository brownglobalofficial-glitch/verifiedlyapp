import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, CheckCircle2, Clock, Lock, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import VerifiedBadge from "@/components/VerifiedBadge";
import DashboardShell from "@/components/dashboard/DashboardShell";

interface VerificationProfile {
  id: string;
  username: string;
  account_type: string | null;
  verification_status: string | null;
  id_verified: boolean;
  verified_at: string | null;
  verified_full_name: string | null;
  verified_country: string | null;
}

const Verification = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<VerificationProfile | null>(null);

  const load = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("id, username, account_type, verification_status, id_verified, verified_at, verified_full_name, verified_country")
      .eq("id", session.user.id)
      .maybeSingle();
    setProfile(data as VerificationProfile | null);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <DashboardShell title="Verification"><div className="p-8 text-sm text-muted-foreground">Loading…</div></DashboardShell>;
  }

  if (!profile) {
    return (
      <DashboardShell title="Verification">
        <div className="mx-auto max-w-xl px-4 py-8 text-center">
          <Card className="p-6">
            <p className="font-medium">Verification status could not be loaded.</p>
            <Button className="mt-4" variant="outline" onClick={() => { setLoading(true); void load(); }}>Try again</Button>
          </Card>
        </div>
      </DashboardShell>
    );
  }

  const isVerified = profile.id_verified;
  const isOrganization = profile.account_type === "business";
  const badgeLabel = isOrganization ? "Account holder verified" : "Identity verified";
  const isExistingReview = profile.verification_status === "processing" || profile.verification_status === "paid";

  return (
    <DashboardShell title="Verification">
      <div className="mx-auto max-w-xl space-y-4 px-4 py-6 sm:py-8">
        <Card className="rounded-2xl p-6 shadow-sm sm:p-8">
          {isVerified ? (
            <div className="text-center">
              <VerifiedBadge className="mx-auto h-9 w-9" label={badgeLabel} />
              <h1 className="mt-4 text-2xl font-display font-bold">{badgeLabel}</h1>
              <p className="mt-2 text-sm text-muted-foreground">Your profile currently displays one Verified badge.</p>
            </div>
          ) : isExistingReview ? (
            <div className="text-center">
              <Clock className="mx-auto h-8 w-8 text-muted-foreground" />
              <h1 className="mt-4 text-2xl font-display font-bold">Check in progress</h1>
              <p className="mt-2 text-sm text-muted-foreground">An existing verification check is still being reviewed.</p>
              <Button className="mt-5" variant="outline" onClick={() => { setLoading(true); void load(); }}>Refresh</Button>
            </div>
          ) : (
            <div className="text-center">
              <ShieldCheck className="mx-auto h-8 w-8 text-muted-foreground" />
              <h1 className="mt-4 text-2xl font-display font-bold">Verification is being finalized</h1>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                New verification checks are paused while Verifiedly chooses the clearest, safest method. There is currently no price, subscription, or free-verification offer.
              </p>
            </div>
          )}
        </Card>

        {isOrganization && (
          <Card className="rounded-xl p-4 shadow-none">
            <div className="flex gap-3">
              <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Organization profile</p>
                <p className="mt-1 text-xs text-muted-foreground">A future verification label must clearly state whether it checks the account holder or the organization itself.</p>
              </div>
            </div>
          </Card>
        )}

        {isVerified && (
          <Card className="rounded-xl p-5 shadow-none">
            <div className="mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <h2 className="text-sm font-semibold">Private verification details</h2>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Legal name</dt><dd className="text-right font-medium">{profile.verified_full_name || "—"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Country</dt><dd className="text-right font-medium">{profile.verified_country || "—"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Verified on</dt><dd className="text-right font-medium">{profile.verified_at ? new Date(profile.verified_at).toLocaleDateString() : "—"}</dd></div>
            </dl>
          </Card>
        )}

        <div className="flex gap-2 rounded-xl bg-muted/50 p-4 text-xs leading-relaxed text-muted-foreground">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Verifiedly will not call every profile claim “verified.” Any future badge must state exactly what the verification provider checked.</p>
        </div>
      </div>
    </DashboardShell>
  );
};

export default Verification;
