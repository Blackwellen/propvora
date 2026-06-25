-- ============================================================
-- Link generated jobs back to their originating PPM plan so the
-- PPM detail "Generated Jobs" tab can list real work orders that
-- were dispatched from a plan (previously a static empty state).
--
-- Applied live via the Management API on 2026-06-24; this file
-- makes it reproducible from a fresh database. Idempotent.
-- ============================================================

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS ppm_plan_id UUID REFERENCES ppm_plans(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_ppm_plan ON jobs(ppm_plan_id);
