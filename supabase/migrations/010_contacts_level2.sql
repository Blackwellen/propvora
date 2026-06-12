-- ============================================================
-- Migration: 010_contacts_level2
-- Purpose:   Level 2 Contacts depth — new supporting tables only.
--            Does NOT modify existing tables.
-- ============================================================

-- ============================================================
-- organisations
-- ============================================================

CREATE TABLE IF NOT EXISTS organisations (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name             TEXT        NOT NULL,
  organisation_type TEXT       NOT NULL DEFAULT 'other',
  email            TEXT,
  phone            TEXT,
  website          TEXT,
  address_line1    TEXT,
  city             TEXT,
  postcode         TEXT,
  country          TEXT        DEFAULT 'United Kingdom',
  logo_media_id    UUID,
  created_by       UUID        REFERENCES profiles(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read organisations"
  ON organisations FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Managers insert organisations"
  ON organisations FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'member')
  ));

CREATE POLICY "Managers update organisations"
  ON organisations FOR UPDATE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'member')
  ))
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'member')
  ));

CREATE POLICY "Admins delete organisations"
  ON organisations FOR DELETE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE INDEX IF NOT EXISTS idx_organisations_workspace
  ON organisations(workspace_id);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON organisations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- contact_links
-- ============================================================

CREATE TABLE IF NOT EXISTS contact_links (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id       UUID        NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  linked_type      TEXT        NOT NULL,
  -- 'property' | 'unit' | 'tenancy' | 'task' | 'job' | 'planning_set'
  -- | 'offer' | 'invoice' | 'document' | 'conversation'
  linked_id        UUID        NOT NULL,
  relationship_type TEXT,
  -- 'primary' | 'secondary' | 'guarantor' | 'decision_maker' | 'billing' | 'emergency'
  created_by       UUID        REFERENCES profiles(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata         JSONB       DEFAULT '{}'::jsonb
);

ALTER TABLE contact_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read contact_links"
  ON contact_links FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Managers insert contact_links"
  ON contact_links FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'member')
  ));

CREATE POLICY "Managers update contact_links"
  ON contact_links FOR UPDATE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'member')
  ))
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'member')
  ));

CREATE POLICY "Admins delete contact_links"
  ON contact_links FOR DELETE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE INDEX IF NOT EXISTS idx_contact_links_contact
  ON contact_links(contact_id);

CREATE INDEX IF NOT EXISTS idx_contact_links_linked
  ON contact_links(linked_type, linked_id);

-- ============================================================
-- supplier_profiles
-- ============================================================

CREATE TABLE IF NOT EXISTS supplier_profiles (
  id                    UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          UUID      NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id            UUID      NOT NULL REFERENCES contacts(id) ON DELETE CASCADE UNIQUE,
  service_categories    TEXT[]    NOT NULL DEFAULT '{}',
  coverage_postcodes    TEXT[]    NOT NULL DEFAULT '{}',
  coverage_radius       NUMERIC,
  hourly_rate           NUMERIC,
  callout_fee           NUMERIC,
  emergency_available   BOOLEAN   NOT NULL DEFAULT false,
  preferred_supplier    BOOLEAN   NOT NULL DEFAULT false,
  backup_supplier       BOOLEAN   NOT NULL DEFAULT false,
  insurance_expiry      DATE,
  compliance_status     TEXT      NOT NULL DEFAULT 'unknown',
  -- 'valid' | 'expiring_soon' | 'expired' | 'unknown'
  average_response_time NUMERIC,                 -- hours
  jobs_completed        INTEGER   NOT NULL DEFAULT 0,
  internal_rating       SMALLINT  CHECK (internal_rating BETWEEN 1 AND 5),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata              JSONB     DEFAULT '{}'::jsonb
);

ALTER TABLE supplier_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read supplier_profiles"
  ON supplier_profiles FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Managers insert supplier_profiles"
  ON supplier_profiles FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'member')
  ));

CREATE POLICY "Managers update supplier_profiles"
  ON supplier_profiles FOR UPDATE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'member')
  ))
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'member')
  ));

CREATE POLICY "Admins delete supplier_profiles"
  ON supplier_profiles FOR DELETE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE INDEX IF NOT EXISTS idx_supplier_profiles_contact
  ON supplier_profiles(contact_id);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON supplier_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- contact_notes
-- ============================================================

CREATE TABLE IF NOT EXISTS contact_notes (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id   UUID        NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  content      TEXT        NOT NULL,
  created_by   UUID        REFERENCES profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE contact_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read contact_notes"
  ON contact_notes FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Members insert contact_notes"
  ON contact_notes FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'member')
  ));

CREATE POLICY "Authors update contact_notes"
  ON contact_notes FOR UPDATE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'member')
  ))
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'member')
  ));

CREATE POLICY "Admins delete contact_notes"
  ON contact_notes FOR DELETE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON contact_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- contact_portal_access
-- ============================================================

CREATE TABLE IF NOT EXISTS contact_portal_access (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id   UUID        NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  access_type  TEXT        NOT NULL DEFAULT 'supplier',
  -- 'supplier' | 'applicant' | 'landlord' | 'tenant' | 'affiliate'
  linked_type  TEXT,
  -- 'job' | 'planning_set' | 'property'
  linked_id    UUID,
  status       TEXT        NOT NULL DEFAULT 'created',
  -- 'not_created' | 'created' | 'email_sent' | 'opened' | 'active'
  -- | 'expired' | 'revoked' | 'completed'
  purpose      TEXT,
  expires_at   TIMESTAMPTZ,
  last_opened_at TIMESTAMPTZ,
  token_hash   TEXT,         -- hashed token, never store plain
  email_sent_at TIMESTAMPTZ,
  revoked_at   TIMESTAMPTZ,
  revoked_by   UUID        REFERENCES profiles(id),
  created_by   UUID        REFERENCES profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata     JSONB       DEFAULT '{}'::jsonb
);

ALTER TABLE contact_portal_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read contact_portal_access"
  ON contact_portal_access FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Managers insert contact_portal_access"
  ON contact_portal_access FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'member')
  ));

CREATE POLICY "Managers update contact_portal_access"
  ON contact_portal_access FOR UPDATE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'member')
  ))
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'member')
  ));

CREATE POLICY "Admins delete contact_portal_access"
  ON contact_portal_access FOR DELETE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE INDEX IF NOT EXISTS idx_contact_portal_contact
  ON contact_portal_access(contact_id);

-- ============================================================
-- contact_activity
-- ============================================================

CREATE TABLE IF NOT EXISTS contact_activity (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id     UUID        NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  activity_type  TEXT        NOT NULL,
  -- 'message' | 'payment' | 'task' | 'document' | 'portal'
  -- | 'note' | 'system' | 'alert'
  title          TEXT        NOT NULL,
  description    TEXT,
  linked_type    TEXT,
  linked_id      UUID,
  performed_by   UUID        REFERENCES profiles(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata       JSONB       DEFAULT '{}'::jsonb
);

ALTER TABLE contact_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read contact_activity"
  ON contact_activity FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Managers insert contact_activity"
  ON contact_activity FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'member')
  ));

CREATE POLICY "Managers update contact_activity"
  ON contact_activity FOR UPDATE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'member')
  ))
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'member')
  ));

CREATE POLICY "Admins delete contact_activity"
  ON contact_activity FOR DELETE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE INDEX IF NOT EXISTS idx_contact_activity_contact
  ON contact_activity(contact_id, created_at DESC);
