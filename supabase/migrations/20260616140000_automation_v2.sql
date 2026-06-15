-- ============================================================
-- 20260616140000_automation_v2.sql
-- AUTOMATION v2 — versioned DEFINITIONS, run HISTORY, run STEPS,
-- per-plan run CAPS, and a DRY-RUN-capable run model.
--
-- EXTENDS the existing Smart Rules engine (migration 20260615030000).
-- It does NOT replace smart_rules / smart_rule_runs / smart_rule_actions, and
-- it does NOT touch the legacy `automation_recipes` / `automation_rules` /
-- `automation_runs` / `automation_events` tables (which already exist with an
-- incompatible shape — `automation_runs` has rule_id/recipe_id/ran_at and no
-- definition_id/is_dry_run/started_at). To avoid clobbering that table, the v2
-- run-history table is named `automation_v2_runs` (a clean, self-contained
-- namespace), exactly as smart_rules introduced its own namespace.
--
-- The v2 model:
--   * automation_definitions  — versioned rule definitions (trigger/conditions/
--     actions as jsonb, multi-action, multi-source: builder/nl/canvas/template/api).
--   * automation_v2_runs      — append-only run history; a run may be a DRY RUN
--     (is_dry_run=true / status='dry_run') which NEVER performs side-effects.
--   * automation_run_steps    — per-action step record; a dry run produces
--     status='simulated' steps describing what WOULD happen.
--   * automation_caps_usage   — monthly run counter per workspace for plan caps.
--
-- Idempotent + additive: CREATE TABLE IF NOT EXISTS, ADD COLUMN IF NOT EXISTS,
-- DROP POLICY IF EXISTS. Safe to re-run.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- automation_definitions
--   A versioned automation definition. trigger/conditions/actions are jsonb,
--   validated in the TS layer against the existing catalogue vocabulary. Unlike
--   smart_rules (single action_type), a definition holds an ARRAY of actions.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.automation_definitions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name         text NOT NULL,
  description  text,
  trigger      jsonb NOT NULL DEFAULT '{}'::jsonb,   -- { kind: 'event'|'schedule'|'webhook', type, config }
  conditions   jsonb NOT NULL DEFAULT '{}'::jsonb,
  actions      jsonb NOT NULL DEFAULT '[]'::jsonb,   -- [{ action_type, config }, ...]
  enabled      boolean NOT NULL DEFAULT true,
  version      integer NOT NULL DEFAULT 1,
  source       text NOT NULL DEFAULT 'builder',
  created_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT automation_definitions_source_chk CHECK (source IN (
    'builder','nl','canvas','template','api'
  ))
);

-- ────────────────────────────────────────────────────────────
-- automation_v2_runs
--   Append-only run history. status='dry_run' / is_dry_run=true marks a
--   simulation that performed NO real side-effects. definition_id is nullable so
--   an ad-hoc dry-run of an unsaved definition can still be recorded.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.automation_v2_runs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  definition_id   uuid REFERENCES public.automation_definitions(id) ON DELETE SET NULL,
  status          text NOT NULL DEFAULT 'queued',
  trigger_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at      timestamptz,
  finished_at     timestamptz,
  error           text,
  is_dry_run      boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT automation_v2_runs_status_chk CHECK (status IN (
    'queued','running','succeeded','failed','skipped','dry_run'
  ))
);

-- ────────────────────────────────────────────────────────────
-- automation_run_steps
--   One row per action attempted in a run. 'simulated' is the dry-run status:
--   the step describes what WOULD happen, with no real write performed.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.automation_run_steps (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id      uuid NOT NULL REFERENCES public.automation_v2_runs(id) ON DELETE CASCADE,
  step_index  integer NOT NULL DEFAULT 0,
  action_type text NOT NULL,
  status      text NOT NULL DEFAULT 'pending',
  input       jsonb NOT NULL DEFAULT '{}'::jsonb,
  output      jsonb NOT NULL DEFAULT '{}'::jsonb,
  error       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT automation_run_steps_status_chk CHECK (status IN (
    'pending','succeeded','failed','skipped','simulated'
  ))
);

-- ────────────────────────────────────────────────────────────
-- automation_caps_usage
--   Monthly run counter per workspace. period_start is the first day of the
--   billing month (UTC). One row per (workspace, period).
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.automation_caps_usage (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  runs_count   integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT automation_caps_usage_unique UNIQUE (workspace_id, period_start)
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_automation_definitions_ws   ON public.automation_definitions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_automation_definitions_en   ON public.automation_definitions(workspace_id, enabled);
CREATE INDEX IF NOT EXISTS idx_automation_v2_runs_ws       ON public.automation_v2_runs(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_v2_runs_def      ON public.automation_v2_runs(definition_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_v2_runs_status   ON public.automation_v2_runs(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_automation_run_steps_run    ON public.automation_run_steps(run_id, step_index);
CREATE INDEX IF NOT EXISTS idx_automation_caps_usage_ws    ON public.automation_caps_usage(workspace_id, period_start DESC);

-- ============================================================
-- RLS — workspace-member policy on each table (codebase pattern).
-- Run steps inherit workspace scope through their parent run.
-- ============================================================
ALTER TABLE public.automation_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_v2_runs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_run_steps   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_caps_usage  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS automation_definitions_workspace_member ON public.automation_definitions;
CREATE POLICY automation_definitions_workspace_member ON public.automation_definitions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = automation_definitions.workspace_id AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = automation_definitions.workspace_id AND wm.user_id = auth.uid()));

DROP POLICY IF EXISTS automation_v2_runs_workspace_member ON public.automation_v2_runs;
CREATE POLICY automation_v2_runs_workspace_member ON public.automation_v2_runs FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = automation_v2_runs.workspace_id AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = automation_v2_runs.workspace_id AND wm.user_id = auth.uid()));

DROP POLICY IF EXISTS automation_run_steps_workspace_member ON public.automation_run_steps;
CREATE POLICY automation_run_steps_workspace_member ON public.automation_run_steps FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.automation_v2_runs r
    JOIN public.workspace_members wm ON wm.workspace_id = r.workspace_id
    WHERE r.id = automation_run_steps.run_id AND wm.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.automation_v2_runs r
    JOIN public.workspace_members wm ON wm.workspace_id = r.workspace_id
    WHERE r.id = automation_run_steps.run_id AND wm.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS automation_caps_usage_workspace_member ON public.automation_caps_usage;
CREATE POLICY automation_caps_usage_workspace_member ON public.automation_caps_usage FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = automation_caps_usage.workspace_id AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = automation_caps_usage.workspace_id AND wm.user_id = auth.uid()));
