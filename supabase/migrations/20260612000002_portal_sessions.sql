-- ============================================================
-- External Portal Engine — token hardening + portal_sessions
--
-- This migration backs the SECURITY-CRITICAL external portal surface
-- (/portal) that magic-link recipients (landlords / suppliers / tenants)
-- reach WITHOUT a Supabase auth account.
--
-- Two changes, both additive + idempotent:
--   1. Ensure portal_access_tokens stores a SHA-256 token_hash (never the
--      raw token). The grant API mints a high-entropy token, returns it
--      ONCE, and persists only the hash.
--   2. A portal_sessions table: one row per established external session.
--      The session cookie carries a random session token; only its
--      SHA-256 hash is stored here. Validation is fail-closed: a session
--      is usable only when NOT revoked and NOT past expires_at.
--
-- RLS: workspace members may READ their workspace's sessions (audit). All
-- external writes happen via the service-role key from server routes,
-- which bypasses RLS — so there is NO anon/auth INSERT/UPDATE policy. The
-- external user never holds a Postgres role.
-- ============================================================

-- ---- 1. token_hash on portal_access_tokens --------------------------
-- The live portal_access_tokens lineage varies across environments; we
-- only guarantee the column we depend on. ADD COLUMN IF NOT EXISTS is a
-- no-op when the grant API's table already carries it.
ALTER TABLE IF EXISTS portal_access_tokens
  ADD COLUMN IF NOT EXISTS token_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_portal_access_tokens_token_hash
  ON portal_access_tokens(token_hash);

-- ---- 2. portal_sessions ---------------------------------------------
CREATE TABLE IF NOT EXISTS portal_sessions (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  -- The grant/token this session was minted from. No hard FK: the token
  -- table lineage differs across environments, and we never want a session
  -- insert to fail closed-open on a missing constraint target.
  portal_access_id    UUID,
  token_id            UUID,
  contact_id          UUID,
  portal_type         TEXT        NOT NULL,            -- 'supplier' | 'landlord' | 'tenant' | ...
  -- Frozen authorization scope captured at verify time. The server reads
  -- this to constrain EVERY downstream query; it is the scope of record.
  scope               JSONB       NOT NULL DEFAULT '{}'::jsonb,
  session_token_hash  TEXT        NOT NULL,            -- SHA-256 of the cookie's session token
  expires_at          TIMESTAMPTZ NOT NULL,
  revoked             BOOLEAN     NOT NULL DEFAULT false,
  last_seen_at        TIMESTAMPTZ,
  ip                  TEXT,
  user_agent          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portal_sessions_token_hash
  ON portal_sessions(session_token_hash);
CREATE INDEX IF NOT EXISTS idx_portal_sessions_workspace
  ON portal_sessions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_portal_sessions_contact
  ON portal_sessions(contact_id);

ALTER TABLE portal_sessions ENABLE ROW LEVEL SECURITY;

-- Workspace members may READ sessions in their own workspace (for the
-- workspace-side Portals audit view). External users have no DB role, so
-- they are never subject to this policy — they only ever touch this table
-- through the service-role server routes.
DROP POLICY IF EXISTS "Members read portal_sessions" ON portal_sessions;
CREATE POLICY "Members read portal_sessions"
  ON portal_sessions FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

-- NOTE: deliberately NO INSERT/UPDATE/DELETE policy. Writes are
-- service-role only (RLS-bypassing) from the verify / logout / heartbeat
-- server routes. This keeps the external surface fail-closed: nothing with
-- an anon or authed Postgres role can mint or mutate a portal session.

-- ---- 3. Rate-limit ledger for verify attempts -----------------------
-- A simple durable counter the /api/portal/verify route increments per
-- (ip, token_hash_prefix) bucket. Service-role only. Best-effort: the
-- route also keeps an in-memory limiter so this table is optional.
CREATE TABLE IF NOT EXISTS portal_verify_attempts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket      TEXT        NOT NULL,            -- hashed ip|token-prefix bucket key
  attempts    INTEGER     NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (bucket)
);

CREATE INDEX IF NOT EXISTS idx_portal_verify_attempts_window
  ON portal_verify_attempts(window_start);

ALTER TABLE portal_verify_attempts ENABLE ROW LEVEL SECURITY;
-- No policies: service-role only. Members never need to read raw attempts.
