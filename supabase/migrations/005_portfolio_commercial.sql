-- ============================================================
-- Migration 005: Portfolio Commercial Depth Fields
-- Adds operation profile metadata, commercial KPIs, planning
-- conversion tracking, and review/health score fields.
-- ============================================================

-- ─── Properties: add commercial depth fields ─────────────────────────────────

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS category_source           TEXT,
  ADD COLUMN IF NOT EXISTS planning_set_id           UUID,
  ADD COLUMN IF NOT EXISTS planning_conversion_status TEXT
    CHECK (planning_conversion_status IN ('none', 'converted', 'pending', 'partial')),
  ADD COLUMN IF NOT EXISTS target_monthly_income     DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS target_monthly_expenses   DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS target_net_cashflow       DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS target_yield              DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS actual_monthly_income     DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS actual_monthly_expenses   DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS actual_net_cashflow       DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS commercial_health_score   TEXT
    CHECK (commercial_health_score IN ('healthy', 'watch', 'at_risk', 'critical', 'needs_data')),
  ADD COLUMN IF NOT EXISTS risk_status               TEXT
    CHECK (risk_status IN ('low', 'medium', 'high', 'critical')),
  ADD COLUMN IF NOT EXISTS next_review_date          DATE,
  ADD COLUMN IF NOT EXISTS last_reviewed_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS asset_stage               TEXT
    CHECK (asset_stage IN ('setup', 'stabilising', 'stabilised', 'review', 'exiting', 'disposed')),
  ADD COLUMN IF NOT EXISTS metadata                  JSONB;


-- ─── property_units: add commercial fields ───────────────────────────────────

ALTER TABLE property_units
  ADD COLUMN IF NOT EXISTS actual_rent               DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS availability_date         DATE,
  ADD COLUMN IF NOT EXISTS notes                     TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_url           TEXT,
  ADD COLUMN IF NOT EXISTS created_by                UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS archived_at               TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS metadata                  JSONB;


-- ─── tenancies: add extra fields ─────────────────────────────────────────────

ALTER TABLE tenancies
  ADD COLUMN IF NOT EXISTS move_in_date              DATE,
  ADD COLUMN IF NOT EXISTS move_out_date             DATE,
  ADD COLUMN IF NOT EXISTS arrears_amount            DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_by                UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS archived_at               TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS metadata                  JSONB;


-- ─── New table: property_reviews ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS property_reviews (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id     UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  property_id      UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  review_type      TEXT NOT NULL DEFAULT 'periodic'
    CHECK (review_type IN ('periodic', 'triggered', 'ai_assisted', 'conversion_check')),
  status           TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'complete', 'archived')),
  summary          TEXT,
  risk_score       TEXT
    CHECK (risk_score IN ('healthy', 'watch', 'at_risk', 'critical')),
  next_actions     JSONB,
  reviewed_by      UUID REFERENCES profiles(id),
  reviewed_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata         JSONB
);

ALTER TABLE property_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read property_reviews"
  ON property_reviews FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "Members insert property_reviews"
  ON property_reviews FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "Members update property_reviews"
  ON property_reviews FOR UPDATE
  USING (is_workspace_member(workspace_id));


-- ─── New table: planning_conversion_events ───────────────────────────────────

CREATE TABLE IF NOT EXISTS planning_conversion_events (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id           UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  planning_set_id        UUID,
  property_id            UUID REFERENCES properties(id) ON DELETE SET NULL,
  conversion_type        TEXT NOT NULL DEFAULT 'full'
    CHECK (conversion_type IN ('full', 'partial', 'draft')),
  snapshot               JSONB,
  created_units_count    INTEGER DEFAULT 0,
  created_tasks_count    INTEGER DEFAULT 0,
  created_documents_count INTEGER DEFAULT 0,
  converted_by           UUID REFERENCES profiles(id),
  converted_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata               JSONB
);

ALTER TABLE planning_conversion_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read planning_conversion_events"
  ON planning_conversion_events FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "Members insert planning_conversion_events"
  ON planning_conversion_events FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));


-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_properties_operation_profile
  ON properties(operation_profile) WHERE operation_profile IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_properties_planning_set_id
  ON properties(planning_set_id) WHERE planning_set_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_properties_health_score
  ON properties(commercial_health_score) WHERE commercial_health_score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_property_reviews_property_id
  ON property_reviews(property_id);

CREATE INDEX IF NOT EXISTS idx_tenancies_arrears
  ON tenancies(arrears_amount) WHERE arrears_amount > 0;

CREATE INDEX IF NOT EXISTS idx_tenancies_end_date
  ON tenancies(end_date) WHERE end_date IS NOT NULL AND status = 'active';


-- ─── Demo data seeding (safe to re-run) ──────────────────────────────────────
-- Note: demo data is inserted only if no properties exist for the demo workspace.
-- In production this block is skipped automatically.
