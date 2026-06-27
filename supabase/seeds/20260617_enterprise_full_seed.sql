-- =====================================================================
-- Propvora — ENTERPRISE FULL-DEPTH SEED  (idempotent)
-- Marker: seed = 'enterprise_full_v1'  /  ledger memos prefixed 'EFS:'
-- Operator workspace : 7d9e941b-c6f1-4293-bcbc-76b2197a69bb (JT Property Manager)
-- Supplier workspace : 2cb94055-8fd2-4807-8f34-9c88e47aa318
-- Owner user         : 55ce717b-cd55-4e0c-9871-62621e4c95d3
--
-- This file ADDS the property-ops + finance + calendar + automation depth
-- that the existing "full" demo set is missing. It does NOT duplicate the
-- existing 12 properties / 15 contacts / 48 invoices / 198 expenses — it
-- reuses them as FK anchors and fills: bills, payments, arrears, deposits,
-- a balancing double-entry ledger, calendar, automations + runs, documents,
-- and extra jobs / ppm / compliance / tasks for visual density.
--
-- Money convention (verified against live rows):
--   * bills / payments / arrears / deposits / invoices / expense_records /
--     money_transactions  -> POUNDS (numeric, e.g. 1450.00)
--   * ledger_journal_lines -> PENCE (debit_pence / credit_pence, integer)
-- =====================================================================

DO $seed$
DECLARE
  v_op   uuid := '7d9e941b-c6f1-4293-bcbc-76b2197a69bb';
  v_sup  uuid := '2cb94055-8fd2-4807-8f34-9c88e47aa318';
  v_user uuid := '55ce717b-cd55-4e0c-9871-62621e4c95d3';
  v_today date := CURRENT_DATE;

  -- property anchors (existing operator portfolio)
  p_oak       uuid := 'eab53aad-f4fd-424f-b49c-0ab566dbe98d'; -- 14 Oak Lane, London (BTL)
  p_chestnut  uuid := '0affdca9-bb46-4da3-9b47-104a03006c0b'; -- 15 Chestnut Drive, Dudley
  p_birch     uuid := '2de3ec9e-7b1c-46d9-a66a-18f323a1a72c'; -- 22 Birchfield Lane, Wolverhampton (HMO)
  p_park      uuid := 'a6adeaef-3fc7-4d1c-9c72-07162835238a'; -- 22 Park Road, Manchester (HMO)
  p_sycamore  uuid := '648fe1b0-97c7-4ecd-90bb-a8742486ee4c'; -- 42 Sycamore Road, Birmingham (HMO)
  p_hawthorn  uuid := '1e8c29cf-3227-4031-9036-09fd1af08a82'; -- 88 Hawthorn Street, Birmingham
  p_riverside uuid := 'a77a63f0-daed-4736-9f96-1d01b5ebf237'; -- Apt 3B Riverside, London
  p_beech     uuid := '0a7957cf-92b0-4ad0-abe0-2c5a73017b28'; -- Beech House, Leeds (student)
  p_maple     uuid := '8971ca28-2d30-4287-93bf-96f46f0564d2'; -- Maple Court, Birmingham (SA)
  p_mill      uuid := 'c85a207a-99cd-4114-9bcb-7240c747b333'; -- Mill Cottage, Bristol
  p_oakwood   uuid := '3cbf7ae1-bbeb-4707-a5cf-13dc0b9140e4'; -- Oakwood Terrace, Birmingham (student)
  p_light     uuid := 'f5c41e80-c253-4123-80c0-4bcb26c1e1f7'; -- The Lighthouse, Brighton (SA)

  -- tenant contacts
  c_amara   uuid := '540948b2-c285-4378-9027-6eb5eb38482e';
  c_emma    uuid := '5b14cf03-e4e9-4eb9-a87c-8620e8587e87';
  c_james_o uuid := 'a6fe4ddd-550e-40d4-8d9b-2715ccf75924';
  c_james_t uuid := '2ace92fe-7a13-4865-81ec-2ab2e25c89f4';
  c_marcus  uuid := '1a6c6dcc-60ce-4889-b64f-5422b79210a4';
  c_priya   uuid := 'cc224e96-bcc1-4753-97f2-b7a438000ce0';
  c_sarah   uuid := 'd3baf680-fba6-463a-ae42-52433b96aba4';
  c_sophie  uuid := 'dbab47c6-4aca-4cf3-be24-29a2d4580f41';
  -- supplier contacts
  s_bright  uuid := '12332cda-df42-4195-95cd-8ff5db3d1a53'; -- Bright & Clean
  s_dave_h  uuid := '09667063-4ef7-45e7-86c5-f699bea2aa4c'; -- Dave Holloway (plumber)
  s_dave_p  uuid := '2da516a9-22c5-4ed6-b122-541064de8036'; -- Dave Patel (gas)
  s_rajesh  uuid := '6e76c7f0-2bd7-415a-9202-c5a3594b45c9'; -- Rajesh Kapoor
  s_sparks  uuid := '4f6760db-6c47-4a2e-84e2-3c772ceb4093'; -- Sparks Electrical
  -- owner contacts
  o_gerald  uuid := 'aa83da4a-4e95-4385-b17a-8c509a985800';
  o_patricia uuid := 'ae27863b-c40d-4b15-8683-2fa8e615f041';

  -- tenancy anchors
  t_park   uuid := '4824f775-02bd-403d-aaab-8c233e3a4522';
  t_syc    uuid := '9df73c18-701f-41cb-819e-5454b16b719b';
  t_beech  uuid := '90a3d36e-dc2e-42a7-a23a-71ec17f281fd';
  t_haw    uuid := '86b2a26c-635e-45ad-9b82-f77237a7d823';
  t_oak    uuid := '0a74aa69-2c96-4173-9bbd-c2e25e296ed6';
  t_light  uuid := '706ab3b6-2f3c-4916-9bdd-2d2199570661';
  t_birch  uuid := '824ded0c-0358-4bff-b34d-5fc4c3f87cf9';
  t_river  uuid := '3f0ec392-be04-466d-bb5c-b4037e94df44';

  -- ledger account ids (resolved by code below)
  a_bank      uuid; a_client uuid; a_deposit_held uuid; a_rent_recv uuid; a_portfolio uuid;
  a_creditors uuid; a_tdep_liab uuid; a_vat uuid; a_mortgage uuid; a_supplier_pay uuid;
  a_owner_cap uuid; a_retained uuid; a_drawings uuid;
  a_rent_inc  uuid; a_mgmt_inc uuid; a_other_inc uuid;
  a_repairs   uuid; a_letting uuid; a_insurance uuid; a_utilities uuid; a_counciltax uuid;
  a_grsc uuid; a_mort_int uuid; a_legal uuid; a_compliance uuid; a_bank_chg uuid;

  -- working vars
  v_entry uuid;
  v_no    bigint;
  v_bill  uuid;
  v_m     int;
  v_dt    date;
  v_def   uuid;
