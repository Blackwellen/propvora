-- ============================================================================
-- CRITICAL FIX: RLS infinite recursion on workspace_members.
-- The "Admin or owner manages members" policy had an inline
--   EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = wm.workspace_id ...)
-- subquery — selecting FROM workspace_members inside a workspace_members policy
-- causes Postgres 42P17 (infinite recursion) on EVERY membership query, which
-- returns HTTP 400 and breaks the AuthProvider, workspace switcher and member
-- lists. (It also had a tautology bug: wm.workspace_id = wm.workspace_id.)
--
-- Replace it with a non-recursive policy using is_workspace_admin(), which is
-- SECURITY DEFINER and therefore bypasses RLS (no recursion). All SELECT/read
-- access is already covered by the other non-recursive policies.
-- Idempotent.
-- ============================================================================

DROP POLICY IF EXISTS "Admin or owner manages members" ON public.workspace_members;

DROP POLICY IF EXISTS "wm_admin_manage_nonrecursive" ON public.workspace_members;
CREATE POLICY "wm_admin_manage_nonrecursive" ON public.workspace_members
  FOR ALL TO authenticated
  USING (is_workspace_admin(workspace_id))
  WITH CHECK (is_workspace_admin(workspace_id));
