-- ============================================================================
-- 20260617020000_booking_deep.sql
--
-- Direct Booking Management — OPERATOR-side deep substrate.
--
-- Adds a dedicated `booking_listings` table (separate from property records and
-- from `marketplace_listings`), per-listing photos/amenities, real pricing
-- profiles + price rules, and a per-day availability grid. Bridges the existing
-- P4 thin path (`bookings`, `rate_plans`, `booking_blocked_dates`) without
-- breaking it: a new nullable `bookings.booking_listing_id` lets reservations
-- attach to a booking_listing, while old marketplace-backed bookings keep
-- working.
--
-- Money is integer pence (bigint). All RLS is workspace-scoped via
-- workspace_members; published booking_listings (+ their photos/amenities/
-- pricing/availability) are anon-readable so the public /stay side can render.
--
-- Idempotent: guarded with IF NOT EXISTS / DROP POLICY IF EXISTS so it can be
-- re-applied. 42P01-safe by construction (tables created here).
-- ============================================================================

-- ── Enums (text CHECK constraints, not pg enums — easier to evolve) ──────────
-- listing_type:  entire_home | private_room | shared_room | serviced_accommodation
--                | student_room | hmo_room | unit | other
-- booking_mode:  instant | request | enquiry
-- listing.status: draft | in_review | published | paused | archived
-- compliance_status: pending | passed | flagged | exempt

-- ── booking_listings ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.booking_listings (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id            uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  property_id             uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  unit_id                 uuid REFERENCES public.units(id) ON DELETE SET NULL,
  listing_type            text NOT NULL DEFAULT 'entire_home'
                            CHECK (listing_type IN ('entire_home','private_room','shared_room',
                              'serviced_accommodation','student_room','hmo_room','unit','other')),
  title                   text NOT NULL DEFAULT 'Untitled listing',
  slug                    text,
  summary                 text,
  description             text,
  status                  text NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft','in_review','published','paused','archived')),
  booking_mode            text NOT NULL DEFAULT 'request'
                            CHECK (booking_mode IN ('instant','request','enquiry')),
  max_guests              integer NOT NULL DEFAULT 2 CHECK (max_guests >= 1),
  bedrooms                integer NOT NULL DEFAULT 1 CHECK (bedrooms >= 0),
  beds                    integer NOT NULL DEFAULT 1 CHECK (beds >= 0),
  bathrooms               numeric(4,1) NOT NULL DEFAULT 1 CHECK (bathrooms >= 0),
  amenities               jsonb NOT NULL DEFAULT '[]'::jsonb,
  house_rules             jsonb NOT NULL DEFAULT '{}'::jsonb,
  check_in_window         text,                       -- e.g. "15:00–21:00"
  checkout_time           text,                       -- e.g. "10:00"
  cancellation_policy_id  uuid,
  cancellation_policy     text NOT NULL DEFAULT 'flexible'
                            CHECK (cancellation_policy IN ('flexible','moderate','strict','non_refundable','custom')),
  deposit_policy_id       uuid,
  pricing_profile_id      uuid,                        -- → booking_pricing_profiles.id (set after creation)
  availability_profile_id uuid,
  country_code            text NOT NULL DEFAULT 'GB',
  currency                text NOT NULL DEFAULT 'GBP',
  timezone                text NOT NULL DEFAULT 'Europe/London',
  compliance_status       text NOT NULL DEFAULT 'pending'
                            CHECK (compliance_status IN ('pending','passed','flagged','exempt')),
  marketplace_listing_id  uuid REFERENCES public.marketplace_listings(id) ON DELETE SET NULL,
  cover_photo_id          uuid,
  published_at            timestamptz,
  created_by              uuid,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS booking_listings_ws_idx       ON public.booking_listings (workspace_id);
CREATE INDEX IF NOT EXISTS booking_listings_property_idx ON public.booking_listings (property_id);
CREATE INDEX IF NOT EXISTS booking_listings_status_idx   ON public.booking_listings (status);
CREATE UNIQUE INDEX IF NOT EXISTS booking_listings_slug_uq
  ON public.booking_listings (slug) WHERE slug IS NOT NULL;

-- ── booking_listing_photos ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.booking_listing_photos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id   uuid NOT NULL REFERENCES public.booking_listings(id) ON DELETE CASCADE,
  url          text,
  r2_key       text,
  caption      text,
  room_tag     text,                       -- bedroom | kitchen | bathroom | exterior | ...
  sort_order   integer NOT NULL DEFAULT 0,
  is_cover     boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS booking_listing_photos_listing_idx
  ON public.booking_listing_photos (listing_id, sort_order);

-- ── booking_listing_amenities ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.booking_listing_amenities (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id   uuid NOT NULL REFERENCES public.booking_listings(id) ON DELETE CASCADE,
  amenity_key  text NOT NULL,              -- wifi | parking | kitchen | washer | ...
  amenity_group text,                      -- essentials | safety | features | accessibility
  value        text,                       -- optional free text (e.g. "Fibre 500Mbps")
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, amenity_key)
);
CREATE INDEX IF NOT EXISTS booking_listing_amenities_listing_idx
  ON public.booking_listing_amenities (listing_id);

