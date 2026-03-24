# Security Policy — CreditCheck Dashboard

> Last updated: 2026-03-14
> Maintained by: Clovr Labs Engineering

---

## Overview

CreditCheck Dashboard is an internal B2B tool for the Clovr Labs Business Development team.
It processes PII and financial data (names, emails, income, loan amounts, credit scores) of
Open Banking lead applicants. Access is restricted to authorised team members only.

---

## Secrets Management

| Secret | Location | Rotation |
|--------|----------|----------|
| Dashboard password hash | `VITE_AUTH_PASSWORD_HASH` in `.env` | Rotate every 90 days or on team member departure |
| Storage encryption key | `VITE_STORAGE_KEY` in `.env` | Rotate if suspected exposure (invalidates stored data) |
| Live API token | `VITE_API_TOKEN` in `.env` | Rotate every 90 days or on exposure |

**Rules:**
- `.env` is listed in `.gitignore` — never commit it.
- Use `.env.example` as a template; it contains no real secrets.
- On a new machine, copy `.env.example` → `.env` and fill in values.
- If a secret is accidentally committed, rotate it immediately and treat the old value as compromised.
- For production deployments, inject env vars via the hosting platform (Vercel, Railway, etc.) rather than a `.env` file.

---

## Authentication Flow

1. On page load, `AuthGate` checks `sessionStorage` for a valid session token (8h TTL).
2. If no valid session exists, a password prompt is shown.
3. The submitted password is SHA-256 hashed client-side and compared to `VITE_AUTH_PASSWORD_HASH`.
4. On match, an expiry record is written to `sessionStorage`.

**Limitations:**
- This is a client-side gate only — it does not involve a server-side session.
- `VITE_AUTH_PASSWORD_HASH` is embedded in the client bundle. A determined attacker who can read
  the minified bundle can attempt offline brute force. Mitigate with a long random passphrase
  (20+ chars) and network-level access controls (VPN, IP allowlist).
- For higher assurance, replace this with OAuth2/OIDC (Google Workspace, Azure AD, etc.).

---

## Data in Transit

- The live data endpoint (`VITE_API_ENDPOINT`) must use HTTPS. HTTP is not accepted.
- All API requests include `X-Requested-With: XMLHttpRequest` and `X-CSRF-Token` headers.
- `Authorization: Bearer <token>` is included when `VITE_API_TOKEN` is set.

---

## Data at Rest

- Partner configurations, settings, and starred leads are encrypted in `localStorage`
  using AES-GCM 256-bit with a PBKDF2-derived key (100,000 iterations, SHA-256).
- Lead data from XLSX uploads is held in React state only (memory) — not persisted to disk.
- Live data fetched from the API is also memory-only.

---

## GDPR / Data Protection

- A consent acknowledgement modal is shown on every browser session before accessing lead data.
- Data retention limit: 90 days (configurable in `GdprBanner.jsx`).
- The "Clear All Data" button in the navbar and the retention warning banner both
  trigger immediate deletion of all stored data.
- All data exports are logged to the audit trail (see below).
- No PII is transmitted to third-party analytics or logging services.

---

## Audit Trail

Sensitive actions are recorded with the `auditLog()` utility (`src/utils/auditLog.js`):

| Action | Logged metadata (no PII) |
|--------|--------------------------|
| `data_upload` | file size, row count, truncated flag |
| `lead_export` | format, row count, field names, category filters |
| `partner_edit` | partner ID, action type |
| `data_cleared` | timestamp |

In development: events print to `console.info`.
In production: if `VITE_AUDIT_ENDPOINT` is set, events are POSTed there. Otherwise, they
are queued in `sessionStorage` (up to 100 events) for retrieval.

---

## Content Security Policy

A CSP meta tag in `index.html` restricts resource loading:
- Scripts: `'self'` only (XLSX library is now bundled, no CDN)
- Styles: `'self'` + `'unsafe-inline'` (required for inline-style React components) + Google Fonts
- Connections: `'self'` + the API endpoint domain
- Frames: blocked (`frame-ancestors 'none'`)

To harden further, migrate inline styles to CSS classes and remove `'unsafe-inline'`.

---

## Known Limitations and Accepted Risks

| Risk | Mitigation | Accepted? |
|------|------------|-----------|
| Client-side auth only | Password hash in bundle; mitigate with VPN/IP allowlist | ✅ Accepted for internal tool |
| `VITE_STORAGE_KEY` in bundle | Protects against casual snooping, not bundle analysis | ✅ Accepted — add server-side auth for stronger guarantee |
| `'unsafe-inline'` in CSP | Required for current inline-style architecture | ⚠️ Track as tech debt — migrate to CSS classes |
| XLSX library (v0.18.5) | Not actively maintained upstream; monitored via `npm audit:deps` | ⚠️ Plan migration to ExcelJS |
| No server-side rate limiting | Client-side 5-minute cooldown only | ⚠️ Add server-side rate limiting on API endpoint |

---

## Reporting a Vulnerability

If you discover a security vulnerability in this project:

1. **Do not** open a public GitHub issue.
2. Email the engineering team at: **security@clovrlabs.io** (or your internal security contact)
3. Include: description of the vulnerability, steps to reproduce, and potential impact.
4. We aim to respond within 48 hours and resolve critical issues within 7 days.

---

## Dependency Auditing

Run `npm run audit:deps` to check for known CVEs in the dependency tree.
This command is recommended before every production deployment.

A finding of `high` or `critical` severity must be resolved before deploying.
