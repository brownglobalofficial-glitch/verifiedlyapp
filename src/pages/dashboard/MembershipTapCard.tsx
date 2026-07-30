import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, CreditCard, Loader2, Nfc, Package, ScanLine, ShieldCheck, Truck } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import verifiedlyMark from "@/assets/verifiedly-v-mark.png";

type TapOrder = {
  id: string;
  status: string;
  amount_cents: number;
  order_source: string;
  tracking_number: string | null;
  tracking_url: string | null;
  created_at: string;
  printed_name: string | null;
  printed_title: string | null;
  printed_handle: string | null;
};

type CardForm = {
  printed_name: string;
  printed_title: string;
  shipping_name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: "US";
};

const estimatedShipWindow = String(import.meta.env.VITE_TAP_CARD_ESTIMATED_SHIP_WINDOW || "").trim();

const cleanPrintLine = (value: string, maximum: number) => value
  .replace(/[\u0000-\u001F\u007F]/g, " ")
  .replace(/\s+/g, " ")
  .slice(0, maximum);

const readFunctionError = async (error: unknown, data: unknown, fallback: string) => {
  if (data && typeof data === "object" && "error" in data && typeof (data as { error?: unknown }).error === "string") {
    return (data as { error: string }).error;
  }
  const context = error && typeof error === "object" && "context" in error
    ? (error as { context?: unknown }).context
    : null;
  if (context instanceof Response) {
    try {
      const payload = await context.clone().json();
      if (payload?.error && typeof payload.error === "string") return payload.error;
    } catch {
      // Use the normal error below.
    }
  }
  return error instanceof Error ? error.message : fallback;
};

const statusLabel = (status: string) => {
  if (status === "paid") return "Claim confirmed";
  if (status === "submitted") return "Submitted to production";
  if (status === "production") return "In production";
  if (status === "shipped") return "Shipped";
  if (status === "delivered") return "Delivered";
  if (status === "manual_review") return "Under review";
  if (status === "canceled" || status === "refunded") return "Canceled";
  return status.replace(/_/g, " ");
};

