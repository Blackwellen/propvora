-- ============================================================================
-- V2 FOUNDATION — Global marketplace data layer (phase P0)
--
-- The keystone every v2 phase depends on. Establishes:
--   1. Workspace-level context columns (type + country/tax/region/currency/lang).
--   2. Property-level context columns (country/jurisdiction/tax/currency/units).
--   3. country_packs   — the per-country eligibility + review-status content layer.
--   4. Marketplace membership tables (supplier / customer / admin roles).
--   5. RLS on every new table (workspace-member EXISTS pattern; country_packs is
--      world-readable to authenticated, writable only by service-role / platform
--      admin).
--   6. SECURITY DEFINER permission helpers (stubs that later phases refine).
--
-- This migration is fully IDEMPOTENT — every statement guards for re-runs.
-- It does NOT touch app code and is purely additive (no drops of live objects).
--
-- Conventions follow the existing codebase (see 20260615060000_supplier_portal_
-- scoping.sql): is_workspace_member(workspace_id), has_workspace_role(user,ws,
-- roles[]), is_platform_admin(user), update_updated_at() trigger, SECURITY
-- DEFINER + SET search_path = public on helpers.
-- ============================================================================

-- ── 1. WORKSPACES: context columns ──────────────────────────────────────────
-- NB: workspaces already has `workspace_type` (text, onboarding profile) and
-- `currency`. The v2 `type` column is the MARKETPLACE actor type and is distinct.
ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS type                       text NOT NULL DEFAULT 'operator',
  ADD COLUMN IF NOT EXISTS business_country_code       text NOT NULL DEFAULT 'GB',
  ADD COLUMN IF NOT EXISTS tax_country_code            text NOT NULL DEFAULT 'GB',
  ADD COLUMN IF NOT EXISTS legal_entity_country_code   text NOT NULL DEFAULT 'GB',
  ADD COLUMN IF NOT EXISTS data_region                 text NOT NULL DEFAULT 'uk',
  ADD COLUMN IF NOT EXISTS default_currency            text NOT NULL DEFAULT 'GBP',
  ADD COLUMN IF NOT EXISTS default_language            text NOT NULL DEFAULT 'en-GB';

-- type is an enumerated actor kind enforced with a CHECK (cheaper/idempotent
-- than a pg enum to evolve later via admin plane).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'workspaces_type_check'
  ) THEN
    ALTER TABLE public.workspaces
      ADD CONSTRAINT workspaces_type_check
      CHECK (type IN ('operator','supplier','customer','platform_admin'));
  END IF;
END $$;

-- ── 2. PROPERTIES: context columns ──────────────────────────────────────────
-- NB: properties already has `country` (default 'GB') and `floor_area_sqm`.
-- We add the explicit v2 context fields the Context Engine reads.
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS country_code        text NOT NULL DEFAULT 'GB',
  ADD COLUMN IF NOT EXISTS legal_jurisdiction  text NOT NULL DEFAULT 'england-wales',
  ADD COLUMN IF NOT EXISTS tax_region          text,
  ADD COLUMN IF NOT EXISTS currency            text NOT NULL DEFAULT 'GBP',
  ADD COLUMN IF NOT EXISTS area_unit           text NOT NULL DEFAULT 'sqm',
  ADD COLUMN IF NOT EXISTS local_authority     text;

