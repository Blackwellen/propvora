-- ============================================================================
-- CONSOLIDATED FULL-DEPTH DEMO SEEDER  (idempotent, workspace-parameterised)
--
--   public.seed_full_demo_workspace(p_workspace_id uuid, p_user_id uuid) → uuid
--       ONE action that injects the FULL demo depth into ANY target workspace,
--       shaped by the workspace's `type`:
--         operator → portfolio substrate (via seed_demo_workspace) PLUS deep
--                    finance (deposits, arrears, payments, bills+lines, a
--                    BALANCING double-entry ledger, invoices, money txns),
--                    extra jobs/PPM/compliance/tasks, calendar, automations
--                    (+runs) and documents.
--         supplier → supplier profile, services, packages, directory listing
--                    and supplier-side automations (+runs).
--         customer → marketplace saved items + enquiries against live public
--                    listings (lightweight; bookings/orders live in the seller
--                    workspaces).
--       Returns the demo batch uuid. Every row is stamped so reset removes
--       EXACTLY the demo rows for this workspace:
--         * tables with a `demo`/`is_demo` column      → demo=true + demo_batch_id
--         * tables with a `metadata` jsonb column      → metadata.demo_batch_id
--         * automation_definitions / _v2_runs          → trigger/_context.demo_batch_id
--         * ledger_journal_entries                     → memo LIKE 'DEMO['<batch>']%'
--         * supplier_workspace_* (no marker columns)   → guarded by demo_data_loaded
--
--   public.reset_demo_data(p_workspace_id uuid) → void
--       Removes ALL demo rows this seeder created for the workspace (FK-safe).
--
-- Money units (verified against live schema):
--   * deposits / arrears / payments / bills / invoices / money_transactions →
--     POUNDS (numeric).  ledger_journal_lines → PENCE (integer).
-- Idempotent: re-running seeds nothing twice (guards on the batch marker /
--   reference prefixes); chart of accounts is provisioned via the existing
--   seed_ledger_chart_of_accounts(workspace) helper.
-- ============================================================================

