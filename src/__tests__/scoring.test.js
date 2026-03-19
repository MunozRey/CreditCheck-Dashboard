// ─── scoring.test.js ──────────────────────────────────────────────────────────
// Tests for scoreLead(), GRADE_LABEL, and GRADE_COLOR from src/utils/scoring.js
//
// Model breakdown (100 pts):
//   Income adequacy (0-25)  · DTI Banco de España (0-25)  · LTI (0-15)
//   Employment (0-15)       · Email verified (0-10)       · Full name (0-5)
//   Age fit (0-5)
//
// Grade thresholds: A ≥75 · B 50-74 · C 30-49 · D <30

import { describe, it, expect } from "vitest";
import { scoreLead, GRADE_LABEL, GRADE_COLOR } from "../utils/scoring.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

// A "perfect" lead that scores 100 (or close to it)
const perfectLead = {
  income: 4000,         // 25 pts
  expenses: 1000,       // DTI = 0.25 < 0.30 → 25 pts
  loanAmount: 5000,     // LTI = 5000 / (4000*12) ≈ 0.104 ≤ 0.5 → 15 pts
  employment: "civil_servant", // 15 pts
  emailVerified: true,  // 10 pts
  name: "Ana García",   // 2 words → 5 pts
  age: 40,              // 30-55 → 5 pts
};

// ─── Return value ─────────────────────────────────────────────────────────────

describe("scoreLead — return value", () => {
  it("returns a number for a perfect lead", () => {
    const s = scoreLead(perfectLead);
    expect(typeof s).toBe("number");
  });

  it("score of perfect lead is 100", () => {
    expect(scoreLead(perfectLead)).toBe(100);
  });

  it("score is always in range 0-100", () => {
    const leads = [
      {},
      perfectLead,
      { income: 0, expenses: 0, loanAmount: 0 },
      { income: -1000, expenses: 9999, loanAmount: 0 },
      { income: 10000, expenses: 1, loanAmount: 1 },
    ];
    for (const lead of leads) {
      const s = scoreLead(lead);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(100);
    }
  });

  it("returns an integer (Math.round applied)", () => {
    const s = scoreLead(perfectLead);
    expect(Number.isInteger(s)).toBe(true);
  });
});

// ─── Income factor (0-25 pts) ─────────────────────────────────────────────────

describe("scoreLead — income adequacy", () => {
  const base = { employment: "civil_servant", emailVerified: true, name: "A B", age: 40 };

  it("income ≥ 3500 → 25 pts income", () => {
    // We isolate income contribution: use inc=3500, no expenses/loan (DTI=0 fallback=10, LTI=0 fallback=8)
    const s = scoreLead({ ...base, income: 3500 });
    // 25 (income) + 10 (DTI default) + 8 (LTI default) + 15 (civil_servant) + 10 (email) + 5 (name) + 5 (age)
    expect(s).toBe(78);
  });

  it("income ≥ 2500 → 20 pts income", () => {
    const s = scoreLead({ ...base, income: 2500 });
    // 20+10+8+15+10+5+5
    expect(s).toBe(73);
  });

  it("income ≥ 2000 → 15 pts income", () => {
    const s = scoreLead({ ...base, income: 2000 });
    expect(s).toBe(68);
  });

  it("income ≥ 1500 → 9 pts income", () => {
    const s = scoreLead({ ...base, income: 1500 });
    expect(s).toBe(62);
  });

  it("income ≥ 1000 → 4 pts income", () => {
    const s = scoreLead({ ...base, income: 1000 });
    expect(s).toBe(57);
  });

  it("income < 1000 → 0 pts income", () => {
    const s = scoreLead({ ...base, income: 999 });
    expect(s).toBe(53);
  });

  it("missing income (undefined) → 0 pts income, does not crash", () => {
    const s = scoreLead({ ...base });
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(100);
  });
});

// ─── DTI factor (0-25 pts) ────────────────────────────────────────────────────

