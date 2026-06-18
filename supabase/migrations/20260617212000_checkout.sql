-- ============================================================================
-- 20260617212000_checkout.sql
--
-- CHECKOUT — secure-checkout substrate for the four marketplace checkout flows:
--   1. Booking checkout            (stay reservation — pay & confirm)
--   2. Instant-pay service         (escrow-held — release on completion)
--   3. Emergency dispatch          (escrow-held — provider acceptance window)
--   4. Quote request / RFQ         (NO payment — supplier notified)
--
-- This is the DATA model for the checkout funnel. It sits in front of the P5
-- escrow/payments layer (escrow_payments / escrow_holds / payouts) which is
-- driven later by REAL Stripe webhooks. NOTHING here makes a live Stripe call:
-- payment lifecycle is MODELLED in data only —
--   checkout_payment_attempts.status starts 'requires_payment' and only a real
--   webhook (sibling agent) advances it to 'authorized'/'captured'/'held'.
--
-- TWO ACCESS DOORS (mirrors the portal pattern):
--   * PUBLIC  — anonymous guest checkout reaches ONLY its own session rows,
--     scoped by a session token presented as a request setting
--     (current_setting('request.checkout_session_token')). No Postgres role is
--     ever held by the guest; the public route reads with the anon key.
--   * AUTHED  — workspace members reach their workspace's checkout rows via the
--     REAL public.workspace_members(workspace_id,user_id) membership table
--     (exact pattern copied from 20260616090000_payments_escrow.sql).
--
-- Money is INTEGER PENCE (bigint) throughout. Idempotent + additive:
-- IF NOT EXISTS / DROP ... IF EXISTS throughout.
-- Apply: node scripts/_apply_migration.mjs supabase/migrations/20260617212000_checkout.sql
-- ============================================================================

