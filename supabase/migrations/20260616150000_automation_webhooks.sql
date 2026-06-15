-- ============================================================
-- 20260616150000_automation_webhooks.sql
-- AUTOMATION v2 — INBOUND WEBHOOK endpoints + delivery history.
--
-- EXTENDS the Automation v2 model (migration 20260616140000): an external
-- system can trigger an automation by POSTing to a PUBLIC receiver URL that
-- carries an unguessable per-endpoint TOKEN. The receiver authenticates by the
-- token (and an optional HMAC SECRET), records a delivery, and enqueues an
-- automation_v2_run — it NEVER runs destructive actions (the existing
-- review/approval gates still apply downstream).
--
--   * automation_webhook_endpoints  — one inbound endpoint (token + optional
--     hashed secret) optionally bound to a definition.
--   * automation_webhook_deliveries — append-only log of every inbound hit,
--     with the linked run_id and an accepted/rejected/rate_limited/error status.
--
-- Security model:
--   * The URL `token` is the lookup key (unguessable, 256-bit base64url). It is
--     stored in plaintext ONLY so the public route can look an endpoint up by
--     it; it grants nothing on its own beyond "record a delivery + enqueue a
--     review-first run for THIS endpoint's workspace".
--   * `secret_hash` (SHA-256 of a one-time secret) optionally requires the
--     caller to sign the body (HMAC-SHA256) — defence in depth.
--   * RLS is workspace-scoped for the AUTHED management surface. The public
--     receiver uses the service-role admin client (NOT an authed user), and is
--     authorised purely by the token — so endpoints/deliveries are never
--     reachable from the browser except for the owning workspace's members.
--
-- Idempotent + additive: CREATE TABLE IF NOT EXISTS, DROP POLICY IF EXISTS,
-- CREATE INDEX IF NOT EXISTS. Safe to re-run.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- automation_webhook_endpoints
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.automation_webhook_endpoints (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  definition_id     uuid REFERENCES public.automation_definitions(id) ON DELETE SET NULL,
  name              text NOT NULL,
  token             text NOT NULL UNIQUE,             -- unguessable URL segment
  secret_hash       text,                             -- SHA-256 of optional signing secret
  active            boolean NOT NULL DEFAULT true,
  last_triggered_at timestamptz,
  created_by        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- automation_webhook_deliveries
--   Append-only inbound-hit log. run_id links to the enqueued run (if any).
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.automation_webhook_deliveries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id uuid NOT NULL REFERENCES public.automation_webhook_endpoints(id) ON DELETE CASCADE,
  received_at timestamptz NOT NULL DEFAULT now(),
  source_ip   text,
  payload     jsonb NOT NULL DEFAULT '{}'::jsonb,
  run_id      uuid REFERENCES public.automation_v2_runs(id) ON DELETE SET NULL,
  status      text NOT NULL DEFAULT 'accepted',
  CONSTRAINT automation_webhook_deliveries_status_chk CHECK (status IN (
    'accepted','rejected','rate_limited','error'
  ))
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_automation_webhook_endpoints_ws    ON public.automation_webhook_endpoints(workspace_id);
CREATE INDEX IF NOT EXISTS idx_automation_webhook_endpoints_token ON public.automation_webhook_endpoints(token);
CREATE INDEX IF NOT EXISTS idx_automation_webhook_endpoints_def   ON public.automation_webhook_endpoints(definition_id);
CREATE INDEX IF NOT EXISTS idx_automation_webhook_deliveries_ep   ON public.automation_webhook_deliveries(endpoint_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_webhook_deliveries_run  ON public.automation_webhook_deliveries(run_id);

-- ============================================================
-- RLS — workspace-member policy (authed management surface only).
-- Deliveries inherit workspace scope through their parent endpoint.
-- The PUBLIC receiver bypasses RLS via the service-role client and is
-- authorised solely by the token.
-- ============================================================
ALTER TABLE public.automation_webhook_endpoints  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_webhook_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS automation_webhook_endpoints_workspace_member ON public.automation_webhook_endpoints;
CREATE POLICY automation_webhook_endpoints_workspace_member ON public.automation_webhook_endpoints FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = automation_webhook_endpoints.workspace_id AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = automation_webhook_endpoints.workspace_id AND wm.user_id = auth.uid()));

DROP POLICY IF EXISTS automation_webhook_deliveries_workspace_member ON public.automation_webhook_deliveries;
CREATE POLICY automation_webhook_deliveries_workspace_member ON public.automation_webhook_deliveries FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.automation_webhook_endpoints e
    JOIN public.workspace_members wm ON wm.workspace_id = e.workspace_id
    WHERE e.id = automation_webhook_deliveries.endpoint_id AND wm.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.automation_webhook_endpoints e
    JOIN public.workspace_members wm ON wm.workspace_id = e.workspace_id
    WHERE e.id = automation_webhook_deliveries.endpoint_id AND wm.user_id = auth.uid()
  ));
