-- ============================================================================
-- 20260618000000_supplier_team_enterprise.sql
--
-- TEAM / ENTERPRISE SUPPLIER WORKSPACE — data model for the 30-image upgrade
-- build (team-supplier-upgrade-image-manifest.md, prompt §6/§7/§8).
--
-- ⚠️ DRAFT — NOT YET APPLIED. Review before running (same handling as the
-- customer-workspace migration). The app currently renders these surfaces on
-- 42P01-safe seed data; this migration backs them with real, RLS-protected
-- tables. Apply only after schema review against the live DB + audit-queries gate.
--
-- PURELY ADDITIVE + IDEMPOTENT. Every statement is CREATE ... IF NOT EXISTS /
-- ADD COLUMN IF NOT EXISTS / guarded policy creation. It NEVER alters or drops
-- an existing table/column. Tables already created by earlier supplier
-- migrations are skipped by IF NOT EXISTS:
--   • supplier_workspace_members   (20260617200100_supplier_workspace_depth.sql)
--   • supplier_job_assignments     (20260617222000_supplier_jobs.sql)
--   • supplier_automation_rules    (earlier supplier migration)
--
-- IDENTITY / RLS MODEL ───────────────────────────────────────────────────────
-- Isolation anchors on the SUPPLIER WORKSPACE id via the existing recursion-safe
-- SECURITY DEFINER helper public.is_supplier_workspace_member(uuid). We REUSE it.
-- Every team table carries workspace_id uuid NOT NULL and the §6 audit columns.
-- RLS: USING / WITH CHECK ( public.is_supplier_workspace_member(workspace_id) ).
-- Finer role gating (finance/compliance/admin) is enforced in the app layer +
-- edge functions; the table policy guarantees cross-supplier isolation.
--
-- PRIVACY: finance, payout, compliance-document, internal-note and audit rows
-- are private to workspace members — there is NO public/anon policy on any table
-- here. Public-safe supplier listing data lives in the existing marketplace
-- tables, not these.
-- ============================================================================

begin;

-- ── plan_type on the workspace (additive) ───────────────────────────────────
alter table if exists public.workspaces
  add column if not exists plan_type text not null default 'solo'
  check (plan_type in ('solo','team','enterprise'));

-- ── Helper: standard audit columns macro is inlined per table below ──────────
-- (id, workspace_id, supplier_workspace_id, created_at, updated_at, created_by,
--  updated_by, status, metadata_json) per prompt §6.

-- ── TEAM / ROLES ────────────────────────────────────────────────────────────
create table if not exists public.supplier_workspace_roles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  supplier_workspace_id uuid,
  name text not null,
  capabilities jsonb not null default '{}'::jsonb,
  status text default 'active',
  metadata_json jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid,
  updated_by uuid
);

create table if not exists public.supplier_workspace_permissions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  role_id uuid,
  capability text not null,
  allowed boolean not null default false,
  created_at timestamptz default now()
);

-- ── WORKERS ─────────────────────────────────────────────────────────────────
create table if not exists public.supplier_worker_profiles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  user_id uuid,
  display_name text,
  trade text,
  base_area text,
  status text default 'active',
  metadata_json jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.supplier_worker_availability (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  worker_id uuid not null,
  day_of_week int,
  start_time time,
  end_time time,
  available boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.supplier_worker_qualifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  worker_id uuid not null,
  qualification text not null,
  authority text,
  reference text,
  valid_from date,
  expires_at date,
  status text default 'pending_review',
  created_at timestamptz default now()
);

create table if not exists public.supplier_worker_training (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  worker_id uuid not null,
  course text not null,
  completed_at date,
  status text default 'assigned',
  created_at timestamptz default now()
);

create table if not exists public.supplier_worker_checks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  worker_id uuid not null,
  check_type text not null,           -- gas_safe | dbs | right_to_work | training
  status text default 'pending',
  blocked_services text[],
  expires_at date,
  created_at timestamptz default now()
);

-- ── TEAM ACTIVITY / INTERNAL NOTES ──────────────────────────────────────────
create table if not exists public.supplier_team_activity (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  actor_id uuid,
  action text not null,
  related_type text,
  related_id uuid,
  created_at timestamptz default now()
);

create table if not exists public.supplier_internal_notes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  author_id uuid,
  body text not null,
  related_type text,                  -- job | quote | request | thread
  related_id uuid,
  resolved boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.supplier_internal_mentions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  note_id uuid not null,
  mentioned_user_id uuid not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- ── QUOTE APPROVALS ─────────────────────────────────────────────────────────
create table if not exists public.supplier_quote_approvals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  quote_id uuid not null,
  estimator_id uuid,
  owner_id uuid,
  margin_estimate numeric,
  discount_pct numeric,
  risk_flags text[],
  status text default 'awaiting',     -- awaiting | approved | rejected | changes_requested
  decided_by uuid,
  decided_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.supplier_quote_approval_comments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  approval_id uuid not null,
  author_id uuid,
  body text not null,
  created_at timestamptz default now()
);