-- ── booking_pricing_profiles ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.booking_pricing_profiles (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  listing_id            uuid REFERENCES public.booking_listings(id) ON DELETE CASCADE,
  name                  text NOT NULL DEFAULT 'Standard pricing',
  currency              text NOT NULL DEFAULT 'GBP',
  base_nightly_pence    bigint NOT NULL DEFAULT 0 CHECK (base_nightly_pence >= 0),
  weekend_pence         bigint CHECK (weekend_pence IS NULL OR weekend_pence >= 0),
  weekly_discount_pct   numeric(5,2) NOT NULL DEFAULT 0 CHECK (weekly_discount_pct >= 0 AND weekly_discount_pct <= 100),
  monthly_discount_pct  numeric(5,2) NOT NULL DEFAULT 0 CHECK (monthly_discount_pct >= 0 AND monthly_discount_pct <= 100),
  min_nights            integer NOT NULL DEFAULT 1 CHECK (min_nights >= 1),
  max_nights            integer CHECK (max_nights IS NULL OR max_nights >= 1),
  cleaning_fee_pence    bigint NOT NULL DEFAULT 0 CHECK (cleaning_fee_pence >= 0),
  extra_guest_fee_pence bigint NOT NULL DEFAULT 0 CHECK (extra_guest_fee_pence >= 0),
  extra_guest_after     integer NOT NULL DEFAULT 2 CHECK (extra_guest_after >= 1),
  security_deposit_pence bigint NOT NULL DEFAULT 0 CHECK (security_deposit_pence >= 0),
  is_active             boolean NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS booking_pricing_profiles_ws_idx      ON public.booking_pricing_profiles (workspace_id);
CREATE INDEX IF NOT EXISTS booking_pricing_profiles_listing_idx ON public.booking_pricing_profiles (listing_id);

-- ── booking_price_rules ─────────────────────────────────────────────────────
-- rule_type: seasonal | event | last_minute | early_bird | gap_night | length_of_stay
-- adjust_kind: pct | fixed_pence | absolute_pence
CREATE TABLE IF NOT EXISTS public.booking_price_rules (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id      uuid NOT NULL REFERENCES public.booking_listings(id) ON DELETE CASCADE,
  pricing_profile_id uuid REFERENCES public.booking_pricing_profiles(id) ON DELETE CASCADE,
  name            text NOT NULL DEFAULT 'Rule',
  rule_type       text NOT NULL DEFAULT 'seasonal'
                    CHECK (rule_type IN ('seasonal','event','last_minute','early_bird','gap_night','length_of_stay')),
  date_from       date,
  date_to         date,
  -- last_minute / early_bird windows (days before check-in)
  days_before_min integer,
  days_before_max integer,
  -- length_of_stay / gap_night thresholds
  nights_min      integer,
  nights_max      integer,
  adjust_kind     text NOT NULL DEFAULT 'pct' CHECK (adjust_kind IN ('pct','fixed_pence','absolute_pence')),
  adjust_value    numeric(12,2) NOT NULL DEFAULT 0,
  priority        integer NOT NULL DEFAULT 100,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS booking_price_rules_listing_idx ON public.booking_price_rules (listing_id, priority);

-- ── booking_availability_days ───────────────────────────────────────────────
-- status: available | blocked_manual | blocked_owner | blocked_maintenance
--         | blocked_channel | booked_direct | booked_channel | pending | hold
CREATE TABLE IF NOT EXISTS public.booking_availability_days (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id          uuid NOT NULL REFERENCES public.booking_listings(id) ON DELETE CASCADE,
  date                date NOT NULL,
  status              text NOT NULL DEFAULT 'available'
                        CHECK (status IN ('available','blocked_manual','blocked_owner','blocked_maintenance',
                          'blocked_channel','booked_direct','booked_channel','pending','hold')),
  price_override_pence bigint CHECK (price_override_pence IS NULL OR price_override_pence >= 0),
  min_nights          integer CHECK (min_nights IS NULL OR min_nights >= 1),
  max_nights          integer CHECK (max_nights IS NULL OR max_nights >= 1),
  checkin_allowed     boolean NOT NULL DEFAULT true,
  checkout_allowed    boolean NOT NULL DEFAULT true,
  prep_time_days      integer NOT NULL DEFAULT 0 CHECK (prep_time_days >= 0),
  advance_notice_days integer NOT NULL DEFAULT 0 CHECK (advance_notice_days >= 0),
  cut_off_days        integer NOT NULL DEFAULT 0 CHECK (cut_off_days >= 0),
  booking_id          uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  note                text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, date)
);
CREATE INDEX IF NOT EXISTS booking_availability_days_listing_idx
  ON public.booking_availability_days (listing_id, date);
CREATE INDEX IF NOT EXISTS booking_availability_days_status_idx
  ON public.booking_availability_days (status);

-- ── Bridge existing `bookings` to booking_listings ──────────────────────────
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS booking_listing_id uuid
    REFERENCES public.booking_listings(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS bookings_booking_listing_idx
  ON public.bookings (booking_listing_id);

-- Extend the bookings.status lifecycle with the operator stay states so real
-- check-in / check-out transitions can be persisted (previously these were
-- UI-only derived states). Idempotent: drop + recreate the CHECK.
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_status_check
  CHECK (status = ANY (ARRAY['hold','pending_payment','confirmed',
    'checked_in','checked_out','cancelled','completed','no_show']));

-- Allow reservations to be backed by a booking_listing INSTEAD of a
-- marketplace_listing. `listing_id` (→ marketplace_listings) becomes optional;
-- a row must reference at least one listing source. Existing rows already have
-- listing_id, so the CHECK is satisfied.
ALTER TABLE public.bookings ALTER COLUMN listing_id DROP NOT NULL;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_listing_source_chk;
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_listing_source_chk
  CHECK (listing_id IS NOT NULL OR booking_listing_id IS NOT NULL);

-- updated_at touch trigger (reuse a shared function if present, else inline)
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS touch_booking_listings ON public.booking_listings;
CREATE TRIGGER touch_booking_listings BEFORE UPDATE ON public.booking_listings
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
DROP TRIGGER IF EXISTS touch_booking_pricing_profiles ON public.booking_pricing_profiles;
CREATE TRIGGER touch_booking_pricing_profiles BEFORE UPDATE ON public.booking_pricing_profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
DROP TRIGGER IF EXISTS touch_booking_availability_days ON public.booking_availability_days;
CREATE TRIGGER touch_booking_availability_days BEFORE UPDATE ON public.booking_availability_days
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- ============================================================================
-- RLS
-- ============================================================================
ALTER TABLE public.booking_listings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_listing_photos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_listing_amenities   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_pricing_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_price_rules         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_availability_days   ENABLE ROW LEVEL SECURITY;

-- Helper predicate inline (workspace member). We repeat the EXISTS pattern used
-- across the codebase rather than a function to keep RLS introspectable.

-- booking_listings: workspace members manage; anon read published.
DROP POLICY IF EXISTS booking_listings_ws_member ON public.booking_listings;
CREATE POLICY booking_listings_ws_member ON public.booking_listings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = booking_listings.workspace_id AND wm.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = booking_listings.workspace_id AND wm.user_id = auth.uid())
  );
