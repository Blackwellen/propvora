-- ============================================================================
-- Affiliate Programme — Wave B (workspace-keyed schema)
-- Adds workspace_id and all programme columns to the existing `affiliates` table
-- (originally keyed by user_id in 001_core_schema.sql).  Creates the missing
-- affiliate_payouts, affiliate_links tables, and rebuilds affiliate_referrals
-- with workspace-keyed FKs.  Fully idempotent / additive.
--
-- Also fixes affiliate_commissions to surface correct units:
--   amount column is DECIMAL (GBP £ major units) — the app reads it as pence.
--   We add `amount_pence` as a GENERATED column (amount * 100) for safe reading.
-- ============================================================================

-- ── affiliates: add workspace-keyed programme columns ───────────────────────

ALTER TABLE affiliates
  ADD COLUMN IF NOT EXISTS workspace_id        UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS enrolled            BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved            BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS band                INTEGER,
  ADD COLUMN IF NOT EXISTS public_handle       TEXT,
  ADD COLUMN IF NOT EXISTS active_referrals_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pending_pence       BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cleared_pence       BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_pence          BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at          TIMESTAMPTZ DEFAULT now();

-- payout_email already exists on user_id-based affiliates row (001_core_schema).
-- The 20260615070000 migration added it to affiliate_payouts too.  Ensure it
-- exists on affiliates proper (idempotent).
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS payout_email TEXT;

-- Unique constraint: one affiliate programme row per workspace.
CREATE UNIQUE INDEX IF NOT EXISTS idx_affiliates_workspace_id
  ON affiliates(workspace_id) WHERE workspace_id IS NOT NULL;

-- ── affiliate_commissions: add pence helper + status values ─────────────────

-- amount is DECIMAL(12,2) stored as GBP major units (e.g. 79.00 = £79).
-- The app uses `commission_pence:amount` alias but expects pence values.
-- Add an explicit pence column derived at write time to avoid the 100x error.
ALTER TABLE affiliate_commissions
  ADD COLUMN IF NOT EXISTS commission_pence BIGINT GENERATED ALWAYS AS (CEIL(amount * 100)) STORED;

-- Drop and re-create status check to widen to all values the app emits.
ALTER TABLE affiliate_commissions
  DROP CONSTRAINT IF EXISTS affiliate_commissions_status_check;
ALTER TABLE affiliate_commissions
  ADD CONSTRAINT affiliate_commissions_status_check
    CHECK (status IN ('pending','approved','payable','paid','held','reversed','cancelled'));

-- Add referred_workspace_id if missing (some schemas only have affiliate_id FK).
ALTER TABLE affiliate_commissions
  ADD COLUMN IF NOT EXISTS referred_workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;

-- ── affiliate_referrals: add workspace-keyed columns ────────────────────────

ALTER TABLE affiliate_referrals
  ADD COLUMN IF NOT EXISTS affiliate_workspace_id   UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS referred_workspace_id    UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS first_invoice_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS initial_commission_pence BIGINT,
  ADD COLUMN IF NOT EXISTS recurring_commission_pence BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recurring_months_remaining INTEGER NOT NULL DEFAULT 6,
  ADD COLUMN IF NOT EXISTS updated_at               TIMESTAMPTZ DEFAULT now();

-- Status values to match what the app emits.
ALTER TABLE affiliate_referrals
  DROP CONSTRAINT IF EXISTS affiliate_referrals_status_check;
ALTER TABLE affiliate_referrals
  ADD CONSTRAINT affiliate_referrals_status_check
    CHECK (status IN ('signed_up','trial','pending','active','converted','reversed','cancelled','refunded','rejected'));

-- Unique: only one referral per referred workspace.
CREATE UNIQUE INDEX IF NOT EXISTS idx_affiliate_referrals_referred_ws
  ON affiliate_referrals(referred_workspace_id) WHERE referred_workspace_id IS NOT NULL;

