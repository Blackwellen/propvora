-- ════════════════════════════════════════════════════════════════════════════
-- Supplier Jobs — field-work execution depth for the Solo supplier workspace.
--
-- Backs the Jobs section (Active / Scheduled / Awaiting Evidence / Completed /
-- Cancelled). The supplier executes accepted work on-site: tracking progress,
-- materials, evidence uploads, customer messages, sign-offs and cancellations.
--
-- ── REUSE DECISION (inspected first) ───────────────────────────────────────────
-- Existing supplier job tables are LEFT UNTOUCHED and reused:
--   • public.supplier_job_assignments   (20260616070000_supplier_quotes_jobs.sql)
--       — the unit-of-work row: operator_workspace_id + supplier_workspace_id,
--         status state machine (assigned→accepted→in_progress→completed/cancelled),
--         scheduled_for, completed_at, links to a marketplace quote + jobs row.
--   • public.supplier_job_evidence      (pre-existing; referenced by the depth
--       migration header) — evidence files for a job.
-- We do NOT redefine either. The five tables below are the genuinely MISSING
-- companions the Jobs UI needs and are ADDITIVE + IDEMPOTENT (IF NOT EXISTS).
--
-- Each new table carries the standard column set:
--   id, workspace_id, supplier_workspace_id, status, created_at, updated_at,
--   created_by, archived_at, metadata_json   (+ a job_id FK to the assignment).
-- `workspace_id` is kept (= the supplier workspace) so the simple membership RLS
-- and the workspace-scoped indexes match the rest of the supplier_* surface;
-- `supplier_workspace_id` is also stored for parity with the assignment table.
--
-- ── RLS ────────────────────────────────────────────────────────────────────────
-- Access via the REAL membership table public.workspace_members(workspace_id,
-- user_id) — the exact pattern used across the platform. A row is visible/
-- writable to any member of its workspace_id. Service role bypasses RLS.
--
-- ── STORAGE ────────────────────────────────────────────────────────────────────
-- Evidence uploads are UPLOAD-ONLY from the supplier UI. Storage path convention:
--   workspaces/{workspaceId}/jobs/{jobId}/evidence/<filename>
-- ════════════════════════════════════════════════════════════════════════════

-- ── shared touch-updated_at helper (no-op redefine; safe) ───────────────────────
CREATE OR REPLACE FUNCTION public._supplier_jobs_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

-- ── 1. supplier_job_materials — parts & materials per job ───────────────────────
CREATE TABLE IF NOT EXISTS public.supplier_job_materials (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id           uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  supplier_workspace_id  uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  job_id                 uuid REFERENCES public.supplier_job_assignments(id) ON DELETE CASCADE,
  name                   text,
  quantity               numeric,
  unit                   text,
  unit_cost_pence        bigint,
  status                 text NOT NULL DEFAULT 'pending',  -- pending | ordered | ready | used
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  created_by             uuid,
  archived_at            timestamptz,
  metadata_json          jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS supplier_job_materials_ws_idx ON public.supplier_job_materials (workspace_id);
CREATE INDEX IF NOT EXISTS supplier_job_materials_sws_idx ON public.supplier_job_materials (supplier_workspace_id);
CREATE INDEX IF NOT EXISTS supplier_job_materials_status_idx ON public.supplier_job_materials (status);
CREATE INDEX IF NOT EXISTS supplier_job_materials_job_idx ON public.supplier_job_materials (job_id);
CREATE INDEX IF NOT EXISTS supplier_job_materials_created_idx ON public.supplier_job_materials (created_at);

-- ── 2. supplier_job_notes — on-site notes / completion notes ────────────────────
CREATE TABLE IF NOT EXISTS public.supplier_job_notes (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id           uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  supplier_workspace_id  uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  job_id                 uuid REFERENCES public.supplier_job_assignments(id) ON DELETE CASCADE,
  body                   text,
  kind                   text NOT NULL DEFAULT 'note',     -- note | completion | followup
  status                 text NOT NULL DEFAULT 'active',
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  created_by             uuid,
  archived_at            timestamptz,
  metadata_json          jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS supplier_job_notes_ws_idx ON public.supplier_job_notes (workspace_id);
CREATE INDEX IF NOT EXISTS supplier_job_notes_sws_idx ON public.supplier_job_notes (supplier_workspace_id);
CREATE INDEX IF NOT EXISTS supplier_job_notes_status_idx ON public.supplier_job_notes (status);
CREATE INDEX IF NOT EXISTS supplier_job_notes_job_idx ON public.supplier_job_notes (job_id);
CREATE INDEX IF NOT EXISTS supplier_job_notes_created_idx ON public.supplier_job_notes (created_at);

-- ── 3. supplier_job_messages — customer ↔ supplier thread per job ────────────────
CREATE TABLE IF NOT EXISTS public.supplier_job_messages (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id           uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  supplier_workspace_id  uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  job_id                 uuid REFERENCES public.supplier_job_assignments(id) ON DELETE CASCADE,
  body                   text,
  direction              text NOT NULL DEFAULT 'outbound', -- inbound | outbound
  author_name            text,
  status                 text NOT NULL DEFAULT 'sent',     -- sent | delivered | read
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  created_by             uuid,
  archived_at            timestamptz,
  metadata_json          jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS supplier_job_messages_ws_idx ON public.supplier_job_messages (workspace_id);
CREATE INDEX IF NOT EXISTS supplier_job_messages_sws_idx ON public.supplier_job_messages (supplier_workspace_id);
CREATE INDEX IF NOT EXISTS supplier_job_messages_status_idx ON public.supplier_job_messages (status);
CREATE INDEX IF NOT EXISTS supplier_job_messages_job_idx ON public.supplier_job_messages (job_id);
CREATE INDEX IF NOT EXISTS supplier_job_messages_created_idx ON public.supplier_job_messages (created_at);

-- ── 4. supplier_job_signoffs — customer sign-off / approval per job ──────────────
CREATE TABLE IF NOT EXISTS public.supplier_job_signoffs (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id           uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  supplier_workspace_id  uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  job_id                 uuid REFERENCES public.supplier_job_assignments(id) ON DELETE CASCADE,
  status                 text NOT NULL DEFAULT 'requested', -- requested | signed | declined
  signed_by_name         text,
  signed_at              timestamptz,
  rating                 smallint,
  review_text            text,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  created_by             uuid,
  archived_at            timestamptz,
  metadata_json          jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS supplier_job_signoffs_ws_idx ON public.supplier_job_signoffs (workspace_id);
CREATE INDEX IF NOT EXISTS supplier_job_signoffs_sws_idx ON public.supplier_job_signoffs (supplier_workspace_id);
CREATE INDEX IF NOT EXISTS supplier_job_signoffs_status_idx ON public.supplier_job_signoffs (status);
CREATE INDEX IF NOT EXISTS supplier_job_signoffs_job_idx ON public.supplier_job_signoffs (job_id);
CREATE INDEX IF NOT EXISTS supplier_job_signoffs_created_idx ON public.supplier_job_signoffs (created_at);

-- ── 5. supplier_job_cancellations — cancellation record + audit per job ──────────
CREATE TABLE IF NOT EXISTS public.supplier_job_cancellations (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id           uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  supplier_workspace_id  uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  job_id                 uuid REFERENCES public.supplier_job_assignments(id) ON DELETE CASCADE,
  status                 text NOT NULL DEFAULT 'cancelled',
  cancelled_by           text,                              -- customer | supplier | platform
  reason                 text,
  fee_pence              bigint,                            -- 0 / null = waived
  fee_policy             text,
  lost_earnings_pence    bigint,
  score_impact           numeric,                           -- e.g. -2 points
  dispute_risk           text,                              -- low | medium | high
  reschedule_eligible_until date,
  cancelled_at           timestamptz NOT NULL DEFAULT now(),
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  created_by             uuid,
  archived_at            timestamptz,
  metadata_json          jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS supplier_job_cancellations_ws_idx ON public.supplier_job_cancellations (workspace_id);
CREATE INDEX IF NOT EXISTS supplier_job_cancellations_sws_idx ON public.supplier_job_cancellations (supplier_workspace_id);
CREATE INDEX IF NOT EXISTS supplier_job_cancellations_status_idx ON public.supplier_job_cancellations (status);
CREATE INDEX IF NOT EXISTS supplier_job_cancellations_job_idx ON public.supplier_job_cancellations (job_id);
CREATE INDEX IF NOT EXISTS supplier_job_cancellations_created_idx ON public.supplier_job_cancellations (created_at);

-- ── updated_at triggers ──────────────────────────────────────────────────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'supplier_job_materials','supplier_job_notes','supplier_job_messages',
    'supplier_job_signoffs','supplier_job_cancellations'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', t || '_touch', t);
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public._supplier_jobs_touch_updated_at()',
      t || '_touch', t
    );
  END LOOP;
END $$;

-- ── RLS — REAL workspace_members(workspace_id, user_id) membership pattern ────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'supplier_job_materials','supplier_job_notes','supplier_job_messages',
    'supplier_job_signoffs','supplier_job_cancellations'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_member_select', t);
    EXECUTE format($f$
      CREATE POLICY %I ON public.%I FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.workspace_members wm
          WHERE wm.workspace_id = %I.workspace_id AND wm.user_id = auth.uid()
        )
      )$f$, t || '_member_select', t, t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_member_insert', t);
    EXECUTE format($f$
      CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.workspace_members wm
          WHERE wm.workspace_id = %I.workspace_id AND wm.user_id = auth.uid()
        )
      )$f$, t || '_member_insert', t, t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_member_update', t);
    EXECUTE format($f$
      CREATE POLICY %I ON public.%I FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM public.workspace_members wm
          WHERE wm.workspace_id = %I.workspace_id AND wm.user_id = auth.uid()
        )
      ) WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.workspace_members wm
          WHERE wm.workspace_id = %I.workspace_id AND wm.user_id = auth.uid()
        )
      )$f$, t || '_member_update', t, t, t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_member_delete', t);
    EXECUTE format($f$
      CREATE POLICY %I ON public.%I FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM public.workspace_members wm
          WHERE wm.workspace_id = %I.workspace_id AND wm.user_id = auth.uid()
        )
      )$f$, t || '_member_delete', t, t);
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- END supplier jobs depth
-- ════════════════════════════════════════════════════════════════════════════