DROP POLICY IF EXISTS booking_listings_published_read ON public.booking_listings;
CREATE POLICY booking_listings_published_read ON public.booking_listings
  FOR SELECT USING (status = 'published');

-- photos: members via parent; anon read when parent published.
DROP POLICY IF EXISTS booking_listing_photos_ws_member ON public.booking_listing_photos;
CREATE POLICY booking_listing_photos_ws_member ON public.booking_listing_photos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.booking_listings l
            JOIN public.workspace_members wm ON wm.workspace_id = l.workspace_id
            WHERE l.id = booking_listing_photos.listing_id AND wm.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.booking_listings l
            JOIN public.workspace_members wm ON wm.workspace_id = l.workspace_id
            WHERE l.id = booking_listing_photos.listing_id AND wm.user_id = auth.uid())
  );
DROP POLICY IF EXISTS booking_listing_photos_published_read ON public.booking_listing_photos;
CREATE POLICY booking_listing_photos_published_read ON public.booking_listing_photos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.booking_listings l
            WHERE l.id = booking_listing_photos.listing_id AND l.status = 'published')
  );

-- amenities: members via parent; anon read when parent published.
DROP POLICY IF EXISTS booking_listing_amenities_ws_member ON public.booking_listing_amenities;
CREATE POLICY booking_listing_amenities_ws_member ON public.booking_listing_amenities
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.booking_listings l
            JOIN public.workspace_members wm ON wm.workspace_id = l.workspace_id
            WHERE l.id = booking_listing_amenities.listing_id AND wm.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.booking_listings l
            JOIN public.workspace_members wm ON wm.workspace_id = l.workspace_id
            WHERE l.id = booking_listing_amenities.listing_id AND wm.user_id = auth.uid())
  );
