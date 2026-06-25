-- ============================================================
-- 016_planning_level2.sql
-- Full planning engine tables with workspace-scoped RLS
-- ============================================================

-- ── planning_profiles ──────────────────────────────────────────────────────
create table if not exists public.planning_profiles (
  id                    uuid primary key default gen_random_uuid(),
  workspace_id          uuid not null references public.workspaces(id) on delete cascade,
  slug                  text not null,
  name                  text not null,
  category              text not null,
  short_description     text,
  risk_level            text not null default 'Medium',
  management_intensity  text not null default 'Medium',
  compliance_intensity  text not null default 'Medium',
  gross_yield_min       numeric(5,2),
  gross_yield_max       numeric(5,2),
  roi_min               numeric(5,2),
  roi_max               numeric(5,2),
  colour_token          text,
  icon_key              text,
  sort_order            integer default 0,
  is_active             boolean default true,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now(),
  unique(workspace_id, slug)
);

-- ── planning_sets ──────────────────────────────────────────────────────────
create table if not exists public.planning_sets (
  id                          uuid primary key default gen_random_uuid(),
  workspace_id                uuid not null references public.workspaces(id) on delete cascade,
  owner_id                    uuid references auth.users(id),
  profile_key                 text not null,
  name                        text not null,
  address                     text,
  postcode                    text,
  property_type               text,
  units_count                 integer default 1,
  rooms_count                 integer default 1,
  status                      text not null default 'draft',
  stage                       text,
  risk_score                  integer default 0,
  risk_level                  text default 'Low',
  target_net_monthly          numeric(10,2) default 0,
  gross_monthly               numeric(10,2) default 0,
  net_monthly                 numeric(10,2) default 0,
  upfront_cash                numeric(12,2) default 0,
  margin_percent              numeric(5,2) default 0,
  conversion_percent          numeric(5,2) default 0,
  forecast_readiness_percent  numeric(5,2) default 0,
  offer_stage                 text,
  notes                       text,
  tags                        text[],
  created_at                  timestamptz default now(),
  updated_at                  timestamptz default now()
);

