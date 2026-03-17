# UI Audit — CreditCheck Dashboard
> Generated: 2026-03-14 | Auditor: Claude Code (analyst agent)
> Files audited: `leads_dashboard_en (2).jsx` (4243 lines), `src/styles/shared.js`, `branding.md`, all 10 extracted components in `src/components/`

---

## Executive Summary

Five categories of issues found, ordered by urgency:

1. **3× CRITICAL: White text on near-white background** — `RevenueTab` and `MultiPartnerTab` total rows, plus `ExportModal` preview table header, all render `color:"#fff"` on `T.surface2` (`#F8F9FC` in light mode). Completely invisible in light mode. Fix before any deployment.

2. **Zero responsive breakpoints** — The CSS injection in `applyTheme()` contains no `@media` queries. All grids use fixed column counts (`repeat(4,1fr)`, `repeat(5,1fr)`, `188px 1fr`) with no collapse behavior. Dashboard is unusable below ~1100px.

3. **Accessibility blockers on core interactions** — `ExportModal` has no focus trap, no `aria-modal`, and its `Toggle`/`Checkbox`/radio controls are non-native `<div onClick>` elements with no keyboard support or ARIA roles. File upload zone not keyboard-accessible.

4. **Pervasive token violations** — Border radii use 9+ arbitrary values; `fontSize:9` appears in production-visible locations (below brand minimum 12px); `T.muted` at 9–11px fails WCAG AA; `localStorage` used directly in violation of platform storage API.

5. **Component duplication creates divergence risk** — 10 components exist in both `src/components/` (using `useTheme()`) and the monolith (reading global `T`). Theme bugs can appear invisibly in either version.

---

## Severity Key

| Level | Meaning |
|-------|---------|
| 🔴 CRITICAL | Visible bug / data invisible / accessibility blocker — fix immediately |
| 🟠 HIGH | Broken on real devices / contrast failure / major UX issue |
| 🟡 MEDIUM | Inconsistency affecting polish or maintainability |
| 🟢 LOW | Minor refinement / cosmetic improvement |

---

## Layout & Spacing

### [L-01] Fixed grid columns collapse without reflow 🟠 HIGH
**Location:** `leads_dashboard_en (2).jsx` line 4225, line 614
**Issue:** Main content area `maxWidth:1600` contains grids like `gridTemplateColumns:"188px 1fr"`, `"3fr 2fr"`, `"repeat(4,1fr)"` that never reflow — they simply shrink columns until content overflows.
**Fix:** Replace fixed column values with `minmax()` patterns. The 188px sidebar in LeadsTab should collapse below ~900px.

### [L-02] KPI strip: 4-column grid, no mobile fallback 🟠 HIGH
**Location:** `leads_dashboard_en (2).jsx` line 4128
**Issue:** `gridTemplateColumns:"repeat(4,1fr)"` with `fontSize:36` numbers. On mobile the four cells compress to ~90px each, causing number overflow.
**Fix:** Add `@media (max-width: 768px)` rule in injected CSS to switch to `repeat(2,1fr)`.

### [L-03] `Card` padding: 15+ callers use different values 🟡 MEDIUM
**Location:** `leads_dashboard_en (2).jsx` lines 372, 789, 807, 865, 1067
**Issue:** `Card` has no default padding. Call-sites pass: `padding:20`, `"20px 22px"`, `"16px 20px"`, `"20px 20px 12px"`, `padding:48`. `CARD_PAD` is defined in `shared.js` but never used.
**Fix:** Apply `CARD_PAD` as default in `Card`; override only where intentionally different.

### [L-04] `FieldRow` divider uses `T.surface2` instead of `T.border` 🟡 MEDIUM
**Location:** `src/components/FieldRow.jsx` line 7
**Issue:** `borderBottom: \`1px solid ${T.surface2}\`` — `T.surface2` (`#F8F9FC`) is near-identical to `T.surface` (`#FFFFFF`), making dividers invisible in light mode.
**Fix:** Change to `T.border`.

