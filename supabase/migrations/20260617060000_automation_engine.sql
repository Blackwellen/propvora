-- ============================================================
-- 20260617060000_automation_engine.sql
-- AUTOMATION ENGINE — node/canvas workflow model on top of the existing
-- Smart Rules executor + automation_definitions / automation_v2_runs.
--
-- ADDITIVE ONLY. It does NOT replace or alter automation_definitions,
-- automation_v2_runs, automation_run_steps, automation_caps_usage,
-- automation_webhook_endpoints, or the legacy automation_* tables. It adds the
-- node/canvas layer ON TOP:
--
--   * automation_versions      — an immutable compiled version of a definition's
--                                node graph (the thing a run executes against).
--   * automation_nodes         — typed nodes per version (config jsonb + risk).
--   * automation_edges         — directed edges between nodes per version.
--   * automation_approvals     — human approval objects for high-risk node runs
--                                (payment/legal/AI/external). Escalation-aware.
--   * automation_node_runs     — per-NODE execution record within a v2 run
--                                (richer than the per-action run_steps).
--   * automation_run_events    — append-only structured event log per run.
--   * automation_templates     — Smart Recipes (curated node graphs by domain).
--   * automation_integrations  — per-workspace external integration connections.
--   * automation_node_registry — the canonical node catalogue (seeded; the TS
--                                registry mirrors this and is the build-time SoT).
--   * automation_plan_limits   — per-plan governance limits (seeded).
--   * automation_errors        — recorded run/node errors for the Errors surface.
--
-- Idempotent + additive: CREATE TABLE IF NOT EXISTS, ADD COLUMN IF NOT EXISTS,
-- DROP POLICY IF EXISTS. Safe to re-run.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- automation_versions
--   An immutable, compiled version of a definition's node graph. A definition
--   can have many versions; the "active" one is the published graph runs use.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.automation_versions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  definition_id uuid NOT NULL REFERENCES public.automation_definitions(id) ON DELETE CASCADE,
  version       integer NOT NULL DEFAULT 1,
  status        text NOT NULL DEFAULT 'draft',
  -- The compiled run plan (executor-ready) produced by canvas-compile.ts.
  compiled      jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Validation result captured at compile time (errors/warnings).
  validation    jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active     boolean NOT NULL DEFAULT false,
  notes         text,
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT automation_versions_status_chk CHECK (status IN (
    'draft','validated','published','archived','invalid'
  ))
);

-- ────────────────────────────────────────────────────────────
-- automation_nodes
--   A typed node in a version's graph. node_type matches the node registry.
--   config is validated in TS against the node's config schema. risk mirrors the
--   registry so governance can read it without a join.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.automation_nodes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  version_id   uuid NOT NULL REFERENCES public.automation_versions(id) ON DELETE CASCADE,
  -- Stable client-side node id (canvas key) so edges can reference it.
  node_key     text NOT NULL,
  node_type    text NOT NULL,
  category     text NOT NULL DEFAULT 'utility',
  label        text,
  config       jsonb NOT NULL DEFAULT '{}'::jsonb,
  risk         text NOT NULL DEFAULT 'low',
  -- Canvas layout position.
  pos_x        double precision NOT NULL DEFAULT 0,
  pos_y        double precision NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT automation_nodes_risk_chk CHECK (risk IN ('low','medium','high','critical','restricted')),
  CONSTRAINT automation_nodes_version_key_unique UNIQUE (version_id, node_key)
);

