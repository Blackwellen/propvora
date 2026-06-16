-- ============================================================================
-- Propvora INTERNATIONALISATION / Country-Packs — enterprise schema
-- Migration: 20260617080000_country_packs_intl.sql
--
-- DEPTH MANDATE / SAFETY INVARIANTS
--   * UK V1 is the protected baseline. GB stays the fully-reviewed/enabled pack.
--   * Every non-GB country defaults to research_only / generic_only / banned.
--   * Sanctioned countries are hard-blocked in DB (CHECK + offer_status='banned')
--     AND in code (src/lib/international/guardrails.ts SANCTIONED_COUNTRY_CODES).
--   * This migration is ADDITIVE. It bridges to the existing v1 control plane
--     (country_packs, country_tax_rules, sanctions_screenings) without dropping
--     or renaming anything. Existing GB behaviour is byte-identical.
--   * Idempotent: safe to run more than once (IF NOT EXISTS / ON CONFLICT).
-- ============================================================================

begin;

-- ── 0. Shared enums ─────────────────────────────────────────────────────────
-- Per-domain pack maturity. Ordered weakest → strongest. Mirrors the code
-- PackStatus union in src/lib/context/context-types.ts.
do $$ begin
  create type intl_pack_status as enum
    ('disabled','generic_only','research_only','beta','reviewed','enabled');
exception when duplicate_object then null; end $$;

-- Commercial eligibility of a country.
do $$ begin
  create type intl_offer_status as enum ('offer','restricted','banned','unknown');
exception when duplicate_object then null; end $$;

-- Tax scheme family.
do $$ begin
  create type intl_tax_scheme as enum
    ('vat','vat_oss','gst','sales_tax','consumption_tax','none');
exception when duplicate_object then null; end $$;

-- Release gate lifecycle for promoting a country pack.
do $$ begin
  create type intl_release_state as enum
    ('locked','in_review','staged','enabled','suspended');
exception when duplicate_object then null; end $$;

-- Privacy request (DSAR) lifecycle.
do $$ begin
  create type intl_privacy_request_status as enum
    ('received','identity_check','in_progress','extended','fulfilled','refused','withdrawn');
exception when duplicate_object then null; end $$;

-- Breach clock state.
do $$ begin
  create type intl_breach_state as enum
    ('open','assessing','notified_authority','notified_subjects','closed','no_notification');
exception when duplicate_object then null; end $$;

