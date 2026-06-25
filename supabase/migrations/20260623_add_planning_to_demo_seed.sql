-- ============================================================================
-- ADD PLANNING DATA TO CONSOLIDATED DEMO SEEDER
--
-- Patches seed_full_demo_workspace (operator path) to also seed:
--   * 4 planning_sets  (draft/active/converted/risk_review)
--   * 4 planning_assumptions (one per set)
--   * 3 planning_landlord_offers (draft/negotiating/accepted)
--
-- Also patches reset_demo_data to clean planning rows (is_demo=true).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.seed_planning_demo(
  p_workspace_id uuid,
  p_user_id      uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_role text;
  -- planning set ids (deterministic per workspace so idempotent)
  ps_hmo  uuid;
  ps_r2r  uuid;
  ps_sa   uuid;
  ps_stud uuid;
BEGIN
  -- membership guard
  SELECT role INTO v_role FROM workspace_members
    WHERE workspace_id = p_workspace_id AND user_id = p_user_id;
  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Not a member of workspace %', p_workspace_id;
  END IF;

  -- skip if already seeded
  IF EXISTS (SELECT 1 FROM planning_sets WHERE workspace_id = p_workspace_id AND is_demo) THEN
    RETURN;
  END IF;

  -- generate stable-ish UUIDs derived from workspace_id to keep idempotency
  ps_hmo  := md5(p_workspace_id::text || 'planning_hmo')::uuid;
  ps_r2r  := md5(p_workspace_id::text || 'planning_r2r')::uuid;
  ps_sa   := md5(p_workspace_id::text || 'planning_sa')::uuid;
  ps_stud := md5(p_workspace_id::text || 'planning_stud')::uuid;

  -- ── Planning Sets ────────────────────────────────────────────────────────
  INSERT INTO planning_sets (
    id, workspace_id, title, operation_profile, status, address, postcode,
    gross_monthly_income, total_monthly_expenses, net_monthly_income,
    gross_annual_income, net_annual_income,
    gross_yield, net_yield, roi,
    upfront_cash_required, breakeven_month, risk_score,
    notes, is_demo, created_by
  ) VALUES
    -- 5-Bed HMO (active)
    (ps_hmo, p_workspace_id,
     '5-Bed HMO — Edgbaston Birmingham', 'hmo', 'active',
     '14 Priory Road, Edgbaston, Birmingham', 'B5 7UN',
     3200, 1750, 1450, 38400, 17400,
     7.8, 4.2, 28.5, 61000, 42, 32,
     'Strong HMO demand near university. 5 rooms at £640/mo avg.',
     true, p_user_id),

    -- R2R Studio (draft)
    (ps_r2r, p_workspace_id,
     'R2R Studio — Digbeth Birmingham', 'rent_to_rent', 'draft',
     '7 Fazeley Street, Digbeth, Birmingham', 'B5 5SE',
     1850, 1380, 470, 22200, 5640,
     8.3, 2.5, 15.7, 6200, 14, 48,
     'Landlord agreed in principle. Awaiting heads of terms sign-off.',
     true, p_user_id),

    -- Serviced Accommodation (converted — now a live property)
    (ps_sa, p_workspace_id,
     'SA Apartment — Manchester City Centre', 'serviced_accommodation', 'converted',
     '32 Piccadilly Gardens, Manchester', 'M1 2BH',
     4800, 2600, 2200, 57600, 26400,
     11.2, 5.1, 38.0, 72000, 33, 22,
     'Converted to live SA unit. Averaging 81% occupancy on Airbnb.',
     true, p_user_id),

    -- Student Let (draft, risk_review score high)
    (ps_stud, p_workspace_id,
     'Student Let — Leeds City Centre', 'student_let', 'draft',
     '8 Woodhouse Lane, Leeds', 'LS2 9HB',
     2400, 1850, 550, 28800, 6600,
     6.1, 1.4, 9.8, 55000, 100, 71,
     'High risk: leasehold complications, s21 jurisdiction uncertainty. Review needed.',
     true, p_user_id)
  ON CONFLICT (id) DO NOTHING;

  -- ── Planning Assumptions (one per set) ──────────────────────────────────
  INSERT INTO planning_assumptions (
    planning_set_id,
    property_purchase_price, property_value,
    monthly_mortgage, landlord_monthly_rent,
    contract_length_months, break_clause_months, rent_review_months,
    void_allowance_pct, management_fee_pct, occupancy_rate_pct, average_daily_rate
  )
  SELECT x.sid, x.ppp, x.pv, x.mm, x.lmr, x.cl, x.bc, x.rr, x.va, x.mf, x.oc, x.adr
  FROM (VALUES
    (ps_hmo,  410000.00, 430000.00, 1100.00, NULL::numeric,  24, 6, 12, 0.04, 0.10, 0.95, NULL::numeric),
    (ps_r2r,  NULL::numeric, NULL::numeric,  NULL::numeric,  1350.00, 12, 3, 12, 0.06, 0.00, 0.92, NULL::numeric),
    (ps_sa,   480000.00, 510000.00, 1800.00, NULL::numeric,  NULL::int, NULL::int, NULL::int, 0.19, 0.18, 0.81, 165.00),
    (ps_stud, 360000.00, 370000.00,  980.00, NULL::numeric,  12, NULL::int, 12, 0.10, 0.12, 0.88, NULL::numeric)
  ) AS x(sid, ppp, pv, mm, lmr, cl, bc, rr, va, mf, oc, adr)
  WHERE NOT EXISTS (
    SELECT 1 FROM planning_assumptions pa WHERE pa.planning_set_id = x.sid
  );

  -- ── Planning Landlord Offers ─────────────────────────────────────────────
  INSERT INTO planning_landlord_offers (
    workspace_id, planning_set_id,
    property_address, proposed_rent, proposed_term_months, break_clause_months,
    management_fee_included, bills_included, notes, status,
    sent_at, responded_at, is_demo, created_by
  )
  SELECT p_workspace_id, x.sid, x.addr, x.rent, x.term, x.bc,
         x.mfi, x.bi, x.notes, x.status, x.sent, x.resp, true, p_user_id
  FROM (VALUES
    -- Draft offer for the HMO
    (ps_hmo, '14 Priory Road, Edgbaston, Birmingham B5 7UN',
     1100.00, 24, 6, false, false,
     'Drafted heads of terms — pending landlord review.',
     'draft', NULL::timestamptz, NULL::timestamptz),

    -- Negotiating offer for R2R
    (ps_r2r, '7 Fazeley Street, Digbeth, Birmingham B5 5SE',
     1300.00, 12, 3, true, false,
     'Landlord counter-proposed £1,350/mo. We offered £1,300 + 3-month break.',
     'negotiating', now() - interval '5 days', NULL::timestamptz),

    -- Accepted offer for SA (already converted)
    (ps_sa, '32 Piccadilly Gardens, Manchester M1 2BH',
     1800.00, 24, 6, false, true,
     'Accepted at £1,800/mo all bills included. Conversion complete.',
     'accepted', now() - interval '45 days', now() - interval '40 days')
  ) AS x(sid, addr, rent, term, bc, mfi, bi, notes, status, sent, resp)
  WHERE NOT EXISTS (
    SELECT 1 FROM planning_landlord_offers y
    WHERE y.workspace_id = p_workspace_id AND y.planning_set_id = x.sid AND y.is_demo
  );
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.seed_planning_demo(uuid, uuid) TO authenticated, service_role;


-- ── Patch seed_full_demo_workspace to call seed_planning_demo ───────────────
-- We wrap the operator block to call seed_planning_demo at the end.
-- Rather than full-replacing the 600-line function, we add a small hook by
-- adding seed_planning_demo to the operator path via a trigger-like function
-- that auto-calls when a workspace is freshly seeded.
-- Simplest: create a wrapper that calls the original + planning.

-- Note: We're updating the existing function in-place using CREATE OR REPLACE.
-- The planning block is inserted just before UPDATE workspaces SET demo_data_loaded.
-- Since the full function is complex, we add a separate call convention:
-- after seed_full_demo_workspace completes, callers that want planning data
-- call seed_planning_demo. BUT for onboarding (the primary path) we need
-- it automatic. So we patch workspace.ts to call seed_planning_demo after
-- seed_full_demo_workspace.

-- Actually the cleaner approach: create a thin wrapper that the app calls.
CREATE OR REPLACE FUNCTION public.seed_full_demo_workspace_v2(
  p_workspace_id uuid,
  p_user_id      uuid
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch uuid;
  v_type  text;
BEGIN
  -- Call original seeder (handles supplier/customer/operator substrate + deep finance)
  v_batch := public.seed_full_demo_workspace(p_workspace_id, p_user_id);

  -- Add planning demo data on top (operator only — noop for supplier/customer)
  SELECT COALESCE(type, 'operator') INTO v_type FROM workspaces WHERE id = p_workspace_id;
  IF v_type = 'operator' THEN
    PERFORM public.seed_planning_demo(p_workspace_id, p_user_id);
  END IF;

  RETURN v_batch;
END;
$$;

GRANT EXECUTE ON FUNCTION public.seed_full_demo_workspace_v2(uuid, uuid) TO authenticated, service_role;


-- ── Patch reset_demo_data to also clear planning rows ───────────────────────
CREATE OR REPLACE FUNCTION public.reset_demo_data(p_workspace_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  -- Deep operator layer (markers), children before parents.
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

  -- Planning data (is_demo flag, children before parents)
  DELETE FROM planning_landlord_offers WHERE workspace_id = p_workspace_id AND is_demo;
  DELETE FROM planning_assumptions pa
    USING planning_sets ps
    WHERE pa.planning_set_id = ps.id AND ps.workspace_id = p_workspace_id AND ps.is_demo;
  DELETE FROM planning_sets WHERE workspace_id = p_workspace_id AND is_demo;

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
  PERFORM public.delete_demo_data(p_workspace_id, false);

  -- For supplier/customer (no substrate), clear the loaded flag explicitly.
  UPDATE workspaces SET demo_data_loaded = false, demo_data_variant = NULL
  WHERE id = p_workspace_id
    AND NOT EXISTS (SELECT 1 FROM properties p WHERE p.workspace_id = p_workspace_id AND p.demo);
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.reset_demo_data(uuid) TO authenticated, service_role;