DROP POLICY IF EXISTS booking_listing_amenities_published_read ON public.booking_listing_amenities;
CREATE POLICY booking_listing_amenities_published_read ON public.booking_listing_amenities
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.booking_listings l
            WHERE l.id = booking_listing_amenities.listing_id AND l.status = 'published')
  );

-- pricing_profiles: members manage (by workspace); anon read when listing published.
DROP POLICY IF EXISTS booking_pricing_profiles_ws_member ON public.booking_pricing_profiles;
CREATE POLICY booking_pricing_profiles_ws_member ON public.booking_pricing_profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = booking_pricing_profiles.workspace_id AND wm.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = booking_pricing_profiles.workspace_id AND wm.user_id = auth.uid())
  );
DROP POLICY IF EXISTS booking_pricing_profiles_published_read ON public.booking_pricing_profiles;
CREATE POLICY booking_pricing_profiles_published_read ON public.booking_pricing_profiles
  FOR SELECT USING (
    listing_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.booking_listings l
      WHERE l.id = booking_pricing_profiles.listing_id AND l.status = 'published')
  );

-- price_rules: members via parent listing; anon read when listing published.
DROP POLICY IF EXISTS booking_price_rules_ws_member ON public.booking_price_rules;
CREATE POLICY booking_price_rules_ws_member ON public.booking_price_rules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.booking_listings l
            JOIN public.workspace_members wm ON wm.workspace_id = l.workspace_id
            WHERE l.id = booking_price_rules.listing_id AND wm.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.booking_listings l
            JOIN public.workspace_members wm ON wm.workspace_id = l.workspace_id
            WHERE l.id = booking_price_rules.listing_id AND wm.user_id = auth.uid())
  );
DROP POLICY IF EXISTS booking_price_rules_published_read ON public.booking_price_rules;
CREATE POLICY booking_price_rules_published_read ON public.booking_price_rules
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.booking_listings l
            WHERE l.id = booking_price_rules.listing_id AND l.status = 'published')
  );

-- availability_days: members via parent listing; anon read when listing published.
DROP POLICY IF EXISTS booking_availability_days_ws_member ON public.booking_availability_days;
CREATE POLICY booking_availability_days_ws_member ON public.booking_availability_days
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.booking_listings l
            JOIN public.workspace_members wm ON wm.workspace_id = l.workspace_id
            WHERE l.id = booking_availability_days.listing_id AND wm.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.booking_listings l
            JOIN public.workspace_members wm ON wm.workspace_id = l.workspace_id
            WHERE l.id = booking_availability_days.listing_id AND wm.user_id = auth.uid())
  );
DROP POLICY IF EXISTS booking_availability_days_published_read ON public.booking_availability_days;
CREATE POLICY booking_availability_days_published_read ON public.booking_availability_days
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.booking_listings l
            WHERE l.id = booking_availability_days.listing_id AND l.status = 'published')
  );

-- ── grants (RLS still applies; anon needs table-level SELECT for published) ──
GRANT SELECT ON public.booking_listings           TO anon;
GRANT SELECT ON public.booking_listing_photos      TO anon;
GRANT SELECT ON public.booking_listing_amenities   TO anon;
GRANT SELECT ON public.booking_pricing_profiles    TO anon;
GRANT SELECT ON public.booking_price_rules         TO anon;
GRANT SELECT ON public.booking_availability_days    TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_listings         TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_listing_photos    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_listing_amenities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_pricing_profiles  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_price_rules       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_availability_days TO authenticated;
