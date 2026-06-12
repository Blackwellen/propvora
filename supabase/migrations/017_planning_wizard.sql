-- ============================================================
-- 017_planning_wizard.sql
-- Planning Wizard Drafts table with workspace-scoped RLS
-- ============================================================

-- ── planning_wizard_drafts ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.planning_wizard_drafts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by        UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  planning_set_id   UUID REFERENCES public.planning_sets(id) ON DELETE SET NULL,
  current_step      INTEGER NOT NULL DEFAULT 1,
  selected_profile  TEXT,
  draft_status      TEXT NOT NULL DEFAULT 'in_progress' CHECK (draft_status IN ('in_progress','completed','abandoned')),
  draft_data        JSONB NOT NULL DEFAULT '{}',
  completion_pct    INTEGER NOT NULL DEFAULT 0,
  last_saved_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_planning_wizard_drafts_workspace
  ON public.planning_wizard_drafts(workspace_id);

CREATE INDEX IF NOT EXISTS idx_planning_wizard_drafts_created_by
  ON public.planning_wizard_drafts(created_by);

CREATE INDEX IF NOT EXISTS idx_planning_wizard_drafts_status
  ON public.planning_wizard_drafts(draft_status);

-- ── RLS ────────────────────────────────────────────────────────────────────────

ALTER TABLE public.planning_wizard_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_member_access_wizard_drafts"
  ON public.planning_wizard_drafts
  FOR ALL
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

-- ── Updated_at trigger ─────────────────────────────────────────────────────────

CREATE OR REPLACE TRIGGER planning_wizard_drafts_updated_at
  BEFORE UPDATE ON public.planning_wizard_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