### [L-05] `ExportModal` width 780px bleeds off 768px screens 🟠 HIGH
**Location:** `leads_dashboard_en (2).jsx` line 3582
**Issue:** `width:780, maxHeight:"90vh"` — no `maxWidth` fallback. On 768px iPad the modal bleeds off-screen.
**Fix:** Add `maxWidth:"95vw"`.

### [L-06] 9-tab navbar has no overflow strategy 🟠 HIGH
**Location:** `leads_dashboard_en (2).jsx` lines 4019–4038
**Issue:** Flex nav with 9 `whiteSpace:"nowrap"` tabs, no `overflowX:"auto"`. Wraps or clips below ~900px.
**Fix:** Add `overflowX:"auto"` to nav and a scrollbar-hiding CSS rule. Flag separately if a hamburger menu is preferred (design decision needed).

### [L-07] `SectionTitle` bottom gap too tight 🟢 LOW
**Location:** `src/components/SectionTitle.jsx` line 7
**Issue:** `marginBottom:14, paddingBottom:10`. The visual gap between title and content is only 4px (14-10), compared to 20px outer card padding.
**Fix:** Increase `marginBottom` to 16px.

### [L-08] `MonthNav` buttons: 28×28px touch target 🟡 MEDIUM
**Location:** `leads_dashboard_en (2).jsx` line 948
**Issue:** `width:28, height:28` — below the 44×44px minimum for mobile touch targets.
**Fix:** Increase to at least `width:36, height:36`.

### [L-09] Nested panel background causes visual confusion 🟢 LOW
**Location:** `leads_dashboard_en (2).jsx` line 884
**Issue:** Inner projection cards use `background:T.surface2` inside a `T.surface` card, making them visually pop but inconsistently so versus other nested panels.
**Fix:** Use `T.surface` for inner cards; reserve `T.surface2` for inputs only. Design decision recommended.

---

## Responsive Breakpoints

### [R-01] Zero `@media` queries in the entire app 🔴 CRITICAL
**Location:** `leads_dashboard_en (2).jsx` lines 64–92 (`applyTheme` CSS injection)
**Issue:** The injected stylesheet contains only global resets, fonts, animation, and `.cc-input` rules. No breakpoints exist anywhere.
**Fix:** Add responsive layer to injected CSS covering at minimum:
- 768px: KPI grids → 2 columns, tables add `overflowX:auto`, modal becomes full-width
- 480px: single column everywhere, modal full-screen

### [R-02] `LeadScoringTab` table: inner scroll not discoverable 🟠 HIGH
**Location:** `leads_dashboard_en (2).jsx` line 2564
**Issue:** 10-column table wrapped in `overflowX:"auto"` div inside a `Card`. On mobile the overflow is on the inner div only — the card itself clips content without visual cue.
**Fix:** Add `overflowX:"auto"` directly on the `Card` wrapper.

### [R-03] `VerticalsTab`: `repeat(5,1fr)` grid never reflows 🟠 HIGH
**Location:** `leads_dashboard_en (2).jsx` line 2171
**Issue:** 5 vertical selector cards at `repeat(5,1fr)`. On 768px each card gets ~143px — icon, title, description all truncate severely.
**Fix:** Change to `gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))"`.

### [R-04] `LeadScoringTab` KPI row: `repeat(6,1fr)` 🟡 MEDIUM
**Location:** `leads_dashboard_en (2).jsx` line 2500
**Issue:** 6 KPI cards in one row. At 768px each is ~110px — `fontSize:24` numbers overflow.
**Fix:** Use `repeat(auto-fill,minmax(140px,1fr))`.

### [R-05] `InsightsTab` KPI row: `repeat(5,1fr)` 🟡 MEDIUM
**Location:** `leads_dashboard_en (2).jsx` line 1475
**Issue:** Same issue as R-04 — 5 KPIs clip below 1000px.
**Fix:** `repeat(auto-fill,minmax(140px,1fr))`.

