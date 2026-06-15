-- ============================================================================
-- IDENTITY / KYC — P6
--
-- Data model + verification engine substrate for identity / KYC. This LAYERS ON
-- TOP OF Stripe Connect (which already proves seller identity for payouts via
-- stripe_connect_accounts) by recording an additional / standalone KYC trail:
-- Stripe Identity VerificationSessions, uploaded documents, individual checks,
-- and sanctions-screening SIGNALS against the country_packs banned list.
--
-- IMPORTANT (compliance honesty): a verification result here reflects ONLY what
-- the provider (Stripe Identity) or an admin recorded. Sanctions screening is a
-- SCREENING SIGNAL against the banned country list — NOT a legal determination.
-- Nothing in this migration auto-approves KYC.
--
-- Fully IDEMPOTENT and purely additive. Conventions follow
-- 20260616090000_payments_escrow.sql: EXISTS over public.workspace_members for
-- member RLS, public.is_platform_admin(auth.uid()) + public.marketplace_admin_roles
-- for admin read-all, public.update_updated_at() trigger for updated_at.
-- Service-role (webhook) writes bypass RLS.
-- ============================================================================

-- ── 1. identity_verifications ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.identity_verifications (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type text NOT NULL CHECK (subject_type IN ('workspace','user')),
  subject_id   uuid NOT NULL,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  kind         text NOT NULL DEFAULT 'individual'
                 CHECK (kind IN ('individual','business','document')),
  provider     text NOT NULL DEFAULT 'stripe_identity',
  provider_ref text,                       -- Stripe VerificationSession id (vs_...)
  status       text NOT NULL DEFAULT 'not_started'
                 CHECK (status IN ('not_started','pending','processing','verified',
                                   'requires_input','rejected','cancelled')),
  risk_level   text,
  verified_at  timestamptz,
  created_by   uuid,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Additively reconcile if a prior phase created the table with a thinner shape.
ALTER TABLE public.identity_verifications
  ADD COLUMN IF NOT EXISTS subject_type text,
  ADD COLUMN IF NOT EXISTS subject_id   uuid,
  ADD COLUMN IF NOT EXISTS workspace_id uuid,
  ADD COLUMN IF NOT EXISTS kind         text NOT NULL DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS provider     text NOT NULL DEFAULT 'stripe_identity',
  ADD COLUMN IF NOT EXISTS provider_ref text,
  ADD COLUMN IF NOT EXISTS status       text NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS risk_level   text,
  ADD COLUMN IF NOT EXISTS verified_at  timestamptz,
  ADD COLUMN IF NOT EXISTS created_by   uuid,
  ADD COLUMN IF NOT EXISTS created_at   timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at   timestamptz NOT NULL DEFAULT now();

-- ── 2. verification_documents ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.verification_documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id uuid NOT NULL REFERENCES public.identity_verifications(id) ON DELETE CASCADE,
  doc_type        text NOT NULL CHECK (doc_type IN
                    ('passport','driving_licence','national_id','proof_of_address',
                     'business_registration','other')),
  r2_key          text,                    -- private object key; signed-URL only
  status          text NOT NULL DEFAULT 'uploaded'
                    CHECK (status IN ('uploaded','accepted','rejected')),
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.verification_documents
  ADD COLUMN IF NOT EXISTS verification_id uuid,
  ADD COLUMN IF NOT EXISTS doc_type        text,
  ADD COLUMN IF NOT EXISTS r2_key          text,
  ADD COLUMN IF NOT EXISTS status          text NOT NULL DEFAULT 'uploaded',
  ADD COLUMN IF NOT EXISTS notes           text,
  ADD COLUMN IF NOT EXISTS created_at      timestamptz NOT NULL DEFAULT now();

-- ── 3. verification_checks ──────────────────────────────────────────────────
-- One row per individual signal (document/selfie/address/business/sanctions/pep).
-- result defaults to 'manual_review' — never auto-pass.
CREATE TABLE IF NOT EXISTS public.verification_checks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id uuid NOT NULL REFERENCES public.identity_verifications(id) ON DELETE CASCADE,
  check_type      text NOT NULL CHECK (check_type IN
                    ('document','selfie','address','business','sanctions','pep')),
  result          text NOT NULL DEFAULT 'manual_review'
                    CHECK (result IN ('pass','fail','manual_review','unavailable')),
  detail          jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.verification_checks
  ADD COLUMN IF NOT EXISTS verification_id uuid,
  ADD COLUMN IF NOT EXISTS check_type      text,
  ADD COLUMN IF NOT EXISTS result          text NOT NULL DEFAULT 'manual_review',
  ADD COLUMN IF NOT EXISTS detail          jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at      timestamptz NOT NULL DEFAULT now();

-- ── 4. sanctions_screenings ─────────────────────────────────────────────────
-- A SCREENING SIGNAL (banned-country / name list), not a legal determination.
CREATE TABLE IF NOT EXISTS public.sanctions_screenings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  subject_name text NOT NULL,
  country_code text,
  matched      boolean NOT NULL DEFAULT false,
  match_detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  screened_at  timestamptz NOT NULL DEFAULT now(),
  screened_by  uuid
);

