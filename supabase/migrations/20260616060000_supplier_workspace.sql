-- ============================================================================
-- P3 — SUPPLIER WORKSPACE: data model + provisioning (phase P3)
--
-- The supplier-SIDE workspace data layer: a profile, services catalogue,
-- coverage areas, availability and onboarding state for a workspace whose
-- `workspaces.type = 'supplier'`. This is the supplier's OWN workspace (where
-- the supplier logs in and manages their offering), NOT the operator-side
-- "manual supplier" contact records.
--
-- IMPORTANT naming decision
-- -------------------------
-- The pre-existing tables `supplier_profiles`, `supplier_services`,
-- `supplier_availability` (created by 20260611000004_ppm_suppliers.sql /
-- 20260615060000_supplier_portal_scoping.sql) are the OPERATOR-side manual
-- supplier model: they are keyed to `contacts(id)` / `suppliers(id)` inside an
-- OPERATOR workspace and carry incompatible NOT NULL columns (e.g.
-- supplier_profiles.contact_id NOT NULL, PK = id). Repurposing them to be
-- workspace_id-keyed supplier-workspace profiles would be DESTRUCTIVE and break
-- the existing portal. Per the additive/non-destructive rule we therefore use
-- DISTINCT table names, consistent with the existing `supplier_workspace_members`
-- table from the P0 foundation (20260616010000_v2_foundation.sql):
--   supplier_workspace_profiles
--   supplier_workspace_services
--   supplier_workspace_coverage_areas
--   supplier_workspace_availability
--   supplier_workspace_onboarding_state
--
-- RLS: every table is scoped to membership of the SUPPLIER workspace. Supplier
-- workspaces use `supplier_workspace_members` (P0 foundation) for their members;
-- the workspace owner is ALSO in `workspace_members` via the
-- workspaces_bootstrap_owner trigger. We admit either path so the supplier can
-- always reach their own rows: is_workspace_member(workspace_id) OR an active
-- supplier_workspace_members row for auth.uid().
--
-- Fully IDEMPOTENT: create table if not exists + guarded policies/indexes;
-- additive ADD COLUMN IF NOT EXISTS reconciliation; never destructive.
-- ============================================================================

-- ── 0. Helper: is the current user a member of this SUPPLIER workspace? ──────
-- SECURITY DEFINER so it can read supplier_workspace_members regardless of the
-- caller's own RLS. Admits the operator/owner workspace-member path too (the
-- owner is bootstrapped into workspace_members), so the supplier always sees
-- their own rows. Only ever checks the CURRENT auth.uid().
CREATE OR REPLACE FUNCTION public.is_supplier_workspace_member(
  _workspace_id uuid
) RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    public.is_workspace_member(_workspace_id)
    OR EXISTS (
      SELECT 1
      FROM public.supplier_workspace_members swm
      WHERE swm.workspace_id = _workspace_id
        AND swm.user_id = auth.uid()
    );
