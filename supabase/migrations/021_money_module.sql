-- ============================================================
-- 021_money_module.sql
-- Full Money module: income, expenses, invoices, bills,
-- arrears, deposits, forecasts, reconciliation, reports,
-- activity and payment settings.
-- ============================================================

-- money_income
CREATE TABLE IF NOT EXISTS money_income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  unit_id UUID,
  tenancy_id UUID,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  invoice_id UUID,
  description TEXT NOT NULL,
  income_type TEXT NOT NULL DEFAULT 'rent',
  expected_date DATE,
  received_date DATE,
  due_date DATE,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'GBP',
  status TEXT NOT NULL DEFAULT 'expected' CHECK (status IN ('received','expected','planned','overdue','reconciled','cancelled')),
  payment_method TEXT,
  reference TEXT,
  reconciliation_status TEXT DEFAULT 'unreconciled',
  reconciled_transaction_id UUID,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- money_expenses
CREATE TABLE IF NOT EXISTS money_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  bill_id UUID,
  job_id UUID,
  description TEXT NOT NULL,
  expense_type TEXT NOT NULL DEFAULT 'other',
  cost_behaviour TEXT NOT NULL DEFAULT 'variable' CHECK (cost_behaviour IN ('fixed','variable','semi-variable','one-off','capital','repair')),
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'GBP',
  due_date DATE,
  paid_date DATE,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('paid','approved','due','planned','rejected','needs_review')),
  receipt_storage_path TEXT,
  receipt_file_name TEXT,
  reconciliation_status TEXT DEFAULT 'unreconciled',
  reconciled_transaction_id UUID,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- money_invoices