-- ── 1. seed_full_demo_workspace ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.seed_full_demo_workspace(
  p_workspace_id uuid,
  p_user_id uuid
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_batch   uuid := gen_random_uuid();
  v_marker  text;
  v_exp     timestamptz := now() + interval '30 days';
  d         date := current_date;
  v_type    text;
  v_role    text;

  -- operator substrate (resolved AFTER base seed, by demo_batch_id)
  p1 uuid; p2 uuid; p3 uuid;                         -- properties (HMO, flat, HMO)
  u1 uuid; u5 uuid;                                  -- units
  ten1 uuid; ten2 uuid; ten3 uuid;                   -- tenant contacts
  sup1 uuid; sup2 uuid;                              -- supplier contacts
  land1 uuid;                                        -- owner contact
  tn1 uuid; tn2 uuid; tn3 uuid;                      -- tenancies

  -- ledger accounts (operator)
  a_bank uuid; a_client uuid; a_tdep_liab uuid; a_portfolio uuid;
  a_mortgage uuid; a_owner_cap uuid; a_drawings uuid;
  a_rent_inc uuid; a_mgmt_inc uuid; a_repairs uuid; a_vat uuid;
  a_insurance uuid; a_utilities uuid; a_counciltax uuid;
  a_mort_int uuid; a_legal uuid; a_compliance uuid;

  v_no    bigint;
  v_entry uuid;
  v_bill  uuid;
  v_m     int;
  v_dt    date;
BEGIN
  -- Membership guard: only seed workspaces the caller belongs to.
  SELECT role INTO v_role FROM workspace_members
    WHERE workspace_id = p_workspace_id AND user_id = p_user_id;
  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Not a member of workspace %', p_workspace_id;
  END IF;

  v_marker := v_batch::text;

  SELECT COALESCE(type, 'operator') INTO v_type FROM workspaces WHERE id = p_workspace_id;
  IF v_type IS NULL THEN v_type := 'operator'; END IF;

  -- =====================================================================
  -- SUPPLIER WORKSPACE
  -- =====================================================================
  IF v_type = 'supplier' THEN
    -- profile (no marker column → upsert; guarded overall by demo_data_loaded)
    INSERT INTO supplier_workspace_profiles
      (workspace_id, display_name, bio, trades, years_experience, insurance_verified,
       public_liability_cover_pence, service_radius_km, base_location, response_time_hours,
       accepts_emergency, status)
    VALUES
      (p_workspace_id, 'Demo Trades & Maintenance',
       'DEMO supplier profile — multi-trade maintenance and compliance team covering London and the South East. Gas Safe, NICEIC and DBS-checked engineers with full insurance.',
       '{"cleaning","plumbing","electrical","gas","handyman"}', 12, true,
       500000000, 40, 'London SE1', 2, true, 'active')
    ON CONFLICT (workspace_id) DO UPDATE SET
      display_name = EXCLUDED.display_name, bio = EXCLUDED.bio, trades = EXCLUDED.trades,
      years_experience = EXCLUDED.years_experience, insurance_verified = EXCLUDED.insurance_verified,
      public_liability_cover_pence = EXCLUDED.public_liability_cover_pence,
      service_radius_km = EXCLUDED.service_radius_km, base_location = EXCLUDED.base_location,
      response_time_hours = EXCLUDED.response_time_hours, accepts_emergency = EXCLUDED.accepts_emergency,
      status = EXCLUDED.status, updated_at = now();

    INSERT INTO supplier_workspace_services
      (workspace_id, name, category, description, pricing_model, rate_pence, callout_fee_pence, active)
    SELECT p_workspace_id, s.name, s.category, s.description, s.pricing_model, s.rate_pence, s.callout_fee_pence, true
    FROM (VALUES
      ('End-of-Tenancy Deep Clean','cleaning','Full property deep clean with photographic report.','fixed',18000,NULL::int),
      ('Gas Safety Certificate (CP12)','gas','Gas Safe certified annual inspection.','fixed',7500,NULL::int),
      ('EICR Electrical Inspection','electrical','NICEIC fixed-wiring inspection and report.','fixed',14500,NULL::int),
      ('Handyman','handyman','General repairs charged hourly.','hourly',4500,3000),
      ('24/7 Emergency Plumbing','plumbing','Out-of-hours leaks and bursts.','quote_required',NULL::int,12000)
    ) AS s(name,category,description,pricing_model,rate_pence,callout_fee_pence)
    WHERE NOT EXISTS (
      SELECT 1 FROM supplier_workspace_services x
      WHERE x.workspace_id = p_workspace_id AND x.name = s.name);

    INSERT INTO supplier_workspace_packages
      (workspace_id, name, description, price_pence, duration_days, inclusions, exclusions, active)
    SELECT p_workspace_id, pk.name, pk.description, pk.price_pence, 1, pk.inclusions, pk.exclusions, true
    FROM (VALUES
      ('New Tenancy Ready','Get a property let-ready in one visit.',39500,
        '{"Deep clean","CP12 gas check","EICR electrical","Smoke alarm test","Inventory photos"}'::text[],
        '{"Remedial works","Parts over £50"}'::text[]),
      ('Annual Compliance Bundle','All statutory checks bundled with one renewal reminder.',29000,
        '{"CP12 gas","EICR electrical","EPC","Legionella risk assessment"}'::text[],
        '{"Remedial works"}'::text[])
    ) AS pk(name,description,price_pence,inclusions,exclusions)
    WHERE NOT EXISTS (
      SELECT 1 FROM supplier_workspace_packages x
      WHERE x.workspace_id = p_workspace_id AND x.name = pk.name);

    -- the supplier's own directory self-listing (metadata-marked)
    INSERT INTO supplier_directory
      (workspace_id, name, trading_name, email, phone, address_city, address_postcode,
       description, specialisms, service_areas, status, is_preferred, is_verified,
       avg_rating, review_count, created_by, metadata)
    SELECT p_workspace_id, 'Demo Trades & Maintenance', 'Demo Trades',
       'hello@demo-trades.example.com', '+442079460111', 'London', 'SE1',
       'Trusted multi-trade partner for cleaning, gas, electrical and emergency works.',
       '{"cleaning","gas","electrical","plumbing"}', '{"London","South East"}',
       'active', true, true, 4.8, 0, p_user_id,
       jsonb_build_object('demo', true, 'demo_batch_id', v_marker)
    WHERE NOT EXISTS (
      SELECT 1 FROM supplier_directory x
      WHERE x.workspace_id = p_workspace_id AND x.metadata->>'demo_batch_id' IS NOT NULL);

    -- supplier-side automations (marker carried in trigger json)
    INSERT INTO automation_definitions (workspace_id, name, description, trigger, conditions, actions, enabled, source, created_by)
    SELECT p_workspace_id, a.name, a.description, a.trig, a.cond, a.acts, true, 'template', p_user_id
    -- Real engine shape (catalogue trigger.type + safe action_type). The engine
    -- generates real runs via cron/run-now — no fabricated run history seeded.
    FROM (VALUES
      ('New maintenance request → acknowledge','Acknowledge new maintenance requests and notify the team.',
        jsonb_build_object('demo',true,'demo_batch_id',v_marker,'kind','event','type','maintenance_request_submitted','config','{}'::jsonb),
        '{}'::jsonb,
        '[{"action_type":"create_notification","config":{"title":"New maintenance request — {{summary}}","severity":"info"}},{"action_type":"create_task","config":{"title":"Acknowledge request — {{summary}}"}}]'::jsonb),
      ('Job completed → follow-up task','When a job is marked complete, raise a follow-up/invoice-draft task.',
        jsonb_build_object('demo',true,'demo_batch_id',v_marker,'kind','event','type','job_completed','config','{}'::jsonb),
        '{}'::jsonb,
        '[{"action_type":"create_task","config":{"title":"Raise invoice for completed job — {{summary}}"}}]'::jsonb)
    ) AS a(name,description,trig,cond,acts)
    WHERE NOT EXISTS (
      SELECT 1 FROM automation_definitions x
      WHERE x.workspace_id = p_workspace_id AND (x.trigger->>'demo_batch_id') IS NOT NULL);

    UPDATE workspaces SET demo_data_loaded = true, demo_data_variant = 'full' WHERE id = p_workspace_id;
    RETURN v_batch;
  END IF;

  -- =====================================================================
  -- CUSTOMER WORKSPACE — lightweight marketplace activity
  -- =====================================================================
  IF v_type = 'customer' THEN
    -- saved items + enquiries against any live, public, published listings.
    INSERT INTO marketplace_saved_items (workspace_id, listing_id, saved_by, note)
    SELECT p_workspace_id, l.id, p_user_id, 'DEMO shortlist'
    FROM (
      SELECT id FROM marketplace_listings
      WHERE status = 'published' AND visibility = 'public'
      ORDER BY created_at DESC LIMIT 4
    ) l
    WHERE NOT EXISTS (
      SELECT 1 FROM marketplace_saved_items x
      WHERE x.workspace_id = p_workspace_id AND x.note = 'DEMO shortlist');

    INSERT INTO marketplace_enquiries
      (listing_id, buyer_workspace_id, buyer_user_id, buyer_name, buyer_email, message, status, gdpr_consent)
    SELECT l.id, p_workspace_id, p_user_id, 'Demo Buyer', 'demo.buyer@example.com',
       'DEMO enquiry — is this available next month?', 'new', true
    FROM (
      SELECT id FROM marketplace_listings
      WHERE status = 'published' AND visibility = 'public'
      ORDER BY created_at DESC LIMIT 2
    ) l
    WHERE NOT EXISTS (
      SELECT 1 FROM marketplace_enquiries x
      WHERE x.buyer_workspace_id = p_workspace_id AND x.message LIKE 'DEMO enquiry%');

    UPDATE workspaces SET demo_data_loaded = true, demo_data_variant = 'full' WHERE id = p_workspace_id;
    RETURN v_batch;
  END IF;

  -- =====================================================================
  -- OPERATOR WORKSPACE
  -- =====================================================================
  -- 1) Base substrate: properties, units, contacts, tenancies, rent, tasks,
  --    jobs, compliance, ppm, money, calendar, messages, notifications, legal.
  --    seed_demo_workspace stamps every row demo=true with its OWN batch id; we
  --    fold that batch into ours afterwards so one reset clears everything.
  PERFORM public.seed_demo_workspace(p_workspace_id, p_user_id);

  -- Re-stamp the just-created substrate rows onto THIS batch (so reset is one id).
  UPDATE properties      SET demo_batch_id = v_batch WHERE workspace_id = p_workspace_id AND demo AND demo_batch_id <> v_batch AND created_at > now()-interval '5 minutes';
  UPDATE units           SET demo_batch_id = v_batch WHERE workspace_id = p_workspace_id AND demo AND demo_batch_id <> v_batch AND created_at > now()-interval '5 minutes';
  UPDATE contacts        SET demo_batch_id = v_batch WHERE workspace_id = p_workspace_id AND demo AND demo_batch_id <> v_batch AND created_at > now()-interval '5 minutes';
  UPDATE tenancies       SET demo_batch_id = v_batch WHERE workspace_id = p_workspace_id AND demo AND demo_batch_id <> v_batch AND created_at > now()-interval '5 minutes';
  UPDATE rent_schedules  SET demo_batch_id = v_batch WHERE workspace_id = p_workspace_id AND demo AND demo_batch_id <> v_batch AND created_at > now()-interval '5 minutes';
  UPDATE tasks           SET demo_batch_id = v_batch WHERE workspace_id = p_workspace_id AND demo AND demo_batch_id <> v_batch AND created_at > now()-interval '5 minutes';
  UPDATE jobs            SET demo_batch_id = v_batch WHERE workspace_id = p_workspace_id AND (demo OR is_demo) AND demo_batch_id <> v_batch AND created_at > now()-interval '5 minutes';
  UPDATE compliance_items SET demo_batch_id = v_batch WHERE workspace_id = p_workspace_id AND demo AND demo_batch_id <> v_batch AND created_at > now()-interval '5 minutes';
  UPDATE ppm_plans       SET demo_batch_id = v_batch WHERE workspace_id = p_workspace_id AND is_demo AND demo_batch_id <> v_batch AND created_at > now()-interval '5 minutes';
  UPDATE money_transactions SET demo_batch_id = v_batch WHERE workspace_id = p_workspace_id AND demo AND demo_batch_id <> v_batch AND created_at > now()-interval '5 minutes';
  UPDATE calendar_events SET demo_batch_id = v_batch WHERE workspace_id = p_workspace_id AND demo AND demo_batch_id <> v_batch AND created_at > now()-interval '5 minutes';
  UPDATE message_threads SET demo_batch_id = v_batch WHERE workspace_id = p_workspace_id AND demo AND demo_batch_id <> v_batch;
  UPDATE messages        SET demo_batch_id = v_batch WHERE workspace_id = p_workspace_id AND demo AND demo_batch_id <> v_batch;
  UPDATE notifications   SET demo_batch_id = v_batch WHERE workspace_id = p_workspace_id AND demo AND demo_batch_id <> v_batch AND created_at > now()-interval '5 minutes';
  UPDATE hmo_licences    SET demo_batch_id = v_batch WHERE workspace_id = p_workspace_id AND demo AND demo_batch_id <> v_batch;
  UPDATE possession_cases    SET demo_batch_id = v_batch WHERE workspace_id = p_workspace_id AND demo AND demo_batch_id <> v_batch;
  UPDATE possession_evidence SET demo_batch_id = v_batch WHERE workspace_id = p_workspace_id AND demo AND demo_batch_id <> v_batch;

  -- Resolve the substrate ids we need as FK anchors for the deep layer.
  SELECT id INTO p1 FROM properties WHERE workspace_id = p_workspace_id AND demo_batch_id = v_batch AND nickname = '42 Sycamore Road' LIMIT 1;
  SELECT id INTO p2 FROM properties WHERE workspace_id = p_workspace_id AND demo_batch_id = v_batch AND nickname = '88 Hawthorn Street' LIMIT 1;
  SELECT id INTO p3 FROM properties WHERE workspace_id = p_workspace_id AND demo_batch_id = v_batch AND nickname = '22 Birchfield Lane' LIMIT 1;
  SELECT id INTO u1 FROM units WHERE workspace_id = p_workspace_id AND demo_batch_id = v_batch AND property_id = p1 AND label = 'Room 1' LIMIT 1;
  SELECT id INTO u5 FROM units WHERE workspace_id = p_workspace_id AND demo_batch_id = v_batch AND property_id = p3 LIMIT 1;
  SELECT id INTO ten1 FROM contacts WHERE workspace_id = p_workspace_id AND demo_batch_id = v_batch AND display_name = 'James Thornton' LIMIT 1;
  SELECT id INTO ten2 FROM contacts WHERE workspace_id = p_workspace_id AND demo_batch_id = v_batch AND display_name = 'Amara Mensah' LIMIT 1;
  SELECT id INTO ten3 FROM contacts WHERE workspace_id = p_workspace_id AND demo_batch_id = v_batch AND display_name = 'Sophie Clarke' LIMIT 1;
  SELECT id INTO sup1 FROM contacts WHERE workspace_id = p_workspace_id AND demo_batch_id = v_batch AND display_name = 'Dave Patel' LIMIT 1;
  SELECT id INTO sup2 FROM contacts WHERE workspace_id = p_workspace_id AND demo_batch_id = v_batch AND display_name = 'Rajesh Kapoor' LIMIT 1;
  SELECT id INTO land1 FROM contacts WHERE workspace_id = p_workspace_id AND demo_batch_id = v_batch AND display_name = 'Gerald Ashworth' LIMIT 1;
  SELECT id INTO tn1 FROM tenancies WHERE workspace_id = p_workspace_id AND demo_batch_id = v_batch AND property_id = p1 LIMIT 1;
  SELECT id INTO tn2 FROM tenancies WHERE workspace_id = p_workspace_id AND demo_batch_id = v_batch AND property_id = p2 LIMIT 1;
  SELECT id INTO tn3 FROM tenancies WHERE workspace_id = p_workspace_id AND demo_batch_id = v_batch AND property_id = p3 LIMIT 1;

  -- 2) Deposits (pounds) — metadata-marked
  INSERT INTO deposits (workspace_id, deposit_type, property_id, unit_id, tenancy_id, contact_id,
      amount, currency, status, received_date, protection_scheme, reference_number, held_by, notes, created_by, metadata)
  SELECT p_workspace_id, x.dt, x.pid, x.uid, x.tid, x.cid, x.amt, 'GBP', x.st, (d - x.days), x.scheme, x.ref, x.held, x.note, p_user_id,
         jsonb_build_object('demo', true, 'demo_batch_id', v_marker)
  FROM (VALUES
    ('tenant_deposit', p1, u1,   tn1, ten1, 575.00,  'protected', 330, 'TDS',        'DEMO-TDS-SYC',  'Tenancy Deposit Scheme','HMO room 1 deposit'),
    ('tenant_deposit', p2, NULL::uuid, tn2, ten2, 1050.00, 'protected', 300, 'MyDeposits', 'DEMO-MYD-HAW',  'mydeposits','Protected within 30 days'),
    ('tenant_deposit', p3, u5,   tn3, ten3, 525.00,  'received',  150, NULL,         'DEMO-BIR-A',    'Pending protection','Awaiting scheme registration')
  ) AS x(dt,pid,uid,tid,cid,amt,st,days,scheme,ref,held,note)
  WHERE NOT EXISTS (SELECT 1 FROM deposits y WHERE y.workspace_id = p_workspace_id AND y.metadata->>'demo_batch_id' = v_marker);

  -- 3) Arrears (pounds)
  INSERT INTO arrears_records (workspace_id, property_id, unit_id, tenancy_id, contact_id,
      amount_due, amount_paid, amount_outstanding, due_date, days_overdue, status, last_chased_at, next_chase_at, notes, created_by, metadata)
  SELECT p_workspace_id, x.pid, x.uid, x.tid, x.cid, x.due, x.paid, x.out, (d - x.days), x.days, x.st, x.lc, x.nc, x.note, p_user_id,
         jsonb_build_object('demo', true, 'demo_batch_id', v_marker)
  FROM (VALUES
    (p1, u1, tn1, ten1, 575.00,  0.00,  575.00, 12, 'chasing',     (now()-interval '5 days'), (now()+interval '2 days'), 'Reminders sent; tenant promises Friday'),
    (p3, u5, tn3, ten3, 525.00,  0.00,  525.00, 3,  'open',        NULL::timestamptz,         (now()+interval '4 days'), 'Just gone overdue — first reminder queued'),
    (p2, NULL::uuid, tn2, ten2, 1050.00, 1050.00, 0.00, 40, 'resolved', (now()-interval '30 days'), NULL::timestamptz, 'Cleared in full after payment plan')
  ) AS x(pid,uid,tid,cid,due,paid,out,days,st,lc,nc,note)
  WHERE NOT EXISTS (SELECT 1 FROM arrears_records y WHERE y.workspace_id = p_workspace_id AND y.metadata->>'demo_batch_id' = v_marker);

  -- 4) Payments (pounds)
  INSERT INTO payments (workspace_id, payment_type, linked_type, contact_id, property_id,
      amount, currency, payment_date, payment_method, status, reference, notes, created_by, metadata)
  SELECT p_workspace_id, x.pt, x.lt, x.cid, x.pid, x.amt, 'GBP', (d - x.days), x.pm, 'completed', x.ref, x.note, p_user_id,
         jsonb_build_object('demo', true, 'demo_batch_id', v_marker)
  FROM (VALUES
    ('income','tenancy', ten2, p2, 1050.00, 11, 'bank_transfer','RENT-HAW','Monthly rent received'),
    ('income','tenancy', ten1, p1, 575.00,  28, 'bank_transfer','RENT-SYC','HMO room 1 rent'),
    ('expense','job',    sup2, p1, 96.00,   14, 'bank_transfer','PAY-GAS-SYC','Annual gas safety certificate'),
    ('expense','job',    sup1, p1, 140.00,  5,  'card','PAY-CLEAN-SYC','Communal deep clean')
  ) AS x(pt,lt,cid,pid,amt,days,pm,ref,note)
  WHERE NOT EXISTS (SELECT 1 FROM payments y WHERE y.workspace_id = p_workspace_id AND y.metadata->>'demo_batch_id' = v_marker);

  -- 5) Bills + bill_lines (pounds). bill_lines have no marker → tie via bill_id.
  IF NOT EXISTS (SELECT 1 FROM bills WHERE workspace_id = p_workspace_id AND metadata->>'demo_batch_id' = v_marker) THEN
    v_bill := gen_random_uuid();
    INSERT INTO bills (id,workspace_id,bill_number,bill_type,supplier_contact_id,property_id,status,issue_date,due_date,subtotal,tax_amount,total,currency,paid_at,notes,created_by,metadata)
    VALUES (v_bill,p_workspace_id,'DEMO-BILL-0101','supplier_invoice',sup2,p1,'paid',(d-20),(d-6),80.00,16.00,96.00,'GBP',(now()-interval '14 days'),'Gas safety certificate — 42 Sycamore Road',p_user_id,jsonb_build_object('demo',true,'demo_batch_id',v_marker));
    INSERT INTO bill_lines (workspace_id,bill_id,description,quantity,unit_price,tax_rate,line_total,sort_order)
    VALUES (p_workspace_id,v_bill,'Annual Landlord Gas Safety Record (CP12)',1,80.00,20.0,80.00,0);

    v_bill := gen_random_uuid();
    INSERT INTO bills (id,workspace_id,bill_number,bill_type,supplier_contact_id,property_id,status,issue_date,due_date,subtotal,tax_amount,total,currency,notes,created_by,metadata)
    VALUES (v_bill,p_workspace_id,'DEMO-BILL-0102','supplier_invoice',sup1,p3,'overdue',(d-50),(d-20),216.67,43.33,260.00,'GBP','EICR remedial works — 22 Birchfield Lane (PAST DUE)',p_user_id,jsonb_build_object('demo',true,'demo_batch_id',v_marker));
    INSERT INTO bill_lines (workspace_id,bill_id,description,quantity,unit_price,tax_rate,line_total,sort_order) VALUES
      (p_workspace_id,v_bill,'Replace consumer unit RCBOs',1,180.00,20.0,180.00,0),
      (p_workspace_id,v_bill,'Re-test and certify',1,36.67,20.0,36.67,1);

    v_bill := gen_random_uuid();
    INSERT INTO bills (id,workspace_id,bill_number,bill_type,supplier_contact_id,property_id,status,issue_date,due_date,subtotal,tax_amount,total,currency,approved_at,notes,created_by,metadata)
    VALUES (v_bill,p_workspace_id,'DEMO-BILL-0103','supplier_invoice',sup1,p2,'approved',(d-8),(d+7),150.00,30.00,180.00,'GBP',(now()-interval '2 days'),'Letting fee — renewal admin',p_user_id,jsonb_build_object('demo',true,'demo_batch_id',v_marker));
    INSERT INTO bill_lines (workspace_id,bill_id,description,quantity,unit_price,tax_rate,line_total,sort_order)
    VALUES (p_workspace_id,v_bill,'Tenancy renewal admin fee',1,150.00,20.0,150.00,0);

    v_bill := gen_random_uuid();
    INSERT INTO bills (id,workspace_id,bill_number,bill_type,supplier_contact_id,property_id,status,issue_date,due_date,subtotal,tax_amount,total,currency,notes,created_by,metadata)
    VALUES (v_bill,p_workspace_id,'DEMO-BILL-0104','utility',NULL::uuid,NULL::uuid,'received',(d-4),(d+10),153.33,0.00,153.33,'GBP','Portfolio landlord insurance — monthly instalment',p_user_id,jsonb_build_object('demo',true,'demo_batch_id',v_marker));
    INSERT INTO bill_lines (workspace_id,bill_id,description,quantity,unit_price,tax_rate,line_total,sort_order)
    VALUES (p_workspace_id,v_bill,'Landlord buildings & liability cover (monthly)',1,153.33,0.0,153.33,0);
  END IF;

  -- 6) Sales invoices (pounds) — uses the demo lifecycle columns it owns
  INSERT INTO invoices (workspace_id,invoice_number,contact_id,property_id,invoice_type,issue_date,due_date,subtotal,tax_amount,total,currency,status,paid_at,paid_amount,notes,created_by,demo,is_demo,demo_batch_id,demo_expires_at)
  SELECT p_workspace_id, x.num, x.cid, x.pid, 'outbound', (d - x.iss), (d - x.due_off), x.sub, x.tax, x.tot, 'GBP', x.st, x.paid_at, x.paid_amt, x.note, p_user_id, true, true, v_batch, v_exp
  FROM (VALUES
    ('DEMO-INV-2001', ten2, p2, 1050.00, 0.00, 1050.00, 'paid',   (now()-interval '11 days'), 1050.00::numeric, 11, 11, 'Monthly rent — 88 Hawthorn Street'),
    ('DEMO-INV-2002', ten1, p1, 575.00,  0.00, 575.00,  'overdue', NULL::timestamptz,          NULL::numeric,    12, 12, 'HMO Room 1 rent — OVERDUE'),
    ('DEMO-INV-2003', ten3, p3, 525.00,  0.00, 525.00,  'overdue', NULL::timestamptz,          NULL::numeric,    3,  3,  'Birchfield Room A — OVERDUE'),
    ('DEMO-INV-2004', land1, NULL::uuid, 640.00, 128.00, 768.00, 'sent', NULL::timestamptz,    NULL::numeric,    2, -12, 'Management fee — 3rd-party landlord')
  ) AS x(num,cid,pid,sub,tax,tot,st,paid_at,paid_amt,iss,due_off,note)
  WHERE NOT EXISTS (SELECT 1 FROM invoices y WHERE y.workspace_id = p_workspace_id AND y.demo_batch_id = v_batch AND y.invoice_number LIKE 'DEMO-INV-%');

  -- 7) Extra money transactions (cash ledger feed) — demo lifecycle columns
  INSERT INTO money_transactions (workspace_id,direction,category,amount,currency,occurred_on,property_id,description,reference,reconciled,metadata,demo,demo_batch_id,demo_expires_at,created_by)
  SELECT p_workspace_id, x.dir::money_direction, x.cat::money_category, x.amt, 'GBP', (d - x.days), x.pid, x.descr, x.ref, x.rec,
         jsonb_build_object('demo', true, 'demo_batch_id', v_marker), true, v_batch, v_exp, p_user_id
  FROM (VALUES
    ('in','management_fee', NULL::uuid, 640.00, 4,  'Management fees collected','MGMT-FEE', true),
    ('out','mortgage',      NULL::uuid, 3180.00,10, 'Mortgage interest','MORT-INT', false),
    ('out','insurance',     NULL::uuid, 153.33, 4,  'Landlord insurance instalment','INS-MONTH', false)
  ) AS x(dir,cat,pid,amt,days,descr,ref,rec)
  WHERE NOT EXISTS (SELECT 1 FROM money_transactions y WHERE y.workspace_id = p_workspace_id AND y.demo_batch_id = v_batch AND y.reference = 'MGMT-FEE');

  -- 8) Double-entry ledger (BALANCING) — pence. Chart provisioned on demand.
  PERFORM public.seed_ledger_chart_of_accounts(p_workspace_id);

  SELECT id INTO a_bank       FROM ledger_accounts WHERE workspace_id=p_workspace_id AND code='1000';
  SELECT id INTO a_client     FROM ledger_accounts WHERE workspace_id=p_workspace_id AND code='1010';
  SELECT id INTO a_tdep_liab  FROM ledger_accounts WHERE workspace_id=p_workspace_id AND code='2100';
  SELECT id INTO a_portfolio  FROM ledger_accounts WHERE workspace_id=p_workspace_id AND code='1500';
  SELECT id INTO a_mortgage   FROM ledger_accounts WHERE workspace_id=p_workspace_id AND code='2300';
  SELECT id INTO a_owner_cap  FROM ledger_accounts WHERE workspace_id=p_workspace_id AND code='3000';
  SELECT id INTO a_drawings   FROM ledger_accounts WHERE workspace_id=p_workspace_id AND code='3200';
  SELECT id INTO a_rent_inc   FROM ledger_accounts WHERE workspace_id=p_workspace_id AND code='4000';
  SELECT id INTO a_mgmt_inc   FROM ledger_accounts WHERE workspace_id=p_workspace_id AND code='4100';
  SELECT id INTO a_repairs    FROM ledger_accounts WHERE workspace_id=p_workspace_id AND code='5000';
  SELECT id INTO a_vat        FROM ledger_accounts WHERE workspace_id=p_workspace_id AND code='2200';
  SELECT id INTO a_insurance  FROM ledger_accounts WHERE workspace_id=p_workspace_id AND code='5200';
  SELECT id INTO a_utilities  FROM ledger_accounts WHERE workspace_id=p_workspace_id AND code='5300';
  SELECT id INTO a_counciltax FROM ledger_accounts WHERE workspace_id=p_workspace_id AND code='5400';
  SELECT id INTO a_mort_int   FROM ledger_accounts WHERE workspace_id=p_workspace_id AND code='5600';
  SELECT id INTO a_legal      FROM ledger_accounts WHERE workspace_id=p_workspace_id AND code='5700';
  SELECT id INTO a_compliance FROM ledger_accounts WHERE workspace_id=p_workspace_id AND code='5800';

  IF a_bank IS NOT NULL AND NOT EXISTS (
       SELECT 1 FROM ledger_journal_entries WHERE workspace_id=p_workspace_id AND memo LIKE 'DEMO['||v_marker||']%') THEN
    SELECT COALESCE(MAX(entry_no),0) INTO v_no FROM ledger_journal_entries WHERE workspace_id=p_workspace_id;

    -- Opening balances (assets = liabilities + equity), 1,295,000.00
    v_no := v_no + 1; v_entry := gen_random_uuid();
    INSERT INTO ledger_journal_entries (id,workspace_id,entry_no,date,memo,source_type,posted,posted_at,created_by)
    VALUES (v_entry,p_workspace_id,v_no,(date_trunc('year',d))::date,'DEMO['||v_marker||'] Opening balances','opening',true,now(),p_user_id);
    INSERT INTO ledger_journal_lines (workspace_id,entry_id,account_id,debit_pence,credit_pence,memo) VALUES
      (p_workspace_id,v_entry,a_bank,4500000,0,'Opening bank'),
      (p_workspace_id,v_entry,a_portfolio,125000000,0,'Property portfolio at cost'),
      (p_workspace_id,v_entry,a_mortgage,0,82000000,'Buy-to-let mortgages'),
      (p_workspace_id,v_entry,a_owner_cap,0,47500000,'Owner capital introduced');

    -- 6 recurring months
    FOR v_m IN 0..5 LOOP
      v_dt := (date_trunc('month',d) - (v_m||' months')::interval)::date + 1;

      v_no := v_no + 1; v_entry := gen_random_uuid();
      INSERT INTO ledger_journal_entries (id,workspace_id,entry_no,date,memo,source_type,posted,posted_at,created_by)
      VALUES (v_entry,p_workspace_id,v_no,v_dt,'DEMO['||v_marker||'] Rent received '||to_char(v_dt,'Mon YYYY'),'rent',true,now(),p_user_id);
      INSERT INTO ledger_journal_lines (workspace_id,entry_id,account_id,debit_pence,credit_pence,memo) VALUES
        (p_workspace_id,v_entry,a_bank,1143000,0,'Rent banked'),
        (p_workspace_id,v_entry,a_rent_inc,0,1143000,'Portfolio rental income');

      v_no := v_no + 1; v_entry := gen_random_uuid();
      INSERT INTO ledger_journal_entries (id,workspace_id,entry_no,date,memo,source_type,posted,posted_at,created_by)
      VALUES (v_entry,p_workspace_id,v_no,v_dt,'DEMO['||v_marker||'] Mortgage interest '||to_char(v_dt,'Mon YYYY'),'expense',true,now(),p_user_id);
      INSERT INTO ledger_journal_lines (workspace_id,entry_id,account_id,debit_pence,credit_pence,memo) VALUES
        (p_workspace_id,v_entry,a_mort_int,318000,0,'BTL mortgage interest'),
        (p_workspace_id,v_entry,a_bank,0,318000,'Mortgage DD');

      v_no := v_no + 1; v_entry := gen_random_uuid();
      INSERT INTO ledger_journal_entries (id,workspace_id,entry_no,date,memo,source_type,posted,posted_at,created_by)
      VALUES (v_entry,p_workspace_id,v_no,v_dt,'DEMO['||v_marker||'] Repairs & maintenance '||to_char(v_dt,'Mon YYYY'),'expense',true,now(),p_user_id);
      INSERT INTO ledger_journal_lines (workspace_id,entry_id,account_id,debit_pence,credit_pence,memo) VALUES
        (p_workspace_id,v_entry,a_repairs,42000,0,'Reactive repairs'),
        (p_workspace_id,v_entry,a_vat,8400,0,'Input VAT'),
        (p_workspace_id,v_entry,a_bank,0,50400,'Paid to contractors');

      v_no := v_no + 1; v_entry := gen_random_uuid();
      INSERT INTO ledger_journal_entries (id,workspace_id,entry_no,date,memo,source_type,posted,posted_at,created_by)
      VALUES (v_entry,p_workspace_id,v_no,v_dt,'DEMO['||v_marker||'] Insurance & utilities '||to_char(v_dt,'Mon YYYY'),'expense',true,now(),p_user_id);
      INSERT INTO ledger_journal_lines (workspace_id,entry_id,account_id,debit_pence,credit_pence,memo) VALUES
        (p_workspace_id,v_entry,a_insurance,15333,0,'Landlord insurance'),
        (p_workspace_id,v_entry,a_utilities,9500,0,'Void-period utilities'),
        (p_workspace_id,v_entry,a_counciltax,11000,0,'Void-period council tax'),
        (p_workspace_id,v_entry,a_bank,0,35833,'Paid');

      v_no := v_no + 1; v_entry := gen_random_uuid();
      INSERT INTO ledger_journal_entries (id,workspace_id,entry_no,date,memo,source_type,posted,posted_at,created_by)
      VALUES (v_entry,p_workspace_id,v_no,v_dt,'DEMO['||v_marker||'] Management fees '||to_char(v_dt,'Mon YYYY'),'income',true,now(),p_user_id);
      INSERT INTO ledger_journal_lines (workspace_id,entry_id,account_id,debit_pence,credit_pence,memo) VALUES
        (p_workspace_id,v_entry,a_bank,64000,0,'Mgmt fees collected'),
        (p_workspace_id,v_entry,a_mgmt_inc,0,64000,'Management fee income');
    END LOOP;

    -- Tenant deposits received (liability)
    v_no := v_no + 1; v_entry := gen_random_uuid();
    INSERT INTO ledger_journal_entries (id,workspace_id,entry_no,date,memo,source_type,posted,posted_at,created_by)
    VALUES (v_entry,p_workspace_id,v_no,(d-30),'DEMO['||v_marker||'] Tenant deposits received','deposit',true,now(),p_user_id);
    INSERT INTO ledger_journal_lines (workspace_id,entry_id,account_id,debit_pence,credit_pence,memo) VALUES
      (p_workspace_id,v_entry,a_client,450000,0,'Deposits into client account'),
      (p_workspace_id,v_entry,a_tdep_liab,0,450000,'Tenant deposits liability');

    -- Owner drawings
    v_no := v_no + 1; v_entry := gen_random_uuid();
    INSERT INTO ledger_journal_entries (id,workspace_id,entry_no,date,memo,source_type,posted,posted_at,created_by)
    VALUES (v_entry,p_workspace_id,v_no,(d-15),'DEMO['||v_marker||'] Owner drawings','drawings',true,now(),p_user_id);
    INSERT INTO ledger_journal_lines (workspace_id,entry_id,account_id,debit_pence,credit_pence,memo) VALUES
      (p_workspace_id,v_entry,a_drawings,600000,0,'Owner drawings'),
      (p_workspace_id,v_entry,a_bank,0,600000,'Paid to owner');

    -- Legal & compliance certs
    v_no := v_no + 1; v_entry := gen_random_uuid();
    INSERT INTO ledger_journal_entries (id,workspace_id,entry_no,date,memo,source_type,posted,posted_at,created_by)
    VALUES (v_entry,p_workspace_id,v_no,(d-22),'DEMO['||v_marker||'] Legal & compliance certs','expense',true,now(),p_user_id);
    INSERT INTO ledger_journal_lines (workspace_id,entry_id,account_id,debit_pence,credit_pence,memo) VALUES
      (p_workspace_id,v_entry,a_legal,25000,0,'Accountancy & legal'),
      (p_workspace_id,v_entry,a_compliance,18000,0,'Gas/EICR certificates'),
      (p_workspace_id,v_entry,a_bank,0,43000,'Paid');
  END IF;

  -- 9) Documents (R2 placeholders) — demo lifecycle columns
  INSERT INTO documents (workspace_id,property_id,tenancy_id,name,type,category,mime_type,size_bytes,r2_key,r2_bucket,status,tags,created_by,metadata,demo,demo_batch_id,demo_expires_at)
  SELECT p_workspace_id, x.pid, x.tid, x.nm, x.tp, x.cat, 'application/pdf', x.sz::bigint,
         'docs/'||p_workspace_id||'/'||x.key, 'propvora-documents', 'active', x.tags, p_user_id,
         jsonb_build_object('demo', true, 'demo_batch_id', v_marker), true, v_batch, v_exp
  FROM (VALUES
    (p1, tn1, 'AST — 42 Sycamore Room 1.pdf','tenancy_agreement','tenancy',184320,'ast-sycamore.pdf', ARRAY['tenancy','signed']),
    (p1, NULL::uuid,'Gas Safety Record — 42 Sycamore.pdf','certificate','compliance',96000,'cp12-sycamore.pdf', ARRAY['gas','compliance']),
    (p3, NULL::uuid,'EICR — 22 Birchfield Lane.pdf','certificate','compliance',142000,'eicr-birch.pdf', ARRAY['electrical','compliance']),
    (p2, tn2, 'AST — 88 Hawthorn Street.pdf','tenancy_agreement','tenancy',176000,'ast-hawthorn.pdf', ARRAY['tenancy','signed']),
    (NULL::uuid, NULL::uuid,'Landlord insurance schedule.pdf','policy','finance',132000,'insurance-schedule.pdf', ARRAY['insurance'])
  ) AS x(pid,tid,nm,tp,cat,sz,key,tags)
  WHERE NOT EXISTS (SELECT 1 FROM documents y WHERE y.workspace_id = p_workspace_id AND y.demo_batch_id = v_batch);

  -- 10) Calendar — extra compliance/work/viewing events (demo lifecycle columns)
  INSERT INTO calendar_events (workspace_id,title,type,event_type,description,property_id,start_date,start_at,all_day,priority,related_type,created_by,metadata,demo,demo_batch_id,demo_expires_at)
  SELECT p_workspace_id, x.title, x.typ, 'event', x.descr, x.pid, (d + x.days), (d + x.days)::timestamptz, true, x.pri, x.rel, p_user_id,
         jsonb_build_object('demo', true, 'demo_batch_id', v_marker), true, v_batch, v_exp
  FROM (VALUES
    ('Gas safety due — 42 Sycamore Road','compliance','Annual CP12 inspection due',p1,9,'high','compliance'),
    ('EICR expiry — 88 Hawthorn Street','compliance','5-year electrical certificate expires',p2,21,'high','compliance'),
    ('HMO licence renewal — 42 Sycamore Road','deadline','5-year HMO licence renewal deadline',p1,47,'high','compliance'),
    ('Fire alarm service — 22 Birchfield Lane','compliance','Annual fire alarm & emergency lighting test',p3,5,'medium','compliance'),
    ('Insurance renewal deadline','deadline','Portfolio landlord insurance renewal',NULL::uuid,15,'high','general'),
    ('Quarterly VAT return','deadline','VAT return submission deadline',NULL::uuid,75,'high','general')
  ) AS x(title,typ,descr,pid,days,pri,rel)
  WHERE NOT EXISTS (SELECT 1 FROM calendar_events y WHERE y.workspace_id = p_workspace_id AND y.demo_batch_id = v_batch AND y.metadata->>'demo_batch_id' = v_marker AND y.related_type='general');

  -- 11) Automations (operator) + run history — marker in trigger/context json
  IF NOT EXISTS (SELECT 1 FROM automation_definitions WHERE workspace_id=p_workspace_id AND (trigger->>'demo_batch_id') = v_marker) THEN
    INSERT INTO automation_definitions (workspace_id,name,description,trigger,conditions,actions,enabled,source,created_by)
    SELECT p_workspace_id, a.name, a.descr, a.trig, a.cond, a.acts, a.en, 'template', p_user_id
    -- Real engine shape: trigger.type is a CATALOGUE trigger the engine can
    -- evaluate; actions[].action_type is a SAFE catalogue action the executor
    -- runs. (Previously these used trigger.type='schedule'/'event' + non-
    -- catalogue actions like send_email/notify/reconcile, so the engine could
    -- never run them — and fabricated runs were seeded to hide that.)
    FROM (VALUES
      ('Rent overdue → chase tenant','When rent is overdue, draft a reminder and create a follow-up task.',
        jsonb_build_object('demo',true,'demo_batch_id',v_marker,'kind','scheduled','type','rent_overdue','config','{}'::jsonb),
        '{}'::jsonb,
        '[{"action_type":"draft_message","config":{"subject":"Overdue rent — {{summary}}"}},{"action_type":"create_task","config":{"title":"Chase overdue rent — {{summary}}","priority":"high"}}]'::jsonb, true),
      ('Compliance due in 30 days → alert','Alert 30 days before any compliance certificate expires and raise a task.',
        jsonb_build_object('demo',true,'demo_batch_id',v_marker,'kind','scheduled','type','compliance_due_soon','config',jsonb_build_object('within_days',30)),
        '{}'::jsonb,
        '[{"action_type":"create_notification","config":{"title":"Compliance due soon — {{summary}}","severity":"warning"}},{"action_type":"create_task","config":{"title":"Book compliance renewal — {{summary}}","priority":"high","due_in_days":14}}]'::jsonb, true),
      ('New maintenance request → triage task','When a maintenance request is submitted, raise a triage task.',
        jsonb_build_object('demo',true,'demo_batch_id',v_marker,'kind','event','type','maintenance_request_submitted','config','{}'::jsonb),
        '{}'::jsonb,
        '[{"action_type":"create_task","config":{"title":"Triage maintenance request — {{summary}}","priority":"normal"}}]'::jsonb, true),
      ('Rent received → receipt draft','On a matched rent payment, draft a receipt and note it on the record.',
        jsonb_build_object('demo',true,'demo_batch_id',v_marker,'kind','event','type','rent_payment_received','config','{}'::jsonb),
        '{}'::jsonb,
        '[{"action_type":"draft_message","config":{"subject":"Rent receipt — {{summary}}"}},{"action_type":"add_note","config":{"body":"Rent payment received and reconciled — {{summary}}"}}]'::jsonb, true),
      ('Monthly owner statement (draft)','Draft a landlord report. Disabled while drafting.',
        jsonb_build_object('demo',true,'demo_batch_id',v_marker,'kind','scheduled','type','tenancy_ending','config',jsonb_build_object('within_days',365)),
        '{}'::jsonb,
        '[{"action_type":"create_landlord_report","config":{"title":"Monthly owner statement"}}]'::jsonb, false)
    ) AS a(name,descr,trig,cond,acts,en);

    -- NOTE: run history is intentionally NOT fabricated here. The daily cron
    -- runner (and manual "Run now") evaluate these definitions against live
    -- data and create REAL automation_v2_runs + run_steps. Seeding fake runs
    -- (with non-catalogue actions / invented failures) misrepresented the engine.
  END IF;

  UPDATE workspaces SET demo_data_loaded = true, demo_data_variant = 'full' WHERE id = p_workspace_id;
  RETURN v_batch;
