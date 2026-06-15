-- ============================================================================
-- MARKETPLACE TRUST SUBSTRATE — P2
--
-- Reviews/Trust + Dispute Engine + Terms/Risk for the v2 marketplace OS.
-- Adds five workspace-scoped tables, RLS, indexes, and migrates legacy
-- supplier_ratings / job_complaints rows into the new model.
--
-- Fully IDEMPOTENT and purely additive. Does NOT drop legacy tables.
-- Conventions follow 20260616010000_v2_foundation.sql and
-- 003_rls_policies.sql: is_workspace_member(workspace_id),
-- can_resolve_dispute(user, ws), update_updated_at() trigger.
-- ============================================================================

-- ── 1. marketplace_reviews ──────────────────────────────────────────────────
-- NOTE: another v2 phase may have already created a marketplace_reviews table
-- with a different (order/listing-centric) shape. We therefore CREATE IF NOT
-- EXISTS our canonical shape AND additively ADD COLUMN IF NOT EXISTS every
-- column we depend on, so this migration converges whether the table is fresh
-- or pre-existing. We never drop a column another phase owns.
CREATE TABLE IF NOT EXISTS public.marketplace_reviews (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id        uuid,
  listing_id            uuid,
  reviewer_workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  subject_workspace_id  uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  rating                int  NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  title                 text,
  body                  text,
  status                text NOT NULL DEFAULT 'published'
                          CHECK (status IN ('published','hidden','flagged')),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- Additively reconcile with any pre-existing table shape.
ALTER TABLE public.marketplace_reviews
  ADD COLUMN IF NOT EXISTS transaction_id        uuid,
  ADD COLUMN IF NOT EXISTS listing_id            uuid,
  ADD COLUMN IF NOT EXISTS reviewer_workspace_id uuid,
  ADD COLUMN IF NOT EXISTS subject_workspace_id  uuid,
  ADD COLUMN IF NOT EXISTS rating                int  NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS title                 text,
  ADD COLUMN IF NOT EXISTS body                  text,
  ADD COLUMN IF NOT EXISTS status                text NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS created_at            timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at            timestamptz NOT NULL DEFAULT now();

-- If a pre-existing table carried a single workspace_id, seed our workspace
-- pointers from it so existing rows remain valid under the new RLS.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='marketplace_reviews'
      AND column_name='workspace_id'
  ) THEN
    EXECUTE 'UPDATE public.marketplace_reviews
             SET subject_workspace_id  = COALESCE(subject_workspace_id, workspace_id),
                 reviewer_workspace_id = COALESCE(reviewer_workspace_id, workspace_id)
             WHERE workspace_id IS NOT NULL';
  END IF;
END $$;

