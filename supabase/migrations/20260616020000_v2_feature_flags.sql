-- ============================================================
-- v2 FEATURE FLAGS — seed rows (all DISABLED by default).
--
-- Seeds the v2 flag catalogue (src/lib/flags/registry.ts) into the live
-- `platform_feature_flags` table so platform admins can see/toggle them in the
-- admin console. EVERY flag is seeded enabled = false: with these off the app
-- is identical to V1.
--
-- Live `platform_feature_flags` schema (per docs/final-wiring/live-schema.md):
--   flag_key text NOT NULL, name text, description text,
--   enabled bool NOT NULL DEFAULT true, enabled_for_plans _text DEFAULT {enterprise}
--
-- Idempotent: re-running is a no-op for existing keys (ON CONFLICT DO NOTHING),
-- so it will NOT re-disable a flag an admin has deliberately turned on later.
-- Safe to re-run. Apply via: node scripts/_apply_migration.mjs <this file>
-- ============================================================

INSERT INTO platform_feature_flags (key, description, enabled) VALUES
  ('context_engine',          'Central routeContext resolver that adapts modules by workspace type, actor and country. Off = V1 single-context behaviour.', false),
  ('marketplace_enabled',     'Master switch for the combined marketplace OS. Off = no marketplace surface at all.', false),
  ('marketplace_stays',       'Property stay / booking listing type within the marketplace.', false),
  ('marketplace_suppliers',   'Supplier service / package listing type within the marketplace.', false),
  ('marketplace_emergency',   'Emergency dispatch listing type and emergency supplier chain.', false),
  ('marketplace_payments',    'Marketplace payment capture / payout flows and commission tracking.', false),
  ('marketplace_escrow',      'Payment authorisation, delayed capture and platform-hold flows.', false),
  ('marketplace_disputes',    'Unified dispute lifecycle and resolution workflows.', false),
  ('booking_management',      'Reservation operations section (calendar, availability, check-in/out, turnover).', false),
  ('direct_booking_pages',    'Public direct-booking pages with reduced/zero platform fee.', false),
  ('customer_workspace',      'Lightweight customer / guest workspace route group and landing.', false),
  ('supplier_workspace',      'Full supplier workspace (services, packages, jobs, payouts) beyond the lightweight portal.', false),
  ('ical_sync',               'Channel iCal import/export for booking availability.', false),
  ('canvas_lite',             'Lightweight visual canvas / board surface for planning.', false),
  ('multi_country_portfolio', 'Per-property country, jurisdiction and currency across a single workspace.', false),
  ('global_country_packs',    'Country pack legal/tax/compliance depth and support-status gating.', false),
  ('registrationSupplier',    'Allow new supplier self-registration via the login page.', false),
  ('registrationCustomer',    'Allow new customer self-registration via the login page.', false)
ON CONFLICT (key) DO NOTHING;
