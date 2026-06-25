-- ============================================================
-- 20260624180000_ppm_reminders.sql
-- PPM schedule reminders — makes the New PPM Schedule wizard's
-- "Reminder Rules" a real, firing feature (not the dead UI that
-- FIX-423 had to remove because nothing persisted or dispatched).
--
--   * ppm_plans.reminders        jsonb array of offset-days, e.g. [30,7,1]
--   * ppm_reminder_dispatch      idempotency log (one row per plan/due/offset)
--   * dispatch_ppm_reminders()   SECURITY DEFINER fn — creates a notification
--                                for each reminder that falls due "today"
--   * pg_cron daily schedule     runs the dispatcher at 07:00
--
-- Idempotent + additive. Safe to re-run.
-- ============================================================

-- ─── reminders column on the plan ───────────────────────────
ALTER TABLE public.ppm_plans
  ADD COLUMN IF NOT EXISTS reminders jsonb NOT NULL DEFAULT '[]'::jsonb;

-- ─── dispatch log (idempotency) ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.ppm_reminder_dispatch (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id         uuid NOT NULL REFERENCES public.ppm_plans(id)  ON DELETE CASCADE,
  workspace_id    uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  due_date        date NOT NULL,
  offset_days     integer NOT NULL,
  notification_id uuid,
  sent_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ppm_reminder_dispatch_unique UNIQUE (plan_id, due_date, offset_days)
);

CREATE INDEX IF NOT EXISTS idx_ppm_reminder_dispatch_workspace ON public.ppm_reminder_dispatch(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ppm_reminder_dispatch_plan      ON public.ppm_reminder_dispatch(plan_id);

ALTER TABLE public.ppm_reminder_dispatch ENABLE ROW LEVEL SECURITY;
-- Read-only to workspace members; only the SECURITY DEFINER dispatcher writes.
DROP POLICY IF EXISTS "Members read ppm_reminder_dispatch" ON public.ppm_reminder_dispatch;
CREATE POLICY "Members read ppm_reminder_dispatch" ON public.ppm_reminder_dispatch
  FOR SELECT USING (is_workspace_member(workspace_id));

-- ─── dispatcher ─────────────────────────────────────────────
-- Parameterised on p_today so it is unit-testable without waiting for the cron
-- to fire on a real calendar day.
CREATE OR REPLACE FUNCTION public.dispatch_ppm_reminders(p_today date DEFAULT CURRENT_DATE)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r          record;
  v_offset   integer;
  v_recipient uuid;
  v_notif    uuid;
  v_count    integer := 0;
BEGIN
  FOR r IN
    SELECT p.id, p.workspace_id, p.name, p.next_due_date, p.created_by, p.reminders, p.category
    FROM public.ppm_plans p
    WHERE p.next_due_date IS NOT NULL
      AND p.status IN ('scheduled','due_soon','overdue')
      AND jsonb_typeof(p.reminders) = 'array'
      AND jsonb_array_length(p.reminders) > 0
  LOOP
    FOR v_offset IN SELECT (value)::int FROM jsonb_array_elements_text(r.reminders)
    LOOP
      -- fire on the day that is v_offset days before the due date
      IF (r.next_due_date - (v_offset || ' days')::interval)::date = p_today THEN
        IF NOT EXISTS (
          SELECT 1 FROM public.ppm_reminder_dispatch d
          WHERE d.plan_id = r.id AND d.due_date = r.next_due_date AND d.offset_days = v_offset
        ) THEN
          v_recipient := COALESCE(
            r.created_by,
            (SELECT wm.user_id FROM public.workspace_members wm
              WHERE wm.workspace_id = r.workspace_id AND wm.role = 'owner'
              ORDER BY wm.created_at LIMIT 1)
          );
          IF v_recipient IS NOT NULL THEN
            INSERT INTO public.notifications
              (workspace_id, user_id, kind, title, body, href, severity, entity_type, entity_id, metadata)
            VALUES (
              r.workspace_id,
              v_recipient,
              'ppm_reminder',
              r.name || ' due in ' || v_offset || ' day' || CASE WHEN v_offset = 1 THEN '' ELSE 's' END,
              'Planned maintenance "' || r.name || '"'
                || COALESCE(' (' || r.category || ')', '')
                || ' is due on ' || to_char(r.next_due_date, 'DD Mon YYYY') || '.',
              '/property-manager/work/ppm/' || r.id,
              CASE WHEN v_offset <= 1 THEN 'warning'::notification_severity ELSE 'info'::notification_severity END,
              'ppm_plan',
              r.id,
              jsonb_build_object('offset_days', v_offset, 'due_date', r.next_due_date)
            )
            RETURNING id INTO v_notif;

            INSERT INTO public.ppm_reminder_dispatch (plan_id, workspace_id, due_date, offset_days, notification_id)
            VALUES (r.id, r.workspace_id, r.next_due_date, v_offset, v_notif);

            v_count := v_count + 1;
          END IF;
        END IF;
      END IF;
    END LOOP;
  END LOOP;
  RETURN v_count;
END;
$$;

-- ─── daily schedule (pg_cron) ───────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'dispatch_ppm_reminders_daily') THEN
      PERFORM cron.unschedule('dispatch_ppm_reminders_daily');
    END IF;
    PERFORM cron.schedule('dispatch_ppm_reminders_daily', '0 7 * * *',
                          'SELECT public.dispatch_ppm_reminders();');
  END IF;
END $$;
