-- ============================================================
-- 20260622010000_automation_outbound_webhooks_integrations.sql
-- FIX-288: Outbound webhooks table + integrations table enhancements.
--
-- automation_webhooks — OUTBOUND webhook endpoints (Propvora → external).
--   Distinct from automation_webhook_endpoints which are INBOUND receivers.
--   Stores URL, description, secret_token, event_types, enabled, last_triggered_at.
--
-- automation_integrations_v2 — extended integration catalogue connections.
--   Adds provider / config columns matching the API POST schema.
--
-- 100% ADDITIVE and IDEMPOTENT.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- automation_webhooks (OUTBOUND — Propvora → external)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.automation_webhooks (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  url               text NOT NULL,
  description       text,
  secret_token      text,                            -- stored encrypted / hashed; shown once
  event_types       text[] NOT NULL DEFAULT '{}',
  enabled           boolean NOT NULL DEFAULT true,
  last_triggered_at timestamptz,
  created_by        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_webhooks_ws
  ON public.automation_webhooks(workspace_id, enabled);

ALTER TABLE public.automation_webhooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS automation_webhooks_ws ON public.automation_webhooks;
CREATE POLICY automation_webhooks_ws ON public.automation_webhooks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = automation_webhooks.workspace_id
        AND wm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = automation_webhooks.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

-- ────────────────────────────────────────────────────────────
-- automation_webhook_logs — delivery log for outbound webhooks
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.automation_webhook_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  webhook_id   uuid NOT NULL REFERENCES public.automation_webhooks(id) ON DELETE CASCADE,
  event_type   text,
  http_status  integer,
  response_ms  integer,
  delivered_at timestamptz NOT NULL DEFAULT now(),
  error_msg    text,
  payload      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_webhook_logs_wh
  ON public.automation_webhook_logs(webhook_id, delivered_at DESC);

ALTER TABLE public.automation_webhook_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS automation_webhook_logs_ws ON public.automation_webhook_logs;
CREATE POLICY automation_webhook_logs_ws ON public.automation_webhook_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = automation_webhook_logs.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

-- ────────────────────────────────────────────────────────────
-- automation_integrations: add provider / config columns if missing
-- (the 20260617060000 migration created this table with a different shape
--  from 20260617200000 — we add the missing columns idempotently)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.automation_integrations
  ADD COLUMN IF NOT EXISTS provider    text,
  ADD COLUMN IF NOT EXISTS status      text NOT NULL DEFAULT 'disconnected',
  ADD COLUMN IF NOT EXISTS config      jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS secret_ref  text,
  ADD COLUMN IF NOT EXISTS last_used_at timestamptz,
  ADD COLUMN IF NOT EXISTS connected_at timestamptz;
