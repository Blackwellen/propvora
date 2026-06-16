-- Platform settings store for the admin console.
--
-- A simple key -> jsonb blob store for platform-wide configuration that does not
-- warrant its own table (general settings, maintenance mode, AI defaults note,
-- etc.). Read/written exclusively by the service-role client behind the
-- server-side platform-admin guard; RLS denies all non-service access.
--
-- Idempotent: safe to re-run.

create table if not exists public.platform_settings (
  key         text primary key,
  value       jsonb not null default '{}'::jsonb,
  updated_by  uuid,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.platform_settings is
  'Platform-wide admin configuration (key -> jsonb). Service-role only.';

alter table public.platform_settings enable row level security;

-- No policies: with RLS enabled and no permissive policy, anon/authenticated
-- roles are denied. The service-role key bypasses RLS, which is the only path
-- the admin console uses.

-- Seed sensible defaults (no-op if rows already exist).
insert into public.platform_settings (key, value)
values
  ('general', jsonb_build_object(
    'platform_name', 'Propvora',
    'support_email', 'support@propvora.com',
    'trial_length_days', 14
  )),
  ('maintenance', jsonb_build_object(
    'enabled', false,
    'message', '',
    'allow_admins', true
  ))
on conflict (key) do nothing;
