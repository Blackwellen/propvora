-- ============================================================
-- 006_portfolio_media_and_reviews.sql
-- Additive migration for Portfolio Level 2 rebuild
-- Adds: property_media, file_links, property_reviews, property_targets
-- ============================================================

-- ── property_media ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS property_media (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  property_id     UUID REFERENCES properties(id) ON DELETE CASCADE,
  unit_id         UUID REFERENCES property_units(id) ON DELETE SET NULL,
  -- media_asset_id can reference a media_assets table if you have one
  storage_path    TEXT,
  public_url      TEXT,
  media_type      TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image','video','document','pdf','other')),
  category        TEXT NOT NULL DEFAULT 'property' CHECK (category IN ('property','unit','tenancy','inspection','compliance','general')),
  title           TEXT,
  description     TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  is_cover        BOOLEAN NOT NULL DEFAULT false,
  file_size_bytes BIGINT,
  mime_type       TEXT,
  created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata        JSONB DEFAULT '{}'
);

-- ── file_links ────────────────────────────────────────────────────────
-- Polymorphic document-to-entity links
CREATE TABLE IF NOT EXISTS file_links (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  storage_path    TEXT NOT NULL,
  public_url      TEXT,
  file_name       TEXT NOT NULL,
  file_size_bytes BIGINT,
  mime_type       TEXT,
  category        TEXT NOT NULL DEFAULT 'general',
  -- entity references (nullable - link to one or more)
  property_id     UUID REFERENCES properties(id) ON DELETE CASCADE,
  unit_id         UUID REFERENCES property_units(id) ON DELETE SET NULL,
  tenancy_id      UUID REFERENCES tenancies(id) ON DELETE SET NULL,
  contact_id      UUID,
  task_id         UUID,
  invoice_id      UUID,
  planning_set_id UUID,
  is_signed_required  BOOLEAN DEFAULT false,
  signed_at           TIMESTAMPTZ,
  expires_at          TIMESTAMPTZ,
  created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at     TIMESTAMPTZ,
  metadata        JSONB DEFAULT '{}'
);

-- ── property_reviews ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS property_reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  property_id     UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  review_type     TEXT NOT NULL DEFAULT 'periodic' CHECK (review_type IN ('periodic','triggered','ai','manual')),
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','completed','archived')),
  summary         TEXT,
  risk_score      INTEGER CHECK (risk_score BETWEEN 0 AND 100),
  health_level    TEXT CHECK (health_level IN ('healthy','watch','at_risk','critical','no_data')),
  next_actions    JSONB DEFAULT '[]',
  reviewed_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata        JSONB DEFAULT '{}'
);

-- ── property_targets ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS property_targets (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id            UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  property_id             UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  source_type             TEXT DEFAULT 'manual' CHECK (source_type IN ('manual','planning_set','ai')),
  source_id               UUID,
  target_monthly_income   NUMERIC(12,2) DEFAULT 0,
  target_monthly_expenses NUMERIC(12,2) DEFAULT 0,
  target_net_cashflow     NUMERIC(12,2) DEFAULT 0,
  target_occupancy_pct    INTEGER DEFAULT 100 CHECK (target_occupancy_pct BETWEEN 0 AND 100),
  target_yield_pct        NUMERIC(6,2),
  effective_from          DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by              UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata                JSONB DEFAULT '{}'
);

-- ── Indexes ───────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_property_media_workspace  ON property_media(workspace_id);
CREATE INDEX IF NOT EXISTS idx_property_media_property   ON property_media(property_id);
CREATE INDEX IF NOT EXISTS idx_property_media_unit       ON property_media(unit_id);
CREATE INDEX IF NOT EXISTS idx_file_links_workspace      ON file_links(workspace_id);
CREATE INDEX IF NOT EXISTS idx_file_links_property       ON file_links(property_id);
CREATE INDEX IF NOT EXISTS idx_file_links_tenancy        ON file_links(tenancy_id);
CREATE INDEX IF NOT EXISTS idx_property_reviews_property ON property_reviews(property_id);
CREATE INDEX IF NOT EXISTS idx_property_targets_property ON property_targets(property_id);

-- ── RLS ───────────────────────────────────────────────────────────────
ALTER TABLE property_media    ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_links        ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_reviews  ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_targets  ENABLE ROW LEVEL SECURITY;

-- property_media: workspace members can read, managers/admins/owners can write
CREATE POLICY "property_media_select" ON property_media
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "property_media_insert" ON property_media
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner','admin','manager')
    )
  );

CREATE POLICY "property_media_update" ON property_media
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner','admin','manager')
    )
  );

CREATE POLICY "property_media_delete" ON property_media
  FOR DELETE USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner','admin')
    )
  );

-- file_links policies (same pattern)
CREATE POLICY "file_links_select" ON file_links
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "file_links_insert" ON file_links
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner','admin','manager')
    )
  );

CREATE POLICY "file_links_update" ON file_links
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner','admin','manager')
    )
  );

CREATE POLICY "file_links_delete" ON file_links
  FOR DELETE USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner','admin')
    )
  );

-- property_reviews
CREATE POLICY "property_reviews_select" ON property_reviews
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "property_reviews_write" ON property_reviews
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner','admin','manager')
    )
  );

-- property_targets
CREATE POLICY "property_targets_select" ON property_targets
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "property_targets_write" ON property_targets
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner','admin','manager')
    )
  );
