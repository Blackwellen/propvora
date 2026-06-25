-- Add a first-class `unit_type` column to the canonical `units` table.
--
-- The Add Unit wizard collects a unit type (Room / En-suite / Studio / Flat /
-- Suite / Office / Other) but the live `units` table had no column to store it
-- (only the boolean `is_ensuite` + richer HMO room fields). The value was
-- therefore silently dropped on create. `useUnits.fromDb` already reads
-- `unit_type`, so this column makes the round-trip lossless.
--
-- Free text (no CHECK) so the wizard's `en_suite` key and any future types are
-- accepted; the app normalises display labels in UNIT_TYPES.

ALTER TABLE units ADD COLUMN IF NOT EXISTS unit_type text;
