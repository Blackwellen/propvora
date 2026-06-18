-- ============================================================
-- 20260617200000_automations_section.sql
-- AUTOMATIONS SECTION — additive, workspace-scoped tables backing the
-- enterprise Automations control centre (Home, Recipes, My Automations,
-- Runs & Logs, Approvals, Errors, Integrations, Webhooks, AI Builder,
-- Usage & Limits, Admin Controls).
--
-- 100% ADDITIVE and IDEMPOTENT. Every statement uses IF NOT EXISTS / DROP
-- POLICY IF EXISTS so it is safe to re-run and NEVER clobbers existing
-- automation tables (automation_definitions, automation_v2_runs,
-- smart_rules, the legacy automation_recipes/automation_runs, etc.).
--
-- The UI reads these via seed-fallback hooks: if a table is missing or a
-- query fails (42P01 / RLS), the page renders premium seed data instead.
--
-- RLS model: workspace-membership via public.workspace_members(workspace_id,
-- user_id) — the SAME pattern as 20260616140000_automation_v2.sql.
-- ============================================================

-- ──────────────────────────── Recipes ────────────────────────────
-- NOTE: a legacy `automation_recipes` table may already exist with a
-- different shape; CREATE IF NOT EXISTS leaves it untouched.
CREATE TABLE IF NOT EXISTS public.automation_recipes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL,
  name          text NOT NULL,
  category      text,
  trigger       text,
  action_count  integer NOT NULL DEFAULT 0,
  modules       text[] NOT NULL DEFAULT '{}',
  time_saved    text,
  success_rate  numeric,
  difficulty    text DEFAULT 'Easy',
  review_first  boolean NOT NULL DEFAULT true,
  used_count    integer NOT NULL DEFAULT 0,
  badge         text,
  tags          text[] NOT NULL DEFAULT '{}',
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ──────────────────────────── Runs & steps ────────────────────────────
CREATE TABLE IF NOT EXISTS public.automation_runs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   uuid NOT NULL,
  ref            text,
  automation     text,
  trigger_event  text,
  status         text NOT NULL DEFAULT 'success',
  started_at     timestamptz NOT NULL DEFAULT now(),
  duration_ms    integer,
  outputs        integer NOT NULL DEFAULT 0,
  approvals      integer NOT NULL DEFAULT 0,
  initiated_by   text,
  initiated_kind text DEFAULT 'System',
  created_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.automation_run_steps (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  run_id       uuid,
  step         text NOT NULL,
  status       text NOT NULL DEFAULT 'success',
  duration_ms  integer,
  started_at   timestamptz,
  details      text,
  created_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ──────────────────────────── Approvals ────────────────────────────
CREATE TABLE IF NOT EXISTS public.automation_approvals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid NOT NULL,
  ref             text,
  automation      text,
  proposed_action text,
  risk_level      text NOT NULL DEFAULT 'low',
  related_to      text,
  related_ref     text,
  requested_by    text,
  impact          text DEFAULT 'low',
  review_deadline timestamptz,
  confidence      integer,
  summary         text,
  status          text NOT NULL DEFAULT 'pending',
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ──────────────────────────── Errors ────────────────────────────
CREATE TABLE IF NOT EXISTS public.automation_errors (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid NOT NULL,
  ref             text,
  title           text,
  subtitle        text,
  automation      text,
  automation_ref  text,
  severity        text NOT NULL DEFAULT 'low',
  first_seen      timestamptz NOT NULL DEFAULT now(),
  latest_seen     timestamptz NOT NULL DEFAULT now(),
  impacted_record text,
  retry_count     integer NOT NULL DEFAULT 0,
  owner           text,
  status          text NOT NULL DEFAULT 'active',
  safe_to_retry   boolean NOT NULL DEFAULT true,
  retries_remaining integer NOT NULL DEFAULT 0,
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ──────────────────────────── Integrations ────────────────────────────
CREATE TABLE IF NOT EXISTS public.automation_integrations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL,
  name          text NOT NULL,
  category      text,
  health        text NOT NULL DEFAULT 'healthy',
  environment   text DEFAULT 'Production',
  last_sync     timestamptz,
  permissions   text,
  capabilities  text,
  executions    integer NOT NULL DEFAULT 0,
  success_rate  numeric,
  enabled       boolean NOT NULL DEFAULT true,
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ──────────────────────────── Webhooks ────────────────────────────
CREATE TABLE IF NOT EXISTS public.automation_webhook_endpoints (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL,
  name          text NOT NULL,
  slug          text,
  url           text,
  event_groups  text[] NOT NULL DEFAULT '{}',
  event_count   integer NOT NULL DEFAULT 0,
  secret_set    boolean NOT NULL DEFAULT false,
  environment   text DEFAULT 'Production',
  last_delivery timestamptz,
  success_rate  numeric,
  enabled       boolean NOT NULL DEFAULT true,
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.automation_webhook_deliveries (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  endpoint_id  uuid,
  event        text,
  event_id     text,
  environment  text,
  status       text NOT NULL DEFAULT 'success',
  delivered_at timestamptz NOT NULL DEFAULT now(),
  response     integer,
  latency_ms   integer,
  retries      integer NOT NULL DEFAULT 0,
  created_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ──────────────────────────── AI Builder ────────────────────────────
CREATE TABLE IF NOT EXISTS public.automation_ai_prompts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  prompt       text NOT NULL,
  created_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.automation_ai_outputs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  prompt_id    uuid,
  name         text,
  status       text NOT NULL DEFAULT 'Draft',
  graph        jsonb NOT NULL DEFAULT '{}'::jsonb,
  score        integer,
  created_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ──────────────────────────── Usage & limits ────────────────────────────
CREATE TABLE IF NOT EXISTS public.automation_usage_daily (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL,
  day           date NOT NULL DEFAULT current_date,
  runs          integer NOT NULL DEFAULT 0,
  ai_credits    integer NOT NULL DEFAULT 0,
  webhook_volume integer NOT NULL DEFAULT 0,
  storage_gb    numeric NOT NULL DEFAULT 0,
  module        text,
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.automation_usage_limits (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id       uuid NOT NULL,
  plan               text,
  runs_limit         integer,
  ai_credits_limit   integer,
  webhooks_limit     integer,
  storage_limit_gb   integer,
  active_limit       integer,
  concurrent_limit   integer,
  approval_queue_limit integer,
  status             text DEFAULT 'Healthy',
  created_by         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- ──────────────────────────── Policy & audit ────────────────────────────
CREATE TABLE IF NOT EXISTS public.automation_policy_controls (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL,
  control_key   text NOT NULL,
  value         text,
  enforced      boolean NOT NULL DEFAULT true,
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.automation_audit_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL,
  actor         text,
  action        text NOT NULL,
  target        text,
  metadata      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ──────────────────────────── Indexes ────────────────────────────
CREATE INDEX IF NOT EXISTS idx_auto_recipes_ws        ON public.automation_recipes(workspace_id, created_at);
CREATE INDEX IF NOT EXISTS idx_auto_runs_ws_status    ON public.automation_runs(workspace_id, status, started_at);
CREATE INDEX IF NOT EXISTS idx_auto_run_steps_ws_run  ON public.automation_run_steps(workspace_id, run_id);
CREATE INDEX IF NOT EXISTS idx_auto_approvals_ws      ON public.automation_approvals(workspace_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_auto_errors_ws         ON public.automation_errors(workspace_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_auto_integrations_ws   ON public.automation_integrations(workspace_id, health);
CREATE INDEX IF NOT EXISTS idx_auto_wh_endpoints_ws   ON public.automation_webhook_endpoints(workspace_id, environment);
CREATE INDEX IF NOT EXISTS idx_auto_wh_deliveries_ws  ON public.automation_webhook_deliveries(workspace_id, status, delivered_at);
CREATE INDEX IF NOT EXISTS idx_auto_ai_prompts_ws     ON public.automation_ai_prompts(workspace_id, created_at);
CREATE INDEX IF NOT EXISTS idx_auto_ai_outputs_ws     ON public.automation_ai_outputs(workspace_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_auto_usage_daily_ws    ON public.automation_usage_daily(workspace_id, day);
CREATE INDEX IF NOT EXISTS idx_auto_usage_limits_ws   ON public.automation_usage_limits(workspace_id);
CREATE INDEX IF NOT EXISTS idx_auto_policy_ws         ON public.automation_policy_controls(workspace_id, control_key);
CREATE INDEX IF NOT EXISTS idx_auto_audit_ws          ON public.automation_audit_events(workspace_id, created_at);

-- ──────────────────────────── RLS + workspace-membership policies ────────────────────────────
-- Mirrors the existing automation_v2 RLS pattern exactly.
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'automation_recipes',
    'automation_runs',
    'automation_run_steps',
    'automation_approvals',
    'automation_errors',
    'automation_integrations',
    'automation_webhook_endpoints',
    'automation_webhook_deliveries',
    'automation_ai_prompts',
    'automation_ai_outputs',
    'automation_usage_daily',
    'automation_usage_limits',
    'automation_policy_controls',
    'automation_audit_events'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS %I_ws_member ON public.%I;', t, t);
    EXECUTE format($p$
      CREATE POLICY %I_ws_member ON public.%I FOR ALL
      USING (EXISTS (
        SELECT 1 FROM public.workspace_members wm
        WHERE wm.workspace_id = %I.workspace_id AND wm.user_id = auth.uid()
      ))
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.workspace_members wm
        WHERE wm.workspace_id = %I.workspace_id AND wm.user_id = auth.uid()
      ));
    $p$, t, t, t, t);
  END LOOP;
END $$;
