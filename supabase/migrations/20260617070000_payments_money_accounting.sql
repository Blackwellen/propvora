-- ============================================================================
-- 20260617070000_payments_money_accounting.sql
--
-- PAYMENTS / HOLDS / DISPUTES + MONEY + ACCOUNTING — production depth.
--
-- This migration EXTENDS the existing P5 escrow/payment substrate
-- (20260616090000_payments_escrow), the marketplace fee/commission/dispute
-- substrate (20260616010000 / 20260616030000), and the canonical double-entry
-- ledger. It adds the genuinely-missing pieces required to run real money flows:
--
--   1. Typed PAYMENT MODEL on escrow_payments (authorisation / delayed_capture /
--      platform_hold / connected_transfer / manual_invoice) + flow column.
--   2. DAMAGE / DEPOSIT HOLDS as first-class escrow holds (hold_type).
--   3. RELEASE-BLOCK ledger (payment_release_blocks) — every block evaluation is
--      recorded so a payout can never silently fail open.
--   4. UNIFIED DISPUTES — marketplace_disputes gains dispute_type/kind/priority/
--      payout_held/evidence_requested_at + an append-only dispute_actions audit
--      that covers stay / supplier / marketplace disputes.
--   5. FX RATES (fx_rates) for multi-currency money/accounting.
--   6. ACCOUNTING bridge: hold_ledger_entries + booking_revenue_entries
--      (append-only, immutable) feeding the journal patterns; fee-rule audit.
--
-- Conventions honoured:
--   * Money is INTEGER PENCE (bigint) everywhere new.
--   * Append-only ledgers get UPDATE/DELETE immutability triggers.
--   * Workspace-scoped + RLS (is_workspace_member); service-role bypasses RLS.
--   * Idempotent: IF NOT EXISTS / ADD COLUMN IF NOT EXISTS / DROP-then-CREATE
--     for policies and triggers so re-apply is safe.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. PAYMENT MODEL — typed columns on escrow_payments
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.escrow_payments
  ADD COLUMN IF NOT EXISTS payment_model text NOT NULL DEFAULT 'platform_hold',
  ADD COLUMN IF NOT EXISTS flow text,
  ADD COLUMN IF NOT EXISTS refundable_until timestamptz,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'escrow_payments_payment_model_chk'
  ) THEN
    ALTER TABLE public.escrow_payments
      ADD CONSTRAINT escrow_payments_payment_model_chk
      CHECK (payment_model IN (
        'authorisation','delayed_capture','platform_hold','connected_transfer','manual_invoice'
      ));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'escrow_payments_flow_chk'
  ) THEN
    ALTER TABLE public.escrow_payments
      ADD CONSTRAINT escrow_payments_flow_chk
      CHECK (flow IS NULL OR flow IN (
        'stay_booking','supplier_job','emergency_job','service_package','deposit','damage_hold'
      ));
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. DAMAGE / DEPOSIT HOLDS — hold_type on escrow_holds
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.escrow_holds
  ADD COLUMN IF NOT EXISTS hold_type text NOT NULL DEFAULT 'payment',
  ADD COLUMN IF NOT EXISTS workspace_id uuid,
  ADD COLUMN IF NOT EXISTS booking_id uuid,
  ADD COLUMN IF NOT EXISTS tenancy_id uuid,
  ADD COLUMN IF NOT EXISTS deposit_id uuid,
  ADD COLUMN IF NOT EXISTS reason text,
  ADD COLUMN IF NOT EXISTS deducted_pence bigint NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'escrow_holds_hold_type_chk'
  ) THEN
    ALTER TABLE public.escrow_holds
      ADD CONSTRAINT escrow_holds_hold_type_chk
      CHECK (hold_type IN ('payment','damage','deposit','security','retention'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_escrow_holds_workspace ON public.escrow_holds(workspace_id);
CREATE INDEX IF NOT EXISTS idx_escrow_holds_booking ON public.escrow_holds(booking_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 3. RELEASE-BLOCK LEDGER — every payout gate evaluation recorded
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.payment_release_blocks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL,
  payment_id    uuid,
  payout_id     uuid,
  transaction_id uuid,
  hold_id       uuid,
  -- the gate that fired
  block_code    text NOT NULL CHECK (block_code IN (
    'open_dispute','missing_evidence','insurance_invalid','licence_invalid',
    'sanctions','approval_missing','safety_issue','admin_hold','none'
  )),
  blocked       boolean NOT NULL DEFAULT true,
  detail        text,
  -- 'cleared' when a later evaluation removed the block; null while active
  cleared_at    timestamptz,
  evaluated_by  uuid,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_release_blocks_payment ON public.payment_release_blocks(payment_id);
CREATE INDEX IF NOT EXISTS idx_release_blocks_workspace ON public.payment_release_blocks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_release_blocks_active
  ON public.payment_release_blocks(payment_id) WHERE blocked AND cleared_at IS NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 4. UNIFIED DISPUTES — extend marketplace_disputes + append-only actions
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.marketplace_disputes
  ADD COLUMN IF NOT EXISTS dispute_type text NOT NULL DEFAULT 'marketplace',
  ADD COLUMN IF NOT EXISTS booking_id uuid,
  ADD COLUMN IF NOT EXISTS supplier_assignment_id uuid,
  ADD COLUMN IF NOT EXISTS payment_id uuid,
  ADD COLUMN IF NOT EXISTS amount_disputed_pence bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amount_refunded_pence bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payout_held boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS evidence_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS workspace_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'marketplace_disputes_type_chk'
  ) THEN
    ALTER TABLE public.marketplace_disputes
      ADD CONSTRAINT marketplace_disputes_type_chk
      CHECK (dispute_type IN ('stay','supplier','marketplace'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'marketplace_disputes_priority_chk'
  ) THEN
    ALTER TABLE public.marketplace_disputes
      ADD CONSTRAINT marketplace_disputes_priority_chk
      CHECK (priority IN ('low','normal','high','urgent'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_mp_disputes_type ON public.marketplace_disputes(dispute_type);
CREATE INDEX IF NOT EXISTS idx_mp_disputes_payment ON public.marketplace_disputes(payment_id);

-- Append-only dispute action audit (covers all dispute types).
CREATE TABLE IF NOT EXISTS public.dispute_actions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id    uuid NOT NULL,
  action        text NOT NULL CHECK (action IN (
    'opened','evidence_requested','evidence_submitted','payout_held','payout_released',
    'partial_refund','full_refund','settled','suspended','escalated','closed','note','assigned'
  )),
  actor_id      uuid,
  actor_role    text,
  amount_pence  bigint NOT NULL DEFAULT 0,
  detail        text,
  metadata      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dispute_actions_dispute ON public.dispute_actions(dispute_id, created_at);

-- ────────────────────────────────────────────────────────────────────────────
-- 5. FX RATES — multi-currency support for money/accounting
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.fx_rates (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency text NOT NULL,
  quote_currency text NOT NULL,
  -- rate * 1e6 stored as integer to avoid float drift; 1 base = rate_micros/1e6 quote
  rate_micros   bigint NOT NULL CHECK (rate_micros > 0),
  as_of         date NOT NULL DEFAULT CURRENT_DATE,
  source        text NOT NULL DEFAULT 'manual',
  workspace_id  uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (base_currency, quote_currency, as_of, workspace_id)
);

CREATE INDEX IF NOT EXISTS idx_fx_rates_pair ON public.fx_rates(base_currency, quote_currency, as_of DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- 6. ACCOUNTING BRIDGE — append-only hold + booking-revenue sub-ledgers
-- ────────────────────────────────────────────────────────────────────────────

-- Hold ledger: every hold/release/refund/deduct movement on a damage/deposit
-- hold, in pence. Feeds the journal (Dr/Cr against the deposit-liability account).
CREATE TABLE IF NOT EXISTS public.hold_ledger_entries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL,
  hold_id       uuid,
  deposit_id    uuid,
  booking_id    uuid,
  entry_type    text NOT NULL CHECK (entry_type IN (
    'hold','release','refund','deduct','top_up','adjustment'
  )),
  amount_pence  bigint NOT NULL,
  currency      text NOT NULL DEFAULT 'GBP',
  journal_entry_id uuid,
  memo          text,
  created_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hold_ledger_workspace ON public.hold_ledger_entries(workspace_id, created_at);
CREATE INDEX IF NOT EXISTS idx_hold_ledger_hold ON public.hold_ledger_entries(hold_id);

-- Booking revenue ledger: collected → deferred → recognised lifecycle in pence.
CREATE TABLE IF NOT EXISTS public.booking_revenue_entries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL,
  booking_id    uuid,
  payment_id    uuid,
  entry_type    text NOT NULL CHECK (entry_type IN (
    'collected','deferred','recognised','refunded','fee','payout','commission'
  )),
  amount_pence  bigint NOT NULL,
  currency      text NOT NULL DEFAULT 'GBP',
  journal_entry_id uuid,
  recognised_on date,
  memo          text,
  created_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_rev_workspace ON public.booking_revenue_entries(workspace_id, created_at);
CREATE INDEX IF NOT EXISTS idx_booking_rev_booking ON public.booking_revenue_entries(booking_id);

-- Fee-rule change audit (admin fee editor writes here on every CRUD).
CREATE TABLE IF NOT EXISTS public.fee_rule_audit (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_rule_id  uuid,
  action       text NOT NULL CHECK (action IN ('created','updated','archived','restored')),
  actor_id     uuid,
  before       jsonb,
  after        jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fee_rule_audit_rule ON public.fee_rule_audit(fee_rule_id, created_at);

-- ────────────────────────────────────────────────────────────────────────────
-- 7. IMMUTABILITY TRIGGERS for the new append-only ledgers
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.pma_ledger_immutable()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Ledger entries are append-only (%) — corrections must be new reversing entries.', TG_TABLE_NAME;
END $$;

DROP TRIGGER IF EXISTS trg_hold_ledger_immutable ON public.hold_ledger_entries;
CREATE TRIGGER trg_hold_ledger_immutable
  BEFORE UPDATE OR DELETE ON public.hold_ledger_entries
  FOR EACH ROW EXECUTE FUNCTION public.pma_ledger_immutable();

DROP TRIGGER IF EXISTS trg_booking_rev_immutable ON public.booking_revenue_entries;
CREATE TRIGGER trg_booking_rev_immutable
  BEFORE UPDATE OR DELETE ON public.booking_revenue_entries
  FOR EACH ROW EXECUTE FUNCTION public.pma_ledger_immutable();

DROP TRIGGER IF EXISTS trg_dispute_actions_immutable ON public.dispute_actions;
CREATE TRIGGER trg_dispute_actions_immutable
  BEFORE UPDATE OR DELETE ON public.dispute_actions
  FOR EACH ROW EXECUTE FUNCTION public.pma_ledger_immutable();

-- ────────────────────────────────────────────────────────────────────────────
-- 8. RLS — workspace-scoped reads; mutations via service-role (webhook/engine)
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.payment_release_blocks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_actions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fx_rates                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hold_ledger_entries     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_revenue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_rule_audit          ENABLE ROW LEVEL SECURITY;

-- payment_release_blocks: members of the owning workspace may read.
DROP POLICY IF EXISTS prb_read ON public.payment_release_blocks;
CREATE POLICY prb_read ON public.payment_release_blocks
  FOR SELECT USING (public.is_workspace_member(workspace_id));

-- hold_ledger_entries / booking_revenue_entries: workspace members read.
DROP POLICY IF EXISTS hle_read ON public.hold_ledger_entries;
CREATE POLICY hle_read ON public.hold_ledger_entries
  FOR SELECT USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS bre_read ON public.booking_revenue_entries;
CREATE POLICY bre_read ON public.booking_revenue_entries
  FOR SELECT USING (public.is_workspace_member(workspace_id));

-- dispute_actions: readable when a member can see the parent dispute.
DROP POLICY IF EXISTS da_read ON public.dispute_actions;
CREATE POLICY da_read ON public.dispute_actions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_disputes d
      WHERE d.id = dispute_actions.dispute_id
        AND (
          public.is_workspace_member(d.raised_by_workspace_id)
          OR (d.against_workspace_id IS NOT NULL AND public.is_workspace_member(d.against_workspace_id))
        )
    )
  );

-- fx_rates: global rows (workspace_id null) are readable by everyone; workspace
-- rows only by members.
DROP POLICY IF EXISTS fx_read ON public.fx_rates;
CREATE POLICY fx_read ON public.fx_rates
  FOR SELECT USING (workspace_id IS NULL OR public.is_workspace_member(workspace_id));

-- workspace members may insert their own workspace-scoped fx overrides.
DROP POLICY IF EXISTS fx_write ON public.fx_rates;
CREATE POLICY fx_write ON public.fx_rates
  FOR INSERT WITH CHECK (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id));

-- fee_rule_audit: platform-admin only (service-role bypasses RLS); deny by default.
DROP POLICY IF EXISTS fra_read ON public.fee_rule_audit;
CREATE POLICY fra_read ON public.fee_rule_audit
  FOR SELECT USING (false);

-- ────────────────────────────────────────────────────────────────────────────
-- 9. SEED — minimal default GBP→GBP identity + a few demo FX pairs (global)
-- ────────────────────────────────────────────────────────────────────────────

INSERT INTO public.fx_rates (base_currency, quote_currency, rate_micros, as_of, source, workspace_id)
VALUES
  ('GBP','GBP', 1000000, CURRENT_DATE, 'system', NULL),
  ('GBP','EUR', 1170000, CURRENT_DATE, 'system', NULL),
  ('GBP','USD', 1270000, CURRENT_DATE, 'system', NULL),
  ('EUR','GBP',  855000, CURRENT_DATE, 'system', NULL),
  ('USD','GBP',  787000, CURRENT_DATE, 'system', NULL)
ON CONFLICT (base_currency, quote_currency, as_of, workspace_id) DO NOTHING;

-- ────────────────────────────────────────────────────────────────────────────
-- 10. Helper: convert pence between currencies using the latest fx_rate.
-- Returns NULL when no rate exists. Pure SQL, SECURITY INVOKER.
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.fx_convert_pence(
  p_amount_pence bigint,
  p_from text,
  p_to text,
  p_as_of date DEFAULT CURRENT_DATE
) RETURNS bigint LANGUAGE sql STABLE AS $$
  SELECT CASE
    WHEN upper(p_from) = upper(p_to) THEN p_amount_pence
    ELSE (
      SELECT (p_amount_pence * r.rate_micros) / 1000000
      FROM public.fx_rates r
      WHERE r.base_currency = upper(p_from)
        AND r.quote_currency = upper(p_to)
        AND r.as_of <= p_as_of
      ORDER BY r.as_of DESC
      LIMIT 1
    )
  END;
$$;

COMMENT ON TABLE public.payment_release_blocks IS 'Append-style record of every payout release-block evaluation. NEVER fail open: a payout is allowed only when no active (blocked, cleared_at null) row exists.';
COMMENT ON TABLE public.dispute_actions IS 'Append-only audit of unified dispute admin actions (stay/supplier/marketplace).';
COMMENT ON TABLE public.hold_ledger_entries IS 'Append-only damage/deposit hold sub-ledger feeding the double-entry journal.';
COMMENT ON TABLE public.booking_revenue_entries IS 'Append-only booking revenue lifecycle (collected/deferred/recognised) sub-ledger.';

-- ────────────────────────────────────────────────────────────────────────────
-- 11. EXTENDED CHART OF ACCOUNTS — the money/payments journal patterns need a
-- handful of accounts beyond the base seed (deferred revenue, escrow/payout
-- clearing, commission income, provider/processor fees, deposits-payable). We
-- add them to the seed function AND backfill every existing workspace so the
-- booking / supplier / hold journals always post against real accounts.
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.seed_money_accounts(p_workspace uuid)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE rec record; v_added integer := 0;
BEGIN
  FOR rec IN
    SELECT * FROM (VALUES
      ('1030','Escrow / Funds Held (Clearing)',  'asset',     'debit'),
      ('1040','Payouts Clearing',                'asset',     'debit'),
      ('2110','Damage / Security Holds',          'liability', 'credit'),
      ('2120','Booking Deposits Payable',         'liability', 'credit'),
      ('2400','Deferred Booking Revenue',         'liability', 'credit'),
      ('2500','Supplier Payable',                 'liability', 'credit'),
      ('4300','Booking Revenue',                  'income',    'credit'),
      ('4400','Marketplace Commission Income',    'income',    'credit'),
      ('6200','Payment Processing Fees',          'expense',   'debit'),
      ('6300','Provider / Pass-through Fees',     'expense',   'debit')
    ) AS t(code, name, type, normal_side)
  LOOP
    INSERT INTO public.ledger_accounts (workspace_id, code, name, type, normal_side, is_system)
    VALUES (p_workspace, rec.code, rec.name, rec.type, rec.normal_side, true)
    ON CONFLICT (workspace_id, code) DO NOTHING;
    v_added := v_added + 1;
  END LOOP;
  RETURN v_added;
END;
$$;

DO $$
DECLARE w record;
BEGIN
  FOR w IN SELECT id FROM public.workspaces LOOP
    PERFORM public.seed_money_accounts(w.id);
  END LOOP;
END $$;
