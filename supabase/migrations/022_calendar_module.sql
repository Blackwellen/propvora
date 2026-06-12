-- ============================================================
-- 022_calendar_module.sql
-- Calendar module: events, reminders, layers, views, settings
-- ============================================================

CREATE TABLE IF NOT EXISTS calendar_events (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id         UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title                TEXT NOT NULL,
  description          TEXT,
  event_type           TEXT NOT NULL DEFAULT 'manual',
  source_module        TEXT NOT NULL DEFAULT 'manual' CHECK (source_module IN (
                         'work','supplier','portfolio','planning','money',
                         'contacts','compliance','manual','ai','system'
                       )),
  source_entity_type   TEXT,
  source_entity_id     UUID,
  property_id          UUID REFERENCES properties(id) ON DELETE SET NULL,
  unit_id              UUID,
  tenancy_id           UUID,
  contact_id           UUID REFERENCES contacts(id) ON DELETE SET NULL,
  organisation_id      UUID,
  supplier_id          UUID,
  assigned_to          UUID REFERENCES profiles(id) ON DELETE SET NULL,
  start_at             TIMESTAMPTZ NOT NULL,
  end_at               TIMESTAMPTZ,
  all_day              BOOLEAN NOT NULL DEFAULT false,
  timezone             TEXT NOT NULL DEFAULT 'Europe/London',
  status               TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN (
                         'scheduled','confirmed','awaiting_supplier','tentative',
                         'due_today','due_tomorrow','overdue','urgent',
                         'action_required','completed','cancelled','failed','snoozed'
                       )),
  risk_level           TEXT NOT NULL DEFAULT 'normal' CHECK (risk_level IN (
                         'normal','important','urgent','critical'
                       )),
  priority             INTEGER NOT NULL DEFAULT 5,
  colour_key           TEXT,
  recurrence_rule      TEXT,
  parent_event_id      UUID REFERENCES calendar_events(id) ON DELETE SET NULL,
  location             TEXT,
  metadata_json        JSONB DEFAULT '{}',
  created_by           UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by           UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS calendar_event_links (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id         UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  event_id             UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  linked_entity_type   TEXT NOT NULL,
  linked_entity_id     UUID NOT NULL,
  relationship_type    TEXT NOT NULL DEFAULT 'related',
  created_at           TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS calendar_event_attendees (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id         UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  event_id             UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  attendee_type        TEXT NOT NULL DEFAULT 'contact' CHECK (attendee_type IN (
                         'user','contact','organisation','external'
                       )),
  user_id              UUID REFERENCES profiles(id) ON DELETE SET NULL,
  contact_id           UUID REFERENCES contacts(id) ON DELETE SET NULL,
  organisation_id      UUID,
  email                TEXT,
  response_status      TEXT NOT NULL DEFAULT 'pending' CHECK (response_status IN (
                         'pending','accepted','declined','tentative'
                       )),
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS calendar_reminders (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id         UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  event_id             UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
  source_entity_type   TEXT,
  source_entity_id     UUID,
  title                TEXT NOT NULL,
  reminder_type        TEXT NOT NULL DEFAULT 'standard',
  channel              TEXT NOT NULL DEFAULT 'in_app' CHECK (channel IN (
                         'in_app','email','sms','automated','task_reminder',
                         'money','compliance','push'
                       )),
  due_at               TIMESTAMPTZ NOT NULL,
  sent_at              TIMESTAMPTZ,
  status               TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
                         'pending','sent','failed','snoozed','cancelled'
                       )),
  snoozed_until        TIMESTAMPTZ,
  failure_reason       TEXT,
  created_by           UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by           UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS calendar_layers (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id         UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id              UUID REFERENCES profiles(id) ON DELETE CASCADE,
  source_module        TEXT NOT NULL,
  label                TEXT NOT NULL,
  colour_key           TEXT NOT NULL,
  visible_by_default   BOOLEAN NOT NULL DEFAULT true,
  sort_order           INTEGER NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS calendar_saved_views (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id         UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id              UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  view_type            TEXT NOT NULL,
  name                 TEXT NOT NULL,
  filters_json         JSONB DEFAULT '{}',
  layer_settings_json  JSONB DEFAULT '{}',
  group_by             TEXT,
  sort_json            JSONB DEFAULT '{}',
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS calendar_activity (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id         UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  event_id             UUID REFERENCES calendar_events(id) ON DELETE SET NULL,
  entity_type          TEXT NOT NULL,
  entity_id            UUID,
  action_type          TEXT NOT NULL,
  title                TEXT NOT NULL,
  description          TEXT,
  actor_user_id        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  system_generated     BOOLEAN NOT NULL DEFAULT false,
  metadata_json        JSONB DEFAULT '{}',
  created_at           TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS calendar_settings (
  id                             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id                   UUID NOT NULL UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
  default_view                   TEXT NOT NULL DEFAULT 'week',
  timezone                       TEXT NOT NULL DEFAULT 'Europe/London',
  working_hours_json             JSONB DEFAULT '{"start": "08:00", "end": "18:00", "days": [1,2,3,4,5]}',
  default_reminder_offsets_json  JSONB DEFAULT '[{"amount": 1, "unit": "hours"}, {"amount": 1, "unit": "days"}]',
  visible_layers_json            JSONB DEFAULT '{}',
  ai_suggestions_enabled         BOOLEAN NOT NULL DEFAULT true,
  external_sync_enabled          BOOLEAN NOT NULL DEFAULT false,
  created_at                     TIMESTAMPTZ DEFAULT now(),
  updated_at                     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS calendar_sync_connections (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id           UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider               TEXT NOT NULL CHECK (provider IN ('google','outlook','ical','propvora')),
  status                 TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN (
                           'connected','disconnected','error','syncing'
                         )),
  external_calendar_id   TEXT,
  last_synced_at         TIMESTAMPTZ,
  sync_direction         TEXT NOT NULL DEFAULT 'both' CHECK (sync_direction IN (
                           'import','export','both'
                         )),
  metadata_json          JSONB DEFAULT '{}',
  created_at             TIMESTAMPTZ DEFAULT now(),
  updated_at             TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- Row Level Security
-- ────────────────────────────────────────────────────────────

ALTER TABLE calendar_events            ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_event_links       ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_event_attendees   ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_reminders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_layers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_saved_views       ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_activity          ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_settings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_sync_connections  ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl    TEXT;
  tables TEXT[] := ARRAY[
    'calendar_events',
    'calendar_event_links',
    'calendar_event_attendees',
    'calendar_reminders',
    'calendar_layers',
    'calendar_saved_views',
    'calendar_activity',
    'calendar_settings',
    'calendar_sync_connections'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format(
      'CREATE POLICY "workspace members read %1$s" ON %1$s '
      'FOR SELECT USING ('
      '  workspace_id IN ('
      '    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()'
      '  )'
      ')',
      tbl
    );
    EXECUTE format(
      'CREATE POLICY "workspace members manage %1$s" ON %1$s '
      'FOR ALL USING ('
      '  workspace_id IN ('
      '    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()'
      '  )'
      ')',
      tbl
    );
  END LOOP;
END $$;

-- ────────────────────────────────────────────────────────────
-- Indexes
-- ────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_calendar_events_workspace
  ON calendar_events(workspace_id, start_at);

CREATE INDEX IF NOT EXISTS idx_calendar_events_start
  ON calendar_events(workspace_id, start_at, end_at);

CREATE INDEX IF NOT EXISTS idx_calendar_events_status
  ON calendar_events(workspace_id, status);

CREATE INDEX IF NOT EXISTS idx_calendar_events_source
  ON calendar_events(workspace_id, source_module);

CREATE INDEX IF NOT EXISTS idx_calendar_events_property
  ON calendar_events(property_id, start_at);

CREATE INDEX IF NOT EXISTS idx_calendar_events_assigned
  ON calendar_events(workspace_id, assigned_to);

CREATE INDEX IF NOT EXISTS idx_calendar_events_parent
  ON calendar_events(parent_event_id)
  WHERE parent_event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_calendar_event_links_event
  ON calendar_event_links(event_id);

CREATE INDEX IF NOT EXISTS idx_calendar_event_links_entity
  ON calendar_event_links(linked_entity_type, linked_entity_id);

CREATE INDEX IF NOT EXISTS idx_calendar_event_attendees_event
  ON calendar_event_attendees(event_id);

CREATE INDEX IF NOT EXISTS idx_calendar_reminders_workspace
  ON calendar_reminders(workspace_id, due_at);

CREATE INDEX IF NOT EXISTS idx_calendar_reminders_status
  ON calendar_reminders(workspace_id, status);

CREATE INDEX IF NOT EXISTS idx_calendar_reminders_event
  ON calendar_reminders(event_id)
  WHERE event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_calendar_layers_workspace
  ON calendar_layers(workspace_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_calendar_saved_views_user
  ON calendar_saved_views(workspace_id, user_id);

CREATE INDEX IF NOT EXISTS idx_calendar_activity_workspace
  ON calendar_activity(workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_calendar_activity_event
  ON calendar_activity(event_id)
  WHERE event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_calendar_sync_connections_user
  ON calendar_sync_connections(workspace_id, user_id);
