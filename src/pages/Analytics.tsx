import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Users, Eye, Share2 } from "lucide-react";
import logo from "@/assets/verifiedly-logo.webp";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, LineChart, Line } from "recharts";

const chartConfig = {
  earnings: { label: "Earnings", color: "hsl(var(--foreground))" },
  views: { label: "Views", color: "hsl(var(--muted-foreground))" },
  subscribers: { label: "Subscribers", color: "hsl(var(--foreground))" },
  clicks: { label: "Clicks", color: "hsl(var(--foreground))" },
};

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [viewsData, setViewsData] = useState<any[]>([]);
  const [earningsData, setEarningsData] = useState<any[]>([]);
  const [subsData, setSubsData] = useState<any[]>([]);
  const [socialStats, setSocialStats] = useState<any[]>([]);
  const [totals, setTotals] = useState({ earnings: 0, views: 0, subs: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/login"); return; }
      setUserId(session.user.id);
      fetchAnalytics(session.user.id);
    });
  }, [navigate]);

  const fetchAnalytics = async (uid: string) => {
    const [{ data: views }, { data: earnings }, { data: subs }, { data: social }] = await Promise.all([
      supabase.from("page_views").select("created_at").eq("creator_id", uid),
      supabase.from("earnings").select("amount, created_at, source").eq("creator_id", uid),
      supabase.from("subscriber_events").select("event_type, created_at").eq("creator_id", uid),
      supabase.from("social_analytics").select("*").eq("creator_id", uid),
    ]);

    // Aggregate by month
    const now = new Date();
    const monthlyViews: Record<string, number> = {};
    const monthlyEarnings: Record<string, number> = {};
    const monthlySubs: Record<string, number> = {};

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      monthlyViews[key] = 0;
      monthlyEarnings[key] = 0;
      monthlySubs[key] = 0;
    }

    (views || []).forEach(v => {
      const d = new Date(v.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (key in monthlyViews) monthlyViews[key]++;
    });

    (earnings || []).forEach(e => {
      const d = new Date(e.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (key in monthlyEarnings) monthlyEarnings[key] += Number(e.amount);
    });

    (subs || []).forEach(s => {
      const d = new Date(s.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (key in monthlySubs) monthlySubs[key] += s.event_type === "subscribe" ? 1 : -1;
    });

    const chartData = Object.keys(monthlyViews).map(key => {
      const [y, m] = key.split("-").map(Number);
      return {
        month: months[m],
        views: monthlyViews[key],
        earnings: monthlyEarnings[key],
        subscribers: monthlySubs[key],
      };
    });

    setViewsData(chartData);
    setEarningsData(chartData);
    setSubsData(chartData);
    setSocialStats(social || []);

    setTotals({
      earnings: (earnings || []).reduce((s, e) => s + Number(e.amount), 0),
      views: (views || []).length,
      subs: (subs || []).filter(s => s.event_type === "subscribe").length,
    });

    setLoading(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border h-16 flex items-center px-4">
        <div className="container mx-auto flex items-center gap-4">
          <Link to="/dashboard"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <img src={logo} alt="Verifiedly" className="h-7" />
          <span className="font-display font-semibold">Analytics</span>
        </div>
      </nav>

      <div className="container mx-auto py-8 px-4 max-w-5xl">
        <h1 className="text-3xl font-display font-bold mb-2">Analytics</h1>
        <p className="text-muted-foreground mb-8">Track your growth and performance</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs font-medium">Total Earnings</span>
            </div>
            <p className="text-3xl font-display font-bold">${totals.earnings.toLocaleString()}</p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Eye className="w-4 h-4" />
              <span className="text-xs font-medium">Total Profile Views</span>
            </div>
            <p className="text-3xl font-display font-bold">{totals.views.toLocaleString()}</p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs font-medium">Total Subscribers</span>
            </div>
            <p className="text-3xl font-display font-bold">{totals.subs.toLocaleString()}</p>
          </Card>
        </div>

        {/* Social Media Stats */}
        {socialStats.length > 0 && (
          <div className="mb-8">
            <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
              <Share2 className="w-5 h-5" /> Linked Social Accounts
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {socialStats.map(s => (
                <Card key={s.id} className="p-4">
                  <p className="text-xs text-muted-foreground font-medium capitalize">{s.platform}</p>
                  <p className="text-xl font-display font-bold">{(s.followers || 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">followers • {(s.clicks || 0)} link clicks</p>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-display font-semibold mb-4">Earnings Over Time</h3>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <AreaChart data={earningsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `$${v}`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="earnings" stroke="hsl(var(--foreground))" fill="hsl(var(--foreground) / 0.1)" strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </Card>

          <Card className="p-6">
            <h3 className="font-display font-semibold mb-4">Profile Views</h3>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <BarChart data={viewsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="views" fill="hsl(var(--foreground))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </Card>

          <Card className="p-6 lg:col-span-2">
            <h3 className="font-display font-semibold mb-4">Subscriber Growth</h3>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <LineChart data={subsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="subscribers" stroke="hsl(var(--foreground))" strokeWidth={2} dot={{ fill: "hsl(var(--foreground))", r: 4 }} />
              </LineChart>
            </ChartContainer>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
