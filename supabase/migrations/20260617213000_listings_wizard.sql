-- ============================================================
-- 20260617213000_listings_wizard.sql
-- LISTING CREATION WIZARD — additive, workspace-scoped tables backing the
-- 5-step listing wizard (Basics, Media, Pricing & Availability, Policies &
-- Operations, Review & Publish) and the shared draft store.
--
-- 100% ADDITIVE and IDEMPOTENT. Every statement uses IF NOT EXISTS /
-- DROP POLICY IF EXISTS so it is safe to re-run and never clobbers existing
-- objects. The wizard UI reads these via 42P01-safe hooks: if a table is
-- missing or a query fails (42P01 / RLS), the wizard keeps the draft in memory
-- and renders premium seed data.
--
-- RLS model: workspace-membership via REAL public.workspace_members(
-- workspace_id, user_id) — the SAME pattern as 20260617200000_automations_section.sql.
--
-- Media is UPLOAD-ONLY. Files live at the storage path:
--   workspaces/{workspaceId}/listings/{listingId}/media/
-- (stored as `storage_path` on listing_media — there are no URL columns).
-- ============================================================

-- ──────────────────────────── Drafts ────────────────────────────
CREATE TABLE IF NOT EXISTS public.listing_drafts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL,
  listing_id    uuid,
  status        text NOT NULL DEFAULT 'draft',
  current_step  integer NOT NULL DEFAULT 1,
  title         text,
  listing_type  text DEFAULT 'short-term',
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  archived_at   timestamptz
);

-- ──────────────────────────── Per-step state ────────────────────────────
CREATE TABLE IF NOT EXISTS public.listing_wizard_steps (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL,
  listing_id    uuid,
  draft_id      uuid,
  step_key      text NOT NULL,
  status        text NOT NULL DEFAULT 'in_progress',
  completion_pct integer NOT NULL DEFAULT 0,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  archived_at   timestamptz
);

-- ──────────────────────────── Media (upload-only) ────────────────────────────
CREATE TABLE IF NOT EXISTS public.listing_media (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL,
  listing_id    uuid,
  draft_id      uuid,
  -- workspaces/{workspaceId}/listings/{listingId}/media/{file}
  storage_path  text NOT NULL,
  file_name     text,
  kind          text NOT NULL DEFAULT 'photo',
  caption       text,
  alt_text      text,
  is_cover      boolean NOT NULL DEFAULT false,
  sort_order    integer NOT NULL DEFAULT 0,
  width_px      integer,
  height_px     integer,
  file_size_bytes bigint,
  format        text,
  status        text NOT NULL DEFAULT 'ready',
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  archived_at   timestamptz
);

CREATE TABLE IF NOT EXISTS public.listing_media_rooms (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL,
  listing_id    uuid,
  draft_id      uuid,
  room_key      text NOT NULL,
  label         text,
  sort_order    integer NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'active',
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  archived_at   timestamptz
);

-- ──────────────────────────── Pricing & availability ────────────────────────────
CREATE TABLE IF NOT EXISTS public.listing_pricing_rules (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid NOT NULL,
  listing_id      uuid,
  draft_id        uuid,
  rule_type       text NOT NULL DEFAULT 'base',
  name            text,
  date_range      text,
  base_rate_pence bigint,
  weekday_rate_pence bigint,
  weekend_rate_pence bigint,
  adjustment_pct  numeric,
  currency        text NOT NULL DEFAULT 'GBP',
  smart_pricing   boolean NOT NULL DEFAULT false,
  status          text NOT NULL DEFAULT 'active',
  metadata_json   jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  archived_at     timestamptz
);

CREATE TABLE IF NOT EXISTS public.listing_availability_rules (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL,
  listing_id    uuid,
  draft_id      uuid,
  rule_type     text NOT NULL DEFAULT 'stay',
  label         text,
  min_stay_nights integer,
  max_stay_nights integer,
  last_minute_hours integer,
  advance_notice_days integer,
  blackout_from date,
  blackout_to   date,
  instant_book  boolean NOT NULL DEFAULT false,
  status        text NOT NULL DEFAULT 'active',
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  archived_at   timestamptz
);

CREATE TABLE IF NOT EXISTS public.listing_fees (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL,
  listing_id    uuid,
  draft_id      uuid,
  label         text NOT NULL,
  amount_pence  bigint NOT NULL DEFAULT 0,
  basis         text NOT NULL DEFAULT 'per-stay',
  fee_type      text NOT NULL DEFAULT 'custom',
  status        text NOT NULL DEFAULT 'active',
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  archived_at   timestamptz
);

CREATE TABLE IF NOT EXISTS public.listing_taxes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL,
  listing_id    uuid,
  draft_id      uuid,
  label         text NOT NULL DEFAULT 'VAT',
  rate_pct      numeric NOT NULL DEFAULT 20,
  inclusive     boolean NOT NULL DEFAULT false,
  status        text NOT NULL DEFAULT 'active',
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  archived_at   timestamptz
);

