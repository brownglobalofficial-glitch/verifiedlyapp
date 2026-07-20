import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BadgeCheck, Building2, MapPin, Search, ShieldCheck, UserSearch } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { BusinessVerificationBadge, CredentialVerificationBadge } from "@/components/VerificationClaimBadge";
import VerifiedBadge from "@/components/VerifiedBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface DirectoryProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  account_type: string | null;
  category: string | null;
  social_links: unknown;
  id_verified: boolean;
  business_verified: boolean;
  organization_industry: string | null;
  organization_country: string | null;
  accepts_verification_requests: boolean;
}

interface CredentialClaim {
  id: string;
  user_id: string;
  credential_type: string;
  provider_name: string;
  verified_title: string;
  verified_issuer: string | null;
  verified_at: string | null;
}

const Directory = () => {
  const navigate = useNavigate();
  const [viewer, setViewer] = useState<DirectoryProfile | null>(null);
  const [profiles, setProfiles] = useState<DirectoryProfile[]>([]);
  const [credentials, setCredentials] = useState<CredentialClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [credentialOnly, setCredentialOnly] = useState(false);
  const [organizationsOnly, setOrganizationsOnly] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login?next=/directory");
        return;
      }

      const { data: currentViewer } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, account_type, category, social_links, id_verified, business_verified, organization_industry, organization_country, accepts_verification_requests")
        .eq("id", session.user.id)
        .maybeSingle();

      setViewer((currentViewer as DirectoryProfile | null) ?? null);
      if (currentViewer?.account_type !== "business") {
        setLoading(false);
        return;
      }

      const { data: visibleProfiles } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, account_type, category, social_links, id_verified, business_verified, organization_industry, organization_country, accepts_verification_requests")
        .eq("search_visible", true)
        .neq("id", session.user.id)
        .order("updated_at", { ascending: false })
        .limit(60);

      const nextProfiles = (visibleProfiles as DirectoryProfile[] | null) ?? [];
      setProfiles(nextProfiles);
      if (nextProfiles.length) {
        const { data: verifiedCredentials } = await supabase
          .from("credential_verifications")
          .select("id, user_id, credential_type, provider_name, verified_title, verified_issuer, verified_at")
          .in("user_id", nextProfiles.map((profile) => profile.id))
          .eq("status", "verified")
          .eq("display_public", true);
        setCredentials((verifiedCredentials as CredentialClaim[] | null) ?? []);
      }
      setLoading(false);
    };

    void load();
  }, [navigate]);

  const credentialsByUser = useMemo(() => {
    const map = new Map<string, CredentialClaim[]>();
    credentials.forEach((credential) => map.set(credential.user_id, [...(map.get(credential.user_id) || []), credential]));
    return map;
  }, [credentials]);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return profiles.filter((profile) => {
      const location = String((profile.social_links as Record<string, string> | null)?.location || "");
      const haystack = [
        profile.display_name,
        profile.username,
        profile.category,
        profile.organization_industry,
        profile.organization_country,
        location,
        ...(credentialsByUser.get(profile.id) || []).flatMap((credential) => [credential.verified_title, credential.verified_issuer]),
      ].filter(Boolean).join(" ").toLowerCase();
      if (normalized && !haystack.includes(normalized)) return false;
      if (verifiedOnly && !profile.id_verified && !profile.business_verified) return false;
      if (credentialOnly && !(credentialsByUser.get(profile.id)?.length)) return false;
      if (organizationsOnly && profile.account_type !== "business") return false;
      return true;
    });
  }, [credentialOnly, credentialsByUser, organizationsOnly, profiles, query, verifiedOnly]);

  if (loading) {
    return <DashboardShell title="Directory"><div className="mx-auto max-w-6xl space-y-4 p-6"><Skeleton className="h-12 w-full rounded-2xl" /><div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-48 rounded-3xl" /><Skeleton className="h-48 rounded-3xl" /></div></div></DashboardShell>;
  }

  if (viewer?.account_type !== "business") {
    return (
      <DashboardShell title="Directory">
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted"><Building2 className="h-6 w-6" /></div>
          <h1 className="mt-5 font-display text-2xl font-bold">Organization workspace required</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">The directory is for organizations reviewing opt-in official profiles. It has no jobs, applications, feed, connections, or profile ranking.</p>
          <Button asChild className="mt-6 rounded-full"><Link to="/dashboard">Switch your profile to an organization</Link></Button>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Directory">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Opt-in discovery</p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">Find official profiles</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">Search structured public information and independently verified claims. Verifiedly is not a job board and does not rank people.</p>
          </div>
          {!viewer.business_verified && (
            <Button asChild variant="outline" className="shrink-0 rounded-full"><Link to="/dashboard/organization-verification"><ShieldCheck className="mr-2 h-4 w-4" />Verify organization</Link></Button>
          )}
        </div>

        {!viewer.business_verified && (
          <div className="mt-5 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <p>You can preview public profiles now. Organization verification will be required before future verification-request tools are enabled.</p>
          </div>
        )}

        <Card className="mt-6 rounded-3xl p-4 shadow-sm sm:p-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, role, location, school, or verified credential" className="h-11 rounded-xl pl-10" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              [verifiedOnly, setVerifiedOnly, "Verified profiles", BadgeCheck],
              [credentialOnly, setCredentialOnly, "Verified credentials", ShieldCheck],
              [organizationsOnly, setOrganizationsOnly, "Organizations", Building2],
            ].map(([active, setter, label, Icon]) => {
              const toggle = setter as (value: boolean) => void;
              const FilterIcon = Icon as typeof BadgeCheck;
              return (
                <button key={String(label)} type="button" onClick={() => toggle(!active)} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${active ? "border-foreground bg-foreground text-background" : "border-border bg-background text-muted-foreground hover:text-foreground"}`}>
                  <FilterIcon className="h-3.5 w-3.5" />{String(label)}
                </button>
              );
            })}
          </div>
        </Card>

        <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground"><span>{results.length} opt-in {results.length === 1 ? "profile" : "profiles"}</span><span>Background checks are not available</span></div>

        {results.length ? (
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {results.map((profile) => {
              const claims = credentialsByUser.get(profile.id) || [];
              const location = String((profile.social_links as Record<string, string> | null)?.location || profile.organization_country || "");
              const name = profile.display_name || profile.username;
              return (
                <Card key={profile.id} className="flex flex-col rounded-3xl p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12"><AvatarImage src={profile.avatar_url || undefined} alt="" /><AvatarFallback className="font-display font-bold">{name[0]?.toUpperCase()}</AvatarFallback></Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5"><h2 className="truncate font-display text-lg font-bold">{name}</h2>{profile.id_verified && <VerifiedBadge className="h-4.5 w-4.5" />}</div>
                      <p className="text-xs text-muted-foreground">@{profile.username}</p>
                    </div>
                    {profile.account_type === "business" && profile.business_verified && <BusinessVerificationBadge compact />}
                  </div>
                  <div className="mt-4 space-y-1.5 text-sm">
                    {(profile.category || profile.organization_industry) && <p className="font-medium">{profile.category || profile.organization_industry}</p>}
                    {location && <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{location}</p>}
                  </div>
                  {!!claims.length && (
                    <div className="mt-4 border-t pt-3">
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Verified claims</p>
                      <div className="space-y-2">{claims.slice(0, 3).map((claim) => <div key={claim.id} className="flex items-start justify-between gap-2 text-xs"><span className="min-w-0 truncate">{claim.verified_title}{claim.verified_issuer ? ` · ${claim.verified_issuer}` : ""}</span><CredentialVerificationBadge compact provider={claim.provider_name} /></div>)}</div>
                    </div>
                  )}
                  <div className="mt-auto flex items-center justify-between gap-2 pt-5">
                    <span className="text-[10px] text-muted-foreground">{profile.accepts_verification_requests ? "Accepts verification requests" : "Public profile only"}</span>
                    <Button asChild size="sm" variant="outline" className="rounded-full"><Link to={`/${profile.username}`}>Open profile</Link></Button>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="mt-10 rounded-3xl border border-dashed p-12 text-center"><UserSearch className="mx-auto h-7 w-7 text-muted-foreground" /><p className="mt-3 text-sm font-medium">No matching opt-in profiles</p><p className="mt-1 text-xs text-muted-foreground">Try a broader search or clear a filter.</p></div>
        )}
      </div>
    </DashboardShell>
  );
};

export default Directory;
