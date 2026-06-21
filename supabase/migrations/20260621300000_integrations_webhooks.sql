-- Migration: workspace_integrations, webhook_endpoints, webhook_deliveries
-- Adds the outbound integration connection store and webhook management tables.
-- All tables are additive (IF NOT EXISTS) and safe to re-run.

-- ── workspace_integrations ──────────────────────────────────────────────────
-- One row per connected integration per workspace. Stores either an API key
-- (encrypted_key) or OAuth tokens (oauth_tokens JSONB).
-- V1: encrypted_key stored as plaintext opaque string. Encrypt via Vault in V2.
CREATE TABLE IF NOT EXISTS workspace_integrations (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  integration_id  TEXT        NOT NULL,           -- e.g. "xero", "stripe", "google_calendar"
  status          TEXT        NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active', 'error', 'syncing', 'disconnected')),
  encrypted_key   TEXT,                           -- API key (V1 plaintext; V2 Vault-encrypted)
  oauth_tokens    JSONB,                          -- { access_token, refresh_token, expires_at }
  last_sync_at    TIMESTAMPTZ,
  metadata        JSONB       NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, integration_id)
);

-- ── webhook_endpoints ───────────────────────────────────────────────────────
-- Outbound webhook endpoints that Propvora POSTs events to.
-- The secret is stored as-is in V1; V2 should store only the hash.
CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  url             TEXT        NOT NULL,
  secret          TEXT        NOT NULL,           -- shown once, stored here in V1
  events          TEXT[]      NOT NULL DEFAULT '{}',
  status          TEXT        NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active', 'paused', 'error')),
  last_delivery_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── webhook_deliveries ──────────────────────────────────────────────────────
-- Delivery log: one row per POST attempt to a webhook endpoint.
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id     UUID        NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  event_type      TEXT        NOT NULL,
  payload         JSONB       NOT NULL DEFAULT '{}',
  response_code   INT,
  response_body   TEXT,
  latency_ms      INT,
  retry_count     INT         NOT NULL DEFAULT 0,
  delivered_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── updated_at trigger for workspace_integrations ───────────────────────────
CREATE OR REPLACE FUNCTION update_workspace_integrations_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_workspace_integrations_updated_at ON workspace_integrations;
CREATE TRIGGER trg_workspace_integrations_updated_at
  BEFORE UPDATE ON workspace_integrations
  FOR EACH ROW EXECUTE FUNCTION update_workspace_integrations_updated_at();

-- ── Row-Level Security ──────────────────────────────────────────────────────
ALTER TABLE workspace_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_endpoints      ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries     ENABLE ROW LEVEL SECURITY;

-- workspace_integrations: accessible to workspace members only
DROP POLICY IF EXISTS "workspace_integrations_member" ON workspace_integrations;
CREATE POLICY "workspace_integrations_member" ON workspace_integrations
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- webhook_endpoints: accessible to workspace members only
DROP POLICY IF EXISTS "webhook_endpoints_member" ON webhook_endpoints;
CREATE POLICY "webhook_endpoints_member" ON webhook_endpoints
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- webhook_deliveries: accessible when the parent endpoint belongs to the workspace
DROP POLICY IF EXISTS "webhook_deliveries_member" ON webhook_deliveries;
CREATE POLICY "webhook_deliveries_member" ON webhook_deliveries
  FOR ALL
  USING (
    endpoint_id IN (
      SELECT id FROM webhook_endpoints
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
      )
    )
  );

-- ── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_workspace_integrations_workspace
  ON workspace_integrations(workspace_id);

CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_workspace
  ON webhook_endpoints(workspace_id);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_endpoint
  ON webhook_deliveries(endpoint_id, delivered_at DESC);
