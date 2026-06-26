-- ============================================================================
-- Affiliate Programme V3 — Sub-affiliate network, dual links, milestone bonuses
-- All changes are additive / idempotent (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).
-- ============================================================================

-- ── affiliates: sub-affiliate network columns ────────────────────────────────

ALTER TABLE affiliates
  -- Who recruited this affiliate (1-level-deep only; NULL = direct / self-enrolled)
  ADD COLUMN IF NOT EXISTS recruited_by_affiliate_workspace_id UUID
    REFERENCES workspaces(id) ON DELETE SET NULL,
  -- Separate referral code used on the 5%-discount customer link
  ADD COLUMN IF NOT EXISTS discount_referral_code TEXT,
  -- Count of sub-affiliates this affiliate has recruited
  ADD COLUMN IF NOT EXISTS sub_affiliate_count INTEGER NOT NULL DEFAULT 0,
  -- Sub-affiliate earn-through balances (pence, separate from direct commission)
  ADD COLUMN IF NOT EXISTS sub_pending_pence    BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sub_cleared_pence    BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sub_paid_pence       BIGINT NOT NULL DEFAULT 0,
  -- Milestone bonus tracking (prevents double-awarding)
  ADD COLUMN IF NOT EXISTS milestone_5_awarded  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS milestone_15_awarded BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS milestone_50_awarded BOOLEAN NOT NULL DEFAULT false,
  -- Leaderboard opt-in
  ADD COLUMN IF NOT EXISTS leaderboard_visible  BOOLEAN NOT NULL DEFAULT false;

-- Unique constraint on discount_referral_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_affiliates_discount_code
  ON affiliates(discount_referral_code) WHERE discount_referral_code IS NOT NULL;

-- Index to quickly look up all sub-affiliates under a recruiter
CREATE INDEX IF NOT EXISTS idx_affiliates_recruited_by
  ON affiliates(recruited_by_affiliate_workspace_id)
  WHERE recruited_by_affiliate_workspace_id IS NOT NULL;

-- ── affiliate_referrals: track which link type and campaign the customer used ─

ALTER TABLE affiliate_referrals
  -- 'standard' = full-price link  |  'discount' = 5%-off promo link
  ADD COLUMN IF NOT EXISTS link_type TEXT NOT NULL DEFAULT 'standard'
    CHECK (link_type IN ('standard', 'discount')),
  -- UTM campaign slug captured at attribution time (nullable)
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT;

-- ── affiliate_commissions: widen commission_type check ───────────────────────
-- Existing CHECK covers 'initial' | 'recurring'. Widen to include sub-affiliate
-- earn-through and milestone bonuses.

ALTER TABLE affiliate_commissions
  DROP CONSTRAINT IF EXISTS affiliate_commissions_type_check;

ALTER TABLE affiliate_commissions
  ADD CONSTRAINT affiliate_commissions_type_check
    -- 'subscription' retained for legacy rows that pre-date this migration
    CHECK (commission_type IN ('initial', 'recurring', 'sub_affiliate', 'milestone', 'subscription'));

-- ── affiliate_applications: track who recruited the applicant ─────────────────

ALTER TABLE affiliate_applications
  ADD COLUMN IF NOT EXISTS recruited_by_affiliate_workspace_id UUID
    REFERENCES workspaces(id) ON DELETE SET NULL;

-- ── affiliate_click_log: lightweight per-visit click tracking ────────────────
-- Separate from affiliate_links (campaign-builder rows) so the base ?ref= link
-- also gets click data without requiring the affiliate to create a named link.

CREATE TABLE IF NOT EXISTS affiliate_click_log (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  referral_code          TEXT NOT NULL,
  link_type              TEXT NOT NULL DEFAULT 'standard'
                           CHECK (link_type IN ('standard', 'discount')),
  utm_campaign           TEXT,
  utm_source             TEXT,
  utm_medium             TEXT,
  ip_hash                TEXT,
  user_agent_hash        TEXT,
  landed_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- No RLS on click_log — inserted via service-role only (server-side API route).
-- Affiliates read aggregates only (via dashboard-data functions, not direct query).
ALTER TABLE affiliate_click_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS affiliate_click_log_admin ON affiliate_click_log;
CREATE POLICY affiliate_click_log_admin ON affiliate_click_log
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND platform_role = 'admin'));

-- Efficient aggregate queries by affiliate workspace
CREATE INDEX IF NOT EXISTS affiliate_click_log_ws_idx
  ON affiliate_click_log (affiliate_workspace_id, landed_at DESC);
CREATE INDEX IF NOT EXISTS affiliate_click_log_code_idx
  ON affiliate_click_log (referral_code, landed_at DESC);

-- ── affiliate_milestones (audit log) ─────────────────────────────────────────
-- One row per milestone awarded; the boolean columns on affiliates are the gates,
-- this table is the permanent audit trail.

CREATE TABLE IF NOT EXISTS affiliate_milestones (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  milestone_key          TEXT NOT NULL CHECK (milestone_key IN ('m5', 'm15', 'm50')),
  bonus_pence            BIGINT NOT NULL,
  awarded_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  commission_id          UUID REFERENCES affiliate_commissions(id) ON DELETE SET NULL
);

ALTER TABLE affiliate_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS affiliate_milestones_owner_select ON affiliate_milestones;
CREATE POLICY affiliate_milestones_owner_select ON affiliate_milestones
  FOR SELECT TO authenticated
  USING (affiliate_workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS affiliate_milestones_admin_all ON affiliate_milestones;
CREATE POLICY affiliate_milestones_admin_all ON affiliate_milestones
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND platform_role = 'admin'));

CREATE INDEX IF NOT EXISTS affiliate_milestones_ws_idx
  ON affiliate_milestones (affiliate_workspace_id, awarded_at DESC);
