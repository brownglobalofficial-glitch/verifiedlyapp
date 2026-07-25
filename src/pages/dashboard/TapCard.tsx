import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Check,
  ChevronRight,
  CreditCard,
  Loader2,
  LockKeyhole,
  Mail,
  Nfc,
  Package,
  ScanLine,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import verifiedlyMark from "@/assets/verifiedly-v-mark.png";

type Order = {
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

type Tier = "pro" | "retail";

type CardForm = {
  printed_name: string;
  printed_title: string;
  printed_handle: string;
  shipping_name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: "US";
};

const tapPreordersEnabled = import.meta.env.VITE_TAP_CARD_PREORDERS_ENABLED === "true"
  || import.meta.env.VITE_TAP_CARD_ORDERS_ENABLED === "true";
const priceLabel = (tier: Tier) => tier === "pro" ? "$19.99" : "$29.99";
const isPreorderSource = (source?: string | null) => Boolean(source?.startsWith("preorder_"));
const statusLabel = (order: Order) =>
  order.status === "paid" ? (isPreorderSource(order.order_source) ? "Pre-order confirmed" : "Order confirmed")
    : order.status === "submitted" ? "Submitted to production"
      : order.status === "production" ? "In production"
        : order.status === "shipped" ? "Shipped"
          : order.status === "delivered" ? "Delivered"
            : order.status === "manual_review" ? "Under review"
              : order.status === "canceled" || order.status === "refunded" ? "Canceled"
                : order.status.replace(/_/g, " ");

const cleanPrintLine = (value: string, maximum: number) => value
  .replace(/[\u0000-\u001F\u007F]/g, " ")
  .replace(/\s+/g, " ")
  .slice(0, maximum);

const functionErrorMessage = async (error: unknown, data: unknown, fallback: string) => {
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
      try {
        const text = await context.clone().text();
        if (text) return text;
      } catch {
        // Fall through to the normal error message.
      }
    }
  }

  return error instanceof Error ? error.message : fallback;
};

