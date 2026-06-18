-- ════════════════════════════════════════════════════════════════════════════
-- Supplier Requests & Quotes depth — additive support for the Solo Supplier
-- Requests sales-pipeline section (New / Quoted / Won / Lost / Archived).
--
-- ADDITIVE & IDEMPOTENT. Every object uses CREATE TABLE / ADD COLUMN /
-- CREATE INDEX … IF NOT EXISTS, or a DROP POLICY IF EXISTS + CREATE POLICY pair.
--
-- REUSE: the parent tables `public.supplier_requests` and `public.supplier_quotes`
-- already exist (created in 20260617200100_supplier_workspace_depth.sql). We do
-- NOT redefine them — we only:
--   • ADD a small set of nullable columns the pipeline UI needs (all nullable,
--     no defaults that would rewrite existing rows destructively), and
--   • CREATE the four genuinely-missing child tables:
--       supplier_request_files       (photos / documents on a request)
--       supplier_request_messages    (customer ↔ supplier thread)
--       supplier_quote_versions      (quote revision history: v1, v2, …)
--       supplier_quote_line_items    (structured quote line items)
--
-- RLS model: workspace-membership via the REAL public.workspace_members(
-- workspace_id, user_id) table — the EXACT EXISTS pattern used by
-- 20260617211000_orders_escrow.sql (service role bypasses RLS).
-- ════════════════════════════════════════════════════════════════════════════

-- ── helper: standard updated_at trigger fn (idempotent) ──────────────────────
CREATE OR REPLACE FUNCTION public._supplier_requests_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

-- ── 0. Additive columns on the EXISTING parent tables ────────────────────────
--   supplier_requests already has: id, workspace_id, title, description, status,
--   source, property_ref, requested_by, amount_pence, currency, created_by,
--   archived_at, created_at, updated_at. Add the pipeline-specific columns.
ALTER TABLE public.supplier_requests
  ADD COLUMN IF NOT EXISTS supplier_workspace_id uuid,
  ADD COLUMN IF NOT EXISTS requester_company     text,
  ADD COLUMN IF NOT EXISTS requester_verified    boolean,
  ADD COLUMN IF NOT EXISTS service_title         text,
  ADD COLUMN IF NOT EXISTS property_address      text,
  ADD COLUMN IF NOT EXISTS property_type         text,
  ADD COLUMN IF NOT EXISTS property_year         integer,
  ADD COLUMN IF NOT EXISTS property_tenure       text,
  ADD COLUMN IF NOT EXISTS property_heating      text,
  ADD COLUMN IF NOT EXISTS property_bedrooms     integer,
  ADD COLUMN IF NOT EXISTS property_units        integer,
  ADD COLUMN IF NOT EXISTS urgency               text,
  ADD COLUMN IF NOT EXISTS budget_min_pence      bigint,
  ADD COLUMN IF NOT EXISTS budget_max_pence      bigint,
  ADD COLUMN IF NOT EXISTS due_at                timestamptz,
  ADD COLUMN IF NOT EXISTS win_score             smallint,
  ADD COLUMN IF NOT EXISTS within_coverage       boolean,
  ADD COLUMN IF NOT EXISTS lost_reason           text,
  ADD COLUMN IF NOT EXISTS recoverable           boolean,
  ADD COLUMN IF NOT EXISTS outcome               text,
  ADD COLUMN IF NOT EXISTS archive_reason        text,
  ADD COLUMN IF NOT EXISTS reactivation_until    timestamptz,
  ADD COLUMN IF NOT EXISTS notes                 text,
  ADD COLUMN IF NOT EXISTS metadata_json         jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS supplier_requests_supplier_ws_idx
  ON public.supplier_requests (supplier_workspace_id);

