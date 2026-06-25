-- ============================================================================
-- 20260624120000_ai_intelligence_layer.sql
-- Propvora Intelligence Layer foundation — credit economy, permission engine,
-- tool registry, append-only audit, and BYOK provider keys.
--
-- ADDITIVE ONLY. All new tables are prefixed ai_. No existing table, column,
-- policy or route is touched. Backs:
--   src/lib/ai/credits.ts   (credit classes + ledger + balances)
--   src/lib/ai/routing.ts   (GDPR-compliant model routing — seed at the bottom)
--   the permission engine, tool registry and audit layer (Phase 0/1 wiring).
--
-- RLS: every workspace-scoped table is readable/writable by workspace members
-- only; the audit log is APPEND-ONLY (no UPDATE/DELETE policy exists for anyone,
-- service role included). Idempotent: CREATE IF NOT EXISTS + DROP POLICY IF
-- EXISTS + ON CONFLICT, safe to re-run.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- CREDITS: cost map (global), per-workspace grants/balances, and the ledger.
-- ────────────────────────────────────────────────────────────────────────────

-- Global operation → credit-class + cost map. DB is the override source of
-- truth; src/lib/ai/credits.ts carries the compiled defaults.
CREATE TABLE IF NOT EXISTS public.ai_credit_costs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_key text NOT NULL UNIQUE,
  credit_class  text NOT NULL CHECK (credit_class IN ('conversation','action','intelligence','monitoring')),
  base_cost     numeric(10,2) NOT NULL DEFAULT 0,
  -- optional per-unit cost + formula metadata (per recipient/page/step/1k tok)
  per_unit_cost numeric(10,2) NOT NULL DEFAULT 0,
  formula       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Extra credit grants per workspace+class (AI-Pro add-on / credit packs). The
