-- ============================================================
-- V1 launch feature-flag state.
--
-- Sets platform_feature_flags so that ONLY V1 + Ops surfaces are live; every
-- V1.5 and V2 surface (marketplace, customer/supplier workspaces, accounting GL,
-- full automations, direct booking pages, country packs, escrow, agency network)
-- is OFF. V1 stays: portals (kill-switches), planning, AI copilot, context
-- engine, and the V1 automations/recipes surface (automations + canvas_lite).
--
-- Idempotent: safe to re-run. A founder turns an individual surface on later via
-- Admin > Feature Flags (or a follow-up migration) when it is ready to ship.
-- ============================================================

UPDATE public.platform_feature_flags
SET enabled = false, updated_at = now()
WHERE flag_key IN (
  -- Marketplace (V2)
  'marketplace', 'marketplace_enabled', 'marketplace_stays', 'marketplace_suppliers',
  'marketplace_emergency', 'marketplace_payments', 'marketplace_escrow', 'marketplace_disputes',
  'escrow', 'agency_network', 'supplier_directory', 'seller_verification_required',
  -- Booking surfaces (V1.5/V2)
  'booking_management', 'direct_booking_pages', 'public_bookings', 'ical_sync',
  -- Customer / supplier workspaces + their registration (V2)
  'customer_workspace', 'supplier_workspace', 'registration_customer', 'registration_supplier',
  -- Global / accounting / full automations (V2)
  'multi_country_portfolio', 'global_country_packs', 'accounting_gl', 'automations_full'
);
