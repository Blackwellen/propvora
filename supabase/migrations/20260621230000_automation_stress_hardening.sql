-- ============================================================
-- 20260621230000_automation_stress_hardening.sql
-- FIX-282: Enterprise automation nodes — stress audit, idempotency,
-- concurrent-execution safety, and missing index coverage.
--
-- ADDITIVE ONLY. All statements use IF NOT EXISTS / OR REPLACE.
-- Safe to re-run.
-- ============================================================

-- ── 1. Queue-drain performance: index on (status, is_dry_run, created_at) ────
-- The claimQueuedRuns selector in executor.ts filters on status='queued' and
-- is_dry_run=false, ordered by created_at ascending. Without a covering index
-- this is a sequential scan on every drain call (up to 10+ concurrent calls).
CREATE INDEX IF NOT EXISTS idx_automation_v2_runs_queue_drain
  ON public.automation_v2_runs(status, is_dry_run, created_at ASC)
  WHERE status = 'queued' AND is_dry_run = false;

-- ── 2. Node-run lookup by (run_id, node_key): idempotency checks ─────────────
-- When the executor writes automation_node_runs it queries by (run_id, node_key)
-- in the approvals path. A composite index ensures those lookups are O(log n).
CREATE INDEX IF NOT EXISTS idx_automation_node_runs_run_key
  ON public.automation_node_runs(run_id, node_key);

-- ── 3. Run events: workspace + run + created_at for the timeline API ──────────
-- The listRunEvents call filters on run_id and orders by created_at. The existing
-- idx_automation_run_events_run covers (run_id, created_at) but not workspace_id.
-- This partial index covers the common path with workspace scoping.
CREATE INDEX IF NOT EXISTS idx_automation_run_events_ws_run
  ON public.automation_run_events(workspace_id, run_id, created_at ASC);

-- ── 4. Errors surface: workspace + definition + created_at ────────────────────
-- The errors list is queried by workspace_id + resolved + definition_id.
-- Add a covering index for the definition_id filter path.
CREATE INDEX IF NOT EXISTS idx_automation_errors_def
  ON public.automation_errors(workspace_id, definition_id, created_at DESC)
  WHERE definition_id IS NOT NULL;

-- ── 5. Approvals: run_id + status for the approval-gate path ─────────────────
-- Approval lookups during run execution filter on (run_id, status='pending').
CREATE INDEX IF NOT EXISTS idx_automation_approvals_run_status
  ON public.automation_approvals(run_id, status)
  WHERE status = 'pending';

-- ── 6. Caps usage: unique constraint already exists; add a functional index ───
-- period_start is stored as a date (YYYY-MM-01). The getRunUsage query filters
-- on (workspace_id, period_start). The existing unique constraint covers this
-- as an index; no new index needed — confirm it exists.
-- (Documented here for the audit trail; no DDL change required.)

-- ── 7. Smart-rule runs: dedupe-key lookup ────────────────────────────────────
-- evaluateWorkspace() loads all recent runs and builds a `seen` Set from
-- context->>'dedupe_key'. A GIN index on the context jsonb column makes this
-- tolerant of large run histories.
CREATE INDEX IF NOT EXISTS idx_smart_rule_runs_context_gin
  ON public.smart_rule_runs USING gin(context jsonb_path_ops);

-- ── 8. Smart-rule runs: workspace + triggered_at for the 30-day window ────────
CREATE INDEX IF NOT EXISTS idx_smart_rule_runs_ws_triggered
  ON public.smart_rule_runs(workspace_id, triggered_at DESC);

-- ── 9. Smart rules: enabled rules per workspace (primary evaluation query) ────
-- evaluateWorkspace() selects WHERE workspace_id=? AND enabled=true. This index
-- makes that constant-time regardless of total rule count.
CREATE INDEX IF NOT EXISTS idx_smart_rules_ws_enabled
  ON public.smart_rules(workspace_id, enabled)
  WHERE enabled = true;

-- ── 10. Automation definitions: workspace + enabled ──────────────────────────
-- getDefinition() is called once per claimed run. The existing
-- idx_automation_definitions_en covers (workspace_id, enabled). Confirm.
-- (No new index; documented for audit trail.)

-- ── End of FIX-282 stress hardening migration ─────────────────────────────────
