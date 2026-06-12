-- ============================================================
-- 019_planning_profiles.sql
-- Reference tables for Planning Profile system.
-- These are reference/template tables — no workspace_id
-- since data is global (seeded per profile slug).
-- User-specific profile data (user checklists, forecasts)
-- will live in planning_sets (existing tables).
-- ============================================================

-- ── planning_profile_income_models ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.planning_profile_income_models (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_slug              text NOT NULL,
  section_key               text NOT NULL,
  label                     text NOT NULL,
  description               text,
  default_assumptions_json  jsonb DEFAULT '{}',
  income_lines_json         jsonb DEFAULT '[]',
  benchmark_json            jsonb DEFAULT '{}',
  created_at                timestamptz DEFAULT now()
);

-- ── planning_profile_cost_drivers ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.planning_profile_cost_drivers (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_slug              text NOT NULL,
  category                  text NOT NULL,
  label                     text NOT NULL,
  cost_type                 text DEFAULT 'variable', -- fixed | variable | percentage
  typical_amount_min        numeric(10,2),
  typical_amount_max        numeric(10,2),
  frequency                 text DEFAULT 'monthly',  -- monthly | annual | one-off
  percentage_of_income      numeric(5,2),
  notes                     text,
  created_at                timestamptz DEFAULT now()
);

-- ── planning_profile_compliance_requirements ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.planning_profile_compliance_requirements (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_slug              text NOT NULL,
  compliance_area           text NOT NULL,
  requirement               text NOT NULL,
  priority                  text DEFAULT 'Medium',   -- High | Medium | Low
  required                  boolean DEFAULT true,
  renewal_frequency         text,                    -- Annual | 5-yearly | One-off | etc.
  required_documents_json   jsonb DEFAULT '[]',
  estimated_cost_min        numeric(10,2),
  estimated_cost_max        numeric(10,2),
  risk_if_missing           text,
  created_at                timestamptz DEFAULT now()
);

-- ── planning_profile_checklist_templates ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.planning_profile_checklist_templates (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_slug              text NOT NULL,
  phase                     text NOT NULL,
  task_label                text NOT NULL,
  priority                  text DEFAULT 'Medium',
  owner_role                text DEFAULT 'Investor',
  due_offset_days           integer DEFAULT 0,
  sort_order                integer DEFAULT 0,
  created_at                timestamptz DEFAULT now()
);

-- ── planning_profile_risk_templates ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.planning_profile_risk_templates (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_slug              text NOT NULL,
  risk_name                 text NOT NULL,
  category                  text NOT NULL,
  description               text,
  likelihood                text DEFAULT 'Possible',
  impact                    text DEFAULT 'Medium',
  default_score             integer DEFAULT 6,
  mitigation                text,
  owner_role                text DEFAULT 'Investor',
  created_at                timestamptz DEFAULT now()
);

-- ── planning_profile_ai_questions ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.planning_profile_ai_questions (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_slug              text NOT NULL,
  question                  text NOT NULL,
  answer_template           text,
  insight_category          text DEFAULT 'general',
  sort_order                integer DEFAULT 0,
  created_at                timestamptz DEFAULT now()
);

-- ============================================================
-- Enable RLS on all new tables
-- ============================================================

ALTER TABLE public.planning_profile_income_models           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planning_profile_cost_drivers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planning_profile_compliance_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planning_profile_checklist_templates     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planning_profile_risk_templates          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planning_profile_ai_questions            ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policies — these are read-only reference tables.
-- Any authenticated user (workspace member) may SELECT.
-- Only platform admins may INSERT/UPDATE/DELETE.
-- ============================================================

CREATE POLICY "Authenticated read profile income models"
  ON public.planning_profile_income_models FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Platform admin manage profile income models"
  ON public.planning_profile_income_models FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'platform_admin'));

CREATE POLICY "Authenticated read profile cost drivers"
  ON public.planning_profile_cost_drivers FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Platform admin manage profile cost drivers"
  ON public.planning_profile_cost_drivers FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'platform_admin'));

CREATE POLICY "Authenticated read profile compliance requirements"
  ON public.planning_profile_compliance_requirements FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Platform admin manage profile compliance requirements"
  ON public.planning_profile_compliance_requirements FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'platform_admin'));

CREATE POLICY "Authenticated read profile checklist templates"
  ON public.planning_profile_checklist_templates FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Platform admin manage profile checklist templates"
  ON public.planning_profile_checklist_templates FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'platform_admin'));

CREATE POLICY "Authenticated read profile risk templates"
  ON public.planning_profile_risk_templates FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Platform admin manage profile risk templates"
  ON public.planning_profile_risk_templates FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'platform_admin'));

CREATE POLICY "Authenticated read profile ai questions"
  ON public.planning_profile_ai_questions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Platform admin manage profile ai questions"
  ON public.planning_profile_ai_questions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'platform_admin'));

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_pp_income_models_slug      ON public.planning_profile_income_models(profile_slug);
CREATE INDEX IF NOT EXISTS idx_pp_cost_drivers_slug       ON public.planning_profile_cost_drivers(profile_slug);
CREATE INDEX IF NOT EXISTS idx_pp_compliance_slug         ON public.planning_profile_compliance_requirements(profile_slug);
CREATE INDEX IF NOT EXISTS idx_pp_checklist_slug          ON public.planning_profile_checklist_templates(profile_slug, sort_order);
CREATE INDEX IF NOT EXISTS idx_pp_risk_templates_slug     ON public.planning_profile_risk_templates(profile_slug);
CREATE INDEX IF NOT EXISTS idx_pp_ai_questions_slug       ON public.planning_profile_ai_questions(profile_slug, sort_order);