describe("scoreLead — DTI", () => {
  const base = { income: 2000, employment: "employed", name: "A B", age: 40 };

  it("DTI < 0.30 → 25 pts DTI", () => {
    // expenses / income = 500/2000 = 0.25
    const s = scoreLead({ ...base, expenses: 500, loanAmount: 0 });
    // 15 (inc 2000) + 25 (DTI 0.25) + 8 (LTI default) + 13 (employed) + 5 (name) + 5 (age)
    expect(s).toBe(71);
  });

  it("0.30 ≤ DTI < 0.35 → 19 pts DTI", () => {
    const s = scoreLead({ ...base, expenses: 620, loanAmount: 0 });
    // DTI = 620/2000 = 0.31
    expect(s).toBe(65);
  });

  it("0.35 ≤ DTI < 0.40 → 12 pts DTI", () => {
    const s = scoreLead({ ...base, expenses: 740, loanAmount: 0 });
    // DTI = 740/2000 = 0.37
    expect(s).toBe(58);
  });

  it("0.40 ≤ DTI < 0.50 → 5 pts DTI", () => {
    const s = scoreLead({ ...base, expenses: 900, loanAmount: 0 });
    // DTI = 900/2000 = 0.45
    expect(s).toBe(51);
  });

  it("DTI ≥ 0.50 → 0 pts DTI", () => {
    const s = scoreLead({ ...base, expenses: 1100, loanAmount: 0 });
    // DTI = 1100/2000 = 0.55
    expect(s).toBe(46);
  });

  it("income=0 and expenses=0 → no division by zero, fallback 10 pts DTI", () => {
    const s = scoreLead({ ...base, income: 0, expenses: 0 });
    expect(() => scoreLead({ ...base, income: 0, expenses: 0 })).not.toThrow();
    expect(s).toBeGreaterThanOrEqual(0);
    // When inc=0, else branch adds 10 pts DTI
  });

  it("income>0 but expenses=0 → else branch, fallback 10 pts DTI", () => {
    // The condition is: if (inc > 0 && exp > 0) — if expenses is 0, else applies
    const s = scoreLead({ ...base, income: 2000, expenses: 0 });
    expect(s).toBeGreaterThanOrEqual(0);
  });

  it("income=0 and expenses=500 → no crash, fallback 10 pts DTI", () => {
    expect(() => scoreLead({ ...base, income: 0, expenses: 500 })).not.toThrow();
  });
});

// ─── LTI factor (0-15 pts) ────────────────────────────────────────────────────

describe("scoreLead — Loan-to-Income", () => {
  const base = { income: 3000, expenses: 700, employment: "employed", name: "A B", age: 40 };

  it("LTI ≤ 0.5 → 15 pts", () => {
    // loan / (3000*12) = 18000 / 36000 = 0.5 exactly
    const s = scoreLead({ ...base, loanAmount: 18000 });
    expect(s).toBeGreaterThanOrEqual(0);
    // DTI = 700/3000 ≈ 0.233 → 25pts; LTI ≤ 0.5 → 15pts
    // 20+25+15+13+5+5 = 83
    expect(s).toBe(83);
  });

  it("0.5 < LTI ≤ 1.0 → 11 pts", () => {
    const s = scoreLead({ ...base, loanAmount: 30000 });
    // LTI = 30000/36000 ≈ 0.833
    // 20+25+11+13+5+5 = 79
    expect(s).toBe(79);
  });

  it("1.0 < LTI ≤ 2.0 → 6 pts", () => {
    const s = scoreLead({ ...base, loanAmount: 60000 });
    // LTI = 60000/36000 ≈ 1.667
    // 20+25+6+13+5+5 = 74
    expect(s).toBe(74);
  });

  it("2.0 < LTI ≤ 3.0 → 2 pts", () => {
    const s = scoreLead({ ...base, loanAmount: 90000 });
    // LTI = 90000/36000 = 2.5
    // 20+25+2+13+5+5 = 70
    expect(s).toBe(70);
  });

  it("LTI > 3.0 → 0 pts", () => {
    const s = scoreLead({ ...base, loanAmount: 200000 });
    // LTI = 200000/36000 ≈ 5.56
    // 20+25+0+13+5+5 = 68
    expect(s).toBe(68);
  });

  it("missing loan → fallback 8 pts LTI", () => {
    // No loanAmount field
    const s = scoreLead({ ...base });
    // DTI = 700/3000 ≈ 0.233 → 25pts; LTI default 8; 20+25+8+13+5+5 = 76
    expect(s).toBe(76);
  });

  it("loan=0 → fallback 8 pts LTI", () => {
    const s = scoreLead({ ...base, loanAmount: 0 });
    expect(s).toBe(76);
  });
});

// ─── Employment factor (0-15 pts) ────────────────────────────────────────────

