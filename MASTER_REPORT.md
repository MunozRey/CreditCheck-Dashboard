# MASTER_REPORT.md
**Project:** CreditCheck Dashboard
**Repository:** https://github.com/MunozRey/CreditCheck-Dashboard
**Organization:** Clovr Labs
**Executed:** 2026-03-24
**Engineer:** Claude (Sonnet 4.6)

---

## Phase 1 — Inventory

### Repository Cloned
```
git clone https://github.com/MunozRey/CreditCheck-Dashboard.git
```

### Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js (ESM) | ≥18 |
| Framework | React | 18.3.1 |
| Build | Vite | 5.4.8 |
| Charts | Recharts | 2.12.7 |
| XLSX parsing | xlsx | 0.18.5 ⚠️ (unmaintained upstream) |
| Testing | Vitest + @testing-library/react | 2.1.9 / 16.3.2 |
| Deploy | Netlify + Vercel (both configs present) | — |

**Architecture:** Pure frontend SPA — no backend server. All data lives in the browser.

### Directory Structure (3 levels)
```
CreditCheck-Dashboard/
├── src/
│   ├── App.jsx                  (main orchestrator — ~500 lines)
│   ├── main.jsx                 (entry point — storage polyfill + encryption)
│   ├── components/              (AuthGate, ErrorBoundary, LeadDrawer, …17 components)
│   ├── tabs/                    (Leads, Analytics, Verticals, Countries, Scoring,
│   │                             Insights, DataQuality, Revenue, MultiPartner)
│   ├── utils/                   (fetchLiveData, xlsxParser, scoring, auditLog,
│   │                             secureStorage, googleAuth, revenue, format, …)
│   ├── hooks/                   (useLeadFilters)
│   ├── context/                 (ThemeContext, PrivacyContext)
│   ├── constants/               (themes, verticals, verticalIcons)
│   └── styles/                  (shared)
├── backend/                     ← NEW (added Phase 4)
│   ├── src/                     (Express API)
│   ├── prisma/schema.prisma
│   ├── Dockerfile
│   ├── package.json
│   └── README.md
├── migrations/                  ← NEW (added Phase 4)
│   └── 001_initial.sql
├── docker-compose.yml           ← NEW (added Phase 4)
├── api_collection.json          ← NEW (added Phase 4)
├── index.html
├── vite.config.js
├── package.json
└── .env.example
```

### Data Flows

```
1. XLSX Upload path:
   User uploads .xlsx → UploadZone → xlsxParser.processRows()
   → React state (memory only) → all tabs re-render

2. Live API fetch path:
   App.jsx useEffect → fetchLiveData(processRows, googleToken)
   → GET VITE_API_ENDPOINT with Authorization: Bearer <token>
   → xlsxParser.processRows() → React state

3. Persistence (localStorage, AES-GCM encrypted):
   window.storage.set/get → secureStorage.js PBKDF2+AES-GCM
   → localStorage (cc_partners, cc_settings, cc_starred,
     cc_mortgage_data, cc_month_data, cc_user_uploaded, cc_rows)

4. Session auth:
   AuthGate → SHA-256(password) vs VITE_AUTH_PASSWORD_HASH
   → sessionStorage cc_auth_session {expiresAt: now+8h}
```

### localStorage / sessionStorage Usage

| Key | Storage | Encrypted | Contents |
|-----|---------|-----------|----------|
| `cc_partners` | localStorage | ✅ AES-GCM | Partner revenue configs |
| `cc_settings` | localStorage | ✅ AES-GCM | Dashboard settings |
| `cc_starred` | localStorage | ✅ AES-GCM | Starred lead emails |
| `cc_mortgage_data` | localStorage | ✅ AES-GCM | Mortgage pipeline data |
| `cc_month_data` | localStorage | ✅ AES-GCM | Monthly partner figures |
| `cc_user_uploaded` | localStorage | ✅ AES-GCM | Upload flag |
| `cc_rows` | localStorage | ✅ AES-GCM | Uploaded XLSX rows |
| `creditcheck_dashboard_prefs` | localStorage | ❌ **Plaintext** | LeadsTab column prefs |
| `cc_auth_session` | sessionStorage | ❌ Plaintext (by design) | Auth expiry timestamp |
| `cc_audit_session` | sessionStorage | ❌ Plaintext (by design) | Audit session UUID |
| `cc_audit_queue` | sessionStorage | ❌ Plaintext (by design) | Audit event queue |

---

## Phase 2 — Code Cleanup

See [CLEANUP_REPORT.md](./CLEANUP_REPORT.md)

**Changes made in this session:**

