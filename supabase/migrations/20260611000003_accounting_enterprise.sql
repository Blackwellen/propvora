-- ============================================================
-- 20260611000003_accounting_enterprise.sql
-- Extended accounting tables for enterprise module
-- ============================================================

-- accounting_accounts (extended chart of accounts)
CREATE TABLE IF NOT EXISTS accounting_accounts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  code              TEXT NOT NULL,
  name              TEXT NOT NULL,
  account_type      TEXT NOT NULL CHECK (account_type IN ('Assets','Liabilities','Equity','Income','Expenses')),
  subcategory       TEXT,
  currency          TEXT NOT NULL DEFAULT 'GBP',
  opening_balance   NUMERIC(18,2) NOT NULL DEFAULT 0,
  current_balance   NUMERIC(18,2) NOT NULL DEFAULT 0,
  normal_balance    TEXT NOT NULL DEFAULT 'debit' CHECK (normal_balance IN ('debit','credit')),
  property_scope    TEXT,
  status            TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Inactive')),
  description       TEXT,
  tax_mapping       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, code)
);

-- accounting_bank_statement_lines
CREATE TABLE IF NOT EXISTS accounting_bank_statement_lines (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  import_id        UUID,
  transaction_date DATE NOT NULL,
  description      TEXT NOT NULL,
  amount           NUMERIC(18,2) NOT NULL,
  matched_status   TEXT NOT NULL DEFAULT 'unmatched' CHECK (matched_status IN ('unmatched','matched','pending_review','excluded')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- accounting_reconciliation_matches
CREATE TABLE IF NOT EXISTS accounting_reconciliation_matches (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  statement_line_id     UUID NOT NULL REFERENCES accounting_bank_statement_lines(id) ON DELETE CASCADE,
  journal_entry_id      UUID REFERENCES journal_entries(id) ON DELETE SET NULL,
  confidence_score      NUMERIC(5,4),
  matched_by            TEXT NOT NULL DEFAULT 'manual' CHECK (matched_by IN ('auto','manual','ai')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- accounting_client_accounts
CREATE TABLE IF NOT EXISTS accounting_client_accounts (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id       UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_name        TEXT NOT NULL,
  account_code       TEXT NOT NULL,
  balance            NUMERIC(18,2) NOT NULL DEFAULT 0,
  ringfenced         BOOLEAN NOT NULL DEFAULT true,
  compliance_status  TEXT NOT NULL DEFAULT 'compliant',
  health             TEXT NOT NULL DEFAULT 'Good',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- accounting_client_disbursements
CREATE TABLE IF NOT EXISTS accounting_client_disbursements (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_account_id   UUID NOT NULL REFERENCES accounting_client_accounts(id) ON DELETE CASCADE,
  payee               TEXT NOT NULL,
  amount              NUMERIC(18,2) NOT NULL,
  category            TEXT,
  disbursement_date   DATE,
  approval_status     TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending','approved','rejected','paid')),
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- accounting_mtd_connections
CREATE TABLE IF NOT EXISTS accounting_mtd_connections (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  utr_id           TEXT,
  agent_id         TEXT,
  connected_status TEXT NOT NULL DEFAULT 'disconnected',
  last_synced_at   TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- accounting_mtd_returns
CREATE TABLE IF NOT EXISTS accounting_mtd_returns (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  quarter          TEXT NOT NULL,
  period_start     DATE NOT NULL,
  period_end       DATE NOT NULL,
  income           NUMERIC(18,2) NOT NULL DEFAULT 0,
  expenses         NUMERIC(18,2) NOT NULL DEFAULT 0,
  estimated_tax    NUMERIC(18,2) NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','ready','submitted')),
  submitted_at     TIMESTAMPTZ,
  ack_reference    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- accounting_forecast_scenarios
CREATE TABLE IF NOT EXISTS accounting_forecast_scenarios (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  based_on         TEXT,
  period_months    INTEGER NOT NULL DEFAULT 12,
  currency         TEXT NOT NULL DEFAULT 'GBP',
  rounding         TEXT NOT NULL DEFAULT 'units',
  description      TEXT,
  tags             TEXT[],
  is_base          BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- accounting_report_runs
CREATE TABLE IF NOT EXISTS accounting_report_runs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  report_type      TEXT NOT NULL,
  period           TEXT,
  currency         TEXT NOT NULL DEFAULT 'GBP',
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','generating','completed','failed')),
  file_path        TEXT,
  created_by       UUID,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- accounting_audit_events
CREATE TABLE IF NOT EXISTS accounting_audit_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id   UUID,
  action      TEXT NOT NULL,
  actor_id    UUID,
  changes     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE accounting_accounts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_bank_statement_lines  ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_reconciliation_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_client_accounts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_client_disbursements  ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_mtd_connections       ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_mtd_returns           ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_forecast_scenarios    ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_report_runs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_audit_events          ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'accounting_accounts','accounting_bank_statement_lines',
    'accounting_reconciliation_matches','accounting_client_accounts',
    'accounting_client_disbursements','accounting_mtd_connections',
    'accounting_mtd_returns','accounting_forecast_scenarios',
    'accounting_report_runs','accounting_audit_events'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format(
      'CREATE POLICY "ws_member_select_%1$s" ON %1$s FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))',
      tbl
    );
    EXECUTE format(
      'CREATE POLICY "ws_member_all_%1$s" ON %1$s FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))',
      tbl
    );
  END LOOP;
END $$;

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_acct_accounts_ws      ON accounting_accounts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_acct_accounts_type    ON accounting_accounts(workspace_id, account_type);
CREATE INDEX IF NOT EXISTS idx_acct_bsl_ws           ON accounting_bank_statement_lines(workspace_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_acct_recon_ws         ON accounting_reconciliation_matches(workspace_id);
CREATE INDEX IF NOT EXISTS idx_acct_client_ws        ON accounting_client_accounts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_acct_disb_ws          ON accounting_client_disbursements(workspace_id);
CREATE INDEX IF NOT EXISTS idx_acct_mtd_ws           ON accounting_mtd_connections(workspace_id);
CREATE INDEX IF NOT EXISTS idx_acct_returns_ws       ON accounting_mtd_returns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_acct_forecast_ws      ON accounting_forecast_scenarios(workspace_id);
CREATE INDEX IF NOT EXISTS idx_acct_reports_ws       ON accounting_report_runs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_acct_audit_ws         ON accounting_audit_events(workspace_id, created_at DESC);

-- ============================================================
-- updated_at triggers
-- ============================================================

CREATE OR REPLACE FUNCTION update_accounting_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'accounting_accounts','accounting_bank_statement_lines',
    'accounting_reconciliation_matches','accounting_client_accounts',
    'accounting_client_disbursements','accounting_mtd_connections',
    'accounting_mtd_returns','accounting_forecast_scenarios',
    'accounting_report_runs'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%1$s_updated_at BEFORE UPDATE ON %1$s FOR EACH ROW EXECUTE FUNCTION update_accounting_updated_at()',
      tbl
    );
  END LOOP;
END $$;