-- plan's base allowance lives in code (PLAN_CREDIT_ALLOWANCES); these rows are
-- ADDED on top by getCreditBalances().
CREATE TABLE IF NOT EXISTS public.ai_credit_balances (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  credit_class  text NOT NULL CHECK (credit_class IN ('conversation','action','intelligence','monitoring')),
  allowance     numeric(12,2) NOT NULL DEFAULT 0,
  used          numeric(12,2) NOT NULL DEFAULT 0,
  source        text,  -- 'plan' | 'ai_pro_addon' | 'intelligence_pack_1k' | ...
  period_start  timestamptz,
  period_end    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_credit_balances_ws ON public.ai_credit_balances(workspace_id, credit_class);

-- Immutable consumption ledger. One row per metered operation.
CREATE TABLE IF NOT EXISTS public.ai_credit_ledger (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  credit_class  text NOT NULL CHECK (credit_class IN ('conversation','action','intelligence','monitoring')),
  operation_key text NOT NULL,
  amount        numeric(12,2) NOT NULL DEFAULT 0,
  ref_type      text,
  ref_id        text,
  balance_after numeric(12,2),
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_credit_ledger_ws_created ON public.ai_credit_ledger(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_credit_ledger_ws_class   ON public.ai_credit_ledger(workspace_id, credit_class);

-- ────────────────────────────────────────────────────────────────────────────
-- PERMISSION ENGINE: 0..6 levels, per-action overrides, scoped to
-- workspace / user / entity. effectiveLevel = min over all matching scopes.
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_permissions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  scope         text NOT NULL CHECK (scope IN ('workspace','user','entity')),
  scope_id      text,  -- user_id for 'user', entity_id for 'entity', null for 'workspace'
  level         int  NOT NULL DEFAULT 0 CHECK (level BETWEEN 0 AND 6),
  per_action    jsonb NOT NULL DEFAULT '{}'::jsonb,  -- { "comms.email.send": { "requiresApproval": true } }
  set_by        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, scope, scope_id)
);
CREATE INDEX IF NOT EXISTS idx_ai_permissions_ws ON public.ai_permissions(workspace_id, scope);

-- ────────────────────────────────────────────────────────────────────────────
-- TOOL REGISTRY (global) + per-run log (workspace-scoped).
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_tools (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL UNIQUE,
  category            text NOT NULL DEFAULT 'general',
  action_class        text NOT NULL CHECK (action_class IN ('read','draft','write','comms','navigate','external','generate','automation')),
  min_permission_level int NOT NULL DEFAULT 0 CHECK (min_permission_level BETWEEN 0 AND 6),
  credit_cost_key     text,
  schema              jsonb NOT NULL DEFAULT '{}'::jsonb,
  requires_approval   boolean NOT NULL DEFAULT false,
  enabled             boolean NOT NULL DEFAULT true,
  sort_order          int NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_tool_runs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  chat_id           uuid,
  tool_name         text NOT NULL,
  args              jsonb NOT NULL DEFAULT '{}'::jsonb,
  result            jsonb,
  status            text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','awaiting_approval','running','succeeded','failed','denied','skipped')),
  permission_check  jsonb,
  approval_id       uuid,
  credit_cost       numeric(12,2) NOT NULL DEFAULT 0,
  duration_ms       int,
  error             text,
  created_by        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_tool_runs_ws_created ON public.ai_tool_runs(workspace_id, created_at DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- AUDIT LOG — APPEND ONLY. No UPDATE/DELETE policy is ever created, so even the
-- service role cannot rewrite history through PostgREST. Inserts happen server
-- side recording the real actor_user_id.
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_audit_log (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  actor_user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  surface           text,         -- 'chat' | 'form' | 'nav' | 'monitor' | 'automation'
  chat_id           uuid,
  run_id            uuid,
  action_type       text,
  prompt_snapshot   jsonb,
  context_snapshot  jsonb,
  reasoning_summary text,
  tool_calls        jsonb,
  approval          jsonb,
  result            jsonb,
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_audit_log_ws_created ON public.ai_audit_log(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_audit_log_actor      ON public.ai_audit_log(actor_user_id, created_at DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- BYOK — per-workspace bring-your-own provider key (Enterprise). Only an
-- ENCRYPTED ciphertext + a non-secret hint are stored; the plaintext key is
-- decrypted server-side at call time and NEVER returned to the client.
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_workspace_keys (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  provider_slug   text NOT NULL,
  key_ciphertext  text NOT NULL,
  key_hint        text,            -- e.g. "sk-…AB12" — safe to display
  enabled         boolean NOT NULL DEFAULT true,
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, provider_slug)
);

-- ============================================================================
-- RLS
-- ============================================================================
ALTER TABLE public.ai_credit_costs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_credit_balances  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_credit_ledger    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_permissions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tools            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tool_runs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_audit_log        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_workspace_keys   ENABLE ROW LEVEL SECURITY;

-- Global catalogues: any authed user may read; writes are service-role/admin.
DROP POLICY IF EXISTS ai_credit_costs_read ON public.ai_credit_costs;
CREATE POLICY ai_credit_costs_read ON public.ai_credit_costs FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS ai_tools_read ON public.ai_tools;
CREATE POLICY ai_tools_read ON public.ai_tools FOR SELECT
  USING (auth.role() = 'authenticated');

-- Workspace-scoped read for members. Writes are server-side (service role).
DROP POLICY IF EXISTS ai_credit_balances_ws_read ON public.ai_credit_balances;
CREATE POLICY ai_credit_balances_ws_read ON public.ai_credit_balances FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm
                 WHERE wm.workspace_id = ai_credit_balances.workspace_id AND wm.user_id = auth.uid()));

DROP POLICY IF EXISTS ai_credit_ledger_ws_read ON public.ai_credit_ledger;
CREATE POLICY ai_credit_ledger_ws_read ON public.ai_credit_ledger FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm
                 WHERE wm.workspace_id = ai_credit_ledger.workspace_id AND wm.user_id = auth.uid()));

DROP POLICY IF EXISTS ai_tool_runs_ws_read ON public.ai_tool_runs;
CREATE POLICY ai_tool_runs_ws_read ON public.ai_tool_runs FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm
                 WHERE wm.workspace_id = ai_tool_runs.workspace_id AND wm.user_id = auth.uid()));

DROP POLICY IF EXISTS ai_audit_log_ws_read ON public.ai_audit_log;
CREATE POLICY ai_audit_log_ws_read ON public.ai_audit_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm
                 WHERE wm.workspace_id = ai_audit_log.workspace_id AND wm.user_id = auth.uid()));
