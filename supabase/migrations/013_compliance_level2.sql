-- ============================================================
-- 013_compliance_level2.sql
-- Compliance module — additive only, zero modifications to existing tables
-- ============================================================

-- ============================================================
-- 1. compliance_certificates
-- ============================================================
CREATE TABLE IF NOT EXISTS compliance_certificates (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id         uuid        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  certificate_type     text        NOT NULL,
  property_id          uuid,
  unit_id              uuid,
  tenancy_id           uuid,
  supplier_contact_id  uuid,
  issuer_contact_id    uuid,
  issuer_name          text,
  status               text        NOT NULL DEFAULT 'pending',
  issue_date           date,
  expiry_date          date,
  reference_number     text,
  document_id          uuid,
  risk_level           text        NOT NULL DEFAULT 'needs_data',
  renewal_task_id      uuid,
  notes                text,
  metadata             jsonb                DEFAULT '{}',
  created_by           uuid,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  archived_at          timestamptz
);

-- ============================================================
-- 2. compliance_inspections
-- ============================================================
CREATE TABLE IF NOT EXISTS compliance_inspections (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id         uuid        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  inspection_type      text        NOT NULL,
  property_id          uuid,
  unit_id              uuid,
  tenancy_id           uuid,
  supplier_contact_id  uuid,
  inspector_contact_id uuid,
  inspector_name       text,
  status               text        NOT NULL DEFAULT 'draft',
  scheduled_at         timestamptz,
  completed_at         timestamptz,
  outcome              text,
  risk_level           text        NOT NULL DEFAULT 'needs_data',
  follow_up_date       date,
  notes                text,
  metadata             jsonb                DEFAULT '{}',
  created_by           uuid,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  archived_at          timestamptz
);