--   supplier_quotes already has: id, workspace_id, request_id, title, status,
--   amount_pence, currency, line_items, terms, valid_until, created_by,
--   archived_at, created_at, updated_at. Add pipeline-specific columns.
ALTER TABLE public.supplier_quotes
  ADD COLUMN IF NOT EXISTS supplier_workspace_id uuid,
  ADD COLUMN IF NOT EXISTS customer_name         text,
  ADD COLUMN IF NOT EXISTS vat_pence             bigint,
  ADD COLUMN IF NOT EXISTS total_inc_vat_pence   bigint,
  ADD COLUMN IF NOT EXISTS sent_at               timestamptz,
  ADD COLUMN IF NOT EXISTS expires_at            timestamptz,
  ADD COLUMN IF NOT EXISTS win_chance            smallint,
  ADD COLUMN IF NOT EXISTS follow_up_at          timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_at           timestamptz,
  ADD COLUMN IF NOT EXISTS version               integer,
  ADD COLUMN IF NOT EXISTS escrow_status         text,
  ADD COLUMN IF NOT EXISTS metadata_json         jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS supplier_quotes_supplier_ws_idx
  ON public.supplier_quotes (supplier_workspace_id);

-- ── 1. supplier_request_files — photos / documents attached to a request ─────
CREATE TABLE IF NOT EXISTS public.supplier_request_files (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  supplier_workspace_id uuid,
  request_id            uuid REFERENCES public.supplier_requests(id) ON DELETE CASCADE,
  file_name             text,
  file_kind             text,        -- 'photo' | 'document'
  storage_path          text,
  size_bytes            bigint,
  status                text NOT NULL DEFAULT 'ready',
  created_by            uuid,
  archived_at           timestamptz,
  metadata_json         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS supplier_request_files_ws_idx          ON public.supplier_request_files (workspace_id);
CREATE INDEX IF NOT EXISTS supplier_request_files_supplier_ws_idx ON public.supplier_request_files (supplier_workspace_id);
CREATE INDEX IF NOT EXISTS supplier_request_files_status_idx      ON public.supplier_request_files (status);
CREATE INDEX IF NOT EXISTS supplier_request_files_request_idx     ON public.supplier_request_files (request_id);
CREATE INDEX IF NOT EXISTS supplier_request_files_created_idx     ON public.supplier_request_files (created_at);

-- ── 2. supplier_request_messages — customer ↔ supplier thread ────────────────
CREATE TABLE IF NOT EXISTS public.supplier_request_messages (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  supplier_workspace_id uuid,
  request_id            uuid REFERENCES public.supplier_requests(id) ON DELETE CASCADE,
  quote_id              uuid REFERENCES public.supplier_quotes(id) ON DELETE SET NULL,
  author_role           text,        -- 'supplier' | 'customer'
  author_name           text,
  body                  text,
  status                text NOT NULL DEFAULT 'sent',
  created_by            uuid,
  archived_at           timestamptz,
  metadata_json         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS supplier_request_messages_ws_idx          ON public.supplier_request_messages (workspace_id);
CREATE INDEX IF NOT EXISTS supplier_request_messages_supplier_ws_idx ON public.supplier_request_messages (supplier_workspace_id);
CREATE INDEX IF NOT EXISTS supplier_request_messages_status_idx      ON public.supplier_request_messages (status);
CREATE INDEX IF NOT EXISTS supplier_request_messages_request_idx     ON public.supplier_request_messages (request_id);
CREATE INDEX IF NOT EXISTS supplier_request_messages_quote_idx       ON public.supplier_request_messages (quote_id);
CREATE INDEX IF NOT EXISTS supplier_request_messages_created_idx     ON public.supplier_request_messages (created_at);

-- ── 3. supplier_quote_versions — quote revision history (v1, v2, original) ───
CREATE TABLE IF NOT EXISTS public.supplier_quote_versions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  supplier_workspace_id uuid,
  quote_id              uuid REFERENCES public.supplier_quotes(id) ON DELETE CASCADE,
  request_id            uuid REFERENCES public.supplier_requests(id) ON DELETE SET NULL,
  version               integer NOT NULL DEFAULT 1,
  label                 text,         -- 'Original' | 'v2 — revised' …
  amount_pence          bigint,
  total_inc_vat_pence   bigint,
  currency              text NOT NULL DEFAULT 'GBP',
  status                text NOT NULL DEFAULT 'sent',
  note                  text,
  created_by            uuid,
  archived_at           timestamptz,
  metadata_json         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS supplier_quote_versions_ws_idx          ON public.supplier_quote_versions (workspace_id);
CREATE INDEX IF NOT EXISTS supplier_quote_versions_supplier_ws_idx ON public.supplier_quote_versions (supplier_workspace_id);
CREATE INDEX IF NOT EXISTS supplier_quote_versions_status_idx      ON public.supplier_quote_versions (status);
CREATE INDEX IF NOT EXISTS supplier_quote_versions_quote_idx       ON public.supplier_quote_versions (quote_id);
CREATE INDEX IF NOT EXISTS supplier_quote_versions_request_idx     ON public.supplier_quote_versions (request_id);
CREATE INDEX IF NOT EXISTS supplier_quote_versions_created_idx     ON public.supplier_quote_versions (created_at);

-- ── 4. supplier_quote_line_items — structured quote lines ────────────────────
CREATE TABLE IF NOT EXISTS public.supplier_quote_line_items (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  supplier_workspace_id uuid,
  quote_id              uuid REFERENCES public.supplier_quotes(id) ON DELETE CASCADE,
  version_id            uuid REFERENCES public.supplier_quote_versions(id) ON DELETE SET NULL,
  description           text,
  quantity              numeric NOT NULL DEFAULT 1,
  unit_price_pence      bigint,
  line_total_pence      bigint,
  sort_order            integer NOT NULL DEFAULT 0,
  status                text NOT NULL DEFAULT 'active',
  created_by            uuid,
  archived_at           timestamptz,
  metadata_json         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS supplier_quote_line_items_ws_idx          ON public.supplier_quote_line_items (workspace_id);
CREATE INDEX IF NOT EXISTS supplier_quote_line_items_supplier_ws_idx ON public.supplier_quote_line_items (supplier_workspace_id);
CREATE INDEX IF NOT EXISTS supplier_quote_line_items_status_idx      ON public.supplier_quote_line_items (status);
CREATE INDEX IF NOT EXISTS supplier_quote_line_items_quote_idx       ON public.supplier_quote_line_items (quote_id);
CREATE INDEX IF NOT EXISTS supplier_quote_line_items_created_idx     ON public.supplier_quote_line_items (created_at);

-- ── updated_at triggers on the new child tables ──────────────────────────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'supplier_request_files','supplier_request_messages',
    'supplier_quote_versions','supplier_quote_line_items'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', t || '_touch', t);
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public._supplier_requests_touch_updated_at()',
      t || '_touch', t
    );
  END LOOP;
END $$;

-- ── RLS — workspace-membership via REAL public.workspace_members ─────────────
-- Exact EXISTS pattern copied from 20260617211000_orders_escrow.sql.
ALTER TABLE public.supplier_request_files    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_request_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_quote_versions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_quote_line_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS supplier_request_files_ws_member ON public.supplier_request_files;
CREATE POLICY supplier_request_files_ws_member ON public.supplier_request_files FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm
                 WHERE wm.workspace_id = supplier_request_files.workspace_id AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm
                 WHERE wm.workspace_id = supplier_request_files.workspace_id AND wm.user_id = auth.uid()));

