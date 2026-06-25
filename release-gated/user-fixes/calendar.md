# Calendar — Pending Manual Actions

**Status: NONE. The section is fully fixed in code + live DB.**

2026-06-25 follow-up sweep (FIX-467 tab rename, FIX-468 native-event status
date-awareness, FIX-469 `calendar_reminders.snoozed_until` column + widened status
CHECK, FIX-470 mobile month-nav row split) were **all applied directly** — code
changes + a PAT-applied/committed migration
(`20260625120000_calendar_reminders_snoozed_until.sql`). No manual step, no
external blocker.

Earlier fixes (FIX-464, FIX-465, FIX-466) were applied directly:

- **next.config redirect removal (FIX-464)** — code change; takes effect on the next
  Vercel deploy (automatic). No manual step.
- **iCal token migration (FIX-465)** — `supabase/migrations/20260625090000_calendar_ical_token.sql`
  was **applied to the live database via the Management API PAT** and committed as a
  reproducible migration. No manual step.
- **Section-aware views switcher (FIX-466)** — code change. No manual step.

No external blockers (no Stripe/Vercel-env/DNS/Sentry dependency for this section).
