-- ============================================================
-- 20260616100000_payments_webhook_events.sql
--
-- Propvora v2 — P5 Payments: WEBHOOK IDEMPOTENCY for the PAYMENTS/ESCROW
-- Stripe webhook (POST /api/payments/webhook).
--
-- This is SEPARATE from the BILLING webhook dedupe store
-- (public.stripe_webhook_events, used by /api/webhooks/stripe). The payments
-- webhook handles a DIFFERENT Stripe endpoint (escrow / Connect / payout
-- events) and we keep its idempotency ledger in its own table so the two
-- endpoints can never interfere with one another's dedupe state.
--
-- Stripe guarantees AT-LEAST-ONCE delivery and may replay an event. The
-- handler records an event id ONLY AFTER it has successfully applied the DB
-- transitions; a failed run returns 500 WITHOUT recording, so Stripe's retry
-- is reprocessed rather than skipped. The UNIQUE constraint on
-- stripe_event_id is the hard backstop against a concurrent re-delivery
-- creating two processed rows (and thus double money mutation).
--
-- Idempotent / additive: IF NOT EXISTS throughout; safe to re-run.
-- Apply: node scripts/_apply_migration.mjs supabase/migrations/20260616100000_payments_webhook_events.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS public.payments_webhook_events (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id  text NOT NULL,
  type             text NOT NULL,
  payload          jsonb,
  processed_at     timestamptz NOT NULL DEFAULT now()
);

-- Hard backstop: one processed row per Stripe event id.
CREATE UNIQUE INDEX IF NOT EXISTS payments_webhook_events_event_id_uniq
  ON public.payments_webhook_events (stripe_event_id);

CREATE INDEX IF NOT EXISTS idx_payments_webhook_events_type
  ON public.payments_webhook_events (type);

-- RLS: only the service role (the webhook route) ever touches this table.
-- Enabling RLS with NO policies denies all authenticated/anon access; the
-- service role bypasses RLS, which is exactly what the webhook uses.
ALTER TABLE public.payments_webhook_events ENABLE ROW LEVEL SECURITY;
