-- ============================================================
-- accounting_seed.sql
-- Demo seed data for the Propvora accounting module
-- Scoped to a demo workspace - replace DEMO_WORKSPACE_ID with actual UUID
-- ============================================================

-- NOTE: This seed uses a placeholder workspace_id.
-- In production, replace 'demo-workspace-id-here' with the actual UUID.
-- You can run: SELECT id FROM workspaces LIMIT 1;

DO $$
DECLARE
  ws_id UUID;
BEGIN
  -- Get first workspace or skip
  SELECT id INTO ws_id FROM workspaces LIMIT 1;
  IF ws_id IS NULL THEN RETURN; END IF;

  -- Insert accounting_accounts (skip if already exist)
  INSERT INTO accounting_accounts (workspace_id, code, name, account_type, subcategory, opening_balance, current_balance, property_scope, status, currency)
  VALUES
    (ws_id, '1000', 'Cash at Bank', 'Assets', 'Current Assets', 215000, 312450, 'Propvora Estates', 'Active', 'GBP'),
    (ws_id, '1100', 'Petty Cash', 'Assets', 'Current Assets', 1000, 650, 'Propvora Estates', 'Active', 'GBP'),
    (ws_id, '1200', 'Accounts Receivable', 'Assets', 'Current Assets', 85000, 142380, 'All Portfolios', 'Active', 'GBP'),
    (ws_id, '1400', 'Prepayments', 'Assets', 'Current Assets', 12000, 18720, 'Propvora Estates', 'Active', 'GBP'),
    (ws_id, '1600', 'Property, Plant & Equipment', 'Assets', 'Fixed Assets', 3800000, 4356150, 'All Portfolios', 'Active', 'GBP'),
    (ws_id, '1700', 'Accumulated Depreciation', 'Assets', 'Fixed Assets', -698000, -937000, 'All Portfolios', 'Active', 'GBP'),
    (ws_id, '2000', 'Accounts Payable', 'Liabilities', 'Current Liabilities', 120000, 156230, 'All Portfolios', 'Active', 'GBP'),
    (ws_id, '2100', 'Accrued Expenses', 'Liabilities', 'Current Liabilities', 18000, 22410, 'Propvora Estates', 'Active', 'GBP'),
    (ws_id, '2200', 'Tenant Deposits', 'Liabilities', 'Current Liabilities', 520000, 612880, 'Propvora Estates', 'Active', 'GBP'),
    (ws_id, '2500', 'Bank Loans', 'Liabilities', 'Non-Current Liabilities', 992000, 1084000, 'All Portfolios', 'Active', 'GBP'),
    (ws_id, '3000', 'Owner''s Equity', 'Equity', 'Capital', 2000000, 2450830, 'All Portfolios', 'Active', 'GBP'),
    (ws_id, '3100', 'Retained Earnings', 'Equity', 'Reserves', 565000, 565000, 'All Portfolios', 'Active', 'GBP'),
    (ws_id, '4000', 'Rental Income', 'Income', 'Operating Income', 0, 980450, 'All Portfolios', 'Active', 'GBP'),
    (ws_id, '4100', 'Service Charge Income', 'Income', 'Operating Income', 0, 145230, 'All Portfolios', 'Active', 'GBP'),
    (ws_id, '4600', 'Late Payment Fees', 'Income', 'Other Income', 0, 28700, 'All Portfolios', 'Active', 'GBP'),
    (ws_id, '4700', 'Other Income', 'Income', 'Other Income', 0, 86000, 'All Portfolios', 'Active', 'GBP'),
    (ws_id, '5000', 'Utilities Expense', 'Expenses', 'Operating', 0, 124800, 'All Portfolios', 'Active', 'GBP'),
    (ws_id, '6000', 'Repairs & Maintenance', 'Expenses', 'Operating', 0, 187400, 'All Portfolios', 'Active', 'GBP'),
    (ws_id, '6100', 'Management Fees', 'Expenses', 'Operating', 0, 98200, 'All Portfolios', 'Active', 'GBP'),
    (ws_id, '7000', 'Marketing Expenses', 'Expenses', 'Operating', 0, 42380, 'All Portfolios', 'Active', 'GBP'),
    (ws_id, '8000', 'Finance Costs', 'Expenses', 'Finance', 0, 419360, 'All Portfolios', 'Active', 'GBP')
  ON CONFLICT (workspace_id, code) DO NOTHING;

  -- Insert MTD connection
  INSERT INTO accounting_mtd_connections (workspace_id, utr_id, agent_id, connected_status, last_synced_at)
  VALUES (ws_id, '1234567890', 'XA1T12345678', 'connected', now())
  ON CONFLICT DO NOTHING;

  -- Insert MTD returns
  INSERT INTO accounting_mtd_returns (workspace_id, quarter, period_start, period_end, income, expenses, estimated_tax, status)
  VALUES
    (ws_id, 'Q1', '2026-04-01', '2026-06-30', 18950, 11240, 1880, 'in_progress'),
    (ws_id, 'Q2', '2026-07-01', '2026-09-30', 16730, 10620, 1620, 'not_started'),
    (ws_id, 'Q3', '2026-10-01', '2026-12-31', 17810, 11470, 1930, 'not_started'),
    (ws_id, 'Q4', '2027-01-01', '2027-03-31', 19710, 12380, 2150, 'submitted')
  ON CONFLICT DO NOTHING;

  -- Insert forecast scenario
  INSERT INTO accounting_forecast_scenarios (workspace_id, name, based_on, period_months, currency, description, is_base)
  VALUES
    (ws_id, 'Base Plan', NULL, 12, 'GBP', 'Base forecast for FY 2026/27', true),
    (ws_id, 'Upside Case – Strong Leasing', 'Base Plan', 12, 'GBP', 'Assumes stronger leasing velocity and rental growth above market', false)
  ON CONFLICT DO NOTHING;

  -- Insert client accounts
  INSERT INTO accounting_client_accounts (workspace_id, client_name, account_code, balance, ringfenced, health)
  VALUES
    (ws_id, 'Maple Avenue Ltd', 'CLI-001', 238450.12, true, 'Excellent'),
    (ws_id, 'Oakwood House LLP', 'CLI-002', 184210.75, true, 'Good'),
    (ws_id, 'Riverside Court Ltd', 'CLI-003', 127890.40, true, 'Good'),
    (ws_id, 'Springfield Villas Ltd', 'CLI-004', 96320.18, true, 'Fair'),
    (ws_id, 'Cedar House Ltd', 'CLI-005', 72410.92, true, 'Fair'),
    (ws_id, 'Willow Place Ltd', 'CLI-006', 56276.00, true, 'Needs Attention'),
    (ws_id, 'Bramley Place Ltd', 'CLI-007', 34001.28, true, 'Needs Attention')
  ON CONFLICT DO NOTHING;
END $$;
