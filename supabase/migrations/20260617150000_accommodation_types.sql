-- ─────────────────────────────────────────────────────────────────────────────
-- ACCOMMODATION-TYPE DIFFERENTIATION  (Phase: booking/stay listing depth)
--
-- Short-stays, long-term lets and shared-accommodation rooms are genuinely
-- different products with different field sets. This migration is ADDITIVE +
-- IDEMPOTENT (safe to re-run). It gives `booking_listings` a first-class
-- accommodation_category + let_type, a per-category `type_details` jsonb bag, an
-- amenities CATALOGUE + link table, and a real KEYLESS-LOCK + per-booking
-- ACCESS-CODE stack with a safe-release gate and an audit trail.
--
-- Sensitivity: access codes are secrets. They are server-side only — there is
-- NO anon read policy and NO guest-self read here; a code is surfaced to a guest
-- only through a server route that re-checks (paid + within window). Every code
-- read is audited in booking_access_code_audit.
--
-- Money: integer pence (deposit_pence, room_size etc. are not money).
-- RLS: workspace-member ALL via the listing's workspace_id, mirroring the
-- existing booking_listings_ws_member / booking_listing_amenities_ws_member.
-- ─────────────────────────────────────────────────────────────────────────────

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. ACCOMMODATION CATEGORY + LET TYPE + TYPE-SPECIFIC DETAIL on booking_listings
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.booking_listings
  ADD COLUMN IF NOT EXISTS accommodation_category text NOT NULL DEFAULT 'short_stay',
  ADD COLUMN IF NOT EXISTS let_type               text NOT NULL DEFAULT 'entire',
  -- Per-category structured fields. Shape depends on accommodation_category:
  --  short_stay/serviced_accommodation/holiday_let:
  --     { wifi_name, wifi_password, check_in_method, min_nights, max_nights }
  --  long_term_let/mid_term_let:
  --     { tenancy_length_months, furnished, bills_included{}, deposit_pence,
  --       deposit_scheme, deposit_declaration, available_from, epc_rating,
  --       council_tax_band, floor_plan_url }
  --  hmo_room/student_room/co_living_room:
  --     { room_size_sqm, ensuite, shared_facilities{}, household_size,
  --       bills_included{}, contract_length_months, available_from }
  ADD COLUMN IF NOT EXISTS type_details jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Category CHECK (drop+recreate so re-runs converge on the canonical set).
ALTER TABLE public.booking_listings
  DROP CONSTRAINT IF EXISTS booking_listings_accommodation_category_chk;
ALTER TABLE public.booking_listings
  ADD CONSTRAINT booking_listings_accommodation_category_chk
  CHECK (accommodation_category IN (
    'short_stay', 'serviced_accommodation', 'holiday_let',
    'long_term_let', 'mid_term_let',
    'hmo_room', 'student_room', 'co_living_room',
    'commercial'
  ));

ALTER TABLE public.booking_listings
  DROP CONSTRAINT IF EXISTS booking_listings_let_type_chk;
ALTER TABLE public.booking_listings
  ADD CONSTRAINT booking_listings_let_type_chk
  CHECK (let_type IN ('entire', 'private_room', 'shared_room'));

CREATE INDEX IF NOT EXISTS idx_booking_listings_accom_category
  ON public.booking_listings (accommodation_category);

-- Backfill: map legacy listing_type → a sensible accommodation_category/let_type
-- for rows created before this migration (only where still on the default).
UPDATE public.booking_listings SET
  accommodation_category = CASE listing_type
    WHEN 'serviced_accommodation' THEN 'serviced_accommodation'
    WHEN 'student_room'           THEN 'student_room'
    WHEN 'hmo_room'               THEN 'hmo_room'
    ELSE 'short_stay'
  END,
  let_type = CASE listing_type
    WHEN 'private_room' THEN 'private_room'
    WHEN 'shared_room'  THEN 'shared_room'
    WHEN 'student_room' THEN 'private_room'
    WHEN 'hmo_room'     THEN 'private_room'
    ELSE 'entire'
  END
