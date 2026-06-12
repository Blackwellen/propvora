-- ==========================================
-- AUTO-UPDATE UPDATED_AT TIMESTAMPS
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_property_units_updated_at BEFORE UPDATE ON property_units FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_tenancies_updated_at BEFORE UPDATE ON tenancies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_planning_sets_updated_at BEFORE UPDATE ON planning_sets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_ai_threads_updated_at BEFORE UPDATE ON ai_chat_threads FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_affiliates_updated_at BEFORE UPDATE ON affiliates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==========================================
-- AUTO-CREATE PROFILE ON NEW USER
-- ==========================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ==========================================
-- WORKSPACE PORTFOLIO SUMMARY FUNCTION
-- ==========================================

CREATE OR REPLACE FUNCTION get_workspace_portfolio_summary(ws_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_properties', COUNT(DISTINCT p.id),
    'active_properties', COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'active'),
    'total_monthly_rent', COALESCE(SUM(t.rent_amount) FILTER (WHERE t.status = 'active'), 0),
    'active_tenancies', COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'active'),
    'open_tasks', COUNT(DISTINCT tk.id) FILTER (WHERE tk.status IN ('todo','in_progress','waiting')),
    'open_jobs', COUNT(DISTINCT j.id) FILTER (WHERE j.status IN ('new','scoped','approved','in_progress'))
  )
  INTO result
  FROM workspaces w
  LEFT JOIN properties p ON p.workspace_id = w.id
  LEFT JOIN tenancies t ON t.workspace_id = w.id
  LEFT JOIN tasks tk ON tk.workspace_id = w.id
  LEFT JOIN jobs j ON j.workspace_id = w.id
  WHERE w.id = ws_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
