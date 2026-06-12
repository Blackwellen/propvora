-- ============================================================
-- 026_leasing_schema.sql
-- Leasing module: vacancies, prospects, viewings,
-- tenancy agreements, and agreement signatories.
-- ============================================================

-- property_vacancies
CREATE TABLE IF NOT EXISTS property_vacancies (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  property_id      UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_id          UUID,
  title            TEXT NOT NULL,
  description      TEXT,
  asking_rent      NUMERIC(10,2),
  deposit_amount   NUMERIC(10,2),
  available_from   DATE,
  property_type    TEXT,
  bedrooms         INTEGER,
  bathrooms        INTEGER,
  furnished        TEXT CHECK (furnished IN ('furnished','unfurnished','part-furnished')),
  features         JSONB NOT NULL DEFAULT '[]',
  photos           JSONB NOT NULL DEFAULT '[]',
  status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','under_offer','let','withdrawn')),
  portal_listings  JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- prospects
CREATE TABLE IF NOT EXISTS prospects (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id                UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  vacancy_id                  UUID REFERENCES property_vacancies(id) ON DELETE SET NULL,
  first_name                  TEXT NOT NULL,
  last_name                   TEXT NOT NULL,
  email                       TEXT NOT NULL,
  phone                       TEXT,
  source                      TEXT,
  move_in_date                DATE,
  budget_min                  NUMERIC(10,2),
  budget_max                  NUMERIC(10,2),
  notes                       TEXT,
  status                      TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','viewing_scheduled','viewing_done','referencing','offered','accepted','rejected','withdrawn')),
  assigned_to                 UUID REFERENCES profiles(id) ON DELETE SET NULL,
  referencing_status          TEXT,
  referencing_provider        TEXT,
  referencing_reference_id    TEXT,
  created_at                  TIMESTAMPTZ DEFAULT now(),
  updated_at                  TIMESTAMPTZ DEFAULT now()
);

-- viewings
CREATE TABLE IF NOT EXISTS viewings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  vacancy_id       UUID REFERENCES property_vacancies(id) ON DELETE SET NULL,
  prospect_id      UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  scheduled_at     TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  conducted_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status           TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','no_show','cancelled')),
  feedback         TEXT,
  outcome          TEXT CHECK (outcome IN ('interested','not_interested','offer_made')),
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- tenancy_agreements
CREATE TABLE IF NOT EXISTS tenancy_agreements (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  tenancy_id       UUID,
  template_id      UUID,
  title            TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','partially_signed','fully_signed','declined','expired','cancelled')),
  document_html    TEXT,
  final_pdf_path   TEXT,
  signing_deadline TIMESTAMPTZ,
  created_by       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- agreement_signatories
CREATE TABLE IF NOT EXISTS agreement_signatories (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  agreement_id   UUID NOT NULL REFERENCES tenancy_agreements(id) ON DELETE CASCADE,
  contact_id     UUID REFERENCES contacts(id) ON DELETE SET NULL,
  email          TEXT NOT NULL,
  name           TEXT NOT NULL,
  role           TEXT NOT NULL CHECK (role IN ('tenant','landlord','guarantor','agent','witness')),
  signing_token  TEXT UNIQUE,
  signed_at      TIMESTAMPTZ,
  ip_address     TEXT,
  user_agent     TEXT,
  signing_order  INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE property_vacancies    ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects             ENABLE ROW LEVEL SECURITY;
ALTER TABLE viewings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenancy_agreements    ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreement_signatories ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'property_vacancies','prospects','viewings',
    'tenancy_agreements','agreement_signatories'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format(
      'CREATE POLICY "workspace members read %1$s" ON %1$s FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))',
      tbl
    );
    EXECUTE format(
      'CREATE POLICY "workspace members manage %1$s" ON %1$s FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))',
      tbl
    );
  END LOOP;
END $$;

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY['property_vacancies','prospects','tenancy_agreements'];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      tbl, tbl
    );
  END LOOP;
END $$;

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_vacancies_workspace      ON property_vacancies(workspace_id);
CREATE INDEX IF NOT EXISTS idx_vacancies_property       ON property_vacancies(property_id);
CREATE INDEX IF NOT EXISTS idx_vacancies_status         ON property_vacancies(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_vacancies_available      ON property_vacancies(workspace_id, available_from);

CREATE INDEX IF NOT EXISTS idx_prospects_workspace      ON prospects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_prospects_vacancy        ON prospects(vacancy_id);
CREATE INDEX IF NOT EXISTS idx_prospects_status         ON prospects(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_prospects_assigned       ON prospects(assigned_to);
CREATE INDEX IF NOT EXISTS idx_prospects_email          ON prospects(workspace_id, email);

CREATE INDEX IF NOT EXISTS idx_viewings_workspace       ON viewings(workspace_id);
CREATE INDEX IF NOT EXISTS idx_viewings_vacancy         ON viewings(vacancy_id);
CREATE INDEX IF NOT EXISTS idx_viewings_prospect        ON viewings(prospect_id);
CREATE INDEX IF NOT EXISTS idx_viewings_status          ON viewings(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_viewings_scheduled       ON viewings(workspace_id, scheduled_at DESC);

CREATE INDEX IF NOT EXISTS idx_agreements_workspace     ON tenancy_agreements(workspace_id);
CREATE INDEX IF NOT EXISTS idx_agreements_tenancy       ON tenancy_agreements(tenancy_id);
CREATE INDEX IF NOT EXISTS idx_agreements_status        ON tenancy_agreements(workspace_id, status);

CREATE INDEX IF NOT EXISTS idx_signatories_workspace    ON agreement_signatories(workspace_id);
CREATE INDEX IF NOT EXISTS idx_signatories_agreement    ON agreement_signatories(agreement_id);
CREATE INDEX IF NOT EXISTS idx_signatories_token        ON agreement_signatories(signing_token);
