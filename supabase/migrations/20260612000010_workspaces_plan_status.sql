-- ============================================================================
-- CRITICAL FIX: the app expects workspaces.plan_status everywhere (createWorkspace
-- onboarding insert, Stripe webhook updates, admin reads/toggles, the WorkspacePlan
-- Status type) but the column was missing from the live DB. Without it, onboarding
-- workspace creation fails and the Stripe webhook can't record subscription state.
-- Idempotent / additive.
-- ============================================================================

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS plan_status TEXT NOT NULL DEFAULT 'trialing'
  CHECK (plan_status IN ('active','trialing','past_due','canceled','suspended'));

CREATE INDEX IF NOT EXISTS idx_workspaces_plan_status ON public.workspaces(plan_status);
