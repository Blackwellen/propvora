-- ============================================================================
-- 20260617040000_customer_booking.sql
--
-- PUBLIC direct-booking (/stay) + CUSTOMER/GUEST workspace substrate, layered on
-- the REAL booking_listings engine (20260617020000_booking_deep.sql). Adds:
--
--   1. booking_legal_acceptances  — server-captured acceptance of house rules,
--      cancellation policy, deposit terms and booking terms at checkout
--      (version + ip + ua + price snapshot). One row per acceptance event.
--   2. booking_guest_tokens       — magic-link guest portal access. A short ref
--      (human-quotable) plus an opaque token; resolved by ref+email OR token.
--   3. create_booking_listing_reservation(...) — the ONLY sanctioned anon write
--      path for a booking_listing checkout. SECURITY DEFINER. RECOMPUTES the
--      price server-side from booking_pricing_profiles + booking_price_rules +
--      booking_availability_days (mirrors src/lib/booking/pricing-engine.ts),
--      validates availability atomically, inserts the hold, records legal
--      acceptance, mints a guest token, and links the booking to a customer
--      workspace when the guest email matches a customer member.
--   4. booking_portal_lookup(...) / booking_portal_quote_cancel(...) — anon
--      SECURITY DEFINER reads/acts for the magic-link guest portal.
--   5. A customer-scoped SELECT policy on `bookings` so a signed-in customer can
--      read ONLY their own stays (customer_workspace membership OR jwt email).
--
-- Money is integer pence (bigint). Idempotent (IF NOT EXISTS / DROP ... IF
-- EXISTS). Half-open date ranges [check_in, check_out).
-- ============================================================================

-- ── 1. Bookings: columns the public/customer path needs (mostly already present
--       from booking_deep; guarded so re-apply is safe). ──────────────────────
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS booking_ref            text,
  ADD COLUMN IF NOT EXISTS deposit_pence          bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS guests_breakdown       jsonb  NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS arrival_time           text,
  ADD COLUMN IF NOT EXISTS guest_message          text,
  ADD COLUMN IF NOT EXISTS payment_status         text   NOT NULL DEFAULT 'unpaid';

-- A stable, human-quotable reference (e.g. PV-7Q2K9F). Backfilled for any
-- pre-existing rows, then enforced unique.
UPDATE public.bookings
   SET booking_ref = 'PV-' || upper(substr(replace(id::text, '-', ''), 1, 8))
 WHERE booking_ref IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS bookings_booking_ref_key ON public.bookings (booking_ref);
CREATE INDEX IF NOT EXISTS bookings_booking_listing_id_idx ON public.bookings (booking_listing_id);
CREATE INDEX IF NOT EXISTS bookings_customer_workspace_id_idx ON public.bookings (customer_workspace_id);
CREATE INDEX IF NOT EXISTS bookings_guest_email_idx ON public.bookings (lower(guest_email));

-- payment_status domain (text, evolvable): unpaid | deposit_paid | paid | refunded | partially_refunded
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bookings_payment_status_check'
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_payment_status_check
      CHECK (payment_status IN ('unpaid','deposit_paid','paid','refunded','partially_refunded'));
  END IF;
END $$;

-- ── 2. booking_legal_acceptances ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.booking_legal_acceptances (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id       uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  workspace_id     uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  document_type    text NOT NULL,        -- house_rules | cancellation | deposit | booking_terms | data_sharing
  document_version text,
  accepted         boolean NOT NULL DEFAULT true,
  snapshot         jsonb NOT NULL DEFAULT '{}'::jsonb,   -- price/policy text snapshot at acceptance
  ip               text,
  user_agent       text,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS booking_legal_acceptances_booking_idx
  ON public.booking_legal_acceptances (booking_id);

ALTER TABLE public.booking_legal_acceptances ENABLE ROW LEVEL SECURITY;

-- Operators read their own workspace's acceptances. No anon read (PII).
DROP POLICY IF EXISTS booking_legal_acceptances_ws_member ON public.booking_legal_acceptances;
CREATE POLICY booking_legal_acceptances_ws_member ON public.booking_legal_acceptances
  FOR SELECT USING (
    workspace_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = booking_legal_acceptances.workspace_id AND wm.user_id = auth.uid()
    )
  );

