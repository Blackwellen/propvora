-- ============================================================
-- 20260615040000_legal_hardening.sql
-- Extends the existing legal tables (20260614130000_legal_tables.sql) for the
-- hardened possession wizard, court-bundle generator, and HMO/SA/R2R checks.
--
-- REVIEW-ONLY guarantee preserved: every new column stores a DRAFT or a record
-- of something the USER did offline. Nothing here files, serves, or asserts a
-- legal action. `notice_type`/`grounds`/`validity_snapshot` are drafting aids;
-- `service_*` columns are a manual log of a service the user performed.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS only — safe to re-run, safe alongside
-- the base legal-tables migration.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- possession_cases — wizard hardening
--   notice_type        : 'section_8' | 'section_21' (which route the draft is)
--   grounds            : jsonb array of structured ground selections
--                        [{ id, number, name, type, notice_days }]
--   notice_period_days : computed minimum notice period for the draft (review)
--   service_method     : how the USER served offline (hand/post/email/process)
--   service_recipient  : who the USER served (free text)
--   validity_snapshot  : jsonb snapshot of the S21/S8 prerequisite checks at the
--                        time the draft was generated (deposit protected?,
--                        prescribed info?, EPC/gas/how-to-rent served?, licence?)
--   bundle_generated_at: last time a DRAFT court bundle was assembled (review)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.possession_cases
  ADD COLUMN IF NOT EXISTS notice_type         text NOT NULL DEFAULT 'section_8',
  ADD COLUMN IF NOT EXISTS grounds             jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS notice_period_days  integer,
  ADD COLUMN IF NOT EXISTS service_method      text,
  ADD COLUMN IF NOT EXISTS service_recipient   text,
  ADD COLUMN IF NOT EXISTS validity_snapshot   jsonb,
  ADD COLUMN IF NOT EXISTS bundle_generated_at timestamptz;

-- ────────────────────────────────────────────────────────────
-- hmo_licences — SA / R2R / occupancy checks
--   arrangement_type  : 'standard' | 'serviced_accommodation' | 'rent_to_rent'
--   occupancy_current : current occupants in use (vs max_occupants) for the
--                       over-occupation validity check
--   r2r_agreement_end : end date of the rent-to-rent head agreement (expiry
--                       surfaced alongside the licence)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.hmo_licences
  ADD COLUMN IF NOT EXISTS arrangement_type  text NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS occupancy_current integer,
  ADD COLUMN IF NOT EXISTS r2r_agreement_end date;

-- No new RLS needed — the existing workspace-member policies on these tables
-- already cover every column.
