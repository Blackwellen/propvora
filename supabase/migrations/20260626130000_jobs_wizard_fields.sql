-- ============================================================================
-- Jobs — persist Create-Job wizard fields that were previously captured but
-- silently dropped on submit (W-WIZ-OPEN-02).
--
-- The New Job wizard collects revenue/occupancy-blocking triage flags (Scope
-- step) and a scheduled time + estimated duration (Financials step), and shows
-- them on the Review step — but the insert payload discarded them. These
-- additive columns let useCreateJob persist every confirmed field.
--
-- Additive + idempotent (ADD COLUMN IF NOT EXISTS). Existing rows default to
-- not-blocking / null schedule detail, matching prior effective behaviour.
-- ============================================================================

alter table public.jobs
  add column if not exists revenue_blocking   boolean not null default false,
  add column if not exists occupancy_blocking boolean not null default false,
  add column if not exists scheduled_time     text,
  add column if not exists estimated_duration text;

comment on column public.jobs.revenue_blocking   is 'Job blocks rental income (e.g. void-causing) — triage signal from Create-Job wizard.';
comment on column public.jobs.occupancy_blocking  is 'Job blocks occupancy / habitability — triage signal from Create-Job wizard.';
comment on column public.jobs.scheduled_time      is 'Optional time-of-day for the scheduled visit (HH:MM), pairs with scheduled_date.';
comment on column public.jobs.estimated_duration  is 'Free-text estimated job duration captured at creation (e.g. "2 hours", "Half day").';
