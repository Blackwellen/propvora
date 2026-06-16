-- ============================================================================
-- Marketplace OS substrate (Propvora-release-version.2.0)
--
-- ADDITIVE, IDEMPOTENT reconciliation of the live hybrid marketplace schema into
-- a single unified commerce model. The live `marketplace_listings` is a hybrid of
-- legacy supplier-directory columns + earlier P2 commerce columns; this migration
-- only ADDS what is missing (never drops), introduces a finer-grained listing_type
-- taxonomy + a generated FTS search_vector, reconciles `marketplace_orders` with
-- the pence/commerce columns the kernel writes, and creates the three remaining
-- substrate tables (listing<->category join, saved items, search events).
--
-- Money is integer pence (bigint). RLS is ON for every table; published listings
-- (and their media/availability/pricing) are readable by anon+authenticated,
-- management is workspace-member scoped, orders/saved/search are party-scoped.
--
-- Safe to re-run: guarded with IF NOT EXISTS / catalog checks throughout.
-- ============================================================================

-- ── 1. marketplace_listings: additive commerce + discovery columns ──────────
ALTER TABLE public.marketplace_listings
  ADD COLUMN IF NOT EXISTS visibility            text    NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS verification_status   text    NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS region                text,
  ADD COLUMN IF NOT EXISTS postcode              text,
  ADD COLUMN IF NOT EXISTS service_area          text,
  ADD COLUMN IF NOT EXISTS instant_book          boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS request_to_book       boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS request_quote_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reviews_enabled       boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS disputes_enabled      boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS payments_enabled      boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS holds_enabled         boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS platform_fee_percent  numeric;

-- listing_type taxonomy (17 fine-grained kinds). The column already exists
-- (NOT NULL DEFAULT 'service'); add a CHECK constraint covering the legacy
-- defaults AND the full unified taxonomy so existing rows stay valid.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'marketplace_listings_listing_type_check'
      AND conrelid = 'public.marketplace_listings'::regclass
  ) THEN
    ALTER TABLE public.marketplace_listings
      ADD CONSTRAINT marketplace_listings_listing_type_check
      CHECK (listing_type = ANY (ARRAY[
        -- legacy defaults retained so pre-existing rows validate
        'service','property','supplier','stay',
        -- unified taxonomy
        'property_stay','serviced_accommodation','holiday_let','mid_term_stay',
        'student_room','hmo_room','co_living_room','commercial_space',
        'supplier_service','supplier_package','emergency_service','utility_setup',
        'move_in_logistics','cleaning_turnover','maintenance_callout',
        'compliance_service','professional_service'
      ]));
  END IF;
END $$;

-- Generated FTS vector over title/description/company_name/location/category.
-- IMMUTABLE-safe (coalesce of plain columns, English config). GENERATED column
-- so it is always in sync with the row — no triggers, no drift.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='marketplace_listings'
      AND column_name='search_vector'
  ) THEN
    ALTER TABLE public.marketplace_listings
      ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(company_name,'')), 'A') ||
        setweight(to_tsvector('english', coalesce(category,'') || ' ' || coalesce(listing_type,'')), 'B') ||
        setweight(to_tsvector('english', coalesce(location,'') || ' ' || coalesce(location_city,'') || ' ' || coalesce(region,'') || ' ' || coalesce(postcode,'')), 'C') ||
        setweight(to_tsvector('english', coalesce(description,'')), 'D')
      ) STORED;
  END IF;
END $$;

-- ── 2. Indexes (FTS GIN + discovery btrees) ─────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_mkt_listings_search_vector ON public.marketplace_listings USING gin (search_vector);
CREATE INDEX IF NOT EXISTS idx_mkt_listings_status        ON public.marketplace_listings (status);
CREATE INDEX IF NOT EXISTS idx_mkt_listings_listing_type  ON public.marketplace_listings (listing_type);
CREATE INDEX IF NOT EXISTS idx_mkt_listings_country       ON public.marketplace_listings (country_code);
CREATE INDEX IF NOT EXISTS idx_mkt_listings_workspace     ON public.marketplace_listings (workspace_id);
CREATE INDEX IF NOT EXISTS idx_mkt_listings_category      ON public.marketplace_listings (category);
CREATE INDEX IF NOT EXISTS idx_mkt_listings_txn_type      ON public.marketplace_listings (transaction_type);
CREATE INDEX IF NOT EXISTS idx_mkt_listings_published_at  ON public.marketplace_listings (published_at DESC);

-- ── 3. marketplace_orders: reconcile to the kernel's commerce columns ───────
-- The live table predates the kernel (has amount/total_amount/title NOT NULL).
-- Add the pence + transaction-link columns the kernel writes; keep legacy cols.
ALTER TABLE public.marketplace_orders
  ADD COLUMN IF NOT EXISTS transaction_id    uuid REFERENCES public.marketplace_transactions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS transaction_type  text,
  ADD COLUMN IF NOT EXISTS gross_pence        bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fee_pence          bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payout_pence       bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency           text   NOT NULL DEFAULT 'GBP';

