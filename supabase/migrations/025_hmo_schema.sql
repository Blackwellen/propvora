-- ============================================================
-- 025_hmo_schema.sql
-- HMO module: licences, room rent schedules, utility bills,
-- utility room splits, and room deposits.
-- ============================================================

-- hmo_licences
CREATE TABLE IF NOT EXISTS hmo_licences (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id            UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  property_id             UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  licence_type            TEXT NOT NULL CHECK (licence_type IN ('mandatory','additional','selective')),
  licence_number          TEXT,
  issuing_council         TEXT,
  issue_date              DATE,
  expiry_date             DATE NOT NULL,
  max_occupants           INTEGER,
  max_households          INTEGER,
  conditions              JSONB NOT NULL DEFAULT '[]',
  document_path           TEXT,
  status                  TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','pending','revoked')),
  renewal_reminder_days   INTEGER NOT NULL DEFAULT 90,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);

-- room_rent_schedules
CREATE TABLE IF NOT EXISTS room_rent_schedules (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id            UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  unit_id                 UUID NOT NULL,
  tenancy_id              UUID,
  monthly_rent            NUMERIC(10,2) NOT NULL,
  effective_from          DATE NOT NULL,
  effective_to            DATE,
  payment_day_of_month    INTEGER NOT NULL DEFAULT 1,
  payment_method          TEXT NOT NULL DEFAULT 'bank_transfer',
  notes                   TEXT,
  created_at              TIMESTAMPTZ DEFAULT now()
);

-- utility_bills
CREATE TABLE IF NOT EXISTS utility_bills (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id            UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  property_id             UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  utility_type            TEXT NOT NULL CHECK (utility_type IN ('electricity','gas','water','broadband','council_tax','tv_licence','other')),
  provider_name           TEXT,
  account_number          TEXT,
  bill_date               DATE NOT NULL,
  period_start            DATE,
  period_end              DATE,
  total_amount            NUMERIC(10,2) NOT NULL,
  unit_usage              NUMERIC(12,4),
  unit_type               TEXT,
  meter_reading_start     NUMERIC(12,4),
  meter_reading_end       NUMERIC(12,4),
  receipt_path            TEXT,
  split_method            TEXT NOT NULL DEFAULT 'equal' CHECK (split_method IN ('equal','occupancy_days','floor_area','custom')),
  status                  TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid','paid','split_invoiced','disputed')),
  created_by              UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);

-- utility_room_splits
CREATE TABLE IF NOT EXISTS utility_room_splits (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  utility_bill_id  UUID NOT NULL REFERENCES utility_bills(id) ON DELETE CASCADE,
  unit_id          UUID NOT NULL,
  tenancy_id       UUID,
  contact_id       UUID REFERENCES contacts(id) ON DELETE SET NULL,
  split_percentage NUMERIC(5,2),
  split_amount     NUMERIC(10,2) NOT NULL,
  invoice_id       UUID,
  paid             BOOLEAN NOT NULL DEFAULT false,
  paid_date        DATE,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- room_deposits
CREATE TABLE IF NOT EXISTS room_deposits (
  id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id                    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  unit_id                         UUID NOT NULL,
  tenancy_id                      UUID,
  contact_id                      UUID REFERENCES contacts(id) ON DELETE SET NULL,
  amount                          NUMERIC(10,2) NOT NULL,
  protection_scheme               TEXT CHECK (protection_scheme IN ('dps','tds','mydeposits','none')),
  scheme_reference                TEXT,
  protection_date                 DATE,
  prescribed_info_served_date     DATE,
  return_date                     DATE,
  return_amount                   NUMERIC(10,2),
  deductions                      JSONB NOT NULL DEFAULT '[]',
  status                          TEXT NOT NULL DEFAULT 'held' CHECK (status IN ('held','returned','disputed','deducted')),
  created_at                      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE hmo_licences          ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_rent_schedules   ENABLE ROW LEVEL SECURITY;
ALTER TABLE utility_bills         ENABLE ROW LEVEL SECURITY;
ALTER TABLE utility_room_splits   ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_deposits         ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'hmo_licences','room_rent_schedules','utility_bills',
    'utility_room_splits','room_deposits'
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
  tables TEXT[] := ARRAY['hmo_licences','utility_bills'];
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

CREATE INDEX IF NOT EXISTS idx_hmo_licences_workspace    ON hmo_licences(workspace_id);
CREATE INDEX IF NOT EXISTS idx_hmo_licences_property     ON hmo_licences(property_id);
CREATE INDEX IF NOT EXISTS idx_hmo_licences_status       ON hmo_licences(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_hmo_licences_expiry       ON hmo_licences(workspace_id, expiry_date);

CREATE INDEX IF NOT EXISTS idx_room_rent_schedules_ws    ON room_rent_schedules(workspace_id);
CREATE INDEX IF NOT EXISTS idx_room_rent_schedules_unit  ON room_rent_schedules(unit_id);
CREATE INDEX IF NOT EXISTS idx_room_rent_schedules_from  ON room_rent_schedules(workspace_id, effective_from DESC);

CREATE INDEX IF NOT EXISTS idx_utility_bills_workspace   ON utility_bills(workspace_id);
CREATE INDEX IF NOT EXISTS idx_utility_bills_property    ON utility_bills(property_id);
CREATE INDEX IF NOT EXISTS idx_utility_bills_status      ON utility_bills(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_utility_bills_date        ON utility_bills(workspace_id, bill_date DESC);

CREATE INDEX IF NOT EXISTS idx_utility_room_splits_ws    ON utility_room_splits(workspace_id);
CREATE INDEX IF NOT EXISTS idx_utility_room_splits_bill  ON utility_room_splits(utility_bill_id);
CREATE INDEX IF NOT EXISTS idx_utility_room_splits_unit  ON utility_room_splits(unit_id);

CREATE INDEX IF NOT EXISTS idx_room_deposits_workspace   ON room_deposits(workspace_id);
CREATE INDEX IF NOT EXISTS idx_room_deposits_unit        ON room_deposits(unit_id);
CREATE INDEX IF NOT EXISTS idx_room_deposits_status      ON room_deposits(workspace_id, status);