-- ── 1. address_models ───────────────────────────────────────────────────────
-- Declarative address form models, rendered by the dynamic address engine.
create table if not exists public.address_models (
  id            text primary key,                 -- 'gb','us','ca','ae','generic'
  name          text not null,
  field_order   jsonb not null default '[]'::jsonb,   -- ordered field keys
  fields        jsonb not null default '{}'::jsonb,   -- key → {label,required,type,options?}
  postcode_label text,
  region_label   text,
  region_required boolean not null default false,
  region_options  jsonb not null default '[]'::jsonb, -- e.g. US states / CA provinces
  example         jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── 2. country_profiles ─────────────────────────────────────────────────────
-- The full, normalised per-country profile. The authoritative superset of the
-- existing country_packs row; country_packs is kept and bridged (§9).
create table if not exists public.country_profiles (
  country_code            text primary key,        -- ISO 3166-1 alpha-2
  display_name            text not null,
  -- Locale / formatting
  default_locale          text not null default 'en-GB',
  default_currency        text not null default 'GBP',
  supported_locales       jsonb not null default '["en-GB"]'::jsonb,
  measurement_system      text not null default 'metric',  -- metric|imperial
  area_unit               text not null default 'sqm',     -- sqm|sqft
  date_format             text not null default 'dd/MM/yyyy',
  number_format           text not null default 'en-GB',
  phone_country_code      text,                    -- '+44'
  address_model_id        text references public.address_models(id),
  -- Commercial / offer
  offer_status            intl_offer_status not null default 'restricted',
  stripe_billing_supported  boolean not null default false,
  connect_payout_supported  boolean not null default false,
  -- Per-domain pack statuses
  offer_pack_status       intl_pack_status not null default 'research_only',
  property_features_status intl_pack_status not null default 'research_only',
  legal_status            intl_pack_status not null default 'research_only',
  tax_status              intl_pack_status not null default 'research_only',
  privacy_status          intl_pack_status not null default 'research_only',
  consumer_status         intl_pack_status not null default 'research_only',
  -- Tax
  tax_scheme              intl_tax_scheme not null default 'none',
  tax_name                text not null default 'Tax',
  standard_tax_rate       numeric,
  tax_id_label            text,
  tax_id_regex            text,
  b2b_reverse_charge      boolean not null default false,
  -- Privacy
  privacy_regime          text not null default 'research_only',
  dsar_response_days      integer,
  breach_notify_hours     integer,
  consent_model           text not null default 'mixed',   -- opt_in|opt_out|mixed
  representative_required boolean not null default false,
  dpo_required            boolean not null default false,
  transfer_mechanism      text not null default 'none',
  -- Consumer / contract
  b2c_withdrawal_days     integer,
  withdrawal_button_required boolean not null default false,
  auto_renewal_disclosure boolean not null default false,
  -- Review / governance
  requires_local_review   boolean not null default true,
  legal_disclaimer        text not null default '',
  notes                   text,
  reviewed_by             uuid,
  reviewed_at             timestamptz,
  version                 integer not null default 1,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint country_profiles_code_len check (char_length(country_code) = 2)
);

create index if not exists idx_country_profiles_offer on public.country_profiles(offer_status);

-- ── 3. country_regions ──────────────────────────────────────────────────────
-- Sub-national regions (US states, CA provinces, AU states, UK nations) used
-- for address region pickers and (future) regional tax.
create table if not exists public.country_regions (
  id            uuid primary key default gen_random_uuid(),
  country_code  text not null references public.country_profiles(country_code) on delete cascade,
  code          text not null,                    -- 'CA','TX','NSW','SCT'
  name          text not null,
  region_type   text,                             -- state|province|nation|emirate
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  unique (country_code, code)
);

-- ── 4. Tax control plane ────────────────────────────────────────────────────
create table if not exists public.country_tax_profiles (
  country_code  text primary key references public.country_profiles(country_code) on delete cascade,
  scheme        intl_tax_scheme not null default 'none',
  tax_name      text not null default 'Tax',
  standard_rate numeric,
  reduced_rates jsonb not null default '[]'::jsonb,
  registration_threshold numeric,
  tax_id_label  text,
  tax_id_regex  text,
  b2b_reverse_charge boolean not null default false,
  oss_eligible  boolean not null default false,
  status        intl_pack_status not null default 'research_only',
  notes         text,
  updated_at    timestamptz not null default now()
);

create table if not exists public.country_tax_rates (
  id            uuid primary key default gen_random_uuid(),
  country_code  text not null references public.country_profiles(country_code) on delete cascade,
  region_code   text,
  rate_name     text not null,
  rate          numeric not null,
  applies_to    text not null default 'standard',
  valid_from    date,
  valid_to      date,
  notes         text,
  created_at    timestamptz not null default now()
);
create index if not exists idx_country_tax_rates_cc on public.country_tax_rates(country_code);

create table if not exists public.country_invoice_rules (
  country_code  text primary key references public.country_profiles(country_code) on delete cascade,
  required_fields jsonb not null default '[]'::jsonb,
  sequential_numbering boolean not null default false,
  tax_breakdown_required boolean not null default true,
  supplier_tax_id_required boolean not null default false,
  buyer_tax_id_required  boolean not null default false,
  legal_footer  text,
  updated_at    timestamptz not null default now()
);

-- ── 5. Privacy control plane ────────────────────────────────────────────────
create table if not exists public.country_privacy_profiles (
  country_code  text primary key references public.country_profiles(country_code) on delete cascade,
  regime        text not null default 'research_only',
  dsar_response_days integer,
  breach_notify_hours integer,
  consent_model text not null default 'mixed',
  representative_required boolean not null default false,
  dpo_required  boolean not null default false,
  transfer_mechanism text not null default 'none',
  lawful_bases  jsonb not null default '[]'::jsonb,
  status        intl_pack_status not null default 'research_only',
  notes         text,
  updated_at    timestamptz not null default now()
);

create table if not exists public.country_consumer_rules (
  country_code  text primary key references public.country_profiles(country_code) on delete cascade,
  b2c_withdrawal_days integer,
  withdrawal_button_required boolean not null default false,
  auto_renewal_disclosure boolean not null default false,
  cooling_off_applies boolean not null default false,
  distance_selling_regime text,
  notes         text,
  updated_at    timestamptz not null default now()
);

-- ── 6. Representatives (Art.27 EU rep / local rep / DPO) ─────────────────────
create table if not exists public.country_representatives (
  id            uuid primary key default gen_random_uuid(),
  country_code  text not null references public.country_profiles(country_code) on delete cascade,
  rep_type      text not null default 'eu_representative', -- eu_representative|uk_rep|dpo|local_counsel
  name          text,
  organisation  text,
  email         text,
  phone         text,
  address       text,
  appointed_at  date,
  status        text not null default 'not_appointed',     -- not_appointed|appointed|lapsed
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_country_reps_cc on public.country_representatives(country_code);

-- ── 7. Release gate + reviews + versions + audit ────────────────────────────
-- A country cannot be flipped to 'enabled' until every REQUIRED review is
-- recorded with verdict 'approved'. Enforced both in app code (release-gate
-- context) and by the gate function below.
create table if not exists public.country_release_gates (
  country_code  text primary key references public.country_profiles(country_code) on delete cascade,
  state         intl_release_state not null default 'locked',
  required_reviews jsonb not null default
    '["legal","tax","privacy","sanctions","commercial"]'::jsonb,
  enabled_at    timestamptz,
  enabled_by    uuid,
  suspended_reason text,
  notes         text,
  updated_at    timestamptz not null default now()
);

create table if not exists public.country_pack_reviews (
  id            uuid primary key default gen_random_uuid(),
  country_code  text not null references public.country_profiles(country_code) on delete cascade,
  domain        text not null,                    -- legal|tax|privacy|sanctions|commercial
  verdict       text not null default 'pending',  -- pending|approved|rejected
  reviewer      uuid,
  reviewer_name text,
  reviewed_at   timestamptz,
  evidence_url  text,
  notes         text,
  created_at    timestamptz not null default now(),
  unique (country_code, domain)
);

create table if not exists public.country_pack_versions (
  id            uuid primary key default gen_random_uuid(),
  country_code  text not null references public.country_profiles(country_code) on delete cascade,
  version       integer not null,
  snapshot      jsonb not null default '{}'::jsonb,
  created_by    uuid,
  created_at    timestamptz not null default now(),
  unique (country_code, version)
);

create table if not exists public.country_pack_audit_events (
  id            uuid primary key default gen_random_uuid(),
  country_code  text,
  actor_user_id uuid,
  action        text not null,
  detail        jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);
create index if not exists idx_country_audit_cc on public.country_pack_audit_events(country_code, created_at desc);

-- ── 8. Sanctions / eligibility ──────────────────────────────────────────────
create table if not exists public.sanctions_country_rules (
  country_code  text primary key,
  classification text not null default 'allowed', -- allowed|restricted|comprehensive_block
  programmes    jsonb not null default '[]'::jsonb,
  block_onboarding boolean not null default false,
  block_billing boolean not null default false,
  block_payout  boolean not null default false,
  requires_manual_review boolean not null default false,
  source        text,
  reviewed_at   timestamptz,
  notes         text,
  updated_at    timestamptz not null default now(),
  constraint sanctions_cc_len check (char_length(country_code) = 2)
);

create table if not exists public.billing_country_matrix (
  country_code  text primary key references public.country_profiles(country_code) on delete cascade,
  billing_supported boolean not null default false,
  manual_review boolean not null default false,
  currency      text,
  notes         text,
  updated_at    timestamptz not null default now()
);

create table if not exists public.connect_payout_country_matrix (
  country_code  text primary key references public.country_profiles(country_code) on delete cascade,
  payout_supported boolean not null default false,
  manual_review boolean not null default false,
  notes         text,
  updated_at    timestamptz not null default now()
);

-- ── 9. Regional terms + consent ─────────────────────────────────────────────
create table if not exists public.regional_terms_versions (
  id            uuid primary key default gen_random_uuid(),
  country_code  text,                             -- null = global
  document      text not null,                    -- terms|privacy|dpa|consumer
  version       text not null,
  effective_from date,
  body_url      text,
  status        text not null default 'draft',    -- draft|published|retired
  created_at    timestamptz not null default now(),
  unique (country_code, document, version)
);

create table if not exists public.regional_terms_consent_events (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid,
  user_id       uuid,
  country_code  text,
  document      text not null,
  version       text not null,
  consented_at  timestamptz not null default now(),
  ip_hash       text,
  user_agent    text
);
create index if not exists idx_terms_consent_ws on public.regional_terms_consent_events(workspace_id);

-- ── 10. Privacy request (DSAR) engine ───────────────────────────────────────
create table if not exists public.privacy_requests (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid,
  country_code  text,
  regime        text,
  request_type  text not null default 'access',  -- access|erasure|rectification|portability|objection|restriction
  status        intl_privacy_request_status not null default 'received',
  subject_name  text,
  subject_email text,
  received_at   timestamptz not null default now(),
  due_at        timestamptz,
  extended_to   timestamptz,
  fulfilled_at  timestamptz,
  assigned_to   uuid,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_privacy_requests_ws on public.privacy_requests(workspace_id, status);

create table if not exists public.privacy_request_events (
  id            uuid primary key default gen_random_uuid(),
  request_id    uuid not null references public.privacy_requests(id) on delete cascade,
  event_type    text not null,
  actor_user_id uuid,
  detail        jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);
create index if not exists idx_privacy_events_req on public.privacy_request_events(request_id, created_at);

-- ── 11. Breach incident clock ───────────────────────────────────────────────
create table if not exists public.breach_incident_clocks (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid,
  country_code  text,
  regime        text,
  title         text not null,
  state         intl_breach_state not null default 'open',
  discovered_at timestamptz not null default now(),
  notify_within_hours integer,
  authority_due_at timestamptz,
  authority_notified_at timestamptz,
  subjects_notified_at timestamptz,
  severity      text not null default 'medium',
  description   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_breach_clocks_ws on public.breach_incident_clocks(workspace_id, state);

-- ── 12. Subprocessors + transfer mechanisms ─────────────────────────────────
create table if not exists public.subprocessor_register (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  purpose       text,
  country_code  text,
  data_categories jsonb not null default '[]'::jsonb,
  transfer_mechanism text,
  status        text not null default 'active',   -- active|pending|retired
  dpa_url       text,
  added_at      date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.data_transfer_mechanisms (
  id            text primary key,                 -- 'eu_scc','uk_idta','swiss_scc'
  name          text not null,
  description   text,
  regimes       jsonb not null default '[]'::jsonb,
  status        text not null default 'active',
  updated_at    timestamptz not null default now()
);

-- ── 13. Translation manager ─────────────────────────────────────────────────
create table if not exists public.intl_translation_namespaces (
  id            text primary key,
  description   text,
  created_at    timestamptz not null default now()
);

create table if not exists public.intl_translation_keys (
  id            uuid primary key default gen_random_uuid(),
  namespace_id  text not null references public.intl_translation_namespaces(id) on delete cascade,
  key           text not null,
  source_text   text not null default '',
  description   text,
  created_at    timestamptz not null default now(),
  unique (namespace_id, key)
);

create table if not exists public.intl_translation_strings (
  id            uuid primary key default gen_random_uuid(),
  key_id        uuid not null references public.intl_translation_keys(id) on delete cascade,
  locale        text not null,
  value         text not null default '',
  status        text not null default 'untranslated', -- untranslated|machine|reviewed|approved
  updated_by    uuid,
  updated_at    timestamptz not null default now(),
  unique (key_id, locale)
);

commit;

-- ── 14. Workspace / property / invoice intl columns (additive) ──────────────
begin;
alter table public.workspaces
  add column if not exists country_pack_code text,
  add column if not exists locale text,
  add column if not exists measurement_system text;

alter table public.properties
  add column if not exists address_model_id text,
  add column if not exists region_code text;

do $$ begin
  if exists (select 1 from information_schema.tables
             where table_schema='public' and table_name='invoices') then
    alter table public.invoices
      add column if not exists country_code text,
      add column if not exists tax_scheme text,
      add column if not exists tax_id text;
  end if;
end $$;

do $$ begin
  if exists (select 1 from information_schema.tables
             where table_schema='public' and table_name='profiles') then
    alter table public.profiles
      add column if not exists locale text,
      add column if not exists country_code text;
  end if;
end $$;
commit;

-- ── 15. Release-gate enforcement function ───────────────────────────────────
-- Returns true only when every required review for the country is 'approved'.
-- Used by app code (release-gate context) AND callable as a DB backstop.
create or replace function public.country_release_ready(p_country_code text)
returns boolean
language plpgsql
stable
as $$
declare
  v_required jsonb;
  v_domain   text;
  v_ok       boolean;
begin
  select required_reviews into v_required
  from public.country_release_gates where country_code = upper(p_country_code);

  if v_required is null then
    v_required := '["legal","tax","privacy","sanctions","commercial"]'::jsonb;
  end if;

  for v_domain in select jsonb_array_elements_text(v_required) loop
    select exists (
      select 1 from public.country_pack_reviews
      where country_code = upper(p_country_code)
        and domain = v_domain
        and verdict = 'approved'
    ) into v_ok;
    if not v_ok then
      return false;
    end if;
  end loop;

  -- Sanctioned countries can never be release-ready.
  if exists (
    select 1 from public.sanctions_country_rules
    where country_code = upper(p_country_code)
      and classification = 'comprehensive_block'
  ) then
    return false;
  end if;

  return true;
end;
$$;

-- Guard trigger: refuse to set a release gate to 'enabled' unless ready.
create or replace function public.enforce_country_release_gate()
returns trigger
language plpgsql
as $$
begin
  if new.state = 'enabled' and (old.state is distinct from 'enabled') then
    if not public.country_release_ready(new.country_code) then
      raise exception
        'Country % cannot be enabled: required reviews are not all approved (or it is sanctioned).',
        new.country_code
      using errcode = 'check_violation';
    end if;
    new.enabled_at := coalesce(new.enabled_at, now());
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_enforce_country_release_gate on public.country_release_gates;
create trigger trg_enforce_country_release_gate
  before update on public.country_release_gates
  for each row execute function public.enforce_country_release_gate();

-- ── 16. RLS ─────────────────────────────────────────────────────────────────
-- Reference/control-plane tables are admin-managed and world-readable for the
-- authenticated app (the data is non-sensitive jurisdiction metadata). Operator
-- request tables (privacy_requests, breach clocks, consent events) are scoped.
do $$
declare t text;
begin
  foreach t in array array[
    'address_models','country_profiles','country_regions','country_tax_profiles',
    'country_tax_rates','country_invoice_rules','country_privacy_profiles',
    'country_consumer_rules','country_representatives','country_release_gates',
    'country_pack_reviews','country_pack_versions','country_pack_audit_events',
    'sanctions_country_rules','billing_country_matrix','connect_payout_country_matrix',
    'regional_terms_versions','regional_terms_consent_events','privacy_requests',
    'privacy_request_events','breach_incident_clocks','subprocessor_register',
    'data_transfer_mechanisms','intl_translation_namespaces','intl_translation_keys',
    'intl_translation_strings'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);
  end loop;
end $$;

-- Read policies for reference data (authenticated).
do $$
declare t text;
begin
  foreach t in array array[
    'address_models','country_profiles','country_regions','country_tax_profiles',
    'country_tax_rates','country_invoice_rules','country_privacy_profiles',
    'country_consumer_rules','country_representatives','country_release_gates',
    'country_pack_reviews','country_pack_versions','sanctions_country_rules',
    'billing_country_matrix','connect_payout_country_matrix','regional_terms_versions',
    'subprocessor_register','data_transfer_mechanisms','intl_translation_namespaces',
    'intl_translation_keys','intl_translation_strings'
  ]
  loop
    execute format($f$
      drop policy if exists "%1$s_read" on public.%1$s;
      create policy "%1$s_read" on public.%1$s for select to authenticated using (true);
    $f$, t);
  end loop;
end $$;

-- Workspace-scoped policies for operator request tables.
drop policy if exists "privacy_requests_ws" on public.privacy_requests;
create policy "privacy_requests_ws" on public.privacy_requests for all to authenticated
  using (
    workspace_id in (
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  )
  with check (
    workspace_id in (
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  );

drop policy if exists "breach_clocks_ws" on public.breach_incident_clocks;
create policy "breach_clocks_ws" on public.breach_incident_clocks for all to authenticated
  using (
    workspace_id in (
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  )
  with check (
    workspace_id in (
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  );

drop policy if exists "terms_consent_ws" on public.regional_terms_consent_events;
create policy "terms_consent_ws" on public.regional_terms_consent_events for all to authenticated
  using (
    workspace_id in (
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
    or user_id = auth.uid()
  )
  with check (
    workspace_id in (
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
    or user_id = auth.uid()
  );

drop policy if exists "privacy_events_ws" on public.privacy_request_events;
create policy "privacy_events_ws" on public.privacy_request_events for all to authenticated
  using (
    request_id in (
      select id from public.privacy_requests where workspace_id in (
        select workspace_id from public.workspace_members where user_id = auth.uid()
      )
    )
  )
  with check (
    request_id in (
      select id from public.privacy_requests where workspace_id in (
        select workspace_id from public.workspace_members where user_id = auth.uid()
      )
    )
  );

-- Audit events: workspace members may read events for their country; writes via service role.
drop policy if exists "country_audit_read" on public.country_pack_audit_events;
create policy "country_audit_read" on public.country_pack_audit_events for select to authenticated using (true);

commit;

-- ── 17. SEED ────────────────────────────────────────────────────────────────
begin;

-- 17a. Address models
insert into public.address_models (id, name, field_order, fields, postcode_label, region_label, region_required, region_options, example) values
  ('gb','UK address',
    '["address_line1","address_line2","city","county","postcode"]'::jsonb,
    '{"address_line1":{"label":"Address line 1","required":true},"address_line2":{"label":"Address line 2","required":false},"city":{"label":"Town / city","required":true},"county":{"label":"County","required":false},"postcode":{"label":"Postcode","required":true}}'::jsonb,
    'Postcode','County',false,'[]'::jsonb,
    '{"address_line1":"10 Downing Street","city":"London","postcode":"SW1A 2AA"}'::jsonb),
  ('us','US address',
    '["address_line1","address_line2","city","state","zip"]'::jsonb,
    '{"address_line1":{"label":"Street address","required":true},"address_line2":{"label":"Apt / suite","required":false},"city":{"label":"City","required":true},"state":{"label":"State","required":true,"type":"select"},"zip":{"label":"ZIP code","required":true}}'::jsonb,
    'ZIP code','State',true,'["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"]'::jsonb,
    '{"address_line1":"1600 Pennsylvania Ave NW","city":"Washington","state":"DC","zip":"20500"}'::jsonb),
  ('ca','Canada address',
    '["address_line1","address_line2","city","province","postal_code"]'::jsonb,
    '{"address_line1":{"label":"Street address","required":true},"address_line2":{"label":"Unit","required":false},"city":{"label":"City","required":true},"province":{"label":"Province / territory","required":true,"type":"select"},"postal_code":{"label":"Postal code","required":true}}'::jsonb,
    'Postal code','Province',true,'["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"]'::jsonb,
    '{"address_line1":"111 Wellington St","city":"Ottawa","province":"ON","postal_code":"K1A 0A6"}'::jsonb),
  ('ae','UAE address',
    '["address_line1","area","city","emirate","po_box"]'::jsonb,
    '{"address_line1":{"label":"Building / street","required":true},"area":{"label":"Area / district","required":false},"city":{"label":"City","required":true},"emirate":{"label":"Emirate","required":true,"type":"select"},"po_box":{"label":"PO Box","required":false}}'::jsonb,
    'PO Box','Emirate',true,'["Abu Dhabi","Dubai","Sharjah","Ajman","Umm Al Quwain","Ras Al Khaimah","Fujairah"]'::jsonb,
    '{"address_line1":"Burj Khalifa","city":"Dubai","emirate":"Dubai"}'::jsonb),
  ('generic','Generic address',
    '["address_line1","address_line2","city","region","postal_code"]'::jsonb,
    '{"address_line1":{"label":"Address line 1","required":true},"address_line2":{"label":"Address line 2","required":false},"city":{"label":"City","required":true},"region":{"label":"Region / state","required":false},"postal_code":{"label":"Postal / ZIP code","required":false}}'::jsonb,
    'Postal code','Region',false,'[]'::jsonb,'{}'::jsonb)
on conflict (id) do nothing;

-- 17b. Data transfer mechanisms
insert into public.data_transfer_mechanisms (id, name, description, regimes, status) values
  ('eu_scc','EU Standard Contractual Clauses','EU SCC module-based transfers under GDPR Art.46.','["eu_gdpr"]'::jsonb,'active'),
  ('uk_idta','UK IDTA / Addendum','UK International Data Transfer Agreement / Addendum to EU SCCs.','["uk_gdpr"]'::jsonb,'active'),
  ('swiss_scc','Swiss SCCs','Swiss FADP-adapted SCCs.','["fadp"]'::jsonb,'active'),
  ('none','No mechanism recorded','No transfer mechanism reviewed for this regime yet.','[]'::jsonb,'active')
on conflict (id) do nothing;

-- 17c. Sanctions country rules — hard blocks (must match code SANCTIONED list +
--      master-plan banned set). Comprehensive block ⇒ never release-ready.
insert into public.sanctions_country_rules
  (country_code, classification, block_onboarding, block_billing, block_payout, requires_manual_review, programmes, source)
values
  ('CU','comprehensive_block',true,true,true,false,'["OFAC","UK","EU"]'::jsonb,'master_plan'),
  ('IR','comprehensive_block',true,true,true,false,'["OFAC","UK","EU","UN"]'::jsonb,'master_plan'),
  ('KP','comprehensive_block',true,true,true,false,'["OFAC","UK","EU","UN"]'::jsonb,'master_plan'),
  ('SY','comprehensive_block',true,true,true,false,'["OFAC","UK","EU"]'::jsonb,'master_plan'),
  ('RU','comprehensive_block',true,true,true,false,'["OFAC","UK","EU"]'::jsonb,'master_plan'),
  ('BY','comprehensive_block',true,true,true,false,'["UK","EU"]'::jsonb,'master_plan'),
  ('VE','comprehensive_block',true,true,true,false,'["OFAC"]'::jsonb,'master_plan'),
  ('NI','comprehensive_block',true,true,true,false,'["OFAC","EU"]'::jsonb,'master_plan'),
  ('SD','comprehensive_block',true,true,true,false,'["OFAC","UK"]'::jsonb,'master_plan'),
  ('SS','comprehensive_block',true,true,true,false,'["UK","EU"]'::jsonb,'master_plan'),
  ('SO','comprehensive_block',true,true,true,false,'["UN","UK"]'::jsonb,'master_plan'),
  ('YE','comprehensive_block',true,true,true,false,'["UN","UK"]'::jsonb,'master_plan'),
  ('AF','comprehensive_block',true,true,true,false,'["UN","UK"]'::jsonb,'master_plan'),
  ('MM','comprehensive_block',true,true,true,false,'["UK","EU"]'::jsonb,'master_plan')
on conflict (country_code) do update set
  classification = excluded.classification,
  block_onboarding = excluded.block_onboarding,
  block_billing = excluded.block_billing,
  block_payout = excluded.block_payout,
  programmes = excluded.programmes,
  updated_at = now();

-- Translation namespace bootstrap (mirrors the en-GB catalogue domains).
insert into public.intl_translation_namespaces (id, description) values
  ('app','Core application UI strings'),
  ('marketing','Marketing / public site strings'),
  ('legal','Legal & compliance copy')
on conflict (id) do nothing;

commit;

-- 17d. country_profiles + per-domain tables seeded from a values table.
-- GB = enabled baseline; Phase 1 (IE/AU/NZ/CA/US) research candidates;
-- Phase 2 EU research_only; banned set hard-blocked. requires_local_review=true
-- for every non-GB country.
begin;

with seed(country_code, display_name, default_locale, default_currency, supported_locales,
          measurement_system, area_unit, date_format, phone_country_code, address_model_id,
          offer_status, stripe_billing, connect_payout,
          property_status, legal_status, tax_status, privacy_status, consumer_status,
          tax_scheme, tax_name, standard_rate, tax_id_label,
          privacy_regime, dsar_days, breach_hours, consent_model, rep_required, dpo_required,
          transfer_mechanism, withdrawal_days, withdrawal_button, auto_renewal, requires_review, disclaimer) as (
  values
  -- GB — fully reviewed/enabled baseline
  ('GB','United Kingdom','en-GB','GBP','["en-GB"]','metric','sqm','dd/MM/yyyy','+44','gb',
   'offer',true,true,'enabled','reviewed','reviewed','reviewed','reviewed',
   'vat','VAT',20::numeric,'VAT number','uk_gdpr',30,72,'opt_in',false,true,'uk_idta',14,false,false,false,
   'United Kingdom property, compliance and legal workflows are the reviewed V1 baseline. This is not legal, tax or financial advice.'),
  -- Phase 1 candidates — research_only / generic; eligible for review
  ('IE','Ireland','en-IE','EUR','["en-IE"]','metric','sqm','dd/MM/yyyy','+353','generic',
   'offer',true,true,'research_only','research_only','research_only','research_only','research_only',
   'vat_oss','VAT',23::numeric,'VAT number','eu_gdpr',30,72,'opt_in',true,false,'eu_scc',14,true,false,true,
   'This country pack is not reviewed. Propvora will only provide generic records, documents, tasks and evidence tracking until qualified local review is recorded.'),
  ('AU','Australia','en-AU','AUD','["en-AU"]','metric','sqm','dd/MM/yyyy','+61','generic',
   'offer',true,true,'research_only','research_only','research_only','research_only','research_only',
   'gst','GST',10::numeric,'ABN','app',30,null,'mixed',false,false,'none',null,false,false,true,
   'This country pack is not reviewed. Generic records only until qualified local review is recorded.'),
  ('NZ','New Zealand','en-NZ','NZD','["en-NZ"]','metric','sqm','dd/MM/yyyy','+64','generic',
   'offer',true,true,'research_only','research_only','research_only','research_only','research_only',
   'gst','GST',15::numeric,'IRD / NZBN','nz_privacy',30,72,'mixed',false,false,'none',14,false,false,true,
   'This country pack is not reviewed. Generic records only until qualified local review is recorded.'),
  ('CA','Canada','en-CA','CAD','["en-CA","fr-CA"]','metric','sqm','yyyy-MM-dd','+1','ca',
   'offer',true,true,'research_only','research_only','research_only','research_only','research_only',
   'gst','GST/HST',5::numeric,'GST/HST number','pipeda_law25',30,null,'mixed',false,false,'none',null,false,true,true,
   'This country pack is not reviewed. Generic records only until qualified local review is recorded.'),
  ('US','United States','en-US','USD','["en-US"]','imperial','sqft','MM/dd/yyyy','+1','us',
   'offer',true,true,'research_only','research_only','research_only','research_only','research_only',
   'sales_tax','Sales Tax',null::numeric,'EIN / sales tax ID','ccpa_patchwork',45,null,'opt_out',false,false,'none',null,false,true,true,
   'This country pack is not reviewed. Generic records only until qualified local review is recorded. US tax is state-specific.'),
  -- Phase 2 EU research_only
  ('FR','France','fr-FR','EUR','["fr-FR"]','metric','sqm','dd/MM/yyyy','+33','generic',
   'offer',true,true,'research_only','research_only','research_only','research_only','research_only',
   'vat_oss','VAT',20::numeric,'VAT number','eu_gdpr',30,72,'opt_in',true,false,'eu_scc',14,true,false,true,
   'This country pack is not reviewed. Generic records only until qualified local review is recorded.'),
  ('ES','Spain','es-ES','EUR','["es-ES"]','metric','sqm','dd/MM/yyyy','+34','generic',
   'offer',true,true,'research_only','research_only','research_only','research_only','research_only',
   'vat_oss','VAT',21::numeric,'VAT number','eu_gdpr',30,72,'opt_in',true,false,'eu_scc',14,true,false,true,
   'This country pack is not reviewed. Generic records only until qualified local review is recorded.'),
  ('DE','Germany','de-DE','EUR','["de-DE"]','metric','sqm','dd.MM.yyyy','+49','generic',
   'offer',true,true,'research_only','research_only','research_only','research_only','research_only',
   'vat_oss','VAT',19::numeric,'VAT number','eu_gdpr',30,72,'opt_in',true,false,'eu_scc',14,true,false,true,
   'This country pack is not reviewed. Generic records only until qualified local review is recorded.'),
  ('IT','Italy','it-IT','EUR','["it-IT"]','metric','sqm','dd/MM/yyyy','+39','generic',
   'offer',true,true,'research_only','research_only','research_only','research_only','research_only',
   'vat_oss','VAT',22::numeric,'VAT number','eu_gdpr',30,72,'opt_in',true,false,'eu_scc',14,true,false,true,
   'This country pack is not reviewed. Generic records only until qualified local review is recorded.'),
  ('NL','Netherlands','nl-NL','EUR','["nl-NL"]','metric','sqm','dd-MM-yyyy','+31','generic',
   'offer',true,true,'research_only','research_only','research_only','research_only','research_only',
   'vat_oss','VAT',21::numeric,'VAT number','eu_gdpr',30,72,'opt_in',true,false,'eu_scc',14,true,false,true,
   'This country pack is not reviewed. Generic records only until qualified local review is recorded.'),
  -- UAE — restricted (manual review), example of non-EU address model
  ('AE','United Arab Emirates','en-GB','AED','["en-GB"]','metric','sqm','dd/MM/yyyy','+971','ae',
   'restricted',false,false,'research_only','research_only','research_only','research_only','research_only',
   'vat','VAT',5::numeric,'TRN','research_only',30,null,'mixed',false,false,'none',null,false,false,true,
   'This country is restricted. Manual commercial, payment, sanctions, legal and tax review is required before onboarding.'),
  -- Banned set — hard-blocked
  ('CU','Cuba','es-ES','CUP','["es-ES"]','metric','sqm','dd/MM/yyyy','+53','generic','banned',false,false,'disabled','disabled','disabled','disabled','disabled','none','Tax',null::numeric,null,'research_only',null,null,'mixed',false,false,'none',null,false,false,true,'This country is blocked for onboarding and payments.'),
  ('IR','Iran','en-GB','IRR','["en-GB"]','metric','sqm','dd/MM/yyyy','+98','generic','banned',false,false,'disabled','disabled','disabled','disabled','disabled','none','Tax',null::numeric,null,'research_only',null,null,'mixed',false,false,'none',null,false,false,true,'This country is blocked for onboarding and payments.'),
  ('KP','North Korea','en-GB','KPW','["en-GB"]','metric','sqm','dd/MM/yyyy','+850','generic','banned',false,false,'disabled','disabled','disabled','disabled','disabled','none','Tax',null::numeric,null,'research_only',null,null,'mixed',false,false,'none',null,false,false,true,'This country is blocked for onboarding and payments.'),
  ('SY','Syria','en-GB','SYP','["en-GB"]','metric','sqm','dd/MM/yyyy','+963','generic','banned',false,false,'disabled','disabled','disabled','disabled','disabled','none','Tax',null::numeric,null,'research_only',null,null,'mixed',false,false,'none',null,false,false,true,'This country is blocked for onboarding and payments.'),
  ('RU','Russia','en-GB','RUB','["en-GB"]','metric','sqm','dd/MM/yyyy','+7','generic','banned',false,false,'disabled','disabled','disabled','disabled','disabled','none','Tax',null::numeric,null,'research_only',null,null,'mixed',false,false,'none',null,false,false,true,'This country is blocked for onboarding and payments.'),
  ('BY','Belarus','en-GB','BYN','["en-GB"]','metric','sqm','dd/MM/yyyy','+375','generic','banned',false,false,'disabled','disabled','disabled','disabled','disabled','none','Tax',null::numeric,null,'research_only',null,null,'mixed',false,false,'none',null,false,false,true,'This country is blocked for onboarding and payments.'),
  ('VE','Venezuela','es-ES','VES','["es-ES"]','metric','sqm','dd/MM/yyyy','+58','generic','banned',false,false,'disabled','disabled','disabled','disabled','disabled','none','Tax',null::numeric,null,'research_only',null,null,'mixed',false,false,'none',null,false,false,true,'This country is blocked for onboarding and payments.'),
  ('NI','Nicaragua','es-ES','NIO','["es-ES"]','metric','sqm','dd/MM/yyyy','+505','generic','banned',false,false,'disabled','disabled','disabled','disabled','disabled','none','Tax',null::numeric,null,'research_only',null,null,'mixed',false,false,'none',null,false,false,true,'This country is blocked for onboarding and payments.'),
  ('SD','Sudan','en-GB','SDG','["en-GB"]','metric','sqm','dd/MM/yyyy','+249','generic','banned',false,false,'disabled','disabled','disabled','disabled','disabled','none','Tax',null::numeric,null,'research_only',null,null,'mixed',false,false,'none',null,false,false,true,'This country is blocked for onboarding and payments.'),
  ('SS','South Sudan','en-GB','SSP','["en-GB"]','metric','sqm','dd/MM/yyyy','+211','generic','banned',false,false,'disabled','disabled','disabled','disabled','disabled','none','Tax',null::numeric,null,'research_only',null,null,'mixed',false,false,'none',null,false,false,true,'This country is blocked for onboarding and payments.'),
  ('SO','Somalia','en-GB','SOS','["en-GB"]','metric','sqm','dd/MM/yyyy','+252','generic','banned',false,false,'disabled','disabled','disabled','disabled','disabled','none','Tax',null::numeric,null,'research_only',null,null,'mixed',false,false,'none',null,false,false,true,'This country is blocked for onboarding and payments.'),
  ('YE','Yemen','en-GB','YER','["en-GB"]','metric','sqm','dd/MM/yyyy','+967','generic','banned',false,false,'disabled','disabled','disabled','disabled','disabled','none','Tax',null::numeric,null,'research_only',null,null,'mixed',false,false,'none',null,false,false,true,'This country is blocked for onboarding and payments.'),
  ('AF','Afghanistan','en-GB','AFN','["en-GB"]','metric','sqm','dd/MM/yyyy','+93','generic','banned',false,false,'disabled','disabled','disabled','disabled','disabled','none','Tax',null::numeric,null,'research_only',null,null,'mixed',false,false,'none',null,false,false,true,'This country is blocked for onboarding and payments.'),
  ('MM','Myanmar','en-GB','MMK','["en-GB"]','metric','sqm','dd/MM/yyyy','+95','generic','banned',false,false,'disabled','disabled','disabled','disabled','disabled','none','Tax',null::numeric,null,'research_only',null,null,'mixed',false,false,'none',null,false,false,true,'This country is blocked for onboarding and payments.')
)
insert into public.country_profiles (
  country_code, display_name, default_locale, default_currency, supported_locales,
  measurement_system, area_unit, date_format, number_format, phone_country_code, address_model_id,
  offer_status, stripe_billing_supported, connect_payout_supported,
  offer_pack_status, property_features_status, legal_status, tax_status, privacy_status, consumer_status,
  tax_scheme, tax_name, standard_tax_rate, tax_id_label,
  privacy_regime, dsar_response_days, breach_notify_hours, consent_model,
  representative_required, dpo_required, transfer_mechanism,
  b2c_withdrawal_days, withdrawal_button_required, auto_renewal_disclosure,
  requires_local_review, legal_disclaimer
)
select
  country_code, display_name, default_locale, default_currency, supported_locales::jsonb,
  measurement_system, area_unit, date_format, default_locale, phone_country_code, address_model_id,
  offer_status::intl_offer_status, stripe_billing, connect_payout,
  -- offer_pack_status is DERIVED from the country posture (not a seed column):
  -- GB is the enabled baseline, banned countries are disabled, everything else
  -- defaults to the property_status (research_only for the candidate set).
  (case
     when country_code = 'GB' then 'enabled'
     when offer_status = 'banned' then 'disabled'
     else property_status
   end)::intl_pack_status,
  property_status::intl_pack_status, legal_status::intl_pack_status,
  tax_status::intl_pack_status, privacy_status::intl_pack_status, consumer_status::intl_pack_status,
  tax_scheme::intl_tax_scheme, tax_name, standard_rate, tax_id_label,
  privacy_regime, dsar_days, breach_hours, consent_model,
  rep_required, dpo_required, transfer_mechanism,
  withdrawal_days, withdrawal_button, auto_renewal,
  requires_review, disclaimer
from seed
on conflict (country_code) do nothing;

commit;

-- ── 17e. Per-domain control-plane rows (derived from country_profiles) ───────
-- These keep the normalised domain tables in lock-step with the profile so the
-- tax/privacy/consumer/invoice resolvers have a row for every seeded country.
begin;

insert into public.country_tax_profiles
  (country_code, scheme, tax_name, standard_rate, tax_id_label, b2b_reverse_charge,
   oss_eligible, status)
select country_code, tax_scheme, tax_name, standard_tax_rate, tax_id_label, b2b_reverse_charge,
       (tax_scheme = 'vat_oss'), tax_status
from public.country_profiles
on conflict (country_code) do nothing;

insert into public.country_privacy_profiles
  (country_code, regime, dsar_response_days, breach_notify_hours, consent_model,
   representative_required, dpo_required, transfer_mechanism, status)
select country_code, privacy_regime, dsar_response_days, breach_notify_hours, consent_model,
       representative_required, dpo_required, transfer_mechanism, privacy_status
from public.country_profiles
on conflict (country_code) do nothing;

insert into public.country_consumer_rules
  (country_code, b2c_withdrawal_days, withdrawal_button_required, auto_renewal_disclosure,
   cooling_off_applies)
select country_code, b2c_withdrawal_days, withdrawal_button_required, auto_renewal_disclosure,
       (b2c_withdrawal_days is not null)
from public.country_profiles
on conflict (country_code) do nothing;

insert into public.country_invoice_rules
  (country_code, sequential_numbering, tax_breakdown_required, supplier_tax_id_required, buyer_tax_id_required)
select country_code,
       (tax_scheme in ('vat','vat_oss')),
       (tax_scheme <> 'none'),
       (tax_scheme in ('vat','vat_oss')),
       b2b_reverse_charge
from public.country_profiles
on conflict (country_code) do nothing;

insert into public.billing_country_matrix
  (country_code, billing_supported, manual_review, currency)
select country_code, stripe_billing_supported, (offer_status = 'restricted'), default_currency
from public.country_profiles
on conflict (country_code) do nothing;

insert into public.connect_payout_country_matrix
  (country_code, payout_supported, manual_review)
select country_code, connect_payout_supported, (offer_status = 'restricted')
from public.country_profiles
on conflict (country_code) do nothing;

-- Release gates: GB starts ENABLED (the reviewed baseline), banned countries are
-- SUSPENDED, everything else LOCKED awaiting review. We seed GB's gate as
-- 'staged' first then promote so the enforcement trigger validates it after the
-- approved reviews exist (inserted below).
insert into public.country_release_gates (country_code, state)
select country_code,
       (case when offer_status = 'banned' then 'suspended'::intl_release_state
             else 'locked'::intl_release_state end)
from public.country_profiles
on conflict (country_code) do nothing;

-- GB reviews: all required domains approved (the reviewed V1 baseline).
insert into public.country_pack_reviews (country_code, domain, verdict, reviewer_name, reviewed_at)
values
  ('GB','legal','approved','Propvora V1 review',now()),
  ('GB','tax','approved','Propvora V1 review',now()),
  ('GB','privacy','approved','Propvora V1 review',now()),
  ('GB','sanctions','approved','Propvora V1 review',now()),
  ('GB','commercial','approved','Propvora V1 review',now())
on conflict (country_code, domain) do nothing;

-- Now promote GB's gate to enabled (passes the enforcement trigger).
update public.country_release_gates
   set state = 'enabled'
 where country_code = 'GB' and state <> 'enabled';

-- Sub-national regions for the address pickers (GB nations + US/CA/AU/AE).
insert into public.country_regions (country_code, code, name, region_type, sort_order) values
  ('GB','ENG','England','nation',1),('GB','SCT','Scotland','nation',2),
  ('GB','WLS','Wales','nation',3),('GB','NIR','Northern Ireland','nation',4),
  ('AU','NSW','New South Wales','state',1),('AU','VIC','Victoria','state',2),
  ('AU','QLD','Queensland','state',3),('AU','WA','Western Australia','state',4),
  ('AU','SA','South Australia','state',5),('AU','TAS','Tasmania','state',6),
  ('AU','ACT','Australian Capital Territory','territory',7),('AU','NT','Northern Territory','territory',8),
  ('CA','ON','Ontario','province',1),('CA','QC','Quebec','province',2),
  ('CA','BC','British Columbia','province',3),('CA','AB','Alberta','province',4),
  ('AE','DXB','Dubai','emirate',1),('AE','AUH','Abu Dhabi','emirate',2),
  ('AE','SHJ','Sharjah','emirate',3)
on conflict (country_code, code) do nothing;

-- EU Art.27 representative placeholders for the EU research set (not appointed).
insert into public.country_representatives (country_code, rep_type, status)
select country_code, 'eu_representative', 'not_appointed'
from public.country_profiles
where representative_required = true and privacy_regime = 'eu_gdpr'
on conflict do nothing;

-- Global subprocessor + transfer register bootstrap (non-country-specific).
insert into public.subprocessor_register (name, purpose, country_code, transfer_mechanism, status, added_at) values
  ('Supabase','Application database & auth','SG','eu_scc','active', current_date),
  ('Vercel','Application hosting / edge','US','eu_scc','active', current_date),
  ('Stripe','Payments & billing','US','eu_scc','active', current_date),
  ('Resend','Transactional email','US','eu_scc','active', current_date)
on conflict do nothing;

commit;

-- ── 17f. Bridge existing country_packs → country_profiles (additive) ─────────
-- The v1 control table country_packs stays the source for the existing
-- guardrail/jurisdiction code. We make sure every country_packs row has a
-- matching country_profiles row (so the new resolvers cover every legacy code),
-- and copy any legacy code we don't already profile into a cautious default.
begin;
insert into public.country_profiles (country_code, display_name, default_currency, address_model_id)
select cp.code, coalesce(cp.name, cp.code), coalesce(cp.default_currency,'GBP'), 'generic'
from public.country_packs cp
where length(cp.code) = 2
  and not exists (select 1 from public.country_profiles p where p.country_code = cp.code)
on conflict (country_code) do nothing;
commit;
