import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Copy, ExternalLink, Mail, PackageCheck, RefreshCw, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const ORDER_STATUSES = ["paid", "manual_review", "submitted", "production", "shipped", "delivered", "canceled", "refunded"] as const;
type OrderStatus = typeof ORDER_STATUSES[number];

type Address = {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
};

type OrderRow = {
  id: string;
  user_id: string;
  card_id: string;
  status: OrderStatus;
  order_source: string;
  amount_cents: number;
  currency: string;
  shipping_name: string | null;
  shipping_address: Address | null;
  printed_name: string | null;
  printed_title: string | null;
  printed_handle: string | null;
  template_version: string;
  preview_approved_at: string | null;
  fulfillment_provider: string | null;
  fulfillment_order_id: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  admin_notes: string | null;
  created_at: string;
};

type CardRow = {
  id: string;
  public_token: string;
  card_serial: string;
  status: string;
};

type ProfileRow = {
  id: string;
  username: string;
  display_name: string | null;
};

type EditableOrder = OrderRow & {
  card?: CardRow;
  profile?: ProfileRow;
};

const formatAddress = (address: Address | null) => {
  if (!address) return "No shipping address recorded";
  return [
    address.line1,
    address.line2,
    [address.city, address.state, address.postal_code].filter(Boolean).join(", "),
    address.country,
  ].filter(Boolean).join("\n");
};