### [R-06] `ExportModal` inner 2-column layout: no mobile fallback 🟠 HIGH
**Location:** `leads_dashboard_en (2).jsx` line 3615
**Issue:** `gridTemplateColumns:"260px 1fr"` — the filter panel takes 260px, leaving ~100px for the preview on 768px screens.
**Fix:** After adding `maxWidth:"95vw"` (L-05), switch inner grid to single column on narrow screens via injected CSS.

### [R-07] `LeadsTab` table container missing `overflowX` 🟡 MEDIUM
**Location:** `leads_dashboard_en (2).jsx` line 697
**Issue:** `overflowY:"auto", maxHeight:520` — no `overflowX`. Email column visible → horizontal page scroll on narrow viewports.
**Fix:** Add `overflowX:"auto"` to same container.

---

## Typography

### [T-01] `SectionTitle` uses `fontSize:9` — below brand minimum 🟠 HIGH
**Location:** `src/components/SectionTitle.jsx` line 9; `leads_dashboard_en (2).jsx` line 405
**Issue:** Brand minimum is 12px (`--fs-small`). `FS.xs = 10` in `shared.js`. `fontSize:9` is below both.
**Fix:** Change to `FS.sm` (11) at minimum; prefer `FS.base` (12) to meet brand spec.

### [T-02] `fontSize:9` used in 8+ production-visible locations 🟡 MEDIUM
**Location:** `leads_dashboard_en (2).jsx` lines 885, 891, 895, 1234, 1264, 1296, 2511, 2570
**Issue:** Projection card labels, partner headers, scoring column headers all use `fontSize:9`.
**Fix:** Replace all `fontSize:9` with `FS.xs` (10). Minimum acceptable for data labels.

### [T-03] `lineHeight` inconsistent on body/description text 🟢 LOW
**Location:** `leads_dashboard_en (2).jsx` line 1787 (no lineHeight), line 3177 (`lineHeight:1.8`)
**Issue:** Brand specifies `--lh-relaxed: 150%` for body text. Most multi-line text has no `lineHeight` set (browser default ~1.2).
**Fix:** Set `lineHeight:1.5` on all multi-sentence descriptive text; `lineHeight:1.4` for compact table cells.

### [T-04] KPI display numbers: three different hardcoded sizes 🟡 MEDIUM
**Location:** `leads_dashboard_en (2).jsx` lines 378 (`fontSize:30`), 4145 (`fontSize:36`); `src/components/KpiCard.jsx` line 15 (`fontSize:30`)
**Issue:** No typographic token for large numeric display — each location hardcodes a different value.
**Fix:** Add `FS.display = 30` and `FS.hero = 36` to `shared.js` and replace all instances.

### [T-05] Mono font stack inconsistent 🟢 LOW
**Location:** `leads_dashboard_en (2).jsx` line 717 (`'SF Mono',ui-monospace,monospace`), line 1868 (`"monospace"`)
**Issue:** Brand specifies `'IBM Plex Mono', 'SF Mono', ui-monospace, monospace`. Two call-sites omit IBM Plex Mono.
**Fix:** Standardize all mono to `"'IBM Plex Mono','SF Mono',ui-monospace,monospace"`.

### [T-06] `ErrorBoundary` uses non-brand font `'DM Sans'` 🟢 LOW
**Location:** `leads_dashboard_en (2).jsx` line 3825
**Issue:** `fontFamily:"'DM Sans',sans-serif"` — not in brand stack.
**Fix:** Replace with `"'IBM Plex Sans','Geist',sans-serif"`.

### [T-07] `KpiCard` label weight misaligns with `LABEL_MONO` spec 🟢 LOW
**Location:** `src/components/KpiCard.jsx` line 14
**Issue:** Uses `fontWeight:600` but `LABEL_MONO` pattern in `shared.js` specifies `fontWeight:700`.
**Fix:** Align to 700, or explicitly document why KPI labels differ.

---

## Components

