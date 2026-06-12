-- Schema alignment (enrich): app-only money fields on tasks; the rest is
-- handled by hook adapters (kind↔category, due_at↔due_date, assignee_user_id↔assigned_to).
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_cost NUMERIC;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_cost NUMERIC;
-- units: app expects a couple of fields the live table lacks
ALTER TABLE units ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC;
ALTER TABLE units ADD COLUMN IF NOT EXISTS notes TEXT;
