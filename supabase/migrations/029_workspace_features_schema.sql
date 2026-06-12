-- ============================================================
-- 029_workspace_features_schema.sql
-- Workspace configuration module: feature flags, add-ons,
-- and third-party OAuth integrations.
-- ============================================================

-- workspace_features
CREATE TABLE IF NOT EXISTS workspace_features (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  feature_key  TEXT NOT NULL,
  enabled      BOOLEAN NOT NULL DEFAULT false,
  enabled_at   TIMESTAMPTZ,
  enabled_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  metadata     JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (workspace_id, feature_key)
);

-- workspace_addons
CREATE TABLE IF NOT EXISTS workspace_addons (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id                UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  addon_key                   TEXT NOT NULL,
  active                      BOOLEAN NOT NULL DEFAULT false,
  stripe_subscription_item_id TEXT,
  activated_at                TIMESTAMPTZ,
  deactivated_at              TIMESTAMPTZ,
  settings                    JSONB NOT NULL DEFAULT '{}',
  created_at                  TIMESTAMPTZ DEFAULT now(),
  updated_at                  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (workspace_id, addon_key)
);

-- workspace_integrations
CREATE TABLE IF NOT EXISTS workspace_integrations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL CHECK (integration_type IN ('xero','quickbooks','truelayer','gocardless','hmrc_mtd','meta_whatsapp','canopy')),
  access_token     TEXT,
  refresh_token    TEXT,
  token_expires_at TIMESTAMPTZ,
  account_id       TEXT,
  account_name     TEXT,
  is_connected     BOOLEAN NOT NULL DEFAULT false,
  last_synced_at   TIMESTAMPTZ,
  settings         JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE (workspace_id, integration_type)
);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE workspace_features     ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_addons       ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_integrations ENABLE ROW LEVEL SECURITY;

-- workspace_features: members of the workspace may read and manage
CREATE POLICY "workspace members read workspace_features"
  ON workspace_features FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "workspace members manage workspace_features"
  ON workspace_features FOR ALL
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- workspace_addons: same pattern
CREATE POLICY "workspace members read workspace_addons"
  ON workspace_addons FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "workspace members manage workspace_addons"
  ON workspace_addons FOR ALL
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- workspace_integrations: same pattern
CREATE POLICY "workspace members read workspace_integrations"
  ON workspace_integrations FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "workspace members manage workspace_integrations"
  ON workspace_integrations FOR ALL
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY['workspace_addons','workspace_integrations'];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      tbl, tbl
    );
  END LOOP;
END $$;

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_workspace_features_ws       ON workspace_features(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_features_key      ON workspace_features(workspace_id, feature_key);
CREATE INDEX IF NOT EXISTS idx_workspace_features_enabled  ON workspace_features(workspace_id, enabled);

CREATE INDEX IF NOT EXISTS idx_workspace_addons_ws         ON workspace_addons(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_addons_key        ON workspace_addons(workspace_id, addon_key);
CREATE INDEX IF NOT EXISTS idx_workspace_addons_active     ON workspace_addons(workspace_id, active);

CREATE INDEX IF NOT EXISTS idx_workspace_integrations_ws   ON workspace_integrations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_integrations_type ON workspace_integrations(workspace_id, integration_type);
CREATE INDEX IF NOT EXISTS idx_workspace_integrations_conn ON workspace_integrations(workspace_id, is_connected);
