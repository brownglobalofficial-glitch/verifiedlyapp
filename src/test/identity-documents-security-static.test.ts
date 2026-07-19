import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const migration = readFileSync(
  "supabase/migrations/20260718190000_verifiedly_identity_documents.sql",
  "utf8",
);
const identitySession = readFileSync(
  "supabase/functions/create-identity-session/index.ts",
  "utf8",
);
const identityStatus = readFileSync(
  "supabase/functions/check-identity-status/index.ts",
  "utf8",
);
const shareAccess = readFileSync(
  "supabase/functions/access-document-share/index.ts",
  "utf8",
);
const webhook = readFileSync(
  "supabase/functions/stripe-webhook/index.ts",
  "utf8",
);
const promo = readFileSync(
  "supabase/functions/redeem-promo/index.ts",
  "utf8",
);

describe("Verifiedly Identity and Documents boundaries", () => {
  it("keeps the documents bucket and document rows private", () => {
    expect(migration).toMatch(/'documents',\s*'documents',\s*false/);
    expect(migration).toMatch(/REVOKE ALL ON public\.documents FROM anon, authenticated, PUBLIC;/);
    expect(migration).toMatch(/documents_never_public CHECK \(is_public = false\)/);
    expect(migration).not.toMatch(/CREATE POLICY "Public docs are visible"/);
  });

  it("requires an active Documents plan for reads and uploads", () => {
    expect(migration).toMatch(/Subscribers read own document files[\s\S]*has_active_documents_access\(\)/);
    expect(migration).toMatch(/Subscribers upload own document files[\s\S]*has_active_documents_access\(\)/);
  });

  it("uses the reusable Stripe Identity flow without copying verified outputs", () => {
    expect(identitySession).toContain("STRIPE_IDENTITY_FLOW_ID");
    expect(identitySession).toContain("verification_flow: flowId");
    expect(identitySession).toContain("client_reference_id: user.id");
    expect(identitySession).toContain("idempotencyKey:");
    expect(identitySession).not.toContain("verified_outputs");
    expect(identityStatus).not.toContain("verified_outputs");
  });

  it("only Identity events grant identity status", () => {
    expect(webhook).toContain("identity.verification_session.verified");
    expect(promo).not.toMatch(/is_verified\s*:\s*true/);
    expect(webhook).not.toMatch(/is_verified\s*:\s*true/);
    expect(webhook).toContain('processing_status: "processed"');
    expect(webhook).toContain('processing_status: "failed"');
  });

  it("exchanges revocable share tokens for very short-lived file URLs", () => {
    expect(migration).toContain("token_hash TEXT NOT NULL UNIQUE");
    expect(migration).toContain("revoked_at TIMESTAMPTZ");
    expect(migration).toContain("record_document_share_denial");
    expect(migration).toContain("failed_attempt_count");
    expect(shareAccess).toContain("createSignedUrl(document.storage_path, 60");
    expect(shareAccess).toContain("constantTimeEqual");
  });
});
