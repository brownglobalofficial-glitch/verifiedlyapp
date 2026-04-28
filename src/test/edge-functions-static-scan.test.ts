import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Static safety net for edge functions.
 * Catches the two failure modes that previously caused production 500s:
 *   1. `req.headers.get("Authorization")!` (non-null assertion) → null deref
 *   2. Writes to columns that no longer exist on tables we read here.
 */
const FUNCTIONS_DIR = "supabase/functions";
const KNOWN_DROPPED_COLUMNS: Record<string, string[]> = {
  // profiles.stripe_connect_account_id was moved to creator_private_data
  profiles: ["stripe_connect_account_id"],
};

function listFunctionEntries(): { name: string; file: string }[] {
  return readdirSync(FUNCTIONS_DIR)
    .filter((d) => !d.startsWith("_"))
    .map((d) => ({ name: d, file: join(FUNCTIONS_DIR, d, "index.ts") }))
    .filter((e) => {
      try { return statSync(e.file).isFile(); } catch { return false; }
    });
}

describe("edge functions static scan", () => {
  const fns = listFunctionEntries();

  it("never uses non-null Authorization header assertion", () => {
    const offenders: string[] = [];
    for (const { name, file } of fns) {
      const src = readFileSync(file, "utf8");
      if (/headers\.get\(["']Authorization["']\)!/i.test(src)) offenders.push(name);
    }
    expect(offenders, `These functions force-unwrap the Authorization header (will 500 if absent): ${offenders.join(", ")}`).toEqual([]);
  });

  it("does not write to dropped DB columns", () => {
    const offenders: { fn: string; table: string; col: string }[] = [];
    for (const { name, file } of fns) {
      const src = readFileSync(file, "utf8");
      for (const [table, dropped] of Object.entries(KNOWN_DROPPED_COLUMNS)) {
        const tableUsed = new RegExp(`\\.from\\(["']${table}["']\\)`).test(src);
        if (!tableUsed) continue;
        for (const col of dropped) {
          // Only flag .update({ col: ... }) or .upsert({ col: ... }) — not reads.
          const writeRe = new RegExp(`\\.(update|upsert|insert)\\([^)]*${col}\\s*:`, "s");
          if (writeRe.test(src)) offenders.push({ fn: name, table, col });
        }
      }
    }
    expect(offenders, `Edge functions write to columns that no longer exist: ${JSON.stringify(offenders)}`).toEqual([]);
  });
});