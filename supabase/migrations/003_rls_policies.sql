-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_assumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_income_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_room_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_expense_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_bill_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_upfront_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_landlord_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_portal_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- HELPER FUNCTIONS
-- ==========================================

-- Helper function: is user a member of workspace?
CREATE OR REPLACE FUNCTION is_workspace_member(ws_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = ws_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function: get user's workspaces
CREATE OR REPLACE FUNCTION user_workspace_ids()
RETURNS SETOF UUID AS $$
  SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function: is platform admin?
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'platform_admin');
$$ LANGUAGE sql SECURITY DEFINER;

-- ==========================================
-- PROFILES
-- ==========================================

CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "Platform admin reads all profiles" ON profiles FOR SELECT USING (is_platform_admin());

-- ==========================================
-- WORKSPACES
-- ==========================================

CREATE POLICY "Members read workspace" ON workspaces FOR SELECT USING (is_workspace_member(id));
CREATE POLICY "Owner updates workspace" ON workspaces FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "User creates workspace" ON workspaces FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Admin reads all workspaces" ON workspaces FOR SELECT USING (is_platform_admin());

-- ==========================================
-- WORKSPACE MEMBERS
-- ==========================================

CREATE POLICY "Members read membership" ON workspace_members FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "User reads own membership" ON workspace_members FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admin or owner manages members" ON workspace_members FOR ALL USING (
  EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = workspace_id AND wm.user_id = auth.uid() AND wm.role IN ('owner','admin'))
);

-- ==========================================
-- PROPERTIES
-- ==========================================

CREATE POLICY "Members read properties" ON properties FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "Members insert properties" ON properties FOR INSERT WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY "Members update properties" ON properties FOR UPDATE USING (is_workspace_member(workspace_id));
CREATE POLICY "Members delete properties" ON properties FOR DELETE USING (is_workspace_member(workspace_id));
CREATE POLICY "Admin reads all properties" ON properties FOR SELECT USING (is_platform_admin());

-- ==========================================
-- PROPERTY UNITS
-- ==========================================

CREATE POLICY "Members read units" ON property_units FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "Members write units" ON property_units FOR ALL USING (is_workspace_member(workspace_id));

-- ==========================================
-- TENANCIES
-- ==========================================

CREATE POLICY "Members read tenancies" ON tenancies FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "Members write tenancies" ON tenancies FOR ALL USING (is_workspace_member(workspace_id));

-- ==========================================
-- CONTACTS
-- ==========================================

CREATE POLICY "Members read contacts" ON contacts FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "Members write contacts" ON contacts FOR ALL USING (is_workspace_member(workspace_id));

-- ==========================================
-- TASKS
-- ==========================================

CREATE POLICY "Members read tasks" ON tasks FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "Members write tasks" ON tasks FOR ALL USING (is_workspace_member(workspace_id));

-- ==========================================
-- JOBS
-- ==========================================

CREATE POLICY "Members read jobs" ON jobs FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "Members write jobs" ON jobs FOR ALL USING (is_workspace_member(workspace_id));

-- ==========================================
-- PLANNING SETS
-- ==========================================

CREATE POLICY "Members read planning sets" ON planning_sets FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "Members write planning sets" ON planning_sets FOR ALL USING (is_workspace_member(workspace_id));

-- PLANNING SUB-TABLES (joined via planning_set_id)
CREATE POLICY "Members read planning sub-tables" ON planning_assumptions FOR ALL USING (
  EXISTS (SELECT 1 FROM planning_sets ps WHERE ps.id = planning_set_id AND is_workspace_member(ps.workspace_id))
);
CREATE POLICY "Members read income lines" ON planning_income_lines FOR ALL USING (
  EXISTS (SELECT 1 FROM planning_sets ps WHERE ps.id = planning_set_id AND is_workspace_member(ps.workspace_id))
);
CREATE POLICY "Members read room lines" ON planning_room_lines FOR ALL USING (
  EXISTS (SELECT 1 FROM planning_sets ps WHERE ps.id = planning_set_id AND is_workspace_member(ps.workspace_id))
);
CREATE POLICY "Members read expense lines" ON planning_expense_lines FOR ALL USING (
  EXISTS (SELECT 1 FROM planning_sets ps WHERE ps.id = planning_set_id AND is_workspace_member(ps.workspace_id))
);
CREATE POLICY "Members read bill lines" ON planning_bill_lines FOR ALL USING (
  EXISTS (SELECT 1 FROM planning_sets ps WHERE ps.id = planning_set_id AND is_workspace_member(ps.workspace_id))
);
CREATE POLICY "Members read upfront costs" ON planning_upfront_costs FOR ALL USING (
  EXISTS (SELECT 1 FROM planning_sets ps WHERE ps.id = planning_set_id AND is_workspace_member(ps.workspace_id))
);