const MembershipTapCard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [annualMembership, setAnnualMembership] = useState(false);
  const [creditAvailable, setCreditAvailable] = useState(false);
  const [profile, setProfile] = useState<{ username: string; display_name: string | null; category: string | null } | null>(null);
  const [orders, setOrders] = useState<TapOrder[]>([]);
  const [previewApproved, setPreviewApproved] = useState(false);
  const [termsApproved, setTermsApproved] = useState(false);
  const [form, setForm] = useState<CardForm>({
    printed_name: "",
    printed_title: "",
    shipping_name: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "US",
  });

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login?next=/dashboard/tap-card");
      return;
    }

    await supabase.functions.invoke("check-subscription").catch(() => undefined);

    const [{ data: profileData }, { data: billingData }, { data: orderData }] = await Promise.all([
      supabase.from("profiles")
        .select("username, display_name, category, is_pro")
        .eq("id", session.user.id)
        .maybeSingle(),
      supabase.from("verifiedly_billing")
        .select("pro_status, pro_interval, annual_card_credit_available")
        .eq("user_id", session.user.id)
        .maybeSingle(),
      supabase.from("verifiedly_tap_card_orders")
        .select("id, status, amount_cents, order_source, tracking_number, tracking_url, created_at, printed_name, printed_title, printed_handle")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false }),
    ]);

    if (profileData?.username) {
      setProfile(profileData);
      setForm((current) => ({
        ...current,
        printed_name: current.printed_name || profileData.display_name || profileData.username,
        printed_title: current.printed_title || profileData.category || "Official profile",
        shipping_name: current.shipping_name || profileData.display_name || profileData.username,
      }));
    }

    const active = profileData?.is_pro === true
      || billingData?.pro_status === "active"
      || billingData?.pro_status === "trialing";
    setIsMember(active);
    setAnnualMembership(active && billingData?.pro_interval === "year");
    setCreditAvailable(billingData?.annual_card_credit_available === true);
    setOrders((orderData as TapOrder[] | null) ?? []);
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  const includedOrder = useMemo(
    () => orders.find((order) => order.order_source === "annual_included" || order.order_source === "manual_review_credit_conflict"),
    [orders],
  );

  const previewName = form.printed_name.trim() || "Your name";
  const previewTitle = form.printed_title.trim() || "Professional title";
  const previewHandle = profile?.username || "yourhandle";
  const profileUrl = `https://verifiedly.app/${previewHandle}`;
  const qrUrl = `https://quickchart.io/qr?size=360&margin=1&text=${encodeURIComponent(profileUrl)}`;
  const printValid = form.printed_name.trim().length >= 2
    && form.printed_title.trim().length >= 2
    && Boolean(profile?.username);
  const shippingValid = form.shipping_name.trim().length >= 2
    && form.line1.trim().length >= 2
    && form.city.trim().length >= 1
    && form.state.trim().length >= 2
    && form.postal_code.trim().length >= 2;
  const claimReady = isMember
    && annualMembership
    && creditAvailable
    && !includedOrder
    && estimatedShipWindow.length > 0
    && printValid
    && shippingValid
    && previewApproved
    && termsApproved
    && !claiming;

  const updatePrintField = (field: "printed_name" | "printed_title", value: string) => {
    setForm((current) => ({
      ...current,
      [field]: cleanPrintLine(value, field === "printed_name" ? 40 : 60),
    }));
    setPreviewApproved(false);
  };

  const claimCard = async () => {
    if (!claimReady) {
      toast({ title: "Complete and approve the included card details", variant: "destructive" });
      return;
    }

    setClaiming(true);
    try {
      const { data, error } = await supabase.functions.invoke("claim-membership-tap-card", {
        body: {
          ...form,
          preview_approved: true,
        },
      });
      if (error || data?.error) {
        throw new Error(await readFunctionError(error, data, "The included Tap Card could not be claimed."));
      }
      toast({
        title: data?.duplicate ? "Included Tap Card already claimed" : "Included Tap Card claimed",
        description: "Your approved card is in Verifiedly's manual fulfillment queue.",
      });
      await load();
    } catch (error) {
      toast({
        title: "Tap Card claim could not be completed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return <DashboardShell title="Included Tap Card"><div className="p-8 text-sm text-muted-foreground">Loading your Membership Tap Card…</div></DashboardShell>;
  }

  return (
    <DashboardShell title="Included Tap Card">
      <div className="mx-auto w-full max-w-6xl space-y-6 overflow-x-hidden px-3 py-6 sm:px-4 sm:py-9">
        <header className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-xs sm:tracking-[0.2em]">Your official profile, one tap away.</p>
          <h1 className="mt-2 break-words text-3xl font-display font-bold tracking-tight sm:text-4xl">Verifiedly Membership Tap Card</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            One personalized PVC NFC profile card is included with the first paid annual Membership term. Renewals do not include another card.
          </p>
        </header>

        {!isMember && (
          <Card className="rounded-3xl border-foreground bg-foreground p-5 text-background sm:p-7">
            <h2 className="font-display text-xl font-bold">Included with Verifiedly Membership</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-background/75">Start annual Membership to receive one first-term Tap Card, identity-verification access for eligible adults, analytics and priority support.</p>
            <Button asChild variant="secondary" className="mt-5 w-full whitespace-normal sm:w-auto"><Link to="/dashboard/membership">View Membership · $59.99/year</Link></Button>
          </Card>
        )}

        {isMember && !annualMembership && !includedOrder && (
          <Card className="rounded-3xl border p-5 sm:p-7">
            <h2 className="font-display text-xl font-bold">Annual Membership required for the included card</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">A legacy or non-annual plan does not automatically include a physical Tap Card. Your existing account access remains available.</p>
          </Card>
        )}

        {includedOrder && (
          <Card className="rounded-3xl border-foreground p-5 sm:p-7">
            <div className="flex min-w-0 items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Included card status</p>
                <h2 className="mt-2 break-words font-display text-xl font-bold">{statusLabel(includedOrder.status)}</h2>
                <p className="mt-2 break-words text-sm text-muted-foreground">{includedOrder.printed_name} · {includedOrder.printed_title} · @{includedOrder.printed_handle}</p>
                <p className="mt-1 text-xs text-muted-foreground">Claimed {new Date(includedOrder.created_at).toLocaleDateString()}</p>
              </div>
              <Package className="h-6 w-6 shrink-0" />
            </div>
            {includedOrder.tracking_url && (
              <a href={includedOrder.tracking_url} target="_blank" rel="noreferrer" className="mt-5 inline-flex max-w-full items-center gap-2 break-all text-sm font-medium underline underline-offset-4"><Truck className="h-4 w-4 shrink-0" />Track {includedOrder.tracking_number || "shipment"}</a>
            )}
          </Card>
        )}

        <section aria-label="Tap Card preview" className="min-w-0 rounded-[1.5rem] border border-foreground/10 bg-gradient-to-b from-muted/35 to-background p-3 shadow-sm sm:rounded-[2rem] sm:p-7">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Card preview</p>
            <p className="mt-1 text-sm text-muted-foreground">The locked white Verifiedly design opens your live official profile by NFC or QR.</p>
          </div>
          <div className="grid min-w-0 gap-5 lg:grid-cols-2">
            <div className="min-w-0">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Front</p>
              <div className="relative mx-auto aspect-[1.586/1] w-full max-w-[560px] overflow-hidden rounded-[1.1rem] border border-black/10 bg-white p-4 text-black shadow-[0_24px_70px_-34px_rgba(0,0,0,0.35)] sm:rounded-[1.6rem] sm:p-8">
                <div className="relative flex items-start justify-between gap-2">
                  <div><p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-black/60 sm:text-[10px] sm:tracking-[0.28em]">Verifiedly Tap</p><p className="mt-1 text-[7px] uppercase tracking-[0.12em] text-black/35 sm:text-[9px]">Official profile card</p></div>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/10 sm:h-10 sm:w-10"><Nfc className="h-4 w-4 sm:h-5 sm:w-5" /></div>
                </div>
                <div className="absolute bottom-4 left-4 right-4 sm:bottom-8 sm:left-8 sm:right-8">
                  <div className="max-w-[74%] min-w-0"><p className="truncate font-display text-[clamp(1rem,5.7vw,1.875rem)] font-bold leading-tight">{previewName}</p><p className="mt-0.5 truncate text-[9px] text-black/60 sm:text-sm">{previewTitle}</p><p className="mt-2 truncate text-[8px] font-medium tracking-[0.08em] text-black/45 sm:mt-4 sm:text-[10px]">@{previewHandle}</p></div>
                  <img src={verifiedlyMark} alt="Verifiedly V mark" className="absolute bottom-0 right-0 h-9 w-9 object-contain sm:h-14 sm:w-14" />
                </div>
              </div>
            </div>
            <div className="min-w-0">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Back</p>
              <div className="relative mx-auto flex aspect-[1.586/1] w-full max-w-[560px] items-center overflow-hidden rounded-[1.1rem] border border-black/10 bg-white p-4 text-black shadow-[0_24px_70px_-34px_rgba(0,0,0,0.35)] sm:rounded-[1.6rem] sm:p-8">
                <div className="grid w-full min-w-0 grid-cols-[72px_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-8">
                  <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center bg-white p-0.5 sm:h-36 sm:w-36 sm:p-1"><img src={qrUrl} alt="Preview QR code" className="h-full w-full" referrerPolicy="no-referrer" /></div>
                  <div className="min-w-0 pr-5 sm:pr-6"><div className="flex items-center gap-1.5 sm:gap-2"><ScanLine className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" /><p className="text-[9px] font-bold uppercase tracking-[0.1em] sm:text-xs">Tap or scan</p></div><p className="mt-2 break-all text-[8px] font-semibold leading-tight sm:mt-3 sm:text-sm">verifiedly.app/{previewHandle}</p><p className="mt-2 text-[7px] leading-snug text-black/45 sm:mt-5 sm:text-[9px]">Not a payment card or government-issued ID.</p></div>
                </div>
                <img src={verifiedlyMark} alt="" aria-hidden="true" className="absolute bottom-3 right-3 h-6 w-6 object-contain sm:bottom-5 sm:right-5 sm:h-8 sm:w-8" />
              </div>
            </div>
          </div>
        </section>

        {isMember && annualMembership && creditAvailable && !includedOrder && (
          <div className="grid min-w-0 gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="min-w-0 space-y-6">
              <Card className="rounded-3xl p-4 sm:p-7">
                <h2 className="font-display text-xl font-bold">1. Approve the printed details</h2>
                <div className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2">
                  <div><Label htmlFor="member-card-name">Name on card</Label><Input id="member-card-name" className="mt-2" value={form.printed_name} onChange={(event) => updatePrintField("printed_name", event.target.value)} maxLength={40} /></div>
                  <div><Label htmlFor="member-card-title">Professional title or role</Label><Input id="member-card-title" className="mt-2" value={form.printed_title} onChange={(event) => updatePrintField("printed_title", event.target.value)} maxLength={60} /></div>
                </div>
                <div className="mt-4 rounded-2xl border bg-muted/30 p-4 text-sm">Verifiedly handle: <strong>@{previewHandle}</strong></div>
                <div className="mt-5 flex items-start gap-3 rounded-2xl border p-4"><Checkbox id="member-preview-approved" checked={previewApproved} onCheckedChange={(value) => setPreviewApproved(value === true)} disabled={!printValid} className="mt-0.5" /><Label htmlFor="member-preview-approved" className="cursor-pointer text-xs font-normal leading-relaxed">I reviewed and approve the printed name, professional title and Verifiedly handle shown above.</Label></div>
              </Card>

              <Card className="rounded-3xl p-4 sm:p-7">
                <h2 className="font-display text-xl font-bold">2. U.S. shipping address</h2>
                <div className="mt-5 space-y-4">
                  <div><Label htmlFor="membership-shipping-name">Recipient name</Label><Input id="membership-shipping-name" className="mt-2" value={form.shipping_name} onChange={(event) => setForm({ ...form, shipping_name: event.target.value.slice(0, 100) })} /></div>
                  <div><Label htmlFor="membership-line1">Street address</Label><Input id="membership-line1" className="mt-2" value={form.line1} onChange={(event) => setForm({ ...form, line1: event.target.value.slice(0, 200) })} /></div>
                  <div><Label htmlFor="membership-line2">Apartment or suite <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="membership-line2" className="mt-2" value={form.line2} onChange={(event) => setForm({ ...form, line2: event.target.value.slice(0, 200) })} /></div>
                  <div className="grid gap-4 sm:grid-cols-3"><div><Label htmlFor="membership-city">City</Label><Input id="membership-city" className="mt-2" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value.slice(0, 100) })} /></div><div><Label htmlFor="membership-state">State</Label><Input id="membership-state" className="mt-2" value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value.slice(0, 100) })} /></div><div><Label htmlFor="membership-zip">ZIP code</Label><Input id="membership-zip" className="mt-2" value={form.postal_code} onChange={(event) => setForm({ ...form, postal_code: event.target.value.slice(0, 20) })} /></div></div>
                  <div className="rounded-2xl border bg-muted/30 px-4 py-3 text-sm">United States</div>
                </div>
              </Card>
            </div>

            <Card className="h-fit rounded-3xl border-foreground p-4 shadow-sm sm:p-7 lg:sticky lg:top-6">
              <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Included benefit</p><h2 className="mt-2 font-display text-xl font-bold">Claim your first-term Tap Card</h2></div><CreditCard className="h-5 w-5 shrink-0" /></div>
              <div className="mt-5 space-y-3 text-xs text-muted-foreground"><div className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />One personalized white PVC NFC card</div><div className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />Unique QR and NFC link to your live profile</div><div className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />Manual Verifiedly review and third-party fulfillment</div></div>
              <div className="mt-5 rounded-2xl border bg-muted/35 p-4 text-xs leading-relaxed text-muted-foreground"><p className="font-semibold text-foreground">Estimated shipping: {estimatedShipWindow || "Not configured"}</p><p className="mt-2">This is an estimate, not a guaranteed delivery date. Delay, cancellation, defect and replacement rules follow the posted policies.</p></div>
              <div className="mt-4 flex items-start gap-3 rounded-2xl bg-muted/50 p-4"><Checkbox id="membership-card-terms" checked={termsApproved} onCheckedChange={(value) => setTermsApproved(value === true)} className="mt-0.5" /><Label htmlFor="membership-card-terms" className="cursor-pointer text-xs font-normal leading-relaxed text-muted-foreground">I understand this card is included once with my first paid annual Membership term, is not a payment card or government ID, and will enter manual third-party fulfillment after review.</Label></div>
              <Button className="mt-5 min-h-12 w-full whitespace-normal" onClick={() => void claimCard()} disabled={!claimReady}>{claiming ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Claiming card…</> : "Claim included Tap Card"}</Button>
              {!estimatedShipWindow && <p className="mt-3 text-center text-xs text-muted-foreground">Claims remain closed until a manufacturer-supported shipping estimate is configured.</p>}
              <p className="mt-3 text-center text-[10px] leading-relaxed text-muted-foreground"><ShieldCheck className="mr-1 inline h-3 w-3" />Verifiedly is operated by BrownGlobal Holdings LLC.</p>
            </Card>
          </div>
        )}
      </div>
    </DashboardShell>
  );
};

export default MembershipTapCard;
