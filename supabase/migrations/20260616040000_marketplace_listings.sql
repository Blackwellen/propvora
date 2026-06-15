-- ============================================================
-- 20260616040000_marketplace_listings.sql
--
-- Propvora v2 — P2 Marketplace OS substrate: DATA MODEL + COMMERCE KERNEL.
--
-- Builds the commerce-grade marketplace data model on top of the P1 fee engine
-- (marketplace_fee_rules / src/lib/marketplace/fees.ts). Everything is integer
-- pence. Every table is workspace-scoped with RLS keyed on workspace_members
-- (the codebase membership pattern). Published listings get an extra public
-- read policy so the marketplace is browsable cross-workspace, but management
-- writes never leak across workspaces.
--
-- IMPORTANT — RECONCILIATION:
--   `marketplace_listings` ALREADY EXISTS LIVE from a prior V1 supplier-directory
--   build, with a DIFFERENT shape (company_name/trades/listing_type/category_id/
--   price numeric, status CHECK in ('active','inactive','suspended')). We do NOT
--   drop it (it may hold data). Instead we ADD the P2 commerce columns via
--   ADD COLUMN IF NOT EXISTS and WIDEN the status CHECK to accept BOTH the legacy
--   states and the new lifecycle states (draft/published/paused/archived) so old
--   rows stay valid and the new TS lifecycle works.
--
-- Idempotent: IF NOT EXISTS + guarded DROP/CREATE throughout; safe to re-run.
-- Apply: node scripts/_apply_migration.mjs supabase/migrations/20260616040000_marketplace_listings.sql
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 0. Helper: updated_at touch (namespaced to marketplace)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.marketplace_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ────────────────────────────────────────────────────────────
-- 1. marketplace_listings — reconcile the pre-existing table.
--    Create-if-missing (fresh DBs) then ADD the P2 commerce columns
--    on top of whatever shape already exists.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title         text,
  description   text,
  status        text DEFAULT 'draft',
  currency      text NOT NULL DEFAULT 'GBP',
  created_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- P2 commerce columns (additive — safe whether the table is the legacy one or
-- freshly created above).
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS title             text;
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS description       text;
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS transaction_type  text;
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS category          text;
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS country_code      text;
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS currency          text DEFAULT 'GBP';
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS base_price_pence  bigint;
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS pricing_model     text;
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS location          text;
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS latitude          numeric;
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS longitude         numeric;
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS property_id       uuid;
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS published_at      timestamptz;
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS created_by        uuid;
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS created_at        timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS updated_at        timestamptz NOT NULL DEFAULT now();

-- transaction_type CHECK (NULL allowed — legacy rows have none; mirrors fees.ts
-- MarketplaceTransactionType).
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'marketplace_listings_txn_type_check'
  ) THEN
    ALTER TABLE public.marketplace_listings
      ADD CONSTRAINT marketplace_listings_txn_type_check
      CHECK (transaction_type IS NULL OR transaction_type IN
        ('stay_booking','supplier_job','emergency_job','service_package','subscription_addon'));
  END IF;
END $$;

-- Widen the status CHECK to accept BOTH legacy and new lifecycle states so old
-- rows stay valid and the P2 TS lifecycle (draft/published/paused/archived) works.
ALTER TABLE public.marketplace_listings DROP CONSTRAINT IF EXISTS marketplace_listings_status_check;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'marketplace_listings_status_lifecycle_check'
  ) THEN
    ALTER TABLE public.marketplace_listings
      ADD CONSTRAINT marketplace_listings_status_lifecycle_check
      CHECK (status IN
        ('draft','published','paused','archived','active','inactive','suspended'));
  END IF;
END $$;

-- FK to properties (table exists; guard so re-runs / fresh DBs don't error).
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='properties')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='marketplace_listings_property_fk') THEN
    ALTER TABLE public.marketplace_listings
      ADD CONSTRAINT marketplace_listings_property_fk
      FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE SET NULL;
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_marketplace_listings_touch ON public.marketplace_listings;
CREATE TRIGGER trg_marketplace_listings_touch
  BEFORE UPDATE ON public.marketplace_listings
  FOR EACH ROW EXECUTE FUNCTION public.marketplace_touch_updated_at();

