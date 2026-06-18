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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("creator_status" as any)
        .select("id, image_url, caption, created_at, expires_at")
        .eq("creator_id", creatorId)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: true });
      if (!cancelled) setStatuses((data as any) || []);
    })();
    return () => { cancelled = true; };
  }, [creatorId]);

  const hasStatus = statuses.length > 0;

  const ringClass = hasStatus
    ? "ring-4 ring-offset-2 ring-offset-transparent ring-foreground cursor-pointer"
    : `ring-4 ${idleRingClass}`;

  return (
    <>
      <button
        type="button"
        onClick={() => hasStatus && setOpen(true)}
        className={hasStatus ? "rounded-full focus:outline-none" : "rounded-full pointer-events-none"}
        aria-label={hasStatus ? "View status" : undefined}
      >
        <Avatar className={`${sizeClass} mx-auto shadow-lg ${ringClass}`}>
          {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
          <AvatarFallback className="text-3xl font-display font-bold bg-muted">
            {fallback}
          </AvatarFallback>
        </Avatar>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
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
                  onClick={() =>
                    idx + 1 >= statuses.length ? setOpen(false) : setIdx((i) => i + 1)
                  }
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