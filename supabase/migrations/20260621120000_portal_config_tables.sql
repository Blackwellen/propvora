-- Migration: portal_profiles and portal_purposes config tables
-- Allows workspaces to customise portal access profile and purpose templates.
-- Falls back to hardcoded DEFAULT_PORTAL_PROFILES / DEFAULT_PORTAL_PURPOSES when table empty.

-- ── Portal profiles (what type of access the portal grants) ──────────────────

CREATE TABLE IF NOT EXISTS portal_profiles (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid       NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  key         text        NOT NULL,
  label       text        NOT NULL,
  description text,
  access_type text        NOT NULL DEFAULT 'read',
  is_enabled  boolean     NOT NULL DEFAULT true,
  is_default  boolean     NOT NULL DEFAULT false,
  sort_order  int         NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, key)
);

ALTER TABLE portal_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS portal_profiles_workspace ON portal_profiles;
CREATE POLICY portal_profiles_workspace ON portal_profiles
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_portal_profiles_workspace ON portal_profiles(workspace_id);

-- ── Portal purposes (scope / intent of the portal access grant) ──────────────

CREATE TABLE IF NOT EXISTS portal_purposes (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  key             text        NOT NULL,
  label           text        NOT NULL,
  description     text,
  allowed_scopes  text[]      NOT NULL DEFAULT '{}',
  default_expiry_days int     NOT NULL DEFAULT 30,
  is_enabled      boolean     NOT NULL DEFAULT true,
  is_default      boolean     NOT NULL DEFAULT false,
  sort_order      int         NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, key)
);

ALTER TABLE portal_purposes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS portal_purposes_workspace ON portal_purposes;
CREATE POLICY portal_purposes_workspace ON portal_purposes
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_portal_purposes_workspace ON portal_purposes(workspace_id);
