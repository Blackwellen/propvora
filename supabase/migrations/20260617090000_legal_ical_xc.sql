-- ─────────────────────────────────────────────────────────────────────────────
-- BOOKING/MARKETPLACE LEGAL FRAMEWORK  +  iCAL CHANNEL SYNC (Phase 1)
--
-- This migration is ADDITIVE + IDEMPOTENT (safe to re-run). It does three things:
--
--   1. LEGAL — per-listing legal configuration + a versioned, server-captured
--      acceptance audit. The pre-existing public.booking_legal_acceptances table
--      (booking_id, document_type, document_version, snapshot, ip, user_agent)
--      is the per-BOOKING acceptance log; this migration adds:
--        a) public.booking_listing_legal — per-LISTING legal config (which house
--           rules / cancellation / damage policy the host attached, plus the
--           required-document version set the guest must accept at checkout).
--        b) widens the booking_legal_acceptances RLS so an acceptance can also be
--           inserted by the SERVICE role at checkout (server-side capture) while
--           keeping workspace-member read. (No client INSERT policy — acceptances
--           are written server-side only, never frontend-only.)
--
--   2. iCAL CHANNEL SYNC — per-listing import/export connections + a sync-event
--      audit. Export is public-by-unguessable-token (dates only, no PII). Import
--      records an external URL whose parsed busy ranges block availability via the
--      EXISTING booking_availability_days.status = 'blocked_channel'.
--
--   3. RLS for both new tables (workspace-member scoped; export token lookup is
--      service-role only via the public route).
--
-- The single legal entity (Blackwellen Ltd t/a Propvora) lives in
-- src/lib/legal/company.ts; the booking-policy registry + versions live in
-- src/lib/legal/booking-policies.ts and mirror booking_legal_documents below.
-- ─────────────────────────────────────────────────────────────────────────────

-- ═══════════════════════════════════════════════════════════════════════════
-- 1a. BOOKING LEGAL DOCUMENT REGISTRY (server-side mirror of the app registry)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.booking_legal_documents (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           text NOT NULL UNIQUE,
  title          text NOT NULL,
  audience       text NOT NULL DEFAULT 'guest'
                   CHECK (audience IN ('guest', 'host', 'both')),
  version        text NOT NULL,
  jurisdiction   text NOT NULL DEFAULT 'GB',
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 1b. PER-LISTING LEGAL CONFIG
--     One row per booking_listing. Holds the host-selected policy choices and a
--     snapshot of the required-document versions a guest must accept to book.
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.booking_listing_legal (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id            uuid NOT NULL REFERENCES public.booking_listings(id) ON DELETE CASCADE,
  workspace_id          uuid NOT NULL,
  -- House rules / safety the host warrants are accurate (free text + structured).
  house_rules_text      text,
  safety_notes          text,
  -- Cancellation tier shown to the guest (mirrors booking_listings.cancellation_policy;
  -- duplicated here so the legal snapshot is self-contained at acceptance time).
  cancellation_tier     text NOT NULL DEFAULT 'flexible'
                          CHECK (cancellation_tier IN ('flexible','moderate','strict','non_refundable','custom')),
  -- Damage / security deposit policy.
  deposit_required      boolean NOT NULL DEFAULT false,
  deposit_amount_pence  bigint CHECK (deposit_amount_pence IS NULL OR deposit_amount_pence >= 0),
  deposit_policy_text   text,
  -- The set of document slugs (+ versions) a guest must accept to book THIS listing.
  required_documents    jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- The host's own acceptance of the host-side terms (payout/tax/accuracy/etc).
  host_terms_version    text,
  host_terms_accepted_at timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id)
);

