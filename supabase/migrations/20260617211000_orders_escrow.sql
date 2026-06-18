-- ============================================================================
-- 20260617211000_orders_escrow.sql
--
-- PROPERTY-MANAGER  Work > Orders  +  Money > Escrow Management.
--
-- This migration is ADDITIVE and IDEMPOTENT. It REUSES the existing
-- two-sided supplier-marketplace substrate created by earlier supplier-workspace
-- migrations rather than duplicating it. From the PM (operator) side an "order"
-- is a `supplier_job_assignments` row whose `operator_workspace_id` is the PM
-- workspace; a "quote" is a `supplier_marketplace_quotes` row; evidence lives in
-- `supplier_job_evidence`; the activity timeline lives in `supplier_job_events`;
-- disputes live in `supplier_disputes`; the held money lives in `escrow_payments`
-- / `escrow_holds` / `payouts` / `payout_ledger`.
--
-- REUSED (NOT redefined) tables:
--   supplier_job_assignments, supplier_marketplace_quotes, supplier_connections,
--   supplier_job_evidence, supplier_job_events, supplier_disputes,
--   escrow_payments, escrow_holds, payouts, payout_ledger.
--
-- CREATED (genuinely missing) tables — all CREATE TABLE IF NOT EXISTS:
--   supplier_quote_comparisons       — saved RFQ comparison + recommendation
--   supplier_order_release_conditions— per-order release-rule checklist
--   supplier_order_payout_splits     — how a held escrow amount splits on release
--   supplier_order_escrow_events     — append-only escrow state-machine audit
--
-- A few additive columns are ADDed to reused tables to carry PM-side order/escrow
-- metadata WITHOUT breaking existing rows (all ADD COLUMN IF NOT EXISTS, nullable).
--
-- ESCROW STATE MACHINE (stored in supplier_order_escrow_events.to_state and
-- mirrored onto escrow_payments via an additive `escrow_state` column):
--   created → funding_pending → funded → held → evidence_pending →
--   review_pending → ready_to_release → partially_released → released →
--   disputed → refunded → cancelled → failed
--
-- RLS: every NEW table enables RLS with a workspace-membership policy resolved
-- through the parent assignment/payment's operator_workspace_id against the REAL
-- public.workspace_members(workspace_id,user_id) table — the exact pattern used
-- by 20260616090000_payments_escrow.sql. Fund release is additionally gated in
-- the app to finance/admin; the DB grants workspace-member access and the app
-- narrows by role + writes an audit row to supplier_order_escrow_events.
-- ============================================================================

-- ── 0. Additive columns on REUSED tables (nullable, non-breaking) ────────────

-- supplier_job_assignments → PM order metadata
ALTER TABLE public.supplier_job_assignments
  ADD COLUMN IF NOT EXISTS order_ref        text,
  ADD COLUMN IF NOT EXISTS order_type       text,
  ADD COLUMN IF NOT EXISTS property_id      uuid,
  ADD COLUMN IF NOT EXISTS property_label   text,
  ADD COLUMN IF NOT EXISTS escrow_payment_id uuid,
  ADD COLUMN IF NOT EXISTS milestone_status text,
  ADD COLUMN IF NOT EXISTS evidence_status  text,
  ADD COLUMN IF NOT EXISTS sla_status       text,
  ADD COLUMN IF NOT EXISTS risk_level       text,
  ADD COLUMN IF NOT EXISTS rating           smallint;

-- supplier_marketplace_quotes → RFQ comparison metadata
ALTER TABLE public.supplier_marketplace_quotes
  ADD COLUMN IF NOT EXISTS rfq_ref          text,
  ADD COLUMN IF NOT EXISTS eta_days         integer,
  ADD COLUMN IF NOT EXISTS warranty_months  integer,
  ADD COLUMN IF NOT EXISTS insurance_cover_pence bigint,
  ADD COLUMN IF NOT EXISTS response_hours   integer,
  ADD COLUMN IF NOT EXISTS coverage_area    text,
  ADD COLUMN IF NOT EXISTS recommendation   text;