describe("scoreLead — employment stability", () => {
  const base = { income: 2500, expenses: 600, loanAmount: 10000, emailVerified: true, name: "A B", age: 40 };
  // income 2500 → 20pts, DTI=600/2500=0.24 → 25pts, LTI=10000/(2500*12)=0.333 ≤ 0.5 → 15pts, email+name+age = 10+5+5=20
  // Base without employment: 80

  it("civil_servant → 15 pts (total 95)", () => {
    expect(scoreLead({ ...base, employment: "civil_servant" })).toBe(95);
  });

  it("employed → 13 pts (total 93)", () => {
    expect(scoreLead({ ...base, employment: "employed" })).toBe(93);
  });

  it("self_employed → 10 pts (total 90)", () => {
    expect(scoreLead({ ...base, employment: "self_employed" })).toBe(90);
  });

  it("retired → 9 pts (total 89)", () => {
    expect(scoreLead({ ...base, employment: "retired" })).toBe(89);
  });

  it("part_time → 5 pts (total 85)", () => {
    expect(scoreLead({ ...base, employment: "part_time" })).toBe(85);
  });

  it("unemployed → 0 pts employment", () => {
    expect(scoreLead({ ...base, employment: "unemployed" })).toBe(80);
  });

  it("empty string employment → 0 pts", () => {
    expect(scoreLead({ ...base, employment: "" })).toBe(80);
  });

  it("unknown employment value (not 'unemployed') → 4 pts (total 84)", () => {
    // The else branch: emp && emp !== "unemployed" → +4
    expect(scoreLead({ ...base, employment: "student" })).toBe(84);
  });

  it("missing employment field → 0 pts (no crash)", () => {
    expect(() => scoreLead({ ...base })).not.toThrow();
    const s = scoreLead({ ...base });
    expect(s).toBeGreaterThanOrEqual(0);
  });

  it("case-insensitive: EMPLOYED matches employed branch", () => {
    // The source lowercases: const emp = (r.employment || "").toLowerCase()
    // So "EMPLOYED" should hit the "employed" branch → 13 pts
    expect(scoreLead({ ...base, employment: "EMPLOYED" })).toBe(93);
  });
});

// ─── Email verified factor (0-10 pts) ────────────────────────────────────────

describe("scoreLead — email verified", () => {
  const base = { income: 2500, expenses: 600, loanAmount: 10000, employment: "employed", name: "A B", age: 40 };
  // Without email: 20+25+15+13+5+5 = 83

  it("emailVerified=true → +10 pts", () => {
    expect(scoreLead({ ...base, emailVerified: true })).toBe(93);
  });

  it("emailVerified=false → +0 pts", () => {
    expect(scoreLead({ ...base, emailVerified: false })).toBe(83);
  });

  it("emailVerified=undefined → +0 pts (no crash)", () => {
    expect(() => scoreLead({ ...base })).not.toThrow();
    expect(scoreLead({ ...base })).toBe(83);
  });
});

// ─── Full name factor (0-5 pts) ───────────────────────────────────────────────

describe("scoreLead — full name", () => {
  const base = { income: 2500, expenses: 600, loanAmount: 10000, employment: "employed", emailVerified: false, age: 40 };
  // Without name: 20+25+15+13+5 = 78

  it("two-word name → +5 pts", () => {
    expect(scoreLead({ ...base, name: "Ana García" })).toBe(83);
  });

  it("three-word name → +5 pts", () => {
    expect(scoreLead({ ...base, name: "Ana García López" })).toBe(83);
  });

  it("single word name → +0 pts", () => {
    expect(scoreLead({ ...base, name: "Ana" })).toBe(78);
  });

  it("empty name → +0 pts (no crash)", () => {
    expect(() => scoreLead({ ...base, name: "" })).not.toThrow();
    expect(scoreLead({ ...base, name: "" })).toBe(78);
  });

  it("missing name field → +0 pts (no crash)", () => {
    expect(() => scoreLead({ ...base })).not.toThrow();
    expect(scoreLead({ ...base })).toBe(78);
  });

  it("name with extra whitespace: '  Ana  García  ' counts as 2 words", () => {
    // split(/\s+/) on trimmed string gives 2 tokens
    expect(scoreLead({ ...base, name: "  Ana  García  " })).toBe(83);
  });
});

// ─── Age fit factor (0-5 pts) ─────────────────────────────────────────────────