-- ── DISPATCH / ROUTES / SLA ─────────────────────────────────────────────────
create table if not exists public.supplier_job_dispatch_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  job_id uuid not null,
  worker_id uuid,
  dispatcher_id uuid,
  route_order int,
  status text default 'dispatched',
  created_at timestamptz default now()
);

create table if not exists public.supplier_job_routes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  worker_id uuid not null,
  date date,
  stops jsonb default '[]'::jsonb,
  total_travel_mins int,
  created_at timestamptz default now()
);

create table if not exists public.supplier_job_sla_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  job_id uuid not null,
  sla_type text,                      -- response | completion
  due_at timestamptz,
  breached boolean default false,
  created_at timestamptz default now()
);

-- ── SCHEDULE / ROTA ─────────────────────────────────────────────────────────
create table if not exists public.supplier_emergency_rota (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  shift_date date not null,
  on_call_worker_id uuid,
  backup_worker_id uuid,
  area text,
  response_sla_mins int,
  premium boolean default false,
  handover_notes text,
  created_at timestamptz default now()
);

create table if not exists public.supplier_out_of_hours_rules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  name text,
  premium_pct numeric,
  applies_from time,
  applies_to time,
  created_at timestamptz default now()
);

-- ── SERVICES (team SLAs + assignment rules) ─────────────────────────────────
create table if not exists public.supplier_service_slas (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  service_id uuid,
  response_sla_mins int,
  completion_sla_hours int,
  min_charge_pence int,
  emergency_premium_pct numeric,
  created_at timestamptz default now()
);

create table if not exists public.supplier_service_assignment_rules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  service_id uuid,
  rule text,
  required_qualification text,
  created_at timestamptz default now()
);

-- ── FINANCE (statements / taxes / adjustments) ──────────────────────────────
create table if not exists public.supplier_statements (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  period text not null,
  net_pence bigint,
  fee_pence bigint,
  vat_pence bigint,
  status text default 'ready',
  created_at timestamptz default now()
);

create table if not exists public.supplier_statement_lines (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  statement_id uuid not null,
  description text,
  amount_pence bigint,
  created_at timestamptz default now()
);

create table if not exists public.supplier_tax_summaries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  period text not null,
  vat_collected_pence bigint,
  vat_on_fees_pence bigint,
  taxable_income_pence bigint,
  deductible_fees_pence bigint,
  created_at timestamptz default now()
);

create table if not exists public.supplier_adjustments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  reference text,
  adj_type text,                      -- credit | debit
  reason text,
  amount_pence bigint,
  status text default 'pending',
  approved_by uuid,
  related_invoice_id uuid,
  related_payout_id uuid,
  created_at timestamptz default now()
);

create table if not exists public.supplier_adjustment_approvals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  adjustment_id uuid not null,
  decided_by uuid,
  decision text,
  created_at timestamptz default now()
);

-- ── COMPLIANCE (accreditations) ─────────────────────────────────────────────
create table if not exists public.supplier_accreditations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  name text not null,
  issuing_body text,
  reference text,
  expires_at date,
  status text default 'pending_review',
  public_badge boolean default false,
  linked_services uuid[],
  created_at timestamptz default now()
);

-- ── REPUTATION (disputes / trust) ───────────────────────────────────────────
create table if not exists public.supplier_reputation_disputes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  reference text,
  customer_name text,
  category text,
  stage text default 'open',          -- open | evidence | review | resolved
  owner_id uuid,
  payout_hold_pence bigint default 0,
  trust_impact int default 0,
  opened_at timestamptz default now()
);

create table if not exists public.supplier_reputation_trust_scores (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  score int,
  response_score int,
  captured_at timestamptz default now()
);

-- ── INSIGHTS ────────────────────────────────────────────────────────────────
create table if not exists public.supplier_insight_snapshots (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  metric text not null,
  value numeric,
  dimension text,                     -- worker | service | area
  dimension_id text,
  captured_at timestamptz default now()
);

create table if not exists public.supplier_insight_recommendations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  title text not null,
  detail text,
  status text default 'open',
  created_at timestamptz default now()
);

-- ── AUTOMATIONS (templates / runs / approvals) ──────────────────────────────
create table if not exists public.supplier_automation_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  name text not null,
  description text,
  customer_impacting boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.supplier_automation_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  rule_id uuid,
  status text,                        -- ok | error
  detail text,
  ran_at timestamptz default now()
);

create table if not exists public.supplier_automation_approvals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  rule_id uuid,
  reason text,
  requested_by uuid,
  status text default 'pending',
  decided_by uuid,
  created_at timestamptz default now()
);