WHERE accommodation_category = 'short_stay' AND let_type = 'entire'
  AND listing_type IS NOT NULL
  AND listing_type IN ('serviced_accommodation','student_room','hmo_room','private_room','shared_room');

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. AMENITIES CATALOGUE  (master list, grouped, with icons) + listing link
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.accommodation_amenities (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  label       text NOT NULL,
  -- Group used for the grouped display on the public detail page.
  category    text NOT NULL DEFAULT 'general',
  -- lucide-react icon name (rendered client-side).
  icon        text,
  -- Display order within its category.
  sort_order  integer NOT NULL DEFAULT 100,
  active       boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_accom_amenities_category
  ON public.accommodation_amenities (category, sort_order);

-- The existing booking_listing_amenities link table is keyed by free-text
-- amenity_key; we keep it (the public read layer already uses it) but ALSO
-- carry a catalogue reference so the wizard can drive selection off the
-- catalogue and the display can group/iconise reliably.
ALTER TABLE public.booking_listing_amenities
  ADD COLUMN IF NOT EXISTS amenity_slug text;

CREATE INDEX IF NOT EXISTS idx_bla_amenity_slug
  ON public.booking_listing_amenities (amenity_slug);

-- Seed the catalogue (idempotent upsert on slug).
INSERT INTO public.accommodation_amenities (slug, label, category, icon, sort_order) VALUES
  -- Essentials
  ('wifi',                'Wi-Fi',                 'essentials', 'Wifi',           10),
  ('heating',             'Heating',               'essentials', 'Thermometer',    20),
  ('aircon',              'Air conditioning',      'essentials', 'Wind',           30),
  ('kitchen',             'Kitchen',               'essentials', 'CookingPot',     40),
  ('washing_machine',     'Washing machine',       'essentials', 'WashingMachine', 50),
  ('dryer',               'Dryer',                 'essentials', 'Wind',           60),
  ('dishwasher',          'Dishwasher',            'essentials', 'Utensils',       70),
  ('tv',                  'TV',                    'essentials', 'Tv',             80),
  ('workspace',           'Dedicated workspace',   'essentials', 'Laptop',         90),
  ('iron',                'Iron',                  'essentials', 'Shirt',         100),
  ('hair_dryer',          'Hair dryer',            'essentials', 'Wind',          110),
  -- Features
  ('pool',                'Pool',                  'features',   'Waves',          10),
  ('hot_tub',             'Hot tub',               'features',   'Bath',           20),
  ('gym',                 'Gym',                   'features',   'Dumbbell',       30),
  ('garden',              'Garden',                'features',   'Trees',          40),
  ('balcony',             'Balcony',               'features',   'Building2',      50),
  ('bbq',                 'BBQ',                    'features',   'Flame',          60),
  ('fireplace',           'Fireplace',             'features',   'Flame',          70),
  -- Parking & access
  ('parking',             'Free parking',          'parking',    'CircleParking',  10),
  ('ev_charger',          'EV charger',            'parking',    'PlugZap',        20),
  ('lift',                'Lift',                  'parking',    'ArrowUpDown',    30),
  ('wheelchair_accessible','Step-free access',     'parking',    'Accessibility',  40),
  -- Check-in & how you get in
  ('self_checkin',        'Self check-in',         'checkin',    'KeyRound',       10),
  ('keypad',              'Keypad',                'checkin',    'KeySquare',      20),
  ('smart_lock',          'Smart lock',            'checkin',    'Lock',           30),
  ('key_safe',            'Lockbox',               'checkin',    'Vault',          40),
  -- Safety
  ('smoke_alarm',         'Smoke alarm',           'safety',     'BellRing',       10),
  ('co_detector',         'Carbon monoxide alarm', 'safety',     'BellRing',       20),
  ('fire_extinguisher',   'Fire extinguisher',     'safety',     'FireExtinguisher',30),
  ('first_aid',           'First aid kit',         'safety',     'BriefcaseMedical',40),
  -- Policies / suitability
  ('pets_allowed',        'Pets allowed',          'policies',   'PawPrint',       10),
  ('smoking',             'Smoking allowed',       'policies',   'Cigarette',      20),
  ('family_friendly',     'Family friendly',       'policies',   'Baby',           30)
ON CONFLICT (slug) DO UPDATE SET
  label = EXCLUDED.label,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  active = true;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. KEYLESS LOCKS  (one config per listing) + per-booking ACCESS CODES + AUDIT
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.booking_keyless_locks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  uuid NOT NULL REFERENCES public.booking_listings(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL,
  provider    text NOT NULL DEFAULT 'manual_code'
                CHECK (provider IN (
                  'manual_code', 'key_safe',
                  'smart_lock_nuki', 'igloohome', 'yale', 'august', 'ttlock'
                )),
  -- Vendor device identifier (smart locks). Null for manual_code / key_safe.
  device_ref  text,
  -- Guest-facing arrival instructions (where the lock is, how to use it).
  instructions text,
  -- For manual_code / key_safe a fixed/static code may be configured; per-booking
  -- codes are still generated and audited. NEVER exposed to anon RLS.
  static_code text,
  active       boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id)
);