-- ── affiliate_links ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS affiliate_links (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  target_page           TEXT NOT NULL DEFAULT '/',
  utm_source            TEXT,
  utm_medium            TEXT,
  utm_campaign          TEXT,
  vanity_slug           TEXT,
  clicks                INTEGER NOT NULL DEFAULT 0,
  conversions           INTEGER NOT NULL DEFAULT 0,
  last_clicked_at       TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS affiliate_links_owner_select ON affiliate_links;
CREATE POLICY affiliate_links_owner_select ON affiliate_links
  FOR SELECT USING (
    affiliate_workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS affiliate_links_owner_insert ON affiliate_links;
CREATE POLICY affiliate_links_owner_insert ON affiliate_links
  FOR INSERT WITH CHECK (
    affiliate_workspace_id IN (
      SELECT workspace_id FROM workspace_members
        WHERE user_id = auth.uid() AND role IN ('owner','admin')
    )
  );

DROP POLICY IF EXISTS affiliate_links_owner_delete ON affiliate_links;
CREATE POLICY affiliate_links_owner_delete ON affiliate_links
  FOR DELETE USING (
    affiliate_workspace_id IN (
      SELECT workspace_id FROM workspace_members
        WHERE user_id = auth.uid() AND role IN ('owner','admin')
    )
  );

-- ── affiliate_payouts ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS affiliate_payouts (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_workspace_id   UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  period                   TEXT,                         -- YYYY-MM
  amount_pence             BIGINT NOT NULL DEFAULT 0,
  cleared_snapshot_pence   BIGINT,
  payout_method            TEXT,
  payout_email             TEXT,
  payout_reference         TEXT,
  status                   TEXT NOT NULL DEFAULT 'requested'
                             CHECK (status IN ('requested','approved','rejected',
                                               'scheduled','processing','paid','failed','cancelled')),
  requested_at             TIMESTAMPTZ,
  requested_by             UUID,
  reviewed_at              TIMESTAMPTZ,
  reviewed_by              UUID,
  paid_at                  TIMESTAMPTZ,
  review_note              TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE affiliate_payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS affiliate_payouts_owner_select ON affiliate_payouts;
CREATE POLICY affiliate_payouts_owner_select ON affiliate_payouts
  FOR SELECT USING (
    affiliate_workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS affiliate_payouts_owner_insert ON affiliate_payouts;
CREATE POLICY affiliate_payouts_owner_insert ON affiliate_payouts
  FOR INSERT WITH CHECK (
    affiliate_workspace_id IN (
      SELECT workspace_id FROM workspace_members
        WHERE user_id = auth.uid() AND role IN ('owner','admin')
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS affiliate_payouts_ws_status_idx
  ON affiliate_payouts (affiliate_workspace_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS affiliate_links_ws_idx
  ON affiliate_links (affiliate_workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS affiliate_referrals_ws_idx
  ON affiliate_referrals (affiliate_workspace_id, created_at DESC);

-- ── RLS: update affiliates policies for workspace_id column ─────────────────

-- Drop old user_id-keyed policies (replaced by workspace_id policies in
-- 20260612000007_affiliate_applications.sql).  Re-ensure those exist.
DROP POLICY IF EXISTS "Affiliates read own data" ON affiliates;
DROP POLICY IF EXISTS "Affiliates update own data" ON affiliates;
DROP POLICY IF EXISTS "Affiliates insert own" ON affiliates;
DROP POLICY IF EXISTS "Admin reads all affiliates" ON affiliates;
DROP POLICY IF EXISTS "Admin manages affiliates" ON affiliates;

-- workspace member read
DROP POLICY IF EXISTS affiliates_member_read ON affiliates;
CREATE POLICY affiliates_member_read ON affiliates
  FOR SELECT TO authenticated
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- workspace owner / admin manage
DROP POLICY IF EXISTS affiliates_owner_manage ON affiliates;
CREATE POLICY affiliates_owner_manage ON affiliates
  FOR ALL TO authenticated
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner','admin')
  ))
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner','admin')
  ));

-- platform admin override
DROP POLICY IF EXISTS affiliates_admin_all ON affiliates;
CREATE POLICY affiliates_admin_all ON affiliates
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND platform_role = 'admin'));

-- ── affiliate_commissions: update RLS for workspace_id column ───────────────

-- workspace_affiliate_* policies already exist from 011_money_level2.  Ensure
-- platform admin can manage commission records for review + mark-paid.
DROP POLICY IF EXISTS affiliate_commissions_admin_all ON affiliate_commissions;
CREATE POLICY affiliate_commissions_admin_all ON affiliate_commissions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND platform_role = 'admin'));

-- ── affiliate_referrals: RLS update ─────────────────────────────────────────

DROP POLICY IF EXISTS "Affiliates read own referrals" ON affiliate_referrals;
DROP POLICY IF EXISTS affiliate_referrals_ws_select ON affiliate_referrals;
CREATE POLICY affiliate_referrals_ws_select ON affiliate_referrals
  FOR SELECT TO authenticated
  USING (affiliate_workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS affiliate_referrals_admin_all ON affiliate_referrals;
CREATE POLICY affiliate_referrals_admin_all ON affiliate_referrals
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND platform_role = 'admin'));