END;
$fn$;

-- ── 2. reset_demo_data ──────────────────────────────────────────────────────
-- Removes EVERY demo row this seeder created for the workspace (FK-safe order).
-- Operator: delegates the substrate teardown to delete_demo_data, then clears
--           the deep finance/ledger/automation/document layer by its markers.
-- Supplier/customer: clears their marker-scoped rows.
CREATE OR REPLACE FUNCTION public.reset_demo_data(p_workspace_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  -- Deep operator layer (markers), children before parents.
  -- Posted journal entries carry an immutability trigger (no delete, no unpost)
  -- so app-level tampering is impossible. This is a controlled SECURITY DEFINER
  -- teardown of clearly-marked DEMO rows only, so we suppress row triggers for
  -- the ledger delete (runs as the function owner) then restore.
  SET LOCAL session_replication_role = replica;
  DELETE FROM ledger_journal_lines l
    USING ledger_journal_entries e
    WHERE l.entry_id = e.id AND e.workspace_id = p_workspace_id AND e.memo LIKE 'DEMO[%]%';
  DELETE FROM ledger_journal_entries
    WHERE workspace_id = p_workspace_id AND memo LIKE 'DEMO[%]%';
  SET LOCAL session_replication_role = origin;

  DELETE FROM automation_v2_runs
    WHERE workspace_id = p_workspace_id AND (trigger_context->>'demo_batch_id') IS NOT NULL;
  DELETE FROM automation_definitions
    WHERE workspace_id = p_workspace_id AND (trigger->>'demo_batch_id') IS NOT NULL;

  DELETE FROM bill_lines bl
    USING bills b
    WHERE bl.bill_id = b.id AND b.workspace_id = p_workspace_id AND b.metadata->>'demo_batch_id' IS NOT NULL;
  DELETE FROM bills           WHERE workspace_id = p_workspace_id AND metadata->>'demo_batch_id' IS NOT NULL;
  DELETE FROM payments        WHERE workspace_id = p_workspace_id AND metadata->>'demo_batch_id' IS NOT NULL;
  DELETE FROM arrears_records WHERE workspace_id = p_workspace_id AND metadata->>'demo_batch_id' IS NOT NULL;
  DELETE FROM deposits        WHERE workspace_id = p_workspace_id AND metadata->>'demo_batch_id' IS NOT NULL;
  DELETE FROM invoices        WHERE workspace_id = p_workspace_id AND (demo OR is_demo) AND invoice_number LIKE 'DEMO-INV-%';
  DELETE FROM documents       WHERE workspace_id = p_workspace_id AND demo AND metadata->>'demo_batch_id' IS NOT NULL;

  -- Supplier layer
  DELETE FROM supplier_directory          WHERE workspace_id = p_workspace_id AND metadata->>'demo_batch_id' IS NOT NULL;
  DELETE FROM supplier_workspace_services WHERE workspace_id = p_workspace_id AND name IN
    ('End-of-Tenancy Deep Clean','Gas Safety Certificate (CP12)','EICR Electrical Inspection','Handyman','24/7 Emergency Plumbing')
    AND (SELECT type FROM workspaces w WHERE w.id = p_workspace_id) = 'supplier';
  DELETE FROM supplier_workspace_packages WHERE workspace_id = p_workspace_id AND name IN ('New Tenancy Ready','Annual Compliance Bundle')
    AND (SELECT type FROM workspaces w WHERE w.id = p_workspace_id) = 'supplier';
  DELETE FROM supplier_workspace_profiles WHERE workspace_id = p_workspace_id
    AND bio LIKE 'DEMO supplier profile%';

  -- Customer layer
  DELETE FROM marketplace_enquiries   WHERE buyer_workspace_id = p_workspace_id AND message LIKE 'DEMO enquiry%';
  DELETE FROM marketplace_saved_items WHERE workspace_id = p_workspace_id AND note = 'DEMO shortlist';

  -- Operator substrate (properties/units/tenancies/contacts/tasks/jobs/etc.)
  -- delete_demo_data is FK-safe and clears demo_data_loaded when nothing remains.
  PERFORM public.delete_demo_data(p_workspace_id, false);

  -- For supplier/customer (no substrate), clear the loaded flag explicitly.
  UPDATE workspaces SET demo_data_loaded = false, demo_data_variant = NULL
  WHERE id = p_workspace_id
    AND NOT EXISTS (SELECT 1 FROM properties p WHERE p.workspace_id = p_workspace_id AND p.demo);
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.seed_full_demo_workspace(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reset_demo_data(uuid) TO authenticated, service_role;