CREATE INDEX IF NOT EXISTS idx_mkt_orders_transaction ON public.marketplace_orders (transaction_id);
CREATE INDEX IF NOT EXISTS idx_mkt_orders_buyer_ws    ON public.marketplace_orders (buyer_workspace_id);
CREATE INDEX IF NOT EXISTS idx_mkt_orders_seller_ws   ON public.marketplace_orders (seller_workspace_id);
CREATE INDEX IF NOT EXISTS idx_mkt_orders_status      ON public.marketplace_orders (status);

-- ── 4. marketplace_listing_categories (listing <-> taxonomy join) ───────────
CREATE TABLE IF NOT EXISTS public.marketplace_listing_categories (
  listing_id    uuid NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  category_slug text NOT NULL REFERENCES public.marketplace_categories(slug) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (listing_id, category_slug)
);
CREATE INDEX IF NOT EXISTS idx_mkt_listing_categories_cat ON public.marketplace_listing_categories (category_slug);

-- ── 5. marketplace_saved_items (buyer wishlists) ────────────────────────────
CREATE TABLE IF NOT EXISTS public.marketplace_saved_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  listing_id   uuid NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  saved_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note         text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, listing_id)
);
CREATE INDEX IF NOT EXISTS idx_mkt_saved_workspace ON public.marketplace_saved_items (workspace_id);
CREATE INDEX IF NOT EXISTS idx_mkt_saved_listing   ON public.marketplace_saved_items (listing_id);

-- ── 6. marketplace_search_events (analytics / ranking signal) ───────────────
CREATE TABLE IF NOT EXISTS public.marketplace_search_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  query         text,
  filters       jsonb NOT NULL DEFAULT '{}'::jsonb,
  result_count  integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mkt_search_events_created ON public.marketplace_search_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mkt_search_events_ws      ON public.marketplace_search_events (workspace_id);

-- ── 7. RLS for the new tables ───────────────────────────────────────────────
ALTER TABLE public.marketplace_listing_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_saved_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_search_events      ENABLE ROW LEVEL SECURITY;

-- listing_categories: read for published listings (anon+auth) OR ws members;
-- write only by a member of the owning listing's workspace.
DROP POLICY IF EXISTS mkt_listing_categories_read ON public.marketplace_listing_categories;
CREATE POLICY mkt_listing_categories_read ON public.marketplace_listing_categories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_listings l
      WHERE l.id = marketplace_listing_categories.listing_id
        AND (
          l.status IN ('published','active')
          OR EXISTS (SELECT 1 FROM public.workspace_members wm
                     WHERE wm.workspace_id = l.workspace_id AND wm.user_id = auth.uid())
        )
    )
  );

DROP POLICY IF EXISTS mkt_listing_categories_manage ON public.marketplace_listing_categories;
CREATE POLICY mkt_listing_categories_manage ON public.marketplace_listing_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_listings l
      JOIN public.workspace_members wm ON wm.workspace_id = l.workspace_id
      WHERE l.id = marketplace_listing_categories.listing_id AND wm.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.marketplace_listings l
      JOIN public.workspace_members wm ON wm.workspace_id = l.workspace_id
      WHERE l.id = marketplace_listing_categories.listing_id AND wm.user_id = auth.uid()
    )
  );

-- saved_items: a workspace member may see/manage only their workspace's saves.
DROP POLICY IF EXISTS mkt_saved_items_member ON public.marketplace_saved_items;
CREATE POLICY mkt_saved_items_member ON public.marketplace_saved_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = marketplace_saved_items.workspace_id AND wm.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = marketplace_saved_items.workspace_id AND wm.user_id = auth.uid())
  );

-- search_events: a user may insert their own event and read events for a
-- workspace they belong to (or their own user-scoped events).
DROP POLICY IF EXISTS mkt_search_events_insert ON public.marketplace_search_events;
CREATE POLICY mkt_search_events_insert ON public.marketplace_search_events
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR (workspace_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.workspace_members wm
          WHERE wm.workspace_id = marketplace_search_events.workspace_id AND wm.user_id = auth.uid()))
  );

DROP POLICY IF EXISTS mkt_search_events_read ON public.marketplace_search_events;
CREATE POLICY mkt_search_events_read ON public.marketplace_search_events
  FOR SELECT USING (
    user_id = auth.uid()
    OR (workspace_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.workspace_members wm
          WHERE wm.workspace_id = marketplace_search_events.workspace_id AND wm.user_id = auth.uid()))
  );

-- ── 8. Backfill listing_type for any legacy rows that are still 'service' but
--       have a P2 transaction_type set, so the unified taxonomy is populated. ─
UPDATE public.marketplace_listings
SET listing_type = CASE transaction_type
    WHEN 'stay_booking'       THEN 'property_stay'
    WHEN 'supplier_job'       THEN 'supplier_service'
    WHEN 'emergency_job'      THEN 'emergency_service'
    WHEN 'service_package'    THEN 'supplier_package'
    ELSE listing_type
  END
WHERE listing_type IN ('service','supplier','stay','property')
  AND transaction_type IS NOT NULL;
