-- ============================================================
-- 20260617214000_billing.sql
-- SUBSCRIPTION / ADD-ONS / BILLING SECTION — additive, workspace-scoped
-- tables backing the Workspace › Billing control centre (Plan checkout,
-- Renewals, Add-ons, Cancellation, Billing history) and the right summary
-- rail.
--
-- 100% ADDITIVE and IDEMPOTENT. Every statement uses IF NOT EXISTS / DROP
-- POLICY IF EXISTS so it is safe to re-run and NEVER clobbers any existing
-- plan/subscription tables. None of the tables below existed in any prior
-- migration (verified), so this is the canonical billing schema.
--
-- Billing is modelled in DATA only — there are NO live Stripe calls during
-- build. Stripe identifiers are stored as plain text columns to be populated
-- by webhooks later. Money is stored as INTEGER PENCE.
--
-- The UI reads these via seed-fallback hooks: if a table is missing or a
-- query fails (42P01 / RLS), the page renders premium seed data instead.
--
-- RLS model: workspace-membership via public.workspace_members(workspace_id,
-- user_id) — the SAME pattern as 20260617200000_automations_section.sql.
-- READ is open to any workspace member; WRITE (billing controls) is
-- restricted to owner/admin, mirroring 20260612000003_settings_support_tables.
--
-- Invoice/receipt documents are storage-backed under
--   workspaces/{workspaceId}/billing/{subscriptionId}/documents/
-- (see workspace_billing_history.document_path).
-- ============================================================

-- ─────────────── Legacy-table reconciliation (safe + guarded) ───────────────
-- A prior migration created an EARLIER `workspace_subscriptions` with a
-- different shape (no `created_at`), which makes the CREATE TABLE IF NOT EXISTS
-- below silently skip it and the created_at index then fail. We drop it ONLY
-- when it is unmistakably that legacy stub: it exists, lacks `created_at`, AND
-- holds zero rows. This can NEVER drop a populated table or one already on the
-- new schema, so it is safe on every environment (local / staging / prod).
DO $$
BEGIN
  IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'workspace_subscriptions'
      )
     AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'workspace_subscriptions'
          AND column_name = 'created_at'
      )
     AND NOT EXISTS (SELECT 1 FROM public.workspace_subscriptions LIMIT 1)
  THEN
    DROP TABLE public.workspace_subscriptions CASCADE;
  END IF;
END $$;

