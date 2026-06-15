-- ============================================================================
-- 20260616090000_payments_escrow.sql
--
-- P5 — PAYMENTS: ESCROW DATA MODEL + Stripe PaymentIntent / Connect TRANSFER
-- layer. Sits ON TOP of:
--   * marketplace_transactions / marketplace_commission_ledger (P2 — fees)
--   * bookings (P4 — stay bookings)
--   * stripe_connect_accounts (Connect onboarding — the seller payout dest.)
--
-- ESCROW / COMMISSION MODEL (the one chosen here — see src/lib/payments):
--   Funds are taken on the PLATFORM (Blackwellen) Stripe account with a
--   MANUAL-CAPTURE PaymentIntent (capture_method='manual'). The buyer is
--   AUTHORIZED at booking/checkout; funds are CAPTURED only when the escrow
--   release condition is met (e.g. booking confirmed / job completed). On
--   release the seller's net payout (gross − platform_fee − provider_fee) is
--   moved to their Connect account via a SEPARATE Stripe Transfer
--   (transfer_data is NOT used at intent time because escrow must hold funds
--   on-platform until the release event). The platform commission is therefore
--   simply "what is not transferred", which is auditable in payout_ledger.
--
-- HONESTY: nothing in this migration (or its libs) flips a payment to
-- 'captured'/'released'/'paid'. Those transitions are driven ONLY by real
-- Stripe webhook events (sibling agent). Records here start at
-- 'requires_payment' / 'held' / 'pending'.
--
-- Money is INTEGER PENCE (bigint) throughout. Workspace-scoped RLS. The
-- payout_ledger is APPEND-ONLY (immutable trigger, mirroring
-- trg_marketplace_ledger_immutable / the accounting_ledger pattern).
--
-- Idempotent + additive: IF NOT EXISTS / DROP ... IF EXISTS throughout.
-- Apply: node scripts/_apply_migration.mjs supabase/migrations/20260616090000_payments_escrow.sql
-- ============================================================================

-- NOTE: a legacy money-section `payments` table already exists with an
-- unrelated schema (amount numeric / payment_type / linked_type ...). To stay
-- strictly ADDITIVE and avoid clobbering it, the escrow/marketplace charge
-- table here is named `escrow_payments`. All P5 libs reference escrow_payments.

