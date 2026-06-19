import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, ShoppingBag, Users, Loader2, ExternalLink, Check, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Purchase = {
  id: string;
  product_id: string | null;
  product_name: string | null;
  product_image_url: string | null;
  amount: number;
  status: string;
  created_at: string;
  creator_id: string;
};

type Sub = {
  subscription_id: string;
  name: string;
  description: string | null;
  price: number;
  creator_id: string;
  creator_username: string;
  creator_display: string;
  perks: { perk_name: string; perk_description: string | null; unlock_url: string | null; perk_type: string | null }[];
  subscribed_at: string;
};

export default function Purchases() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [creators, setCreators] = useState<Record<string, { username: string; display_name: string | null }>>({});

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const uid = session.user.id;

      // Digital purchases
      const { data: p } = await supabase
        .from("purchases")
        .select("id, product_id, product_name, product_image_url, amount, status, created_at, creator_id")
        .eq("buyer_id", uid)
        .eq("status", "completed")
        .order("created_at", { ascending: false });
      setPurchases((p as any) || []);

      // Subscriptions I've joined (latest event per subscription is 'subscribe')
      const { data: events } = await supabase
        .from("subscriber_events")
        .select("subscription_id, event_type, created_at, creator_id")
        .eq("subscriber_id", uid)
        .order("created_at", { ascending: false });

      const latestBySub = new Map<string, any>();
      (events || []).forEach((ev: any) => {
        if (!ev.subscription_id) return;
        if (!latestBySub.has(ev.subscription_id)) latestBySub.set(ev.subscription_id, ev);
      });
      const activeSubIds = [...latestBySub.entries()]
        .filter(([, ev]) => ev.event_type === "subscribe")
        .map(([id]) => id);

      let subRows: Sub[] = [];
      if (activeSubIds.length > 0) {
        const { data: subData } = await supabase
          .from("subscriptions")
          .select("id, name, description, price, creator_id")
          .in("id", activeSubIds);
        const { data: perkData } = await supabase
          .from("subscription_perks")
          .select("subscription_id, perk_name, perk_description, unlock_url, perk_type, sort_order")
          .in("subscription_id", activeSubIds)
          .order("sort_order", { ascending: true });
        const perksBy: Record<string, any[]> = {};
        (perkData || []).forEach((pk: any) => {
          (perksBy[pk.subscription_id] = perksBy[pk.subscription_id] || []).push(pk);
        });
        const creatorIds = [...new Set((subData || []).map((s: any) => s.creator_id))];
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, username, display_name")
          .in("id", creatorIds);
        const profMap: Record<string, any> = {};
        (profs || []).forEach((pr: any) => { profMap[pr.id] = pr; });

        subRows = (subData || []).map((s: any) => ({
          subscription_id: s.id,
          name: s.name,
          description: s.description,
          price: Number(s.price),
          creator_id: s.creator_id,
          creator_username: profMap[s.creator_id]?.username || "creator",
          creator_display: profMap[s.creator_id]?.display_name || profMap[s.creator_id]?.username || "Creator",
          perks: perksBy[s.id] || [],
          subscribed_at: latestBySub.get(s.id).created_at,
        }));
      }
      setSubs(subRows);

      // Resolve creator names for purchases too
      const purchaseCreatorIds = [
        ...new Set(((p as any) || []).map((x: any) => x.creator_id as string)),
      ] as string[];
      if (purchaseCreatorIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, username, display_name")
          .in("id", purchaseCreatorIds);
        const map: Record<string, any> = {};
        (profs || []).forEach((pr: any) => { map[pr.id] = pr; });
        setCreators(map);
      }

      setLoading(false);
    })();
  }, []);

  const download = async (productId: string) => {
    setDownloading(productId);
    try {
      const { data, error } = await supabase.functions.invoke("download-product", {
        body: { productId },
      });
      if (error) throw error;
      if (!data?.url) throw new Error("No download link");
      window.location.href = data.url;
    } catch (e: any) {
      toast({
        title: "Download failed",
        description: e.message || "Couldn't generate download link.",
        variant: "destructive",
      });
    } finally {
      setDownloading(null);
    }
  };

  return (
    <DashboardShell title="My purchases">
      <div className="container mx-auto max-w-5xl py-8 px-4 space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">My library</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Everything you've bought or subscribed to across Verifiedly.
          </p>
        </div>

        {/* Digital products */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-display font-semibold">Digital items ({purchases.length})</h2>
          </div>
          {loading ? (
            <Card className="p-6 text-sm text-muted-foreground">Loading…</Card>
          ) : purchases.length === 0 ? (
            <Card className="p-6 text-sm text-muted-foreground">
              Nothing yet.{" "}
              <Link to="/explore" className="underline">Browse creators</Link> to find products.
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {purchases.map((p) => {
                const creator = creators[p.creator_id];
                return (
                  <Card key={p.id} className="p-4 flex gap-3">
                    <div className="w-16 h-16 rounded-md bg-muted shrink-0 overflow-hidden">
                      {p.product_image_url && (
                        <img src={p.product_image_url} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{p.product_name || "Untitled"}</p>
                      {creator && (
                        <Link
                          to={`/${creator.username}`}
                          className="text-xs text-muted-foreground hover:underline inline-flex items-center gap-1"
                        >
                          @{creator.username} <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-[10px]">
                          {Number(p.amount) === 0 ? "Free" : `$${Number(p.amount).toFixed(2)}`}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(p.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {p.product_id && (
                        <Button
                          size="sm"
                          className="mt-2 gap-1"
                          onClick={() => download(p.product_id!)}
                          disabled={downloading === p.product_id}
                        >
                          {downloading === p.product_id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Download className="w-3 h-3" />
                          )}
                          Download
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Subscriptions */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-display font-semibold">Active subscriptions ({subs.length})</h2>
          </div>
          {loading ? null : subs.length === 0 ? (
            <Card className="p-6 text-sm text-muted-foreground">
              You haven't subscribed to any creators yet.
            </Card>
          ) : (
            <div className="space-y-3">
              {subs.map((s) => (
                <Card key={s.subscription_id} className="p-5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="font-display font-semibold">{s.name}</p>
                      <Link
                        to={`/${s.creator_username}`}
                        className="text-xs text-muted-foreground hover:underline inline-flex items-center gap-1"
                      >
                        {s.creator_display} (@{s.creator_username}) <ExternalLink className="w-3 h-3" />
                      </Link>
                      {s.description && (
                        <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
                      )}
                    </div>
                    <Badge>${s.price.toFixed(2)}/mo</Badge>
                  </div>
                  {s.perks.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
                        Your perks
                      </p>
                      <ul className="space-y-1.5">
                        {s.perks.map((pk, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            {pk.perk_type === "community" ? (
                              <Users className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
                            ) : (
                              <Gift className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
                            )}
                            <div className="min-w-0 flex-1">
                              <span className="font-medium">{pk.perk_name}</span>
                              {pk.perk_description && (
                                <span className="text-muted-foreground">
                                  {" "}— {pk.perk_description}
                                </span>
                              )}
                              {pk.unlock_url && (
                                <div className="mt-1">
                                  <Button asChild size="sm" variant="outline" className="h-7 text-xs gap-1">
                                    <a href={pk.unlock_url} target="_blank" rel="noreferrer noopener">
                                      Open <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </Button>
                                </div>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}