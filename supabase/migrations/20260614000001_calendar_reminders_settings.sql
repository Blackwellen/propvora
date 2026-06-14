-- Calendar feature tables the app references but that were never provisioned:
--   calendar_reminders — per-event/standalone reminders (the reminders/new page
--     + useCalendarData read/write these; without the table the feature 42P01'd).
--   calendar_settings — per-workspace calendar preferences (upserted on workspace_id).
-- Columns match the app's insert/select shapes (CalendarSettings interface +
-- calendar/reminders/new insert).

-- ── calendar_reminders ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.calendar_reminders (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  event_id       uuid REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  title          text NOT NULL,
  reminder_type  text NOT NULL DEFAULT 'standard',
  channel        text NOT NULL DEFAULT 'in_app',
  due_at         timestamptz NOT NULL,
  status         text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','sent','failed','cancelled')),
  sent_at        timestamptz,
  error          text,
  created_by     uuid,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  demo           boolean NOT NULL DEFAULT false,
  demo_batch_id  uuid,
  demo_expires_at timestamptz
);
CREATE INDEX IF NOT EXISTS calendar_reminders_ws_due ON public.calendar_reminders (workspace_id, due_at);
CREATE INDEX IF NOT EXISTS calendar_reminders_ws_status ON public.calendar_reminders (workspace_id, status);

-- ── calendar_settings (one row per workspace) ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.calendar_settings (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   uuid NOT NULL UNIQUE REFERENCES public.workspaces(id) ON DELETE CASCADE,
  default_view   text NOT NULL DEFAULT 'month',
  timezone       text NOT NULL DEFAULT 'Europe/London',
  working_hours_json            jsonb NOT NULL DEFAULT '{}'::jsonb,
  default_reminder_offsets_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  visible_layers_json           jsonb NOT NULL DEFAULT '{}'::jsonb,
  ai_suggestions_enabled boolean NOT NULL DEFAULT true,
  external_sync_enabled  boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- ── RLS: workspace members manage their workspace's rows ─────────────────────
ALTER TABLE public.calendar_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_settings  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cal_rem_members ON public.calendar_reminders;
CREATE POLICY cal_rem_members ON public.calendar_reminders
  FOR ALL USING (EXISTS (SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = calendar_reminders.workspace_id AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = calendar_reminders.workspace_id AND wm.user_id = auth.uid()));

DROP POLICY IF EXISTS cal_set_members ON public.calendar_settings;
CREATE POLICY cal_set_members ON public.calendar_settings
  FOR ALL USING (EXISTS (SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = calendar_settings.workspace_id AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = calendar_settings.workspace_id AND wm.user_id = auth.uid()));