-- ── 3. country_packs ────────────────────────────────────────────────────────
-- The per-country eligibility + review-status content layer. One row per ISO
-- alpha-2 country. The admin plane will manage the full ~128 later; this seeds
-- the rows the V1→V2 path needs.
CREATE TABLE IF NOT EXISTS public.country_packs (
  code                      text PRIMARY KEY,            -- ISO 3166-1 alpha-2
  name                      text NOT NULL,
  default_currency          text NOT NULL DEFAULT 'GBP', -- ISO 4217
  default_locale            text NOT NULL DEFAULT 'en-GB',
  measurement_system        text NOT NULL DEFAULT 'metric'
                              CHECK (measurement_system IN ('metric','imperial')),
  address_model             text NOT NULL DEFAULT 'generic',

  -- commercial eligibility (from the master-plan offer matrix)
  offer_status              text NOT NULL DEFAULT 'restricted'
                              CHECK (offer_status IN ('offer','restricted','banned')),

  -- per-domain review status (gates how far each feature may go in this country)
  legal_status              text NOT NULL DEFAULT 'disabled'
                              CHECK (legal_status   IN ('disabled','research_only','beta','reviewed')),
  tax_status                text NOT NULL DEFAULT 'disabled'
                              CHECK (tax_status     IN ('disabled','research_only','beta','reviewed')),
  privacy_status            text NOT NULL DEFAULT 'disabled'
                              CHECK (privacy_status IN ('disabled','research_only','beta','reviewed')),
  payment_status            text NOT NULL DEFAULT 'disabled'
                              CHECK (payment_status IN ('disabled','research_only','beta','reviewed')),
  support_status            text NOT NULL DEFAULT 'disabled'
                              CHECK (support_status IN ('disabled','research_only','beta','reviewed')),

  -- property/tenancy applicability — the heart of legal gating
  property_features_status  text NOT NULL DEFAULT 'disabled'
                              CHECK (property_features_status IN
                                ('disabled','generic_only','research_only','beta','enabled')),

  -- structured config (filled per-country by the admin plane / reviewers)
  compliance_modules        jsonb NOT NULL DEFAULT '{}'::jsonb,
  tax_config                jsonb NOT NULL DEFAULT '{}'::jsonb,
  privacy_config            jsonb NOT NULL DEFAULT '{}'::jsonb,
  invoice_fields            jsonb NOT NULL DEFAULT '{}'::jsonb,
  disclaimers               jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- representative / governance
  representative_required   boolean NOT NULL DEFAULT false,
  dpo_required              boolean NOT NULL DEFAULT false,
  reviewed_by               uuid,
  reviewed_at               timestamptz,
  version                   integer NOT NULL DEFAULT 1,

  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at') THEN
    DROP TRIGGER IF EXISTS update_country_packs_updated_at ON public.country_packs;
    CREATE TRIGGER update_country_packs_updated_at
      BEFORE UPDATE ON public.country_packs
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- ── 4. MARKETPLACE MEMBERSHIP TABLES ────────────────────────────────────────
-- supplier_workspace_members — users belonging to a supplier-type workspace.
CREATE TABLE IF NOT EXISTS public.supplier_workspace_members (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id)       ON DELETE CASCADE,
  role         text NOT NULL DEFAULT 'member',
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);
CREATE INDEX IF NOT EXISTS supplier_workspace_members_ws_idx
  ON public.supplier_workspace_members (workspace_id);
CREATE INDEX IF NOT EXISTS supplier_workspace_members_user_idx
  ON public.supplier_workspace_members (user_id);

-- customer_workspace_members — users belonging to a customer-type workspace.
CREATE TABLE IF NOT EXISTS public.customer_workspace_members (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id)       ON DELETE CASCADE,
  role         text NOT NULL DEFAULT 'member',
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);
CREATE INDEX IF NOT EXISTS customer_workspace_members_ws_idx
  ON public.customer_workspace_members (workspace_id);
CREATE INDEX IF NOT EXISTS customer_workspace_members_user_idx
  ON public.customer_workspace_members (user_id);

-- marketplace_admin_roles — elevated marketplace/escrow/dispute roles per ws.
CREATE TABLE IF NOT EXISTS public.marketplace_admin_roles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id)       ON DELETE CASCADE,
  role         text NOT NULL DEFAULT 'marketplace_admin',
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id, role)
);
CREATE INDEX IF NOT EXISTS marketplace_admin_roles_ws_idx
  ON public.marketplace_admin_roles (workspace_id);
CREATE INDEX IF NOT EXISTS marketplace_admin_roles_user_idx
  ON public.marketplace_admin_roles (user_id);

-- ── 5. RLS ──────────────────────────────────────────────────────────────────

