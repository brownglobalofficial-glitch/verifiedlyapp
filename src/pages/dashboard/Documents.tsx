import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CalendarDays,
  Check,
  Copy,
  ExternalLink,
  FileCheck2,
  FileText,
  FolderLock,
  Link2,
  Loader2,
  LockKeyhole,
  MoreHorizontal,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

type DocumentRecord = {
  id: string;
  title: string;
  doc_type: string;
  issuer: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  storage_path: string;
  original_filename: string | null;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
};

type BillingRecord = {
  documents_status: "inactive" | "incomplete" | "trialing" | "active" | "past_due" | "canceled";
  documents_interval: "month" | "year" | null;
  documents_current_period_end: string | null;
  documents_cancel_at_period_end: boolean;
};

type ShareRecord = {
  id: string;
  document_id: string;
  expires_at: string;
  view_count: number;
  max_views: number;
  revoked_at: string | null;
  created_at: string;
};

const defaultBilling: BillingRecord = {
  documents_status: "inactive",
  documents_interval: null,
  documents_current_period_end: null,
  documents_cancel_at_period_end: false,
};

const allowedTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const extensionFor = (file: File) => {
  if (file.type === "application/pdf") return "pdf";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
};

const formatBytes = (value: number | null) => {
  if (!value) return "";
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const formatType = (value: string) => ({
  degree: "Degree",
  certification: "Certification",
  professional_license: "Professional license",
  award: "Award",
  other_credential: "Other credential",
}[value] ?? "Credential");

const Documents = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [billing, setBilling] = useState<BillingRecord>(defaultBilling);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [shares, setShares] = useState<ShareRecord[]>([]);
  const [checkoutLoading, setCheckoutLoading] = useState<"month" | "year" | "portal" | null>(null);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: "",
    doc_type: "certification",
    issuer: "",
    issue_date: "",
    expiry_date: "",
  });
  const [shareDocument, setShareDocument] = useState<DocumentRecord | null>(null);
  const [sharePassword, setSharePassword] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const [createdLink, setCreatedLink] = useState("");
  const [deleteDocument, setDeleteDocument] = useState<DocumentRecord | null>(null);

  const active = useMemo(() => {
    const current = ["active", "trialing"].includes(billing.documents_status);
    const beforeEnd = !billing.documents_current_period_end
      || new Date(billing.documents_current_period_end) > new Date();
    return current && beforeEnd;
  }, [billing]);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login?next=/dashboard/documents");
      return;
    }
    setUserId(session.user.id);

    const [billingResult, documentsResult, sharesResult] = await Promise.all([
      supabase.from("verifiedly_billing")
        .select("documents_status, documents_interval, documents_current_period_end, documents_cancel_at_period_end")
        .eq("user_id", session.user.id)
        .maybeSingle(),
      supabase.from("documents")
        .select("id, title, doc_type, issuer, issue_date, expiry_date, storage_path, original_filename, file_size, mime_type, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("document_share_links")
        .select("id, document_id, expires_at, view_count, max_views, revoked_at, created_at")
        .order("created_at", { ascending: false }),
    ]);

    if (billingResult.data) setBilling({ ...defaultBilling, ...(billingResult.data as BillingRecord) });
    setDocuments((documentsResult.data as DocumentRecord[] | null) ?? []);
    setShares((sharesResult.data as ShareRecord[] | null) ?? []);
    setReady(true);
  }, [navigate]);

  useEffect(() => {
    const checkoutSessionId = searchParams.get("session_id");
    const checkoutSuccess = searchParams.get("checkout") === "success";
    void (async () => {
      if (checkoutSuccess && checkoutSessionId) {
        const { data, error } = await supabase.functions.invoke("confirm-documents-checkout", {
          body: { session_id: checkoutSessionId },
        });
        setSearchParams({}, { replace: true });
        if (error || data?.error) {
          toast({
            title: "Subscription confirmation delayed",
            description: data?.error || error?.message || "Refresh in a moment.",
            variant: "destructive",
          });
        } else {
          toast({ title: "Verifiedly Documents is ready", description: "Your private storage is now active." });
        }
      }
      await load();
    })();
  }, [load, searchParams, setSearchParams, toast]);

  const openCheckout = async (interval: "month" | "year") => {
    setCheckoutLoading(interval);
    try {
      const { data, error } = await supabase.functions.invoke("create-documents-checkout", {
        body: { interval },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.already_active) {
        await load();
        return;
      }
      if (!data?.url) throw new Error("Checkout did not return a secure URL.");
      window.location.assign(data.url);
    } catch (error) {
      toast({
        title: "Checkout could not open",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const openPortal = async () => {
    setCheckoutLoading("portal");
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        body: { return_path: "/dashboard/documents" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.url) throw new Error("The billing portal did not return a secure URL.");
      window.location.assign(data.url);
    } catch (error) {
      toast({
        title: "Billing portal could not open",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const upload = async () => {
    if (!file || !form.title.trim() || !userId || !active) return;
    if (!allowedTypes.has(file.type)) {
      toast({ title: "Unsupported file", description: "Use a PDF, JPG, PNG, or WebP file.", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File is too large", description: "Documents must be 10 MB or smaller.", variant: "destructive" });
      return;
    }

    setUploading(true);
    const storagePath = `${userId}/${crypto.randomUUID()}.${extensionFor(file)}`;
    try {
      const { error: uploadError } = await supabase.storage.from("documents").upload(storagePath, file, {
        cacheControl: "0",
        contentType: file.type,
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const { error: rowError } = await supabase.from("documents").insert({
        user_id: userId,
        title: form.title.trim(),
        doc_type: form.doc_type,
        issuer: form.issuer.trim() || null,
        issue_date: form.issue_date || null,
        expiry_date: form.expiry_date || null,
        storage_path: storagePath,
        original_filename: file.name.slice(0, 180),
        file_size: file.size,
        mime_type: file.type,
        is_public: false,
      });
      if (rowError) {
        await supabase.storage.from("documents").remove([storagePath]);
        throw rowError;
      }

      setFile(null);
      setForm({ title: "", doc_type: "certification", issuer: "", issue_date: "", expiry_date: "" });
      const input = document.getElementById("credential-file") as HTMLInputElement | null;
      if (input) input.value = "";
      toast({ title: "Document saved", description: "The file is private and visible only from your account." });
      await load();
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const openDocument = async (record: DocumentRecord) => {
    const { data, error } = await supabase.storage.from("documents").createSignedUrl(record.storage_path, 60, {
      download: record.original_filename || record.title,
    });
    if (error || !data?.signedUrl) {
      toast({ title: "Document could not open", description: error?.message || "Please try again.", variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const removeDocument = async () => {
    if (!deleteDocument) return;
    const record = deleteDocument;
    setDeleteDocument(null);
    const { error: storageError } = await supabase.storage.from("documents").remove([record.storage_path]);
    if (storageError) {
      toast({ title: "Document could not be removed", description: storageError.message, variant: "destructive" });
      return;
    }
    const { error: rowError } = await supabase.from("documents").delete().eq("id", record.id);
    if (rowError) {
      toast({ title: "Document record could not be removed", description: rowError.message, variant: "destructive" });
      return;
    }
    setDocuments((current) => current.filter((item) => item.id !== record.id));
    toast({ title: "Document removed" });
  };

  const beginShare = (record: DocumentRecord) => {
    setShareDocument(record);
    setSharePassword("");
    setCreatedLink("");
  };

  const createShare = async () => {
    if (!shareDocument) return;
    setShareLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-document-share", {
        body: { document_id: shareDocument.id, password: sharePassword || undefined },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const url = `${window.location.origin}${data.path}`;
      setCreatedLink(url);
      await navigator.clipboard.writeText(url).catch(() => undefined);
      toast({ title: "Secure link copied", description: "It expires in 24 hours and can be revoked." });
      await load();
    } catch (error) {
      toast({
        title: "Secure link could not be created",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setShareLoading(false);
    }
  };

  const revokeShare = async (share: ShareRecord) => {
    const { error } = await supabase.from("document_share_links")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", share.id);
    if (error) {
      toast({ title: "Link could not be revoked", description: error.message, variant: "destructive" });
      return;
    }
    setShares((current) => current.map((item) => item.id === share.id
      ? { ...item, revoked_at: new Date().toISOString() }
      : item));
    toast({ title: "Secure link revoked" });
  };

  const copyCreatedLink = async () => {
    if (!createdLink) return;
    await navigator.clipboard.writeText(createdLink);
    toast({ title: "Link copied" });
  };

  if (!ready) {
    return <DashboardShell title="Documents"><div className="p-8 text-sm text-muted-foreground">Loading…</div></DashboardShell>;
  }

  if (!active) {
    return (
      <DashboardShell title="Documents">
        <div className="mx-auto max-w-4xl px-4 py-7 sm:py-10">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-background">
              <FolderLock className="h-6 w-6" />
            </div>
            <h1 className="mt-5 text-3xl font-display font-bold tracking-tight">Verifiedly Documents</h1>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
              Keep professional credentials private, organized, and ready to share through a controlled 24-hour link.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Card className="rounded-3xl p-6 shadow-sm">
              <p className="text-sm font-semibold">Monthly</p>
              <p className="mt-3 text-4xl font-display font-bold">$4.99<span className="text-sm font-normal text-muted-foreground">/month</span></p>
              <Button className="mt-6 h-11 w-full rounded-xl" onClick={() => void openCheckout("month")} disabled={checkoutLoading !== null}>
                {checkoutLoading === "month" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Choose monthly"}
              </Button>
            </Card>
            <Card className="relative rounded-3xl border-foreground bg-foreground p-6 text-background shadow-sm">
              <span className="absolute right-5 top-5 rounded-full bg-background/10 px-3 py-1 text-[11px] font-medium">Save $20.88</span>
              <p className="text-sm font-semibold">Annual</p>
              <p className="mt-3 text-4xl font-display font-bold">$39<span className="text-sm font-normal opacity-65">/year</span></p>
              <Button className="mt-6 h-11 w-full rounded-xl bg-background text-foreground hover:bg-background/90" onClick={() => void openCheckout("year")} disabled={checkoutLoading !== null}>
                {checkoutLoading === "year" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Choose annual"}
              </Button>
            </Card>
          </div>

          <Card className="mx-auto mt-5 max-w-2xl rounded-3xl p-6 shadow-none">
            <ul className="grid gap-3 text-sm sm:grid-cols-2">
              {[
                "Private Supabase storage",
                "PDF and image credentials",
                "10 MB per document",
                "Password-optional 24-hour links",
                "Revoke shared links",
                "Public profile stays separate",
              ].map((item) => <li key={item} className="flex items-center gap-2"><Check className="h-4 w-4" /> {item}</li>)}
            </ul>
          </Card>

          <div className="mx-auto mt-5 flex max-w-2xl items-start gap-3 rounded-2xl bg-muted/50 p-4 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Professional credentials only. Do not upload payment cards, bank records, Social Security numbers, health records, passports, government IDs, or other identity documents.</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  const renewalDate = billing.documents_current_period_end
    ? new Date(billing.documents_current_period_end).toLocaleDateString()
    : null;

  return (
    <DashboardShell title="Documents" hidePreview>
      <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:py-8">
        <Card className="rounded-3xl border-foreground/10 p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-foreground text-background"><FolderLock className="h-5 w-5" /></div>
              <div>
                <h1 className="font-display text-xl font-bold">Your private documents</h1>
                <p className="mt-0.5 text-xs text-muted-foreground">{documents.length} {documents.length === 1 ? "document" : "documents"} · {billing.documents_interval === "year" ? "Annual" : "Monthly"} plan{renewalDate ? ` · ${billing.documents_cancel_at_period_end ? "Ends" : "Renews"} ${renewalDate}` : ""}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl" onClick={openPortal} disabled={checkoutLoading === "portal"}>
              {checkoutLoading === "portal" ? "Opening…" : "Manage billing"}
            </Button>
          </div>
        </Card>

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="h-fit rounded-3xl p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="font-display text-lg font-bold">Add a credential</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">PDF, JPG, PNG, or WebP · 10 MB maximum</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="credential-title">Title</Label>
                <Input id="credential-title" className="mt-1 rounded-xl" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Certified athletic trainer" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="credential-type">Type</Label>
                  <select id="credential-type" className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm" value={form.doc_type} onChange={(event) => setForm({ ...form, doc_type: event.target.value })}>
                    <option value="degree">Degree</option>
                    <option value="certification">Certification</option>
                    <option value="professional_license">Professional license</option>
                    <option value="award">Award</option>
                    <option value="other_credential">Other credential</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="credential-issuer">Issuer</Label>
                  <Input id="credential-issuer" className="mt-1 rounded-xl" value={form.issuer} onChange={(event) => setForm({ ...form, issuer: event.target.value })} placeholder="Issuing organization" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label htmlFor="credential-issued">Issued (optional)</Label><Input id="credential-issued" className="mt-1 rounded-xl" type="date" value={form.issue_date} onChange={(event) => setForm({ ...form, issue_date: event.target.value })} /></div>
                <div><Label htmlFor="credential-expiry">Expires (optional)</Label><Input id="credential-expiry" className="mt-1 rounded-xl" type="date" value={form.expiry_date} onChange={(event) => setForm({ ...form, expiry_date: event.target.value })} /></div>
              </div>
              <div>
                <Label htmlFor="credential-file">File</Label>
                <Input id="credential-file" className="mt-1 cursor-pointer rounded-xl" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
              </div>
              <Button className="h-11 w-full rounded-xl" onClick={upload} disabled={uploading || !file || !form.title.trim()}>
                {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : <><Upload className="mr-2 h-4 w-4" /> Save privately</>}
              </Button>
            </div>
          </Card>

          <Card className="rounded-3xl p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold">Documents</h2>
                <p className="mt-1 text-xs text-muted-foreground">Only you can open these files unless you create a secure link.</p>
              </div>
              <LockKeyhole className="h-5 w-5 text-muted-foreground" />
            </div>

            {documents.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center">
                <FileCheck2 className="h-7 w-7 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">No documents yet</p>
                <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">Add a professional credential to keep it organized and ready when you need it.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {documents.map((record) => {
                  const activeShares = shares.filter((share) => share.document_id === record.id && !share.revoked_at && new Date(share.expires_at) > new Date());
                  return (
                    <li key={record.id} className="rounded-2xl border p-3.5 transition-colors hover:bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted"><FileText className="h-4 w-4" /></div>
                        <button type="button" className="min-w-0 flex-1 text-left" onClick={() => void openDocument(record)}>
                          <p className="truncate text-sm font-semibold">{record.title}</p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">{formatType(record.doc_type)}{record.issuer ? ` · ${record.issuer}` : ""}{record.file_size ? ` · ${formatBytes(record.file_size)}` : ""}</p>
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9 rounded-full"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Document options</span></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl">
                            <DropdownMenuItem onSelect={() => void openDocument(record)}><ExternalLink className="mr-2 h-4 w-4" /> Open</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => beginShare(record)}><Link2 className="mr-2 h-4 w-4" /> Create secure link</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setDeleteDocument(record)}><X className="mr-2 h-4 w-4" /> Remove</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {activeShares.length > 0 && (
                        <div className="mt-3 space-y-2 border-t pt-3">
                          {activeShares.map((share) => (
                            <div key={share.id} className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                              <span className="flex min-w-0 items-center gap-1.5"><Link2 className="h-3.5 w-3.5 shrink-0" /> Link expires {new Date(share.expires_at).toLocaleString()} · {share.view_count}/{share.max_views} opens</span>
                              <Button variant="ghost" size="sm" className="h-7 shrink-0 rounded-lg px-2 text-xs" onClick={() => void revokeShare(share)}>Revoke</Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="flex items-start gap-3 rounded-2xl bg-muted/50 p-4 text-xs leading-relaxed text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Verifiedly Documents is for professional credentials. Never upload payment cards, bank documents, Social Security numbers, health records, passports, or government IDs.</p>
        </div>
      </div>

      <Dialog open={!!shareDocument} onOpenChange={(open) => { if (!open) setShareDocument(null); }}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create secure link</DialogTitle>
            <DialogDescription>Share {shareDocument?.title}. The link expires in 24 hours, allows up to 10 opens, and can be revoked.</DialogDescription>
          </DialogHeader>
          {createdLink ? (
            <div className="space-y-3">
              <Label htmlFor="created-share-link">Secure link</Label>
              <div className="flex gap-2">
                <Input id="created-share-link" value={createdLink} readOnly className="rounded-xl" />
                <Button size="icon" variant="outline" className="shrink-0 rounded-xl" onClick={copyCreatedLink}><Copy className="h-4 w-4" /></Button>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">The actual file URL lasts only 60 seconds after the recipient unlocks this link.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="share-password">Password (optional)</Label>
              <Input id="share-password" className="rounded-xl" type="password" value={sharePassword} onChange={(event) => setSharePassword(event.target.value)} placeholder="At least 8 characters" autoComplete="new-password" />
              <p className="text-xs text-muted-foreground">Send the password separately from the link.</p>
            </div>
          )}
          <DialogFooter>
            {createdLink ? (
              <Button className="rounded-xl" onClick={() => setShareDocument(null)}>Done</Button>
            ) : (
              <Button className="rounded-xl" onClick={createShare} disabled={shareLoading || (!!sharePassword && sharePassword.length < 8)}>
                {shareLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…</> : "Create and copy link"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteDocument} onOpenChange={(open) => { if (!open) setDeleteDocument(null); }}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this document?</AlertDialogTitle>
            <AlertDialogDescription>{deleteDocument?.title} and its secure links will be permanently removed. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Keep document</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => void removeDocument()}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardShell>
  );
};

export default Documents;