-- ── 3. booking_guest_tokens (magic-link portal access) ──────────────────────
CREATE TABLE IF NOT EXISTS public.booking_guest_tokens (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id    uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  token         text NOT NULL UNIQUE,        -- opaque, emailed
  guest_email   text NOT NULL,
  expires_at    timestamptz,                 -- null = no expiry (active for stay window)
  last_used_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS booking_guest_tokens_booking_idx ON public.booking_guest_tokens (booking_id);

ALTER TABLE public.booking_guest_tokens ENABLE ROW LEVEL SECURITY;
-- No anon/authenticated direct policy: tokens are only ever read via the
-- SECURITY DEFINER portal functions below. (RLS-enabled + no policy = deny all
-- direct access, which is exactly what we want.)

-- ── 4. create_booking_listing_reservation — anon SECURITY DEFINER write ──────
-- Recomputes the price from the deep pricing model (base → weekend → seasonal/
-- event rules → per-day override → length-of-stay → lead-time → fees + deposit),
-- mirroring src/lib/booking/pricing-engine.ts computeQuote(). Atomic availability
-- guard. Records legal acceptance + mints a guest token. NEVER trusts a client
-- price (none is accepted).
CREATE OR REPLACE FUNCTION public.create_booking_listing_reservation(
  p_listing_id        uuid,
  p_check_in          date,
  p_check_out         date,
  p_guests_count      integer,
  p_guest_name        text,
  p_guest_email       text,
  p_guest_phone       text    DEFAULT NULL,
  p_arrival_time      text    DEFAULT NULL,
  p_guest_message     text    DEFAULT NULL,
  p_accept_rules      boolean DEFAULT false,
  p_accept_cancel     boolean DEFAULT false,
  p_accept_deposit    boolean DEFAULT false,
  p_accept_terms      boolean DEFAULT false,
  p_ip                text    DEFAULT NULL,
  p_user_agent        text    DEFAULT NULL,
  p_hold_minutes      integer DEFAULT 30
)
RETURNS TABLE (
  booking_id        uuid,
  booking_ref       text,
  guest_token       text,
  nights            integer,
  subtotal_pence    bigint,
  deposit_pence     bigint,
  total_pence       bigint,
  currency          text,
  status            text,
  hold_expires_at   timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_listing      public.booking_listings%ROWTYPE;
  v_profile      public.booking_pricing_profiles%ROWTYPE;
  v_nights       int;
  v_currency     text;
  v_subtotal     bigint := 0;     -- nights subtotal (pre stay-level)
  v_charge       bigint := 0;     -- final charge subtotal
  v_deposit      bigint := 0;
  v_cleaning     bigint := 0;
  v_extra_guest  bigint := 0;
  v_length_disc  bigint := 0;
  v_lead_adj     bigint := 0;
  v_extra_guests int := 0;
  v_lead_days    int;
  v_hold_minutes int;
  v_expires      timestamptz;
  v_booking_id   uuid;
  v_ref          text;
  v_token        text;
  v_cust_ws      uuid;
  d              date;
  v_dow          int;
  v_price        bigint;
  v_override     bigint;
  r              record;
BEGIN
  -- ---- input validation --------------------------------------------------
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
  IF NOT (p_accept_rules AND p_accept_cancel AND p_accept_terms) THEN
    RAISE EXCEPTION 'house rules, cancellation policy and booking terms must be accepted'
      USING ERRCODE = 'check_violation';
  END IF;

  v_nights := (p_check_out - p_check_in);
  IF v_nights < 1 OR v_nights > 370 THEN
    RAISE EXCEPTION 'stay length out of range' USING ERRCODE = 'check_violation';
  END IF;

  -- ---- listing must exist + be published ---------------------------------
  SELECT * INTO v_listing FROM public.booking_listings WHERE id = p_listing_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'listing not found' USING ERRCODE = 'no_data_found';
  END IF;
  IF v_listing.status <> 'published' THEN
    RAISE EXCEPTION 'listing is not open for booking' USING ERRCODE = 'check_violation';
  END IF;
  IF p_guests_count > v_listing.max_guests THEN
    RAISE EXCEPTION 'this listing accommodates up to % guests', v_listing.max_guests
      USING ERRCODE = 'check_violation';
  END IF;

  v_currency := coalesce(v_listing.currency, 'GBP');

  -- ---- active pricing profile -------------------------------------------
  SELECT * INTO v_profile
  FROM public.booking_pricing_profiles
  WHERE listing_id = p_listing_id AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;
  IF NOT FOUND OR coalesce(v_profile.base_nightly_pence, 0) <= 0 THEN
    RAISE EXCEPTION 'this listing has no active pricing' USING ERRCODE = 'check_violation';
  END IF;
  v_currency := coalesce(v_profile.currency, v_currency);

  IF v_nights < coalesce(v_profile.min_nights, 1) THEN
    RAISE EXCEPTION 'minimum stay is % nights', coalesce(v_profile.min_nights, 1)
      USING ERRCODE = 'check_violation';
  END IF;
  IF v_profile.max_nights IS NOT NULL AND v_nights > v_profile.max_nights THEN
    RAISE EXCEPTION 'maximum stay is % nights', v_profile.max_nights
      USING ERRCODE = 'check_violation';
  END IF;

  -- ---- per-night price: base → weekend → seasonal/event rules → override --
  d := p_check_in;
  WHILE d < p_check_out LOOP
    v_dow := EXTRACT(dow FROM d);  -- 0=Sun .. 6=Sat
    v_price := v_profile.base_nightly_pence;
    IF v_profile.weekend_pence IS NOT NULL AND (v_dow = 5 OR v_dow = 6) THEN
      v_price := v_profile.weekend_pence;
    END IF;

    -- seasonal/event date rules (priority asc), applied in order
    FOR r IN
      SELECT adjust_kind, adjust_value
      FROM public.booking_price_rules
      WHERE listing_id = p_listing_id
        AND is_active = true
        AND rule_type IN ('seasonal','event')
        AND (date_from IS NULL OR d >= date_from)
        AND (date_to   IS NULL OR d <= date_to)
      ORDER BY priority ASC
    LOOP
      IF r.adjust_kind = 'pct' THEN
        v_price := round(v_price * (1 + r.adjust_value / 100.0));
      ELSIF r.adjust_kind = 'fixed_pence' THEN
        v_price := greatest(0, v_price + r.adjust_value::bigint);
      ELSIF r.adjust_kind = 'absolute_pence' THEN
        v_price := greatest(0, r.adjust_value::bigint);
      END IF;
    END LOOP;

    -- per-day override wins over everything
    SELECT price_override_pence INTO v_override
    FROM public.booking_availability_days
    WHERE listing_id = p_listing_id AND date = d AND price_override_pence IS NOT NULL;
    IF FOUND AND v_override IS NOT NULL THEN
      v_price := greatest(0, v_override);
    END IF;

    v_subtotal := v_subtotal + greatest(0, v_price);
    d := d + 1;
  END LOOP;

  -- ---- length-of-stay discount (monthly>=28 wins over weekly>=7) ----------
  IF v_nights >= 28 AND coalesce(v_profile.monthly_discount_pct, 0) > 0 THEN
    v_length_disc := round(v_subtotal * (v_profile.monthly_discount_pct / 100.0));
  ELSIF v_nights >= 7 AND coalesce(v_profile.weekly_discount_pct, 0) > 0 THEN
    v_length_disc := round(v_subtotal * (v_profile.weekly_discount_pct / 100.0));
  END IF;
  -- explicit length_of_stay rules add on top
  FOR r IN
    SELECT adjust_kind, adjust_value
    FROM public.booking_price_rules
    WHERE listing_id = p_listing_id AND is_active = true AND rule_type = 'length_of_stay'
      AND (nights_min IS NULL OR v_nights >= nights_min)
      AND (nights_max IS NULL OR v_nights <= nights_max)
  LOOP
    IF r.adjust_kind = 'pct' THEN
      v_length_disc := v_length_disc + round(v_subtotal * (abs(r.adjust_value) / 100.0));
    ELSE
      v_length_disc := v_length_disc + abs(round(r.adjust_value))::bigint;
    END IF;
  END LOOP;

  -- ---- lead-time adjustment (last_minute / early_bird), on nights net -----
  v_lead_days := (p_check_in - current_date);
  FOR r IN
    SELECT adjust_kind, adjust_value
    FROM public.booking_price_rules
    WHERE listing_id = p_listing_id AND is_active = true
      AND rule_type IN ('last_minute','early_bird')
      AND (days_before_min IS NULL OR v_lead_days >= days_before_min)
      AND (days_before_max IS NULL OR v_lead_days <= days_before_max)
    ORDER BY priority ASC
  LOOP
    IF r.adjust_kind = 'pct' THEN
      v_lead_adj := v_lead_adj + round((v_subtotal - v_length_disc) * (r.adjust_value / 100.0));
    ELSE
      v_lead_adj := v_lead_adj + round(r.adjust_value)::bigint;
    END IF;
  END LOOP;

  -- ---- fees + deposit ----------------------------------------------------
  v_cleaning := greatest(0, coalesce(v_profile.cleaning_fee_pence, 0));
  v_extra_guests := greatest(0, p_guests_count - greatest(1, coalesce(v_profile.extra_guest_after, 2)));
  v_extra_guest := greatest(0, coalesce(v_profile.extra_guest_fee_pence, 0)) * v_extra_guests;
  v_deposit := greatest(0, coalesce(v_profile.security_deposit_pence, 0));

  v_charge := greatest(0, v_subtotal - v_length_disc + v_lead_adj + v_cleaning + v_extra_guest);

  -- ---- availability guard (atomic): no overlap, no per-day block ----------
  IF EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE (b.booking_listing_id = p_listing_id OR b.listing_id = p_listing_id)
      AND b.status NOT IN ('cancelled','no_show')
      AND b.check_in  < p_check_out
      AND b.check_out > p_check_in
      AND NOT (b.status = 'hold' AND b.hold_expires_at IS NOT NULL AND b.hold_expires_at < now())
  ) THEN
    RAISE EXCEPTION 'those dates are no longer available' USING ERRCODE = 'check_violation';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.booking_availability_days ad
    WHERE ad.listing_id = p_listing_id
      AND ad.date >= p_check_in AND ad.date < p_check_out
      AND ad.status <> 'available'
  ) THEN
    RAISE EXCEPTION 'those dates are not available' USING ERRCODE = 'check_violation';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.booking_blocked_dates bd
    WHERE bd.listing_id = p_listing_id
      AND bd.date >= p_check_in AND bd.date < p_check_out
  ) THEN
    RAISE EXCEPTION 'those dates are blocked' USING ERRCODE = 'check_violation';
  END IF;

  -- ---- link to a customer workspace if the email matches a customer member-
  SELECT cwm.workspace_id INTO v_cust_ws
  FROM public.customer_workspace_members cwm
  JOIN auth.users u ON u.id = cwm.user_id
  WHERE lower(u.email) = lower(trim(p_guest_email))
  LIMIT 1;

  -- ---- insert the hold ---------------------------------------------------
  v_hold_minutes := greatest(5, least(coalesce(p_hold_minutes, 30), 120));
  v_expires := now() + make_interval(mins => v_hold_minutes);
  v_ref := 'PV-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  -- Opaque token from two UUIDs (avoids a pgcrypto/gen_random_bytes dependency
  -- that may not be on the function search_path).
  v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');

  INSERT INTO public.bookings (
    listing_id, booking_listing_id, workspace_id, property_id, customer_workspace_id,
    guest_name, guest_email, guest_phone, arrival_time, guest_message,
    check_in, check_out, nights, guests_count, currency,
    subtotal_pence, fees_pence, total_pence, platform_fee_pence, deposit_pence,
    status, payment_status, hold_expires_at, source, booking_ref
  ) VALUES (
    NULL, p_listing_id, v_listing.workspace_id, v_listing.property_id, v_cust_ws,
    trim(p_guest_name), lower(trim(p_guest_email)), p_guest_phone, p_arrival_time, p_guest_message,
    p_check_in, p_check_out, v_nights, p_guests_count, v_currency,
    v_charge, (v_cleaning + v_extra_guest), v_charge, 0, v_deposit,
    'pending_payment', 'unpaid', v_expires, 'direct', v_ref
  )
  RETURNING id INTO v_booking_id;

  -- ---- record legal acceptance (one row per document) --------------------
  INSERT INTO public.booking_legal_acceptances (booking_id, workspace_id, document_type, accepted, snapshot, ip, user_agent)
  VALUES
    (v_booking_id, v_listing.workspace_id, 'house_rules',  p_accept_rules,
      jsonb_build_object('policy', v_listing.cancellation_policy), p_ip, p_user_agent),
    (v_booking_id, v_listing.workspace_id, 'cancellation', p_accept_cancel,
      jsonb_build_object('policy', v_listing.cancellation_policy), p_ip, p_user_agent),
    (v_booking_id, v_listing.workspace_id, 'deposit',      p_accept_deposit,
      jsonb_build_object('deposit_pence', v_deposit), p_ip, p_user_agent),
    (v_booking_id, v_listing.workspace_id, 'booking_terms', p_accept_terms,
      jsonb_build_object('subtotal_pence', v_charge, 'currency', v_currency, 'nights', v_nights),
      p_ip, p_user_agent);

  -- ---- mark the held nights on the availability grid (anon-readable) ------
  -- This is what disables the dates in the public calendar. The `bookings`
  -- overlap check above remains the authoritative atomic guard; this keeps the
  -- anon-visible grid in sync (anon has no SELECT on `bookings`). Existing rows
  -- in the window are flipped to 'hold' and tagged with this booking; days with
  -- no row get one inserted.
  UPDATE public.booking_availability_days ad
     SET status = 'hold', booking_id = v_booking_id
   WHERE ad.listing_id = p_listing_id
     AND ad.date >= p_check_in AND ad.date < p_check_out
     AND ad.status = 'available';
  INSERT INTO public.booking_availability_days (listing_id, date, status, booking_id)
  SELECT p_listing_id, gs::date, 'hold', v_booking_id
  FROM generate_series(p_check_in, p_check_out - 1, interval '1 day') gs
  ON CONFLICT (listing_id, date) DO NOTHING;

  -- ---- mint a guest portal token ----------------------------------------
  INSERT INTO public.booking_guest_tokens (booking_id, token, guest_email, expires_at)
  VALUES (v_booking_id, v_token, lower(trim(p_guest_email)), p_check_out + 30);

  RETURN QUERY SELECT
    v_booking_id, v_ref, v_token, v_nights,
    v_charge, v_deposit, v_charge, v_currency, 'pending_payment'::text, v_expires;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_booking_listing_reservation(
  uuid, date, date, integer, text, text, text, text, text,
  boolean, boolean, boolean, boolean, text, text, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.create_booking_listing_reservation(
  uuid, date, date, integer, text, text, text, text, text,
  boolean, boolean, boolean, boolean, text, text, integer) TO anon, authenticated;

-- ── 5. booking_portal_lookup — anon guest portal read (ref+email OR token) ──
-- Returns a single safe trip projection. Never leaks across bookings: requires a
-- matching ref+email pair, or a valid token.
CREATE OR REPLACE FUNCTION public.booking_portal_lookup(
  p_ref    text DEFAULT NULL,
  p_email  text DEFAULT NULL,
  p_token  text DEFAULT NULL
)
RETURNS TABLE (
  booking_id      uuid,
  booking_ref     text,
  status          text,
  payment_status  text,
  guest_name      text,
  guest_email     text,
  check_in        date,
  check_out       date,
  nights          integer,
  guests_count    integer,
  currency        text,
  subtotal_pence  bigint,
  deposit_pence   bigint,
  total_pence     bigint,
  arrival_time    text,
  listing_title   text,
  listing_slug    text,
  listing_id      uuid,
  city            text,
  country         text,
  cancellation_policy text,
  check_in_window text,
  checkout_time   text,
  can_check_in    boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_booking_id uuid;
BEGIN
  IF p_token IS NOT NULL AND length(trim(p_token)) > 0 THEN
    SELECT t.booking_id INTO v_booking_id
    FROM public.booking_guest_tokens t
    WHERE t.token = trim(p_token)
      AND (t.expires_at IS NULL OR t.expires_at > now())
    LIMIT 1;
    IF v_booking_id IS NOT NULL THEN
      UPDATE public.booking_guest_tokens SET last_used_at = now() WHERE token = trim(p_token);
    END IF;
  ELSIF p_ref IS NOT NULL AND p_email IS NOT NULL THEN
    SELECT b.id INTO v_booking_id
    FROM public.bookings b
    WHERE b.booking_ref = trim(p_ref)
      AND lower(b.guest_email) = lower(trim(p_email))
    LIMIT 1;
  END IF;

  IF v_booking_id IS NULL THEN
    RETURN;  -- no row → portal shows "not found / check your details"
  END IF;

  RETURN QUERY
  SELECT
    b.id, b.booking_ref, b.status, b.payment_status, b.guest_name, b.guest_email,
    b.check_in, b.check_out, b.nights, b.guests_count, b.currency,
    b.subtotal_pence, b.deposit_pence, b.total_pence, b.arrival_time,
    coalesce(l.title, 'Your stay'), l.slug, l.id,
    p.city, p.country, coalesce(l.cancellation_policy, 'flexible'),
    l.check_in_window, l.checkout_time,
    -- safe check-in release: confirmed + paid (or deposit_paid) + within 2 days of arrival
    (b.status IN ('confirmed','checked_in')
      AND b.payment_status IN ('paid','deposit_paid')
      AND b.check_in <= current_date + 2)
  FROM public.bookings b
  LEFT JOIN public.booking_listings l ON l.id = b.booking_listing_id
  LEFT JOIN public.properties p ON p.id = b.property_id
  WHERE b.id = v_booking_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.booking_portal_lookup(text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.booking_portal_lookup(text, text, text) TO anon, authenticated;

-- ── 6. booking_portal_cancel — guest self-cancel of an unpaid hold/pending ──
CREATE OR REPLACE FUNCTION public.booking_portal_cancel(
  p_ref    text DEFAULT NULL,
  p_email  text DEFAULT NULL,
  p_token  text DEFAULT NULL
)
RETURNS TABLE (booking_id uuid, status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_booking_id uuid;
BEGIN
  IF p_token IS NOT NULL AND length(trim(p_token)) > 0 THEN
    SELECT t.booking_id INTO v_booking_id FROM public.booking_guest_tokens t
    WHERE t.token = trim(p_token) AND (t.expires_at IS NULL OR t.expires_at > now()) LIMIT 1;
  ELSIF p_ref IS NOT NULL AND p_email IS NOT NULL THEN
    SELECT b.id INTO v_booking_id FROM public.bookings b
    WHERE b.booking_ref = trim(p_ref) AND lower(b.guest_email) = lower(trim(p_email)) LIMIT 1;
  END IF;
  IF v_booking_id IS NULL THEN RETURN; END IF;

  UPDATE public.bookings b
     SET status = 'cancelled', hold_expires_at = NULL, updated_at = now()
   WHERE b.id = v_booking_id AND b.status IN ('hold','pending_payment');

  -- Free any availability-grid days this booking was holding.
  UPDATE public.booking_availability_days ad
     SET status = 'available', booking_id = NULL
   WHERE ad.booking_id = v_booking_id AND ad.status IN ('hold','pending');

  RETURN QUERY SELECT b.id, b.status FROM public.bookings b WHERE b.id = v_booking_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.booking_portal_cancel(text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.booking_portal_cancel(text, text, text) TO anon, authenticated;

-- ── 7. Customer-scoped SELECT policy on bookings ────────────────────────────
-- A signed-in customer reads ONLY their own stays: either the booking is linked
-- to a customer workspace they belong to, OR the guest email equals their JWT
-- email. This NEVER widens operator access (that policy stays as-is) and never
-- exposes another customer's booking.
DROP POLICY IF EXISTS bookings_customer_read ON public.bookings;
CREATE POLICY bookings_customer_read ON public.bookings
  FOR SELECT TO authenticated
  USING (
    (customer_workspace_id IS NOT NULL AND EXISTS (
       SELECT 1 FROM public.customer_workspace_members cwm
       WHERE cwm.workspace_id = bookings.customer_workspace_id
         AND cwm.user_id = auth.uid()
    ))
    OR lower(guest_email) = lower(coalesce(auth.jwt() ->> 'email', '##none##'))
  );

GRANT SELECT ON public.booking_legal_acceptances TO authenticated;

-- ── 8. booking_issues — guest-reported problems during/around a stay ────────
CREATE TABLE IF NOT EXISTS public.booking_issues (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id    uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  workspace_id  uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  category      text NOT NULL DEFAULT 'other',
  severity      text NOT NULL DEFAULT 'normal' CHECK (severity IN ('low','normal','urgent')),
  subject       text NOT NULL,
  detail        text,
  status        text NOT NULL DEFAULT 'open' CHECK (status IN ('open','acknowledged','resolved','closed')),
  reported_by   text NOT NULL DEFAULT 'guest',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS booking_issues_booking_idx ON public.booking_issues (booking_id);
ALTER TABLE public.booking_issues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS booking_issues_ws_member ON public.booking_issues;
CREATE POLICY booking_issues_ws_member ON public.booking_issues
  FOR ALL TO authenticated USING (
    workspace_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = booking_issues.workspace_id AND wm.user_id = auth.uid())
  ) WITH CHECK (
    workspace_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = booking_issues.workspace_id AND wm.user_id = auth.uid())
  );
-- customers read their own booking's issues
DROP POLICY IF EXISTS booking_issues_customer_read ON public.booking_issues;
CREATE POLICY booking_issues_customer_read ON public.booking_issues
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_issues.booking_id
        AND (lower(b.guest_email) = lower(coalesce(auth.jwt() ->> 'email','##none##'))
          OR (b.customer_workspace_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.customer_workspace_members cwm
            WHERE cwm.workspace_id = b.customer_workspace_id AND cwm.user_id = auth.uid())))
    )
  );

-- ── 9. booking_reviews — post-checkout guest review ─────────────────────────
CREATE TABLE IF NOT EXISTS public.booking_reviews (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id    uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  listing_id    uuid REFERENCES public.booking_listings(id) ON DELETE SET NULL,
  workspace_id  uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  rating        integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title         text,
  body          text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (booking_id)
);
CREATE INDEX IF NOT EXISTS booking_reviews_listing_idx ON public.booking_reviews (listing_id);
ALTER TABLE public.booking_reviews ENABLE ROW LEVEL SECURITY;

-- anyone may read reviews of a published listing (social proof)
DROP POLICY IF EXISTS booking_reviews_public_read ON public.booking_reviews;
CREATE POLICY booking_reviews_public_read ON public.booking_reviews
  FOR SELECT USING (
    listing_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.booking_listings l
      WHERE l.id = booking_reviews.listing_id AND l.status = 'published')
  );
