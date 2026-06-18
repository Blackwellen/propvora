-- ════════════════════════════════════════════════════════════════════════════
-- Supplier Schedule & Services depth — additive support for the Solo supplier
-- Schedule (Calendar / Availability / Time Off) and Services (Catalogue /
-- Packages) surfaces.
--
-- ADDITIVE & IDEMPOTENT. Every object uses IF NOT EXISTS / DO-guards. Existing
-- supplier_* tables are LEFT UNTOUCHED and REUSED:
--   • supplier_workspace_services      (catalogue rows — already exists)
--   • supplier_workspace_packages      (package rows — already exists)
--   • supplier_schedule_events         (calendar entries — already exists)
--   • supplier_availability_rules      (recurring hours — already exists)
--   • supplier_workspace_coverage_areas / _availability (already exist)
-- This migration only adds the genuinely-missing relational depth:
--   • supplier_service_package_lines    (service lines inside a package)
--   • supplier_service_addons           (optional add-ons per service/package)
--   • supplier_service_pricing          (fixed / range / quote-only pricing)
--   • supplier_service_coverage         (per-service coverage areas)
--   • supplier_service_delivery_rules   (instant-pay/emergency/SLA delivery)
--   • supplier_time_off                 (time-off blocks for the Schedule)
--
-- Money is integer pence (bigint *_pence columns) to match the supplier money
-- convention. Standard columns on every new table:
--   id, workspace_id, supplier_workspace_id, status, created_at/updated_at,
--   created_by, archived_at, metadata_json, plus the relevant service_id /
--   package_id FKs.
--
-- RLS uses the REAL platform membership table public.workspace_members
-- (workspace_id, user_id) — the exact EXISTS(...) pattern used by
-- calendar_events et al. Service role bypasses RLS entirely.
-- ════════════════════════════════════════════════════════════════════════════

-- ── shared updated_at trigger fn (reused; created here if depth fn is absent) ─
CREATE OR REPLACE FUNCTION public._supplier_sched_svc_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

