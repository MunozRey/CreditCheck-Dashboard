# CLEANUP_PLAN.md
> Generated from full audit of `leads_dashboard_en (2).jsx` (4,245 lines)
> Phase 1 inventory — **no file has been modified yet**. Awaiting approval before Phase 2.

---

## 1. TOTAL LINES PER FILE

| File | Lines | Status |
|------|-------|--------|
| `leads_dashboard_en (2).jsx` | 4,245 | Monolith — to be split |
| `src/utils/fetchLiveData.js` | 62 | New — standalone module |
| `src/main.jsx` | 18 | New — entry point |
| `src/constants/themes.js` | 107 | New — module split |
| `src/constants/verticals.js` | 90 | New — module split |
| `src/utils/format.js` | 28 | New — module split |
| `src/utils/defaultData.js` | 28 | New — module split |
| `src/utils/revenue.js` | 54 | New — module split |
| `src/utils/xlsxParser.js` | 145 | New — module split |
| `src/utils/scoring.js` | 73 | New — module split |
| `package.json` | 20 | New — deployment |
| `vite.config.js` | 14 | New — deployment |
| `index.html` | 13 | New — deployment |
| `branding.md` | 155 | Reference doc — untouched |

> The module files above are NEW (additive). The monolith is unchanged.
> Completing the split requires: components/, tabs/, context/, App.jsx

---

## 2. DUPLICATED FUNCTIONS

| Function | Location A | Location B | Notes |
|----------|-----------|-----------|-------|
| `fetchLiveData()` | monolith line ~3849 (inline) | `src/utils/fetchLiveData.js` | Intentional for now: monolith is self-contained; module file is for post-split |
| `fmtAgo()` | monolith line ~3874 (inline) | `src/utils/format.js` (new) | Same situation — will be removed from monolith after split |
| `applyVehicleFilter()` | monolith line 2123 (module-level) | ExportModal line 3402 (inline copy) | Inline copy is slightly simplified but same logic. **Merge.** |
| `isTestEmail()` | ~~CreditScore branch~~ | ~~Pipedrive branch~~ | **Already fixed** in prior session — now single module-level function |

**Action**: After split is complete, remove inline `fetchLiveData` and `fmtAgo` from monolith.
**Action for `applyVehicleFilter`**: ExportModal's inline copy (line 3402-3406) should import from `src/constants/verticals.js`.

---

## 3. DEAD CODE

### 3.1 — Confirmed Bug (not just dead code)
| Location | Issue | Severity |
|----------|-------|----------|
| Lines 3516–3517 | `exportFormat` used but undefined; the state variable is called `fmt`. Download always saves as `.csv` regardless of selected JSON/TSV format. MIME type stuck at `text/plain` for all formats. | **BUG — functional regression** |

**Fix**: Replace `exportFormat` with `fmt` on lines 3516–3517.

### 3.2 — Dead Data Field
| Location | Issue |
|----------|-------|
| ExportModal `fields` state, `phone:false` (line 3388) | `phone` field is togglable in the UI but lead objects never have a `.phone` property in either Pipedrive or CreditScore format. When enabled, always exports `""`. Safe to remove from FIELD_DEFS and state default — or leave as documented non-functional field. |

**Decision needed**: Remove `phone` from FIELD_DEFS or keep as placeholder? → **Recommend: remove**.

### 3.3 — Unused `console.error`
| Location | Code |
|----------|------|
| ErrorBoundary line ~3824 | `console.error("Dashboard error:", error, info)` | Acceptable for error boundaries — keep.

### 3.4 — `className` prop on Card
| Location | Issue |
|----------|-------|
| Card component, line 358 | `className=""` prop accepted but never passed by any caller. Card always has `cc-card` class. No functional impact. |

**Action**: Remove unused `className` prop from Card signature.

---

## 4. OVERSIZED COMPONENTS (>200 lines)

| Component | Lines | Action |
|-----------|-------|--------|
| `ExportModal` | ~441 | Extract `ExportFilters`, `ExportPreview`, `ExportActions` sub-components |
| `AppInner` | ~357 | Extract `<NavBar>`, `<KpiStrip>`, `<LiveStatusBanner>` sub-components |
| `LeadScoringTab` | ~272 | Extract `<ScoreFilters>`, `<LeadScoreTable>`, `<ScoreMethodology>` |
| `makeReport()` | ~271 | Extract per-section builders into named functions (already partially done with `makeKPIGrid`, etc.) |
| `MultiPartnerTab` | ~280 | Extract `<PartnerCard>` row component |
| `InsightsTab` | ~260 | Extract `<InsightBlock>` repeating pattern |
| `DataQualityTab` | ~236 | Extract `<QualityRow>` pattern |

---

## 5. REPEATED INLINE STYLES — CANDIDATES FOR `src/styles/shared.js`

### Magic numbers (appearing 20+ times each)

| Value | Occurrences | Proposed constant |
|-------|-------------|------------------|
| `fontSize: 11` | 86+ | `FS.sm` or `STYLE.fs.sm` |
| `fontSize: 10` | 150+ | `FS.xs` |
| `fontSize: 12` | 60+ | `FS.base` |
| `fontSize: 13` | 40+ | `FS.md` |
| `fontWeight: 700` | 70+ | `FW.bold` |
| `fontWeight: 600` | 50+ | `FW.semibold` |
| `borderRadius: 8` | 60+ | `R.md` |
| `borderRadius: 12` | 30+ | `R.lg` |
| `borderRadius: 4` | 25+ | `R.sm` |
| `borderRadius: 20` | 15+ | `R.pill` |

