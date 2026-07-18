import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FolderLock, Upload, Trash2, Lock, Sparkles, FileText, ExternalLink } from "lucide-react";

type Doc = {
  id: string;
  title: string;
  doc_type: string;
  issuer: string | null;
  storage_path: string;
  is_public: boolean;
  created_at: string;
};

/**
 * Private document vault — Pro-only. Rows in `documents` reference files in
 * the private `documents` storage bucket (per-user folder). is_public toggles
 * whether a row is discoverable on the public profile (files themselves stay
 * private and require signed URLs to view).
 */
const Documents = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ready, setReady] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: "", doc_type: "diploma", issuer: "" });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      setUserId(session.user.id);
      const { data: p } = await supabase.from("profiles")
        .select("is_pro, is_elite").eq("id", session.user.id).maybeSingle();
      setIsPro(!!(p?.is_pro || p?.is_elite));
      const { data: rows } = await (supabase.from("documents" as any).select("*").order("created_at", { ascending: false }) as any);
      setDocs((rows as Doc[]) || []);
      setReady(true);
    })();
  }, [navigate]);

  const upload = async () => {
    if (!file || !form.title || !userId) return;
    setUploading(true);
    try {
      const path = `${userId}/${crypto.randomUUID()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("documents").upload(path, file);
      if (upErr) throw upErr;
      const { error: insErr } = await (supabase.from("documents" as any).insert({
        user_id: userId,
        title: form.title,
        doc_type: form.doc_type,
        issuer: form.issuer || null,
        storage_path: path,
        file_size: file.size,
        mime_type: file.type,
      }) as any);
      if (insErr) throw insErr;
      toast({ title: "Document saved", description: "Stored privately in your vault." });
      setForm({ title: "", doc_type: "diploma", issuer: "" });
      setFile(null);
      const { data: rows } = await (supabase.from("documents" as any).select("*").order("created_at", { ascending: false }) as any);
      setDocs((rows as Doc[]) || []);
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally { setUploading(false); }
  };

  const view = async (d: Doc) => {
    const { data, error } = await supabase.storage.from("documents").createSignedUrl(d.storage_path, 60);
    if (error || !data?.signedUrl) { toast({ title: "Could not open", variant: "destructive" }); return; }
    window.open(data.signedUrl, "_blank");
  };

  const remove = async (d: Doc) => {
    await supabase.storage.from("documents").remove([d.storage_path]);
    await (supabase.from("documents" as any).delete().eq("id", d.id) as any);
    setDocs(docs.filter((x) => x.id !== d.id));
  };

  if (!ready) return <DashboardShell title="Documents"><div className="p-8 text-sm text-muted-foreground">Loading…</div></DashboardShell>;

  if (!isPro) {
    return (
      <DashboardShell title="Documents">
        <div className="container mx-auto max-w-2xl py-8 px-4 space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <FolderLock className="w-6 h-6" />
              <h1 className="text-2xl font-display font-bold">Document vault</h1>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              A private, encrypted place for your diplomas, certifications, licenses, and awards.
              You control what's public on your profile — files themselves always stay private.
            </p>
            <Card className="p-4 bg-foreground text-background flex items-center gap-3">
              <Sparkles className="w-4 h-4 shrink-0" />
              <p className="text-sm flex-1">Verifiedly Pro — $4.99/mo. Unlock the vault plus custom domain and analytics.</p>
              <Button variant="outline" className="bg-background text-foreground" onClick={() => navigate("/dashboard/upgrade")}>Upgrade</Button>
            </Card>
          </Card>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Documents">
      <div className="container mx-auto max-w-3xl py-8 px-4 space-y-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <FolderLock className="w-5 h-5" />
            <h1 className="text-xl font-display font-bold">Document vault</h1>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1"><Lock className="w-3 h-3" /> Private by default — only you can see the file contents.</p>
        </Card>

        <Card className="p-5 space-y-3">
          <h2 className="font-display font-semibold text-sm">Add a document</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label htmlFor="t">Title</Label><Input id="t" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="B.S. Computer Science" /></div>
            <div><Label htmlFor="i">Issuer</Label><Input id="i" value={form.issuer} onChange={(e) => setForm({ ...form, issuer: e.target.value })} placeholder="University name / org" /></div>
            <div>
              <Label htmlFor="k">Type</Label>
              <select id="k" value={form.doc_type} onChange={(e) => setForm({ ...form, doc_type: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="diploma">Diploma / Degree</option>
                <option value="certification">Certification</option>
                <option value="license">License</option>
                <option value="award">Award</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div><Label htmlFor="f">File</Label><Input id="f" type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} /></div>
          </div>
          <Button onClick={upload} disabled={uploading || !file || !form.title}>
            <Upload className="w-4 h-4 mr-2" /> {uploading ? "Uploading…" : "Save to vault"}
          </Button>
        </Card>

        <Card className="p-5">
          <h2 className="font-display font-semibold text-sm mb-3">Your documents ({docs.length})</h2>
          {docs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing yet. Upload your first document above.</p>
          ) : (
            <ul className="space-y-2">
              {docs.map((d) => (
                <li key={d.id} className="flex items-center gap-3 p-3 rounded-md border border-border">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{d.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{d.doc_type}{d.issuer ? ` · ${d.issuer}` : ""}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => view(d)}><ExternalLink className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(d)}><Trash2 className="w-4 h-4" /></Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
};

export default Documents;