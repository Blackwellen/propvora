-- ============================================================================
-- Supplier SERVICE ZONES + multi-zone team assignment.
--
-- A supplier workspace's coverage today is a flat set of areas
-- (`supplier_workspace_coverage_areas`). Zones add a richer, named layer:
--   * a named zone (e.g. "Central London", "North circuit") that bundles a
--     shape: radius / postcode-prefix / region / drawn polygon,
--   * the ability to assign MULTIPLE zones to a team member (multi-zone per
--     team), so dispatch + lead routing can be zone-aware.
--
-- Both tables are workspace-scoped and RLS-guarded to workspace members. Money
-- is not involved here. Polygons are stored as JSONB arrays of [lng,lat] pairs
-- (no PostGIS dependency) — the app does point-in-polygon in `zones.ts`.
-- ============================================================================

create table if not exists public.supplier_service_zones (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  name text not null,
  colour text not null default '#2563EB',
  shape_type text not null default 'radius'
    check (shape_type in ('radius', 'postcode', 'region', 'polygon')),
  -- radius shape
  centre_lat numeric,
  centre_lng numeric,
  radius_km integer,
  -- postcode / region shape
  value text,
  -- polygon shape: jsonb array of [lng, lat] pairs
  polygon jsonb,
  is_active boolean not null default true,
  priority integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists supplier_service_zones_workspace_idx
  on public.supplier_service_zones (workspace_id);

-- Multi-zone team assignment: a member may be assigned to many zones, and a
-- zone may hold many members (many-to-many).
create table if not exists public.supplier_zone_assignments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  zone_id uuid not null references public.supplier_service_zones (id) on delete cascade,
  member_id uuid not null,
  created_at timestamptz not null default now(),
  unique (zone_id, member_id)
);

create index if not exists supplier_zone_assignments_workspace_idx
  on public.supplier_zone_assignments (workspace_id);
create index if not exists supplier_zone_assignments_member_idx
  on public.supplier_zone_assignments (member_id);

-- updated_at touch
create or replace function public.touch_supplier_service_zones()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_supplier_service_zones on public.supplier_service_zones;
create trigger trg_touch_supplier_service_zones
  before update on public.supplier_service_zones
  for each row execute function public.touch_supplier_service_zones();

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.supplier_service_zones enable row level security;
alter table public.supplier_zone_assignments enable row level security;

-- Membership boundary reuses the canonical helper
-- `public.is_supplier_workspace_member(uuid)` already defined in the supplier
-- workspace migrations (workspace_members OR supplier_workspace_members).

drop policy if exists supplier_service_zones_member_all on public.supplier_service_zones;
create policy supplier_service_zones_member_all
  on public.supplier_service_zones
  for all
  using (public.is_supplier_workspace_member(workspace_id))
  with check (public.is_supplier_workspace_member(workspace_id));

drop policy if exists supplier_zone_assignments_member_all on public.supplier_zone_assignments;
create policy supplier_zone_assignments_member_all
  on public.supplier_zone_assignments
  for all
  using (public.is_supplier_workspace_member(workspace_id))
  with check (public.is_supplier_workspace_member(workspace_id));

grant select, insert, update, delete on public.supplier_service_zones to authenticated;
grant select, insert, update, delete on public.supplier_zone_assignments to authenticated;
