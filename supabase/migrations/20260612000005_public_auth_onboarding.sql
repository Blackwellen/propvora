-- ============================================================================
-- Public site + Auth + Onboarding finalisation
-- Idempotent / additive only. Safe to run multiple times.
-- ============================================================================

-- ── 1. Workspace onboarding columns ─────────────────────────────────────────
-- The onboarding wizard records the operation profile + business profile on
-- the workspace. These columns were referenced by code but missing in schema.
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS business_type TEXT;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS operation_interests TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS primary_operation_profile TEXT;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- ── 2. Contact requests (public /contact form) ──────────────────────────────
CREATE TABLE IF NOT EXISTS contact_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'contact_form',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','read','replied','archived','spam')),
  ip_hash TEXT,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_requests_created ON contact_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_requests_email ON contact_requests(email);

ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;

-- Anonymous public visitors may INSERT a contact request (anon + authenticated).
DROP POLICY IF EXISTS "contact_requests_public_insert" ON contact_requests;
CREATE POLICY "contact_requests_public_insert" ON contact_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Only platform admins may read them back.
DROP POLICY IF EXISTS "contact_requests_admin_read" ON contact_requests;
CREATE POLICY "contact_requests_admin_read" ON contact_requests
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND platform_role = 'admin')
  );

-- ── 3. Waitlist entries (public marketing waitlist) ─────────────────────────
CREATE TABLE IF NOT EXISTS waitlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT,
  company TEXT,
  source TEXT NOT NULL DEFAULT 'waitlist',
  metadata JSONB NOT NULL DEFAULT '{}',
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(email)
);

CREATE INDEX IF NOT EXISTS idx_waitlist_entries_created ON waitlist_entries(created_at DESC);

ALTER TABLE waitlist_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "waitlist_public_insert" ON waitlist_entries;
CREATE POLICY "waitlist_public_insert" ON waitlist_entries
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "waitlist_admin_read" ON waitlist_entries;
CREATE POLICY "waitlist_admin_read" ON waitlist_entries
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND platform_role = 'admin')
  );

-- ── 4. Workspace invitations (team invite acceptance flow) ──────────────────
CREATE TABLE IF NOT EXISTS workspace_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member','viewer','finance','supplier')),
  token TEXT NOT NULL UNIQUE,
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','revoked','expired')),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workspace_invitations_token ON workspace_invitations(token);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_ws ON workspace_invitations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_email ON workspace_invitations(lower(email));

ALTER TABLE workspace_invitations ENABLE ROW LEVEL SECURITY;

-- Workspace owners/admins manage invitations for their workspace.
DROP POLICY IF EXISTS "workspace_invitations_manage" ON workspace_invitations;
CREATE POLICY "workspace_invitations_manage" ON workspace_invitations
  FOR ALL TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner','admin')
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner','admin')
    )
  );

-- Any authenticated user may read a single invitation (lookup by token happens
-- server-side via service role; this lets an invitee see one addressed to them).
DROP POLICY IF EXISTS "workspace_invitations_invitee_read" ON workspace_invitations;
CREATE POLICY "workspace_invitations_invitee_read" ON workspace_invitations
  FOR SELECT TO authenticated
  USING (
    lower(email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
  );
