-- ============================================================================
-- Supplier workspace DEPTH: notifications + messaging threads.
--
-- Elevates the first-class supplier workspace to operator parity:
--   * supplier_notifications  — a real notification centre fed by supplier
--     events (new lead, job assigned/updated, invoice paid, payout, insurance
--     expiring, dispute). Read state is per-row (read_at).
--   * supplier_message_threads / supplier_messages — a real messaging surface.
--     A thread is anchored to a supplier workspace and (optionally) a job
--     assignment or marketplace lead, with a free-text counterparty label
--     (operator / customer). Messages carry an author side so the supplier UI
--     can render left/right bubbles without a join to auth.
--
-- All tables are workspace-scoped and RLS-guarded via the canonical
-- `public.is_supplier_workspace_member(uuid)` helper (workspace_members OR
-- supplier_workspace_members). Money is not involved. No PostGIS, no new deps.
-- ============================================================================

-- ── Notifications ───────────────────────────────────────────────────────────
create table if not exists public.supplier_notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  -- semantic category drives the icon/tone in the UI
  type text not null default 'info'
    check (type in (
      'lead', 'job', 'quote', 'invoice', 'payout',
      'review', 'verification', 'insurance', 'dispute', 'message', 'info'
    )),
  title text not null,
  body text,
  -- optional deep-link target inside the supplier workspace
  href text,
  -- optional resource pointer (assignment / lead / invoice ...)
  resource_type text,
  resource_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists supplier_notifications_workspace_idx
  on public.supplier_notifications (workspace_id, created_at desc);
create index if not exists supplier_notifications_unread_idx
  on public.supplier_notifications (workspace_id) where read_at is null;

-- ── Message threads ───────────────────────────────────────────────────────────
create table if not exists public.supplier_message_threads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  subject text not null,
  -- who the supplier is talking to
  counterparty_kind text not null default 'operator'
    check (counterparty_kind in ('operator', 'customer', 'platform')),
  counterparty_name text,
  -- optional anchor to a job assignment or a marketplace lead/quote
  assignment_id uuid,
  lead_id uuid,
  last_message_at timestamptz not null default now(),
  -- denormalised unread counter for the supplier side (cheap badge)
  supplier_unread_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists supplier_message_threads_workspace_idx
  on public.supplier_message_threads (workspace_id, last_message_at desc);
create index if not exists supplier_message_threads_assignment_idx
  on public.supplier_message_threads (assignment_id);

-- ── Messages ───────────────────────────────────────────────────────────────
create table if not exists public.supplier_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.supplier_message_threads (id) on delete cascade,
  workspace_id uuid not null,
  -- author side: 'supplier' = us, 'counterparty' = operator/customer, 'system'
  author_side text not null default 'supplier'
    check (author_side in ('supplier', 'counterparty', 'system')),
  author_user_id uuid,
  author_name text,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists supplier_messages_thread_idx
  on public.supplier_messages (thread_id, created_at);
create index if not exists supplier_messages_workspace_idx
  on public.supplier_messages (workspace_id);

-- Keep thread.last_message_at current, and bump supplier unread when the
-- counterparty/system writes (so the badge is event-driven, not polled).
create or replace function public.touch_supplier_message_thread()
returns trigger language plpgsql as $$
begin
  update public.supplier_message_threads t
     set last_message_at = new.created_at,
         supplier_unread_count = case
           when new.author_side = 'supplier' then t.supplier_unread_count
           else t.supplier_unread_count + 1
         end
   where t.id = new.thread_id;
  return new;
end;
$$;

drop trigger if exists trg_touch_supplier_message_thread on public.supplier_messages;
create trigger trg_touch_supplier_message_thread
  after insert on public.supplier_messages
  for each row execute function public.touch_supplier_message_thread();

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.supplier_notifications enable row level security;
alter table public.supplier_message_threads enable row level security;
alter table public.supplier_messages enable row level security;

drop policy if exists supplier_notifications_member_all on public.supplier_notifications;
create policy supplier_notifications_member_all
  on public.supplier_notifications
  for all
  using (public.is_supplier_workspace_member(workspace_id))
  with check (public.is_supplier_workspace_member(workspace_id));

drop policy if exists supplier_message_threads_member_all on public.supplier_message_threads;
create policy supplier_message_threads_member_all
  on public.supplier_message_threads
  for all
  using (public.is_supplier_workspace_member(workspace_id))
  with check (public.is_supplier_workspace_member(workspace_id));

drop policy if exists supplier_messages_member_all on public.supplier_messages;
create policy supplier_messages_member_all
  on public.supplier_messages
  for all
  using (public.is_supplier_workspace_member(workspace_id))
  with check (public.is_supplier_workspace_member(workspace_id));

grant select, insert, update, delete on public.supplier_notifications to authenticated;
grant select, insert, update, delete on public.supplier_message_threads to authenticated;
grant select, insert, update, delete on public.supplier_messages to authenticated;
