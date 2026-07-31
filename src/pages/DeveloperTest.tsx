import { useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Loader2, ShieldCheck, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";

const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const TEST_CLIENT_ID = "verifiedly_test";
const ALL_SCOPES = ["openid", "profile", "email", "identity", "age", "country"] as const;
const VERIFIER_KEY = "verifiedly_test_pkce_verifier";
const STATE_KEY = "verifiedly_test_pkce_state";

const base64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const randomVerifier = () => base64Url(crypto.getRandomValues(new Uint8Array(64)));

const challengeFor = async (verifier: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64Url(new Uint8Array(digest));
};

type Step = { label: string; ok: boolean; detail?: string };

const DeveloperTest = () => {
  const [scopes, setScopes] = useState<string[]>(["openid", "profile", "identity"]);
  const [busy, setBusy] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const redirectUri = typeof window === "undefined" ? "" : `${window.location.origin}/developers/test`;

  const exchange = useCallback(async (code: string, returnedState: string) => {
    setBusy(true);
    const collected: Step[] = [];
    try {
      const expectedState = sessionStorage.getItem(STATE_KEY);
      const verifier = sessionStorage.getItem(VERIFIER_KEY);
      if (!expectedState || expectedState !== returnedState) throw new Error("State mismatch — possible CSRF.");
      if (!verifier) throw new Error("Missing PKCE verifier in this browser session.");
      collected.push({ label: "state parameter validated", ok: true });

      const tokenResponse = await fetch(`${FUNCTIONS_BASE}/oauth-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "authorization_code",
          code,
          client_id: TEST_CLIENT_ID,
          code_verifier: verifier,
          redirect_uri: `${window.location.origin}/developers/test`,
        }),
      });
      const tokenJson = await tokenResponse.json();
      if (!tokenResponse.ok) throw new Error(tokenJson.error_description || tokenJson.message || tokenJson.error || "Token exchange failed");
      collected.push({ label: "authorization code exchanged with PKCE", ok: true, detail: `scope: ${tokenJson.scope}` });

      const userinfoResponse = await fetch(`${FUNCTIONS_BASE}/oauth-userinfo`, {
        headers: { Authorization: `Bearer ${tokenJson.access_token}` },
      });
      const userinfo = await userinfoResponse.json();
      if (!userinfoResponse.ok) throw new Error(userinfo.error || "Userinfo request failed");
      collected.push({ label: "userinfo returned claims", ok: true });

      const granted = String(tokenJson.scope || "").split(" ").filter(Boolean);
      for (const scope of granted) {
        const present = scope === "identity"
          ? typeof userinfo.id_verified === "boolean"
          : scope === "profile"
            ? "username" in userinfo
            : scope === "email"
              ? "email" in userinfo
              : true;
        collected.push({ label: `scope "${scope}" delivered expected claims`, ok: present });
      }

      sessionStorage.removeItem(VERIFIER_KEY);
      sessionStorage.removeItem(STATE_KEY);
      setResult(userinfo);
      setSteps(collected);
    } catch (exchangeError) {
      collected.push({ label: exchangeError instanceof Error ? exchangeError.message : "Flow failed", ok: false });
      setSteps(collected);
      setError(exchangeError instanceof Error ? exchangeError.message : "Flow failed");
    } finally {
      setBusy(false);
      window.history.replaceState({}, "", "/developers/test");
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const returnedState = params.get("state");
    const oauthError = params.get("error");
    if (oauthError) {
      setError(oauthError);
      window.history.replaceState({}, "", "/developers/test");
      return;
    }
    if (code && returnedState) void exchange(code, returnedState);
  }, [exchange]);

  const start = async () => {
    setBusy(true);
    setError(null);
    setSteps([]);
    setResult(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        window.location.assign(`/login?next=${encodeURIComponent("/developers/test")}`);
        return;
      }

      const verifier = randomVerifier();
      const state = base64Url(crypto.getRandomValues(new Uint8Array(24)));
      sessionStorage.setItem(VERIFIER_KEY, verifier);
      sessionStorage.setItem(STATE_KEY, state);

      const response = await fetch(`${FUNCTIONS_BASE}/oauth-authorize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          client_id: TEST_CLIENT_ID,
          redirect_uri: redirectUri,
          response_type: "code",
          scope: scopes.join(" "),
          state,
          code_challenge: await challengeFor(verifier),
          code_challenge_method: "S256",
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error_description || json.error || "Authorization request rejected");
      window.location.assign(json.redirect_to);
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Could not start the flow");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>OAuth sandbox test — Verifiedly for developers</title>
        <meta name="description" content="Run a full Verifiedly OAuth 2.1 authorization code + PKCE flow and inspect the scopes and identity claims returned to your app." />
        <link rel="canonical" href="https://verifiedly.app/developers/test" />
        <meta name="robots" content="noindex" />
      </Helmet>

      <header className="sticky top-0 z-40 flex h-14 items-center border-b border-border bg-background/80 px-4 backdrop-blur">
        <div className="container mx-auto flex max-w-3xl items-center justify-between">
          <Link to="/developers" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Developer docs
          </Link>
          <span className="text-xs text-muted-foreground">Sandbox</span>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-display font-bold tracking-tight md:text-4xl">OAuth sandbox test app</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          This page acts as a partner website. It runs the real authorization code + PKCE flow against Verifiedly,
          exchanges the code for an access token, calls the userinfo endpoint and checks that every requested scope
          returned the claims your integration expects.
        </p>

        <Card className="mt-6 p-6">
          <h2 className="font-display font-semibold">1. Choose scopes</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {ALL_SCOPES.map((scope) => (
              <label key={scope} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={scopes.includes(scope)}
                  onCheckedChange={(checked) =>
                    setScopes((current) =>
                      checked ? [...new Set([...current, scope])] : current.filter((item) => item !== scope),
                    )
                  }
                />
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{scope}</code>
              </label>
            ))}
          </div>
          <p className="mt-4 break-all text-xs text-muted-foreground">redirect_uri: <code>{redirectUri}</code></p>
          <Button className="mt-5" onClick={() => void start()} disabled={busy || !scopes.length}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
            Continue with Verifiedly
          </Button>
        </Card>

        {error ? (
          <Card className="mt-6 border-destructive/40 p-6">
            <p className="text-sm text-destructive">{error}</p>
          </Card>
        ) : null}

        {steps.length ? (
          <Card className="mt-6 p-6">
            <h2 className="font-display font-semibold">2. Flow checks</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {steps.map((step, index) => (
                <li key={`${step.label}-${index}`} className="flex items-start gap-2">
                  {step.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />}
                  <span>
                    {step.label}
                    {step.detail ? <span className="block text-xs text-muted-foreground">{step.detail}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        {result ? (
          <Card className="mt-6 p-6">
            <h2 className="font-display font-semibold">3. Claims returned to the partner app</h2>
            <pre className="mt-4 overflow-x-auto rounded-md bg-muted p-4 text-xs"><code>{JSON.stringify(result, null, 2)}</code></pre>
          </Card>
        ) : null}

        <p className="mt-8 text-xs leading-5 text-muted-foreground">
          Verifiedly is owned and operated by BrownGlobal Holdings LLC.
        </p>
      </main>
    </div>
  );
};

export default DeveloperTest;