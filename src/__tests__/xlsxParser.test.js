// ─── xlsxParser.test.js ───────────────────────────────────────────────────────
// Tests for isTestEmail() and processRows() from src/utils/xlsxParser.js
// Read the source carefully — processRows() supports two formats:
//   • Pipedrive format  — detected when "status" OR "verification job" column is absent
//   • CreditScore format — detected when BOTH "status" AND "verification job" columns exist

import { describe, it, expect } from "vitest";
import { isTestEmail, processRows } from "../utils/xlsxParser.js";

// ─── isTestEmail ──────────────────────────────────────────────────────────────

describe("isTestEmail", () => {
  // null / undefined / empty → treated as test
  it("returns true for null", () => expect(isTestEmail(null)).toBe(true));
  it("returns true for undefined", () => expect(isTestEmail(undefined)).toBe(true));
  it("returns true for empty string", () => expect(isTestEmail("")).toBe(true));

  // @clovrlabs. domain (note: typo variant also covered)
  it("returns true for @clovrlabs. domain", () =>
    expect(isTestEmail("david@clovrlabs.com")).toBe(true));
  it("returns true for @clorvrlabs. typo domain", () =>
    expect(isTestEmail("ferran@clorvrlabs.io")).toBe(true));

  // Known exact addresses
  it("returns true for test@test.com", () =>
    expect(isTestEmail("test@test.com")).toBe(true));
  it("returns true for asd@asda.com", () =>
    expect(isTestEmail("asd@asda.com")).toBe(true));
  it("returns true for ferran@test.com", () =>
    expect(isTestEmail("ferran@test.com")).toBe(true));
  it("returns true for f@test.com", () =>
    expect(isTestEmail("f@test.com")).toBe(true));
  it("returns true for a@xn--6ca.com (punycode test address)", () =>
    expect(isTestEmail("a@xn--6ca.com")).toBe(true));

  // Regex pattern: /^(test|asd|a|f)@/
  it("returns true for test@anything.com via regex", () =>
    expect(isTestEmail("test@anydomain.org")).toBe(true));
  it("returns true for asd@whatever.net via regex", () =>
    expect(isTestEmail("asd@whatever.net")).toBe(true));
  it("returns true for a@example.com via regex (single 'a' prefix)", () =>
    expect(isTestEmail("a@example.com")).toBe(true));
  it("returns true for f@gmail.com via regex (single 'f' prefix)", () =>
    expect(isTestEmail("f@gmail.com")).toBe(true));

  // Case-insensitive matching
  it("returns true for uppercase TEST@TEST.COM", () =>
    expect(isTestEmail("TEST@TEST.COM")).toBe(true));
  it("returns true for mixed case Ferran@Test.Com", () =>
    expect(isTestEmail("Ferran@Test.Com")).toBe(true));

  // Real emails that must return false
  it("returns false for a normal business email", () =>
    expect(isTestEmail("ana.garcia@gmail.com")).toBe(false));
  it("returns false for name starting with 'te' (not 'test@')", () =>
    expect(isTestEmail("testimonial@company.com")).toBe(false));
  it("returns false for email that contains 'test' in domain but valid prefix", () =>
    expect(isTestEmail("bob@testcompany.com")).toBe(false));
  it("returns false for carlos.martinez@outlook.com", () =>
    expect(isTestEmail("carlos.martinez@outlook.com")).toBe(false));
  it("returns false for info@creditchecker.io", () =>
    expect(isTestEmail("info@creditchecker.io")).toBe(false));
});

// ─── Helper factories ─────────────────────────────────────────────────────────

// Build a minimal Pipedrive-format sheet
// Headers: person - name | person - email | lead - title | lead created
function makePipedriveSheet(leads) {
  const headers = ["person - name", "person - email", "lead - title", "lead created"];
  const rows = leads.map(({ name, email, title, created }) => [name, email, title, created]);
  return { headers, rows };
}

// Build a minimal CreditScore-format sheet
// Must include BOTH "status" and "verification job" columns.
const CS_HEADERS = [
  "name", "email", "created", "status", "verification job",
  "age", "monthly net income", "monthly expenses", "desired loan amount",
  "installment months", "loan purpose", "employment status",
  "residential status", "emergency fund", "email verified at",
  "pdf generated", "existing loan", "accommodation cost", "language",
];

