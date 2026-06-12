-- =============================================================================
-- 011_money_level2.sql
-- Additive only — zero modifications to existing tables.
-- =============================================================================

-- bills
CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  bill_number TEXT,
  bill_type TEXT NOT NULL DEFAULT 'supplier_invoice',
  supplier_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  unit_id UUID,
  tenancy_id UUID,
  job_id UUID,
  planning_set_id UUID,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('draft','received','awaiting_review','approved','scheduled_for_payment','paid','part_paid','overdue','disputed','rejected','cancelled','reconciled')),
  issue_date DATE,
  due_date DATE,
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'GBP',
  document_id UUID,
  stripe_transfer_id TEXT,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- bill_lines
CREATE TABLE IF NOT EXISTS bill_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  description TEXT NOT NULL DEFAULT '',
  quantity DECIMAL(10,4) DEFAULT 1,
  unit_price DECIMAL(12,2) DEFAULT 0,
  tax_rate DECIMAL(6,4) DEFAULT 0,
  line_total DECIMAL(12,2) DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- invoice_lines (supplement existing invoices table)
CREATE TABLE IF NOT EXISTS invoice_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL DEFAULT '',
  quantity DECIMAL(10,4) DEFAULT 1,
  unit_price DECIMAL(12,2) DEFAULT 0,
  tax_rate DECIMAL(6,4) DEFAULT 0,
  line_total DECIMAL(12,2) DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  payment_type TEXT NOT NULL DEFAULT 'income',
  linked_type TEXT,
  linked_id UUID,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  amount DECIMAL(12,2) DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'GBP',
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'bank_transfer',
  status TEXT NOT NULL DEFAULT 'completed',
  stripe_payment_id TEXT,
  stripe_transfer_id TEXT,
  reference TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- arrears_records
CREATE TABLE IF NOT EXISTS arrears_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  unit_id UUID,
  tenancy_id UUID,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  amount_due DECIMAL(12,2) DEFAULT 0,
  amount_paid DECIMAL(12,2) DEFAULT 0,
  amount_outstanding DECIMAL(12,2) DEFAULT 0,
  due_date DATE,
  days_overdue INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','chasing','payment_plan','part_paid','resolved','written_off','disputed')),
  last_chased_at TIMESTAMPTZ,
  next_chase_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- deposits
CREATE TABLE IF NOT EXISTS deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  deposit_type TEXT NOT NULL DEFAULT 'tenant_deposit',
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  unit_id UUID,
  tenancy_id UUID,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  planning_set_id UUID,
  amount DECIMAL(12,2) DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'GBP',
  status TEXT NOT NULL DEFAULT 'expected' CHECK (status IN ('expected','received','protected','held_by_third_party','paid_to_landlord','returned','part_returned','deducted','disputed','cancelled')),
  received_date DATE,
  due_date DATE,
  protection_scheme TEXT,
  reference_number TEXT,
  held_by TEXT,
  return_due_date DATE,
  document_id UUID,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- debt_snapshots
CREATE TABLE IF NOT EXISTS debt_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  lender_name TEXT,
  loan_type TEXT DEFAULT 'mortgage',
  current_balance DECIMAL(12,2) DEFAULT 0,
  monthly_payment DECIMAL(12,2) DEFAULT 0,
  interest_rate DECIMAL(8,4) DEFAULT 0,
  rate_type TEXT DEFAULT 'fixed',
  fixed_rate_end_date DATE,
  estimated_property_value DECIMAL(12,2),
  estimated_ltv DECIMAL(8,4),
  next_review_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','review_due','refinance_watch','paid_off','archived')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- money_forecast_records
