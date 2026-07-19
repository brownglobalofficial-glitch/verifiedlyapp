import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BadgeCheck, BookOpen, Clock3, ExternalLink, FileCheck2, ShieldCheck } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { CredentialVerificationBadge } from "@/components/VerificationClaimBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { ProfileSection, ProfileSectionKind } from "@/lib/profile-sections";

interface VerificationRecord {
  id: string;
  section_id: string;
  credential_type: string;
  provider_name: string;
  status: string;
  display_public: boolean;
  verified_title: string;
  verified_issuer: string | null;
  verified_at: string | null;
  expires_at: string | null;
}

const statusLabel: Record<string, string> = {
  provider_setup_required: "Pilot requested",
  pending: "Pending",
  in_review: "In review",
  verified: "Verified",
  needs_action: "Action needed",
  failed: "Not verified",
  expired: "Expired",
};

const sectionTitle = (section: ProfileSection) => section.kind === "education"
  ? section.data.program || section.data.school || "Education credential"
  : section.data.name || "Professional credential";

const sectionIssuer = (section: ProfileSection) => section.kind === "education"
  ? section.data.school || ""
  : section.data.issuer || "";

const Credentials = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sections, setSections] = useState<ProfileSection[]>([]);
  const [verifications, setVerifications] = useState<VerificationRecord[]>([]);
  const [credentialTypes, setCredentialTypes] = useState<Record<string, "license" | "certification">>({});
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login?next=/dashboard/credentials");
      return;
    }

    const [sectionResult, verificationResult] = await Promise.all([
      supabase
        .from("profile_sections")
        .select("id, user_id, kind, position, data, is_public, created_at, updated_at")
        .eq("user_id", session.user.id)
        .in("kind", ["education", "credential"])
        .order("position", { ascending: true }),
      supabase
        .from("credential_verifications")
        .select("id, section_id, credential_type, provider_name, status, display_public, verified_title, verified_issuer, verified_at, expires_at")
        .eq("user_id", session.user.id),
    ]);

    if (sectionResult.error || verificationResult.error) {
      toast({ title: "Credentials unavailable", description: sectionResult.error?.message || verificationResult.error?.message, variant: "destructive" });
    }

    setSections(((sectionResult.data || []) as Array<Omit<ProfileSection, "kind" | "data"> & { kind: string; data: unknown }>).map((section) => ({
      ...section,
      kind: section.kind as ProfileSectionKind,
      data: (section.data || {}) as Record<string, string>,
    })));
    const nextVerifications = (verificationResult.data as VerificationRecord[] | null) || [];
    setVerifications(nextVerifications);
    setCredentialTypes(Object.fromEntries(nextVerifications.filter((item) => item.credential_type !== "education").map((item) => [item.section_id, item.credential_type as "license" | "certification"])));
    setLoading(false);
  }, [navigate, toast]);

  useEffect(() => { void load(); }, [load]);

  const verificationBySection = useMemo(() => new Map(verifications.map((verification) => [verification.section_id, verification])), [verifications]);

  const requestVerification = async (section: ProfileSection) => {
    const credentialType = section.kind === "education" ? "education" : (credentialTypes[section.id] || "license");
    setRequestingId(section.id);
    const { error } = await supabase.rpc("request_credential_verification", {
      _section_id: section.id,
      _credential_type: credentialType,
    });
    setRequestingId(null);
    if (error) {
      toast({ title: "Request not saved", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Verification pilot requested", description: "No payment was taken. We will enable checkout after the provider account is approved." });
    await load();
  };

  const setPublic = async (verification: VerificationRecord, displayPublic: boolean) => {
    const { error } = await supabase.from("credential_verifications").update({ display_public: displayPublic }).eq("id", verification.id);
    if (error) {
      toast({ title: "Visibility not changed", description: error.message, variant: "destructive" });
      return;
    }
    setVerifications((current) => current.map((item) => item.id === verification.id ? { ...item, display_public: displayPublic } : item));
    toast({ title: displayPublic ? "Verified claim is public" : "Verified claim is private" });
  };

  return (
    <DashboardShell title="Verified credentials">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Claim-level verification</p>
            <h1 className="mt-2 font-display text-3xl font-bold">Verify a degree or license</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">A document upload is never treated as proof by itself. A public Verified claim appears only after an authoritative provider confirms it.</p>
          </div>
          <Button asChild variant="outline" className="rounded-full"><Link to="/dashboard">Edit profile entries</Link></Button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Card className="rounded-2xl p-4">
            <div className="flex items-start gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted"><BookOpen className="h-4 w-4" /></div><div><p className="text-sm font-semibold">U.S. education</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Expected launch price: $24.99 per degree. Checkr is the first integration; National Student Clearinghouse can be added as a direct source.</p></div></div>
          </Card>
          <Card className="rounded-2xl p-4">
            <div className="flex items-start gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted"><FileCheck2 className="h-4 w-4" /></div><div><p className="text-sm font-semibold">Professional license</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Expected launch price: $19.99 per license. Status and expiration are shown only when the issuing source can be confirmed.</p></div></div>
          </Card>
        </div>

        <div className="mt-6 flex gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <p><strong>Provider-ready pilot:</strong> requests are saved, but no money is charged and no badge is issued until BrownGlobal's authorized adult representative completes the Checkr partner/API agreement.</p>
        </div>

        <div className="mt-7">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-display text-lg font-bold">Your eligible profile entries</h2><span className="text-xs text-muted-foreground">{sections.length} entries</span></div>
          {loading ? (
            <Card className="rounded-3xl p-8 text-center text-sm text-muted-foreground">Loading credentials…</Card>
          ) : !sections.length ? (
            <Card className="rounded-3xl border-dashed p-10 text-center"><BadgeCheck className="mx-auto h-7 w-7 text-muted-foreground" /><p className="mt-3 text-sm font-medium">Add education or a credential first</p><p className="mt-1 text-xs text-muted-foreground">Create the structured entry on your profile, then return here to request an independent check.</p><Button asChild className="mt-5 rounded-full"><Link to="/dashboard">Add profile entry</Link></Button></Card>
          ) : (
            <div className="space-y-3">
              {sections.map((section) => {
                const verification = verificationBySection.get(section.id);
                const verified = verification?.status === "verified";
                return (
                  <Card key={section.id} className="rounded-2xl p-4 sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{sectionTitle(section)}</h3>{verified && <CredentialVerificationBadge provider={verification.provider_name} />}</div>
                        {sectionIssuer(section) && <p className="mt-1 text-xs text-muted-foreground">{sectionIssuer(section)}</p>}
                        <div className="mt-2 flex flex-wrap gap-1.5"><Badge variant="secondary" className="rounded-full text-[10px]">{section.kind === "education" ? "Education" : "Credential"}</Badge>{verification && <Badge variant="outline" className="rounded-full text-[10px]"><Clock3 className="mr-1 h-3 w-3" />{statusLabel[verification.status] || verification.status}</Badge>}</div>
                      </div>

                      <div className="shrink-0 sm:text-right">
                        {!verification ? (
                          <div className="flex flex-col gap-2 sm:items-end">
                            {section.kind === "credential" && (
                              <select value={credentialTypes[section.id] || "license"} onChange={(event) => setCredentialTypes((current) => ({ ...current, [section.id]: event.target.value as "license" | "certification" }))} className="h-8 rounded-lg border bg-background px-2 text-xs">
                                <option value="license">Professional license</option>
                                <option value="certification">Certification</option>
                              </select>
                            )}
                            <Button size="sm" onClick={() => void requestVerification(section)} disabled={requestingId === section.id} className="rounded-full">{requestingId === section.id ? "Saving…" : "Request pilot access"}</Button>
                          </div>
                        ) : verified ? (
                          <div className="flex items-center gap-2 sm:justify-end"><span className="text-xs text-muted-foreground">Show on profile</span><Switch checked={verification.display_public} onCheckedChange={(value) => void setPublic(verification, value)} /></div>
                        ) : (
                          <p className="max-w-48 text-xs leading-relaxed text-muted-foreground">Your request is saved. Checkout and provider collection will open after the integration is approved.</p>
                        )}
                      </div>
                    </div>
                    {verified && verification.verified_at && <p className="mt-3 border-t pt-3 text-[11px] text-muted-foreground">Checked {new Date(verification.verified_at).toLocaleDateString()}{verification.expires_at ? ` · Expires ${new Date(verification.expires_at).toLocaleDateString()}` : ""}</p>}
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between rounded-2xl bg-muted/40 p-4 text-xs text-muted-foreground"><span>Raw verification reports and provider identifiers are never public.</span><a href="https://checkr.com/our-technology/background-check-api" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-foreground">Provider information <ExternalLink className="h-3 w-3" /></a></div>
      </div>
    </DashboardShell>
  );
};

export default Credentials;
