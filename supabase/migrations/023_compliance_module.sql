-- 023_compliance_module.sql
-- Compliance module: certificates, inspections, documents, evidence, coverage, supplier docs, reports, activity, settings

-- CERTIFICATES
CREATE TABLE IF NOT EXISTS compliance_certificates (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  property_id           uuid REFERENCES properties(id) ON DELETE SET NULL,
  unit_id               uuid REFERENCES units(id) ON DELETE SET NULL,
  certificate_type      text NOT NULL, -- 'gas_safety' | 'eicr' | 'fire_risk' | 'epc' | 'legionella' | 'pat' | 'asbestos' | 'lift' | 'insurance' | 'loler' | 'faec' | 'desi' | 'fdm' | 'other'
  reference_number      text,
  issue_date            date,
  expiry_date           date,
  supplier_id           uuid REFERENCES contacts(id) ON DELETE SET NULL,
  owner_id              uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status                text NOT NULL DEFAULT 'valid', -- 'valid' | 'expiring_soon' | 'expired' | 'missing' | 'pending_review'
  risk_level            text NOT NULL DEFAULT 'low', -- 'low' | 'medium' | 'high' | 'critical'
  notes                 text,
  reminder_enabled      boolean NOT NULL DEFAULT true,
  archived_at           timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  created_by            uuid REFERENCES auth.users(id),
  updated_by            uuid REFERENCES auth.users(id)
);

-- INSPECTIONS
CREATE TABLE IF NOT EXISTS compliance_inspections (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  property_id           uuid REFERENCES properties(id) ON DELETE SET NULL,
  unit_id               uuid REFERENCES units(id) ON DELETE SET NULL,
  inspection_type       text NOT NULL, -- 'routine' | 'fire_safety' | 'water_hygiene' | 'electrical' | 'move_in_out' | 'supplier'
  scheduled_date        timestamptz,
  completed_date        timestamptz,
  inspector_name        text,
  inspector_company     text,
  inspector_id          uuid REFERENCES contacts(id) ON DELETE SET NULL,
  status                text NOT NULL DEFAULT 'upcoming', -- 'upcoming' | 'completed' | 'overdue' | 'cancelled'
  outcome               text, -- 'passed' | 'failed' | 'conditional'
  findings_count        integer NOT NULL DEFAULT 0,
  evidence_count        integer NOT NULL DEFAULT 0,
  next_action           text,
  report_url            text,
  notes                 text,
  archived_at           timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  created_by            uuid REFERENCES auth.users(id),
  updated_by            uuid REFERENCES auth.users(id)
);

-- DOCUMENTS
CREATE TABLE IF NOT EXISTS compliance_documents (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  property_id           uuid REFERENCES properties(id) ON DELETE SET NULL,
  unit_id               uuid REFERENCES units(id) ON DELETE SET NULL,
  document_name         text NOT NULL,
  document_type         text NOT NULL, -- 'certificate' | 'report' | 'assessment' | 'register' | 'folder' | 'insurance' | 'manual' | 'other'
  file_url              text,
  file_size_bytes       bigint,
  file_mime_type        text,
  category              text,
  issuer                text,
  issue_date            date,
  expiry_date           date,
  owner_id              uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  verification_status   text NOT NULL DEFAULT 'pending', -- 'verified' | 'pending_review' | 'rejected'
  linked_certificate_id uuid REFERENCES compliance_certificates(id) ON DELETE SET NULL,
  linked_inspection_id  uuid REFERENCES compliance_inspections(id) ON DELETE SET NULL,
  version               text NOT NULL DEFAULT '1.0',
  archived_at           timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  created_by            uuid REFERENCES auth.users(id),
  updated_by            uuid REFERENCES auth.users(id)
);

