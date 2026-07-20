import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const migration = readFileSync(
  "supabase/migrations/20260718023000_protect_identity_outputs.sql",
  "utf8",
);

describe("profile permission boundary", () => {
  it("replaces broad public profile reads with an explicit column allow-list", () => {
    expect(migration).toMatch(/REVOKE SELECT ON public\.profiles FROM anon, authenticated, PUBLIC;/);

    const anonGrant = migration.match(/GRANT SELECT \(([\s\S]*?)\) ON public\.profiles TO anon;/)?.[1] || "";
    expect(anonGrant).toContain("id_verified");
    expect(anonGrant).not.toContain("verified_full_name");
    expect(anonGrant).not.toContain("verification_status");
    expect(anonGrant).not.toContain("date_of_birth");
  });

  it("does not let authenticated profile owners write identity status", () => {
    expect(migration).toMatch(/REVOKE INSERT, UPDATE ON public\.profiles FROM anon, authenticated, PUBLIC;/);

    const updateGrant = migration.match(/GRANT UPDATE \(([\s\S]*?)\) ON public\.profiles TO authenticated;/)?.[1] || "";
    expect(updateGrant).toContain("display_name");
    expect(updateGrant).not.toContain("id_verified");
    expect(updateGrant).not.toContain("verification_status");
    expect(updateGrant).not.toContain("is_pro");
  });
});
