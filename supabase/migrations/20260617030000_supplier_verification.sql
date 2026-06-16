-- ============================================================================
-- SUPPLIER ID VERIFICATION STACK — tiered marketplace gating substrate
--
-- A SUPPLIER-SPECIFIC verification trail, SEPARATE from the P6 individual/
-- workspace KYC module (public.identity_verifications / verification_documents /
-- verification_checks). That module is NOT modified by this migration — this one
-- stands alongside it and is keyed to the SUPPLIER workspace.
--
-- Tiered model (levels.ts is the source of truth for wording):
--   L0 unverified → L1 email → L2 phone → L3 Stripe payout (stripe_connect_accounts)
--   → L4 ID evidence reviewed (docs + selfie, manual) → L5 insurance + licence reviewed.
--
-- COMPLIANCE HONESTY: a status here reflects ONLY evidence an admin reviewed or a
-- provider (Stripe Connect / OCR pre-fill) recorded. NOTHING auto-approves ID,
-- insurance, or a licence. Document / licence / policy NUMBERS are stored MASKED
-- only (e.g. "•••• 1234") — never the full number, never raw bytes (files live in
-- R2, served via the app's authed file URL).
--
-- Fully IDEMPOTENT + purely additive. Conventions mirror
-- 20260616110000_identity_kyc.sql: EXISTS over public.supplier_workspace_members
-- for member RLS; public.is_platform_admin(auth.uid()) + public.marketplace_admin_roles
-- for admin read/write-all; public.update_updated_at() trigger for updated_at.
-- Service-role (server) writes bypass RLS.
-- ============================================================================

-- ── 1. supplier_identity_verifications ──────────────────────────────────────
-- One row per supplier workspace: the canonical verification record + level.
CREATE TABLE IF NOT EXISTS public.supplier_identity_verifications (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_workspace_id  uuid NOT NULL,
  user_id                uuid,                       -- the supplier member who started it
  verification_level     smallint NOT NULL DEFAULT 0
                           CHECK (verification_level BETWEEN 0 AND 5),
  status                 text NOT NULL DEFAULT 'unverified'
                           CHECK (status IN ('unverified','in_progress','pending_review',
                                             'verified','rejected','expired','suspended')),
  provider               text NOT NULL DEFAULT 'manual',
  stripe_account_id      text,                       -- mirror of stripe_connect_accounts.stripe_account_id
  document_check_status  text NOT NULL DEFAULT 'not_started'
                           CHECK (document_check_status IN ('not_started','manual_required',
                                                            'in_review','passed','failed')),
  selfie_check_status    text NOT NULL DEFAULT 'not_started'
                           CHECK (selfie_check_status IN ('not_started','manual_required',
                                                          'in_review','passed','failed')),
  manual_review_status   text NOT NULL DEFAULT 'not_required'
                           CHECK (manual_review_status IN ('not_required','pending','approved',
                                                           'rejected','more_info')),
  risk_flags             jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at             timestamptz NOT NULL DEFAULT now(),
  verified_at            timestamptz,
  expires_at             timestamptz,
  updated_at             timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.supplier_identity_verifications
  ADD COLUMN IF NOT EXISTS supplier_workspace_id uuid,
  ADD COLUMN IF NOT EXISTS user_id               uuid,
  ADD COLUMN IF NOT EXISTS verification_level    smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status                text NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS provider              text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS stripe_account_id     text,
  ADD COLUMN IF NOT EXISTS document_check_status text NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS selfie_check_status   text NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS manual_review_status  text NOT NULL DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS risk_flags            jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at            timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS verified_at           timestamptz,
  ADD COLUMN IF NOT EXISTS expires_at            timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at            timestamptz NOT NULL DEFAULT now();

-- One canonical verification record per supplier workspace.
CREATE UNIQUE INDEX IF NOT EXISTS uq_supplier_identity_verifications_workspace
  ON public.supplier_identity_verifications (supplier_workspace_id);

-- ── 2. supplier_identity_documents ──────────────────────────────────────────
-- ID evidence. Numbers stored MASKED only; files in R2 (r2_key_*), authed URL only.
CREATE TABLE IF NOT EXISTS public.supplier_identity_documents (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id         uuid NOT NULL REFERENCES public.supplier_identity_verifications(id) ON DELETE CASCADE,
  supplier_workspace_id   uuid NOT NULL,
  doc_type                text NOT NULL
                            CHECK (doc_type IN ('passport','driving_licence','national_id',
                                                'proof_of_address','other')),
  document_country        text,
  document_number_masked  text,                      -- MASKED only, e.g. "•••• 1234"
  expiry_date             date,
  name_on_document        text,
  r2_key_front            text,
  r2_key_back             text,
  r2_key_selfie           text,
  ocr_status              text NOT NULL DEFAULT 'not_run'
                            CHECK (ocr_status IN ('not_run','queued','prefilled','manual_required','failed')),
  status                  text NOT NULL DEFAULT 'uploaded'
                            CHECK (status IN ('uploaded','in_review','accepted','rejected')),
  notes                   text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.supplier_identity_documents
  ADD COLUMN IF NOT EXISTS verification_id        uuid,
  ADD COLUMN IF NOT EXISTS supplier_workspace_id  uuid,
  ADD COLUMN IF NOT EXISTS doc_type               text,
  ADD COLUMN IF NOT EXISTS document_country       text,
  ADD COLUMN IF NOT EXISTS document_number_masked text,
  ADD COLUMN IF NOT EXISTS expiry_date            date,
  ADD COLUMN IF NOT EXISTS name_on_document       text,
  ADD COLUMN IF NOT EXISTS r2_key_front           text,
  ADD COLUMN IF NOT EXISTS r2_key_back            text,
  ADD COLUMN IF NOT EXISTS r2_key_selfie          text,
  ADD COLUMN IF NOT EXISTS ocr_status             text NOT NULL DEFAULT 'not_run',
  ADD COLUMN IF NOT EXISTS status                 text NOT NULL DEFAULT 'uploaded',
  ADD COLUMN IF NOT EXISTS notes                  text,
  ADD COLUMN IF NOT EXISTS created_at             timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at             timestamptz NOT NULL DEFAULT now();

-- ── 3. supplier_business_verifications ──────────────────────────────────────
-- Company / sole-trader registration evidence (Companies House no., VAT, etc).
CREATE TABLE IF NOT EXISTS public.supplier_business_verifications (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id          uuid NOT NULL REFERENCES public.supplier_identity_verifications(id) ON DELETE CASCADE,
  supplier_workspace_id    uuid NOT NULL,
  legal_name               text,
  business_type            text
                             CHECK (business_type IS NULL OR business_type IN
                               ('sole_trader','limited_company','partnership','llp','other')),
  registration_country     text,
  company_number_masked    text,                     -- MASKED only
  vat_number_masked        text,                     -- MASKED only
  registered_address       text,
  r2_key                   text,
  status                   text NOT NULL DEFAULT 'uploaded'
                             CHECK (status IN ('uploaded','in_review','accepted','rejected')),
  notes                    text,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.supplier_business_verifications
  ADD COLUMN IF NOT EXISTS verification_id       uuid,
  ADD COLUMN IF NOT EXISTS supplier_workspace_id uuid,
  ADD COLUMN IF NOT EXISTS legal_name            text,
  ADD COLUMN IF NOT EXISTS business_type         text,
  ADD COLUMN IF NOT EXISTS registration_country  text,
  ADD COLUMN IF NOT EXISTS company_number_masked text,
  ADD COLUMN IF NOT EXISTS vat_number_masked     text,
  ADD COLUMN IF NOT EXISTS registered_address    text,
  ADD COLUMN IF NOT EXISTS r2_key                text,
  ADD COLUMN IF NOT EXISTS status                text NOT NULL DEFAULT 'uploaded',
  ADD COLUMN IF NOT EXISTS notes                 text,
  ADD COLUMN IF NOT EXISTS created_at            timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at            timestamptz NOT NULL DEFAULT now();

-- ── 4. supplier_insurance_policies ──────────────────────────────────────────
-- Insurance evidence + minimum-cover + expiry. Policy numbers MASKED only.
CREATE TABLE IF NOT EXISTS public.supplier_insurance_policies (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id         uuid NOT NULL REFERENCES public.supplier_identity_verifications(id) ON DELETE CASCADE,
  supplier_workspace_id   uuid NOT NULL,
  insurance_type          text NOT NULL
                            CHECK (insurance_type IN ('public_liability','employers_liability',
                                                      'professional_indemnity','contractors_all_risk','other')),
  provider                text,
  policy_number_masked    text,                      -- MASKED only
  coverage_amount_pence   bigint,
  valid_from              date,
  valid_to                date,
  r2_key                  text,
  minimum_cover_met       boolean NOT NULL DEFAULT false,
  status                  text NOT NULL DEFAULT 'uploaded'
                            CHECK (status IN ('uploaded','in_review','accepted','rejected','expired')),
  notes                   text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.supplier_insurance_policies
  ADD COLUMN IF NOT EXISTS verification_id       uuid,
  ADD COLUMN IF NOT EXISTS supplier_workspace_id uuid,
  ADD COLUMN IF NOT EXISTS insurance_type        text,
  ADD COLUMN IF NOT EXISTS provider              text,
  ADD COLUMN IF NOT EXISTS policy_number_masked  text,
  ADD COLUMN IF NOT EXISTS coverage_amount_pence bigint,
  ADD COLUMN IF NOT EXISTS valid_from            date,
  ADD COLUMN IF NOT EXISTS valid_to              date,
  ADD COLUMN IF NOT EXISTS r2_key                text,
  ADD COLUMN IF NOT EXISTS minimum_cover_met     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS status                text NOT NULL DEFAULT 'uploaded',
  ADD COLUMN IF NOT EXISTS notes                 text,
  ADD COLUMN IF NOT EXISTS created_at            timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at            timestamptz NOT NULL DEFAULT now();

-- ── 5. supplier_licence_verifications ───────────────────────────────────────
-- Trade licence / certification evidence + which categories it is required for.
CREATE TABLE IF NOT EXISTS public.supplier_licence_verifications (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id         uuid NOT NULL REFERENCES public.supplier_identity_verifications(id) ON DELETE CASCADE,
  supplier_workspace_id   uuid NOT NULL,
  licence_type            text NOT NULL,             -- e.g. 'gas_safe','niceic','part_p','dbs'
  issuing_body            text,
  licence_number_masked   text,                      -- MASKED only
  country                 text,
  region                  text,
  valid_from              date,
  valid_to                date,
  required_for_categories text[] NOT NULL DEFAULT '{}',
  r2_key                  text,
  status                  text NOT NULL DEFAULT 'uploaded'
                            CHECK (status IN ('uploaded','in_review','accepted','rejected','expired')),
  notes                   text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.supplier_licence_verifications
  ADD COLUMN IF NOT EXISTS verification_id         uuid,
  ADD COLUMN IF NOT EXISTS supplier_workspace_id   uuid,
  ADD COLUMN IF NOT EXISTS licence_type            text,
  ADD COLUMN IF NOT EXISTS issuing_body            text,
  ADD COLUMN IF NOT EXISTS licence_number_masked   text,
  ADD COLUMN IF NOT EXISTS country                 text,
  ADD COLUMN IF NOT EXISTS region                  text,
  ADD COLUMN IF NOT EXISTS valid_from              date,
  ADD COLUMN IF NOT EXISTS valid_to                date,
  ADD COLUMN IF NOT EXISTS required_for_categories text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS r2_key                  text,
  ADD COLUMN IF NOT EXISTS status                  text NOT NULL DEFAULT 'uploaded',
  ADD COLUMN IF NOT EXISTS notes                   text,
  ADD COLUMN IF NOT EXISTS created_at              timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at              timestamptz NOT NULL DEFAULT now();

-- ── 6. supplier_verification_events ─────────────────────────────────────────
-- Append-only event/audit trail of every state change + admin decision.
CREATE TABLE IF NOT EXISTS public.supplier_verification_events (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id         uuid NOT NULL REFERENCES public.supplier_identity_verifications(id) ON DELETE CASCADE,
  supplier_workspace_id   uuid NOT NULL,
  event_type              text NOT NULL,             -- e.g. 'created','email_verified','payout_verified',
                                                      --      'document_uploaded','admin_approved','admin_rejected'
  from_status             text,
  to_status               text,
  actor_user_id           uuid,
  actor_role              text,                      -- 'supplier' | 'admin' | 'system'
  detail                  jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.supplier_verification_events
  ADD COLUMN IF NOT EXISTS verification_id       uuid,
  ADD COLUMN IF NOT EXISTS supplier_workspace_id uuid,
  ADD COLUMN IF NOT EXISTS event_type            text,
  ADD COLUMN IF NOT EXISTS from_status           text,
  ADD COLUMN IF NOT EXISTS to_status             text,
  ADD COLUMN IF NOT EXISTS actor_user_id         uuid,
  ADD COLUMN IF NOT EXISTS actor_role            text,
  ADD COLUMN IF NOT EXISTS detail                jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at            timestamptz NOT NULL DEFAULT now();

-- ── 7. supplier_verification_badges ─────────────────────────────────────────
-- Derived, evidence-reviewed badges. Wording reflects evidence reviewed ONLY.
CREATE TABLE IF NOT EXISTS public.supplier_verification_badges (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id         uuid NOT NULL REFERENCES public.supplier_identity_verifications(id) ON DELETE CASCADE,
  supplier_workspace_id   uuid NOT NULL,
  badge_key               text NOT NULL,             -- 'email','phone','payout','id_evidence','insurance','licence'
  label                   text NOT NULL,             -- honest wording (see levels.ts)
  active                  boolean NOT NULL DEFAULT true,
  granted_at              timestamptz NOT NULL DEFAULT now(),
  expires_at              timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.supplier_verification_badges
  ADD COLUMN IF NOT EXISTS verification_id       uuid,
  ADD COLUMN IF NOT EXISTS supplier_workspace_id uuid,
  ADD COLUMN IF NOT EXISTS badge_key             text,
  ADD COLUMN IF NOT EXISTS label                 text,
  ADD COLUMN IF NOT EXISTS active                boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS granted_at            timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS expires_at            timestamptz,
  ADD COLUMN IF NOT EXISTS created_at            timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at            timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS uq_supplier_verification_badges_key
  ON public.supplier_verification_badges (supplier_workspace_id, badge_key);

-- ── 8. supplier_verification_requirements ───────────────────────────────────
-- Per-supplier (or per-risk-tier) requirement checklist the gating layer reads.
CREATE TABLE IF NOT EXISTS public.supplier_verification_requirements (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_workspace_id   uuid NOT NULL,
  risk_tier               text NOT NULL DEFAULT 'low'
                            CHECK (risk_tier IN ('low','medium','high')),
  requirement_key         text NOT NULL,             -- 'email','phone','payout','id_evidence','insurance','licence','admin_approval'
  category                text,                      -- optional category scoping (e.g. for licence)
  satisfied               boolean NOT NULL DEFAULT false,
  satisfied_at            timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.supplier_verification_requirements
  ADD COLUMN IF NOT EXISTS supplier_workspace_id uuid,
  ADD COLUMN IF NOT EXISTS risk_tier             text NOT NULL DEFAULT 'low',
  ADD COLUMN IF NOT EXISTS requirement_key       text,
  ADD COLUMN IF NOT EXISTS category              text,
  ADD COLUMN IF NOT EXISTS satisfied             boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS satisfied_at          timestamptz,
  ADD COLUMN IF NOT EXISTS created_at            timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at            timestamptz NOT NULL DEFAULT now();

-- ── 9. supplier_verification_risk_flags ─────────────────────────────────────
-- Discrete risk signals raised against a supplier verification (human-reviewed).
CREATE TABLE IF NOT EXISTS public.supplier_verification_risk_flags (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id         uuid NOT NULL REFERENCES public.supplier_identity_verifications(id) ON DELETE CASCADE,
  supplier_workspace_id   uuid NOT NULL,
  flag_type               text NOT NULL,             -- e.g. 'document_mismatch','expired_insurance','suspicious','duplicate'
  severity                text NOT NULL DEFAULT 'medium'
                            CHECK (severity IN ('low','medium','high')),
  detail                  jsonb NOT NULL DEFAULT '{}'::jsonb,
  resolved                boolean NOT NULL DEFAULT false,
  resolved_at             timestamptz,
  resolved_by             uuid,
  created_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.supplier_verification_risk_flags
  ADD COLUMN IF NOT EXISTS verification_id       uuid,
  ADD COLUMN IF NOT EXISTS supplier_workspace_id uuid,
  ADD COLUMN IF NOT EXISTS flag_type             text,
  ADD COLUMN IF NOT EXISTS severity              text NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS detail                jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS resolved              boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS resolved_at           timestamptz,
  ADD COLUMN IF NOT EXISTS resolved_by           uuid,
  ADD COLUMN IF NOT EXISTS created_at            timestamptz NOT NULL DEFAULT now();

-- ── 10. Indexes ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sup_idv_workspace   ON public.supplier_identity_verifications (supplier_workspace_id);
CREATE INDEX IF NOT EXISTS idx_sup_idv_status      ON public.supplier_identity_verifications (status);
CREATE INDEX IF NOT EXISTS idx_sup_idv_level       ON public.supplier_identity_verifications (verification_level);
CREATE INDEX IF NOT EXISTS idx_sup_iddoc_verif     ON public.supplier_identity_documents (verification_id);
CREATE INDEX IF NOT EXISTS idx_sup_iddoc_ws        ON public.supplier_identity_documents (supplier_workspace_id);
CREATE INDEX IF NOT EXISTS idx_sup_biz_verif       ON public.supplier_business_verifications (verification_id);
CREATE INDEX IF NOT EXISTS idx_sup_ins_verif       ON public.supplier_insurance_policies (verification_id);
CREATE INDEX IF NOT EXISTS idx_sup_ins_ws          ON public.supplier_insurance_policies (supplier_workspace_id);
CREATE INDEX IF NOT EXISTS idx_sup_lic_verif       ON public.supplier_licence_verifications (verification_id);
CREATE INDEX IF NOT EXISTS idx_sup_lic_ws          ON public.supplier_licence_verifications (supplier_workspace_id);
CREATE INDEX IF NOT EXISTS idx_sup_ev_verif        ON public.supplier_verification_events (verification_id);
CREATE INDEX IF NOT EXISTS idx_sup_ev_ws           ON public.supplier_verification_events (supplier_workspace_id);
CREATE INDEX IF NOT EXISTS idx_sup_badge_ws        ON public.supplier_verification_badges (supplier_workspace_id);
CREATE INDEX IF NOT EXISTS idx_sup_req_ws          ON public.supplier_verification_requirements (supplier_workspace_id);
CREATE INDEX IF NOT EXISTS idx_sup_riskflag_verif  ON public.supplier_verification_risk_flags (verification_id);
CREATE INDEX IF NOT EXISTS idx_sup_riskflag_ws     ON public.supplier_verification_risk_flags (supplier_workspace_id);

-- ── 11. updated_at triggers ─────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_sup_idv_updated_at ON public.supplier_identity_verifications;
CREATE TRIGGER trg_sup_idv_updated_at BEFORE UPDATE ON public.supplier_identity_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS trg_sup_iddoc_updated_at ON public.supplier_identity_documents;
CREATE TRIGGER trg_sup_iddoc_updated_at BEFORE UPDATE ON public.supplier_identity_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS trg_sup_biz_updated_at ON public.supplier_business_verifications;
CREATE TRIGGER trg_sup_biz_updated_at BEFORE UPDATE ON public.supplier_business_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS trg_sup_ins_updated_at ON public.supplier_insurance_policies;
CREATE TRIGGER trg_sup_ins_updated_at BEFORE UPDATE ON public.supplier_insurance_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS trg_sup_lic_updated_at ON public.supplier_licence_verifications;
CREATE TRIGGER trg_sup_lic_updated_at BEFORE UPDATE ON public.supplier_licence_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS trg_sup_badge_updated_at ON public.supplier_verification_badges;
CREATE TRIGGER trg_sup_badge_updated_at BEFORE UPDATE ON public.supplier_verification_badges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS trg_sup_req_updated_at ON public.supplier_verification_requirements;
CREATE TRIGGER trg_sup_req_updated_at BEFORE UPDATE ON public.supplier_verification_requirements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ── 12. RLS ─────────────────────────────────────────────────────────────────
-- Supplier workspace MEMBERS read their own workspace's rows. Platform admins and
-- marketplace_admin_roles members read/write ALL (the review queue). Service-role
-- (server lib) bypasses RLS entirely.
ALTER TABLE public.supplier_identity_verifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_identity_documents      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_business_verifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_insurance_policies      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_licence_verifications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_verification_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_verification_badges     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_verification_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_verification_risk_flags ENABLE ROW LEVEL SECURITY;

-- Helper predicates inlined per-policy (no SECURITY DEFINER funcs added):
--   member:  EXISTS supplier_workspace_members(workspace_id, user_id=auth.uid())
--   admin:   is_platform_admin(auth.uid()) OR EXISTS marketplace_admin_roles(user_id=auth.uid())

-- supplier_identity_verifications
DROP POLICY IF EXISTS sup_idv_member ON public.supplier_identity_verifications;
CREATE POLICY sup_idv_member ON public.supplier_identity_verifications FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.supplier_workspace_members m
                 WHERE m.workspace_id = supplier_identity_verifications.supplier_workspace_id
                   AND m.user_id = auth.uid()));
DROP POLICY IF EXISTS sup_idv_admin_all ON public.supplier_identity_verifications;
CREATE POLICY sup_idv_admin_all ON public.supplier_identity_verifications FOR ALL
  USING (public.is_platform_admin(auth.uid())
         OR EXISTS (SELECT 1 FROM public.marketplace_admin_roles ar WHERE ar.user_id = auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid())
         OR EXISTS (SELECT 1 FROM public.marketplace_admin_roles ar WHERE ar.user_id = auth.uid()));

-- Generic member-read + admin-all policies for the child tables (resolved by the
-- denormalised supplier_workspace_id column each row carries).
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'supplier_identity_documents','supplier_business_verifications',
    'supplier_insurance_policies','supplier_licence_verifications',
    'supplier_verification_events','supplier_verification_badges',
    'supplier_verification_requirements','supplier_verification_risk_flags'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_member ON public.%I;', t, t);
    EXECUTE format($f$
      CREATE POLICY %I_member ON public.%I FOR SELECT
        USING (EXISTS (SELECT 1 FROM public.supplier_workspace_members m
                       WHERE m.workspace_id = %I.supplier_workspace_id
                         AND m.user_id = auth.uid()));
    $f$, t, t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_admin_all ON public.%I;', t, t);
    EXECUTE format($f$
      CREATE POLICY %I_admin_all ON public.%I FOR ALL
        USING (public.is_platform_admin(auth.uid())
               OR EXISTS (SELECT 1 FROM public.marketplace_admin_roles ar WHERE ar.user_id = auth.uid()))
        WITH CHECK (public.is_platform_admin(auth.uid())
               OR EXISTS (SELECT 1 FROM public.marketplace_admin_roles ar WHERE ar.user_id = auth.uid()));
    $f$, t, t);
  END LOOP;
END $$;
