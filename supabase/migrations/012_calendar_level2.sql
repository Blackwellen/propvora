-- ============================================================
-- 012_calendar_level2.sql
-- Calendar module — additive only, zero modifications to existing tables
-- ============================================================

-- ============================================================
-- 1. calendar_events
-- ============================================================
CREATE TABLE IF NOT EXISTS calendar_events (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title        text        NOT NULL,
  description  text,
  event_type   text        NOT NULL DEFAULT 'manual_event',
  source_type  text        NOT NULL DEFAULT 'manual_event',
  source_id    uuid,
  status       text        NOT NULL DEFAULT 'scheduled',
  risk_level   text        NOT NULL DEFAULT 'normal',
  start_at     timestamptz NOT NULL,
  end_at       timestamptz NOT NULL,
  all_day      boolean     NOT NULL DEFAULT false,
  timezone     text                 DEFAULT 'Europe/London',
  location     text,
  property_id  uuid,
  unit_id      uuid,
  tenancy_id   uuid,
  contact_id   uuid,
  assignee_id  uuid,
  created_by   uuid,
  layer        text        NOT NULL DEFAULT 'manual',
  metadata     jsonb                DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  archived_at  timestamptz
);

-- ============================================================
-- 2. calendar_event_links
-- ============================================================
CREATE TABLE IF NOT EXISTS calendar_event_links (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      uuid        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  calendar_event_id uuid        NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  linked_type       text        NOT NULL,
  linked_id         uuid        NOT NULL,
  relationship_type text,
  metadata          jsonb                DEFAULT '{}',
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. calendar_event_reminders
-- ============================================================
CREATE TABLE IF NOT EXISTS calendar_event_reminders (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      uuid        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  calendar_event_id uuid        NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  reminder_type     text        NOT NULL DEFAULT 'in_app',
  remind_at         timestamptz NOT NULL,
  offset_minutes    integer,
  status            text        NOT NULL DEFAULT 'pending',
  sent_at           timestamptz,
  metadata          jsonb                DEFAULT '{}',
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. calendar_event_recurrence
-- ============================================================
CREATE TABLE IF NOT EXISTS calendar_event_recurrence (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      uuid        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  calendar_event_id uuid        NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  recurrence_rule   text        NOT NULL,
  start_date        date        NOT NULL,
  end_date          date,
  status            text        NOT NULL DEFAULT 'active',
  metadata          jsonb                DEFAULT '{}',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. calendar_event_instances
-- ============================================================
CREATE TABLE IF NOT EXISTS calendar_event_instances (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        uuid        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  recurrence_id       uuid        NOT NULL REFERENCES calendar_event_recurrence(id) ON DELETE CASCADE,
  calendar_event_id   uuid        NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  instance_start_at   timestamptz NOT NULL,
  instance_end_at     timestamptz NOT NULL,
  status              text        NOT NULL DEFAULT 'scheduled',
  metadata            jsonb                DEFAULT '{}',
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 6. calendar_saved_views
-- ============================================================
CREATE TABLE IF NOT EXISTS calendar_saved_views (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      uuid,
  name         text        NOT NULL,
  view_type    text        NOT NULL DEFAULT 'agenda',
  filters      jsonb                DEFAULT '{}',
  layers       jsonb                DEFAULT '{}',
  date_range   jsonb                DEFAULT '{}',
  is_default   boolean              DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 7. calendar_layer_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS calendar_layer_settings (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   uuid        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id        uuid,
  layer          text        NOT NULL,
  is_visible     boolean     NOT NULL DEFAULT true,
  colour_override text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- updated_at triggers (DO loop for all tables with updated_at)
-- ============================================================
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'calendar_events',
    'calendar_event_recurrence',
    'calendar_saved_views'
  ]
  LOOP
    EXECUTE format(
      'CREATE OR REPLACE TRIGGER trg_%I_updated_at
         BEFORE UPDATE ON %I
         FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);',
      tbl, tbl
    );
  END LOOP;
END;
$$;

-- ============================================================
-- Indexes (15+)
-- ============================================================

-- calendar_events
CREATE INDEX IF NOT EXISTS idx_calendar_events_workspace_id
  ON calendar_events (workspace_id);

CREATE INDEX IF NOT EXISTS idx_calendar_events_workspace_start_at
  ON calendar_events (workspace_id, start_at);

CREATE INDEX IF NOT EXISTS idx_calendar_events_workspace_end_at
  ON calendar_events (workspace_id, end_at);

CREATE INDEX IF NOT EXISTS idx_calendar_events_status
  ON calendar_events (workspace_id, status);

CREATE INDEX IF NOT EXISTS idx_calendar_events_source_type
  ON calendar_events (workspace_id, source_type);

CREATE INDEX IF NOT EXISTS idx_calendar_events_layer
  ON calendar_events (workspace_id, layer);

CREATE INDEX IF NOT EXISTS idx_calendar_events_property_id
  ON calendar_events (property_id) WHERE property_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_calendar_events_contact_id
  ON calendar_events (contact_id) WHERE contact_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_calendar_events_assignee_id
  ON calendar_events (assignee_id) WHERE assignee_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_calendar_events_archived_at
  ON calendar_events (archived_at) WHERE archived_at IS NULL;

-- calendar_event_links
CREATE INDEX IF NOT EXISTS idx_calendar_event_links_event_id
  ON calendar_event_links (calendar_event_id);

CREATE INDEX IF NOT EXISTS idx_calendar_event_links_linked
  ON calendar_event_links (linked_type, linked_id);

-- calendar_event_reminders
CREATE INDEX IF NOT EXISTS idx_calendar_event_reminders_event_id
  ON calendar_event_reminders (calendar_event_id);

CREATE INDEX IF NOT EXISTS idx_calendar_event_reminders_remind_at
  ON calendar_event_reminders (remind_at) WHERE status = 'pending';

-- calendar_event_recurrence
CREATE INDEX IF NOT EXISTS idx_calendar_event_recurrence_event_id
  ON calendar_event_recurrence (calendar_event_id);

-- calendar_event_instances
CREATE INDEX IF NOT EXISTS idx_calendar_event_instances_recurrence_id
  ON calendar_event_instances (recurrence_id);

CREATE INDEX IF NOT EXISTS idx_calendar_event_instances_event_id
  ON calendar_event_instances (calendar_event_id);

CREATE INDEX IF NOT EXISTS idx_calendar_event_instances_start_at
  ON calendar_event_instances (workspace_id, instance_start_at);

-- calendar_saved_views
CREATE INDEX IF NOT EXISTS idx_calendar_saved_views_workspace_user
  ON calendar_saved_views (workspace_id, user_id);

-- calendar_layer_settings
CREATE INDEX IF NOT EXISTS idx_calendar_layer_settings_workspace_user
  ON calendar_layer_settings (workspace_id, user_id);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE calendar_events            ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_event_links       ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_event_reminders   ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_event_recurrence  ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_event_instances   ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_saved_views       ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_layer_settings    ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS helper: workspace membership check
-- ============================================================
-- Assumes workspace_members table with columns: workspace_id, user_id, role
-- Roles: owner | admin | manager | member | read_only

-- ---------------------------------------------------------------
-- calendar_events policies
-- ---------------------------------------------------------------
CREATE POLICY "calendar_events_select"
  ON calendar_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = calendar_events.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "calendar_events_insert"
  ON calendar_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = calendar_events.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "calendar_events_update"
  ON calendar_events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = calendar_events.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "calendar_events_delete"
  ON calendar_events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = calendar_events.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

-- ---------------------------------------------------------------
-- calendar_event_links policies
-- ---------------------------------------------------------------
CREATE POLICY "calendar_event_links_select"
  ON calendar_event_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = calendar_event_links.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "calendar_event_links_insert"
  ON calendar_event_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = calendar_event_links.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "calendar_event_links_update"
  ON calendar_event_links FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = calendar_event_links.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "calendar_event_links_delete"
  ON calendar_event_links FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = calendar_event_links.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

-- ---------------------------------------------------------------
-- calendar_event_reminders policies
-- ---------------------------------------------------------------
CREATE POLICY "calendar_event_reminders_select"
  ON calendar_event_reminders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = calendar_event_reminders.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "calendar_event_reminders_insert"
  ON calendar_event_reminders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = calendar_event_reminders.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "calendar_event_reminders_update"
  ON calendar_event_reminders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = calendar_event_reminders.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "calendar_event_reminders_delete"
  ON calendar_event_reminders FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = calendar_event_reminders.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

-- ---------------------------------------------------------------
-- calendar_event_recurrence policies
-- ---------------------------------------------------------------
CREATE POLICY "calendar_event_recurrence_select"
  ON calendar_event_recurrence FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = calendar_event_recurrence.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "calendar_event_recurrence_insert"
  ON calendar_event_recurrence FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = calendar_event_recurrence.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "calendar_event_recurrence_update"
  ON calendar_event_recurrence FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = calendar_event_recurrence.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "calendar_event_recurrence_delete"
  ON calendar_event_recurrence FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = calendar_event_recurrence.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

-- ---------------------------------------------------------------
-- calendar_event_instances policies
-- ---------------------------------------------------------------
CREATE POLICY "calendar_event_instances_select"
  ON calendar_event_instances FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = calendar_event_instances.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "calendar_event_instances_insert"
  ON calendar_event_instances FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = calendar_event_instances.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "calendar_event_instances_update"
  ON calendar_event_instances FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = calendar_event_instances.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "calendar_event_instances_delete"
  ON calendar_event_instances FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = calendar_event_instances.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

-- ---------------------------------------------------------------
-- calendar_saved_views policies
-- ---------------------------------------------------------------
CREATE POLICY "calendar_saved_views_select"
  ON calendar_saved_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = calendar_saved_views.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "calendar_saved_views_insert"
  ON calendar_saved_views FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = calendar_saved_views.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "calendar_saved_views_update"
  ON calendar_saved_views FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = calendar_saved_views.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "calendar_saved_views_delete"
  ON calendar_saved_views FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = calendar_saved_views.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

-- ---------------------------------------------------------------
-- calendar_layer_settings policies
-- ---------------------------------------------------------------
CREATE POLICY "calendar_layer_settings_select"
  ON calendar_layer_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = calendar_layer_settings.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "calendar_layer_settings_insert"
  ON calendar_layer_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = calendar_layer_settings.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "calendar_layer_settings_update"
  ON calendar_layer_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = calendar_layer_settings.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "calendar_layer_settings_delete"
  ON calendar_layer_settings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = calendar_layer_settings.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );
