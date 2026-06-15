-- ============================================================================
-- Recipient share portals  (/p/[token])  +  affiliate payout workflow
-- ----------------------------------------------------------------------------
-- This migration is ADDITIVE. It does NOT touch the existing magic-link portal
-- model (contact_portal_access / portal_access_tokens / portal_sessions), which
-- exchanges a token for a session scoped to a whole vertical. Instead it adds a
-- complementary, RESOURCE-scoped, capability-based share-link model used by the
-- new public /p/[token] recipient surface, where the token in the URL IS the
-- access credential (no session exchange) and a single grant maps to specific
-- resource(s) + a fixed set of capabilities.
--
-- Security model:
--   * The raw token is NEVER stored. Only its SHA-256 hex digest lives in
--     token_hash (unique). The URL carries the secret.
--   * expires_at + revoked_at enforce expiry / revocation server-side.
--   * scope is frozen at mint time: workspace_id + resource_type + resource_ids
--     (+ a capabilities text[]). Reads/writes are STRICTLY filtered to it by the
--     server access layer; RLS additionally locks the rows to the owning
--     workspace's members for the issuance UI.
--   * Every recipient access is written to audit_logs by the server.
-- ============================================================================

-- ─── enums ──────────────────────────────────────────────────────────────────
do $$ begin
  create type portal_share_resource as enum (
    'document', 'documents', 'invoice', 'job', 'work_order', 'tenancy', 'property'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type portal_share_capability as enum (
    'view', 'download', 'upload', 'sign', 'comment'
  );
exception when duplicate_object then null; end $$;

-- ─── portal_share_links ─────────────────────────────────────────────────────
create table if not exists public.portal_share_links (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces(id) on delete cascade,
  -- optional link to the existing contact-grant model (recipient identity)
  contact_id      uuid,
  -- what the recipient can reach
  resource_type   portal_share_resource not null,
  resource_ids    uuid[] not null default '{}',
  capabilities    portal_share_capability[] not null default '{view}',
  -- presentation / honesty
  title           text,
  recipient_label text,
  -- credential: only the SHA-256 hex of the URL secret is stored
  token_hash      text not null unique,
  -- lifecycle
  expires_at      timestamptz not null,
  revoked_at      timestamptz,
  revoked_by      uuid,
  last_viewed_at  timestamptz,
  view_count      integer not null default 0,
  upload_count    integer not null default 0,
  created_by      uuid,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists portal_share_links_workspace_idx
  on public.portal_share_links (workspace_id, created_at desc);
create index if not exists portal_share_links_token_idx
  on public.portal_share_links (token_hash);

-- ─── portal_share_uploads ───────────────────────────────────────────────────
-- Files a recipient uploads through a share link (capability='upload').
create table if not exists public.portal_share_uploads (
  id              uuid primary key default gen_random_uuid(),
  share_link_id   uuid not null references public.portal_share_links(id) on delete cascade,
  workspace_id    uuid not null references public.workspaces(id) on delete cascade,
  storage_key     text not null,
  file_name       text,
  content_type    text,
  size_bytes      bigint,
  uploaded_at     timestamptz not null default now()
);

create index if not exists portal_share_uploads_link_idx
  on public.portal_share_uploads (share_link_id, uploaded_at desc);

-- ─── RLS ────────────────────────────────────────────────────────────────────
-- The PUBLIC /p/[token] surface NEVER uses RLS — it runs through the
-- service-role server access layer which enforces token + scope. RLS here only
-- governs the in-app issuance / management UI: a workspace member may see and
-- manage their own workspace's share links. The service role bypasses RLS.
alter table public.portal_share_links  enable row level security;
alter table public.portal_share_uploads enable row level security;

drop policy if exists portal_share_links_member_select on public.portal_share_links;
create policy portal_share_links_member_select on public.portal_share_links
  for select using (
    workspace_id in (
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  );

drop policy if exists portal_share_links_member_write on public.portal_share_links;
create policy portal_share_links_member_write on public.portal_share_links
  for all using (
    workspace_id in (
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  ) with check (
    workspace_id in (
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  );

drop policy if exists portal_share_uploads_member_select on public.portal_share_uploads;
create policy portal_share_uploads_member_select on public.portal_share_uploads
  for select using (
    workspace_id in (
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  );

-- ============================================================================
-- Affiliate payout workflow
-- ----------------------------------------------------------------------------
-- affiliate_payouts already exists (period / amount_pence / status / paid_at).
-- We add a request → review → mark-paid workflow on top of it with explicit
-- columns + an auditable status lifecycle, without dropping the existing table.
--
-- Lifecycle:  requested → approved → paid     (terminal: paid, rejected)
--             requested → rejected
-- A payout request snapshots the affiliate's cleared balance at request time
-- and records the reviewer + timestamps for each transition.
-- ============================================================================

alter table public.affiliate_payouts
  add column if not exists requested_at      timestamptz,
  add column if not exists requested_by      uuid,
  add column if not exists reviewed_at       timestamptz,
  add column if not exists reviewed_by       uuid,
  add column if not exists payout_email      text,
  add column if not exists payout_method     text,
  add column if not exists payout_reference  text,
  add column if not exists review_note       text,
  add column if not exists cleared_snapshot_pence bigint,
  add column if not exists updated_at        timestamptz default now();

-- Make `period` tolerant for ad-hoc requests (existing rows keep their value).
alter table public.affiliate_payouts alter column period drop not null;

-- Widen the status CHECK to cover the request → review → mark-paid lifecycle.
-- (Existing values scheduled/paid/failed/cancelled remain valid.)
alter table public.affiliate_payouts drop constraint if exists affiliate_payouts_status_check;
alter table public.affiliate_payouts add constraint affiliate_payouts_status_check
  check (status = any (array[
    'requested','approved','rejected',
    'scheduled','processing','paid','failed','cancelled'
  ]));

-- Helpful lookup for the affiliate dashboard + admin review queue.
create index if not exists affiliate_payouts_ws_status_idx
  on public.affiliate_payouts (affiliate_workspace_id, status, created_at desc);

-- RLS: affiliate_payouts may already have policies. Ensure an affiliate can read
-- their own payout rows (the dashboard reads via the anon-keyed client).
alter table public.affiliate_payouts enable row level security;

drop policy if exists affiliate_payouts_owner_select on public.affiliate_payouts;
create policy affiliate_payouts_owner_select on public.affiliate_payouts
  for select using (
    affiliate_workspace_id in (
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  );