-- ────────────────────────────────────────────────────────────
-- 1. escrow_payments — one row per buyer charge (a Stripe PaymentIntent)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.escrow_payments (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- The seller/operator workspace that ultimately receives the payout.
  workspace_id             uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  transaction_id           uuid REFERENCES public.marketplace_transactions(id) ON DELETE SET NULL,
  booking_id               uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  payer_email              text,
  amount_pence             bigint NOT NULL CHECK (amount_pence >= 0),
  currency                 text NOT NULL DEFAULT 'GBP',
  platform_fee_pence       bigint NOT NULL DEFAULT 0 CHECK (platform_fee_pence >= 0),
  stripe_payment_intent_id text,
  capture_method           text NOT NULL DEFAULT 'manual'
                             CHECK (capture_method IN ('automatic','manual')),
  status                   text NOT NULL DEFAULT 'requires_payment'
                             CHECK (status IN (
                               'requires_payment','authorized','captured','released',
                               'refunded','partially_refunded','failed','cancelled')),
  escrow                   boolean NOT NULL DEFAULT true,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS escrow_payments_intent_uniq
  ON public.escrow_payments (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_escrow_payments_workspace   ON public.escrow_payments (workspace_id);
CREATE INDEX IF NOT EXISTS idx_escrow_payments_status      ON public.escrow_payments (workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_escrow_payments_transaction ON public.escrow_payments (transaction_id);
CREATE INDEX IF NOT EXISTS idx_escrow_payments_booking     ON public.escrow_payments (booking_id);

-- ────────────────────────────────────────────────────────────
-- 2. escrow_holds — the held portion of a payment, released on condition
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.escrow_holds (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id        uuid NOT NULL REFERENCES public.escrow_payments(id) ON DELETE CASCADE,
  amount_pence      bigint NOT NULL CHECK (amount_pence >= 0),
  status            text NOT NULL DEFAULT 'held'
                      CHECK (status IN ('held','released','refunded','cancelled')),
  release_condition text,
  released_at       timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_escrow_holds_payment ON public.escrow_holds (payment_id);
CREATE INDEX IF NOT EXISTS idx_escrow_holds_status  ON public.escrow_holds (status);

-- ────────────────────────────────────────────────────────────
-- 3. payouts — one row per Stripe Transfer to a seller Connect account
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payouts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- The recipient seller/supplier workspace.
  workspace_id        uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  connect_account_id  text,
  amount_pence        bigint NOT NULL CHECK (amount_pence >= 0),
  currency            text NOT NULL DEFAULT 'GBP',
  stripe_transfer_id  text,
  status              text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','paid','failed','reversed')),
  payment_id          uuid REFERENCES public.escrow_payments(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS payouts_transfer_uniq
  ON public.payouts (stripe_transfer_id)
  WHERE stripe_transfer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payouts_workspace ON public.payouts (workspace_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status    ON public.payouts (workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_payouts_payment   ON public.payouts (payment_id);

-- ────────────────────────────────────────────────────────────
-- 4. payout_ledger — APPEND-ONLY audit of every money movement
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payout_ledger (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id    uuid REFERENCES public.payouts(id) ON DELETE SET NULL,
  payment_id   uuid REFERENCES public.escrow_payments(id) ON DELETE SET NULL,
  entry_type   text NOT NULL
                 CHECK (entry_type IN ('charge','platform_fee','transfer','refund','reversal','adjustment')),
  amount_pence bigint NOT NULL,
  currency     text NOT NULL DEFAULT 'GBP',
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payout_ledger_payout  ON public.payout_ledger (payout_id);
CREATE INDEX IF NOT EXISTS idx_payout_ledger_payment ON public.payout_ledger (payment_id);
CREATE INDEX IF NOT EXISTS idx_payout_ledger_type    ON public.payout_ledger (entry_type);

-- ============================================================================
-- updated_at maintenance (shared touch fn — create if absent)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.payments_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_payments_touch ON public.escrow_payments;
CREATE TRIGGER trg_payments_touch
  BEFORE UPDATE ON public.escrow_payments
  FOR EACH ROW EXECUTE FUNCTION public.payments_touch_updated_at();

DROP TRIGGER IF EXISTS trg_escrow_holds_touch ON public.escrow_holds;
CREATE TRIGGER trg_escrow_holds_touch
  BEFORE UPDATE ON public.escrow_holds
  FOR EACH ROW EXECUTE FUNCTION public.payments_touch_updated_at();

DROP TRIGGER IF EXISTS trg_payouts_touch ON public.payouts;
CREATE TRIGGER trg_payouts_touch
  BEFORE UPDATE ON public.payouts
  FOR EACH ROW EXECUTE FUNCTION public.payments_touch_updated_at();

-- ============================================================================
-- APPEND-ONLY — payout_ledger rows are immutable once written. Corrections are
-- made by a NEW reversal/adjustment row, never by edit or delete. Mirrors
-- trg_marketplace_ledger_immutable and the accounting_ledger immutability rule.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.payout_ledger_immutable()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'payout_ledger is append-only; insert a reversal/adjustment row instead of % ', TG_OP
    USING ERRCODE = 'check_violation';
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_payout_ledger_immutable ON public.payout_ledger;
CREATE TRIGGER trg_payout_ledger_immutable
  BEFORE UPDATE OR DELETE ON public.payout_ledger
  FOR EACH ROW EXECUTE FUNCTION public.payout_ledger_immutable();

-- ============================================================================
-- RLS — workspace member access (codebase pattern: EXISTS over
-- workspace_members). Service-role writes (webhook/reconciliation) bypass RLS.
-- escrow_holds + payout_ledger have no own workspace_id, so membership is
-- resolved through the parent payment/payout row.
-- ============================================================================
ALTER TABLE public.escrow_payments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_holds  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payments_ws_member ON public.escrow_payments;
CREATE POLICY payments_ws_member ON public.escrow_payments FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm
                 WHERE wm.workspace_id = escrow_payments.workspace_id AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm
                 WHERE wm.workspace_id = escrow_payments.workspace_id AND wm.user_id = auth.uid()));

DROP POLICY IF EXISTS payouts_ws_member ON public.payouts;
CREATE POLICY payouts_ws_member ON public.payouts FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm
                 WHERE wm.workspace_id = payouts.workspace_id AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm
                 WHERE wm.workspace_id = payouts.workspace_id AND wm.user_id = auth.uid()));

DROP POLICY IF EXISTS escrow_holds_ws_member ON public.escrow_holds;
CREATE POLICY escrow_holds_ws_member ON public.escrow_holds FOR ALL
  USING (EXISTS (SELECT 1 FROM public.escrow_payments p
                 JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id
                 WHERE p.id = escrow_holds.payment_id AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.escrow_payments p
                 JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id
                 WHERE p.id = escrow_holds.payment_id AND wm.user_id = auth.uid()));

DROP POLICY IF EXISTS payout_ledger_ws_member ON public.payout_ledger;
CREATE POLICY payout_ledger_ws_member ON public.payout_ledger FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.payouts po
            JOIN public.workspace_members wm ON wm.workspace_id = po.workspace_id
            WHERE po.id = payout_ledger.payout_id AND wm.user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM public.escrow_payments p
            JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id
            WHERE p.id = payout_ledger.payment_id AND wm.user_id = auth.uid())
  );
