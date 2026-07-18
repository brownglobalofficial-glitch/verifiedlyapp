import { FormEvent, useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { ExternalLink, FileCheck2, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logoMark from "@/assets/verifiedly-mark.png";

type AccessResult = {
  title: string;
  mime_type: string | null;
  url: string;
  link_expires_at: string;
  access_expires_in_seconds: number;
};

const SharedDocument = () => {
  const { token = "" } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [result, setResult] = useState<AccessResult | null>(null);
  const [error, setError] = useState("");

  const unlock = useCallback(async (submittedPassword = "") => {
    setLoading(true);
    setError("");
    const { data, error: functionError } = await supabase.functions.invoke("access-document-share", {
      body: { token, password: submittedPassword || undefined },
    });
    if (data?.password_required && !data?.url) {
      setPasswordRequired(true);
      if (data?.error) setError(data.error);
      setLoading(false);
      return;
    }
    if (functionError || data?.error || !data?.url) {
      setError(data?.error || functionError?.message || "This link is invalid or expired.");
      setLoading(false);
      return;
    }
    setPasswordRequired(false);
    setResult(data as AccessResult);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    void unlock();
  }, [unlock]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void unlock(password);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 py-8">
      <Helmet>
        <title>Secure document · Verifiedly</title>
        <meta name="description" content="A private document shared through Verifiedly." />
        <meta name="robots" content="noindex,nofollow,noarchive" />
        <meta name="referrer" content="no-referrer" />
      </Helmet>

      <header className="mx-auto flex w-full max-w-lg items-center justify-center gap-2">
        <img src={logoMark} alt="" className="h-7 w-7" />
        <span className="font-display text-sm font-semibold">Verifiedly</span>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 items-center py-10">
        <Card className="w-full rounded-3xl border-foreground/10 p-6 text-center shadow-sm sm:p-8">
          {loading ? (
            <div className="py-10">
              <Loader2 className="mx-auto h-7 w-7 animate-spin" />
              <p className="mt-4 text-sm text-muted-foreground">Checking secure link…</p>
            </div>
          ) : result ? (
            <>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-background"><FileCheck2 className="h-6 w-6" /></div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Shared document</p>
              <h1 className="mt-2 text-2xl font-display font-bold">{result.title}</h1>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">Access was approved. The file button below expires in 60 seconds and opens through a private, temporary URL.</p>
              <Button asChild className="mt-6 h-12 w-full rounded-xl">
                <a href={result.url} target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-4 w-4" /> Open document</a>
              </Button>
              <p className="mt-4 text-xs text-muted-foreground">If the button expires, reopen the original secure link.</p>
            </>
          ) : passwordRequired ? (
            <>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-background"><LockKeyhole className="h-6 w-6" /></div>
              <h1 className="mt-5 text-2xl font-display font-bold">Password required</h1>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">Ask the sender for the password. It should be sent separately from this link.</p>
              <form className="mt-6 space-y-3 text-left" onSubmit={submit}>
                <div>
                  <Label htmlFor="document-password">Password</Label>
                  <Input id="document-password" className="mt-1 h-11 rounded-xl" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" autoFocus />
                </div>
                {error && <p className="text-xs text-destructive">{error}</p>}
                <Button className="h-11 w-full rounded-xl" type="submit" disabled={!password}>Unlock document</Button>
              </form>
            </>
          ) : (
            <>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted"><LockKeyhole className="h-6 w-6" /></div>
              <h1 className="mt-5 text-2xl font-display font-bold">Link unavailable</h1>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{error || "This secure link is invalid, expired, revoked, or has reached its view limit."}</p>
            </>
          )}
        </Card>
      </main>

      <footer className="mx-auto flex max-w-lg items-center justify-center gap-2 text-center text-[11px] text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" />
        <span>Private sharing by Verifiedly · <Link className="underline underline-offset-2" to="/privacy">Privacy</Link></span>
      </footer>
    </div>
  );
};

export default SharedDocument;