-- ────────────────────────────────────────────────────────────
-- automation_edges
--   A directed edge between two nodes in a version. label is the branch label
--   (e.g. 'true'/'false'/'error') so branch/condition routing is explicit.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.automation_edges (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  version_id    uuid NOT NULL REFERENCES public.automation_versions(id) ON DELETE CASCADE,
  source_key    text NOT NULL,
  target_key    text NOT NULL,
  branch_label  text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- automation_approvals
--   A human approval object created when a run reaches a high-risk node
--   (payment/legal/AI/external). The run pauses; a human approves or rejects.
--   Escalation: due_at + escalated_at + escalate_to support SLA escalation.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.automation_approvals (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  run_id        uuid REFERENCES public.automation_v2_runs(id) ON DELETE CASCADE,
  definition_id uuid REFERENCES public.automation_definitions(id) ON DELETE SET NULL,
  node_key      text,
  node_type     text NOT NULL,
  category      text NOT NULL DEFAULT 'approval',
  risk          text NOT NULL DEFAULT 'high',
  title         text NOT NULL,
  summary       text,
  -- The exact action payload that WOULD run on approval (review-faithful).
  payload       jsonb NOT NULL DEFAULT '{}'::jsonb,
  status        text NOT NULL DEFAULT 'pending',
  requested_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  decided_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  decided_at    timestamptz,
  decision_note text,
  due_at        timestamptz,
  escalated_at  timestamptz,
  escalate_to   text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT automation_approvals_status_chk CHECK (status IN (
    'pending','approved','rejected','expired','escalated','cancelled'
  )),
  CONSTRAINT automation_approvals_risk_chk CHECK (risk IN ('low','medium','high','critical','restricted'))
);

-- ────────────────────────────────────────────────────────────
-- automation_node_runs
--   Per-NODE execution record within a v2 run. Richer than run_steps: it tracks
--   the node graph traversal (entered/skipped/blocked/awaiting_approval), the
--   resolved input/output, and timing. Maps to a run_step where one was written.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.automation_node_runs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  run_id       uuid NOT NULL REFERENCES public.automation_v2_runs(id) ON DELETE CASCADE,
  node_key     text NOT NULL,
  node_type    text NOT NULL,
  category     text NOT NULL DEFAULT 'utility',
  seq          integer NOT NULL DEFAULT 0,
  status       text NOT NULL DEFAULT 'pending',
  input        jsonb NOT NULL DEFAULT '{}'::jsonb,
  output       jsonb NOT NULL DEFAULT '{}'::jsonb,
  error        text,
  approval_id  uuid REFERENCES public.automation_approvals(id) ON DELETE SET NULL,
  started_at   timestamptz,
  finished_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT automation_node_runs_status_chk CHECK (status IN (
    'pending','running','succeeded','failed','skipped','blocked','awaiting_approval','simulated'
  ))
);

-- ────────────────────────────────────────────────────────────
-- automation_run_events
--   Append-only structured event log per run (claim, gate, node enter/exit,
--   approval requested, blocked, finished). Powers the run timeline + audit.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.automation_run_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  run_id       uuid NOT NULL REFERENCES public.automation_v2_runs(id) ON DELETE CASCADE,
  level        text NOT NULL DEFAULT 'info',
  event_type   text NOT NULL,
  node_key     text,
  message      text,
  data         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT automation_run_events_level_chk CHECK (level IN ('debug','info','warn','error'))
);

-- ────────────────────────────────────────────────────────────
-- automation_templates
--   Smart Recipes: curated node graphs by domain. Workspace_id NULL = global
--   (platform-curated). Instantiating a template creates a DISABLED draft
--   definition in the workspace.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.automation_templates (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  slug         text NOT NULL,
  name         text NOT NULL,
  description  text,
  domain       text NOT NULL DEFAULT 'general',
  min_plan     text NOT NULL DEFAULT 'Operator',
  graph        jsonb NOT NULL DEFAULT '{}'::jsonb,   -- { nodes: [...], edges: [...] }
  recommended  boolean NOT NULL DEFAULT false,
  active       boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT automation_templates_slug_unique UNIQUE (slug)
);

