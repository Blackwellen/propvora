-- ============================================================================
-- CRITICAL FIX: onboarding createWorkspace does
--   INSERT INTO workspaces (...) RETURNING id, slug   (via .insert().select())
-- The RETURNING is filtered by SELECT RLS, but the only SELECT policies require
-- workspace_members membership — which doesn't exist yet at creation time
-- (chicken-and-egg). PostgREST reports this as 42501, so EVERY new user's
-- onboarding failed with "Failed to create workspace".
--
-- Allow an owner to SELECT their own workspace (owner_user_id = auth.uid()).
-- This is correct regardless of membership and unblocks INSERT...RETURNING.
-- Idempotent.
-- ============================================================================

DROP POLICY IF EXISTS "workspaces_select_owner" ON public.workspaces;
CREATE POLICY "workspaces_select_owner" ON public.workspaces
  FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid());
