import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const onboarding = readFileSync("src/pages/Onboarding.tsx", "utf8");
const dashboard = readFileSync("src/pages/Dashboard.tsx", "utf8");
const publicProfile = readFileSync("src/pages/CreatorProfile.tsx", "utf8");
const settings = readFileSync("src/pages/ProfileSettings.tsx", "utf8");
const providerMigration = readFileSync(
  "supabase/migrations/20260719140000_global_organization_provider.sql",
  "utf8",
);

describe("Verifiedly account-type onboarding", () => {
  it("keeps websites organization-only in onboarding, editing, and public profiles", () => {
    expect(onboarding).toContain('accountType === "business" && <div><Label htmlFor="website">');
    expect(onboarding).toContain('accountType === "business" && website.trim()');
    expect(dashboard).toContain('form.accountType === "business" && (');
    expect(dashboard).toContain('const normalizedWebsite = form.accountType === "business"');
    expect(publicProfile).toContain("const website = isOrganization ? safeExternalUrl(profile.website) : null");
  });

  it("uses the focused launch social set without LinkedIn", () => {
    for (const source of [onboarding, dashboard, publicProfile]) {
      expect(source).not.toContain("LinkedIn");
      expect(source).not.toContain("linkedin.com");
    }
    for (const platform of ["Instagram", "YouTube", "TikTok", "Facebook", "X"]) {
      expect(onboarding).toContain(platform);
    }
  });

  it("uses account-appropriate labels and shows a live appearance preview", () => {
    expect(onboarding).toContain("Organization type");
    expect(onboarding).toContain("Professional label");
    expect(onboarding).toContain("Football club, academy, business, nonprofit");
    expect(onboarding).toContain("Footballer, student, founder, photographer");
    expect(onboarding).toContain("selectedTheme");
    expect(settings).toContain('aria-label="Live profile appearance preview"');
  });

  it("uses one global-first KYB provider for the initial organization pilot", () => {
    expect(providerMigration).toContain("VALUES (_user_id, 'persona')");
    expect(providerMigration).not.toContain("middesk");
  });
});
