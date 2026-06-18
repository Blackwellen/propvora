-- ════════════════════════════════════════════════════════════════════════════
-- Supplier Workspace Depth — additive support for the plan-gated supplier
-- workspace rebuild (Solo vs Team), tabbed hubs, route-backed detail pages,
-- Insights and review-first Automations.
--
-- ADDITIVE & IDEMPOTENT. Inspects nothing destructively — every object uses
-- IF NOT EXISTS / ADD COLUMN IF NOT EXISTS. Existing supplier_* tables
-- (supplier_workspace_members, supplier_marketplace_quotes,
-- supplier_job_assignments, supplier_workspace_services / _packages /
-- _coverage_areas / _availability, supplier_job_evidence, supplier_disputes,
-- supplier_compliance_documents, supplier_notifications/_messages …) are LEFT
-- UNTOUCHED. We only add what's genuinely missing.
--
-- RLS is modelled on the EXISTING supplier-workspace-membership pattern used by
-- public.supplier_workspace_members: access is granted to members of the owning
-- workspace via the platform helper public.is_workspace_member(workspace_id).
-- (Service role bypasses RLS entirely.)
--
-- Role matrix (enforced in the app via useSupplierPermissions; the DB grants
-- workspace-member access and the app narrows by role):
--   finance / payouts   → owner, admin, finance
--   automations/account → owner, admin
--   worker              → assigned jobs + evidence only
-- ════════════════════════════════════════════════════════════════════════════

-- ── 0. Plan type on the workspace ───────────────────────────────────────────
--   'solo' = single-operator supplier; 'team' = multi-member business.
ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS plan_type text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'workspaces_plan_type_chk'
  ) THEN
    ALTER TABLE public.workspaces
      ADD CONSTRAINT workspaces_plan_type_chk
      CHECK (plan_type IS NULL OR plan_type IN ('solo','team'));
  END IF;
END $$;

-- Role widening on the membership table: allow the supplier role set used by
-- the access matrix. We do NOT add a CHECK (role is free-text 'member' today)
-- to avoid breaking existing rows; the app validates the role enum.

-- ── helper: standard updated_at trigger attach (no-op if fn absent) ──────────
CREATE OR REPLACE FUNCTION public._supplier_depth_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