-- ────────────────────────────────────────────────────────────
-- 2. marketplace_listing_media
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.marketplace_listing_media (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  uuid NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  r2_key      text,
  url         text,
  kind        text,
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 3. marketplace_categories
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.marketplace_categories (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              text NOT NULL UNIQUE,
  label             text NOT NULL,
  parent_slug       text,
  transaction_type  text,
  sort_order        int NOT NULL DEFAULT 0
);

-- ────────────────────────────────────────────────────────────
-- 4. marketplace_listing_availability
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.marketplace_listing_availability (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  uuid NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  starts_on   date,
  ends_on     date,
  rule        jsonb,
  is_blocked  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 5. marketplace_listing_pricing
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.marketplace_listing_pricing (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id   uuid NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  rule_type    text,
  amount_pence bigint,
  min_nights   int,
  conditions   jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 6. marketplace_transactions — commerce kernel header
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.marketplace_transactions (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_workspace_id        uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  seller_workspace_id       uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  listing_id                uuid REFERENCES public.marketplace_listings(id) ON DELETE SET NULL,
  transaction_type          text NOT NULL CHECK (transaction_type IN
                              ('stay_booking','supplier_job','emergency_job','service_package','subscription_addon')),
  gross_pence               bigint NOT NULL,
  platform_fee_pence        bigint NOT NULL,
  provider_fee_pence        bigint NOT NULL DEFAULT 0,
  seller_payout_pence       bigint NOT NULL,
  net_platform_revenue_pence bigint NOT NULL,
  platform_fee_percent      numeric,
  applied_fee_rule_id       text,
  currency                  text NOT NULL DEFAULT 'GBP',
  status                    text NOT NULL DEFAULT 'pending' CHECK (status IN
                              ('pending','authorized','captured','released','refunded','disputed','cancelled')),
  metadata                  jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_marketplace_transactions_touch ON public.marketplace_transactions;
CREATE TRIGGER trg_marketplace_transactions_touch
  BEFORE UPDATE ON public.marketplace_transactions
  FOR EACH ROW EXECUTE FUNCTION public.marketplace_touch_updated_at();

-- ────────────────────────────────────────────────────────────
-- 7. marketplace_commission_ledger — APPEND-ONLY immutable ledger
--    (mirrors the immutability pattern in 20260615020000_accounting_ledger.sql)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.marketplace_commission_ledger (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id  uuid NOT NULL REFERENCES public.marketplace_transactions(id) ON DELETE CASCADE,
  entry_type      text NOT NULL CHECK (entry_type IN
                    ('platform_fee','provider_fee','seller_payout','refund','adjustment')),
  amount_pence    bigint NOT NULL,
  currency        text NOT NULL DEFAULT 'GBP',
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Append-only: block any UPDATE/DELETE of a ledger entry.
CREATE OR REPLACE FUNCTION public.marketplace_commission_ledger_immutable()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'marketplace_commission_ledger is append-only; entries cannot be modified or deleted'
    USING ERRCODE = 'check_violation';
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_marketplace_ledger_immutable ON public.marketplace_commission_ledger;
CREATE TRIGGER trg_marketplace_ledger_immutable
  BEFORE UPDATE OR DELETE ON public.marketplace_commission_ledger
  FOR EACH ROW EXECUTE FUNCTION public.marketplace_commission_ledger_immutable();

-- ────────────────────────────────────────────────────────────
-- 8. INDEXES
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_mkt_listings_ws        ON public.marketplace_listings(workspace_id);
CREATE INDEX IF NOT EXISTS idx_mkt_listings_status    ON public.marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_mkt_listings_txn_type  ON public.marketplace_listings(transaction_type);
CREATE INDEX IF NOT EXISTS idx_mkt_listings_country   ON public.marketplace_listings(country_code);
CREATE INDEX IF NOT EXISTS idx_mkt_listings_category  ON public.marketplace_listings(category);
CREATE INDEX IF NOT EXISTS idx_mkt_listing_media_listing ON public.marketplace_listing_media(listing_id);
CREATE INDEX IF NOT EXISTS idx_mkt_avail_listing      ON public.marketplace_listing_availability(listing_id);
CREATE INDEX IF NOT EXISTS idx_mkt_pricing_listing    ON public.marketplace_listing_pricing(listing_id);
CREATE INDEX IF NOT EXISTS idx_mkt_txn_buyer          ON public.marketplace_transactions(buyer_workspace_id);
CREATE INDEX IF NOT EXISTS idx_mkt_txn_seller         ON public.marketplace_transactions(seller_workspace_id);
CREATE INDEX IF NOT EXISTS idx_mkt_txn_status         ON public.marketplace_transactions(status);
CREATE INDEX IF NOT EXISTS idx_mkt_txn_type           ON public.marketplace_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_mkt_txn_listing        ON public.marketplace_transactions(listing_id);
CREATE INDEX IF NOT EXISTS idx_mkt_ledger_txn         ON public.marketplace_commission_ledger(transaction_id);

-- ────────────────────────────────────────────────────────────
-- 9. RLS — workspace-member access everywhere; published listings
--    additionally readable by any authenticated user (it's a marketplace).
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.marketplace_listings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_listing_media         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_categories            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_listing_availability  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_listing_pricing       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_transactions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_commission_ledger     ENABLE ROW LEVEL SECURITY;

-- 9a. Listings — workspace members manage their own (ALL).
DROP POLICY IF EXISTS mkt_listings_ws_member ON public.marketplace_listings;
CREATE POLICY mkt_listings_ws_member ON public.marketplace_listings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = marketplace_listings.workspace_id AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = marketplace_listings.workspace_id AND wm.user_id = auth.uid()));

-- 9b. Listings — published rows readable by any authenticated user (marketplace).
DROP POLICY IF EXISTS mkt_listings_published_read ON public.marketplace_listings;
CREATE POLICY mkt_listings_published_read ON public.marketplace_listings FOR SELECT
  TO authenticated
  USING (status = 'published');

-- 9c. Child tables — manage when member of the owning listing's workspace;
--     read when the parent listing is published.
DROP POLICY IF EXISTS mkt_media_ws_member ON public.marketplace_listing_media;
CREATE POLICY mkt_media_ws_member ON public.marketplace_listing_media FOR ALL
  USING (EXISTS (SELECT 1 FROM public.marketplace_listings l JOIN public.workspace_members wm ON wm.workspace_id = l.workspace_id WHERE l.id = marketplace_listing_media.listing_id AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.marketplace_listings l JOIN public.workspace_members wm ON wm.workspace_id = l.workspace_id WHERE l.id = marketplace_listing_media.listing_id AND wm.user_id = auth.uid()));
DROP POLICY IF EXISTS mkt_media_published_read ON public.marketplace_listing_media;
CREATE POLICY mkt_media_published_read ON public.marketplace_listing_media FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.marketplace_listings l WHERE l.id = marketplace_listing_media.listing_id AND l.status = 'published'));

DROP POLICY IF EXISTS mkt_avail_ws_member ON public.marketplace_listing_availability;
CREATE POLICY mkt_avail_ws_member ON public.marketplace_listing_availability FOR ALL
  USING (EXISTS (SELECT 1 FROM public.marketplace_listings l JOIN public.workspace_members wm ON wm.workspace_id = l.workspace_id WHERE l.id = marketplace_listing_availability.listing_id AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.marketplace_listings l JOIN public.workspace_members wm ON wm.workspace_id = l.workspace_id WHERE l.id = marketplace_listing_availability.listing_id AND wm.user_id = auth.uid()));
DROP POLICY IF EXISTS mkt_avail_published_read ON public.marketplace_listing_availability;
CREATE POLICY mkt_avail_published_read ON public.marketplace_listing_availability FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.marketplace_listings l WHERE l.id = marketplace_listing_availability.listing_id AND l.status = 'published'));

