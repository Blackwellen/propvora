-- ============================================================
-- 20260616080000_booking_reservations.sql
--
-- Propvora v2 — P4 Booking: RESERVATION ENGINE + BOOKING DATA MODEL.
--
-- Builds the direct-booking reservation kernel ON TOP of the P2 marketplace
-- substrate (marketplace_listings with transaction_type='stay_booking',
-- base_price_pence, currency, workspace_id) and the P1 fee engine
-- (marketplace_fee_rules / src/lib/marketplace/fees.ts). Everything is integer
-- pence. Operator reads/writes are workspace-scoped via RLS keyed on
-- workspace_members (the codebase membership pattern).
--
-- DESIGN CHOICE — single table, no separate booking_holds:
--   We keep a SINGLE `bookings` table and model a hold as status='hold' +
--   hold_expires_at. This avoids a second-table reconciliation step when a hold
--   converts to a confirmed booking (no row move) and keeps availability/overlap
--   logic against ONE source of truth. `expireStaleHolds` simply flips stale
--   'hold' rows to 'cancelled'.
--
-- ANONYMOUS GUEST CHECKOUT — the security model:
--   Public guests are UNAUTHENTICATED (anon role) and must be able to place a
--   reservation hold WITHOUT any service-role key in the browser. We therefore:
--     (1) DO NOT grant anon INSERT on `bookings` directly. RLS on `bookings`
--         only ever admits workspace members (operators). The anon role has no
--         table-level INSERT policy, so a raw client insert is rejected.
--     (2) Expose ONE SECURITY DEFINER function `create_public_reservation(...)`
--         that runs as the table owner, bypassing RLS, but with TIGHT internal
--         validation:
--           - listing must exist, be status='published' AND
--             transaction_type='stay_booking';
--           - check_out > check_in, check_in >= today, nights within 1..370;
--           - guests_count >= 1;
--           - the requested range must be FREE (no overlapping non-cancelled
--             booking, no blocked date);
--           - the PRICE IS RECOMPUTED SERVER-SIDE from the active rate plan (or
--             the listing base price) — the client NEVER sends a price.
--         It inserts a status='hold' row with a short hold_expires_at and returns
--         the new booking id + computed totals. EXECUTE is granted to anon (and
--         authenticated). This is the ONLY anon write path.
--   Operators see only their workspace's bookings via the workspace-member RLS
--   policy; guests get nothing back from the table directly (no anon SELECT).
--
-- Idempotent: IF NOT EXISTS + guarded DROP/CREATE throughout; safe to re-run.
-- Reconciles additively if a table already exists.
-- Apply: node scripts/_apply_migration.mjs supabase/migrations/20260616080000_booking_reservations.sql
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 0. Helper: updated_at touch (reuse marketplace touch if present)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.booking_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ────────────────────────────────────────────────────────────
-- 1. bookings — the reservation record (hold → confirmed → completed).
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bookings (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id          uuid NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  workspace_id        uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  property_id         uuid,
  guest_name          text NOT NULL,
  guest_email         text NOT NULL,
  guest_phone         text,
  check_in            date NOT NULL,
  check_out           date NOT NULL,
  nights              int  NOT NULL,
  guests_count        int  NOT NULL DEFAULT 1,
  currency            text NOT NULL DEFAULT 'GBP',
  subtotal_pence      bigint NOT NULL DEFAULT 0,
  fees_pence          bigint NOT NULL DEFAULT 0,
  total_pence         bigint NOT NULL DEFAULT 0,
  platform_fee_pence  bigint NOT NULL DEFAULT 0,
  status              text NOT NULL DEFAULT 'hold'
                        CHECK (status IN ('hold','pending_payment','confirmed','cancelled','completed','no_show')),
  transaction_id      uuid REFERENCES public.marketplace_transactions(id) ON DELETE SET NULL,
  hold_expires_at     timestamptz,
  source              text NOT NULL DEFAULT 'direct',
  session_token       text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Additive reconciliation (safe if table already existed with an older shape).
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS property_id        uuid;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS guest_phone        text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS guests_count       int NOT NULL DEFAULT 1;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS currency           text NOT NULL DEFAULT 'GBP';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS fees_pence         bigint NOT NULL DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS platform_fee_pence bigint NOT NULL DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS transaction_id     uuid;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS hold_expires_at    timestamptz;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS source             text NOT NULL DEFAULT 'direct';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS session_token      text;

-- FK to properties (guard; properties exists live).
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='properties')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='bookings_property_fk') THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_property_fk
      FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE SET NULL;
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_bookings_touch ON public.bookings;
CREATE TRIGGER trg_bookings_touch
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.booking_touch_updated_at();

