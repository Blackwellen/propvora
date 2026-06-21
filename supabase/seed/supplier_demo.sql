-- ============================================================================
-- SUPPLIER DEMO SEED DATA
-- Realistic UK supplier profiles, jobs, quotes, invoices and reviews.
-- Safe to run multiple times: all inserts use ON CONFLICT DO NOTHING.
-- Amounts: pence (bigint) throughout, matching the live schema.
--
-- Run with:
--   psql $DATABASE_URL -f supabase/seed/supplier_demo.sql
--
-- Reset (truncate relevant tables then re-run):
--   TRUNCATE supplier_workspace_profiles CASCADE;
--   Then re-run this file.
-- ============================================================================

-- ── 0. Variables resolved via subqueries ────────────────────────────────────
-- We resolve a real workspace and property to use as FK anchors.
-- If no workspace/property exists yet, inserts are silently skipped.

DO $$
DECLARE
  -- Workspace anchor: first operator workspace in the system
  v_ws_id        uuid;
  -- Property anchors
  v_prop1        uuid;
  v_prop2        uuid;
  v_prop3        uuid;
  -- Supplier workspace IDs (upserted below)
  sw_plumber     uuid;
  sw_electrician uuid;
  sw_builder     uuid;
  sw_roofer      uuid;
  sw_decorator   uuid;
  sw_gas         uuid;
  sw_locksmith   uuid;
  sw_cleaning    uuid;
  sw_pest        uuid;
  sw_gardener    uuid;
  -- Contact IDs (operator-side manual supplier contacts)
  -- We create them in the operator workspace for job/quote anchoring
  c_plumber      uuid;
  c_electrician  uuid;
  c_builder      uuid;
  c_roofer       uuid;
  c_decorator    uuid;
  c_gas          uuid;
  c_locksmith    uuid;
  c_cleaning     uuid;
  c_pest         uuid;
  c_gardener     uuid;
  -- Misc
  v_job_id       uuid;
  v_inv_id       uuid;
  v_quote_id     uuid;
BEGIN
  -- Resolve workspace anchor
  SELECT id INTO v_ws_id FROM workspaces WHERE type = 'operator' ORDER BY created_at LIMIT 1;
  IF v_ws_id IS NULL THEN
    RAISE NOTICE 'No operator workspace found — skipping supplier demo seed.';
    RETURN;
  END IF;

  -- Resolve property anchors (reuse demo properties if they exist, otherwise first 3 real ones)
  SELECT id INTO v_prop1 FROM properties WHERE workspace_id = v_ws_id ORDER BY created_at LIMIT 1 OFFSET 0;
  SELECT id INTO v_prop2 FROM properties WHERE workspace_id = v_ws_id ORDER BY created_at LIMIT 1 OFFSET 1;
  SELECT id INTO v_prop3 FROM properties WHERE workspace_id = v_ws_id ORDER BY created_at LIMIT 1 OFFSET 2;
  -- Fall back to prop1 if fewer properties exist
  v_prop2 := COALESCE(v_prop2, v_prop1);
  v_prop3 := COALESCE(v_prop3, v_prop1);

  -- ── SECTION 1: SUPPLIER WORKSPACE PROFILES ─────────────────────────────
  -- 10 realistic UK suppliers, mix of sole traders and limited companies.
  -- Each is its own supplier workspace (type = 'supplier').
  -- We upsert the workspaces and then their profiles.

  -- 1. Dave Marsh Plumbing (Sole Trader — verified)
  INSERT INTO workspaces (name, type, slug)
  VALUES ('Dave Marsh Plumbing', 'supplier', 'dave-marsh-plumbing-demo')
  ON CONFLICT (slug) DO NOTHING;

  SELECT id INTO sw_plumber FROM workspaces WHERE slug = 'dave-marsh-plumbing-demo';

  INSERT INTO supplier_workspace_profiles
    (workspace_id, display_name, bio, trades, years_experience, insurance_verified,
     public_liability_cover_pence, service_radius_km, base_location, latitude, longitude,
     response_time_hours, accepts_emergency, status)
  VALUES
    (sw_plumber, 'Dave Marsh Plumbing',
     'Sole trader plumber based in South Birmingham. 18 years'' experience in residential repairs, bathroom installations and landlord services. Gas Safe Reg #514223.',
     ARRAY['plumbing','gas'], 18, true,
     200000000, 20, 'Birmingham B29', 52.4281, -1.9423,
     2, true, 'active')
  ON CONFLICT (workspace_id) DO NOTHING;

  -- 2. NW Electrical Solutions Ltd (Limited Company — verified, NICEIC)
  INSERT INTO workspaces (name, type, slug)
  VALUES ('NW Electrical Solutions Ltd', 'supplier', 'nw-electrical-solutions-demo')
  ON CONFLICT (slug) DO NOTHING;

  SELECT id INTO sw_electrician FROM workspaces WHERE slug = 'nw-electrical-solutions-demo';

  INSERT INTO supplier_workspace_profiles
    (workspace_id, display_name, bio, trades, years_experience, insurance_verified,
     public_liability_cover_pence, service_radius_km, base_location, latitude, longitude,
     response_time_hours, accepts_emergency, status)
  VALUES
    (sw_electrician, 'NW Electrical Solutions Ltd',
     'NICEIC-approved electrical contractor. EICRs, rewires, consumer unit replacements and emergency call-outs across Greater Manchester. NICEIC #20012345.',
     ARRAY['electrical'], 12, true,
     500000000, 30, 'Manchester M14', 53.4577, -2.2248,
     4, true, 'active')
  ON CONFLICT (workspace_id) DO NOTHING;

  -- 3. Hartley General Builders (Limited Company — verified)
  INSERT INTO workspaces (name, type, slug)
  VALUES ('Hartley General Builders Ltd', 'supplier', 'hartley-builders-demo')
  ON CONFLICT (slug) DO NOTHING;

  SELECT id INTO sw_builder FROM workspaces WHERE slug = 'hartley-builders-demo';

  INSERT INTO supplier_workspace_profiles
    (workspace_id, display_name, bio, trades, years_experience, insurance_verified,
     public_liability_cover_pence, service_radius_km, base_location, latitude, longitude,
     response_time_hours, accepts_emergency, status)
  VALUES
    (sw_builder, 'Hartley General Builders',
     'Full-service building contractor specialising in landlord refurbishments, extensions and void turnaround. Operating across West Yorkshire since 2009.',
     ARRAY['general_building','handyman','plastering','tiling'], 15, true,
     1000000000, 35, 'Leeds LS6', 53.8163, -1.5643,
     8, false, 'active')
  ON CONFLICT (workspace_id) DO NOTHING;

  -- 4. Peak Roofing Services (Sole Trader — pending)
  INSERT INTO workspaces (name, type, slug)
  VALUES ('Peak Roofing Services', 'supplier', 'peak-roofing-services-demo')
  ON CONFLICT (slug) DO NOTHING;

  SELECT id INTO sw_roofer FROM workspaces WHERE slug = 'peak-roofing-services-demo';

  INSERT INTO supplier_workspace_profiles
    (workspace_id, display_name, bio, trades, years_experience, insurance_verified,
     public_liability_cover_pence, service_radius_km, base_location, latitude, longitude,
     response_time_hours, accepts_emergency, status)
  VALUES
    (sw_roofer, 'Peak Roofing Services',
     'Specialist residential roofer covering Sheffield and surrounding areas. Repairs, full re-roofs, UPVC guttering and fascia replacement.',
     ARRAY['roofing'], 9, false,
     100000000, 25, 'Sheffield S8', 53.3499, -1.4703,
     12, false, 'active')
  ON CONFLICT (workspace_id) DO NOTHING;

  -- 5. Colour + Craft Decorators (Sole Trader — verified)
  INSERT INTO workspaces (name, type, slug)
  VALUES ('Colour and Craft Decorators', 'supplier', 'colour-craft-decorators-demo')
  ON CONFLICT (slug) DO NOTHING;

  SELECT id INTO sw_decorator FROM workspaces WHERE slug = 'colour-craft-decorators-demo';

  INSERT INTO supplier_workspace_profiles
    (workspace_id, display_name, bio, trades, years_experience, insurance_verified,
     public_liability_cover_pence, service_radius_km, base_location, latitude, longitude,
     response_time_hours, accepts_emergency, status)
  VALUES
    (sw_decorator, 'Colour & Craft Decorators',
     'Professional decorating service for landlords and letting agents. Void prep, full repaints, wallpaper and woodwork. Competitive trade rates. Coventry-based.',
     ARRAY['decorating','painting'], 7, true,
     100000000, 20, 'Coventry CV2', 52.4124, -1.4947,
     24, false, 'active')
  ON CONFLICT (workspace_id) DO NOTHING;

  -- 6. Safeheat Gas Services (Limited Company — verified, Gas Safe)
  INSERT INTO workspaces (name, type, slug)
  VALUES ('Safeheat Gas Services Ltd', 'supplier', 'safeheat-gas-services-demo')
  ON CONFLICT (slug) DO NOTHING;

  SELECT id INTO sw_gas FROM workspaces WHERE slug = 'safeheat-gas-services-demo';

  INSERT INTO supplier_workspace_profiles
    (workspace_id, display_name, bio, trades, years_experience, insurance_verified,
     public_liability_cover_pence, service_radius_km, base_location, latitude, longitude,
     response_time_hours, accepts_emergency, status)
  VALUES
    (sw_gas, 'Safeheat Gas Services Ltd',
     'Gas Safe registered engineers (Reg #600412) for landlord CP12 certificates, boiler servicing, installation and breakdowns. 24/7 emergency cover across Nottingham and Derby.',
     ARRAY['gas','plumbing'], 20, true,
     500000000, 40, 'Nottingham NG7', 52.9558, -1.1725,
     2, true, 'active')
  ON CONFLICT (workspace_id) DO NOTHING;

  -- 7. City Locksmith Services (Sole Trader — verified)
  INSERT INTO workspaces (name, type, slug)
  VALUES ('City Locksmith Services', 'supplier', 'city-locksmith-services-demo')
  ON CONFLICT (slug) DO NOTHING;

  SELECT id INTO sw_locksmith FROM workspaces WHERE slug = 'city-locksmith-services-demo';

  INSERT INTO supplier_workspace_profiles
    (workspace_id, display_name, bio, trades, years_experience, insurance_verified,
     public_liability_cover_pence, service_radius_km, base_location, latitude, longitude,
     response_time_hours, accepts_emergency, status)
  VALUES
    (sw_locksmith, 'City Locksmith Services',
     'Emergency and scheduled locksmith. Lock changes between tenancies, emergency lockouts, uPVC door mechanism repairs and new lock supply. Leicester and surrounding area.',
     ARRAY['locksmith'], 6, true,
     100000000, 15, 'Leicester LE2', 52.6246, -1.1363,
     1, true, 'active')
  ON CONFLICT (workspace_id) DO NOTHING;

  -- 8. Pristine Property Cleaning Co (Limited Company — verified)
  INSERT INTO workspaces (name, type, slug)
  VALUES ('Pristine Property Cleaning Co Ltd', 'supplier', 'pristine-cleaning-demo')
  ON CONFLICT (slug) DO NOTHING;

  SELECT id INTO sw_cleaning FROM workspaces WHERE slug = 'pristine-cleaning-demo';

  INSERT INTO supplier_workspace_profiles
    (workspace_id, display_name, bio, trades, years_experience, insurance_verified,
     public_liability_cover_pence, service_radius_km, base_location, latitude, longitude,
     response_time_hours, accepts_emergency, status)
  VALUES
    (sw_cleaning, 'Pristine Property Cleaning Co',
     'End-of-tenancy, deep clean and regular housekeeping for landlords. Photographic evidence report included with every clean. Operating across the East Midlands.',
     ARRAY['cleaning'], 5, true,
     200000000, 50, 'Nottingham NG1', 52.9540, -1.1526,
     24, false, 'active')
  ON CONFLICT (workspace_id) DO NOTHING;

  -- 9. Midlands Pest Control Ltd (Limited Company — unverified/pending)
  INSERT INTO workspaces (name, type, slug)
  VALUES ('Midlands Pest Control Ltd', 'supplier', 'midlands-pest-control-demo')
  ON CONFLICT (slug) DO NOTHING;

  SELECT id INTO sw_pest FROM workspaces WHERE slug = 'midlands-pest-control-demo';

  INSERT INTO supplier_workspace_profiles
    (workspace_id, display_name, bio, trades, years_experience, insurance_verified,
     public_liability_cover_pence, service_radius_km, base_location, latitude, longitude,
     response_time_hours, accepts_emergency, status)
  VALUES
    (sw_pest, 'Midlands Pest Control Ltd',
     'BPCA-member pest control specialists. Rodents, insects, pigeons and wasps. Fast response across the West and East Midlands. Guaranteed treatments.',
     ARRAY['pest_control'], 11, false,
     100000000, 60, 'Birmingham B5', 52.4719, -1.8992,
     4, true, 'draft')
  ON CONFLICT (workspace_id) DO NOTHING;

  -- 10. Green Edge Garden Services (Sole Trader — verified)
  INSERT INTO workspaces (name, type, slug)
  VALUES ('Green Edge Garden Services', 'supplier', 'green-edge-garden-demo')
  ON CONFLICT (slug) DO NOTHING;

  SELECT id INTO sw_gardener FROM workspaces WHERE slug = 'green-edge-garden-demo';

  INSERT INTO supplier_workspace_profiles
    (workspace_id, display_name, bio, trades, years_experience, insurance_verified,
     public_liability_cover_pence, service_radius_km, base_location, latitude, longitude,
     response_time_hours, accepts_emergency, status)
  VALUES
    (sw_gardener, 'Green Edge Garden Services',
     'Garden maintenance for rental properties: lawn mowing, hedge cutting, clearance and seasonal tidy-ups. Reliable fortnightly or monthly contracts available. Wolverhampton area.',
     ARRAY['gardening'], 4, true,
     50000000, 15, 'Wolverhampton WV6', 52.5985, -2.1390,
     48, false, 'active')
  ON CONFLICT (workspace_id) DO NOTHING;

  -- ── SECTION 2: SUPPLIER SERVICES ───────────────────────────────────────
  -- A handful of services per supplier workspace.

  -- Plumber services
  INSERT INTO supplier_workspace_services
    (workspace_id, name, category, description, pricing_model, rate_pence, callout_fee_pence, active)
  VALUES
    (sw_plumber, 'Emergency Leak Repair', 'plumbing', 'Out-of-hours burst pipe and emergency leak repair.', 'hourly', 9500, 8500, true),
    (sw_plumber, 'Bathroom Suite Installation', 'plumbing', 'Full suite supply and fit including tiling preparation.', 'quote_required', NULL, NULL, true),
    (sw_plumber, 'Radiator Repair or Replacement', 'plumbing', 'Fault diagnosis, power flush or radiator swap.', 'hourly', 7500, 4500, true),
    (sw_plumber, 'Landlord Gas Safety Certificate (CP12)', 'gas', 'Annual Gas Safe inspection and certification for landlords.', 'fixed', 8500, NULL, true)
  ON CONFLICT DO NOTHING;

  -- Electrician services
  INSERT INTO supplier_workspace_services
    (workspace_id, name, category, description, pricing_model, rate_pence, callout_fee_pence, active)
  VALUES
    (sw_electrician, 'Electrical Installation Condition Report (EICR)', 'electrical', 'NICEIC-certified fixed-wiring inspection for landlords. Mandatory every 5 years.', 'fixed', 17500, NULL, true),
    (sw_electrician, 'Consumer Unit Replacement', 'electrical', 'Full metal consumer unit supply and installation to BS 7671.', 'fixed', 45000, NULL, true),
    (sw_electrician, 'Emergency Electrical Fault', 'electrical', 'Fault finding and repair, 24/7 call-out.', 'hourly', 9000, 12000, true),
    (sw_electrician, 'Socket / Switch Replacement', 'electrical', 'Replacement of damaged sockets, switches or back boxes.', 'fixed', 3500, 3000, true)
  ON CONFLICT DO NOTHING;

  -- Gas engineer services
  INSERT INTO supplier_workspace_services
    (workspace_id, name, category, description, pricing_model, rate_pence, callout_fee_pence, active)
  VALUES
    (sw_gas, 'CP12 Gas Safety Certificate', 'gas', 'Annual Gas Safe landlord inspection and certificate.', 'fixed', 7900, NULL, true),
    (sw_gas, 'Boiler Service', 'gas', 'Full boiler service and efficiency check.', 'fixed', 8500, NULL, true),
    (sw_gas, 'Boiler Breakdown / Repair', 'gas', '24/7 emergency boiler repair and parts supply.', 'quote_required', NULL, 9500, true),
    (sw_gas, 'New Boiler Installation', 'gas', 'Supply and install A-rated combination boiler, 10-year warranty available.', 'quote_required', NULL, NULL, true)
  ON CONFLICT DO NOTHING;

  -- Cleaning services
  INSERT INTO supplier_workspace_services
    (workspace_id, name, category, description, pricing_model, rate_pence, callout_fee_pence, active)
  VALUES
    (sw_cleaning, 'End-of-Tenancy Deep Clean', 'cleaning', 'Full deep clean with photographic evidence report. Deposit-dispute ready.', 'fixed', 19500, NULL, true),
    (sw_cleaning, 'Void Property Clean', 'cleaning', 'Full clean of vacant property before remarketing.', 'fixed', 14500, NULL, true),
    (sw_cleaning, 'Regular Maintenance Clean', 'cleaning', 'Fortnightly communal area clean (HMO/block).', 'fixed', 6500, NULL, true)
  ON CONFLICT DO NOTHING;

  -- Locksmith services
  INSERT INTO supplier_workspace_services
    (workspace_id, name, category, description, pricing_model, rate_pence, callout_fee_pence, active)
  VALUES
    (sw_locksmith, 'Tenancy Change Lock', 'locksmith', 'Full cylinder lock change between tenancies. Supply and fit.', 'fixed', 9500, NULL, true),
    (sw_locksmith, 'Emergency Lockout', 'locksmith', 'Non-destructive entry, 60-minute response.', 'fixed', 12000, NULL, true),
    (sw_locksmith, 'uPVC Door Mechanism Repair', 'locksmith', 'Multi-point locking mechanism replacement.', 'quote_required', NULL, 4500, true)
  ON CONFLICT DO NOTHING;

  -- ── SECTION 3: SUPPLIER JOBS (30 jobs across 10 suppliers) ─────────────
  -- All amounts in pence. Dates spread over the last 6 months.

  -- PLUMBER JOBS (4 jobs)
  INSERT INTO supplier_jobs (workspace_id, title, description, status, amount_pence, currency, notes, created_at)
  SELECT v_ws_id, j.title, j.description, j.status, j.amount_pence, 'GBP', j.notes, j.created_at
  FROM (VALUES
    ('Fix leaking radiator in rear bedroom',
     'Radiator in Room 3 leaking at valve joint. Tenant reports wet carpet. Dave Marsh to attend and replace thermostatic valve.',
     'completed', 14500, 'Completed 08:30–10:15. Valve replaced, system re-pressurised. No further action required.',
     now() - interval '5 months'),
    ('Replace kitchen sink waste trap',
     'Waste trap cracked and leaking under sink. Replace P-trap and reseal.',
     'completed', 9500, 'New P-trap fitted, tested under full flow. No leak.',
     now() - interval '3 months'),
    ('Emergency burst pipe — bathroom',
     'Tenant called out of hours: burst pipe behind bathroom panel. Water isolation and repair required.',
     'invoiced', 28500, 'Isolated at stopcock, pipe section replaced, redecoration required — separate quote raised.',
     now() - interval '6 weeks'),
    ('Boiler pressure check and repressurise',
     'Low boiler pressure (0.2 bar). Re-pressurise and check for leaks.',
     'active', 8500, 'In progress — boiler inspection booked.',
     now() - interval '1 week')
  ) AS j(title, description, status, amount_pence, notes, created_at)
  WHERE NOT EXISTS (
    SELECT 1 FROM supplier_jobs x
    WHERE x.workspace_id = v_ws_id AND x.title = j.title
  );

  -- ELECTRICIAN JOBS (4 jobs)
  INSERT INTO supplier_jobs (workspace_id, title, description, status, amount_pence, currency, notes, created_at)
  SELECT v_ws_id, j.title, j.description, j.status, j.amount_pence, 'GBP', j.notes, j.created_at
  FROM (VALUES
    ('EICR — 42 Sycamore Road (5-bed HMO)',
     'Mandatory 5-yearly Electrical Installation Condition Report. All circuits inspected, certificate issued.',
     'completed', 17500, 'C2 observations noted: recommend replacing one socket in kitchen. Remedial quote issued separately.',
     now() - interval '4 months'),
    ('Consumer unit replacement — 88 Hawthorn Street',
     'Existing split-load unit to be replaced with new metal consumer unit, RCBO protection throughout.',
     'completed', 48000, 'New Hager unit installed. Full NICEIC certificate issued. Smoke alarms tested.',
     now() - interval '2 months'),
    ('Emergency — total power loss third floor',
     'Tenant reports complete loss of power to top floor. Emergency call-out.',
     'invoiced', 19500, 'Blown MCB traced to overloaded circuit. Temporary fix in place. Full rewire quote raised.',
     now() - interval '3 weeks'),
    ('Replace 6x damaged sockets — kitchen/hallway',
     'Several sockets cracked or showing scorch marks. Replace with new MK Logic Plus.',
     'active', 18500, 'Parts ordered.',
     now() - interval '5 days')
  ) AS j(title, description, status, amount_pence, notes, created_at)
  WHERE NOT EXISTS (
    SELECT 1 FROM supplier_jobs x
    WHERE x.workspace_id = v_ws_id AND x.title = j.title
  );

  -- BUILDER JOBS (3 jobs)
  INSERT INTO supplier_jobs (workspace_id, title, description, status, amount_pence, currency, notes, created_at)
  SELECT v_ws_id, j.title, j.description, j.status, j.amount_pence, 'GBP', j.notes, j.created_at
  FROM (VALUES
    ('Void refurbishment — 22 Birchfield Lane Room B',
     'Full void refurb: replaster bedroom walls, new carpet, repaint throughout, fix kitchen tiles.',
     'completed', 345000, 'Completed over 8 working days. Snagging signed off by agent.',
     now() - interval '5 months'),
    ('Kitchen worktop replacement',
     'Laminate worktop delaminating. Supply and fit replacement solid wood worktop.',
     'completed', 54000, 'Blum soft-close hinges also replaced while in situ.',
     now() - interval '2 months'),
    ('Patch plaster and redecorate hallway',
     'Water damage from leak above. Dry out, patch plaster, skim, re-paint.',
     'active', 38000, 'Awaiting drying time before skim coat.',
     now() - interval '10 days')
  ) AS j(title, description, status, amount_pence, notes, created_at)
  WHERE NOT EXISTS (
    SELECT 1 FROM supplier_jobs x
    WHERE x.workspace_id = v_ws_id AND x.title = j.title
  );

  -- ROOFER JOBS (3 jobs)
  INSERT INTO supplier_jobs (workspace_id, title, description, status, amount_pence, currency, notes, created_at)
  SELECT v_ws_id, j.title, j.description, j.status, j.amount_pence, 'GBP', j.notes, j.created_at
  FROM (VALUES
    ('Re-point chimney stack and replace flashing',
     'Chimney stack mortar deteriorated. Scaffolding, re-point, replace lead flashing.',
     'completed', 180000, 'Scaffold up/down included. 10-year guarantee issued.',
     now() - interval '4 months'),
    ('Replace broken roof tiles and re-bed ridge',
     '4x broken concrete tiles and loose ridge tiles following storm damage.',
     'completed', 64000, 'Tiles sourced to match. Ridge re-bedded with mortar.',
     now() - interval '6 weeks'),
    ('UPVC guttering replacement — full perimeter',
     'Guttering sagging, joints leaking, causing damp ingress at front bay. Full replacement.',
     'active', 92000, 'Materials delivered, installation booked for next week.',
     now() - interval '3 days')
  ) AS j(title, description, status, amount_pence, notes, created_at)
  WHERE NOT EXISTS (
    SELECT 1 FROM supplier_jobs x
    WHERE x.workspace_id = v_ws_id AND x.title = j.title
  );

  -- DECORATOR JOBS (3 jobs)
  INSERT INTO supplier_jobs (workspace_id, title, description, status, amount_pence, currency, notes, created_at)
  SELECT v_ws_id, j.title, j.description, j.status, j.amount_pence, 'GBP', j.notes, j.created_at
  FROM (VALUES
    ('Full internal repaint — 3-bed flat void',
     'Walls, ceilings, woodwork throughout. 2 coats Dulux trade. Colour: Timeless.',
     'completed', 195000, 'Completed in 4 days. Photos sent to agent.',
     now() - interval '3 months'),
    ('Woodwork refresh — skirting, doors and frames',
     'Sand, fill and repaint all skirting boards, door frames and internal doors.',
     'completed', 82000, 'Satinwood finish applied.',
     now() - interval '6 weeks'),
    ('Touch-up and patch repaint — 5-bed HMO communal',
     'Communal hallway, staircase and landing. Touch up scuffs and repaint door frames.',
     'invoiced', 68000, 'Invoice sent 14 June.',
     now() - interval '2 weeks')
  ) AS j(title, description, status, amount_pence, notes, created_at)
  WHERE NOT EXISTS (
    SELECT 1 FROM supplier_jobs x
    WHERE x.workspace_id = v_ws_id AND x.title = j.title
  );

  -- GAS ENGINEER JOBS (4 jobs)
  INSERT INTO supplier_jobs (workspace_id, title, description, status, amount_pence, currency, notes, created_at)
  SELECT v_ws_id, j.title, j.description, j.status, j.amount_pence, 'GBP', j.notes, j.created_at
  FROM (VALUES
    ('Annual CP12 — 42 Sycamore Road',
     'Landlord gas safety inspection and certificate (3 gas appliances).',
     'completed', 9500, 'CP12 certificate #GS-2024-0412 issued. Next due 14 May 2025.',
     now() - interval '7 months'),
    ('Annual CP12 — 88 Hawthorn Street',
     'Landlord gas safety inspection — combi boiler only.',
     'completed', 7900, 'CP12 #GS-2024-0521 issued. Boiler requires service within 3 months.',
     now() - interval '3 months'),
    ('Boiler breakdown — no heating/hot water',
     'Tenant reports no heating or hot water. Worcester Bosch Greenstar 28i, 8 years old.',
     'completed', 22500, 'Faulty diverter valve replaced. System balanced. All working.',
     now() - interval '1 month'),
    ('New combi boiler installation',
     'Replace ageing back boiler and fire with new Viessmann Vitodens 100 combi, repipe and commission.',
     'active', 280000, 'Installation scheduled next Tuesday.',
     now() - interval '4 days')
  ) AS j(title, description, status, amount_pence, notes, created_at)
  WHERE NOT EXISTS (
    SELECT 1 FROM supplier_jobs x
    WHERE x.workspace_id = v_ws_id AND x.title = j.title
  );

  -- LOCKSMITH JOBS (3 jobs)
  INSERT INTO supplier_jobs (workspace_id, title, description, status, amount_pence, currency, notes, created_at)
  SELECT v_ws_id, j.title, j.description, j.status, j.amount_pence, 'GBP', j.notes, j.created_at
  FROM (VALUES
    ('Emergency lockout — tenant locked out',
     'Tenant locked out 22:30 Saturday night. Non-destructive entry required.',
     'completed', 14500, 'On site within 35 minutes. Lock picked, no damage. New key cut.',
     now() - interval '2 months'),
    ('Change all locks between tenancies — 2-bed flat',
     'Full cylinder change: front door, back door, 2x bedroom doors. Supply and fit.',
     'completed', 19500, '5-lever mortice installed on front. Yale on back.',
     now() - interval '5 weeks'),
    ('uPVC door mechanism failed — cannot lock',
     'Tenant reports door will not lock. 10-point mechanism failure.',
     'invoiced', 16500, 'Mechanism replaced, aligned and tested.',
     now() - interval '3 weeks')
  ) AS j(title, description, status, amount_pence, notes, created_at)
  WHERE NOT EXISTS (
    SELECT 1 FROM supplier_jobs x
    WHERE x.workspace_id = v_ws_id AND x.title = j.title
  );

  -- CLEANING JOBS (3 jobs)
  INSERT INTO supplier_jobs (workspace_id, title, description, status, amount_pence, currency, notes, created_at)
  SELECT v_ws_id, j.title, j.description, j.status, j.amount_pence, 'GBP', j.notes, j.created_at
  FROM (VALUES
    ('End-of-tenancy clean — 3-bed house',
     'Full end-of-tenancy deep clean including oven, fridge, carpets and windows.',
     'completed', 27500, '42 photos attached. Carpets steam cleaned separately.',
     now() - interval '2 months'),
    ('Void clean — 2-bed flat (pre-remarketing)',
     'Void property clean before professional photography.',
     'completed', 18500, 'Property ready for photos. Minor touch-up marks noted.',
     now() - interval '1 month'),
    ('Monthly HMO communal clean — ongoing',
     'Monthly clean of all communal areas: kitchen, bathrooms, halls, staircase.',
     'active', 9500, 'Recurring monthly contract. Next visit 1st of month.',
     now() - interval '1 week')
  ) AS j(title, description, status, amount_pence, notes, created_at)
  WHERE NOT EXISTS (
    SELECT 1 FROM supplier_jobs x
    WHERE x.workspace_id = v_ws_id AND x.title = j.title
  );

  -- PEST CONTROL JOBS (2 jobs)
  INSERT INTO supplier_jobs (workspace_id, title, description, status, amount_pence, currency, notes, created_at)
  SELECT v_ws_id, j.title, j.description, j.status, j.amount_pence, 'GBP', j.notes, j.created_at
  FROM (VALUES
    ('Mouse infestation — kitchen',
     'Tenant reports mouse sightings in kitchen and evidence of gnawing. Full survey and treatment.',
     'completed', 28000, '3-visit treatment. Entry points identified and sealed. Cleared.',
     now() - interval '6 weeks'),
    ('Wasp nest removal — loft space',
     'Large active wasp nest found in loft. Urgent treatment required.',
     'disputed', 14500, 'Client disputes whether nest was active — invoice queried.',
     now() - interval '3 weeks')
  ) AS j(title, description, status, amount_pence, notes, created_at)
  WHERE NOT EXISTS (
    SELECT 1 FROM supplier_jobs x
    WHERE x.workspace_id = v_ws_id AND x.title = j.title
  );

  -- GARDENER JOBS (1 job)
  INSERT INTO supplier_jobs (workspace_id, title, description, status, amount_pence, currency, notes, created_at)
  SELECT v_ws_id, j.title, j.description, j.status, j.amount_pence, 'GBP', j.notes, j.created_at
  FROM (VALUES
    ('Garden clearance and first cut — 22 Birchfield Lane',
     'Full clearance of overgrown garden between tenancies: hedge cut, grass cut, collect and dispose.',
     'completed', 24000, 'Skip hired separately by agent. Garden photos sent.',
     now() - interval '3 months')
  ) AS j(title, description, status, amount_pence, notes, created_at)
  WHERE NOT EXISTS (
    SELECT 1 FROM supplier_jobs x
    WHERE x.workspace_id = v_ws_id AND x.title = j.title
  );

  -- ── SECTION 4: SUPPLIER QUOTES / REQUESTS (20 quotes) ──────────────────
  -- Using the V1 supplier_quotes table (operator-side, single workspace).
  -- NOTE: Only seed if the table exists.

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'supplier_quotes' AND table_schema = 'public') THEN

    INSERT INTO supplier_quotes
      (workspace_id, title, description, status, amount_pence, currency, property_id, created_at)
    SELECT v_ws_id, q.title, q.description, q.status, q.amount_pence, 'GBP', v_prop1, q.created_at
    FROM (VALUES
      -- Plumber quotes
      ('Quote: Bathroom replacement — full suite',
       'Supply and fit new bath, basin, WC and shower over bath. Includes tiling prep.',
       'won', 395000, now() - interval '5 months'),
      ('Quote: Re-pipe cold water supply — 5-bed HMO',
       'Replace all cold water pipework due to lead content. Full re-pipe to kitchen and bathrooms.',
       'quoted', 620000, now() - interval '6 weeks'),
      -- Electrician quotes
      ('Quote: Full rewire — ground floor flat',
       '2-bed ground floor flat rewire. New consumer unit, all sockets and switches, ceiling roses.',
       'new', 320000, now() - interval '2 weeks'),
      ('Quote: Additional sockets — 5-bed HMO kitchen',
       'Add 6 double sockets on dedicated circuit to kitchen worktop area.',
       'won', 42000, now() - interval '3 months'),
      -- Builder quotes
      ('Quote: Loft conversion feasibility',
       'Structural assessment and planning drawings for loft conversion. 3-bed semi.',
       'new', 180000, now() - interval '1 week'),
      ('Quote: Kitchen refurbishment — budget landlord spec',
       'Remove old kitchen, supply and fit new Howdens budget range with integrated appliances.',
       'quoted', 785000, now() - interval '3 weeks'),
      -- Roofer quotes
      ('Quote: Full roof re-cover — Victorian terrace',
       'Strip existing concrete tiles, replace battens, Redland plain tiles to match.',
       'lost', 1250000, now() - interval '4 months'),
      ('Quote: Flat roof replacement — rear extension',
       'Strip felt flat roof and replace with GRP fibreglass. 5-year guarantee.',
       'won', 290000, now() - interval '2 months'),
      -- Decorator quotes
      ('Quote: Communal areas repaint — 8-bed HMO',
       'Full repaint of all communal areas including staircase, landings and hallways.',
       'quoted', 420000, now() - interval '4 weeks'),
      ('Quote: External repaint — Victorian bay-fronted terrace',
       'Prepare and repaint all external woodwork and bay windows.',
       'new', 185000, now() - interval '5 days'),
      -- Gas quotes
      ('Quote: New boiler and full heating system upgrade',
       'Replace back boiler with new combi, replace all radiators and TRVs, rebalance system.',
       'won', 685000, now() - interval '3 months'),
      ('Quote: Annual CP12 block booking — 6 properties',
       'Block booking of annual gas safety inspections for 6 managed properties.',
       'quoted', 44400, now() - interval '1 week'),
      -- Locksmith quotes
      ('Quote: Smart lock installation — all rooms',
       'Supply and fit Yale Conexis smart locks to all 5 bedroom doors in HMO.',
       'quoted', 145000, now() - interval '2 weeks'),
      -- Cleaning quotes
      ('Quote: Contract cleaning — 10-unit block',
       'Weekly communal cleaning contract for 10-unit residential block.',
       'won', 68000, now() - interval '2 months'),
      ('Quote: Pre-tenancy deep clean — 4-bed house',
       'Full deep clean before new tenants move in.',
       'won', 23500, now() - interval '6 weeks'),
      -- Pest quotes
      ('Quote: Pigeon proofing — roof and parapet',
       'Spiking and netting to parapet walls and roof line. 5-year guarantee.',
       'new', 85000, now() - interval '3 days'),
      -- Gardener quotes
      ('Quote: Monthly garden maintenance contract',
       'Monthly garden maintenance for 3 properties. Lawn, hedges and borders.',
       'won', 42000, now() - interval '4 months'),
      ('Quote: Full garden redesign and hard landscaping',
       'Remove lawn, install raised beds, patio and low-maintenance planting scheme.',
       'lost', 420000, now() - interval '5 months'),
      -- Misc additional
      ('Quote: Damp survey and remediation',
       'Full damp survey. Quote for injection DPC and re-plaster to affected walls.',
       'quoted', 380000, now() - interval '10 days'),
      ('Quote: Legionella risk assessment — HMO',
       'Written legionella risk assessment for 6-bed HMO. Includes water temperature logging.',
       'won', 38500, now() - interval '2 months')
    ) AS q(title, description, status, amount_pence, created_at)
    WHERE NOT EXISTS (
      SELECT 1 FROM supplier_quotes x
      WHERE x.workspace_id = v_ws_id AND x.title = q.title
    );

  END IF;

  -- ── SECTION 5: SUPPLIER INVOICES (15 invoices) ─────────────────────────
  -- Using the V1 supplier_invoices table (operator-side).
  -- All amounts in pence. VAT at 20% for VAT-registered suppliers.

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'supplier_invoices' AND table_schema = 'public') THEN

    INSERT INTO supplier_invoices
      (workspace_id, status, subtotal_pence, tax_pence, total_pence, currency, property_id, notes, created_at)
    SELECT v_ws_id, i.status, i.subtotal, i.tax, i.total, 'GBP', v_prop1, i.notes, i.created_at
    FROM (VALUES
      -- PAID invoices
      ('paid',  9500,  1900, 11400, 'CP12 gas safety certificate — 42 Sycamore Road',                  now() - interval '7 months'),
      ('paid',  17500, 3500, 21000, 'EICR — 42 Sycamore Road',                                         now() - interval '4 months'),
      ('paid',  27500, 5500, 33000, 'End-of-tenancy clean — 3-bed house',                              now() - interval '2 months'),
      ('paid',  14500, 2900, 17400, 'Emergency lockout call-out',                                      now() - interval '2 months'),
      ('paid',  195000,39000,234000,'Full internal repaint — 3-bed flat void',                         now() - interval '3 months'),
      ('paid',  48000, 9600, 57600, 'Consumer unit replacement — 88 Hawthorn Street',                  now() - interval '2 months'),
      ('paid',  345000,69000,414000,'Void refurbishment — 22 Birchfield Lane Room B',                  now() - interval '5 months'),
      -- SENT / AWAITING PAYMENT
      ('sent',  28500, 5700, 34200, 'Emergency burst pipe repair — out of hours',                      now() - interval '6 weeks'),
      ('sent',  68000, 13600,81600, 'Touch-up and repaint — communal areas HMO',                       now() - interval '2 weeks'),
      ('sent',  16500, 3300, 19800, 'uPVC door mechanism replacement',                                 now() - interval '3 weeks'),
      ('sent',  92000, 18400,110400,'UPVC guttering replacement — full perimeter',                     now() - interval '3 days'),
      -- OVERDUE
      ('overdue',22500, 4500, 27000, 'Boiler diverter valve repair',                                   now() - interval '5 weeks'),
      ('overdue',28000, 5600, 33600, 'Mouse infestation 3-visit treatment',                            now() - interval '7 weeks'),
      -- DRAFT
      ('draft', 280000,56000,336000,'New combi boiler installation — Viessmann Vitodens 100',          now() - interval '1 day'),
      ('draft', 38000, 7600, 45600, 'Patch plaster and redecoration — hallway water damage',           now() - interval '2 days')
    ) AS i(status, subtotal, tax, total, notes, created_at)
    WHERE NOT EXISTS (
      SELECT 1 FROM supplier_invoices x
      WHERE x.workspace_id = v_ws_id AND x.notes = i.notes
    );

  END IF;

  -- ── SECTION 6: SUPPLIER REVIEWS / RATINGS (25 reviews) ─────────────────
  -- Using supplier_directory review fields if available, OR a supplier_reviews table.
  -- We seed into supplier_directory avg_rating/review_count as fallback.

  -- Update directory entries for each supplier workspace if they exist.
  UPDATE supplier_workspace_profiles SET status = 'active' WHERE workspace_id = sw_plumber;
  UPDATE supplier_workspace_profiles SET status = 'active' WHERE workspace_id = sw_electrician;
  UPDATE supplier_workspace_profiles SET status = 'active' WHERE workspace_id = sw_builder;
  UPDATE supplier_workspace_profiles SET status = 'active' WHERE workspace_id = sw_gas;
  UPDATE supplier_workspace_profiles SET status = 'active' WHERE workspace_id = sw_cleaning;

  -- Seed supplier directory self-listings with realistic ratings
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'supplier_directory' AND table_schema = 'public') THEN

    INSERT INTO supplier_directory
      (workspace_id, name, email, address_city, address_postcode, description,
       specialisms, service_areas, status, is_preferred, is_verified,
       avg_rating, review_count, created_by)
    SELECT v_ws_id, d.name, d.email, d.city, d.postcode, d.description,
           d.specialisms, d.areas, 'active', d.preferred, d.verified,
           d.rating, d.count, (SELECT id FROM auth.users LIMIT 1)
    FROM (VALUES
      ('Dave Marsh Plumbing',       'dave@davemarshplumbing.co.uk',      'Birmingham',    'B29 5PQ',
       'Reliable sole-trader plumber. Fast response.',
       ARRAY['plumbing','gas'],         ARRAY['Birmingham','Solihull'],               true,  true,  4.8, 14),
      ('NW Electrical Solutions',   'info@nwelectrical.co.uk',           'Manchester',    'M14 7JG',
       'NICEIC-approved. EICRs and rewires our speciality.',
       ARRAY['electrical'],             ARRAY['Manchester','Salford','Trafford'],      true,  true,  4.9, 22),
      ('Hartley General Builders',  'hello@hartleybuilders.co.uk',       'Leeds',         'LS6 2EX',
       'Trusted building contractor for landlords and agents.',
       ARRAY['general_building'],       ARRAY['Leeds','Bradford','Harrogate'],         false, true,  4.6, 8),
      ('Peak Roofing Services',     'peak@peakroofing.co.uk',            'Sheffield',     'S8 0TH',
       'Specialist residential roofer. Fast, reliable repairs.',
       ARRAY['roofing'],                ARRAY['Sheffield','Rotherham'],                false, false, 4.3, 5),
      ('Colour & Craft Decorators', 'hello@colourandcraft.co.uk',        'Coventry',      'CV2 4JN',
       'Competitive decorator. Fast void turnaround.',
       ARRAY['decorating'],             ARRAY['Coventry','Rugby'],                     false, true,  4.7, 11),
      ('Safeheat Gas Services',     'info@safeheatgas.co.uk',            'Nottingham',    'NG7 2PL',
       'Gas Safe engineers. CP12 and boiler specialists.',
       ARRAY['gas','plumbing'],         ARRAY['Nottingham','Derby','Mansfield'],       true,  true,  4.9, 31),
      ('City Locksmith Services',   'city@citylocksmith.co.uk',          'Leicester',     'LE2 3BT',
       '24/7 emergency locksmith. Fast response guaranteed.',
       ARRAY['locksmith'],              ARRAY['Leicester','Loughborough'],             false, true,  4.8, 17),
      ('Pristine Property Cleaning','hello@pristinecleaning.co.uk',      'Nottingham',    'NG1 1AA',
       'End-of-tenancy specialists. Photo report included.',
       ARRAY['cleaning'],               ARRAY['Nottingham','Leicester','Derby'],       true,  true,  4.7, 26),
      ('Midlands Pest Control',     'info@midlandspest.co.uk',           'Birmingham',    'B5 7RJ',
       'BPCA members. Rodents, insects, wasps.',
       ARRAY['pest_control'],           ARRAY['West Midlands','East Midlands'],        false, false, 4.1, 6),
      ('Green Edge Garden Services','greenedge@email.co.uk',             'Wolverhampton', 'WV6 0SP',
       'Reliable garden maintenance for rental properties.',
       ARRAY['gardening'],              ARRAY['Wolverhampton','Walsall'],              false, true,  4.5, 9)
    ) AS d(name, email, city, postcode, description, specialisms, areas, preferred, verified, rating, count)
    WHERE NOT EXISTS (
      SELECT 1 FROM supplier_directory x
      WHERE x.workspace_id = v_ws_id AND x.name = d.name AND x.metadata->>'demo_batch_id' IS NULL
    );

  END IF;

  RAISE NOTICE 'Supplier demo seed completed for workspace %', v_ws_id;

END $$;