DROP POLICY IF EXISTS supplier_request_messages_ws_member ON public.supplier_request_messages;
CREATE POLICY supplier_request_messages_ws_member ON public.supplier_request_messages FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm
                 WHERE wm.workspace_id = supplier_request_messages.workspace_id AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm
                 WHERE wm.workspace_id = supplier_request_messages.workspace_id AND wm.user_id = auth.uid()));

DROP POLICY IF EXISTS supplier_quote_versions_ws_member ON public.supplier_quote_versions;
CREATE POLICY supplier_quote_versions_ws_member ON public.supplier_quote_versions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm
                 WHERE wm.workspace_id = supplier_quote_versions.workspace_id AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm
                 WHERE wm.workspace_id = supplier_quote_versions.workspace_id AND wm.user_id = auth.uid()));

DROP POLICY IF EXISTS supplier_quote_line_items_ws_member ON public.supplier_quote_line_items;
CREATE POLICY supplier_quote_line_items_ws_member ON public.supplier_quote_line_items FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm
                 WHERE wm.workspace_id = supplier_quote_line_items.workspace_id AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm
                 WHERE wm.workspace_id = supplier_quote_line_items.workspace_id AND wm.user_id = auth.uid()));

-- ============================================================================
-- END supplier requests & quotes depth
-- ============================================================================
