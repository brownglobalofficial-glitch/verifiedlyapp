import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Code2, Copy, Eye, KeyRound, Search, Shield, ShieldCheck, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import VerifiedBadge from "@/components/VerifiedBadge";
import logo from "@/assets/verifiedly-logo.webp";

interface AdminProfile {
  id: string;
  username: string;
  display_name: string | null;
  account_type: string | null;
  category: string | null;
  id_verified: boolean;
  created_at: string;
  updated_at: string;
}

interface OAuthClientSummary {
  id: string;
  client_id: string;
  name: string;
  redirect_uris: string[];
  scopes: string[];
  is_first_party: boolean;
  active: boolean;
  rotated_at: string | null;
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [oauthClients, setOauthClients] = useState<OAuthClientSummary[]>([]);
  const [rotatedSecrets, setRotatedSecrets] = useState<Record<string, string>>({});
  const [rotatingClientId, setRotatingClientId] = useState<string | null>(null);
  const [viewCount, setViewCount] = useState(0);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin");
      if (!roles?.length) {
        toast({ title: "Access denied", variant: "destructive" });
        navigate("/dashboard");
        return;
      }

      const [{ data, error }, { count }, oauthResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, username, display_name, account_type, category, id_verified, created_at, updated_at")
          .order("created_at", { ascending: false }),
        supabase.from("page_views").select("id", { count: "exact", head: true }),
        supabase
          .from("oauth_clients")
          .select("id, client_id, name, redirect_uris, scopes, is_first_party, active, rotated_at")
          .order("name", { ascending: true }),
      ]);
      if (error) {
        toast({ title: "Admin data unavailable", description: error.message, variant: "destructive" });
      }
      setProfiles(data || []);
      if (oauthResult.error) {
        toast({ title: "OAuth clients unavailable", description: oauthResult.error.message, variant: "destructive" });
      }
      setOauthClients((oauthResult.data as OAuthClientSummary[] | null) || []);
      setViewCount(count || 0);
      setLoading(false);
    };

    load();
  }, [navigate, toast]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return profiles;
    return profiles.filter((profile) => [profile.username, profile.display_name, profile.category]
      .some((value) => value?.toLowerCase().includes(query)));
  }, [profiles, search]);

  const copy = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    toast({ title: `${label} copied` });
  };

  const rotateSecret = async (clientId: string) => {
    setRotatingClientId(clientId);
    const { data, error } = await supabase.functions.invoke("admin-rotate-oauth-secret", {
      body: { client_id: clientId },
    });
    setRotatingClientId(null);
    if (error || data?.error || !data?.client_secret) {
      toast({ title: "Secret not rotated", description: error?.message || data?.error || "Please try again.", variant: "destructive" });
      return;
    }
    setRotatedSecrets((current) => ({ ...current, [clientId]: data.client_secret }));
    setOauthClients((current) => current.map((client) => client.client_id === clientId
      ? { ...client, rotated_at: new Date().toISOString() }
      : client));
    toast({ title: "Secret rotated", description: "Copy it now. Verifiedly will not show it again after you leave this page." });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading…</div>;

  const verifiedCount = profiles.filter((profile) => profile.id_verified).length;
  const organizationCount = profiles.filter((profile) => profile.account_type === "business").length;

  return (
    <div className="min-h-screen bg-background">
      <nav className="flex h-16 items-center border-b border-border px-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard"><img src={logo} alt="Verifiedly" className="h-7" /></Link>
            <Badge variant="outline" className="gap-1"><Shield className="h-3 w-3" /> Admin</Badge>
          </div>
          <Button asChild variant="ghost" size="sm"><Link to="/dashboard">Dashboard</Link></Button>
        </div>
      </nav>

      <main className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-display font-bold">Profile administration</h1>
          <p className="mt-1 text-sm text-muted-foreground">Read-only profile and identity-status overview.</p>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Profiles", value: profiles.length, icon: Users },
            { label: "Profile views", value: viewCount, icon: Eye },
            { label: "Identity verified", value: verifiedCount, icon: ShieldCheck },
            { label: "Organizations", value: organizationCount, icon: Building2 },
          ].map((stat) => (
            <Card key={stat.label} className="p-4">
              <div className="mb-2 flex items-center gap-2 text-muted-foreground"><stat.icon className="h-4 w-4" /><span className="text-xs">{stat.label}</span></div>
              <p className="text-2xl font-display font-bold">{stat.value.toLocaleString()}</p>
            </Card>
          ))}
        </div>

        <div className="mb-4 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search profiles" className="pl-9" />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader><TableRow><TableHead>Profile</TableHead><TableHead>Represents</TableHead><TableHead>Professional label</TableHead><TableHead>Identity</TableHead><TableHead>Created</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.map((profile) => {
                const isOrganization = profile.account_type === "business";
                return (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <div className="flex items-center gap-1.5 font-medium">
                        {profile.display_name || profile.username}
                        {profile.id_verified && <VerifiedBadge className="h-4 w-4" label={isOrganization ? "Account holder verified" : "Identity verified"} />}
                      </div>
                      <Link to={`/${profile.username}`} className="text-xs text-muted-foreground hover:underline">@{profile.username}</Link>
                    </TableCell>
                    <TableCell>{isOrganization ? "Organization" : "Individual"}</TableCell>
                    <TableCell>{profile.category || "—"}</TableCell>
                    <TableCell>{profile.id_verified ? (isOrganization ? "Account holder verified" : "Verified") : "Not verified"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(profile.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                );
              })}
              {!filtered.length && <TableRow><TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">No matching profiles.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>

        <section id="oauth-clients" className="mt-10 scroll-mt-20">
          <div className="mb-4 flex items-start gap-3">
            <Code2 className="mt-1 h-5 w-5 shrink-0" />
            <div>
              <h2 className="text-xl font-display font-bold">OAuth clients</h2>
              <p className="mt-1 text-sm text-muted-foreground">Admin-only controls for approved Sign in with Verifiedly integrations. Client-secret hashes are never returned to this page.</p>
            </div>
          </div>

          <div className="space-y-3">
            {oauthClients.map((client) => (
              <Card key={client.id} className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{client.name}</p>
                      {client.is_first_party && <Badge variant="secondary">First-party</Badge>}
                      <Badge variant={client.active ? "outline" : "destructive"}>{client.active ? "Active" : "Disabled"}</Badge>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <code className="min-w-0 truncate rounded bg-muted px-2 py-1 text-xs">{client.client_id}</code>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => void copy(client.client_id, "Client ID")} aria-label={`Copy ${client.name} client ID`}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="mt-3 space-y-1 text-xs leading-relaxed text-muted-foreground">
                      <p><span className="font-medium text-foreground">Redirect URIs:</span> {client.redirect_uris.join(", ") || "None registered"}</p>
                      <p><span className="font-medium text-foreground">Scopes:</span> {client.scopes.join(" ") || "None"}</p>
                      <p><span className="font-medium text-foreground">Last secret rotation:</span> {client.rotated_at ? new Date(client.rotated_at).toLocaleString() : "Not recorded"}</p>
                    </div>
                  </div>
                  <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => void rotateSecret(client.client_id)} disabled={rotatingClientId !== null || !client.active}>
                    <KeyRound className="h-4 w-4" /> {rotatingClientId === client.client_id ? "Rotating…" : "Rotate secret"}
                  </Button>
                </div>

                {rotatedSecrets[client.client_id] && (
                  <div className="mt-4 rounded-xl border border-foreground bg-muted/50 p-4">
                    <p className="text-xs font-semibold">New client secret — shown once</p>
                    <div className="mt-2 flex items-center gap-2">
                      <code className="min-w-0 flex-1 select-all overflow-x-auto rounded-lg bg-background px-3 py-2 text-xs">{rotatedSecrets[client.client_id]}</code>
                      <Button type="button" variant="outline" size="icon" onClick={() => void copy(rotatedSecrets[client.client_id], "Client secret")} aria-label={`Copy ${client.name} client secret`}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">Store it only in the partner app's server-side secret manager. Never place it in a browser bundle, public repository, or VITE_* variable.</p>
                  </div>
                )}
              </Card>
            ))}
            {!oauthClients.length && <Card className="p-6 text-center text-sm text-muted-foreground">No OAuth clients are provisioned.</Card>}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Admin;
