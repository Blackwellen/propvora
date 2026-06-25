-- Custom, workspace-defined compliance requirement packs.
--
-- The built-in per-jurisdiction catalogue (src/lib/compliance/requirements.ts)
-- provides reviewed defaults for 20 countries. This table lets a workspace layer
-- its OWN requirements on top: add bespoke requirement types (e.g. selective
-- licensing, build-to-rent, local council schemes), and disable built-ins that
-- don't apply. This shifts legal authorship to the operator and covers the long
-- tail no static pack can.
--
-- A row is either:
--   * a CUSTOM requirement  (is_custom = true)  — appended to the jurisdiction set
--   * a DISABLE marker       (is_custom = false, disabled = true) — hides a built-in
--                                                                    by its req_key

create table if not exists public.workspace_compliance_requirements (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  -- Catalogue key. For custom rows it's the new key; for disable markers it's the
  -- built-in requirement key being hidden.
  req_key      text not null,
  label        text,
  helper       text,
  critical     boolean not null default false,
  -- Enum-safe value mirrored into compliance_items.kind. Constrained to the live
  -- compliance_kind members so inserts downstream never violate the column type.
  kind         text not null default 'other'
                 check (kind in ('gas_safety','eicr','epc','fire_alarm','hmo_licence','insurance','pat','other')),
  icon         text not null default 'file',
  is_custom    boolean not null default true,
  disabled     boolean not null default false,
  sort_order   integer not null default 0,
  created_by   uuid,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (workspace_id, req_key)
);

create index if not exists idx_wcr_workspace on public.workspace_compliance_requirements (workspace_id);

alter table public.workspace_compliance_requirements enable row level security;

-- Read: any member of the workspace.
drop policy if exists wcr_select on public.workspace_compliance_requirements;
create policy wcr_select on public.workspace_compliance_requirements
  for select using (
    exists (
      select 1 from public.workspace_members m
      where m.workspace_id = workspace_compliance_requirements.workspace_id
        and m.user_id = auth.uid()
    )
  );

-- Write: owner / admin / manager of the workspace.
drop policy if exists wcr_write on public.workspace_compliance_requirements;
create policy wcr_write on public.workspace_compliance_requirements
  for all using (
    exists (
      select 1 from public.workspace_members m
      where m.workspace_id = workspace_compliance_requirements.workspace_id
        and m.user_id = auth.uid()
        and m.role::text in ('owner','admin','manager')
    )
  ) with check (
    exists (
      select 1 from public.workspace_members m
      where m.workspace_id = workspace_compliance_requirements.workspace_id
        and m.user_id = auth.uid()
        and m.role::text in ('owner','admin','manager')
    )
  );
