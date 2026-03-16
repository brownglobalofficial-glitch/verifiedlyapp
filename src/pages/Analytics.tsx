import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, DollarSign, Users, Eye } from "lucide-react";
import logo from "@/assets/verifiedly-logo.webp";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, LineChart, Line, ResponsiveContainer } from "recharts";

// Mock data - in production this would come from real analytics tables
const generateMockData = () => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const data = [];
  for (let i = 11; i >= 0; i--) {
    const monthIdx = (now.getMonth() - i + 12) % 12;
    data.push({
      month: months[monthIdx],
      earnings: Math.floor(Math.random() * 500 + 50),
      views: Math.floor(Math.random() * 2000 + 200),
      subscribers: Math.floor(Math.random() * 30 + 5),
    });
  }
  return data;
};

const chartConfig = {
  earnings: { label: "Earnings", color: "hsl(var(--foreground))" },
  views: { label: "Views", color: "hsl(var(--muted-foreground))" },
  subscribers: { label: "Subscribers", color: "hsl(var(--foreground))" },
};

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [data] = useState(generateMockData);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/login"); return; }
      setLoading(false);
    });
  }, [navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;

  const totalEarnings = data.reduce((s, d) => s + d.earnings, 0);
  const totalViews = data.reduce((s, d) => s + d.views, 0);
  const totalSubs = data.reduce((s, d) => s + d.subscribers, 0);

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
            <p className="text-3xl font-display font-bold">${totalEarnings.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-600" /> +12% from last period
            </p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Eye className="w-4 h-4" />
              <span className="text-xs font-medium">Total Views</span>
            </div>
            <p className="text-3xl font-display font-bold">{totalViews.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-600" /> +8% from last period
            </p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs font-medium">Total Subscribers</span>
            </div>
            <p className="text-3xl font-display font-bold">{totalSubs.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-600" /> +15% from last period
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-display font-semibold mb-4">Earnings Over Time</h3>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <AreaChart data={data}>
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
              <BarChart data={data}>
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
              <LineChart data={data}>
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