DROP POLICY IF EXISTS mkt_pricing_ws_member ON public.marketplace_listing_pricing;
CREATE POLICY mkt_pricing_ws_member ON public.marketplace_listing_pricing FOR ALL
  USING (EXISTS (SELECT 1 FROM public.marketplace_listings l JOIN public.workspace_members wm ON wm.workspace_id = l.workspace_id WHERE l.id = marketplace_listing_pricing.listing_id AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.marketplace_listings l JOIN public.workspace_members wm ON wm.workspace_id = l.workspace_id WHERE l.id = marketplace_listing_pricing.listing_id AND wm.user_id = auth.uid()));
DROP POLICY IF EXISTS mkt_pricing_published_read ON public.marketplace_listing_pricing;
CREATE POLICY mkt_pricing_published_read ON public.marketplace_listing_pricing FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.marketplace_listings l WHERE l.id = marketplace_listing_pricing.listing_id AND l.status = 'published'));

-- 9d. Categories — readable by any authenticated user (public reference data).
DROP POLICY IF EXISTS mkt_categories_read ON public.marketplace_categories;
CREATE POLICY mkt_categories_read ON public.marketplace_categories FOR SELECT
  TO authenticated
  USING (true);

-- 9e. Transactions — readable/writable by members of EITHER side's workspace.
DROP POLICY IF EXISTS mkt_txn_ws_member ON public.marketplace_transactions;
CREATE POLICY mkt_txn_ws_member ON public.marketplace_transactions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.user_id = auth.uid()
            AND wm.workspace_id IN (marketplace_transactions.buyer_workspace_id, marketplace_transactions.seller_workspace_id))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.user_id = auth.uid()
            AND wm.workspace_id IN (marketplace_transactions.buyer_workspace_id, marketplace_transactions.seller_workspace_id))
  );

