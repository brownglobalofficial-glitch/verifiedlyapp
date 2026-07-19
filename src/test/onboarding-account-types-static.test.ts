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
    expect(onboarding).toContain('accountType === "business" && (');
    expect(onboarding).toContain('accountType === "business" && website.trim()');
    expect(dashboard).toContain('form.accountType === "business" && (');
    expect(dashboard).toContain('const normalizedWebsite = form.accountType === "business"');
    expect(publicProfile).toContain("const website = isOrganization ? safeExternalUrl(profile.website) : null");
  });

  it("keeps social links out of the required onboarding path", () => {
    expect(onboarding).not.toContain("Social profiles");
    expect(onboarding).not.toContain("Instagram handle or URL");
    expect(onboarding).not.toContain("YouTube handle or URL");
    expect(onboarding).not.toContain("TikTok handle or URL");
    expect(onboarding).not.toContain("Facebook handle or URL");
    expect(onboarding).not.toContain("X handle or URL");
  });

  it("uses account-appropriate labels and the default clean appearance", () => {
    expect(onboarding).toContain(">Person<");
    expect(onboarding).toContain(">Organization<");
    expect(onboarding).toContain("Organization type");
    expect(onboarding).toContain("Professional label");
    expect(onboarding).toContain("Football club, academy, business, nonprofit");
    expect(onboarding).toContain("Footballer, student, founder, photographer");
    expect(onboarding).not.toContain("selectedTheme");
    expect(onboarding).not.toContain("Choose a clean appearance");
    expect(settings).toContain('aria-label="Live profile appearance preview"');
  });

  it("uses one global-first KYB provider for the initial organization pilot", () => {
    expect(providerMigration).toContain("VALUES (_user_id, 'persona')");
    expect(providerMigration).not.toContain("middesk");
  });
});
