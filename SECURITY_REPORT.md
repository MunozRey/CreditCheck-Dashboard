# SECURITY_REPORT.md — CreditCheck Dashboard
**Date:** 2026-03-24
**Auditor:** Claude (Sonnet 4.6) — human review recommended before production deploy
**Repository:** https://github.com/MunozRey/CreditCheck-Dashboard

---

## Executive Summary

The existing codebase has a mature, well-documented security posture for a client-side internal tool (`SECURITY.md`, `secureStorage.js`, `auditLog.js`, `AuthGate.jsx` all demonstrate deliberate security thinking). One **critical functional bug** was found that broke Google OAuth authentication silently. Two **high** issues remain. All other risks are documented, accepted, and consistent with the threat model (internal tool, no server-side processing).

The new `./backend` API was built from scratch with independent security controls documented separately.

---

## CRITICAL — Fixed in this session

### ~~C-1: Google OAuth token was never used for API requests~~  ✅ FIXED

**File:** `src/utils/fetchLiveData.js:42`
**Root cause:** Function signature `fetchLiveData(processRows)` accepted only one argument. `App.jsx` called `fetchLiveData(processRows, googleToken)` — the token was silently ignored. Inside the function, `accessToken` referenced an undefined variable, so `effectiveToken` always fell through to `API_TOKEN` env var (or sent unauthenticated requests).

**Fix applied:**
```js
// Before (broken):
async function fetchLiveData(processRows) {
  ...
  const effectiveToken = accessToken || API_TOKEN; // accessToken = undefined

// After (fixed):
async function fetchLiveData(processRows, accessToken = '') {
  ...
  const effectiveToken = accessToken || API_TOKEN; // accessToken = google token ✅
```

**Impact:** With the fix, Google OAuth works correctly: after the user signs in with Google, the access token is passed to `fetchLiveData` and used in the `Authorization: Bearer` header.

---

## HIGH — Fix within sprint

### H-1: `creditcheck_dashboard_prefs` stored unencrypted in localStorage

**File:** `src/tabs/LeadsTab.jsx:14-18`

The preferences key (`creditcheck_dashboard_prefs`) is written via raw `localStorage.setItem` — it bypasses the `window.storage` AES-GCM encryption wrapper applied in `main.jsx`.

**Current stored data:** column visibility, sort direction, sort field, selected loan purpose filter. None of this is directly PII. However:
- The pattern is inconsistent with the rest of the codebase (all other keys go through encrypted `window.storage`)
- A future developer could add PII to these prefs and unknowingly store it unencrypted
- Any content visible in the GDPR "Clear All Data" flow may not clear this key (depends on implementation)

**Remediation:** Migrate to `window.storage` (async). Because `window.storage` uses Promises, `readPrefs`/`savePrefs` need to become async and all call sites updated. Estimated effort: 2–3 hours.

```js
// Current (plaintext):
function readPrefs() {
  try { return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}'); } catch(_) { return {}; }
}
function savePrefs(patch) {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify({ ...readPrefs(), ...patch })); } catch(_) {}
}

// Target pattern (encrypted, async):
async function loadPrefs(setPrefs) {
  const r = await window.storage.get(PREFS_KEY).catch(() => ({ value: null }));
  if (r?.value) setPrefs(p => ({ ...p, ...JSON.parse(r.value) }));
}
async function savePrefs(patch) {
  const current = /* current state */;
  await window.storage.set(PREFS_KEY, JSON.stringify({ ...current, ...patch })).catch(() => {});
}
```

---

### H-2: `xlsx` v0.18.5 is unmaintained upstream

**File:** `package.json`
**Risk:** The `xlsx` (SheetJS Community Edition) library at v0.18.5 has not been actively maintained since 2023 and has known CVEs in older versions. Maliciously crafted XLSX files could exploit parser vulnerabilities.

**Existing mitigations already in place:**
- `fetchLiveData.js` validates magic bytes (ZIP PK header) before parsing
- `processRows` in `xlsxParser.js` caps at `MAX_ROWS = 10,000`
- Input values are clamped via `safePositiveFloat()` before scoring

**Remediation (backlog):** Migrate to ExcelJS (`npm install exceljs`) which is actively maintained and has fewer known CVEs. The API surface is different — `xlsxParser.js` would need to be rewritten.

```bash
npm run audit:deps   # run before each production deploy to check for new CVEs
```

---

## MEDIUM / LOW — Backlog (inherited risks, already documented in SECURITY.md)

| ID | Risk | Mitigation | Status |
|----|------|------------|--------|
| M-1 | Client-side auth only — hash is in the bundle | Long random passphrase + VPN/IP allowlist | ✅ Accepted (internal tool) |
| M-2 | `VITE_STORAGE_KEY` embedded in bundle | Protects against casual snooping, not bundle analysis | ✅ Accepted |
| M-3 | `'unsafe-inline'` in CSP | Required for inline-style React components | ⚠️ Tech debt — migrate to CSS classes |
| M-4 | No server-side rate limiting on API endpoint | Client-side 5 min fetch cooldown | ⚠️ Add server-side rate limiting (backend API solves this) |
| L-1 | No token revocation for client-side session | sessionStorage tab-scoped; 8h TTL | ✅ Acceptable |
| L-2 | `console.warn` in production paths | Removed in this session (C2) | ✅ Fixed |

---

## Backend API Security (new — `./backend/`)

The new backend was built with the following controls:

| Control | Implementation |
|---|---|
| All routes protected | `requireAuth` middleware on all routes except `/health`, `/auth/login` |
| JWT validation | HS256, audience=`creditcheck-api`, issuer=`clovrlabs`, expiry checked |
| Email whitelist | `ALLOWED_EMAILS` env var checked on every login |
| Rate limiting | `express-rate-limit`: 100 req/min global, 10 login/15 min |
| SQL injection | Prisma ORM — all queries parameterized |
| XSS | No server-side rendering; input validation via `express-validator` |
| CORS | Single allowlisted origin via `CORS_ORIGIN` env var |
| Security headers | Helmet: HSTS, CSP, X-Frame-Options, X-Content-Type-Options, etc. |
| HTTPS | Redirect middleware in production (`x-forwarded-proto` check) |
| Secrets | All in env vars; `.env` in `.gitignore`; `.env.example` has no real values |
| Token storage | JWT held in JS memory (not localStorage) on frontend |
| Logs | Authorization header redacted from morgan output |
| Container | Multi-stage Dockerfile, non-root user `appuser` |
| Body size | `express.json({ limit: '10kb' })` |

**Remaining backend items before first deploy:**
1. Generate real `JWT_SECRET`: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
2. Change PostgreSQL default password from `changeme`
3. Run `npm audit --audit-level=high` after `npm install`
4. Set `CORS_ORIGIN` to actual frontend domain in production

---

## How to Run Dependency Audit

```bash
# Frontend
npm run audit:deps

# Backend (once installed)
cd backend && npm install && npm audit --audit-level=high
```
