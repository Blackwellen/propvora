-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- PROFILES AND WORKSPACES
-- ==========================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'platform_admin', 'support')),
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  onboarding_step INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'trial' CHECK (plan IN ('trial', 'basic', 'pro', 'business', 'enterprise')),
  plan_status TEXT NOT NULL DEFAULT 'active' CHECK (plan_status IN ('active', 'trialing', 'past_due', 'canceled', 'suspended')),
  trial_ends_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  demo_data_loaded BOOLEAN NOT NULL DEFAULT false,
  demo_data_variant TEXT,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer', 'finance', 'supplier')),
  invited_by UUID REFERENCES profiles(id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- ==========================================
-- PROPERTIES AND PORTFOLIO
-- ==========================================

CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  county TEXT,
  postcode TEXT,
  country TEXT NOT NULL DEFAULT 'GB',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  property_type TEXT CHECK (property_type IN ('house', 'flat', 'hmo', 'commercial', 'mixed_use', 'land', 'other')),
  operation_profile TEXT CHECK (operation_profile IN ('long_term_let', 'rent_to_rent', 'hmo', 'student_let', 'serviced_accommodation', 'holiday_let', 'build_to_rent', 'social_housing', 'commercial', 'mixed_use', 'refinancing', 'dev_flip', 'co_living')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'vacant', 'under_works', 'archived', 'disposed')),
  bedrooms INTEGER,
  bathrooms INTEGER,
  floor_area_sqm DECIMAL(10,2),
  purchase_price DECIMAL(12,2),
  current_value DECIMAL(12,2),
  monthly_mortgage DECIMAL(10,2),
  target_rent DECIMAL(10,2),
  notes TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  cover_image_url TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE property_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_name TEXT NOT NULL,
  unit_type TEXT CHECK (unit_type IN ('room', 'flat', 'studio', 'suite', 'office', 'other')),
  floor INTEGER,
  bedrooms INTEGER DEFAULT 1,
  bathrooms INTEGER DEFAULT 1,
  floor_area_sqm DECIMAL(10,2),
  target_rent DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'vacant' CHECK (status IN ('occupied', 'vacant', 'under_works', 'reserved')),
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tenancies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES property_units(id) ON DELETE SET NULL,
  tenant_contact_id UUID,
  start_date DATE NOT NULL,
  end_date DATE,
  rent_amount DECIMAL(10,2) NOT NULL,
  deposit_amount DECIMAL(10,2),
  deposit_held_by TEXT CHECK (deposit_held_by IN ('landlord', 'scheme', 'agent')),
  deposit_scheme TEXT,
  deposit_reference TEXT,
  rent_frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (rent_frequency IN ('weekly', 'monthly', 'quarterly', 'annually')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'ended', 'disputed', 'surrendered')),
  tenancy_type TEXT CHECK (tenancy_type IN ('ast', 'periodic', 'contractual', 'lodger', 'commercial', 'hmo_room')),
  reference TEXT,
  notes TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- CONTACTS
-- ==========================================

CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_type TEXT NOT NULL DEFAULT 'other' CHECK (contact_type IN ('landlord','tenant','post_tenant','applicant','guarantor','supplier','agent','local_authority','housing_association','legal','accountant','insurer','utility_provider','broadband','cleaning','maintenance','emergency_contractor','investor','affiliate','other')),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company_name TEXT,
  address_line1 TEXT,
  city TEXT,
  postcode TEXT,
  notes TEXT,
  tags TEXT[],
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  is_demo BOOLEAN NOT NULL DEFAULT false,
  avatar_url TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- WORK — TASKS AND JOBS
-- ==========================================

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'waiting', 'blocked', 'done', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category TEXT,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES profiles(id),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','scoped','supplier_requested','quote_received','approved','scheduled','in_progress','complete','invoiced','closed','disputed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  category TEXT,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  supplier_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES profiles(id),
  scheduled_date DATE,
  completed_date DATE,
  quoted_amount DECIMAL(10,2),
  approved_amount DECIMAL(10,2),
  invoiced_amount DECIMAL(10,2),
  reference TEXT,
  notes TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- PLANNING ENGINE
-- ==========================================

