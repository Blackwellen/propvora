-- ============================================================================
-- CRITICAL FIX: the auth.users `handle_new_user` trigger inserts into
-- public.profiles(id, display_name, marketing_opt_in, affiliate_ref) but the
-- `affiliate_ref` column did not exist — so EVERY sign-up failed with
-- "Database error creating new user". Add the column so the trigger succeeds.
-- (affiliate_ref also gives us a signup-time referral signal.)
-- Idempotent / additive.
-- ============================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS affiliate_ref TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_affiliate_ref
  ON public.profiles(affiliate_ref) WHERE affiliate_ref IS NOT NULL;
