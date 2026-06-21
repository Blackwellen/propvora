-- ============================================================
-- Fix: tighten INSERT RLS on audit_logs and notifications
--
-- Previous policies used WITH CHECK (true) which allowed any
-- authenticated user to inject rows for arbitrary user_ids.
-- audit_logs writes should be workspace-scoped (members only).
-- notifications writes should be restricted to the user's own
-- user_id or performed via service_role (system notifications).
-- ============================================================

-- ── audit_logs ────────────────────────────────────────────────────────────────

-- Drop the overly-permissive service role policy from 003_rls_policies
DROP POLICY IF EXISTS "System inserts audit" ON audit_logs;

-- Drop the workspace-member policy from 20260612000003 if it exists
DROP POLICY IF EXISTS "Members insert audit_logs" ON audit_logs;

-- Correct policy: only workspace members can insert audit rows for their workspace
CREATE POLICY "Members insert audit_logs" ON audit_logs
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- ── notifications ─────────────────────────────────────────────────────────────

-- Drop the overly-permissive policy from 003_rls_policies
DROP POLICY IF EXISTS "System inserts notifications" ON notifications;

-- Users can only insert notifications for themselves (e.g. self-triggered alerts).
-- System-generated notifications for other users must go through service_role
-- (the Supabase service role bypasses RLS, so backend functions are unaffected).
CREATE POLICY "Users insert own notifications" ON notifications
  FOR INSERT
  WITH CHECK (user_id = auth.uid());
