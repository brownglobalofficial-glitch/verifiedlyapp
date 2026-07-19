import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, CalendarCheck2, CheckCircle2, Globe2, ShieldCheck } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { BusinessVerificationBadge } from "@/components/VerificationClaimBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface OrganizationProfile {
  id: string;
  username: string;
  display_name: string | null;
  account_type: string | null;
  website: string | null;
  organization_legal_name: string | null;
  organization_industry: string | null;
  organization_country: string | null;
  business_verified: boolean;
  business_verified_at: string | null;
  business_verification_expires_at: string | null;
  business_verification_provider: string | null;
}

interface BusinessRequest {
  id: string;
  provider: string;
  status: string;
  created_at: string;
}

const statusText: Record<string, string> = {
  provider_setup_required: "Provider setup required",
  pending: "Pending",
  in_review: "In review",
  verified: "Verified",
  needs_action: "Action needed",
  failed: "Not verified",
  expired: "Expired",
};

const OrganizationVerification = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<OrganizationProfile | null>(null);
  const [request, setRequest] = useState<BusinessRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login?next=/dashboard/organization-verification");
      return;
    }
    const [profileResult, requestResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, username, display_name, account_type, website, organization_legal_name, organization_industry, organization_country, business_verified, business_verified_at, business_verification_expires_at, business_verification_provider")
        .eq("id", session.user.id)
        .maybeSingle(),
      supabase
        .from("business_verification_requests")
        .select("id, provider, status, created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    setProfile((profileResult.data as OrganizationProfile | null) ?? null);
    setRequest((requestResult.data as BusinessRequest | null) ?? null);
    setLoading(false);
  }, [navigate]);

  useEffect(() => { void load(); }, [load]);

  const complete = useMemo(() => !!profile?.organization_legal_name && !!profile?.organization_country && !!profile?.website, [profile]);

  const requestVerification = async () => {
    setRequesting(true);
    const { error } = await supabase.rpc("request_business_verification");
    setRequesting(false);
    if (error) {
      toast({ title: "Request not saved", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Organization verification pilot requested", description: "No payment was taken. Provider-hosted collection will open after the KYB agreement is approved." });
    await load();
  };

  if (loading) return <DashboardShell title="Organization verification"><div className="p-8 text-sm text-muted-foreground">Loading…</div></DashboardShell>;

  if (profile?.account_type !== "business") {
    return (
      <DashboardShell title="Organization verification">
        <div className="mx-auto max-w-xl px-4 py-16 text-center"><Building2 className="mx-auto h-9 w-9 text-muted-foreground" /><h1 className="mt-4 font-display text-2xl font-bold">Create an organization profile first</h1><p className="mt-2 text-sm text-muted-foreground">Registration verification is separate from the account holder's identity check.</p><Button asChild className="mt-6 rounded-full"><Link to="/dashboard">Switch account type</Link></Button></div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Organization verification">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted"><Building2 className="h-6 w-6" /></div>
          <h1 className="mt-4 font-display text-3xl font-bold">Verify the organization record</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">Confirm that the legal business exists and that an authorized representative controls this profile. This badge is not an endorsement.</p>
          {profile.business_verified && <BusinessVerificationBadge className="mt-4" />}
        </div>

        <Card className="mt-7 rounded-3xl p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-3"><div><h2 className="font-display text-lg font-bold">Organization record</h2><p className="mt-1 text-xs text-muted-foreground">Public profile fields used to begin the provider-hosted KYB flow.</p></div><Badge variant={complete ? "secondary" : "outline"}>{complete ? "Ready" : "Incomplete"}</Badge></div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              ["Legal name", profile.organization_legal_name],
              ["Registered country", profile.organization_country],
              ["Industry", profile.organization_industry],
              ["Official website", profile.website],
            ].map(([label, value]) => <div key={label} className="rounded-2xl border p-3"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className="mt-1 truncate text-sm font-medium">{value || "Not added"}</p></div>)}
          </div>
          {!complete && <Button asChild variant="outline" className="mt-5 w-full rounded-xl"><Link to="/dashboard">Complete organization profile</Link></Button>}
        </Card>

        {profile.business_verified ? (
          <Card className="mt-4 rounded-3xl border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
            <div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Registration record verified</p><p className="mt-1 text-xs leading-relaxed">Checked {profile.business_verified_at ? new Date(profile.business_verified_at).toLocaleDateString() : "recently"}{profile.business_verification_provider ? ` through ${profile.business_verification_provider}` : ""}. {profile.business_verification_expires_at ? `Recheck due ${new Date(profile.business_verification_expires_at).toLocaleDateString()}.` : "A yearly recheck will be required."}</p></div></div>
          </Card>
        ) : (
          <Card className="mt-4 rounded-3xl p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /><div className="min-w-0 flex-1"><h2 className="font-semibold">Provider-ready pilot</h2><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Middesk is the planned U.S. provider. Persona is the planned option for broader country coverage. Their hosted or approved flow—not the public profile—must collect registration numbers, owner information, and supporting documents.</p></div></div>
            {request ? (
              <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-muted/60 p-4"><div><p className="text-xs font-semibold">{statusText[request.status] || request.status}</p><p className="mt-1 text-[11px] text-muted-foreground">Requested {new Date(request.created_at).toLocaleDateString()} · {request.provider}</p></div><CalendarCheck2 className="h-5 w-5 text-muted-foreground" /></div>
            ) : (
              <Button onClick={() => void requestVerification()} disabled={!complete || requesting} className="mt-5 w-full rounded-xl">{requesting ? "Saving request…" : "Request pilot access"}</Button>
            )}
            <p className="mt-3 text-center text-[11px] text-muted-foreground">No fee is charged until provider pricing and the adult-owned business agreement are finalized.</p>
          </Card>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border p-4"><ShieldCheck className="h-4 w-4" /><p className="mt-3 text-xs font-semibold">Specific badge</p><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">Says “Business registration verified,” never a vague trust endorsement.</p></div>
          <div className="rounded-2xl border p-4"><Globe2 className="h-4 w-4" /><p className="mt-3 text-xs font-semibold">Country-aware</p><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">Coverage and required information vary by jurisdiction.</p></div>
          <div className="rounded-2xl border p-4"><CalendarCheck2 className="h-4 w-4" /><p className="mt-3 text-xs font-semibold">Rechecked yearly</p><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">Business standing can change, so the badge is never permanent.</p></div>
        </div>
      </div>
    </DashboardShell>
  );
};

export default OrganizationVerification;
