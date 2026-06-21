-- ============================================================================
-- Public marketplace RLS — allow anonymous + authenticated users to READ
-- active supplier_workspace_profiles and their services for the public
-- /suppliers-hub (PM) and /marketplace/suppliers (public) pages.
--
-- The existing member-scoped policy already covers authenticated supplier
-- workspace members managing their own rows. This migration ADDS a separate,
-- narrower public SELECT policy that only exposes status='active' rows.
--
-- Fully IDEMPOTENT: DROP POLICY IF EXISTS before CREATE POLICY.
-- ============================================================================

-- 1. Public read of ACTIVE supplier profiles (status='active')
DROP POLICY IF EXISTS supplier_workspace_profiles_public_read ON public.supplier_workspace_profiles;
CREATE POLICY supplier_workspace_profiles_public_read
  ON public.supplier_workspace_profiles
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- 2. Public read of services belonging to active profiles
DROP POLICY IF EXISTS supplier_workspace_services_public_read ON public.supplier_workspace_services;
CREATE POLICY supplier_workspace_services_public_read
  ON public.supplier_workspace_services
  FOR SELECT
  TO anon, authenticated
  USING (
    active = true
    AND workspace_id IN (
      SELECT workspace_id
      FROM public.supplier_workspace_profiles
      WHERE status = 'active'
    )
  );

-- 3. Public read of coverage areas for active supplier profiles
DROP POLICY IF EXISTS supplier_workspace_coverage_public_read ON public.supplier_workspace_coverage_areas;
CREATE POLICY supplier_workspace_coverage_public_read
  ON public.supplier_workspace_coverage_areas
  FOR SELECT
  TO anon, authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM public.supplier_workspace_profiles
      WHERE status = 'active'
    )
  );

-- ============================================================================
-- planning_wizard_drafts table — auto-save for planning wizard
-- 42P01-safe: front-end already guards on missing table; this formalises it.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.planning_wizard_drafts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id       uuid,
  name          text,
  profile_key   text,
  state_json    jsonb NOT NULL DEFAULT '{}',
  step          integer NOT NULL DEFAULT 1,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS planning_wizard_drafts_ws_idx
  ON public.planning_wizard_drafts (workspace_id, updated_at DESC);

ALTER TABLE public.planning_wizard_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS planning_wizard_drafts_member_all ON public.planning_wizard_drafts;
CREATE POLICY planning_wizard_drafts_member_all ON public.planning_wizard_drafts
  FOR ALL
  USING (public.is_workspace_member(workspace_id))
  WITH CHECK (public.is_workspace_member(workspace_id));

-- ============================================================================
-- END supplier public marketplace RLS + planning_wizard_drafts
-- ============================================================================
