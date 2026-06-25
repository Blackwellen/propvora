-- kpi_snapshots: stores daily workspace KPI values for trend calculation
-- Used by HomeDashboardPage to compute month-over-month deltas

CREATE TABLE IF NOT EXISTS kpi_snapshots (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  snapshot_date  DATE NOT NULL,
  metric_name    TEXT NOT NULL,
  value          NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE (workspace_id, snapshot_date, metric_name)
);

CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_ws_date ON kpi_snapshots (workspace_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_metric  ON kpi_snapshots (metric_name);

ALTER TABLE kpi_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_members_kpi_snapshots"
  ON kpi_snapshots FOR ALL
  USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

-- Metric names used:
-- properties_count, units_count, tenancies_count, occupancy_pct,
-- rent_pcm_total, open_tasks_count
