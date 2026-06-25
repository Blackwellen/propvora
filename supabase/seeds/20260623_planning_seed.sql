-- =====================================================================
-- Propvora — PLANNING MODULE SEED  (idempotent)
-- Adds planning sets, landlord offers and assumptions for the
-- JT Property Manager demo workspace.
--
-- Operator workspace : 7d9e941b-c6f1-4293-bcbc-76b2197a69bb
-- Owner user         : 55ce717b-cd55-4e0c-9871-62621e4c95d3
--
-- Covers:
--   * 6 planning_sets  (draft / active / converted / risk_review mix)
--   * 5 planning_landlord_offers  (draft / sent / negotiating / accepted / rejected)
--   * 6 planning_assumptions  (one per set)
-- =====================================================================

DO $planning_seed$
DECLARE
  v_op   uuid := '7d9e941b-c6f1-4293-bcbc-76b2197a69bb';
  v_user uuid := '55ce717b-cd55-4e0c-9871-62621e4c95d3';

  -- planning set UUIDs (stable — safe to re-run)
  ps_btr   uuid := 'da9245a5-fb16-4c8c-b323-3b0d32839b15'; -- build_to_rent (pre-existing "yes")
  ps_hmo   uuid := 'c1a2b3c4-d5e6-7890-abcd-ef1234567890'; -- 5-bed HMO Edgbaston
  ps_r2r   uuid := 'a1b2c3d4-e5f6-7890-abcd-ef0987654321'; -- R2R Digbeth
  ps_sa    uuid := 'b2c3d4e5-f6a7-8901-bcde-f12345678901'; -- SA Manchester
  ps_stud  uuid := 'c3d4e5f6-a7b8-9012-cdef-123456789012'; -- Student Let Leeds (converted)
  ps_co    uuid := 'd4e5f6a7-b8c9-0123-defa-234567890123'; -- Co-Living London

  -- landlord offer UUIDs
  lo_draft uuid := 'a0d2f272-d337-4421-b33b-1f0713888ac5'; -- pre-existing draft
  lo_sent  uuid := 'e5f6a7b8-c9d0-1234-efab-345678901234';
  lo_acc   uuid := 'f6a7b8c9-d0e1-2345-fabc-456789012345';
  lo_neg   uuid := 'a7b8c9d0-e1f2-3456-abcd-567890123456';
  lo_rej   uuid := 'b8c9d0e1-f2a3-4567-bcde-678901234567';

BEGIN

-- ── Planning Sets ─────────────────────────────────────────────────────────────

INSERT INTO planning_sets (
  id, workspace_id, title, operation_profile, status, address, postcode,
  gross_monthly_income, total_monthly_expenses, net_monthly_income,
  gross_annual_income, net_annual_income,
  gross_yield, net_yield, roi,
  upfront_cash_required, breakeven_month, risk_score,
  notes, is_demo
) VALUES
  -- HMO
  (ps_hmo, v_op,
   '5-Bed HMO — Edgbaston Birmingham', 'hmo', 'active',
   '14 Priory Rd, Edgbaston, Birmingham', 'B5 7UN',
   3200, 1750, 1450, 38400, 17400,
   7.8, 4.2, 28.5,
   61000, 42, 32,
   'Strong HMO demand near university. 5 rooms let at £640/mo average.', true),

  -- Rent-to-Rent
  (ps_r2r, v_op,
   'R2R Studio — Digbeth Birmingham', 'rent_to_rent', 'active',
   '7 Fazeley St, Digbeth, Birmingham', 'B5 5SE',
   1850, 1380, 470, 22200, 5640,
   0, 0, 14.7,
   38000, 81, 24,
   'R2R 2-year AST. Low upfront. Positive cashflow from month 7.', true),

  -- Serviced Accommodation
  (ps_sa, v_op,
   'SA Unit — Deansgate Manchester', 'serviced_accommodation', 'draft',
   '22 Deansgate, Manchester', 'M3 4LY',
   4100, 2650, 1450, 49200, 17400,
   9.2, 5.8, 34.1,
   51000, 35, 48,
   'City-centre SA. ADR £120. Occupancy assumed 85%.', true),

  -- Student Let (converted)
  (ps_stud, v_op,
   'Student Let — Leeds City Centre', 'student_let', 'converted',
   '3 Hyde Park Rd, Leeds', 'LS6 1AA',
   2600, 1200, 1400, 31200, 16800,
   6.9, 4.4, 22.0,
   76000, 54, 18,
   'Converted to live property. Fully let to students.', true),

  -- Co-Living (high risk)
  (ps_co, v_op,
   'Co-Living Hub — Hackney London', 'co_living', 'draft',
   '89 Mare St, Hackney, London', 'E8 4RG',
   5400, 3800, 1600, 64800, 19200,
   8.1, 5.2, 26.3,
   73000, 46, 67,
   'High-capital city risk. Requires HMO licence review.', true)

ON CONFLICT (id) DO NOTHING;


-- ── Planning Assumptions ──────────────────────────────────────────────────────

INSERT INTO planning_assumptions (
  planning_set_id,
  property_purchase_price, property_value,
  monthly_mortgage, landlord_monthly_rent,
  contract_length_months, break_clause_months, rent_review_months,
  void_allowance_pct, management_fee_pct, occupancy_rate_pct,
  average_daily_rate
) VALUES
  (ps_hmo,  450000, 475000, 1800, null, 36, 12, 12, 5.0, 10.0, 95.0, null),
  (ps_r2r,  null,   null,   null, 1380, 24,  6, 24, 8.0,  0.0, 92.0, null),
  (ps_sa,   280000, 295000, 1650, null, 36, 12, 12, 10.0, 15.0, 85.0, 120.0),
  (ps_stud, 390000, 410000, 1800, null, 36, 12, 12,  5.0, 10.0, 98.0, null),
  (ps_co,   520000, 545000, 2400, null, 60, 24, 12,  8.0, 12.0, 90.0, null)
ON CONFLICT DO NOTHING;


-- ── Landlord Offers ───────────────────────────────────────────────────────────

INSERT INTO planning_landlord_offers (
  id, workspace_id, planning_set_id,
  property_address, proposed_rent, proposed_term_months, break_clause_months,
  management_fee_included, bills_included, status,
  sent_at, responded_at, is_demo, notes
) VALUES
  (lo_sent, v_op, ps_hmo,
   '14 Priory Rd, Edgbaston, Birmingham',
   2200, 36, 12, false, true, 'sent',
   NOW() - INTERVAL '13 days', null, true,
   'Sent to landlord 10 June. Awaiting response.'),

  (lo_acc, v_op, ps_r2r,
   '7 Fazeley St, Digbeth, Birmingham',
   1650, 24, 6, false, false, 'accepted',
   NOW() - INTERVAL '39 days', NOW() - INTERVAL '32 days', true,
   'Accepted. Lease start 1 July 2026.'),

  (lo_neg, v_op, ps_sa,
   '22 Deansgate, Manchester',
   3200, 36, 12, true, true, 'negotiating',
   NOW() - INTERVAL '5 days', null, true,
   'Landlord wants longer break clause. Negotiating term.'),

  (lo_rej, v_op, ps_co,
   '89 Mare St, Hackney, London',
   4200, 60, 24, true, true, 'rejected',
   NOW() - INTERVAL '22 days', NOW() - INTERVAL '18 days', true,
   'Landlord rejected. Prefers standard AST.')

ON CONFLICT (id) DO NOTHING;

END $planning_seed$;
