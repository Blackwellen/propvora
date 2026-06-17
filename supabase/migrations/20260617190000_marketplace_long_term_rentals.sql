-- ─── Long-term rental marketplace tables ───────────────────────────────────
-- Covers: listings, viewing requests, rental applications, saved searches,
-- and shortlists. All tables have RLS enabled with appropriate policies.

create table if not exists marketplace_long_term_rentals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid,
  slug text unique not null,
  title text not null,
  property_type text not null,
  location text not null,
  city text not null,
  postcode text,
  lat double precision,
  lng double precision,
  beds integer not null default 1,
  bathrooms integer not null default 1,
  max_occupants integer,
  furnishing_status text not null default 'Furnished',
  bills_included boolean not null default false,
  pets_allowed boolean not null default false,
  parking_available boolean not null default false,
  garden_available boolean not null default false,
  student_friendly boolean not null default false,
  family_friendly boolean not null default false,
  professional_friendly boolean not null default false,
  monthly_rent_pence bigint not null,
  deposit_pence bigint not null,
  holding_deposit_pence bigint,
  council_tax_band text,
  epc_rating text,
  licence_verified boolean not null default false,
  landlord_verified boolean not null default false,
  agent_verified boolean not null default false,
  deposit_protection_scheme text,
  available_from date,
  min_tenancy_months integer not null default 6,
  max_tenancy_months integer,
  rating numeric(3,2) default 0,
  review_count integer default 0,
  host_name text,
  host_avatar text,
  host_pro_badge boolean default false,
  hero_image text,
  gallery jsonb default '[]',
  amenities jsonb default '[]',
  badges jsonb default '[]',
  description text,
  features jsonb default '[]',
  nearby_transport jsonb default '[]',
  nearby_amenities jsonb default '[]',
  rooms jsonb default '[]',
  public_visible boolean not null default true,
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists marketplace_viewing_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  customer_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid,
  listing_slug text,
  listing_type text not null default 'long_term_rental',
  preferred_date date,
  preferred_time_window text,
  message text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists marketplace_rental_applications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  customer_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid,
  listing_slug text,
  applicant_name text,
  status text not null default 'draft',
  move_in_date date,
  household_size integer,
  employment_status text,
  income_snapshot bigint,
  documents_status jsonb default '{}',
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists marketplace_saved_searches (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  search_type text not null default 'long_term_rental',
  name text,
  filters jsonb default '{}',
  created_at timestamptz not null default now()
);

create table if not exists marketplace_shortlists (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_slug text not null,
  listing_type text not null default 'long_term_rental',
  notes text,
  created_at timestamptz not null default now(),
  unique(workspace_id, user_id, listing_slug)
);

-- RLS ─────────────────────────────────────────────────────────────────────────

alter table marketplace_long_term_rentals enable row level security;
create policy "public_read_listings" on marketplace_long_term_rentals
  for select using (public_visible = true and status = 'published');

alter table marketplace_viewing_requests enable row level security;
create policy "workspace_own" on marketplace_viewing_requests
  for all using (auth.uid() = customer_id);

alter table marketplace_rental_applications enable row level security;
create policy "workspace_own" on marketplace_rental_applications
  for all using (auth.uid() = customer_id);

alter table marketplace_saved_searches enable row level security;
create policy "workspace_own" on marketplace_saved_searches
  for all using (auth.uid() = user_id);

alter table marketplace_shortlists enable row level security;
create policy "workspace_own" on marketplace_shortlists
  for all using (auth.uid() = user_id);
