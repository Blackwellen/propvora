-- ============================================================
-- 20260624120000_portal_extended_profiles.sql
--
-- Extended portal profiles (applicant / accountant / solicitor / generic)
-- now have dedicated recipient portal experiences. Two schema changes are
-- required so the magic-link grant + verify flow can mint sessions for them:
--
--   1. portal_access_tokens.portal_type CHECK previously allowed only
--      tenant/landlord/supplier/accountant/client/affiliate. We widen it to
--      include solicitor / applicant / generic so the grant API can issue
--      tokens for every extended profile.
--
-- The leasing tables the applicant portal reads (property_vacancies /
-- prospects / viewings) are provisioned by migration 026_leasing_schema.sql,
-- which a fresh database applies before this one — no need to redefine them
-- here. This migration is idempotent (safe to re-run).
-- ============================================================

DO $$
BEGIN
  IF to_regclass('public.portal_access_tokens') IS NOT NULL THEN
    ALTER TABLE portal_access_tokens
      DROP CONSTRAINT IF EXISTS portal_access_tokens_portal_type_check;
    ALTER TABLE portal_access_tokens
      ADD CONSTRAINT portal_access_tokens_portal_type_check
      CHECK (portal_type = ANY (ARRAY[
        'tenant','landlord','supplier','accountant','solicitor',
        'applicant','generic','client','affiliate'
      ]));
  END IF;
END $$;