-- ────────────────────────────────────────────────────────────
-- automation_integrations
--   A per-workspace external integration connection (stripe_connect,
--   channel_manager, slack, webhook_out, …). secret_ref points at a secret
--   store key — we NEVER store raw provider secrets in this row.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.automation_integrations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  provider     text NOT NULL,
  name         text NOT NULL,
  status       text NOT NULL DEFAULT 'disconnected',
  config       jsonb NOT NULL DEFAULT '{}'::jsonb,
  secret_ref   text,
  last_used_at timestamptz,
  created_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT automation_integrations_status_chk CHECK (status IN (
    'disconnected','connected','error','revoked'
  ))
);

-- ────────────────────────────────────────────────────────────
-- automation_node_registry
--   The canonical node catalogue, seeded from the TS registry. The TS registry
--   is the build-time source of truth; this table makes the registry queryable
--   for admin surfaces and lets an admin BAN a node type per plan/role.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.automation_node_registry (
  node_type           text PRIMARY KEY,
  label               text NOT NULL,
  category            text NOT NULL,
  scope               text NOT NULL DEFAULT 'workspace',
  risk                text NOT NULL DEFAULT 'low',
  min_plan            text NOT NULL DEFAULT 'Starter',
  requires_approval   boolean NOT NULL DEFAULT false,
  blocked_from_autorun boolean NOT NULL DEFAULT false,
  enabled             boolean NOT NULL DEFAULT true,
  description         text,
  config_schema       jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- automation_plan_limits
--   Per-plan governance limits (active automations, runs/month, max nodes,
--   webhooks, retention days, canvas/ai/nl access). Seeded; admin-editable.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.automation_plan_limits (
  plan             text PRIMARY KEY,
  max_active       integer NOT NULL DEFAULT 0,
  max_runs_month   integer NOT NULL DEFAULT 0,
  max_nodes        integer NOT NULL DEFAULT 0,
  max_webhooks     integer NOT NULL DEFAULT 0,
  retention_days   integer NOT NULL DEFAULT 7,
  canvas_access    text NOT NULL DEFAULT 'none',
  ai_access        text NOT NULL DEFAULT 'none',
  nl_access        text NOT NULL DEFAULT 'none',
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- automation_errors
--   Recorded run/node errors for the Errors surface. Distinct from run_events:
--   this is a deduped, actionable error record an operator triages/resolves.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.automation_errors (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  definition_id uuid REFERENCES public.automation_definitions(id) ON DELETE SET NULL,
  run_id        uuid REFERENCES public.automation_v2_runs(id) ON DELETE SET NULL,
  node_key      text,
  node_type     text,
  severity      text NOT NULL DEFAULT 'error',
  code          text,
  message       text NOT NULL,
  context       jsonb NOT NULL DEFAULT '{}'::jsonb,
  resolved      boolean NOT NULL DEFAULT false,
  resolved_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT automation_errors_severity_chk CHECK (severity IN ('warning','error','critical'))
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_automation_versions_def     ON public.automation_versions(definition_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_automation_versions_active  ON public.automation_versions(definition_id, is_active);
CREATE INDEX IF NOT EXISTS idx_automation_nodes_version    ON public.automation_nodes(version_id);
CREATE INDEX IF NOT EXISTS idx_automation_edges_version    ON public.automation_edges(version_id);
CREATE INDEX IF NOT EXISTS idx_automation_approvals_ws     ON public.automation_approvals(workspace_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_approvals_run    ON public.automation_approvals(run_id);
CREATE INDEX IF NOT EXISTS idx_automation_node_runs_run    ON public.automation_node_runs(run_id, seq);
CREATE INDEX IF NOT EXISTS idx_automation_run_events_run   ON public.automation_run_events(run_id, created_at);
CREATE INDEX IF NOT EXISTS idx_automation_templates_domain ON public.automation_templates(domain, active);
CREATE INDEX IF NOT EXISTS idx_automation_integrations_ws  ON public.automation_integrations(workspace_id, provider);
CREATE INDEX IF NOT EXISTS idx_automation_errors_ws        ON public.automation_errors(workspace_id, resolved, created_at DESC);

-- ============================================================
-- RLS — workspace-member policy (codebase pattern). Registry/plan-limits/global
-- templates are platform-curated reference data: readable by any authenticated
-- user; writes are service-role only (no policy → only service role bypasses).
-- ============================================================
ALTER TABLE public.automation_versions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_nodes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_edges         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_approvals     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_node_runs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_run_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_templates     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_integrations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_node_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_plan_limits   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_errors        ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS automation_versions_ws ON public.automation_versions;
CREATE POLICY automation_versions_ws ON public.automation_versions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = automation_versions.workspace_id AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = automation_versions.workspace_id AND wm.user_id = auth.uid()));

DROP POLICY IF EXISTS automation_nodes_ws ON public.automation_nodes;
CREATE POLICY automation_nodes_ws ON public.automation_nodes FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = automation_nodes.workspace_id AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = automation_nodes.workspace_id AND wm.user_id = auth.uid()));

DROP POLICY IF EXISTS automation_edges_ws ON public.automation_edges;
CREATE POLICY automation_edges_ws ON public.automation_edges FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = automation_edges.workspace_id AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = automation_edges.workspace_id AND wm.user_id = auth.uid()));

