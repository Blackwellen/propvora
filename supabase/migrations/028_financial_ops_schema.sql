-- ============================================================
-- 028_financial_ops_schema.sql
-- Financial operations module: client accounts, disbursements,
-- disbursement line items, bank transactions, PPM schedules,
-- job dispatch invites, and supplier compliance.
-- ============================================================

-- client_accounts
CREATE TABLE IF NOT EXISTS client_accounts (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id         UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id           UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  account_name         TEXT NOT NULL,
  bank_account_name    TEXT,
  bank_sort_code       TEXT,
  bank_account_number  TEXT,
  current_balance      NUMERIC(14,2) NOT NULL DEFAULT 0,
  trust_balance        NUMERIC(14,2) NOT NULL DEFAULT 0,
  management_fee_pct   NUMERIC(5,2) NOT NULL DEFAULT 0,
  auto_disburse        BOOLEAN NOT NULL DEFAULT false,
  disburse_day         INTEGER NOT NULL DEFAULT 25,
  is_active            BOOLEAN NOT NULL DEFAULT true,
  created_at           TIMESTAMPTZ DEFAULT now()
);

-- client_disbursements
CREATE TABLE IF NOT EXISTS client_disbursements (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id             UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_account_id        UUID NOT NULL REFERENCES client_accounts(id) ON DELETE CASCADE,
  period_start             DATE NOT NULL,
  period_end               DATE NOT NULL,
  gross_rent               NUMERIC(14,2) NOT NULL DEFAULT 0,
  management_fee           NUMERIC(14,2) NOT NULL DEFAULT 0,
  management_fee_pct       NUMERIC(5,2) NOT NULL DEFAULT 0,
  maintenance_deductions   NUMERIC(14,2) NOT NULL DEFAULT 0,
  other_deductions         NUMERIC(14,2) NOT NULL DEFAULT 0,
  net_payable              NUMERIC(14,2) NOT NULL DEFAULT 0,
  status                   TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','paid','cancelled')),
  paid_date                DATE,
  statement_pdf_path       TEXT,
  notes                    TEXT,
  created_by               UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at               TIMESTAMPTZ DEFAULT now()
);

-- disbursement_line_items
CREATE TABLE IF NOT EXISTS disbursement_line_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  disbursement_id  UUID NOT NULL REFERENCES client_disbursements(id) ON DELETE CASCADE,
  description      TEXT NOT NULL,
  property_id      UUID REFERENCES properties(id) ON DELETE SET NULL,
  unit_id          UUID,
  line_type        TEXT NOT NULL CHECK (line_type IN ('income','fee','deduction','credit')),
  amount           NUMERIC(14,2) NOT NULL,
  reference        TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- bank_transactions
CREATE TABLE IF NOT EXISTS bank_transactions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id         UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  bank_connection_id   UUID,
  transaction_id       TEXT UNIQUE,
  account_id           TEXT,
  amount               NUMERIC(14,2) NOT NULL,
  currency             TEXT NOT NULL DEFAULT 'GBP',
  description          TEXT,
  transaction_date     DATE NOT NULL,
  merchant_name        TEXT,
  category             TEXT,
  matched_income_id    UUID,
  matched_expense_id   UUID,
  match_confidence     NUMERIC(3,2),
  match_status         TEXT NOT NULL DEFAULT 'unmatched' CHECK (match_status IN ('unmatched','auto_matched','manually_matched','excluded')),
  created_at           TIMESTAMPTZ DEFAULT now()
);

-- ppm_schedules
CREATE TABLE IF NOT EXISTS ppm_schedules (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id                 UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  property_id                  UUID REFERENCES properties(id) ON DELETE SET NULL,
  unit_id                      UUID,
  title                        TEXT NOT NULL,
  description                  TEXT,
  category                     TEXT NOT NULL,
  frequency_type               TEXT NOT NULL CHECK (frequency_type IN ('weekly','monthly','quarterly','biannual','annual','custom')),
  frequency_value              INTEGER NOT NULL DEFAULT 1,
  last_completed_date          DATE,
  next_due_date                DATE NOT NULL,
  assigned_supplier_id         UUID REFERENCES contacts(id) ON DELETE SET NULL,
  estimated_cost               NUMERIC(10,2),
  auto_create_job              BOOLEAN NOT NULL DEFAULT true,
  days_before_due_to_create    INTEGER NOT NULL DEFAULT 14,
  is_active                    BOOLEAN NOT NULL DEFAULT true,
  created_by                   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at                   TIMESTAMPTZ DEFAULT now(),
  updated_at                   TIMESTAMPTZ DEFAULT now()
);

