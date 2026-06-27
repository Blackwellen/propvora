-- Account Settings (Section 9) — Notifications + Preferences persistence.
--
-- The account Notifications and Preferences pages write flat keys onto
-- public.user_preferences via saveUserPreferences(), but the table only had
-- id/user_id/workspace_id/calendar/created_at/updated_at. Saves therefore
-- failed (column does not exist). This migration adds the columns those pages
-- read and write so personal preferences actually persist.
--
-- Scope note: user_preferences is uniquely keyed on (user_id, workspace_id)
-- (both NOT NULL), so preferences are stored per-user-per-active-workspace.
-- saveUserPreferences/getUserPreferences resolve the active workspace and key
-- the upsert on that composite, which the existing constraint supports.

alter table public.user_preferences
  add column if not exists notification_prefs jsonb default '{}'::jsonb,
  add column if not exists quiet_hours_start  text,
  add column if not exists quiet_hours_end    text,
  add column if not exists theme              text,
  add column if not exists density            text,
  add column if not exists calendar_view      text,
  add column if not exists landing_page       text,
  add column if not exists reduced_motion     boolean default false,
  add column if not exists default_language   text,
  -- Quick Action Bar prefs (visible widgets + order) — DB-synced across devices.
  add column if not exists quickbar           jsonb;
