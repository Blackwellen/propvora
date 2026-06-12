-- Settings Level 2 migration
-- Adds tables for account/workspace settings (additive only)

-- ── User preferences ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
  density text DEFAULT 'comfortable' CHECK (density IN ('compact', 'comfortable', 'spacious')),
  default_landing_page text DEFAULT '/app/portfolio',
  timezone text DEFAULT 'Europe/London',
  locale text DEFAULT 'en-GB',
  reduced_motion boolean DEFAULT false,
  sidebar_collapsed boolean DEFAULT false,
  calendar_default_view text DEFAULT 'month',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- ── User notification preferences ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  work_reminders boolean DEFAULT true,
  supplier_replies boolean DEFAULT true,
  inbox_messages boolean DEFAULT true,
  ai_approval_requests boolean DEFAULT true,
  calendar_reminders boolean DEFAULT true,
  invoice_alerts boolean DEFAULT true,
  arrears_alerts boolean DEFAULT true,
  compliance_expiry_alerts boolean DEFAULT true,
  planning_offer_alerts boolean DEFAULT true,
  security_alerts boolean DEFAULT true,
  billing_alerts boolean DEFAULT true,
  channel_in_app boolean DEFAULT true,
  channel_email boolean DEFAULT true,
  digest_frequency text DEFAULT 'instant' CHECK (digest_frequency IN ('instant', 'daily', 'weekly', 'off')),
  quiet_hours_start time DEFAULT '22:00',
  quiet_hours_end time DEFAULT '08:00',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- ── Workspace settings ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspace_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL UNIQUE,
  default_currency text DEFAULT 'GBP',
  default_timezone text DEFAULT 'Europe/London',
  default_date_format text DEFAULT 'DD/MM/YYYY',
  default_locale text DEFAULT 'en-GB',
  module_settings jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── Workspace branding ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspace_branding (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL UNIQUE,
  logo_url text,
  favicon_url text,
  primary_color text DEFAULT '#2563EB',
  accent_color text DEFAULT '#059669',
  email_logo_url text,
  invoice_logo_url text,
  portal_logo_url text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── Workspace AI settings ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspace_ai_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL UNIQUE,
  ai_enabled boolean DEFAULT true,
  monthly_credit_limit integer DEFAULT 500,
  daily_action_limit integer DEFAULT 50,
  monthly_action_limit integer DEFAULT 200,
  approval_required boolean DEFAULT true,
  slash_commands_enabled boolean DEFAULT true,
  report_generation_enabled boolean DEFAULT true,
  email_drafting_enabled boolean DEFAULT true,
  action_execution_enabled boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── Workspace AI user limits ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspace_ai_user_limits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_credit_cap integer DEFAULT 100,
  daily_action_cap integer DEFAULT 20,
  allowed_actions jsonb DEFAULT '["*"]',
  blocked_actions jsonb DEFAULT '[]',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- ── Workspace SSO settings ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspace_sso_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL UNIQUE,
  sso_enabled boolean DEFAULT false,
  provider_type text CHECK (provider_type IN ('saml', 'oidc', 'google', 'microsoft')),
  provider_name text,
  metadata_url text,
  entity_id text,
  acs_url text,
  enforce_sso boolean DEFAULT false,
  allow_password_fallback boolean DEFAULT true,
  default_role text DEFAULT 'member',
  status text DEFAULT 'not_configured' CHECK (status IN ('not_configured', 'configured', 'active', 'error')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── Workspace notification settings ──────────────────────────────────
CREATE TABLE IF NOT EXISTS workspace_notification_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL UNIQUE,
  work_reminders boolean DEFAULT true,
  supplier_reply_notifications boolean DEFAULT true,
  invoice_due_alerts boolean DEFAULT true,
  arrears_alerts boolean DEFAULT true,
  compliance_expiry_alerts boolean DEFAULT true,
  planning_offer_expiry_alerts boolean DEFAULT true,
  ai_approval_notifications boolean DEFAULT true,
  team_invite_notifications boolean DEFAULT true,
  security_alerts boolean DEFAULT true,
  billing_alerts boolean DEFAULT true,
  channel_in_app boolean DEFAULT true,
  channel_email boolean DEFAULT true,
  digest_frequency text DEFAULT 'instant',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── Workspace security settings ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspace_security_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL UNIQUE,
  require_mfa_admins boolean DEFAULT false,
  require_mfa_all boolean DEFAULT false,
  session_timeout_minutes integer DEFAULT 1440,
  invite_expiry_hours integer DEFAULT 72,
  magic_link_expiry_hours integer DEFAULT 24,
  supplier_portal_link_expiry_days integer DEFAULT 30,
  data_export_restricted boolean DEFAULT false,
  role_change_requires_approval boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── Workspace audit logs ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspace_audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  event_type text NOT NULL,
  target_type text,
  target_id uuid,
  summary text NOT NULL,
  old_values jsonb,
  new_values jsonb,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- ── Workspace white label settings ────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspace_white_label_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL UNIQUE,
  white_label_enabled boolean DEFAULT false,
  custom_brand_name text,
  custom_domain text,
  hide_propvora_branding boolean DEFAULT false,
  custom_support_email text,
  custom_footer text,
  custom_portal_branding jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── Workspace email settings ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspace_email_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL UNIQUE,
  from_email text,
  reply_to_email text,
  support_email text,
  provider text DEFAULT 'resend' CHECK (provider IN ('resend', 'smtp')),
  resend_configured boolean DEFAULT false,
  smtp_configured boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── Workspace storage settings ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspace_storage_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL UNIQUE,
  provider text DEFAULT 'supabase' CHECK (provider IN ('supabase', 'r2', 's3')),
  storage_limit_gb numeric DEFAULT 10,
  file_size_limit_mb integer DEFAULT 25,
  allowed_types jsonb DEFAULT '["image/*","application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"]',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── Row Level Security ────────────────────────────────────────────────
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_ai_user_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_sso_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_white_label_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_storage_settings ENABLE ROW LEVEL SECURITY;

-- ── RLS Policies ──────────────────────────────────────────────────────

-- User preferences: user can only see/edit own
CREATE POLICY "user_preferences_own" ON user_preferences
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "user_notif_prefs_own" ON user_notification_preferences
  FOR ALL USING (user_id = auth.uid());

-- Workspace settings: only workspace owner can read/write
CREATE POLICY "workspace_settings_read" ON workspace_settings
  FOR SELECT USING (
    workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
  );

CREATE POLICY "workspace_settings_write" ON workspace_settings
  FOR ALL USING (
    workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
  );

CREATE POLICY "workspace_branding_read" ON workspace_branding
  FOR SELECT USING (
    workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
  );

CREATE POLICY "workspace_branding_write" ON workspace_branding
  FOR ALL USING (
    workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
  );

CREATE POLICY "workspace_ai_settings_all" ON workspace_ai_settings
  FOR ALL USING (
    workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
  );

CREATE POLICY "workspace_ai_user_limits_all" ON workspace_ai_user_limits
  FOR ALL USING (
    workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
  );

CREATE POLICY "workspace_sso_settings_all" ON workspace_sso_settings
  FOR ALL USING (
    workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
  );

CREATE POLICY "workspace_notif_settings_all" ON workspace_notification_settings
  FOR ALL USING (
    workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
  );

CREATE POLICY "workspace_security_settings_all" ON workspace_security_settings
  FOR ALL USING (
    workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
  );

CREATE POLICY "workspace_audit_logs_read" ON workspace_audit_logs
  FOR SELECT USING (
    workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
  );

CREATE POLICY "workspace_white_label_all" ON workspace_white_label_settings
  FOR ALL USING (
    workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
  );

CREATE POLICY "workspace_email_settings_all" ON workspace_email_settings
  FOR ALL USING (
    workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
  );

CREATE POLICY "workspace_storage_settings_all" ON workspace_storage_settings
  FOR ALL USING (
    workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
  );

-- ── Indexes ───────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_settings_ws ON workspace_settings(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_audit_logs_ws ON workspace_audit_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_audit_logs_created ON workspace_audit_logs(created_at DESC);
