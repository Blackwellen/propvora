-- Settings support: role-permission overrides + general audit log.
-- Workspace-scoped, RLS via workspace_members. Idempotent.

CREATE TABLE IF NOT EXISTS workspace_role_permissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  role          TEXT NOT NULL,
  permission_key TEXT NOT NULL,
  allowed       BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, role, permission_key)
);
CREATE INDEX IF NOT EXISTS idx_wrp_workspace ON workspace_role_permissions(workspace_id);
ALTER TABLE workspace_role_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members read role perms" ON workspace_role_permissions;
CREATE POLICY "Members read role perms" ON workspace_role_permissions FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Admins write role perms" ON workspace_role_permissions;
CREATE POLICY "Admins write role perms" ON workspace_role_permissions FOR ALL
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner','admin')))
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner','admin')));

CREATE TABLE IF NOT EXISTS audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id       UUID,
  action        TEXT NOT NULL,
  resource_type TEXT,
  resource_id   UUID,
  metadata      JSONB,
  ip            TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace ON audit_logs(workspace_id, created_at DESC);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
-- append-only: members read; inserts via service role / authenticated actions; no update/delete policy
DROP POLICY IF EXISTS "Members read audit_logs" ON audit_logs;
CREATE POLICY "Members read audit_logs" ON audit_logs FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Members insert audit_logs" ON audit_logs;
CREATE POLICY "Members insert audit_logs" ON audit_logs FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