DROP POLICY IF EXISTS automation_approvals_ws ON public.automation_approvals;
CREATE POLICY automation_approvals_ws ON public.automation_approvals FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = automation_approvals.workspace_id AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = automation_approvals.workspace_id AND wm.user_id = auth.uid()));

DROP POLICY IF EXISTS automation_node_runs_ws ON public.automation_node_runs;
CREATE POLICY automation_node_runs_ws ON public.automation_node_runs FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = automation_node_runs.workspace_id AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = automation_node_runs.workspace_id AND wm.user_id = auth.uid()));

DROP POLICY IF EXISTS automation_run_events_ws ON public.automation_run_events;
CREATE POLICY automation_run_events_ws ON public.automation_run_events FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = automation_run_events.workspace_id AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = automation_run_events.workspace_id AND wm.user_id = auth.uid()));

-- Templates: workspace-scoped rows are member-only; global rows (workspace_id
-- NULL) are readable by any authenticated user.
DROP POLICY IF EXISTS automation_templates_read ON public.automation_templates;
CREATE POLICY automation_templates_read ON public.automation_templates FOR SELECT
  USING (
    workspace_id IS NULL
    OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = automation_templates.workspace_id AND wm.user_id = auth.uid())
  );
DROP POLICY IF EXISTS automation_templates_write ON public.automation_templates;
CREATE POLICY automation_templates_write ON public.automation_templates FOR ALL
  USING (workspace_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = automation_templates.workspace_id AND wm.user_id = auth.uid()))
  WITH CHECK (workspace_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = automation_templates.workspace_id AND wm.user_id = auth.uid()));

DROP POLICY IF EXISTS automation_integrations_ws ON public.automation_integrations;
CREATE POLICY automation_integrations_ws ON public.automation_integrations FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = automation_integrations.workspace_id AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = automation_integrations.workspace_id AND wm.user_id = auth.uid()));

-- Reference data: any authenticated user can read; writes are service-role only.
DROP POLICY IF EXISTS automation_node_registry_read ON public.automation_node_registry;
CREATE POLICY automation_node_registry_read ON public.automation_node_registry FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS automation_plan_limits_read ON public.automation_plan_limits;
CREATE POLICY automation_plan_limits_read ON public.automation_plan_limits FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS automation_errors_ws ON public.automation_errors;
CREATE POLICY automation_errors_ws ON public.automation_errors FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = automation_errors.workspace_id AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = automation_errors.workspace_id AND wm.user_id = auth.uid()));

-- ============================================================
-- Seed: per-plan governance limits (mirrors AUTOMATION_PLAN_LIMITS in TS).
-- ============================================================
INSERT INTO public.automation_plan_limits
  (plan, max_active, max_runs_month, max_nodes, max_webhooks, retention_days, canvas_access, ai_access, nl_access)