### Repeated complete style patterns (appearing 10+ times)

| Pattern | Count | Proposed component/constant |
|---------|-------|-----------------------------|
| Progress bar row (flex+bar+percentage div) | 15+ | `<ProgressBar value pct color />` component |
| Monospace label `{fontSize:10,fontWeight:700,color:T.muted,letterSpacing:1,...textTransform:"uppercase"}` | 20+ | `LABEL_MONO` style constant |
| Date/search input style | 10+ | `INPUT_STYLE` constant using `T.*` |
| Chip span `{display:"inline-flex",alignItems:"center",padding:"2px 8px",borderRadius:20,...}` | 10+ | Already has `<Chip>` component — callers not always using it |

---

## 6. REACT ANTI-PATTERNS

| Location | Pattern | Severity |
|----------|---------|----------|
| ExportModal useMemo line 3427–3431 | `// eslint-disable-next-line react-hooks/exhaustive-deps` — suppressed warning with missing deps | Low — funcs are pure, not a bug |
| AnalyticsTab line 742 | `useMemo(()=>[...bc.map(...),...fs.map(...)],[bc,fs])` — trivial array merge | Low — negligible benefit |
| LeadsTab line 590 | `useMemo(()=>(data[cat]||[]).map(r=>({...r,cat})),[data,cat])` — minor | Low |

---

## 7. DEPENDENCIES (imports)

**`leads_dashboard_en (2).jsx` line 1:**
```js
import React, { useState, useEffect, useCallback, useMemo, useRef, useId } from "react";
```
All 7 named exports are used — no unused imports.

---

## 8. PROPOSED CLEANUP PHASES (ordered by rule)

### Rule 1 — Bug fix + dead code (FIRST — zero risk)
1. Fix `exportFormat` → `fmt` on lines 3516–3517 (**bug**)
2. Remove `phone` from ExportModal FIELD_DEFS and fields state default
3. Remove unused `className` prop from Card

### Rule 2 — Deduplication
1. Create `src/styles/shared.js` with named style constants (FS, FW, R, LABEL_MONO, etc.)
2. Create `src/components/ProgressBar.jsx` for repeated progress bar pattern
3. After split: remove inline `fetchLiveData` and `fmtAgo` from monolith
4. ExportModal: remove inline `applyVehicleFilter`, import from `src/constants/verticals.js`
5. Chips: audit all callers, redirect to `<Chip>` where not already used

### Rule 3 — Flatten over-engineered patterns
1. Remove trivial `useMemo` in AnalyticsTab line 742 and LeadsTab line 590
2. Remove `eslint-disable` comment in ExportModal useMemo

### Rule 4 — ThemeContext (largest change — SEPARATE APPROVAL RECOMMENDED)
Replace global mutable `T` with React Context:
- Create `src/context/ThemeContext.jsx` with `ThemeProvider` + `useTheme()` hook
- `useTheme()` returns current theme object and `setTheme` function
- `applyTheme()` becomes internal to context; CSS injection stays
- All components replace `T.*` reads with `const T = useTheme()`
- **Risk**: touches every component — test each tab after

### Rule 5 — Module split (in progress)
Directory structure already created. Remaining files needed:
- `src/components/`: Card, KpiCard, SectionTitle, TabBar, Chip, PreciseInput, FieldRow, Avatar, CustomTooltip, ScoreBar, MonthNav, UploadZone, ProgressBar (new)
- `src/tabs/`: LeadsTab, AnalyticsTab, RevenueTab, MultiPartnerTab, InsightsTab, DataQualityTab, CountriesTab, VerticalsTab, LeadScoringTab
- `src/utils/reportEngine.js`: REPORT_DEFS, CATEGORY_META, buildReportData, makeReport, etc.
- `src/components/ExportModal.jsx`
- `src/components/ErrorBoundary.jsx`
- `src/App.jsx`

### Rule 6 — Formatting
- Single quotes throughout
- Remove trailing whitespace
- Consistent JSX prop spacing

---

## 9. ITEMS FLAGGED BUT NOT CHANGED

| Item | Why flagged | Decision |
|------|-------------|----------|
| `quickScore()` inside `processRows()` | Similar factor logic to `scoreLead()` but different purpose: tie-breaking during dedup vs full 100pt model for display. NOT a duplicate — do not merge. | Keep separate |
| `avg()` / `median()` in InsightsTab | Defined as inner helpers, used only within that tab. Could extract to format.js but low value. | Keep local for now |
| Pipedrive FS export date artifact | Comment says "FS: Pipedrive export date, not acquisition date" — intentional limitation, not a bug | Document only |
| `gradId = useId()` in AnalyticsTab | Confirmed used in SVG `<linearGradient id={gradId}>` | Not dead code |

---

## APPROVAL CHECKLIST

Before proceeding to Phase 2, confirm:
- [ ] Bug fix on line 3516–3517 approved (`exportFormat` → `fmt`)
- [ ] `phone` field removal from ExportModal approved
- [ ] `className` removal from Card approved
- [ ] ThemeContext migration approved (or skip Rule 4 for now)
- [ ] `src/styles/shared.js` extraction approved
- [ ] Module split continuation approved (Rules 5)
