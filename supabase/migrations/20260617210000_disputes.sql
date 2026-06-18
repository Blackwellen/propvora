-- ============================================================
-- 20260617210000_disputes.sql
-- BOOKINGS DISPUTES — additive, workspace-scoped tables backing the
-- Property-Manager Disputes tab and the 5-stage dispute workflow
-- (Intake -> Evidence -> Review -> Resolution -> Finalisation).
--
-- 100% ADDITIVE and IDEMPOTENT. Every statement uses
-- CREATE TABLE IF NOT EXISTS / CREATE INDEX IF NOT EXISTS /
-- DROP POLICY IF EXISTS so it is safe to re-run and never clobbers
-- existing tables.
--
-- The UI reads these via seed-fallback hooks: if a table is missing or a
-- query fails (42P01 / RLS), the page renders premium seed data instead.
--
-- RLS model: workspace-membership via public.workspace_members(
-- workspace_id, user_id) — the SAME pattern as
-- 20260617200000_automations_section.sql.
-- ============================================================

-- ──────────────────────────── Core dispute ────────────────────────────
CREATE TABLE IF NOT EXISTS public.booking_disputes (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid NOT NULL,
  booking_id            uuid,
  reference             text,
  order_reference       text,
  stage                 text NOT NULL DEFAULT 'intake',
  status                text NOT NULL DEFAULT 'open',
  priority              text NOT NULL DEFAULT 'medium',
  reason                text,
  claimant_side         text,
  guest_name            text,
  guest_email           text,
  supplier_name         text,
  property_name         text,
  property_location     text,
  issue_summary         text,
  description           text,
  currency              text NOT NULL DEFAULT 'GBP',
  amount_disputed_pence bigint NOT NULL DEFAULT 0,
  escrow_held_pence     bigint NOT NULL DEFAULT 0,
  requested_refund_pence bigint NOT NULL DEFAULT 0,
  total_released_pence  bigint,
  recommended_outcome   text,
  policy_reference      text,
  sla_due               timestamptz,
  opened_at             timestamptz NOT NULL DEFAULT now(),
  resolved_at           timestamptz,
  created_by            uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  archived_at           timestamptz,
  metadata_json         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- ──────────────────────────── Stages ────────────────────────────
CREATE TABLE IF NOT EXISTS public.dispute_stages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL,
  dispute_id    uuid,
  booking_id    uuid,
  stage_key     text NOT NULL,
  status        text NOT NULL DEFAULT 'pending',
  entered_at    timestamptz,
  completed_at  timestamptz,
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  archived_at   timestamptz,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dispute_stage_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL,
  dispute_id    uuid,
  booking_id    uuid,
  stage_key     text,
  event_type    text NOT NULL,
  actor         text,
  detail        text,
  status        text NOT NULL DEFAULT 'recorded',
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  archived_at   timestamptz,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ──────────────────────────── Evidence ────────────────────────────
CREATE TABLE IF NOT EXISTS public.dispute_evidence (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL,
  dispute_id    uuid,
  booking_id    uuid,
  side          text NOT NULL DEFAULT 'host',
  kind          text NOT NULL DEFAULT 'note',
  title         text,
  description   text,
  submitted_by  text,
  submitted_at  timestamptz NOT NULL DEFAULT now(),
  status        text NOT NULL DEFAULT 'submitted',
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  archived_at   timestamptz,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dispute_evidence_files (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL,
  dispute_id    uuid,
  evidence_id   uuid,
  booking_id    uuid,
  file_name     text,
  file_path     text,
  mime_type     text,
  file_size_kb  integer,
  status        text NOT NULL DEFAULT 'stored',
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  archived_at   timestamptz,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ──────────────────────────── Messages ────────────────────────────
CREATE TABLE IF NOT EXISTS public.dispute_messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL,
  dispute_id    uuid,
  booking_id    uuid,
  author        text,
  author_role   text NOT NULL DEFAULT 'system',
  body          text,
  status        text NOT NULL DEFAULT 'sent',
  sent_at       timestamptz NOT NULL DEFAULT now(),
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  archived_at   timestamptz,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ──────────────────────────── Resolution proposals ────────────────────────────
CREATE TABLE IF NOT EXISTS public.dispute_resolution_proposals (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id             uuid NOT NULL,
  dispute_id               uuid,
  booking_id               uuid,
  outcome                  text NOT NULL DEFAULT 'pending',
  refund_pence             bigint NOT NULL DEFAULT 0,
  payout_to_host_pence     bigint NOT NULL DEFAULT 0,
  platform_fee_pence       bigint NOT NULL DEFAULT 0,
  rationale                text,
  sla_due                  timestamptz,
  accepted_by_host         boolean NOT NULL DEFAULT false,
  accepted_by_counterparty boolean NOT NULL DEFAULT false,
  manager_approved         boolean NOT NULL DEFAULT false,
  status                   text NOT NULL DEFAULT 'draft',
  created_by               uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  archived_at              timestamptz,
  metadata_json            jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

-- ──────────────────────────── Payout allocations ────────────────────────────
CREATE TABLE IF NOT EXISTS public.dispute_payout_allocations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL,
  dispute_id    uuid,
  proposal_id   uuid,
  booking_id    uuid,
  label         text,
  payee         text NOT NULL DEFAULT 'host',
  amount_pence  bigint NOT NULL DEFAULT 0,
  release_date  date,
  status        text NOT NULL DEFAULT 'pending',
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  archived_at   timestamptz,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ──────────────────────────── Policy references ────────────────────────────
CREATE TABLE IF NOT EXISTS public.dispute_policy_references (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL,
  dispute_id    uuid,
  booking_id    uuid,
  code          text,
  title         text,
  url           text,
  note          text,
  status        text NOT NULL DEFAULT 'active',
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  archived_at   timestamptz,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ──────────────────────────── Audit events ────────────────────────────
CREATE TABLE IF NOT EXISTS public.dispute_audit_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL,
  dispute_id    uuid,
  booking_id    uuid,
  actor         text,
  action        text NOT NULL,
  target        text,
  status        text NOT NULL DEFAULT 'recorded',
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  archived_at   timestamptz,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ──────────────────────────── Indexes ────────────────────────────
-- workspace_id / booking_id / dispute_id / status / created_at across tables.
CREATE INDEX IF NOT EXISTS idx_bk_disputes_ws         ON public.booking_disputes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_bk_disputes_booking    ON public.booking_disputes(booking_id);
CREATE INDEX IF NOT EXISTS idx_bk_disputes_status     ON public.booking_disputes(status);
CREATE INDEX IF NOT EXISTS idx_bk_disputes_created    ON public.booking_disputes(created_at);

CREATE INDEX IF NOT EXISTS idx_disp_stages_ws         ON public.dispute_stages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_disp_stages_dispute    ON public.dispute_stages(dispute_id);
CREATE INDEX IF NOT EXISTS idx_disp_stages_booking    ON public.dispute_stages(booking_id);
CREATE INDEX IF NOT EXISTS idx_disp_stages_status     ON public.dispute_stages(status);
CREATE INDEX IF NOT EXISTS idx_disp_stages_created    ON public.dispute_stages(created_at);

CREATE INDEX IF NOT EXISTS idx_disp_stage_ev_ws       ON public.dispute_stage_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_disp_stage_ev_dispute  ON public.dispute_stage_events(dispute_id);
CREATE INDEX IF NOT EXISTS idx_disp_stage_ev_booking  ON public.dispute_stage_events(booking_id);
CREATE INDEX IF NOT EXISTS idx_disp_stage_ev_status   ON public.dispute_stage_events(status);
CREATE INDEX IF NOT EXISTS idx_disp_stage_ev_created  ON public.dispute_stage_events(created_at);

CREATE INDEX IF NOT EXISTS idx_disp_evidence_ws       ON public.dispute_evidence(workspace_id);
CREATE INDEX IF NOT EXISTS idx_disp_evidence_dispute  ON public.dispute_evidence(dispute_id);
CREATE INDEX IF NOT EXISTS idx_disp_evidence_booking  ON public.dispute_evidence(booking_id);
CREATE INDEX IF NOT EXISTS idx_disp_evidence_status   ON public.dispute_evidence(status);
CREATE INDEX IF NOT EXISTS idx_disp_evidence_created  ON public.dispute_evidence(created_at);

CREATE INDEX IF NOT EXISTS idx_disp_ev_files_ws       ON public.dispute_evidence_files(workspace_id);
CREATE INDEX IF NOT EXISTS idx_disp_ev_files_dispute  ON public.dispute_evidence_files(dispute_id);
CREATE INDEX IF NOT EXISTS idx_disp_ev_files_booking  ON public.dispute_evidence_files(booking_id);
CREATE INDEX IF NOT EXISTS idx_disp_ev_files_status   ON public.dispute_evidence_files(status);
CREATE INDEX IF NOT EXISTS idx_disp_ev_files_created  ON public.dispute_evidence_files(created_at);

CREATE INDEX IF NOT EXISTS idx_disp_messages_ws       ON public.dispute_messages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_disp_messages_dispute  ON public.dispute_messages(dispute_id);
CREATE INDEX IF NOT EXISTS idx_disp_messages_booking  ON public.dispute_messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_disp_messages_status   ON public.dispute_messages(status);
CREATE INDEX IF NOT EXISTS idx_disp_messages_created  ON public.dispute_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_disp_proposals_ws      ON public.dispute_resolution_proposals(workspace_id);
CREATE INDEX IF NOT EXISTS idx_disp_proposals_dispute ON public.dispute_resolution_proposals(dispute_id);
CREATE INDEX IF NOT EXISTS idx_disp_proposals_booking ON public.dispute_resolution_proposals(booking_id);
CREATE INDEX IF NOT EXISTS idx_disp_proposals_status  ON public.dispute_resolution_proposals(status);
CREATE INDEX IF NOT EXISTS idx_disp_proposals_created ON public.dispute_resolution_proposals(created_at);

CREATE INDEX IF NOT EXISTS idx_disp_alloc_ws          ON public.dispute_payout_allocations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_disp_alloc_dispute     ON public.dispute_payout_allocations(dispute_id);
CREATE INDEX IF NOT EXISTS idx_disp_alloc_booking     ON public.dispute_payout_allocations(booking_id);
CREATE INDEX IF NOT EXISTS idx_disp_alloc_status      ON public.dispute_payout_allocations(status);
CREATE INDEX IF NOT EXISTS idx_disp_alloc_created     ON public.dispute_payout_allocations(created_at);

CREATE INDEX IF NOT EXISTS idx_disp_policy_ws         ON public.dispute_policy_references(workspace_id);
CREATE INDEX IF NOT EXISTS idx_disp_policy_dispute    ON public.dispute_policy_references(dispute_id);
CREATE INDEX IF NOT EXISTS idx_disp_policy_booking    ON public.dispute_policy_references(booking_id);
CREATE INDEX IF NOT EXISTS idx_disp_policy_status     ON public.dispute_policy_references(status);
CREATE INDEX IF NOT EXISTS idx_disp_policy_created    ON public.dispute_policy_references(created_at);

CREATE INDEX IF NOT EXISTS idx_disp_audit_ws          ON public.dispute_audit_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_disp_audit_dispute     ON public.dispute_audit_events(dispute_id);
CREATE INDEX IF NOT EXISTS idx_disp_audit_booking     ON public.dispute_audit_events(booking_id);
CREATE INDEX IF NOT EXISTS idx_disp_audit_status      ON public.dispute_audit_events(status);
CREATE INDEX IF NOT EXISTS idx_disp_audit_created     ON public.dispute_audit_events(created_at);

-- ──────────────────────────── RLS + workspace-membership policies ────────────────────────────
-- Mirrors the existing automations_section RLS pattern exactly:
-- membership via public.workspace_members(workspace_id, user_id).
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'booking_disputes',
    'dispute_stages',
    'dispute_stage_events',
    'dispute_evidence',
    'dispute_evidence_files',
    'dispute_messages',
    'dispute_resolution_proposals',
    'dispute_payout_allocations',
    'dispute_policy_references',
    'dispute_audit_events'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS %I_ws_member ON public.%I;', t, t);
    EXECUTE format($p$
      CREATE POLICY %I_ws_member ON public.%I FOR ALL
      USING (EXISTS (
        SELECT 1 FROM public.workspace_members wm
        WHERE wm.workspace_id = %I.workspace_id AND wm.user_id = auth.uid()
      ))
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.workspace_members wm
        WHERE wm.workspace_id = %I.workspace_id AND wm.user_id = auth.uid()
      ));
    $p$, t, t, t, t);
  END LOOP;
END $$;