-- ============================================================
-- 3. inspection_findings
-- ============================================================
CREATE TABLE IF NOT EXISTS inspection_findings (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     uuid        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  inspection_id    uuid        NOT NULL REFERENCES compliance_inspections(id) ON DELETE CASCADE,
  title            text        NOT NULL,
  description      text,
  severity         text        NOT NULL DEFAULT 'medium',
  status           text        NOT NULL DEFAULT 'open',
  required_action  text,
  linked_task_id   uuid,
  linked_job_id    uuid,
  metadata         jsonb                DEFAULT '{}',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. compliance_documents
-- ============================================================
CREATE TABLE IF NOT EXISTS compliance_documents (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id         uuid        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  document_type        text        NOT NULL DEFAULT 'other',
  property_id          uuid,
  unit_id              uuid,
  tenancy_id           uuid,
  contact_id           uuid,
  supplier_contact_id  uuid,
  status               text        NOT NULL DEFAULT 'uploaded',
  issue_date           date,
  expiry_date          date,
  issuer               text,
  reference_number     text,
  document_id          uuid,
  verified_by          uuid,
  verified_at          timestamptz,
  notes                text,
  metadata             jsonb                DEFAULT '{}',
  created_by           uuid,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  archived_at          timestamptz
);

-- ============================================================
-- 5. compliance_risks
-- ============================================================
CREATE TABLE IF NOT EXISTS compliance_risks (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        uuid        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title               text        NOT NULL,
  risk_type           text        NOT NULL,
  linked_record_type  text,
  linked_record_id    uuid,
  severity            text        NOT NULL DEFAULT 'medium',
  status              text        NOT NULL DEFAULT 'open',
  due_date            date,
  owner_id            uuid,
  next_action         text,
  accepted            boolean              DEFAULT false,
  accepted_note       text,
  metadata            jsonb                DEFAULT '{}',
  created_by          uuid,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 6. compliance_renewal_reminders
-- ============================================================
CREATE TABLE IF NOT EXISTS compliance_renewal_reminders (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        uuid        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  linked_record_type  text        NOT NULL,
  linked_record_id    uuid        NOT NULL,
  reminder_type       text        NOT NULL DEFAULT 'in_app',
  remind_at           timestamptz NOT NULL,
  status              text        NOT NULL DEFAULT 'pending',
  sent_at             timestamptz,
  metadata            jsonb                DEFAULT '{}',
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 7. compliance_templates
-- ============================================================
CREATE TABLE IF NOT EXISTS compliance_templates (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      uuid        REFERENCES workspaces(id) ON DELETE CASCADE,
  name              text        NOT NULL,
  operation_profile text,
  description       text,
  items             jsonb       NOT NULL DEFAULT '[]',
  is_default        boolean              DEFAULT false,
  metadata          jsonb                DEFAULT '{}',
  created_by        uuid,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- updated_at triggers (DO loop — tables that carry updated_at)
-- ============================================================
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'compliance_certificates',
    'compliance_inspections',
    'inspection_findings',
    'compliance_documents',
    'compliance_risks',
    'compliance_templates'
  ]
  LOOP
    EXECUTE format(
      'CREATE OR REPLACE TRIGGER trg_%I_updated_at
         BEFORE UPDATE ON %I
         FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);',
      tbl, tbl
    );
  END LOOP;
END;
$$;

-- ============================================================
-- Indexes (22 total)
-- ============================================================

-- compliance_certificates
CREATE INDEX IF NOT EXISTS idx_comp_certs_workspace_id
  ON compliance_certificates (workspace_id);

CREATE INDEX IF NOT EXISTS idx_comp_certs_workspace_status
  ON compliance_certificates (workspace_id, status);

CREATE INDEX IF NOT EXISTS idx_comp_certs_workspace_type
  ON compliance_certificates (workspace_id, certificate_type);

CREATE INDEX IF NOT EXISTS idx_comp_certs_expiry_date
  ON compliance_certificates (workspace_id, expiry_date)
  WHERE expiry_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_comp_certs_property_id
  ON compliance_certificates (property_id)
  WHERE property_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_comp_certs_tenancy_id
  ON compliance_certificates (tenancy_id)
  WHERE tenancy_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_comp_certs_risk_level
  ON compliance_certificates (workspace_id, risk_level);

CREATE INDEX IF NOT EXISTS idx_comp_certs_archived_at
  ON compliance_certificates (archived_at)
  WHERE archived_at IS NULL;

-- compliance_inspections
CREATE INDEX IF NOT EXISTS idx_comp_insp_workspace_id
  ON compliance_inspections (workspace_id);

CREATE INDEX IF NOT EXISTS idx_comp_insp_workspace_status
  ON compliance_inspections (workspace_id, status);

CREATE INDEX IF NOT EXISTS idx_comp_insp_workspace_type
  ON compliance_inspections (workspace_id, inspection_type);

CREATE INDEX IF NOT EXISTS idx_comp_insp_scheduled_at
  ON compliance_inspections (workspace_id, scheduled_at)
  WHERE scheduled_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_comp_insp_property_id
  ON compliance_inspections (property_id)
  WHERE property_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_comp_insp_archived_at
  ON compliance_inspections (archived_at)
  WHERE archived_at IS NULL;

-- inspection_findings
CREATE INDEX IF NOT EXISTS idx_insp_findings_inspection_id
  ON inspection_findings (inspection_id);

CREATE INDEX IF NOT EXISTS idx_insp_findings_workspace_status
  ON inspection_findings (workspace_id, status);

-- compliance_documents
CREATE INDEX IF NOT EXISTS idx_comp_docs_workspace_id
  ON compliance_documents (workspace_id);

CREATE INDEX IF NOT EXISTS idx_comp_docs_workspace_status
  ON compliance_documents (workspace_id, status);

CREATE INDEX IF NOT EXISTS idx_comp_docs_expiry_date
  ON compliance_documents (workspace_id, expiry_date)
  WHERE expiry_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_comp_docs_archived_at
  ON compliance_documents (archived_at)
  WHERE archived_at IS NULL;

-- compliance_risks
CREATE INDEX IF NOT EXISTS idx_comp_risks_workspace_status
  ON compliance_risks (workspace_id, status);

-- compliance_renewal_reminders
CREATE INDEX IF NOT EXISTS idx_comp_reminders_remind_at
  ON compliance_renewal_reminders (remind_at)
  WHERE status = 'pending';

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE compliance_certificates     ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_inspections      ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_findings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_documents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_risks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_renewal_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_templates        ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS policies
-- Workspace members SELECT; owners/admins/managers INSERT/UPDATE/DELETE.
-- Archived records filtered from SELECT where archived_at column exists.
-- ============================================================

-- ---------------------------------------------------------------
-- compliance_certificates
-- ---------------------------------------------------------------
CREATE POLICY "comp_certs_select"
  ON compliance_certificates FOR SELECT
  USING (
    archived_at IS NULL
    AND EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = compliance_certificates.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "comp_certs_select_archived"
  ON compliance_certificates FOR SELECT
  USING (
    archived_at IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = compliance_certificates.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "comp_certs_insert"
  ON compliance_certificates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = compliance_certificates.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "comp_certs_update"
  ON compliance_certificates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = compliance_certificates.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "comp_certs_delete"
  ON compliance_certificates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = compliance_certificates.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
    )
  );

-- ---------------------------------------------------------------
-- compliance_inspections
-- ---------------------------------------------------------------
CREATE POLICY "comp_insp_select"
  ON compliance_inspections FOR SELECT
  USING (
    archived_at IS NULL
    AND EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = compliance_inspections.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "comp_insp_select_archived"
  ON compliance_inspections FOR SELECT
  USING (
    archived_at IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = compliance_inspections.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "comp_insp_insert"
  ON compliance_inspections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = compliance_inspections.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "comp_insp_update"
  ON compliance_inspections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = compliance_inspections.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "comp_insp_delete"
  ON compliance_inspections FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = compliance_inspections.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
    )
  );

-- ---------------------------------------------------------------
-- inspection_findings
-- ---------------------------------------------------------------
CREATE POLICY "insp_findings_select"
  ON inspection_findings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = inspection_findings.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "insp_findings_insert"
  ON inspection_findings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = inspection_findings.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "insp_findings_update"
  ON inspection_findings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = inspection_findings.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "insp_findings_delete"
  ON inspection_findings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = inspection_findings.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
    )
  );