CREATE INDEX IF NOT EXISTS idx_keyless_locks_listing
  ON public.booking_keyless_locks (listing_id);
CREATE INDEX IF NOT EXISTS idx_keyless_locks_ws
  ON public.booking_keyless_locks (workspace_id);

CREATE TABLE IF NOT EXISTS public.booking_access_codes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  listing_id  uuid,
  workspace_id uuid NOT NULL,
  lock_id     uuid REFERENCES public.booking_keyless_locks(id) ON DELETE SET NULL,
  provider    text NOT NULL DEFAULT 'manual_code',
  -- The generated access code (secret). Server-side only.
  code        text NOT NULL,
  -- Validity window — code is only releasable to the guest inside this window.
  valid_from  timestamptz NOT NULL,
  valid_to    timestamptz NOT NULL,
  status      text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'active', 'released', 'revoked', 'expired')),
  -- True once the code has actually been disclosed to the guest (safe-release).
  released_at timestamptz,
  -- For smart-lock providers, the upstream programming reference (stub today).
  provider_ref text,
  created_by  uuid,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (booking_id)
);

CREATE INDEX IF NOT EXISTS idx_access_codes_booking
  ON public.booking_access_codes (booking_id);
CREATE INDEX IF NOT EXISTS idx_access_codes_listing
  ON public.booking_access_codes (listing_id);
CREATE INDEX IF NOT EXISTS idx_access_codes_ws
  ON public.booking_access_codes (workspace_id, status);

-- Audit every meaningful event against an access code (generated / released /
-- revoked / viewed). Read-restricted to the owning workspace.
CREATE TABLE IF NOT EXISTS public.booking_access_code_audit (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  access_code_id uuid REFERENCES public.booking_access_codes(id) ON DELETE CASCADE,
  booking_id    uuid,
  workspace_id  uuid NOT NULL,
  -- generated | released | revoked | viewed | denied
  event         text NOT NULL,
  -- Who/what triggered it (operator user id, 'guest', 'system').
  actor         text,
  detail        text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_access_audit_code
  ON public.booking_access_code_audit (access_code_id, created_at);
CREATE INDEX IF NOT EXISTS idx_access_audit_ws
  ON public.booking_access_code_audit (workspace_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. RLS
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.accommodation_amenities       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_keyless_locks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_access_codes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_access_code_audit     ENABLE ROW LEVEL SECURITY;

-- Catalogue is public-readable (drives the wizard + public display); writes are
-- platform-only (no policy → service role only).
DROP POLICY IF EXISTS accommodation_amenities_read ON public.accommodation_amenities;
CREATE POLICY accommodation_amenities_read
  ON public.accommodation_amenities FOR SELECT
  USING (active = true);

-- Keyless locks: workspace members of the owning workspace, full access.
-- NO anon / published read — lock config is sensitive.
DROP POLICY IF EXISTS booking_keyless_locks_ws_member ON public.booking_keyless_locks;
CREATE POLICY booking_keyless_locks_ws_member
  ON public.booking_keyless_locks FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = booking_keyless_locks.workspace_id
      AND wm.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = booking_keyless_locks.workspace_id
      AND wm.user_id = auth.uid()
  ));

-- Access codes: workspace members only. Guests NEVER read these directly — the
-- safe-release server route uses the service role and re-checks payment/window.
DROP POLICY IF EXISTS booking_access_codes_ws_member ON public.booking_access_codes;
CREATE POLICY booking_access_codes_ws_member
  ON public.booking_access_codes FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = booking_access_codes.workspace_id
      AND wm.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = booking_access_codes.workspace_id
      AND wm.user_id = auth.uid()
  ));

-- Audit: workspace members read; inserts via server (service role) or members.
DROP POLICY IF EXISTS booking_access_code_audit_ws_member ON public.booking_access_code_audit;
CREATE POLICY booking_access_code_audit_ws_member
  ON public.booking_access_code_audit FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = booking_access_code_audit.workspace_id
      AND wm.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = booking_access_code_audit.workspace_id
      AND wm.user_id = auth.uid()
  ));

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. updated_at touch triggers (reuse existing helper if present)
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'touch_updated_at') THEN
    DROP TRIGGER IF EXISTS trg_keyless_locks_touch ON public.booking_keyless_locks;
    CREATE TRIGGER trg_keyless_locks_touch BEFORE UPDATE ON public.booking_keyless_locks
      FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
    DROP TRIGGER IF EXISTS trg_access_codes_touch ON public.booking_access_codes;
    CREATE TRIGGER trg_access_codes_touch BEFORE UPDATE ON public.booking_access_codes
      FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
  END IF;
END $$;
