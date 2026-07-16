import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TrendingUp, ArrowRight, Coins, ShoppingBag } from "lucide-react";
import { STRIPE_TIERS } from "@/lib/stripe-config";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  currentTier: "free" | "pro" | "elite";
  /** Profile being viewed. FeePreview will only render if viewerId === ownerId. */
  ownerId: string;
  viewerId: string | null;
}

type Item = {
  id: string;
  name: string;
  price: number;
  kind: "tip" | "product";
};

/**
 * Owner-only fee calculator. Lets the creator pick one of their published items
 * (or a tip amount) and shows the exact platform fee + net earnings under each
 * plan tier. Hardened so it never renders for anyone except the profile owner.
 */
const FeePreview = ({ currentTier, ownerId, viewerId }: Props) => {
  // HARD GUARD — never expose this calculator to non-owners, even if a parent forgets to gate it.
  const isOwner = !!viewerId && viewerId === ownerId;

  const [items, setItems] = useState<Item[]>([{ id: "tip", name: "Custom tip", price: 5, kind: "tip" }]);
  const [selectedId, setSelectedId] = useState<string>("tip");
  const [tipAmount, setTipAmount] = useState(50);

  useEffect(() => {
    if (!isOwner) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, price")
        .eq("creator_id", ownerId)
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (!active) return;
      const productItems: Item[] = (data || [])
        .filter((p: any) => Number(p.price) > 0)
        .map((p: any) => ({ id: p.id, name: p.name, price: Number(p.price), kind: "product" as const }));
      setItems([{ id: "tip", name: "Custom tip", price: 5, kind: "tip" }, ...productItems]);
    })();
    return () => { active = false; };
  }, [isOwner, ownerId]);

  const selected = items.find(i => i.id === selectedId) || items[0];
  const amount = selected?.kind === "tip" ? tipAmount : (selected?.price ?? 0);

  const rows = useMemo(() => {
    return (["free", "pro"] as const).map((id) => {
      const fee = STRIPE_TIERS[id].fee_percent;
      const platformCut = (amount * fee) / 100;
      const net = amount - platformCut;
      return { id, name: STRIPE_TIERS[id].name, fee, platformCut, net };
    });
  }, [amount]);

  const proSavings = rows[0].platformCut - rows[1].platformCut;

  if (!isOwner) return null;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-display font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Fee preview
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pick an item or tip amount to see your exact platform fee and take-home.
          </p>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-muted capitalize">
          You: {currentTier}
        </span>
      </div>

      <div className="mb-4">
        <label className="text-xs text-muted-foreground mb-1.5 block">Item</label>
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {items.map(item => (
              <SelectItem key={item.id} value={item.id}>
                <span className="inline-flex items-center gap-2">
                  {item.kind === "tip"
                    ? <Coins className="w-3.5 h-3.5" />
                    : <ShoppingBag className="w-3.5 h-3.5" />}
                  <span className="truncate">{item.name}</span>
                  {item.kind === "product" && (
                    <span className="text-muted-foreground text-xs">· ${item.price.toFixed(2)}</span>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selected?.kind === "tip" ? (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-muted-foreground">Tip amount</span>
            <span className="font-display font-bold">${tipAmount}</span>
          </div>
          <Slider
            value={[tipAmount]}
            min={1}
            max={500}
            step={1}
            onValueChange={(v) => setTipAmount(v[0])}
            aria-label="Tip amount"
          />
        </div>
      ) : (
        <div className="mb-5 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Listed price</span>
          <span className="font-display font-bold">${amount.toFixed(2)}</span>
        </div>
      )}

      <div className="space-y-2">
        {rows.map((r) => {
          const isCurrent = r.id === currentTier;
          return (
            <div
              key={r.id}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                isCurrent ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{r.name}</span>
                  <span className="text-xs text-muted-foreground">{r.fee}% fee</span>
                  {isCurrent && (
                    <span className="text-[10px] uppercase font-bold tracking-wider bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                      you
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Buyer pays ${amount.toFixed(2)} · Verifiedly fee ${r.platformCut.toFixed(2)}
                </p>
              </div>
              <div className="text-right pl-3 shrink-0">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">You net</p>
                <p className="font-display font-bold text-sm">${r.net.toFixed(2)}</p>
              </div>
            </div>
          );
        })}
      </div>

      {currentTier === "free" && proSavings > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">
            On this {selected?.kind === "tip" ? "tip" : "sale"} you'd keep an extra
            {" "}<span className="font-semibold text-foreground">${proSavings.toFixed(2)}</span> with Pro.
          </p>
          <Link to="/dashboard/upgrade">
            <Button size="sm" className="w-full gap-2">
              Lower my fee <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      )}
    </Card>
  );
};

export default FeePreview;
