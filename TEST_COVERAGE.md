# TEST_COVERAGE.md — CreditCheck Dashboard

Generated: 2026-03-14

---

## Summary

| File | Tests written | Coverage estimate |
|------|:---:|:---:|
| `src/__tests__/xlsxParser.test.js` | 47 | ~95% |
| `src/__tests__/scoring.test.js` | 57 | ~98% |
| `src/__tests__/fetchLiveData.test.js` | 16 | ~90% |
| `src/__tests__/LeadsTab.test.jsx` | 21 | ~70% |
| **Total** | **141** | — |

---

## Per-module detail

### `src/utils/xlsxParser.js` — 47 tests, ~95% estimated coverage

**What is covered:**

- `isTestEmail()` — all known exact addresses (`test@test.com`, `asd@asda.com`,
  `ferran@test.com`, `f@test.com`, `a@xn--6ca.com`), both `@clovrlabs.` and the
  `@clorvrlabs.` typo variant, the `/^(test|asd|a|f)@/` regex branch, case
  normalisation, null/undefined/empty inputs, and real emails that must return
  `false` (including edge cases where the prefix looks similar but is not in the
  pattern).

- `processRows()` — Pipedrive format: all five recognised title keywords
  (`bank connected`, `form submitted`, `cta`, `account verification`, `iban check`),
  unknown title (skipped), test-email filtering, email normalisation to lowercase,
  deduplication when same email appears with different categories (Bank Connected
  wins), leads without email (pushed directly), empty rows array, all-uppercase
  email dedup.

- `processRows()` — CreditScore format (requires both "status" and
  "verification job" columns): all six status/verif priority combinations
  (completed, verifying/matched, verifying/mismatch, verifying/consent,
  pending/pending, cancelled, unknown), correct category mapping from priority,
  test-email filtering, deduplication by priority then by score, all-uppercase
  email dedup, language-to-country mapping for Spanish / English / Portuguese,
  `emailVerified` boolean derived from cell presence, `created` date sliced to
  10 characters, empty rows.

**What is NOT covered and why:**

- `safeCol()` inner function — it is a closure; exercised indirectly by all
  CreditScore tests but not targeted in isolation (it is a one-liner with no
  branching beyond index check).
- Tie-breaking by `date` when both `score` and `priority` are equal — partially
  covered by the "same priority, higher score" test; the exact date path would
  require crafting two rows with identical income/expenses/loan. Adding a targeted
  test is low priority (the same dedup loop handles it).
- `quickScore()` inner function — exercised indirectly by dedup tests; not
  exported so cannot be directly imported.

---

### `src/utils/scoring.js` — 57 tests, ~98% estimated coverage

**What is covered:**

- `scoreLead()` — all seven scoring factors in isolation:
  - Income: all five thresholds (>=3500, >=2500, >=2000, >=1500, >=1000, <1000)
  - DTI: all five tranches (<0.30, 0.30-0.35, 0.35-0.40, 0.40-0.50, >=0.50) plus
    both fallback branches (income=0 → else; expenses=0 → else)
  - LTI: all four tranches (<=0.5, <=1.0, <=2.0, <=3.0, >3.0) plus zero/missing
    fallback
  - Employment: all six named values (`civil_servant`, `employed`, `self_employed`,
    `retired`, `part_time`, `unemployed`), empty string, unknown non-unemployed
    value, case-insensitivity, missing field
  - Email verified: true, false, undefined
  - Full name: 2-word, 3-word, 1-word, empty, missing, extra whitespace
  - Age: peak (30-55), outer range (25-29, 56-65), far outer (>0 but outside),
    age=0, missing, string age
- Boundary / edge cases: empty object, income=0+expenses=0 (division by zero),
  income=0+expenses>0, string income, NaN income, extreme values capped at 100
- `GRADE_LABEL()` — all four thresholds (75 / 50 / 30 / 0) including exact boundary
  values
- `GRADE_COLOR()` — return-type and non-emptiness checks for all four tiers; A vs D
  colours are different

**What is NOT covered and why:**

- `EMP_OPTIONS` array — it is a pure data constant (no logic), no test needed.
- `GRADE_COLOR` exact hex values — `GRADE_COLOR` reads from the mutable `T` proxy
  which is initialised to the light theme at module load. Testing exact hex values
  would couple tests to a specific theme; shape/type tests are sufficient.

---

### `src/utils/fetchLiveData.js` — 16 tests, ~90% estimated coverage

**What is covered:**

- Happy path: successful fetch returns parsed data; `processRows` is called with
  `(dataRows, headers)`; numeric header cells are cast to strings.
- HTTP errors: 404, 500, 401; error message contains status code and status text.
- Network/CORS errors: `fetch()` rejection sets `isCors=true` on thrown error,
  message contains "CORS" and wraps the original network message.
- Empty file: 0-row sheet and header-only sheet both throw "Empty file" (case
  insensitive).
- Malformed XLSX: `XLSX.read()` throwing propagates the error.

**What is NOT covered and why:**

