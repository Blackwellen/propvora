-- Dedicated operation_profile column for properties.
--
-- Previously the UI derived `operation_profile` from the 5-value `template`
-- enum (standard_rental, hmo, r2r, sa_lite, student_let), which could only
-- represent 5 of the 13 supported operation profiles. This adds a first-class
-- `operation_profile` column so all 13 profiles (long_term_let, rent_to_rent,
-- hmo, student_let, serviced_accommodation, holiday_let, build_to_rent,
-- social_housing, commercial, mixed_use, refinancing, dev_flip, co_living) are
-- representable and queryable. The hook now reads/writes this column directly
-- and keeps `template` valid (NOT NULL) by mapping each profile to its nearest
-- template member (see src/hooks/useProperties.ts PROFILE_TO_TEMPLATE).

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS operation_profile text NOT NULL DEFAULT 'long_term_let';

ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_operation_profile_check;
ALTER TABLE properties
  ADD CONSTRAINT properties_operation_profile_check CHECK (operation_profile IN (
    'long_term_let','rent_to_rent','hmo','student_let','serviced_accommodation',
    'holiday_let','build_to_rent','social_housing','commercial','mixed_use',
    'refinancing','dev_flip','co_living'
  ));

-- Backfill existing rows from their template so the new column is never wrong
-- for legacy data. Only touches rows still on the default.
UPDATE properties SET operation_profile = CASE template
    WHEN 'standard_rental' THEN 'long_term_let'
    WHEN 'hmo'             THEN 'hmo'
    WHEN 'r2r'             THEN 'rent_to_rent'
    WHEN 'sa_lite'         THEN 'serviced_accommodation'
    WHEN 'student_let'     THEN 'student_let'
    ELSE 'long_term_let'
  END
  WHERE operation_profile = 'long_term_let';

CREATE INDEX IF NOT EXISTS idx_properties_operation_profile
  ON properties (workspace_id, operation_profile);
