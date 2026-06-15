-- Track B — INTERNATIONAL: country profiles + tax engine + jurisdiction data
-- Idempotent / additive. Builds ON the existing public.country_packs control
-- plane (PK = code text; offer_status / legal_status / tax_status already live).
--
-- HONESTY / COMPLIANCE:
--   * Tax rates stored here drive OPERATIONAL ESTIMATES to assist users — they
--     are NOT tax advice and the app must never claim to file or pay tax. Every
--     tax output is labelled an estimate (see src/lib/international/tax.ts).
--   * GB VAT must stay correct: 20% standard / 5% reduced / 0% zero.
--   * Non-GB jurisdictions are gated by country_packs status; sanctioned
--     countries (RU/IR/KP/SY) are hard-blocked in code (isCountrySanctioned).
--
-- RLS model (reference data = global read):
--   * country_tax_rules / jurisdiction_profiles: SELECT to authenticated (true);
--     write only is_platform_admin(auth.uid()) — mirrors country_packs policies.

-- ── 1. Extend country_packs additively ───────────────────────────────────────
alter table public.country_packs add column if not exists currency_code      text;
alter table public.country_packs add column if not exists currency_symbol    text;
alter table public.country_packs add column if not exists locale_default     text;
alter table public.country_packs add column if not exists date_format        text;
alter table public.country_packs add column if not exists address_format     jsonb not null default '{}'::jsonb;
alter table public.country_packs add column if not exists tax_system         text;          -- vat | gst | sales_tax | none
alter table public.country_packs add column if not exists standard_tax_rate  numeric;       -- percent, e.g. 20
alter table public.country_packs add column if not exists tax_label          text;          -- 'VAT' | 'GST' | 'Sales Tax'
alter table public.country_packs add column if not exists legal_framework    jsonb not null default '{}'::jsonb;
alter table public.country_packs add column if not exists right_to_rent_regime text;         -- e.g. 'uk_right_to_rent' (GB only), null elsewhere

-- Backfill currency_code / locale_default from existing columns where empty.
update public.country_packs set currency_code  = coalesce(currency_code, default_currency) where currency_code is null;
update public.country_packs set locale_default = coalesce(locale_default, default_locale) where locale_default is null;

-- Per-country currency symbols (only for the packs we ship reference data for).
update public.country_packs set currency_symbol = v.sym
from (values
  ('GB','£'),('IE','€'),('AU','A$'),('NZ','NZ$'),('CA','C$'),('US','$')
) as v(code, sym)
where public.country_packs.code = v.code and (public.country_packs.currency_symbol is null);

-- Backfill GB (the reviewed/enabled reference profile) with correct values.
update public.country_packs set
  currency_code       = coalesce(currency_code, 'GBP'),
  currency_symbol     = '£',
  locale_default      = coalesce(locale_default, 'en-GB'),
  date_format         = coalesce(date_format, 'dd/MM/yyyy'),
  tax_system          = 'vat',
  standard_tax_rate   = 20,
  tax_label           = 'VAT',
  right_to_rent_regime = coalesce(right_to_rent_regime, 'uk_right_to_rent'),
  address_format      = case when address_format = '{}'::jsonb then
                          jsonb_build_object('order', jsonb_build_array('address_line1','address_line2','city','county','postcode'),
                                             'postcode_label','Postcode','region_label','County','region_required', false)
                        else address_format end,
  legal_framework     = case when legal_framework = '{}'::jsonb then
                          jsonb_build_object('tenancy_act','Renters'' Rights Act 2026','licensing','HMO','level','national')
                        else legal_framework end
where code = 'GB';

-- Headline values for the "offer / research_only" packs (estimates only).
update public.country_packs set tax_system = v.sys, standard_tax_rate = v.rate, tax_label = v.label,
  date_format = coalesce(date_format, v.df)
from (values
  ('IE','vat',23::numeric,'VAT','dd/MM/yyyy'),
  ('AU','gst',10::numeric,'GST','dd/MM/yyyy'),
  ('NZ','gst',15::numeric,'GST','dd/MM/yyyy'),
  ('CA','gst',5::numeric,'GST/HST','yyyy-MM-dd'),
  ('US','sales_tax',0::numeric,'Sales Tax','MM/dd/yyyy')
) as v(code, sys, rate, label, df)
where public.country_packs.code = v.code and (public.country_packs.tax_system is null);

-- Banned countries: no tax system, no estimates.
update public.country_packs set tax_system = coalesce(tax_system, 'none')
where offer_status = 'banned' and tax_system is null;

