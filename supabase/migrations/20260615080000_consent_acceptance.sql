-- GDPR / PECR compliance: legal-document acceptance log + (optional) durable
-- cookie-consent record.
--
-- legal_acceptances  — an append-only audit of every time a user accepts a
--                      versioned legal document (Terms of Service, Privacy
--                      Policy, etc.). One row per (user, document, version)
--                      acceptance; the most recent row per (user, document) is
--                      the currently-accepted version. Used to prove informed
--                      consent at signup and on policy re-acceptance.
--
-- cookie_consent_log — a server-side mirror of the client cookie-consent choice
--                      (the authoritative client copy lives in a first-party
--                      cookie + localStorage). Storing a row lets us evidence
--                      consent for PECR even if the client clears storage. Rows
--                      are keyed by an anonymous client id for logged-out
--                      visitors, and additionally linked to user_id when known.

-- ── Legal-document acceptances ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.legal_acceptances (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Which document was accepted, e.g. 'terms_of_service', 'privacy_policy'.
  document_type  text NOT NULL
                   CHECK (document_type IN (
                     'terms_of_service',
                     'privacy_policy',
                     'acceptable_use',
                     'data_processing',
                     'cookie_policy',
                     'affiliate_terms'
                   )),
  -- Version string of the document the user agreed to (e.g. '2026-06-15').
  document_version text NOT NULL,
  -- Where the acceptance happened (signup, re-acceptance prompt, onboarding…).
  context        text NOT NULL DEFAULT 'signup'
                   CHECK (context IN ('signup', 're_acceptance', 'onboarding', 'checkout', 'other')),
  -- Optional evidence (kept minimal; no PII beyond what GDPR evidencing needs).
  ip             text,
  user_agent     text,
  accepted_at    timestamptz NOT NULL DEFAULT now(),
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Idempotency: a user accepting the SAME version of the SAME document twice
-- collapses to one row (re-running signup wiring or a double POST is a no-op).
CREATE UNIQUE INDEX IF NOT EXISTS legal_acceptances_unique_version
  ON public.legal_acceptances (user_id, document_type, document_version);

-- Fast "what's the latest version this user accepted for X" lookup.
CREATE INDEX IF NOT EXISTS legal_acceptances_user_doc_idx
  ON public.legal_acceptances (user_id, document_type, accepted_at DESC);

-- ── Cookie-consent log (server-side mirror / evidence) ───────────────────────
CREATE TABLE IF NOT EXISTS public.cookie_consent_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Anonymous, rotating client id from the consent cookie (lets us evidence a
  -- choice for logged-out visitors). Not PII on its own.
  client_id     text,
  -- Linked to the user when the choice was made while signed in.
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Policy version the choice was made against (mirrors CONSENT_VERSION).
  policy_version integer NOT NULL DEFAULT 1,
  necessary     boolean NOT NULL DEFAULT true,  -- always true; recorded for completeness
  analytics     boolean NOT NULL DEFAULT false,
  marketing     boolean NOT NULL DEFAULT false,
  ip            text,
  user_agent    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cookie_consent_log_user_idx
  ON public.cookie_consent_log (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS cookie_consent_log_client_idx
  ON public.cookie_consent_log (client_id, created_at DESC);

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.legal_acceptances  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cookie_consent_log ENABLE ROW LEVEL SECURITY;

-- legal_acceptances: a user can read and insert ONLY their own acceptances.
-- Acceptances are immutable from the client (no UPDATE/DELETE policy → denied).
-- The service role (signup wiring / admin) bypasses RLS.
DROP POLICY IF EXISTS la_select_own ON public.legal_acceptances;
CREATE POLICY la_select_own ON public.legal_acceptances
  FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS la_insert_own ON public.legal_acceptances;
CREATE POLICY la_insert_own ON public.legal_acceptances
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- cookie_consent_log: a signed-in user can read their own rows. Inserts are
-- performed server-side via the service role (anonymous visitors have no
-- auth.uid()), so no client INSERT policy is granted — the table is otherwise
-- write-closed to clients.
DROP POLICY IF EXISTS ccl_select_own ON public.cookie_consent_log;
CREATE POLICY ccl_select_own ON public.cookie_consent_log
  FOR SELECT USING (user_id = auth.uid());
