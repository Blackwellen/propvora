-- CROSS-CUTTING — PARTNER NETWORK
-- Idempotent / additive. Adds a single DERIVED/cached relationship-graph table
-- that ties the v2 modules together: operators <-> suppliers <-> customers <->
-- marketplace counterparties.
--
-- HONESTY: `partner_relationships` is a CACHE. It is NOT a source of truth and
-- carries no business state of its own — every row is recomputed by aggregating
-- already-recorded events from the owning modules:
--   * supplier_connections        (operator <-> supplier links)          [P3]
--   * marketplace_transactions     (buyer <-> seller counterparties)       [P2]
--   * bookings                     (operator <-> customer_workspace)       [P4/P7]
-- The recompute function below is the canonical derivation; the app calls it
-- best-effort on page load. No event is invented here — if a workspace has no
-- recorded interactions it has no partner rows.
--
-- RLS model:
--   * A workspace member READs only rows their workspace OWNS (workspace_id).
--   * No tenant writes — the graph is populated only by the SECURITY DEFINER
--     recompute function (and platform admins). No cross-workspace leakage.

-- ── partner_relationships: cached directed relationship graph ────────────────
create table if not exists public.partner_relationships (
  id                   uuid primary key default gen_random_uuid(),
  workspace_id         uuid not null,                       -- owner (the viewer)
  partner_workspace_id uuid not null,                       -- the counterparty
  relationship_type    text not null
    check (relationship_type in ('supplier','operator','customer','marketplace_seller','marketplace_buyer')),
  status               text not null default 'active'
    check (status in ('active','pending','ended')),
  first_interaction_at timestamptz,
  last_interaction_at  timestamptz,
  interaction_count    integer not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (workspace_id, partner_workspace_id, relationship_type)
);

create index if not exists partner_rel_workspace_idx on public.partner_relationships (workspace_id);
create index if not exists partner_rel_partner_idx    on public.partner_relationships (partner_workspace_id);
create index if not exists partner_rel_type_idx       on public.partner_relationships (workspace_id, relationship_type);
create index if not exists partner_rel_last_idx       on public.partner_relationships (workspace_id, last_interaction_at desc);

