import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CreditCard, ExternalLink, Nfc, ShieldAlert, Sparkles } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const TAP_CARD_ORDERS_ENABLED = import.meta.env.VITE_TAP_CARD_ORDERS_ENABLED === "true";

interface ProfileSummary {
  username: string;
  display_name: string | null;
  category: string | null;
  avatar_url: string | null;
  is_pro: boolean | null;
}

interface BillingSummary {
  pro_status: string;
  pro_interval: string | null;
  annual_card_credit_available: boolean;
}

interface TapCardRecord {
  id: string;
  public_token: string;
  card_serial: string;
  material: "pvc" | "metal";
  status: string;
  tap_count: number;
  last_tapped_at: string | null;
  tracking_url: string | null;
  created_at: string;
}

interface TapOrderRecord {
  id: string;
  material: "pvc" | "metal";
  order_source: string;
  status: string;
  amount_cents: number;
  tracking_url: string | null;
  created_at: string;
}

const TapCards = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [billing, setBilling] = useState<BillingSummary | null>(null);
  const [cards, setCards] = useState<TapCardRecord[]>([]);
  const [orders, setOrders] = useState<TapOrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState<"pvc" | "metal" | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [cardAction, setCardAction] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login?next=/dashboard/cards");
      return;
    }

    const [profileResult, billingResult, cardsResult, ordersResult] = await Promise.all([
      supabase.from("profiles")
        .select("username, display_name, category, avatar_url, is_pro")
        .eq("id", session.user.id)
        .maybeSingle(),
      (supabase as any).from("verifiedly_billing")
        .select("pro_status, pro_interval, annual_card_credit_available")
        .eq("user_id", session.user.id)
        .maybeSingle(),
      (supabase as any).from("verifiedly_tap_cards")
        .select("id, public_token, card_serial, material, status, tap_count, last_tapped_at, tracking_url, created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false }),
      (supabase as any).from("verifiedly_tap_card_orders")
        .select("id, material, order_source, status, amount_cents, tracking_url, created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false }),
    ]);

    setProfile((profileResult.data || null) as ProfileSummary | null);
    setBilling((billingResult.data || null) as BillingSummary | null);
    setCards((cardsResult.data || []) as TapCardRecord[]);
    setOrders((ordersResult.data || []) as TapOrderRecord[]);
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (!checkout) return;
    if (checkout === "success") toast({ title: "Tap Card order received", description: "Your personalized card will appear here after Stripe confirms payment." });
    if (checkout === "cancelled") toast({ title: "Card checkout canceled" });
    setSearchParams({}, { replace: true });
    window.setTimeout(() => void load(), 1200);
  }, [load, searchParams, setSearchParams, toast]);

  const activePro = useMemo(
    () => ["active", "trialing"].includes(billing?.pro_status || "") || !!profile?.is_pro,
    [billing, profile],
  );
  const includedCard = activePro && billing?.pro_interval === "year" && billing.annual_card_credit_available;
  const profileUrl = profile ? `https://verifiedly.app/${profile.username}` : "https://verifiedly.app";
  const digitalQrUrl = `https://quickchart.io/qr?size=240&margin=1&text=${encodeURIComponent(profileUrl)}`;

  const orderCard = async (material: "pvc" | "metal") => {
    if (!TAP_CARD_ORDERS_ENABLED) {
      toast({ title: "Card ordering is not open yet", description: "Verifiedly is testing supplier samples and fulfillment before accepting paid card orders." });
      return;
    }
    if (!agreed) {
      toast({ title: "Confirm the card terms first", variant: "destructive" });
      return;
    }
    setOrdering(material);
    try {
      const { data, error } = await supabase.functions.invoke("create-tap-card-checkout", { body: { material } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.url) throw new Error("Checkout did not return a secure URL.");
      window.location.assign(data.url);
    } catch (error) {
      toast({ title: "Card checkout could not open", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
      setOrdering(null);
    }
  };

  const manageCard = async (cardId: string, action: "activate" | "lost" | "disable") => {
    setCardAction(`${cardId}:${action}`);
    try {
      const { error } = await (supabase as any).rpc("manage_verifiedly_tap_card", { p_card_id: cardId, p_action: action });
      if (error) throw error;
      toast({ title: action === "activate" ? "Tap Card activated" : action === "lost" ? "Tap Card marked lost" : "Tap Card disabled" });
      await load();
    } catch (error) {
      toast({ title: "Card could not be updated", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally {
      setCardAction(null);
    }
  };

  if (loading) return <DashboardShell title="Tap Cards"><div className="p-8 text-sm text-muted-foreground">Loading…</div></DashboardShell>;

  return (
    <DashboardShell title="Tap Cards">
      <div className="mx-auto max-w-6xl px-4 py-7 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Tap · scan · share</p>
              <h1 className="mt-3 text-3xl font-display font-bold tracking-tight">Your Verifiedly profile, on a card.</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">A Verifiedly Tap Card opens your live public profile through NFC. The printed QR code is a backup. The card never stores payment information, identity documents, or private credentials.</p>
            </div>

            <Card className="overflow-hidden rounded-3xl border-foreground/15 shadow-sm">
              <div className="relative aspect-[1.586/1] bg-foreground p-6 text-background">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-65">Verifiedly</p>
                    <h2 className="mt-8 text-2xl font-display font-bold">{profile?.display_name || profile?.username || "Your name"}</h2>
                    <p className="mt-1 text-sm opacity-70">{profile?.category || "Official profile"}</p>
                    <p className="mt-4 text-xs opacity-65">@{profile?.username}</p>
                  </div>
                  <Nfc className="h-7 w-7" />
                </div>
                <p className="absolute bottom-5 left-6 text-[10px] uppercase tracking-[0.2em] opacity-60">Tap to view profile</p>
              </div>
              <div className="flex items-center gap-4 p-4">
                <img src={digitalQrUrl} alt="QR code for your Verifiedly profile" className="h-20 w-20 rounded-lg border bg-white p-1" referrerPolicy="no-referrer" />
                <div className="min-w-0">
                  <p className="font-medium">Free digital profile card</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{profileUrl}</p>
                  <Button asChild variant="link" className="mt-1 h-auto p-0 text-xs"><a href={profileUrl} target="_blank" rel="noreferrer">Open profile <ExternalLink className="ml-1 h-3 w-3" /></a></Button>
                </div>
              </div>
            </Card>

            <div className="flex items-start gap-3 rounded-2xl border border-dashed p-4">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="text-xs leading-relaxed text-muted-foreground">The physical card is a profile-sharing accessory. It is not a payment card, government-issued identification, or proof that the person holding it owns the profile. Current verification status is shown only on the live Verifiedly profile.</p>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="rounded-3xl p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Physical cards</p>
                  <h2 className="mt-2 text-2xl font-display font-bold">Choose your Tap Card</h2>
                </div>
                {activePro && <span className="rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background">Pro pricing</span>}
              </div>

              {!TAP_CARD_ORDERS_ENABLED && (
                <div className="mt-5 rounded-2xl border border-dashed bg-muted/30 p-4">
                  <p className="text-sm font-semibold">Sample testing underway</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Ordering will open after BrownGlobal approves the supplier, sample quality, NFC performance, packaging, shipping, privacy terms, and replacement process. No card payment can be taken while this safeguard is off.</p>
                </div>
              )}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border p-4">
                  <CreditCard className="h-5 w-5" />
                  <h3 className="mt-3 font-semibold">PVC NFC card</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Standard wallet-size plastic card with NFC and a unique QR redirect.</p>
                  <p className="mt-4 text-xl font-display font-bold">{includedCard ? "$5.99 shipping" : activePro ? "$14.99" : "$24.99"}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{includedCard ? "Annual Pro card credit applied." : "Planned price with standard U.S. shipping."}</p>
                  <Button className="mt-4 w-full" onClick={() => void orderCard("pvc")} disabled={!TAP_CARD_ORDERS_ENABLED || !agreed || ordering !== null}>{ordering === "pvc" ? "Opening checkout…" : TAP_CARD_ORDERS_ENABLED ? includedCard ? "Claim included card" : "Order PVC card" : "Coming after samples"}</Button>
                </div>

                <div className="rounded-2xl border-2 border-foreground p-4">
                  <Sparkles className="h-5 w-5" />
                  <h3 className="mt-3 font-semibold">Metal NFC card</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Premium metal version, subject to supplier sample and NFC reliability approval.</p>
                  <p className="mt-4 text-xl font-display font-bold">{includedCard ? "$55.98" : activePro ? "$69.99" : "$89.99"}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{includedCard ? "Annual PVC credit applied toward the planned metal upgrade." : "Planned price with standard U.S. shipping."}</p>
                  <Button variant="outline" className="mt-4 w-full" onClick={() => void orderCard("metal")} disabled={!TAP_CARD_ORDERS_ENABLED || !agreed || ordering !== null}>{ordering === "metal" ? "Opening checkout…" : TAP_CARD_ORDERS_ENABLED ? "Order metal card" : "Coming after samples"}</Button>
                </div>
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-2xl bg-muted/50 p-4">
                <Checkbox id="tap-card-terms" checked={agreed} onCheckedChange={(value) => setAgreed(value === true)} className="mt-0.5" disabled={!TAP_CARD_ORDERS_ENABLED} />
                <Label htmlFor="tap-card-terms" className="cursor-pointer text-xs font-normal leading-relaxed text-muted-foreground">I understand this is a personalized, non-payment profile card. I am an adult purchaser or a parent/legal guardian authorizing the purchase and shipping for a minor's account. Personalized cards may be replaced only for defects or fulfillment errors, subject to the posted policy.</Label>
              </div>

              {!activePro && <p className="mt-4 text-center text-xs text-muted-foreground"><Link to="/dashboard/pro" className="font-medium text-foreground underline">Upgrade to Verifiedly Pro</Link> for verification eligibility, support, analytics, and card discounts.</p>}
            </Card>

            {cards.length > 0 && (
              <Card className="rounded-3xl p-5 sm:p-6">
                <h2 className="font-display text-xl font-bold">Your physical cards</h2>
                <div className="mt-4 space-y-3">
                  {cards.map((card) => (
                    <div key={card.id} className="rounded-2xl border p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium capitalize">{card.material} Tap Card</p>
                          <p className="mt-1 text-xs text-muted-foreground">{card.card_serial} · <span className="capitalize">{card.status.replaceAll("_", " ")}</span></p>
                        </div>
                        <span className="rounded-full bg-muted px-3 py-1 text-xs">{card.tap_count.toLocaleString()} taps</span>
                      </div>
                      <p className="mt-3 break-all text-[11px] text-muted-foreground">verifiedly.app/t/{card.public_token}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {card.status !== "active" && !["lost", "replaced", "canceled", "manual_review"].includes(card.status) && <Button size="sm" onClick={() => void manageCard(card.id, "activate")} disabled={cardAction !== null}>{cardAction === `${card.id}:activate` ? "Activating…" : "Activate"}</Button>}
                        {card.status === "active" && <Button size="sm" variant="outline" onClick={() => void manageCard(card.id, "lost")} disabled={cardAction !== null}>Mark lost</Button>}
                        {!["disabled", "lost", "canceled"].includes(card.status) && <Button size="sm" variant="ghost" onClick={() => void manageCard(card.id, "disable")} disabled={cardAction !== null}>Disable</Button>}
                        {card.tracking_url && <Button asChild size="sm" variant="outline"><a href={card.tracking_url} target="_blank" rel="noreferrer">Track shipment</a></Button>}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {orders.length > 0 && (
              <Card className="rounded-3xl p-5 sm:p-6">
                <h2 className="font-display text-xl font-bold">Order history</h2>
                <div className="mt-4 divide-y">
                  {orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                      <div><p className="font-medium capitalize">{order.material} card</p><p className="mt-0.5 text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()} · {order.order_source.replaceAll("_", " ")}</p></div>
                      <div className="text-right"><p className="font-medium capitalize">{order.status.replaceAll("_", " ")}</p><p className="mt-0.5 text-xs text-muted-foreground">${(order.amount_cents / 100).toFixed(2)}</p></div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
};

export default TapCards;
