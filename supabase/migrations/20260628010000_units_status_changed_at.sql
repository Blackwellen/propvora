-- units.status_changed_at — records when a unit's status last changed, so the
-- void-period automation triggers (void_period_started, void_period_long,
-- unit_vacant, hmo_room_vacant, viewing_not_booked in src/lib/automation/evaluate.ts)
-- can compute how long a unit has been vacant. The column was referenced by those
-- queries but never existed, so the triggers errored and never fired.

alter table units add column if not exists status_changed_at timestamptz;

-- Backfill: best-effort "vacant since" — the end date of the unit's most recent
-- tenancy (when it became empty), falling back to the unit's creation time.
update units u
set status_changed_at = coalesce(
  (select max(t.end_date) from tenancies t where t.unit_id = u.id and t.end_date is not null)::timestamptz,
  u.created_at
)
where status_changed_at is null;

-- Maintain it: stamp now() whenever the status actually changes (and on insert
-- when not explicitly provided).
create or replace function set_unit_status_changed_at()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    if new.status_changed_at is null then new.status_changed_at := now(); end if;
  elsif new.status is distinct from old.status then
    new.status_changed_at := now();
  end if;
  return new;
end $$;

drop trigger if exists trg_unit_status_changed_at on units;
create trigger trg_unit_status_changed_at
  before insert or update on units
  for each row execute function set_unit_status_changed_at();