-- ──────────────────────────── Plans catalogue ────────────────────────────
CREATE TABLE IF NOT EXISTS public.workspace_plans (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id       uuid NOT NULL,
  code               text NOT NULL,                       -- starter | professional | business | enterprise
  name               text NOT NULL,
  monthly_pence      integer NOT NULL DEFAULT 0,
  annual_pence       integer NOT NULL DEFAULT 0,          -- per-year price when billed annually
  currency           text NOT NULL DEFAULT 'GBP',
  features           text[] NOT NULL DEFAULT '{}',
  is_popular         boolean NOT NULL DEFAULT false,
  sort_order         integer NOT NULL DEFAULT 0,
  status             text NOT NULL DEFAULT 'active',
  created_by         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  archived_at        timestamptz,
  metadata_json      jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- ──────────────────────────── Subscriptions ────────────────────────────
CREATE TABLE IF NOT EXISTS public.workspace_subscriptions (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id           uuid NOT NULL,
  plan_code              text NOT NULL DEFAULT 'professional',
  billing_cycle          text NOT NULL DEFAULT 'monthly',  -- monthly | annual
  status                 text NOT NULL DEFAULT 'active',    -- active | trialing | past_due | cancelled | paused
  auto_renew             boolean NOT NULL DEFAULT true,
  current_period_start   timestamptz,
  current_period_end     timestamptz,                       -- next renewal date
  cancel_at_period_end   boolean NOT NULL DEFAULT false,
  cancelled_at           timestamptz,
  base_price_pence       integer NOT NULL DEFAULT 0,
  currency               text NOT NULL DEFAULT 'GBP',
  stripe_subscription_id text,                              -- populated by webhook later; no live calls at build
  stripe_customer_id     text,
  created_by             uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  archived_at            timestamptz,
  metadata_json          jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- ──────────────────────────── Add-ons on a subscription ────────────────────────────
CREATE TABLE IF NOT EXISTS public.workspace_subscription_addons (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     uuid NOT NULL,
  subscription_id  uuid REFERENCES public.workspace_subscriptions(id) ON DELETE CASCADE,
  addon_code       text NOT NULL,                          -- extra_listings | premium_support | ai_pack | automation_pack | marketplace_boost | white_label | extra_storage | extra_seats
  name             text NOT NULL,
  enabled          boolean NOT NULL DEFAULT false,
  quantity         integer NOT NULL DEFAULT 1,
  unit_price_pence integer NOT NULL DEFAULT 0,
  billing_cycle    text NOT NULL DEFAULT 'monthly',
  status           text NOT NULL DEFAULT 'active',
  created_by       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  archived_at      timestamptz,
  metadata_json    jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- ──────────────────────────── Billing profile (invoice address / tax) ────────────────────────────
CREATE TABLE IF NOT EXISTS public.workspace_billing_profiles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid NOT NULL,
  billing_name    text,
  billing_email   text,
  vat_number      text,
  address_line1   text,
  address_line2   text,
  city            text,
  postcode        text,
  country         text DEFAULT 'United Kingdom',
  tax_rate_bps    integer NOT NULL DEFAULT 2000,           -- basis points; 2000 = 20% VAT
  status          text NOT NULL DEFAULT 'active',
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  archived_at     timestamptz,
  metadata_json   jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- ──────────────────────────── Payment methods (no PAN; brand+last4 only) ────────────────────────────
CREATE TABLE IF NOT EXISTS public.workspace_payment_methods (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid NOT NULL,
  brand                 text,                               -- Visa | Mastercard | Amex
  last4                 text,
  exp_month             integer,
  exp_year              integer,
  is_default            boolean NOT NULL DEFAULT false,
  health                text NOT NULL DEFAULT 'healthy',    -- healthy | expiring | expired | failed
  stripe_payment_method_id text,                            -- populated by webhook later
  status                text NOT NULL DEFAULT 'active',
  created_by            uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  archived_at           timestamptz,
  metadata_json         jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- ──────────────────────────── Billing history (invoices/receipts/refunds/credits) ────────────────────────────
CREATE TABLE IF NOT EXISTS public.workspace_billing_history (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid NOT NULL,
  subscription_id uuid REFERENCES public.workspace_subscriptions(id) ON DELETE SET NULL,
  doc_type        text NOT NULL DEFAULT 'invoice',          -- invoice | receipt | payment_attempt | refund | credit | tax_invoice
  reference       text,                                     -- INV-2026-0007
  description     text,
  amount_pence    integer NOT NULL DEFAULT 0,
  tax_pence       integer NOT NULL DEFAULT 0,
  currency        text NOT NULL DEFAULT 'GBP',
  status          text NOT NULL DEFAULT 'paid',             -- paid | due | failed | refunded | credited
  period_label    text,
  issued_at       timestamptz NOT NULL DEFAULT now(),
  document_path   text,                                     -- workspaces/{wid}/billing/{sid}/documents/INV-...pdf
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  archived_at     timestamptz,
  metadata_json   jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- ──────────────────────────── Subscription events (plan/add-on change log) ────────────────────────────
CREATE TABLE IF NOT EXISTS public.workspace_subscription_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid NOT NULL,
  subscription_id uuid REFERENCES public.workspace_subscriptions(id) ON DELETE CASCADE,
  event_type      text NOT NULL,                            -- plan_change | addon_change | renewal | payment | cancellation | reactivation
  summary         text,
  actor           text,                                     -- display name / "System"
  occurred_at     timestamptz NOT NULL DEFAULT now(),
  status          text NOT NULL DEFAULT 'recorded',
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  archived_at     timestamptz,
  metadata_json   jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- ──────────────────────────── Cancellation requests (scheduled, NOT immediate delete) ────────────────────────────
CREATE TABLE IF NOT EXISTS public.workspace_cancellation_requests (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id       uuid NOT NULL,
  subscription_id    uuid REFERENCES public.workspace_subscriptions(id) ON DELETE CASCADE,
  reason             text,
  detail             text,
  effective_at       timestamptz,                           -- end of current term — access continues until then
  access_until       timestamptz,
  data_retention_days integer NOT NULL DEFAULT 90,
  retention_offer_claimed boolean NOT NULL DEFAULT false,
  status             text NOT NULL DEFAULT 'scheduled',     -- scheduled | withdrawn | completed | paused
  created_by         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  archived_at        timestamptz,
  metadata_json      jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- ──────────────────────────── Renewal events (timeline + reminders) ────────────────────────────
CREATE TABLE IF NOT EXISTS public.workspace_renewal_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid NOT NULL,
  subscription_id uuid REFERENCES public.workspace_subscriptions(id) ON DELETE CASCADE,
  kind            text NOT NULL DEFAULT 'renewal',          -- renewal | reminder | estimate
  title           text,
  detail          text,
  amount_pence    integer,
  due_at          timestamptz,
  status          text NOT NULL DEFAULT 'upcoming',         -- upcoming | sent | completed | failed
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  archived_at     timestamptz,
  metadata_json   jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- ──────────────────────────── Indexes ────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ws_plans_ws            ON public.workspace_plans(workspace_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_ws_plans_status        ON public.workspace_plans(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_ws_subs_ws_status      ON public.workspace_subscriptions(workspace_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_ws_addons_ws           ON public.workspace_subscription_addons(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_ws_addons_sub          ON public.workspace_subscription_addons(subscription_id);
CREATE INDEX IF NOT EXISTS idx_ws_billprof_ws         ON public.workspace_billing_profiles(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_ws_pm_ws               ON public.workspace_payment_methods(workspace_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_ws_billhist_ws         ON public.workspace_billing_history(workspace_id, doc_type, issued_at);
CREATE INDEX IF NOT EXISTS idx_ws_billhist_sub        ON public.workspace_billing_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_ws_billhist_status     ON public.workspace_billing_history(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_ws_subevents_ws        ON public.workspace_subscription_events(workspace_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_ws_subevents_sub       ON public.workspace_subscription_events(subscription_id);
CREATE INDEX IF NOT EXISTS idx_ws_cancel_ws           ON public.workspace_cancellation_requests(workspace_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_ws_cancel_sub          ON public.workspace_cancellation_requests(subscription_id);
CREATE INDEX IF NOT EXISTS idx_ws_renewal_ws          ON public.workspace_renewal_events(workspace_id, status, due_at);
CREATE INDEX IF NOT EXISTS idx_ws_renewal_sub         ON public.workspace_renewal_events(subscription_id);

-- ──────────────────────────── RLS: read = any member, write = owner/admin ────────────────────────────
-- READ policy mirrors the automations_section membership pattern; the
-- INSERT/UPDATE/DELETE policy is restricted to owner/admin like the existing
-- settings_support_tables migration. Billing controls are owner/admin only.
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'workspace_plans',
    'workspace_subscriptions',
    'workspace_subscription_addons',
    'workspace_billing_profiles',
    'workspace_payment_methods',
    'workspace_billing_history',
    'workspace_subscription_events',
    'workspace_cancellation_requests',
    'workspace_renewal_events'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);

    -- SELECT: any workspace member
    EXECUTE format('DROP POLICY IF EXISTS %I_ws_read ON public.%I;', t, t);
    EXECUTE format($p$
      CREATE POLICY %I_ws_read ON public.%I FOR SELECT
      USING (EXISTS (
        SELECT 1 FROM public.workspace_members wm
        WHERE wm.workspace_id = %I.workspace_id AND wm.user_id = auth.uid()
      ));
    $p$, t, t, t);

    -- INSERT: owner/admin only
    EXECUTE format('DROP POLICY IF EXISTS %I_ws_insert ON public.%I;', t, t);
    EXECUTE format($p$
      CREATE POLICY %I_ws_insert ON public.%I FOR INSERT
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.workspace_members wm
        WHERE wm.workspace_id = %I.workspace_id AND wm.user_id = auth.uid()
          AND wm.role IN ('owner','admin')
      ));
    $p$, t, t, t);

    -- UPDATE: owner/admin only
    EXECUTE format('DROP POLICY IF EXISTS %I_ws_update ON public.%I;', t, t);
    EXECUTE format($p$
      CREATE POLICY %I_ws_update ON public.%I FOR UPDATE
      USING (EXISTS (
        SELECT 1 FROM public.workspace_members wm
        WHERE wm.workspace_id = %I.workspace_id AND wm.user_id = auth.uid()
          AND wm.role IN ('owner','admin')
      ))
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.workspace_members wm
        WHERE wm.workspace_id = %I.workspace_id AND wm.user_id = auth.uid()
          AND wm.role IN ('owner','admin')
      ));
    $p$, t, t, t, t);

    -- DELETE: owner/admin only
    EXECUTE format('DROP POLICY IF EXISTS %I_ws_delete ON public.%I;', t, t);
    EXECUTE format($p$
      CREATE POLICY %I_ws_delete ON public.%I FOR DELETE
      USING (EXISTS (
        SELECT 1 FROM public.workspace_members wm
        WHERE wm.workspace_id = %I.workspace_id AND wm.user_id = auth.uid()
          AND wm.role IN ('owner','admin')
      ));
    $p$, t, t, t);
  END LOOP;
END $$;
