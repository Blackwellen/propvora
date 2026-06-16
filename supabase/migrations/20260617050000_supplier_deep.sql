-- ============================================================================
-- 20260617050000_supplier_deep.sql
--
-- Deep supplier-WORKSPACE workflow substrate. Adds the genuinely-missing tables
-- that let the supplier workspace run a real job lifecycle end to end:
--
--   • supplier_job_events    — append-only audit log of every state transition
--                              and note on a supplier_job_assignment (the real
--                              backing for the job "Audit" + "Activity" tabs;
--                              the derived-timeline route is upgraded to merge
--                              these real rows when present).
--   • supplier_job_evidence  — before / during / after evidence attached to a
--                              job assignment (R2-backed via /api/upload), the
--                              real backing for the job "Evidence" tab.
--   • supplier_disputes      — a dispute raised on a job assignment, with a
--                              status lifecycle (open → under_review → resolved
--                              / rejected / withdrawn).
--
-- Existing tables CONSUMED unchanged (not duplicated): supplier_packages and
-- supplier_invoices are already workspace_id-scoped and RLS'd through
-- workspace_members — supplier-workspace users are members of workspace_members
-- for their supplier workspace, so those tables back Packages + Invoices
-- directly. supplier_workspace_members backs Team. payouts (workspace_id) backs
-- Payouts. The supplier-verification family backs Verification/Insurance/Licences.
--
-- All money is integer pence. RLS is the real boundary: a row touching a
-- supplier_job_assignment is visible/writable by a member of EITHER the operator
-- or supplier workspace on that assignment (mirroring the assignment's own RLS).
-- Fully idempotent.
-- ============================================================================

-- ── Helper: membership of either side of a job assignment ───────────────────
CREATE OR REPLACE FUNCTION public.can_access_supplier_assignment(_assignment_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.supplier_job_assignments a
    WHERE a.id = _assignment_id
      AND (
        public.is_workspace_member(a.operator_workspace_id)
        OR public.is_supplier_workspace_member(a.supplier_workspace_id)
      )
  );
$$;
REVOKE ALL ON FUNCTION public.can_access_supplier_assignment(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.can_access_supplier_assignment(uuid) TO authenticated;

-- ── 1. supplier_job_events ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.supplier_job_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id   uuid NOT NULL REFERENCES public.supplier_job_assignments(id) ON DELETE CASCADE,
  event_type      text NOT NULL DEFAULT 'status',     -- status | note | evidence | dispute | schedule
  from_status     text,
  to_status       text,
  note            text,
  actor_user_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_side      text,                               -- operator | supplier | system
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS supplier_job_events_assignment_idx
  ON public.supplier_job_events (assignment_id, created_at DESC);

ALTER TABLE public.supplier_job_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'supplier_job_events'
      AND policyname = 'supplier_job_events_select'
  ) THEN
    CREATE POLICY supplier_job_events_select ON public.supplier_job_events
      FOR SELECT USING (public.can_access_supplier_assignment(assignment_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'supplier_job_events'
      AND policyname = 'supplier_job_events_insert'
  ) THEN
    CREATE POLICY supplier_job_events_insert ON public.supplier_job_events
      FOR INSERT WITH CHECK (public.can_access_supplier_assignment(assignment_id));
  END IF;
END $$;

-- ── 2. supplier_job_evidence ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.supplier_job_evidence (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id   uuid NOT NULL REFERENCES public.supplier_job_assignments(id) ON DELETE CASCADE,
  supplier_workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  phase           text NOT NULL DEFAULT 'during',     -- before | during | after
  r2_key          text NOT NULL,
  file_name       text,
  content_type    text,
  size_bytes      bigint,
  caption         text,
  uploaded_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,
  CONSTRAINT supplier_job_evidence_phase_chk
    CHECK (phase IN ('before','during','after'))
);
CREATE INDEX IF NOT EXISTS supplier_job_evidence_assignment_idx
  ON public.supplier_job_evidence (assignment_id, phase, created_at DESC);

ALTER TABLE public.supplier_job_evidence ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'supplier_job_evidence'
      AND policyname = 'supplier_job_evidence_select'
  ) THEN
    CREATE POLICY supplier_job_evidence_select ON public.supplier_job_evidence
      FOR SELECT USING (public.can_access_supplier_assignment(assignment_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'supplier_job_evidence'
      AND policyname = 'supplier_job_evidence_insert'
  ) THEN
    CREATE POLICY supplier_job_evidence_insert ON public.supplier_job_evidence
      FOR INSERT WITH CHECK (
        public.is_supplier_workspace_member(supplier_workspace_id)
        AND public.can_access_supplier_assignment(assignment_id)
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'supplier_job_evidence'
      AND policyname = 'supplier_job_evidence_update'
  ) THEN
    CREATE POLICY supplier_job_evidence_update ON public.supplier_job_evidence
      FOR UPDATE USING (public.is_supplier_workspace_member(supplier_workspace_id));
  END IF;
END $$;

-- ── 3. supplier_disputes ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.supplier_disputes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id   uuid NOT NULL REFERENCES public.supplier_job_assignments(id) ON DELETE CASCADE,
  operator_workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  supplier_workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  raised_by_side  text NOT NULL DEFAULT 'supplier',   -- operator | supplier
  raised_by       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  category        text NOT NULL DEFAULT 'other',       -- payment | scope | quality | access | other
  subject         text NOT NULL,
  detail          text,
  status          text NOT NULL DEFAULT 'open',        -- open | under_review | resolved | rejected | withdrawn
  resolution      text,
  resolved_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT supplier_disputes_status_chk
    CHECK (status IN ('open','under_review','resolved','rejected','withdrawn'))
);
CREATE INDEX IF NOT EXISTS supplier_disputes_supplier_idx
  ON public.supplier_disputes (supplier_workspace_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS supplier_disputes_assignment_idx
  ON public.supplier_disputes (assignment_id);

ALTER TABLE public.supplier_disputes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'supplier_disputes'
      AND policyname = 'supplier_disputes_select'
  ) THEN
    CREATE POLICY supplier_disputes_select ON public.supplier_disputes
      FOR SELECT USING (
        public.is_workspace_member(operator_workspace_id)
        OR public.is_supplier_workspace_member(supplier_workspace_id)
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'supplier_disputes'
      AND policyname = 'supplier_disputes_insert'
  ) THEN
    CREATE POLICY supplier_disputes_insert ON public.supplier_disputes
      FOR INSERT WITH CHECK (
        public.is_workspace_member(operator_workspace_id)
        OR public.is_supplier_workspace_member(supplier_workspace_id)
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'supplier_disputes'
      AND policyname = 'supplier_disputes_update'
  ) THEN
    CREATE POLICY supplier_disputes_update ON public.supplier_disputes
      FOR UPDATE USING (
        public.is_workspace_member(operator_workspace_id)
        OR public.is_supplier_workspace_member(supplier_workspace_id)
      );
  END IF;
END $$;

-- updated_at touch trigger for disputes (reuse the standard helper if present).
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    DROP TRIGGER IF EXISTS supplier_disputes_set_updated_at ON public.supplier_disputes;
    CREATE TRIGGER supplier_disputes_set_updated_at
      BEFORE UPDATE ON public.supplier_disputes
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- ── 4. supplier_workspace_packages ──────────────────────────────────────────
-- Workspace-scoped productised offerings. DISTINCT from the legacy contact-based
-- `supplier_packages` (which requires a supplier_id referencing the operator's
-- supplier directory and so cannot represent a first-class supplier workspace).
-- price is integer pence to match the supplier money convention.
CREATE TABLE IF NOT EXISTS public.supplier_workspace_packages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name            text NOT NULL,
  description     text,
  price_pence     bigint,
  currency        text NOT NULL DEFAULT 'GBP',
  duration_days   integer,
  inclusions      text[] NOT NULL DEFAULT '{}',
  exclusions      text[] NOT NULL DEFAULT '{}',
  active          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS supplier_workspace_packages_ws_idx
  ON public.supplier_workspace_packages (workspace_id, active);

ALTER TABLE public.supplier_workspace_packages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='supplier_workspace_packages' AND policyname='swp_select') THEN
    CREATE POLICY swp_select ON public.supplier_workspace_packages FOR SELECT USING (public.is_supplier_workspace_member(workspace_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='supplier_workspace_packages' AND policyname='swp_write') THEN
    CREATE POLICY swp_write ON public.supplier_workspace_packages FOR ALL
      USING (public.is_supplier_workspace_member(workspace_id))
      WITH CHECK (public.is_supplier_workspace_member(workspace_id));
  END IF;
END $$;

-- ── 5. supplier_workspace_invoices ──────────────────────────────────────────
-- Workspace-scoped invoices. DISTINCT from the legacy contact-based
-- `supplier_invoices` (NOT NULL contact_id). amount is integer pence.
CREATE TABLE IF NOT EXISTS public.supplier_workspace_invoices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  assignment_id   uuid REFERENCES public.supplier_job_assignments(id) ON DELETE SET NULL,
  invoice_number  text,
  amount_pence    bigint,
  currency        text NOT NULL DEFAULT 'GBP',
  status          text NOT NULL DEFAULT 'draft',  -- draft | submitted | approved | paid | void
  submitted_at    timestamptz,
  approved_at     timestamptz,
  paid_at         timestamptz,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT swi_status_chk CHECK (status IN ('draft','submitted','approved','paid','void'))
);
CREATE INDEX IF NOT EXISTS supplier_workspace_invoices_ws_idx
  ON public.supplier_workspace_invoices (workspace_id, status, created_at DESC);

ALTER TABLE public.supplier_workspace_invoices ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='supplier_workspace_invoices' AND policyname='swi_select') THEN
    CREATE POLICY swi_select ON public.supplier_workspace_invoices FOR SELECT USING (public.is_supplier_workspace_member(workspace_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='supplier_workspace_invoices' AND policyname='swi_write') THEN
    CREATE POLICY swi_write ON public.supplier_workspace_invoices FOR ALL
      USING (public.is_supplier_workspace_member(workspace_id))
      WITH CHECK (public.is_supplier_workspace_member(workspace_id));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    DROP TRIGGER IF EXISTS swp_set_updated_at ON public.supplier_workspace_packages;
    CREATE TRIGGER swp_set_updated_at BEFORE UPDATE ON public.supplier_workspace_packages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    DROP TRIGGER IF EXISTS swi_set_updated_at ON public.supplier_workspace_invoices;
    CREATE TRIGGER swi_set_updated_at BEFORE UPDATE ON public.supplier_workspace_invoices FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;