-- ── recompute function: derive the graph for ONE workspace ───────────────────
-- SECURITY DEFINER so the aggregation can read sibling-module tables under RLS,
-- but it ONLY ever writes rows owned by the passed workspace. Tolerant of any
-- module table being absent on a cold branch (each block is independently
-- guarded — a missing relation is skipped, not fatal).
create or replace function public.recompute_partner_graph(_workspace_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  _affected integer := 0;
begin
  if _workspace_id is null then
    return 0;
  end if;

  -- 1) SUPPLIER CONNECTIONS (P3): operator<->supplier, bidirectional.
  --    From the operator's view the partner is a 'supplier'; from the
  --    supplier's view the partner is an 'operator'.
  begin
    -- operator side
    insert into public.partner_relationships
      (workspace_id, partner_workspace_id, relationship_type, status,
       first_interaction_at, last_interaction_at, interaction_count)
    select sc.operator_workspace_id, sc.supplier_workspace_id, 'supplier',
           case when sc.status in ('active','accepted','connected') then 'active'
                when sc.status in ('pending','invited','requested') then 'pending'
                else 'ended' end,
           min(sc.created_at), max(coalesce(sc.updated_at, sc.created_at)), count(*)
    from public.supplier_connections sc
    where sc.operator_workspace_id = _workspace_id
      and sc.supplier_workspace_id is not null
    group by sc.operator_workspace_id, sc.supplier_workspace_id, sc.status
    on conflict (workspace_id, partner_workspace_id, relationship_type) do update
      set status = excluded.status,
          first_interaction_at = least(public.partner_relationships.first_interaction_at, excluded.first_interaction_at),
          last_interaction_at  = greatest(public.partner_relationships.last_interaction_at, excluded.last_interaction_at),
          interaction_count    = excluded.interaction_count,
          updated_at = now();
    get diagnostics _affected = row_count;

    -- supplier side (this workspace IS the supplier, partner is the operator)
    insert into public.partner_relationships
      (workspace_id, partner_workspace_id, relationship_type, status,
       first_interaction_at, last_interaction_at, interaction_count)
    select sc.supplier_workspace_id, sc.operator_workspace_id, 'operator',
           case when sc.status in ('active','accepted','connected') then 'active'
                when sc.status in ('pending','invited','requested') then 'pending'
                else 'ended' end,
           min(sc.created_at), max(coalesce(sc.updated_at, sc.created_at)), count(*)
    from public.supplier_connections sc
    where sc.supplier_workspace_id = _workspace_id
      and sc.operator_workspace_id is not null
    group by sc.supplier_workspace_id, sc.operator_workspace_id, sc.status
    on conflict (workspace_id, partner_workspace_id, relationship_type) do update
      set status = excluded.status,
          first_interaction_at = least(public.partner_relationships.first_interaction_at, excluded.first_interaction_at),
          last_interaction_at  = greatest(public.partner_relationships.last_interaction_at, excluded.last_interaction_at),
          interaction_count    = excluded.interaction_count,
          updated_at = now();
  exception when undefined_table then null;
  end;

  -- 2) MARKETPLACE TRANSACTIONS (P2): buyer<->seller counterparties.
  --    From the buyer's view partner is a 'marketplace_seller'; vice versa.
  begin
    insert into public.partner_relationships
      (workspace_id, partner_workspace_id, relationship_type, status,
       first_interaction_at, last_interaction_at, interaction_count)
    select mt.buyer_workspace_id, mt.seller_workspace_id, 'marketplace_seller',
           'active', min(mt.created_at), max(coalesce(mt.updated_at, mt.created_at)), count(*)
    from public.marketplace_transactions mt
    where mt.buyer_workspace_id = _workspace_id
      and mt.seller_workspace_id is not null
      and mt.seller_workspace_id <> mt.buyer_workspace_id
    group by mt.buyer_workspace_id, mt.seller_workspace_id
    on conflict (workspace_id, partner_workspace_id, relationship_type) do update
      set status = 'active',
          first_interaction_at = least(public.partner_relationships.first_interaction_at, excluded.first_interaction_at),
          last_interaction_at  = greatest(public.partner_relationships.last_interaction_at, excluded.last_interaction_at),
          interaction_count    = excluded.interaction_count,
          updated_at = now();

    insert into public.partner_relationships
      (workspace_id, partner_workspace_id, relationship_type, status,
       first_interaction_at, last_interaction_at, interaction_count)
    select mt.seller_workspace_id, mt.buyer_workspace_id, 'marketplace_buyer',
           'active', min(mt.created_at), max(coalesce(mt.updated_at, mt.created_at)), count(*)
    from public.marketplace_transactions mt
    where mt.seller_workspace_id = _workspace_id
      and mt.buyer_workspace_id is not null
      and mt.seller_workspace_id <> mt.buyer_workspace_id
    group by mt.seller_workspace_id, mt.buyer_workspace_id
    on conflict (workspace_id, partner_workspace_id, relationship_type) do update
      set status = 'active',
          first_interaction_at = least(public.partner_relationships.first_interaction_at, excluded.first_interaction_at),
          last_interaction_at  = greatest(public.partner_relationships.last_interaction_at, excluded.last_interaction_at),
          interaction_count    = excluded.interaction_count,
          updated_at = now();
  exception when undefined_table then null;
  end;

  -- 3) BOOKINGS (P4/P7): operator<->customer_workspace.
  --    The booking's workspace_id is the operator/host; customer_workspace_id is
  --    the booking customer. From the operator's view partner is a 'customer';
  --    from the customer's view partner is an 'operator'.
  begin
    insert into public.partner_relationships
      (workspace_id, partner_workspace_id, relationship_type, status,
       first_interaction_at, last_interaction_at, interaction_count)
    select b.workspace_id, b.customer_workspace_id, 'customer',
           'active', min(b.created_at), max(coalesce(b.updated_at, b.created_at)), count(*)
    from public.bookings b
    where b.workspace_id = _workspace_id
      and b.customer_workspace_id is not null
      and b.customer_workspace_id <> b.workspace_id
    group by b.workspace_id, b.customer_workspace_id
    on conflict (workspace_id, partner_workspace_id, relationship_type) do update
      set status = 'active',
          first_interaction_at = least(public.partner_relationships.first_interaction_at, excluded.first_interaction_at),
          last_interaction_at  = greatest(public.partner_relationships.last_interaction_at, excluded.last_interaction_at),
          interaction_count    = excluded.interaction_count,
          updated_at = now();

    insert into public.partner_relationships
      (workspace_id, partner_workspace_id, relationship_type, status,
       first_interaction_at, last_interaction_at, interaction_count)
    select b.customer_workspace_id, b.workspace_id, 'operator',
           'active', min(b.created_at), max(coalesce(b.updated_at, b.created_at)), count(*)
    from public.bookings b
    where b.customer_workspace_id = _workspace_id
      and b.workspace_id is not null
      and b.customer_workspace_id <> b.workspace_id
    group by b.customer_workspace_id, b.workspace_id
    on conflict (workspace_id, partner_workspace_id, relationship_type) do update
      set status = 'active',
          first_interaction_at = least(public.partner_relationships.first_interaction_at, excluded.first_interaction_at),
          last_interaction_at  = greatest(public.partner_relationships.last_interaction_at, excluded.last_interaction_at),
          interaction_count    = excluded.interaction_count,
          updated_at = now();
  exception when undefined_table then null;
  end;

  select count(*) into _affected
  from public.partner_relationships where workspace_id = _workspace_id;
  return _affected;
end;
$$;

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.partner_relationships enable row level security;

-- Platform admin full control.
drop policy if exists partner_rel_admin_all on public.partner_relationships;
create policy partner_rel_admin_all on public.partner_relationships
  for all using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

-- Workspace members read ONLY rows their workspace owns. No cross-workspace
-- leakage: a workspace cannot see relationship rows where it is the *partner*.
drop policy if exists partner_rel_owner_read on public.partner_relationships;
create policy partner_rel_owner_read on public.partner_relationships
  for select using (public.is_workspace_member(workspace_id));

-- No tenant INSERT/UPDATE/DELETE policy: writes happen only through the
-- SECURITY DEFINER recompute function (or platform admin).

-- Allow authenticated users to invoke the recompute function for their own
-- workspace; the function body only writes rows for the passed workspace and is
-- self-scoped, so a caller cannot populate another workspace's graph with
-- foreign data (the aggregation filters by the passed id).
grant execute on function public.recompute_partner_graph(uuid) to authenticated;
