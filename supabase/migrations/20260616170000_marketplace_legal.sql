-- ─────────────────────────────────────────────────────────────────────────────
-- MARKETPLACE LEGAL FRAMEWORK
--
-- Extends the existing legal/consent infrastructure (see
-- 20260615080000_consent_acceptance.sql → public.legal_acceptances) for the
-- Propvora MARKETPLACE (stays/booking + supplier services + emergency).
--
-- Why a dedicated pair of tables rather than reusing public.legal_acceptances:
--   * legal_acceptances.document_type carries a CHECK constraint enum scoped to
--     the SaaS docs (terms_of_service, privacy_policy, …) — marketplace policy
--     slugs (marketplace-terms, seller-agreement, …) are not valid there, and we
--     must not widen that enum from a sibling concern.
--   * Marketplace acceptances are workspace-scoped (a seller onboards a
--     workspace; a buyer accepts at checkout) and carry marketplace-specific
--     contexts (seller_onboarding / checkout / booking) that the SaaS log does
--     not model.
-- The two logs are siblings: legal_acceptances = platform/SaaS consent;
-- marketplace_policy_acceptance = marketplace transactional consent. Both share
-- the same RLS shape (user reads own; service role / admin reads all) and the
-- same single legal-entity source of truth (Blackwellen Ltd t/a Propvora).
--
-- Idempotent + additive: safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Marketplace legal documents (registry, server-side mirror of the registry
--    in src/lib/legal/policies.ts; pages render the body content) ─────────────
CREATE TABLE IF NOT EXISTS public.marketplace_legal_documents (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           text NOT NULL UNIQUE
                   CHECK (slug IN (
                     'marketplace-terms',
                     'seller-agreement',
                     'buyer-terms',
                     'refund-policy',
                     'cancellation-policy',
                     'acceptable-use'
                   )),
  title          text NOT NULL,
  version        text NOT NULL,                 -- e.g. '2026-06-16'
  jurisdiction   text NOT NULL DEFAULT 'GB',    -- reviewed jurisdiction; others get a general note
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  body_ref       text,                          -- optional pointer; pages render the content
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- ── Marketplace policy acceptances (append-only consent audit) ───────────────
CREATE TABLE IF NOT EXISTS public.marketplace_policy_acceptance (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   uuid,                          -- nullable: buyer/guest acceptances may be workspace-less
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_slug  text NOT NULL
                   CHECK (document_slug IN (
                     'marketplace-terms',
                     'seller-agreement',
                     'buyer-terms',
                     'refund-policy',
                     'cancellation-policy',
                     'acceptable-use'
                   )),
  version        text NOT NULL,
  context        text NOT NULL DEFAULT 'checkout'
                   CHECK (context IN (
                     'signup',
                     'seller_onboarding',
                     'checkout',
                     'booking',
                     're_acceptance',
                     'other'
                   )),
  ip             text,
  accepted_at    timestamptz NOT NULL DEFAULT now(),
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Idempotency: same user accepting the SAME version of the SAME document
-- collapses to one row (double-POST / re-run of an onboarding step is a no-op).
CREATE UNIQUE INDEX IF NOT EXISTS marketplace_policy_acceptance_unique_version
  ON public.marketplace_policy_acceptance (user_id, document_slug, version);

CREATE INDEX IF NOT EXISTS marketplace_policy_acceptance_user_idx
  ON public.marketplace_policy_acceptance (user_id, document_slug, accepted_at DESC);
CREATE INDEX IF NOT EXISTS marketplace_policy_acceptance_workspace_idx
  ON public.marketplace_policy_acceptance (workspace_id, accepted_at DESC);
CREATE INDEX IF NOT EXISTS marketplace_policy_acceptance_slug_idx
  ON public.marketplace_policy_acceptance (document_slug);

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.marketplace_legal_documents  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_policy_acceptance ENABLE ROW LEVEL SECURITY;

-- Documents are public reference material: anyone (including anon) may read the
-- registry so public legal pages / banners can show the current version + date.
DROP POLICY IF EXISTS mld_select_all ON public.marketplace_legal_documents;
CREATE POLICY mld_select_all ON public.marketplace_legal_documents
  FOR SELECT USING (true);

-- Acceptances: a user reads and inserts ONLY their own rows. Append-only from
-- the client (no UPDATE/DELETE policy → denied). The service role (onboarding /
-- checkout wiring, admin) bypasses RLS for full reads.
DROP POLICY IF EXISTS mpa_select_own ON public.marketplace_policy_acceptance;
CREATE POLICY mpa_select_own ON public.marketplace_policy_acceptance
  FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS mpa_insert_own ON public.marketplace_policy_acceptance;
CREATE POLICY mpa_insert_own ON public.marketplace_policy_acceptance
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ── Seed the current document versions (idempotent upsert) ───────────────────
INSERT INTO public.marketplace_legal_documents (slug, title, version, jurisdiction, effective_from)
VALUES
  ('marketplace-terms',   'Marketplace Terms',      '2026-06-16', 'GB', DATE '2026-06-16'),
  ('seller-agreement',    'Seller Agreement',       '2026-06-16', 'GB', DATE '2026-06-16'),
  ('buyer-terms',         'Buyer Terms',            '2026-06-16', 'GB', DATE '2026-06-16'),
  ('refund-policy',       'Refund Policy',          '2026-06-16', 'GB', DATE '2026-06-16'),
  ('cancellation-policy', 'Cancellation Policy',    '2026-06-16', 'GB', DATE '2026-06-16'),
  ('acceptable-use',      'Marketplace Acceptable Use Policy', '2026-06-16', 'GB', DATE '2026-06-16')
ON CONFLICT (slug) DO UPDATE
  SET title        = EXCLUDED.title,
      version      = EXCLUDED.version,
      jurisdiction = EXCLUDED.jurisdiction,
      effective_from = EXCLUDED.effective_from,
      updated_at   = now();