CREATE INDEX IF NOT EXISTS booking_listing_legal_ws_idx
  ON public.booking_listing_legal (workspace_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2a. iCAL CONNECTIONS — per-listing import/export configuration
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.booking_ical_connections (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id         uuid NOT NULL REFERENCES public.booking_listings(id) ON DELETE CASCADE,
  workspace_id       uuid NOT NULL,
  -- 'export' = an outbound feed others subscribe to; 'import' = an external URL we pull.
  direction          text NOT NULL CHECK (direction IN ('import','export')),
  -- Free-label of the channel; purely informational (Airbnb / Booking / Vrbo / Google / Outlook / Other).
  channel            text NOT NULL DEFAULT 'other',
  -- For 'import': the external .ics URL we fetch.
  import_url         text,
  -- For 'export': the unguessable token that authorises the public feed (dates only).
  export_token       text UNIQUE,
  active             boolean NOT NULL DEFAULT true,
  last_synced_at     timestamptz,
  last_status        text,                       -- 'ok' | 'error' | null (never synced)
  last_error         text,
  last_event_count   integer NOT NULL DEFAULT 0,
  created_by         uuid,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  -- An import row must carry a URL; an export row must carry a token.
  CHECK ((direction = 'import' AND import_url IS NOT NULL)
      OR (direction = 'export' AND export_token IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS booking_ical_connections_listing_idx
  ON public.booking_ical_connections (listing_id);
CREATE INDEX IF NOT EXISTS booking_ical_connections_ws_idx
  ON public.booking_ical_connections (workspace_id);
-- Fast token lookup for the public export route.
CREATE UNIQUE INDEX IF NOT EXISTS booking_ical_connections_export_token_idx
  ON public.booking_ical_connections (export_token)
  WHERE export_token IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2b. iCAL SYNC EVENTS — append-only audit of every import/export run
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.booking_ical_sync_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id   uuid NOT NULL REFERENCES public.booking_ical_connections(id) ON DELETE CASCADE,
  listing_id      uuid NOT NULL,
  workspace_id    uuid NOT NULL,
  direction       text NOT NULL CHECK (direction IN ('import','export')),
  status          text NOT NULL CHECK (status IN ('ok','error','partial')),
  events_parsed   integer NOT NULL DEFAULT 0,
  days_blocked    integer NOT NULL DEFAULT 0,
  conflicts       integer NOT NULL DEFAULT 0,
  detail          jsonb NOT NULL DEFAULT '{}'::jsonb,   -- conflict ranges, error text, etc.
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS booking_ical_sync_events_conn_idx
  ON public.booking_ical_sync_events (connection_id, created_at DESC);
CREATE INDEX IF NOT EXISTS booking_ical_sync_events_ws_idx
  ON public.booking_ical_sync_events (workspace_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. RLS
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.booking_legal_documents    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_listing_legal       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_ical_connections    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_ical_sync_events     ENABLE ROW LEVEL SECURITY;

-- Registry: public reference (current versions shown on public legal pages).
DROP POLICY IF EXISTS bld_select_all ON public.booking_legal_documents;
CREATE POLICY bld_select_all ON public.booking_legal_documents
  FOR SELECT USING (true);

-- Per-listing legal config: workspace members manage their own.
DROP POLICY IF EXISTS bll_ws_member ON public.booking_listing_legal;
CREATE POLICY bll_ws_member ON public.booking_listing_legal
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm
                 WHERE wm.workspace_id = booking_listing_legal.workspace_id
                   AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm
                 WHERE wm.workspace_id = booking_listing_legal.workspace_id
                   AND wm.user_id = auth.uid()));

-- iCal connections: workspace members manage their listings' connections.
-- NOTE: the public EXPORT route reads by token via the SERVICE role (bypasses
-- RLS), so there is intentionally NO anon SELECT policy here — the token feed is
-- mediated by the route, which emits dates only.
DROP POLICY IF EXISTS bic_ws_member ON public.booking_ical_connections;
CREATE POLICY bic_ws_member ON public.booking_ical_connections
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm
                 WHERE wm.workspace_id = booking_ical_connections.workspace_id
                   AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm
                 WHERE wm.workspace_id = booking_ical_connections.workspace_id
                   AND wm.user_id = auth.uid()));

-- Sync events: workspace members READ their own audit. Writes are server-side
-- (service role) during a sync run, so no client INSERT policy is needed.
DROP POLICY IF EXISTS bise_ws_member_read ON public.booking_ical_sync_events;
CREATE POLICY bise_ws_member_read ON public.booking_ical_sync_events
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm
                 WHERE wm.workspace_id = booking_ical_sync_events.workspace_id
                   AND wm.user_id = auth.uid()));

