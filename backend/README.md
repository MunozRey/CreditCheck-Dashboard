# CreditCheck Dashboard — Backend API

**Stack:** Node.js · Express · PostgreSQL · Prisma · JWT
**Clovr Labs — Internal tool**

---

## Quick Start (Docker — recommended)

### Prerequisites
- Docker Desktop installed and running
- A `.env` file at project root (copy from `.env.example`)

```bash
# 1. Create your .env
cp .env.example .env

# 2. Generate a secure JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Paste output into .env → JWT_SECRET=...

# 3. Start everything
docker-compose up -d

# 4. Seed initial users and sample data
docker-compose exec api npm run db:seed
```

API is now live at **http://localhost:3001**

---

## Quick Start (Local dev, no Docker)

### Prerequisites
- Node.js ≥ 18
- PostgreSQL 14+ running locally

```bash
cd backend
cp .env.example .env
# Edit .env with your local DB credentials

npm install
npx prisma migrate deploy   # applies migrations/
npx prisma generate         # generates Prisma client
npm run db:seed             # creates initial users + sample leads
npm run dev                 # starts with nodemon (hot reload)
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | 64-byte hex secret for signing JWTs |
| `JWT_EXPIRES_IN` | ✅ | Token lifetime (e.g. `8h`, `24h`) |
| `PORT` | — | HTTP port (default: `3001`) |
| `NODE_ENV` | — | `development` or `production` |
| `ALLOWED_EMAILS` | ✅ | Comma-separated team email whitelist |
| `CORS_ORIGIN` | ✅ | Frontend URL (e.g. `https://dashboard.clovrlabs.com`) |
| `RATE_LIMIT_WINDOW_MS` | — | Rate limit window in ms (default: `60000`) |
| `RATE_LIMIT_MAX` | — | Max requests per window per IP (default: `100`) |

---

## Adding a New Teammate

1. Add their email to `ALLOWED_EMAILS` in your `.env` (or secrets manager):
   ```
   ALLOWED_EMAILS="david@clovrlabs.com,ferran@clovrlabs.com,newperson@clovrlabs.com"
   ```
2. Restart the API (or update the env var in Render/Railway — no redeploy needed if using env var reload).
3. The user record is created automatically on their first login with `role: viewer`.
4. To promote to `admin`, run:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'newperson@clovrlabs.com';
   ```
   Or use `npx prisma studio` for a UI.

---

## API Reference

### Auth
```
POST /auth/login          Body: { email }   → { token, user }
GET  /auth/me             Auth required     → { id, email, role }
```

### Leads
```
GET    /leads             Auth required     → { data: Lead[], count }
GET    /leads?product=creditcheck&stage=prospect&from=2025-01-01&to=2026-12-31
POST   /leads             Auth required     → Lead (201)
PATCH  /leads/:id         Auth required     → Lead
GET    /leads/:id/activity Auth required    → { data: ActivityLog[] }
POST   /leads/:id/activity Auth required   → ActivityLog (201)
```

### Health
```
GET /health               No auth           → { status: "ok", timestamp }
```

---

## Database Migrations

Migrations live in `/migrations/` as plain SQL files.
On first `docker-compose up`, PostgreSQL auto-runs `001_initial.sql`.

To add a migration:
```bash
# Create the file
touch migrations/002_add_field.sql

# Write your SQL, then apply manually:
psql $DATABASE_URL -f migrations/002_add_field.sql

# Or using Prisma:
npx prisma migrate dev --name add_field
```

---

## Deployment (Render — recommended)

1. Push code to GitHub
2. Create a **Web Service** on Render pointing to `./backend`
3. Add all env vars in Render dashboard
4. Create a **PostgreSQL** database on Render, copy the connection string to `DATABASE_URL`
5. Set Build Command: `npm install && npx prisma generate && npx prisma migrate deploy`
6. Set Start Command: `node src/index.js`
7. Enable **Auto-Deploy** on push to `main`

**Estimated setup time: ~20 minutes**

---

## Security Notes

- JWT tokens are signed with HS256 + audience/issuer claims
- Tokens are held in frontend JS memory only (never localStorage)
- Rate limiting: 100 req/min global, 10 login attempts/15 min
- All secrets must be in environment variables — never committed to git
- See `SECURITY_REPORT.md` for full audit findings
