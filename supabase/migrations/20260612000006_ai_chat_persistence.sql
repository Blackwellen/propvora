-- ============================================================================
-- AI Copilot chat persistence
-- The chat gateway referenced ai_chat_threads / ai_chat_messages but they did
-- not exist in the live DB. This creates them, workspace-scoped with RLS so a
-- user only ever sees threads in workspaces they belong to.
-- Idempotent / additive. Safe to run repeatedly.
-- ============================================================================

-- ── ai_chat_threads ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_chat_threads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL,
  title         TEXT,
  context_route TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_threads_ws ON ai_chat_threads(workspace_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_chat_threads_user ON ai_chat_threads(user_id, updated_at DESC);

ALTER TABLE ai_chat_threads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_chat_threads_member_rw" ON ai_chat_threads;
CREATE POLICY "ai_chat_threads_member_rw" ON ai_chat_threads
  FOR ALL TO authenticated
  USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  )
  WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

-- ── ai_chat_messages ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id    UUID NOT NULL REFERENCES ai_chat_threads(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  role         TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content      TEXT NOT NULL DEFAULT '',
  metadata     JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_thread ON ai_chat_messages(thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_ws ON ai_chat_messages(workspace_id);

ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_chat_messages_member_rw" ON ai_chat_messages;
CREATE POLICY "ai_chat_messages_member_rw" ON ai_chat_messages
  FOR ALL TO authenticated
  USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  )
  WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );
