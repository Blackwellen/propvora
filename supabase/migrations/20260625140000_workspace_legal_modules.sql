-- Custom, workspace-defined LEGAL jurisdiction modules.
--
-- Parity with workspace_compliance_requirements (compliance custom packs). The
-- built-in legal module catalogue (src/lib/legal/jurisdiction.ts) describes the
-- four England & Wales statutory tools (possession / hmo / epc / rra) and a
-- generic research-only stance for every other jurisdiction. This table lets a
-- workspace layer its OWN legal/regulatory guidance on top:
--   * override a built-in module's label + note (e.g. a German operator writes
--     accurate local possession/eviction guidance into the jurisdiction panel)
--   * disable a built-in module (hide its Overview card / mark not-applicable)
--   * add a CUSTOM module card (is_custom = true) for a local regime that has no
--     England & Wales analogue
--
-- SAFETY: custom rows are informational only — they NEVER unlock the England &
-- Wales statutory tooling (Section 8 wizard, HMO register, RRA checklist) for a
-- non-reviewed jurisdiction. They change copy + visibility, not capability.
--
-- A row is either:
--   * a CUSTOM module    (is_custom = true)  — appended as an info card
--   * an OVERRIDE/DISABLE (is_custom = false) — relabels or hides a built-in by module_key

create table if not exists public.workspace_legal_modules (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  -- 'possession' | 'hmo' | 'epc' | 'rra' for overrides; any key for custom modules.
  module_key   text not null,
  label        text,
  note         text,
  icon         text not null default 'scale',
  is_custom    boolean not null default false,
  disabled     boolean not null default false,
  sort_order   integer not null default 0,
  created_by   uuid,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (workspace_id, module_key)
);

create index if not exists idx_wlm_workspace on public.workspace_legal_modules (workspace_id);

alter table public.workspace_legal_modules enable row level security;

-- Read: any member of the workspace.
drop policy if exists wlm_select on public.workspace_legal_modules;
create policy wlm_select on public.workspace_legal_modules
  for select using (
    exists (
      select 1 from public.workspace_members m
      where m.workspace_id = workspace_legal_modules.workspace_id
        and m.user_id = auth.uid()
    )
  );

-- Write: owner / admin / manager of the workspace.
drop policy if exists wlm_write on public.workspace_legal_modules;
create policy wlm_write on public.workspace_legal_modules
  for all using (
    exists (
      select 1 from public.workspace_members m
      where m.workspace_id = workspace_legal_modules.workspace_id
        and m.user_id = auth.uid()
        and m.role::text in ('owner','admin','manager')
    )
  ) with check (
    exists (
      select 1 from public.workspace_members m
      where m.workspace_id = workspace_legal_modules.workspace_id
        and m.user_id = auth.uid()
        and m.role::text in ('owner','admin','manager')
    )
  );
