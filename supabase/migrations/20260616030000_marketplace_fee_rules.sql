-- ============================================================================
-- MARKETPLACE FEE RULES — DB-driven platform/provider fee source (phase P1)
--
-- The SINGLE source of truth for marketplace commission. The 2.5% default (and
-- every per-country / per-type / per-tier override) lives HERE, in data — never
-- hardcoded in application code. The only code constant is a documented
-- last-resort fallback used when this table is missing or empty (42P01 / cold
-- DB), so the calculator can never throw a user out of a checkout.
--
-- Resolution (see src/lib/marketplace/fees.ts): the MOST-SPECIFIC active rule
-- wins — i.e. the rule matching the most non-null dimensions (country_code,
-- transaction_type, plan_tier, category). Ties break on `priority` DESC then
-- most-recent. NULL on a dimension means "applies to all" for that dimension.
--
-- Conventions follow 20260616010000_v2_foundation.sql:
--   * fully IDEMPOTENT (guards on every statement; ON CONFLICT on seeds)
--   * RLS: any authenticated user may READ; only platform-admin / service-role
--     may WRITE (service-role bypasses RLS, so the write policy only admits
--     platform admins)
--   * update_updated_at() trigger if present
--
-- Money is integer pence throughout (minimum_fee_pence / maximum_fee_pence).
-- Apply via: node scripts/_apply_migration.mjs <this file>  (HTTP 201 = ok)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.marketplace_fee_rules (
  id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ── dimensions (NULL = "applies to all" for that dimension) ──────────────
  country_code               text,          -- ISO 3166-1 alpha-2, e.g. 'GB'
  transaction_type           text
                               CHECK (transaction_type IS NULL OR transaction_type IN (
                                 'stay_booking',
                                 'supplier_job',
                                 'emergency_job',
                                 'service_package',
                                 'subscription_addon'
                               )),
  plan_tier                  text,          -- starter|operator|scale|pro_agency|enterprise (or NULL)
  category                   text,          -- free-text marketplace category (or NULL)

  -- ── fee definition ───────────────────────────────────────────────────────
  fee_percent                numeric(6,3) NOT NULL DEFAULT 2.5
                               CHECK (fee_percent >= 0 AND fee_percent <= 100),
  minimum_fee_pence          integer CHECK (minimum_fee_pence IS NULL OR minimum_fee_pence >= 0),
  maximum_fee_pence          integer CHECK (maximum_fee_pence IS NULL OR maximum_fee_pence >= 0),

  -- when true the payment-provider fee is passed through to the seller (deducted
  -- from their payout); when false the platform absorbs it from its commission.
  provider_fee_pass_through  boolean NOT NULL DEFAULT true,
  -- when true fee_percent is treated as already including any applicable tax.
  tax_inclusive              boolean NOT NULL DEFAULT false,

  active                     boolean NOT NULL DEFAULT true,
  -- tie-breaker when two rules match the same number of dimensions; higher wins.
  priority                   integer NOT NULL DEFAULT 0,

  created_at                 timestamptz NOT NULL DEFAULT now(),
  updated_at                 timestamptz NOT NULL DEFAULT now()
);

-- min must not exceed max when both are set.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'marketplace_fee_rules_min_max_check'
  ) THEN
    ALTER TABLE public.marketplace_fee_rules
      ADD CONSTRAINT marketplace_fee_rules_min_max_check
      CHECK (
        minimum_fee_pence IS NULL
        OR maximum_fee_pence IS NULL
        OR minimum_fee_pence <= maximum_fee_pence
      );
  END IF;
END $$;

-- Resolution index: the calculator filters active rows by dimension, so cover
-- the hot path (active + the two most-selective dimensions).
CREATE INDEX IF NOT EXISTS marketplace_fee_rules_lookup_idx
  ON public.marketplace_fee_rules (active, country_code, transaction_type);
