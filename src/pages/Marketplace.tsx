import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Search, Megaphone, DollarSign, Handshake, Plus, ArrowLeft, CheckCircle2, XCircle, Clock } from "lucide-react";
import logo from "@/assets/verifiedly-logo.webp";
import type { User } from "@supabase/supabase-js";

const Marketplace = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [myCampaigns, setMyCampaigns] = useState<any[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "sponsorship" | "affiliate">("all");
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [newCampaign, setNewCampaign] = useState({
    brand_name: "", title: "", description: "",
    campaign_type: "sponsorship" as "sponsorship" | "affiliate",
    budget_min: "", budget_max: "", commission_rate: "",
    category: "", requirements: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { navigate("/login"); return; }
      setUser(session.user);
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
      setProfile(prof);
      fetchAll(session.user.id, prof?.account_type);
    });
  }, [navigate]);

  const fetchAll = async (uid: string, accountType?: string) => {
    const { data: allCampaigns } = await supabase.from("brand_campaigns").select("*").eq("is_active", true).order("created_at", { ascending: false });
    setCampaigns(allCampaigns || []);

    if (accountType === "business") {
      const { data: mine } = await supabase.from("brand_campaigns").select("*").eq("created_by", uid).order("created_at", { ascending: false });
      setMyCampaigns(mine || []);
      // Fetch applications for my campaigns
      if (mine && mine.length > 0) {
        const ids = mine.map(c => c.id);
        const { data: apps } = await supabase.from("campaign_applications").select("*, profiles:creator_id(username, display_name, avatar_url, category)").in("campaign_id", ids);
        setApplications(apps || []);
      }
    } else {
      const { data: myApps } = await supabase.from("campaign_applications").select("*, brand_campaigns(title, brand_name)").eq("creator_id", uid);
      setMyApplications(myApps || []);
    }
  };

  const handleApply = async (campaignId: string) => {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from("campaign_applications").insert({
      campaign_id: campaignId, creator_id: user.id, message: applicationMessage,
    });
    setSubmitting(false);
    if (error) {
      if (error.code === "23505") {
        toast({ title: "Already applied", description: "You've already applied to this campaign." });
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Applied!", description: "Your application has been submitted." });
      setApplyingId(null); setApplicationMessage("");
      fetchAll(user.id, profile?.account_type);
    }
  };

  const handleCreateCampaign = async () => {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from("brand_campaigns").insert({
      ...newCampaign,
      budget_min: parseFloat(newCampaign.budget_min) || 0,
      budget_max: parseFloat(newCampaign.budget_max) || 0,
      commission_rate: parseFloat(newCampaign.commission_rate) || 0,
      created_by: user.id,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Campaign created!", description: "Your campaign is now live." });
      setShowCreate(false);
      setNewCampaign({ brand_name: "", title: "", description: "", campaign_type: "sponsorship", budget_min: "", budget_max: "", commission_rate: "", category: "", requirements: "" });
      fetchAll(user.id, profile?.account_type);
    }
  };

  const handleApplicationAction = async (appId: string, status: "accepted" | "rejected") => {
    await supabase.from("campaign_applications").update({ status }).eq("id", appId);
    toast({ title: status === "accepted" ? "Application accepted!" : "Application rejected" });
    if (user) fetchAll(user.id, profile?.account_type);
  };

  const filtered = campaigns.filter(c => {
    const matchesSearch = c.title?.toLowerCase().includes(search.toLowerCase()) || c.brand_name?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || c.campaign_type === filter;
    return matchesSearch && matchesFilter;
  });

  const isBusiness = profile?.account_type === "business";

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border h-16 flex items-center px-4">
        <div className="container mx-auto flex items-center gap-4">
          <Link to="/dashboard"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <img src={logo} alt="Verifiedly" className="h-7" />
          <span className="font-display font-semibold">Marketplace</span>
        </div>
      </nav>

      <div className="container mx-auto pt-8 pb-12 px-4 max-w-5xl">
        <Tabs defaultValue={isBusiness ? "my-campaigns" : "browse"}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold">Marketplace</h1>
              <p className="text-muted-foreground mt-1">
                {isBusiness ? "Manage your campaigns & review applicants" : "Sponsorships & affiliate opportunities"}
              </p>
            </div>
            {isBusiness && (
              <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogTrigger asChild>
                  <Button className="gap-2"><Plus className="w-4 h-4" /> Post Campaign</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle>Create Campaign</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-2">
                    <div><Label>Brand Name</Label><Input value={newCampaign.brand_name} onChange={e => setNewCampaign({ ...newCampaign, brand_name: e.target.value })} required /></div>
                    <div><Label>Campaign Title</Label><Input value={newCampaign.title} onChange={e => setNewCampaign({ ...newCampaign, title: e.target.value })} required /></div>
                    <div><Label>Description</Label><Textarea value={newCampaign.description} onChange={e => setNewCampaign({ ...newCampaign, description: e.target.value })} /></div>
                    <div>
                      <Label>Type</Label>
                      <div className="flex gap-2 mt-1">
                        {(["sponsorship", "affiliate"] as const).map(t => (
                          <button key={t} type="button" onClick={() => setNewCampaign({ ...newCampaign, campaign_type: t })} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${newCampaign.campaign_type === t ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                            {t === "sponsorship" ? "Sponsorship" : "Affiliate"}
                          </button>
                        ))}
                      </div>
                    </div>
                    {newCampaign.campaign_type === "sponsorship" ? (
                      <div className="grid grid-cols-2 gap-2">
                        <div><Label>Budget Min ($)</Label><Input type="number" value={newCampaign.budget_min} onChange={e => setNewCampaign({ ...newCampaign, budget_min: e.target.value })} /></div>
                        <div><Label>Budget Max ($)</Label><Input type="number" value={newCampaign.budget_max} onChange={e => setNewCampaign({ ...newCampaign, budget_max: e.target.value })} /></div>
                      </div>
                    ) : (
                      <div><Label>Commission Rate (%)</Label><Input type="number" value={newCampaign.commission_rate} onChange={e => setNewCampaign({ ...newCampaign, commission_rate: e.target.value })} /></div>
                    )}
                    <div><Label>Category</Label><Input value={newCampaign.category} onChange={e => setNewCampaign({ ...newCampaign, category: e.target.value })} placeholder="e.g. Fashion, Tech, Fitness" /></div>
                    <div><Label>Requirements</Label><Textarea value={newCampaign.requirements} onChange={e => setNewCampaign({ ...newCampaign, requirements: e.target.value })} placeholder="Min followers, content type, etc." /></div>
                    <Button onClick={handleCreateCampaign} disabled={submitting || !newCampaign.brand_name || !newCampaign.title} className="w-full">
                      {submitting ? "Creating..." : "Create Campaign"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <TabsList className={`grid w-full mb-6 ${isBusiness ? "grid-cols-3" : "grid-cols-2"}`}>
            <TabsTrigger value="browse">Browse</TabsTrigger>
            {isBusiness && <TabsTrigger value="my-campaigns">My Campaigns</TabsTrigger>}
            <TabsTrigger value={isBusiness ? "applicants" : "my-applications"}>
              {isBusiness ? "Applicants" : "My Applications"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse">
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search campaigns..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
              </div>
              <div className="flex gap-2">
                {(["all", "sponsorship", "affiliate"] as const).map(t => (
                  <button key={t} onClick={() => setFilter(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === t ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                    {t === "all" ? "All" : t === "sponsorship" ? "Sponsorships" : "Affiliates"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {filtered.map((campaign, i) => (
                <motion.div key={campaign.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.05 }}>
                  <Card className="p-6 card-hover h-full flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">{campaign.brand_name}</p>
                        <h3 className="font-display font-semibold text-lg">{campaign.title}</h3>
                      </div>
                      <Badge variant={campaign.campaign_type === "sponsorship" ? "default" : "secondary"} className="gap-1">
                        {campaign.campaign_type === "sponsorship" ? <Handshake className="w-3 h-3" /> : <DollarSign className="w-3 h-3" />}
                        {campaign.campaign_type}
                      </Badge>
                    </div>
                    {campaign.description && <p className="text-sm text-muted-foreground mb-3 flex-1">{campaign.description}</p>}
                    {campaign.requirements && (
                      <p className="text-xs text-muted-foreground mb-3 bg-secondary rounded-lg p-2">
                        <span className="font-medium">Requirements:</span> {campaign.requirements}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                      {campaign.campaign_type === "sponsorship" && campaign.budget_max > 0 && (
                        <span className="font-medium">${campaign.budget_min} – ${campaign.budget_max}</span>
                      )}
                      {campaign.campaign_type === "affiliate" && campaign.commission_rate > 0 && (
                        <span className="font-medium">{campaign.commission_rate}% commission</span>
                      )}
                      {campaign.category && <Badge variant="outline" className="text-xs">{campaign.category}</Badge>}
                    </div>
                    {!isBusiness && (
                      applyingId === campaign.id ? (
                        <div className="space-y-2">
                          <Textarea placeholder="Why you're a great fit..." value={applicationMessage} onChange={e => setApplicationMessage(e.target.value)} rows={2} />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleApply(campaign.id)} disabled={submitting} className="flex-1">
                              {submitting ? "Submitting..." : "Submit"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setApplyingId(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => setApplyingId(campaign.id)} className="w-full gap-1">
                          <Megaphone className="w-3 h-3" /> Apply
                        </Button>
                      )
                    )}
                  </Card>
                </motion.div>
              ))}
              {filtered.length === 0 && <p className="col-span-full text-center text-muted-foreground py-12">No campaigns found</p>}
            </div>
          </TabsContent>

          {isBusiness && (
            <TabsContent value="my-campaigns">
              {myCampaigns.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">No campaigns yet. Post your first campaign!</p>
              ) : (
                <div className="space-y-4">
                  {myCampaigns.map(c => (
                    <Card key={c.id} className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-display font-semibold">{c.title}</h3>
                          <p className="text-sm text-muted-foreground">{c.brand_name} · {c.campaign_type}</p>
                        </div>
                        <Badge variant="outline">
                          {applications.filter(a => a.campaign_id === c.id).length} applicants
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {isBusiness ? (
            <TabsContent value="applicants">
              {applications.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">No applications yet.</p>
              ) : (
                <div className="space-y-3">
                  {applications.map(app => {
                    const campaign = myCampaigns.find(c => c.id === app.campaign_id);
                    return (
                      <Card key={app.id} className="p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">For: {campaign?.title}</p>
                            <p className="font-semibold">{(app.profiles as any)?.display_name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">@{(app.profiles as any)?.username} · {(app.profiles as any)?.category || "Creator"}</p>
                            {app.message && <p className="text-sm text-muted-foreground mt-1">"{app.message}"</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            {app.status === "pending" ? (
                              <>
                                <Button size="sm" onClick={() => handleApplicationAction(app.id, "accepted")} className="gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Accept
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleApplicationAction(app.id, "rejected")} className="gap-1">
                                  <XCircle className="w-3 h-3" /> Reject
                                </Button>
                              </>
                            ) : (
                              <Badge variant={app.status === "accepted" ? "default" : "secondary"}>
                                {app.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          ) : (
            <TabsContent value="my-applications">
              {myApplications.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">No applications yet. Browse campaigns and apply!</p>
              ) : (
                <div className="space-y-3">
                  {myApplications.map(app => (
                    <Card key={app.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">{(app.brand_campaigns as any)?.title}</p>
                        <p className="text-xs text-muted-foreground">{(app.brand_campaigns as any)?.brand_name}</p>
                      </div>
                      <Badge variant={app.status === "accepted" ? "default" : app.status === "rejected" ? "destructive" : "secondary"} className="gap-1">
                        {app.status === "pending" && <Clock className="w-3 h-3" />}
                        {app.status === "accepted" && <CheckCircle2 className="w-3 h-3" />}
                        {app.status === "rejected" && <XCircle className="w-3 h-3" />}
                        {app.status}
                      </Badge>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Marketplace;
