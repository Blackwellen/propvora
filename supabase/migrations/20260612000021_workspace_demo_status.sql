-- Demo-data status flags on workspaces (used by onboarding/settings + seed/reset).
ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS demo_data_loaded boolean NOT NULL DEFAULT false;
ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS demo_data_variant text;
