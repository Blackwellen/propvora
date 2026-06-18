-- ============================================================================
-- 20260617230000_customer_workspace_tables.sql
--
-- CUSTOMER WORKSPACE — full data model (master prompt §6/§7/§8).
--
-- PURELY ADDITIVE + IDEMPOTENT. Creates the missing customer-workspace tables,
-- indexes, RLS policies and storage buckets/policies. It NEVER alters or drops
-- an existing table/column, and SKIPS the three tables that already exist from
-- earlier migrations:
--   • customer_profiles        (20260616120000_customer_workspace.sql)
--   • customer_message_threads (20260617140000_customer_depth.sql)
--   • customer_messages        (20260617140000_customer_depth.sql)
-- (customer_notifications / customer_saved_searches / customer_saved_listings
--  also already exist and are not in the §6 target list, so untouched.)
--
-- IDENTITY / RLS MODEL ───────────────────────────────────────────────────────
-- Existing customer tables anchor isolation on the CUSTOMER WORKSPACE id via the
-- recursion-safe SECURITY DEFINER helper public.is_customer_workspace_member(uuid)
-- (admits both customer_workspace_members and the operator/owner workspace_members
-- path). We REUSE that helper. To also satisfy the §6 column contract we carry a
-- `customer_id uuid NOT NULL` (the auth user) AND a nullable `workspace_id`
-- (the customer workspace) on each new table. RLS is:
--     workspace_id is present  → is_customer_workspace_member(workspace_id)
--     workspace_id is null     → customer_id = auth.uid()
-- so a customer can only ever reach their own rows by either anchor. No new auth
-- logic is invented.
--
-- PUBLIC-SAFE LET DATA: let_properties / let_property_photos /
-- let_property_amenities are readable by any authenticated user (marketplace
-- browse). Writes are restricted to the owning customer/workspace.
--
-- TENANCY ACCESS: tenancy child rows are reachable only where the user is an
-- occupant / applicant / guarantor, resolved through the link tables
-- (customer_tenancy_occupants, customer_tenancy_guarantor_referencing) plus the
-- owning customer_id.
--
-- All money is integer pence (bigint) by Propvora convention; this migration
-- stores no derived money — amounts live on the columns named *_pence.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. Helpers reused (no redefinition):
--      public.is_customer_workspace_member(uuid)  — RLS anchor
--      public.update_updated_at()                 — shared updated_at trigger fn
-- Defensive: only create a thin fallback if is_customer_workspace_member is
-- somehow absent (it is defined in 20260616120000). Never overrides the real one.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_customer_workspace_member') THEN
    EXECUTE $fn$
      CREATE FUNCTION public.is_customer_workspace_member(_workspace_id uuid)
      RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $b$
        SELECT _workspace_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.customer_workspace_members cwm
          WHERE cwm.workspace_id = _workspace_id AND cwm.user_id = auth.uid()
        );
      $b$;
    $fn$;
    REVOKE ALL ON FUNCTION public.is_customer_workspace_member(uuid) FROM public;
    GRANT EXECUTE ON FUNCTION public.is_customer_workspace_member(uuid) TO authenticated;
  END IF;
END $$;

-- ============================================================================
-- TABLES
--
-- Standard column block (where applicable) per §6:
--   id, workspace_id (nullable), customer_id NOT NULL, property_id, booking_id,
--   tenancy_id, status, metadata_json, created_by, updated_by, created_at,
--   updated_at  — plus surface-specific *_status / *_id columns + indexes.
-- ============================================================================