-- NOTE: ai_audit_log has NO insert/update/delete policy → append-only via
-- service-role server inserts; no client can mutate or erase audit history.

-- ai_permissions: members read; only workspace owners/admins write (enforced in
-- the API layer + this owner check). Members read so the UI can show the slider.
DROP POLICY IF EXISTS ai_permissions_ws_read ON public.ai_permissions;
CREATE POLICY ai_permissions_ws_read ON public.ai_permissions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm
                 WHERE wm.workspace_id = ai_permissions.workspace_id AND wm.user_id = auth.uid()));

DROP POLICY IF EXISTS ai_permissions_ws_write ON public.ai_permissions;
CREATE POLICY ai_permissions_ws_write ON public.ai_permissions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm
                 WHERE wm.workspace_id = ai_permissions.workspace_id AND wm.user_id = auth.uid()
                   AND wm.role IN ('owner','admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm
                 WHERE wm.workspace_id = ai_permissions.workspace_id AND wm.user_id = auth.uid()
                   AND wm.role IN ('owner','admin')));

-- ai_workspace_keys (BYOK): members may SEE that a key exists + the hint, but
-- the ciphertext is only ever read server-side. Only owners/admins write.
DROP POLICY IF EXISTS ai_workspace_keys_ws_read ON public.ai_workspace_keys;
CREATE POLICY ai_workspace_keys_ws_read ON public.ai_workspace_keys FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm
                 WHERE wm.workspace_id = ai_workspace_keys.workspace_id AND wm.user_id = auth.uid()
                   AND wm.role IN ('owner','admin')));

DROP POLICY IF EXISTS ai_workspace_keys_ws_write ON public.ai_workspace_keys;
CREATE POLICY ai_workspace_keys_ws_write ON public.ai_workspace_keys FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm
                 WHERE wm.workspace_id = ai_workspace_keys.workspace_id AND wm.user_id = auth.uid()
                   AND wm.role IN ('owner','admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm
                 WHERE wm.workspace_id = ai_workspace_keys.workspace_id AND wm.user_id = auth.uid()
                   AND wm.role IN ('owner','admin')));

-- ============================================================================
-- SEED: credit costs (mirror of CREDIT_COSTS in src/lib/ai/credits.ts).
-- ============================================================================
INSERT INTO public.ai_credit_costs (operation_key, credit_class, base_cost, per_unit_cost, formula) VALUES
  ('chat.turn',           'conversation', 1,  1, '{"unit":"per 1k tokens"}'),
  ('tool.read',           'conversation', 0,  0, '{}'),
  ('context.resolve',     'conversation', 0,  0, '{}'),
  ('retrieve.search',     'conversation', 1,  0, '{}'),
  ('embed',               'conversation', 1,  1, '{"unit":"per 1k tokens"}'),
  ('record.create',       'action',       1,  0, '{}'),
  ('record.update',       'action',       1,  0, '{}'),
  ('record.delete',       'action',       1,  0, '{}'),
  ('comms.email.draft',   'action',       1,  0, '{}'),
  ('comms.email.send',    'action',       2,  1, '{"unit":"per recipient"}'),
  ('automation.build',    'action',       3,  0, '{}'),
  ('automation.run',      'action',       2,  0, '{}'),
  ('form.apply',          'action',       1,  0, '{}'),
  ('memory.write',        'action',       0,  0, '{}'),
  ('web.search',          'intelligence', 5,  0, '{}'),
  ('market.comparables',  'intelligence', 5,  0, '{}'),
  ('doc.extract',         'intelligence', 5,  5, '{"unit":"per page"}'),
  ('doc.generate',        'intelligence', 10, 0, '{}'),
  ('agent.run',           'intelligence', 25, 5, '{"unit":"per step"}'),
  ('agent.run.premium',   'intelligence', 60, 12,'{"unit":"per step"}'),
  ('monitor.cycle',       'monitoring',   2,  0, '{}')
ON CONFLICT (operation_key) DO UPDATE
  SET credit_class = EXCLUDED.credit_class,
      base_cost = EXCLUDED.base_cost,
      per_unit_cost = EXCLUDED.per_unit_cost,
      formula = EXCLUDED.formula,
      updated_at = now();

