-- Messaging hardening (Section 10 audit)
-- 1. message_threads previously had only SELECT + INSERT RLS policies. Operators
--    could not UPDATE (archive / rename / bump updated_at) or DELETE their own
--    workspace threads under RLS — the app's best-effort updated_at bump silently
--    failed. Add workspace-scoped UPDATE + DELETE policies.
-- 2. No length CHECK existed on any message body column, so a direct PostgREST /
--    RPC call could store an unbounded blob. Cap content/body at 10,000 chars as a
--    defence-in-depth backstop behind the per-endpoint validation.

-- ── message_threads: UPDATE + DELETE for workspace members ──────────────────
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'message_threads' and policyname = 'message_threads_workspace_update'
  ) then
    create policy message_threads_workspace_update on public.message_threads
      for update
      using (workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid()))
      with check (workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid()));
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'message_threads' and policyname = 'message_threads_workspace_delete'
  ) then
    create policy message_threads_workspace_delete on public.message_threads
      for delete
      using (workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid()));
  end if;
end $$;

-- ── Length CHECK constraints (defence-in-depth) ─────────────────────────────
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'messages_content_len_chk') then
    alter table public.messages
      add constraint messages_content_len_chk check (char_length(content) <= 10000);
  end if;

  if to_regclass('public.supplier_messages') is not null
     and not exists (select 1 from pg_constraint where conname = 'supplier_messages_body_len_chk') then
    alter table public.supplier_messages
      add constraint supplier_messages_body_len_chk check (char_length(body) <= 10000);
  end if;

  if to_regclass('public.customer_messages') is not null
     and not exists (select 1 from pg_constraint where conname = 'customer_messages_body_len_chk') then
    alter table public.customer_messages
      add constraint customer_messages_body_len_chk check (char_length(body) <= 10000);
  end if;
end $$;