BEGIN
  -- ---- resolve ledger accounts by code (operator chart already seeded) ----
  SELECT id INTO a_bank        FROM ledger_accounts WHERE workspace_id=v_op AND code='1000';
  SELECT id INTO a_client      FROM ledger_accounts WHERE workspace_id=v_op AND code='1010';
  SELECT id INTO a_deposit_held FROM ledger_accounts WHERE workspace_id=v_op AND code='1020';
  SELECT id INTO a_rent_recv   FROM ledger_accounts WHERE workspace_id=v_op AND code='1100';
  SELECT id INTO a_portfolio   FROM ledger_accounts WHERE workspace_id=v_op AND code='1500';
  SELECT id INTO a_creditors   FROM ledger_accounts WHERE workspace_id=v_op AND code='2000';
  SELECT id INTO a_tdep_liab   FROM ledger_accounts WHERE workspace_id=v_op AND code='2100';
  SELECT id INTO a_vat         FROM ledger_accounts WHERE workspace_id=v_op AND code='2200';
  SELECT id INTO a_mortgage    FROM ledger_accounts WHERE workspace_id=v_op AND code='2300';
  SELECT id INTO a_supplier_pay FROM ledger_accounts WHERE workspace_id=v_op AND code='2500';
  SELECT id INTO a_owner_cap   FROM ledger_accounts WHERE workspace_id=v_op AND code='3000';
  SELECT id INTO a_retained    FROM ledger_accounts WHERE workspace_id=v_op AND code='3100';
  SELECT id INTO a_drawings    FROM ledger_accounts WHERE workspace_id=v_op AND code='3200';
  SELECT id INTO a_rent_inc    FROM ledger_accounts WHERE workspace_id=v_op AND code='4000';
  SELECT id INTO a_mgmt_inc    FROM ledger_accounts WHERE workspace_id=v_op AND code='4100';
  SELECT id INTO a_other_inc   FROM ledger_accounts WHERE workspace_id=v_op AND code='4200';
  SELECT id INTO a_repairs     FROM ledger_accounts WHERE workspace_id=v_op AND code='5000';
  SELECT id INTO a_letting     FROM ledger_accounts WHERE workspace_id=v_op AND code='5100';
  SELECT id INTO a_insurance   FROM ledger_accounts WHERE workspace_id=v_op AND code='5200';
  SELECT id INTO a_utilities   FROM ledger_accounts WHERE workspace_id=v_op AND code='5300';
  SELECT id INTO a_counciltax  FROM ledger_accounts WHERE workspace_id=v_op AND code='5400';
  SELECT id INTO a_grsc        FROM ledger_accounts WHERE workspace_id=v_op AND code='5500';
  SELECT id INTO a_mort_int    FROM ledger_accounts WHERE workspace_id=v_op AND code='5600';
  SELECT id INTO a_legal       FROM ledger_accounts WHERE workspace_id=v_op AND code='5700';
  SELECT id INTO a_compliance  FROM ledger_accounts WHERE workspace_id=v_op AND code='5800';
  SELECT id INTO a_bank_chg    FROM ledger_accounts WHERE workspace_id=v_op AND code='6000';

  -- =================================================================
  -- 1. DEPOSITS  (held / protected / scheme) — pounds
  -- =================================================================
  INSERT INTO deposits (workspace_id, deposit_type, property_id, unit_id, tenancy_id, contact_id,
      amount, currency, status, received_date, protection_scheme, reference_number, held_by, notes, created_by, metadata)
  SELECT * FROM (VALUES
    (v_op,'tenant_deposit',p_oak,NULL::uuid,t_oak,c_sarah,2480.00,'GBP','protected',(v_today-280),'DPS','DPS-OAK-44821','Deposit Protection Service','Single-tenant BTL deposit, 5 weeks rent',v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,'tenant_deposit',p_hawthorn,NULL,t_haw,c_amara,1212.00,'GBP','protected',(v_today-300),'MyDeposits','MYD-HAW-77310','mydeposits','Protected within 30 days',v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,'tenant_deposit',p_riverside,'4803b82a-8df7-4911-bf54-a2c1d7fa72a5',t_river,c_priya,2134.00,'GBP','protected',(v_today-110),'TDS','TDS-RIV-90021','Tenancy Deposit Scheme','Riverside flat',v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,'tenant_deposit',p_beech,'c254ad32-4a78-4259-bbd4-74064cafebab',t_beech,c_marcus,2280.00,'GBP','protected',(v_today-360),'DPS','DPS-BEE-11204','Deposit Protection Service','Student let, joint deposit',v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,'tenant_deposit',p_sycamore,'8ad2eb59-20c5-43f5-b1b6-a33cdf6351d3',t_syc,c_james_t,575.00,'GBP','protected',(v_today-330),'TDS','TDS-SYC-30417','Tenancy Deposit Scheme','HMO room 1',v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,'tenant_deposit',p_birch,'a9658018-94fb-45da-b4f5-57d85df9fa8d',t_birch,c_sophie,525.00,'GBP','received',(v_today-150),NULL,'BIR-ROOMA-001','Pending protection','Awaiting scheme registration (due_soon)',v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,'tenant_deposit',p_light,'255405f9-ba84-41b9-8b4a-9fa0c3a6ca35',t_light,c_emma,1640.00,'GBP','protected',(v_today-200),'MyDeposits','MYD-LIG-55218','mydeposits','SA-lite long stay',v_user,'{"seed":"enterprise_full_v1"}'::jsonb)
  ) AS d(workspace_id,deposit_type,property_id,unit_id,tenancy_id,contact_id,amount,currency,status,received_date,protection_scheme,reference_number,held_by,notes,created_by,metadata)
  WHERE NOT EXISTS (SELECT 1 FROM deposits x WHERE x.workspace_id=v_op AND x.metadata->>'seed'='enterprise_full_v1');

  -- =================================================================
  -- 2. ARREARS records (mix of open/chasing/payment_plan/resolved) — pounds
  -- =================================================================
  INSERT INTO arrears_records (workspace_id, property_id, unit_id, tenancy_id, contact_id,
      amount_due, amount_paid, amount_outstanding, due_date, days_overdue, status, last_chased_at, next_chase_at, notes, created_by, metadata)
  SELECT * FROM (VALUES
    (v_op,p_sycamore,'8ad2eb59-20c5-43f5-b1b6-a33cdf6351d3',t_syc,c_james_t,575.00,0.00,575.00,(v_today-12),12,'chasing',(now()-interval '5 days'),(now()+interval '2 days'),'1st & 2nd reminder sent; tenant promises payment Friday',v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,p_park,'8a3dd499-7cad-4cf1-bbd1-16ea2ab4226e',t_park,c_james_o,695.00,300.00,395.00,(v_today-26),26,'payment_plan',(now()-interval '8 days'),(now()+interval '6 days'),'Agreed £100/wk catch-up plan',v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,p_birch,'a9658018-94fb-45da-b4f5-57d85df9fa8d',t_birch,c_sophie,525.00,0.00,525.00,(v_today-3),3,'open',NULL,(now()+interval '4 days'),'Just gone overdue — first reminder queued',v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,p_hawthorn,NULL::uuid,t_haw,c_amara,1050.00,1050.00,0.00,(v_today-40),0,'resolved',(now()-interval '30 days'),NULL,'Cleared in full after payment plan',v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,p_beech,'c254ad32-4a78-4259-bbd4-74064cafebab',t_beech,c_marcus,1980.00,0.00,1980.00,(v_today-55),55,'disputed',(now()-interval '20 days'),(now()+interval '3 days'),'Tenant disputing a deduction; escalated to guarantor',v_user,'{"seed":"enterprise_full_v1"}'::jsonb)
  ) AS a(workspace_id,property_id,unit_id,tenancy_id,contact_id,amount_due,amount_paid,amount_outstanding,due_date,days_overdue,status,last_chased_at,next_chase_at,notes,created_by,metadata)
  WHERE NOT EXISTS (SELECT 1 FROM arrears_records x WHERE x.workspace_id=v_op AND x.metadata->>'seed'='enterprise_full_v1');

  -- =================================================================
  -- 3. PAYMENTS (rent received + supplier payments) — pounds
  -- =================================================================
  INSERT INTO payments (workspace_id, payment_type, linked_type, contact_id, property_id,
      amount, currency, payment_date, payment_method, status, reference, notes, created_by, metadata)
  SELECT * FROM (VALUES
    (v_op,'income','tenancy',c_sarah,p_oak,2150.00,'GBP',(v_today-5),'bank_transfer','completed','RENT-OAK-'||to_char(v_today-5,'YYYYMM'),'Monthly rent received',v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,'income','tenancy',c_priya,p_riverside,1850.00,'GBP',(v_today-7),'bank_transfer','completed','RENT-RIV-'||to_char(v_today-7,'YYYYMM'),'Monthly rent received',v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,'income','tenancy',c_emma,p_light,1640.00,'GBP',(v_today-9),'standing_order','completed','RENT-LIG-'||to_char(v_today-9,'YYYYMM'),'Monthly rent received',v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,'income','tenancy',c_amara,p_hawthorn,1050.00,'GBP',(v_today-11),'bank_transfer','completed','RENT-HAW-'||to_char(v_today-11,'YYYYMM'),'Monthly rent received',v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,'income','tenancy',c_james_o,p_park,300.00,'GBP',(v_today-6),'cash','completed','RENT-PARK-PARTIAL','Partial — payment plan instalment',v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,'expense','job',s_dave_p,p_sycamore,96.00,'GBP',(v_today-14),'bank_transfer','completed','PAY-GAS-SYC','Annual gas safety certificate',v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,'expense','job',s_sparks,p_birch,260.00,'GBP',(v_today-20),'bank_transfer','completed','PAY-EICR-BIR','EICR remedial works',v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,'expense','job',s_bright,p_maple,140.00,'GBP',(v_today-3),'card','completed','PAY-CLEAN-MAP','Changeover deep clean',v_user,'{"seed":"enterprise_full_v1"}'::jsonb)
  ) AS p(workspace_id,payment_type,linked_type,contact_id,property_id,amount,currency,payment_date,payment_method,status,reference,notes,created_by,metadata)
  WHERE NOT EXISTS (SELECT 1 FROM payments x WHERE x.workspace_id=v_op AND x.metadata->>'seed'='enterprise_full_v1');

  -- =================================================================
  -- 4. BILLS (purchase ledger) + bill_lines — pounds. paid/overdue/draft/approved
  -- =================================================================
  IF NOT EXISTS (SELECT 1 FROM bills WHERE workspace_id=v_op AND metadata->>'seed'='enterprise_full_v1') THEN
    -- Bill A: gas safety (paid)
    v_bill := gen_random_uuid();
    INSERT INTO bills (id,workspace_id,bill_number,bill_type,supplier_contact_id,property_id,status,issue_date,due_date,subtotal,tax_amount,total,currency,paid_at,notes,created_by,metadata)
    VALUES (v_bill,v_op,'BILL-2026-0101','supplier_invoice',s_dave_p,p_sycamore,'paid',(v_today-20),(v_today-6),80.00,16.00,96.00,'GBP',(now()-interval '14 days'),'Gas safety certificate — 42 Sycamore Road',v_user,'{"seed":"enterprise_full_v1"}'::jsonb);
    INSERT INTO bill_lines (workspace_id,bill_id,description,quantity,unit_price,tax_rate,line_total,sort_order)
    VALUES (v_op,v_bill,'Annual Landlord Gas Safety Record (CP12)',1,80.00,20.0,80.00,0);

    -- Bill B: EICR remedial (paid)
    v_bill := gen_random_uuid();
    INSERT INTO bills (id,workspace_id,bill_number,bill_type,supplier_contact_id,property_id,status,issue_date,due_date,subtotal,tax_amount,total,currency,paid_at,notes,created_by,metadata)
    VALUES (v_bill,v_op,'BILL-2026-0102','supplier_invoice',s_sparks,p_birch,'paid',(v_today-25),(v_today-11),216.67,43.33,260.00,'GBP',(now()-interval '20 days'),'EICR remedial works — 22 Birchfield Lane',v_user,'{"seed":"enterprise_full_v1"}'::jsonb);
    INSERT INTO bill_lines (workspace_id,bill_id,description,quantity,unit_price,tax_rate,line_total,sort_order) VALUES
      (v_op,v_bill,'Replace consumer unit RCBOs',1,180.00,20.0,180.00,0),
      (v_op,v_bill,'Re-test and certify',1,36.67,20.0,36.67,1);

    -- Bill C: boiler repair (overdue)
    v_bill := gen_random_uuid();
    INSERT INTO bills (id,workspace_id,bill_number,bill_type,supplier_contact_id,property_id,status,issue_date,due_date,subtotal,tax_amount,total,currency,notes,created_by,metadata)
    VALUES (v_bill,v_op,'BILL-2026-0103','supplier_invoice',s_dave_h,p_oak,'overdue',(v_today-50),(v_today-20),325.00,65.00,390.00,'GBP','Emergency boiler repair — 14 Oak Lane (PAST DUE)',v_user,'{"seed":"enterprise_full_v1"}'::jsonb);
    INSERT INTO bill_lines (workspace_id,bill_id,description,quantity,unit_price,tax_rate,line_total,sort_order) VALUES
      (v_op,v_bill,'Replace diverter valve',1,210.00,20.0,210.00,0),
      (v_op,v_bill,'Labour 2.5 hrs',1,115.00,20.0,115.00,1);

    -- Bill D: managing agent fee (approved, awaiting payment run)
    v_bill := gen_random_uuid();
    INSERT INTO bills (id,workspace_id,bill_number,bill_type,supplier_contact_id,property_id,status,issue_date,due_date,subtotal,tax_amount,total,currency,approved_at,notes,created_by,metadata)
    VALUES (v_bill,v_op,'BILL-2026-0104','supplier_invoice',s_rajesh,p_beech,'approved',(v_today-8),(v_today+7),150.00,30.00,180.00,'GBP',(now()-interval '2 days'),'Letting fee — Beech House renewal',v_user,'{"seed":"enterprise_full_v1"}'::jsonb);
    INSERT INTO bill_lines (workspace_id,bill_id,description,quantity,unit_price,tax_rate,line_total,sort_order)
    VALUES (v_op,v_bill,'Tenancy renewal admin fee',1,150.00,20.0,150.00,0);

    -- Bill E: cleaning (draft)
    v_bill := gen_random_uuid();
    INSERT INTO bills (id,workspace_id,bill_number,bill_type,supplier_contact_id,property_id,status,issue_date,due_date,subtotal,tax_amount,total,currency,notes,created_by,metadata)
    VALUES (v_bill,v_op,'BILL-2026-0105','supplier_invoice',s_bright,p_maple,'draft',(v_today-2),(v_today+12),116.67,23.33,140.00,'GBP','Changeover deep clean — Maple Court (draft, awaiting approval)',v_user,'{"seed":"enterprise_full_v1"}'::jsonb);
    INSERT INTO bill_lines (workspace_id,bill_id,description,quantity,unit_price,tax_rate,line_total,sort_order)
    VALUES (v_op,v_bill,'2-bed SA deep clean + linen',1,116.67,20.0,116.67,0);

    -- Bill F: insurance instalment (received, due soon)
    v_bill := gen_random_uuid();
    INSERT INTO bills (id,workspace_id,bill_number,bill_type,supplier_contact_id,property_id,status,issue_date,due_date,subtotal,tax_amount,total,currency,notes,created_by,metadata)
    VALUES (v_bill,v_op,'BILL-2026-0106','utility',NULL::uuid,NULL::uuid,'received',(v_today-4),(v_today+10),153.33,0.00,153.33,'GBP','Portfolio landlord insurance — monthly instalment',v_user,'{"seed":"enterprise_full_v1"}'::jsonb);
    INSERT INTO bill_lines (workspace_id,bill_id,description,quantity,unit_price,tax_rate,line_total,sort_order)
    VALUES (v_op,v_bill,'Landlord buildings & liability cover (monthly)',1,153.33,0.0,153.33,0);
  END IF;

  -- =================================================================
  -- 5. DOUBLE-ENTRY LEDGER  (BALANCING) — pence
  --    Opening balances + 6 recent months of rent income, expenses,
  --    mortgage interest, mgmt fee, deposit liability, drawings.
  --    Every entry is internally balanced (debits = credits).
  --    Idempotency: guard on EFS: memo prefix.
  -- =================================================================
  IF NOT EXISTS (SELECT 1 FROM ledger_journal_entries WHERE workspace_id=v_op AND memo LIKE 'EFS:%') THEN
    SELECT COALESCE(MAX(entry_no),0) INTO v_no FROM ledger_journal_entries WHERE workspace_id=v_op;

    -- ENTRY 1: OPENING BALANCES (assets = liabilities + equity)
    -- Dr Bank 45,000 + Dr Property Portfolio 1,250,000 = 1,295,000.00
    -- Cr Mortgage 820,000 + Cr Owner Capital 475,000 = 1,295,000.00
    v_no := v_no + 1; v_entry := gen_random_uuid();
    INSERT INTO ledger_journal_entries (id,workspace_id,entry_no,date,memo,source_type,posted,posted_at,created_by)
    VALUES (v_entry,v_op,v_no,(date_trunc('year',v_today))::date,'EFS: Opening balances 2026','opening',true,now(),v_user);
    INSERT INTO ledger_journal_lines (workspace_id,entry_id,account_id,debit_pence,credit_pence,memo) VALUES
      (v_op,v_entry,a_bank,4500000,0,'Opening bank'),
      (v_op,v_entry,a_portfolio,125000000,0,'Property portfolio at cost'),
      (v_op,v_entry,a_mortgage,0,82000000,'Buy-to-let mortgages'),
      (v_op,v_entry,a_owner_cap,0,47500000,'Owner capital introduced');

    -- 6 months of recurring activity (current month back to -5)
    FOR v_m IN 0..5 LOOP
      v_dt := (date_trunc('month',v_today) - (v_m||' months')::interval)::date + 1;

      -- Rent invoiced & received: Dr Bank 11,430.00 / Cr Rental income 11,430.00
      v_no := v_no + 1; v_entry := gen_random_uuid();
      INSERT INTO ledger_journal_entries (id,workspace_id,entry_no,date,memo,source_type,posted,posted_at,created_by)
      VALUES (v_entry,v_op,v_no,v_dt,'EFS: Rent received '||to_char(v_dt,'Mon YYYY'),'rent',true,now(),v_user);
      INSERT INTO ledger_journal_lines (workspace_id,entry_id,account_id,debit_pence,credit_pence,memo) VALUES
        (v_op,v_entry,a_bank,1143000,0,'Rent banked'),
        (v_op,v_entry,a_rent_inc,0,1143000,'Portfolio rental income');

      -- Mortgage interest paid: Dr Mortgage interest 3,180.00 / Cr Bank 3,180.00
      v_no := v_no + 1; v_entry := gen_random_uuid();
      INSERT INTO ledger_journal_entries (id,workspace_id,entry_no,date,memo,source_type,posted,posted_at,created_by)
      VALUES (v_entry,v_op,v_no,v_dt,'EFS: Mortgage interest '||to_char(v_dt,'Mon YYYY'),'expense',true,now(),v_user);
      INSERT INTO ledger_journal_lines (workspace_id,entry_id,account_id,debit_pence,credit_pence,memo) VALUES
        (v_op,v_entry,a_mort_int,318000,0,'BTL mortgage interest'),
        (v_op,v_entry,a_bank,0,318000,'Mortgage DD');

      -- Repairs & maintenance: Dr Repairs 420.00 + Dr VAT 84.00 / Cr Bank 504.00
      v_no := v_no + 1; v_entry := gen_random_uuid();
      INSERT INTO ledger_journal_entries (id,workspace_id,entry_no,date,memo,source_type,posted,posted_at,created_by)
      VALUES (v_entry,v_op,v_no,v_dt,'EFS: Repairs & maintenance '||to_char(v_dt,'Mon YYYY'),'expense',true,now(),v_user);
      INSERT INTO ledger_journal_lines (workspace_id,entry_id,account_id,debit_pence,credit_pence,memo) VALUES
        (v_op,v_entry,a_repairs,42000,0,'Reactive repairs'),
        (v_op,v_entry,a_vat,8400,0,'Input VAT'),
        (v_op,v_entry,a_bank,0,50400,'Paid to contractors');

      -- Insurance + utilities + council tax (voids): Dr Ins 153.33 + Dr Util 95.00 + Dr CTax 110.00 / Cr Bank 358.33
      v_no := v_no + 1; v_entry := gen_random_uuid();
      INSERT INTO ledger_journal_entries (id,workspace_id,entry_no,date,memo,source_type,posted,posted_at,created_by)
      VALUES (v_entry,v_op,v_no,v_dt,'EFS: Insurance & utilities '||to_char(v_dt,'Mon YYYY'),'expense',true,now(),v_user);
      INSERT INTO ledger_journal_lines (workspace_id,entry_id,account_id,debit_pence,credit_pence,memo) VALUES
        (v_op,v_entry,a_insurance,15333,0,'Landlord insurance'),
        (v_op,v_entry,a_utilities,9500,0,'Void-period utilities'),
        (v_op,v_entry,a_counciltax,11000,0,'Void-period council tax'),
        (v_op,v_entry,a_bank,0,35833,'Paid');

      -- Management fee income (3rd-party landlords): Dr Bank 640.00 / Cr Mgmt fee income 640.00
      v_no := v_no + 1; v_entry := gen_random_uuid();
      INSERT INTO ledger_journal_entries (id,workspace_id,entry_no,date,memo,source_type,posted,posted_at,created_by)
      VALUES (v_entry,v_op,v_no,v_dt,'EFS: Management fees '||to_char(v_dt,'Mon YYYY'),'income',true,now(),v_user);
      INSERT INTO ledger_journal_lines (workspace_id,entry_id,account_id,debit_pence,credit_pence,memo) VALUES
        (v_op,v_entry,a_bank,64000,0,'Mgmt fees collected'),
        (v_op,v_entry,a_mgmt_inc,0,64000,'Management fee income');
    END LOOP;

    -- ENTRY: Tenant deposits received this period (liability): Dr Client money 4,500.00 / Cr Tenant deposits held 4,500.00
    v_no := v_no + 1; v_entry := gen_random_uuid();
    INSERT INTO ledger_journal_entries (id,workspace_id,entry_no,date,memo,source_type,posted,posted_at,created_by)
    VALUES (v_entry,v_op,v_no,(v_today-30),'EFS: Tenant deposits received (held in scheme)','deposit',true,now(),v_user);
    INSERT INTO ledger_journal_lines (workspace_id,entry_id,account_id,debit_pence,credit_pence,memo) VALUES
      (v_op,v_entry,a_client,450000,0,'Deposits into client account'),
      (v_op,v_entry,a_tdep_liab,0,450000,'Tenant deposits liability');

    -- ENTRY: Owner drawings: Dr Drawings 6,000.00 / Cr Bank 6,000.00
    v_no := v_no + 1; v_entry := gen_random_uuid();
    INSERT INTO ledger_journal_entries (id,workspace_id,entry_no,date,memo,source_type,posted,posted_at,created_by)
    VALUES (v_entry,v_op,v_no,(v_today-15),'EFS: Owner drawings','drawings',true,now(),v_user);
    INSERT INTO ledger_journal_lines (workspace_id,entry_id,account_id,debit_pence,credit_pence,memo) VALUES
      (v_op,v_entry,a_drawings,600000,0,'Owner drawings'),
      (v_op,v_entry,a_bank,0,600000,'Paid to owner');

    -- ENTRY: Legal & professional + compliance certs: Dr Legal 250.00 + Dr Compliance 180.00 / Cr Bank 430.00
    v_no := v_no + 1; v_entry := gen_random_uuid();
    INSERT INTO ledger_journal_entries (id,workspace_id,entry_no,date,memo,source_type,posted,posted_at,created_by)
    VALUES (v_entry,v_op,v_no,(v_today-22),'EFS: Legal & compliance certs','expense',true,now(),v_user);
    INSERT INTO ledger_journal_lines (workspace_id,entry_id,account_id,debit_pence,credit_pence,memo) VALUES
      (v_op,v_entry,a_legal,25000,0,'Accountancy & legal'),
      (v_op,v_entry,a_compliance,18000,0,'Gas/EICR certificates'),
      (v_op,v_entry,a_bank,0,43000,'Paid');
  END IF;

  -- =================================================================
  -- 6. CALENDAR EVENTS — next 90 days, typed (compliance/tenancy/work/viewing/inspection/deadline)
  -- =================================================================
  INSERT INTO calendar_events (workspace_id,title,type,event_type,description,property_id,start_date,start_at,all_day,priority,related_type,created_by,metadata)
  SELECT * FROM (VALUES
    (v_op,'Gas safety due — 22 Park Road','compliance','event','Annual CP12 inspection due',p_park,(v_today+9),(v_today+9)::timestamptz,true,'high','compliance',v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,'EICR expiry — 88 Hawthorn Street','compliance','event','5-year electrical certificate expires',p_hawthorn,(v_today+21),(v_today+21)::timestamptz,true,'high','compliance',v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,'EPC renewal — Beech House','compliance','event','EPC expires, re-assessment needed',p_beech,(v_today+34),(v_today+34)::timestamptz,true,'medium','compliance',v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,'HMO licence renewal — 42 Sycamore Road','deadline','event','5-year HMO licence renewal deadline',p_sycamore,(v_today+47),(v_today+47)::timestamptz,true,'high','compliance',v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,'Fire alarm service — 22 Birchfield Lane','compliance','event','Annual fire alarm & emergency lighting test',p_birch,(v_today+5),(v_today+5)::timestamptz,true,'medium','compliance',v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,'Tenancy ends — 42 Sycamore Room 1','tenancy','event','AST fixed term ends; renewal or notice',p_sycamore,(v_today+60),(v_today+60)::timestamptz,true,'medium','tenancy',v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,'Tenancy renewal — Beech House','tenancy','event','Student let renewal window opens',p_beech,(v_today+12),(v_today+12)::timestamptz,true,'medium','tenancy',v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,'Property viewing — Mill Cottage','viewing','event','Prospective tenant viewing 11:00',p_mill,(v_today+3),(v_today+3)::timestamptz+time '11:00',false,'medium','viewing',v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,'Mid-term inspection — 14 Oak Lane','inspection','event','Routine property inspection',p_oak,(v_today+18),(v_today+18)::timestamptz+time '14:30',false,'low','inspection',v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,'Boiler service — Mill Cottage','work','event','Annual boiler service (PPM)',p_mill,(v_today+28),(v_today+28)::timestamptz,true,'medium','work',v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,'Gutter clearing — Oakwood Terrace','work','event','Seasonal gutter clearing',p_oakwood,(v_today+40),(v_today+40)::timestamptz,true,'low','work',v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,'Rent review — Apt 3B Riverside','tenancy','event','Annual rent review discussion',p_riverside,(v_today+52),(v_today+52)::timestamptz,true,'low','tenancy',v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,'SA changeover — The Lighthouse','work','event','Guest checkout & deep clean',p_light,(v_today+2),(v_today+2)::timestamptz+time '10:00',false,'high','work',v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,'Insurance renewal deadline','deadline','event','Portfolio landlord insurance renewal',NULL::uuid,(v_today+15),(v_today+15)::timestamptz,true,'high','general',v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,'Quarterly VAT return','deadline','event','VAT return submission deadline',NULL::uuid,(v_today+75),(v_today+75)::timestamptz,true,'high','general',v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,'Legionella risk assessment — 22 Park Road','compliance','event','2-yearly legionella review',p_park,(v_today+66),(v_today+66)::timestamptz,true,'medium','compliance',v_user,'{"seed":"enterprise_full_v1"}'::jsonb)
  ) AS e(workspace_id,title,type,event_type,description,property_id,start_date,start_at,all_day,priority,related_type,created_by,metadata)
  WHERE NOT EXISTS (SELECT 1 FROM calendar_events x WHERE x.workspace_id=v_op AND x.metadata->>'seed'='enterprise_full_v1');

  -- =================================================================
  -- 7. AUTOMATIONS — definitions (operator + supplier) enabled, source=template
  -- =================================================================
  IF NOT EXISTS (SELECT 1 FROM automation_definitions WHERE workspace_id=v_op AND (trigger->>'seed')='enterprise_full_v1') THEN
    -- Definitions use the REAL engine shape: trigger.type is a CATALOGUE trigger
    -- the engine evaluates against live data; actions[].action_type is a SAFE
    -- catalogue action the executor runs. Run history is NOT fabricated — the
    -- daily cron + "Run now" generate REAL automation_v2_runs against this seed's
    -- own live data (overdue rent, due-soon compliance, ending tenancies, etc.).
    -- (Previously these used trigger.type='schedule'/'event' + non-catalogue
    -- actions like send_email/notify/reconcile, so the engine matched 0 and never
    -- ran — and fake succeeded/failed/skipped/running runs were seeded to hide it.)

    -- 1) Rent overdue chaser (operator)
    v_def := gen_random_uuid();
    INSERT INTO automation_definitions (id,workspace_id,name,description,trigger,conditions,actions,enabled,source,created_by)
    VALUES (v_def,v_op,'Rent overdue → chase tenant',
      'When rent is overdue, draft a reminder and create a follow-up task.',
      jsonb_build_object('seed','enterprise_full_v1','kind','scheduled','type','rent_overdue','config','{}'::jsonb),
      '{}'::jsonb,
      '[{"action_type":"draft_message","config":{"subject":"Overdue rent — {{summary}}"}},{"action_type":"create_task","config":{"title":"Chase overdue rent — {{summary}}","priority":"high"}}]'::jsonb,
      true,'template',v_user);

    -- 2) Compliance expiry reminder (operator)
    v_def := gen_random_uuid();
    INSERT INTO automation_definitions (id,workspace_id,name,description,trigger,conditions,actions,enabled,source,created_by)
    VALUES (v_def,v_op,'Compliance due in 30 days → alert',
      'Alert 30 days before any compliance certificate expires and raise a task.',
      jsonb_build_object('seed','enterprise_full_v1','kind','scheduled','type','compliance_due_soon','config',jsonb_build_object('within_days',30)),
      '{}'::jsonb,
      '[{"action_type":"create_notification","config":{"title":"Compliance due soon — {{summary}}","severity":"warning"}},{"action_type":"create_task","config":{"title":"Book compliance renewal — {{summary}}","priority":"high","due_in_days":14}}]'::jsonb,
      true,'template',v_user);

    -- 3) New maintenance request → triage task (operator)
    v_def := gen_random_uuid();
    INSERT INTO automation_definitions (id,workspace_id,name,description,trigger,conditions,actions,enabled,source,created_by)
    VALUES (v_def,v_op,'New maintenance request → triage task',
      'When a maintenance request is submitted, raise a triage task to assign a supplier.',
      jsonb_build_object('seed','enterprise_full_v1','kind','event','type','maintenance_request_submitted','config','{}'::jsonb),
      '{}'::jsonb,
      '[{"action_type":"create_task","config":{"title":"Triage maintenance request — {{summary}}","priority":"normal"}}]'::jsonb,
      true,'template',v_user);

    -- 4) Tenancy ending → renewal workflow (operator)
    v_def := gen_random_uuid();
    INSERT INTO automation_definitions (id,workspace_id,name,description,trigger,conditions,actions,enabled,source,created_by)
    VALUES (v_def,v_op,'Tenancy ending in 60 days → renewal',
      'Start the renewal workflow 60 days before a fixed term ends.',
      jsonb_build_object('seed','enterprise_full_v1','kind','scheduled','type','tenancy_ending','config',jsonb_build_object('within_days',60)),
      '{}'::jsonb,
      '[{"action_type":"create_task","config":{"title":"Prepare renewal offer — {{summary}}","due_in_days":14}}]'::jsonb,
      true,'template',v_user);

    -- 5) Rent received → receipt draft (operator)
    v_def := gen_random_uuid();
    INSERT INTO automation_definitions (id,workspace_id,name,description,trigger,conditions,actions,enabled,source,created_by)
    VALUES (v_def,v_op,'Rent received → receipt draft',
      'On a matched rent payment, draft a receipt and note it on the record.',
      jsonb_build_object('seed','enterprise_full_v1','kind','event','type','rent_payment_received','config','{}'::jsonb),
      '{}'::jsonb,
      '[{"action_type":"draft_message","config":{"subject":"Rent receipt — {{summary}}"}},{"action_type":"add_note","config":{"body":"Rent payment received and reconciled — {{summary}}"}}]'::jsonb,
      true,'template',v_user);

    -- 6) Disabled draft example (operator)
    v_def := gen_random_uuid();
    INSERT INTO automation_definitions (id,workspace_id,name,description,trigger,conditions,actions,enabled,source,created_by)
    VALUES (v_def,v_op,'Monthly owner statement (draft)',
      'Draft a landlord report. Disabled while drafting.',
      jsonb_build_object('seed','enterprise_full_v1','kind','scheduled','type','tenancy_ending','config',jsonb_build_object('within_days',365)),
      '{}'::jsonb,
      '[{"action_type":"create_landlord_report","config":{"title":"Monthly owner statement"}}]'::jsonb,
      false,'template',v_user);
  END IF;

  -- Supplier workspace automations
  IF NOT EXISTS (SELECT 1 FROM automation_definitions WHERE workspace_id=v_sup AND (trigger->>'seed')='enterprise_full_v1') THEN
    v_def := gen_random_uuid();
    INSERT INTO automation_definitions (id,workspace_id,name,description,trigger,conditions,actions,enabled,source,created_by)
    VALUES (v_def,v_sup,'New maintenance request → acknowledge',
      'Acknowledge new maintenance requests and notify the team.',
      jsonb_build_object('seed','enterprise_full_v1','kind','event','type','maintenance_request_submitted','config','{}'::jsonb),
      '{}'::jsonb,'[{"action_type":"create_notification","config":{"title":"New maintenance request — {{summary}}","severity":"info"}},{"action_type":"create_task","config":{"title":"Acknowledge request — {{summary}}"}}]'::jsonb,
      true,'template',v_user);

    v_def := gen_random_uuid();
    INSERT INTO automation_definitions (id,workspace_id,name,description,trigger,conditions,actions,enabled,source,created_by)
    VALUES (v_def,v_sup,'Job completed → follow-up task',
      'When a job is marked complete, raise a follow-up/invoice-draft task.',
      jsonb_build_object('seed','enterprise_full_v1','kind','event','type','job_completed','config','{}'::jsonb),
      '{}'::jsonb,'[{"action_type":"create_task","config":{"title":"Raise invoice for completed job — {{summary}}"}}]'::jsonb,
      true,'template',v_user);
  END IF;

  -- =================================================================
  -- 8. DOCUMENTS — tenancy agreements, certificates, invoices (R2 placeholders)
  -- =================================================================
  INSERT INTO documents (workspace_id,property_id,tenancy_id,name,type,category,mime_type,size_bytes,r2_key,r2_bucket,status,tags,created_by,metadata)
  SELECT * FROM (VALUES
    (v_op,p_oak,t_oak,'AST — 14 Oak Lane.pdf','tenancy_agreement','tenancy','application/pdf',184320::bigint,'docs/'||v_op||'/ast-oak-lane.pdf','propvora-documents','active',ARRAY['tenancy','signed'],v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,p_sycamore,t_syc,'Gas Safety Record — 42 Sycamore.pdf','certificate','compliance','application/pdf',96000::bigint,'docs/'||v_op||'/cp12-sycamore.pdf','propvora-documents','active',ARRAY['gas','compliance'],v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,p_birch,NULL::uuid,'EICR — 22 Birchfield Lane.pdf','certificate','compliance','application/pdf',142000::bigint,'docs/'||v_op||'/eicr-birch.pdf','propvora-documents','active',ARRAY['electrical','compliance'],v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,p_beech,t_beech,'EPC — Beech House.pdf','certificate','compliance','application/pdf',88000::bigint,'docs/'||v_op||'/epc-beech.pdf','propvora-documents','active',ARRAY['epc','compliance'],v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,p_sycamore,NULL,'HMO Licence — 42 Sycamore.pdf','licence','compliance','application/pdf',210000::bigint,'docs/'||v_op||'/hmo-licence-sycamore.pdf','propvora-documents','active',ARRAY['hmo','licence'],v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,p_oak,NULL,'Boiler repair invoice — Oak Lane.pdf','invoice','finance','application/pdf',54000::bigint,'docs/'||v_op||'/inv-boiler-oak.pdf','propvora-documents','active',ARRAY['invoice','maintenance'],v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,p_riverside,t_river,'AST — Apt 3B Riverside.pdf','tenancy_agreement','tenancy','application/pdf',176000::bigint,'docs/'||v_op||'/ast-riverside.pdf','propvora-documents','active',ARRAY['tenancy','signed'],v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,p_light,NULL,'Landlord insurance schedule.pdf','policy','finance','application/pdf',132000::bigint,'docs/'||v_op||'/insurance-schedule.pdf','propvora-documents','active',ARRAY['insurance'],v_user,'{"seed":"enterprise_full_v1"}'::jsonb)
  ) AS d(workspace_id,property_id,tenancy_id,name,type,category,mime_type,size_bytes,r2_key,r2_bucket,status,tags,created_by,metadata)
  WHERE NOT EXISTS (SELECT 1 FROM documents x WHERE x.workspace_id=v_op AND x.metadata->>'seed'='enterprise_full_v1');

  -- =================================================================
  -- 9. EXTRA JOBS / WORK ORDERS across statuses — pounds
  -- =================================================================
  INSERT INTO jobs (workspace_id,title,description,property_id,supplier_contact_id,scheduled_date,quoted_amount,category,priority,status,reference,notes,created_by)
  SELECT * FROM (VALUES
    (v_op,'Replace bathroom extractor fan','Tenant reports fan not working — damp risk',p_hawthorn,s_dave_h,(v_today+4),85.00,'plumbing','medium','new','JOB-EFS-001','Reported via portal',v_user),
    (v_op,'Communal lighting upgrade','LED upgrade in HMO hallway',p_sycamore,s_sparks,(v_today+10),320.00,'electrical','medium','quote_received','JOB-EFS-002','Quote received, awaiting approval',v_user),
    (v_op,'Garden clearance','Overgrown rear garden tidy-up',p_mill,s_rajesh,(v_today+7),140.00,'general','low','scheduled','JOB-EFS-003','Booked for next week',v_user),
    (v_op,'Leaking kitchen tap','Urgent — water damage risk',p_park,s_dave_h,(v_today-2),65.00,'plumbing','urgent','in_progress','JOB-EFS-004','Engineer on site',v_user),
    (v_op,'Annual boiler service','Routine PPM boiler service',p_oak,s_dave_p,(v_today-12),95.00,'general','medium','complete','JOB-EFS-005','Completed and certified',v_user)
  ) AS j(workspace_id,title,description,property_id,supplier_contact_id,scheduled_date,quoted_amount,category,priority,status,reference,notes,created_by)
  WHERE NOT EXISTS (SELECT 1 FROM jobs x WHERE x.workspace_id=v_op AND x.reference LIKE 'JOB-EFS-%');

  -- =================================================================
  -- 10. EXTRA PPM PLANS — pounds
  -- =================================================================
  INSERT INTO ppm_plans (workspace_id,name,description,category,status,priority,property_id,supplier_contact_id,supplier_name,frequency,start_date,next_due_date,last_completed_date,estimated_cost,auto_generate_job,reference,notes,created_by)
  SELECT * FROM (VALUES
    (v_op,'Annual gas safety — Park Road','Yearly CP12 across HMO','gas','scheduled','high',p_park,s_dave_p,'Dave Patel Gas','annual',(v_today-360),(v_today+9),(v_today-356),96.00,true,'PPM-EFS-001','Auto-creates job 30d prior',v_user),
    (v_op,'Fire alarm test — Birchfield','Annual fire alarm & EL test','fire_safety','scheduled','medium',p_birch,s_sparks,'Sparks Electrical Ltd','annual',(v_today-300),(v_today+5),(v_today-360),120.00,true,'PPM-EFS-002',NULL,v_user),
    (v_op,'Boiler service — Mill Cottage','Annual boiler service','heating','scheduled','medium',p_mill,s_dave_h,'Dave Holloway Plumbing','annual',(v_today-340),(v_today+28),(v_today-337),95.00,false,'PPM-EFS-003',NULL,v_user),
    (v_op,'Gutter clearing — Oakwood','Seasonal gutter clearing','grounds','scheduled','low',p_oakwood,s_rajesh,'Rajesh Kapoor','biannual',(v_today-180),(v_today+40),(v_today-180),80.00,false,'PPM-EFS-004',NULL,v_user)
  ) AS p(workspace_id,name,description,category,status,priority,property_id,supplier_contact_id,supplier_name,frequency,start_date,next_due_date,last_completed_date,estimated_cost,auto_generate_job,reference,notes,created_by)
  WHERE NOT EXISTS (SELECT 1 FROM ppm_plans x WHERE x.workspace_id=v_op AND x.reference LIKE 'PPM-EFS-%');

  -- =================================================================
  -- 11. EXTRA TASKS — open/overdue/done across kinds
  -- =================================================================
  INSERT INTO tasks (workspace_id,kind,title,description,status,priority,property_id,due_at,completed_at,metadata)
  SELECT * FROM (VALUES
    (v_op,'compliance'::task_kind,'Book gas safety renewal — Park Road','CP12 due in 9 days','todo'::task_status,'high'::task_priority,p_park,(now()+interval '5 days'),NULL::timestamptz,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,'maintenance'::task_kind,'Chase electrician quote — Sycamore','Communal lighting upgrade','in_progress'::task_status,'normal'::task_priority,p_sycamore,(now()+interval '2 days'),NULL,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,'admin'::task_kind,'Protect deposit — Birchfield Room A','Deposit not yet in scheme (OVERDUE)','todo'::task_status,'urgent'::task_priority,p_birch,(now()-interval '3 days'),NULL,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,'inspection'::task_kind,'Mid-term inspection — Oak Lane','Routine inspection','todo'::task_status,'low'::task_priority,p_oak,(now()+interval '18 days'),NULL,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,'turnover'::task_kind,'SA changeover clean — Lighthouse','Guest checkout & clean','todo'::task_status,'high'::task_priority,p_light,(now()+interval '2 days'),NULL,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,'general'::task_kind,'Send renewal offer — Beech House','Student renewal window','todo'::task_status,'normal'::task_priority,p_beech,(now()+interval '12 days'),NULL,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,'maintenance'::task_kind,'Confirm boiler repair complete — Oak Lane','Verify works signed off','done'::task_status,'normal'::task_priority,p_oak,(now()-interval '10 days'),(now()-interval '9 days'),'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,'admin'::task_kind,'File EICR certificate — Birchfield','Upload to documents','done'::task_status,'low'::task_priority,p_birch,(now()-interval '18 days'),(now()-interval '17 days'),'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,'compliance'::task_kind,'Overdue: renew EICR — Hawthorn','Certificate expiring','todo'::task_status,'high'::task_priority,p_hawthorn,(now()-interval '1 day'),NULL,'{"seed":"enterprise_full_v1"}'::jsonb)
  ) AS t(workspace_id,kind,title,description,status,priority,property_id,due_at,completed_at,metadata)
  WHERE NOT EXISTS (SELECT 1 FROM tasks x WHERE x.workspace_id=v_op AND x.metadata->>'seed'='enterprise_full_v1');

  -- =================================================================
  -- 12. EXTRA COMPLIANCE ITEMS — span ok/due_soon/overdue across kinds
  -- =================================================================
  INSERT INTO compliance_items (workspace_id,property_id,kind,title,status,due_date,last_completed_at,recurrence_months,vendor_contact_id,cost,reference_no,notes,created_by,metadata)
  SELECT * FROM (VALUES
    (v_op,p_mill,'gas_safety'::compliance_kind,'Gas Safety (CP12) — Mill Cottage','ok'::compliance_status,(v_today+200),(v_today-165),12,s_dave_p,90.00,'CP12-MILL-2026','Valid',v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,p_park,'gas_safety'::compliance_kind,'Gas Safety (CP12) — Park Road','due_soon'::compliance_status,(v_today+9),(v_today-356),12,s_dave_p,96.00,'CP12-PARK-2025','Renewal due',v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,p_hawthorn,'eicr'::compliance_kind,'EICR — 88 Hawthorn Street','due_soon'::compliance_status,(v_today+21),(v_today-1800),60,s_sparks,180.00,'EICR-HAW-2021','5yr expiring',v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,p_oakwood,'epc'::compliance_kind,'EPC — Oakwood Terrace','overdue'::compliance_status,(v_today-18),(v_today-3670),120,NULL::uuid,75.00,'EPC-OAKW-2016','EXPIRED — re-assess',v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,p_sycamore,'hmo_licence'::compliance_kind,'HMO Licence — 42 Sycamore Road','due_soon'::compliance_status,(v_today+47),(v_today-1780),60,NULL,825.00,'HMO-SYC-2021','5yr licence renewal',v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,p_birch,'fire_alarm'::compliance_kind,'Fire Alarm Test — Birchfield','due_soon'::compliance_status,(v_today+5),(v_today-360),12,s_sparks,120.00,'FA-BIR-2025',NULL,v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,p_beech,'epc'::compliance_kind,'EPC — Beech House','due_soon'::compliance_status,(v_today+34),(v_today-3620),120,NULL,75.00,'EPC-BEE-2016','Renewal due',v_user,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,p_park,'legionella'::compliance_kind,'Legionella Risk Assessment — Park Road','ok'::compliance_status,(v_today+66),(v_today-664),24,NULL,150.00,'LEG-PARK-2024','Valid',v_user,'{"seed":"enterprise_full_v1"}'::jsonb)
  ) AS c(workspace_id,property_id,kind,title,status,due_date,last_completed_at,recurrence_months,vendor_contact_id,cost,reference_no,notes,created_by,metadata)
  WHERE NOT EXISTS (SELECT 1 FROM compliance_items x WHERE x.workspace_id=v_op AND x.metadata->>'seed'='enterprise_full_v1');

  -- =================================================================
  -- 13. SALES INVOICES (outbound rent demands) + arrears link, mix statuses — pounds
  -- =================================================================
  INSERT INTO invoices (workspace_id,invoice_number,contact_id,property_id,invoice_type,issue_date,due_date,subtotal,tax_amount,total,currency,status,paid_at,paid_amount,notes,created_by)
  SELECT * FROM (VALUES
    (v_op,'INV-EFS-2001',c_sarah,p_oak,'outbound',(v_today-5),(v_today),2150.00,0.00,2150.00,'GBP','paid',(now()-interval '5 days'),2150.00,'Monthly rent — 14 Oak Lane',v_user),
    (v_op,'INV-EFS-2002',c_priya,p_riverside,'outbound',(v_today-7),(v_today-2),1850.00,0.00,1850.00,'GBP','paid',(now()-interval '7 days'),1850.00,'Monthly rent — Apt 3B Riverside',v_user),
    (v_op,'INV-EFS-2003',c_james_t,p_sycamore,'outbound',(v_today-12),(v_today-12),575.00,0.00,575.00,'GBP','overdue',NULL::timestamptz,NULL::numeric,'HMO Room 1 rent — OVERDUE',v_user),
    (v_op,'INV-EFS-2004',c_james_o,p_park,'outbound',(v_today-26),(v_today-26),695.00,0.00,695.00,'GBP','overdue',NULL,NULL,'Park Road room — partial via plan',v_user),
    (v_op,'INV-EFS-2005',c_sophie,p_birch,'outbound',(v_today-3),(v_today-3),525.00,0.00,525.00,'GBP','overdue',NULL,NULL,'Birchfield Room A — OVERDUE',v_user),
    (v_op,'INV-EFS-2006',o_gerald,NULL::uuid,'outbound',(v_today-2),(v_today+12),640.00,128.00,768.00,'GBP','sent',NULL,NULL,'Management fee — Q services (3rd-party landlord)',v_user),
    (v_op,'INV-EFS-2007',o_patricia,NULL,'outbound',(v_today-1),(v_today+14),480.00,96.00,576.00,'GBP','sent',NULL,NULL,'Management fee — owner statement',v_user),
    (v_op,'INV-EFS-2008',c_emma,p_light,'outbound',(v_today+2),(v_today+9),1640.00,0.00,1640.00,'GBP','draft',NULL,NULL,'Upcoming rent demand — Lighthouse',v_user)
  ) AS i(workspace_id,invoice_number,contact_id,property_id,invoice_type,issue_date,due_date,subtotal,tax_amount,total,currency,status,paid_at,paid_amount,notes,created_by)
  WHERE NOT EXISTS (SELECT 1 FROM invoices x WHERE x.workspace_id=v_op AND x.invoice_number LIKE 'INV-EFS-%');

  -- =================================================================
  -- 14. MONEY TRANSACTIONS (cash ledger feed) — recent in/out — pounds
  -- =================================================================
  INSERT INTO money_transactions (workspace_id,direction,category,amount,currency,occurred_on,property_id,description,reference,reconciled,metadata)
  SELECT * FROM (VALUES
    (v_op,'in'::money_direction,'rent'::money_category,2150.00,'GBP',(v_today-5),p_oak,'Rent — 14 Oak Lane','RENT-OAK',true,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,'in','rent',1850.00,'GBP',(v_today-7),p_riverside,'Rent — Apt 3B Riverside','RENT-RIV',true,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,'in','rent',1640.00,'GBP',(v_today-9),p_light,'Rent — The Lighthouse','RENT-LIG',true,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,'in','management_fee',640.00,'GBP',(v_today-4),NULL::uuid,'Management fees collected','MGMT-FEE',true,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,'out','maintenance',390.00,'GBP',(v_today-14),p_oak,'Boiler repair — Oak Lane','PAY-BOIL-OAK',true,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,'out','compliance',96.00,'GBP',(v_today-14),p_sycamore,'Gas safety — Sycamore','PAY-GAS-SYC',true,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,'out','mortgage',3180.00,'GBP',(v_today-10),NULL,'Mortgage interest','MORT-INT',false,'{"seed":"enterprise_full_v1"}'::jsonb),
    (v_op,'out','insurance',153.33,'GBP',(v_today-4),NULL,'Landlord insurance instalment','INS-MONTH',false,'{"seed":"enterprise_full_v1"}'::jsonb)
  ) AS m(workspace_id,direction,category,amount,currency,occurred_on,property_id,description,reference,reconciled,metadata)
  WHERE NOT EXISTS (SELECT 1 FROM money_transactions x WHERE x.workspace_id=v_op AND x.metadata->>'seed'='enterprise_full_v1');

  -- =================================================================
  -- 15. RENT SCHEDULES — upcoming + recent (one per active tenancy)
  -- =================================================================
  INSERT INTO rent_schedules (workspace_id,tenancy_id,due_date,amount_due,amount_paid,status,notes,demo)
  SELECT v_op, t, (v_today + off), amt, paid, st, 'EFS schedule', false
  FROM (VALUES
    (t_oak,2150.00,2150.00,'paid',-5),(t_oak,2150.00,0.00,'due',25),
    (t_river,1850.00,1850.00,'paid',-7),(t_river,1850.00,0.00,'due',23),
    (t_light,1640.00,1640.00,'paid',-9),(t_light,1640.00,0.00,'due',21),
    (t_syc,575.00,0.00,'overdue',-12),(t_syc,575.00,0.00,'due',18),
    (t_park,695.00,300.00,'overdue',-26),
    (t_birch,525.00,0.00,'overdue',-3),(t_birch,525.00,0.00,'due',27),
    (t_beech,1980.00,1980.00,'paid',-8),(t_beech,1980.00,0.00,'due',22),
    (t_haw,1050.00,1050.00,'paid',-11),(t_haw,1050.00,0.00,'due',19)
  ) AS r(t,amt,paid,st,off)
  WHERE NOT EXISTS (
    SELECT 1 FROM rent_schedules x WHERE x.workspace_id=v_op AND x.notes='EFS schedule'
  );

END
$seed$;