-- ── planning_assumptions ───────────────────────────────────────────────────
create table if not exists public.planning_assumptions (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null references public.workspaces(id) on delete cascade,
  planning_set_id   uuid not null references public.planning_sets(id) on delete cascade,
  assumption_type   text not null,
  label             text not null,
  value             numeric(14,4),
  unit              text,
  confidence        text default 'medium',
  source            text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ── planning_income_lines ──────────────────────────────────────────────────
create table if not exists public.planning_income_lines (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid not null references public.workspaces(id) on delete cascade,
  planning_set_id  uuid not null references public.planning_sets(id) on delete cascade,
  label            text not null,
  amount           numeric(10,2) not null default 0,
  frequency        text not null default 'monthly',
  quantity         integer default 1,
  notes            text,
  created_at       timestamptz default now()
);

-- ── planning_expense_lines ─────────────────────────────────────────────────
create table if not exists public.planning_expense_lines (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid not null references public.workspaces(id) on delete cascade,
  planning_set_id  uuid not null references public.planning_sets(id) on delete cascade,
  label            text not null,
  amount           numeric(10,2) not null default 0,
  frequency        text not null default 'monthly',
  category         text,
  fixed_or_variable text default 'fixed',
  notes            text,
  created_at       timestamptz default now()
);

-- ── planning_bills ─────────────────────────────────────────────────────────
create table if not exists public.planning_bills (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null references public.workspaces(id) on delete cascade,
  planning_set_id   uuid not null references public.planning_sets(id) on delete cascade,
  label             text not null,
  amount            numeric(10,2) not null default 0,
  frequency         text not null default 'monthly',
  responsibility    text default 'landlord',
  included_in_rent  boolean default false,
  notes             text,
  created_at        timestamptz default now()
);

-- ── planning_upfront_costs ─────────────────────────────────────────────────
create table if not exists public.planning_upfront_costs (
  id                          uuid primary key default gen_random_uuid(),
  workspace_id                uuid not null references public.workspaces(id) on delete cascade,
  planning_set_id             uuid not null references public.planning_sets(id) on delete cascade,
  label                       text not null,
  amount                      numeric(12,2) not null default 0,
  category                    text,
  required_before_conversion  boolean default false,
  notes                       text,
  created_at                  timestamptz default now()
);

-- ── planning_compliance_items ──────────────────────────────────────────────
create table if not exists public.planning_compliance_items (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid not null references public.workspaces(id) on delete cascade,
  planning_set_id  uuid not null references public.planning_sets(id) on delete cascade,
  label            text not null,
  requirement_type text,
  required         boolean default true,
  status           text default 'pending',
  due_date         date,
  estimated_cost   numeric(10,2),
  notes            text,
  created_at       timestamptz default now()
);

-- ── planning_offers ────────────────────────────────────────────────────────
create table if not exists public.planning_offers (
  id                      uuid primary key default gen_random_uuid(),
  workspace_id            uuid not null references public.workspaces(id) on delete cascade,
  planning_set_id         uuid references public.planning_sets(id) on delete cascade,
  landlord_name           text,
  landlord_contact_id     uuid,
  property_address        text,
  planning_profile_key    text,
  status                  text not null default 'draft',
  offer_amount_monthly    numeric(10,2) default 0,
  term_months             integer,
  break_clause_months     integer,
  deposit                 numeric(10,2),
  expiry_date             date,
  acceptance_probability  integer default 0,
  last_activity_at        timestamptz,
  notes                   text,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

-- ── planning_forecasts ─────────────────────────────────────────────────────
create table if not exists public.planning_forecasts (
  id                  uuid primary key default gen_random_uuid(),
  workspace_id        uuid not null references public.workspaces(id) on delete cascade,
  planning_set_id     uuid not null references public.planning_sets(id) on delete cascade,
  scenario_type       text default 'base',
  month_index         integer not null,
  month_date          date not null,
  gross_income        numeric(10,2) default 0,
  operating_costs     numeric(10,2) default 0,
  bills               numeric(10,2) default 0,
  financing_costs     numeric(10,2) default 0,
  net_cashflow        numeric(10,2) default 0,
  cumulative_cashflow numeric(12,2) default 0,
  created_at          timestamptz default now()
);

-- ── planning_scenarios ─────────────────────────────────────────────────────
create table if not exists public.planning_scenarios (
  id                    uuid primary key default gen_random_uuid(),
  workspace_id          uuid not null references public.workspaces(id) on delete cascade,
  planning_set_id       uuid not null references public.planning_sets(id) on delete cascade,
  name                  text not null,
  scenario_type         text not null default 'base',
  assumptions_json      jsonb,
  net_monthly           numeric(10,2) default 0,
  annual_cashflow       numeric(12,2) default 0,
  breakeven_months      integer,
  risk_score            integer default 0,
  confidence_score      integer default 0,
  occupancy_pct         numeric(5,2),
  total_costs_monthly   numeric(10,2) default 0,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- ── planning_conversion_checklists ────────────────────────────────────────
create table if not exists public.planning_conversion_checklists (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid not null references public.workspaces(id) on delete cascade,
  planning_set_id  uuid not null references public.planning_sets(id) on delete cascade,
  item_key         text not null,
  label            text not null,
  category         text,
  required         boolean default true,
  status           text default 'pending',
  blocker          boolean default false,
  completed_at     timestamptz,
  completed_by     uuid,
  created_at       timestamptz default now()
);

-- ── planning_activity ──────────────────────────────────────────────────────
-- Schema matches the live table (source of truth). Columns: action / detail /
-- user_id / metadata. (An earlier draft used action_type/title/description/
-- actor_id; the live DB never adopted it — kept aligned here for fresh-DB parity.)
create table if not exists public.planning_activity (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid not null references public.workspaces(id) on delete cascade,
  planning_set_id  uuid not null,
  user_id          uuid,
  action           text not null,
  detail           text,
  metadata         jsonb,
  created_at       timestamptz default now()
);

-- ── planning_saved_views ───────────────────────────────────────────────────
create table if not exists public.planning_saved_views (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  user_id       uuid references auth.users(id),
  page_key      text not null,
  name          text not null,
  filters_json  jsonb,
  columns_json  jsonb,
  sort_json     jsonb,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ============================================================
-- Enable RLS on all planning tables
-- ============================================================

alter table public.planning_profiles              enable row level security;
alter table public.planning_sets                  enable row level security;
alter table public.planning_assumptions           enable row level security;
alter table public.planning_income_lines          enable row level security;
alter table public.planning_expense_lines         enable row level security;
alter table public.planning_bills                 enable row level security;
alter table public.planning_upfront_costs         enable row level security;
alter table public.planning_compliance_items      enable row level security;
alter table public.planning_offers                enable row level security;
alter table public.planning_forecasts             enable row level security;
alter table public.planning_scenarios             enable row level security;
alter table public.planning_conversion_checklists enable row level security;
alter table public.planning_activity              enable row level security;
alter table public.planning_saved_views           enable row level security;

-- ============================================================
-- RLS Policies — workspace member access on all tables
-- ============================================================

create policy "workspace_member_access" on public.planning_profiles
  for all using (
    workspace_id in (
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  );

create policy "workspace_member_access" on public.planning_sets
  for all using (
    workspace_id in (
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  );

create policy "workspace_member_access" on public.planning_assumptions
  for all using (
    workspace_id in (
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  );

create policy "workspace_member_access" on public.planning_income_lines
  for all using (
    workspace_id in (
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  );

create policy "workspace_member_access" on public.planning_expense_lines
  for all using (
    workspace_id in (
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  );

create policy "workspace_member_access" on public.planning_bills
  for all using (
    workspace_id in (
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  );

create policy "workspace_member_access" on public.planning_upfront_costs
  for all using (
    workspace_id in (
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  );

create policy "workspace_member_access" on public.planning_compliance_items
  for all using (
    workspace_id in (
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  );

create policy "workspace_member_access" on public.planning_offers
  for all using (
    workspace_id in (
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  );

create policy "workspace_member_access" on public.planning_forecasts
  for all using (
    workspace_id in (
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  );

create policy "workspace_member_access" on public.planning_scenarios
  for all using (
    workspace_id in (
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  );

create policy "workspace_member_access" on public.planning_conversion_checklists
  for all using (
    workspace_id in (
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  );

create policy "workspace_member_access" on public.planning_activity
  for all using (
    workspace_id in (
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  );

create policy "workspace_member_access" on public.planning_saved_views
  for all using (
    workspace_id in (
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  );

-- ============================================================
-- Indexes
-- ============================================================

create index if not exists idx_planning_sets_workspace       on public.planning_sets(workspace_id);
create index if not exists idx_planning_sets_status          on public.planning_sets(status);
create index if not exists idx_planning_activity_workspace   on public.planning_activity(workspace_id);
create index if not exists idx_planning_activity_created     on public.planning_activity(created_at desc);
create index if not exists idx_planning_offers_workspace     on public.planning_offers(workspace_id);
create index if not exists idx_planning_offers_status        on public.planning_offers(status);

-- Additional performance indexes
create index if not exists idx_planning_profiles_workspace   on public.planning_profiles(workspace_id);
create index if not exists idx_planning_assumptions_set      on public.planning_assumptions(planning_set_id);
create index if not exists idx_planning_income_lines_set     on public.planning_income_lines(planning_set_id);
create index if not exists idx_planning_expense_lines_set    on public.planning_expense_lines(planning_set_id);
create index if not exists idx_planning_bills_set            on public.planning_bills(planning_set_id);
create index if not exists idx_planning_upfront_costs_set    on public.planning_upfront_costs(planning_set_id);
create index if not exists idx_planning_compliance_set       on public.planning_compliance_items(planning_set_id);
create index if not exists idx_planning_forecasts_set        on public.planning_forecasts(planning_set_id);
create index if not exists idx_planning_scenarios_set        on public.planning_scenarios(planning_set_id);
create index if not exists idx_planning_checklist_set        on public.planning_conversion_checklists(planning_set_id);
create index if not exists idx_planning_saved_views_user     on public.planning_saved_views(user_id);