CREATE POLICY "Members read landlord offers" ON planning_landlord_offers FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "Members write landlord offers" ON planning_landlord_offers FOR ALL USING (is_workspace_member(workspace_id));

-- ==========================================
-- MONEY
-- ==========================================

CREATE POLICY "Members read income" ON income_records FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "Members write income" ON income_records FOR ALL USING (is_workspace_member(workspace_id));

CREATE POLICY "Members read expenses" ON expense_records FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "Members write expenses" ON expense_records FOR ALL USING (is_workspace_member(workspace_id));

CREATE POLICY "Members read invoices" ON invoices FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "Members write invoices" ON invoices FOR ALL USING (is_workspace_member(workspace_id));

-- ==========================================
-- CALENDAR
-- ==========================================

CREATE POLICY "Members read calendar" ON calendar_events FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "Members write calendar" ON calendar_events FOR ALL USING (is_workspace_member(workspace_id));

-- ==========================================
-- MESSAGING
-- ==========================================

CREATE POLICY "Members read conversations" ON conversations FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "Members write conversations" ON conversations FOR ALL USING (is_workspace_member(workspace_id));

CREATE POLICY "Members read messages" ON messages FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "Members write messages" ON messages FOR ALL USING (is_workspace_member(workspace_id));

-- ==========================================
-- AI
-- ==========================================

CREATE POLICY "Users read own AI threads" ON ai_chat_threads FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users write own AI threads" ON ai_chat_threads FOR ALL USING (user_id = auth.uid() AND is_workspace_member(workspace_id));

CREATE POLICY "Users read own AI messages" ON ai_chat_messages FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "Users write own AI messages" ON ai_chat_messages FOR ALL USING (is_workspace_member(workspace_id));

CREATE POLICY "Users read own AI actions" ON ai_action_logs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users write own AI actions" ON ai_action_logs FOR INSERT WITH CHECK (user_id = auth.uid() AND is_workspace_member(workspace_id));

-- ==========================================
-- SUPPLIER PORTAL
-- ==========================================

CREATE POLICY "Suppliers read own access" ON supplier_portal_access FOR SELECT USING (user_id = auth.uid() OR is_workspace_member(workspace_id));
CREATE POLICY "Workspace manages supplier access" ON supplier_portal_access FOR ALL USING (is_workspace_member(workspace_id));

CREATE POLICY "Workspace reads supplier jobs" ON supplier_jobs FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "Workspace writes supplier jobs" ON supplier_jobs FOR ALL USING (is_workspace_member(workspace_id));

CREATE POLICY "Workspace reads supplier invoices" ON supplier_invoices FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "Workspace writes supplier invoices" ON supplier_invoices FOR ALL USING (is_workspace_member(workspace_id));

-- ==========================================
-- AFFILIATES
-- ==========================================

CREATE POLICY "Affiliates read own data" ON affiliates FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Affiliates update own data" ON affiliates FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Affiliates insert own" ON affiliates FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin reads all affiliates" ON affiliates FOR SELECT USING (is_platform_admin());
CREATE POLICY "Admin manages affiliates" ON affiliates FOR ALL USING (is_platform_admin());

CREATE POLICY "Affiliates read own clicks" ON affiliate_clicks FOR SELECT USING (
  EXISTS (SELECT 1 FROM affiliates WHERE id = affiliate_id AND user_id = auth.uid())
);

CREATE POLICY "Affiliates read own referrals" ON affiliate_referrals FOR SELECT USING (
  EXISTS (SELECT 1 FROM affiliates WHERE id = affiliate_id AND user_id = auth.uid())
);

CREATE POLICY "Affiliates read own commissions" ON affiliate_commissions FOR SELECT USING (
  EXISTS (SELECT 1 FROM affiliates WHERE id = affiliate_id AND user_id = auth.uid())
);

-- ==========================================
-- DOCUMENTS
-- ==========================================

CREATE POLICY "Members read documents" ON documents FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "Members write documents" ON documents FOR ALL USING (is_workspace_member(workspace_id));

-- ==========================================
-- SUBSCRIPTIONS
-- ==========================================

CREATE POLICY "Members read subscription" ON subscriptions FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "Admin manages subscriptions" ON subscriptions FOR ALL USING (is_platform_admin());

-- ==========================================
-- AUDIT / ACTIVITY / NOTIFICATIONS
-- ==========================================

CREATE POLICY "Members read activity" ON activity_logs FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "Admin reads audit logs" ON audit_logs FOR SELECT USING (is_platform_admin());
CREATE POLICY "System inserts audit" ON audit_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Users read own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System inserts notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());
