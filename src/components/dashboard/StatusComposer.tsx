import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Status = {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  expires_at: string;
};

export default function StatusComposer({ userId }: { userId: string }) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [caption, setCaption] = useState("");
  const [active, setActive] = useState<Status[]>([]);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("creator_status" as any)
      .select("id, image_url, caption, created_at, expires_at")
      .eq("creator_id", userId)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });
    setActive((data as any) || []);
  };
  useEffect(() => { load(); }, [userId]);

  const choose = () => fileRef.current?.click();

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast({ title: "Image only", description: "Status posts must be an image.", variant: "destructive" });
      return;
    }
    if (f.size > 8 * 1024 * 1024) {
      toast({ title: "Too large", description: "Max 8 MB.", variant: "destructive" });
      return;
    }
    setPendingFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const post = async () => {
    if (!pendingFile) return;
    setBusy(true);
    try {
      const ext = pendingFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/status/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, pendingFile, { cacheControl: "0", upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: insErr } = await (supabase
        .from("creator_status" as any)
        .insert({
          creator_id: userId,
          image_url: pub.publicUrl,
          caption: caption.trim() || null,
        }) as any);
      if (insErr) throw insErr;
      toast({ title: "Status posted", description: "Visible for 24 hours." });
      setPendingFile(null);
      setPreview(null);
      setCaption("");
      await load();
    } catch (e: any) {
      toast({ title: "Couldn't post status", description: e.message || String(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    await (supabase.from("creator_status" as any).delete().eq("id", id) as any);
    await load();
  };

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display font-semibold">Verifiedly Status</h2>
          <p className="text-xs text-muted-foreground">
            Post an image + caption. Disappears after 24 hours. Followers see a ring around your avatar.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={choose} className="gap-1">
          <Camera className="w-4 h-4" /> Choose image
        </Button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
      </div>

      {preview && (
        <div className="border rounded-lg p-3 space-y-3">
          <img src={preview} alt="preview" className="max-h-48 mx-auto rounded" />
          <Input
            placeholder="Add a caption (optional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={200}
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => { setPendingFile(null); setPreview(null); }}>
              Cancel
            </Button>
            <Button size="sm" onClick={post} disabled={busy} className="gap-1">
              {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Post status
            </Button>
          </div>
        </div>
      )}

      {active.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Live now ({active.length})</p>
          <div className="flex gap-2 flex-wrap">
            {active.map((s) => {
              const hoursLeft = Math.max(
                0,
                Math.round((new Date(s.expires_at).getTime() - Date.now()) / 3_600_000)
              );
              return (
                <div key={s.id} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                  <img src={s.image_url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => remove(s.id)}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black"
                    aria-label="Delete status"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <span className="absolute bottom-0 inset-x-0 text-[10px] text-white bg-black/50 text-center py-0.5">
                    {hoursLeft}h left
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}