### [C-01] `Chip` border-radius: magic number `20` instead of `R.pill` 🟢 LOW
**Location:** `src/components/Chip.jsx` line 7
**Issue:** `borderRadius:20` — brand specifies `--radius-full: 9999px`; `shared.js` defines `R.pill = 9999`.
**Fix:** Change to `R.pill`.

### [C-02] Active `TabBar` uses hardcoded `color:"#fff"` 🟢 LOW
**Location:** `src/components/TabBar.jsx` line 11
**Issue:** White text on `T.navy` — technically correct but not using a token.
**Fix:** Add `T.textOnDark = '#fff'` to `THEMES` and reference it. Document as intentional exception if preferred.

### [C-03] `PreciseInput` focus ring applied imperatively via `.style` 🟡 MEDIUM
**Location:** `src/components/PreciseInput.jsx` lines 29–30; `leads_dashboard_en (2).jsx` lines 451–452
**Issue:** `onFocus` sets `e.target.style.borderColor` and `e.target.style.boxShadow` directly. Invisible in SSR, not overridable via theme.
**Fix:** Move focus styles into `.cc-input:focus` rule inside the injected CSS.

### [C-04] `Toggle`/`Checkbox`/radio in `ExportModal` are `<div onClick>` 🟠 HIGH
**Location:** `leads_dashboard_en (2).jsx` lines 3532–3546 (`Toggle`), 3548–3558 (`Checkbox`), 3663–3673 (radio buttons)
**Issue:** No keyboard operability, no `role`, no `aria-checked`. Completely inaccessible.
**Fix:** Replace with native `<input type="checkbox">` and `<input type="radio">` styled via CSS.

### [C-05] `ScoreBar` duplicated in monolith and `src/components/` 🟡 MEDIUM
**Location:** `leads_dashboard_en (2).jsx` lines 2389–2403; `src/components/ScoreBar.jsx`
**Issue:** Functionally identical. The monolith version is the one actually used. Divergence risk.
**Fix:** Tracked in CLEANUP_PLAN Rule 5 — remove monolith duplicate when `LeadScoringTab` is extracted.

### [C-06] `ExportModal` preview `<thead>` text invisible in light mode 🔴 CRITICAL
**Location:** `leads_dashboard_en (2).jsx` line 3701
**Issue:** `color:"rgba(255,255,255,0.7)"` on `background:T.surface2` (`#F8F9FC`). White-on-white — completely invisible in light mode.
**Fix:** Change to `color: T.muted`.

### [C-07] `RevenueTab` total row: white text on near-white background 🔴 CRITICAL
**Location:** `leads_dashboard_en (2).jsx` lines 1054–1060
**Issue:** `<tr style={{background:T.surface2}}>` with `color:"#fff"` cells. In light mode: white on `#F8F9FC` — invisible.
**Fix:** Change `background:T.surface2` to `background:T.navy` (clearly the design intent).

### [C-08] `MultiPartnerTab` total row: same critical bug as C-07 🔴 CRITICAL
**Location:** `leads_dashboard_en (2).jsx` lines 1352–1356
**Issue:** Same: `background:T.surface2` with `color:"#fff"`.
**Fix:** Change `background:T.surface2` to `background:T.navy`.

### [C-09] Toolbar controls: 5 different padding values in one row 🟡 MEDIUM
**Location:** `leads_dashboard_en (2).jsx` lines 648–664
**Issue:** Date inputs `padding:"5px 8px"`, search `"6px 12px"`, purpose select `"6px 8px"`, sort select `"6px 8px"`, "Hide Emails" button `"6px 10px"` — five different values in one flex toolbar.
**Fix:** Standardize to `padding:"6px 10px"` with `height:32px` explicit, using `inputStyle(T)` from `shared.js`.

### [C-10] `UploadZone` drag-over tint uses off-brand hardcoded color 🟢 LOW
**Location:** `leads_dashboard_en (2).jsx` line 559
**Issue:** `background:drag?"rgba(59,130,246,0.06)":T.surface2` — `rgba(59,130,246,0.06)` is a Tailwind blue not in the brand palette.
**Fix:** Replace with `T.accentGlow` (`rgba(0,94,255,0.12)`) which already exists in the theme.