CREATE TABLE IF NOT EXISTS money_forecast_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  planning_set_id UUID,
  record_type TEXT NOT NULL DEFAULT 'income',
  category TEXT,
  description TEXT,
  forecast_amount DECIMAL(12,2) DEFAULT 0,
  actual_amount DECIMAL(12,2) DEFAULT 0,
  variance DECIMAL(12,2) GENERATED ALWAYS AS (actual_amount - forecast_amount) STORED,
  period_start DATE,
  period_end DATE,
  status TEXT NOT NULL DEFAULT 'forecast' CHECK (status IN ('forecast','planned','confirmed','actual','ignored')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- stripe_accounts
CREATE TABLE IF NOT EXISTS stripe_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
  stripe_account_id TEXT,
  status TEXT NOT NULL DEFAULT 'not_connected',
  onboarding_url TEXT,
  charges_enabled BOOLEAN DEFAULT false,
  payouts_enabled BOOLEAN DEFAULT false,
  details_submitted BOOLEAN DEFAULT false,
  is_test_mode BOOLEAN DEFAULT true,
  connected_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- affiliate_commissions
CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  affiliate_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referred_workspace_id UUID,
  commission_type TEXT DEFAULT 'subscription',
  amount DECIMAL(12,2) DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'GBP',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','payable','paid','held','reversed','cancelled')),
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  stripe_transfer_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- reconciliation_items
CREATE TABLE IF NOT EXISTS reconciliation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL DEFAULT 'manual',
  source_reference TEXT,
  amount DECIMAL(12,2) DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'GBP',
  transaction_date DATE,
  description TEXT,
  matched_type TEXT,
  matched_id UUID,
  status TEXT NOT NULL DEFAULT 'unmatched' CHECK (status IN ('unmatched','suggested_match','matched','ignored','needs_review','reconciled')),
  reconciled_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- =============================================================================
-- updated_at triggers
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ language 'plpgsql';

-- Apply triggers to all new tables with updated_at
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['bills','arrears_records','deposits','debt_snapshots','money_forecast_records','stripe_accounts','affiliate_commissions','reconciliation_items']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at_%s ON %I', t, t);
    EXECUTE format('CREATE TRIGGER set_updated_at_%s BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
  END LOOP;
END $$;

-- =============================================================================
-- Indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_bills_workspace ON bills(workspace_id);
CREATE INDEX IF NOT EXISTS idx_bills_supplier ON bills(supplier_contact_id);
CREATE INDEX IF NOT EXISTS idx_bills_property ON bills(property_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
CREATE INDEX IF NOT EXISTS idx_bill_lines_bill ON bill_lines(bill_id);
CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice ON invoice_lines(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_workspace ON payments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_arrears_workspace ON arrears_records(workspace_id);
CREATE INDEX IF NOT EXISTS idx_arrears_contact ON arrears_records(contact_id);
CREATE INDEX IF NOT EXISTS idx_deposits_workspace ON deposits(workspace_id);
CREATE INDEX IF NOT EXISTS idx_debt_snapshots_property ON debt_snapshots(property_id);
CREATE INDEX IF NOT EXISTS idx_forecast_workspace ON money_forecast_records(workspace_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_workspace ON affiliate_commissions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_workspace ON reconciliation_items(workspace_id);

-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE arrears_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_forecast_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_items ENABLE ROW LEVEL SECURITY;

-- bills
CREATE POLICY "workspace_bills_select" ON bills FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "workspace_bills_insert" ON bills FOR INSERT WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "workspace_bills_update" ON bills FOR UPDATE USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "workspace_bills_delete" ON bills FOR DELETE USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- bill_lines
CREATE POLICY "workspace_bill_lines_select" ON bill_lines FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "workspace_bill_lines_insert" ON bill_lines FOR INSERT WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "workspace_bill_lines_update" ON bill_lines FOR UPDATE USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "workspace_bill_lines_delete" ON bill_lines FOR DELETE USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- invoice_lines
CREATE POLICY "workspace_invoice_lines_select" ON invoice_lines FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "workspace_invoice_lines_insert" ON invoice_lines FOR INSERT WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "workspace_invoice_lines_update" ON invoice_lines FOR UPDATE USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "workspace_invoice_lines_delete" ON invoice_lines FOR DELETE USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- payments
CREATE POLICY "workspace_payments_select" ON payments FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "workspace_payments_insert" ON payments FOR INSERT WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "workspace_payments_update" ON payments FOR UPDATE USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "workspace_payments_delete" ON payments FOR DELETE USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- arrears_records
CREATE POLICY "workspace_arrears_select" ON arrears_records FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "workspace_arrears_insert" ON arrears_records FOR INSERT WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "workspace_arrears_update" ON arrears_records FOR UPDATE USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "workspace_arrears_delete" ON arrears_records FOR DELETE USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- deposits
CREATE POLICY "workspace_deposits_select" ON deposits FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "workspace_deposits_insert" ON deposits FOR INSERT WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "workspace_deposits_update" ON deposits FOR UPDATE USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "workspace_deposits_delete" ON deposits FOR DELETE USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- debt_snapshots
CREATE POLICY "workspace_debt_snapshots_select" ON debt_snapshots FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "workspace_debt_snapshots_insert" ON debt_snapshots FOR INSERT WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "workspace_debt_snapshots_update" ON debt_snapshots FOR UPDATE USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "workspace_debt_snapshots_delete" ON debt_snapshots FOR DELETE USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- money_forecast_records
CREATE POLICY "workspace_forecast_select" ON money_forecast_records FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "workspace_forecast_insert" ON money_forecast_records FOR INSERT WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "workspace_forecast_update" ON money_forecast_records FOR UPDATE USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "workspace_forecast_delete" ON money_forecast_records FOR DELETE USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- stripe_accounts
CREATE POLICY "workspace_stripe_select" ON stripe_accounts FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "workspace_stripe_insert" ON stripe_accounts FOR INSERT WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "workspace_stripe_update" ON stripe_accounts FOR UPDATE USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- affiliate_commissions
CREATE POLICY "workspace_affiliate_select" ON affiliate_commissions FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "workspace_affiliate_insert" ON affiliate_commissions FOR INSERT WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "workspace_affiliate_update" ON affiliate_commissions FOR UPDATE USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- reconciliation_items
CREATE POLICY "workspace_reconciliation_select" ON reconciliation_items FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "workspace_reconciliation_insert" ON reconciliation_items FOR INSERT WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "workspace_reconciliation_update" ON reconciliation_items FOR UPDATE USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "workspace_reconciliation_delete" ON reconciliation_items FOR DELETE USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