-- EVIDENCE
CREATE TABLE IF NOT EXISTS compliance_evidence (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  property_id           uuid REFERENCES properties(id) ON DELETE SET NULL,
  evidence_name         text NOT NULL,
  evidence_type         text NOT NULL, -- 'photo' | 'certificate' | 'report' | 'form' | 'inspection_photo' | 'other'
  file_url              text,
  file_size_bytes       bigint,
  file_mime_type        text,
  source                text, -- 'mobile_app' | 'supplier_portal' | 'doc_upload' | 'web_app'
  uploaded_by_name      text,
  related_record_type   text, -- 'inspection' | 'certificate' | 'document' | 'action'
  related_record_id     uuid,
  related_record_label  text,
  verification_status   text NOT NULL DEFAULT 'pending', -- 'verified' | 'pending' | 'rejected'
  verified_by           uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at           timestamptz,
  notes                 text,
  archived_at           timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  created_by            uuid REFERENCES auth.users(id)
);

-- COVERAGE MATRIX
CREATE TABLE IF NOT EXISTS compliance_coverage_matrix (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  property_id           uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  requirement_type      text NOT NULL, -- 'gas_safety' | 'eicr' | 'fire_risk' | 'epc' | 'legionella' | 'pat' | 'asbestos' | 'lift' | 'building_insurance' | 'licences'
  status                text NOT NULL DEFAULT 'missing', -- 'compliant' | 'warning' | 'missing' | 'overdue'
  coverage_pct          integer NOT NULL DEFAULT 0,
  last_checked_at       timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- SUPPLIER DOCUMENTS
CREATE TABLE IF NOT EXISTS compliance_supplier_documents (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  supplier_id           uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  document_type         text NOT NULL, -- 'insurance' | 'gas_safe' | 'niceic' | 'public_liability' | 'employers_liability' | 'other'
  document_reference    text,
  status                text NOT NULL DEFAULT 'pending', -- 'valid' | 'expiring_soon' | 'expired' | 'pending' | 'requested'
  issue_date            date,
  expiry_date           date,
  file_url              text,
  requested_at          timestamptz,
  requested_by          uuid REFERENCES auth.users(id),
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- REPORTS
CREATE TABLE IF NOT EXISTS compliance_reports (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  report_type           text NOT NULL, -- 'overview' | 'expiry_forecast' | 'fire_safety' | 'supplier_compliance' | 'audit_trail' | 'property_pack'
  report_name           text NOT NULL,
  frequency             text, -- 'monthly' | 'weekly' | 'quarterly' | 'on_demand'
  last_run_at           timestamptz,
  next_run_at           timestamptz,
  recipients            text[], -- array of email addresses
  status                text NOT NULL DEFAULT 'active', -- 'active' | 'paused' | 'draft'
  generated_url         text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  created_by            uuid REFERENCES auth.users(id)
);

-- ACTIVITY / AUDIT LOG
CREATE TABLE IF NOT EXISTS compliance_activity (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  actor_id              uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name            text,
  actor_role            text,
  event_type            text NOT NULL,
  event_label           text NOT NULL,
  linked_record_type    text,
  linked_record_id      uuid,
  linked_record_label   text,
  source                text, -- 'web_app' | 'mobile_app' | 'system' | 'supplier_portal'
  ip_address            text,
  device_info           text,
  severity              text NOT NULL DEFAULT 'low', -- 'low' | 'medium' | 'high' | 'critical'
  change_details        text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- SETTINGS
CREATE TABLE IF NOT EXISTS compliance_settings (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE UNIQUE,
  first_reminder_days   integer NOT NULL DEFAULT 60,
  second_reminder_days  integer NOT NULL DEFAULT 30,
  final_reminder_days   integer NOT NULL DEFAULT 7,
  escalate_to_owner     boolean NOT NULL DEFAULT true,
  escalate_to_secondary boolean NOT NULL DEFAULT true,
  overdue_escalation    text NOT NULL DEFAULT 'every_7_days',
  risk_thresholds       jsonb NOT NULL DEFAULT '{"low": {"min": 0, "max": 39}, "medium": {"min": 40, "max": 69}, "high": {"min": 70, "max": 100}}'::jsonb,
  compliance_categories jsonb NOT NULL DEFAULT '[]'::jsonb,
  inspection_frequencies jsonb NOT NULL DEFAULT '[]'::jsonb,
  notification_channels jsonb NOT NULL DEFAULT '{"email": true, "in_app": true, "sms": false, "escalation": true}'::jsonb,
  automation_settings   jsonb NOT NULL DEFAULT '{"auto_assign": true, "auto_renew": true, "auto_escalate": true, "auto_close": false}'::jsonb,
  supplier_requirements jsonb NOT NULL DEFAULT '{}'::jsonb,
  evidence_retention_years integer NOT NULL DEFAULT 7,
  inspection_retention_years integer NOT NULL DEFAULT 5,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- REMINDERS
CREATE TABLE IF NOT EXISTS compliance_reminders (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  certificate_id        uuid REFERENCES compliance_certificates(id) ON DELETE CASCADE,
  reminder_type         text NOT NULL DEFAULT 'expiry',
  scheduled_at          timestamptz NOT NULL,
  sent_at               timestamptz,
  status                text NOT NULL DEFAULT 'pending', -- 'pending' | 'sent' | 'failed' | 'cancelled'
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS compliance_certificates_workspace_idx ON compliance_certificates(workspace_id);
CREATE INDEX IF NOT EXISTS compliance_certificates_property_idx ON compliance_certificates(property_id);
CREATE INDEX IF NOT EXISTS compliance_certificates_status_idx ON compliance_certificates(status);
CREATE INDEX IF NOT EXISTS compliance_certificates_expiry_idx ON compliance_certificates(expiry_date);
CREATE INDEX IF NOT EXISTS compliance_certificates_risk_idx ON compliance_certificates(risk_level);

CREATE INDEX IF NOT EXISTS compliance_inspections_workspace_idx ON compliance_inspections(workspace_id);
CREATE INDEX IF NOT EXISTS compliance_inspections_property_idx ON compliance_inspections(property_id);
CREATE INDEX IF NOT EXISTS compliance_inspections_status_idx ON compliance_inspections(status);
CREATE INDEX IF NOT EXISTS compliance_inspections_scheduled_idx ON compliance_inspections(scheduled_date);

CREATE INDEX IF NOT EXISTS compliance_documents_workspace_idx ON compliance_documents(workspace_id);
CREATE INDEX IF NOT EXISTS compliance_documents_property_idx ON compliance_documents(property_id);
CREATE INDEX IF NOT EXISTS compliance_documents_type_idx ON compliance_documents(document_type);

CREATE INDEX IF NOT EXISTS compliance_evidence_workspace_idx ON compliance_evidence(workspace_id);
CREATE INDEX IF NOT EXISTS compliance_evidence_property_idx ON compliance_evidence(property_id);
CREATE INDEX IF NOT EXISTS compliance_evidence_status_idx ON compliance_evidence(verification_status);

CREATE INDEX IF NOT EXISTS compliance_coverage_workspace_idx ON compliance_coverage_matrix(workspace_id);
CREATE INDEX IF NOT EXISTS compliance_coverage_property_idx ON compliance_coverage_matrix(property_id);

CREATE INDEX IF NOT EXISTS compliance_supplier_docs_workspace_idx ON compliance_supplier_documents(workspace_id);
CREATE INDEX IF NOT EXISTS compliance_supplier_docs_supplier_idx ON compliance_supplier_documents(supplier_id);

CREATE INDEX IF NOT EXISTS compliance_activity_workspace_idx ON compliance_activity(workspace_id);
CREATE INDEX IF NOT EXISTS compliance_activity_created_idx ON compliance_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS compliance_activity_severity_idx ON compliance_activity(severity);

-- RLS
ALTER TABLE compliance_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_coverage_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_supplier_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reminders ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'compliance_certificates','compliance_inspections','compliance_documents',
    'compliance_evidence','compliance_coverage_matrix','compliance_supplier_documents',
    'compliance_reports','compliance_activity','compliance_settings','compliance_reminders'
  ]
  LOOP
    EXECUTE format('
      CREATE POLICY "%s_workspace_isolation" ON %I
        USING (workspace_id IN (
          SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
        ))', tbl, tbl);
  END LOOP;
END $$;
