-- ============================================================
-- 018_planning_set_detail.sql
-- Additional tables for the 17-tab Planning Set detail experience.
-- Does NOT recreate tables already in 016_planning_level2.sql.
-- ============================================================

-- ── planning_units_rooms ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.planning_units_rooms (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  planning_set_id   uuid NOT NULL REFERENCES public.planning_sets(id) ON DELETE CASCADE,
  unit_code         text,
  name              text NOT NULL,
  floor             text,
  unit_type         text, -- ensuite, standard, studio, bathroom, kitchen, lounge
  size_sqm          numeric(6,2),
  dimensions        text,
  status            text DEFAULT 'vacant', -- occupied, vacant, shared
  target_rent_pcm   numeric(10,2) DEFAULT 0,
  actual_rent_pcm   numeric(10,2) DEFAULT 0,
  rentable          boolean DEFAULT true,
  compliance_status text DEFAULT 'compliant',
  tenancy_id        uuid,
  next_review_date  date,
  tags              text[],
  image_url         text,
  notes             text,
  sort_order        integer DEFAULT 0,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  created_by        uuid REFERENCES auth.users(id)
);

-- ── planning_risks ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.planning_risks (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  planning_set_id   uuid NOT NULL REFERENCES public.planning_sets(id) ON DELETE CASCADE,
  risk_code         text,
  label             text NOT NULL,
  category          text NOT NULL, -- market, financial, regulatory, operational, construction
  risk_score        integer DEFAULT 0,
  likelihood        text DEFAULT 'medium', -- very_low, low, medium, high, very_high
  impact            text DEFAULT 'medium',
  risk_trend        text DEFAULT 'stable', -- improving, stable, worsening
  status            text DEFAULT 'active', -- active, mitigated, closed, monitoring
  mitigation_owner  text,
  mitigation_plan   text,
  due_date          date,
  notes             text,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  created_by        uuid REFERENCES auth.users(id),
  updated_by        uuid REFERENCES auth.users(id)
);

-- ── planning_tasks ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.planning_tasks (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  planning_set_id   uuid NOT NULL REFERENCES public.planning_sets(id) ON DELETE CASCADE,
  title             text NOT NULL,
  owner_name        text,
  owner_id          uuid REFERENCES auth.users(id),
  priority          text DEFAULT 'medium', -- low, medium, high, urgent
  due_date          date,
  module_ref        text, -- which tab this relates to: income, compliance, etc.
  status            text DEFAULT 'not_started', -- not_started, in_progress, completed, overdue
  notes             text,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  created_by        uuid REFERENCES auth.users(id)
);

-- ── planning_ai_reviews ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.planning_ai_reviews (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id            uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  planning_set_id         uuid NOT NULL REFERENCES public.planning_sets(id) ON DELETE CASCADE,
  overall_score           integer DEFAULT 0,
  financial_viability     integer DEFAULT 0,
  risk_assessment         integer DEFAULT 0,
  data_completeness       integer DEFAULT 0,
  compliance_readiness    integer DEFAULT 0,
  scenario_robustness     integer DEFAULT 0,
  strengths               text[],
  weaknesses              text[],
  missing_data            text[],
  suggestions             text[],
  recommendation          text,
  raw_output              jsonb DEFAULT '{}',
  reviewed_at             timestamptz DEFAULT now(),
  reviewed_by             uuid REFERENCES auth.users(id),
  created_at              timestamptz DEFAULT now()
);

-- ── planning_documents ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.planning_documents (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  planning_set_id   uuid NOT NULL REFERENCES public.planning_sets(id) ON DELETE CASCADE,
  title             text NOT NULL,
  file_name         text,
  file_url          text,
  category          text DEFAULT 'general', -- compliance, offer, property, financial, legal, insurance
  status            text DEFAULT 'uploaded', -- missing, expired, unreadable, valid, approved
  expires_at        date,
  linked_to         text,
  notes             text,
  uploaded_by       uuid REFERENCES auth.users(id),
  uploaded_at       timestamptz DEFAULT now(),
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- ── planning_notes ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.planning_notes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  planning_set_id   uuid NOT NULL REFERENCES public.planning_sets(id) ON DELETE CASCADE,
  body              text NOT NULL,
  pinned            boolean DEFAULT false,
  created_by        uuid REFERENCES auth.users(id),
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- ── planning_offer_versions ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.planning_offer_versions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  planning_set_id   uuid NOT NULL REFERENCES public.planning_sets(id) ON DELETE CASCADE,
  offer_id          uuid REFERENCES public.planning_offers(id),
  version_num       integer DEFAULT 1,
  label             text,
  offer_data        jsonb DEFAULT '{}',
  created_by        uuid REFERENCES auth.users(id),
  created_at        timestamptz DEFAULT now()
);

-- ============================================================
-- Enable RLS on all new tables
-- ============================================================

ALTER TABLE public.planning_units_rooms      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planning_risks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planning_tasks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planning_ai_reviews       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planning_documents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planning_notes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planning_offer_versions   ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policies — workspace member access pattern (matches 016)
-- ============================================================

CREATE POLICY "workspace_member_access" ON public.planning_units_rooms
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "workspace_member_access" ON public.planning_risks
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "workspace_member_access" ON public.planning_tasks
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "workspace_member_access" ON public.planning_ai_reviews
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "workspace_member_access" ON public.planning_documents
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "workspace_member_access" ON public.planning_notes
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "workspace_member_access" ON public.planning_offer_versions
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_planning_units_rooms_set    ON public.planning_units_rooms(workspace_id, planning_set_id);
CREATE INDEX IF NOT EXISTS idx_planning_risks_set          ON public.planning_risks(workspace_id, planning_set_id);
CREATE INDEX IF NOT EXISTS idx_planning_tasks_set          ON public.planning_tasks(workspace_id, planning_set_id);
CREATE INDEX IF NOT EXISTS idx_planning_tasks_status       ON public.planning_tasks(status);
CREATE INDEX IF NOT EXISTS idx_planning_ai_reviews_set     ON public.planning_ai_reviews(workspace_id, planning_set_id);
CREATE INDEX IF NOT EXISTS idx_planning_documents_set      ON public.planning_documents(workspace_id, planning_set_id);
CREATE INDEX IF NOT EXISTS idx_planning_notes_set          ON public.planning_notes(workspace_id, planning_set_id);
CREATE INDEX IF NOT EXISTS idx_planning_offer_versions_set ON public.planning_offer_versions(workspace_id, planning_set_id);
CREATE INDEX IF NOT EXISTS idx_planning_offer_versions_off ON public.planning_offer_versions(offer_id);
