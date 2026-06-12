-- ============================================================
-- Planning section schema repair (partial migration history)
-- These CORE tables are queried by the app but missing from this DB:
--   planning_sets, planning_assumptions, planning_room_lines,
--   planning_bill_lines, planning_landlord_offers
-- (planning_income_lines / planning_expense_lines / planning_upfront_costs
--  already exist.) Canonical column sets from migration 001.
-- Workspace-scoped RLS via is_workspace_member(); child tables scope
-- through their parent planning_set. Idempotent: safe to re-run.
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── planning_sets ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS planning_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  operation_profile TEXT NOT NULL DEFAULT 'long_term_let',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','converted','archived')),
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  address TEXT,
  postcode TEXT,
  gross_monthly_income DECIMAL(12,2) DEFAULT 0,
  gross_annual_income DECIMAL(12,2) DEFAULT 0,
  total_monthly_expenses DECIMAL(12,2) DEFAULT 0,
  net_monthly_income DECIMAL(12,2) DEFAULT 0,
  net_annual_income DECIMAL(12,2) DEFAULT 0,
  gross_yield DECIMAL(6,4) DEFAULT 0,
  net_yield DECIMAL(6,4) DEFAULT 0,
  roi DECIMAL(6,4) DEFAULT 0,
  upfront_cash_required DECIMAL(12,2) DEFAULT 0,
  breakeven_month INTEGER DEFAULT 0,
  risk_score INTEGER DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
  notes TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_planning_sets_workspace ON planning_sets(workspace_id);
CREATE INDEX IF NOT EXISTS idx_planning_sets_status    ON planning_sets(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_planning_sets_profile   ON planning_sets(operation_profile);

ALTER TABLE planning_sets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members read planning_sets" ON planning_sets;
CREATE POLICY "Members read planning_sets" ON planning_sets FOR SELECT USING (is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "Members write planning_sets" ON planning_sets;
CREATE POLICY "Members write planning_sets" ON planning_sets FOR ALL USING (is_workspace_member(workspace_id));

DROP TRIGGER IF EXISTS update_planning_sets_updated_at ON planning_sets;
CREATE TRIGGER update_planning_sets_updated_at BEFORE UPDATE ON planning_sets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── planning_assumptions ───────────────────────────────────
CREATE TABLE IF NOT EXISTS planning_assumptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  planning_set_id UUID NOT NULL REFERENCES planning_sets(id) ON DELETE CASCADE,
  property_purchase_price DECIMAL(12,2),
  property_value DECIMAL(12,2),
  monthly_mortgage DECIMAL(10,2),
  landlord_monthly_rent DECIMAL(10,2),
  contract_length_months INTEGER,
  break_clause_months INTEGER,
  rent_review_months INTEGER,
  void_allowance_pct DECIMAL(5,4) DEFAULT 0.05,
  management_fee_pct DECIMAL(5,4) DEFAULT 0,
  occupancy_rate_pct DECIMAL(5,4) DEFAULT 0.90,
  average_daily_rate DECIMAL(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_planning_assumptions_set ON planning_assumptions(planning_set_id);

ALTER TABLE planning_assumptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members access planning_assumptions" ON planning_assumptions;
CREATE POLICY "Members access planning_assumptions" ON planning_assumptions FOR ALL USING (
  EXISTS (SELECT 1 FROM planning_sets ps WHERE ps.id = planning_assumptions.planning_set_id AND is_workspace_member(ps.workspace_id))
);

DROP TRIGGER IF EXISTS update_planning_assumptions_updated_at ON planning_assumptions;
CREATE TRIGGER update_planning_assumptions_updated_at BEFORE UPDATE ON planning_assumptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── planning_room_lines ────────────────────────────────────
CREATE TABLE IF NOT EXISTS planning_room_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  planning_set_id UUID NOT NULL REFERENCES planning_sets(id) ON DELETE CASCADE,
  room_label TEXT NOT NULL,
  room_type TEXT DEFAULT 'room',
  monthly_rent DECIMAL(10,2) NOT NULL DEFAULT 0,
  bills_included BOOLEAN DEFAULT false,
  notes TEXT,
  sort_order INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_planning_room_lines_set ON planning_room_lines(planning_set_id);

ALTER TABLE planning_room_lines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members access planning_room_lines" ON planning_room_lines;
CREATE POLICY "Members access planning_room_lines" ON planning_room_lines FOR ALL USING (
  EXISTS (SELECT 1 FROM planning_sets ps WHERE ps.id = planning_room_lines.planning_set_id AND is_workspace_member(ps.workspace_id))
);

-- ─── planning_bill_lines ────────────────────────────────────
CREATE TABLE IF NOT EXISTS planning_bill_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  planning_set_id UUID NOT NULL REFERENCES planning_sets(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  monthly_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  provider TEXT,
  notes TEXT,
  sort_order INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_planning_bill_lines_set ON planning_bill_lines(planning_set_id);

ALTER TABLE planning_bill_lines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members access planning_bill_lines" ON planning_bill_lines;
CREATE POLICY "Members access planning_bill_lines" ON planning_bill_lines FOR ALL USING (
  EXISTS (SELECT 1 FROM planning_sets ps WHERE ps.id = planning_bill_lines.planning_set_id AND is_workspace_member(ps.workspace_id))
);

-- ─── planning_landlord_offers ───────────────────────────────
CREATE TABLE IF NOT EXISTS planning_landlord_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  planning_set_id UUID REFERENCES planning_sets(id) ON DELETE SET NULL,
  landlord_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  property_address TEXT NOT NULL,
  proposed_rent DECIMAL(10,2) NOT NULL,
  proposed_term_months INTEGER,
  break_clause_months INTEGER,
  management_fee_included BOOLEAN DEFAULT false,
  bills_included BOOLEAN DEFAULT false,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','accepted','rejected','negotiating','expired')),
  sent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_planning_offers_workspace ON planning_landlord_offers(workspace_id);
CREATE INDEX IF NOT EXISTS idx_planning_offers_set       ON planning_landlord_offers(planning_set_id);

ALTER TABLE planning_landlord_offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members read planning_offers" ON planning_landlord_offers;
CREATE POLICY "Members read planning_offers" ON planning_landlord_offers FOR SELECT USING (is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "Members write planning_offers" ON planning_landlord_offers;
CREATE POLICY "Members write planning_offers" ON planning_landlord_offers FOR ALL USING (is_workspace_member(workspace_id));

DROP TRIGGER IF EXISTS update_planning_offers_updated_at ON planning_landlord_offers;
CREATE TRIGGER update_planning_offers_updated_at BEFORE UPDATE ON planning_landlord_offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
