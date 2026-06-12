-- ============================================================
-- 024_accounting_schema.sql
-- Accounting module: chart of accounts, double-entry journal,
-- currency exchange rates, and workspace currency settings.
-- ============================================================

-- chart_of_accounts
CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  parent_id       UUID REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
  account_code    TEXT NOT NULL,
  account_name    TEXT NOT NULL,
  account_type    TEXT NOT NULL CHECK (account_type IN ('asset','liability','equity','income','expense','contra')),
  currency        TEXT NOT NULL DEFAULT 'GBP',
  is_system       BOOLEAN NOT NULL DEFAULT false,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (workspace_id, account_code)
);

-- journal_entries
CREATE TABLE IF NOT EXISTS journal_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  entry_number    TEXT,
  entry_date      DATE NOT NULL,
  description     TEXT NOT NULL,
  source_type     TEXT,
  source_id       UUID,
  property_id     UUID REFERENCES properties(id) ON DELETE SET NULL,
  is_posted       BOOLEAN NOT NULL DEFAULT false,
  is_reversed     BOOLEAN NOT NULL DEFAULT false,
  reversal_of     UUID REFERENCES journal_entries(id) ON DELETE SET NULL,
  created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- journal_lines
CREATE TABLE IF NOT EXISTS journal_lines (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id       UUID NOT NULL REFERENCES chart_of_accounts(id),
  debit            NUMERIC(14,2) NOT NULL DEFAULT 0,
  credit           NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency         TEXT NOT NULL DEFAULT 'GBP',
  description      TEXT,
  property_id      UUID REFERENCES properties(id) ON DELETE SET NULL,
  unit_id          UUID,
  tenancy_id       UUID,
  contact_id       UUID REFERENCES contacts(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- currency_exchange_rates
CREATE TABLE IF NOT EXISTS currency_exchange_rates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency   TEXT NOT NULL DEFAULT 'GBP',
  target_currency TEXT NOT NULL,
  rate            NUMERIC(18,8) NOT NULL,
  rate_date       DATE NOT NULL,
  source          TEXT NOT NULL DEFAULT 'open.er-api.com',
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (base_currency, target_currency, rate_date)
);

-- workspace_currencies
CREATE TABLE IF NOT EXISTS workspace_currencies (
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  currency_code   TEXT NOT NULL,
  is_base         BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (workspace_id, currency_code)
);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE chart_of_accounts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries         ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_lines           ENABLE ROW LEVEL SECURITY;
ALTER TABLE currency_exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_currencies    ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'chart_of_accounts','journal_entries','journal_lines',
    'currency_exchange_rates'
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

-- workspace_currencies uses direct workspace_id match
CREATE POLICY "workspace members read workspace_currencies"
  ON workspace_currencies FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "workspace members manage workspace_currencies"
  ON workspace_currencies FOR ALL
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

-- chart_of_accounts has no updated_at; journal_entries and journal_lines are append-only.
-- No updated_at triggers required for this migration.

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_coa_workspace         ON chart_of_accounts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_coa_account_type      ON chart_of_accounts(workspace_id, account_type);
CREATE INDEX IF NOT EXISTS idx_coa_parent            ON chart_of_accounts(parent_id);
CREATE INDEX IF NOT EXISTS idx_coa_active            ON chart_of_accounts(workspace_id, is_active);

CREATE INDEX IF NOT EXISTS idx_journal_entries_workspace   ON journal_entries(workspace_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_posted      ON journal_entries(workspace_id, is_posted);
CREATE INDEX IF NOT EXISTS idx_journal_entries_property    ON journal_entries(property_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_source      ON journal_entries(source_type, source_id);

CREATE INDEX IF NOT EXISTS idx_journal_lines_workspace     ON journal_lines(workspace_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_entry         ON journal_lines(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_account       ON journal_lines(account_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_property      ON journal_lines(property_id);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_date         ON currency_exchange_rates(base_currency, target_currency, rate_date DESC);

CREATE INDEX IF NOT EXISTS idx_workspace_currencies_ws     ON workspace_currencies(workspace_id);
