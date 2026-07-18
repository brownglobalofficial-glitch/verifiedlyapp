import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Eye, Search, Shield, ShieldCheck, Users } from "lucide-react";
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

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
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

      const [{ data, error }, { count }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, username, display_name, account_type, category, id_verified, created_at, updated_at")
          .order("created_at", { ascending: false }),
        supabase.from("page_views").select("id", { count: "exact", head: true }),
      ]);
      if (error) {
        toast({ title: "Admin data unavailable", description: error.message, variant: "destructive" });
      }
      setProfiles(data || []);
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
      </main>
    </div>
  );
};

export default Admin;