const TapCard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tier, setTier] = useState<Tier>("retail");
  const [profile, setProfile] = useState<{
    username: string;
    display_name: string | null;
    category: string | null;
    is_pro: boolean | null;
  } | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [previewApproved, setPreviewApproved] = useState(false);
  const [termsApproved, setTermsApproved] = useState(false);
  const [form, setForm] = useState<CardForm>({
    printed_name: "",
    printed_title: "",
    printed_handle: "",
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
        .select("pro_status")
        .eq("user_id", session.user.id)
        .maybeSingle(),
      supabase.from("verifiedly_tap_card_orders")
        .select("id, status, amount_cents, order_source, tracking_number, tracking_url, created_at, printed_name, printed_title, printed_handle")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false }),
    ]);

    if (profileData) {
      const nextProfile = profileData as {
        username: string;
        display_name: string | null;
        category: string | null;
        is_pro: boolean | null;
      };
      setProfile(nextProfile);
      setForm((current) => ({
        ...current,
        printed_name: current.printed_name || nextProfile.display_name || nextProfile.username,
        printed_title: current.printed_title || nextProfile.category || "Official profile",
        printed_handle: nextProfile.username,
        shipping_name: current.shipping_name || nextProfile.display_name || nextProfile.username,
      }));

      const activeBilling = billingData?.pro_status === "active" || billingData?.pro_status === "trialing";
      setTier(nextProfile.is_pro || activeBilling ? "pro" : "retail");
    }

    setOrders((orderData as Order[] | null) ?? []);
    setLoading(false);
  }, [navigate]);

  const confirmSession = useCallback(async (sessionId: string) => {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("confirm-tap-checkout", {
        body: { session_id: sessionId },
      });
      if (error || data?.error) throw new Error(await functionErrorMessage(error, data, "The pre-order is still syncing."));
      toast({
        title: "Tap Card pre-order confirmed",
        description: "Your paid pre-order is now in the BrownGlobal manual fulfillment queue.",
      });
      await load();
    } catch (error) {
      toast({
        title: "Payment received — pre-order is syncing",
        description: error instanceof Error ? error.message : "The Stripe webhook will finish recording your pre-order.",
      });
    } finally {
      setSubmitting(false);
    }
  }, [load, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    const sessionId = searchParams.get("session_id");
    if (checkout === "success" && sessionId) {
      setSearchParams({}, { replace: true });
      void confirmSession(sessionId);
    } else if (checkout === "cancelled") {
      setSearchParams({}, { replace: true });
      toast({ title: "Checkout canceled", description: "No payment was collected and your pre-order was not submitted." });
    }
  }, [confirmSession, searchParams, setSearchParams, toast]);

  const previewName = form.printed_name.trim() || "Your name";
  const previewTitle = form.printed_title.trim() || "Professional title";
  const previewHandle = profile?.username || form.printed_handle || "yourhandle";
  const previewProfileUrl = `https://verifiedly.app/${previewHandle}`;
  const previewQrUrl = `https://quickchart.io/qr?size=360&margin=1&text=${encodeURIComponent(previewProfileUrl)}`;
  const printDetailsValid = form.printed_name.trim().length >= 2
    && form.printed_title.trim().length >= 2
    && !!profile?.username;
  const shippingValid = form.shipping_name.trim().length >= 2
    && form.line1.trim().length >= 2
    && form.city.trim().length >= 1
    && form.state.trim().length >= 2
    && form.postal_code.trim().length >= 2;
  const canSubmit = tapPreordersEnabled && printDetailsValid && shippingValid && previewApproved && termsApproved && !submitting;
  const earlyAccessMailto = `mailto:support@verifiedly.app?subject=${encodeURIComponent("Verifiedly Tap early access")}&body=${encodeURIComponent(`Please add @${previewHandle} to the Verifiedly Tap early-access list.\n\nPreview name: ${previewName}\nPreview title: ${previewTitle}`)}`;

  const updatePrintField = (field: "printed_name" | "printed_title", value: string) => {
    const maximum = field === "printed_name" ? 40 : 60;
    setForm((current) => ({ ...current, [field]: cleanPrintLine(value, maximum) }));
    setPreviewApproved(false);
  };

  const submit = async () => {
    if (!tapPreordersEnabled) {
      toast({ title: "Tap Card pre-orders are not open yet", description: "Join early access while the payment and fulfillment launch is completed." });
      return;
    }
    if (!printDetailsValid) {
      toast({ title: "Complete the printed card details", variant: "destructive" });
      return;
    }
    if (!shippingValid) {
      toast({ title: "Complete the U.S. shipping address", variant: "destructive" });
      return;
    }
    if (!previewApproved || !termsApproved) {
      toast({ title: "Approve the preview and pre-order terms", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-tap-checkout", {
        body: {
          ...form,
          printed_handle: profile?.username,
          preview_approved: true,
          sale_type: "preorder",
        },
      });
      if (error || data?.error) {
        throw new Error(await functionErrorMessage(error, data, "Stripe Checkout could not open."));
      }

      if (data?.url) window.location.assign(data.url);
      else throw new Error("Stripe Checkout did not return a secure checkout link.");
    } catch (error) {
      toast({
        title: "Pre-order could not start",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  const pricingMessage = tier === "pro"
    ? "Your active Verifiedly Pro pre-order price is applied automatically."
    : "One-time paid pre-order. Verifiedly Pro members pay $19.99.";

  if (loading) {
    return <DashboardShell title="Verifiedly Tap"><div className="p-6 text-sm text-muted-foreground sm:p-8">Loading your Tap Card…</div></DashboardShell>;
  }

  return (
    <DashboardShell title="Verifiedly Tap">
      <div className="mx-auto w-full max-w-6xl space-y-6 overflow-x-hidden px-3 py-5 sm:space-y-7 sm:px-4 sm:py-9">
        <header className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="break-words text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-xs sm:tracking-[0.2em]">Your official profile, one tap away.</p>
            <h1 className="mt-2 break-words text-3xl font-display font-bold tracking-tight sm:text-4xl">Create your Verifiedly Tap Card</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              A personalized, Verifiedly-branded PVC card that opens your official profile with NFC or QR.
            </p>
          </div>
          <div className="inline-flex w-fit max-w-full items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-xs font-medium shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            <span className="break-words">{tapPreordersEnabled ? "Paid pre-orders open" : "Early-access preview"}</span>
          </div>
        </header>

        {tapPreordersEnabled ? (
          <Card className="rounded-3xl border-foreground bg-foreground p-5 text-background sm:p-6">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-background/60">Verifiedly Tap founding pre-order</p>
                <h2 className="mt-2 break-words font-display text-xl font-bold">Reserve your personalized Tap Card</h2>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-background/75">
                  You are charged securely at checkout. BrownGlobal reviews each paid pre-order, then manually submits the approved card to the manufacturer. Production and tracking updates appear in your account and may also be emailed.
                </p>
              </div>
              <span className="w-fit shrink-0 rounded-full bg-background/10 px-3 py-1.5 text-xs font-semibold">Charged now · fulfilled later</span>
            </div>
          </Card>
        ) : (
          <Card className="rounded-3xl border-foreground bg-foreground p-5 text-background sm:p-6">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-background/60">Verifiedly Tap early access</p>
                <h2 className="mt-2 break-words font-display text-xl font-bold">Preview your card before paid pre-orders open</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-background/75">No payment is collected while early access is active.</p>
              </div>
              <Button asChild variant="secondary" className="w-full gap-2 whitespace-normal sm:w-auto"><a href={earlyAccessMailto}><Mail className="h-4 w-4 shrink-0" />Join early access</a></Button>
            </div>
          </Card>
        )}

        <section aria-label="Live Tap Card preview" className="min-w-0 rounded-[1.5rem] border border-foreground/10 bg-gradient-to-b from-muted/35 to-background p-3 shadow-sm sm:rounded-[2rem] sm:p-7">
          <div className="mb-4 flex min-w-0 flex-wrap items-center justify-between gap-3 sm:mb-5">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Live preview</p>
              <p className="mt-1 break-words text-sm text-muted-foreground">This locked layout is used for every Verifiedly Tap Card.</p>
            </div>
            <span className="shrink-0 rounded-full bg-foreground px-3 py-1 text-[11px] font-semibold text-background">PVC · NFC · QR</span>
          </div>

          <div className="grid min-w-0 gap-5 lg:grid-cols-2">
            <div className="min-w-0">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Front</p>
              <div className="relative mx-auto aspect-[1.586/1] w-full max-w-[560px] overflow-hidden rounded-[1.1rem] border border-black/10 bg-white p-4 text-black shadow-[0_24px_70px_-34px_rgba(0,0,0,0.35)] sm:rounded-[1.6rem] sm:p-8">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(0,0,0,0.035),transparent_34%),linear-gradient(145deg,rgba(0,0,0,0.018),transparent_58%)]" />
                <div className="relative flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-black/60 sm:text-[10px] sm:tracking-[0.28em]">Verifiedly Tap</p>
                    <p className="mt-1 text-[7px] uppercase tracking-[0.12em] text-black/35 sm:text-[9px] sm:tracking-[0.18em]">Official profile card</p>
                  </div>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/10 bg-black/[0.025] sm:h-10 sm:w-10">
                    <Nfc className="h-4 w-4 text-black/75 sm:h-5 sm:w-5" />
                  </div>
                </div>

                <div className="absolute bottom-4 left-4 right-4 sm:bottom-8 sm:left-8 sm:right-8">
                  <div className="max-w-[74%] min-w-0">
                    <p className="truncate font-display text-[clamp(1rem,5.7vw,1.875rem)] font-bold leading-tight tracking-tight">{previewName}</p>
                    <p className="mt-0.5 truncate text-[9px] text-black/60 sm:mt-1 sm:text-sm">{previewTitle}</p>
                    <p className="mt-2 truncate text-[8px] font-medium tracking-[0.08em] text-black/45 sm:mt-4 sm:text-[10px] sm:tracking-[0.12em]">@{previewHandle}</p>
                  </div>
                  <img src={verifiedlyMark} alt="Verifiedly V mark" className="absolute bottom-0 right-0 h-9 w-9 object-contain sm:h-14 sm:w-14" />
                </div>
              </div>
            </div>

            <div className="min-w-0">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Back</p>
              <div className="relative mx-auto flex aspect-[1.586/1] w-full max-w-[560px] items-center overflow-hidden rounded-[1.1rem] border border-black/10 bg-white p-4 text-black shadow-[0_24px_70px_-34px_rgba(0,0,0,0.35)] sm:rounded-[1.6rem] sm:p-8">
                <div className="grid w-full min-w-0 grid-cols-[72px_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-8">
                  <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center bg-white p-0.5 sm:h-36 sm:w-36 sm:p-1">
                    <img src={previewQrUrl} alt="Preview QR code for the Verifiedly profile" className="h-full w-full" referrerPolicy="no-referrer" />
                  </div>
                  <div className="min-w-0 pr-5 sm:pr-6">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <ScanLine className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                      <p className="text-[9px] font-bold uppercase tracking-[0.1em] sm:text-xs sm:tracking-[0.14em]">Tap or scan</p>
                    </div>
                    <p className="mt-2 break-all text-[8px] font-semibold leading-tight sm:mt-3 sm:text-sm">verifiedly.app/{previewHandle}</p>
                    <p className="mt-2 text-[7px] leading-snug text-black/45 sm:mt-5 sm:text-[9px] sm:leading-relaxed">Not a payment card or government-issued ID.</p>
                  </div>
                </div>
                <img src={verifiedlyMark} alt="" aria-hidden="true" className="absolute bottom-3 right-3 h-6 w-6 object-contain sm:bottom-5 sm:right-5 sm:h-8 sm:w-8" />
              </div>
            </div>
          </div>
        </section>

        <div className={`grid min-w-0 gap-6 ${tapPreordersEnabled ? "lg:grid-cols-[1.15fr_0.85fr]" : "lg:grid-cols-1"}`}>
          <div className="min-w-0 space-y-6">
            <Card className="min-w-0 rounded-3xl border-foreground/10 p-4 sm:p-7">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">1</span>
                <div className="min-w-0">
                  <h2 className="break-words font-display text-xl font-bold">Personalize the print</h2>
                  <p className="mt-1 break-words text-xs text-muted-foreground">Only the approved name, title, handle, QR and NFC link vary between cards.</p>
                </div>
              </div>

              <div className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2">
                <div className="min-w-0">
                  <Label htmlFor="printed-name">Name on card</Label>
                  <Input id="printed-name" className="mt-2 h-11 min-w-0" value={form.printed_name} onChange={(event) => updatePrintField("printed_name", event.target.value)} maxLength={40} autoComplete="name" />
                  <p className="mt-1 text-right text-[10px] text-muted-foreground">{form.printed_name.length}/40</p>
                </div>
                <div className="min-w-0">
                  <Label htmlFor="printed-title">Professional title or role</Label>
                  <Input id="printed-title" className="mt-2 h-11 min-w-0" value={form.printed_title} onChange={(event) => updatePrintField("printed_title", event.target.value)} maxLength={60} placeholder="Founder · Sports Media" />
                  <p className="mt-1 text-right text-[10px] text-muted-foreground">{form.printed_title.length}/60</p>
                </div>
              </div>

              <div className="mt-3 rounded-2xl border bg-muted/30 p-4">
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold">Verifiedly handle</p>
                    <p className="mt-1 break-all text-sm">@{previewHandle}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 text-[10px] text-muted-foreground"><LockKeyhole className="h-3.5 w-3.5" /> Locked to your account</div>
                </div>
              </div>

              <div className="mt-5 flex min-w-0 items-start gap-3 rounded-2xl border p-4">
                <Checkbox id="preview-approved" checked={previewApproved} onCheckedChange={(value) => setPreviewApproved(value === true)} disabled={!printDetailsValid} className="mt-0.5 shrink-0" />
                <Label htmlFor="preview-approved" className="min-w-0 cursor-pointer break-words text-xs font-normal leading-relaxed">
                  I reviewed the preview and approve <strong>{previewName}</strong>, <strong>{previewTitle}</strong> and <strong>@{previewHandle}</strong> for printing.
                </Label>
              </div>
            </Card>

            {tapPreordersEnabled && (
              <Card className="min-w-0 rounded-3xl border-foreground/10 p-4 sm:p-7">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">2</span>
                  <div className="min-w-0">
                    <h2 className="break-words font-display text-xl font-bold">Shipping address</h2>
                    <p className="mt-1 break-words text-xs text-muted-foreground">Initial Tap Card fulfillment is available to U.S. addresses.</p>
                  </div>
                </div>

                <div className="mt-5 min-w-0 space-y-4">
                  <div className="min-w-0"><Label htmlFor="shipping-name">Recipient name</Label><Input id="shipping-name" className="mt-2 h-11 min-w-0" value={form.shipping_name} onChange={(event) => setForm({ ...form, shipping_name: event.target.value.slice(0, 100) })} autoComplete="name" /></div>
                  <div className="min-w-0"><Label htmlFor="line1">Street address</Label><Input id="line1" className="mt-2 h-11 min-w-0" value={form.line1} onChange={(event) => setForm({ ...form, line1: event.target.value.slice(0, 200) })} autoComplete="address-line1" /></div>
                  <div className="min-w-0"><Label htmlFor="line2">Apartment or suite <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="line2" className="mt-2 h-11 min-w-0" value={form.line2} onChange={(event) => setForm({ ...form, line2: event.target.value.slice(0, 200) })} autoComplete="address-line2" /></div>
                  <div className="grid min-w-0 gap-4 sm:grid-cols-3">
                    <div className="min-w-0"><Label htmlFor="city">City</Label><Input id="city" className="mt-2 h-11 min-w-0" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value.slice(0, 100) })} autoComplete="address-level2" /></div>
                    <div className="min-w-0"><Label htmlFor="state">State</Label><Input id="state" className="mt-2 h-11 min-w-0" value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value.slice(0, 100) })} autoComplete="address-level1" /></div>
                    <div className="min-w-0"><Label htmlFor="postal-code">ZIP code</Label><Input id="postal-code" className="mt-2 h-11 min-w-0" value={form.postal_code} onChange={(event) => setForm({ ...form, postal_code: event.target.value.slice(0, 20) })} autoComplete="postal-code" /></div>
                  </div>
                  <div className="rounded-2xl border bg-muted/30 px-4 py-3 text-sm">United States</div>
                </div>
              </Card>
            )}
          </div>

          <div className="min-w-0 space-y-6 lg:sticky lg:top-6 lg:self-start">
            <Card className="min-w-0 rounded-3xl border-foreground/10 p-4 shadow-sm sm:p-7">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">{tapPreordersEnabled ? "3" : "2"}</span>
                <div className="min-w-0">
                  <h2 className="break-words font-display text-xl font-bold">{tapPreordersEnabled ? "Review and pre-order" : "Early-access pricing"}</h2>
                  <p className="mt-1 break-words text-xs text-muted-foreground">Your price is calculated from your Verifiedly account.</p>
                </div>
              </div>

              <div className="mt-6 min-w-0 rounded-2xl border-2 border-foreground p-4 sm:p-5">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Verifiedly Tap</p><p className="mt-2 break-words font-semibold">Personalized PVC NFC card</p></div>
                  <CreditCard className="h-5 w-5 shrink-0" />
                </div>
                <div className="mt-6 flex flex-wrap items-baseline gap-2"><span className="text-3xl font-display font-bold">{priceLabel(tier)}</span><span className="text-xs text-muted-foreground">one-time pre-order</span></div>
                <p className="mt-2 break-words text-xs leading-relaxed text-muted-foreground">{pricingMessage}</p>
              </div>

              <div className="mt-5 space-y-3 text-xs text-muted-foreground">
                <div className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" /><span>Unique NFC and QR profile link</span></div>
                <div className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" /><span>Locked Verifiedly front-and-back design</span></div>
                <div className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" /><span>Manual BrownGlobal quality review and supplier submission</span></div>
              </div>

              {tapPreordersEnabled ? (
                <>
                  <div className="mt-5 flex min-w-0 items-start gap-3 rounded-2xl bg-muted/50 p-4">
                    <Checkbox id="card-terms" checked={termsApproved} onCheckedChange={(value) => setTermsApproved(value === true)} className="mt-0.5 shrink-0" />
                    <Label htmlFor="card-terms" className="min-w-0 cursor-pointer break-words text-xs font-normal leading-relaxed text-muted-foreground">
                      I understand this is a paid personalized pre-order. I will be charged now, and BrownGlobal will manually submit the approved card to a third-party manufacturer after review. Production and delivery timing can vary. Cancellations, defects and replacements follow the posted policy.
                    </Label>
                  </div>
                  <Button className="mt-5 min-h-12 w-full whitespace-normal rounded-xl px-3 py-3 text-center leading-snug" onClick={() => void submit()} disabled={!canSubmit}>
                    {submitting ? <><Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />Opening Stripe Checkout…</> : <>Pre-order with Stripe · {priceLabel(tier)}<ChevronRight className="ml-2 h-4 w-4 shrink-0" /></>}
                  </Button>
                </>
              ) : (
                <Button asChild className="mt-5 min-h-12 w-full whitespace-normal rounded-xl px-3 py-3" disabled={!printDetailsValid}><a href={printDetailsValid ? earlyAccessMailto : undefined}><Mail className="mr-2 h-4 w-4 shrink-0" />Join Tap early access</a></Button>
              )}

              {tier === "retail" && (
                <Button asChild variant="outline" className="mt-3 min-h-11 w-full whitespace-normal rounded-xl px-3 py-2 text-center leading-snug"><Link to="/dashboard/pro">Get Pro · Tap Card $19.99</Link></Button>
              )}
              {tier === "retail" && <p className="mt-2 text-center text-[10px] leading-relaxed text-muted-foreground">Verifiedly Pro is $4.99 monthly or $49.99 yearly and includes identity-verification eligibility for supported adults.</p>}
              <p className="mt-3 break-words text-center text-[10px] leading-relaxed text-muted-foreground">{tapPreordersEnabled ? "Stripe charges the pre-order now. The order is recorded only after Stripe confirms payment, then BrownGlobal fulfills it manually." : "No payment is collected while early access is active."}</p>
            </Card>
          </div>
        </div>

        {orders.length > 0 && (
          <Card className="min-w-0 rounded-3xl border-foreground/10 p-4 sm:p-7">
            <div className="flex min-w-0 items-center justify-between gap-4"><div className="min-w-0"><h2 className="break-words font-display text-xl font-bold">Your Tap Card pre-orders</h2><p className="mt-1 break-words text-xs text-muted-foreground">Manual production and tracking updates appear here.</p></div><Package className="h-5 w-5 shrink-0 text-muted-foreground" /></div>
            <ul className="mt-5 grid min-w-0 gap-3 md:grid-cols-2">
              {orders.map((order) => (
                <li key={order.id} className="min-w-0 rounded-2xl border border-border/70 p-4 text-sm">
                  <div className="flex min-w-0 flex-col gap-2 xs:flex-row xs:items-start xs:justify-between sm:flex-row">
                    <div className="min-w-0"><p className="break-words font-semibold">{order.printed_name || "Verifiedly Tap Card"}</p><p className="mt-1 break-words text-xs text-muted-foreground">{order.printed_title || "Official profile"} · @{order.printed_handle}</p></div>
                    <span className="w-fit shrink-0 rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold capitalize">{statusLabel(order)}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><span>{new Date(order.created_at).toLocaleDateString()}</span><span>${(order.amount_cents / 100).toFixed(2)}</span></div>
                  {order.tracking_url && <a href={order.tracking_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex max-w-full items-center gap-1 break-all text-xs font-medium underline underline-offset-4"><Truck className="h-3.5 w-3.5 shrink-0" /> Track {order.tracking_number || "shipment"}</a>}
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