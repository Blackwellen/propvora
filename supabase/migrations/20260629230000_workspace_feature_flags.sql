-- ============================================================================
-- 20260629230000_workspace_feature_flags.sql
-- Per-workspace feature-flag overrides.
--
-- src/lib/flags/index.ts reads a per-workspace override from this table (override
-- → global platform_feature_flags → registry default). The table was referenced
-- by code but never created in the DB, so every flag check 404'd (handled by the
-- isSchemaGap fallback, but it logged a console error AND meant per-workspace
-- overrides silently never worked). This creates it, RLS-scoped. Idempotent.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.workspace_feature_flags (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  flag_key     text NOT NULL,
  enabled      boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, flag_key)
);

CREATE INDEX IF NOT EXISTS idx_wsff_workspace ON public.workspace_feature_flags(workspace_id);

ALTER TABLE public.workspace_feature_flags ENABLE ROW LEVEL SECURITY;

-- Members read their workspace's overrides (the client flag check needs this —
-- without a SELECT policy the read 404s/denies and overrides can't be honoured).
DROP POLICY IF EXISTS "Members read workspace flags" ON public.workspace_feature_flags;
CREATE POLICY "Members read workspace flags" ON public.workspace_feature_flags
  FOR SELECT USING (is_workspace_member(workspace_id));

-- Only workspace owners/admins manage overrides (mirrors workspace_settings).
DROP POLICY IF EXISTS "Admins manage workspace flags" ON public.workspace_feature_flags;
CREATE POLICY "Admins manage workspace flags" ON public.workspace_feature_flags
  FOR ALL
  USING (has_workspace_role(auth.uid(), workspace_id, ARRAY['owner'::app_role, 'admin'::app_role]))
  WITH CHECK (has_workspace_role(auth.uid(), workspace_id, ARRAY['owner'::app_role, 'admin'::app_role]));
