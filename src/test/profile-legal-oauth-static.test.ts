import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const dashboard = readFileSync("src/pages/Dashboard.tsx", "utf8");
const publicProfile = readFileSync("src/pages/CreatorProfile.tsx", "utf8");
const onboarding = readFileSync("src/pages/Onboarding.tsx", "utf8");
const signup = readFileSync("src/pages/Signup.tsx", "utf8");
const legal = readFileSync("src/lib/legal.ts", "utf8");
const migration = readFileSync(
  "supabase/migrations/20260719010000_profile_consent_oauth_hardening.sql",
  "utf8",
);
const authorize = readFileSync("supabase/functions/oauth-authorize/index.ts", "utf8");
const token = readFileSync("supabase/functions/oauth-token/index.ts", "utf8");
const admin = readFileSync("src/pages/Admin.tsx", "utf8");
const developers = readFileSync("src/pages/Developers.tsx", "utf8");

describe("Verifiedly profile, agreement, and OAuth boundaries", () => {
  it("removes generic bio links from every active profile flow", () => {
    for (const source of [dashboard, publicProfile, onboarding]) {
      expect(source).not.toContain('from("bio_links")');
      expect(source).not.toMatch(/>Links</);
    }
  });

  it("records agreement at signup and synchronizes it without blocking onboarding", () => {
    expect(signup).toContain("disabled={loading || !agreedTerms");
    expect(signup).toContain("vault_policy_certified: true");
    expect(signup).toContain("LEGAL_ACCEPTANCE_STORAGE_KEY");
    expect(onboarding).not.toContain("Review the account agreement");
    expect(onboarding).toContain('from("legal_acceptances")');
    expect(onboarding).toContain('insertError.code !== "23505"');
    expect(onboarding).toContain("console.warn(\"Legal acceptance record was not synchronized\"");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.legal_acceptances");
  });

  it("keeps one canonical document restriction statement including passports", () => {
    expect(legal).toContain("Social Security cards/numbers");
    expect(legal).toContain("passports");
    expect(legal).toContain("government-issued photo IDs");
    expect(migration).toContain("ADD COLUMN IF NOT EXISTS original_filename TEXT");
    expect(migration).toContain("documents_no_identity_document_labels_v2");
    expect(migration).toContain("passport");
  });

  it("requires state, supports PKCE S256, and consumes OAuth codes atomically", () => {
    expect(authorize).toContain('responseType !== "code"');
    expect(authorize).toContain("state.length < 16");
    expect(authorize).toContain('code_challenge_method: codeChallenge ? "S256" : null');
    expect(token).toContain("sha256Base64Url(codeVerifier)");
    expect(token).toContain('admin.rpc("consume_oauth_code"');
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.consume_oauth_code");
  });

  it("provides reachable admin operations for real OAuth clients", () => {
    expect(admin).toContain('id="oauth-clients"');
    expect(admin).toContain('invoke("admin-rotate-oauth-secret"');
    expect(admin).not.toContain("client_secret_hash");
    expect(developers).toContain("/dashboard/admin#oauth-clients");
  });
});
