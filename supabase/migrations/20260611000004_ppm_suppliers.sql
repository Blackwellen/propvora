-- PPM tables
CREATE TABLE IF NOT EXISTS ppm_schedules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  compliance_category TEXT,
  priority TEXT DEFAULT 'medium',
  description TEXT,
  property_id uuid REFERENCES properties(id),
  unit_id uuid,
  asset_id uuid,
  supplier_id uuid,
  frequency TEXT NOT NULL,
  frequency_interval INTEGER DEFAULT 1,
  next_due_date DATE,
  due_window_days INTEGER DEFAULT 7,
  last_completed_at TIMESTAMPTZ,
  estimated_cost NUMERIC(10,2),
  certification_required TEXT,
  access_requirement TEXT,
  work_order_type TEXT DEFAULT 'planned_maintenance',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by uuid,
  archived_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ppm_occurrences (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  ppm_schedule_id uuid NOT NULL REFERENCES ppm_schedules(id),
  due_date DATE NOT NULL,
  window_start DATE,
  window_end DATE,
  status TEXT DEFAULT 'scheduled',
  assigned_supplier_id uuid,
  linked_job_id uuid,
  completed_at TIMESTAMPTZ,
  completed_by uuid,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Supplier tables
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  supplier_type TEXT,
  primary_trade TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  address TEXT,
  postcode TEXT,
  service_radius_miles INTEGER,
  preferred_status BOOLEAN DEFAULT false,
  verification_status TEXT DEFAULT 'unverified',
  insurance_status TEXT DEFAULT 'unknown',
  compliance_status TEXT DEFAULT 'unknown',
  average_response_minutes INTEGER,
  rating_internal NUMERIC(3,2),
  jobs_completed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by uuid,
  archived_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS supplier_compliance_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL,
  supplier_id uuid NOT NULL REFERENCES suppliers(id),
  document_type TEXT NOT NULL,
  expires_at DATE,
  status TEXT DEFAULT 'valid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS supplier_notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL,
  supplier_id uuid NOT NULL REFERENCES suppliers(id),
  note_text TEXT NOT NULL,
  created_by uuid,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row Level Security
ALTER TABLE ppm_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppm_occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_compliance_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_ppm_schedules" ON ppm_schedules
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "workspace_ppm_occurrences" ON ppm_occurrences
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "workspace_suppliers" ON suppliers
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "workspace_supplier_docs" ON supplier_compliance_documents
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "workspace_supplier_notes" ON supplier_notes
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );
