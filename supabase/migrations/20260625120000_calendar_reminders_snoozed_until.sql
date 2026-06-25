-- Calendar reminders: restore the `snoozed_until` column on the live table.
--
-- The live `calendar_reminders` table diverged from the original definition in
-- 022_calendar_module.sql (it carries `error` + `demo*` columns and dropped
-- `snoozed_until`/`failure_reason`/`updated_by`). The app's typed data layer
-- (`src/hooks/useCalendarData.ts` → `useSnoozeReminder`) writes `status='snoozed'`
-- together with `snoozed_until`, so without this column every Snooze action on the
-- Reminders sub-tab failed with PostgREST 400 (column does not exist) and the
-- snooze silently never persisted. Additive + idempotent — safe to re-run.
alter table public.calendar_reminders
  add column if not exists snoozed_until timestamptz;

-- The live status CHECK also diverged: it only permitted
-- ('pending','sent','failed','cancelled'), so writing status='snoozed' (which the
-- Snooze action + the "Snoozed" filter tab both rely on) failed with 23514. Widen
-- it back to the full set the app uses.
alter table public.calendar_reminders
  drop constraint if exists calendar_reminders_status_check;
alter table public.calendar_reminders
  add constraint calendar_reminders_status_check
  check (status = any (array['pending','sent','failed','snoozed','cancelled']));

-- PostgREST caches the schema; make the new column/constraint visible immediately.
notify pgrst, 'reload schema';
