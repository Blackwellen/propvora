-- ============================================================================
-- 20260625130000_ai_azure_openai_provider.sql
-- Production AI provider → Azure OpenAI (EU region).
--
-- GDPR EU data residency at standard token pricing (no $108k OpenAI-Enterprise
-- tier), Microsoft DPA + EU Data Boundary, simplest hard spend caps. Single
-- vendor family = one controllable budget. NVIDIA NIM (Llama) stays enabled as
-- the TEST/fallback provider that serves until the Azure resource exists; the
-- router (routing.ts) prefers Azure and the gateway only offers enabled+keyed
-- models, so Azure takes over automatically the moment its key is set.
--
-- Endpoint + api-version are read from ENV by the gateway (never stored in DB):
--   AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, AZURE_OPENAI_API_VERSION.
-- The model_id values below are the Azure DEPLOYMENT names — create deployments
-- with these exact names in the Azure portal (or rename here to match yours).
-- Idempotent.
-- ============================================================================

INSERT INTO public.ai_providers (slug, name, base_url, api_key_env, enabled, sort_order) VALUES
  ('azure', 'Azure OpenAI (EU)', NULL, 'AZURE_OPENAI_API_KEY', true, 5)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name, api_key_env = EXCLUDED.api_key_env, enabled = true, updated_at = now();

-- Azure deployments (model_id = deployment name). Costs per 1,000 tokens in
-- pence (≈ public $ rates, GBP ~0.79/USD). Enabled, but inert until the Azure
-- key+endpoint env vars are present (the gateway filters models without a key).
INSERT INTO public.ai_models
  (provider_id, model_id, label, input_cost_pence_per_1k, output_cost_pence_per_1k, enabled, is_default, sort_order)
SELECT p.id, m.model_id, m.label, m.in_c, m.out_c, true, false, m.sort_order
FROM (VALUES
  ('gpt-5.4-nano', 'GPT-5.4 nano (Azure EU)', 0.016, 0.099, 1),  -- $0.20/$1.25 per 1M
  ('gpt-5.4-mini', 'GPT-5.4 mini (Azure EU)', 0.059, 0.356, 2),  -- $0.75/$4.50 per 1M
  ('gpt-4o-mini',  'GPT-4o mini (Azure EU)',  0.012, 0.047, 3),  -- fallback deployment
  ('gpt-4o',       'GPT-4o (Azure EU)',       0.198, 0.790, 4)   -- fallback deployment
) AS m(model_id, label, in_c, out_c, sort_order)
JOIN public.ai_providers p ON p.slug = 'azure'
ON CONFLICT (provider_id, model_id) DO UPDATE
  SET label = EXCLUDED.label,
      input_cost_pence_per_1k = EXCLUDED.input_cost_pence_per_1k,
      output_cost_pence_per_1k = EXCLUDED.output_cost_pence_per_1k,
      enabled = true,
      updated_at = now();

-- Single production source: disable OpenAI-DIRECT models (we route GPT through
-- Azure for EU residency now). NVIDIA NIM (test) + Azure (prod) remain.
UPDATE public.ai_models m SET enabled = false, is_default = false, updated_at = now()
  FROM public.ai_providers p
  WHERE m.provider_id = p.id AND p.slug = 'openai';