-- escrow_payments → escrow state machine + order linkage + release scheduling
ALTER TABLE public.escrow_payments
  ADD COLUMN IF NOT EXISTS assignment_id    uuid,
  ADD COLUMN IF NOT EXISTS escrow_state     text,
  ADD COLUMN IF NOT EXISTS funded_amount_pence bigint,
  ADD COLUMN IF NOT EXISTS release_due_at   timestamptz,
  ADD COLUMN IF NOT EXISTS release_rule     text,
  ADD COLUMN IF NOT EXISTS linked_type      text,
  ADD COLUMN IF NOT EXISTS reference        text,
  ADD COLUMN IF NOT EXISTS property_label   text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'escrow_payments_escrow_state_chk') THEN
    ALTER TABLE public.escrow_payments
      ADD CONSTRAINT escrow_payments_escrow_state_chk
      CHECK (escrow_state IS NULL OR escrow_state IN (
        'created','funding_pending','funded','held','evidence_pending',
        'review_pending','ready_to_release','partially_released','released',
        'disputed','refunded','cancelled','failed'));
  END IF;
END $$;

-- ── shared touch fn (no-op create) ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public._orders_escrow_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- ── 1. supplier_quote_comparisons ───────────────────────────────────────────
-- A saved comparison of the supplier quotes attached to an RFQ, with the chosen
-- recommendation label (best_match | best_value | lowest_price). operator-scoped.
CREATE TABLE IF NOT EXISTS public.supplier_quote_comparisons (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  rfq_ref               text,
  title                 text,
  property_id           uuid,
  property_label        text,
  quote_ids             uuid[] NOT NULL DEFAULT '{}',
  recommended_quote_id  uuid REFERENCES public.supplier_marketplace_quotes(id) ON DELETE SET NULL,
  recommendation        text,   -- best_match | best_value | lowest_price
  savings_pence         bigint,
  status                text NOT NULL DEFAULT 'open',  -- open | compared | accepted | expired
  created_by            uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS supplier_quote_comparisons_ws_idx
  ON public.supplier_quote_comparisons (operator_workspace_id, status);

-- ── 2. supplier_order_release_conditions ────────────────────────────────────
-- The release-rule checklist gating escrow release for an order/assignment.
-- Release is BLOCKED while any required condition is unmet (enforced in app +
-- mirrored here for audit). e.g. completion, evidence, sign-off, dispute-free.
CREATE TABLE IF NOT EXISTS public.supplier_order_release_conditions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id   uuid NOT NULL REFERENCES public.supplier_job_assignments(id) ON DELETE CASCADE,
  operator_workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  condition_key   text NOT NULL,   -- completion | evidence | sign_off | dispute_free | manual_approval
  label           text NOT NULL,
  required        boolean NOT NULL DEFAULT true,
  met             boolean NOT NULL DEFAULT false,
  met_at          timestamptz,
  met_by          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS supplier_order_release_conditions_assignment_idx
  ON public.supplier_order_release_conditions (assignment_id);

-- ── 3. supplier_order_payout_splits ─────────────────────────────────────────
-- How a held escrow amount splits on release (supplier net, platform fee,
-- retention/holdback, tax). Money is integer pence.
CREATE TABLE IF NOT EXISTS public.supplier_order_payout_splits (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id   uuid NOT NULL REFERENCES public.supplier_job_assignments(id) ON DELETE CASCADE,
  operator_workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  payment_id      uuid REFERENCES public.escrow_payments(id) ON DELETE SET NULL,
  split_type      text NOT NULL,   -- supplier_net | platform_fee | retention | tax | adjustment
  label           text,
  amount_pence    bigint NOT NULL DEFAULT 0,
  currency        text NOT NULL DEFAULT 'GBP',
  released        boolean NOT NULL DEFAULT false,
  released_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS supplier_order_payout_splits_assignment_idx
  ON public.supplier_order_payout_splits (assignment_id);

-- ── 4. supplier_order_escrow_events ─────────────────────────────────────────
-- Append-only audit of every escrow state-machine transition + financial action
-- (release, partial release, hold, dispute) on an order's escrow. Mirrors the
-- escrow state machine. NEVER edited; corrections are new rows.
CREATE TABLE IF NOT EXISTS public.supplier_order_escrow_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id   uuid REFERENCES public.supplier_job_assignments(id) ON DELETE CASCADE,
  payment_id      uuid REFERENCES public.escrow_payments(id) ON DELETE CASCADE,
  operator_workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  event_type      text NOT NULL DEFAULT 'transition',  -- transition | release | partial_release | hold | dispute | evidence_request | note
  from_state      text,
  to_state        text,
  amount_pence    bigint,
  reason          text,
  actor_user_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS supplier_order_escrow_events_assignment_idx
  ON public.supplier_order_escrow_events (assignment_id, created_at DESC);
CREATE INDEX IF NOT EXISTS supplier_order_escrow_events_payment_idx
  ON public.supplier_order_escrow_events (payment_id, created_at DESC);

-- ── updated_at triggers on the new mutable tables ───────────────────────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'supplier_quote_comparisons','supplier_order_release_conditions',
    'supplier_order_payout_splits'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', t || '_touch', t);
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public._orders_escrow_touch_updated_at()',
      t || '_touch', t);
  END LOOP;
END $$;

-- ── append-only guard for the escrow event audit ────────────────────────────
CREATE OR REPLACE FUNCTION public.supplier_order_escrow_events_immutable()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'supplier_order_escrow_events is append-only; insert a new row instead of %', TG_OP
    USING ERRCODE = 'check_violation';
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS trg_supplier_order_escrow_events_immutable ON public.supplier_order_escrow_events;
CREATE TRIGGER trg_supplier_order_escrow_events_immutable
  BEFORE UPDATE OR DELETE ON public.supplier_order_escrow_events
  FOR EACH ROW EXECUTE FUNCTION public.supplier_order_escrow_events_immutable();

-- ── RLS — workspace-membership via REAL public.workspace_members ─────────────
ALTER TABLE public.supplier_quote_comparisons        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_order_release_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_order_payout_splits      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_order_escrow_events      ENABLE ROW LEVEL SECURITY;

-- All four tables carry operator_workspace_id directly → policy is a simple
-- membership EXISTS against workspace_members, mirroring payments_escrow.
DROP POLICY IF EXISTS supplier_quote_comparisons_ws_member ON public.supplier_quote_comparisons;
CREATE POLICY supplier_quote_comparisons_ws_member ON public.supplier_quote_comparisons FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm
                 WHERE wm.workspace_id = supplier_quote_comparisons.operator_workspace_id AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm
                 WHERE wm.workspace_id = supplier_quote_comparisons.operator_workspace_id AND wm.user_id = auth.uid()));