const TapCardOrders = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<EditableOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [filter, setFilter] = useState<"open" | "all">("open");
  const [importing, setImporting] = useState(false);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login?next=/dashboard/admin/tap-orders");
      return;
    }

    const { data: roles } = await supabase.from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin");
    if (!roles?.length) {
      toast({ title: "Access denied", variant: "destructive" });
      navigate("/dashboard");
      return;
    }

    const { data: orderRows, error: orderError } = await (supabase as any)
      .from("verifiedly_tap_card_orders")
      .select("id, user_id, card_id, status, order_source, amount_cents, currency, shipping_name, shipping_address, printed_name, printed_title, printed_handle, template_version, preview_approved_at, fulfillment_provider, fulfillment_order_id, tracking_number, tracking_url, admin_notes, created_at")
      .order("created_at", { ascending: false });

    if (orderError) {
      toast({ title: "Tap Card orders unavailable", description: orderError.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const rawOrders = (orderRows || []) as OrderRow[];
    const cardIds = [...new Set(rawOrders.map((order) => order.card_id))];
    const userIds = [...new Set(rawOrders.map((order) => order.user_id))];

    const [cardResult, profileResult] = await Promise.all([
      cardIds.length
        ? (supabase as any).from("verifiedly_tap_cards").select("id, public_token, card_serial, status").in("id", cardIds)
        : Promise.resolve({ data: [] }),
      userIds.length
        ? supabase.from("profiles").select("id, username, display_name").in("id", userIds)
        : Promise.resolve({ data: [] }),
    ]);

    const cards = new Map(((cardResult.data || []) as CardRow[]).map((card) => [card.id, card]));
    const profiles = new Map(((profileResult.data || []) as ProfileRow[]).map((profile) => [profile.id, profile]));
    setOrders(rawOrders.map((order) => ({
      ...order,
      card: cards.get(order.card_id),
      profile: profiles.get(order.user_id),
    })));
    setLoading(false);
  }, [navigate, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleOrders = useMemo(() => filter === "all"
    ? orders
    : orders.filter((order) => !["delivered", "canceled", "refunded"].includes(order.status)), [filter, orders]);

  const updateLocal = (id: string, patch: Partial<EditableOrder>) => {
    setOrders((current) => current.map((order) => order.id === id ? { ...order, ...patch } : order));
  };

  const copy = async (value: string, key: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1600);
  };

  const save = async (order: EditableOrder) => {
    setSavingId(order.id);
    try {
      const { error } = await (supabase as any).rpc("admin_update_verifiedly_tap_card_order", {
        p_order_id: order.id,
        p_status: order.status,
        p_fulfillment_provider: order.fulfillment_provider || null,
        p_fulfillment_order_id: order.fulfillment_order_id || null,
        p_tracking_number: order.tracking_number || null,
        p_tracking_url: order.tracking_url || null,
        p_admin_notes: order.admin_notes || null,
      });
      if (error) throw error;
      toast({ title: "Order updated", description: `${order.printed_name || "Tap Card"} is now ${order.status.replace(/_/g, " ")}.` });
      await load();
    } catch (error) {
      toast({ title: "Order not updated", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  };

  const sendStatusEmail = async (order: EditableOrder) => {
    setSendingEmailId(order.id);
    try {
      const { error } = await supabase.functions.invoke("notify-tap-order-status", {
        body: { order_id: order.id, stage: order.status },
      });
      if (error) throw error;
      toast({ title: "Email sent", description: `${order.status.replace(/_/g, " ")} update sent to the customer.` });
    } catch (error) {
      toast({
        title: "Email not sent",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSendingEmailId(null);
    }
  };

  const parseCsv = (text: string): Record<string, string>[] => {
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (!lines.length) return [];
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ""));
    return lines.slice(1).map((line) => {
      // simple CSV: support quoted values without embedded commas
      const cells: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { inQuotes = !inQuotes; continue; }
        if (ch === "," && !inQuotes) { cells.push(current); current = ""; continue; }
        current += ch;
      }
      cells.push(current);
      const row: Record<string, string> = {};
      header.forEach((key, idx) => { row[key] = (cells[idx] || "").trim(); });
      return row;
    });
  };

  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (!rows.length) {
        toast({ title: "Empty CSV", description: "No rows found. Expected headers: order_id, tracking_number, tracking_url, fulfillment_order_id, fulfillment_provider, status.", variant: "destructive" });
        return;
      }

      let updated = 0;
      let skipped = 0;
      const errors: string[] = [];
      const byId = new Map(orders.map((o) => [o.id, o]));
      const bySerial = new Map<string, EditableOrder>();
      orders.forEach((o) => { if (o.card?.card_serial) bySerial.set(o.card.card_serial, o); });

      for (const row of rows) {
        const key = row.order_id || row.card_serial || "";
        const match = byId.get(key) || bySerial.get(key);
        if (!match) { skipped++; continue; }
        const nextStatus = (row.status || match.status) as OrderStatus;
        const { error } = await (supabase as any).rpc("admin_update_verifiedly_tap_card_order", {
          p_order_id: match.id,
          p_status: nextStatus,
          p_fulfillment_provider: row.fulfillment_provider || match.fulfillment_provider || null,
          p_fulfillment_order_id: row.fulfillment_order_id || match.fulfillment_order_id || null,
          p_tracking_number: row.tracking_number || match.tracking_number || null,
          p_tracking_url: row.tracking_url || match.tracking_url || null,
          p_admin_notes: match.admin_notes || null,
        });
        if (error) { errors.push(`${key}: ${error.message}`); continue; }
        updated++;
      }

      toast({
        title: "CSV import complete",
        description: `${updated} updated · ${skipped} skipped${errors.length ? ` · ${errors.length} errors` : ""}`,
        variant: errors.length ? "destructive" : "default",
      });
      if (errors.length) console.error("[TapCardOrders CSV]", errors);
      await load();
    } catch (error) {
      toast({
        title: "CSV import failed",
        description: error instanceof Error ? error.message : "Check file format and try again.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  if (loading) return <div className="min-h-screen bg-background p-8 text-sm text-muted-foreground">Loading manual Tap Card orders…</div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <Button asChild variant="ghost" size="icon"><Link to="/dashboard/admin" aria-label="Back to admin"><ArrowLeft className="h-4 w-4" /></Link></Button>
            <div className="min-w-0">
              <h1 className="truncate font-display font-bold">Manual Tap Card orders</h1>
              <p className="text-xs text-muted-foreground">Paid PVC orders awaiting BrownGlobal fulfillment</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleCsvUpload} />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={importing}>
              <Upload className="mr-2 h-4 w-4" />{importing ? "Importing…" : "Import CSV"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-7">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <Button size="sm" variant={filter === "open" ? "default" : "outline"} onClick={() => setFilter("open")}>Open orders</Button>
            <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>All orders</Button>
          </div>
          <p className="text-xs text-muted-foreground">{visibleOrders.length} shown · {orders.length} total</p>
        </div>

        <div className="space-y-5">
          {visibleOrders.map((order) => {
            const tapUrl = order.card ? `https://verifiedly.app/t/${order.card.public_token}` : "";
            const qrUrl = tapUrl ? `https://quickchart.io/qr?size=600&margin=1&text=${encodeURIComponent(tapUrl)}` : "";
            const addressText = formatAddress(order.shipping_address);

            return (
              <Card key={order.id} className="rounded-3xl p-5 sm:p-6">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{order.card?.card_serial || "Card pending"} · {order.template_version}</p>
                        <h2 className="mt-2 text-2xl font-display font-bold">{order.printed_name || "Missing printed name"}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">{order.printed_title || "Missing title"} · @{order.printed_handle || order.profile?.username}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold capitalize">{order.status.replace(/_/g, " ")}</p>
                        <p className="mt-1 text-xs text-muted-foreground">${(order.amount_cents / 100).toFixed(2)} {order.currency.toUpperCase()}</p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border p-4">
                        <p className="text-xs font-semibold">Customer and shipping</p>
                        <p className="mt-2 text-sm">{order.shipping_name || order.profile?.display_name || "No shipping name"}</p>
                        <pre className="mt-2 whitespace-pre-wrap font-sans text-xs leading-relaxed text-muted-foreground">{addressText}</pre>
                        <Button className="mt-3" size="sm" variant="outline" onClick={() => void copy(`${order.shipping_name || ""}\n${addressText}`.trim(), `address-${order.id}`)}>
                          {copied === `address-${order.id}` ? <Check className="mr-2 h-3 w-3" /> : <Copy className="mr-2 h-3 w-3" />}
                          {copied === `address-${order.id}` ? "Copied" : "Copy address"}
                        </Button>
                      </div>

                      <div className="rounded-2xl border p-4">
                        <p className="text-xs font-semibold">Manufacturer data</p>
                        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                          <p><span className="font-medium text-foreground">Name:</span> {order.printed_name}</p>
                          <p><span className="font-medium text-foreground">Title:</span> {order.printed_title}</p>
                          <p><span className="font-medium text-foreground">Handle:</span> @{order.printed_handle}</p>
                          <p><span className="font-medium text-foreground">Approved:</span> {order.preview_approved_at ? new Date(order.preview_approved_at).toLocaleString() : "Missing"}</p>
                        </div>
                        {tapUrl && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => void copy(tapUrl, `url-${order.id}`)}>
                              {copied === `url-${order.id}` ? <Check className="mr-2 h-3 w-3" /> : <Copy className="mr-2 h-3 w-3" />}
                              {copied === `url-${order.id}` ? "Copied" : "Copy NFC URL"}
                            </Button>
                            <Button asChild size="sm" variant="outline"><a href={qrUrl} target="_blank" rel="noreferrer">Open QR image <ExternalLink className="ml-2 h-3 w-3" /></a></Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="w-full space-y-3 xl:w-[340px]">
                    <div>
                      <label className="text-xs font-semibold" htmlFor={`status-${order.id}`}>Fulfillment status</label>
                      <select
                        id={`status-${order.id}`}
                        value={order.status}
                        onChange={(event) => updateLocal(order.id, { status: event.target.value as OrderStatus })}
                        className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        {ORDER_STATUSES.map((status) => <option key={status} value={status}>{status.replace(/_/g, " ")}</option>)}
                      </select>
                    </div>
                    <Input value={order.fulfillment_provider || ""} onChange={(event) => updateLocal(order.id, { fulfillment_provider: event.target.value })} placeholder="Supplier, e.g. Printags" />
                    <Input value={order.fulfillment_order_id || ""} onChange={(event) => updateLocal(order.id, { fulfillment_order_id: event.target.value })} placeholder="Supplier order ID" />
                    <Input value={order.tracking_number || ""} onChange={(event) => updateLocal(order.id, { tracking_number: event.target.value })} placeholder="Tracking number" />
                    <Input value={order.tracking_url || ""} onChange={(event) => updateLocal(order.id, { tracking_url: event.target.value })} placeholder="https:// tracking link" />
                    <Textarea value={order.admin_notes || ""} onChange={(event) => updateLocal(order.id, { admin_notes: event.target.value })} placeholder="Internal fulfillment notes" rows={3} />
                    <Button className="w-full" onClick={() => void save(order)} disabled={savingId !== null}>
                      {savingId === order.id ? "Saving…" : <><PackageCheck className="mr-2 h-4 w-4" />Save fulfillment update</>}
                    </Button>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => void sendStatusEmail(order)}
                      disabled={sendingEmailId !== null}
                    >
                      {sendingEmailId === order.id ? "Sending…" : <><Mail className="mr-2 h-4 w-4" />Email customer this status</>}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}

          {!visibleOrders.length && (
            <Card className="rounded-3xl p-10 text-center text-sm text-muted-foreground">No Tap Card orders match this view.</Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default TapCardOrders;