-- ── Account / profile surfaces ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.customer_account_settings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid,
  customer_id   uuid NOT NULL,
  status        text,
  locale        text,
  timezone      text,
  currency      text,
  marketing_opt_in boolean NOT NULL DEFAULT false,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by    uuid,
  updated_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_saved_addresses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid,
  customer_id   uuid NOT NULL,
  label         text,
  line1         text,
  line2         text,
  city          text,
  region        text,
  postcode      text,
  country       text,
  is_default    boolean NOT NULL DEFAULT false,
  status        text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by    uuid,
  updated_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_payment_methods (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid,
  customer_id     uuid NOT NULL,
  provider        text,
  provider_ref    text,           -- e.g. Stripe payment_method id; never raw PAN
  brand           text,
  last4           text,
  exp_month       integer,
  exp_year        integer,
  is_default      boolean NOT NULL DEFAULT false,
  status          text,
  metadata_json   jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by      uuid,
  updated_by      uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_notification_preferences (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid,
  customer_id   uuid NOT NULL,
  channel       text,             -- email | sms | push | in_app
  category      text,             -- bookings | payments | messages | marketing
  enabled       boolean NOT NULL DEFAULT true,
  status        text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by    uuid,
  updated_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_favourites (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   uuid,
  customer_id    uuid NOT NULL,
  collection_id  uuid,
  property_id    uuid,
  listing_id     uuid,
  entity_type    text,
  entity_id      uuid,
  status         text,
  metadata_json  jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by     uuid,
  updated_by     uuid,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_favourite_collections (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid,
  customer_id   uuid NOT NULL,
  name          text NOT NULL,
  description   text,
  status        text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by    uuid,
  updated_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ── Messaging attachments (threads/messages already exist) ──────────────────

CREATE TABLE IF NOT EXISTS public.customer_message_attachments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid,
  customer_id   uuid NOT NULL,
  thread_id     uuid REFERENCES public.customer_message_threads(id) ON DELETE CASCADE,
  message_id    uuid REFERENCES public.customer_messages(id) ON DELETE CASCADE,
  storage_path  text NOT NULL,            -- messages/{threadId}/attachments/...
  file_name     text,
  content_type  text,
  byte_size     bigint,
  status        text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by    uuid,
  updated_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ── Bookings (customer-side projections; operator bookings table untouched) ──

CREATE TABLE IF NOT EXISTS public.customer_bookings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid,
  customer_id     uuid NOT NULL,
  booking_id      uuid,           -- link to public.bookings (no FK: bookings is operator-owned)
  property_id     uuid,
  status          text,
  payment_status  text,
  check_in        date,
  check_out       date,
  total_pence     bigint,
  currency        text,
  metadata_json   jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by      uuid,
  updated_by      uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_booking_guests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid,
  customer_id   uuid NOT NULL,
  booking_id    uuid,
  full_name     text,
  email         text,
  is_lead       boolean NOT NULL DEFAULT false,
  status        text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by    uuid,
  updated_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_booking_payments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid,
  customer_id     uuid NOT NULL,
  booking_id      uuid,
  amount_pence    bigint,
  currency        text,
  payment_status  text,
  provider        text,
  provider_ref    text,
  status          text,
  metadata_json   jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by      uuid,
  updated_by      uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_booking_receipts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid,
  customer_id   uuid NOT NULL,
  booking_id    uuid,
  payment_id    uuid,
  receipt_no    text,
  amount_pence  bigint,
  currency      text,
  storage_path  text,
  status        text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by    uuid,
  updated_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_booking_reviews (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid,
  customer_id   uuid NOT NULL,
  booking_id    uuid,
  property_id   uuid,
  rating        integer,
  title         text,
  body          text,
  status        text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by    uuid,
  updated_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_booking_disputes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid,
  customer_id   uuid NOT NULL,
  booking_id    uuid,
  category      text,
  subject       text,
  detail        text,
  amount_pence  bigint,
  status        text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by    uuid,
  updated_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_booking_dispute_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid,
  customer_id   uuid NOT NULL,
  dispute_id    uuid REFERENCES public.customer_booking_disputes(id) ON DELETE CASCADE,
  booking_id    uuid,
  event_type    text,
  actor_role    text,
  note          text,
  status        text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by    uuid,
  updated_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_booking_dispute_evidence (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid,
  customer_id   uuid NOT NULL,
  dispute_id    uuid REFERENCES public.customer_booking_disputes(id) ON DELETE CASCADE,
  booking_id    uuid,
  storage_path  text NOT NULL,            -- bookings/{bookingId}/disputes/...
  file_name     text,
  content_type  text,
  byte_size     bigint,
  status        text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by    uuid,
  updated_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ── Money: payments / receipts / deposits / refunds / statements / autopay ──

CREATE TABLE IF NOT EXISTS public.customer_payments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid,
  customer_id     uuid NOT NULL,
  booking_id      uuid,
  tenancy_id      uuid,
  amount_pence    bigint,
  currency        text,
  payment_status  text,
  provider        text,
  provider_ref    text,
  status          text,
  metadata_json   jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by      uuid,
  updated_by      uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_payment_receipts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid,
  customer_id   uuid NOT NULL,
  payment_id    uuid REFERENCES public.customer_payments(id) ON DELETE SET NULL,
  booking_id    uuid,
  tenancy_id    uuid,
  receipt_no    text,
  amount_pence  bigint,
  currency      text,
  storage_path  text,
  status        text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by    uuid,
  updated_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_deposits (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid,
  customer_id     uuid NOT NULL,
  booking_id      uuid,
  tenancy_id      uuid,
  amount_pence    bigint,
  currency        text,
  scheme          text,             -- e.g. DPS / MyDeposits / TDS
  scheme_ref      text,
  payment_status  text,
  status          text,
  metadata_json   jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by      uuid,
  updated_by      uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_refunds (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid,
  customer_id     uuid NOT NULL,
  booking_id      uuid,
  tenancy_id      uuid,
  payment_id      uuid REFERENCES public.customer_payments(id) ON DELETE SET NULL,
  amount_pence    bigint,
  currency        text,
  reason          text,
  payment_status  text,
  status          text,
  metadata_json   jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by      uuid,
  updated_by      uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_statements (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid,
  customer_id   uuid NOT NULL,
  tenancy_id    uuid,
  period_start  date,
  period_end    date,
  total_pence   bigint,
  currency      text,
  storage_path  text,
  status        text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by    uuid,
  updated_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_autopay_mandates (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      uuid,
  customer_id       uuid NOT NULL,
  tenancy_id        uuid,
  payment_method_id uuid REFERENCES public.customer_payment_methods(id) ON DELETE SET NULL,
  provider          text,
  provider_ref      text,
  amount_pence      bigint,
  currency          text,
  cadence           text,           -- monthly | weekly
  next_run_on       date,
  status            text,
  metadata_json     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by        uuid,
  updated_by        uuid,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ── Reviews (general, beyond per-booking) ───────────────────────────────────

CREATE TABLE IF NOT EXISTS public.customer_reviews (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid,
  customer_id   uuid NOT NULL,
  property_id   uuid,
  booking_id    uuid,
  tenancy_id    uuid,
  rating        integer,
  title         text,
  body          text,
  status        text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by    uuid,
  updated_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_review_responses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid,
  customer_id   uuid NOT NULL,
  review_id     uuid REFERENCES public.customer_reviews(id) ON DELETE CASCADE,
  responder_role text,
  body          text,
  status        text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by    uuid,
  updated_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ── Help / support ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.customer_help_tickets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid,
  customer_id   uuid NOT NULL,
  booking_id    uuid,
  tenancy_id    uuid,
  subject       text NOT NULL,
  category      text,
  priority      text,
  status        text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by    uuid,
  updated_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_help_ticket_messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid,
  customer_id   uuid NOT NULL,
  ticket_id     uuid REFERENCES public.customer_help_tickets(id) ON DELETE CASCADE,
  sender_role   text,
  body          text NOT NULL,
  status        text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by    uuid,
  updated_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_help_ticket_attachments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid,
  customer_id   uuid NOT NULL,
  ticket_id     uuid REFERENCES public.customer_help_tickets(id) ON DELETE CASCADE,
  message_id    uuid REFERENCES public.customer_help_ticket_messages(id) ON DELETE CASCADE,
  storage_path  text NOT NULL,            -- help/{ticketId}/attachments/...
  file_name     text,
  content_type  text,
  byte_size     bigint,
  status        text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by    uuid,
  updated_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Help articles: PUBLIC reference content (no per-customer ownership).
CREATE TABLE IF NOT EXISTS public.customer_help_articles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text UNIQUE,
  title         text NOT NULL,
  body          text,
  category      text,
  is_published  boolean NOT NULL DEFAULT false,
  status        text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by    uuid,
  updated_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ── LET (long-term) PROPERTIES — public-safe browse data ────────────────────
-- These are the marketplace let listings surfaced to a customer browsing rentals.
-- owner_customer_id / owner_workspace_id gate WRITE; reads are public to
-- authenticated users (public-safe per §7).

CREATE TABLE IF NOT EXISTS public.let_properties (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        uuid,
  owner_customer_id   uuid,            -- nullable: many let listings are operator-owned
  property_id         uuid,
  slug                text UNIQUE,
  title               text NOT NULL,
  description         text,
  property_type       text,
  address_line1       text,
  city                text,
  region              text,
  postcode            text,
  country             text,
  lat                 double precision,
  lng                 double precision,
  beds                integer,
  bathrooms           integer,
  monthly_rent_pence  bigint,
  deposit_pence       bigint,
  currency            text,
  available_from      date,
  is_published        boolean NOT NULL DEFAULT false,
  status              text,
  metadata_json       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by          uuid,
  updated_by          uuid,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.let_property_photos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  let_property_id uuid NOT NULL REFERENCES public.let_properties(id) ON DELETE CASCADE,
  workspace_id    uuid,
  storage_path    text,
  url             text,
  caption         text,
  sort_order      integer NOT NULL DEFAULT 0,
  status          text,
  metadata_json   jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by      uuid,
  updated_by      uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.let_property_documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  let_property_id uuid NOT NULL REFERENCES public.let_properties(id) ON DELETE CASCADE,
  workspace_id    uuid,
  owner_customer_id uuid,
  doc_type        text,            -- epc | floorplan | brochure | gas_cert ...
  storage_path    text,
  file_name       text,
  is_public       boolean NOT NULL DEFAULT false,
  status          text,
  metadata_json   jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by      uuid,
  updated_by      uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.let_property_amenities (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  let_property_id uuid NOT NULL REFERENCES public.let_properties(id) ON DELETE CASCADE,
  workspace_id    uuid,
  amenity         text NOT NULL,
  category        text,
  status          text,
  metadata_json   jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by      uuid,
  updated_by      uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.let_property_reviews (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  let_property_id uuid NOT NULL REFERENCES public.let_properties(id) ON DELETE CASCADE,
  workspace_id    uuid,
  customer_id     uuid,
  rating          integer,
  title           text,
  body            text,
  status          text,
  metadata_json   jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by      uuid,
  updated_by      uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ── LET viewings (customer-initiated property viewings) ─────────────────────

CREATE TABLE IF NOT EXISTS public.customer_let_viewings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid,
  customer_id     uuid NOT NULL,
  let_property_id uuid REFERENCES public.let_properties(id) ON DELETE SET NULL,
  property_id     uuid,
  requested_for   timestamptz,
  viewing_status  text,
  status          text,
  metadata_json   jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by      uuid,
  updated_by      uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_let_viewing_messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid,
  customer_id   uuid NOT NULL,
  viewing_id    uuid REFERENCES public.customer_let_viewings(id) ON DELETE CASCADE,
  sender_role   text,
  body          text NOT NULL,
  status        text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by    uuid,
  updated_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_let_viewing_documents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid,
  customer_id   uuid NOT NULL,
  viewing_id    uuid REFERENCES public.customer_let_viewings(id) ON DELETE CASCADE,
  storage_path  text NOT NULL,
  file_name     text,
  content_type  text,
  status        text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by    uuid,
  updated_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ── LET applications ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.customer_let_applications (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id       uuid,
  customer_id        uuid NOT NULL,
  let_property_id    uuid REFERENCES public.let_properties(id) ON DELETE SET NULL,
  property_id        uuid,
  application_status text,
  status             text,
  metadata_json      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by         uuid,
  updated_by         uuid,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_let_application_steps (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   uuid,
  customer_id    uuid NOT NULL,
  application_id uuid REFERENCES public.customer_let_applications(id) ON DELETE CASCADE,
  step_key       text,
  step_label     text,
  position       integer,
  completed_at   timestamptz,
  status         text,
  metadata_json  jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by     uuid,
  updated_by     uuid,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_let_application_documents (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   uuid,
  customer_id    uuid NOT NULL,
  application_id uuid REFERENCES public.customer_let_applications(id) ON DELETE CASCADE,
  doc_type       text,
  storage_path   text NOT NULL,           -- lets/applications/{applicationId}/documents/...
  file_name      text,
  content_type   text,
  status         text,
  metadata_json  jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by     uuid,
  updated_by     uuid,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_let_application_references (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   uuid,
  customer_id    uuid NOT NULL,
  application_id uuid REFERENCES public.customer_let_applications(id) ON DELETE CASCADE,
  reference_type text,            -- employer | previous_landlord | character
  full_name      text,
  email          text,
  phone          text,
  status         text,
  metadata_json  jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by     uuid,
  updated_by     uuid,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_let_application_guarantors (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   uuid,
  customer_id    uuid NOT NULL,
  application_id uuid REFERENCES public.customer_let_applications(id) ON DELETE CASCADE,
  full_name      text,
  email          text,
  phone          text,
  relationship   text,
  status         text,
  metadata_json  jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by     uuid,
  updated_by     uuid,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_let_application_affordability (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     uuid,
  customer_id      uuid NOT NULL,
  application_id   uuid REFERENCES public.customer_let_applications(id) ON DELETE CASCADE,
  annual_income_pence bigint,
  monthly_outgoings_pence bigint,
  employment_status text,
  status           text,
  metadata_json    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by       uuid,
  updated_by       uuid,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ── LET offers ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.customer_let_offers (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   uuid,
  customer_id    uuid NOT NULL,
  application_id uuid REFERENCES public.customer_let_applications(id) ON DELETE SET NULL,
  let_property_id uuid REFERENCES public.let_properties(id) ON DELETE SET NULL,
  property_id    uuid,
  offer_amount_pence bigint,
  currency       text,
  offer_status   text,
  status         text,
  metadata_json  jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by     uuid,
  updated_by     uuid,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_let_offer_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid,
  customer_id   uuid NOT NULL,
  offer_id      uuid REFERENCES public.customer_let_offers(id) ON DELETE CASCADE,
  event_type    text,
  actor_role    text,
  note          text,
  status        text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by    uuid,
  updated_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_let_offer_documents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid,
  customer_id   uuid NOT NULL,
  offer_id      uuid REFERENCES public.customer_let_offers(id) ON DELETE CASCADE,
  doc_type      text,
  storage_path  text NOT NULL,
  file_name     text,
  status        text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by    uuid,
  updated_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_let_offer_messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid,
  customer_id   uuid NOT NULL,
  offer_id      uuid REFERENCES public.customer_let_offers(id) ON DELETE CASCADE,
  sender_role   text,
  body          text NOT NULL,
  status        text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by    uuid,
  updated_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ── TENANCIES (customer-side) + link tables ─────────────────────────────────

CREATE TABLE IF NOT EXISTS public.customer_tenancies (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid,
  customer_id     uuid NOT NULL,        -- the lead tenant (owner of this customer row)
  let_property_id uuid REFERENCES public.let_properties(id) ON DELETE SET NULL,
  property_id     uuid,
  tenancy_id      uuid,                 -- link to operator-side tenancies (no FK)
  start_date      date,
  end_date        date,
  rent_pence      bigint,
  deposit_pence   bigint,
  currency        text,
  status          text,
  metadata_json   jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by      uuid,
  updated_by      uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Occupant link table — defines who may access a tenancy's child rows.
CREATE TABLE IF NOT EXISTS public.customer_tenancy_occupants (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id         uuid,
  customer_id          uuid NOT NULL,
  customer_tenancy_id  uuid NOT NULL REFERENCES public.customer_tenancies(id) ON DELETE CASCADE,
  occupant_user_id     uuid,            -- the auth user of this occupant (for access)
  full_name            text,
  email                text,
  role                 text,            -- lead | occupant | applicant
  status               text,
  metadata_json        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by           uuid,
  updated_by           uuid,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- Guarantor / referencing link table — also grants tenancy access.
CREATE TABLE IF NOT EXISTS public.customer_tenancy_guarantor_referencing (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id         uuid,
  customer_id          uuid NOT NULL,
  customer_tenancy_id  uuid NOT NULL REFERENCES public.customer_tenancies(id) ON DELETE CASCADE,
  guarantor_user_id    uuid,
  full_name            text,
  email                text,
  referencing_status   text,
  status               text,
  metadata_json        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by           uuid,
  updated_by           uuid,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_tenancy_setup_steps (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        uuid,
  customer_id         uuid NOT NULL,
  customer_tenancy_id uuid REFERENCES public.customer_tenancies(id) ON DELETE CASCADE,
  step_key            text,
  step_label          text,
  position            integer,
  completed_at        timestamptz,
  status              text,
  metadata_json       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by          uuid,
  updated_by          uuid,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_tenancy_documents (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        uuid,
  customer_id         uuid NOT NULL,
  customer_tenancy_id uuid REFERENCES public.customer_tenancies(id) ON DELETE CASCADE,
  doc_type            text,
  storage_path        text NOT NULL,    -- lets/tenancies/{tenancyId}/documents/...
  file_name           text,
  content_type        text,
  status              text,
  metadata_json       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by          uuid,
  updated_by          uuid,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_tenancy_rent_schedule (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        uuid,
  customer_id         uuid NOT NULL,
  customer_tenancy_id uuid REFERENCES public.customer_tenancies(id) ON DELETE CASCADE,
  due_date            date,
  amount_pence        bigint,
  currency            text,
  payment_status      text,
  status              text,
  metadata_json       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by          uuid,
  updated_by          uuid,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_tenancy_rent_payments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        uuid,
  customer_id         uuid NOT NULL,
  customer_tenancy_id uuid REFERENCES public.customer_tenancies(id) ON DELETE CASCADE,
  schedule_id         uuid REFERENCES public.customer_tenancy_rent_schedule(id) ON DELETE SET NULL,
  amount_pence        bigint,
  currency            text,
  paid_at             timestamptz,
  payment_status      text,
  provider            text,
  provider_ref        text,
  status              text,
  metadata_json       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by          uuid,
  updated_by          uuid,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_tenancy_deposits (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        uuid,
  customer_id         uuid NOT NULL,
  customer_tenancy_id uuid REFERENCES public.customer_tenancies(id) ON DELETE CASCADE,
  amount_pence        bigint,
  currency            text,
  scheme              text,
  scheme_ref          text,
  payment_status      text,
  status              text,
  metadata_json       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by          uuid,
  updated_by          uuid,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_tenancy_maintenance_requests (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        uuid,
  customer_id         uuid NOT NULL,
  customer_tenancy_id uuid REFERENCES public.customer_tenancies(id) ON DELETE CASCADE,
  category            text,
  priority            text,
  subject             text NOT NULL,
  detail              text,
  status              text,
  metadata_json       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by          uuid,
  updated_by          uuid,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_tenancy_maintenance_messages (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   uuid,
  customer_id    uuid NOT NULL,
  request_id     uuid REFERENCES public.customer_tenancy_maintenance_requests(id) ON DELETE CASCADE,
  sender_role    text,
  body           text NOT NULL,
  status         text,
  metadata_json  jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by     uuid,
  updated_by     uuid,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_tenancy_maintenance_files (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid,
  customer_id   uuid NOT NULL,
  request_id    uuid REFERENCES public.customer_tenancy_maintenance_requests(id) ON DELETE CASCADE,
  storage_path  text NOT NULL,           -- lets/tenancies/{tenancyId}/maintenance/...
  file_name     text,
  content_type  text,
  status        text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by    uuid,
  updated_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_tenancy_inspections (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        uuid,
  customer_id         uuid NOT NULL,
  customer_tenancy_id uuid REFERENCES public.customer_tenancies(id) ON DELETE CASCADE,
  inspection_type     text,
  scheduled_for       timestamptz,
  status              text,
  metadata_json       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by          uuid,
  updated_by          uuid,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_tenancy_move_in_checklist (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        uuid,
  customer_id         uuid NOT NULL,
  customer_tenancy_id uuid REFERENCES public.customer_tenancies(id) ON DELETE CASCADE,
  item_label          text,
  position            integer,
  is_done             boolean NOT NULL DEFAULT false,
  status              text,
  metadata_json       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by          uuid,
  updated_by          uuid,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_tenancy_meter_readings (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        uuid,
  customer_id         uuid NOT NULL,
  customer_tenancy_id uuid REFERENCES public.customer_tenancies(id) ON DELETE CASCADE,
  meter_type          text,            -- electricity | gas | water
  reading_value       numeric,
  read_on             date,
  status              text,
  metadata_json       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by          uuid,
  updated_by          uuid,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_tenancy_condition_photos (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        uuid,
  customer_id         uuid NOT NULL,
  customer_tenancy_id uuid REFERENCES public.customer_tenancies(id) ON DELETE CASCADE,
  room                text,
  storage_path        text NOT NULL,    -- lets/tenancies/{tenancyId}/move-in/photos/...
  file_name           text,
  status              text,
  metadata_json       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by          uuid,
  updated_by          uuid,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_tenancy_renewal_notices (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        uuid,
  customer_id         uuid NOT NULL,
  customer_tenancy_id uuid REFERENCES public.customer_tenancies(id) ON DELETE CASCADE,
  notice_type         text,            -- renewal_offer | break | end_of_term
  effective_date      date,
  new_rent_pence      bigint,
  currency            text,
  status              text,
  metadata_json       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by          uuid,
  updated_by          uuid,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ── Cross-surface activity feed ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.customer_activity_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid,
  customer_id   uuid NOT NULL,
  booking_id    uuid,
  tenancy_id    uuid,
  property_id   uuid,
  event_type    text,
  entity_type   text,
  entity_id     uuid,
  summary       text,
  status        text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by    uuid,
  updated_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEXES — btree on customer_id, booking_id, tenancy_id, property_id, status,
-- created_at, and *_status where the column exists. Generated defensively via
-- the information_schema so each index is only created when its column is real
-- (works on a fresh create AND on a partially-pre-existing table).
-- ============================================================================
DO $$
DECLARE
  t      text;
  c      text;
  cols   text[] := ARRAY[
    'customer_id','booking_id','tenancy_id','property_id','status','created_at',
    'payment_status','application_status','offer_status','viewing_status',
    'customer_workspace_id','workspace_id','customer_tenancy_id','let_property_id',
    'application_id','offer_id','dispute_id','request_id','ticket_id','viewing_id'
  ];
  tbls   text[] := ARRAY[
    'customer_account_settings','customer_saved_addresses','customer_payment_methods',
    'customer_notification_preferences','customer_favourites','customer_favourite_collections',
    'customer_message_attachments','customer_bookings','customer_booking_guests',
    'customer_booking_payments','customer_booking_receipts','customer_booking_reviews',
    'customer_booking_disputes','customer_booking_dispute_events','customer_booking_dispute_evidence',
    'customer_payments','customer_payment_receipts','customer_deposits','customer_refunds',
    'customer_statements','customer_autopay_mandates','customer_reviews','customer_review_responses',
    'customer_help_tickets','customer_help_ticket_messages','customer_help_ticket_attachments',
    'customer_help_articles','let_properties','let_property_photos','let_property_documents',
    'let_property_amenities','let_property_reviews','customer_let_viewings',
    'customer_let_viewing_messages','customer_let_viewing_documents','customer_let_applications',
    'customer_let_application_steps','customer_let_application_documents',
    'customer_let_application_references','customer_let_application_guarantors',
    'customer_let_application_affordability','customer_let_offers','customer_let_offer_events',
    'customer_let_offer_documents','customer_let_offer_messages','customer_tenancies',
    'customer_tenancy_occupants','customer_tenancy_guarantor_referencing',
    'customer_tenancy_setup_steps','customer_tenancy_documents','customer_tenancy_rent_schedule',
    'customer_tenancy_rent_payments','customer_tenancy_deposits','customer_tenancy_maintenance_requests',
    'customer_tenancy_maintenance_messages','customer_tenancy_maintenance_files',
    'customer_tenancy_inspections','customer_tenancy_move_in_checklist','customer_tenancy_meter_readings',
    'customer_tenancy_condition_photos','customer_tenancy_renewal_notices','customer_activity_events'
  ];
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    FOREACH c IN ARRAY cols LOOP
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = t AND column_name = c
      ) THEN
        EXECUTE format(
          'CREATE INDEX IF NOT EXISTS %I ON public.%I (%I);',
          'idx_' || t || '_' || c, t, c
        );
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- ============================================================================
-- updated_at TRIGGERS — reuse the shared public.update_updated_at() if present.
-- ============================================================================
DO $$
DECLARE
  t    text;
  tbls text[] := ARRAY[
    'customer_account_settings','customer_saved_addresses','customer_payment_methods',
    'customer_notification_preferences','customer_favourites','customer_favourite_collections',
    'customer_message_attachments','customer_bookings','customer_booking_guests',
    'customer_booking_payments','customer_booking_receipts','customer_booking_reviews',
    'customer_booking_disputes','customer_booking_dispute_events','customer_booking_dispute_evidence',
    'customer_payments','customer_payment_receipts','customer_deposits','customer_refunds',
    'customer_statements','customer_autopay_mandates','customer_reviews','customer_review_responses',
    'customer_help_tickets','customer_help_ticket_messages','customer_help_ticket_attachments',
    'customer_help_articles','let_properties','let_property_photos','let_property_documents',
    'let_property_amenities','let_property_reviews','customer_let_viewings',
    'customer_let_viewing_messages','customer_let_viewing_documents','customer_let_applications',
    'customer_let_application_steps','customer_let_application_documents',
    'customer_let_application_references','customer_let_application_guarantors',
    'customer_let_application_affordability','customer_let_offers','customer_let_offer_events',
    'customer_let_offer_documents','customer_let_offer_messages','customer_tenancies',
    'customer_tenancy_occupants','customer_tenancy_guarantor_referencing',
    'customer_tenancy_setup_steps','customer_tenancy_documents','customer_tenancy_rent_schedule',
    'customer_tenancy_rent_payments','customer_tenancy_deposits','customer_tenancy_maintenance_requests',
    'customer_tenancy_maintenance_messages','customer_tenancy_maintenance_files',
    'customer_tenancy_inspections','customer_tenancy_move_in_checklist','customer_tenancy_meter_readings',
    'customer_tenancy_condition_photos','customer_tenancy_renewal_notices','customer_activity_events'
  ];
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at') THEN
    FOREACH t IN ARRAY tbls LOOP
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I;', 'set_updated_at_' || t, t);
      EXECUTE format(
        'CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION update_updated_at();',
        'set_updated_at_' || t, t
      );
    END LOOP;
  END IF;
END $$;

-- ============================================================================
-- ROW-LEVEL SECURITY (§7)
--
-- Style mirrors the existing customer migrations: ENABLE RLS, then a guarded
-- DROP POLICY IF EXISTS / CREATE POLICY ... FOR ALL using the helper.
--
-- A. Owner-scoped tables (the common case): a row is the caller's iff
--      is_customer_workspace_member(workspace_id)            -- ws anchor
--      OR (workspace_id IS NULL AND customer_id = auth.uid())-- direct anchor
--    Applied via FOR ALL (USING + WITH CHECK identical).
-- ============================================================================

-- A1. Bulk owner-scoped FOR ALL policies.
DO $$
DECLARE
  t    text;
  tbls text[] := ARRAY[
    'customer_account_settings','customer_saved_addresses','customer_payment_methods',
    'customer_notification_preferences','customer_favourites','customer_favourite_collections',
    'customer_message_attachments','customer_bookings','customer_booking_guests',
    'customer_booking_payments','customer_booking_receipts','customer_booking_reviews',
    'customer_booking_disputes','customer_booking_dispute_events','customer_booking_dispute_evidence',
    'customer_payments','customer_payment_receipts','customer_deposits','customer_refunds',
    'customer_statements','customer_autopay_mandates','customer_reviews','customer_review_responses',
    'customer_help_tickets','customer_help_ticket_messages','customer_help_ticket_attachments',
    'customer_let_viewings','customer_let_viewing_messages','customer_let_viewing_documents',
    'customer_let_applications','customer_let_application_steps','customer_let_application_documents',
    'customer_let_application_references','customer_let_application_guarantors',
    'customer_let_application_affordability','customer_let_offers','customer_let_offer_events',
    'customer_let_offer_documents','customer_let_offer_messages','customer_activity_events'
  ];
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', t || '_owner_all', t);
    EXECUTE format($p$
      CREATE POLICY %I ON public.%I
        FOR ALL TO authenticated
        USING (
          (workspace_id IS NOT NULL AND public.is_customer_workspace_member(workspace_id))
          OR (workspace_id IS NULL AND customer_id = auth.uid())
        )
        WITH CHECK (
          (workspace_id IS NOT NULL AND public.is_customer_workspace_member(workspace_id))
          OR (workspace_id IS NULL AND customer_id = auth.uid())
        );
    $p$, t || '_owner_all', t);
  END LOOP;
END $$;

-- ── B. TENANCY tables: accessible to the owning customer (customer_id) OR an
--    occupant / guarantor linked via the link tables. SECURITY of the link is
--    by occupant_user_id / guarantor_user_id = auth.uid(), plus the lead
--    customer_id = auth.uid() / customer-workspace anchor. ──────────────────

-- Helper predicate (inline, no new function): a user may access customer_tenancy
-- <tid> if they are its lead customer, a member of its customer workspace, an
-- occupant, or a guarantor.
-- customer_tenancies itself:
ALTER TABLE public.customer_tenancies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS customer_tenancies_access ON public.customer_tenancies;
CREATE POLICY customer_tenancies_access ON public.customer_tenancies
  FOR ALL TO authenticated
  USING (
    (workspace_id IS NOT NULL AND public.is_customer_workspace_member(workspace_id))
    OR customer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.customer_tenancy_occupants o
      WHERE o.customer_tenancy_id = customer_tenancies.id AND o.occupant_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.customer_tenancy_guarantor_referencing g
      WHERE g.customer_tenancy_id = customer_tenancies.id AND g.guarantor_user_id = auth.uid()
    )
  )
  WITH CHECK (
    (workspace_id IS NOT NULL AND public.is_customer_workspace_member(workspace_id))
    OR customer_id = auth.uid()
  );

-- The two link tables: the lead customer (or ws member) manages them; an
-- occupant/guarantor may read the row that names them.
ALTER TABLE public.customer_tenancy_occupants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS customer_tenancy_occupants_access ON public.customer_tenancy_occupants;
CREATE POLICY customer_tenancy_occupants_access ON public.customer_tenancy_occupants
  FOR ALL TO authenticated
  USING (
    (workspace_id IS NOT NULL AND public.is_customer_workspace_member(workspace_id))
    OR customer_id = auth.uid()
    OR occupant_user_id = auth.uid()
  )
  WITH CHECK (
    (workspace_id IS NOT NULL AND public.is_customer_workspace_member(workspace_id))
    OR customer_id = auth.uid()
  );

ALTER TABLE public.customer_tenancy_guarantor_referencing ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS customer_tenancy_guarantor_referencing_access ON public.customer_tenancy_guarantor_referencing;
CREATE POLICY customer_tenancy_guarantor_referencing_access ON public.customer_tenancy_guarantor_referencing
  FOR ALL TO authenticated
  USING (
    (workspace_id IS NOT NULL AND public.is_customer_workspace_member(workspace_id))
    OR customer_id = auth.uid()
    OR guarantor_user_id = auth.uid()
  )
  WITH CHECK (
    (workspace_id IS NOT NULL AND public.is_customer_workspace_member(workspace_id))
    OR customer_id = auth.uid()
  );

-- Tenancy CHILD tables: access where the user can reach the parent tenancy
-- (lead customer / ws member / occupant / guarantor). Bulk-applied.
DO $$
DECLARE
  t    text;
  tbls text[] := ARRAY[
    'customer_tenancy_setup_steps','customer_tenancy_documents','customer_tenancy_rent_schedule',
    'customer_tenancy_rent_payments','customer_tenancy_deposits','customer_tenancy_maintenance_requests',
    'customer_tenancy_inspections','customer_tenancy_move_in_checklist','customer_tenancy_meter_readings',
    'customer_tenancy_condition_photos','customer_tenancy_renewal_notices'
  ];
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', t || '_access', t);
    EXECUTE format($p$
      CREATE POLICY %I ON public.%I
        FOR ALL TO authenticated
        USING (
          (workspace_id IS NOT NULL AND public.is_customer_workspace_member(workspace_id))
          OR customer_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.customer_tenancy_occupants o
            WHERE o.customer_tenancy_id = %I.customer_tenancy_id AND o.occupant_user_id = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM public.customer_tenancy_guarantor_referencing g
            WHERE g.customer_tenancy_id = %I.customer_tenancy_id AND g.guarantor_user_id = auth.uid()
          )
        )
        WITH CHECK (
          (workspace_id IS NOT NULL AND public.is_customer_workspace_member(workspace_id))
          OR customer_id = auth.uid()
        );
    $p$, t || '_access', t, t, t);
  END LOOP;
END $$;

-- Maintenance message/file children: scope by their parent request's customer.
DO $$
DECLARE
  t    text;
  tbls text[] := ARRAY['customer_tenancy_maintenance_messages','customer_tenancy_maintenance_files'];
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', t || '_access', t);
    EXECUTE format($p$
      CREATE POLICY %I ON public.%I
        FOR ALL TO authenticated
        USING (
          (workspace_id IS NOT NULL AND public.is_customer_workspace_member(workspace_id))
          OR customer_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.customer_tenancy_maintenance_requests r
            JOIN public.customer_tenancy_occupants o
              ON o.customer_tenancy_id = r.customer_tenancy_id
            WHERE r.id = %I.request_id AND o.occupant_user_id = auth.uid()
          )
        )
        WITH CHECK (
          (workspace_id IS NOT NULL AND public.is_customer_workspace_member(workspace_id))
          OR customer_id = auth.uid()
        );
    $p$, t || '_access', t, t);
  END LOOP;
END $$;

-- ── C. PUBLIC-SAFE let data: readable by any authenticated user; writes only by
--    the owning customer / workspace. ──────────────────────────────────────

-- let_properties
ALTER TABLE public.let_properties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS let_properties_public_read ON public.let_properties;
CREATE POLICY let_properties_public_read ON public.let_properties
  FOR SELECT TO authenticated
  USING (is_published = true OR owner_customer_id = auth.uid()
         OR (workspace_id IS NOT NULL AND public.is_customer_workspace_member(workspace_id)));
DROP POLICY IF EXISTS let_properties_owner_write ON public.let_properties;
CREATE POLICY let_properties_owner_write ON public.let_properties
  FOR ALL TO authenticated
  USING (owner_customer_id = auth.uid()
         OR (workspace_id IS NOT NULL AND public.is_customer_workspace_member(workspace_id)))
  WITH CHECK (owner_customer_id = auth.uid()
         OR (workspace_id IS NOT NULL AND public.is_customer_workspace_member(workspace_id)));

-- let_property_photos — public read of published parent; owner write.
ALTER TABLE public.let_property_photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS let_property_photos_public_read ON public.let_property_photos;
CREATE POLICY let_property_photos_public_read ON public.let_property_photos
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.let_properties p
    WHERE p.id = let_property_photos.let_property_id
      AND (p.is_published = true OR p.owner_customer_id = auth.uid()
           OR (p.workspace_id IS NOT NULL AND public.is_customer_workspace_member(p.workspace_id)))
  ));
DROP POLICY IF EXISTS let_property_photos_owner_write ON public.let_property_photos;
CREATE POLICY let_property_photos_owner_write ON public.let_property_photos
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.let_properties p
    WHERE p.id = let_property_photos.let_property_id
      AND (p.owner_customer_id = auth.uid()
           OR (p.workspace_id IS NOT NULL AND public.is_customer_workspace_member(p.workspace_id)))))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.let_properties p
    WHERE p.id = let_property_photos.let_property_id
      AND (p.owner_customer_id = auth.uid()
           OR (p.workspace_id IS NOT NULL AND public.is_customer_workspace_member(p.workspace_id)))));

-- let_property_amenities — public read of published parent; owner write.
ALTER TABLE public.let_property_amenities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS let_property_amenities_public_read ON public.let_property_amenities;
CREATE POLICY let_property_amenities_public_read ON public.let_property_amenities
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.let_properties p
    WHERE p.id = let_property_amenities.let_property_id
      AND (p.is_published = true OR p.owner_customer_id = auth.uid()
           OR (p.workspace_id IS NOT NULL AND public.is_customer_workspace_member(p.workspace_id)))
  ));
DROP POLICY IF EXISTS let_property_amenities_owner_write ON public.let_property_amenities;
CREATE POLICY let_property_amenities_owner_write ON public.let_property_amenities
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.let_properties p
    WHERE p.id = let_property_amenities.let_property_id
      AND (p.owner_customer_id = auth.uid()
           OR (p.workspace_id IS NOT NULL AND public.is_customer_workspace_member(p.workspace_id)))))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.let_properties p
    WHERE p.id = let_property_amenities.let_property_id
      AND (p.owner_customer_id = auth.uid()
           OR (p.workspace_id IS NOT NULL AND public.is_customer_workspace_member(p.workspace_id)))));

-- let_property_documents — NOT blanket-public (may hold sensitive certs). Public
-- read only when explicitly is_public; otherwise owner-only.
ALTER TABLE public.let_property_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS let_property_documents_read ON public.let_property_documents;
CREATE POLICY let_property_documents_read ON public.let_property_documents
  FOR SELECT TO authenticated
  USING (
    (is_public = true AND EXISTS (
      SELECT 1 FROM public.let_properties p
      WHERE p.id = let_property_documents.let_property_id AND p.is_published = true))
    OR owner_customer_id = auth.uid()
    OR (workspace_id IS NOT NULL AND public.is_customer_workspace_member(workspace_id))
  );
DROP POLICY IF EXISTS let_property_documents_owner_write ON public.let_property_documents;
CREATE POLICY let_property_documents_owner_write ON public.let_property_documents
  FOR ALL TO authenticated
  USING (owner_customer_id = auth.uid()
         OR (workspace_id IS NOT NULL AND public.is_customer_workspace_member(workspace_id)))
  WITH CHECK (owner_customer_id = auth.uid()
         OR (workspace_id IS NOT NULL AND public.is_customer_workspace_member(workspace_id)));

-- let_property_reviews — public read of published parent; review author writes.
ALTER TABLE public.let_property_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS let_property_reviews_public_read ON public.let_property_reviews;
CREATE POLICY let_property_reviews_public_read ON public.let_property_reviews
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.let_properties p
    WHERE p.id = let_property_reviews.let_property_id AND p.is_published = true)
    OR customer_id = auth.uid());
DROP POLICY IF EXISTS let_property_reviews_author_write ON public.let_property_reviews;
CREATE POLICY let_property_reviews_author_write ON public.let_property_reviews
  FOR ALL TO authenticated
  USING (customer_id = auth.uid()
         OR (workspace_id IS NOT NULL AND public.is_customer_workspace_member(workspace_id)))
  WITH CHECK (customer_id = auth.uid()
         OR (workspace_id IS NOT NULL AND public.is_customer_workspace_member(workspace_id)));

-- ── D. customer_help_articles — published articles readable by all authenticated
--    users; no per-customer ownership. (Authoring is service-role / operator.) ─
ALTER TABLE public.customer_help_articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS customer_help_articles_public_read ON public.customer_help_articles;
CREATE POLICY customer_help_articles_public_read ON public.customer_help_articles
  FOR SELECT TO authenticated
  USING (is_published = true);

-- ============================================================================
-- STORAGE (§8) — private buckets + owner-scoped, upload-only, signed-URL reads.
--
-- Buckets (all private → reads are via createSignedUrl). Paths:
--   customer-files     : customers/{customerId}/avatars/...
--   booking-disputes   : bookings/{bookingId}/disputes/...
--   let-documents      : lets/applications/{applicationId}/documents/...
--                        lets/tenancies/{tenancyId}/documents/...
--                        lets/tenancies/{tenancyId}/maintenance/...
--                        lets/tenancies/{tenancyId}/move-in/photos/...
--   customer-messages  : messages/{threadId}/attachments/...
--   customer-help      : help/{ticketId}/attachments/...
--
-- Owner scope: the FIRST path segment after the prefix is the owning id. For
-- customer-files that id is the customerId = auth.uid(), so we can enforce
-- owner-scoping directly. For the relational buckets (bookings/lets/messages/
-- help) ownership lives in the app tables; per Supabase convention these are
-- WRITE-scoped to authenticated and READ via short-lived signed URLs minted
-- server-side after an RLS-checked lookup (the service layer authorises). We do
-- NOT grant blanket authenticated SELECT on those buckets.
-- ============================================================================

-- Buckets (idempotent insert; all private).
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('customer-files',    'customer-files',    false),
  ('booking-disputes',  'booking-disputes',  false),
  ('let-documents',     'let-documents',     false),
  ('customer-messages', 'customer-messages', false),
  ('customer-help',     'customer-help',     false)
ON CONFLICT (id) DO NOTHING;

-- customer-files: customers/{customerId}/avatars/... — owner = path segment 2.
-- Owner-scoped read+write+update+delete (avatar replace).
DROP POLICY IF EXISTS customer_files_owner_rw ON storage.objects;
CREATE POLICY customer_files_owner_rw ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'customer-files'
    AND (storage.foldername(name))[1] = 'customers'
    AND (storage.foldername(name))[2] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'customer-files'
    AND (storage.foldername(name))[1] = 'customers'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Relational buckets: authenticated users may UPLOAD (INSERT) only. Reads are
-- via server-minted signed URLs after an app-side RLS-checked authorisation;
-- no blanket SELECT policy is granted (RLS-enabled + no SELECT policy = deny).
DO $$
DECLARE
  b text;
  buckets text[] := ARRAY['booking-disputes','let-documents','customer-messages','customer-help'];
BEGIN
  FOREACH b IN ARRAY buckets LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects;', 'st_' || replace(b,'-','_') || '_upload');
    EXECUTE format($p$
      CREATE POLICY %I ON storage.objects
        FOR INSERT TO authenticated
        WITH CHECK (bucket_id = %L AND owner = auth.uid());
    $p$, 'st_' || replace(b,'-','_') || '_upload', b);

    -- Allow the uploader to read/replace/delete their OWN objects directly
    -- (owner = auth.uid()); cross-party reads go through signed URLs.
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects;', 'st_' || replace(b,'-','_') || '_owner');
    EXECUTE format($p$
      CREATE POLICY %I ON storage.objects
        FOR ALL TO authenticated
        USING (bucket_id = %L AND owner = auth.uid())
        WITH CHECK (bucket_id = %L AND owner = auth.uid());
    $p$, 'st_' || replace(b,'-','_') || '_owner', b, b);
  END LOOP;
END $$;

-- ============================================================================
-- GRANTS — base table privileges (RLS still gates rows). Mirrors the repo
-- pattern of granting to authenticated and letting RLS filter.
-- ============================================================================
DO $$
DECLARE
  t    text;
  tbls text[] := ARRAY[
    'customer_account_settings','customer_saved_addresses','customer_payment_methods',
    'customer_notification_preferences','customer_favourites','customer_favourite_collections',
    'customer_message_attachments','customer_bookings','customer_booking_guests',
    'customer_booking_payments','customer_booking_receipts','customer_booking_reviews',
    'customer_booking_disputes','customer_booking_dispute_events','customer_booking_dispute_evidence',
    'customer_payments','customer_payment_receipts','customer_deposits','customer_refunds',
    'customer_statements','customer_autopay_mandates','customer_reviews','customer_review_responses',
    'customer_help_tickets','customer_help_ticket_messages','customer_help_ticket_attachments',
    'customer_help_articles','let_properties','let_property_photos','let_property_documents',
    'let_property_amenities','let_property_reviews','customer_let_viewings',
    'customer_let_viewing_messages','customer_let_viewing_documents','customer_let_applications',
    'customer_let_application_steps','customer_let_application_documents',
    'customer_let_application_references','customer_let_application_guarantors',
    'customer_let_application_affordability','customer_let_offers','customer_let_offer_events',
    'customer_let_offer_documents','customer_let_offer_messages','customer_tenancies',
    'customer_tenancy_occupants','customer_tenancy_guarantor_referencing',
    'customer_tenancy_setup_steps','customer_tenancy_documents','customer_tenancy_rent_schedule',
    'customer_tenancy_rent_payments','customer_tenancy_deposits','customer_tenancy_maintenance_requests',
    'customer_tenancy_maintenance_messages','customer_tenancy_maintenance_files',
    'customer_tenancy_inspections','customer_tenancy_move_in_checklist','customer_tenancy_meter_readings',
    'customer_tenancy_condition_photos','customer_tenancy_renewal_notices','customer_activity_events'
  ];
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated;', t);
  END LOOP;
END $$;

-- ============================================================================
-- END customer workspace tables
-- ============================================================================
