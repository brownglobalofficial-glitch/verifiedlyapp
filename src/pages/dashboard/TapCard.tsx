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

const tapOrdersEnabled = import.meta.env.VITE_TAP_CARD_ORDERS_ENABLED === "true";
const priceLabel = (tier: Tier) => tier === "pro" ? "$19.99" : "$29.99";
const statusLabel = (status: string) =>
  status === "paid" ? "Order confirmed"
    : status === "submitted" ? "Submitted to production"
      : status === "production" ? "In production"
        : status === "shipped" ? "Shipped"
          : status === "delivered" ? "Delivered"
            : status === "manual_review" ? "Under review"
              : status === "canceled" || status === "refunded" ? "Canceled"
                : status.replaceAll("_", " ");

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
      if (error || data?.error) throw new Error(await functionErrorMessage(error, data, "The order is still syncing."));
      toast({
        title: "Tap Card order confirmed",
        description: "Your approved card details are now in the BrownGlobal fulfillment queue.",
      });
      await load();
    } catch (error) {
      toast({
        title: "Payment received — order is syncing",
        description: error instanceof Error ? error.message : "The Stripe webhook will finish recording your order.",
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
      toast({ title: "Checkout canceled", description: "Your card details were not submitted." });
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
  const canSubmit = tapOrdersEnabled && printDetailsValid && shippingValid && previewApproved && termsApproved && !submitting;
  const earlyAccessMailto = `mailto:support@verifiedly.app?subject=${encodeURIComponent("Verifiedly Tap early access")}&body=${encodeURIComponent(`Please add @${previewHandle} to the Verifiedly Tap early-access list.\n\nPreview name: ${previewName}\nPreview title: ${previewTitle}`)}`;

  const updatePrintField = (field: "printed_name" | "printed_title", value: string) => {
    const maximum = field === "printed_name" ? 40 : 60;
    setForm((current) => ({ ...current, [field]: cleanPrintLine(value, maximum) }));
    setPreviewApproved(false);
  };

  const submit = async () => {
    if (!tapOrdersEnabled) {
      toast({ title: "Tap Card ordering is not open yet", description: "Join early access while the physical sample and fulfillment process are being tested." });
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
      toast({ title: "Approve the preview and card terms", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-tap-checkout", {
        body: {
          ...form,
          printed_handle: profile?.username,
          preview_approved: true,
        },
      });
      if (error || data?.error) {
        throw new Error(await functionErrorMessage(error, data, "Stripe Checkout could not open."));
      }

      if (data?.url) window.location.assign(data.url);
      else throw new Error("Stripe Checkout did not return a secure checkout link.");
    } catch (error) {
      toast({
        title: "Order could not start",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  const pricingMessage = tier === "pro"
    ? "Your active Verifiedly Pro member price is applied automatically."
    : "One-time purchase. Verifiedly Pro members pay $19.99.";

  if (loading) {
    return <DashboardShell title="Verifiedly Tap"><div className="p-8 text-sm text-muted-foreground">Loading your Tap Card…</div></DashboardShell>;
  }

  return (
    <DashboardShell title="Verifiedly Tap">
      <div className="mx-auto max-w-6xl space-y-7 px-4 py-6 sm:py-9">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Your official profile, one tap away.</p>
            <h1 className="mt-2 text-3xl font-display font-bold tracking-tight sm:text-4xl">Create your Verifiedly Tap Card</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              A personalized, Verifiedly-branded PVC card that opens your official profile with NFC or QR.
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-xs font-medium shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5" /> {tapOrdersEnabled ? "Non-payment profile card" : "Early-access preview"}
          </div>
        </header>

        {!tapOrdersEnabled && (
          <Card className="rounded-3xl border-foreground bg-foreground p-5 text-background sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-background/60">Verifiedly Tap early access</p>
                <h2 className="mt-2 font-display text-xl font-bold">Preview your card before ordering opens</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-background/75">Live payment is intentionally paused until the PVC sample, NFC encoding, QR quality and manual fulfillment process pass testing.</p>
              </div>
              <Button asChild variant="secondary" className="shrink-0 gap-2"><a href={earlyAccessMailto}><Mail className="h-4 w-4" />Join early access</a></Button>
            </div>
          </Card>
        )}

        <section aria-label="Live Tap Card preview" className="rounded-[2rem] border border-foreground/10 bg-gradient-to-b from-muted/35 to-background p-4 shadow-sm sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Live preview</p>
              <p className="mt-1 text-sm text-muted-foreground">This locked layout is used for every Verifiedly Tap Card.</p>
            </div>
            <span className="rounded-full bg-foreground px-3 py-1 text-[11px] font-semibold text-background">PVC · NFC · QR</span>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Front</p>
              <div className="relative mx-auto aspect-[1.586/1] w-full max-w-[560px] overflow-hidden rounded-[1.6rem] border border-black/10 bg-white p-6 text-black shadow-[0_24px_70px_-34px_rgba(0,0,0,0.35)] sm:p-8">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(0,0,0,0.035),transparent_34%),linear-gradient(145deg,rgba(0,0,0,0.018),transparent_58%)]" />
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-black/60">Verifiedly Tap</p>
                    <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-black/35">Official profile card</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-black/[0.025]">
                    <Nfc className="h-5 w-5 text-black/75" />
                  </div>
                </div>

                <div className="absolute bottom-7 left-6 right-6 sm:bottom-8 sm:left-8 sm:right-8">
                  <div className="max-w-[76%]">
                    <p className="truncate font-display text-2xl font-bold tracking-tight sm:text-3xl">{previewName}</p>
                    <p className="mt-1 truncate text-xs text-black/60 sm:text-sm">{previewTitle}</p>
                    <p className="mt-4 truncate text-[10px] font-medium tracking-[0.12em] text-black/45">@{previewHandle}</p>
                  </div>
                  <img src={verifiedlyMark} alt="Verifiedly V mark" className="absolute bottom-0 right-0 h-11 w-11 object-contain sm:h-14 sm:w-14" />
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Back</p>
              <div className="relative mx-auto flex aspect-[1.586/1] w-full max-w-[560px] items-center overflow-hidden rounded-[1.6rem] border border-black/10 bg-white p-6 text-black shadow-[0_24px_70px_-34px_rgba(0,0,0,0.35)] sm:p-8">
                <div className="grid w-full grid-cols-[auto_1fr] items-center gap-5 sm:gap-8">
                  <div className="flex h-28 w-28 shrink-0 items-center justify-center bg-white p-1 sm:h-36 sm:w-36">
                    <img src={previewQrUrl} alt="Preview QR code for the Verifiedly profile" className="h-full w-full" referrerPolicy="no-referrer" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <ScanLine className="h-4 w-4" />
                      <p className="text-xs font-bold uppercase tracking-[0.14em]">Tap or scan</p>
                    </div>
                    <p className="mt-3 truncate text-sm font-semibold">verifiedly.app/{previewHandle}</p>
                    <p className="mt-5 text-[9px] leading-relaxed text-black/45">Not a payment card or government-issued ID.</p>
                  </div>
                </div>
                <img src={verifiedlyMark} alt="" aria-hidden="true" className="absolute bottom-5 right-5 h-8 w-8 object-contain" />
              </div>
            </div>
          </div>
        </section>

        <div className={`grid gap-6 ${tapOrdersEnabled ? "lg:grid-cols-[1.15fr_0.85fr]" : "lg:grid-cols-1"}`}>
          <div className="space-y-6">
            <Card className="rounded-3xl border-foreground/10 p-5 sm:p-7">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">1</span>
                <div>
                  <h2 className="font-display text-xl font-bold">Personalize the print</h2>
                  <p className="mt-1 text-xs text-muted-foreground">Only the approved name, title, handle, QR and NFC link vary between cards.</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="printed-name">Name on card</Label>
                  <Input id="printed-name" className="mt-2 h-11" value={form.printed_name} onChange={(event) => updatePrintField("printed_name", event.target.value)} maxLength={40} autoComplete="name" />
                  <p className="mt-1 text-right text-[10px] text-muted-foreground">{form.printed_name.length}/40</p>
                </div>
                <div>
                  <Label htmlFor="printed-title">Professional title or role</Label>
                  <Input id="printed-title" className="mt-2 h-11" value={form.printed_title} onChange={(event) => updatePrintField("printed_title", event.target.value)} maxLength={60} placeholder="Founder · Sports Media" />
                  <p className="mt-1 text-right text-[10px] text-muted-foreground">{form.printed_title.length}/60</p>
                </div>
              </div>

              <div className="mt-3 rounded-2xl border bg-muted/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold">Verifiedly handle</p>
                    <p className="mt-1 text-sm">@{previewHandle}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><LockKeyhole className="h-3.5 w-3.5" /> Locked to your account</div>
                </div>
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-2xl border p-4">
                <Checkbox id="preview-approved" checked={previewApproved} onCheckedChange={(value) => setPreviewApproved(value === true)} disabled={!printDetailsValid} className="mt-0.5" />
                <Label htmlFor="preview-approved" className="cursor-pointer text-xs font-normal leading-relaxed">
                  I reviewed the preview and approve <strong>{previewName}</strong>, <strong>{previewTitle}</strong> and <strong>@{previewHandle}</strong> for printing.
                </Label>
              </div>
            </Card>

            {tapOrdersEnabled && (
              <Card className="rounded-3xl border-foreground/10 p-5 sm:p-7">
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">2</span>
                  <div>
                    <h2 className="font-display text-xl font-bold">Shipping address</h2>
                    <p className="mt-1 text-xs text-muted-foreground">Initial Tap Card fulfillment is available to U.S. addresses.</p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <div><Label htmlFor="shipping-name">Recipient name</Label><Input id="shipping-name" className="mt-2 h-11" value={form.shipping_name} onChange={(event) => setForm({ ...form, shipping_name: event.target.value.slice(0, 100) })} autoComplete="name" /></div>
                  <div><Label htmlFor="line1">Street address</Label><Input id="line1" className="mt-2 h-11" value={form.line1} onChange={(event) => setForm({ ...form, line1: event.target.value.slice(0, 200) })} autoComplete="address-line1" /></div>
                  <div><Label htmlFor="line2">Apartment or suite <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="line2" className="mt-2 h-11" value={form.line2} onChange={(event) => setForm({ ...form, line2: event.target.value.slice(0, 200) })} autoComplete="address-line2" /></div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div><Label htmlFor="city">City</Label><Input id="city" className="mt-2 h-11" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value.slice(0, 100) })} autoComplete="address-level2" /></div>
                    <div><Label htmlFor="state">State</Label><Input id="state" className="mt-2 h-11" value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value.slice(0, 100) })} autoComplete="address-level1" /></div>
                    <div><Label htmlFor="postal-code">ZIP code</Label><Input id="postal-code" className="mt-2 h-11" value={form.postal_code} onChange={(event) => setForm({ ...form, postal_code: event.target.value.slice(0, 20) })} autoComplete="postal-code" /></div>
                  </div>
                  <div className="rounded-2xl border bg-muted/30 px-4 py-3 text-sm">United States</div>
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <Card className="rounded-3xl border-foreground/10 p-5 shadow-sm sm:p-7">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">{tapOrdersEnabled ? "3" : "2"}</span>
                <div>
                  <h2 className="font-display text-xl font-bold">{tapOrdersEnabled ? "Review and checkout" : "Early-access pricing"}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">Your price is calculated from your Verifiedly account.</p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border-2 border-foreground p-5">
                <div className="flex items-start justify-between gap-4">
                  <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Verifiedly Tap</p><p className="mt-2 font-semibold">Personalized PVC NFC card</p></div>
                  <CreditCard className="h-5 w-5" />
                </div>
                <div className="mt-6 flex items-baseline gap-2"><span className="text-3xl font-display font-bold">{priceLabel(tier)}</span><span className="text-xs text-muted-foreground">planned one-time price</span></div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{pricingMessage}</p>
              </div>

              <div className="mt-5 space-y-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><Check className="h-4 w-4 text-foreground" /> Unique NFC and QR profile link</div>
                <div className="flex items-center gap-2"><Check className="h-4 w-4 text-foreground" /> Locked Verifiedly front-and-back design</div>
                <div className="flex items-center gap-2"><Check className="h-4 w-4 text-foreground" /> Manual quality review before fulfillment</div>
              </div>

              {tapOrdersEnabled ? (
                <>
                  <div className="mt-5 flex items-start gap-3 rounded-2xl bg-muted/50 p-4">
                    <Checkbox id="card-terms" checked={termsApproved} onCheckedChange={(value) => setTermsApproved(value === true)} className="mt-0.5" />
                    <Label htmlFor="card-terms" className="cursor-pointer text-xs font-normal leading-relaxed text-muted-foreground">I understand this is a personalized, non-payment profile card. Personalized orders can only be replaced for a defect or fulfillment error, subject to the posted policy.</Label>
                  </div>
                  <Button className="mt-5 h-12 w-full rounded-xl" onClick={() => void submit()} disabled={!canSubmit}>
                    {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Opening Stripe Checkout…</> : <>Continue with Stripe · {priceLabel(tier)}<ChevronRight className="ml-2 h-4 w-4" /></>}
                  </Button>
                </>
              ) : (
                <Button asChild className="mt-5 h-12 w-full rounded-xl" disabled={!printDetailsValid}><a href={printDetailsValid ? earlyAccessMailto : undefined}><Mail className="mr-2 h-4 w-4" />Join Tap early access</a></Button>
              )}

              {tier === "retail" && (
                <Button asChild variant="outline" className="mt-3 h-11 w-full rounded-xl"><Link to="/dashboard/pro">Get Pro · Tap Card $19.99</Link></Button>
              )}
              {tier === "retail" && <p className="mt-2 text-center text-[10px] leading-relaxed text-muted-foreground">Verifiedly Pro is $4.99 monthly or $49.99 yearly and includes identity-verification eligibility for supported adults.</p>}
              <p className="mt-3 text-center text-[10px] leading-relaxed text-muted-foreground">{tapOrdersEnabled ? "Paid orders open a secure Stripe-hosted checkout. Order data is recorded only after Stripe confirms payment." : "No payment is collected while early access is active."}</p>
            </Card>
          </div>
        </div>

        {orders.length > 0 && (
          <Card className="rounded-3xl border-foreground/10 p-5 sm:p-7">
            <div className="flex items-center justify-between gap-4"><div><h2 className="font-display text-xl font-bold">Your Tap Card orders</h2><p className="mt-1 text-xs text-muted-foreground">Production and tracking updates appear here.</p></div><Package className="h-5 w-5 text-muted-foreground" /></div>
            <ul className="mt-5 grid gap-3 md:grid-cols-2">
              {orders.map((order) => (
                <li key={order.id} className="rounded-2xl border border-border/70 p-4 text-sm">
                  <div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="truncate font-semibold">{order.printed_name || "Verifiedly Tap Card"}</p><p className="mt-1 truncate text-xs text-muted-foreground">{order.printed_title || "Official profile"} · @{order.printed_handle}</p></div><span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold capitalize">{statusLabel(order.status)}</span></div>
                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground"><span>{new Date(order.created_at).toLocaleDateString()}</span><span>${(order.amount_cents / 100).toFixed(2)}</span></div>
                  {order.tracking_url && <a href={order.tracking_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-medium underline underline-offset-4"><Truck className="h-3.5 w-3.5" /> Track {order.tracking_number || "shipment"}</a>}
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
