-- ============================================================
-- Platform admin / SaaS control-centre tables.
-- Internal operator console only. Idempotent + safe to re-run.
-- ============================================================

-- ── Platform feature flags ────────────────────────────────────────────────
-- Server-readable global feature flags. Distinct from the legacy
-- single-toggle `feature_flags` table: adds workspace allow-list + plan gate
-- so platform admins can target rollouts.
CREATE TABLE IF NOT EXISTS platform_feature_flags (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key                 TEXT UNIQUE NOT NULL,
  enabled             BOOLEAN NOT NULL DEFAULT false,
  description         TEXT,
  workspace_allowlist JSONB NOT NULL DEFAULT '[]'::jsonb,
  plan_gate           TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE platform_feature_flags ENABLE ROW LEVEL SECURITY;
-- Readable by any authenticated user (flags gate UI). Writes go via the
-- service-role admin client only (no write policy => denied for anon/auth).
DROP POLICY IF EXISTS "Authenticated read platform flags" ON platform_feature_flags;
CREATE POLICY "Authenticated read platform flags" ON platform_feature_flags FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Seed sensible defaults (no-op if keys already present).
INSERT INTO platform_feature_flags (key, enabled, description) VALUES
  ('ai_copilot',        true,  'AI Copilot assistant across the app'),
  ('planning_profiles', true,  'Planning sourcing & yield analysis module'),
  ('supplier_portal',   true,  'External supplier / contractor access portal'),
  ('affiliate_area',    true,  'Affiliate programme dashboard and tracking'),
  ('calendar',          true,  'Calendar view across sections'),
  ('documents',         false, 'Document storage & management module')
ON CONFLICT (key) DO NOTHING;

-- ── Platform settings ─────────────────────────────────────────────────────
-- Single-row-per-key store for platform-wide configuration.
CREATE TABLE IF NOT EXISTS platform_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
-- No public/auth policies => reads & writes only through service-role admin client.

INSERT INTO platform_settings (key, value) VALUES
  ('general', '{"platform_name":"Propvora","support_email":"support@propvora.com","trial_length_days":14}'::jsonb)
ON CONFLICT (key) DO NOTHING;
