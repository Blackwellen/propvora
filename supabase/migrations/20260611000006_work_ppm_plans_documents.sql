-- ============================================================
-- Work section schema repair + extensions
--   * jobs               (CORE table — missing from this DB; recreated from 001)
--   * ppm_plans          (usePpm.ts — the shape the PPM UI queries)
--   * job_documents      (EvidenceUpload on the Job detail page)
--   * task_documents     (EvidenceUpload on the Task detail page)
--   * property_documents (Property detail Documents tab)
-- Workspace-scoped RLS via is_workspace_member() (migration 003),
-- updated_at via update_updated_at() (migration 004).
-- Idempotent: safe to re-run.
-- ============================================================

-- ─── ensure helpers exist (this DB has a partial migration history) ─
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── jobs (core repair) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','scoped','supplier_requested','quote_received','approved','scheduled','in_progress','complete','invoiced','closed','disputed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  category TEXT,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  supplier_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES profiles(id),
  scheduled_date DATE,
  completed_date DATE,
  quoted_amount DECIMAL(10,2),
  approved_amount DECIMAL(10,2),
  invoiced_amount DECIMAL(10,2),
  reference TEXT,
  notes TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jobs_workspace ON jobs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_jobs_property  ON jobs(property_id);
CREATE INDEX IF NOT EXISTS idx_jobs_supplier  ON jobs(supplier_contact_id);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members read jobs" ON jobs;
CREATE POLICY "Members read jobs" ON jobs FOR SELECT USING (is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "Members write jobs" ON jobs;
CREATE POLICY "Members write jobs" ON jobs FOR ALL USING (is_workspace_member(workspace_id));

DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── ppm_plans ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ppm_plans (
  id                   UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id         UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  description          TEXT,
  category             TEXT,
  status               TEXT NOT NULL DEFAULT 'scheduled',  -- scheduled|due_soon|overdue|completed|paused
  priority             TEXT,
  property_id          UUID REFERENCES properties(id) ON DELETE SET NULL,
  unit_id              UUID,
  supplier_contact_id  UUID REFERENCES contacts(id) ON DELETE SET NULL,
  supplier_name        TEXT,
  frequency            TEXT,                               -- weekly|monthly|quarterly|bi_annual|annual|biennial
  start_date           DATE,
  next_due_date        DATE,
  last_completed_date  DATE,
  estimated_cost       NUMERIC(12,2),
  auto_generate_job    BOOLEAN DEFAULT false,
  reference            TEXT,
  notes                TEXT,
  is_demo              BOOLEAN NOT NULL DEFAULT false,
  created_by           UUID REFERENCES profiles(id),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ppm_plans_workspace ON ppm_plans(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ppm_plans_next_due  ON ppm_plans(workspace_id, next_due_date);
CREATE INDEX IF NOT EXISTS idx_ppm_plans_property  ON ppm_plans(property_id);

ALTER TABLE ppm_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members read ppm_plans" ON ppm_plans;
CREATE POLICY "Members read ppm_plans" ON ppm_plans FOR SELECT USING (is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "Members write ppm_plans" ON ppm_plans;
CREATE POLICY "Members write ppm_plans" ON ppm_plans FOR ALL USING (is_workspace_member(workspace_id));

DROP TRIGGER IF EXISTS update_ppm_plans_updated_at ON ppm_plans;
CREATE TRIGGER update_ppm_plans_updated_at BEFORE UPDATE ON ppm_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── job_documents ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_documents (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  job_id        UUID REFERENCES jobs(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  file_url      TEXT NOT NULL,
  file_type     TEXT,
  file_size     BIGINT,
  category      TEXT,
  uploaded_by   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_documents_workspace ON job_documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_job_documents_job       ON job_documents(job_id);

ALTER TABLE job_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members read job_documents" ON job_documents;
CREATE POLICY "Members read job_documents" ON job_documents FOR SELECT USING (is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "Members write job_documents" ON job_documents;
CREATE POLICY "Members write job_documents" ON job_documents FOR ALL USING (is_workspace_member(workspace_id));

DROP TRIGGER IF EXISTS update_job_documents_updated_at ON job_documents;
CREATE TRIGGER update_job_documents_updated_at BEFORE UPDATE ON job_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── task_documents ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_documents (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  task_id       UUID REFERENCES tasks(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  file_url      TEXT NOT NULL,
  file_type     TEXT,
  file_size     BIGINT,
  category      TEXT,
  uploaded_by   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_documents_workspace ON task_documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_task_documents_task      ON task_documents(task_id);

ALTER TABLE task_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members read task_documents" ON task_documents;
CREATE POLICY "Members read task_documents" ON task_documents FOR SELECT USING (is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "Members write task_documents" ON task_documents;
CREATE POLICY "Members write task_documents" ON task_documents FOR ALL USING (is_workspace_member(workspace_id));

DROP TRIGGER IF EXISTS update_task_documents_updated_at ON task_documents;
CREATE TRIGGER update_task_documents_updated_at BEFORE UPDATE ON task_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── property_documents ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS property_documents (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  property_id   UUID REFERENCES properties(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  file_url      TEXT NOT NULL,
  file_type     TEXT,
  file_size     BIGINT,
  category      TEXT,
  uploaded_by   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_property_documents_workspace ON property_documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_property_documents_property  ON property_documents(property_id);

ALTER TABLE property_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members read property_documents" ON property_documents;
CREATE POLICY "Members read property_documents" ON property_documents FOR SELECT USING (is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "Members write property_documents" ON property_documents;
CREATE POLICY "Members write property_documents" ON property_documents FOR ALL USING (is_workspace_member(workspace_id));

DROP TRIGGER IF EXISTS update_property_documents_updated_at ON property_documents;
CREATE TRIGGER update_property_documents_updated_at BEFORE UPDATE ON property_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