-- ── 1. supplier_requests — inbound quote requests / leads ───────────────────
CREATE TABLE IF NOT EXISTS public.supplier_requests (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title                 text,
  description           text,
  status                text NOT NULL DEFAULT 'new',
  source                text,
  property_ref          text,
  requested_by          uuid,
  amount_pence          bigint,
  currency              text NOT NULL DEFAULT 'GBP',
  created_by            uuid,
  archived_at           timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS supplier_requests_ws_idx ON public.supplier_requests (workspace_id);
CREATE INDEX IF NOT EXISTS supplier_requests_status_idx ON public.supplier_requests (status);
CREATE INDEX IF NOT EXISTS supplier_requests_created_idx ON public.supplier_requests (created_at);

-- ── 2. supplier_quotes — supplier-authored quotes (additive to existing
--      supplier_marketplace_quotes; new generic shape for the rebuilt UI) ────
CREATE TABLE IF NOT EXISTS public.supplier_quotes (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  request_id            uuid REFERENCES public.supplier_requests(id) ON DELETE SET NULL,
  title                 text,
  status                text NOT NULL DEFAULT 'draft',
  amount_pence          bigint,
  currency              text NOT NULL DEFAULT 'GBP',
  line_items            jsonb NOT NULL DEFAULT '[]'::jsonb,
  terms                 text,
  valid_until           date,
  created_by            uuid,
  archived_at           timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS supplier_quotes_ws_idx ON public.supplier_quotes (workspace_id);
CREATE INDEX IF NOT EXISTS supplier_quotes_status_idx ON public.supplier_quotes (status);
CREATE INDEX IF NOT EXISTS supplier_quotes_request_idx ON public.supplier_quotes (request_id);
CREATE INDEX IF NOT EXISTS supplier_quotes_created_idx ON public.supplier_quotes (created_at);

-- ── 3. supplier_schedule_events — calendar entries (jobs, visits, time off) ──
CREATE TABLE IF NOT EXISTS public.supplier_schedule_events (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title                 text,
  kind                  text NOT NULL DEFAULT 'job',
  status                text NOT NULL DEFAULT 'scheduled',
  starts_at             timestamptz,
  ends_at               timestamptz,
  all_day               boolean NOT NULL DEFAULT false,
  assigned_to           uuid,
  job_id                uuid,
  created_by            uuid,
  archived_at           timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS supplier_schedule_events_ws_idx ON public.supplier_schedule_events (workspace_id);
CREATE INDEX IF NOT EXISTS supplier_schedule_events_assigned_idx ON public.supplier_schedule_events (assigned_to);
CREATE INDEX IF NOT EXISTS supplier_schedule_events_starts_idx ON public.supplier_schedule_events (starts_at);

-- ── 4. supplier_availability_rules — recurring working-hours rules ──────────
CREATE TABLE IF NOT EXISTS public.supplier_availability_rules (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  day_of_week           smallint,
  start_minute          integer,
  end_minute            integer,
  kind                  text NOT NULL DEFAULT 'available',
  member_id             uuid,
  created_by            uuid,
  archived_at           timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS supplier_availability_rules_ws_idx ON public.supplier_availability_rules (workspace_id);

-- ── 5. supplier_reviews — customer reviews & responses ──────────────────────
CREATE TABLE IF NOT EXISTS public.supplier_reviews (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  rating                smallint,
  title                 text,
  body                  text,
  reviewer_name         text,
  response              text,
  responded_at          timestamptz,
  status                text NOT NULL DEFAULT 'published',
  job_id                uuid,
  archived_at           timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS supplier_reviews_ws_idx ON public.supplier_reviews (workspace_id);
CREATE INDEX IF NOT EXISTS supplier_reviews_created_idx ON public.supplier_reviews (created_at);

-- ── 6. supplier_payouts — payout records ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.supplier_payouts (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  amount_pence          bigint NOT NULL DEFAULT 0,
  currency              text NOT NULL DEFAULT 'GBP',
  status                text NOT NULL DEFAULT 'pending',
  invoice_id            uuid,
  reference             text,
  paid_at               timestamptz,
  archived_at           timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS supplier_payouts_ws_idx ON public.supplier_payouts (workspace_id);
CREATE INDEX IF NOT EXISTS supplier_payouts_status_idx ON public.supplier_payouts (status);

-- ── 7. supplier_insight_snapshots — periodic analytics snapshots (Team) ─────
CREATE TABLE IF NOT EXISTS public.supplier_insight_snapshots (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  period                text NOT NULL DEFAULT 'weekly',
  period_start          date,
  metrics               jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS supplier_insight_snapshots_ws_idx ON public.supplier_insight_snapshots (workspace_id);

-- ── 8. supplier_automation_rules — review-first automation rules (Team) ─────
CREATE TABLE IF NOT EXISTS public.supplier_automation_rules (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name                  text,
  trigger               text,
  action                text,
  config                jsonb NOT NULL DEFAULT '{}'::jsonb,
  status                text NOT NULL DEFAULT 'draft',
  -- review-first: customer/platform-impacting actions require approval
  requires_approval     boolean NOT NULL DEFAULT true,
  created_by            uuid,
  archived_at           timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS supplier_automation_rules_ws_idx ON public.supplier_automation_rules (workspace_id);
CREATE INDEX IF NOT EXISTS supplier_automation_rules_status_idx ON public.supplier_automation_rules (status);

-- ── 9. supplier_audit_events — workspace audit trail ────────────────────────
CREATE TABLE IF NOT EXISTS public.supplier_audit_events (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  actor_id              uuid,
  action                text,
  entity_type           text,
  entity_id             uuid,
  metadata              jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS supplier_audit_events_ws_idx ON public.supplier_audit_events (workspace_id);
CREATE INDEX IF NOT EXISTS supplier_audit_events_created_idx ON public.supplier_audit_events (created_at);

-- ── updated_at triggers ──────────────────────────────────────────────────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'supplier_requests','supplier_quotes','supplier_schedule_events',
    'supplier_availability_rules','supplier_reviews','supplier_payouts',
    'supplier_automation_rules'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', t || '_touch', t);
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public._supplier_depth_touch_updated_at()',
      t || '_touch', t
    );
  END LOOP;
END $$;

-- ── RLS — workspace-membership policy on every new table ─────────────────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'supplier_requests','supplier_quotes','supplier_schedule_events',
    'supplier_availability_rules','supplier_reviews','supplier_payouts',
    'supplier_insight_snapshots','supplier_automation_rules','supplier_audit_events'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_member_all', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL USING (public.is_workspace_member(workspace_id)) WITH CHECK (public.is_workspace_member(workspace_id))',
      t || '_member_all', t
    );
  END LOOP;
END $$;
