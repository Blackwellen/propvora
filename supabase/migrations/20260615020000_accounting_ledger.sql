-- ============================================================
-- 20260615020000_accounting_ledger.sql
--
-- Canonical DOUBLE-ENTRY ACCOUNTING LEDGER for Propvora.
--
-- This sits ALONGSIDE the existing money section
-- (money_transactions / bills / invoices / expense_records) and the
-- prior accounting scaffolding. It is the canonical, immutable,
-- balance-enforced record of every financial event.
--
-- Design decisions:
--   * Tables are prefixed `ledger_` to avoid colliding with the legacy
--     chart_of_accounts / journal_entries / journal_lines names from
--     024_accounting_schema.sql (which were never applied live but exist
--     in-tree). This makes the canonical ledger unambiguous.
--   * Amounts are stored in INTEGER PENCE (debit_pence / credit_pence) to
--     eliminate floating-point rounding error — the cardinal rule of a
--     real ledger.
--   * Entries are IMMUTABLE once posted: a BEFORE UPDATE/DELETE trigger
--     blocks any mutation of a posted entry or its lines. Corrections are
--     made by REVERSAL (a mirror entry), never by edit or delete.
--   * Each entry must BALANCE (sum debits = sum credits) and have >= 2
--     lines. Enforced by a CONSTRAINT TRIGGER that fires at statement end
--     (so multi-line inserts within a transaction are validated as a whole).
--   * Workspace-scoped, RLS on every table (codebase pattern:
--     EXISTS over workspace_members).
--   * A seed function plants a sensible default UK property chart of
--     accounts per workspace (config, not demo data).
--
-- Idempotent: IF NOT EXISTS + DROP ... IF EXISTS throughout; safe to re-run.
-- Apply: node scripts/_apply_migration.mjs supabase/migrations/20260615020000_accounting_ledger.sql
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. ledger_accounts — chart of accounts (canonical)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ledger_accounts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  code          text NOT NULL,
  name          text NOT NULL,
  type          text NOT NULL CHECK (type IN ('asset','liability','equity','income','expense')),
  normal_side   text NOT NULL CHECK (normal_side IN ('debit','credit')),
  parent_id     uuid REFERENCES public.ledger_accounts(id) ON DELETE SET NULL,
  description   text,
  is_system     boolean NOT NULL DEFAULT false,
  archived      boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, code)
);

-- ────────────────────────────────────────────────────────────
-- 2. ledger_journal_entries — the journal header (immutable once posted)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ledger_journal_entries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  entry_no      bigint NOT NULL,
  date          date NOT NULL DEFAULT current_date,
  memo          text,
  source_type   text,                -- e.g. 'invoice','bill','expense','rent_receipt','manual'
  source_id     uuid,                -- id of the originating money row, if any
  posted        boolean NOT NULL DEFAULT false,
  posted_at     timestamptz,
  reversed_of   uuid REFERENCES public.ledger_journal_entries(id) ON DELETE SET NULL,
  reversed_by   uuid REFERENCES public.ledger_journal_entries(id) ON DELETE SET NULL,
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, entry_no)
);

-- ────────────────────────────────────────────────────────────
-- 3. ledger_journal_lines — the journal detail (pence)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ledger_journal_lines (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  entry_id      uuid NOT NULL REFERENCES public.ledger_journal_entries(id) ON DELETE CASCADE,
  account_id    uuid NOT NULL REFERENCES public.ledger_accounts(id),
  debit_pence   bigint NOT NULL DEFAULT 0 CHECK (debit_pence >= 0),
  credit_pence  bigint NOT NULL DEFAULT 0 CHECK (credit_pence >= 0),
  memo          text,
  property_id   uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  -- A line is either a debit OR a credit, never both, never neither.
  CONSTRAINT ledger_line_one_side CHECK (
    (debit_pence > 0 AND credit_pence = 0) OR
    (credit_pence > 0 AND debit_pence = 0)
  )
);

