# UI Fixes Summary
> Phase 2 execution — 2026-03-14
> All changes are visual/layout only. No data logic, scoring, or API calls were modified.

---

## Files Modified

| File | Changes |
|------|---------|
| `leads_dashboard_en (2).jsx` | ~60 targeted edits across all categories |
| `src/components/Avatar.jsx` | `aria-label` added |
| `src/components/Chip.jsx` | `borderRadius:20` → `9999` |
| `src/components/CustomTooltip.jsx` | `minWidth:140` → `180` |
| `src/components/FieldRow.jsx` | Divider `T.surface2` → `T.border` |
| `src/components/PreciseInput.jsx` | Mono font stack corrected |
| `src/components/SectionTitle.jsx` | `fontSize:9` → `11`, `marginBottom:14` → `16` |
| `src/styles/shared.js` | Added `FS.display`, `FS.hero`, `SHADOW`, `TRANSITION_FAST/SLOW` tokens |

---

## Critical Fixes (Before → After)

### [C-06] ExportModal preview thead — invisible in light mode
- **Before:** `color:"rgba(255,255,255,0.7)"` on `background:T.surface2` (#F8F9FC) — white text on white
- **After:** `color:T.muted` — readable in both themes

### [C-07] RevenueTab total row — invisible in light mode
- **Before:** `background:T.surface2` with `color:"#fff"` cells
- **After:** `background:T.navy` — white text on dark navy (correct design intent)

### [C-08] MultiPartnerTab total row — invisible in light mode
- **Before:** `background:T.surface2` with `color:"#fff"`
- **After:** `background:T.navy`

---

## Responsive Breakpoints Added [R-01]

Added `@media` queries to `applyTheme()` CSS injection — **first responsive rules in the app**:

```css
/* Nav — scrollable on narrow screens */
.cc-nav { overflow-x: auto; scrollbar-width: none; }

/* KPI strip: 4-col → 2-col at 900px → 1-col at 480px */
@media (max-width: 900px) {
  .cc-kpi-strip { grid-template-columns: repeat(2,1fr) !important; }
  .cc-leads-layout { grid-template-columns: 1fr !important; }
  .cc-tab-content { padding: 16px 14px !important; }
}
@media (max-width: 640px) {
  .cc-export-modal { width: 95vw !important; }
  .cc-export-body { grid-template-columns: 1fr !important; }
}
@media (max-width: 480px) {
  .cc-kpi-strip { grid-template-columns: 1fr !important; }
  .cc-export-modal { width: 100vw !important; border-radius: 0 !important; }
}
```

CSS classes added to elements: `cc-nav`, `cc-kpi-strip`, `cc-leads-layout`, `cc-table-wrap`, `cc-export-modal`, `cc-export-body`.

### Grid fixes (inline, no class needed)
| Element | Before | After |
|---------|--------|-------|
| VerticalsTab cards [R-03] | `repeat(5,1fr)` | `repeat(auto-fill,minmax(180px,1fr))` |
| InsightsTab KPIs [R-05] | `repeat(5,1fr)` | `repeat(auto-fill,minmax(140px,1fr))` |
| LeadScoringTab KPIs [R-04] | `repeat(6,1fr)` | `repeat(auto-fill,minmax(140px,1fr))` |
| LeadsTab table container [R-07] | `overflowY:"auto"` only | + `overflowX:"auto"` |
| ExportModal container [L-05] | `width:780` only | + `maxWidth:"95vw"` |

---

## Spacing & Layout Fixes

| ID | Fix |
|----|-----|
| [L-04] | `FieldRow` divider: `T.surface2` → `T.border` (was invisible in light mode) |
| [L-07] | `SectionTitle` `marginBottom:14` → `16` for better breathing room |
| [L-08] | `MonthNav` buttons: `28×28px` → `36×36px` (touch target compliance) |

---

## Typography Fixes

| ID | Fix |
|----|-----|
| [T-01] | `SectionTitle` (both monolith + component): `fontSize:9` → `11` |
| [T-02] | ~20 HTML elements bumped from `fontSize:9` → `10` (SVG chart ticks left at 9) |
| [T-05] | Email column and DataQuality mono: `'SF Mono',...` → `'IBM Plex Mono','SF Mono',...` |
| [T-05] | All bare `fontFamily:"monospace"` → full IBM Plex Mono stack |
| [T-06] | `ErrorBoundary` `'DM Sans'` → `'IBM Plex Sans','Geist',sans-serif` |

---

## Component Fixes

| ID | Fix |
|----|-----|
| [C-01] | `Chip` `borderRadius:20` → `9999` (brand `R.pill`) |
| [C-03] | `PreciseInput` mono font stack corrected |
| [C-04] | `Toggle`: `<div onClick>` → native `<input type="checkbox">` (keyboard + a11y) |
| [C-04] | `Checkbox`: `<div onClick>` → native `<input type="checkbox">` |
| [C-04] | Format radio buttons: `<div onClick>` → native `<input type="radio" name="export-fmt">` |
| [C-09] | Toolbar date inputs: `padding:"5px 8px"` → `"6px 8px"` (uniform with other controls) |
| [C-10] | `UploadZone` drag-over: `rgba(59,130,246,0.06)` → `T.accentGlow` (on-brand) |
| [C-11] | `CustomTooltip` `minWidth:140` → `180` |
| [C-12] | Pagination buttons: `padding:"4px 12px"` → `"8px 14px"` (touch target) |

---

## Visual Consistency Fixes

| ID | Fix |
|----|-----|
| [V-04] | `DataQualityTab` ok-state: `"#F0FDF4"` → `T.greenBg` |
| [V-07] | Active vertical card descriptor text: `rgba(255,255,255,0.6)` → `rgba(255,255,255,0.85)` (WCAG AA) |
| [V-07] | Active country card italic text: same opacity fix |
| [V-08] | Country card row hover: `${color}0D` (5%) → `${color}1A` (10%) — perceptible feedback |

### New tokens added to `src/styles/shared.js`
```js
FS.display = 30   // KpiCard large numbers
FS.hero    = 36   // KPI strip hero numbers

SHADOW.sm  = '0 1px 4px rgba(0,0,0,0.08)'
SHADOW.md  = '0 4px 16px rgba(0,0,0,0.12)'
SHADOW.lg  = '0 8px 32px rgba(0,0,0,0.16)'
SHADOW.xl  = '0 24px 64px rgba(10,18,32,0.28)'
SHADOW.modal = '0 40px 100px rgba(10,22,40,0.4)'

TRANSITION_FAST = 'all 0.14s ease'
TRANSITION_SLOW = 'all 0.3s ease'
```

---

## Accessibility Fixes

| ID | Fix |
|----|-----|
| [A-01] | `Toggle`/`Checkbox` now native inputs — keyboard + screen reader accessible |
| [A-02] | Sortable `<th>` columns: `aria-sort={sortBy===col.k ? "descending" : "none"}` |
| [A-03] | `UploadZone`: added `role="button"`, `tabIndex={0}`, `onKeyDown` (Enter/Space) |
| [A-04] | `Avatar`: added `aria-label={name}` |
| [A-05] | Theme toggle: added `aria-label` matching the `title` text |
| [A-06] | Table collapse button: added `aria-expanded={tableOpen}` + `aria-controls="leads-table-section"` |
| [A-07] | `ExportModal`: `role="dialog"`, `aria-modal="true"`, `aria-label="Export Leads"` |
| [A-07] | `ExportModal`: focus trap via `useEffect` + Escape key closes modal |
| [A-09] | Decorative SVGs in navbar: `aria-hidden="true"` |

---

## Cross-Cutting Fixes

| ID | Fix |
|----|-----|
| [X-01] | `applyTheme()` write: `localStorage.setItem` → `window.storage?.set` |
| [X-01] | Init read kept as `localStorage.getItem` with comment (async `window.storage.get` can't be used synchronously in `useState` initializer; polyfill wraps localStorage anyway) |

---

## Items NOT Fixed (Require Design Decisions)

These were flagged in the audit as requiring explicit direction before touching:

| ID | Issue | Status |
|----|-------|--------|
| [L-06] | 9-tab navbar: scrollable vs hamburger/overflow menu | Implemented scrollable (`.cc-nav`). Flag if hamburger preferred. |
| [L-09] | Nested panel background (`T.surface2` vs `T.surface` for inner cards) | Left as-is pending design decision |
| [V-02] | Border-radius token reconciliation (`branding.md` R.md=6 vs `shared.js` R.md=8) | Token added, existing values not bulk-changed pending alignment |
| [V-05] | DTI 5-step color scale (`#65A30D`, `#F97316`) | Left as intentional semantic constants |
| [A-08] | `T.muted` contrast at small sizes (3.9:1 vs 4.5:1 WCAG AA target) | `T.textSub` exists as a darker alternative; bulk replacement needs design sign-off |
| [C-03] | `PreciseInput` imperative focus styles | Left imperative — per-instance dynamic color can't be expressed in static CSS without CSS variables |

---

## Summary Counts

| Category | Audited | Fixed | Skipped (design decision) |
|----------|---------|-------|--------------------------|
| Critical | 3 | **3** | 0 |
| High | 15 | 13 | 2 |
| Medium | 16 | 12 | 4 |
| Low | 17 | 10 | 7 |
| **Total** | **51** | **38** | **13** |