CREATE INDEX IF NOT EXISTS marketplace_fee_rules_priority_idx
  ON public.marketplace_fee_rules (priority DESC);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at') THEN
    DROP TRIGGER IF EXISTS update_marketplace_fee_rules_updated_at ON public.marketplace_fee_rules;
    CREATE TRIGGER update_marketplace_fee_rules_updated_at
      BEFORE UPDATE ON public.marketplace_fee_rules
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- Any authenticated user may READ (the calculator runs in any actor context);
-- only platform admins / service-role may WRITE.
ALTER TABLE public.marketplace_fee_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS marketplace_fee_rules_read_authenticated ON public.marketplace_fee_rules;
CREATE POLICY marketplace_fee_rules_read_authenticated ON public.marketplace_fee_rules
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS marketplace_fee_rules_admin_write ON public.marketplace_fee_rules;
CREATE POLICY marketplace_fee_rules_admin_write ON public.marketplace_fee_rules
  FOR ALL
  TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- ── SEED: default rule set ───────────────────────────────────────────────────
-- All fees live in the DB, not in code. We use stable deterministic UUIDs so the
-- seed is idempotent (ON CONFLICT updates the fee fields so re-runs converge).
--
--  * GLOBAL DEFAULT  2.5% — zero dimensions, lowest priority. The catch-all.
--  * Per-transaction-type defaults (still global on country/tier/category):
--      - emergency_job    5%   + GBP 12.00 minimum   (higher support burden)
--      - service_package  2.5%
--      - supplier_job     2.5%
--      - stay_booking     2.5%
--      - subscription_addon 0%  (no marketplace commission on addons)
--  * GB supplier_job 2.5% with a GBP 1.50 floor (illustrative country override).
--
-- priority encodes specificity preference within an equal-dimension-count tie;
-- the calculator ALSO counts matched dimensions, so these stay correct even if
-- more rules are added later.

INSERT INTO public.marketplace_fee_rules
  (id, country_code, transaction_type, plan_tier, category,
   fee_percent, minimum_fee_pence, maximum_fee_pence,
   provider_fee_pass_through, tax_inclusive, active, priority)
VALUES
  -- global catch-all default (2.5%)
  ('a0000000-0000-4000-8000-000000000001', NULL, NULL, NULL, NULL,
   2.5, NULL, NULL, true, false, true, 0),

  -- per-transaction-type defaults
  ('a0000000-0000-4000-8000-000000000002', NULL, 'supplier_job', NULL, NULL,
   2.5, NULL, NULL, true, false, true, 10),

  ('a0000000-0000-4000-8000-000000000003', NULL, 'service_package', NULL, NULL,
   2.5, NULL, NULL, true, false, true, 10),

  ('a0000000-0000-4000-8000-000000000004', NULL, 'stay_booking', NULL, NULL,
   2.5, NULL, NULL, true, false, true, 10),

  ('a0000000-0000-4000-8000-000000000005', NULL, 'emergency_job', NULL, NULL,
   5.0, 1200, NULL, true, false, true, 10),

  ('a0000000-0000-4000-8000-000000000006', NULL, 'subscription_addon', NULL, NULL,
   0.0, NULL, NULL, false, false, true, 10),

  -- GB supplier_job: 2.5% with a GBP 1.50 minimum (country override example)
  ('a0000000-0000-4000-8000-000000000007', 'GB', 'supplier_job', NULL, NULL,
   2.5, 150, NULL, true, false, true, 20)
ON CONFLICT (id) DO UPDATE SET
  country_code              = EXCLUDED.country_code,
  transaction_type          = EXCLUDED.transaction_type,
  plan_tier                 = EXCLUDED.plan_tier,
  category                  = EXCLUDED.category,
  fee_percent               = EXCLUDED.fee_percent,
  minimum_fee_pence         = EXCLUDED.minimum_fee_pence,
  maximum_fee_pence         = EXCLUDED.maximum_fee_pence,
  provider_fee_pass_through = EXCLUDED.provider_fee_pass_through,
  tax_inclusive             = EXCLUDED.tax_inclusive,
  active                    = EXCLUDED.active,
  priority                  = EXCLUDED.priority,
  updated_at                = now();

-- ============================================================================
-- END marketplace_fee_rules
-- ============================================================================