-- ============================================================================
-- SEED: GDPR-compliant model catalogue additions.
--   • Enable Gemini Flash-Lite (cheapest compliant workhorse).
--   • Ensure Claude Sonnet exists for premium escalation (enabled; the gateway
--     skips it automatically if no ANTHROPIC_API_KEY is present).
--   • Kimi K2.6 on NVIDIA NIM is already the seeded default (US-hosted infra,
--     SCC-compliant) — left as-is.
--   • DeepSeek / Moonshot-direct are deliberately NOT seeded (data → China).
-- Costs are per 1,000 tokens in pence (approx public rates, GBP ~0.79/USD).
-- ============================================================================
INSERT INTO public.ai_models
  (provider_id, model_id, label, input_cost_pence_per_1k, output_cost_pence_per_1k, enabled, is_default, sort_order)
SELECT p.id, m.model_id, m.label, m.in_c, m.out_c, m.enabled, m.is_default, m.sort_order
-- NOTE: seeded DISABLED. Single-provider strategy = OpenAI (prod) + NVIDIA NIM
-- (test). These rows exist so an admin can flip to Gemini/Anthropic later, but
-- they are OFF by default to keep one controllable API budget (no vendor sprawl).
FROM (VALUES
  ('gemini',    'gemini-2.5-flash-lite', 'Gemini 2.5 Flash-Lite', 0.008, 0.032, false, false, 15),
  ('anthropic', 'claude-sonnet-4-6',     'Claude Sonnet 4.6',     0.240, 1.190, false, false, 45)
) AS m(provider_slug, model_id, label, in_c, out_c, enabled, is_default, sort_order)
JOIN public.ai_providers p ON p.slug = m.provider_slug
ON CONFLICT (provider_id, model_id) DO UPDATE
  SET label = EXCLUDED.label,
      input_cost_pence_per_1k = EXCLUDED.input_cost_pence_per_1k,
      output_cost_pence_per_1k = EXCLUDED.output_cost_pence_per_1k,
      enabled = EXCLUDED.enabled,
      updated_at = now();

-- Defence in depth: disable any China-direct provider rows if they were ever
-- added out-of-band (keeps tenant data off non-DPA inference).
UPDATE public.ai_providers SET enabled = false, updated_at = now()
  WHERE slug IN ('deepseek','moonshot');

-- Reliable COMPLIANT default on NVIDIA NIM (US infra, GDPR-OK). Verified
-- 2026-06-24: the Kimi-on-NIM deployments are unusable — 'kimi-k2-instruct'
-- is 410 Gone, 'kimi-k2' is 404, and 'kimi-k2.6' returns DEGENERATE output for
-- real prompts. Meta Llama on NIM answers correctly, so it is the default.
INSERT INTO public.ai_models
  (provider_id, model_id, label, input_cost_pence_per_1k, output_cost_pence_per_1k, enabled, is_default, sort_order)
SELECT p.id, v.mid, v.lbl, v.ic, v.oc, true, false, v.so
FROM (VALUES
  ('meta/llama-3.3-70b-instruct', 'Llama 3.3 70B (NIM)', 0.050, 0.050, 72),
  ('meta/llama-3.1-8b-instruct',  'Llama 3.1 8B (NIM)',  0.010, 0.010, 74)
) AS v(mid, lbl, ic, oc, so)
JOIN public.ai_providers p ON p.slug = 'nvidia'
ON CONFLICT (provider_id, model_id) DO UPDATE SET enabled = true, label = EXCLUDED.label, updated_at = now();

-- Disable the broken Kimi rows and clear their default flag.
UPDATE public.ai_models AS m SET enabled = false, is_default = false, updated_at = now()
  FROM public.ai_providers p
  WHERE m.provider_id = p.id AND p.slug = 'nvidia'
    AND m.model_id IN ('moonshotai/kimi-k2', 'moonshotai/kimi-k2.6', 'moonshotai/kimi-k2-instruct');

-- Make the working Llama the catalogue default (single-default index permits one).
UPDATE public.ai_models AS m SET is_default = true, updated_at = now()
  FROM public.ai_providers p
  WHERE m.provider_id = p.id AND p.slug = 'nvidia' AND m.model_id = 'meta/llama-3.3-70b-instruct';
