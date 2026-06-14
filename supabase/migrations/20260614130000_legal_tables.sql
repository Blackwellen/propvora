-- ============================================================
-- 20260614130000_legal_tables.sql
-- Provisions the backing tables for the Legal section so its pages
-- (possession wizard + cases, HMO licences, EPC/RRA readiness) read and
-- write live data instead of 42P01-ing to empty.
--
-- Every column is derived from what the legal pages actually reference in
-- .select() / .insert() / .update() / .eq() / .order(), as defined in
-- src/app/(app)/app/legal/legal-data.ts and the wizard pages.
--
-- Idempotent: CREATE TABLE IF NOT EXISTS + ADD COLUMN IF NOT EXISTS +
-- DROP POLICY IF EXISTS, so it is safe to re-run and safe alongside the
-- earlier 025/027 module migrations.
--
-- Legal tooling is REVIEW-ONLY: these tables store drafts / records the user
-- entered. Nothing here auto-files, auto-serves, or asserts a legal action.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- possession_cases
--   Read:  legal-data usePossessionCases / usePossessionCase
--          select '*, property:properties(nickname), contact:contacts(display_name)'
--          .eq('workspace_id'), .eq('id'), .order('created_at')
--   Write: useCreatePossessionCase (workspace_id, tenancy_id, property_id,
--          contact_id, ground, status, arrears_*, notice_*, notes)
--          useUpdatePossessionCase (ground, arrears_amount, arrears_weeks,
--          status, notice_served_date, notice_expiry_date, court_reference,
--          hearing_date, notes)
--   Page reads also: court_applied_date (timeline), evidence_bundle_path,
--          created_at.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.possession_cases (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id           uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  tenancy_id             uuid REFERENCES public.tenancies(id) ON DELETE SET NULL,
  property_id            uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  contact_id             uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  ground                 text NOT NULL DEFAULT 'Ground 8 (rent arrears)',
  arrears_amount         numeric(12,2),
  arrears_weeks          numeric(6,1),
  status                 text NOT NULL DEFAULT 'gathering_evidence',
  notice_served_date     date,
  notice_expiry_date     date,
  court_applied_date     date,
  hearing_date           date,
  court_reference        text,
  evidence_bundle_path   text,
  notes                  text,
  demo                   boolean NOT NULL DEFAULT false,
  demo_batch_id          uuid,
  demo_expires_at        timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

-- Demo lifecycle columns (idempotent for any pre-existing table from 025/027).
ALTER TABLE public.possession_cases ADD COLUMN IF NOT EXISTS demo            boolean NOT NULL DEFAULT false;
ALTER TABLE public.possession_cases ADD COLUMN IF NOT EXISTS demo_batch_id   uuid;
ALTER TABLE public.possession_cases ADD COLUMN IF NOT EXISTS demo_expires_at timestamptz;

-- ────────────────────────────────────────────────────────────
-- possession_evidence
--   Read:  usePossessionEvidence select '*' .eq('workspace_id'),
--          .eq('possession_case_id'), .order('event_date')
--          Page renders: evidence_type, description, amount, event_date,
--          document_path, source.
--   Write: useCreatePossessionEvidence (workspace_id, possession_case_id,
--          evidence_type, description, event_date, document_path, source,
--          [amount]). evidence_type values written by the app: 'other',
--          'notice_served'. source written: 'manual'.
--   Note: event_date is inserted as an ISO timestamp string → timestamptz.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.possession_evidence (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id         uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  possession_case_id   uuid NOT NULL REFERENCES public.possession_cases(id) ON DELETE CASCADE,
  evidence_type        text NOT NULL DEFAULT 'other',
  description          text NOT NULL,
  amount               numeric(12,2),
  event_date           timestamptz NOT NULL DEFAULT now(),
  document_path        text,
  source               text,
  demo                 boolean NOT NULL DEFAULT false,
  demo_batch_id        uuid,
  demo_expires_at      timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.possession_evidence ADD COLUMN IF NOT EXISTS demo            boolean NOT NULL DEFAULT false;
ALTER TABLE public.possession_evidence ADD COLUMN IF NOT EXISTS demo_batch_id   uuid;
ALTER TABLE public.possession_evidence ADD COLUMN IF NOT EXISTS demo_expires_at timestamptz;

-- ────────────────────────────────────────────────────────────
-- hmo_licences
--   Read:  useHmoLicences / useHmoLicence
--          select '*, property:properties(nickname)' .eq('workspace_id'),
--          .eq('id'), .order('expiry_date')
--          Page renders: licence_type, licence_number, issuing_council,
--          issue_date, expiry_date, max_occupants, max_households,
--          conditions, status, renewal_reminder_days, document_path,
--          property_id (Open Property action).
--   Write: useCreateHmoLicence / useUpdateHmoLicence (workspace_id,
--          property_id, licence_type, licence_number, issuing_council,
--          issue_date, expiry_date, max_occupants, max_households, status)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hmo_licences (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id            uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  property_id             uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  licence_type            text NOT NULL DEFAULT 'mandatory',
  licence_number          text,
  issuing_council         text,
  issue_date              date,
  expiry_date             date NOT NULL,
  max_occupants           integer,
  max_households          integer,
  conditions              jsonb NOT NULL DEFAULT '[]'::jsonb,
  document_path           text,
  status                  text NOT NULL DEFAULT 'active',
  renewal_reminder_days   integer NOT NULL DEFAULT 90,
  demo                    boolean NOT NULL DEFAULT false,
  demo_batch_id           uuid,
  demo_expires_at         timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hmo_licences ADD COLUMN IF NOT EXISTS demo            boolean NOT NULL DEFAULT false;
ALTER TABLE public.hmo_licences ADD COLUMN IF NOT EXISTS demo_batch_id   uuid;
ALTER TABLE public.hmo_licences ADD COLUMN IF NOT EXISTS demo_expires_at timestamptz;

-- ============================================================
-- Indexes (match the page query / order patterns)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_possession_cases_workspace   ON public.possession_cases(workspace_id);
CREATE INDEX IF NOT EXISTS idx_possession_cases_tenancy     ON public.possession_cases(tenancy_id);
CREATE INDEX IF NOT EXISTS idx_possession_cases_property    ON public.possession_cases(property_id);
CREATE INDEX IF NOT EXISTS idx_possession_cases_created     ON public.possession_cases(workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_possession_evidence_ws       ON public.possession_evidence(workspace_id);
CREATE INDEX IF NOT EXISTS idx_possession_evidence_case     ON public.possession_evidence(possession_case_id);
CREATE INDEX IF NOT EXISTS idx_possession_evidence_event    ON public.possession_evidence(workspace_id, event_date DESC);

CREATE INDEX IF NOT EXISTS idx_hmo_licences_workspace       ON public.hmo_licences(workspace_id);
CREATE INDEX IF NOT EXISTS idx_hmo_licences_property        ON public.hmo_licences(property_id);
CREATE INDEX IF NOT EXISTS idx_hmo_licences_expiry          ON public.hmo_licences(workspace_id, expiry_date);

-- ============================================================
-- RLS — workspace-member policy on each table (codebase pattern)
-- ============================================================
ALTER TABLE public.possession_cases    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.possession_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hmo_licences        ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS possession_cases_workspace_member ON public.possession_cases;
CREATE POLICY possession_cases_workspace_member ON public.possession_cases FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = possession_cases.workspace_id AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = possession_cases.workspace_id AND wm.user_id = auth.uid()));

DROP POLICY IF EXISTS possession_evidence_workspace_member ON public.possession_evidence;
CREATE POLICY possession_evidence_workspace_member ON public.possession_evidence FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = possession_evidence.workspace_id AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = possession_evidence.workspace_id AND wm.user_id = auth.uid()));

DROP POLICY IF EXISTS hmo_licences_workspace_member ON public.hmo_licences;
CREATE POLICY hmo_licences_workspace_member ON public.hmo_licences FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = hmo_licences.workspace_id AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = hmo_licences.workspace_id AND wm.user_id = auth.uid()));
