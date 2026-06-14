-- Workspace profile/company fields used by Workspace Settings → Profile.
-- These were referenced by the UI but never existed on the table.
ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS legal_name text;
ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS company_number text;
ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS vat_number text;
ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS support_email text;
ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS billing_email text;
ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'Europe/London';
ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS currency text DEFAULT 'GBP';
ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS date_format text DEFAULT 'DD/MM/YYYY';
ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS brand_colours jsonb;
