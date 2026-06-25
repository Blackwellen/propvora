-- Planning-set documents: table + private storage bucket + workspace-scoped RLS.
-- Backs the Planning › Sets › Documents tab (upload-only, signed-URL viewing).

create table if not exists public.planning_documents (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces(id) on delete cascade,
  planning_set_id uuid not null,
  title           text not null,
  file_name       text,
  file_path       text,
  file_url        text,
  category        text not null default 'property',
  status          text not null default 'uploaded',
  expires_at      timestamptz,
  linked_to       text,
  notes           text,
  uploaded_by     uuid,
  uploaded_at     timestamptz default now(),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table public.planning_documents enable row level security;

drop policy if exists workspace_member_access on public.planning_documents;
create policy workspace_member_access on public.planning_documents
  for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create index if not exists idx_planning_documents_set on public.planning_documents(planning_set_id);
create index if not exists idx_planning_documents_ws  on public.planning_documents(workspace_id);

-- Private storage bucket for planning-set document uploads.
insert into storage.buckets (id, name, public)
values ('planning-documents', 'planning-documents', false)
on conflict (id) do nothing;

-- Storage RLS: a workspace member may read/write objects under their own
-- workspace folder, i.e. path = {workspace_id}/{planning_set_id}/{file}.
drop policy if exists planning_docs_rw on storage.objects;
create policy planning_docs_rw on storage.objects
  for all to authenticated
  using (
    bucket_id = 'planning-documents'
    and public.is_workspace_member(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'planning-documents'
    and public.is_workspace_member(((storage.foldername(name))[1])::uuid)
  );