### [C-11] `CustomTooltip` `minWidth:140` causes wrapping for long category names 🟢 LOW
**Location:** `src/components/CustomTooltip.jsx` line 8
**Issue:** "Bank Connected" and "Form Submitted" (13+ chars at fontSize:11) wrap unexpectedly at 140px.
**Fix:** Increase to `minWidth:180` or use `width:"max-content"`.

### [C-12] Pagination buttons: ~24px touch target 🟡 MEDIUM
**Location:** `leads_dashboard_en (2).jsx` lines 2642–2651
**Issue:** `padding:"4px 12px"` — approximate height 24px, below 44px minimum.
**Fix:** Increase to `padding:"8px 14px"`.

---

## Visual Consistency

### [V-01] `REPORT_DEFS` uses Tailwind-derived hex values 🟡 MEDIUM
**Location:** `leads_dashboard_en (2).jsx` lines 2700–2855
**Issue:** `accentColor:"#92400E"`, `accentColor:"#1E40AF"`, `accentColor:"#065F46"`, `bgColor:"#E0F2FE"`, etc. — 8+ Tailwind values not in brand palette.
**Fix:** Map to semantic tokens or document explicitly as static UI constants. They don't need theme reactivity but should align with the brand palette.

### [V-02] Border radii: 9+ distinct arbitrary values 🟡 MEDIUM
**Location:** Throughout `leads_dashboard_en (2).jsx`
**Issue:** `borderRadius:4`, `6`, `7`, `8`, `9`, `10`, `12`, `16`, `20` all appear. `branding.md` specifies `--radius-md: 6px` but `shared.js` has `R.md: 8` — two sources of truth in conflict.
**Fix:** Reconcile: adopt `R.sm=4`, `R.md=6`, `R.lg=10`, `R.pill=9999` to match brand. Replace `7`, `9`, `20` with nearest token.

### [V-03] Shadow values: no token system, 5+ unique strings 🟢 LOW
**Location:** `src/components/CustomTooltip.jsx` line 8; `leads_dashboard_en (2).jsx` lines 3585, 4004
**Issue:** `"0 4px 24px rgba(0,0,0,0.15)"`, `"0 40px 100px rgba(10,22,40,0.4)"`, `"0 0 0 1px ${T.blue}30,0 4px 12px ${T.blue}20"`, etc.
**Fix:** Define `SHADOW.sm/md/lg` in `shared.js`.

### [V-04] `DataQualityTab` ok-state uses `"#F0FDF4"` instead of `T.greenBg` 🟢 LOW
**Location:** `leads_dashboard_en (2).jsx` line 1713
**Issue:** `issueBg.ok = "#F0FDF4"` vs `T.greenBg = "#ECFDF5"` — similar but different.
**Fix:** Replace with `T.greenBg`.

### [V-05] `InsightsTab` DTI uses two off-brand colors `#65A30D` and `#F97316` 🟢 LOW
**Location:** `leads_dashboard_en (2).jsx` lines 1582, 1584
**Issue:** Tailwind `lime-600` and `orange-500` — not in brand palette. Used for intermediate DTI steps.
**Fix:** Design decision needed — either document as intentional semantic constants or collapse DTI scale to 3 steps using existing `T.green/T.amber/T.red`.

### [V-06] Transition values: 8+ inconsistent strings 🟢 LOW
**Location:** `leads_dashboard_en (2).jsx` lines 78, 416, 461, 1205, 2183, 2398, 1531, 1606
**Issue:** `"all .2s"`, `"all .15s"`, `"all .12s"`, `"all .14s ease"`, `"width .4s ease"`, `"width .6s"`, etc.
**Fix:** Define `TRANSITION_FAST = "all 0.14s ease"` and `TRANSITION_SLOW = "all 0.3s ease"` in `shared.js`.