-- Ensure the status CHECK exists (guarded; constraint add is not IF NOT EXISTS).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='marketplace_reviews_status_check') THEN
    ALTER TABLE public.marketplace_reviews
      ADD CONSTRAINT marketplace_reviews_status_check
      CHECK (status IN ('published','hidden','flagged'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='marketplace_reviews_rating_check') THEN
    ALTER TABLE public.marketplace_reviews
      ADD CONSTRAINT marketplace_reviews_rating_check
      CHECK (rating BETWEEN 1 AND 5);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS marketplace_reviews_subject_idx
  ON public.marketplace_reviews (subject_workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS marketplace_reviews_reviewer_idx
  ON public.marketplace_reviews (reviewer_workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS marketplace_reviews_transaction_idx
  ON public.marketplace_reviews (transaction_id);

-- ── 2. marketplace_disputes ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.marketplace_disputes (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id         uuid,
  raised_by_workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  against_workspace_id   uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  reason                 text,
  detail                 text,
  status                 text NOT NULL DEFAULT 'open'
                           CHECK (status IN ('open','under_review','resolved','rejected','escalated')),
  resolution             text,
  assigned_admin         uuid,
  resolved_at            timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketplace_disputes_raised_idx
  ON public.marketplace_disputes (raised_by_workspace_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS marketplace_disputes_against_idx
  ON public.marketplace_disputes (against_workspace_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS marketplace_disputes_transaction_idx
  ON public.marketplace_disputes (transaction_id);

-- ── 3. marketplace_trust_scores ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.marketplace_trust_scores (
  workspace_id uuid PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
  score        numeric NOT NULL DEFAULT 0,
  review_count int     NOT NULL DEFAULT 0,
  avg_rating   numeric,
  signals      jsonb   NOT NULL DEFAULT '{}'::jsonb,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ── 4. marketplace_terms_acceptance (append-only) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.marketplace_terms_acceptance (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  terms_version text NOT NULL,
  accepted_by   uuid,
  accepted_at   timestamptz NOT NULL DEFAULT now(),
  ip            text
);

CREATE INDEX IF NOT EXISTS marketplace_terms_acceptance_ws_idx
  ON public.marketplace_terms_acceptance (workspace_id, terms_version, accepted_at DESC);

-- ── 5. marketplace_risk_signals ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.marketplace_risk_signals (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  signal_type  text NOT NULL,
  severity     text NOT NULL
                 CHECK (severity IN ('low','medium','high','critical')),
  detail       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketplace_risk_signals_ws_idx
  ON public.marketplace_risk_signals (workspace_id, created_at DESC);

-- ── 6. RLS ──────────────────────────────────────────────────────────────────
ALTER TABLE public.marketplace_reviews          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_disputes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_trust_scores     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_terms_acceptance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_risk_signals     ENABLE ROW LEVEL SECURITY;

-- 6a. reviews: a workspace sees reviews it wrote OR reviews about it; only the
--     reviewer workspace's members may write/modify their own reviews.
DROP POLICY IF EXISTS marketplace_reviews_read ON public.marketplace_reviews;
CREATE POLICY marketplace_reviews_read ON public.marketplace_reviews
  FOR SELECT
  USING (
    public.is_workspace_member(reviewer_workspace_id)
    OR public.is_workspace_member(subject_workspace_id)
  );

DROP POLICY IF EXISTS marketplace_reviews_reviewer_write ON public.marketplace_reviews;
CREATE POLICY marketplace_reviews_reviewer_write ON public.marketplace_reviews
  FOR ALL
  USING (public.is_workspace_member(reviewer_workspace_id))
  WITH CHECK (public.is_workspace_member(reviewer_workspace_id));

-- 6b. disputes: either party's workspace members may read; the raiser may
--     create/update; resolution authority is enforced in the TS layer via
--     can_resolve_dispute (admins are not necessarily workspace members).
DROP POLICY IF EXISTS marketplace_disputes_read ON public.marketplace_disputes;
CREATE POLICY marketplace_disputes_read ON public.marketplace_disputes
  FOR SELECT
  USING (
    public.is_workspace_member(raised_by_workspace_id)
    OR (against_workspace_id IS NOT NULL AND public.is_workspace_member(against_workspace_id))
    OR public.can_resolve_dispute(auth.uid(), raised_by_workspace_id)
  );

DROP POLICY IF EXISTS marketplace_disputes_raiser_write ON public.marketplace_disputes;
CREATE POLICY marketplace_disputes_raiser_write ON public.marketplace_disputes
  FOR ALL
  USING (
    public.is_workspace_member(raised_by_workspace_id)
    OR public.can_resolve_dispute(auth.uid(), raised_by_workspace_id)
  )
  WITH CHECK (
    public.is_workspace_member(raised_by_workspace_id)
    OR public.can_resolve_dispute(auth.uid(), raised_by_workspace_id)
  );

-- 6c. trust_scores: any party that can see a workspace's reviews may read its
--     trust score; members of the subject workspace may write (recompute).
DROP POLICY IF EXISTS marketplace_trust_scores_read ON public.marketplace_trust_scores;
CREATE POLICY marketplace_trust_scores_read ON public.marketplace_trust_scores
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS marketplace_trust_scores_member_write ON public.marketplace_trust_scores;
CREATE POLICY marketplace_trust_scores_member_write ON public.marketplace_trust_scores
  FOR ALL
  USING (public.is_workspace_member(workspace_id))
  WITH CHECK (public.is_workspace_member(workspace_id));

-- 6d. terms_acceptance: workspace-member scoped, append-only (no UPDATE/DELETE
--     policy granted — only SELECT + INSERT).
DROP POLICY IF EXISTS marketplace_terms_acceptance_read ON public.marketplace_terms_acceptance;
CREATE POLICY marketplace_terms_acceptance_read ON public.marketplace_terms_acceptance
  FOR SELECT
  USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS marketplace_terms_acceptance_insert ON public.marketplace_terms_acceptance;
CREATE POLICY marketplace_terms_acceptance_insert ON public.marketplace_terms_acceptance
  FOR INSERT
  WITH CHECK (public.is_workspace_member(workspace_id));

-- 6e. risk_signals: workspace-member scoped read; members + dispute-resolvers
--     may record signals.
DROP POLICY IF EXISTS marketplace_risk_signals_read ON public.marketplace_risk_signals;
CREATE POLICY marketplace_risk_signals_read ON public.marketplace_risk_signals
  FOR SELECT
  USING (
    public.is_workspace_member(workspace_id)
    OR public.can_resolve_dispute(auth.uid(), workspace_id)
  );

DROP POLICY IF EXISTS marketplace_risk_signals_write ON public.marketplace_risk_signals;
CREATE POLICY marketplace_risk_signals_write ON public.marketplace_risk_signals
  FOR INSERT
  WITH CHECK (
    public.is_workspace_member(workspace_id)
    OR public.can_resolve_dispute(auth.uid(), workspace_id)
  );

-- ── 7. updated_at triggers ──────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at') THEN
    DROP TRIGGER IF EXISTS update_marketplace_reviews_updated_at ON public.marketplace_reviews;
    CREATE TRIGGER update_marketplace_reviews_updated_at
      BEFORE UPDATE ON public.marketplace_reviews
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();

    DROP TRIGGER IF EXISTS update_marketplace_disputes_updated_at ON public.marketplace_disputes;
    CREATE TRIGGER update_marketplace_disputes_updated_at
      BEFORE UPDATE ON public.marketplace_disputes
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- ── 8. LEGACY DATA MIGRATION (guarded no-op if legacy tables absent) ─────────
-- 8a. supplier_ratings → marketplace_reviews
-- Legacy rating is multi-dimension (quality/speed/communication/reliability/
-- price_value/compliance/tenant_satisfaction, each 1–5, nullable). We derive a
-- single 1–5 rating as the ROUND(AVG of the present dimensions), clamped to
-- [1,5], skipping rows with no dimensions at all. The supplier was a CONTACT,
-- not a workspace, so subject_workspace_id is set to the rating's workspace_id
-- (best-effort: keeps the row workspace-scoped). Idempotent: only inserts ids
-- not already migrated.
DO $$
BEGIN
  IF to_regclass('public.supplier_ratings') IS NOT NULL THEN
    INSERT INTO public.marketplace_reviews
      (id, reviewer_workspace_id, subject_workspace_id, rating, title, body, status, created_at, updated_at)
    SELECT
      sr.id,
      sr.workspace_id AS reviewer_workspace_id,
      sr.workspace_id AS subject_workspace_id,
      GREATEST(1, LEAST(5, ROUND((
        COALESCE(sr.quality,0) + COALESCE(sr.speed,0) + COALESCE(sr.communication,0)
        + COALESCE(sr.reliability,0) + COALESCE(sr.price_value,0) + COALESCE(sr.compliance,0)
        + COALESCE(sr.tenant_satisfaction,0)
      )::numeric / NULLIF(
        (CASE WHEN sr.quality            IS NOT NULL THEN 1 ELSE 0 END)
        + (CASE WHEN sr.speed            IS NOT NULL THEN 1 ELSE 0 END)
        + (CASE WHEN sr.communication    IS NOT NULL THEN 1 ELSE 0 END)
        + (CASE WHEN sr.reliability      IS NOT NULL THEN 1 ELSE 0 END)
        + (CASE WHEN sr.price_value      IS NOT NULL THEN 1 ELSE 0 END)
        + (CASE WHEN sr.compliance       IS NOT NULL THEN 1 ELSE 0 END)
        + (CASE WHEN sr.tenant_satisfaction IS NOT NULL THEN 1 ELSE 0 END)
      , 0)))::int) AS rating,
      ('Migrated supplier rating (' || sr.supplier_contact_id::text || ')') AS title,
      sr.internal_notes AS body,
      'published' AS status,
      sr.created_at,
      sr.updated_at
    FROM public.supplier_ratings sr
    WHERE (
        (CASE WHEN sr.quality            IS NOT NULL THEN 1 ELSE 0 END)
      + (CASE WHEN sr.speed              IS NOT NULL THEN 1 ELSE 0 END)
      + (CASE WHEN sr.communication      IS NOT NULL THEN 1 ELSE 0 END)
      + (CASE WHEN sr.reliability        IS NOT NULL THEN 1 ELSE 0 END)
      + (CASE WHEN sr.price_value        IS NOT NULL THEN 1 ELSE 0 END)
      + (CASE WHEN sr.compliance         IS NOT NULL THEN 1 ELSE 0 END)
      + (CASE WHEN sr.tenant_satisfaction IS NOT NULL THEN 1 ELSE 0 END)
    ) > 0
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- 8b. job_complaints → marketplace_disputes
-- Maps legacy status (open|acknowledged|resolved|closed) to the new status
-- enum (open|under_review|resolved|rejected|escalated). raised_by + against are
-- both set to the complaint's workspace_id (legacy model had no counterparty
-- workspace). Idempotent on id.
DO $$
BEGIN
  IF to_regclass('public.job_complaints') IS NOT NULL THEN
    INSERT INTO public.marketplace_disputes
      (id, raised_by_workspace_id, against_workspace_id, reason, detail, status,
       resolution, resolved_at, created_at, updated_at)
    SELECT
      jc.id,
      jc.workspace_id AS raised_by_workspace_id,
      jc.workspace_id AS against_workspace_id,
      COALESCE(jc.category, 'complaint') AS reason,
      jc.description AS detail,
      CASE jc.status
        WHEN 'open'         THEN 'open'
        WHEN 'acknowledged' THEN 'under_review'
        WHEN 'resolved'     THEN 'resolved'
        WHEN 'closed'       THEN 'resolved'
        ELSE 'open'
      END AS status,
      jc.resolution_notes AS resolution,
      jc.resolved_at,
      jc.created_at,
      jc.updated_at
    FROM public.job_complaints jc
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- ============================================================================
-- END marketplace trust substrate
-- ============================================================================
