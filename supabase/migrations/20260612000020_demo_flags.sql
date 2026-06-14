-- Demo-data lifecycle flags.
-- Standardises a `demo` boolean + `demo_batch_id` + `demo_expires_at` across
-- every table the demo seeder writes to. Idempotent and existence-checked so it
-- is safe on a divergent schema (skips tables/columns that aren't present).

DO $$
DECLARE
  t text;
  demo_tables text[] := ARRAY[
    'contacts','properties','property_units','tenancies','tasks','jobs',
    'supplier_jobs','supplier_invoices','ppm_schedules','planning_sets',
    'planning_scenarios','income_records','expense_records',
    'money_income','money_expenses','money_invoices','money_invoice_lines',
    'money_bills','money_arrears_cases','money_deposits','money_transactions',
    'compliance_certificates','compliance_inspections','compliance_documents',
    'calendar_events','reminders','documents','notifications','conversations',
    'messages','possession_cases','tenancy_agreements','agreement_signatories',
    'viewings','prospects','property_vacancies','chart_of_accounts',
    'client_accounts','invoices','legal_cases'
  ];
BEGIN
  FOREACH t IN ARRAY demo_tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS demo boolean NOT NULL DEFAULT false', t);
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS demo_batch_id uuid', t);
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS demo_expires_at timestamptz', t);
      EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_demo ON public.%I (workspace_id, demo) WHERE demo = true', t, t);
    END IF;
  END LOOP;
END $$;
