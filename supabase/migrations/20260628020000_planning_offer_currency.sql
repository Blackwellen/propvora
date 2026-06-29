-- i18n F42 persistence tail — landlord offers carry their own currency.
-- An offer's money (proposed rent, contract value) should display in the
-- currency of the linked property/jurisdiction, not a hardcoded GBP. Adds a
-- currency column (ISO-4217) defaulting to GBP for back-compat; new offers set
-- it from the linked planning set / property at create time.
alter table public.planning_landlord_offers
  add column if not exists currency text not null default 'GBP';