DROP POLICY IF EXISTS supplier_order_release_conditions_ws_member ON public.supplier_order_release_conditions;
CREATE POLICY supplier_order_release_conditions_ws_member ON public.supplier_order_release_conditions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm
                 WHERE wm.workspace_id = supplier_order_release_conditions.operator_workspace_id AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm
                 WHERE wm.workspace_id = supplier_order_release_conditions.operator_workspace_id AND wm.user_id = auth.uid()));

DROP POLICY IF EXISTS supplier_order_payout_splits_ws_member ON public.supplier_order_payout_splits;
CREATE POLICY supplier_order_payout_splits_ws_member ON public.supplier_order_payout_splits FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm
                 WHERE wm.workspace_id = supplier_order_payout_splits.operator_workspace_id AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm
                 WHERE wm.workspace_id = supplier_order_payout_splits.operator_workspace_id AND wm.user_id = auth.uid()));

-- escrow events: members may READ + INSERT (append-only); UPDATE/DELETE blocked by trigger.
DROP POLICY IF EXISTS supplier_order_escrow_events_select ON public.supplier_order_escrow_events;
CREATE POLICY supplier_order_escrow_events_select ON public.supplier_order_escrow_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm
                 WHERE wm.workspace_id = supplier_order_escrow_events.operator_workspace_id AND wm.user_id = auth.uid()));

DROP POLICY IF EXISTS supplier_order_escrow_events_insert ON public.supplier_order_escrow_events;
CREATE POLICY supplier_order_escrow_events_insert ON public.supplier_order_escrow_events FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm
                 WHERE wm.workspace_id = supplier_order_escrow_events.operator_workspace_id AND wm.user_id = auth.uid()));

-- ============================================================================
-- END orders + escrow (PM side)
-- ============================================================================
