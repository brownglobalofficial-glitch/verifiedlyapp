import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Shield, Users, Eye, DollarSign, ShoppingBag, Search, ArrowLeft } from "lucide-react";
import VerifiedBadge from "@/components/VerifiedBadge";
import PromoCodesPanel from "@/components/admin/PromoCodesPanel";
import logo from "@/assets/verifiedly-logo.webp";

const Admin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ users: 0, views: 0, earnings: 0, products: 0 });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin");
      
      if (!roles || roles.length === 0) {
        toast({ title: "Access denied", description: "You are not an admin.", variant: "destructive" });
        navigate("/dashboard");
        return;
      }
      
      setIsAdmin(true);
      await Promise.all([fetchProfiles(), fetchStats()]);
      setLoading(false);
    };
    checkAdmin();
  }, [navigate]);

  const fetchProfiles = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setProfiles(data || []);
  };

  const fetchStats = async () => {
    const [{ count: users }, { count: views }, { data: earnings }, { count: products }] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("page_views").select("*", { count: "exact", head: true }),
      supabase.from("earnings").select("amount"),
      supabase.from("products").select("*", { count: "exact", head: true }),
    ]);
    setStats({
      users: users || 0,
      views: views || 0,
      earnings: (earnings || []).reduce((s, e) => s + Number(e.amount), 0),
      products: products || 0,
    });
  };

  const toggleField = async (profileId: string, field: string, current: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ [field]: !current })
      .eq("id", profileId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Updated", description: `${field.replace("is_", "").replace("_", " ")} ${!current ? "enabled" : "disabled"}.` });
      setProfiles(profiles.map(p => p.id === profileId ? { ...p, [field]: !current } : p));
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!isAdmin) return null;

  const filtered = profiles.filter(p =>
    p.username?.toLowerCase().includes(search.toLowerCase()) ||
    p.display_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border h-16 flex items-center px-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard"><img src={logo} alt="Verifiedly" className="h-7" /></Link>
            <Badge variant="outline" className="gap-1"><Shield className="w-3 h-3" /> Admin</Badge>
          </div>
          <Link to="/dashboard"><Button variant="ghost" size="sm" className="gap-1"><ArrowLeft className="w-4 h-4" /> Dashboard</Button></Link>
        </div>
      </nav>

      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <h1 className="text-3xl font-display font-bold mb-6">Admin Panel</h1>

        {/* Platform Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Users", value: stats.users, icon: Users },
            { label: "Total Views", value: stats.views.toLocaleString(), icon: Eye },
            { label: "Total Earnings", value: `$${stats.earnings.toLocaleString()}`, icon: DollarSign },
            { label: "Total Products", value: stats.products, icon: ShoppingBag },
          ].map(stat => (
            <Card key={stat.label} className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <stat.icon className="w-4 h-4" />
                <span className="text-xs">{stat.label}</span>
              </div>
              <p className="text-2xl font-display font-bold">{stat.value}</p>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="featured">Featured</TabsTrigger>
            <TabsTrigger value="verified">Verified</TabsTrigger>
            <TabsTrigger value="promo">Promo Codes</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4">
            <div className="mb-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="pl-9" />
              </div>
            </div>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead>Pro</TableHead>
                    <TableHead>Elite</TableHead>
                    <TableHead>Featured</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(profile => (
                    <TableRow key={profile.id}>
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{profile.display_name || "—"}</span>
                            {(profile.is_verified || profile.is_pro || profile.is_elite) && <VerifiedBadge className="w-4 h-4" />}
                          </div>
                          <Link to={`/${profile.username}`} className="text-xs text-muted-foreground hover:underline">
                            @{profile.username}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{profile.account_type || "creator"}</Badge></TableCell>
                      <TableCell className="capitalize text-sm">{profile.category || "—"}</TableCell>
                      <TableCell>
                        <Button
                          variant={profile.is_verified ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleField(profile.id, "is_verified", !!profile.is_verified)}
                        >
                          {profile.is_verified ? "✓" : "—"}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant={profile.is_pro ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleField(profile.id, "is_pro", !!profile.is_pro)}
                        >
                          {profile.is_pro ? "✓" : "—"}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant={profile.is_elite ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleField(profile.id, "is_elite", !!profile.is_elite)}
                        >
                          {profile.is_elite ? "✓" : "—"}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant={profile.is_featured ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleField(profile.id, "is_featured", !!profile.is_featured)}
                        >
                          {profile.is_featured ? "⭐" : "—"}
                        </Button>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(profile.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="featured" className="mt-4">
            <h3 className="text-lg font-display font-semibold mb-4">Featured Creators</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profiles.filter(p => p.is_featured).map(p => (
                <Card key={p.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold flex items-center gap-1">
                        {p.display_name} {(p.is_verified || p.is_pro || p.is_elite) && <VerifiedBadge className="w-4 h-4" />}
                      </p>
                      <p className="text-sm text-muted-foreground">@{p.username}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => toggleField(p.id, "is_featured", true)}>
                      Remove
                    </Button>
                  </div>
                </Card>
              ))}
              {profiles.filter(p => p.is_featured).length === 0 && (
                <p className="text-muted-foreground col-span-full text-center py-8">No featured creators yet. Toggle the ⭐ button in the Users tab.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="verified" className="mt-4">
            <h3 className="text-lg font-display font-semibold mb-4">Verified Users</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profiles.filter(p => p.is_verified || p.is_pro || p.is_elite).map(p => (
                <Card key={p.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold flex items-center gap-1">
                        {p.display_name} <VerifiedBadge className="w-4 h-4" />
                      </p>
                      <p className="text-sm text-muted-foreground">@{p.username}</p>
                      <div className="flex gap-1 mt-1">
                        {p.is_pro && <Badge variant="secondary" className="text-xs">Pro</Badge>}
                        {p.is_elite && <Badge variant="secondary" className="text-xs">Elite</Badge>}
                        {p.is_verified && <Badge variant="secondary" className="text-xs">Verified</Badge>}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              {profiles.filter(p => p.is_verified || p.is_pro || p.is_elite).length === 0 && (
                <p className="text-muted-foreground col-span-full text-center py-8">No verified users yet.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="promo" className="mt-4">
            <PromoCodesPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