CREATE TABLE planning_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  operation_profile TEXT NOT NULL CHECK (operation_profile IN ('long_term_let','rent_to_rent','hmo','student_let','serviced_accommodation','holiday_let','build_to_rent','social_housing','commercial','mixed_use','refinancing','dev_flip','co_living')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','converted','archived')),
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  address TEXT,
  postcode TEXT,

  -- Core financials
  gross_monthly_income DECIMAL(12,2) DEFAULT 0,
  gross_annual_income DECIMAL(12,2) DEFAULT 0,
  total_monthly_expenses DECIMAL(12,2) DEFAULT 0,
  net_monthly_income DECIMAL(12,2) DEFAULT 0,
  net_annual_income DECIMAL(12,2) DEFAULT 0,
  gross_yield DECIMAL(6,4) DEFAULT 0,
  net_yield DECIMAL(6,4) DEFAULT 0,
  roi DECIMAL(6,4) DEFAULT 0,
  upfront_cash_required DECIMAL(12,2) DEFAULT 0,
  breakeven_month INTEGER DEFAULT 0,
  risk_score INTEGER DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),

  notes TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE planning_assumptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  planning_set_id UUID NOT NULL REFERENCES planning_sets(id) ON DELETE CASCADE,
  property_purchase_price DECIMAL(12,2),
  property_value DECIMAL(12,2),
  monthly_mortgage DECIMAL(10,2),
  landlord_monthly_rent DECIMAL(10,2),
  contract_length_months INTEGER,
  break_clause_months INTEGER,
  rent_review_months INTEGER,
  void_allowance_pct DECIMAL(5,4) DEFAULT 0.05,
  management_fee_pct DECIMAL(5,4) DEFAULT 0,
  occupancy_rate_pct DECIMAL(5,4) DEFAULT 0.90,
  average_daily_rate DECIMAL(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE planning_income_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  planning_set_id UUID NOT NULL REFERENCES planning_sets(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  monthly_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  source TEXT,
  notes TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE planning_room_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  planning_set_id UUID NOT NULL REFERENCES planning_sets(id) ON DELETE CASCADE,
  room_label TEXT NOT NULL,
  room_type TEXT DEFAULT 'room',
  monthly_rent DECIMAL(10,2) NOT NULL DEFAULT 0,
  bills_included BOOLEAN DEFAULT false,
  notes TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE planning_expense_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  planning_set_id UUID NOT NULL REFERENCES planning_sets(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  monthly_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  category TEXT,
  notes TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE planning_bill_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  planning_set_id UUID NOT NULL REFERENCES planning_sets(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  monthly_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  provider TEXT,
  notes TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE planning_upfront_costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  planning_set_id UUID NOT NULL REFERENCES planning_sets(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  category TEXT,
  notes TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE planning_landlord_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  planning_set_id UUID REFERENCES planning_sets(id) ON DELETE SET NULL,
  landlord_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  property_address TEXT NOT NULL,
  proposed_rent DECIMAL(10,2) NOT NULL,
  proposed_term_months INTEGER,
  break_clause_months INTEGER,
  management_fee_included BOOLEAN DEFAULT false,
  bills_included BOOLEAN DEFAULT false,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','accepted','rejected','negotiating','expired')),
  sent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- MONEY — INCOME, EXPENSES, INVOICES
-- ==========================================

CREATE TABLE income_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  tenancy_id UUID REFERENCES tenancies(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  category TEXT NOT NULL DEFAULT 'rent',
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GBP',
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('expected','received','late','partial','void')),
  reference TEXT,
  notes TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE expense_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  category TEXT NOT NULL DEFAULT 'maintenance',
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GBP',
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('draft','pending','paid','void')),
  reference TEXT,
  receipt_url TEXT,
  notes TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  invoice_number TEXT,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  invoice_type TEXT NOT NULL DEFAULT 'outbound' CHECK (invoice_type IN ('outbound','supplier')),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'GBP',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','viewed','approved','due','overdue','paid','disputed','cancelled')),
  paid_at TIMESTAMPTZ,
  paid_amount DECIMAL(10,2),
  notes TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- CALENDAR EVENTS
-- ==========================================

CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'reminder' CHECK (event_type IN ('task_due','job_scheduled','tenancy_start','tenancy_end','rent_due','invoice_due','planning_deadline','contact_followup','inspection','viewing','custom')),
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT false,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- MESSAGING
-- ==========================================

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  subject TEXT,
  last_message_at TIMESTAMPTZ,
  unread_count INTEGER DEFAULT 0,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id),
  sender_type TEXT NOT NULL DEFAULT 'user' CHECK (sender_type IN ('user', 'contact', 'ai', 'system')),
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- AI
-- ==========================================

CREATE TABLE ai_chat_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  context_route TEXT,
  context_record_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES ai_chat_threads(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ai_action_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  context JSONB,
  result JSONB,
  approved BOOLEAN,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- SUPPLIER PORTAL
-- ==========================================

CREATE TABLE supplier_portal_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, contact_id)
);

CREATE TABLE supplier_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  supplier_contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned','acknowledged','in_progress','complete','invoiced')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE supplier_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  supplier_job_id UUID REFERENCES supplier_jobs(id),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  invoice_number TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GBP',
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','reviewing','approved','rejected','paid')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- AFFILIATES
-- ==========================================

CREATE TABLE affiliates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','suspended','closed')),
  commission_rate DECIMAL(5,4) NOT NULL DEFAULT 0.20,
  payout_email TEXT,
  notes TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  ip_hash TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES profiles(id),
  workspace_id UUID REFERENCES workspaces(id),
  status TEXT NOT NULL DEFAULT 'signed_up' CHECK (status IN ('signed_up','trial','converted','churned')),
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  referral_id UUID NOT NULL REFERENCES affiliate_referrals(id),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GBP',
  period_start DATE,
  period_end DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','void')),
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- DOCUMENTS
-- ==========================================

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT,
  file_url TEXT,
  file_size INTEGER,
  mime_type TEXT,
  category TEXT,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  tenancy_id UUID REFERENCES tenancies(id) ON DELETE SET NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  planning_set_id UUID REFERENCES planning_sets(id) ON DELETE SET NULL,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- SUBSCRIPTIONS / BILLING
-- ==========================================

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  plan TEXT NOT NULL DEFAULT 'trial',
  status TEXT NOT NULL DEFAULT 'trialing',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- AUDIT / ACTIVITY
-- ==========================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  description TEXT,
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- NOTIFICATIONS
-- ==========================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info','success','warning','error','task','message','payment','ai')),
  resource_type TEXT,
  resource_id UUID,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- FEATURE FLAGS / PLATFORM SETTINGS
-- ==========================================

CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flag_key TEXT UNIQUE NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO feature_flags (flag_key, enabled, description) VALUES
  ('ff_planning_profiles', true, 'Planning engine profiles'),
  ('ff_ai_copilot', true, 'AI Copilot chat bubble'),
  ('ff_supplier_portal', true, 'Supplier portal'),
  ('ff_affiliate_area', true, 'Affiliate area'),
  ('ff_calendar', true, 'Calendar module'),
  ('ff_documents', true, 'Document uploads');
