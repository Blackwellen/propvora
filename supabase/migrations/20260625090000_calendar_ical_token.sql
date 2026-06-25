-- ============================================================================
-- Calendar iCal subscribe feed — per-workspace unguessable token.
--
-- The Calendar Settings page advertises an iCal feed URL that external calendar
-- apps (Google / Outlook / Apple) subscribe to. External apps cannot send the
-- Supabase session cookie, so the feed must be PUBLIC-BY-TOKEN: an unguessable
-- secret stored on the workspace's calendar_settings row. The feed route
-- (/api/calendar/ical/[token]) resolves the token via the service role and
-- emits the workspace's calendar_events as VEVENTs.
--
-- Previously the settings page pointed at /api/calendar/ical?workspace_id=...
-- which (a) had no backing route (404) and (b) would have leaked the calendar
-- to anyone who knew the workspace UUID. This token approach fixes both.
-- ============================================================================

alter table public.calendar_settings
  add column if not exists ical_token text;

-- Unguessable hex token; unique so the feed route can resolve a single workspace.
create unique index if not exists calendar_settings_ical_token_key
  on public.calendar_settings (ical_token)
  where ical_token is not null;

comment on column public.calendar_settings.ical_token is
  'Unguessable public-by-token secret for the workspace iCal subscribe feed (/api/calendar/ical/[token]). Rotatable.';
