-- ============================================================================
-- Security hardening: SUPPLIER JOB/INVOICE SCOPING (audit fix #3)
--
-- Problem: the supplier portal currently scopes a supplier's jobs/invoices in
-- the CLIENT query layer (`.eq('supplier_contact_id', …)` / `.eq('contact_id',
-- …)`). The underlying RLS on `jobs` and `supplier_invoices` is purely
-- workspace-member scoped (`is_workspace_member(workspace_id)`), so any user the
-- DB treats as a workspace member could read the WHOLE workspace's jobs/invoices
-- by bypassing the client filter. We push the per-supplier boundary down into
-- RLS so it is enforced by the database, not the UI.
--
-- Approach (ADDITIVE + non-breaking):
--   1. Create the intended production link table `supplier_portal_access`
--      (user_id ↔ supplier contact_id ↔ workspace). The portal context resolver
--      already prefers this table; it just didn't exist in the DB yet.
--   2. Add a SECURITY DEFINER helper `is_portal_supplier_for(workspace, contact)`
--      that returns true when the CURRENT auth user is the active portal supplier
--      bound to that contact in that workspace.
--   3. Add SELECT policies on `jobs` and `supplier_invoices` that grant a
--      portal-linked supplier read access to ONLY the rows tied to THEIR contact
--      id. The existing operator (`is_workspace_member`) policies are untouched,
--      so legitimate operator access is unaffected. Because RLS policies are
--      OR-combined, a real external supplier (who is NOT a workspace member) now
--      sees exactly their own jobs/invoices and nothing else.
-- ============================================================================

-- ── 1. supplier_portal_access ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.supplier_portal_access (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  contact_id   uuid NOT NULL,                 -- the supplier `contacts` row
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email        text,                          -- invite/link target (pre-signup)
  active       boolean NOT NULL DEFAULT true,
  invited_by   uuid,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, contact_id)
);

CREATE INDEX IF NOT EXISTS supplier_portal_access_user_idx
  ON public.supplier_portal_access (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS supplier_portal_access_workspace_idx
  ON public.supplier_portal_access (workspace_id, contact_id);

ALTER TABLE public.supplier_portal_access ENABLE ROW LEVEL SECURITY;

-- Operators (workspace members) manage portal access rows for their workspace.
DROP POLICY IF EXISTS supplier_portal_access_member_all ON public.supplier_portal_access;
CREATE POLICY supplier_portal_access_member_all ON public.supplier_portal_access
  FOR ALL
  USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

-- A supplier may read their OWN access row (so the portal can resolve context).
DROP POLICY IF EXISTS supplier_portal_access_self_select ON public.supplier_portal_access;
CREATE POLICY supplier_portal_access_self_select ON public.supplier_portal_access
  FOR SELECT
  USING (user_id = auth.uid());

-- updated_at touch (reuse shared trigger fn if present; guard if not).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at') THEN
    DROP TRIGGER IF EXISTS update_supplier_portal_access_updated_at ON public.supplier_portal_access;
    CREATE TRIGGER update_supplier_portal_access_updated_at
      BEFORE UPDATE ON public.supplier_portal_access
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- ── 2. Helper: is the current user the active portal supplier for a contact? ─
-- SECURITY DEFINER so it can read supplier_portal_access regardless of the
-- caller's own RLS, but it ONLY ever checks the CURRENT auth.uid() against the
-- given (workspace, contact) pair — it cannot be used to enumerate other rows.
CREATE OR REPLACE FUNCTION public.is_portal_supplier_for(
  _workspace_id uuid,
  _contact_id   uuid
) RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.supplier_portal_access spa
    WHERE spa.user_id = auth.uid()
      AND spa.active = true
      AND spa.workspace_id = _workspace_id
      AND spa.contact_id   = _contact_id
  );
$$;

REVOKE ALL ON FUNCTION public.is_portal_supplier_for(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_portal_supplier_for(uuid, uuid) TO authenticated;

-- ── 3. Per-supplier SELECT policies (additive to the member policies) ────────
-- jobs: a portal supplier reads only jobs where they are the assigned supplier.
DROP POLICY IF EXISTS jobs_supplier_self_select ON public.jobs;
CREATE POLICY jobs_supplier_self_select ON public.jobs
  FOR SELECT
  USING (
    supplier_contact_id IS NOT NULL
    AND is_portal_supplier_for(workspace_id, supplier_contact_id)
  );

-- supplier_invoices: a portal supplier reads only invoices tied to their contact.
DROP POLICY IF EXISTS supplier_invoices_supplier_self_select ON public.supplier_invoices;
CREATE POLICY supplier_invoices_supplier_self_select ON public.supplier_invoices
  FOR SELECT
  USING (
    contact_id IS NOT NULL
    AND is_portal_supplier_for(workspace_id, contact_id)
  );

-- NOTE on the operator (is_workspace_member) policies on jobs / supplier_invoices:
-- they are intentionally LEFT IN PLACE. Operators must see the whole workspace.
-- The new policies only widen access for genuine external portal suppliers, who
-- are not workspace members, so for them only their own rows are visible.

-- ============================================================================
-- FIX #6 DECISION RECORD — properties permissive RLS (DELETE)
-- ----------------------------------------------------------------------------
-- The audit flagged that "any member can write properties". Investigation of the
-- live schema shows this is ALREADY gated correctly:
--   * properties_insert_ops / properties_update_ops → owner/admin/manager/member
--     (members are MEANT to manage properties — intended product behaviour).
--   * properties_delete_admin → DELETE restricted to owner/admin only via
--     has_workspace_role(...,'owner','admin'). Destructive deletes are already
--     owner/admin-gated.
-- There is also a legacy broad policy "Workspace members can access properties"
-- (FOR ALL). Because RLS is OR-combined, that legacy policy would re-open DELETE
-- to any member, defeating properties_delete_admin. We drop ONLY that legacy
-- catch-all so the granular per-command policies (already present) take effect.
-- This does NOT lock out legitimate editing: insert/update/select for members
-- remain covered by the granular *_ops / *_members policies.
-- ============================================================================
DROP POLICY IF EXISTS "Workspace members can access properties" ON public.properties;

-- A second legacy per-command policy, "Members delete properties", grants DELETE
-- to ANY workspace member via is_workspace_member(workspace_id). Because RLS is
-- OR-combined this also defeats properties_delete_admin. Drop it so destructive
-- DELETE is owner/admin-only. Insert/Update for members stay covered by the
-- granular properties_insert_ops / properties_update_ops policies, so normal
-- property management by members is unaffected.
DROP POLICY IF EXISTS "Members delete properties" ON public.properties;