CREATE TABLE IF NOT EXISTS money_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  recipient_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  tenancy_id UUID,
  invoice_type TEXT NOT NULL DEFAULT 'rent',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_outstanding NUMERIC(12,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','planned','sent','due_soon','overdue','paid','void','written_off')),
  payment_link_url TEXT,
  stripe_payment_intent_id TEXT,
  pdf_storage_path TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- money_invoice_lines
CREATE TABLE IF NOT EXISTS money_invoice_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES money_invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- money_bills
CREATE TABLE IF NOT EXISTS money_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  job_id UUID,
  bill_number TEXT,
  reference TEXT,
  bill_type TEXT NOT NULL DEFAULT 'invoice',
  issue_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'GBP',
  approval_status TEXT NOT NULL DEFAULT 'awaiting_review' CHECK (approval_status IN ('awaiting_review','approved','rejected')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','scheduled','paid','overdue')),
  payment_method TEXT DEFAULT 'bacs',
  receipt_storage_path TEXT,
  stripe_transfer_id TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  paid_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- money_arrears_cases
CREATE TABLE IF NOT EXISTS money_arrears_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  unit_id UUID,
  tenancy_id UUID,
  invoice_id UUID REFERENCES money_invoices(id) ON DELETE SET NULL,
  amount_outstanding NUMERIC(12,2) NOT NULL DEFAULT 0,
  days_overdue INTEGER NOT NULL DEFAULT 0,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','chasing','payment_plan','legal','resolved','written_off')),
  last_chased_at TIMESTAMPTZ,
  next_chase_at TIMESTAMPTZ,
  payment_plan_id UUID,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- money_payment_plans
CREATE TABLE IF NOT EXISTS money_payment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  arrears_case_id UUID REFERENCES money_arrears_cases(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  instalment_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('weekly','fortnightly','monthly','quarterly')),
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','defaulted','cancelled')),
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- money_deposits
CREATE TABLE IF NOT EXISTS money_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  tenant_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  unit_id UUID,
  tenancy_id UUID,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'GBP',
  received_date DATE,
  protection_scheme TEXT CHECK (protection_scheme IN ('DPS','TDS','MyDeposits','Other')),
  protection_reference TEXT,
  protected_date DATE,
  prescribed_info_served_at DATE,
  status TEXT NOT NULL DEFAULT 'expected' CHECK (status IN ('protected','unprotected','expected','return_due','disputed','returned','partial_return')),
  return_due_date DATE,
  returned_amount NUMERIC(12,2),
  disputed_amount NUMERIC(12,2),
  evidence_storage_path TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- money_forecasts
CREATE TABLE IF NOT EXISTS money_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  planning_set_id UUID,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  scenario TEXT NOT NULL DEFAULT 'base' CHECK (scenario IN ('base','upside','downside')),
  forecast_income NUMERIC(12,2) NOT NULL DEFAULT 0,
  forecast_expenses NUMERIC(12,2) NOT NULL DEFAULT 0,
  forecast_net NUMERIC(12,2) GENERATED ALWAYS AS (forecast_income - forecast_expenses) STORED,
  actual_income NUMERIC(12,2) NOT NULL DEFAULT 0,
  actual_expenses NUMERIC(12,2) NOT NULL DEFAULT 0,
  actual_net NUMERIC(12,2) GENERATED ALWAYS AS (actual_income - actual_expenses) STORED,
  variance_income NUMERIC(12,2) GENERATED ALWAYS AS (actual_income - forecast_income) STORED,
  variance_expenses NUMERIC(12,2) GENERATED ALWAYS AS (actual_expenses - forecast_expenses) STORED,
  variance_net NUMERIC(12,2) GENERATED ALWAYS AS ((actual_income - actual_expenses) - (forecast_income - forecast_expenses)) STORED,
  source_metadata_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- money_reconciliation_imports
CREATE TABLE IF NOT EXISTS money_reconciliation_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_storage_path TEXT,
  file_type TEXT NOT NULL DEFAULT 'csv',
  imported_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  imported_at TIMESTAMPTZ DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing','completed','failed','needs_review')),
  transaction_count INTEGER NOT NULL DEFAULT 0,
  matched_count INTEGER NOT NULL DEFAULT 0,
  unmatched_count INTEGER NOT NULL DEFAULT 0,
  needs_review_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- money_transactions (bank/import transactions)
CREATE TABLE IF NOT EXISTS money_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  import_id UUID REFERENCES money_reconciliation_imports(id) ON DELETE SET NULL,
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GBP',
  source TEXT,
  suggested_match_type TEXT,
  suggested_match_id UUID,
  confidence_score NUMERIC(5,2),
  status TEXT NOT NULL DEFAULT 'unmatched' CHECK (status IN ('unmatched','suggested','matched','needs_review','ignored')),
  matched_entity_type TEXT,
  matched_entity_id UUID,
  matched_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  matched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- money_reports
CREATE TABLE IF NOT EXISTS money_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  report_name TEXT NOT NULL,
  report_type TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'pdf' CHECK (format IN ('pdf','csv','xlsx')),
  period_start DATE,
  period_end DATE,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('generating','completed','failed')),
  generated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  file_storage_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- money_scheduled_reports
CREATE TABLE IF NOT EXISTS money_scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily','weekly','monthly','quarterly')),
  day_of_month INTEGER,
  day_of_week INTEGER,
  next_run_at TIMESTAMPTZ,
  recipients_json JSONB DEFAULT '[]',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- money_activity
CREATE TABLE IF NOT EXISTS money_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(12,2),
  actor_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  system_generated BOOLEAN NOT NULL DEFAULT false,
  metadata_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- payment_settings
CREATE TABLE IF NOT EXISTS payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
  stripe_connected BOOLEAN NOT NULL DEFAULT false,
  stripe_account_id TEXT,
  test_mode BOOLEAN NOT NULL DEFAULT true,
  payment_links_enabled BOOLEAN NOT NULL DEFAULT false,
  supplier_payouts_enabled BOOLEAN NOT NULL DEFAULT false,
  webhook_status TEXT DEFAULT 'not_configured',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE money_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_arrears_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_reconciliation_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;

-- Generate RLS policies for all tables using workspace_members pattern
-- Pattern: workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'money_income','money_expenses','money_invoices','money_invoice_lines',
    'money_bills','money_arrears_cases','money_payment_plans','money_deposits',
    'money_forecasts','money_reconciliation_imports','money_transactions',
    'money_reports','money_scheduled_reports','money_activity','payment_settings'
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
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_money_income_workspace ON money_income(workspace_id, expected_date DESC);
CREATE INDEX IF NOT EXISTS idx_money_income_status ON money_income(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_money_income_property ON money_income(property_id);
CREATE INDEX IF NOT EXISTS idx_money_expenses_workspace ON money_expenses(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_money_expenses_status ON money_expenses(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_money_invoices_workspace ON money_invoices(workspace_id, due_date DESC);
CREATE INDEX IF NOT EXISTS idx_money_invoices_status ON money_invoices(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_money_invoices_number ON money_invoices(workspace_id, invoice_number);
CREATE INDEX IF NOT EXISTS idx_money_bills_workspace ON money_bills(workspace_id, due_date DESC);
CREATE INDEX IF NOT EXISTS idx_money_bills_approval ON money_bills(workspace_id, approval_status);
CREATE INDEX IF NOT EXISTS idx_money_arrears_workspace ON money_arrears_cases(workspace_id, days_overdue DESC);
CREATE INDEX IF NOT EXISTS idx_money_arrears_status ON money_arrears_cases(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_money_deposits_workspace ON money_deposits(workspace_id, received_date DESC);
CREATE INDEX IF NOT EXISTS idx_money_forecasts_workspace ON money_forecasts(workspace_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_money_transactions_workspace ON money_transactions(workspace_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_money_transactions_status ON money_transactions(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_money_activity_workspace ON money_activity(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_money_activity_entity ON money_activity(entity_type, entity_id);