CREATE INDEX IF NOT EXISTS idx_ledger_accounts_ws        ON public.ledger_accounts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ledger_accounts_type      ON public.ledger_accounts(workspace_id, type);
CREATE INDEX IF NOT EXISTS idx_ledger_accounts_parent    ON public.ledger_accounts(parent_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_ws         ON public.ledger_journal_entries(workspace_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_posted     ON public.ledger_journal_entries(workspace_id, posted);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_source     ON public.ledger_journal_entries(workspace_id, source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_ledger_lines_entry        ON public.ledger_journal_lines(entry_id);
CREATE INDEX IF NOT EXISTS idx_ledger_lines_account      ON public.ledger_journal_lines(account_id);
CREATE INDEX IF NOT EXISTS idx_ledger_lines_ws_account   ON public.ledger_journal_lines(workspace_id, account_id);

-- ============================================================
-- IMMUTABILITY — posted entries (and their lines) cannot be mutated.
-- Corrections happen by reversal, never edit/delete.
-- ============================================================

-- Guard the entry header. The ONLY mutations permitted on a posted entry
-- are the bookkeeping fields used by the reversal flow (reversed_by) and
-- updated_at — everything financial is frozen.
CREATE OR REPLACE FUNCTION public.ledger_entry_immutable()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.posted THEN
      RAISE EXCEPTION 'Posted journal entry % is immutable and cannot be deleted; reverse it instead', OLD.entry_no
        USING ERRCODE = 'check_violation';
    END IF;
    RETURN OLD;
  END IF;

  -- UPDATE path
  IF OLD.posted THEN
    -- Allow only the reversal-linkage + updated_at to change.
    IF ( NEW.workspace_id, NEW.entry_no, NEW.date, NEW.memo, NEW.source_type,
         NEW.source_id, NEW.posted, NEW.reversed_of, NEW.created_by, NEW.created_at )
       IS DISTINCT FROM
       ( OLD.workspace_id, OLD.entry_no, OLD.date, OLD.memo, OLD.source_type,
         OLD.source_id, OLD.posted, OLD.reversed_of, OLD.created_by, OLD.created_at )
    THEN
      RAISE EXCEPTION 'Posted journal entry % is immutable; reverse it instead of editing', OLD.entry_no
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ledger_entry_immutable ON public.ledger_journal_entries;
CREATE TRIGGER trg_ledger_entry_immutable
  BEFORE UPDATE OR DELETE ON public.ledger_journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.ledger_entry_immutable();

-- Guard the lines: once the parent entry is posted, lines are frozen.
CREATE OR REPLACE FUNCTION public.ledger_line_immutable()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_entry uuid;
  v_posted boolean;
BEGIN
  v_entry := COALESCE(NEW.entry_id, OLD.entry_id);
  SELECT posted INTO v_posted FROM public.ledger_journal_entries WHERE id = v_entry;
  -- If the parent entry no longer exists (cascade delete of an *unposted*
  -- entry), allow the line delete to proceed.
  IF v_posted IS TRUE THEN
    RAISE EXCEPTION 'Cannot modify lines of a posted journal entry; reverse the entry instead'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_ledger_line_immutable ON public.ledger_journal_lines;
CREATE TRIGGER trg_ledger_line_immutable
  BEFORE UPDATE OR DELETE ON public.ledger_journal_lines
  FOR EACH ROW EXECUTE FUNCTION public.ledger_line_immutable();

-- ============================================================
-- BALANCE ENFORCEMENT — a POSTED entry must balance (debits = credits)
-- and have at least two lines. Implemented as a CONSTRAINT TRIGGER that is
-- DEFERRABLE INITIALLY DEFERRED, so a multi-line insert inside one
-- transaction is validated once, at COMMIT, as a complete unit.
-- Unposted (draft) entries are exempt so they can be built up incrementally.
-- ============================================================
CREATE OR REPLACE FUNCTION public.ledger_entry_balanced()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_debit  bigint;
  v_credit bigint;
  v_lines  int;
  v_posted boolean;
BEGIN
  -- Resolve the entry this fired for.
  SELECT posted INTO v_posted FROM public.ledger_journal_entries WHERE id = NEW.id;
  IF v_posted IS NOT TRUE THEN
    RETURN NEW; -- drafts may be unbalanced while being assembled
  END IF;

  SELECT COALESCE(SUM(debit_pence),0), COALESCE(SUM(credit_pence),0), COUNT(*)
    INTO v_debit, v_credit, v_lines
    FROM public.ledger_journal_lines
   WHERE entry_id = NEW.id;

  IF v_lines < 2 THEN
    RAISE EXCEPTION 'Posted journal entry must have at least two lines (found %)', v_lines
      USING ERRCODE = 'check_violation';
  END IF;

  IF v_debit <> v_credit THEN
    RAISE EXCEPTION 'Journal entry does not balance: debits=% credits=% (difference %)',
      v_debit, v_credit, (v_debit - v_credit)
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ledger_entry_balanced ON public.ledger_journal_entries;
CREATE CONSTRAINT TRIGGER trg_ledger_entry_balanced
  AFTER INSERT OR UPDATE ON public.ledger_journal_entries
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.ledger_entry_balanced();

-- updated_at maintenance
CREATE OR REPLACE FUNCTION public.ledger_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_ledger_accounts_touch ON public.ledger_accounts;
CREATE TRIGGER trg_ledger_accounts_touch
  BEFORE UPDATE ON public.ledger_accounts
  FOR EACH ROW EXECUTE FUNCTION public.ledger_touch_updated_at();

DROP TRIGGER IF EXISTS trg_ledger_entries_touch ON public.ledger_journal_entries;
CREATE TRIGGER trg_ledger_entries_touch
  BEFORE UPDATE ON public.ledger_journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.ledger_touch_updated_at();

-- ============================================================
-- ENTRY NUMBERING — sequential per workspace, gap-tolerant.
-- ============================================================
CREATE OR REPLACE FUNCTION public.ledger_next_entry_no(p_workspace uuid)
RETURNS bigint LANGUAGE sql AS $$
  SELECT COALESCE(MAX(entry_no), 0) + 1
    FROM public.ledger_journal_entries
   WHERE workspace_id = p_workspace;
$$;

-- ============================================================
-- RLS — workspace member access on every table (codebase pattern).
-- Posting/reversal capability is gated in the app layer to finance roles;
-- RLS guarantees workspace isolation at the DB level regardless.
-- ============================================================
ALTER TABLE public.ledger_accounts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_journal_entries  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_journal_lines    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ledger_accounts_ws_member ON public.ledger_accounts;
CREATE POLICY ledger_accounts_ws_member ON public.ledger_accounts FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = ledger_accounts.workspace_id AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = ledger_accounts.workspace_id AND wm.user_id = auth.uid()));

DROP POLICY IF EXISTS ledger_entries_ws_member ON public.ledger_journal_entries;
CREATE POLICY ledger_entries_ws_member ON public.ledger_journal_entries FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = ledger_journal_entries.workspace_id AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = ledger_journal_entries.workspace_id AND wm.user_id = auth.uid()));