-- ── 2. country_tax_rules: per-country rate rows (DB-driven tax engine) ────────
create table if not exists public.country_tax_rules (
  id           uuid primary key default gen_random_uuid(),
  country_code text not null references public.country_packs(code) on delete cascade,
  tax_type     text not null,                          -- vat | gst | sales_tax
  name         text not null,
  rate         numeric not null,                        -- percent (e.g. 20 = 20%)
  applies_to   text not null default 'standard',        -- standard | reduced | zero | exempt | services | accommodation
  valid_from   date,
  valid_to     date,
  notes        text,
  created_at   timestamptz not null default now()
);

create index if not exists country_tax_rules_country_idx on public.country_tax_rules (country_code);
create index if not exists country_tax_rules_lookup_idx  on public.country_tax_rules (country_code, applies_to);

-- Seed GB VAT (correct: 20 standard / 5 reduced / 0 zero) + offer-country headline rates.
-- Idempotent on (country_code, applies_to, tax_type).
insert into public.country_tax_rules (country_code, tax_type, name, rate, applies_to, valid_from, notes)
select v.country_code, v.tax_type, v.name, v.rate, v.applies_to, v.valid_from::date, v.notes
from (values
  ('GB','vat','UK VAT standard rate',          20::numeric,'standard',     '2011-01-04','Standard rate of VAT'),
  ('GB','vat','UK VAT reduced rate',            5::numeric,'reduced',      '2011-01-04','Reduced rate (e.g. domestic fuel/power)'),
  ('GB','vat','UK VAT zero rate',               0::numeric,'zero',         '2011-01-04','Zero-rated supplies'),
  ('IE','vat','Ireland VAT standard rate',     23::numeric,'standard',     '2012-01-01','EU VAT via OSS'),
  ('IE','vat','Ireland VAT reduced rate',      13.5::numeric,'reduced',    '2012-01-01','Reduced rate'),
  ('AU','gst','Australia GST',                 10::numeric,'standard',     '2000-07-01','GST'),
  ('NZ','gst','New Zealand GST',               15::numeric,'standard',     '2010-10-01','GST'),
  ('CA','gst','Canada federal GST',             5::numeric,'standard',     '2008-01-01','Federal GST; provincial PST/HST varies')
) as v(country_code, tax_type, name, rate, applies_to, valid_from, notes)
where not exists (
  select 1 from public.country_tax_rules r
  where r.country_code = v.country_code and r.applies_to = v.applies_to and r.tax_type = v.tax_type
);

-- ── 3. jurisdiction_profiles: one row per country, status mirror ─────────────
create table if not exists public.jurisdiction_profiles (
  country_code text primary key references public.country_packs(code) on delete cascade,
  display_name text not null,
  supported    boolean not null default false,
  status       text not null default 'research_only', -- reviewed | research_only | offer | banned
  notes        jsonb not null default '{}'::jsonb,
  updated_at   timestamptz not null default now()
);

create index if not exists jurisdiction_profiles_status_idx on public.jurisdiction_profiles (status);

-- Backfill from country_packs. status derives from the strongest signal:
--   banned offer_status   -> banned
--   legal reviewed + enabled property features -> reviewed
--   otherwise the offer_status (offer) or research_only.
insert into public.jurisdiction_profiles (country_code, display_name, supported, status, notes)
select cp.code,
       cp.name,
       (cp.offer_status <> 'banned'),
       case
         when cp.offer_status = 'banned' then 'banned'
         when cp.legal_status = 'reviewed' and cp.property_features_status = 'enabled' then 'reviewed'
         when cp.offer_status = 'offer' then 'offer'
         else 'research_only'
       end,
       jsonb_build_object(
         'offer_status', cp.offer_status,
         'legal_status', cp.legal_status,
         'tax_status', cp.tax_status,
         'property_features_status', cp.property_features_status
       )
from public.country_packs cp
on conflict (country_code) do update set
  display_name = excluded.display_name,
  supported    = excluded.supported,
  status       = excluded.status,
  notes        = excluded.notes,
  updated_at   = now();

-- ── 4. RLS: reference data = global read to authenticated; admin write ────────
alter table public.country_tax_rules     enable row level security;
alter table public.jurisdiction_profiles enable row level security;

drop policy if exists country_tax_rules_read_authenticated on public.country_tax_rules;
create policy country_tax_rules_read_authenticated on public.country_tax_rules
  for select using (true);

drop policy if exists country_tax_rules_admin_write on public.country_tax_rules;
create policy country_tax_rules_admin_write on public.country_tax_rules
  for all using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

drop policy if exists jurisdiction_profiles_read_authenticated on public.jurisdiction_profiles;
create policy jurisdiction_profiles_read_authenticated on public.jurisdiction_profiles
  for select using (true);

drop policy if exists jurisdiction_profiles_admin_write on public.jurisdiction_profiles;
create policy jurisdiction_profiles_admin_write on public.jurisdiction_profiles
  for all using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));
