-- Newsletter subscribers with explicit consent + double opt-in
-- (MAX-RELEASE items 200, 31). No marketing email without consent.
--
-- This table is written ONLY by the service role (see
-- src/app/api/newsletter/subscribe/route.ts + confirm/route.ts, which use
-- createAdminClient). RLS is enabled with NO policies, so it is deny-all to
-- anon/authenticated clients — subscriber data (emails) must never be reachable
-- from the browser, and there is no public read/write path.
--
-- Lifecycle:
--   pending      -> signed up, awaiting double opt-in confirmation
--   subscribed   -> confirmed consent, may receive marketing email
--   unsubscribed -> opted out (may re-subscribe -> back to pending)
--   suppressed   -> hard suppression (bounce/complaint/manual); never mailed

CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email           citext      NOT NULL UNIQUE,
  status          text        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','subscribed','unsubscribed','suppressed')),
  consent         boolean     NOT NULL DEFAULT false,
  source          text,
  confirm_token   uuid        DEFAULT gen_random_uuid(),
  confirmed_at    timestamptz,
  unsubscribed_at timestamptz,
  ip              text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Token lookups during double opt-in confirmation.
CREATE INDEX IF NOT EXISTS newsletter_subscribers_confirm_token_idx
  ON public.newsletter_subscribers (confirm_token);

-- Deny-all: enable RLS and define no policies. Only the service role bypasses
-- RLS, so anon/authenticated clients can neither read nor write subscriber rows.
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
