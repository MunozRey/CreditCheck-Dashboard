# FEATURES_BUILT.md

> Built: 2026-03-14 — CreditCheck Dashboard v1.1
> Branch: claude/beautiful-stonebraker

---

## Feature 1 — Lead Detail Drawer

**Status: Enhanced** (drawer already existed; added Copy Email + ESC close)

### What was built
- Added a "@ Copy email" button to the drawer header — copies the lead's email to clipboard, shows "✓ Email copied" for 1.8s, then resets
- Added ESC key listener inside the drawer component (`React.useEffect` on `keydown`) so pressing ESC closes it
- Clicking the backdrop already closed the drawer (unchanged)

### How to use
1. Click any row in the Leads tab — the drawer slides in from the right
2. Press the "@ Copy email" button to copy just the email address
3. Press ESC or click the dark backdrop to close

### Edge cases validated
- 0 leads: drawer never opens (no rows to click)
- Lead with no email: "@ Copy email" button is hidden
- Works in light and dark mode via `T.*` tokens

---

## Feature 2 — Priority Queue Tab

**Status: New** — `src/tabs/PriorityTab.jsx` (new file)

### What was built
- New tab "Priority" inserted between "Leads" and "Analytics" in the navbar
- Shows top 20 leads ranked by `scoreLead()` descending
- Includes only Bank Connected + Form Submitted (Incomplete excluded)
- Each row shows: rank badge (top 3 highlighted in blue), name + email, score bar, BC/FS category chip, income, loan amount, days since created
- "Contact today" badge (green pill) on leads created within the last 48 hours
- "Copy N emails" button in the header copies all visible emails comma-separated to clipboard — ideal for bulk Gmail/Outlook outreach
- Footer bar shows: total qualified leads, count needing contact today, average score
- Clicking any row opens the Lead Drawer

### How to use
1. Click "Priority" tab in the navbar
2. Review the ranked list — top scorers at the top
3. Click "Copy 20 emails" to copy all emails for bulk outreach
4. Click any row to open the full Lead Drawer

### Edge cases validated
- 0 leads: shows empty state card with instructions
- 1 lead: shows rank #1 correctly
- 500+ leads: only top 20 displayed, footer shows full count
- All leads Incomplete: empty state (Priority only shows BC + FS)

### Tab keyboard shortcut
The tab is now at index 1 (0-based), so keyboard shortcut `2` navigates to Priority. All existing shortcuts shift by one accordingly.

---

## Feature 3 — Daily Digest Banner

**Status: New** — implemented inside `src/App.jsx`

### What was built
- A clickable banner rendered between the KPI strip and the live-status banner
- Shows: "X new leads today · Y this week"
- Compares today's count vs yesterday's count with a delta badge (+N vs yesterday / -N vs yesterday)
- Clicking the banner: switches to the Leads tab AND sets the global date range filter to today only
- Banner only renders when there are leads today or this week (hidden when data is empty / all old data)

### How to use
1. Banner appears automatically below the KPI strip when data is loaded
2. Read the counts at a glance
3. Click the banner to jump to the Leads tab filtered to today

### Edge cases validated
- 0 leads today: banner is hidden (no noise)
- 0 leads this week: banner is hidden
- 500 leads all from same day: banner shows that day's count correctly
- Date comparison uses ISO date strings (locale-independent)

### Known limitation
The "today" comparison is based on the client's local system date. If the XLSX data was exported in a different timezone, the counts may differ by ±1 day. This is acceptable for an internal BD tool.

---

## Feature 4 — Export to Pipedrive CSV

**Status: New** — implemented inside `src/components/ExportModal.jsx`

### What was built
- Added "Pipedrive CSV" as a fourth format option in the Export modal (alongside CSV, TSV, JSON)
- When selected: the right panel switches to a Pipedrive info card showing the four fixed columns
- Preview table shows Pipedrive-specific columns: Name, Email, Lead Title, Created
- Lead Title is auto-generated as `CreditCheck - Grade A` / `B` / `C` / `D` using `scoreLead()`
- Download button saves as `pipedrive_import_YYYY-MM-DD.csv`
- All existing filters (Category, Vertical, Country) apply to Pipedrive exports too
- Import this file in Pipedrive → Leads → Import → "Create leads from CSV"

### How to use
1. Click "Export" in the navbar
2. Apply category/country/vertical filters as needed
3. Select "Pipedrive CSV" in the Format section
4. Click "↓ pipedrive.csv" to download directly, or "Copy & Preview" to inspect first

### Edge cases validated
- 0 leads: download button is disabled
- Grade computation uses the same `scoreLead()` model as the rest of the dashboard
- Works with both Pipedrive-format and CreditScore XLSX uploads (format-agnostic — reads normalized data)

### Known limitation
Pipedrive's Lead Title field may need to be manually mapped during import if Pipedrive changes their CSV schema. The current format follows Pipedrive's standard lead import template as of early 2026.

---

## Files modified / created

| File | Change |
|------|--------|
| `src/components/LeadDrawer.jsx` | Added `emailCopied` state, `handleCopyEmail()`, "@ Copy email" button, ESC key listener |
| `src/tabs/PriorityTab.jsx` | **New file** — Priority Queue tab component |
| `src/components/ExportModal.jsx` | Added `scoreLead` import, `buildPipedriveContent()`, Pipedrive UI, updated button conditions |
| `src/App.jsx` | Added `PriorityTab` import, `priority` tab entry, `digestStats` useMemo, Daily Digest Banner JSX |

## No breaking changes
- `scoreLead()` was NOT modified
- `processRows()` was NOT modified
- No new npm dependencies added
- All colors use `T.*` tokens
- Existing tabs and functionality unchanged
