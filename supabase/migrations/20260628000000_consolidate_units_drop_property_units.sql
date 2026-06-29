-- Consolidate the two unit tables onto the canonical `units` table.
--
-- `units` is canonical: every foreign key in the schema (tenancies, bills,
-- booking_listings, booking_availability, booking_requests, public_enquiries,
-- unit_media) references units.id, and the property-creation wizard writes to it.
-- `property_units` was a stranded duplicate that NOTHING referenced via FK — it was
-- only read by the Home dashboard, Portfolio, tenant-portal, gallery and the AI
-- copilot, which therefore showed unit numbers disconnected from the real
-- tenancy/billing data. App code has been repointed to `units`; this migration
-- moves any real (non-demo) property_units rows across and drops the table.
--
-- Column map: unit_name→label, floor_area_sqm→size_sqm, target_rent→rent_amount,
-- floor(int)→floor(text). Status map onto the units_status_check domain
-- (available|occupied|maintenance|offline): occupied→occupied,
-- under_works/maintenance→maintenance, vacant/reserved/other→available.

do $$
begin
  if to_regclass('public.property_units') is not null then
    insert into units (
      id, workspace_id, property_id, label, unit_type, floor,
      bedrooms, bathrooms, size_sqm, rent_amount, status, demo,
      created_at, updated_at
    )
    select
      pu.id, pu.workspace_id, pu.property_id, pu.unit_name, pu.unit_type,
      pu.floor::text, pu.bedrooms, pu.bathrooms, pu.floor_area_sqm, pu.target_rent,
      case
        when pu.status = 'occupied' then 'occupied'
        when pu.status in ('under_works', 'maintenance') then 'maintenance'
        else 'available'
      end,
      false, pu.created_at, pu.updated_at
    from property_units pu
    where not coalesce(pu.is_demo, false)
    on conflict (id) do nothing;

    drop table property_units cascade;
  end if;
end $$;
