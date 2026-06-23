-- ============================================================
-- Automation Canvas Builder — persistent flow tables
-- Migration: 20260617180000_automations_canvas
-- All tables are workspace-scoped; RLS enforces isolation.
-- No cross-workspace leakage. No unauthenticated access.
-- ============================================================

-- ── 1. automation_flows ─────────────────────────────────────────────────────
-- Top-level flow record (one per automation).
CREATE TABLE IF NOT EXISTS automation_flows (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id         uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name                 text NOT NULL DEFAULT 'Untitled automation',
  description          text,
  status               text NOT NULL DEFAULT 'draft'
                         CHECK (status IN ('draft','pending_review','active','paused','archived')),
  review_first         boolean NOT NULL DEFAULT true,
  current_version_id   uuid,          -- FK added below after versions table exists
  trigger_type         text,
  is_enabled           boolean NOT NULL DEFAULT false,
  last_run_at          timestamptz,
  last_dry_run_at      timestamptz,
  published_at         timestamptz,
  published_by         uuid REFERENCES auth.users(id),
  archived_at          timestamptz,
  created_by           uuid REFERENCES auth.users(id),
  updated_by           uuid REFERENCES auth.users(id),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- ── 2. automation_flow_versions ─────────────────────────────────────────────
-- Immutable versioned snapshots. Each save creates a new version.
CREATE TABLE IF NOT EXISTS automation_flow_versions (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id         uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  automation_flow_id   uuid NOT NULL REFERENCES automation_flows(id) ON DELETE CASCADE,
  version_number       integer NOT NULL DEFAULT 1,
  definition_json      jsonb NOT NULL DEFAULT '{}',
  visual_layout_json   jsonb NOT NULL DEFAULT '{}',
  status               text NOT NULL DEFAULT 'draft'
                         CHECK (status IN ('draft','validated','published','archived','invalid')),
  change_summary       text,
  created_by           uuid REFERENCES auth.users(id),
  created_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (automation_flow_id, version_number)
);

-- Back-fill the FK now that versions exists
ALTER TABLE automation_flows
  ADD CONSTRAINT fk_current_version
  FOREIGN KEY (current_version_id)
  REFERENCES automation_flow_versions(id)
  DEFERRABLE INITIALLY DEFERRED;

-- ── 3. automation_nodes ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS automation_nodes (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id         uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  automation_flow_id   uuid NOT NULL REFERENCES automation_flows(id) ON DELETE CASCADE,
  version_id           uuid REFERENCES automation_flow_versions(id) ON DELETE CASCADE,
  node_key             text NOT NULL,
  node_type            text NOT NULL,
  category             text NOT NULL DEFAULT 'utility',
  label                text,
  description          text,
  position_x           numeric NOT NULL DEFAULT 0,
  position_y           numeric NOT NULL DEFAULT 0,
  config_json          jsonb NOT NULL DEFAULT '{}',
  validation_status    text NOT NULL DEFAULT 'unchecked'
                         CHECK (validation_status IN ('valid','warning','error','unchecked')),
  sort_order           integer NOT NULL DEFAULT 0
);

-- ── 4. automation_edges ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS automation_edges (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id         uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  automation_flow_id   uuid NOT NULL REFERENCES automation_flows(id) ON DELETE CASCADE,
  version_id           uuid REFERENCES automation_flow_versions(id) ON DELETE CASCADE,
  source_node_id       text NOT NULL,   -- node_key, not UUID (matches React Flow)
  target_node_id       text NOT NULL,
  source_handle        text,
  target_handle        text,
  branch_label         text,            -- e.g. "TRUE", "FALSE", "Approved"
  edge_type            text NOT NULL DEFAULT 'smoothstep'
);

-- ── 5. automation_dry_runs ───────────────────────────────────────────────────
-- Read-only simulation records. Never creates real tasks/notifications.
CREATE TABLE IF NOT EXISTS automation_dry_runs (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id         uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  automation_flow_id   uuid REFERENCES automation_flows(id) ON DELETE SET NULL,
  version_id           uuid REFERENCES automation_flow_versions(id) ON DELETE SET NULL,
  test_event_json      jsonb NOT NULL DEFAULT '{}',
  result_status        text NOT NULL DEFAULT 'pending'
                         CHECK (result_status IN ('pending','passed','failed','partial')),
  started_at           timestamptz NOT NULL DEFAULT now(),
  completed_at         timestamptz,
  duration_ms          integer,
  created_by           uuid REFERENCES auth.users(id)
);

-- ── 6. automation_dry_run_steps ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS automation_dry_run_steps (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id         uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  dry_run_id           uuid NOT NULL REFERENCES automation_dry_runs(id) ON DELETE CASCADE,
  node_id              text,
  step_index           integer NOT NULL DEFAULT 0,
  status               text NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pass','skip','error','pending')),
  duration_ms          integer,
  input_json           jsonb NOT NULL DEFAULT '{}',
  output_json          jsonb NOT NULL DEFAULT '{}',
  error_message        text
);

-- ── 7. automation_audit_events ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS automation_audit_events (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id         uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  automation_flow_id   uuid REFERENCES automation_flows(id) ON DELETE SET NULL,
  event_type           text NOT NULL,   -- e.g. 'created','updated','published','dry_run'
  actor_id             uuid REFERENCES auth.users(id),
  summary              text,
  before_json          jsonb,
  after_json           jsonb,
  ip_address           inet,
  user_agent           text,
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_automation_flows_ws        ON automation_flows(workspace_id);
CREATE INDEX IF NOT EXISTS idx_automation_flows_status    ON automation_flows(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_automation_versions_flow   ON automation_flow_versions(automation_flow_id);
CREATE INDEX IF NOT EXISTS idx_automation_nodes_flow      ON automation_nodes(automation_flow_id, version_id);
CREATE INDEX IF NOT EXISTS idx_automation_edges_flow      ON automation_edges(automation_flow_id, version_id);
CREATE INDEX IF NOT EXISTS idx_automation_dry_runs_flow   ON automation_dry_runs(automation_flow_id);
CREATE INDEX IF NOT EXISTS idx_automation_dry_steps_run   ON automation_dry_run_steps(dry_run_id);
CREATE INDEX IF NOT EXISTS idx_automation_audit_flow      ON automation_audit_events(automation_flow_id);
CREATE INDEX IF NOT EXISTS idx_automation_audit_ws        ON automation_audit_events(workspace_id, created_at DESC);

-- ── Table privileges ─────────────────────────────────────────────────────────
-- PostgREST returns 404 (not 403) for a role that has NO table privilege, which
-- silently breaks the visual builder's save/load for logged-in users. Grant the
-- standard CRUD privileges to `authenticated`; RLS (below) still restricts every
-- row to the caller's own workspace. The canvas is auth-only, so `anon` needs
-- nothing. Without these grants the entire Automation Canvas cannot persist.
GRANT SELECT, INSERT, UPDATE, DELETE ON
  automation_flows, automation_flow_versions, automation_nodes, automation_edges,
  automation_dry_runs, automation_dry_run_steps, automation_audit_events
  TO authenticated;

-- ── Row Level Security ───────────────────────────────────────────────────────
-- Pattern: users can only access rows for workspaces they belong to.
-- Membership check uses workspace_members (confirmed table name).

ALTER TABLE automation_flows         ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_flow_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_nodes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_edges         ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_dry_runs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_dry_run_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_audit_events  ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user a member of a workspace?
-- (Used inline in policies to avoid a separate function that might not exist yet.)

-- ── automation_flows policies ────────────────────────────────────────────────
CREATE POLICY "automation_flows_select" ON automation_flows
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = automation_flows.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "automation_flows_insert" ON automation_flows
  FOR INSERT WITH CHECK (
    workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = automation_flows.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner','admin','manager')
    )
  );

CREATE POLICY "automation_flows_update" ON automation_flows
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = automation_flows.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner','admin','manager')
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = automation_flows.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner','admin','manager')
    )
  );

