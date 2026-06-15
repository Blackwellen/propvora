-- ============================================================
-- 20260615010000_ai_gateway.sql
-- AI multi-provider gateway control plane + hard-cap accounting.
--
-- Backs src/lib/ai/gateway.ts (provider dispatch), src/lib/ai/caps.ts
-- (fail-closed per-plan quotas) and the admin model-controls page
-- src/app/(admin)/admin/ai-models/**.
--
-- Tables:
--   ai_providers      — GLOBAL catalogue of model providers (OpenAI, OpenRouter,
--                       Anthropic, Gemini, NVIDIA). Admin/service-role writable,
--                       any authed user may read (the gateway reads it server-side).
--                       API KEYS ARE NOT STORED HERE — keys come from env only.
--   ai_models         — GLOBAL catalogue of models per provider, with per-1k
--                       token input/output cost (pence), enabled + default flags.
--   ai_usage_events   — WORKSPACE-SCOPED per-call ledger (tokens in/out, cost in
--                       pence, provider, model, route). Powers the hard caps and
--                       the admin usage-by-workspace view. Members read their own
--                       workspace; inserts happen server-side (service role).
--
-- Idempotent: CREATE ... IF NOT EXISTS + ADD COLUMN IF NOT EXISTS +
-- DROP POLICY IF EXISTS, safe to re-run.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- ai_providers — global provider catalogue (no secrets stored)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_providers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- stable machine key the gateway dispatches on: 'openai' | 'openrouter'
  -- | 'anthropic' | 'gemini' | 'nvidia'
  slug        text NOT NULL UNIQUE,
  name        text NOT NULL,
  -- optional override base URL (OpenAI-compatible endpoint). NULL = SDK default.
  base_url    text,
  -- name of the env var that holds the API key (key value NEVER stored in DB).
  api_key_env text,
  enabled     boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- ai_models — global model catalogue per provider
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_models (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id         uuid NOT NULL REFERENCES public.ai_providers(id) ON DELETE CASCADE,
  -- the id sent on the wire to the provider, e.g. 'gpt-4o-mini'
  model_id            text NOT NULL,
  label               text NOT NULL,
  -- cost per 1,000 tokens, in pence (integer minor units; honest + auditable)
  input_cost_pence_per_1k   numeric(10,4) NOT NULL DEFAULT 0,
  output_cost_pence_per_1k  numeric(10,4) NOT NULL DEFAULT 0,
  enabled             boolean NOT NULL DEFAULT true,
  -- exactly one model should carry is_default = true (enforced by partial index)
  is_default          boolean NOT NULL DEFAULT false,
  sort_order          integer NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_id, model_id)
);

-- At most one default model across the catalogue.
CREATE UNIQUE INDEX IF NOT EXISTS uq_ai_models_single_default
  ON public.ai_models ((is_default)) WHERE is_default;

CREATE INDEX IF NOT EXISTS idx_ai_models_provider ON public.ai_models(provider_id);
CREATE INDEX IF NOT EXISTS idx_ai_models_enabled  ON public.ai_models(enabled);

-- ────────────────────────────────────────────────────────────
-- ai_usage_events — workspace-scoped per-call ledger (caps + reporting)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_usage_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  provider      text NOT NULL,
  model         text NOT NULL,
  tokens_in     integer NOT NULL DEFAULT 0,
  tokens_out    integer NOT NULL DEFAULT 0,
  cost_pence    numeric(12,4) NOT NULL DEFAULT 0,
  route         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Cap queries scan (workspace_id, created_at); cost/usage rollups group by both.
CREATE INDEX IF NOT EXISTS idx_ai_usage_events_ws_created
  ON public.ai_usage_events(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_events_created
  ON public.ai_usage_events(created_at DESC);

-- ============================================================
-- RLS
--   ai_providers / ai_models: readable by any authenticated user (the gateway
--     and admin UI read them); writable only by service-role / platform admin.
--   ai_usage_events: workspace members read their own workspace's rows; writes
--     are server-side (service role bypasses RLS) so usage can't be forged.
-- ============================================================
ALTER TABLE public.ai_providers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_models       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_events ENABLE ROW LEVEL SECURITY;

-- Helper: is the current caller a platform admin? (mirrors src/lib/admin/guard)
-- Kept inline in policies to avoid a function dependency.

-- ai_providers: authed read, admin write
DROP POLICY IF EXISTS ai_providers_read ON public.ai_providers;
CREATE POLICY ai_providers_read ON public.ai_providers FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS ai_providers_admin_write ON public.ai_providers;
CREATE POLICY ai_providers_admin_write ON public.ai_providers FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.platform_role = 'admin')
    OR EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.platform_role = 'admin')
    OR EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid())
  );

-- ai_models: authed read, admin write
DROP POLICY IF EXISTS ai_models_read ON public.ai_models;
CREATE POLICY ai_models_read ON public.ai_models FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS ai_models_admin_write ON public.ai_models;
CREATE POLICY ai_models_admin_write ON public.ai_models FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.platform_role = 'admin')
    OR EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.platform_role = 'admin')
    OR EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid())
  );

-- ai_usage_events: workspace members read their own workspace's usage.
DROP POLICY IF EXISTS ai_usage_events_ws_read ON public.ai_usage_events;
CREATE POLICY ai_usage_events_ws_read ON public.ai_usage_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm
                 WHERE wm.workspace_id = ai_usage_events.workspace_id
                   AND wm.user_id = auth.uid()));

-- Inserts/updates are service-role only (no INSERT/UPDATE policy for authed
-- users): the gateway writes the ledger so usage figures can't be tampered with.

-- ============================================================
-- Seed the provider + model catalogue (idempotent ON CONFLICT).
-- OpenAI stays the default model. Other providers are seeded disabled-by-model
-- where appropriate but providers enabled so admins can flip models on.
-- Costs are per 1,000 tokens in pence (approx public rates, GBP ~0.79/USD).
-- ============================================================
INSERT INTO public.ai_providers (slug, name, base_url, api_key_env, enabled, sort_order) VALUES
  ('openai',     'OpenAI',     NULL,                                  'OPENAI_API_KEY',     true,  10),
  ('openrouter', 'OpenRouter', 'https://openrouter.ai/api/v1',        'OPENROUTER_API_KEY', true,  20),
  ('anthropic',  'Anthropic',  NULL,                                  'ANTHROPIC_API_KEY',  true,  30),
  ('gemini',     'Google Gemini', 'https://generativelanguage.googleapis.com/v1beta/openai', 'GEMINI_API_KEY', true, 40),
  ('nvidia',     'NVIDIA NIM', 'https://integrate.api.nvidia.com/v1', 'NVIDIA_API_KEY',     true,  50)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      base_url = EXCLUDED.base_url,
      api_key_env = EXCLUDED.api_key_env,
      updated_at = now();

-- Models. is_default on gpt-4o-mini (keeps OpenAI as the working default).
INSERT INTO public.ai_models
  (provider_id, model_id, label, input_cost_pence_per_1k, output_cost_pence_per_1k, enabled, is_default, sort_order)
SELECT p.id, m.model_id, m.label, m.in_c, m.out_c, m.enabled, m.is_default, m.sort_order
FROM (VALUES
  -- provider slug, model_id, label, in pence/1k, out pence/1k, enabled, default, sort
  ('openai',     'gpt-4o-mini',          'GPT-4o mini',         0.012, 0.047, true,  true,  10),
  ('openai',     'gpt-4o',               'GPT-4o',              0.198, 0.790, true,  false, 20),
  ('openrouter', 'openai/gpt-4o-mini',   'GPT-4o mini (OR)',    0.012, 0.047, true,  false, 30),
  ('openrouter', 'meta-llama/llama-3.1-70b-instruct', 'Llama 3.1 70B', 0.047, 0.063, false, false, 40),
  ('anthropic',  'claude-3-5-haiku-latest', 'Claude 3.5 Haiku', 0.063, 0.316, false, false, 50),
  ('gemini',     'gemini-1.5-flash',     'Gemini 1.5 Flash',    0.006, 0.024, false, false, 60),
  ('nvidia',     'meta/llama-3.1-70b-instruct', 'Llama 3.1 70B (NIM)', 0.040, 0.040, false, false, 70)
) AS m(provider_slug, model_id, label, in_c, out_c, enabled, is_default, sort_order)
JOIN public.ai_providers p ON p.slug = m.provider_slug
ON CONFLICT (provider_id, model_id) DO UPDATE
  SET label = EXCLUDED.label,
      input_cost_pence_per_1k = EXCLUDED.input_cost_pence_per_1k,
      output_cost_pence_per_1k = EXCLUDED.output_cost_pence_per_1k,
      updated_at = now();
