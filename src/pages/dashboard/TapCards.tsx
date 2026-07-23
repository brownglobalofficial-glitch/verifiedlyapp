import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Check, Copy, CreditCard, ExternalLink, Nfc, ShieldAlert } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
  material: "pvc";
  status: string;
  tap_count: number;
  last_tapped_at: string | null;
  tracking_url: string | null;
  created_at: string;
}

interface TapOrderRecord {
  id: string;
  material: "pvc";
  order_source: string;
  status: string;
  amount_cents: number;
  tracking_url: string | null;
  printed_name: string | null;
  printed_title: string | null;
  printed_handle: string | null;
  created_at: string;
}

const normalizeLine = (value: string, maximum: number) => value
  .replace(/[\u0000-\u001F\u007F]/g, " ")
  .replace(/\s+/g, " ")
  .slice(0, maximum);

const TapCards = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const initializedPrintFields = useRef(false);
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [billing, setBilling] = useState<BillingSummary | null>(null);
  const [cards, setCards] = useState<TapCardRecord[]>([]);
  const [orders, setOrders] = useState<TapOrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [previewApproved, setPreviewApproved] = useState(false);
  const [printedName, setPrintedName] = useState("");
  const [printedTitle, setPrintedTitle] = useState("");
  const [cardAction, setCardAction] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

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
        .select("id, material, order_source, status, amount_cents, tracking_url, printed_name, printed_title, printed_handle, created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false }),
    ]);

    const nextProfile = (profileResult.data || null) as ProfileSummary | null;
    setProfile(nextProfile);
    setBilling((billingResult.data || null) as BillingSummary | null);
    setCards((cardsResult.data || []) as TapCardRecord[]);
    setOrders((ordersResult.data || []) as TapOrderRecord[]);
    if (nextProfile && !initializedPrintFields.current) {
      setPrintedName(nextProfile.display_name || nextProfile.username);
      setPrintedTitle(nextProfile.category || "Official profile");
      initializedPrintFields.current = true;
    }
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (!checkout) return;
    if (checkout === "success") {
      toast({ title: "Tap Card order received", description: "Stripe is confirming payment. Your approved card details will appear in order history shortly." });
    }
    if (checkout === "cancelled") toast({ title: "Card checkout canceled" });
    setSearchParams({}, { replace: true });
    window.setTimeout(() => void load(), 1500);
  }, [load, searchParams, setSearchParams, toast]);

  const activePro = useMemo(
    () => ["active", "trialing"].includes(billing?.pro_status || "") || !!profile?.is_pro,
    [billing, profile],
  );
  const includedCard = activePro && billing?.pro_interval === "year" && billing.annual_card_credit_available;
  const profileUrl = profile ? `https://verifiedly.app/${profile.username}` : "https://verifiedly.app";
  const digitalQrUrl = `https://quickchart.io/qr?size=240&margin=1&text=${encodeURIComponent(profileUrl)}`;
  const previewName = printedName.trim() || "Your name";
  const previewTitle = printedTitle.trim() || "Professional title";
  const previewHandle = profile?.username || "yourhandle";
  const validPrintFields = printedName.trim().length >= 2 && printedTitle.trim().length >= 2;

  const updatePrintedName = (value: string) => {
    setPrintedName(normalizeLine(value, 40));
    setPreviewApproved(false);
  };

  const updatePrintedTitle = (value: string) => {
    setPrintedTitle(normalizeLine(value, 60));
    setPreviewApproved(false);
  };

  const orderCard = async () => {
    if (!TAP_CARD_ORDERS_ENABLED) {
      toast({ title: "Card ordering is not open yet", description: "Verifiedly is testing the PVC sample and manual fulfillment before accepting paid orders." });
      return;
    }
    if (!validPrintFields) {
      toast({ title: "Complete the card details", description: "Add the printed name and professional title.", variant: "destructive" });
      return;
    }
    if (!previewApproved || !agreed) {
      toast({ title: "Approve the preview and card terms first", variant: "destructive" });
      return;
    }

    setOrdering(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-tap-card-checkout", {
        body: {
          material: "pvc",
          printed_name: printedName.trim(),
          printed_title: printedTitle.trim(),
          preview_approved: true,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.url) throw new Error("Checkout did not return a secure URL.");
      window.location.assign(data.url);
    } catch (error) {
      toast({ title: "Card checkout could not open", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
      setOrdering(false);
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

  const copyText = async (value: string, key: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1600);
  };

  if (loading) return <DashboardShell title="Tap Cards"><div className="p-8 text-sm text-muted-foreground">Loading…</div></DashboardShell>;

  return (
    <DashboardShell title="Tap Cards">
      <div className="mx-auto max-w-6xl px-4 py-7 sm:py-10">
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Tap · scan · share</p>
          <h1 className="mt-3 text-3xl font-display font-bold tracking-tight">Your Verifiedly profile, on one branded PVC card.</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">Every card uses the same Verifiedly design, while your approved name, professional title, handle, QR code, and NFC link are personalized for your account.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <Card className="rounded-3xl p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Card customization</p>
                  <h2 className="mt-2 text-2xl font-display font-bold">Approve exactly what will be printed</h2>
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-xs">PVC · NFC · QR</span>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold">Name to print</span>
                  <Input className="mt-2" value={printedName} onChange={(event) => updatePrintedName(event.target.value)} maxLength={40} placeholder="Your name" />
                  <span className="mt-1 block text-right text-[10px] text-muted-foreground">{printedName.length}/40</span>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold">Professional title or role</span>
                  <Input className="mt-2" value={printedTitle} onChange={(event) => updatePrintedTitle(event.target.value)} maxLength={60} placeholder="Founder · Sports Media" />
                  <span className="mt-1 block text-right text-[10px] text-muted-foreground">{printedTitle.length}/60</span>
                </label>
              </div>

              <div className="mt-4 rounded-2xl border bg-muted/25 p-4">
                <p className="text-xs font-semibold">Verifiedly handle</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <code className="min-w-0 truncate text-sm">@{previewHandle}</code>
                  <span className="text-[10px] text-muted-foreground">Taken from your profile</span>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Front preview</p>
                  <div className="relative aspect-[1.586/1] overflow-hidden rounded-2xl bg-foreground p-5 text-background shadow-sm">
                    <div className="flex items-start justify-between">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-70">Verifiedly</p>
                      <Nfc className="h-6 w-6" />
                    </div>
                    <div className="absolute inset-x-5 bottom-12">
                      <p className="truncate font-display text-xl font-bold">{previewName}</p>
                      <p className="mt-1 truncate text-xs opacity-75">{previewTitle}</p>
                      <p className="mt-3 text-[10px] opacity-60">@{previewHandle}</p>
                    </div>
                    <p className="absolute bottom-4 left-5 text-[9px] uppercase tracking-[0.18em] opacity-55">Tap to view official profile</p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Back preview</p>
                  <div className="flex aspect-[1.586/1] items-center gap-4 overflow-hidden rounded-2xl border bg-background p-5 shadow-sm">
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border bg-white p-2">
                      <img src={digitalQrUrl} alt="Preview QR code" className="h-full w-full" referrerPolicy="no-referrer" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold">Tap or scan</p>
                      <p className="mt-2 break-all text-[10px] text-muted-foreground">verifiedly.app/t/assigned-after-payment</p>
                      <p className="mt-3 text-[9px] leading-relaxed text-muted-foreground">Not a payment card or government-issued ID. Current verification status appears on the live profile.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-2xl border p-4">
                <Checkbox id="preview-approved" checked={previewApproved} onCheckedChange={(value) => setPreviewApproved(value === true)} disabled={!validPrintFields} className="mt-0.5" />
                <Label htmlFor="preview-approved" className="cursor-pointer text-xs font-normal leading-relaxed">I reviewed the preview and approve <strong>{previewName}</strong>, <strong>{previewTitle}</strong>, and <strong>@{previewHandle}</strong> for printing. I understand these exact values are locked into the paid order.</Label>
              </div>
            </Card>

            <Card className="overflow-hidden rounded-3xl border-foreground/15 shadow-sm">
              <div className="flex items-center gap-4 p-5 sm:p-6">
                <img src={digitalQrUrl} alt="QR code for your Verifiedly profile" className="h-20 w-20 rounded-lg border bg-white p-1" referrerPolicy="no-referrer" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">Free digital profile card</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{profileUrl}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm"><a href={profileUrl} target="_blank" rel="noreferrer">Open profile <ExternalLink className="ml-1 h-3 w-3" /></a></Button>
                    <Button variant="ghost" size="sm" onClick={() => void copyText(profileUrl, "profile")}>{copied === "profile" ? <Check className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />}{copied === "profile" ? "Copied" : "Copy link"}</Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="rounded-3xl p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Manual fulfillment</p>
                  <h2 className="mt-2 text-2xl font-display font-bold">Verifiedly PVC Tap Card</h2>
                </div>
                {activePro && <span className="rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background">Pro pricing</span>}
              </div>

              {!TAP_CARD_ORDERS_ENABLED && (
                <div className="mt-5 rounded-2xl border border-dashed bg-muted/30 p-4">
                  <p className="text-sm font-semibold">Sample testing underway</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">The complete preview and order workflow is built, but paid ordering remains locked until BrownGlobal approves the physical sample, supplier terms, packaging, shipping, and replacement process.</p>
                </div>
              )}

              <div className="mt-5 rounded-2xl border-2 border-foreground p-5">
                <CreditCard className="h-5 w-5" />
                <h3 className="mt-3 font-semibold">One personalized PVC NFC card</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Same Verifiedly branding on every card, with your approved print details and a unique NFC/QR link to your profile.</p>
                <p className="mt-5 text-3xl font-display font-bold">{includedCard ? "$5.99" : activePro ? "$14.99" : "$24.99"}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{includedCard ? "Annual Pro card credit; price covers planned U.S. shipping and handling." : activePro ? "Pro member price with planned standard U.S. shipping." : "One-time planned price with standard U.S. shipping."}</p>
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-2xl bg-muted/50 p-4">
                <Checkbox id="tap-card-terms" checked={agreed} onCheckedChange={(value) => setAgreed(value === true)} className="mt-0.5" disabled={!TAP_CARD_ORDERS_ENABLED} />
                <Label htmlFor="tap-card-terms" className="cursor-pointer text-xs font-normal leading-relaxed text-muted-foreground">I understand this is a personalized, non-payment profile card. I am an adult purchaser or a parent/legal guardian authorizing the purchase and shipping for a minor's account. Personalized cards may be replaced only for defects or fulfillment errors, subject to the posted policy.</Label>
              </div>

              <Button className="mt-5 h-12 w-full rounded-xl" onClick={() => void orderCard()} disabled={!TAP_CARD_ORDERS_ENABLED || !validPrintFields || !previewApproved || !agreed || ordering}>
                {ordering ? "Opening secure checkout…" : TAP_CARD_ORDERS_ENABLED ? includedCard ? "Claim annual PVC card" : "Order PVC Tap Card" : "Ordering opens after sample approval"}
              </Button>

              {!activePro && <p className="mt-4 text-center text-xs text-muted-foreground"><Link to="/dashboard/pro" className="font-medium text-foreground underline">Upgrade to Verifiedly Pro</Link> for identity-verification eligibility, support, analytics, and card discounts.</p>}
              <p className="mt-4 text-center text-[11px] text-muted-foreground">Metal cards are intentionally held for a later phase after the PVC product is proven.</p>
            </Card>

            <div className="flex items-start gap-3 rounded-2xl border border-dashed p-4">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="text-xs leading-relaxed text-muted-foreground">The physical card is a profile-sharing accessory. It is not a payment card, government-issued identification, or proof that the person holding it owns the profile. The live Verifiedly profile is always the source of current verification status.</p>
            </div>

            {cards.length > 0 && (
              <Card className="rounded-3xl p-5 sm:p-6">
                <h2 className="font-display text-xl font-bold">Your physical cards</h2>
                <div className="mt-4 space-y-3">
                  {cards.map((card) => (
                    <div key={card.id} className="rounded-2xl border p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">PVC Tap Card</p>
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
                    <div key={order.id} className="py-4 text-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-medium">{order.printed_name || "PVC Tap Card"}</p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">{order.printed_title || "Official profile"} · @{order.printed_handle || profile?.username}</p>
                          <p className="mt-1 text-[11px] text-muted-foreground">{new Date(order.created_at).toLocaleDateString()} · {order.order_source.replaceAll("_", " ")}</p>
                        </div>
                        <div className="shrink-0 text-right"><p className="font-medium capitalize">{order.status.replaceAll("_", " ")}</p><p className="mt-0.5 text-xs text-muted-foreground">${(order.amount_cents / 100).toFixed(2)}</p></div>
                      </div>
                      {order.tracking_url && <Button asChild variant="link" className="mt-2 h-auto p-0 text-xs"><a href={order.tracking_url} target="_blank" rel="noreferrer">Track shipment</a></Button>}
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
