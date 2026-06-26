-- ============================================================================
-- supplier_compliance — certification & compliance records for supplier
-- contacts, surfaced read-only in the external supplier portal and managed
-- by workspace owners/admins/managers in the operator UI.
--
-- The original definition shipped in 028_financial_ops_schema.sql but that
-- migration was never applied to the live project; this migration reproduces
-- the table + RLS so a fresh database matches production. Idempotent so it is
-- safe to run alongside the legacy file (IF NOT EXISTS / DROP POLICY IF EXISTS).
--
-- Portal reads go through the service-role client (createAdminClient) which
-- bypasses RLS; these policies authorise the operator-side (authenticated)
-- management surface.
-- ============================================================================

CREATE TABLE IF NOT EXISTS supplier_compliance (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id       UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  supplier_id        UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  compliance_type    TEXT NOT NULL,
  certificate_number TEXT,
  issuing_body       TEXT,
  expiry_date        DATE,
  document_path      TEXT,
  verified           BOOLEAN NOT NULL DEFAULT false,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Permitted compliance types (kept as a constraint, not an enum, so new trade
-- bodies can be added without a type migration). Drop-and-recreate to stay
-- idempotent across re-runs.
ALTER TABLE supplier_compliance DROP CONSTRAINT IF EXISTS supplier_compliance_type_check;
ALTER TABLE supplier_compliance
  ADD CONSTRAINT supplier_compliance_type_check
  CHECK (compliance_type IN (
    'gas_safe','niceic','napit','public_liability','employers_liability',
    'dbs_check','chas','constructionline','other'
  ));

CREATE INDEX IF NOT EXISTS idx_supplier_compliance_ws_supplier
  ON supplier_compliance (workspace_id, supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_compliance_expiry
  ON supplier_compliance (expiry_date);

ALTER TABLE supplier_compliance ENABLE ROW LEVEL SECURITY;

-- Owner/admin/manager of the workspace may manage cert records.
DROP POLICY IF EXISTS supplier_compliance_owner_admin_manage ON supplier_compliance;
CREATE POLICY supplier_compliance_owner_admin_manage ON supplier_compliance
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
        AND role = ANY (ARRAY['owner'::app_role,'admin'::app_role,'manager'::app_role])
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
        AND role = ANY (ARRAY['owner'::app_role,'admin'::app_role,'manager'::app_role])
    )
  );

-- Any workspace member may read cert records.
DROP POLICY IF EXISTS supplier_compliance_member_read ON supplier_compliance;
CREATE POLICY supplier_compliance_member_read ON supplier_compliance
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- client_accounts — the workspace's client/rent-collection bank account.
-- Read in the tenant portal's bank-transfer payment tab (getWorkspaceBankDetails)
-- and the operator finance UI. Also from the unapplied 028_financial_ops_schema;
-- reproduced here so a fresh database matches production.
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_accounts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id          UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  account_name        TEXT NOT NULL,
  bank_account_name   TEXT,
  bank_sort_code      TEXT,
  bank_account_number TEXT,
  current_balance     NUMERIC(14,2) NOT NULL DEFAULT 0,
  trust_balance       NUMERIC(14,2) NOT NULL DEFAULT 0,
  management_fee_pct  NUMERIC(5,2)  NOT NULL DEFAULT 0,
  auto_disburse       BOOLEAN NOT NULL DEFAULT false,
  disburse_day        INTEGER NOT NULL DEFAULT 25,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_accounts_ws ON client_accounts (workspace_id);

ALTER TABLE client_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS client_accounts_owner_admin_manage ON client_accounts;
CREATE POLICY client_accounts_owner_admin_manage ON client_accounts
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
        AND role = ANY (ARRAY['owner'::app_role,'admin'::app_role,'manager'::app_role])
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
        AND role = ANY (ARRAY['owner'::app_role,'admin'::app_role,'manager'::app_role])
    )
  );

DROP POLICY IF EXISTS client_accounts_member_read ON client_accounts;
CREATE POLICY client_accounts_member_read ON client_accounts
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );
