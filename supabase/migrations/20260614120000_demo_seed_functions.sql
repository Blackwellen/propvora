-- ============================================================================
-- Demo data as a SQL seeder (replaces the hardcoded TypeScript seeder).
--
--   public.seed_demo_workspace(workspace_id, user_id) → batch uuid
--       Loads a coherent demo dataset INTO a real workspace. Every row is
--       stamped demo=true, demo_batch_id=<batch>, demo_expires_at=now()+30d.
--       Called from onboarding and from Settings → Demo data.
--   public.delete_demo_data(workspace_id)
--       Removes every demo row in the workspace (Settings → remove demo data).
--   public.expire_demo_data()
--       Removes demo rows past demo_expires_at across all workspaces
--       (scheduled — 30-day auto-expiry).
--
-- Images are self-hosted under /public/demo/properties/*.jpg so they render
-- under the app's existing CSP img-src 'self' (no external host, no CSP change).
-- ============================================================================

-- ── 0. Uniform demo lifecycle columns on the few tables that lacked them ─────
ALTER TABLE public.message_threads
  ADD COLUMN IF NOT EXISTS demo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS demo_batch_id uuid,
  ADD COLUMN IF NOT EXISTS demo_expires_at timestamptz;

ALTER TABLE public.rent_schedules
  ADD COLUMN IF NOT EXISTS demo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS demo_batch_id uuid,
  ADD COLUMN IF NOT EXISTS demo_expires_at timestamptz;

-- `units` is the canonical unit table the app reads via useUnits (property_units
-- is vestigial). It had no demo lifecycle columns.
ALTER TABLE public.units
  ADD COLUMN IF NOT EXISTS demo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS demo_batch_id uuid,
  ADD COLUMN IF NOT EXISTS demo_expires_at timestamptz;

ALTER TABLE public.compliance_items
  ADD COLUMN IF NOT EXISTS demo_batch_id uuid,
  ADD COLUMN IF NOT EXISTS demo_expires_at timestamptz;

ALTER TABLE public.ppm_plans
  ADD COLUMN IF NOT EXISTS demo_batch_id uuid,
  ADD COLUMN IF NOT EXISTS demo_expires_at timestamptz;

-- ── 1. seed_demo_workspace ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.seed_demo_workspace(
  p_workspace_id uuid,
  p_user_id uuid
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch uuid := gen_random_uuid();
  v_exp   timestamptz := now() + interval '30 days';
  d       date := current_date;
  -- property ids
  p1 uuid; p2 uuid; p3 uuid; p4 uuid; p5 uuid; p6 uuid;
  -- unit ids
  u1 uuid; u2 uuid; u3 uuid; u4 uuid; u5 uuid;
  -- contact ids
  land1 uuid; land2 uuid; ten1 uuid; ten2 uuid; ten3 uuid; sup1 uuid; sup2 uuid;
  -- tenancy ids
  tn1 uuid; tn2 uuid; tn3 uuid;
  -- thread ids
  th1 uuid; th2 uuid;
  -- legal ids
  pcase1 uuid;
BEGIN
  -- Membership guard: only seed workspaces the caller belongs to.
  IF NOT EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = p_workspace_id AND wm.user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Not a member of workspace %', p_workspace_id;
  END IF;

  -- ── Properties (real self-hosted cover photos) ────────────────────────────
  INSERT INTO properties (workspace_id, template, status, nickname, address_line1, city, county, postcode, country,
      bedrooms, bathrooms, floor_area_sqm, category, cover_image_url, target_rent_pcm, epc_rating, epc_expiry,
      hmo_licence_number, hmo_licence_expiry, hmo_max_occupants, notes, demo, demo_batch_id, demo_expires_at, created_by)
  VALUES (p_workspace_id, 'hmo', 'active', '42 Sycamore Road', '42 Sycamore Road', 'Birmingham', 'West Midlands', 'B12 0PQ', 'GB',
      5, 2, 148, 'hmo', '/demo/properties/sycamore-road.jpg', 2750, 'C', d + 280,
      'HMO/2024/0412', d + 95, 5, '5-bed HMO. R2R with Gerald Ashworth. Fully licenced.', true, v_batch, v_exp, p_user_id)
  RETURNING id INTO p1;

  INSERT INTO properties (workspace_id, template, status, nickname, address_line1, city, county, postcode, country,
      bedrooms, bathrooms, floor_area_sqm, category, cover_image_url, target_rent_pcm, epc_rating, epc_expiry,
      notes, demo, demo_batch_id, demo_expires_at, created_by)
  VALUES (p_workspace_id, 'standard_rental', 'active', '88 Hawthorn Street', '88 Hawthorn Street', 'Birmingham', 'West Midlands', 'B6 4EF', 'GB',
      2, 1, 68, 'flat', '/demo/properties/hawthorn-street.jpg', 1050, 'D', d + 45,
      'Ground-floor flat. Good transport links.', true, v_batch, v_exp, p_user_id)
  RETURNING id INTO p2;

  INSERT INTO properties (workspace_id, template, status, nickname, address_line1, city, county, postcode, country,
      bedrooms, bathrooms, floor_area_sqm, category, cover_image_url, target_rent_pcm, epc_rating, epc_expiry,
      hmo_licence_number, hmo_licence_expiry, hmo_max_occupants, notes, demo, demo_batch_id, demo_expires_at, created_by)
  VALUES (p_workspace_id, 'hmo', 'active', '22 Birchfield Lane', '22 Birchfield Lane', 'Wolverhampton', 'West Midlands', 'WV2 1AB', 'GB',
      4, 2, 120, 'hmo', '/demo/properties/birchfield-lane.jpg', 2200, 'C', d + 210,
      'HMO/2023/0188', d + 160, 4, '4-bed HMO. R2R with Patricia Okafor.', true, v_batch, v_exp, p_user_id)
  RETURNING id INTO p3;

  INSERT INTO properties (workspace_id, template, status, nickname, address_line1, city, county, postcode, country,
      bedrooms, bathrooms, floor_area_sqm, category, cover_image_url, target_rent_pcm, epc_rating, epc_expiry,
      notes, demo, demo_batch_id, demo_expires_at, created_by)
  VALUES (p_workspace_id, 'standard_rental', 'void', '15 Chestnut Drive', '15 Chestnut Drive', 'Dudley', 'West Midlands', 'DY1 2QF', 'GB',
      3, 1, 92, 'terraced_house', '/demo/properties/chestnut-drive.jpg', 1250, 'D', d + 120,
      'Recently vacated — turnover in progress.', true, v_batch, v_exp, p_user_id)
  RETURNING id INTO p4;

  INSERT INTO properties (workspace_id, template, status, nickname, address_line1, city, county, postcode, country,
      bedrooms, bathrooms, floor_area_sqm, category, cover_image_url, target_rent_pcm, epc_rating, epc_expiry,
      notes, demo, demo_batch_id, demo_expires_at, created_by)
  VALUES (p_workspace_id, 'sa_lite', 'active', 'Maple Court Apartment', 'Flat 6, Maple Court', 'Birmingham', 'West Midlands', 'B15 3TR', 'GB',
      2, 2, 74, 'flat', '/demo/properties/maple-court.jpg', 1800, 'B', d + 300,
      'Serviced accommodation. City-centre short lets.', true, v_batch, v_exp, p_user_id)
  RETURNING id INTO p5;

  INSERT INTO properties (workspace_id, template, status, nickname, address_line1, city, county, postcode, country,
      bedrooms, bathrooms, floor_area_sqm, category, cover_image_url, target_rent_pcm, epc_rating, epc_expiry,
      notes, demo, demo_batch_id, demo_expires_at, created_by)
  VALUES (p_workspace_id, 'student_let', 'active', 'Oakwood Terrace', '9 Oakwood Terrace', 'Birmingham', 'West Midlands', 'B29 6BT', 'GB',
      6, 3, 165, 'student_accommodation', '/demo/properties/oakwood-terrace.jpg', 3120, 'C', d + 230,
      '6-bed student let. Let by the room, academic year.', true, v_batch, v_exp, p_user_id)
  RETURNING id INTO p6;

  -- ── Units (HMO rooms) — canonical `units` table (read by useUnits) ─────────
  INSERT INTO units (workspace_id, property_id, label, bedrooms, bathrooms, rent_amount, rent_period, status, demo, demo_batch_id, demo_expires_at)
  VALUES (p_workspace_id, p1, 'Room 1', 1, 1, 575, 'monthly', 'occupied', true, v_batch, v_exp) RETURNING id INTO u1;
  INSERT INTO units (workspace_id, property_id, label, bedrooms, bathrooms, rent_amount, rent_period, status, demo, demo_batch_id, demo_expires_at)
  VALUES (p_workspace_id, p1, 'Room 2', 1, 1, 575, 'monthly', 'occupied', true, v_batch, v_exp) RETURNING id INTO u2;
  INSERT INTO units (workspace_id, property_id, label, bedrooms, bathrooms, rent_amount, rent_period, status, demo, demo_batch_id, demo_expires_at)
  VALUES (p_workspace_id, p1, 'Room 3', 1, 1, 575, 'monthly', 'occupied', true, v_batch, v_exp) RETURNING id INTO u3;
  INSERT INTO units (workspace_id, property_id, label, bedrooms, bathrooms, rent_amount, rent_period, status, demo, demo_batch_id, demo_expires_at)
  VALUES (p_workspace_id, p1, 'Room 4', 1, 1, 575, 'monthly', 'available', true, v_batch, v_exp) RETURNING id INTO u4;
  INSERT INTO units (workspace_id, property_id, label, bedrooms, bathrooms, rent_amount, rent_period, status, demo, demo_batch_id, demo_expires_at)
  VALUES (p_workspace_id, p3, 'Room A', 1, 1, 525, 'monthly', 'occupied', true, v_batch, v_exp) RETURNING id INTO u5;

  -- ── Contacts (owners, tenants, suppliers) ─────────────────────────────────
  INSERT INTO contacts (workspace_id, type, display_name, company, email, phone, demo, demo_batch_id, demo_expires_at)
  VALUES (p_workspace_id, 'owner', 'Gerald Ashworth', NULL, 'gerald.ashworth@example.com', '07700 900001', true, v_batch, v_exp) RETURNING id INTO land1;
  INSERT INTO contacts (workspace_id, type, display_name, company, email, phone, demo, demo_batch_id, demo_expires_at)
  VALUES (p_workspace_id, 'owner', 'Patricia Okafor', 'Okafor Properties Ltd', 'p.okafor@example.com', '07700 900002', true, v_batch, v_exp) RETURNING id INTO land2;
  INSERT INTO contacts (workspace_id, type, display_name, email, phone, demo, demo_batch_id, demo_expires_at)
  VALUES (p_workspace_id, 'tenant', 'James Thornton', 'james.thornton@example.com', '07700 900010', true, v_batch, v_exp) RETURNING id INTO ten1;
  INSERT INTO contacts (workspace_id, type, display_name, email, phone, demo, demo_batch_id, demo_expires_at)
  VALUES (p_workspace_id, 'tenant', 'Amara Mensah', 'amara.mensah@example.com', '07700 900011', true, v_batch, v_exp) RETURNING id INTO ten2;
  INSERT INTO contacts (workspace_id, type, display_name, email, phone, demo, demo_batch_id, demo_expires_at)
  VALUES (p_workspace_id, 'tenant', 'Sophie Clarke', 'sophie.clarke@example.com', '07700 900012', true, v_batch, v_exp) RETURNING id INTO ten3;
  INSERT INTO contacts (workspace_id, type, display_name, company, email, phone, is_business, business_name, demo, demo_batch_id, demo_expires_at)
  VALUES (p_workspace_id, 'supplier', 'Dave Patel', 'DPM Maintenance Ltd', 'dave@dpm-maintenance.example.com', '07700 900020', true, 'DPM Maintenance Ltd', true, v_batch, v_exp) RETURNING id INTO sup1;
  INSERT INTO contacts (workspace_id, type, display_name, company, email, phone, is_business, business_name, demo, demo_batch_id, demo_expires_at)
  VALUES (p_workspace_id, 'supplier', 'Rajesh Kapoor', 'Kapoor Gas & Heating', 'rajesh@kapoorgas.example.com', '07700 900021', true, 'Kapoor Gas & Heating', true, v_batch, v_exp) RETURNING id INTO sup2;

  -- ── Tenancies ─────────────────────────────────────────────────────────────
  INSERT INTO tenancies (workspace_id, property_id, unit_id, primary_contact_id, status, start_date, end_date,
      rent_amount, rent_period, deposit_amount, deposit_scheme, demo, demo_batch_id, demo_expires_at)
  VALUES (p_workspace_id, p1, u1, ten1, 'active', d - 420, d + 120, 575, 'monthly', 575, 'DPS', true, v_batch, v_exp) RETURNING id INTO tn1;
  INSERT INTO tenancies (workspace_id, property_id, unit_id, primary_contact_id, status, start_date, end_date,
      rent_amount, rent_period, deposit_amount, deposit_scheme, demo, demo_batch_id, demo_expires_at)
  VALUES (p_workspace_id, p2, NULL, ten2, 'active', d - 300, d + 60, 1050, 'monthly', 1050, 'MyDeposits', true, v_batch, v_exp) RETURNING id INTO tn2;
  INSERT INTO tenancies (workspace_id, property_id, unit_id, primary_contact_id, status, start_date, end_date,
      rent_amount, rent_period, deposit_amount, deposit_scheme, demo, demo_batch_id, demo_expires_at)
  VALUES (p_workspace_id, p3, u5, ten3, 'active', d - 150, d + 210, 525, 'monthly', 525, 'DPS', true, v_batch, v_exp) RETURNING id INTO tn3;

  -- ── Rent schedules (per tenancy: paid last month, due this month, upcoming) ─
  INSERT INTO rent_schedules (workspace_id, tenancy_id, due_date, amount_due, amount_paid, status, demo, demo_batch_id, demo_expires_at)
  SELECT p_workspace_id, t.id, d - 28, t.rent, t.rent, 'paid', true, v_batch, v_exp FROM (VALUES (tn1, 575),(tn2,1050),(tn3,525)) AS t(id, rent);
  INSERT INTO rent_schedules (workspace_id, tenancy_id, due_date, amount_due, amount_paid, status, demo, demo_batch_id, demo_expires_at)
  SELECT p_workspace_id, t.id, d + 2, t.rent, 0, 'due', true, v_batch, v_exp FROM (VALUES (tn1, 575),(tn2,1050),(tn3,525)) AS t(id, rent);
  INSERT INTO rent_schedules (workspace_id, tenancy_id, due_date, amount_due, amount_paid, status, demo, demo_batch_id, demo_expires_at)
  SELECT p_workspace_id, t.id, d + 32, t.rent, 0, 'due', true, v_batch, v_exp FROM (VALUES (tn1, 575),(tn2,1050),(tn3,525)) AS t(id, rent);

  -- ── Tasks ─────────────────────────────────────────────────────────────────
  INSERT INTO tasks (workspace_id, kind, title, description, status, priority, property_id, due_at, demo, demo_batch_id, demo_expires_at, created_by)
  VALUES
    (p_workspace_id, 'maintenance', 'Fix low shower pressure — Room 1', 'James reported low pressure. Book Dave Patel.', 'in_progress', 'high', p1, (d + 3)::timestamptz, true, v_batch, v_exp, p_user_id),
    (p_workspace_id, 'inspection', 'Book end-of-tenancy inspection — 88 Hawthorn Street', 'Tenancy ends in 60 days. Arrange check-out.', 'todo', 'normal', p2, (d + 14)::timestamptz, true, v_batch, v_exp, p_user_id),
    (p_workspace_id, 'turnover', 'Turnover — 15 Chestnut Drive', 'Clean, redecorate, re-advertise.', 'todo', 'high', p4, (d + 7)::timestamptz, true, v_batch, v_exp, p_user_id),
    (p_workspace_id, 'compliance', 'Renew HMO licence — 42 Sycamore Road', 'Submit renewal to Birmingham City Council.', 'todo', 'urgent', p1, (d + 90)::timestamptz, true, v_batch, v_exp, p_user_id);

  -- ── Jobs ──────────────────────────────────────────────────────────────────
  INSERT INTO jobs (workspace_id, title, description, status, priority, category, property_id, supplier_contact_id, scheduled_date, quoted_amount, reference, is_demo, demo, demo_batch_id, demo_expires_at, created_by)
  VALUES
    (p_workspace_id, 'Annual gas safety inspection', 'CP12 for all appliances.', 'scheduled', 'high', 'gas', p1, sup2, d + 12, 95, 'JOB-1001', true, true, v_batch, v_exp, p_user_id),
    (p_workspace_id, 'Repair shower pump — Room 1', 'Low pressure reported by tenant.', 'in_progress', 'high', 'plumbing', p1, sup1, d + 3, 140, 'JOB-1002', true, true, v_batch, v_exp, p_user_id),
    (p_workspace_id, 'Communal deep clean', 'Quarterly clean of shared areas.', 'scheduled', 'medium', 'cleaning', p3, sup1, d + 18, 180, 'JOB-1003', true, true, v_batch, v_exp, p_user_id);

  -- ── Compliance items ──────────────────────────────────────────────────────
  INSERT INTO compliance_items (workspace_id, property_id, kind, title, status, due_date, demo, demo_batch_id, demo_expires_at, created_by)
  VALUES
    (p_workspace_id, p1, 'gas_safety', 'Gas Safety Certificate (CP12)', 'due_soon', d + 12, true, v_batch, v_exp, p_user_id),
    (p_workspace_id, p1, 'fire_alarm', 'Fire alarm service', 'overdue', d - 10, true, v_batch, v_exp, p_user_id),
    (p_workspace_id, p1, 'hmo_licence', 'HMO licence renewal', 'due_soon', d + 95, true, v_batch, v_exp, p_user_id),
    (p_workspace_id, p2, 'eicr', 'Electrical Installation Condition Report', 'ok', d + 400, true, v_batch, v_exp, p_user_id),
    (p_workspace_id, p3, 'gas_safety', 'Gas Safety Certificate (CP12)', 'due_soon', d + 30, true, v_batch, v_exp, p_user_id),
    (p_workspace_id, p2, 'epc', 'Energy Performance Certificate', 'due_soon', d + 45, true, v_batch, v_exp, p_user_id);

  -- ── PPM plans ─────────────────────────────────────────────────────────────
  INSERT INTO ppm_plans (workspace_id, name, category, status, frequency, property_id, supplier_contact_id, next_due_date, estimated_cost, is_demo, demo_batch_id, demo_expires_at, created_by)
  VALUES
    (p_workspace_id, 'Annual gas safety check', 'gas', 'active', 'annual', p1, sup2, d + 40, 95, true, v_batch, v_exp, p_user_id),
    (p_workspace_id, 'Communal area deep clean', 'cleaning', 'active', 'quarterly', p1, sup1, d + 12, 180, true, v_batch, v_exp, p_user_id),
    (p_workspace_id, 'Boiler service', 'heating', 'active', 'annual', p3, sup2, d + 70, 110, true, v_batch, v_exp, p_user_id);

  -- ── Money transactions ────────────────────────────────────────────────────
  INSERT INTO money_transactions (workspace_id, direction, category, amount, currency, occurred_on, property_id, tenancy_id, description, reconciled, demo, demo_batch_id, demo_expires_at, created_by)
  VALUES
    (p_workspace_id, 'in',  'rent', 575,  'GBP', d - 28, p1, tn1, 'Rent — Room 1, James Thornton', true,  true, v_batch, v_exp, p_user_id),
    (p_workspace_id, 'in',  'rent', 1050, 'GBP', d - 28, p2, tn2, 'Rent — 88 Hawthorn Street, Amara Mensah', true, true, v_batch, v_exp, p_user_id),
    (p_workspace_id, 'out', 'maintenance', 140, 'GBP', d - 5, p1, NULL, 'Shower pump repair — DPM Maintenance', false, true, v_batch, v_exp, p_user_id),
    (p_workspace_id, 'out', 'compliance', 95, 'GBP', d - 2, p1, NULL, 'Gas safety inspection — Kapoor Gas', false, true, v_batch, v_exp, p_user_id),
    (p_workspace_id, 'out', 'mortgage', 1850, 'GBP', d - 15, p1, NULL, 'Headlease rent — 42 Sycamore Road', true, true, v_batch, v_exp, p_user_id);

  -- ── Calendar events (native) ──────────────────────────────────────────────
  INSERT INTO calendar_events (workspace_id, title, type, start_date, start_at, end_at, all_day, property_id, metadata, demo, demo_batch_id, demo_expires_at, created_by)
  VALUES
    (p_workspace_id, 'Gas safety inspection — 42 Sycamore Road', 'inspection', d + 12, (d + 12 + time '10:00')::timestamptz, (d + 12 + time '11:00')::timestamptz, false, p1, jsonb_build_object('source_module','compliance'), true, v_batch, v_exp, p_user_id),
    (p_workspace_id, 'Check-out inspection — 88 Hawthorn Street', 'inspection', d + 60, (d + 60 + time '14:00')::timestamptz, (d + 60 + time '15:00')::timestamptz, false, p2, jsonb_build_object('source_module','portfolio'), true, v_batch, v_exp, p_user_id),
    (p_workspace_id, 'Coffee with Gerald — R2R renewal', 'meeting', d + 5, (d + 5 + time '11:00')::timestamptz, (d + 5 + time '12:00')::timestamptz, false, p1, jsonb_build_object('source_module','contacts'), true, v_batch, v_exp, p_user_id);

  -- ── Message threads + messages ────────────────────────────────────────────
  INSERT INTO message_threads (workspace_id, title, type, related_type, related_id, created_by, demo, demo_batch_id, demo_expires_at)
  VALUES (p_workspace_id, 'Room 1 maintenance request', 'tenant', 'contact', ten1, p_user_id, true, v_batch, v_exp) RETURNING id INTO th1;
  INSERT INTO messages (thread_id, workspace_id, sender_id, sender_name, content, demo, demo_batch_id, demo_expires_at, created_at)
  VALUES
    (th1, p_workspace_id, NULL, 'James Thornton', 'Hi, the shower pressure in Room 1 has been low for a few days. Could someone take a look?', true, v_batch, v_exp, now() - interval '5 days'),
    (th1, p_workspace_id, p_user_id, 'You', 'Thanks James — I''ll get Dave Patel booked in this week.', true, v_batch, v_exp, now() - interval '4 days'),
    (th1, p_workspace_id, NULL, 'James Thornton', 'Great, thank you! Mornings work best.', true, v_batch, v_exp, now() - interval '2 days');

  INSERT INTO message_threads (workspace_id, title, type, related_type, related_id, created_by, demo, demo_batch_id, demo_expires_at)
  VALUES (p_workspace_id, 'R2R contract renewal — 42 Sycamore Road', 'landlord', 'contact', land1, p_user_id, true, v_batch, v_exp) RETURNING id INTO th2;
  INSERT INTO messages (thread_id, workspace_id, sender_id, sender_name, content, demo, demo_batch_id, demo_expires_at, created_at)
  VALUES
    (th2, p_workspace_id, p_user_id, 'You', 'Hi Gerald, I''d like to discuss renewing our R2R arrangement — open to a 3-year extension?', true, v_batch, v_exp, now() - interval '10 days'),
    (th2, p_workspace_id, NULL, 'Gerald Ashworth', 'Yes, happy with the arrangement. Could we meet next week? I''d want a small £50/month increase.', true, v_batch, v_exp, now() - interval '8 days');

  -- ── Notifications ─────────────────────────────────────────────────────────
  INSERT INTO notifications (workspace_id, user_id, kind, title, body, severity, demo, demo_batch_id, demo_expires_at)
  VALUES
    (p_workspace_id, p_user_id, 'compliance', 'Fire alarm service overdue — 42 Sycamore Road', 'Overdue by 10 days. Book with Dave Patel.', 'danger', true, v_batch, v_exp),
    (p_workspace_id, p_user_id, 'compliance', 'HMO licence renewal — 95 days remaining', 'Submit renewal to Birmingham City Council.', 'warning', true, v_batch, v_exp),
    (p_workspace_id, p_user_id, 'money', 'Rent due in 2 days', '3 tenancies have rent due this week.', 'info', true, v_batch, v_exp);

  -- ── Legal: HMO licences (review-only records) ─────────────────────────────
  -- Two realistic licences: one valid (Sycamore Road HMO, R2R), one expiring
  -- soon (Birchfield Lane). Stamped demo + 30-day expiry like every other row.
  INSERT INTO hmo_licences (workspace_id, property_id, licence_type, licence_number, issuing_council,
      issue_date, expiry_date, max_occupants, max_households, occupancy_current, arrangement_type,
      r2r_agreement_end, status, conditions, demo, demo_batch_id, demo_expires_at)
  VALUES
    (p_workspace_id, p1, 'mandatory', 'HMO/2024/0412', 'Birmingham City Council',
      d - 270, d + 95, 5, 2, 5, 'rent_to_rent', d + 280, 'active',
      '["Annual gas safety certificate required", "Mains-wired smoke alarms on each floor", "Minimum room sizes per schedule"]'::jsonb,
      true, v_batch, v_exp),
    (p_workspace_id, p2, 'additional', 'HMO/2023/0188', 'Wolverhampton City Council',
      d - 700, d + 40, 4, 2, 4, 'standard', NULL, 'active',
      '["Communal areas kept clear", "Fire doors maintained"]'::jsonb,
      true, v_batch, v_exp);

  -- ── Legal: possession cases (review-only drafts) ──────────────────────────
  -- Case 1: Section 8 rent-arrears draft against tn1 (gathering evidence).
  INSERT INTO possession_cases (workspace_id, tenancy_id, property_id, contact_id, ground, notice_type,
      grounds, notice_period_days, arrears_amount, arrears_weeks, status, notes,
      demo, demo_batch_id, demo_expires_at)
  VALUES
    (p_workspace_id, tn1, p1, ten1, 'Ground 8, Ground 10', 'section_8',
      '[{"id":"g8","number":"Ground 8","name":"Substantial rent arrears","type":"Mandatory","noticeDays":14},{"id":"g10","number":"Ground 10","name":"Some rent arrears","type":"Discretionary","noticeDays":14}]'::jsonb,
      14, 1725, 3, 'gathering_evidence',
      'Demo draft — Room 1 arrears. Review with solicitor before serving.',
      true, v_batch, v_exp) RETURNING id INTO pcase1;

  -- Evidence for case 1 (rent ledger).
  INSERT INTO possession_evidence (workspace_id, possession_case_id, evidence_type, description, amount,
      event_date, source, demo, demo_batch_id, demo_expires_at)
  VALUES
    (p_workspace_id, pcase1, 'other', 'Rent ledger showing 3 weeks arrears', 1725,
      (now() - interval '20 days'), 'manual', true, v_batch, v_exp),
    (p_workspace_id, pcase1, 'other', 'Reminder letter sent to tenant', NULL,
      (now() - interval '10 days'), 'manual', true, v_batch, v_exp);

  -- Case 2: Section 21 no-fault draft against tn3 (notice served, recorded).
  INSERT INTO possession_cases (workspace_id, tenancy_id, property_id, contact_id, ground, notice_type,
      grounds, notice_period_days, status, notice_served_date, notice_expiry_date,
      service_method, service_recipient, notes, demo, demo_batch_id, demo_expires_at)
  VALUES
    (p_workspace_id, tn3, p3, ten3, 'Section 21 (no-fault)', 'section_21',
      '[]'::jsonb, 60, 'notice_served', d - 10, d + 50,
      'First Class Post', 'Sofia Martins',
      'Demo draft — S21 served (recorded offline). Verify validity with solicitor.',
      true, v_batch, v_exp);

  -- Mark workspace as loaded.
  UPDATE workspaces SET demo_data_loaded = true, demo_data_variant = 'full' WHERE id = p_workspace_id;

  RETURN v_batch;
END;
$$;

-- ── 2. delete_demo_data ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.delete_demo_data(p_workspace_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Children first (FK order). messages before threads, schedules before tenancies, units/tenancies before properties.
  DELETE FROM messages           WHERE workspace_id = p_workspace_id AND demo;
  DELETE FROM message_threads    WHERE workspace_id = p_workspace_id AND demo;
  DELETE FROM possession_evidence WHERE workspace_id = p_workspace_id AND demo;
  DELETE FROM possession_cases   WHERE workspace_id = p_workspace_id AND demo;
  DELETE FROM hmo_licences       WHERE workspace_id = p_workspace_id AND demo;
  DELETE FROM rent_schedules     WHERE workspace_id = p_workspace_id AND demo;
  DELETE FROM money_transactions WHERE workspace_id = p_workspace_id AND demo;
  DELETE FROM calendar_events    WHERE workspace_id = p_workspace_id AND demo;
  DELETE FROM ppm_plans          WHERE workspace_id = p_workspace_id AND is_demo;
  DELETE FROM compliance_items   WHERE workspace_id = p_workspace_id AND demo;
  DELETE FROM jobs               WHERE workspace_id = p_workspace_id AND (demo OR is_demo);
  DELETE FROM tasks              WHERE workspace_id = p_workspace_id AND demo;
  DELETE FROM notifications      WHERE workspace_id = p_workspace_id AND demo;
  DELETE FROM tenancies          WHERE workspace_id = p_workspace_id AND demo;
  DELETE FROM units              WHERE workspace_id = p_workspace_id AND demo;
  DELETE FROM contacts           WHERE workspace_id = p_workspace_id AND demo;
  DELETE FROM properties         WHERE workspace_id = p_workspace_id AND demo;

  UPDATE workspaces SET demo_data_loaded = false, demo_data_variant = NULL WHERE id = p_workspace_id;
END;
$$;

-- ── 3. expire_demo_data (30-day auto-expiry; run on a schedule) ──────────────
CREATE OR REPLACE FUNCTION public.expire_demo_data()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer := 0;
  c integer;
BEGIN
  DELETE FROM messages           WHERE demo AND demo_expires_at < now(); GET DIAGNOSTICS c = ROW_COUNT; n := n + c;
  DELETE FROM message_threads    WHERE demo AND demo_expires_at < now(); GET DIAGNOSTICS c = ROW_COUNT; n := n + c;
  DELETE FROM possession_evidence WHERE demo AND demo_expires_at < now(); GET DIAGNOSTICS c = ROW_COUNT; n := n + c;
  DELETE FROM possession_cases   WHERE demo AND demo_expires_at < now(); GET DIAGNOSTICS c = ROW_COUNT; n := n + c;
  DELETE FROM hmo_licences       WHERE demo AND demo_expires_at < now(); GET DIAGNOSTICS c = ROW_COUNT; n := n + c;
  DELETE FROM rent_schedules     WHERE demo AND demo_expires_at < now(); GET DIAGNOSTICS c = ROW_COUNT; n := n + c;
  DELETE FROM money_transactions WHERE demo AND demo_expires_at < now(); GET DIAGNOSTICS c = ROW_COUNT; n := n + c;
  DELETE FROM calendar_events    WHERE demo AND demo_expires_at < now(); GET DIAGNOSTICS c = ROW_COUNT; n := n + c;
  DELETE FROM ppm_plans          WHERE is_demo AND demo_expires_at < now(); GET DIAGNOSTICS c = ROW_COUNT; n := n + c;
  DELETE FROM compliance_items   WHERE demo AND demo_expires_at < now(); GET DIAGNOSTICS c = ROW_COUNT; n := n + c;
  DELETE FROM jobs               WHERE (demo OR is_demo) AND demo_expires_at < now(); GET DIAGNOSTICS c = ROW_COUNT; n := n + c;
  DELETE FROM tasks              WHERE demo AND demo_expires_at < now(); GET DIAGNOSTICS c = ROW_COUNT; n := n + c;
  DELETE FROM notifications      WHERE demo AND demo_expires_at < now(); GET DIAGNOSTICS c = ROW_COUNT; n := n + c;
  DELETE FROM tenancies          WHERE demo AND demo_expires_at < now(); GET DIAGNOSTICS c = ROW_COUNT; n := n + c;
  DELETE FROM units              WHERE demo AND demo_expires_at < now(); GET DIAGNOSTICS c = ROW_COUNT; n := n + c;
  DELETE FROM contacts           WHERE demo AND demo_expires_at < now(); GET DIAGNOSTICS c = ROW_COUNT; n := n + c;
  DELETE FROM properties         WHERE demo AND demo_expires_at < now(); GET DIAGNOSTICS c = ROW_COUNT; n := n + c;

  UPDATE workspaces w SET demo_data_loaded = false, demo_data_variant = NULL
  WHERE demo_data_loaded = true
    AND NOT EXISTS (SELECT 1 FROM properties p WHERE p.workspace_id = w.id AND p.demo);

  RETURN n;
END;
$$;

-- Callable by authenticated app users (functions are SECURITY DEFINER + guarded).
GRANT EXECUTE ON FUNCTION public.seed_demo_workspace(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.delete_demo_data(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.expire_demo_data() TO service_role;