| # | File | Change |
|---|------|--------|
| C1 | `src/utils/fetchLiveData.js` | Fixed critical bug: added `accessToken = ''` parameter to function signature — previously the Google OAuth token was silently dropped |
| C2 | `src/App.jsx` | Removed two `console.warn('[GoogleAuth]…')` from production code paths — replaced with no-ops |
| C3 | `.gitignore` | Added `backend/node_modules/`, `backend/.env`, `*.log`, `npm-debug.log*` |

---

## Phase 3 — Security Audit

See [SECURITY_REPORT.md](./SECURITY_REPORT.md)

### Quick summary

| Severity | Count | Key finding |
|---|---|---|
| CRITICAL | 1 | Google OAuth token never reached API (now fixed) |
| HIGH | 2 | Prefs key unencrypted in localStorage; `xlsx` v0.18.5 unmaintained |
| MEDIUM | 3 | Client-side auth only; `VITE_STORAGE_KEY` in bundle; `unsafe-inline` CSP |
| LOW | 2 | No server-side rate limiting; no token revocation |

---

## Phase 4 — Shared Backend

### Problem
The existing app is purely client-side. Each browser session is isolated:
- Person A uploads an XLSX → Person B sees nothing
- Starred leads, notes, pipeline stages — all local to one browser
- No team visibility, no shared state, no audit trail beyond sessionStorage

### Solution
A production-grade REST API was built and added to `./backend/`.

### Architecture

```
Browser (React SPA) → HTTPS
       ↓  fetch /api/*
Express API (port 3001)
       ↓  Prisma ORM
PostgreSQL (port 5432)
```

### Data Model

```sql
users        (id UUID, email TEXT UNIQUE, role admin|viewer, created_at)
leads        (id UUID, company_name, contact_name, contact_email,
              product creditcheck|ibancheck, stage, source, score 0-100,
              created_at, updated_at)
activity_log (id UUID, lead_id→leads, user_id→users, action, notes, created_at)
```

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/login` | Email whitelist check → JWT |
| GET | `/auth/me` | Current user profile |
| GET | `/leads` | List leads (product/stage/date filters) |
| POST | `/leads` | Create lead |
| PATCH | `/leads/:id` | Update stage / score |
| GET | `/leads/:id/activity` | Activity log |
| POST | `/leads/:id/activity` | Log note or action |
| GET | `/health` | Healthcheck |

### Security controls in backend

- JWT signed HS256 + audience + issuer + expiry validation
- Email whitelist enforced at login (ALLOWED_EMAILS env var)
- Rate limiting: 100 req/min global, 10 login attempts/15 min
- All routes except `/auth/login` and `/health` require valid JWT
- Helmet security headers (HSTS, CSP, X-Frame-Options, etc.)
- HTTPS redirect in production
- Input validation on all POST/PATCH bodies (express-validator)
- Body size cap: 10 KB
- Parameterized SQL via Prisma (zero SQL injection surface)
- Non-root Docker user (`appuser`)
- Authorization header redacted from access logs

### Adding a teammate

1. Append their `@clovrlabs.com` email to `ALLOWED_EMAILS` in `.env`
2. Restart the API (or update the env var in Render/Railway)
3. User is auto-created as `viewer` on first login
4. Promote to `admin`: `UPDATE users SET role='admin' WHERE email='...';`

---

## Deployment Recommendation

**Render** (free tier, ~25 min to deploy):

| Service | Render type | Cost |
|---|---|---|
| `./backend` | Web Service | Free |
| PostgreSQL | Managed Database (1 GB) | Free |
| Frontend (existing) | Static Site | Free |

**Steps:**
1. Push this branch to GitHub
2. Create Render PostgreSQL → copy `DATABASE_URL`
3. Create Render Web Service pointing to `./backend`
   - Build: `npm install && npx prisma generate && npx prisma migrate deploy`
   - Start: `node src/index.js`
4. Set all env vars from `backend/.env.example`
5. Deploy frontend Static Site; set `VITE_API_URL` to the backend URL

**Estimated total: 25 minutes**

---

## Files Delivered

| File | Purpose |
|---|---|
| `backend/` | Full Express + Prisma API |
| `backend/README.md` | Setup, env vars, teammate guide |
| `backend/Dockerfile` | Multi-stage production container |
| `docker-compose.yml` | One-command local dev stack |
| `migrations/001_initial.sql` | Schema with indexes + auto-updated_at trigger |
| `api_collection.json` | Postman collection — import and run immediately |
| `CLEANUP_REPORT.md` | All code changes made |
| `SECURITY_REPORT.md` | Full audit findings with remediation snippets |
| `MASTER_REPORT.md` | This file |
