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

INSERT INTO platform_feature_flags (flag_key, name, description, enabled, enabled_for_plans) VALUES
  ('context_engine',          'Context Engine',          'Central routeContext resolver that adapts modules by workspace type, actor and country. Off = V1 single-context behaviour.', false, ARRAY[]::text[]),
  ('marketplace_enabled',     'Marketplace',             'Master switch for the combined marketplace OS. Off = no marketplace surface at all.', false, ARRAY[]::text[]),
  ('marketplace_stays',       'Marketplace — Stays',     'Property stay / booking listing type within the marketplace.', false, ARRAY[]::text[]),
  ('marketplace_suppliers',   'Marketplace — Suppliers', 'Supplier service / package listing type within the marketplace.', false, ARRAY[]::text[]),
  ('marketplace_emergency',   'Marketplace — Emergency', 'Emergency dispatch listing type and emergency supplier chain.', false, ARRAY[]::text[]),
  ('marketplace_payments',    'Marketplace — Payments',  'Marketplace payment capture / payout flows and commission tracking.', false, ARRAY[]::text[]),
  ('marketplace_escrow',      'Marketplace — Escrow',    'Payment authorisation, delayed capture and platform-hold flows.', false, ARRAY[]::text[]),
  ('marketplace_disputes',    'Marketplace — Disputes',  'Unified dispute lifecycle and resolution workflows.', false, ARRAY[]::text[]),
  ('booking_management',      'Booking Management',      'Reservation operations section (calendar, availability, check-in/out, turnover).', false, ARRAY[]::text[]),
  ('direct_booking_pages',    'Direct Booking Pages',    'Public direct-booking pages with reduced/zero platform fee.', false, ARRAY[]::text[]),
  ('customer_workspace',      'Customer Workspace',      'Lightweight customer / guest workspace route group and landing.', false, ARRAY[]::text[]),
  ('supplier_workspace',      'Supplier Workspace',      'Full supplier workspace (services, packages, jobs, payouts) beyond the lightweight portal.', false, ARRAY[]::text[]),
  ('ical_sync',               'iCal Sync',               'Channel iCal import/export for booking availability.', false, ARRAY[]::text[]),
  ('canvas_lite',             'Canvas Lite',             'Lightweight visual canvas / board surface for planning.', false, ARRAY[]::text[]),
  ('multi_country_portfolio', 'Multi-Country Portfolio', 'Per-property country, jurisdiction and currency across a single workspace.', false, ARRAY[]::text[]),
  ('global_country_packs',    'Global Country Packs',    'Country pack legal/tax/compliance depth and support-status gating.', false, ARRAY[]::text[])
ON CONFLICT (flag_key) DO NOTHING;