describe("scoreLead — age fit", () => {
  const base = { income: 2500, expenses: 600, loanAmount: 10000, employment: "employed", emailVerified: false, name: "A B" };
  // Without age: 20+25+15+13+5 = 78

  it("age 30-55 → +5 pts (peak creditworthiness)", () => {
    expect(scoreLead({ ...base, age: 30 })).toBe(83);
    expect(scoreLead({ ...base, age: 40 })).toBe(83);
    expect(scoreLead({ ...base, age: 55 })).toBe(83);
  });

  it("age 25-29 → +3 pts (outer range)", () => {
    expect(scoreLead({ ...base, age: 25 })).toBe(81);
    expect(scoreLead({ ...base, age: 29 })).toBe(81);
  });

  it("age 56-65 → +3 pts (outer range)", () => {
    expect(scoreLead({ ...base, age: 60 })).toBe(81);
    expect(scoreLead({ ...base, age: 65 })).toBe(81);
  });

  it("age > 0 but outside 25-65 → +1 pt", () => {
    expect(scoreLead({ ...base, age: 20 })).toBe(79);
    expect(scoreLead({ ...base, age: 70 })).toBe(79);
  });

  it("age 0 → +0 pts", () => {
    expect(scoreLead({ ...base, age: 0 })).toBe(78);
  });

  it("missing age → +0 pts (no crash)", () => {
    expect(() => scoreLead({ ...base })).not.toThrow();
    expect(scoreLead({ ...base })).toBe(78);
  });

  it("age as string (parseable) does not crash", () => {
    expect(() => scoreLead({ ...base, age: "35" })).not.toThrow();
    expect(scoreLead({ ...base, age: "35" })).toBe(83);
  });
});

// ─── Edge cases — missing / malformed inputs ──────────────────────────────────

describe("scoreLead — edge cases and robustness", () => {
  it("empty object {} does not throw", () => {
    expect(() => scoreLead({})).not.toThrow();
  });

  it("empty object returns a number", () => {
    expect(typeof scoreLead({})).toBe("number");
  });

  it("income=0 and expenses=0 does not produce NaN or Infinity", () => {
    const s = scoreLead({ income: 0, expenses: 0, loanAmount: 0 });
    expect(Number.isFinite(s)).toBe(true);
  });

  it("income=0 and expenses=500 does not produce NaN", () => {
    const s = scoreLead({ income: 0, expenses: 500 });
    expect(Number.isNaN(s)).toBe(false);
  });

  it("string income that parses to number works", () => {
    expect(() => scoreLead({ income: "3500" })).not.toThrow();
    const s = scoreLead({ income: "3500" });
    expect(s).toBeGreaterThan(0);
  });

  it("NaN income is treated as 0", () => {
    expect(() => scoreLead({ income: "abc" })).not.toThrow();
    const s = scoreLead({ income: "abc" });
    expect(Number.isFinite(s)).toBe(true);
  });

  it("score never exceeds 100 even with extreme values", () => {
    const s = scoreLead({
      income: 99999,
      expenses: 100,
      loanAmount: 100,
      employment: "civil_servant",
      emailVerified: true,
      name: "A B",
      age: 40,
    });
    expect(s).toBeLessThanOrEqual(100);
  });
});

// ─── GRADE_LABEL ──────────────────────────────────────────────────────────────

describe("GRADE_LABEL", () => {
  it("score 75 → A", () => expect(GRADE_LABEL(75)).toBe("A"));
  it("score 100 → A", () => expect(GRADE_LABEL(100)).toBe("A"));
  it("score 74 → B", () => expect(GRADE_LABEL(74)).toBe("B"));
  it("score 50 → B", () => expect(GRADE_LABEL(50)).toBe("B"));
  it("score 49 → C", () => expect(GRADE_LABEL(49)).toBe("C"));
  it("score 30 → C", () => expect(GRADE_LABEL(30)).toBe("C"));
  it("score 29 → D", () => expect(GRADE_LABEL(29)).toBe("D"));
  it("score 0 → D", () => expect(GRADE_LABEL(0)).toBe("D"));
});

// ─── GRADE_COLOR ──────────────────────────────────────────────────────────────
// GRADE_COLOR reads from the mutable T object (themes.js).
// Themes initialises T to light mode on import.

describe("GRADE_COLOR", () => {
  it("returns a non-empty string for score 100 (A tier)", () => {
    const c = GRADE_COLOR(100);
    expect(typeof c).toBe("string");
    expect(c.length).toBeGreaterThan(0);
  });

  it("returns a non-empty string for score 60 (B tier)", () => {
    const c = GRADE_COLOR(60);
    expect(typeof c).toBe("string");
    expect(c.length).toBeGreaterThan(0);
  });

  it("returns a non-empty string for score 40 (C tier)", () => {
    const c = GRADE_COLOR(40);
    expect(typeof c).toBe("string");
    expect(c.length).toBeGreaterThan(0);
  });

  it("returns a non-empty string for score 10 (D tier)", () => {
    const c = GRADE_COLOR(10);
    expect(typeof c).toBe("string");
    expect(c.length).toBeGreaterThan(0);
  });

  it("A and D grades return different colors", () => {
    expect(GRADE_COLOR(100)).not.toBe(GRADE_COLOR(10));
  });
});
