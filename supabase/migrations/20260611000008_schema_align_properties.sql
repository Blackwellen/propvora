-- ============================================================
-- Schema alignment (enrich): add app-only fields the live
-- `properties` table lacks, so app reads/writes round-trip.
-- Renamed fields (name↔nickname, property_type/operation_profile↔template,
-- target_rent↔target_rent_pcm, monthly_mortgage↔mortgage_outstanding,
-- is_demo↔demo) are handled by the hook adapter, not added here.
-- Idempotent.
-- ============================================================
ALTER TABLE properties ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS county TEXT;