function makeCsRow(overrides = {}) {
  const defaults = {
    name: "John Doe",
    email: "john.doe@example.com",
    created: "2026-01-15",
    status: "completed",
    "verification job": "matched",
    age: 35,
    "monthly net income": 2500,
    "monthly expenses": 600,
    "desired loan amount": 10000,
    "installment months": 36,
    "loan purpose": "personal",
    "employment status": "employed",
    "residential status": "owner",
    "emergency fund": "yes",
    "email verified at": "2026-01-10",
    "pdf generated": "",
    "existing loan": "",
    "accommodation cost": "",
    language: "spanish",
  };
  const merged = { ...defaults, ...overrides };
  return CS_HEADERS.map((h) => merged[h] ?? "");
}

function makeCsSheet(overridesList = [{}]) {
  return { headers: CS_HEADERS, rows: overridesList.map(makeCsRow) };
}

// ─── processRows — Pipedrive format ──────────────────────────────────────────

describe("processRows — Pipedrive format", () => {
  it("categorises Bank Connected leads correctly", () => {
    const { headers, rows } = makePipedriveSheet([
      { name: "Ana García", email: "ana@gmail.com", title: "Bank Connected", created: "2026-03-01" },
    ]);
    const result = processRows(rows, headers);
    expect(result["Bank Connected"]).toHaveLength(1);
    expect(result["Bank Connected"][0].name).toBe("Ana García");
    expect(result["Form Submitted"]).toHaveLength(0);
    expect(result["Incomplete"]).toHaveLength(0);
  });

  it("categorises Form Submitted leads correctly", () => {
    const { headers, rows } = makePipedriveSheet([
      { name: "Carlos Ruiz", email: "carlos@outlook.com", title: "Form Submitted Lead", created: "2026-03-02" },
    ]);
    const result = processRows(rows, headers);
    expect(result["Form Submitted"]).toHaveLength(1);
    expect(result["Bank Connected"]).toHaveLength(0);
  });

  it("categorises 'iban check' title as Form Submitted", () => {
    const { headers, rows } = makePipedriveSheet([
      { name: "Maria Lopez", email: "maria@gmail.com", title: "IBAN Check Submission", created: "2026-03-01" },
    ]);
    const result = processRows(rows, headers);
    expect(result["Form Submitted"]).toHaveLength(1);
  });

  it("categorises 'account verification' title as Form Submitted", () => {
    const { headers, rows } = makePipedriveSheet([
      { name: "Pedro Navarro", email: "pedro@gmail.com", title: "Account Verification", created: "2026-03-01" },
    ]);
    const result = processRows(rows, headers);
    expect(result["Form Submitted"]).toHaveLength(1);
  });

  it("categorises 'cta' title as Form Submitted", () => {
    const { headers, rows } = makePipedriveSheet([
      { name: "Sara Muñoz", email: "sara@gmail.com", title: "CTA Landing Page", created: "2026-03-01" },
    ]);
    const result = processRows(rows, headers);
    expect(result["Form Submitted"]).toHaveLength(1);
  });

  it("skips rows with unknown title (not categorised)", () => {
    const { headers, rows } = makePipedriveSheet([
      { name: "Unknown Lead", email: "unknown@gmail.com", title: "Callback Request", created: "2026-03-01" },
    ]);
    const result = processRows(rows, headers);
    expect(result["Bank Connected"]).toHaveLength(0);
    expect(result["Form Submitted"]).toHaveLength(0);
    expect(result["Incomplete"]).toHaveLength(0);
  });

  it("skips test emails in Pipedrive format", () => {
    const { headers, rows } = makePipedriveSheet([
      { name: "Test User", email: "test@test.com", title: "Bank Connected", created: "2026-03-01" },
      { name: "Real User", email: "real@gmail.com", title: "Bank Connected", created: "2026-03-01" },
    ]);
    const result = processRows(rows, headers);
    expect(result["Bank Connected"]).toHaveLength(1);
    expect(result["Bank Connected"][0].email).toBe("real@gmail.com");
  });

  it("returns empty categories for empty rows array", () => {
    const { headers } = makePipedriveSheet([]);
    const result = processRows([], headers);
    expect(result["Bank Connected"]).toHaveLength(0);
    expect(result["Form Submitted"]).toHaveLength(0);
    expect(result["Incomplete"]).toHaveLength(0);
  });

  it("deduplicates by email — prefers Bank Connected over Form Submitted", () => {
    const { headers, rows } = makePipedriveSheet([
      { name: "Ana García",   email: "ana@gmail.com", title: "Form Submitted Lead", created: "2026-03-01" },
      { name: "Ana García",   email: "ana@gmail.com", title: "Bank Connected",      created: "2026-03-01" },
    ]);
    const result = processRows(rows, headers);
    expect(result["Bank Connected"]).toHaveLength(1);
    expect(result["Form Submitted"]).toHaveLength(0);
  });

  it("deduplicates — first-seen Bank Connected wins even if Form Submitted appears later", () => {
    const { headers, rows } = makePipedriveSheet([
      { name: "Carlos M", email: "carlos@gmail.com", title: "Bank Connected",      created: "2026-02-01" },
      { name: "Carlos M", email: "carlos@gmail.com", title: "Form Submitted Lead", created: "2026-03-01" },
    ]);
    const result = processRows(rows, headers);
    expect(result["Bank Connected"]).toHaveLength(1);
    expect(result["Form Submitted"]).toHaveLength(0);
  });

  it("normalises email to lowercase", () => {
    const { headers, rows } = makePipedriveSheet([
      { name: "Elena V", email: "ELENA.V@GMAIL.COM", title: "Bank Connected", created: "2026-03-01" },
    ]);
    const result = processRows(rows, headers);
    expect(result["Bank Connected"][0].email).toBe("elena.v@gmail.com");
  });

  it("all-uppercase email is treated the same as lowercase for dedup", () => {
    const { headers, rows } = makePipedriveSheet([
      { name: "Isabel R", email: "ISABEL@GMAIL.COM", title: "Form Submitted Lead", created: "2026-03-01" },
      { name: "Isabel R", email: "isabel@gmail.com", title: "Bank Connected",      created: "2026-03-01" },
    ]);
    const result = processRows(rows, headers);
    // Both map to the same lowercased email; Bank Connected wins
    expect(result["Bank Connected"]).toHaveLength(1);
    expect(result["Form Submitted"]).toHaveLength(0);
  });

  it("leads without email are kept (pushed to category without dedup)", () => {
    const { headers, rows } = makePipedriveSheet([
      { name: "No Email Lead", email: "", title: "Form Submitted Lead", created: "2026-03-01" },
    ]);
    const result = processRows(rows, headers);
    // processRows pushes no-email leads directly to res[cat]
    expect(result["Form Submitted"]).toHaveLength(1);
  });
});

