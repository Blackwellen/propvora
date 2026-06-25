-- ============================================================
-- 20260624190000_ppm_reminder_emails.sql
-- Email channel for PPM reminders.
--
-- Email is sent from the APP (src/lib/email.ts → Resend) so the
-- Resend key never enters the database. The dispatcher's only
-- new job is to record WHO to email (recipient address) on each
-- dispatch row; the daily cron route (/api/cron/daily) then
-- sends any not-yet-emailed rows and marks them.
--
-- Additive + idempotent. Safe to re-run.
-- ============================================================

ALTER TABLE public.ppm_reminder_dispatch
  ADD COLUMN IF NOT EXISTS email_to   text,
  ADD COLUMN IF NOT EXISTS emailed    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS emailed_at timestamptz;

-- Partial index for the cron route's "pending email" scan.
CREATE INDEX IF NOT EXISTS idx_ppm_reminder_dispatch_pending_email
  ON public.ppm_reminder_dispatch (emailed)
  WHERE emailed = false AND email_to IS NOT NULL;

-- Re-create the dispatcher to also capture the recipient's email address on the
-- dispatch row (resolved from auth.users — SECURITY DEFINER can read it). The
-- in-app notification behaviour is unchanged.
CREATE OR REPLACE FUNCTION public.dispatch_ppm_reminders(p_today date DEFAULT CURRENT_DATE)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r           record;
  v_offset    integer;
  v_recipient uuid;
  v_email     text;
  v_notif     uuid;
  v_count     integer := 0;
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
            v_email := (SELECT email FROM auth.users WHERE id = v_recipient);

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

            INSERT INTO public.ppm_reminder_dispatch
              (plan_id, workspace_id, due_date, offset_days, notification_id, email_to)
            VALUES (r.id, r.workspace_id, r.next_due_date, v_offset, v_notif, v_email);

            v_count := v_count + 1;
          END IF;
        END IF;
      END IF;
    END LOOP;
  END LOOP;
  RETURN v_count;
END;
$$;