-- 5a. country_packs: any authenticated user may READ; only service-role /
--     platform-admin may WRITE. (Service-role bypasses RLS entirely, so the
--     write policies below only need to admit platform admins.)
ALTER TABLE public.country_packs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS country_packs_read_authenticated ON public.country_packs;
CREATE POLICY country_packs_read_authenticated ON public.country_packs
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS country_packs_admin_write ON public.country_packs;
CREATE POLICY country_packs_admin_write ON public.country_packs
  FOR ALL
  TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- 5b. supplier_workspace_members: workspace members manage; a user reads own row.
ALTER TABLE public.supplier_workspace_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS supplier_workspace_members_member_all ON public.supplier_workspace_members;
CREATE POLICY supplier_workspace_members_member_all ON public.supplier_workspace_members
  FOR ALL
  USING (public.is_workspace_member(workspace_id))
  WITH CHECK (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS supplier_workspace_members_self_select ON public.supplier_workspace_members;
CREATE POLICY supplier_workspace_members_self_select ON public.supplier_workspace_members
  FOR SELECT
  USING (user_id = auth.uid());

-- 5c. customer_workspace_members: workspace members manage; a user reads own row.
ALTER TABLE public.customer_workspace_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS customer_workspace_members_member_all ON public.customer_workspace_members;
CREATE POLICY customer_workspace_members_member_all ON public.customer_workspace_members
  FOR ALL
  USING (public.is_workspace_member(workspace_id))
  WITH CHECK (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS customer_workspace_members_self_select ON public.customer_workspace_members;
CREATE POLICY customer_workspace_members_self_select ON public.customer_workspace_members
  FOR SELECT
  USING (user_id = auth.uid());

-- 5d. marketplace_admin_roles: only workspace owner/admin may manage; a user
--     reads own role row; platform admins have full access.
ALTER TABLE public.marketplace_admin_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS marketplace_admin_roles_owner_admin_all ON public.marketplace_admin_roles;
CREATE POLICY marketplace_admin_roles_owner_admin_all ON public.marketplace_admin_roles
  FOR ALL
  USING (
    public.has_workspace_role(auth.uid(), workspace_id, ARRAY['owner','admin']::app_role[])
    OR public.is_platform_admin(auth.uid())
  )
  WITH CHECK (
    public.has_workspace_role(auth.uid(), workspace_id, ARRAY['owner','admin']::app_role[])
    OR public.is_platform_admin(auth.uid())
  );

DROP POLICY IF EXISTS marketplace_admin_roles_self_select ON public.marketplace_admin_roles;
CREATE POLICY marketplace_admin_roles_self_select ON public.marketplace_admin_roles
  FOR SELECT
  USING (user_id = auth.uid());

-- ── 6. SECURITY DEFINER PERMISSION HELPERS ──────────────────────────────────
-- These are intentionally conservative STUBS that later v2 phases refine.

-- is_workspace_type: does this workspace carry the given marketplace actor type?
CREATE OR REPLACE FUNCTION public.is_workspace_type(
  p_workspace uuid,
  p_type      text
) RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = p_workspace
      AND w.type = p_type
  );
$$;
REVOKE ALL ON FUNCTION public.is_workspace_type(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.is_workspace_type(uuid, text) TO authenticated;

-- can_manage_country_pack: only platform admins may curate country packs.
CREATE OR REPLACE FUNCTION public.can_manage_country_pack(
  p_user uuid
) RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT public.is_platform_admin(p_user);
$$;
REVOKE ALL ON FUNCTION public.can_manage_country_pack(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.can_manage_country_pack(uuid) TO authenticated;

-- can_release_escrow: who may release escrow held in a workspace. Stub: workspace
-- owner/admin, a marketplace admin for the workspace, or a platform admin.
CREATE OR REPLACE FUNCTION public.can_release_escrow(
  p_user      uuid,
  p_workspace uuid
) RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    public.has_workspace_role(p_user, p_workspace, ARRAY['owner','admin']::app_role[])
    OR EXISTS (
      SELECT 1 FROM public.marketplace_admin_roles r
      WHERE r.workspace_id = p_workspace
        AND r.user_id = p_user
    )
    OR public.is_platform_admin(p_user);
$$;
REVOKE ALL ON FUNCTION public.can_release_escrow(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.can_release_escrow(uuid, uuid) TO authenticated;

-- can_resolve_dispute: who may resolve a marketplace dispute. Stub: same set as
-- escrow release (owner/admin, marketplace admin, platform admin).
CREATE OR REPLACE FUNCTION public.can_resolve_dispute(
  p_user      uuid,
  p_workspace uuid
) RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    public.has_workspace_role(p_user, p_workspace, ARRAY['owner','admin']::app_role[])
    OR EXISTS (
      SELECT 1 FROM public.marketplace_admin_roles r
      WHERE r.workspace_id = p_workspace
        AND r.user_id = p_user
    )
    OR public.is_platform_admin(p_user);
$$;
REVOKE ALL ON FUNCTION public.can_resolve_dispute(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.can_resolve_dispute(uuid, uuid) TO authenticated;

-- ── 7. SEED country_packs ───────────────────────────────────────────────────
-- GB: fully reviewed, offered, property features enabled (the V1 country).
-- IE/AU/NZ/CA/US: research_only across domains, offered.
-- RU/IR/KP/SY: sanctioned → banned, every domain disabled.
-- Idempotent: ON CONFLICT updates the status fields so re-runs converge.

INSERT INTO public.country_packs
  (code, name, default_currency, default_locale, measurement_system, address_model,
   offer_status, legal_status, tax_status, privacy_status, payment_status, support_status,
   property_features_status, dpo_required, representative_required, reviewed_at, version)
VALUES
  ('GB','United Kingdom','GBP','en-GB','metric','uk',
   'offer','reviewed','reviewed','reviewed','reviewed','reviewed',
   'enabled', true, false, now(), 1),

  ('IE','Ireland','EUR','en-IE','metric','generic',
   'offer','research_only','research_only','research_only','research_only','research_only',
   'research_only', false, false, NULL, 1),

  ('AU','Australia','AUD','en-AU','metric','generic',
   'offer','research_only','research_only','research_only','research_only','research_only',
   'research_only', false, false, NULL, 1),

  ('NZ','New Zealand','NZD','en-NZ','metric','generic',
   'offer','research_only','research_only','research_only','research_only','research_only',
   'research_only', false, false, NULL, 1),

  ('CA','Canada','CAD','en-CA','metric','generic',
   'offer','research_only','research_only','research_only','research_only','research_only',
   'research_only', false, false, NULL, 1),

  ('US','United States','USD','en-US','imperial','us',
   'offer','research_only','research_only','research_only','research_only','research_only',
   'research_only', false, false, NULL, 1),

  ('RU','Russia','RUB','ru-RU','metric','generic',
   'banned','disabled','disabled','disabled','disabled','disabled',
   'disabled', false, false, NULL, 1),

  ('IR','Iran','IRR','fa-IR','metric','generic',
   'banned','disabled','disabled','disabled','disabled','disabled',
   'disabled', false, false, NULL, 1),

  ('KP','North Korea','KPW','ko-KP','metric','generic',
   'banned','disabled','disabled','disabled','disabled','disabled',
   'disabled', false, false, NULL, 1),

  ('SY','Syria','SYP','ar-SY','metric','generic',
   'banned','disabled','disabled','disabled','disabled','disabled',
   'disabled', false, false, NULL, 1)
ON CONFLICT (code) DO UPDATE SET
  name                     = EXCLUDED.name,
  default_currency         = EXCLUDED.default_currency,
  default_locale           = EXCLUDED.default_locale,
  measurement_system       = EXCLUDED.measurement_system,
  address_model            = EXCLUDED.address_model,
  offer_status             = EXCLUDED.offer_status,
  legal_status             = EXCLUDED.legal_status,
  tax_status               = EXCLUDED.tax_status,
  privacy_status           = EXCLUDED.privacy_status,
  payment_status           = EXCLUDED.payment_status,
  support_status           = EXCLUDED.support_status,
  property_features_status = EXCLUDED.property_features_status,
  dpo_required             = EXCLUDED.dpo_required,
  representative_required  = EXCLUDED.representative_required,
  updated_at               = now();

-- ============================================================================
-- END v2 foundation
-- ============================================================================
