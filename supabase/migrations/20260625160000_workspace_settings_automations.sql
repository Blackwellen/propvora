-- Automation governance settings column.
--
-- The live `workspace_settings` table stores one jsonb column per product module
-- (compliance, money, ai, calendar, team, …). Automation governance — relocated
-- from the Automations module's "Admin Controls" tab into Workspace Settings →
-- Automation Governance — is persisted under a matching `automations` column at
-- key `governance`.
--
-- NOT NULL DEFAULT '{}' so inserts that omit it (and the other module columns)
-- succeed via their defaults; never send explicit null.
--
-- Applied to the live project (oovgfknmzjcgbilwumch) via the Management API on
-- 2026-06-25 during the Automations → Overview QA drop.

ALTER TABLE workspace_settings
  ADD COLUMN IF NOT EXISTS automations jsonb NOT NULL DEFAULT '{}'::jsonb;