VALUES
  ('Starter',       3,      250,    5,   0,   7,   'none',     'none',     'trial'),
  ('Operator',     10,     2500,   15,   2,  30,   'basic',    'limited',  'limited'),
  ('Scale',        50,    25000,   50,  10,  90,   'full',     'full',     'full'),
  ('Pro / Agency',200,   250000,  150,  50, 365,   'advanced', 'advanced', 'advanced'),
  ('Enterprise', 100000, 100000000, 100000, 100000, 3650, 'advanced', 'advanced', 'advanced')
ON CONFLICT (plan) DO UPDATE SET
  max_active     = EXCLUDED.max_active,
  max_runs_month = EXCLUDED.max_runs_month,
  max_nodes      = EXCLUDED.max_nodes,
  max_webhooks   = EXCLUDED.max_webhooks,
  retention_days = EXCLUDED.retention_days,
  canvas_access  = EXCLUDED.canvas_access,
  ai_access      = EXCLUDED.ai_access,
  nl_access      = EXCLUDED.nl_access,
  updated_at     = now();

-- ============================================================
-- Seed: node registry (mirrors AUTOMATION_NODE_REGISTRY in TS). The TS file is
-- the build-time source of truth; this seed keeps the DB queryable + admin-
-- editable. Re-runnable via ON CONFLICT.
-- ============================================================
INSERT INTO public.automation_node_registry
  (node_type, label, category, scope, risk, min_plan, requires_approval, blocked_from_autorun, description)