-- ── 1. supplier_service_pricing — fixed / range / quote-only price model ─────
CREATE TABLE IF NOT EXISTS public.supplier_service_pricing (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  supplier_workspace_id uuid,
  service_id            uuid,
  pricing_model         text NOT NULL DEFAULT 'quote_only',
                          -- 'fixed' | 'range' | 'quote_only'
  price_pence           bigint,
  price_min_pence       bigint,
  price_max_pence       bigint,
  cost_pence            bigint,
  currency              text NOT NULL DEFAULT 'GBP',
  instant_pay           boolean NOT NULL DEFAULT false,
  status                text NOT NULL DEFAULT 'active',
  metadata_json         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by            uuid,
  archived_at           timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS supplier_service_pricing_ws_idx ON public.supplier_service_pricing (workspace_id);
CREATE INDEX IF NOT EXISTS supplier_service_pricing_sws_idx ON public.supplier_service_pricing (supplier_workspace_id);
CREATE INDEX IF NOT EXISTS supplier_service_pricing_status_idx ON public.supplier_service_pricing (status);
CREATE INDEX IF NOT EXISTS supplier_service_pricing_created_idx ON public.supplier_service_pricing (created_at);
CREATE INDEX IF NOT EXISTS supplier_service_pricing_service_idx ON public.supplier_service_pricing (service_id);

-- ── 2. supplier_service_coverage — per-service coverage areas ────────────────
CREATE TABLE IF NOT EXISTS public.supplier_service_coverage (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  supplier_workspace_id uuid,
  service_id            uuid,
  area_type             text NOT NULL DEFAULT 'all_areas',
                          -- 'all_areas' | 'radius' | 'postcode' | 'region'
  area_label            text,
  radius_km             integer,
  status                text NOT NULL DEFAULT 'active',
  metadata_json         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by            uuid,
  archived_at           timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS supplier_service_coverage_ws_idx ON public.supplier_service_coverage (workspace_id);
CREATE INDEX IF NOT EXISTS supplier_service_coverage_sws_idx ON public.supplier_service_coverage (supplier_workspace_id);
CREATE INDEX IF NOT EXISTS supplier_service_coverage_status_idx ON public.supplier_service_coverage (status);
CREATE INDEX IF NOT EXISTS supplier_service_coverage_created_idx ON public.supplier_service_coverage (created_at);
CREATE INDEX IF NOT EXISTS supplier_service_coverage_service_idx ON public.supplier_service_coverage (service_id);

-- ── 3. supplier_service_delivery_rules — instant-pay/emergency/SLA delivery ──
CREATE TABLE IF NOT EXISTS public.supplier_service_delivery_rules (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  supplier_workspace_id uuid,
  service_id            uuid,
  instant_book          boolean NOT NULL DEFAULT false,
  emergency             boolean NOT NULL DEFAULT false,
  lead_time_hours       integer,
  travel_buffer_minutes integer,
  max_jobs_per_day      integer,
  response_window_hours integer,
  -- Team extension point (NOT surfaced in Solo): per-service SLA targets.
  sla_response_minutes  integer,
  sla_resolve_hours     integer,
  status                text NOT NULL DEFAULT 'active',
  metadata_json         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by            uuid,
  archived_at           timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS supplier_service_delivery_rules_ws_idx ON public.supplier_service_delivery_rules (workspace_id);
CREATE INDEX IF NOT EXISTS supplier_service_delivery_rules_sws_idx ON public.supplier_service_delivery_rules (supplier_workspace_id);
CREATE INDEX IF NOT EXISTS supplier_service_delivery_rules_status_idx ON public.supplier_service_delivery_rules (status);
CREATE INDEX IF NOT EXISTS supplier_service_delivery_rules_created_idx ON public.supplier_service_delivery_rules (created_at);
CREATE INDEX IF NOT EXISTS supplier_service_delivery_rules_service_idx ON public.supplier_service_delivery_rules (service_id);

-- ── 4. supplier_service_addons — optional add-ons (per service or package) ───
CREATE TABLE IF NOT EXISTS public.supplier_service_addons (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  supplier_workspace_id uuid,
  service_id            uuid,
  package_id            uuid,
  name                  text NOT NULL,
  description           text,
  price_pence           bigint,
  cost_pence            bigint,
  currency              text NOT NULL DEFAULT 'GBP',
  attach_rate           numeric,        -- 0..1 historical attach rate
  is_default            boolean NOT NULL DEFAULT false,
  position              integer NOT NULL DEFAULT 0,
  status                text NOT NULL DEFAULT 'active',
  metadata_json         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by            uuid,
  archived_at           timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS supplier_service_addons_ws_idx ON public.supplier_service_addons (workspace_id);
CREATE INDEX IF NOT EXISTS supplier_service_addons_sws_idx ON public.supplier_service_addons (supplier_workspace_id);
CREATE INDEX IF NOT EXISTS supplier_service_addons_status_idx ON public.supplier_service_addons (status);
CREATE INDEX IF NOT EXISTS supplier_service_addons_created_idx ON public.supplier_service_addons (created_at);
CREATE INDEX IF NOT EXISTS supplier_service_addons_service_idx ON public.supplier_service_addons (service_id);
CREATE INDEX IF NOT EXISTS supplier_service_addons_package_idx ON public.supplier_service_addons (package_id);

-- ── 5. supplier_service_package_lines — service lines inside a package ───────
CREATE TABLE IF NOT EXISTS public.supplier_service_package_lines (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  supplier_workspace_id uuid,
  package_id            uuid,
  service_id            uuid,
  label                 text NOT NULL,
  description           text,
  price_pence           bigint,
  cost_pence            bigint,
  currency              text NOT NULL DEFAULT 'GBP',
  quantity              integer NOT NULL DEFAULT 1,
  position              integer NOT NULL DEFAULT 0,
  status                text NOT NULL DEFAULT 'active',
  metadata_json         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by            uuid,
  archived_at           timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS supplier_service_package_lines_ws_idx ON public.supplier_service_package_lines (workspace_id);
CREATE INDEX IF NOT EXISTS supplier_service_package_lines_sws_idx ON public.supplier_service_package_lines (supplier_workspace_id);
CREATE INDEX IF NOT EXISTS supplier_service_package_lines_status_idx ON public.supplier_service_package_lines (status);
CREATE INDEX IF NOT EXISTS supplier_service_package_lines_created_idx ON public.supplier_service_package_lines (created_at);
CREATE INDEX IF NOT EXISTS supplier_service_package_lines_package_idx ON public.supplier_service_package_lines (package_id);
CREATE INDEX IF NOT EXISTS supplier_service_package_lines_service_idx ON public.supplier_service_package_lines (service_id);

-- ── 6. supplier_time_off — time-off blocks for the Schedule ──────────────────
CREATE TABLE IF NOT EXISTS public.supplier_time_off (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  supplier_workspace_id uuid,
  reason_code           text NOT NULL DEFAULT 'annual_leave',
                          -- annual_leave | pm_off | personal | training | holiday | other
  title                 text,
  note                  text,
  starts_at             timestamptz,
  ends_at               timestamptz,
  all_day               boolean NOT NULL DEFAULT true,
  recurring_rule        text,           -- iCal-style RRULE string or null
  auto_decline          boolean NOT NULL DEFAULT true,
  notify_customers      boolean NOT NULL DEFAULT true,
  affected_jobs         integer NOT NULL DEFAULT 0,
  status                text NOT NULL DEFAULT 'scheduled',
  metadata_json         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by            uuid,
  archived_at           timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS supplier_time_off_ws_idx ON public.supplier_time_off (workspace_id);
CREATE INDEX IF NOT EXISTS supplier_time_off_sws_idx ON public.supplier_time_off (supplier_workspace_id);
CREATE INDEX IF NOT EXISTS supplier_time_off_status_idx ON public.supplier_time_off (status);
CREATE INDEX IF NOT EXISTS supplier_time_off_created_idx ON public.supplier_time_off (created_at);
CREATE INDEX IF NOT EXISTS supplier_time_off_starts_idx ON public.supplier_time_off (starts_at);

-- ── updated_at triggers ──────────────────────────────────────────────────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'supplier_service_pricing','supplier_service_coverage',
    'supplier_service_delivery_rules','supplier_service_addons',
    'supplier_service_package_lines','supplier_time_off'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', t || '_touch', t);
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public._supplier_sched_svc_touch_updated_at()',
      t || '_touch', t
    );
  END LOOP;
END $$;

-- ── RLS — REAL public.workspace_members(workspace_id, user_id) membership ─────
-- Exact EXISTS(...) pattern copied from calendar_events / 012_calendar_level2.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'supplier_service_pricing','supplier_service_coverage',
    'supplier_service_delivery_rules','supplier_service_addons',
    'supplier_service_package_lines','supplier_time_off'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    -- SELECT: any member of the owning workspace.
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_select', t);
    EXECUTE format($f$
      CREATE POLICY %I ON public.%I FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.workspace_members wm
          WHERE wm.workspace_id = %I.workspace_id
            AND wm.user_id = auth.uid()
        )
      )$f$, t || '_select', t, t);

    -- ALL (insert/update/delete): owner / admin / manager of the workspace.
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_write', t);
    EXECUTE format($f$
      CREATE POLICY %I ON public.%I FOR ALL
        USING (
          EXISTS (
            SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = %I.workspace_id
              AND wm.user_id = auth.uid()
              AND wm.role IN ('owner','admin','manager')
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = %I.workspace_id
              AND wm.user_id = auth.uid()
              AND wm.role IN ('owner','admin','manager')
          )
        )$f$, t || '_write', t, t, t);
  END LOOP;
END $$;