CREATE POLICY "automation_flows_delete" ON automation_flows
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = automation_flows.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner','admin')
    )
  );

-- ── automation_flow_versions policies ───────────────────────────────────────
CREATE POLICY "automation_versions_select" ON automation_flow_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = automation_flow_versions.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "automation_versions_insert" ON automation_flow_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = automation_flow_versions.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner','admin','manager')
    )
  );

-- ── automation_nodes policies ────────────────────────────────────────────────
CREATE POLICY "automation_nodes_select" ON automation_nodes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = automation_nodes.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "automation_nodes_write" ON automation_nodes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = automation_nodes.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner','admin','manager')
    )
  );

-- ── automation_edges policies ────────────────────────────────────────────────
CREATE POLICY "automation_edges_select" ON automation_edges
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = automation_edges.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "automation_edges_write" ON automation_edges
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = automation_edges.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner','admin','manager')
    )
  );

-- ── automation_dry_runs policies ─────────────────────────────────────────────
CREATE POLICY "automation_dry_runs_select" ON automation_dry_runs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = automation_dry_runs.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "automation_dry_runs_insert" ON automation_dry_runs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = automation_dry_runs.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

-- ── automation_dry_run_steps policies ────────────────────────────────────────
CREATE POLICY "automation_dry_run_steps_select" ON automation_dry_run_steps
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM automation_dry_runs dr
      JOIN workspace_members wm ON wm.workspace_id = dr.workspace_id
      WHERE dr.id = automation_dry_run_steps.dry_run_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "automation_dry_run_steps_insert" ON automation_dry_run_steps
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM automation_dry_runs dr
      JOIN workspace_members wm ON wm.workspace_id = dr.workspace_id
      WHERE dr.id = automation_dry_run_steps.dry_run_id
        AND wm.user_id = auth.uid()
    )
  );

-- ── automation_audit_events policies ────────────────────────────────────────
CREATE POLICY "automation_audit_events_select" ON automation_audit_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = automation_audit_events.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "automation_audit_events_insert" ON automation_audit_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = automation_audit_events.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

-- ── Service-role bypass (for server-side functions) ─────────────────────────
-- Service role bypasses RLS automatically in Supabase — no extra policy needed.
-- Never expose the service role key to the client.
