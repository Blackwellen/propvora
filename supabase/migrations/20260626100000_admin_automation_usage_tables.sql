-- Migration: Admin automation usage tables
-- Adds: automation_runs missing columns, automation_usage_limits, automation_usage_daily

-- 1. Add missing columns to automation_runs (already applied to live DB via PAT)
ALTER TABLE automation_runs
  ADD COLUMN IF NOT EXISTS ref             text,
  ADD COLUMN IF NOT EXISTS automation      text,
  ADD COLUMN IF NOT EXISTS duration_ms     integer,
  ADD COLUMN IF NOT EXISTS initiated_by    uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS created_at      timestamptz NOT NULL DEFAULT now();

-- 2. Per-workspace automation usage limits
CREATE TABLE IF NOT EXISTS automation_usage_limits (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  monthly_run_cap     integer NOT NULL DEFAULT 500,
  concurrent_cap      integer NOT NULL DEFAULT 5,
  status              text NOT NULL DEFAULT 'ok'
                        CHECK (status IN ('ok','warning','over_limit','suspended')),
  runs_this_month     integer NOT NULL DEFAULT 0,
  reset_at            timestamptz,
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id)
);

ALTER TABLE automation_usage_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_role_full ON automation_usage_limits
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3. Daily usage log per workspace
CREATE TABLE IF NOT EXISTS automation_usage_daily (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  day             date NOT NULL,
  run_count       integer NOT NULL DEFAULT 0,
  error_count     integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, day)
);

ALTER TABLE automation_usage_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_role_full ON automation_usage_daily
  FOR ALL TO service_role USING (true) WITH CHECK (true);
