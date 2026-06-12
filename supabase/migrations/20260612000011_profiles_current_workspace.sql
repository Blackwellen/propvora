-- ============================================================================
-- CRITICAL FIX: the entire app tracks the user's active workspace via
-- profiles.current_workspace_id (login routing app-vs-onboarding, AuthProvider
-- workspace load, switchWorkspace, createWorkspace) but the column was missing
-- from the live DB. Without it, a user WITH a workspace is wrongly routed to
-- /onboarding and the app cannot resolve the active workspace.
-- Idempotent / additive.
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_current_workspace
  ON public.profiles(current_workspace_id) WHERE current_workspace_id IS NOT NULL;
