-- P8 — Risk & Fraud Engine
-- Idempotent / additive. Builds the risk-event ledger, per-workspace rolled-up
-- score, and a weighting rule table the engine evaluates.
--
-- HONESTY: rows here are computed SIGNALS to assist human admin review — never
-- automated enforcement or accusations. A manual flag/clear is an explicit,
-- recorded admin action (see risk_events.event_type = 'manual_flag'/'manual_clear').
--
-- RLS model:
--   * Platform admins (is_platform_admin(auth.uid())) read/write everything.
--   * A workspace member may READ their OWN risk_scores row (transparency).
--   * No tenant write access — events/scores are platform-computed only.

-- ── risk_events: append-only ledger of contributing signals ──────────────────
create table if not exists public.risk_events (
  id          uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  event_type  text not null,                         -- velocity | chargeback | sanctions_signal | dispute_opened | kyc_failed | manual_flag | manual_clear | ...
  severity    text not null default 'low' check (severity in ('low','medium','high','critical')),
  score_delta numeric not null default 0,
  detail      jsonb not null default '{}'::jsonb,
  source      text,                                  -- ingest origin: sanctions | verification | dispute | transaction | admin | manual
  created_by  uuid,                                  -- acting admin for manual events; null for system ingest
  created_at  timestamptz not null default now()
);

create index if not exists risk_events_workspace_idx on public.risk_events (workspace_id);
create index if not exists risk_events_severity_idx   on public.risk_events (severity);
create index if not exists risk_events_created_idx    on public.risk_events (created_at desc);
create index if not exists risk_events_type_idx       on public.risk_events (event_type);

-- ── risk_scores: one rolled-up row per workspace ─────────────────────────────
create table if not exists public.risk_scores (
  workspace_id   uuid primary key,
  score          numeric not null default 0,
  band           text not null default 'low' check (band in ('low','medium','high','critical')),
  last_event_at  timestamptz,
  flagged        boolean not null default false,
  flagged_reason text,
  updated_at     timestamptz not null default now()
);

create index if not exists risk_scores_band_idx    on public.risk_scores (band);
create index if not exists risk_scores_flagged_idx on public.risk_scores (flagged) where flagged;

-- ── risk_rules: weightings the engine applies per event_type ─────────────────
create table if not exists public.risk_rules (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  event_type text not null,
  condition  jsonb not null default '{}'::jsonb,     -- optional predicate, e.g. {"min_severity":"high"}
  weight     numeric not null default 1,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists risk_rules_event_type_idx on public.risk_rules (event_type) where active;

-- Seed a few sensible rules (idempotent on name).
insert into public.risk_rules (name, event_type, condition, weight, active)
select v.name, v.event_type, v.condition::jsonb, v.weight, true
from (values
  ('Sanctions / PEP screening signal', 'sanctions_signal', '{}',                         40),
  ('KYC / identity check failed',      'kyc_failed',       '{}',                         30),
  ('Marketplace dispute opened',       'dispute_opened',   '{}',                         20),
  ('Chargeback / refund reversal',     'chargeback',       '{}',                         35),
  ('Transaction velocity anomaly',     'velocity',         '{"window":"24h"}',           15),
  ('Existing marketplace risk signal', 'marketplace_signal','{}',                        10),
  ('Manual admin flag',                'manual_flag',      '{}',                         50)
) as v(name, event_type, condition, weight)
where not exists (select 1 from public.risk_rules r where r.name = v.name);

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.risk_events enable row level security;
alter table public.risk_scores enable row level security;
alter table public.risk_rules  enable row level security;

-- risk_events: platform admin full control; no tenant access.
drop policy if exists risk_events_admin_all on public.risk_events;
create policy risk_events_admin_all on public.risk_events
  for all using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

-- risk_scores: platform admin full control; workspace members read their own row.
drop policy if exists risk_scores_admin_all on public.risk_scores;
create policy risk_scores_admin_all on public.risk_scores
  for all using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

drop policy if exists risk_scores_owner_read on public.risk_scores;
create policy risk_scores_owner_read on public.risk_scores
  for select using (public.is_workspace_member(workspace_id));

-- risk_rules: platform admin full control; rules readable by admins only.
drop policy if exists risk_rules_admin_all on public.risk_rules;
create policy risk_rules_admin_all on public.risk_rules
  for all using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));