// ─── processRows — CreditScore format ────────────────────────────────────────

describe("processRows — CreditScore format", () => {
  it("detects CreditScore format and returns correct structure", () => {
    const { headers, rows } = makeCsSheet([{}]);
    const result = processRows(rows, headers);
    expect(result).toHaveProperty("Bank Connected");
    expect(result).toHaveProperty("Form Submitted");
    expect(result).toHaveProperty("Incomplete");
  });

  it("status=completed → Bank Connected", () => {
    const { headers, rows } = makeCsSheet([{ status: "completed", "verification job": "matched" }]);
    const result = processRows(rows, headers);
    expect(result["Bank Connected"]).toHaveLength(1);
  });

  it("status=verifying + verif=matched → Bank Connected", () => {
    const { headers, rows } = makeCsSheet([{ status: "verifying", "verification job": "matched" }]);
    const result = processRows(rows, headers);
    expect(result["Bank Connected"]).toHaveLength(1);
  });

  it("status=verifying + verif=mismatch → Bank Connected", () => {
    const { headers, rows } = makeCsSheet([{ status: "verifying", "verification job": "mismatch" }]);
    const result = processRows(rows, headers);
    expect(result["Bank Connected"]).toHaveLength(1);
  });

  it("status=verifying + verif=consent → Bank Connected", () => {
    const { headers, rows } = makeCsSheet([{ status: "verifying", "verification job": "consent" }]);
    const result = processRows(rows, headers);
    expect(result["Bank Connected"]).toHaveLength(1);
  });

  it("status=pending + verif=pending → Form Submitted", () => {
    const { headers, rows } = makeCsSheet([{ status: "pending", "verification job": "pending" }]);
    const result = processRows(rows, headers);
    expect(result["Form Submitted"]).toHaveLength(1);
  });

  it("status=cancelled → Incomplete", () => {
    const { headers, rows } = makeCsSheet([{ status: "cancelled", "verification job": "" }]);
    const result = processRows(rows, headers);
    expect(result["Incomplete"]).toHaveLength(1);
  });

  it("unknown status → Incomplete", () => {
    const { headers, rows } = makeCsSheet([{ status: "unknown_xyz", "verification job": "" }]);
    const result = processRows(rows, headers);
    expect(result["Incomplete"]).toHaveLength(1);
  });

  it("skips test emails in CreditScore format", () => {
    const { headers, rows } = makeCsSheet([
      { email: "test@test.com", status: "completed" },
      { email: "real@example.com", status: "completed" },
    ]);
    const result = processRows(rows, headers);
    expect(result["Bank Connected"]).toHaveLength(1);
    expect(result["Bank Connected"][0].email).toBe("real@example.com");
  });

  it("returns empty categories for empty rows", () => {
    const result = processRows([], CS_HEADERS);
    expect(result["Bank Connected"]).toHaveLength(0);
    expect(result["Form Submitted"]).toHaveLength(0);
    expect(result["Incomplete"]).toHaveLength(0);
  });

  it("deduplicates by email — keeps row with better status priority", () => {
    // completed (pri=0) vs pending/pending (pri=4) — completed wins
    const { headers, rows } = makeCsSheet([
      { email: "dup@example.com", status: "pending",   "verification job": "pending",  "monthly net income": 1800 },
      { email: "dup@example.com", status: "completed", "verification job": "matched",  "monthly net income": 1800 },
    ]);
    const result = processRows(rows, headers);
    const total = result["Bank Connected"].length + result["Form Submitted"].length + result["Incomplete"].length;
    expect(total).toBe(1);
    expect(result["Bank Connected"]).toHaveLength(1);
  });

  it("deduplicates — same priority: keeps higher scoring row", () => {
    // Both pending/pending (pri=4) — pick higher income
    const { headers, rows } = makeCsSheet([
      { email: "same@example.com", status: "pending", "verification job": "pending", "monthly net income": 1000, created: "2026-01-01" },
      { email: "same@example.com", status: "pending", "verification job": "pending", "monthly net income": 3500, created: "2026-01-01" },
    ]);
    const result = processRows(rows, headers);
    const total = result["Bank Connected"].length + result["Form Submitted"].length + result["Incomplete"].length;
    expect(total).toBe(1);
    // The higher income row should survive
    const kept = [...result["Bank Connected"], ...result["Form Submitted"], ...result["Incomplete"]][0];
    expect(Number(kept.income)).toBe(3500);
  });

  it("all-uppercase email matches lowercase for dedup", () => {
    const { headers, rows } = makeCsSheet([
      { email: "UPPER@EXAMPLE.COM", status: "pending",   "verification job": "pending" },
      { email: "upper@example.com", status: "completed", "verification job": "matched" },
    ]);
    const result = processRows(rows, headers);
    const total = result["Bank Connected"].length + result["Form Submitted"].length + result["Incomplete"].length;
    expect(total).toBe(1);
    expect(result["Bank Connected"]).toHaveLength(1);
  });

  it("maps language 'spanish' to country 'es'", () => {
    const { headers, rows } = makeCsSheet([{ language: "spanish", status: "completed" }]);
    const result = processRows(rows, headers);
    expect(result["Bank Connected"][0].country).toBe("es");
  });

  it("maps language 'english' to country 'en'", () => {
    const { headers, rows } = makeCsSheet([{ language: "english", status: "completed" }]);
    const result = processRows(rows, headers);
    expect(result["Bank Connected"][0].country).toBe("en");
  });

  it("maps language 'português' to country 'pt'", () => {
    const { headers, rows } = makeCsSheet([{ language: "português", status: "completed" }]);
    const result = processRows(rows, headers);
    expect(result["Bank Connected"][0].country).toBe("pt");
  });

  it("emailVerified is true when email verified at cell is non-empty", () => {
    const { headers, rows } = makeCsSheet([{ "email verified at": "2026-01-10", status: "completed" }]);
    const result = processRows(rows, headers);
    expect(result["Bank Connected"][0].emailVerified).toBe(true);
  });

  it("emailVerified is false when email verified at cell is empty", () => {
    const { headers, rows } = makeCsSheet([{ "email verified at": "", status: "completed" }]);
    const result = processRows(rows, headers);
    expect(result["Bank Connected"][0].emailVerified).toBe(false);
  });

  it("created date is sliced to 10 chars (YYYY-MM-DD)", () => {
    const { headers, rows } = makeCsSheet([{ created: "2026-03-15T08:30:00Z", status: "completed" }]);
    const result = processRows(rows, headers);
    expect(result["Bank Connected"][0].created).toBe("2026-03-15");
  });
});
