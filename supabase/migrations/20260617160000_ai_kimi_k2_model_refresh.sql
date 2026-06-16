-- ============================================================================
-- AI catalogue: refresh the default Kimi K2 model id on NVIDIA NIM.
--
-- NVIDIA NIM retired `moonshotai/kimi-k2-instruct` (end-of-life 2026-05-12),
-- which made every copilot call to the default model fail with HTTP 410 Gone.
-- The current Kimi K2 model id served by NIM is `moonshotai/kimi-k2.6`.
--
-- This migration repoints the existing NVIDIA Kimi row to the live model id and
-- keeps it as the enabled default. Idempotent: safe to run repeatedly. If the
-- old row is absent (fresh install seeded with the new id) it is a no-op.
-- ============================================================================

UPDATE public.ai_models AS m
SET model_id = 'moonshotai/kimi-k2.6',
    label = 'Kimi K2 (NVIDIA NIM)',
    enabled = true,
    updated_at = now()
FROM public.ai_providers AS p
WHERE m.provider_id = p.id
  AND p.slug = 'nvidia'
  AND m.model_id = 'moonshotai/kimi-k2-instruct';
