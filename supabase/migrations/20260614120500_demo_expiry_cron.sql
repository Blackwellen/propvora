-- Schedule the 30-day demo auto-expiry. expire_demo_data() deletes every demo
-- row past demo_expires_at across all workspaces. Runs daily at 03:15 UTC.
-- Idempotent: unschedule any prior job of the same name first.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire_demo_data_daily') THEN
    PERFORM cron.unschedule('expire_demo_data_daily');
  END IF;
  PERFORM cron.schedule('expire_demo_data_daily', '15 3 * * *', 'SELECT public.expire_demo_data();');
END;
$$;