-- ────────────────────────────────────────────────────────────
-- 2. rate_plans — nightly rate plans per listing.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rate_plans (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id          uuid NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  name                text NOT NULL DEFAULT 'Standard',
  nightly_rate_pence  bigint NOT NULL,
  min_nights          int  NOT NULL DEFAULT 1,
  max_nights          int,
  weekend_uplift_pct  numeric,
  active              boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_rate_plans_touch ON public.rate_plans;
CREATE TRIGGER trg_rate_plans_touch
  BEFORE UPDATE ON public.rate_plans
  FOR EACH ROW EXECUTE FUNCTION public.booking_touch_updated_at();

-- ────────────────────────────────────────────────────────────
-- 3. booking_blocked_dates — explicit availability blocks per listing.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.booking_blocked_dates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  uuid NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  date        date NOT NULL,
  reason      text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_booking_blocked_dates_listing_date
  ON public.booking_blocked_dates(listing_id, date);

-- ────────────────────────────────────────────────────────────
-- 4. INDEXES
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bookings_listing   ON public.bookings(listing_id);
CREATE INDEX IF NOT EXISTS idx_bookings_ws        ON public.bookings(workspace_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status    ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_check_in  ON public.bookings(check_in);
CREATE INDEX IF NOT EXISTS idx_bookings_range     ON public.bookings(listing_id, check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_bookings_hold_exp  ON public.bookings(hold_expires_at) WHERE status = 'hold';
CREATE INDEX IF NOT EXISTS idx_rate_plans_listing ON public.rate_plans(listing_id);
CREATE INDEX IF NOT EXISTS idx_rate_plans_active  ON public.rate_plans(listing_id, active);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_listing ON public.booking_blocked_dates(listing_id);

-- ────────────────────────────────────────────────────────────
-- 5. RLS
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.bookings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_plans            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_blocked_dates ENABLE ROW LEVEL SECURITY;

-- 5a. bookings — workspace members manage their own workspace's bookings (ALL).
--     There is NO anon/public policy: the ONLY public write path is the
--     SECURITY DEFINER create_public_reservation() function (section 6), which
--     bypasses RLS as owner. Guests never read the bookings table directly.
DROP POLICY IF EXISTS bookings_ws_member ON public.bookings;
CREATE POLICY bookings_ws_member ON public.bookings FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = bookings.workspace_id AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = bookings.workspace_id AND wm.user_id = auth.uid()));

-- 5b. rate_plans — manage when member of the owning listing's workspace;
--     read when the parent listing is published (public checkout needs rates).
DROP POLICY IF EXISTS rate_plans_ws_member ON public.rate_plans;
CREATE POLICY rate_plans_ws_member ON public.rate_plans FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.marketplace_listings l
    JOIN public.workspace_members wm ON wm.workspace_id = l.workspace_id
    WHERE l.id = rate_plans.listing_id AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.marketplace_listings l
    JOIN public.workspace_members wm ON wm.workspace_id = l.workspace_id
    WHERE l.id = rate_plans.listing_id AND wm.user_id = auth.uid()));
DROP POLICY IF EXISTS rate_plans_published_read ON public.rate_plans;
CREATE POLICY rate_plans_published_read ON public.rate_plans FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.marketplace_listings l
    WHERE l.id = rate_plans.listing_id AND l.status = 'published'));

-- 5c. booking_blocked_dates — manage when member of owning workspace;
--     read when parent listing is published (checkout availability check).
DROP POLICY IF EXISTS blocked_dates_ws_member ON public.booking_blocked_dates;
CREATE POLICY blocked_dates_ws_member ON public.booking_blocked_dates FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.marketplace_listings l
    JOIN public.workspace_members wm ON wm.workspace_id = l.workspace_id
    WHERE l.id = booking_blocked_dates.listing_id AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.marketplace_listings l
    JOIN public.workspace_members wm ON wm.workspace_id = l.workspace_id
    WHERE l.id = booking_blocked_dates.listing_id AND wm.user_id = auth.uid()));