### [V-07] Active vertical card: descriptor text fails WCAG AA 🟠 HIGH
**Location:** `leads_dashboard_en (2).jsx` line 2187
**Issue:** `color:active?"rgba(255,255,255,0.6)":T.muted` — 60% white on saturated color background gives ~3:1 contrast at `fontSize:10`. WCAG AA requires 4.5:1 for small text.
**Fix:** Increase to `rgba(255,255,255,0.85)` minimum when active.

### [V-08] Country card hover: 5% opacity provides no visual feedback 🟢 LOW
**Location:** `leads_dashboard_en (2).jsx` line 2034
**Issue:** Hover background uses `${meta.color}0D` (5% opacity). For dark colors like `#333333` this is imperceptible.
**Fix:** Use `1A` (10%) or `26` (15%) for hover backgrounds.

---

## Accessibility

### [A-01] `Toggle` / `Checkbox` in `ExportModal`: no ARIA, no keyboard 🟠 HIGH
**Location:** `leads_dashboard_en (2).jsx` lines 3532–3558
**Issue:** `<div onClick>` controls with no `role`, `tabIndex`, `aria-checked`, or keyboard handler. Screen readers and keyboard users cannot interact.
**Fix:** Replace with native `<input type="checkbox">`. See C-04.

### [A-02] Sortable table headers missing `aria-sort` 🟡 MEDIUM
**Location:** `leads_dashboard_en (2).jsx` line 702
**Issue:** `<th onClick={...}>` with `cursor:"pointer"` but no `aria-sort` attribute.
**Fix:** Add `aria-sort={sortBy===col.k ? "descending" : "none"}` to each sortable `<th>`.

### [A-03] `UploadZone` not keyboard-accessible 🟠 HIGH
**Location:** `leads_dashboard_en (2).jsx` lines 553–563
**Issue:** File input is `display:"none"`, activated by a `<div onClick>` with no `role`, `tabIndex`, or `onKeyDown`.
**Fix:** Add `role="button"`, `tabIndex={0}`, `onKeyDown={e => { if (e.key==='Enter'||e.key===' ') fileRef.current?.click(); }}`.

### [A-04] `Avatar` has no `aria-label` 🟢 LOW
**Location:** `src/components/Avatar.jsx` line 8
**Issue:** Renders 2-letter initials with no context. Screen readers announce "AB" with no lead name.
**Fix:** Add `aria-label={name}` to the container div.

### [A-05] Theme toggle has `title` but no `aria-label` 🟢 LOW
**Location:** `leads_dashboard_en (2).jsx` lines 4070–4084
**Issue:** `title` tooltips are not reliably read by screen readers.
**Fix:** Add `aria-label` matching the `title` text.

### [A-06] Collapsible table section missing `aria-expanded` 🟡 MEDIUM
**Location:** `leads_dashboard_en (2).jsx` line 676
**Issue:** Toggle button has no `aria-expanded` state.
**Fix:** Add `aria-expanded={tableOpen}` and `aria-controls` pointing to the table section id.

### [A-07] `ExportModal` has no focus trap or `role="dialog"` 🟠 HIGH
**Location:** `leads_dashboard_en (2).jsx` lines 3574–3589
**Issue:** Fixed overlay with no focus trap — Tab escapes to background. No `aria-modal`, no `role="dialog"`.
**Fix:** Add `role="dialog"`, `aria-modal="true"`, `aria-label="Export Leads"`. Implement focus trap on first/last focusable elements.

### [A-08] `T.muted` text at small sizes fails WCAG AA contrast 🟠 HIGH
**Location:** Throughout — `KpiCard` labels, table headers, `SectionTitle`, chips
**Issue:** `T.muted` (`#7080A0`) on `T.surface` (`#FFFFFF`) = ~3.9:1 ratio. Passes for large text (18px+) but fails WCAG AA (4.5:1) at `fontSize:9–13` where it is most heavily used.
**Fix:** For text below 14px, use `T.textSub` (`#3D4F6E`, ~6.3:1) or darken `T.muted` to `#5A6A8A` (~4.6:1).

