-- ============================================================================
-- Affiliate Programme — Wave A
-- External applications table (public applicants have no workspace yet) + origin
-- and referral-code columns on the existing workspace-keyed `affiliates` table.
-- One ledger, two enrolment doors (external apply / internal one-click).
-- Idempotent / additive. Safe to run repeatedly.
-- ============================================================================

-- ── affiliate_applications (external public apply flow) ─────────────────────
CREATE TABLE IF NOT EXISTS affiliate_applications (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name          TEXT NOT NULL,
  email              TEXT NOT NULL,
  company            TEXT,
  website            TEXT,
  audience_type      TEXT,
  promotion_plan     TEXT,
  estimated_audience TEXT,
  country            TEXT,
  existing_customer  BOOLEAN NOT NULL DEFAULT false,
  referral_code      TEXT,
  status             TEXT NOT NULL DEFAULT 'pending_review'
                       CHECK (status IN ('draft','submitted','pending_review','approved','rejected','needs_more_info','waitlisted','suspended')),
  reviewed_at        TIMESTAMPTZ,
  reviewed_by        UUID,
  notes              TEXT,
  ip_hash            TEXT,
  metadata           JSONB NOT NULL DEFAULT '{}',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_applications_created ON affiliate_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_applications_email ON affiliate_applications(lower(email));
CREATE INDEX IF NOT EXISTS idx_affiliate_applications_status ON affiliate_applications(status);

ALTER TABLE affiliate_applications ENABLE ROW LEVEL SECURITY;

-- Public visitors may submit an application (anon + authenticated).
DROP POLICY IF EXISTS "affiliate_apps_public_insert" ON affiliate_applications;
CREATE POLICY "affiliate_apps_public_insert" ON affiliate_applications
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Only platform admins may read / manage applications.
DROP POLICY IF EXISTS "affiliate_apps_admin_read" ON affiliate_applications;
CREATE POLICY "affiliate_apps_admin_read" ON affiliate_applications
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND platform_role = 'admin'));

DROP POLICY IF EXISTS "affiliate_apps_admin_write" ON affiliate_applications;
CREATE POLICY "affiliate_apps_admin_write" ON affiliate_applications
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND platform_role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND platform_role = 'admin'));

-- ── affiliates: enrolment origin + referral code ────────────────────────────
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS origin TEXT NOT NULL DEFAULT 'internal'
  CHECK (origin IN ('internal','external'));
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_affiliates_referral_code
  ON affiliates(referral_code) WHERE referral_code IS NOT NULL;

-- Ensure workspace members can see their own affiliate row and owners/admins manage it.
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "affiliates_member_read" ON affiliates;
CREATE POLICY "affiliates_member_read" ON affiliates
  FOR SELECT TO authenticated
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "affiliates_owner_manage" ON affiliates;
CREATE POLICY "affiliates_owner_manage" ON affiliates
  FOR ALL TO authenticated
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner','admin')))
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner','admin')));
