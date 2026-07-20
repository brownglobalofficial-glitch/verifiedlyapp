import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, DollarSign, Users, Eye, Share2, MousePointerClick, LinkIcon } from "lucide-react";
import logo from "@/assets/verifiedly-logo.webp";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, LineChart, Line } from "recharts";
import TierLock from "@/components/TierLock";

const chartConfig = {
  earnings: { label: "Earnings", color: "hsl(var(--foreground))" },
  views: { label: "Views", color: "hsl(var(--muted-foreground))" },
  subscribers: { label: "Subscribers", color: "hsl(var(--foreground))" },
  clicks: { label: "Clicks", color: "hsl(var(--foreground))" },
};

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type DateRange = "7" | "30" | "90" | "all";

const RANGES: { value: DateRange; label: string }[] = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "all", label: "All time" },
];

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [range, setRange] = useState<DateRange>("30");
  const [viewsData, setViewsData] = useState<any[]>([]);
  const [earningsData, setEarningsData] = useState<any[]>([]);
  const [subsData, setSubsData] = useState<any[]>([]);
  const [socialStats, setSocialStats] = useState<any[]>([]);
  const [linkStats, setLinkStats] = useState<{ id: string; title: string; clicks: number; ctr: number }[]>([]);
  const [totalLinkClicks, setTotalLinkClicks] = useState(0);
  const [totals, setTotals] = useState({ earnings: 0, views: 0, subs: 0 });
  const [userTier, setUserTier] = useState<"free" | "pro" | "elite">("free");
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/login"); return; }
      setUserId(session.user.id);
      fetchAnalytics(session.user.id, range);
      supabase.from("profiles").select("is_pro,is_elite").eq("id", session.user.id).maybeSingle()
        .then(({ data }) => {
          if (data?.is_elite) setUserTier("elite");
          else if (data?.is_pro) setUserTier("pro");
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => {
    if (userId) fetchAnalytics(userId, range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const fetchAnalytics = async (uid: string, currentRange: DateRange) => {
    setLoading(true);
    const days = currentRange === "all" ? null : Number(currentRange);
    const sinceIso = days ? new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString() : null;

    const applyRange = <T extends { gte: (col: string, v: string) => T }>(q: T) =>
      sinceIso ? q.gte("created_at", sinceIso) : q;

    const [{ data: views }, { data: earnings }, { data: subs }, { data: social }, { data: bioLinks }, { data: linkClicks }] = await Promise.all([
      applyRange(supabase.from("page_views").select("created_at").eq("creator_id", uid) as any),
      applyRange(supabase.from("earnings").select("amount, created_at, source").eq("creator_id", uid) as any),
      applyRange(supabase.from("subscriber_events").select("event_type, created_at").eq("creator_id", uid) as any),
      supabase.from("social_analytics").select("*").eq("creator_id", uid),
      supabase.from("bio_links").select("id, title, clicks").eq("creator_id", uid),
      applyRange(supabase.from("link_clicks").select("link_id, created_at").eq("creator_id", uid) as any),
    ]);

    // Per-link analytics — use link_clicks within range when filtered, else fallback to total clicks
    const totalViews = (views || []).length;
    const clickCountByLink: Record<string, number> = {};
    if (sinceIso) {
      (linkClicks || []).forEach((c: any) => {
        clickCountByLink[c.link_id] = (clickCountByLink[c.link_id] || 0) + 1;
      });
    }
    const links = (bioLinks || [])
      .map((l) => {
        const clicks = sinceIso ? (clickCountByLink[l.id] || 0) : (l.clicks || 0);
        return {
          id: l.id,
          title: l.title,
          clicks,
          ctr: totalViews > 0 ? (clicks / totalViews) * 100 : 0,
        };
      })
      .sort((a, b) => b.clicks - a.clicks);
    setLinkStats(links);
    setTotalLinkClicks(links.reduce((s, l) => s + l.clicks, 0));

    // Decide bucketing: daily for short ranges, monthly for long
    const useDaily = days !== null && days <= 30;
    const buckets: Record<string, number> = {};
    const earnBuckets: Record<string, number> = {};
    const subBuckets: Record<string, number> = {};
    const labels: string[] = [];

    if (useDaily) {
      for (let i = days! - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().slice(0, 10);
        buckets[key] = 0; earnBuckets[key] = 0; subBuckets[key] = 0;
        labels.push(`${d.getMonth() + 1}/${d.getDate()}`);
      }
    } else {
      const monthsBack = days ? Math.max(1, Math.ceil(days / 30)) : 12;
      const now = new Date();
      for (let i = monthsBack - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        buckets[key] = 0; earnBuckets[key] = 0; subBuckets[key] = 0;
        labels.push(months[d.getMonth()]);
      }
    }

    const keyOf = (iso: string) => {
      const d = new Date(iso);
      return useDaily ? d.toISOString().slice(0, 10) : `${d.getFullYear()}-${d.getMonth()}`;
    };

    (views || []).forEach((v: any) => { const k = keyOf(v.created_at); if (k in buckets) buckets[k]++; });
    (earnings || []).forEach((e: any) => { const k = keyOf(e.created_at); if (k in earnBuckets) earnBuckets[k] += Number(e.amount); });
    (subs || []).forEach((s: any) => { const k = keyOf(s.created_at); if (k in subBuckets) subBuckets[k] += s.event_type === "subscribe" ? 1 : -1; });

    const orderedKeys = Object.keys(buckets);
    const chartData = orderedKeys.map((key, i) => ({
      month: labels[i],
      views: buckets[key],
      earnings: earnBuckets[key],
      subscribers: subBuckets[key],
    }));

    setViewsData(chartData);
    setEarningsData(chartData);
    setSubsData(chartData);
    setSocialStats(social || []);

    setTotals({
      earnings: (earnings || []).reduce((s: number, e: any) => s + Number(e.amount), 0),
      views: (views || []).length,
      subs: (subs || []).filter((s: any) => s.event_type === "subscribe").length,
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
        <TierLock
          requires="pro"
          userTier={userTier}
          title="Advanced analytics"
          description="Detailed earnings, audience, and link analytics are available on Verifiedly Pro."
        >
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold mb-2">Analytics</h1>
            <p className="text-muted-foreground">Track your growth and performance</p>
          </div>
          <div className="flex items-center gap-1 p-1 bg-secondary rounded-lg w-fit">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  range === r.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

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

        {/* Link Analytics */}
        <div className="mb-8">
          <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
            <LinkIcon className="w-5 h-5" /> Link Performance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Card className="p-5">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <MousePointerClick className="w-4 h-4" />
                <span className="text-xs font-medium">Total Link Clicks</span>
              </div>
              <p className="text-3xl font-display font-bold">{totalLinkClicks.toLocaleString()}</p>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <LinkIcon className="w-4 h-4" />
                <span className="text-xs font-medium">Average CTR</span>
              </div>
              <p className="text-3xl font-display font-bold">
                {totals.views > 0 ? ((totalLinkClicks / totals.views) * 100).toFixed(1) : "0.0"}%
              </p>
            </Card>
          </div>

          {linkStats.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card className="p-6">
                <h4 className="font-display font-semibold mb-4">Top Links by Clicks</h4>
                <ChartContainer config={chartConfig} className="h-[260px] w-full">
                  <BarChart data={linkStats.slice(0, 8)} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis
                      type="category"
                      dataKey="title"
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                      width={100}
                      tickFormatter={(v) => (v.length > 14 ? `${v.slice(0, 14)}…` : v)}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="clicks" fill="hsl(var(--foreground))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
              </Card>

              <Card className="p-6">
                <h4 className="font-display font-semibold mb-4">All Links</h4>
                <div className="space-y-2 max-h-[260px] overflow-y-auto">
                  {linkStats.map((l, i) => (
                    <div key={l.id} className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs text-muted-foreground w-5">#{i + 1}</span>
                        <span className="text-sm font-medium truncate">{l.title}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                        <span className="flex items-center gap-1">
                          <MousePointerClick className="w-3 h-3" />
                          {l.clicks.toLocaleString()}
                        </span>
                        <span className="font-mono">{l.ctr.toFixed(1)}% CTR</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ) : (
            <Card className="p-8 text-center text-sm text-muted-foreground mb-6">
              No bio links yet. Add links on the Manage Links page to see analytics here.
            </Card>
          )}
        </div>

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
        </TierLock>
      </div>
    </div>
  );
};

export default Analytics;
