-- ============================================================
-- Repair: activity_logs has RLS ENABLED but (on this partial-
-- history database) NO policies — so every client-side read of
-- activity_logs returns empty, even for workspace members. This
-- restores the workspace-scoped read policy from migration 003
-- so record Activity tabs and the home dashboard can surface
-- real activity. Idempotent.
--
-- Discovered during the Work detail-page audit (2026-06-24):
-- activity_logs held 17 'job' + 10 'task' rows that no client
-- could read. NOT yet applied live — pending owner authorisation
-- (RLS change on a shared production table).
-- ============================================================

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members read activity" ON activity_logs;
CREATE POLICY "Members read activity" ON activity_logs
  FOR SELECT USING (is_workspace_member(workspace_id));
