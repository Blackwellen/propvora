-- ============================================================
-- 027_possession_r2r_schema.sql
-- Possession and Rent-to-Rent module: possession cases,
-- evidence, R2R contracts and ledger.
-- ============================================================

-- possession_cases
CREATE TABLE IF NOT EXISTS possession_cases (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id           UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  tenancy_id             UUID NOT NULL,
  property_id            UUID REFERENCES properties(id) ON DELETE SET NULL,
  contact_id             UUID REFERENCES contacts(id) ON DELETE SET NULL,
  ground                 TEXT NOT NULL,
  arrears_amount         NUMERIC(10,2),
  arrears_weeks          NUMERIC(5,1),
  status                 TEXT NOT NULL DEFAULT 'gathering_evidence' CHECK (status IN ('gathering_evidence','notice_draft','notice_served','notice_expired','court_applied','hearing_scheduled','possession_granted','warrant_issued','resolved')),
  notice_served_date     DATE,
  notice_expiry_date     DATE,
  court_applied_date     DATE,
  hearing_date           DATE,
  court_reference        TEXT,
  evidence_bundle_path   TEXT,
  notes                  TEXT,
  created_by             UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at             TIMESTAMPTZ DEFAULT now(),
  updated_at             TIMESTAMPTZ DEFAULT now()
);

-- possession_evidence
CREATE TABLE IF NOT EXISTS possession_evidence (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id         UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  possession_case_id   UUID NOT NULL REFERENCES possession_cases(id) ON DELETE CASCADE,
  evidence_type        TEXT NOT NULL CHECK (evidence_type IN ('missed_payment','partial_payment','notice_served','communication','open_banking_record','statement','photo','other')),
  description          TEXT NOT NULL,
  amount               NUMERIC(10,2),
  event_date           TIMESTAMPTZ NOT NULL,
  document_path        TEXT,
  source               TEXT CHECK (source IN ('manual','open_banking','system','ai')),
  created_at           TIMESTAMPTZ DEFAULT now()
);

-- rent_to_rent_contracts
CREATE TABLE IF NOT EXISTS rent_to_rent_contracts (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id              UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  property_id               UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  owner_contact_id          UUID REFERENCES contacts(id) ON DELETE SET NULL,
  contract_start            DATE NOT NULL,
  contract_end              DATE,
  guaranteed_rent_monthly   NUMERIC(10,2) NOT NULL,
  payment_day_of_month      INTEGER NOT NULL DEFAULT 1,
  management_model          TEXT NOT NULL DEFAULT 'hmo' CHECK (management_model IN ('hmo','sa','asa','single_let')),
  subletting_permitted      BOOLEAN NOT NULL DEFAULT true,
  break_clause_months       INTEGER,
  status                    TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','terminated','pending')),
  agreement_document_path   TEXT,
  notes                     TEXT,
  created_at                TIMESTAMPTZ DEFAULT now(),
  updated_at                TIMESTAMPTZ DEFAULT now()
);

-- r2r_ledger
CREATE TABLE IF NOT EXISTS r2r_ledger (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id                UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  r2r_contract_id             UUID NOT NULL REFERENCES rent_to_rent_contracts(id) ON DELETE CASCADE,
  period_start                DATE NOT NULL,
  period_end                  DATE NOT NULL,
  guaranteed_rent_due         NUMERIC(10,2) NOT NULL,
  guaranteed_rent_paid        NUMERIC(10,2) NOT NULL DEFAULT 0,
  tenant_income_expected      NUMERIC(10,2) NOT NULL DEFAULT 0,
  tenant_income_received      NUMERIC(10,2) NOT NULL DEFAULT 0,
  gross_margin                NUMERIC(10,2),
  notes                       TEXT,
  created_at                  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE possession_cases        ENABLE ROW LEVEL SECURITY;
ALTER TABLE possession_evidence     ENABLE ROW LEVEL SECURITY;
ALTER TABLE rent_to_rent_contracts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE r2r_ledger              ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'possession_cases','possession_evidence',
    'rent_to_rent_contracts','r2r_ledger'
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
  tables TEXT[] := ARRAY['possession_cases','rent_to_rent_contracts'];
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

CREATE INDEX IF NOT EXISTS idx_possession_cases_workspace  ON possession_cases(workspace_id);
CREATE INDEX IF NOT EXISTS idx_possession_cases_tenancy    ON possession_cases(tenancy_id);
CREATE INDEX IF NOT EXISTS idx_possession_cases_property   ON possession_cases(property_id);
CREATE INDEX IF NOT EXISTS idx_possession_cases_status     ON possession_cases(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_possession_cases_hearing    ON possession_cases(workspace_id, hearing_date);

CREATE INDEX IF NOT EXISTS idx_possession_evidence_ws      ON possession_evidence(workspace_id);
CREATE INDEX IF NOT EXISTS idx_possession_evidence_case    ON possession_evidence(possession_case_id);
CREATE INDEX IF NOT EXISTS idx_possession_evidence_type    ON possession_evidence(evidence_type);
CREATE INDEX IF NOT EXISTS idx_possession_evidence_date    ON possession_evidence(event_date DESC);

CREATE INDEX IF NOT EXISTS idx_r2r_contracts_workspace     ON rent_to_rent_contracts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_r2r_contracts_property      ON rent_to_rent_contracts(property_id);
CREATE INDEX IF NOT EXISTS idx_r2r_contracts_status        ON rent_to_rent_contracts(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_r2r_contracts_end           ON rent_to_rent_contracts(workspace_id, contract_end);

CREATE INDEX IF NOT EXISTS idx_r2r_ledger_workspace        ON r2r_ledger(workspace_id);
CREATE INDEX IF NOT EXISTS idx_r2r_ledger_contract         ON r2r_ledger(r2r_contract_id);
CREATE INDEX IF NOT EXISTS idx_r2r_ledger_period           ON r2r_ledger(workspace_id, period_start DESC);
