# CLEANUP_REPORT.md — CreditCheck Dashboard
> Session: March 2026 · Author: Claude Code (Sonnet 4.6)

---

## Summary

Full audit, cleanup, and feature implementation across two sessions. The dashboard was a 4 245-line React monolith. The work below covers all items from `CLEANUP_PLAN.md` plus the full `feature-proposals.md` backlog.

---

## Phase 1 — Bug Fixes (Rule 1)

| # | Item | File | Status |
|---|------|------|--------|
| B1 | `storageReady` indicator used hardcoded `#10B981` instead of `T.green` | `src/App.jsx` | ✅ Fixed |
| B2 | `scoreLead()` calls in LeadScoringTab not memoized | `src/tabs/LeadScoringTab.jsx` | ✅ Already guarded |
| B3 | `window.storage.get` could hang indefinitely — no fallback | `src/App.jsx` | ✅ Fixed — 3 s timeout added |
| B4 | `getEntry()` in RevenueTab could throw on missing month key | `src/tabs/RevenueTab.jsx` | ✅ Already guarded |

---

## Phase 2 — Dead Code Removal (Rule 1)

| # | Item | File | Status |
|---|------|------|--------|
| D2 | `ProgressBar.jsx` was orphaned (0 callers) | `src/components/ProgressBar.jsx` | ✅ Deleted |
| D3 | Duplicate Google Fonts `@import` in `applyTheme()` — caused re-fetch on every theme toggle | `src/constants/themes.js` | ✅ Removed; moved to `index.html` with `<link rel="preconnect">` |

---

## Phase 3 — Performance (Rules P3, P4)

| # | Item | File | Status |
|---|------|------|--------|
| P3 | 9 expensive derived computations in InsightsTab ran on every render | `src/tabs/InsightsTab.jsx` | ✅ Wrapped in `useMemo` |
| P4 | Google Fonts loaded via JS string injection — blocks every theme toggle | `src/constants/themes.js`, `index.html` | ✅ Moved to `index.html` (loaded once) |

---

## Phase 4 — Features Implemented

### 🔴 High Priority

| # | Feature | Description | File(s) |
|---|---------|-------------|---------|
| H1 | Global date range filter | Date bar below navbar; filters all tabs simultaneously via `filteredData` useMemo | `src/App.jsx` |
| H2 | Lead detail drawer | Slide-in panel with score breakdown per factor, all fields, "Copy as JSON" | `src/components/LeadDrawer.jsx`, `src/tabs/LeadsTab.jsx` |
| H3 | Advanced search & filters | Employment, country, verified filters + column visibility toggle dropdown | `src/tabs/LeadsTab.jsx` |
| H4 | Direct CSV/JSON export | "↓ .csv / .json" secondary button in ExportModal for direct file download | `src/components/ExportModal.jsx` |

---

## Phase 5 — Security & Bug Fixes (2026-03-24 session)

| # | File | Change | Severity |
|---|------|--------|----------|
| S1 | `src/utils/fetchLiveData.js:42` | **Fixed: added `accessToken = ''` parameter to function signature.** App.jsx was calling `fetchLiveData(processRows, googleToken)` but the function only accepted one parameter — the Google OAuth token was silently dropped, meaning all authenticated requests fell back to `VITE_API_TOKEN` env var (or no auth). This broke Google OAuth data fetching. | CRITICAL bug |
| S2 | `src/App.jsx:159,162` | Removed two `console.warn('[GoogleAuth]…')` statements from production code paths. These would leak internal implementation details (GIS SDK URL, error types) to browser consoles visible to any user with DevTools open. Replaced with no-op callbacks. | LOW |
| S3 | `.gitignore` | Added `backend/node_modules/`, `backend/.env`, `*.log`, `npm-debug.log*` to prevent accidental commit of backend secrets and build artifacts. | LOW |

---

## Items Identified but Deferred (documented in SECURITY_REPORT.md)

| # | Item | Reason deferred |
|---|------|-----------------|
| M1 | `creditcheck_dashboard_prefs` (LeadsTab) uses raw `localStorage` — bypasses AES-GCM wrapper | Data stored is UI preferences (column visibility, sort order) — no PII. Migrating to async `window.storage` requires refactoring `readPrefs`/`savePrefs` to async, touching ~8 call sites. Logged as MEDIUM in SECURITY_REPORT.md. |
| M2 | `xlsx` v0.18.5 dependency | Unmaintained upstream; migration to ExcelJS is a separate effort. Tracked in SECURITY_REPORT.md. |
