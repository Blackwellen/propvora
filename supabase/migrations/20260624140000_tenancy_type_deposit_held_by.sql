-- Restore `tenancy_type` and `deposit_held_by` on the canonical `tenancies` table.
--
-- The original 001 schema had both columns, but the rich-lineage rebuild of
-- `tenancies` dropped them. The Create Tenancy wizard collects both (tenancy
-- type: AST / periodic / HMO room / contractual / lodger / commercial; deposit
-- held by: scheme / landlord / agent) and `useTenancies.fromDb` already reads
-- them, so without these columns the values were silently discarded on create.
--
-- Free text (no CHECK) to avoid rejecting the app's option keys; the UI owns the
-- canonical label sets (TENANCY_TYPES / DEPOSIT_HOLDERS).

ALTER TABLE tenancies ADD COLUMN IF NOT EXISTS tenancy_type text;
ALTER TABLE tenancies ADD COLUMN IF NOT EXISTS deposit_held_by text;
