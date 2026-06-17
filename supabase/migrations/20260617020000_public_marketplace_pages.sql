-- ─────────────────────────────────────────────────────────────────────────────
-- Public Marketplace Pages: Stays, Providers, Service Offers, Emergency Services
-- Migration: 20260617020000
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── marketplace_stays ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS marketplace_stays (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                  text UNIQUE NOT NULL,
  title                 text NOT NULL,
  stay_type             text NOT NULL,
  location              text NOT NULL,
  city                  text NOT NULL,
  postcode              text,
  lat                   double precision,
  lng                   double precision,
  beds                  int DEFAULT 1,
  bathrooms             int DEFAULT 1,
  max_guests            int DEFAULT 2,
  verified              bool DEFAULT false,
  licence_verified      bool DEFAULT false,
  host_name             text,
  host_avatar           text,
  host_pro_badge        bool DEFAULT false,
  rating                numeric(3,2) DEFAULT 0,
  review_count          int DEFAULT 0,
  price_per_night_pence bigint NOT NULL DEFAULT 0,
  cleaning_fee_pence    bigint DEFAULT 0,
  service_fee_pence     bigint DEFAULT 0,
  taxes_pence           bigint DEFAULT 0,
  long_stays            bool DEFAULT false,
  instant_book          bool DEFAULT false,
  pets_allowed          bool DEFAULT false,
  hero_image            text,
  gallery               jsonb DEFAULT '[]',
  amenities             jsonb DEFAULT '[]',
  rules                 jsonb DEFAULT '[]',
  cancellation_policy   text,
  nearby_attractions    jsonb DEFAULT '[]',
  rooms                 jsonb DEFAULT '[]',
  description           text,
  badges                jsonb DEFAULT '[]',
  features              jsonb DEFAULT '[]',
  public_visible        bool DEFAULT true,
  status                text DEFAULT 'published',
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketplace_stays_slug_idx ON marketplace_stays(slug);
CREATE INDEX IF NOT EXISTS marketplace_stays_status_visible_idx ON marketplace_stays(status, public_visible);

ALTER TABLE marketplace_stays ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read" ON marketplace_stays;
CREATE POLICY "public_read" ON marketplace_stays
  FOR SELECT USING (public_visible = true AND status = 'published');

-- ─── marketplace_providers ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS marketplace_providers (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                  text UNIQUE NOT NULL,
  name                  text NOT NULL,
  trade_category        text NOT NULL,
  logo_url              text,
  banner_url            text,
  rating                numeric(3,2) DEFAULT 0,
  review_count          int DEFAULT 0,
  pro_badge             bool DEFAULT false,
  verified              bool DEFAULT false,
  vetted                bool DEFAULT false,
  certifications        jsonb DEFAULT '[]',
  insurance_limit_gbp   int DEFAULT 0,
  coverage_radius_miles int DEFAULT 25,
  coverage_zones        jsonb DEFAULT '[]',
  years_in_business     int DEFAULT 0,
  jobs_completed        int DEFAULT 0,
  team_size             int DEFAULT 1,
  response_time_minutes int DEFAULT 60,
  price_from_pence      bigint DEFAULT 0,
  location              text,
  city                  text,
  lat                   double precision,
  lng                   double precision,
  description           text,
  services              jsonb DEFAULT '[]',
  badges                jsonb DEFAULT '[]',
  hero_image            text,
  gallery               jsonb DEFAULT '[]',
  team_members          jsonb DEFAULT '[]',
  faqs                  jsonb DEFAULT '[]',
  recent_work           jsonb DEFAULT '[]',
  public_visible        bool DEFAULT true,
  status                text DEFAULT 'published',
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketplace_providers_slug_idx ON marketplace_providers(slug);
CREATE INDEX IF NOT EXISTS marketplace_providers_status_visible_idx ON marketplace_providers(status, public_visible);

ALTER TABLE marketplace_providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read" ON marketplace_providers;
CREATE POLICY "public_read" ON marketplace_providers
  FOR SELECT USING (public_visible = true AND status = 'published');

-- ─── marketplace_service_offers ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS marketplace_service_offers (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                text UNIQUE NOT NULL,
  title               text NOT NULL,
  subtitle            text,
  category            text NOT NULL,
  provider_id         uuid REFERENCES marketplace_providers(id) ON DELETE SET NULL,
  provider_name       text,
  provider_avatar     text,
  provider_pro_badge  bool DEFAULT false,
  rating              numeric(3,2) DEFAULT 0,
  review_count        int DEFAULT 0,
  jobs_done           int DEFAULT 0,
  price_from_pence    bigint DEFAULT 0,
  price_unit          text DEFAULT 'fixed',
  response_time       text,
  duration            text,
  next_available      text,
  verified            bool DEFAULT false,
  insured             bool DEFAULT false,
  location            text,
  hero_image          text,
  gallery             jsonb DEFAULT '[]',
  badges              jsonb DEFAULT '[]',
  deliverables        jsonb DEFAULT '[]',
  included            jsonb DEFAULT '[]',
  excluded            jsonb DEFAULT '[]',
  addons              jsonb DEFAULT '[]',
  packages            jsonb DEFAULT '[]',
  process_steps       jsonb DEFAULT '[]',
  cancellation_policy text,
  guarantee           text,
  property_types      jsonb DEFAULT '[]',
  public_visible      bool DEFAULT true,
  status              text DEFAULT 'published',
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketplace_service_offers_slug_idx ON marketplace_service_offers(slug);
CREATE INDEX IF NOT EXISTS marketplace_service_offers_status_visible_idx ON marketplace_service_offers(status, public_visible);

ALTER TABLE marketplace_service_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read" ON marketplace_service_offers;
CREATE POLICY "public_read" ON marketplace_service_offers
  FOR SELECT USING (public_visible = true AND status = 'published');

-- ─── marketplace_emergency_services ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS marketplace_emergency_services (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                      text UNIQUE NOT NULL,
  title                     text NOT NULL,
  subtitle                  text,
  emergency_category        text NOT NULL,
  response_window_minutes   int DEFAULT 30,
  call_out_price_pence      bigint DEFAULT 0,
  availability              text DEFAULT '24/7',
  phone_display             text,
  live_chat_available       bool DEFAULT false,
  eta_copy                  text,
  coverage_zones            jsonb DEFAULT '[]',
  pricing_lines             jsonb DEFAULT '[]',
  what_we_can_help_with     jsonb DEFAULT '[]',
  insurance_details         text,
  vetting_details           text,
  rating                    numeric(3,2) DEFAULT 0,
  review_count              int DEFAULT 0,
  hero_image                text,
  gallery                   jsonb DEFAULT '[]',
  lead_provider_name        text,
  lead_provider_avatar      text,
  lead_provider_online      bool DEFAULT false,
  badges                    jsonb DEFAULT '[]',
  related_services          jsonb DEFAULT '[]',
  public_visible            bool DEFAULT true,
  status                    text DEFAULT 'published',
  created_at                timestamptz DEFAULT now(),
  updated_at                timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketplace_emergency_services_slug_idx ON marketplace_emergency_services(slug);
CREATE INDEX IF NOT EXISTS marketplace_emergency_services_status_visible_idx ON marketplace_emergency_services(status, public_visible);

ALTER TABLE marketplace_emergency_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read" ON marketplace_emergency_services;
CREATE POLICY "public_read" ON marketplace_emergency_services
  FOR SELECT USING (public_visible = true AND status = 'published');
