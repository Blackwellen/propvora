-- AI metering tables: rate counters, per-call usage ledger, daily token rollup
-- These are required by the AI gateway (src/lib/ai/gateway.ts) for rate limiting.
-- Without them the gateway fails closed and blocks all AI chat.

create table if not exists ai_rate_counters (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  window_key      text not null,          -- e.g. "2026-06-18T14:00"  (hourly bucket)
  model           text not null default 'default',
  request_count   integer not null default 0,
  token_count     bigint  not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (workspace_id, window_key, model)
);

create table if not exists ai_usage_metering (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete set null,
  session_id      text,
  model           text not null,
  prompt_tokens   integer not null default 0,
  completion_tokens integer not null default 0,
  total_tokens    integer not null default 0,
  cost_usd_micro  bigint  not null default 0,  -- cost in micro-dollars (1 = $0.000001)
  endpoint        text,
  status          text not null default 'ok',
  latency_ms      integer,
  created_at      timestamptz not null default now()
);

create table if not exists ai_token_usage (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  day             date not null,
  model           text not null default 'default',
  total_requests  integer not null default 0,
  prompt_tokens   bigint  not null default 0,
  completion_tokens bigint not null default 0,
  total_tokens    bigint  not null default 0,
  cost_usd_micro  bigint  not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (workspace_id, day, model)
);

-- Indexes for common query patterns
create index if not exists ai_rate_counters_ws_window  on ai_rate_counters  (workspace_id, window_key);
create index if not exists ai_usage_metering_ws_time   on ai_usage_metering (workspace_id, created_at desc);
create index if not exists ai_token_usage_ws_day       on ai_token_usage    (workspace_id, day desc);

-- Updated_at triggers
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'ai_rate_counters_updated_at') then
    create trigger ai_rate_counters_updated_at
      before update on ai_rate_counters
      for each row execute function set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'ai_token_usage_updated_at') then
    create trigger ai_token_usage_updated_at
      before update on ai_token_usage
      for each row execute function set_updated_at();
  end if;
end $$;

-- RLS: workspace members can only see their own workspace's AI usage
alter table ai_rate_counters  enable row level security;
alter table ai_usage_metering enable row level security;
alter table ai_token_usage    enable row level security;

create policy "workspace members read own ai_rate_counters"
  on ai_rate_counters for select
  using (
    workspace_id in (
      select workspace_id from workspace_members
      where user_id = auth.uid()
    )
  );

create policy "workspace members read own ai_usage_metering"
  on ai_usage_metering for select
  using (
    workspace_id in (
      select workspace_id from workspace_members
      where user_id = auth.uid()
    )
  );

create policy "workspace members read own ai_token_usage"
  on ai_token_usage for select
  using (
    workspace_id in (
      select workspace_id from workspace_members
      where user_id = auth.uid()
    )
  );

-- Service role can insert/update (called from server-side AI gateway only)
create policy "service role manage ai_rate_counters"
  on ai_rate_counters for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "service role manage ai_usage_metering"
  on ai_usage_metering for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "service role manage ai_token_usage"
  on ai_token_usage for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