-- job_dispatch_invites
CREATE TABLE IF NOT EXISTS job_dispatch_invites (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  job_id         UUID NOT NULL,
  supplier_id    UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  status         TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited','accepted','declined','expired','awarded')),
  invited_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at   TIMESTAMPTZ,
  quoted_amount  NUMERIC(10,2),
  quote_notes    TEXT
);

-- supplier_compliance
CREATE TABLE IF NOT EXISTS supplier_compliance (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  supplier_id      UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  compliance_type  TEXT NOT NULL CHECK (compliance_type IN ('gas_safe','niceic','napit','public_liability','employers_liability','dbs_check','chas','constructionline','other')),
  certificate_number TEXT,
  issuing_body     TEXT,
  expiry_date      DATE,
  document_path    TEXT,
  verified         BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE client_accounts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_disbursements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE disbursement_line_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppm_schedules             ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_dispatch_invites      ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_compliance       ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'client_accounts','client_disbursements','disbursement_line_items',
    'bank_transactions','ppm_schedules','job_dispatch_invites','supplier_compliance'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format(
      'CREATE POLICY "workspace members read %1$s" ON %1$s FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))',
      tbl
    );
    EXECUTE format(
      'CREATE POLICY "workspace members manage %1$s" ON %1$s FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))',
      tbl
    );
  END LOOP;
END $$;

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY['ppm_schedules'];
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

CREATE INDEX IF NOT EXISTS idx_client_accounts_workspace     ON client_accounts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_client_accounts_contact       ON client_accounts(contact_id);
CREATE INDEX IF NOT EXISTS idx_client_accounts_active        ON client_accounts(workspace_id, is_active);

CREATE INDEX IF NOT EXISTS idx_client_disb_workspace         ON client_disbursements(workspace_id);
CREATE INDEX IF NOT EXISTS idx_client_disb_account           ON client_disbursements(client_account_id);
CREATE INDEX IF NOT EXISTS idx_client_disb_status            ON client_disbursements(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_client_disb_period            ON client_disbursements(workspace_id, period_start DESC);

CREATE INDEX IF NOT EXISTS idx_disb_lines_workspace          ON disbursement_line_items(workspace_id);
CREATE INDEX IF NOT EXISTS idx_disb_lines_disbursement       ON disbursement_line_items(disbursement_id);
CREATE INDEX IF NOT EXISTS idx_disb_lines_property           ON disbursement_line_items(property_id);

CREATE INDEX IF NOT EXISTS idx_bank_tx_workspace             ON bank_transactions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_bank_tx_date                  ON bank_transactions(workspace_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_bank_tx_match_status          ON bank_transactions(workspace_id, match_status);
CREATE INDEX IF NOT EXISTS idx_bank_tx_connection            ON bank_transactions(bank_connection_id);

CREATE INDEX IF NOT EXISTS idx_ppm_schedules_workspace       ON ppm_schedules(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ppm_schedules_property        ON ppm_schedules(property_id);
CREATE INDEX IF NOT EXISTS idx_ppm_schedules_due             ON ppm_schedules(workspace_id, next_due_date);
CREATE INDEX IF NOT EXISTS idx_ppm_schedules_active          ON ppm_schedules(workspace_id, is_active);

CREATE INDEX IF NOT EXISTS idx_job_dispatch_workspace        ON job_dispatch_invites(workspace_id);
CREATE INDEX IF NOT EXISTS idx_job_dispatch_job              ON job_dispatch_invites(job_id);
CREATE INDEX IF NOT EXISTS idx_job_dispatch_supplier         ON job_dispatch_invites(supplier_id);
CREATE INDEX IF NOT EXISTS idx_job_dispatch_status           ON job_dispatch_invites(workspace_id, status);

CREATE INDEX IF NOT EXISTS idx_supplier_compliance_workspace ON supplier_compliance(workspace_id);
CREATE INDEX IF NOT EXISTS idx_supplier_compliance_supplier  ON supplier_compliance(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_compliance_type      ON supplier_compliance(workspace_id, compliance_type);
CREATE INDEX IF NOT EXISTS idx_supplier_compliance_expiry    ON supplier_compliance(workspace_id, expiry_date);