-- Tighten the pre-existing booking_legal_acceptances: keep workspace-member
-- READ (already present), and DO NOT add a client INSERT policy. Acceptances are
-- captured server-side at checkout via the service role (which bypasses RLS), so
-- they can never be forged frontend-only. (Idempotent re-assert of the read.)
DROP POLICY IF EXISTS booking_legal_acceptances_ws_member ON public.booking_legal_acceptances;
CREATE POLICY booking_legal_acceptances_ws_member ON public.booking_legal_acceptances
  FOR SELECT
  USING (workspace_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = booking_legal_acceptances.workspace_id
      AND wm.user_id = auth.uid()));

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. SEED the booking/host legal document registry (idempotent upsert)
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO public.booking_legal_documents (slug, title, audience, version, jurisdiction, effective_from)
VALUES
  -- Guest / booking-facing
  ('booking-terms',              'Booking Terms',                        'guest', '2026-06-16', 'GB', DATE '2026-06-16'),
  ('guest-terms',                'Guest Terms',                          'guest', '2026-06-16', 'GB', DATE '2026-06-16'),
  ('direct-booking-terms',       'Direct Booking Terms',                 'guest', '2026-06-16', 'GB', DATE '2026-06-16'),
  ('booking-cancellation-policy','Booking Cancellation Policy',          'guest', '2026-06-16', 'GB', DATE '2026-06-16'),
  ('booking-refund-policy',      'Booking Refund Policy',                'guest', '2026-06-16', 'GB', DATE '2026-06-16'),
  ('damage-deposit-policy',      'Damage & Deposit Policy',              'both',  '2026-06-16', 'GB', DATE '2026-06-16'),
  ('house-rules-policy',         'House Rules Policy',                   'both',  '2026-06-16', 'GB', DATE '2026-06-16'),
  ('booking-payment-terms',      'Booking Payment Terms',                'guest', '2026-06-16', 'GB', DATE '2026-06-16'),
  ('guest-data-notice',          'Guest Data Processing Notice',         'guest', '2026-06-16', 'GB', DATE '2026-06-16'),
  ('safety-emergency-disclaimer','Safety & Emergency Disclaimer',        'both',  '2026-06-16', 'GB', DATE '2026-06-16'),
  ('booking-review-policy',      'Review Policy',                        'both',  '2026-06-16', 'GB', DATE '2026-06-16'),
  -- Host / property-manager-facing
  ('host-terms',                 'Host / Property Manager Terms',        'host',  '2026-06-16', 'GB', DATE '2026-06-16'),
  ('host-payout-terms',          'Host Payout Terms',                    'host',  '2026-06-16', 'GB', DATE '2026-06-16'),
  ('host-tax-disclaimer',        'Host Tax Disclaimer',                  'host',  '2026-06-16', 'GB', DATE '2026-06-16'),
  ('host-compliance-disclaimer', 'Local Compliance Disclaimer',          'host',  '2026-06-16', 'GB', DATE '2026-06-16'),
  ('listing-accuracy-warranty',  'Listing Accuracy Warranty',           'host',  '2026-06-16', 'GB', DATE '2026-06-16'),
  ('host-insurance-disclaimer',  'Insurance Disclaimer',                 'host',  '2026-06-16', 'GB', DATE '2026-06-16'),
  ('channel-sync-disclaimer',    'Channel Sync Disclaimer',             'host',  '2026-06-16', 'GB', DATE '2026-06-16'),
  ('booking-ai-disclaimer',      'AI Use Disclaimer',                    'both',  '2026-06-16', 'GB', DATE '2026-06-16')
ON CONFLICT (slug) DO UPDATE
  SET title          = EXCLUDED.title,
      audience       = EXCLUDED.audience,
      version        = EXCLUDED.version,
      jurisdiction   = EXCLUDED.jurisdiction,
      effective_from = EXCLUDED.effective_from,
      updated_at     = now();