-- ---------------------------------------------------------------
-- compliance_documents
-- ---------------------------------------------------------------
CREATE POLICY "comp_docs_select"
  ON compliance_documents FOR SELECT
  USING (
    archived_at IS NULL
    AND EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = compliance_documents.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "comp_docs_select_archived"
  ON compliance_documents FOR SELECT
  USING (
    archived_at IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = compliance_documents.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "comp_docs_insert"
  ON compliance_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = compliance_documents.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "comp_docs_update"
  ON compliance_documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = compliance_documents.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "comp_docs_delete"
  ON compliance_documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = compliance_documents.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
    )
  );

-- ---------------------------------------------------------------
-- compliance_risks
-- ---------------------------------------------------------------
CREATE POLICY "comp_risks_select"
  ON compliance_risks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = compliance_risks.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "comp_risks_insert"
  ON compliance_risks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = compliance_risks.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "comp_risks_update"
  ON compliance_risks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = compliance_risks.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "comp_risks_delete"
  ON compliance_risks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = compliance_risks.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
    )
  );

-- ---------------------------------------------------------------
-- compliance_renewal_reminders
-- ---------------------------------------------------------------
CREATE POLICY "comp_reminders_select"
  ON compliance_renewal_reminders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = compliance_renewal_reminders.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "comp_reminders_insert"
  ON compliance_renewal_reminders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = compliance_renewal_reminders.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "comp_reminders_update"
  ON compliance_renewal_reminders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = compliance_renewal_reminders.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "comp_reminders_delete"
  ON compliance_renewal_reminders FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = compliance_renewal_reminders.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
    )
  );

-- ---------------------------------------------------------------
-- compliance_templates
-- ---------------------------------------------------------------
CREATE POLICY "comp_templates_select"
  ON compliance_templates FOR SELECT
  USING (
    -- Global default templates (workspace_id IS NULL) visible to all authenticated users
    -- Workspace templates visible to workspace members
    workspace_id IS NULL
    OR EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = compliance_templates.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "comp_templates_insert"
  ON compliance_templates FOR INSERT
  WITH CHECK (
    workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = compliance_templates.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "comp_templates_update"
  ON compliance_templates FOR UPDATE
  USING (
    workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = compliance_templates.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "comp_templates_delete"
  ON compliance_templates FOR DELETE
  USING (
    workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = compliance_templates.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
    )
  );
