-- =============================================================================
-- Wave 4: Messages + Notifications
-- =============================================================================

-- Enable realtime for these tables (done at the end)

-- ─── messages ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id    UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  sender_id       UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject         TEXT        NOT NULL DEFAULT '',
  body            TEXT        NOT NULL DEFAULT '',
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_workspace_idx      ON messages(workspace_id);
CREATE INDEX IF NOT EXISTS messages_sender_idx         ON messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_recipient_idx      ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx     ON messages(created_at DESC);

-- ─── notifications ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id    UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type            TEXT        NOT NULL DEFAULT 'info',
  title           TEXT        NOT NULL DEFAULT '',
  body            TEXT        NOT NULL DEFAULT '',
  resource_type   TEXT,
  resource_id     UUID,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx      ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_workspace_idx    ON notifications(workspace_id);
CREATE INDEX IF NOT EXISTS notifications_unread_idx       ON notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS notifications_created_at_idx   ON notifications(created_at DESC);

-- =============================================================================
-- RLS
-- =============================================================================

ALTER TABLE messages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ─── messages policies ────────────────────────────────────────────────────────

-- SELECT: sender or recipient may read
CREATE POLICY "messages_select_own"
  ON messages FOR SELECT
  USING (
    auth.uid() = sender_id
    OR auth.uid() = recipient_id
  );

-- INSERT: authenticated users may send from themselves
CREATE POLICY "messages_insert_own"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
  );

-- UPDATE: only recipient may update (e.g. mark read)
CREATE POLICY "messages_update_recipient"
  ON messages FOR UPDATE
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- DELETE: only sender may delete their own message
CREATE POLICY "messages_delete_sender"
  ON messages FOR DELETE
  USING (auth.uid() = sender_id);

-- ─── notifications policies ───────────────────────────────────────────────────

-- SELECT: only the owning user
CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: service role / server action inserts on behalf of user
-- Client-side inserts are not expected; allow auth users to insert for themselves
-- (server actions use service_role which bypasses RLS)
CREATE POLICY "notifications_insert_own"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: only the owning user (to mark read)
CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: only the owning user
CREATE POLICY "notifications_delete_own"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- Realtime publication
-- =============================================================================

-- Add tables to the supabase_realtime publication so clients can subscribe
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
