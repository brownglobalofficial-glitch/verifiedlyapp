import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, CreditCard, Loader2, Package, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type Order = {
  id: string;
  status: string;
  amount_cents: number;
  order_source: string;
  tracking_number: string | null;
  tracking_url: string | null;
  created_at: string;
  printed_name: string | null;
  printed_handle: string | null;
};

type Tier = "annual_free" | "pro" | "retail";

const priceLabel = (tier: Tier) => tier === "annual_free" ? "Free" : tier === "pro" ? "$12" : "$19";
const statusLabel = (s: string) =>
  s === "paid" ? "Confirmed" : s === "submitted" ? "Submitted to production"
  : s === "production" ? "In production" : s === "shipped" ? "Shipped"
  : s === "delivered" ? "Delivered" : s === "manual_review" ? "Under review"
  : s === "canceled" || s === "refunded" ? "Canceled" : s;

const TapCard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tier, setTier] = useState<Tier>("retail");
  const [profile, setProfile] = useState<{ username: string; display_name: string | null } | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [form, setForm] = useState({
    printed_name: "", printed_title: "", printed_handle: "",
    shipping_name: "", line1: "", line2: "", city: "", state: "", postal_code: "", country: "US",
  });

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/login?next=/dashboard/tap-card"); return; }
    const [{ data: p }, { data: b }, { data: o }] = await Promise.all([
      supabase.from("profiles").select("username, display_name").eq("id", session.user.id).maybeSingle(),
      supabase.from("verifiedly_billing").select("pro_status, pro_interval, annual_card_credit_available").eq("user_id", session.user.id).maybeSingle(),
      supabase.from("verifiedly_tap_card_orders").select("id, status, amount_cents, order_source, tracking_number, tracking_url, created_at, printed_name, printed_handle").eq("user_id", session.user.id).order("created_at", { ascending: false }),
    ]);
    if (p) {
      setProfile(p as { username: string; display_name: string | null });
      setForm((f) => ({
        ...f,
        printed_name: f.printed_name || p.display_name || "",
        printed_handle: f.printed_handle || p.username || "",
        shipping_name: f.shipping_name || p.display_name || "",
      }));
    }
    const isPro = b?.pro_status === "active" || b?.pro_status === "trialing";
    setTier(isPro && b?.pro_interval === "year" && b?.annual_card_credit_available ? "annual_free" : isPro ? "pro" : "retail");
    setOrders((o as Order[] | null) ?? []);
    setLoading(false);
  }, [navigate]);

  const confirmSession = useCallback(async (session_id: string) => {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("confirm-tap-checkout", { body: { session_id } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Order placed", description: "We'll ship your Verifiedly Tap card soon." });
      await load();
    } catch (e) {
      toast({ title: "Could not confirm order", description: e instanceof Error ? e.message : "Try refreshing.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }, [load, toast]);

  useEffect(() => {
    void (async () => {
      await load();
      const success = searchParams.get("checkout") === "success";
      const sid = searchParams.get("session_id");
      if (success && sid) {
        setSearchParams({}, { replace: true });
        await confirmSession(sid);
      } else if (searchParams.get("checkout") === "cancelled") {
        setSearchParams({}, { replace: true });
      }
    })();
  }, [load, confirmSession, searchParams, setSearchParams]);

  const submit = async () => {
    if (!form.printed_name.trim() || !form.printed_title.trim() || !form.printed_handle.trim()) {
      toast({ title: "Fill in the card details", variant: "destructive" }); return;
    }
    if (!form.shipping_name.trim() || !form.line1.trim() || !form.city.trim() || !form.postal_code.trim() || !form.country.trim()) {
      toast({ title: "Fill in the shipping address", variant: "destructive" }); return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-tap-checkout", { body: form });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.free) {
        toast({ title: "Free Tap card claimed", description: "Your annual credit was used. We'll ship it soon." });
        await load();
      } else if (data?.url) {
        window.location.assign(data.url);
      }
    } catch (e) {
      toast({ title: "Order could not start", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <DashboardShell title="Verifiedly Tap"><div className="p-8 text-sm text-muted-foreground">Loading…</div></DashboardShell>;

  return (
    <DashboardShell title="Verifiedly Tap">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8 space-y-6">
        <Card className="rounded-3xl border-foreground/10 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background"><CreditCard className="h-5 w-5" /></div>
            <div className="flex-1">
              <h1 className="text-2xl font-display font-bold">Verifiedly Tap</h1>
              <p className="mt-1 text-sm text-muted-foreground">An NFC card that opens your Verifiedly profile with a tap. Perfect for handing to anyone.</p>
            </div>
          </div>
          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-3xl font-display font-bold">{priceLabel(tier)}</span>
            <span className="text-sm text-muted-foreground">
              {tier === "annual_free" ? "included with your annual Pro plan" : tier === "pro" ? "Pro member price (retail $19)" : "one-time"}
            </span>
          </div>
          {tier === "retail" && (
            <p className="mt-3 text-xs text-muted-foreground">Get it for $12 with Verifiedly Pro, or free with the annual plan.</p>
          )}

          <div className="mt-6 space-y-4">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Printed on the card</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><Label htmlFor="pname">Name</Label><Input id="pname" value={form.printed_name} onChange={(e) => setForm({ ...form, printed_name: e.target.value })} maxLength={40} /></div>
                <div><Label htmlFor="ptitle">Title / role</Label><Input id="ptitle" value={form.printed_title} onChange={(e) => setForm({ ...form, printed_title: e.target.value })} maxLength={60} placeholder="e.g. Photographer" /></div>
              </div>
              <div><Label htmlFor="phandle">Verifiedly handle</Label><Input id="phandle" value={form.printed_handle} onChange={(e) => setForm({ ...form, printed_handle: e.target.value.toLowerCase() })} maxLength={40} /></div>
              <p className="text-xs text-muted-foreground">Your card will link to verifiedly.app/{form.printed_handle || profile?.username}</p>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Shipping address</p>
              <div><Label htmlFor="ship-name">Recipient name</Label><Input id="ship-name" value={form.shipping_name} onChange={(e) => setForm({ ...form, shipping_name: e.target.value })} /></div>
              <div><Label htmlFor="line1">Street address</Label><Input id="line1" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} /></div>
              <div><Label htmlFor="line2">Apt / suite (optional)</Label><Input id="line2" value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} /></div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div><Label htmlFor="city">City</Label><Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
                <div><Label htmlFor="state">State / region</Label><Input id="state" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
                <div><Label htmlFor="postal">Postal code</Label><Input id="postal" value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} /></div>
              </div>
              <div><Label htmlFor="country">Country (2-letter code)</Label><Input id="country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value.toUpperCase() })} maxLength={2} /></div>
            </div>

            <Button className="h-12 w-full rounded-xl" onClick={() => void submit()} disabled={submitting}>
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Working…</> : tier === "annual_free" ? "Claim free Tap card" : `Continue to checkout · ${priceLabel(tier)}`}
            </Button>
          </div>
        </Card>

        {orders.length > 0 && (
          <Card className="rounded-3xl border-foreground/10 p-6 sm:p-8">
            <h2 className="text-lg font-display font-bold">Your orders</h2>
            <ul className="mt-4 space-y-3">
              {orders.map((o) => (
                <li key={o.id} className="flex items-start justify-between gap-4 rounded-xl border border-border/60 p-4 text-sm">
                  <div>
                    <p className="font-medium">{o.printed_name} · @{o.printed_handle}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()} · {o.amount_cents === 0 ? "Free" : `$${(o.amount_cents / 100).toFixed(2)}`}</p>
                    {o.tracking_url && <a href={o.tracking_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs underline"><Truck className="h-3 w-3" /> Track {o.tracking_number}</a>}
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium">
                    {o.status === "delivered" ? <Check className="h-3 w-3" /> : <Package className="h-3 w-3" />}
                    {statusLabel(o.status)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
};

export default TapCard;