-- 9f. Commission ledger — readable by members of either side of the parent txn.
--     (Append-only is enforced by trigger; INSERT allowed for members.)
DROP POLICY IF EXISTS mkt_ledger_ws_member ON public.marketplace_commission_ledger;
CREATE POLICY mkt_ledger_ws_member ON public.marketplace_commission_ledger FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.marketplace_transactions t
    JOIN public.workspace_members wm ON wm.user_id = auth.uid()
      AND wm.workspace_id IN (t.buyer_workspace_id, t.seller_workspace_id)
    WHERE t.id = marketplace_commission_ledger.transaction_id))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.marketplace_transactions t
    JOIN public.workspace_members wm ON wm.user_id = auth.uid()
      AND wm.workspace_id IN (t.buyer_workspace_id, t.seller_workspace_id)
    WHERE t.id = marketplace_commission_ledger.transaction_id));

-- ────────────────────────────────────────────────────────────
-- 10. SEED — a small starter set of marketplace categories.
-- ────────────────────────────────────────────────────────────
INSERT INTO public.marketplace_categories (slug, label, parent_slug, transaction_type, sort_order) VALUES
  ('stays',              'Stays & Bookings',     NULL,    'stay_booking',       10),
  ('short-let',          'Short Let',            'stays', 'stay_booking',       11),
  ('serviced-accom',     'Serviced Accommodation','stays','stay_booking',       12),
  ('suppliers',          'Suppliers & Trades',   NULL,    'supplier_job',       20),
  ('cleaning',           'Cleaning',             'suppliers','supplier_job',     21),
  ('maintenance',        'Maintenance & Repairs','suppliers','supplier_job',     22),
  ('gas-heating',        'Gas & Heating',        'suppliers','supplier_job',     23),
  ('electrical',         'Electrical',           'suppliers','supplier_job',     24),
  ('emergency',          'Emergency Call-outs',  NULL,    'emergency_job',      30),
  ('services',           'Service Packages',     NULL,    'service_package',    40),
  ('inventory',          'Inventory & Reports',  'services','service_package',   41),
  ('compliance-services','Compliance Services',  'services','service_package',   42),
  ('addons',             'Subscription Add-ons', NULL,    'subscription_addon', 50)
ON CONFLICT (slug) DO NOTHING;
