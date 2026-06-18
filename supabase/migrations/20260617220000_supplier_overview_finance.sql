-- ════════════════════════════════════════════════════════════════════════════
-- Supplier Overview — Finance support tables for the Solo Supplier Overview
-- screen (Today / Open Requests / Active Jobs / Earnings / Compliance Alerts).
--
-- ADDITIVE & IDEMPOTENT. Every object uses IF NOT EXISTS / ADD COLUMN IF NOT
-- EXISTS so this migration is safe to re-run and never mutates existing data.
--
-- REUSE FIRST: the supplier-workspace depth migration
-- (20260617200100_supplier_workspace_depth.sql) already ships:
--   • supplier_requests           (Open Requests tab — leads/quote requests)
--   • supplier_quotes             (quote authoring)
--   • supplier_schedule_events    (Today agenda / appointments)
--   • supplier_availability_rules (availability toggle / hours)
--   • supplier_reviews            (trust / response score)
--   • supplier_payouts            (payout records)  ← ALREADY EXISTS, NOT redefined
--   • supplier_audit_events       (audit trail)
-- and earlier migrations ship supplier_job_assignments, supplier_job_evidence,
-- supplier_compliance_documents, supplier_notifications/_messages. Those are
-- LEFT UNTOUCHED.
--
-- We only create the genuinely-missing FINANCE tables the Earnings tab needs:
--   • supplier_finance_summaries  (rolled-up period finance snapshot)
--   • supplier_invoices           (invoice ledger + status)
--   • supplier_escrow_items       (escrow holds awaiting release/evidence)
--
-- RLS mirrors the EXISTING supplier-workspace pattern: access is granted to
-- members of the owning workspace via the platform helper
-- public.is_workspace_member(workspace_id), which itself resolves against the
-- REAL public.workspace_members(workspace_id, user_id) table. (Service role
-- bypasses RLS entirely.) This is the exact pattern used by every table in
-- 20260617200100_supplier_workspace_depth.sql.
-- ════════════════════════════════════════════════════════════════════════════

-- ── shared updated_at trigger fn (idempotent; matches the depth migration) ───
CREATE OR REPLACE FUNCTION public._supplier_overview_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

-- ── 1. supplier_finance_summaries — rolled-up period finance snapshot ────────
--   One row per (workspace, period) bucket. Drives the Earnings KPIs without a
--   live aggregate on every page load.
CREATE TABLE IF NOT EXISTS public.supplier_finance_summaries (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id              uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  -- supplier-workspace scoping alias kept for forward-compat with multi-entity
  -- supplier orgs; defaults to workspace_id for the Solo case.
  supplier_workspace_id     uuid,
  period                    text NOT NULL DEFAULT 'month',
  period_start              date,
  status                    text NOT NULL DEFAULT 'open',
  earnings_pence            bigint NOT NULL DEFAULT 0,
  in_escrow_pence           bigint NOT NULL DEFAULT 0,
  awaiting_payout_pence     bigint NOT NULL DEFAULT 0,
  paid_out_pence            bigint NOT NULL DEFAULT 0,
  unpaid_invoices_pence     bigint NOT NULL DEFAULT 0,
  available_balance_pence   bigint NOT NULL DEFAULT 0,
  currency                  text NOT NULL DEFAULT 'GBP',
  metadata_json             jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by                uuid,
  archived_at               timestamptz,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS supplier_finance_summaries_ws_idx        ON public.supplier_finance_summaries (workspace_id);
CREATE INDEX IF NOT EXISTS supplier_finance_summaries_swid_idx      ON public.supplier_finance_summaries (supplier_workspace_id);
CREATE INDEX IF NOT EXISTS supplier_finance_summaries_status_idx    ON public.supplier_finance_summaries (status);
CREATE INDEX IF NOT EXISTS supplier_finance_summaries_created_idx   ON public.supplier_finance_summaries (created_at);

-- ── 2. supplier_invoices — invoice ledger with status ───────────────────────
CREATE TABLE IF NOT EXISTS public.supplier_invoices (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id              uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  supplier_workspace_id     uuid,
  job_id                    uuid,
  number                    text,
  customer_name             text,
  service                   text,
  -- draft | sent | paid | overdue | void
  status                    text NOT NULL DEFAULT 'draft',
  amount_pence              bigint NOT NULL DEFAULT 0,
  currency                  text NOT NULL DEFAULT 'GBP',
  issued_at                 date,
  due_at                    date,
  paid_at                   timestamptz,
  metadata_json             jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by                uuid,
  archived_at               timestamptz,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS supplier_invoices_ws_idx        ON public.supplier_invoices (workspace_id);
CREATE INDEX IF NOT EXISTS supplier_invoices_swid_idx      ON public.supplier_invoices (supplier_workspace_id);
CREATE INDEX IF NOT EXISTS supplier_invoices_status_idx    ON public.supplier_invoices (status);
CREATE INDEX IF NOT EXISTS supplier_invoices_created_idx   ON public.supplier_invoices (created_at);

-- ── 3. supplier_escrow_items — escrow holds (release gated on evidence) ──────
CREATE TABLE IF NOT EXISTS public.supplier_escrow_items (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id              uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  supplier_workspace_id     uuid,
  job_id                    uuid,
  invoice_id                uuid REFERENCES public.supplier_invoices(id) ON DELETE SET NULL,
  customer_name             text,
  service                   text,
  -- held | releasable | released | blocked
  status                    text NOT NULL DEFAULT 'held',
  amount_pence              bigint NOT NULL DEFAULT 0,
  currency                  text NOT NULL DEFAULT 'GBP',
  -- why a payout is blocked (e.g. missing evidence) — drives "Blocked payouts"
  blocked_reason            text,
  evidence_required         integer NOT NULL DEFAULT 0,
  evidence_provided         integer NOT NULL DEFAULT 0,
  expected_release_at       date,
  released_at               timestamptz,
  metadata_json             jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by                uuid,
  archived_at               timestamptz,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS supplier_escrow_items_ws_idx        ON public.supplier_escrow_items (workspace_id);
CREATE INDEX IF NOT EXISTS supplier_escrow_items_swid_idx      ON public.supplier_escrow_items (supplier_workspace_id);
CREATE INDEX IF NOT EXISTS supplier_escrow_items_status_idx    ON public.supplier_escrow_items (status);
CREATE INDEX IF NOT EXISTS supplier_escrow_items_created_idx   ON public.supplier_escrow_items (created_at);

-- ── default supplier_workspace_id to workspace_id when omitted ───────────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'supplier_finance_summaries','supplier_invoices','supplier_escrow_items'
  ] LOOP
    EXECUTE format(
      'ALTER TABLE public.%I ALTER COLUMN supplier_workspace_id SET DEFAULT NULL',
      t
    );
  END LOOP;
END $$;

-- ── updated_at triggers ──────────────────────────────────────────────────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'supplier_finance_summaries','supplier_invoices','supplier_escrow_items'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', t || '_touch', t);
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public._supplier_overview_touch_updated_at()',
      t || '_touch', t
    );
  END LOOP;
END $$;

-- ── RLS — workspace-membership policy (exact pattern from the depth migration)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'supplier_finance_summaries','supplier_invoices','supplier_escrow_items'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_member_all', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL USING (public.is_workspace_member(workspace_id)) WITH CHECK (public.is_workspace_member(workspace_id))',
      t || '_member_all', t
    );
  END LOOP;
END $$;