DROP POLICY IF EXISTS blocked_dates_published_read ON public.booking_blocked_dates;
CREATE POLICY blocked_dates_published_read ON public.booking_blocked_dates FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.marketplace_listings l
    WHERE l.id = booking_blocked_dates.listing_id AND l.status = 'published'));

-- ────────────────────────────────────────────────────────────
-- 6. create_public_reservation — SECURITY DEFINER anon hold creator.
--
--    Runs as the function owner (bypasses RLS). Validates everything and
--    RECOMPUTES the price server-side. Never trusts a client-sent amount.
--    Returns the new booking id + computed money + hold expiry.
--
--    Platform fee here is left at 0 in the row; the commercial fee (via
--    src/lib/marketplace/fees.ts, transactionType='stay_booking') is attached
--    when the hold converts to a marketplace_transaction at payment time
--    (owned by a sibling agent). We still expose total = subtotal here.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_public_reservation(
  p_listing_id    uuid,
  p_check_in      date,
  p_check_out     date,
  p_guests_count  int,
  p_guest_name    text,
  p_guest_email   text,
  p_guest_phone   text DEFAULT NULL,
  p_session_token text DEFAULT NULL,
  p_hold_minutes  int  DEFAULT 30
)
RETURNS TABLE (
  booking_id      uuid,
  nights          int,
  subtotal_pence  bigint,
  total_pence     bigint,
  currency        text,
  status          text,
  hold_expires_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_listing        public.marketplace_listings%ROWTYPE;
  v_nights         int;
  v_nightly        bigint;
  v_weekend_uplift numeric;
  v_min_nights     int := 1;
  v_max_nights     int := NULL;
  v_subtotal       bigint := 0;
  v_currency       text;
  v_hold_minutes   int;
  v_expires        timestamptz;
  v_booking_id     uuid;
  d                date;
  v_dow            int;
BEGIN
  -- ---- basic input validation -------------------------------------------
  IF p_listing_id IS NULL THEN
    RAISE EXCEPTION 'listing_id is required' USING ERRCODE = 'check_violation';
  END IF;
  IF p_check_in IS NULL OR p_check_out IS NULL OR p_check_out <= p_check_in THEN
    RAISE EXCEPTION 'check_out must be after check_in' USING ERRCODE = 'check_violation';
  END IF;
  IF p_check_in < current_date THEN
    RAISE EXCEPTION 'check_in cannot be in the past' USING ERRCODE = 'check_violation';
  END IF;
  IF coalesce(p_guests_count, 0) < 1 THEN
    RAISE EXCEPTION 'guests_count must be at least 1' USING ERRCODE = 'check_violation';
  END IF;
  IF p_guest_name IS NULL OR length(trim(p_guest_name)) = 0
     OR p_guest_email IS NULL OR p_guest_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'a valid guest name and email are required' USING ERRCODE = 'check_violation';
  END IF;

  v_nights := (p_check_out - p_check_in);
  IF v_nights < 1 OR v_nights > 370 THEN
    RAISE EXCEPTION 'stay length out of range' USING ERRCODE = 'check_violation';
  END IF;

  -- ---- listing must exist, be published, and be a stay listing ----------
  SELECT * INTO v_listing FROM public.marketplace_listings WHERE id = p_listing_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'listing not found' USING ERRCODE = 'no_data_found';
  END IF;
  IF v_listing.status <> 'published'
     OR coalesce(v_listing.transaction_type, '') <> 'stay_booking' THEN
    RAISE EXCEPTION 'listing is not open for booking' USING ERRCODE = 'check_violation';
  END IF;

  v_currency := coalesce(v_listing.currency, 'GBP');

  -- ---- resolve nightly rate from the active rate plan, else base price --
  SELECT nightly_rate_pence, weekend_uplift_pct, min_nights, max_nights
    INTO v_nightly, v_weekend_uplift, v_min_nights, v_max_nights
  FROM public.rate_plans
  WHERE listing_id = p_listing_id AND active = true
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_nightly IS NULL THEN
    v_nightly := v_listing.base_price_pence;
    v_min_nights := 1;
    v_max_nights := NULL;
    v_weekend_uplift := NULL;
  END IF;

  IF v_nightly IS NULL OR v_nightly <= 0 THEN
    RAISE EXCEPTION 'listing has no bookable rate' USING ERRCODE = 'check_violation';
  END IF;

  -- enforce min/max nights from the rate plan
  IF v_nights < coalesce(v_min_nights, 1) THEN
    RAISE EXCEPTION 'minimum stay is % nights', coalesce(v_min_nights, 1) USING ERRCODE = 'check_violation';
  END IF;
  IF v_max_nights IS NOT NULL AND v_nights > v_max_nights THEN
    RAISE EXCEPTION 'maximum stay is % nights', v_max_nights USING ERRCODE = 'check_violation';
  END IF;

  -- ---- recompute the price server-side (per-night, weekend uplift) ------
  -- Fri (dow 5) and Sat (dow 6) nights get the uplift when configured.
  d := p_check_in;
  WHILE d < p_check_out LOOP
    v_dow := EXTRACT(dow FROM d);  -- 0=Sun .. 6=Sat
    IF v_weekend_uplift IS NOT NULL AND v_weekend_uplift > 0 AND (v_dow = 5 OR v_dow = 6) THEN
      v_subtotal := v_subtotal + round(v_nightly * (1 + v_weekend_uplift / 100.0));
    ELSE
      v_subtotal := v_subtotal + v_nightly;
    END IF;
    d := d + 1;
  END LOOP;

  -- ---- availability: no overlapping live booking, no blocked date -------
  -- Overlap rule (half-open ranges): existing.check_in < new.check_out
  --   AND existing.check_out > new.check_in, for non-cancelled bookings.
  IF EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.listing_id = p_listing_id
      AND b.status NOT IN ('cancelled','no_show')
      AND b.check_in  < p_check_out
      AND b.check_out > p_check_in
      -- ignore our own expired holds
      AND NOT (b.status = 'hold' AND b.hold_expires_at IS NOT NULL AND b.hold_expires_at < now())
  ) THEN
    RAISE EXCEPTION 'those dates are no longer available' USING ERRCODE = 'check_violation';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.booking_blocked_dates bd
    WHERE bd.listing_id = p_listing_id
      AND bd.date >= p_check_in
      AND bd.date <  p_check_out
  ) THEN
    RAISE EXCEPTION 'those dates are blocked' USING ERRCODE = 'check_violation';
  END IF;

  -- ---- insert the hold ---------------------------------------------------
  v_hold_minutes := greatest(5, least(coalesce(p_hold_minutes, 30), 120));
  v_expires := now() + make_interval(mins => v_hold_minutes);

  INSERT INTO public.bookings (
    listing_id, workspace_id, property_id, guest_name, guest_email, guest_phone,
    check_in, check_out, nights, guests_count, currency,
    subtotal_pence, fees_pence, total_pence, platform_fee_pence,
    status, hold_expires_at, source, session_token
  ) VALUES (
    p_listing_id, v_listing.workspace_id, v_listing.property_id,
    trim(p_guest_name), lower(trim(p_guest_email)), p_guest_phone,
    p_check_in, p_check_out, v_nights, p_guests_count, v_currency,
    v_subtotal, 0, v_subtotal, 0,
    'hold', v_expires, 'direct', p_session_token
  )
  RETURNING id INTO v_booking_id;

  RETURN QUERY SELECT
    v_booking_id, v_nights, v_subtotal, v_subtotal, v_currency, 'hold'::text, v_expires;
END;
$$;

-- anon (unauthenticated public guest) + authenticated may call it; nothing else.
REVOKE ALL ON FUNCTION public.create_public_reservation(uuid, date, date, int, text, text, text, text, int) FROM public;
GRANT EXECUTE ON FUNCTION public.create_public_reservation(uuid, date, date, int, text, text, text, text, int) TO anon, authenticated;
