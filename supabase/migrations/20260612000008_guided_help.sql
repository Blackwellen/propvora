-- ============================================================================
-- Guided Help / Product Education Engine — per-user tutorial state.
-- One row per (user, tutorial/checklist key). Tutorial CONTENT ships seeded in
-- the app (defaultTutorialTemplates) and is 42P01-safe, so this table only stores
-- progress/dismissal. Per-user (not per-workspace) so a first-use popup is shown
-- once for the user. RLS: a user only ever sees/writes their own rows.
-- Idempotent / additive.
-- ============================================================================

CREATE TABLE IF NOT EXISTS guided_help_state (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL,
  workspace_id  UUID,                          -- context only (nullable)
  key           TEXT NOT NULL,                 -- tutorial/checklist/feature key
  status        TEXT NOT NULL DEFAULT 'seen'
                  CHECK (status IN ('seen','dismissed','completed','snoozed')),
  snoozed_until TIMESTAMPTZ,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, key)
);

CREATE INDEX IF NOT EXISTS idx_guided_help_state_user ON guided_help_state(user_id);

ALTER TABLE guided_help_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "guided_help_state_own" ON guided_help_state;
CREATE POLICY "guided_help_state_own" ON guided_help_state
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
