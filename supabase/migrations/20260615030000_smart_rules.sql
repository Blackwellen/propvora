-- ============================================================
-- 20260615030000_smart_rules.sql
-- Smart Rules automation engine (review-first).
--
-- A workspace-scoped automation engine that EVALUATES live Propvora data
-- (compliance due/overdue, tenancy ending, rent arrears, planning offers,
-- jobs complete, HMO/EPC licence expiring) and PROPOSES safe, reversible
-- actions (create task / notification / draft message / flag / calendar
-- reminder). Nothing destructive or irreversible ever auto-executes.
--
-- Review-first contract:
--   * Every rule has review_required (default true).
--   * A matched rule produces a `smart_rule_runs` row.
--   * review_required runs stay status='pending_review' until a workspace
--     member Approves them in the UI, which then executes the action.
--   * Each executed action is logged to `smart_rule_actions` AND audit_logs.
--
-- Why a new `smart_rule_*` namespace (not the existing automation_rules):
-- the live `automation_rules`/`automation_runs` tables already exist with an
-- incompatible shape (enum `recipe`, no trigger_type/action_type/review_required).
-- This migration adds a clean, self-contained set of tables that match the
-- Smart Rules column contract exactly, leaving the legacy tables untouched.
--
-- Idempotent: CREATE TABLE IF NOT EXISTS + DROP POLICY IF EXISTS, so it is
-- safe to re-run.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- smart_rules
--   One automation rule: a trigger, an optional condition, and an action.
--   trigger_type / action_type are free text validated by CHECK against the
--   catalogues the engine understands.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.smart_rules (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name              text NOT NULL,
  description       text,
  enabled           boolean NOT NULL DEFAULT true,
  trigger_type      text NOT NULL,
  trigger_config    jsonb NOT NULL DEFAULT '{}'::jsonb,
  condition_config  jsonb NOT NULL DEFAULT '{}'::jsonb,
  action_type       text NOT NULL,
  action_config     jsonb NOT NULL DEFAULT '{}'::jsonb,
  review_required   boolean NOT NULL DEFAULT true,
  template_id       text,
  last_evaluated_at timestamptz,
  created_by        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  demo              boolean NOT NULL DEFAULT false,
  demo_batch_id     uuid,
  demo_expires_at   timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT smart_rules_trigger_type_chk CHECK (trigger_type IN (
    'compliance_due_soon','compliance_overdue','tenancy_ending','rent_overdue',
    'planning_offer_sent','planning_offer_expiring','job_completed','licence_expiring'
  )),
  CONSTRAINT smart_rules_action_type_chk CHECK (action_type IN (
    'create_task','create_notification','draft_message','flag_record','create_calendar_reminder'
  ))
);

-- ────────────────────────────────────────────────────────────
-- smart_rule_runs
--   One evaluation match: a rule fired against a specific record. Stays
--   'pending_review' for review_required rules until approved; safe
--   auto-allowed runs may go straight to 'executed'.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.smart_rule_runs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id       uuid NOT NULL REFERENCES public.smart_rules(id) ON DELETE CASCADE,
  workspace_id  uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  triggered_at  timestamptz NOT NULL DEFAULT now(),
  status        text NOT NULL DEFAULT 'pending_review',
  context       jsonb NOT NULL DEFAULT '{}'::jsonb,
  error         text,
  reviewed_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at   timestamptz,
  demo          boolean NOT NULL DEFAULT false,
  demo_batch_id uuid,
  demo_expires_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT smart_rule_runs_status_chk CHECK (status IN (
    'pending_review','approved','executed','skipped','failed'
  ))
);

-- ────────────────────────────────────────────────────────────
-- smart_rule_actions
--   The concrete action a run will perform / has performed. Holds the
--   resolved payload and, once executed, the result (e.g. inserted row id).
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.smart_rule_actions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id       uuid NOT NULL REFERENCES public.smart_rule_runs(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  action_type  text NOT NULL,
  payload      jsonb NOT NULL DEFAULT '{}'::jsonb,
  status       text NOT NULL DEFAULT 'pending',
  executed_at  timestamptz,
  result       jsonb,
  demo         boolean NOT NULL DEFAULT false,
  demo_batch_id uuid,
  demo_expires_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT smart_rule_actions_status_chk CHECK (status IN (
    'pending','executed','skipped','failed'
  ))
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_smart_rules_workspace      ON public.smart_rules(workspace_id);
CREATE INDEX IF NOT EXISTS idx_smart_rules_enabled        ON public.smart_rules(workspace_id, enabled);
CREATE INDEX IF NOT EXISTS idx_smart_rule_runs_workspace  ON public.smart_rule_runs(workspace_id, triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_smart_rule_runs_rule       ON public.smart_rule_runs(rule_id, triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_smart_rule_runs_status     ON public.smart_rule_runs(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_smart_rule_actions_run     ON public.smart_rule_actions(run_id);
CREATE INDEX IF NOT EXISTS idx_smart_rule_actions_ws      ON public.smart_rule_actions(workspace_id);

-- ============================================================
-- RLS — workspace-member policy on each table (codebase pattern)
-- ============================================================
ALTER TABLE public.smart_rules        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_rule_runs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_rule_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS smart_rules_workspace_member ON public.smart_rules;
CREATE POLICY smart_rules_workspace_member ON public.smart_rules FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = smart_rules.workspace_id AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = smart_rules.workspace_id AND wm.user_id = auth.uid()));

DROP POLICY IF EXISTS smart_rule_runs_workspace_member ON public.smart_rule_runs;
CREATE POLICY smart_rule_runs_workspace_member ON public.smart_rule_runs FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = smart_rule_runs.workspace_id AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = smart_rule_runs.workspace_id AND wm.user_id = auth.uid()));

DROP POLICY IF EXISTS smart_rule_actions_workspace_member ON public.smart_rule_actions;
CREATE POLICY smart_rule_actions_workspace_member ON public.smart_rule_actions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = smart_rule_actions.workspace_id AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = smart_rule_actions.workspace_id AND wm.user_id = auth.uid()));