### [A-09] Decorative SVG icons missing `aria-hidden` 🟡 MEDIUM
**Location:** `leads_dashboard_en (2).jsx` lines 4005, 4081, 4099, 4112
**Issue:** Inline `<svg>` icons without `aria-hidden="true"`. Screen readers will attempt to read SVG path data.
**Fix:** Add `aria-hidden="true"` to all decorative SVGs. Ensure parent buttons have `aria-label`.

---

## Cross-Cutting Issues

### [X-01] Theme persistence uses `localStorage` directly — violates platform API 🟠 HIGH
**Location:** `leads_dashboard_en (2).jsx` lines 93, 3884
**Issue:** `localStorage.setItem/getItem("cc_theme")` — violates CLAUDE.md rule: "NO usar `window.localStorage` directamente — la plataforma usa `window.storage.get/set`".
**Fix:** Replace with `window.storage.set/get("cc_theme")` using the async pattern already used for partners/monthData.

### [X-02] Dual `Card` definition: theme-sync divergence risk 🟡 MEDIUM
**Location:** `src/components/Card.jsx` vs `leads_dashboard_en (2).jsx` lines 358–367
**Issue:** Extracted `Card` uses `useTheme()` context; monolith `Card` reads global `T`. Theme changes require `key={theme}` full-remount hack (line 3996). Risk of theme bugs appearing in only one version.
**Fix:** Tracked in CLEANUP_PLAN Rule 5. Prioritize ThemeContext migration + monolith duplicate removal simultaneously.

### [X-03] `ExportModal` `filtered` useMemo has stale dependency array 🟡 MEDIUM
**Location:** `leads_dashboard_en (2).jsx` lines 3427–3430
**Issue:** `useMemo` depends on `matchesCat/matchesVertical/matchesCountry` functions not listed in dependency array. Currently suppressed by eslint-disable.
**Fix:** Move filter functions outside the component (they are pure) or wrap in `useCallback`.

---

## Items Requiring Design Decisions Before Fixing

These issues need explicit direction — do not assume:

| ID | Issue | Decision Needed |
|----|-------|----------------|
| [L-06] | 9-tab navbar overflow | Scrollable tab bar vs hamburger/overflow menu |
| [L-09] | Nested panel background | `T.surface2` for inner cards or only for inputs |
| [V-05] | DTI 5-step color scale | Keep `#65A30D`/`#F97316` as semantic constants or collapse to 3 steps |
| [V-07] | Active vertical card contrast | Higher opacity text or lighter tint background |
| [R-06] | `ExportModal` mobile layout | Tab/accordion filter panel or full-screen step flow |

---

## Fix Priority Order

### Immediate (before any deployment)
1. [C-06] `ExportModal` preview thead invisible — white on white
2. [C-07] `RevenueTab` total row invisible — white on white
3. [C-08] `MultiPartnerTab` total row invisible — white on white

### Phase 1 — Functional Fixes
4. [R-01] Add responsive `@media` breakpoints to `applyTheme()` CSS
5. [L-05] + [R-06] `ExportModal` max-width + mobile layout
6. [C-04] + [A-01] Native checkbox/radio in `ExportModal`
7. [A-07] Focus trap + ARIA on `ExportModal`
8. [A-03] `UploadZone` keyboard accessibility
9. [A-08] Contrast fix for `T.muted` at small sizes
10. [X-01] `localStorage` → `window.storage`

### Phase 2 — Polish & Consistency
11. [L-01] → [L-03] Grid/spacing cleanup
12. [T-01] → [T-04] Typography scale enforcement
13. [V-02] Border-radius token reconciliation
14. [C-09] Toolbar control height normalization
15. [V-06] Transition constants
16. [A-02], [A-06], [A-09] ARIA attribute additions

### Phase 3 — Low-priority Cosmetic
17. Remaining `LOW` severity items

---

*Total issues: 3 Critical · 15 High · 16 Medium · 17 Low*