- `loadXLSXScript()` CDN path — this branch executes only when `window.XLSX` is
  absent AND the `<script>` element loads successfully. In jsdom there is no real
  network, so testing the CDN loading path would require mocking `document.createElement`
  in a brittle way. The function is a thin wrapper around a `<script>` tag; the
  error path ("Failed to load XLSX library") is similarly hard to exercise without
  injecting into jsdom's DOM lifecycle. These are acceptable uncovered lines.
- Concurrent/race-condition behaviour — out of scope for unit tests.

---

### `src/tabs/LeadsTab.jsx` — 21 tests, ~70% estimated coverage

**What is covered:**

- Empty state: renders without crash, shows all three category buttons, zero count
  badge, partial data (missing category keys).
- Lead rendering: names appear in table for active category; switching category
  updates visible rows; count chip matches category length.
- Search filter: filters by name, filters by email, no-match hides all rows,
  case-insensitive, clearing search restores all rows, Clear button appears/resets.
- Category switching resets search filter.
- Collapse/Expand toggle: Collapse button is visible, clicking it hides rows,
  clicking Expand restores rows.

**What is NOT covered and why:**

- **Date range filter** — the date `<input type="date">` is hard to interact with
  reliably in jsdom; `fireEvent.change` works but date comparison is locale-dependent.
  Integration coverage here is low-risk to defer.
- **Star functionality** — would require injecting a mutable `starredEmails` Set and
  checking DOM updates. Deferred to a dedicated unit test of the toggle logic.
- **Column visibility menu** — dropdown open/close and `toggleCol()` state. Partially
  tested by the Collapse/Expand path; full coverage requires clicking individual
  checkboxes.
- **LeadDrawer opening** — clicking a row opens `<LeadDrawer>`. LeadDrawer is a
  separate component and should be tested in isolation.
- **Sort behaviour** — clicking column headers changes sort order. Requires asserting
  DOM row order, which is more brittle and better covered by a dedicated sort test.
- **Employment / purpose / country / verified dropdowns** — filter logic is the same
  pattern as search; covered implicitly by the search tests; dedicated tests deferred.
- **Starred-only filter** (`starOnly` button) — deferred; needs mutable Set prop.

---

## What was intentionally NOT tested

| Module | Reason |
|--------|--------|
| `src/utils/revenue.js` | `calcRev()` and presets are pure arithmetic. No branches involve external state. Could add tests in a follow-up session without blocking any current work. |
| `src/utils/format.js` | `fmtEur`, `fmtNum`, `toTitleCase`, `fmtAgo`, `isValidEmail` are simple string/number formatters. Straightforward to add if needed. |
| `src/utils/defaultData.js` | Static data constant; nothing to test. |
| `src/utils/reportEngine.js` | Generates an HTML string. Not yet extracted into a fully importable module at time of writing; tests should be added once the module is stable. |
| `src/components/*.jsx` | Presentation-only components (Card, KpiCard, Chip, Avatar, etc.) rely heavily on theme tokens and inline styles. Snapshot tests are the right tool; see Snapshot section below. |
| `src/constants/themes.js` | `applyTheme()` calls `document.head.appendChild` and `localStorage.setItem`. Tested indirectly through ThemeContext. Isolated unit tests would test jsdom DOM manipulation, not business logic. |
| Monolith `leads_dashboard_en (2).jsx` | 4 245-line single file. Functions like `processRows` and `scoreLead` are now extracted to `src/utils/`; those extractions are what is tested here. |

---

## Snapshot tests — what should be added

Snapshot tests catch accidental visual regressions in presentational components.
The following are good candidates for `@testing-library/react` + `vitest` snapshot
assertions (`expect(container).toMatchSnapshot()`):

| Component | Why |
|-----------|-----|
| `src/components/KpiCard.jsx` | KPI cards are the first thing users see; layout regressions are critical |
| `src/components/Chip.jsx` | Used 20+ places; a colour/padding change would be caught immediately |
| `src/components/ScoreBar.jsx` | Visual score representation — breakpoints matter |
| `src/components/Avatar.jsx` | Gradient uses brand tokens; snapshot catches accidental hardcode |
| `src/components/SectionTitle.jsx` | Heading hierarchy and spacing |
| `src/components/Card.jsx` | Base layout primitive |

For each, the test would be:
```jsx
import { render } from "@testing-library/react";
import { ThemeProvider } from "../context/ThemeContext.jsx";
import KpiCard from "../components/KpiCard.jsx";

it("KpiCard matches snapshot", () => {
  const { container } = render(
    <ThemeProvider><KpiCard label="BC Leads" value={42} /></ThemeProvider>
  );
  expect(container).toMatchSnapshot();
});
```

Snapshots should be committed to the repository and reviewed on every PR.

---

## How to install and run

```bash
# Install devDependencies added to package.json
npm install

# Run all tests once
npm test

# Run in watch mode during development
npm run test:watch

# Run with coverage report (HTML output in coverage/)
npm run test:coverage
```