-- ────────────────────────────────────────────────────────────
-- Shared touch fn for updated_at (create if absent)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.checkout_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ============================================================================
-- 1. checkout_sessions — one row per checkout funnel instance
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.checkout_sessions (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id         uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  -- 'booking' | 'service' | 'emergency' | 'quote_request'
  checkout_type        text NOT NULL DEFAULT 'booking'
                         CHECK (checkout_type IN ('booking','service','emergency','quote_request')),
  -- Loose reference to the originating record (booking/service order/emergency/RFQ).
  reference_type       text,
  reference_id         uuid,
  -- 'draft' | 'pending_payment' | 'processing' | 'confirmed' | 'dispatched'
  -- | 'requested' | 'failed' | 'cancelled' | 'expired'
  status               text NOT NULL DEFAULT 'draft'
                         CHECK (status IN (
                           'draft','pending_payment','processing','confirmed',
                           'dispatched','requested','failed','cancelled','expired')),
  currency             text NOT NULL DEFAULT 'GBP',
  -- Total taken NOW (pence). 0 for quote_request (no payment).
  total_due_now_pence  bigint NOT NULL DEFAULT 0 CHECK (total_due_now_pence >= 0),
  -- SHA-256 of the public session token; presented by the anon guest to scope RLS.
  session_token_hash   text,
  expires_at           timestamptz,
  contact_email        text,
  metadata_json        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by           uuid,
  archived_at          timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checkout_sessions_workspace  ON public.checkout_sessions (workspace_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_status     ON public.checkout_sessions (status);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_created_at ON public.checkout_sessions (created_at);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_type       ON public.checkout_sessions (checkout_type);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_token_hash ON public.checkout_sessions (session_token_hash);

-- ============================================================================
-- Helper macro (manual): every child table carries checkout_session_id + the
-- standard cols. They resolve membership through the parent session.
-- ============================================================================

-- ============================================================================
-- 2. checkout_line_items — priced lines on the session (extras, add-ons, fees)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.checkout_line_items (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  checkout_session_id uuid NOT NULL REFERENCES public.checkout_sessions(id) ON DELETE CASCADE,
  kind                text NOT NULL DEFAULT 'base'
                        CHECK (kind IN ('base','extra','add_on','fee','discount','deposit','tax')),
  label               text NOT NULL,
  quantity            integer NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  unit_amount_pence   bigint NOT NULL DEFAULT 0,
  amount_pence        bigint NOT NULL DEFAULT 0,
  currency            text NOT NULL DEFAULT 'GBP',
  selected            boolean NOT NULL DEFAULT true,
  status              text NOT NULL DEFAULT 'active',
  metadata_json       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by          uuid,
  archived_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checkout_line_items_workspace ON public.checkout_line_items (workspace_id);
CREATE INDEX IF NOT EXISTS idx_checkout_line_items_session   ON public.checkout_line_items (checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_checkout_line_items_status    ON public.checkout_line_items (status);
CREATE INDEX IF NOT EXISTS idx_checkout_line_items_created   ON public.checkout_line_items (created_at);

-- ============================================================================
-- 3. checkout_payment_methods — saved/selected method cards per session
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.checkout_payment_methods (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  checkout_session_id uuid NOT NULL REFERENCES public.checkout_sessions(id) ON DELETE CASCADE,
  -- 'card' | 'apple_pay' | 'google_pay' | 'bank_transfer'
  method_type         text NOT NULL DEFAULT 'card'
                        CHECK (method_type IN ('card','apple_pay','google_pay','bank_transfer')),
  brand               text,
  last4               text,
  exp_label           text,
  is_default          boolean NOT NULL DEFAULT false,
  status              text NOT NULL DEFAULT 'active',
  metadata_json       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by          uuid,
  archived_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checkout_pm_workspace ON public.checkout_payment_methods (workspace_id);
CREATE INDEX IF NOT EXISTS idx_checkout_pm_session   ON public.checkout_payment_methods (checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_checkout_pm_status    ON public.checkout_payment_methods (status);
CREATE INDEX IF NOT EXISTS idx_checkout_pm_created   ON public.checkout_payment_methods (created_at);

-- ============================================================================
-- 4. checkout_payment_attempts — MODELLED payment lifecycle (no Stripe call)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.checkout_payment_attempts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  checkout_session_id uuid NOT NULL REFERENCES public.checkout_sessions(id) ON DELETE CASCADE,
  payment_method_id   uuid REFERENCES public.checkout_payment_methods(id) ON DELETE SET NULL,
  amount_pence        bigint NOT NULL DEFAULT 0 CHECK (amount_pence >= 0),
  currency            text NOT NULL DEFAULT 'GBP',
  -- Whether funds are HELD in escrow (service/emergency) vs captured (booking).
  escrow              boolean NOT NULL DEFAULT false,
  capture_method      text NOT NULL DEFAULT 'manual'
                        CHECK (capture_method IN ('automatic','manual')),
  -- Lifecycle starts unfunded; ONLY a real webhook advances it.
  status              text NOT NULL DEFAULT 'requires_payment'
                        CHECK (status IN (
                          'requires_payment','authorized','held','captured','released',
                          'refunded','failed','cancelled')),
  -- Loose link to the eventual escrow_payments row (set by the webhook layer).
  escrow_payment_id   uuid,
  failure_reason      text,
  metadata_json       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by          uuid,
  archived_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checkout_pa_workspace ON public.checkout_payment_attempts (workspace_id);
CREATE INDEX IF NOT EXISTS idx_checkout_pa_session   ON public.checkout_payment_attempts (checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_checkout_pa_status    ON public.checkout_payment_attempts (status);
CREATE INDEX IF NOT EXISTS idx_checkout_pa_created   ON public.checkout_payment_attempts (created_at);

-- ============================================================================
-- 5. checkout_price_breakdowns — one snapshot row per session (the maths)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.checkout_price_breakdowns (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  checkout_session_id   uuid NOT NULL REFERENCES public.checkout_sessions(id) ON DELETE CASCADE,
  subtotal_pence        bigint NOT NULL DEFAULT 0,
  cleaning_fee_pence    bigint NOT NULL DEFAULT 0,
  service_fee_pence     bigint NOT NULL DEFAULT 0,
  platform_fee_pence    bigint NOT NULL DEFAULT 0,
  vat_pence             bigint NOT NULL DEFAULT 0,
  vat_rate_bps          integer NOT NULL DEFAULT 2000,   -- 20.00% in basis points
  discount_pence        bigint NOT NULL DEFAULT 0,
  deposit_hold_pence    bigint NOT NULL DEFAULT 0,        -- refundable damage / escrow hold
  total_due_now_pence   bigint NOT NULL DEFAULT 0,
  total_full_pence      bigint NOT NULL DEFAULT 0,        -- total trip / estimated total
  estimate_low_pence    bigint,                           -- emergency / quote ranges
  estimate_high_pence   bigint,
  currency              text NOT NULL DEFAULT 'GBP',
  promo_code            text,
  status                text NOT NULL DEFAULT 'active',
  metadata_json         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by            uuid,
  archived_at           timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checkout_pb_workspace ON public.checkout_price_breakdowns (workspace_id);
CREATE INDEX IF NOT EXISTS idx_checkout_pb_session   ON public.checkout_price_breakdowns (checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_checkout_pb_status    ON public.checkout_price_breakdowns (status);
CREATE INDEX IF NOT EXISTS idx_checkout_pb_created   ON public.checkout_price_breakdowns (created_at);

-- ============================================================================
-- 6. checkout_guest_details — booking guest / contact / billing details
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.checkout_guest_details (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  checkout_session_id uuid NOT NULL REFERENCES public.checkout_sessions(id) ON DELETE CASCADE,
  full_name           text,
  email               text,
  phone               text,
  guests_count        integer DEFAULT 1,
  check_in            date,
  check_out           date,
  arrival_notes       text,
  special_requests    text,
  billing_same_as_contact boolean NOT NULL DEFAULT true,
  billing_line1       text,
  billing_line2       text,
  billing_city        text,
  billing_postcode    text,
  billing_country     text,
  status              text NOT NULL DEFAULT 'active',
  metadata_json       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by          uuid,
  archived_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checkout_guest_workspace ON public.checkout_guest_details (workspace_id);
CREATE INDEX IF NOT EXISTS idx_checkout_guest_session   ON public.checkout_guest_details (checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_checkout_guest_status    ON public.checkout_guest_details (status);
CREATE INDEX IF NOT EXISTS idx_checkout_guest_created   ON public.checkout_guest_details (created_at);

-- ============================================================================
-- 7. checkout_service_details — instant-pay service order context
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.checkout_service_details (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  checkout_session_id uuid NOT NULL REFERENCES public.checkout_sessions(id) ON DELETE CASCADE,
  supplier_name       text,
  service_name        text,
  service_scope       text,
  appointment_at      timestamptz,
  property_address    text,
  access_details      text,
  contact_name        text,
  contact_phone       text,
  service_notes       text,
  appointment_confirmed boolean NOT NULL DEFAULT false,
  status              text NOT NULL DEFAULT 'active',
  metadata_json       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by          uuid,
  archived_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checkout_service_workspace ON public.checkout_service_details (workspace_id);
CREATE INDEX IF NOT EXISTS idx_checkout_service_session   ON public.checkout_service_details (checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_checkout_service_status    ON public.checkout_service_details (status);
CREATE INDEX IF NOT EXISTS idx_checkout_service_created   ON public.checkout_service_details (created_at);

-- ============================================================================
-- 8. checkout_emergency_details — emergency dispatch context
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.checkout_emergency_details (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  checkout_session_id uuid NOT NULL REFERENCES public.checkout_sessions(id) ON DELETE CASCADE,
  provider_name       text,
  response_time_label text,
  coverage_area       text,
  property_address    text,
  issue_details       text,
  access_notes        text,
  live_phone          text,
  emergency_contact   text,
  -- 'call' | 'text' | 'whatsapp'
  preferred_contact   text NOT NULL DEFAULT 'call'
                        CHECK (preferred_contact IN ('call','text','whatsapp')),
  -- Acceptance-window countdown target; on timeout the next provider is tried.
  acceptance_deadline timestamptz,
  -- 'request_sent' | 'provider_accepted' | 'en_route' | 'on_site' | 'completed'
  dispatch_stage      text NOT NULL DEFAULT 'request_sent'
                        CHECK (dispatch_stage IN ('request_sent','provider_accepted','en_route','on_site','completed')),
  status              text NOT NULL DEFAULT 'active',
  metadata_json       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by          uuid,
  archived_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checkout_emergency_workspace ON public.checkout_emergency_details (workspace_id);
CREATE INDEX IF NOT EXISTS idx_checkout_emergency_session   ON public.checkout_emergency_details (checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_checkout_emergency_status    ON public.checkout_emergency_details (status);
CREATE INDEX IF NOT EXISTS idx_checkout_emergency_created   ON public.checkout_emergency_details (created_at);

-- ============================================================================
-- 9. checkout_quote_request_details — RFQ context (no payment)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.checkout_quote_request_details (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  checkout_session_id uuid NOT NULL REFERENCES public.checkout_sessions(id) ON DELETE CASCADE,
  supplier_name       text,
  service_type        text,
  service_description text,
  property_address    text,
  preferred_date      date,
  preferred_time      text,
  flexibility         text,
  budget_low_pence    bigint,
  budget_high_pence   bigint,
  -- 'flexible' | 'soon' | 'urgent'
  urgency             text NOT NULL DEFAULT 'flexible'
                        CHECK (urgency IN ('flexible','soon','urgent')),
  contact_name        text,
  contact_email       text,
  contact_phone       text,
  message             text,
  -- 'none' | 'virtual' | 'on_site'
  site_visit          text NOT NULL DEFAULT 'none'
                        CHECK (site_visit IN ('none','virtual','on_site')),
  status              text NOT NULL DEFAULT 'active',
  metadata_json       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by          uuid,
  archived_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checkout_rfq_workspace ON public.checkout_quote_request_details (workspace_id);
CREATE INDEX IF NOT EXISTS idx_checkout_rfq_session   ON public.checkout_quote_request_details (checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_checkout_rfq_status    ON public.checkout_quote_request_details (status);
CREATE INDEX IF NOT EXISTS idx_checkout_rfq_created   ON public.checkout_quote_request_details (created_at);

-- ============================================================================
-- 10. checkout_audit_events — append-style audit trail of funnel events
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.checkout_audit_events (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  checkout_session_id uuid NOT NULL REFERENCES public.checkout_sessions(id) ON DELETE CASCADE,
  event_type          text NOT NULL,   -- e.g. 'session_created','promo_applied','payment_attempted','confirmed'
  detail              text,
  status              text NOT NULL DEFAULT 'active',
  metadata_json       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by          uuid,
  archived_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checkout_audit_workspace ON public.checkout_audit_events (workspace_id);
CREATE INDEX IF NOT EXISTS idx_checkout_audit_session   ON public.checkout_audit_events (checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_checkout_audit_status    ON public.checkout_audit_events (status);
CREATE INDEX IF NOT EXISTS idx_checkout_audit_created   ON public.checkout_audit_events (created_at);

-- ============================================================================
-- updated_at triggers
-- ============================================================================
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'checkout_sessions','checkout_line_items','checkout_payment_methods',
    'checkout_payment_attempts','checkout_price_breakdowns','checkout_guest_details',
    'checkout_service_details','checkout_emergency_details',
    'checkout_quote_request_details','checkout_audit_events'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_touch ON public.%I;', t, t);
    EXECUTE format(
      'CREATE TRIGGER trg_%s_touch BEFORE UPDATE ON public.%I '
      'FOR EACH ROW EXECUTE FUNCTION public.checkout_touch_updated_at();', t, t);
  END LOOP;
END $$;

-- ============================================================================
-- RLS — ENABLE on every table.
--
-- AUTHED door: workspace members reach rows via the REAL
--   public.workspace_members(workspace_id,user_id) table (exact EXISTS pattern
--   from 20260616090000_payments_escrow.sql). Child tables also have their own
--   workspace_id so the policy is direct.
--
-- PUBLIC guest door: anonymous guests present a session token; the public route
--   reads with the anon key after setting
--   current_setting('request.checkout_session_token', true) to the SHA-256 hash
--   of their token. A row is reachable ONLY when that setting matches the
--   parent session's session_token_hash. No raw token is ever stored.
--   Writes by the guest happen via service-role server routes (RLS-bypassing),
--   so there is NO anon INSERT/UPDATE policy — fail-closed.
-- ============================================================================
ALTER TABLE public.checkout_sessions               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_line_items             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_payment_methods        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_payment_attempts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_price_breakdowns       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_guest_details          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_service_details        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_emergency_details      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_quote_request_details  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_audit_events           ENABLE ROW LEVEL SECURITY;

-- ── checkout_sessions: authed members + public token-scoped SELECT ──────────
DROP POLICY IF EXISTS checkout_sessions_ws_member ON public.checkout_sessions;
CREATE POLICY checkout_sessions_ws_member ON public.checkout_sessions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm
                 WHERE wm.workspace_id = checkout_sessions.workspace_id AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm
                 WHERE wm.workspace_id = checkout_sessions.workspace_id AND wm.user_id = auth.uid()));

DROP POLICY IF EXISTS checkout_sessions_public_token ON public.checkout_sessions;
CREATE POLICY checkout_sessions_public_token ON public.checkout_sessions FOR SELECT
  USING (
    session_token_hash IS NOT NULL
    AND session_token_hash = current_setting('request.checkout_session_token', true)
  );

-- ── Child tables: authed members (direct workspace_id) + public via parent ──
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'checkout_line_items','checkout_payment_methods','checkout_payment_attempts',
    'checkout_price_breakdowns','checkout_guest_details','checkout_service_details',
    'checkout_emergency_details','checkout_quote_request_details','checkout_audit_events'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_ws_member ON public.%I;', t, t);
    EXECUTE format(
      'CREATE POLICY %I_ws_member ON public.%I FOR ALL '
      'USING (EXISTS (SELECT 1 FROM public.workspace_members wm '
      '               WHERE wm.workspace_id = %I.workspace_id AND wm.user_id = auth.uid())) '
      'WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm '
      '               WHERE wm.workspace_id = %I.workspace_id AND wm.user_id = auth.uid()));',
      t, t, t, t);

    EXECUTE format('DROP POLICY IF EXISTS %I_public_token ON public.%I;', t, t);
    EXECUTE format(
      'CREATE POLICY %I_public_token ON public.%I FOR SELECT '
      'USING (EXISTS (SELECT 1 FROM public.checkout_sessions s '
      '               WHERE s.id = %I.checkout_session_id '
      '                 AND s.session_token_hash IS NOT NULL '
      '                 AND s.session_token_hash = current_setting(''request.checkout_session_token'', true)));',
      t, t, t);
  END LOOP;
END $$;

-- ============================================================================
-- Public session-scoped VIEW — exposes ONLY the safe, token-matched session
-- summary fields to the anon guest (never the workspace internals). Backed by
-- the RLS above, so it is doubly fail-closed.
-- ============================================================================
CREATE OR REPLACE VIEW public.checkout_session_public AS
  SELECT id, checkout_type, status, currency, total_due_now_pence,
         contact_email, expires_at, created_at, updated_at
  FROM public.checkout_sessions;

-- security_invoker so the view honours the querying role's RLS (the public
-- token policy), not the view owner's.
ALTER VIEW public.checkout_session_public SET (security_invoker = on);

GRANT SELECT ON public.checkout_session_public TO anon, authenticated;

-- ============================================================================
-- Storage note (no SQL object created here — bucket lives in storage schema):
-- Checkout uploads are upload-only and stored under
--   workspaces/{workspaceId}/checkout/{sessionId}/uploads/
-- via the existing workspace storage bucket + signed-URL pattern. No public
-- read; previews use short-lived signed URLs from server routes.
-- ============================================================================