ALTER TABLE public.sanctions_screenings
  ADD COLUMN IF NOT EXISTS workspace_id uuid,
  ADD COLUMN IF NOT EXISTS subject_name text,
  ADD COLUMN IF NOT EXISTS country_code text,
  ADD COLUMN IF NOT EXISTS matched      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS match_detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS screened_at  timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS screened_by  uuid;

-- ── 5. Indexes ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_identity_verifications_subject
  ON public.identity_verifications (subject_type, subject_id);
CREATE INDEX IF NOT EXISTS idx_identity_verifications_workspace
  ON public.identity_verifications (workspace_id);
CREATE INDEX IF NOT EXISTS idx_identity_verifications_status
  ON public.identity_verifications (status);
CREATE INDEX IF NOT EXISTS idx_identity_verifications_provider_ref
  ON public.identity_verifications (provider_ref);
CREATE INDEX IF NOT EXISTS idx_verification_documents_verification
  ON public.verification_documents (verification_id);
CREATE INDEX IF NOT EXISTS idx_verification_checks_verification
  ON public.verification_checks (verification_id);
CREATE INDEX IF NOT EXISTS idx_sanctions_screenings_workspace
  ON public.sanctions_screenings (workspace_id);

-- ── 6. updated_at trigger (identity_verifications) ──────────────────────────
DROP TRIGGER IF EXISTS trg_identity_verifications_updated_at ON public.identity_verifications;
CREATE TRIGGER trg_identity_verifications_updated_at
  BEFORE UPDATE ON public.identity_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ── 7. RLS ──────────────────────────────────────────────────────────────────
-- Workspace members read/write their own workspace's rows. Platform admins and
-- marketplace_admin_roles members can read ALL rows (review queue). Service-role
-- (webhook) bypasses RLS entirely.
ALTER TABLE public.identity_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_checks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sanctions_screenings   ENABLE ROW LEVEL SECURITY;

-- identity_verifications — member ALL on own workspace; admin SELECT all.
DROP POLICY IF EXISTS identity_verifications_ws_member ON public.identity_verifications;
CREATE POLICY identity_verifications_ws_member ON public.identity_verifications FOR ALL
  USING (
    workspace_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = identity_verifications.workspace_id AND wm.user_id = auth.uid())
  )
  WITH CHECK (
    workspace_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = identity_verifications.workspace_id AND wm.user_id = auth.uid())
  );

DROP POLICY IF EXISTS identity_verifications_admin_read ON public.identity_verifications;
CREATE POLICY identity_verifications_admin_read ON public.identity_verifications FOR SELECT
  USING (
    public.is_platform_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.marketplace_admin_roles ar WHERE ar.user_id = auth.uid())
  );

-- verification_documents — membership/admin resolved through parent verification.
DROP POLICY IF EXISTS verification_documents_ws_member ON public.verification_documents;
CREATE POLICY verification_documents_ws_member ON public.verification_documents FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.identity_verifications v
    JOIN public.workspace_members wm ON wm.workspace_id = v.workspace_id
    WHERE v.id = verification_documents.verification_id AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.identity_verifications v
    JOIN public.workspace_members wm ON wm.workspace_id = v.workspace_id
    WHERE v.id = verification_documents.verification_id AND wm.user_id = auth.uid()));

DROP POLICY IF EXISTS verification_documents_admin_read ON public.verification_documents;
CREATE POLICY verification_documents_admin_read ON public.verification_documents FOR SELECT
  USING (
    public.is_platform_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.marketplace_admin_roles ar WHERE ar.user_id = auth.uid())
  );

-- verification_checks — membership/admin resolved through parent verification.
DROP POLICY IF EXISTS verification_checks_ws_member ON public.verification_checks;
CREATE POLICY verification_checks_ws_member ON public.verification_checks FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.identity_verifications v
    JOIN public.workspace_members wm ON wm.workspace_id = v.workspace_id
    WHERE v.id = verification_checks.verification_id AND wm.user_id = auth.uid()))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.identity_verifications v
    JOIN public.workspace_members wm ON wm.workspace_id = v.workspace_id
    WHERE v.id = verification_checks.verification_id AND wm.user_id = auth.uid()));

DROP POLICY IF EXISTS verification_checks_admin_read ON public.verification_checks;
CREATE POLICY verification_checks_admin_read ON public.verification_checks FOR SELECT
  USING (
    public.is_platform_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.marketplace_admin_roles ar WHERE ar.user_id = auth.uid())
  );

-- sanctions_screenings — member ALL on own workspace; admin SELECT all.
DROP POLICY IF EXISTS sanctions_screenings_ws_member ON public.sanctions_screenings;
CREATE POLICY sanctions_screenings_ws_member ON public.sanctions_screenings FOR ALL
  USING (
    workspace_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = sanctions_screenings.workspace_id AND wm.user_id = auth.uid())
  )
  WITH CHECK (
    workspace_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = sanctions_screenings.workspace_id AND wm.user_id = auth.uid())
  );

DROP POLICY IF EXISTS sanctions_screenings_admin_read ON public.sanctions_screenings;
CREATE POLICY sanctions_screenings_admin_read ON public.sanctions_screenings FOR SELECT
  USING (
    public.is_platform_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.marketplace_admin_roles ar WHERE ar.user_id = auth.uid())
  );
