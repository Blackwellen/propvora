-- ============================================================
-- Portals management: profile + purpose config templates
-- These are workspace-scoped config rows that drive the
-- "Grant Portal Access" wizard and the Profiles/Purposes admin
-- screens. Front-end consumes them 42P01-safe (missing -> seeded
-- defaults), so this migration is additive and optional.
-- ============================================================

-- ---- portal_profiles -------------------------------------------------
CREATE TABLE IF NOT EXISTS portal_profiles (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  key           TEXT        NOT NULL,              -- 'landlord' | 'supplier' | ...
  label         TEXT        NOT NULL,              -- 'Landlord / Owner'
  description   TEXT,
  access_type   TEXT        NOT NULL DEFAULT 'supplier',
  is_default    BOOLEAN     NOT NULL DEFAULT false,
  is_enabled    BOOLEAN     NOT NULL DEFAULT true,
  sort_order    INTEGER     NOT NULL DEFAULT 0,
  created_by    UUID        REFERENCES profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, key)
);

ALTER TABLE portal_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read portal_profiles"
  ON portal_profiles FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Managers write portal_profiles"
  ON portal_profiles FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
  ))
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
  ));

CREATE INDEX IF NOT EXISTS idx_portal_profiles_workspace
  ON portal_profiles(workspace_id);

-- ---- portal_purposes -------------------------------------------------
CREATE TABLE IF NOT EXISTS portal_purposes (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  key           TEXT        NOT NULL,              -- 'document_exchange' | ...
  label         TEXT        NOT NULL,              -- 'Document exchange'
  description   TEXT,
  default_expiry_days INTEGER NOT NULL DEFAULT 30,
  is_default    BOOLEAN     NOT NULL DEFAULT false,
  is_enabled    BOOLEAN     NOT NULL DEFAULT true,
  sort_order    INTEGER     NOT NULL DEFAULT 0,
  created_by    UUID        REFERENCES profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, key)
);

ALTER TABLE portal_purposes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read portal_purposes"
  ON portal_purposes FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Managers write portal_purposes"
  ON portal_purposes FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
  ))
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
  ));

CREATE INDEX IF NOT EXISTS idx_portal_purposes_workspace
  ON portal_purposes(workspace_id);

-- NOTE: portal_access_tokens already exists in the live DB with its own
-- lineage (token / entity_id / entity_type / revoked / permissions). The
-- grant API + usePortals read/write those live columns; no token-table
-- changes are made here.