-- ── ENABLE RLS + member-scoped policy on every NEW table ────────────────────
-- One uniform policy per table: a row is reachable only by members of its
-- supplier workspace. No anon/public policy (all team data is private).
do $$
declare t text;
begin
  foreach t in array array[
    'supplier_workspace_roles','supplier_workspace_permissions',
    'supplier_worker_profiles','supplier_worker_availability',
    'supplier_worker_qualifications','supplier_worker_training','supplier_worker_checks',
    'supplier_team_activity','supplier_internal_notes','supplier_internal_mentions',
    'supplier_quote_approvals','supplier_quote_approval_comments',
    'supplier_job_dispatch_events','supplier_job_routes','supplier_job_sla_events',
    'supplier_emergency_rota','supplier_out_of_hours_rules',
    'supplier_service_slas','supplier_service_assignment_rules',
    'supplier_statements','supplier_statement_lines','supplier_tax_summaries',
    'supplier_adjustments','supplier_adjustment_approvals',
    'supplier_accreditations',
    'supplier_reputation_disputes','supplier_reputation_trust_scores',
    'supplier_insight_snapshots','supplier_insight_recommendations',
    'supplier_automation_templates','supplier_automation_runs','supplier_automation_approvals'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);
    -- members can read
    if not exists (select 1 from pg_policies where schemaname='public' and tablename=t and policyname=t||'_member_select') then
      execute format(
        'create policy %I on public.%I for select using (public.is_supplier_workspace_member(workspace_id));',
        t||'_member_select', t);
    end if;
    -- members can write (finer role gating enforced in the app/edge layer)
    if not exists (select 1 from pg_policies where schemaname='public' and tablename=t and policyname=t||'_member_write') then
      execute format(
        'create policy %I on public.%I for all using (public.is_supplier_workspace_member(workspace_id)) with check (public.is_supplier_workspace_member(workspace_id));',
        t||'_member_write', t);
    end if;
  end loop;
end $$;

-- ── Helpful indexes on workspace_id (cross-supplier isolation hot path) ──────
do $$
declare t text;
begin
  foreach t in array array[
    'supplier_workspace_roles','supplier_worker_profiles','supplier_worker_checks',
    'supplier_internal_notes','supplier_quote_approvals','supplier_job_dispatch_events',
    'supplier_emergency_rota','supplier_service_slas','supplier_statements',
    'supplier_adjustments','supplier_accreditations','supplier_reputation_disputes',
    'supplier_insight_snapshots','supplier_automation_runs'
  ]
  loop
    execute format('create index if not exists %I on public.%I (workspace_id);', 'idx_'||t||'_ws', t);
  end loop;
end $$;

-- ── STORAGE — private, upload-only, workspace-scoped ────────────────────────
-- One private bucket. Object keys MUST be supplier-workspaces/{workspaceId}/...
-- (the app already enforces upload-only — no URL inputs). RLS extracts the
-- workspace id from the first path segment and checks membership, so a member
-- can only read/write files under their own supplier workspace. No public read.
insert into storage.buckets (id, name, public)
values ('supplier-workspaces', 'supplier-workspaces', false)
on conflict (id) do nothing;

do $$
begin
  -- members can read their workspace's files
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='supplier_ws_files_select') then
    create policy supplier_ws_files_select on storage.objects for select
      using (
        bucket_id = 'supplier-workspaces'
        and public.is_supplier_workspace_member(((storage.foldername(name))[1])::uuid)
      );
  end if;
  -- members can upload (insert) into their workspace folder
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='supplier_ws_files_insert') then
    create policy supplier_ws_files_insert on storage.objects for insert
      with check (
        bucket_id = 'supplier-workspaces'
        and public.is_supplier_workspace_member(((storage.foldername(name))[1])::uuid)
      );
  end if;
  -- members can replace/remove their workspace files
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='supplier_ws_files_update') then
    create policy supplier_ws_files_update on storage.objects for update
      using (
        bucket_id = 'supplier-workspaces'
        and public.is_supplier_workspace_member(((storage.foldername(name))[1])::uuid)
      );
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='supplier_ws_files_delete') then
    create policy supplier_ws_files_delete on storage.objects for delete
      using (
        bucket_id = 'supplier-workspaces'
        and public.is_supplier_workspace_member(((storage.foldername(name))[1])::uuid)
      );
  end if;
end $$;

commit;

-- ── NOT INCLUDED (intentionally) ────────────────────────────────────────────
-- • ~50 edge functions (assign-worker, dispatch-job, approve-quote, generate-
--   statement, etc.). Each must: validate auth → validate plan → validate role →
--   validate supplier workspace access → write audit (supplier_team_activity) →
--   typed success/error. To be implemented against these tables after review.
--   The app marks every call site with TODO(...) so wiring is mechanical.
-- • Compliance documents approved for the PUBLIC trust badge need a separate
--   read path (a public-safe view or a signed-URL edge fn) — deliberately not a
--   blanket public policy on the private bucket above.
