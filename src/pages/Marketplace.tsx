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
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Search, Megaphone, DollarSign, Handshake, Plus, ArrowLeft } from "lucide-react";
import logo from "@/assets/verifiedly-logo.webp";
import type { User } from "@supabase/supabase-js";

const Marketplace = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "sponsorship" | "affiliate">("all");
  const [user, setUser] = useState<User | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [newCampaign, setNewCampaign] = useState({
    brand_name: "",
    title: "",
    description: "",
    campaign_type: "sponsorship" as "sponsorship" | "affiliate",
    budget_min: "",
    budget_max: "",
    commission_rate: "",
    category: "",
    requirements: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/login"); return; }
      setUser(session.user);
    });
    fetchCampaigns();
  }, [navigate]);

  const fetchCampaigns = async () => {
    const { data } = await supabase
      .from("brand_campaigns")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    setCampaigns(data || []);
  };

  const handleApply = async (campaignId: string) => {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from("campaign_applications").insert({
      campaign_id: campaignId,
      creator_id: user.id,
      message: applicationMessage,
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
      setApplyingId(null);
      setApplicationMessage("");
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
      fetchCampaigns();
    }
  };

  const filtered = campaigns.filter(c => {
    const matchesSearch = c.title?.toLowerCase().includes(search.toLowerCase()) || c.brand_name?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || c.campaign_type === filter;
    return matchesSearch && matchesFilter;
  });

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
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold">Marketplace</h1>
            <p className="text-muted-foreground mt-1">Sponsorships & affiliate opportunities for creators</p>
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" /> Post Campaign</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Campaign</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div><Label>Brand Name</Label><Input value={newCampaign.brand_name} onChange={e => setNewCampaign({ ...newCampaign, brand_name: e.target.value })} required /></div>
                <div><Label>Campaign Title</Label><Input value={newCampaign.title} onChange={e => setNewCampaign({ ...newCampaign, title: e.target.value })} required /></div>
                <div><Label>Description</Label><Textarea value={newCampaign.description} onChange={e => setNewCampaign({ ...newCampaign, description: e.target.value })} /></div>
                <div>
                  <Label>Type</Label>
                  <div className="flex gap-2 mt-1">
                    {(["sponsorship", "affiliate"] as const).map(t => (
                      <button key={t} onClick={() => setNewCampaign({ ...newCampaign, campaign_type: t })} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${newCampaign.campaign_type === t ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
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
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-6 mb-6">
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
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
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
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                  {campaign.campaign_type === "sponsorship" && campaign.budget_max > 0 && (
                    <span className="font-medium">${campaign.budget_min} – ${campaign.budget_max}</span>
                  )}
                  {campaign.campaign_type === "affiliate" && campaign.commission_rate > 0 && (
                    <span className="font-medium">{campaign.commission_rate}% commission</span>
                  )}
                  {campaign.category && <Badge variant="outline" className="text-xs">{campaign.category}</Badge>}
                </div>
                {applyingId === campaign.id ? (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Why you're a great fit..."
                      value={applicationMessage}
                      onChange={e => setApplicationMessage(e.target.value)}
                      rows={2}
                    />
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
                )}
              </Card>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground py-12">No campaigns found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