CREATE TABLE IF NOT EXISTS public.listing_deposits (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL,
  listing_id    uuid,
  draft_id      uuid,
  deposit_type  text NOT NULL DEFAULT 'damage',
  amount_pence  bigint NOT NULL DEFAULT 0,
  cancellation_fee_pence bigint NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'active',
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  archived_at   timestamptz
);

-- ──────────────────────────── Policies & operations ────────────────────────────
CREATE TABLE IF NOT EXISTS public.listing_policies (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL,
  listing_id    uuid,
  draft_id      uuid,
  check_in_method text,
  check_in_time text,
  check_out_time text,
  cancellation_policy text,
  self_check_in_instructions text,
  cleaning_turnaround_hours integer,
  assigned_housekeeper text,
  emergency_contact text,
  operational_notes text,
  licence_number text,
  licence_verified boolean NOT NULL DEFAULT false,
  smoking_allowed boolean NOT NULL DEFAULT false,
  pets_allowed   boolean NOT NULL DEFAULT false,
  parties_allowed boolean NOT NULL DEFAULT false,
  status        text NOT NULL DEFAULT 'active',
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  archived_at   timestamptz
);

CREATE TABLE IF NOT EXISTS public.listing_house_rules (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL,
  listing_id    uuid,
  draft_id      uuid,
  rule_kind     text NOT NULL DEFAULT 'house',
  label         text NOT NULL,
  enabled       boolean NOT NULL DEFAULT true,
  status        text NOT NULL DEFAULT 'active',
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  archived_at   timestamptz
);

CREATE TABLE IF NOT EXISTS public.listing_compliance_links (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL,
  listing_id    uuid,
  draft_id      uuid,
  label         text NOT NULL,
  reference     text,
  status        text NOT NULL DEFAULT 'pending',
  document_id   uuid,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  archived_at   timestamptz
);

-- ──────────────────────────── Channels & publication ────────────────────────────
CREATE TABLE IF NOT EXISTS public.listing_channel_mappings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL,
  listing_id    uuid,
  draft_id      uuid,
  channel_key   text NOT NULL,
  label         text,
  connected     boolean NOT NULL DEFAULT false,
  external_id   text,
  sync_enabled  boolean NOT NULL DEFAULT false,
  status        text NOT NULL DEFAULT 'active',
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  archived_at   timestamptz
);

CREATE TABLE IF NOT EXISTS public.listing_publication_checks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL,
  listing_id    uuid,
  draft_id      uuid,
  check_key     text NOT NULL,
  label         text,
  complete      boolean NOT NULL DEFAULT false,
  blocking      boolean NOT NULL DEFAULT true,
  status        text NOT NULL DEFAULT 'pending',
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  archived_at   timestamptz
);

CREATE TABLE IF NOT EXISTS public.listing_publish_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL,
  listing_id    uuid,
  draft_id      uuid,
  event_type    text NOT NULL DEFAULT 'publish',
  actor         text,
  status        text NOT NULL DEFAULT 'published',
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  archived_at   timestamptz
);

-- ──────────────────────────── Indexes ────────────────────────────
DO $idx$
DECLARE
  t text;
  tables text[] := ARRAY[
    'listing_drafts',
    'listing_wizard_steps',
    'listing_media',
    'listing_media_rooms',
    'listing_pricing_rules',
    'listing_availability_rules',
    'listing_fees',
    'listing_taxes',
    'listing_deposits',
    'listing_policies',
    'listing_house_rules',
    'listing_compliance_links',
    'listing_channel_mappings',
    'listing_publication_checks',
    'listing_publish_events'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_ws       ON public.%I(workspace_id);', t, t);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_listing  ON public.%I(listing_id);', t, t);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_status   ON public.%I(status);', t, t);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_created  ON public.%I(created_at);', t, t);
  END LOOP;
END $idx$;

-- ──────────────────────────── RLS + workspace-membership policies ────────────────────────────
-- Mirrors the existing automations_section RLS pattern exactly, using the REAL
-- public.workspace_members(workspace_id, user_id) table.
DO $rls$
DECLARE
  t text;
  tables text[] := ARRAY[
    'listing_drafts',
    'listing_wizard_steps',
    'listing_media',
    'listing_media_rooms',
    'listing_pricing_rules',
    'listing_availability_rules',
    'listing_fees',
    'listing_taxes',
    'listing_deposits',
    'listing_policies',
    'listing_house_rules',
    'listing_compliance_links',
    'listing_channel_mappings',
    'listing_publication_checks',
    'listing_publish_events'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS %I_ws_member ON public.%I;', t, t);
    EXECUTE format($p$
      CREATE POLICY %I_ws_member ON public.%I FOR ALL
      USING (EXISTS (
        SELECT 1 FROM public.workspace_members wm
        WHERE wm.workspace_id = %I.workspace_id AND wm.user_id = auth.uid()
      ))
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.workspace_members wm
        WHERE wm.workspace_id = %I.workspace_id AND wm.user_id = auth.uid()
      ));
    $p$, t, t, t, t);
  END LOOP;
END $rls$;
