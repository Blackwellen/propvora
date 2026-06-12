-- Schema alignment (enrich): add app-only fields the live `contacts`
-- table lacks. Renames (type↔contact_type, display_name↔full_name,
-- company↔company_name, demo↔is_demo) are handled by the hook adapter.
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS address_line1 TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS postcode TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
