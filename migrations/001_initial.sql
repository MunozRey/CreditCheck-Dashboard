-- Migration: 001_initial
-- Creates core tables for CreditCheck Dashboard

BEGIN;

-- ─── Enums ──────────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('admin', 'viewer');
CREATE TYPE lead_product AS ENUM ('creditcheck', 'ibancheck');

-- ─── Users ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT        UNIQUE NOT NULL,
  role        user_role   NOT NULL DEFAULT 'viewer',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Leads ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS leads (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name  TEXT        NOT NULL,
  contact_name  TEXT        NOT NULL,
  contact_email TEXT        NOT NULL,
  product       lead_product NOT NULL,
  stage         TEXT        NOT NULL,
  source        TEXT        NOT NULL,
  score         INTEGER     NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Activity log ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS activity_log (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id    UUID        NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES users(id),
  action     TEXT        NOT NULL,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX idx_leads_product   ON leads(product);
CREATE INDEX idx_leads_stage     ON leads(stage);
CREATE INDEX idx_leads_created   ON leads(created_at DESC);
CREATE INDEX idx_activity_lead   ON activity_log(lead_id);
CREATE INDEX idx_activity_user   ON activity_log(user_id);

COMMIT;