VALUES
  ('record.created','Record Created','trigger','workspace','low','Starter',false,false,'Starts when a workspace record is created.'),
  ('field.changed','Field Changed','trigger','workspace','low','Starter',false,false,'Starts when a watched field changes value.'),
  ('booking.confirmed','Booking Confirmed','trigger','booking','medium','Pro / Agency',false,false,'Starts when a booking becomes confirmed.'),
  ('booking.checkout_due','Checkout Due','trigger','booking','medium','Pro / Agency',false,false,'Starts before checkout based on local calendar rules.'),
  ('supplier.job.completed','Supplier Job Completed','trigger','supplier_job','medium','Pro / Agency',false,false,'Starts when a supplier marks a job complete.'),
  ('marketplace.transaction.created','Marketplace Transaction Created','trigger','marketplace_transaction','medium','Pro / Agency',false,false,'Starts when a marketplace order or transaction is opened.'),
  ('invoice.overdue','Invoice Overdue','trigger','accounting','medium','Operator',false,false,'Starts when an invoice crosses the overdue threshold.'),
  ('compliance.expiring','Compliance Expiring','trigger','compliance','high','Operator',true,false,'Starts before a certificate, licence, or safety item expires.'),
  ('legal.review.required','Legal Review Required','trigger','legal','critical','Scale',true,false,'Starts review-first legal workflows.'),
  ('schedule.custom_cron','Custom Cron','trigger','workspace','medium','Scale',false,false,'Runs on a configured cron schedule with caps.'),
  ('webhook.incoming','Incoming Webhook','webhook','workspace','medium','Scale',false,false,'Accepts signed inbound events from an external system.'),
  ('condition.if_else','If / Else','condition','workspace','low','Starter',false,false,'Routes records based on a true or false expression.'),
  ('condition.plan_allows','If Plan Allows','condition','workspace','low','Starter',false,false,'Stops workflows that exceed the workspace plan.'),
  ('condition.payment_release_allowed','If Payment Release Allowed','condition','payment','critical','Scale',true,false,'Checks disputes, provider state, role gate, and approval state.'),
  ('branch.match_country','Match Country','branch','compliance','medium','Operator',false,false,'Routes work by country profile and local rule set.'),
  ('delay.business_hours','Delay For Business Hours','delay','workspace','low','Operator',false,false,'Waits until the next allowed local business window.'),
  ('lookup.preferred_suppliers','Get Preferred Suppliers','lookup','supplier_job','medium','Pro / Agency',false,false,'Finds workspace-scoped verified suppliers for a job category.'),
  ('lookup.marketplace_transaction','Get Marketplace Transaction','lookup','marketplace_transaction','medium','Pro / Agency',false,false,'Loads transaction context with RLS and redaction.'),
  ('ai.risk_score','AI Risk Score','ai','workspace','high','Scale',true,false,'Scores operational risk without taking destructive action.'),
  ('ai.draft_message','AI Draft Message','ai','customer','medium','Scale',true,false,'Creates a draft message for review.'),
  ('action.create_task','Create Task','action','workspace','low','Starter',false,false,'Creates a workspace task or reminder.'),
  ('action.create_cleaning_task','Create Cleaning Task','action','booking','low','Pro / Agency',false,false,'Creates a checkout cleaning task for a booking.'),
  ('action.request_supplier_evidence','Request Supplier Evidence','action','supplier_job','medium','Pro / Agency',false,false,'Asks a supplier to upload required evidence.'),
  ('comm.internal_notification','Send Internal Notification','communication','workspace','low','Starter',false,false,'Sends an in-app notification to a role or owner.'),
  ('comm.external_message_draft','Create External Message Draft','communication','customer','medium','Operator',true,false,'Creates a customer, guest, tenant, or supplier message draft.'),
  ('payment.release_payout_after_approval','Release Payout After Approval','payment','payment','critical','Scale',true,true,'Releases payout only after approval and provider checks.'),
  ('payment.issue_refund_after_approval','Issue Refund After Approval','payment','payment','critical','Scale',true,true,'Issues a refund only after human approval.'),
  ('approval.request_human','Request Human Approval','approval','workspace','medium','Operator',false,false,'Creates an approval item and waits for a decision.'),
  ('approval.request_legal_review','Request Legal Review','approval','legal','critical','Scale',true,false,'Routes legal content to a reviewer.'),
  ('legal.create_draft','Create Legal Draft','legal','legal','critical','Scale',true,false,'Creates a legal draft without sending or serving it.'),
  ('legal.auto_serve_notice','Auto-Serve Notice','legal','legal','restricted','Enterprise',true,true,'Registered as blocked so it cannot be silently automated.'),
  ('integration.stripe_connect','Stripe Connect','integration','payment','high','Scale',true,false,'Uses Stripe Connect under approval, provider, and audit gates.'),
  ('integration.channel_manager_webhook','Channel Manager Webhook','integration','booking','medium','Pro / Agency',false,false,'Receives booking channel events through signed webhooks.'),
  ('utility.redact_sensitive_data','Redact Sensitive Data','utility','workspace','low','Starter',false,false,'Removes sensitive fields before logs or external calls.'),
  ('error.retry_with_backoff','Retry With Backoff','error','workspace','low','Operator',false,false,'Retries failed nodes before stopping or falling back.'),
  ('error.pause_after_threshold','Pause After Threshold','error','workspace','medium','Operator',false,false,'Pauses repeated failures and notifies the owner.'),
  ('end.waiting_approval','End Waiting Approval','end','workspace','low','Starter',false,false,'Ends a run while an approval is pending.'),
  ('end.success','End Success','end','workspace','low','Starter',false,false,'Marks the run complete.')
ON CONFLICT (node_type) DO UPDATE SET
  label                = EXCLUDED.label,
  category             = EXCLUDED.category,
  scope                = EXCLUDED.scope,
  risk                 = EXCLUDED.risk,
  min_plan             = EXCLUDED.min_plan,
  requires_approval    = EXCLUDED.requires_approval,
  blocked_from_autorun = EXCLUDED.blocked_from_autorun,
  description          = EXCLUDED.description,
  updated_at           = now();
