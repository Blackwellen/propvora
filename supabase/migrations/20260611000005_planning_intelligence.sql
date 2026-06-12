-- Planning Intelligence tables
-- Yield metrics, AI pricing recommendations, benchmarks, tenant risk scores

CREATE TABLE IF NOT EXISTS planning_yield_property_metrics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  property_id uuid,
  property_name TEXT,
  property_type TEXT,
  estimated_value NUMERIC(12,2),
  annual_gross_rent NUMERIC(10,2),
  annual_net_rent NUMERIC(10,2),
  gross_yield NUMERIC(6,4),
  net_yield NUMERIC(6,4),
  void_rate NUMERIC(6,4),
  maintenance_cost_ytd NUMERIC(10,2),
  maintenance_cost_ratio NUMERIC(6,4),
  performance_tier TEXT,
  trend_direction TEXT,
  ai_recommendation TEXT,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS planning_ai_pricing_recommendations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  property_id uuid,
  property_name TEXT,
  recommendation_type TEXT,
  current_rent NUMERIC(10,2),
  recommended_rent NUMERIC(10,2),
  estimated_annual_gain NUMERIC(10,2),
  confidence_score NUMERIC(4,3),
  source_summary TEXT,
  requires_user_review BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS planning_benchmark_assumptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  metric_key TEXT NOT NULL,
  industry_avg_value NUMERIC(10,4),
  unit TEXT,
  source_label TEXT DEFAULT 'workspace benchmark assumption',
  effective_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS planning_tenant_risk_scores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  tenancy_id uuid,
  contact_id uuid,
  display_initials TEXT,
  property_name TEXT,
  risk_score INTEGER,
  risk_level TEXT,
  missed_payments INTEGER DEFAULT 0,
  status_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE planning_yield_property_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_ai_pricing_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_benchmark_assumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_tenant_risk_scores ENABLE ROW LEVEL SECURITY;

-- RLS policies — workspace isolation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'planning_yield_property_metrics' AND policyname = 'workspace_yield_metrics'
  ) THEN
    CREATE POLICY "workspace_yield_metrics"
      ON planning_yield_property_metrics FOR ALL
      USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'planning_ai_pricing_recommendations' AND policyname = 'workspace_ai_recommendations'
  ) THEN
    CREATE POLICY "workspace_ai_recommendations"
      ON planning_ai_pricing_recommendations FOR ALL
      USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'planning_benchmark_assumptions' AND policyname = 'workspace_benchmarks'
  ) THEN
    CREATE POLICY "workspace_benchmarks"
      ON planning_benchmark_assumptions FOR ALL
      USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'planning_tenant_risk_scores' AND policyname = 'workspace_tenant_risk'
  ) THEN
    CREATE POLICY "workspace_tenant_risk"
      ON planning_tenant_risk_scores FOR ALL
      USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_yield_metrics_workspace ON planning_yield_property_metrics(workspace_id);
CREATE INDEX IF NOT EXISTS idx_yield_metrics_snapshot ON planning_yield_property_metrics(workspace_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_ai_recs_workspace ON planning_ai_pricing_recommendations(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_benchmarks_workspace ON planning_benchmark_assumptions(workspace_id, metric_key);
CREATE INDEX IF NOT EXISTS idx_risk_scores_workspace ON planning_tenant_risk_scores(workspace_id, risk_score ASC);
