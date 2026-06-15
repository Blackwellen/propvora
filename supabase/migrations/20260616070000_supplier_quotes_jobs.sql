-- ============================================================================
-- P3 — SUPPLIER ↔ OPERATOR CONNECTIONS + QUOTES + JOB FLOW
--
-- The two-sided marketplace work layer. An OPERATOR workspace and a SUPPLIER
-- workspace connect, then exchange QUOTES, and an accepted quote spawns a JOB
-- ASSIGNMENT that runs a small state machine to completion.
--
-- ── CONNECTION-MODEL DECISION ───────────────────────────────────────────────
-- The P0 foundation table `supplier_workspace_members` is MEMBERSHIP-ONLY
-- (workspace_id, user_id, role) — it links USERS to a supplier-type workspace.
-- It carries NO status and NO operator↔supplier linkage, so it cannot be the
-- connection backbone. We therefore ADD a dedicated `supplier_connections`
-- table for the operator-workspace ↔ supplier-workspace relationship + status.
--
-- The V1 tables `supplier_quotes` and `supplier_jobs` ALREADY EXIST but are
-- SINGLE-WORKSPACE (one `workspace_id`, the supplier is a CONTACT via
-- `supplier_contact_id`). They model an operator's *internal* PPM/work flow,
-- not a two-sided marketplace. We do NOT touch them. Instead we add distinctly
-- named v2 tables (`supplier_marketplace_quotes`, `supplier_job_assignments`)
-- that carry BOTH `operator_workspace_id` and `supplier_workspace_id`, and
-- interoperate with the existing operator-side `jobs` table via a nullable FK
-- (`job_id`) so an assignment can be linked to/spawn an internal work job
-- without duplicating it.
--
-- Idempotent + additive. RLS uses the existing helper `is_workspace_member`
-- (reads auth.uid() internally) for BOTH operator and supplier sides.
-- ============================================================================

-- ── 1. supplier_connections ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.supplier_connections (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_workspace_id  uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  supplier_workspace_id  uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  status                 text NOT NULL DEFAULT 'invited'
                           CHECK (status IN ('invited','active','paused','ended')),
  invited_by             uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  UNIQUE (operator_workspace_id, supplier_workspace_id)
);
CREATE INDEX IF NOT EXISTS supplier_connections_operator_idx
  ON public.supplier_connections (operator_workspace_id);
CREATE INDEX IF NOT EXISTS supplier_connections_supplier_idx
  ON public.supplier_connections (supplier_workspace_id);
CREATE INDEX IF NOT EXISTS supplier_connections_status_idx
  ON public.supplier_connections (status);