DROP POLICY IF EXISTS booking_reviews_ws_member ON public.booking_reviews;
CREATE POLICY booking_reviews_ws_member ON public.booking_reviews
  FOR SELECT TO authenticated USING (
    workspace_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = booking_reviews.workspace_id AND wm.user_id = auth.uid())
  );
GRANT SELECT ON public.booking_reviews TO anon, authenticated;

-- ── 10. portal issue + review actions (anon SECURITY DEFINER) ───────────────
CREATE OR REPLACE FUNCTION public.booking_portal_report_issue(
  p_ref text, p_email text, p_token text,
  p_category text, p_severity text, p_subject text, p_detail text
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_bid uuid; v_ws uuid; v_id uuid; BEGIN
  IF p_token IS NOT NULL AND length(trim(p_token)) > 0 THEN
    SELECT booking_id INTO v_bid FROM public.booking_guest_tokens
    WHERE token = trim(p_token) AND (expires_at IS NULL OR expires_at > now()) LIMIT 1;
  ELSIF p_ref IS NOT NULL AND p_email IS NOT NULL THEN
    SELECT id INTO v_bid FROM public.bookings
    WHERE booking_ref = trim(p_ref) AND lower(guest_email) = lower(trim(p_email)) LIMIT 1;
  END IF;
  IF v_bid IS NULL THEN RAISE EXCEPTION 'booking not found' USING ERRCODE='no_data_found'; END IF;
  IF p_subject IS NULL OR length(trim(p_subject)) = 0 THEN
    RAISE EXCEPTION 'a subject is required' USING ERRCODE='check_violation'; END IF;
  SELECT workspace_id INTO v_ws FROM public.bookings WHERE id = v_bid;
  INSERT INTO public.booking_issues (booking_id, workspace_id, category, severity, subject, detail, reported_by)
  VALUES (v_bid, v_ws, coalesce(nullif(trim(p_category),''),'other'),
          CASE WHEN p_severity IN ('low','normal','urgent') THEN p_severity ELSE 'normal' END,
          trim(p_subject), nullif(trim(p_detail),''), 'guest')
  RETURNING id INTO v_id;
  RETURN v_id;
END; $function$;
REVOKE ALL ON FUNCTION public.booking_portal_report_issue(text,text,text,text,text,text,text) FROM public;
GRANT EXECUTE ON FUNCTION public.booking_portal_report_issue(text,text,text,text,text,text,text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.booking_portal_submit_review(
  p_ref text, p_email text, p_token text,
  p_rating integer, p_title text, p_body text
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_bid uuid; v_ws uuid; v_lid uuid; v_status text; v_id uuid; BEGIN
  IF p_token IS NOT NULL AND length(trim(p_token)) > 0 THEN
    SELECT booking_id INTO v_bid FROM public.booking_guest_tokens
    WHERE token = trim(p_token) AND (expires_at IS NULL OR expires_at > now()) LIMIT 1;
  ELSIF p_ref IS NOT NULL AND p_email IS NOT NULL THEN
    SELECT id INTO v_bid FROM public.bookings
    WHERE booking_ref = trim(p_ref) AND lower(guest_email) = lower(trim(p_email)) LIMIT 1;
  END IF;
  IF v_bid IS NULL THEN RAISE EXCEPTION 'booking not found' USING ERRCODE='no_data_found'; END IF;
  IF coalesce(p_rating,0) NOT BETWEEN 1 AND 5 THEN
    RAISE EXCEPTION 'rating must be 1-5' USING ERRCODE='check_violation'; END IF;
  SELECT workspace_id, booking_listing_id, status INTO v_ws, v_lid, v_status FROM public.bookings WHERE id = v_bid;
  -- reviews unlock only after the stay is over (checked_out / completed, or past check-out)
  IF v_status NOT IN ('checked_out','completed') THEN
    RAISE EXCEPTION 'reviews unlock after your stay' USING ERRCODE='check_violation'; END IF;
  INSERT INTO public.booking_reviews (booking_id, listing_id, workspace_id, rating, title, body)
  VALUES (v_bid, v_lid, v_ws, p_rating, nullif(trim(p_title),''), nullif(trim(p_body),''))
  ON CONFLICT (booking_id) DO UPDATE SET rating = excluded.rating, title = excluded.title, body = excluded.body
  RETURNING id INTO v_id;
  RETURN v_id;
END; $function$;
REVOKE ALL ON FUNCTION public.booking_portal_submit_review(text,text,text,integer,text,text) FROM public;
GRANT EXECUTE ON FUNCTION public.booking_portal_submit_review(text,text,text,integer,text,text) TO anon, authenticated;