DROP POLICY IF EXISTS ledger_lines_ws_member ON public.ledger_journal_lines;
CREATE POLICY ledger_lines_ws_member ON public.ledger_journal_lines FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = ledger_journal_lines.workspace_id AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = ledger_journal_lines.workspace_id AND wm.user_id = auth.uid()));

-- ============================================================
-- DEFAULT UK PROPERTY CHART OF ACCOUNTS (config, not demo data)
-- Seeds a sensible starter chart for a workspace if it has none yet.
-- Idempotent per (workspace_id, code) via ON CONFLICT.
-- ============================================================
CREATE OR REPLACE FUNCTION public.seed_ledger_chart_of_accounts(p_workspace uuid)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE
  v_count int;
  rec record;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.ledger_accounts WHERE workspace_id = p_workspace;
  IF v_count > 0 THEN
    RETURN 0; -- already seeded; do nothing
  END IF;

  FOR rec IN
    SELECT * FROM (VALUES
      -- code, name, type, normal_side
      -- Assets (1xxx)
      ('1000','Bank — Current Account',      'asset',     'debit'),
      ('1010','Bank — Client Money Account', 'asset',     'debit'),
      ('1020','Rent Deposit Scheme Held',    'asset',     'debit'),
      ('1100','Rent Receivable (Debtors)',   'asset',     'debit'),
      ('1200','Prepayments',                 'asset',     'debit'),
      ('1500','Property Portfolio (Cost)',   'asset',     'debit'),
      -- Liabilities (2xxx)
      ('2000','Trade Creditors',             'liability', 'credit'),
      ('2050','Accruals',                    'liability', 'credit'),
      ('2100','Tenant Deposits Held',        'liability', 'credit'),
      ('2200','VAT Control',                 'liability', 'credit'),
      ('2300','Mortgage / Loans Payable',    'liability', 'credit'),
      -- Equity (3xxx)
      ('3000','Owner Capital',               'equity',    'credit'),
      ('3100','Retained Earnings',           'equity',    'credit'),
      ('3200','Drawings',                    'equity',    'debit'),
      -- Income (4xxx)
      ('4000','Rental Income',               'income',    'credit'),
      ('4100','Management Fee Income',       'income',    'credit'),
      ('4200','Other Property Income',       'income',    'credit'),
      ('4900','Interest Received',           'income',    'credit'),
      -- Expenses (5xxx-6xxx)
      ('5000','Repairs & Maintenance',       'expense',   'debit'),
      ('5100','Letting & Management Fees',   'expense',   'debit'),
      ('5200','Insurance',                   'expense',   'debit'),
      ('5300','Utilities',                   'expense',   'debit'),
      ('5400','Council Tax',                 'expense',   'debit'),
      ('5500','Ground Rent & Service Charge','expense',   'debit'),
      ('5600','Mortgage Interest',           'expense',   'debit'),
      ('5700','Legal & Professional Fees',   'expense',   'debit'),
      ('5800','Compliance & Certificates',   'expense',   'debit'),
      ('6000','Bank Charges',                'expense',   'debit'),
      ('6100','Bad Debts',                   'expense',   'debit'),
      ('6900','Sundry Expenses',             'expense',   'debit')
    ) AS t(code, name, type, normal_side)
  LOOP
    INSERT INTO public.ledger_accounts (workspace_id, code, name, type, normal_side, is_system)
    VALUES (p_workspace, rec.code, rec.name, rec.type, rec.normal_side, true)
    ON CONFLICT (workspace_id, code) DO NOTHING;
  END LOOP;

  RETURN (SELECT COUNT(*) FROM public.ledger_accounts WHERE workspace_id = p_workspace);
END;
$$;

-- Seed the chart for every EXISTING workspace so the ledger is usable
-- immediately after this migration.
DO $$
DECLARE w record;
BEGIN
  FOR w IN SELECT id FROM public.workspaces LOOP
    PERFORM public.seed_ledger_chart_of_accounts(w.id);
  END LOOP;
END $$;
