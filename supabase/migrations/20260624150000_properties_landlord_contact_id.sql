-- Restore `landlord_contact_id` on the canonical `properties` table.
--
-- The original 001 schema linked a property to its owner via
-- `landlord_contact_id` (FK -> contacts), but the rich-lineage rebuild of
-- `properties` dropped it (only `ownership_type` remained). The Add Property
-- wizard's Contacts step lets the user pick an owner from their contacts, so a
-- column is required to persist that link. ON DELETE SET NULL so deleting a
-- contact never blocks/cascades into property deletion.

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS landlord_contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_properties_landlord_contact_id
  ON properties (landlord_contact_id);