-- ── 2. supplier_marketplace_quotes ──────────────────────────────────────────
-- Two-sided quote between an operator workspace and a supplier workspace.
-- Distinct from the V1 `supplier_quotes` (single-workspace, contact-based).
CREATE TABLE IF NOT EXISTS public.supplier_marketplace_quotes (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_workspace_id  uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  supplier_workspace_id  uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  property_id            uuid,
  job_id                 uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  service_id             uuid,
  title                  text NOT NULL,
  description            text,
  status                 text NOT NULL DEFAULT 'requested'
                           CHECK (status IN ('requested','quoted','accepted','declined','expired','withdrawn')),
  amount_pence           bigint,
  currency               text NOT NULL DEFAULT 'GBP',
  valid_until            date,
  created_by             uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS supplier_mktplace_quotes_operator_idx
  ON public.supplier_marketplace_quotes (operator_workspace_id);
CREATE INDEX IF NOT EXISTS supplier_mktplace_quotes_supplier_idx
  ON public.supplier_marketplace_quotes (supplier_workspace_id);
CREATE INDEX IF NOT EXISTS supplier_mktplace_quotes_status_idx
  ON public.supplier_marketplace_quotes (status);
CREATE INDEX IF NOT EXISTS supplier_mktplace_quotes_job_idx
  ON public.supplier_marketplace_quotes (job_id);

-- ── 3. supplier_job_assignments ─────────────────────────────────────────────
-- A unit of work assigned by an operator workspace to a supplier workspace,
-- optionally spawned from an accepted quote and optionally linked to an
-- existing operator-side `jobs` row (interop, not duplication).
CREATE TABLE IF NOT EXISTS public.supplier_job_assignments (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id               uuid REFERENCES public.supplier_marketplace_quotes(id) ON DELETE SET NULL,
  operator_workspace_id  uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  supplier_workspace_id  uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  job_id                 uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  status                 text NOT NULL DEFAULT 'assigned'
                           CHECK (status IN ('assigned','accepted','in_progress','completed','cancelled')),
  scheduled_for          timestamptz,
  completed_at           timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS supplier_job_assignments_operator_idx
  ON public.supplier_job_assignments (operator_workspace_id);
CREATE INDEX IF NOT EXISTS supplier_job_assignments_supplier_idx
  ON public.supplier_job_assignments (supplier_workspace_id);
CREATE INDEX IF NOT EXISTS supplier_job_assignments_status_idx
  ON public.supplier_job_assignments (status);
CREATE INDEX IF NOT EXISTS supplier_job_assignments_quote_idx
  ON public.supplier_job_assignments (quote_id);

-- ── 4. updated_at triggers (reuse existing helper if present) ────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at') THEN
    DROP TRIGGER IF EXISTS update_supplier_connections_updated_at ON public.supplier_connections;
    CREATE TRIGGER update_supplier_connections_updated_at
      BEFORE UPDATE ON public.supplier_connections
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();

    DROP TRIGGER IF EXISTS update_supplier_mktplace_quotes_updated_at ON public.supplier_marketplace_quotes;
    CREATE TRIGGER update_supplier_mktplace_quotes_updated_at
      BEFORE UPDATE ON public.supplier_marketplace_quotes
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();

    DROP TRIGGER IF EXISTS update_supplier_job_assignments_updated_at ON public.supplier_job_assignments;
    CREATE TRIGGER update_supplier_job_assignments_updated_at
      BEFORE UPDATE ON public.supplier_job_assignments
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- ── 5. RLS — both operator and supplier sides ───────────────────────────────
-- A row is visible/manageable to a caller who is a member of EITHER the
-- operator workspace OR the supplier workspace on the row. `is_workspace_member`
-- reads auth.uid() internally. Side-specific WRITE constraints (e.g. only the
-- operator may invite, only the supplier may submit an amount) are enforced in
-- the data layer / API, which already verifies membership of the correct side.

-- 5a. supplier_connections
ALTER TABLE public.supplier_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS supplier_connections_member_select ON public.supplier_connections;
CREATE POLICY supplier_connections_member_select ON public.supplier_connections
  FOR SELECT
  USING (
    public.is_workspace_member(operator_workspace_id)
    OR public.is_workspace_member(supplier_workspace_id)
  );

DROP POLICY IF EXISTS supplier_connections_member_insert ON public.supplier_connections;
CREATE POLICY supplier_connections_member_insert ON public.supplier_connections
  FOR INSERT
  WITH CHECK (
    public.is_workspace_member(operator_workspace_id)
    OR public.is_workspace_member(supplier_workspace_id)
  );

DROP POLICY IF EXISTS supplier_connections_member_update ON public.supplier_connections;
CREATE POLICY supplier_connections_member_update ON public.supplier_connections
  FOR UPDATE
  USING (
    public.is_workspace_member(operator_workspace_id)
    OR public.is_workspace_member(supplier_workspace_id)
  )
  WITH CHECK (
    public.is_workspace_member(operator_workspace_id)
    OR public.is_workspace_member(supplier_workspace_id)
  );

DROP POLICY IF EXISTS supplier_connections_member_delete ON public.supplier_connections;
CREATE POLICY supplier_connections_member_delete ON public.supplier_connections
  FOR DELETE
  USING (public.is_workspace_member(operator_workspace_id));

-- 5b. supplier_marketplace_quotes
ALTER TABLE public.supplier_marketplace_quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS supplier_mktplace_quotes_member_select ON public.supplier_marketplace_quotes;
CREATE POLICY supplier_mktplace_quotes_member_select ON public.supplier_marketplace_quotes
  FOR SELECT
  USING (
    public.is_workspace_member(operator_workspace_id)
    OR public.is_workspace_member(supplier_workspace_id)
  );

DROP POLICY IF EXISTS supplier_mktplace_quotes_member_insert ON public.supplier_marketplace_quotes;
CREATE POLICY supplier_mktplace_quotes_member_insert ON public.supplier_marketplace_quotes
  FOR INSERT
  WITH CHECK (
    public.is_workspace_member(operator_workspace_id)
    OR public.is_workspace_member(supplier_workspace_id)
  );

DROP POLICY IF EXISTS supplier_mktplace_quotes_member_update ON public.supplier_marketplace_quotes;
CREATE POLICY supplier_mktplace_quotes_member_update ON public.supplier_marketplace_quotes
  FOR UPDATE
  USING (
    public.is_workspace_member(operator_workspace_id)
    OR public.is_workspace_member(supplier_workspace_id)
  )
  WITH CHECK (
    public.is_workspace_member(operator_workspace_id)
    OR public.is_workspace_member(supplier_workspace_id)
  );

-- 5c. supplier_job_assignments
ALTER TABLE public.supplier_job_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS supplier_job_assignments_member_select ON public.supplier_job_assignments;
CREATE POLICY supplier_job_assignments_member_select ON public.supplier_job_assignments
  FOR SELECT
  USING (
    public.is_workspace_member(operator_workspace_id)
    OR public.is_workspace_member(supplier_workspace_id)
  );

DROP POLICY IF EXISTS supplier_job_assignments_member_insert ON public.supplier_job_assignments;
CREATE POLICY supplier_job_assignments_member_insert ON public.supplier_job_assignments
  FOR INSERT
  WITH CHECK (
    public.is_workspace_member(operator_workspace_id)
    OR public.is_workspace_member(supplier_workspace_id)
  );

DROP POLICY IF EXISTS supplier_job_assignments_member_update ON public.supplier_job_assignments;
CREATE POLICY supplier_job_assignments_member_update ON public.supplier_job_assignments
  FOR UPDATE
  USING (
    public.is_workspace_member(operator_workspace_id)
    OR public.is_workspace_member(supplier_workspace_id)
  )
  WITH CHECK (
    public.is_workspace_member(operator_workspace_id)
    OR public.is_workspace_member(supplier_workspace_id)
  );

-- ============================================================================
-- END P3 supplier connections + quotes + job flow
-- ============================================================================