$$;
REVOKE ALL ON FUNCTION public.is_supplier_workspace_member(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_supplier_workspace_member(uuid) TO authenticated;

-- ── 1. supplier_workspace_profiles ──────────────────────────────────────────
-- One profile per supplier workspace → workspace_id is the PK.
CREATE TABLE IF NOT EXISTS public.supplier_workspace_profiles (
  workspace_id              uuid PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
  display_name              text,
  bio                       text,
  trades                    text[] NOT NULL DEFAULT '{}',
  years_experience          integer,
  insurance_verified        boolean NOT NULL DEFAULT false,
  public_liability_cover_pence bigint,
  service_radius_km         integer,
  base_location             text,
  latitude                  numeric,
  longitude                 numeric,
  response_time_hours       integer,
  accepts_emergency         boolean NOT NULL DEFAULT false,
  status                    text NOT NULL DEFAULT 'draft'
                              CHECK (status IN ('draft','active','paused')),
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);
-- additive reconciliation (no-op on a fresh create; future-proof on re-runs)
ALTER TABLE public.supplier_workspace_profiles
  ADD COLUMN IF NOT EXISTS display_name                 text,
  ADD COLUMN IF NOT EXISTS bio                          text,
  ADD COLUMN IF NOT EXISTS trades                       text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS years_experience             integer,
  ADD COLUMN IF NOT EXISTS insurance_verified           boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS public_liability_cover_pence bigint,
  ADD COLUMN IF NOT EXISTS service_radius_km            integer,
  ADD COLUMN IF NOT EXISTS base_location                text,
  ADD COLUMN IF NOT EXISTS latitude                     numeric,
  ADD COLUMN IF NOT EXISTS longitude                    numeric,
  ADD COLUMN IF NOT EXISTS response_time_hours          integer,
  ADD COLUMN IF NOT EXISTS accepts_emergency            boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS status                       text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS created_at                   timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at                   timestamptz NOT NULL DEFAULT now();

-- ── 2. supplier_workspace_services ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.supplier_workspace_services (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name              text NOT NULL,
  category          text,
  description       text,
  pricing_model     text NOT NULL DEFAULT 'quote_required'
                      CHECK (pricing_model IN ('hourly','fixed','quote_required')),
  rate_pence        bigint,
  callout_fee_pence bigint,
  active            boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS supplier_workspace_services_ws_idx
  ON public.supplier_workspace_services (workspace_id);
CREATE INDEX IF NOT EXISTS supplier_workspace_services_category_idx
  ON public.supplier_workspace_services (category);
CREATE INDEX IF NOT EXISTS supplier_workspace_services_active_idx
  ON public.supplier_workspace_services (workspace_id, active);

-- ── 3. supplier_workspace_coverage_areas ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.supplier_workspace_coverage_areas (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  area_type    text NOT NULL
                 CHECK (area_type IN ('radius','postcode','region','national')),
  value        text,
  latitude     numeric,
  longitude    numeric,
  radius_km    integer,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS supplier_workspace_coverage_ws_idx
  ON public.supplier_workspace_coverage_areas (workspace_id);

-- ── 4. supplier_workspace_availability ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.supplier_workspace_availability (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  weekday       integer CHECK (weekday IS NULL OR (weekday BETWEEN 0 AND 6)),
  starts_at     time,
  ends_at       time,
  date_override date,
  is_available  boolean NOT NULL DEFAULT true,
  note          text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS supplier_workspace_availability_ws_idx
  ON public.supplier_workspace_availability (workspace_id);

-- ── 5. supplier_workspace_onboarding_state ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.supplier_workspace_onboarding_state (
  workspace_id    uuid PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
  step            text,
  completed_steps text[] NOT NULL DEFAULT '{}',
  completed       boolean NOT NULL DEFAULT false,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ── 6. updated_at triggers (reuse shared fn if present) ─────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at') THEN
    DROP TRIGGER IF EXISTS update_supplier_workspace_profiles_updated_at ON public.supplier_workspace_profiles;
    CREATE TRIGGER update_supplier_workspace_profiles_updated_at
      BEFORE UPDATE ON public.supplier_workspace_profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();

    DROP TRIGGER IF EXISTS update_supplier_workspace_services_updated_at ON public.supplier_workspace_services;
    CREATE TRIGGER update_supplier_workspace_services_updated_at
      BEFORE UPDATE ON public.supplier_workspace_services
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- ── 7. RLS — scoped to supplier workspace membership ────────────────────────
-- Pattern: is_supplier_workspace_member(workspace_id) (which admits both the
-- supplier_workspace_members path and the operator/owner workspace_members path).

-- 7a. supplier_workspace_profiles
ALTER TABLE public.supplier_workspace_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS supplier_workspace_profiles_member_all ON public.supplier_workspace_profiles;
CREATE POLICY supplier_workspace_profiles_member_all ON public.supplier_workspace_profiles
  FOR ALL
  USING (public.is_supplier_workspace_member(workspace_id))
  WITH CHECK (public.is_supplier_workspace_member(workspace_id));

-- 7b. supplier_workspace_services
ALTER TABLE public.supplier_workspace_services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS supplier_workspace_services_member_all ON public.supplier_workspace_services;
CREATE POLICY supplier_workspace_services_member_all ON public.supplier_workspace_services
  FOR ALL
  USING (public.is_supplier_workspace_member(workspace_id))
  WITH CHECK (public.is_supplier_workspace_member(workspace_id));

-- 7c. supplier_workspace_coverage_areas
ALTER TABLE public.supplier_workspace_coverage_areas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS supplier_workspace_coverage_member_all ON public.supplier_workspace_coverage_areas;
CREATE POLICY supplier_workspace_coverage_member_all ON public.supplier_workspace_coverage_areas
  FOR ALL
  USING (public.is_supplier_workspace_member(workspace_id))
  WITH CHECK (public.is_supplier_workspace_member(workspace_id));

-- 7d. supplier_workspace_availability
ALTER TABLE public.supplier_workspace_availability ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS supplier_workspace_availability_member_all ON public.supplier_workspace_availability;
CREATE POLICY supplier_workspace_availability_member_all ON public.supplier_workspace_availability
  FOR ALL
  USING (public.is_supplier_workspace_member(workspace_id))
  WITH CHECK (public.is_supplier_workspace_member(workspace_id));

-- 7e. supplier_workspace_onboarding_state
ALTER TABLE public.supplier_workspace_onboarding_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS supplier_workspace_onboarding_member_all ON public.supplier_workspace_onboarding_state;
CREATE POLICY supplier_workspace_onboarding_member_all ON public.supplier_workspace_onboarding_state
  FOR ALL
  USING (public.is_supplier_workspace_member(workspace_id))
  WITH CHECK (public.is_supplier_workspace_member(workspace_id));

-- ============================================================================
-- END P3 supplier workspace data model
-- ============================================================================
