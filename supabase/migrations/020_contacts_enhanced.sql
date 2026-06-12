-- ============================================================
-- 020_contacts_enhanced.sql
-- Enhanced Contacts module tables.
-- Builds on existing contacts table from 001_core_schema.sql
-- ============================================================

-- Add missing columns to contacts table (if not exists)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS relationship_status TEXT DEFAULT 'active';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_interaction_at TIMESTAMPTZ;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS preferred BOOLEAN DEFAULT false;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS relationship_health TEXT DEFAULT 'good' CHECK (relationship_health IN ('strong', 'good', 'neutral', 'at_risk', 'critical'));
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS mobile TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS is_organisation BOOLEAN DEFAULT false;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS organisation_type TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS primary_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS address_line2 TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'UK';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS follow_up_at TIMESTAMPTZ;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS board_status TEXT DEFAULT 'active';

-- contact_activity: events and interactions
CREATE TABLE IF NOT EXISTS contact_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  entity_type TEXT,
  entity_id UUID,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(12,2),
  status TEXT,
  actor_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  metadata_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- contact_portal_links: secure magic links
CREATE TABLE IF NOT EXISTS contact_portal_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'expired', 'revoked')),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ,
  last_opened_at TIMESTAMPTZ,
  open_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  revoked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- contact_conversations: message threads
CREATE TABLE IF NOT EXISTS contact_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  subject TEXT,
  channel TEXT DEFAULT 'internal' CHECK (channel IN ('internal', 'email', 'sms', 'whatsapp', 'portal')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'archived')),
  last_message_at TIMESTAMPTZ,
  unread_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- contact_messages: individual messages
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES contact_conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'contact', 'system')),
  sender_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  sender_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'note', 'system', 'attachment')),
  read_at TIMESTAMPTZ,
  delivery_status TEXT DEFAULT 'sent' CHECK (delivery_status IN ('draft', 'sent', 'delivered', 'read', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- contact_documents: files linked to contacts
CREATE TABLE IF NOT EXISTS contact_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  document_name TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT,
  file_size_bytes BIGINT,
  storage_path TEXT,
  category TEXT DEFAULT 'general',
  status TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'verified', 'needs_review', 'expiring', 'expired', 'missing', 'requested')),
  expiry_date DATE,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- contact_portal_events: audit log for portal link access
CREATE TABLE IF NOT EXISTS contact_portal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  portal_link_id UUID NOT NULL REFERENCES contact_portal_links(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  ip_hash TEXT,
  user_agent TEXT,
  metadata_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- contact_tasks: follow-up tasks
CREATE TABLE IF NOT EXISTS contact_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
  due_date DATE,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  source_type TEXT,
  source_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE contact_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_portal_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_portal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_tasks ENABLE ROW LEVEL SECURITY;

-- Workspace-scoped SELECT for all new tables
CREATE POLICY "workspace members read contact_activity"
  ON contact_activity FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "workspace members write contact_activity"
  ON contact_activity FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "workspace members read contact_portal_links"
  ON contact_portal_links FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "workspace members manage contact_portal_links"
  ON contact_portal_links FOR ALL
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "workspace members read contact_conversations"
  ON contact_conversations FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "workspace members manage contact_conversations"
  ON contact_conversations FOR ALL
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "workspace members read contact_messages"
  ON contact_messages FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "workspace members manage contact_messages"
  ON contact_messages FOR ALL
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "workspace members read contact_documents"
  ON contact_documents FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "workspace members manage contact_documents"
  ON contact_documents FOR ALL
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "workspace members read contact_portal_events"
  ON contact_portal_events FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "workspace members write contact_portal_events"
  ON contact_portal_events FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "workspace members read contact_tasks"
  ON contact_tasks FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "workspace members manage contact_tasks"
  ON contact_tasks FOR ALL
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_contact_activity_workspace ON contact_activity(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_activity_contact ON contact_activity(contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_portal_links_workspace ON contact_portal_links(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_contact_conversations_workspace ON contact_conversations(workspace_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_conversation ON contact_messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_contact_documents_workspace ON contact_documents(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_documents_contact ON contact_documents(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_tasks_workspace ON contact_tasks(workspace_id, due_date);
CREATE INDEX IF NOT EXISTS idx_contacts_board_status ON contacts(workspace_id, board_status);
CREATE INDEX IF NOT EXISTS idx_contacts_relationship ON contacts(workspace_id, relationship_status);
