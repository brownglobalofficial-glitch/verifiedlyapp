import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const migration = readFileSync(
  "supabase/migrations/20260719090000_business_directory_credentials.sql",
  "utf8",
);
const directory = readFileSync("src/pages/Directory.tsx", "utf8");
const credentials = readFileSync("src/pages/dashboard/Credentials.tsx", "utf8");
const userinfo = readFileSync("supabase/functions/oauth-userinfo/index.ts", "utf8");

describe("organization discovery and credential verification boundaries", () => {
  it("keeps discovery opt-in and background screening outside this release", () => {
    expect(migration).toContain("search_visible BOOLEAN NOT NULL DEFAULT false");
    expect(migration).toContain("Background screening is intentionally not included");
    expect(directory).toContain("Verifiedly is not a job board");
    expect(directory).toContain("Background checks are not available");
  });

  it("keeps verification outcomes under service-role control", () => {
    expect(migration).toContain("GRANT UPDATE (display_public) ON public.credential_verifications TO authenticated");
    expect(migration).not.toContain("GRANT INSERT ON public.credential_verifications TO authenticated");
    expect(migration).toContain("status = 'verified'");
    expect(migration).toContain("display_public = true");
  });

  it("does not pretend a saved request is a completed provider check", () => {
    expect(migration).toContain("'provider_setup_required'");
    expect(credentials).toContain("No payment was taken");
    expect(credentials).toContain("A document upload is never treated as proof by itself");
  });

  it("keeps business badge fields server controlled", () => {
    const updateGrant = migration.match(/GRANT UPDATE \(([\s\S]*?)\) ON public\.profiles TO authenticated;/)?.[1] || "";
    expect(updateGrant).toContain("organization_legal_name");
    expect(updateGrant).not.toContain("business_verified");
    expect(updateGrant).not.toContain("business_verified_at");
  });

  it("shares only public verified credential claims through an explicit OAuth scope", () => {
    expect(userinfo).toContain('scopes.includes("credentials")');
    expect(userinfo).toContain('.eq("status", "verified")');
    expect(userinfo).toContain('.eq("display_public", true)');
    expect(userinfo).not.toContain("provider_order_id");
  });
});
