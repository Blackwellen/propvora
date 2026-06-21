-- Deterministic, idempotent enrichment for the marketing capture workspaces.
-- These are illustrative demo records, never customer claims or production usage.
DO $seed$
DECLARE
  v_op uuid := '7d9e941b-c6f1-4293-bcbc-76b2197a69bb';
  v_sup uuid := '2cb94055-8fd2-4807-8f34-9c88e47aa318';
  v_user uuid := '55ce717b-cd55-4e0c-9871-62621e4c95d3';
  v_owner uuid := 'aa83da4a-4e95-4385-b17a-8c509a985800';
  v_supplier uuid := '09667063-4ef7-45e7-86c5-f699bea2aa4c';
  v_batch uuid := 'a62c7084-2f86-4fe1-9eb5-202606200001';
BEGIN
  -- Give the seeded landlord a genuine scoped portfolio for portal captures.
  INSERT INTO contact_links
    (workspace_id, contact_id, linked_type, linked_id, relationship_type, created_by, metadata)
  SELECT v_op, v_owner, 'property', property_id, 'primary', v_user,
         jsonb_build_object('demo', true, 'seed', 'marketing_capture_v2')
  FROM (VALUES
    ('a6adeaef-3fc7-4d1c-9c72-07162835238a'::uuid),
    ('1e8c29cf-3227-4031-9036-09fd1af08a82'::uuid),
    ('c85a207a-99cd-4114-9bcb-7240c747b333'::uuid),
    ('0a7957cf-92b0-4ad0-abe0-2c5a73017b28'::uuid)
  ) p(property_id)
  WHERE NOT EXISTS (
    SELECT 1 FROM contact_links x
    WHERE x.workspace_id=v_op AND x.contact_id=v_owner
      AND x.linked_type='property' AND x.linked_id=p.property_id
  );

  -- Supplier-portal invoice lifecycle attached to the seeded supplier contact.
  INSERT INTO supplier_invoices
    (workspace_id, supplier_job_id, contact_id, invoice_number, amount, currency,
     status, submitted_at, approved_at, paid_at, notes, demo, demo_batch_id, demo_expires_at)
  SELECT v_op, NULL::uuid, v_supplier, invoice_number, amount, 'GBP', status,
         submitted_at, approved_at, paid_at, notes, true, v_batch, now()+interval '365 days'
  FROM (VALUES
    ('SUP-2026-041', 185.00::numeric, 'paid',      now()-interval '34 days', now()-interval '31 days', now()-interval '28 days', 'Boiler repair and safety check'),
    ('SUP-2026-052',  85.00::numeric, 'approved',  now()-interval '9 days',  now()-interval '6 days',  NULL::timestamptz,     'Bathroom extractor fan replacement'),
    ('SUP-2026-057',  65.00::numeric, 'submitted', now()-interval '2 days',  NULL::timestamptz,      NULL::timestamptz,     'Kitchen tap repair')
  ) i(invoice_number,amount,status,submitted_at,approved_at,paid_at,notes)
  WHERE NOT EXISTS (
    SELECT 1 FROM supplier_invoices x
    WHERE x.workspace_id=v_op AND x.invoice_number=i.invoice_number
  );

  -- A transparent demo affiliate lifecycle for the product screenshot.
  INSERT INTO affiliates
    (workspace_id, enrolled, approved, payout_email, band, active_referrals_count,
     pending_pence, cleared_pence, paid_pence, origin, referral_code, applied_at)
  VALUES
    (v_op, true, true, 'partners@demo.propvora.com', 'Bronze', 1,
     7900, 15800, 23700, 'internal', 'JT-DEMO-26', now()-interval '120 days')
  ON CONFLICT (workspace_id) DO UPDATE SET
    enrolled=excluded.enrolled, approved=excluded.approved, payout_email=excluded.payout_email,
    band=excluded.band, active_referrals_count=excluded.active_referrals_count,
    pending_pence=excluded.pending_pence, cleared_pence=excluded.cleared_pence,
    paid_pence=excluded.paid_pence, referral_code=excluded.referral_code;

  INSERT INTO affiliate_referrals
    (affiliate_workspace_id, referred_workspace_id, status, first_invoice_at,
     initial_commission_pence, recurring_commission_pence, recurring_months_remaining, created_at)
  VALUES
    (v_op, v_sup, 'active', now()-interval '75 days', 7900, 15800, 3, now()-interval '90 days')
  ON CONFLICT (referred_workspace_id) DO UPDATE SET
    affiliate_workspace_id=excluded.affiliate_workspace_id, status=excluded.status,
    first_invoice_at=excluded.first_invoice_at,
    initial_commission_pence=excluded.initial_commission_pence,
    recurring_commission_pence=excluded.recurring_commission_pence,
    recurring_months_remaining=excluded.recurring_months_remaining;

  INSERT INTO affiliate_commissions
    (workspace_id, affiliate_user_id, referred_workspace_id, commission_type,
     amount, currency, status, approved_at, paid_at, notes, metadata, created_at)
  SELECT v_op, v_user, v_sup, 'subscription', amount, 'GBP', status,
         approved_at, paid_at, note,
         jsonb_build_object('demo', true, 'seed', 'marketing_capture_v2', 'sequence', seq), created_at
  FROM (VALUES
    (1, 7900::numeric, 'paid',     now()-interval '72 days', now()-interval '60 days', 'Initial converted subscription', now()-interval '75 days'),
    (2, 7900::numeric, 'paid',     now()-interval '42 days', now()-interval '30 days', 'Recurring subscription month 2', now()-interval '45 days'),
    (3, 7900::numeric, 'payable',  now()-interval '12 days', NULL::timestamptz,      'Recurring subscription month 3', now()-interval '15 days'),
    (4, 7900::numeric, 'pending',  NULL::timestamptz,       NULL::timestamptz,      'Recurring subscription month 4', now()-interval '2 days')
  ) c(seq,amount,status,approved_at,paid_at,note,created_at)
  WHERE NOT EXISTS (
    SELECT 1 FROM affiliate_commissions x
    WHERE x.workspace_id=v_op AND x.metadata->>'seed'='marketing_capture_v2'
      AND (x.metadata->>'sequence')::int=c.seq
  );
END $seed$;
