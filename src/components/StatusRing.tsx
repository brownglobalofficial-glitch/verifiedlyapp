import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type Status = {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  expires_at: string;
};

interface Props {
  creatorId: string;
  avatarUrl?: string | null;
  fallback: string;
  /** Tailwind size classes, e.g. "w-24 h-24" */
  sizeClass?: string;
  /** Extra ring color when there are no statuses (theme ring). */
  idleRingClass?: string;
}

export default function StatusRing({
  creatorId,
  avatarUrl,
  fallback,
  sizeClass = "w-24 h-24",
  idleRingClass = "ring-white/80",
}: Props) {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const [allViewed, setAllViewed] = useState(false);

  const storageKey = `verifiedly_status_viewed_${creatorId}`;

  const refreshViewed = (list: Status[]) => {
    try {
      const raw = localStorage.getItem(storageKey);
      const viewed: string[] = raw ? JSON.parse(raw) : [];
      const everyViewed =
        list.length > 0 && list.every((s) => viewed.includes(s.id));
      setAllViewed(everyViewed);
    } catch {
      setAllViewed(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("creator_status" as any)
        .select("id, image_url, caption, created_at, expires_at")
        .eq("creator_id", creatorId)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: true });
      if (!cancelled) {
        const list = (data as any[]) || [];
        setStatuses(list);
        refreshViewed(list);
      }
    })();
    return () => { cancelled = true; };
  }, [creatorId]);

  const hasStatus = statuses.length > 0;

  // Mono-contrast ring. Bold when unseen, dimmed once all current statuses
  // have been viewed (Instagram / WhatsApp-style).
  const ringWrapper = hasStatus
    ? `p-[3px] rounded-full ${allViewed ? "bg-muted-foreground/40" : "bg-foreground"}`
    : "";
  const innerRing = hasStatus
    ? "p-[2px] rounded-full bg-background"
    : "";

  const markViewed = (id: string) => {
    try {
      const raw = localStorage.getItem(storageKey);
      const viewed: string[] = raw ? JSON.parse(raw) : [];
      if (!viewed.includes(id)) {
        viewed.push(id);
        localStorage.setItem(storageKey, JSON.stringify(viewed));
      }
    } catch { /* ignore */ }
  };

  const openViewer = () => {
    if (!hasStatus) return;
    setIdx(0);
    setOpen(true);
    markViewed(statuses[0].id);
  };

  const goNext = () => {
    if (idx + 1 >= statuses.length) {
      setOpen(false);
      refreshViewed(statuses);
    } else {
      const next = idx + 1;
      setIdx(next);
      markViewed(statuses[next].id);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openViewer}
        className={hasStatus ? "rounded-full focus:outline-none mx-auto block" : "rounded-full pointer-events-none mx-auto block"}
        aria-label={hasStatus ? "View status" : undefined}
      >
        <div className={ringWrapper}>
          <div className={innerRing}>
            <Avatar className={`${sizeClass} shadow-lg ${hasStatus ? "" : `ring-4 ${idleRingClass}`}`}>
              {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
              <AvatarFallback className="text-3xl font-display font-bold bg-muted">
                {fallback}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </button>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) refreshViewed(statuses);
        }}
      >
        <DialogContent className="max-w-md p-0 bg-black text-white overflow-hidden">
          {statuses[idx] && (
            <div className="relative">
              <div className="flex gap-1 p-2">
                {statuses.map((_, i) => (
                  <div key={i} className="h-0.5 flex-1 rounded-full bg-white/30">
                    <div className={`h-full rounded-full bg-white ${i <= idx ? "w-full" : "w-0"}`} />
                  </div>
                ))}
              </div>
              <img
                src={statuses[idx].image_url}
                alt={statuses[idx].caption || "status"}
                className="w-full max-h-[70vh] object-contain bg-black"
              />
              {statuses[idx].caption && (
                <p className="px-4 py-3 text-sm">{statuses[idx].caption}</p>
              )}
              <div className="absolute inset-0 flex">
                <button
                  className="flex-1"
                  onClick={() => setIdx((i) => Math.max(0, i - 1))}
                  aria-label="Previous"
                />
                <button
                  className="flex-1"
                  onClick={goNext}
                  aria-label="Next"
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}