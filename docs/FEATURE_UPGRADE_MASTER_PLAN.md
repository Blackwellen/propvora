# Propvora Feature Upgrade Master Plan
## 9 Levels — 56 Steps — Full Implementation Blueprint

*All features planned to integrate cleanly with existing Next.js 16 / Supabase / React 19 / Tailwind v4 stack.
Free or low-cost API choices throughout. Paid integrations (WhatsApp, eSignature) are opt-in add-ons.*

---

## GUIDING PRINCIPLES

1. **No breaking changes** — every new feature adds new tables/routes. Nothing modifies core existing schema columns.
2. **Addons gate paid APIs** — features requiring third-party spend (WhatsApp, eSignature, Open Banking, Xero) live behind the existing Add-ons workspace setting page. Landlords enable and pay per addon.
3. **Free-first API choices** — HMRC MTD API (free), Meta WhatsApp Cloud API (1,000 free conversations/month), native eSignature (no DocuSign), Canopy referencing API (free to integrate), GoCardless (fees only on transactions, no subscription).
4. **Migration-safe** — every DB change is a new numbered migration file. No ALTER on existing columns that could fail on existing data.
5. **RLS everywhere** — every new table gets workspace_id + RLS policy matching existing patterns.
6. **Extend, don't duplicate** — HMO features extend the existing `units` + `tenancies` tables. Compliance features extend the existing `compliance_*` tables. Work features extend the existing `work_jobs` table.

---

## LEVEL 1 — DATABASE FOUNDATION
### Schema, migrations, and RLS for all new modules

*Build this first. All subsequent levels depend on these tables being in place.*

---

### Step 1 — Double-Entry Accounting Engine Schema (Migration 024)

**What it is:** A proper chart of accounts + journal entry system that underpins all financial depth features. Every money movement records a debit and a credit. This replaces the current flat income/expense tables with a proper accounting ledger while keeping backward compatibility.

**New tables:**
```sql
-- chart_of_accounts: workspace-specific account tree
CREATE TABLE chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES chart_of_accounts(id),
  account_code TEXT NOT NULL,            -- e.g. "4001"
  account_name TEXT NOT NULL,            -- e.g. "Rental Income"
  account_type TEXT NOT NULL CHECK (account_type IN
    ('asset','liability','equity','income','expense','contra')),
  currency TEXT NOT NULL DEFAULT 'GBP',
  is_system BOOLEAN DEFAULT false,       -- system accounts cannot be deleted
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- journal_entries: the immutable ledger
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  entry_number TEXT NOT NULL,            -- auto-generated JE-00001
  entry_date DATE NOT NULL,
  description TEXT NOT NULL,
  source_type TEXT,                      -- 'rent_payment','invoice','bill','disbursement', etc.
  source_id UUID,                        -- FK to originating record
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  is_posted BOOLEAN DEFAULT false,
  is_reversed BOOLEAN DEFAULT false,
  reversal_of UUID REFERENCES journal_entries(id),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- journal_lines: individual debit/credit lines per entry
CREATE TABLE journal_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
  debit NUMERIC(14,2) NOT NULL DEFAULT 0,
  credit NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'GBP',
  description TEXT,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  unit_id UUID,
  tenancy_id UUID,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
-- CONSTRAINT: sum of debits must equal sum of credits per journal_entry_id
-- enforced via Postgres trigger
```

**Integration with existing tables:**
- `money_income` and `money_expenses` entries trigger journal entry creation via a Postgres function
- Existing data is not modified — journal entries are created going forward; historical data shown separately

**RLS:** `workspace_id` filter on all three tables, matching existing pattern.

**Default chart of accounts seeded on workspace creation:**
- 1000 Cash/Bank, 1100 Accounts Receivable, 2000 Accounts Payable, 3000 Owner Equity, 4000 Rental Income, 4100 Service Charges, 5000 Repairs & Maintenance, 5100 Insurance, 5200 Utilities, 5300 Professional Fees, 5400 Management Fees, 6000 Capital Expenditure

---

### Step 2 — Multi-Currency & Exchange Rate Schema (Migration 025)

**New tables:**
```sql
-- currency_exchange_rates: daily rates cache (populated by open.er-api.com — free tier)
CREATE TABLE currency_exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency TEXT NOT NULL DEFAULT 'GBP',
  target_currency TEXT NOT NULL,
  rate NUMERIC(18,8) NOT NULL,
  rate_date DATE NOT NULL,
  source TEXT DEFAULT 'open.er-api.com',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (base_currency, target_currency, rate_date)
);

-- workspace_currencies: which currencies a workspace uses
CREATE TABLE workspace_currencies (
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  currency_code TEXT NOT NULL,
  is_base BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (workspace_id, currency_code)
);
```

**API:** `open.er-api.com` — free tier, 1,500 requests/month. Daily cron job updates rates. No API key required for basic tier.

**How it works:** All monetary storage stays in GBP (or workspace base currency). Display layer applies exchange rate at render time. Journal lines store both original_currency + original_amount + gbp_equivalent.

---

### Step 3 — Client Accounting & Trust Schema (Migration 026)

*For letting agents managing landlord client money — required for RICS/ARLA compliance.*

**New tables:**
```sql
-- client_accounts: one per landlord client
CREATE TABLE client_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id),   -- the landlord contact
  account_name TEXT NOT NULL,
  bank_account_name TEXT,
  bank_sort_code TEXT,
  bank_account_number TEXT,                            -- encrypted at app layer
  current_balance NUMERIC(14,2) DEFAULT 0,
  trust_balance NUMERIC(14,2) DEFAULT 0,              -- separate client money float
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- client_disbursements: rent paid out to landlord after fee deduction
CREATE TABLE client_disbursements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_account_id UUID NOT NULL REFERENCES client_accounts(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  gross_rent NUMERIC(14,2) NOT NULL DEFAULT 0,
  management_fee NUMERIC(14,2) DEFAULT 0,
  management_fee_pct NUMERIC(5,2) DEFAULT 0,
  maintenance_deductions NUMERIC(14,2) DEFAULT 0,
  other_deductions NUMERIC(14,2) DEFAULT 0,
  net_payable NUMERIC(14,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','approved','paid','cancelled')),
  paid_date DATE,
  statement_pdf_path TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- disbursement_line_items: itemised breakdown per disbursement
CREATE TABLE disbursement_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disbursement_id UUID NOT NULL REFERENCES client_disbursements(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  unit_id UUID,
  line_type TEXT NOT NULL CHECK (line_type IN ('income','fee','deduction','credit')),
  amount NUMERIC(14,2) NOT NULL,
  reference TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### Step 4 — HMO Module Schema (Migration 027)

*Extends existing `units` and `tenancies` tables with HMO-specific data.*

**New tables:**
```sql
-- hmo_licences: per property HMO licence tracking
CREATE TABLE hmo_licences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  licence_type TEXT NOT NULL CHECK (licence_type IN
    ('mandatory','additional','selective')),
  licence_number TEXT,
  issuing_council TEXT,
  issue_date DATE,
  expiry_date DATE NOT NULL,
  max_occupants INTEGER,
  max_households INTEGER,
  conditions JSONB,                       -- array of licence conditions
  document_path TEXT,                    -- uploaded licence document
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','expired','pending','revoked')),
  renewal_reminder_days INTEGER DEFAULT 90,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- room_rent_schedules: per-room individual rent amounts and dates
CREATE TABLE room_rent_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL,                  -- references units table (room = unit)
  tenancy_id UUID,
  monthly_rent NUMERIC(10,2) NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  payment_day_of_month INTEGER DEFAULT 1,
  payment_method TEXT DEFAULT 'bank_transfer',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- utility_bills: HMO utility cost management
CREATE TABLE utility_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  utility_type TEXT NOT NULL CHECK (utility_type IN
    ('electricity','gas','water','broadband','council_tax','tv_licence','other')),
  provider_name TEXT,
  account_number TEXT,
  bill_date DATE NOT NULL,
  period_start DATE,
  period_end DATE,
  total_amount NUMERIC(10,2) NOT NULL,
  unit_usage NUMERIC(12,4),
  unit_type TEXT,                         -- kWh, m3, etc.
  meter_reading_start NUMERIC(12,4),
  meter_reading_end NUMERIC(12,4),
  receipt_path TEXT,
  split_method TEXT NOT NULL DEFAULT 'equal'
    CHECK (split_method IN ('equal','occupancy_days','floor_area','custom')),
  status TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (status IN ('unpaid','paid','split_invoiced','disputed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- utility_room_splits: how each bill is split per room
CREATE TABLE utility_room_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  utility_bill_id UUID NOT NULL REFERENCES utility_bills(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL,
  tenancy_id UUID,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  split_percentage NUMERIC(5,2),
  split_amount NUMERIC(10,2) NOT NULL,
  invoice_id UUID,                        -- generated tenant invoice
  paid BOOLEAN DEFAULT false,
  paid_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### Step 5 — Leasing, Prospects & eSignature Schema (Migration 028)

```sql
-- property_vacancies: available units advertised for let
CREATE TABLE property_vacancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  asking_rent NUMERIC(10,2),
  deposit_amount NUMERIC(10,2),
  available_from DATE,
  property_type TEXT,
  bedrooms INTEGER,
  bathrooms INTEGER,
  furnished TEXT CHECK (furnished IN ('furnished','unfurnished','part-furnished')),
  features JSONB,
  photos JSONB,                           -- array of storage paths
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','active','under_offer','let','withdrawn')),
  portal_listings JSONB DEFAULT '{}',    -- {rightmove: null, zoopla: null, otm: null}
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- prospects: prospective tenant CRM
CREATE TABLE prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  vacancy_id UUID REFERENCES property_vacancies(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  source TEXT,                            -- 'rightmove','zoopla','direct','referral',etc.
  move_in_date DATE,
  budget_min NUMERIC(10,2),
  budget_max NUMERIC(10,2),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','contacted','viewing_scheduled','viewing_done',
                      'referencing','offered','accepted','rejected','withdrawn')),
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- viewings: showing scheduler
CREATE TABLE viewings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  vacancy_id UUID REFERENCES property_vacancies(id) ON DELETE SET NULL,
  prospect_id UUID REFERENCES prospects(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  conducted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','completed','no_show','cancelled')),
  feedback TEXT,
  outcome TEXT CHECK (outcome IN ('interested','not_interested','offer_made',null)),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- tenancy_agreements: digital agreement creation
CREATE TABLE tenancy_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  tenancy_id UUID,
  template_id UUID,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','sent','partially_signed','fully_signed',
                      'declined','expired','cancelled')),
  document_html TEXT,                     -- rendered agreement content
  final_pdf_path TEXT,                   -- stored after all signatures collected
  signing_deadline TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- agreement_signatories: each party who must sign
CREATE TABLE agreement_signatories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  agreement_id UUID NOT NULL REFERENCES tenancy_agreements(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('tenant','landlord','guarantor','agent','witness')),
  signing_token TEXT UNIQUE,             -- UUID token in email link — no DocuSign needed
  signed_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  signing_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**eSignature is 100% native** — no DocuSign/HelloSign. Valid under UK Electronic Communications Act 2000 using email-link proof, IP capture, and timestamp. Legally enforceable for ASTs.

---

### Step 6 — Possession, Compliance & R2R Schema (Migration 029)

```sql
-- possession_cases: Section 8 possession tracking
CREATE TABLE possession_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  tenancy_id UUID NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,   -- tenant
  ground TEXT NOT NULL,                  -- 'ground_8','ground_10','ground_11', etc.
  arrears_amount NUMERIC(10,2),
  arrears_weeks NUMERIC(5,1),
  status TEXT NOT NULL DEFAULT 'gathering_evidence'
    CHECK (status IN ('gathering_evidence','notice_draft','notice_served',
                      'notice_expired','court_applied','hearing_scheduled',
                      'possession_granted','warrant_issued','resolved')),
  notice_served_date DATE,
  notice_expiry_date DATE,
  court_applied_date DATE,
  hearing_date DATE,
  court_reference TEXT,
  evidence_bundle_path TEXT,            -- generated PDF
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- possession_evidence: timestamped evidence items per case
CREATE TABLE possession_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  possession_case_id UUID NOT NULL REFERENCES possession_cases(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL CHECK (evidence_type IN
    ('missed_payment','partial_payment','notice_served','communication',
     'open_banking_record','statement','photo','other')),
  description TEXT NOT NULL,
  amount NUMERIC(10,2),
  event_date TIMESTAMPTZ NOT NULL,
  document_path TEXT,
  source TEXT,                           -- 'manual','open_banking','system','ai'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- rent_to_rent: R2R operator dual ledger
CREATE TABLE rent_to_rent_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  owner_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  contract_start DATE NOT NULL,
  contract_end DATE,
  guaranteed_rent_monthly NUMERIC(10,2) NOT NULL,
  payment_day_of_month INTEGER DEFAULT 1,
  management_model TEXT NOT NULL DEFAULT 'hmo'
    CHECK (management_model IN ('hmo','sa','asa','single_let')),
  subletting_permitted BOOLEAN DEFAULT true,
  break_clause_months INTEGER,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','expired','terminated','pending')),
  agreement_document_path TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- r2r_ledger: tracks owner payments vs tenant income per period
CREATE TABLE r2r_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  r2r_contract_id UUID NOT NULL REFERENCES rent_to_rent_contracts(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  guaranteed_rent_due NUMERIC(10,2) NOT NULL,     -- what you owe the owner
  guaranteed_rent_paid NUMERIC(10,2) DEFAULT 0,   -- what you've paid the owner
  tenant_income_expected NUMERIC(10,2) DEFAULT 0, -- what tenants owe you
  tenant_income_received NUMERIC(10,2) DEFAULT 0, -- what tenants paid you
  gross_margin NUMERIC(10,2),                     -- tenant income - owner cost
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## LEVEL 2 — FINANCIAL DEPTH
### Double-entry accounting, client accounting, disbursements, multi-currency, Xero sync

---

### Step 7 — Chart of Accounts UI + Journal Viewer

**Route:** `/app/money/accounts` (new tab in Money section)

**Pages to build:**
- `accounts/page.tsx` — Chart of accounts tree view, expandable by type (Asset/Liability/Income/Expense)
- `accounts/new/page.tsx` — Create account form
- `accounts/[id]/page.tsx` — Account detail: all journal lines for this account, running balance
- `accounts/journal/page.tsx` — Full journal ledger: all entries, filterable by date, property, account

**Components:**
- `AccountsTree` — recursive tree rendered by account_type group
- `JournalLedger` — sortable table with debit/credit columns, running balance
- `JournalEntryDetail` — modal/drawer showing full double-entry for a single event

**Logic:**
- Every `money_income` payment record creation fires a Supabase Edge Function: `create_journal_entry_income` that posts: DR Bank/Receivables, CR Rental Income
- Every `money_expenses` payment fires `create_journal_entry_expense`: DR relevant expense account, CR Bank/Payables
- Balance sheet computed in real-time by summing journal_lines by account_type

**Money section nav:** Add "Accounts" tab alongside existing Income / Expenses / Invoices / Bills tabs

---

### Step 8 — Multi-Currency Display & FX Rate Engine

**Supabase Edge Function:** `sync_exchange_rates` — scheduled daily, calls `open.er-api.com/v6/latest/GBP` (free, no auth), upserts into `currency_exchange_rates` table.

**UI changes:**
- Workspace Settings → Profile: add "Base Currency" selector (defaults to GBP)
- Every monetary input field gets optional currency selector
- Money dashboard: toggle "Show in base currency" / "Show in original currency"
- Reports: FX gain/loss line automatically calculated

**No paid API — open.er-api.com free tier provides 1,500 requests/month. Daily cron = 30 requests/month.**

---

### Step 9 — Client Accounting & Owner Disbursements

**Route:** `/app/money/client-accounts` (gated behind Agency tier)

**Pages:**
- `client-accounts/page.tsx` — list of all landlord client accounts with balance summary
- `client-accounts/[id]/page.tsx` — client ledger: all receipts, fees, disbursements
- `client-accounts/[id]/disbursement/new/page.tsx` — create disbursement statement

**Disbursement flow:**
1. Select period (month)
2. System pulls all income received for properties in this client's portfolio
3. Auto-calculates management fee (% set on client account)
4. Shows itemised deductions (maintenance bills, etc.)
5. Preview disbursement statement PDF
6. Approve → creates journal entry, marks income as disbursed
7. Generate PDF owner statement → save to Storage → email to landlord

**PDF generation:** Use `@react-pdf/renderer` (free, open source) — renders React component to PDF server-side in Edge Function.

**Owner Portal access:** Landlord client gets read-only portal view of their statement (separate login via magic link). This is the "owner portal" feature.

---

### Step 10 — Automated Rent-to-Owner Disbursement Engine

**How it works:**
- Each client account has `auto_disburse: boolean` and `disburse_day: integer` (e.g. 25th of month)
- Supabase scheduled function runs daily: checks if today = disburse_day for any client account
- Auto-creates disbursement draft, sends notification to agent for approval
- Agent reviews in `/app/money/client-accounts/[id]` and approves with one click
- On approval: system creates outgoing payment instruction (BACS reference generated), marks disbursement paid, sends owner statement PDF

**Fee deduction logic:**
- Management fee % stored on client_account
- Flat fee per property option
- Let fee (one-off per new tenancy) — optional
- Maintenance markup % (optional)
- All configurable per client account

---

### Step 11 — CAM Budget Reconciliation (Commercial Properties)

*For agents managing commercial leases with service charges*

**Route:** `/app/money/service-charges`

**New table additions (extend Migration 024):**
```sql
CREATE TABLE service_charge_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  budget_year INTEGER NOT NULL,
  total_budget NUMERIC(14,2) NOT NULL,
  line_items JSONB,                       -- array of {category, budget_amount}
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','issued','reconciled')),
  actual_spend NUMERIC(14,2) DEFAULT 0,
  surplus_deficit NUMERIC(14,2) DEFAULT 0,
  reconciliation_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**UI:** Budget vs actual bar chart per category, year-end reconciliation wizard that calculates tenant adjustment amounts (credit or charge), generates reconciliation statement PDF.

---

### Step 12 — Xero Two-Way Sync (Add-on)

**Gated:** Workspace Settings → Add-ons → "Xero Integration" toggle (Professional tier add-on)

**Implementation:**
- Xero OAuth 2.0 (free API, no cost per call)
- Xero App creation via Xero Developer Portal (free)
- Store tokens in `workspace_integrations` table (encrypted)

**Sync logic:**
- **Propvora → Xero:** Income records → Xero Invoices. Expense records → Xero Bills. Contacts → Xero Contacts.
- **Xero → Propvora:** Payment marks in Xero → updates `money_income.status` to reconciled. Bank reconciliation in Xero → updates `money_expenses.status`.
- Sync runs on-demand ("Sync Now" button) + webhook from Xero on payment events

**Routes:** `/app/workspace-settings/integrations/xero` — OAuth connection, sync status, sync history, field mapping configuration

**QuickBooks:** Same pattern using QuickBooks Online API (also free, OAuth 2.0). Separate toggle in Add-ons.

---

### Step 13 — MTD ITSA Quarterly Submissions

**Gated:** Professional tier (massive commercial value — mandatory for £50k+ income from April 2026)

**HMRC APIs used (all free):**
- MTD Income Tax API — submit quarterly updates, annual summaries
- HMRC Sandbox — full testing environment provided free by HMRC
- OAuth 2.0 authentication via HMRC Identity Service (free)

**Implementation:**
- MTD Setup Wizard: connect HMRC account, enter UTR number, select tax year
- Auto-categorise income/expenses into HMRC property income categories (Class 1: rental income, repairs, management fees, insurance, utilities, finance costs)
- AI categorisation: existing AI Copilot analyses expense descriptions and suggests HMRC category
- Quarterly submission dashboard: Q1 (Apr-Jun) → Q2 (Jul-Sep) → Q3 (Oct-Dec) → Q4 (Jan-Mar)
- One-click quarterly submission with confirmation receipt from HMRC
- Final declaration wizard (annual Self-Assessment supplement)

**Routes:**
- `/app/money/mtd` — MTD dashboard: submission history, upcoming deadlines, connection status
- `/app/money/mtd/setup` — HMRC connection wizard
- `/app/money/mtd/quarter/[period]` — review and submit quarterly update
- `/app/money/mtd/annual` — annual declaration

**Tax Readiness Score:** Calculated nightly: % of income/expenses categorised ÷ total entries. Shown as progress ring on money dashboard. Warns 30 days before quarter deadline.

---

## LEVEL 3 — LEASING & OCCUPANCY
### Vacancy management, prospect CRM, viewings, eSignature, referencing, portal listings

---

### Step 14 — Vacancy Management & Prospect CRM

**Route:** `/app/leasing` — new top-level section (add to main nav)

**Sub-routes:**
- `/app/leasing/vacancies` — active vacancies board (Kanban: Draft → Active → Under Offer → Let)
- `/app/leasing/vacancies/new` — create vacancy from a unit
- `/app/leasing/vacancies/[id]` — vacancy detail: description, photos, portal status, prospects list
- `/app/leasing/prospects` — all prospects CRM table, filterable by status/vacancy
- `/app/leasing/prospects/[id]` — prospect profile: contact details, viewing history, referencing status
- `/app/leasing/viewings` — viewing calendar (integrate with existing Calendar section)
- `/app/leasing/viewings/new` — schedule viewing: select prospect + vacancy + datetime

**Components:**
- `VacancyCard` — unit photo, rent, status badge, days on market
- `ProspectPipeline` — Kanban columns matching prospect status enum
- `ViewingScheduler` — date/time picker + prospect selector
- `ViewingFeedbackForm` — outcome, notes, next action

**Auto-actions:**
- New prospect enquiry email received → prospect created automatically (if email integration enabled)
- Viewing marked complete → auto email to prospect with feedback form link
- Prospect status moves to "Referencing" → triggers referencing integration (Step 18)

---

### Step 15 — Digital Tenancy Agreement Builder

**Route:** `/app/leasing/agreements`

**Agreement template system:**
- System templates: AST (England & Wales), PRT (Scotland), Licence Agreement, Commercial Lease
- Workspace-custom templates: landlord creates own with variable placeholders `{{tenant_name}}`, `{{property_address}}`, `{{monthly_rent}}`, etc.
- Rich text editor (using `@tiptap/react` — free, open source) for template editing
- Variable injection: pulls from tenancy/property/contact records automatically

**Agreement creation flow:**
1. Select template
2. Auto-fill variables from linked tenancy record
3. Preview rendered agreement
4. Add/remove clauses (library of standard UK clauses)
5. Set signing order (Tenant → Landlord, or simultaneous)
6. Send for signature

**Storage:** Agreement HTML stored in `tenancy_agreements.document_html`. Final signed PDF rendered server-side and stored in Supabase Storage.

---

### Step 16 — Native eSignature (No DocuSign — Zero Cost)

**How it works (legally valid under UK ECA 2000):**

1. Agent sends agreement → system creates one `agreement_signatory` row per signer with a unique UUID token
2. Each signer receives email: "Please sign your tenancy agreement — [Click to Sign]"
3. Link: `/sign/[token]` — public route (no auth required) showing the agreement
4. Signer reads agreement, types their name, checks "I agree", clicks Sign
5. System records: `signed_at`, `ip_address`, `user_agent` — stored permanently
6. All signatories signed → system renders final PDF with signature certificate page appended:
   - Lists each signatory name, email, IP, timestamp, browser
   - Signed document hash (SHA-256 of content at time of signing)
7. Final PDF stored in Supabase Storage, linked to tenancy record
8. All parties emailed the completed document

**Signing audit trail:** Non-repudiable — IP + timestamp + name typed + email verification = legally valid electronic signature in UK courts.

**Route:** `src/app/sign/[token]/page.tsx` — public route outside `(app)` layout

**No ongoing cost.** This replaces DocuSign (£15+/month) entirely.

---

### Step 17 — Inventory & Check-In/Check-Out Reports

**Route:** `/app/leasing/inventories`

**Pages:**
- `inventories/page.tsx` — all inventory reports, filterable by property/status
- `inventories/new/page.tsx` — create report for a property
- `inventories/[id]/page.tsx` — room-by-room inventory with photos

**Report structure:**
- Property details + condition rating (Excellent/Good/Fair/Poor) per room
- Each room: list of items, condition, photos (uploaded to Supabase Storage)
- Overall condition summary
- Signatures section (tenant + agent/landlord)
- PDF export

**Types:** Check-In, Mid-Tenancy Inspection, Check-Out, Landlord Handover

**Photo capture:** File upload with image compression (browser-side using `browser-image-compression` — free npm package)

**Tenants can complete check-in report themselves:** Magic link sent to tenant → they fill in the form on mobile → agent reviews and countersigns

---

### Step 18 — Tenant Referencing Integration (Canopy API — Free to Integrate)

**Gated:** Professional tier add-on

**Canopy API (free to integrate, Canopy charges the tenant ~£20 for the reference):**
- Apply for API access at canopy.rent
- POST `/referencing/applications` — create reference request for a prospect
- Webhooks: receive status updates (in progress, passed, failed, more info needed)
- GET reference report PDF on completion

**Implementation:**
- In Prospect record: "Request Reference" button → opens Canopy reference request modal
- Sends prospect's email, name, tenancy details to Canopy API
- Status tracked in `prospects` table: `referencing_status`, `referencing_provider`, `referencing_reference_id`
- Webhook endpoint: `/api/webhooks/canopy` — updates status, stores PDF in Documents section

**Fallback:** If Canopy API access not yet approved, generate a manual reference checklist (employer reference template, previous landlord reference template) as PDFs the agent can email manually.

**Right to Rent (Manual + Digital):**
- RTR checklist in prospect record (manual): which documents seen, date checked, expiry of time-limited permission
- Digital RTR: link to gov.uk share code verification (no API needed — agent follows link, records outcome)

---

### Step 19 — Portal Listing Syndication (Export-First Approach)

**Why export-first:** Rightmove does not have a public listing upload API — access requires being an accredited data feed provider (Jupix, Dezrez etc.). Rather than a blocked integration, build a smart export.

**Implementation:**

**Property data feed export:**
- One-click export vacancy as Rightmove BLM format (industry-standard XML)
- One-click export as OnTheMarket Rental Feed XML
- One-click export as Zoopla RTDF format
- Agent uploads the file to their portal dashboard manually

**Future:** When Propvora has enough users to qualify for direct feed access (typically 50+ properties on a single portal account), replace export with direct API push.

**In-platform vacancy status tracking:**
- Agent manually updates `portal_listings` JSONB: `{"rightmove": "listed", "zoopla": "listed"}`
- Status badges shown on vacancy card
- Days on market tracked per portal

**Applicant enquiry inbox:**
- Forward Rightmove/Zoopla enquiry emails to a Propvora workspace inbox (using existing email integration)
- System parses enquiry email → creates prospect record automatically (via Edge Function using regex extraction)

---

## LEVEL 4 — OPERATIONS & MAINTENANCE
### Contractor app, PPM, job costing, multi-dispatch, photo uploads, IoT-light

---

### Step 20 — Enhanced Contractor Management (Extend Supplier Portal)

**Existing:** The Supplier Portal already exists at `/app/work/suppliers`. Extend it significantly.

**New supplier portal features:**
- Contractor compliance pack: store GasSafe certificate, NICEIC registration, public liability insurance, DBS check — each with expiry tracking
- Contractor availability calendar: contractor sets their availability in the portal
- Specialisms tagging: `['gas','electrical','plumbing','roofing','painting','locksmith']`
- Coverage postcodes: list of postcodes/areas they cover
- Performance metrics: jobs completed, average completion time, average rating from landlords
- Contractor profile page in the marketplace (Step 47)

**New `supplier_compliance` table (add to Migration 029):**
```sql
CREATE TABLE supplier_compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  compliance_type TEXT NOT NULL CHECK (compliance_type IN
    ('gas_safe','niceic','napit','public_liability','employers_liability',
     'dbs_check','chas','constructionline','other')),
  certificate_number TEXT,
  issuing_body TEXT,
  expiry_date DATE,
  document_path TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### Step 21 — Planned Preventative Maintenance (PPM) Scheduler

**Route:** `/app/work/ppm`

**New tables (add to Migration 029):**
```sql
CREATE TABLE ppm_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  unit_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,               -- 'gas_service','boiler_service','gutter_clean', etc.
  frequency_type TEXT NOT NULL CHECK (frequency_type IN
    ('weekly','monthly','quarterly','biannual','annual','custom')),
  frequency_value INTEGER DEFAULT 1,   -- e.g. every 2 months
  last_completed_date DATE,
  next_due_date DATE NOT NULL,
  assigned_supplier_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  estimated_cost NUMERIC(10,2),
  auto_create_job BOOLEAN DEFAULT true, -- auto-create work job when due
  days_before_due_to_create INTEGER DEFAULT 14,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Pages:**
- `ppm/page.tsx` — PPM schedule list: upcoming tasks calendar view + list view
- `ppm/new/page.tsx` — create PPM schedule
- `ppm/[id]/page.tsx` — history of completions, upcoming due dates, linked work jobs

**Automation:** Supabase Edge Function scheduled daily: finds PPM schedules where `next_due_date = today - days_before_due_to_create`. Auto-creates work job, assigns to preferred supplier, sends notification.

---

### Step 22 — Job Costing & Invoice Management Per Property

**Extend existing `work_jobs` table with financial columns (new migration adds columns):**
```sql
ALTER TABLE work_jobs ADD COLUMN IF NOT EXISTS estimated_cost NUMERIC(10,2);
ALTER TABLE work_jobs ADD COLUMN IF NOT EXISTS actual_cost NUMERIC(10,2);
ALTER TABLE work_jobs ADD COLUMN IF NOT EXISTS charged_to TEXT
  CHECK (charged_to IN ('landlord','tenant','insurance','warranty','ppm_budget'));
ALTER TABLE work_jobs ADD COLUMN IF NOT EXISTS invoice_id UUID;
ALTER TABLE work_jobs ADD COLUMN IF NOT EXISTS bill_id UUID;
```

**Job cost flow:**
1. Job created → estimate entered
2. Supplier submits invoice via Supplier Portal (photo or PDF upload)
3. Agent reviews invoice → creates Bill in Money section linked to job
4. Bill paid → job marked "invoiced and paid", actual cost recorded
5. If charged to tenant → creates invoice in Money section for tenant
6. If client accounting active → deducted from landlord disbursement

**Reports:** Property-level maintenance cost report: total per year, per category, vs budget. Portfolio-level: highest maintenance cost properties ranked.

---

### Step 23 — Maintenance Photo/Video Uploads from Tenants

**Tenant portal maintenance submission — extend existing functionality:**

**Tenant-side upload flow:**
1. Tenant logs into tenant portal: `/portal/tenant`
2. "Report an issue" → form with: category, description, urgency, photos/videos
3. File uploads direct to Supabase Storage (tenant scoped bucket)
4. Work job created with attached media

**Photo/video storage:**
- Images: compressed browser-side to max 2MB before upload
- Videos: max 50MB, stored in Supabase Storage with signed URL access
- Thumbnail generation: Edge Function on upload trigger (using Supabase image transformation)

**Agent job view:** Photos displayed in a gallery in the job detail page. Contractor (Supplier Portal) can also upload progress/completion photos.

---

### Step 24 — Multi-Contractor Dispatch

**Extend job creation:**
- Instead of assigning one contractor, send job to multiple contractors simultaneously
- Each contractor receives the job in their Supplier Portal feed with: "Accept" or "Decline"
- First to accept gets the job (configurable: first-accept-wins vs agent selects from responses)
- Contractors can submit quotes before accepting (optional)

**New table:**
```sql
CREATE TABLE job_dispatch_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  job_id UUID NOT NULL,
  supplier_id UUID NOT NULL REFERENCES contacts(id),
  status TEXT NOT NULL DEFAULT 'invited'
    CHECK (status IN ('invited','accepted','declined','expired','awarded')),
  invited_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  quoted_amount NUMERIC(10,2),
  quote_notes TEXT
);
```

**Dispatch dashboard:** Shows all outstanding invites per job, contractor responses, easy "Award to [contractor]" button.

---

### Step 25 — IoT-Light Predictive Maintenance Signals

**No IoT hardware required.** Build a lightweight predictive layer using existing data patterns.

**Predictive signals from existing data:**
- Gas boiler last serviced > 11 months ago → alert "boiler service due within 30 days"
- EICR issued > 4 years ago → alert "EICR renewal approaching next year"
- Same maintenance category recurring 3+ times in 12 months → alert "recurring issue pattern — consider replacement"
- Property age > 30 years + no boiler/electrical work in last 5 years → flag as "high maintenance risk"

**Maintenance Risk Score:** Calculated per property: 0-100 score. Shown on property detail page. Factors: age of last compliance certificates, frequency of recent repairs, outstanding PPM items, time since last inspection.

**Future IoT hook:** `property_sensor_events` table stubbed in schema. When a landlord connects a smart sensor (Hive, Nest, etc.) via webhook, sensor events (boiler fault codes, leak detection) can write to this table and trigger work jobs automatically.

---

## LEVEL 5 — HMO MODULE
### Room-level rent, deposits, licence tracking, utility splitting, void tracking

---

### Step 26 — Room-Level Rent Tracking

**HMO properties have units (rooms). The existing `units` table handles this. Build room-level specifics:**

**Route:** `/app/portfolio/properties/[id]/hmo` — new tab on property detail page (shown only when `property_type = 'hmo'`)

**HMO Dashboard for a property:**
- Room grid: all rooms at a glance — status (occupied/vacant/reserved), tenant name, rent amount, next payment date, arrears indicator
- Total room income vs actual received this month
- Void summary: rooms vacant, days vacant, void loss amount
- HMO licence status badge + days to renewal

**Room rent management:**
- Each unit (room) has its own `room_rent_schedule` row
- Different rent amounts per room (unlike standard single-let)
- Individual payment due dates per room (tenant may pay on different day)
- Room-level arrears tracking independent of other rooms in the property

---

### Step 27 — Per-Room Deposit Records & Protection

**Extend existing deposit tracking to be per-unit (room) not just per-property:**

**New table:**
```sql
CREATE TABLE room_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL,
  tenancy_id UUID,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  protection_scheme TEXT CHECK (protection_scheme IN ('dps','tds','mydeposits','none')),
  scheme_reference TEXT,
  protection_date DATE,
  prescribed_info_served_date DATE,
  return_date DATE,
  return_amount NUMERIC(10,2),
  deductions JSONB,                      -- array of {reason, amount}
  status TEXT NOT NULL DEFAULT 'held'
    CHECK (status IN ('held','returned','disputed','deducted')),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**UI on room detail:** Deposit status badge, protection reference, days until protection expires (30-day rule), "Register deposit" action button.

**Compliance alert:** If deposit collected but not protected within 30 days → red warning banner on property HMO dashboard and compliance overview.

---

### Step 28 — HMO Licence Management

**Route:** `/app/compliance/hmo-licences` — new tab in Compliance section

**Pages:**
- `hmo-licences/page.tsx` — all HMO licences across portfolio: status, expiry, renewal timeline
- `hmo-licences/new/page.tsx` — register new HMO licence
- `hmo-licences/[id]/page.tsx` — licence detail: conditions, attached document, renewal history

**Licence conditions tracker:**
- Store conditions as JSON array: `[{condition: "Max 6 occupants", status: "compliant"}, ...]`
- Each condition can be marked compliant/non-compliant/in-progress
- Overall compliance score for the licence

**Renewal workflow:**
- 90/60/30 day automated reminders (Supabase Edge Function)
- "Start renewal" button → creates compliance task + notifies agent
- Council-specific renewal notes (different councils have different processes)

---

### Step 29 — Utility Bill Splitting Module

**Route:** `/app/money/utilities` — new tab in Money section (shown for HMO workspaces)

**Utility entry flow:**
1. Upload or enter utility bill for an HMO property
2. System shows all current room occupants with their occupancy dates for the billing period
3. Agent selects split method: Equal / By occupancy days / By floor area / Custom %
4. System calculates per-room split amounts
5. One-click: "Generate tenant invoices" → creates individual invoices per tenant via Money section
6. Tenants see their utility invoices in tenant portal

**Utility dashboard per property:**
- Monthly spend per utility type (bar chart by month)
- Cost per room per month
- Year-on-year comparison
- Highest utility cost rooms flagged (useful for identifying inefficient rooms)

**Smart meter integration (future):** Stub webhook endpoint at `/api/webhooks/smartmeter/[workspaceId]`. When a landlord connects via n3rgy API (free for SMETS2 meters), half-hourly readings auto-populate utility bills.

---

### Step 30 — HMO Room Onboarding Workflow

**Workflow:** From vacancy to fully onboarded HMO room tenant in one guided flow.

**Steps in the onboarding wizard:**
1. Create/select vacancy for the room
2. Add prospect, schedule viewing
3. Prospect passes referencing
4. Generate room AST (using agreement builder, room-specific template)
5. Collect e-signatures
6. Record deposit + register protection
7. Right to Rent check recorded
8. Keys issued (log key number/type)
9. Utility bill split updated for new occupant
10. Tenant portal invitation sent
11. Welcome pack emailed (customisable template)

**Progress tracker:** Visual checklist on the unit detail page showing completed/pending steps. Each step links to the relevant form/action.

---

### Step 31 — HMO Multi-Tenancy Void Tracking & Financial Modelling

**Void tracking:**
- Per-room void periods automatically calculated: `last_tenancy_end_date` to `next_tenancy_start_date`
- Void cost = daily rent equivalent × void days
- Void reason logging: "tenant moved out", "refurbishment required", "slow market", etc.

**Room-Level Financial Modelling:**
- Annual yield per room: (annual rent received ÷ (purchase price ÷ number of rooms)) × 100
- Void-adjusted yield: factors in void periods
- Break-even occupancy: minimum % occupancy needed to cover mortgage/costs
- "Optimal rent" suggestion: based on historical void periods — if room rents at £800 but voids 2 months/year, reducing to £750 with lower void rate improves net yield

**Route:** `/app/portfolio/properties/[id]/hmo/analytics` — HMO analytics tab on property detail

---

## LEVEL 6 — COMPLIANCE & LEGAL
### Possession engine, Section 8 wizard, court bundles, certificate delivery, Renters' Rights Act

---

### Step 32 — Section 8 Possession Wizard

**Route:** `/app/compliance/possession` — new tab in Compliance section

**Pages:**
- `possession/page.tsx` — all possession cases: status board (Kanban by stage)
- `possession/new/page.tsx` — start a new possession case
- `possession/[id]/page.tsx` — full case detail

**Case creation wizard (5 steps):**

**Step 1: Select tenancy**
- Pick from active tenancies with outstanding arrears
- System shows: total arrears, weeks in arrears, last payment date

**Step 2: Select ground(s)**
- Ground 8: Mandatory (≥2 months / 8 weeks arrears at date of notice AND date of hearing)
- Ground 10: Discretionary (some rent arrears)
- Ground 11: Discretionary (persistent late payment even if not in arrears)
- Ground 12: Breach of tenancy obligation
- Grounds 14/14A: Anti-social behaviour
- Other grounds shown with brief explanation

**Step 3: Gather evidence**
- System auto-pulls: payment history from `money_income`, comms log from contacts
- Evidence checklist: required items for chosen ground shown with ✓/✗
- Agent uploads any additional documents

**Step 4: Section 8 Notice generation**
- Form 3 (Housing Act 1988 Section 8) auto-populated with: tenant name, property address, grounds, arrears amount, notice date, expiry date (14 days for mandatory grounds, 14 days minimum)
- Agent reviews, can edit free-text sections
- "Generate Notice PDF" → formatted legal document ready to print/serve

**Step 5: Serving record**
- How served: hand delivered, first class post, email (where permitted), process server
- Date served, confirmation captured
- Expiry date auto-calculated

---

### Step 33 — Possession Evidence Chain & Timestamped Ledger

**Evidence that is automatically gathered (no manual work):**

Every time a rent payment is missed, the system creates an `possession_evidence` record automatically:
- Type: `missed_payment`
- Amount: expected amount
- Event date: due date
- Source: `system`

Every time a rent payment arrives late, evidence record:
- Type: `partial_payment` or `late_payment`
- Amount: received amount vs expected
- Event date: actual receipt date
- Source: `system`

Every time a communication is sent to the tenant from Propvora (email, WhatsApp):
- Type: `communication`
- Description: subject/summary
- Event date: sent timestamp

**Agent can add manual evidence:**
- "Tenant was found at property" — type: communication
- Phone call attempt — type: communication
- Any document upload — type: photo/statement/other

**Evidence Timeline view:** Chronological list of all evidence items per possession case. Downloadable as CSV.

---

### Step 34 — Court Bundle Generator

**"Generate Bundle" button on possession case detail page.**

**Bundle contents (auto-assembled PDF):**
1. Cover page: property address, tenant name, grounds, case reference
2. Tenancy agreement (linked from Documents section)
3. Payment history table (full ledger of expected vs received, formatted as numbered table)
4. Section 8 notice (stored PDF from Step 32)
5. Evidence items: each communication, each document, each bank record — numbered and date-ordered
6. Certificate of service (how notice was served, date, method)
7. Signature page (agent declaration)

**PDF assembly:** `@react-pdf/renderer` Edge Function. Each section is a React-PDF component. Full bundle typically 10-30 pages.

**Storage:** `possession_cases.evidence_bundle_path` — stored in Supabase Storage. Regenerated on demand (case may be updated after initial bundle creation).

---

### Step 35 — Automated Certificate Delivery to Tenant Portal

**Extend existing compliance certificates flow:**

When a new certificate is uploaded and status = active:
- Supabase trigger fires
- Checks: is there an active tenancy at this property?
- If yes: creates a notification in tenant portal: "New certificate uploaded — [Gas Safety Certificate]"
- Email sent to tenant with PDF attached (requires email integration enabled)
- Logs delivery timestamp in compliance record: `delivered_to_tenant_at`

**Compliance view:** New column on certificates list: "Delivered to tenant" with timestamp or "Not delivered" badge + "Send now" button for manual trigger.

**Prescribed information for deposits:** When deposit registered, auto-generates prescribed information document (standard template) and sends to tenant — legally required within 30 days.

---

### Step 36 — Renters' Rights Act 2026 Compliance Toolkit

**New compliance section: "Renters' Rights Act"** — banner on compliance overview for all England workspaces.

**Toolkit components:**

**1. Periodic Tenancy Converter**
- Shows all fixed-term ASTs with end dates
- Status: "Becomes periodic on [date]" for post-May 2026 tenancies
- Action: review and update tenancy records to reflect periodic status

**2. Section 21 Prohibition Check**
- Warning on any tenancy where user tries to create a Section 21 notice: "Section 21 notices cannot be served since 1 May 2026. Use Section 8 instead."
- Link to possession wizard (Step 32)

**3. Permitted Rent Increases**
- Periodic tenancy rent increases now require Section 13 notice (minimum 2 months notice, once per year)
- Rent increase wizard: generates Section 13 notice, tracks service date, tracks when new rent takes effect

**4. Right to Request Information**
- Log tenant requests for property information (tenants have new rights under RRA 2026)
- Track response deadlines (14 days)

**5. Database of prohibited terms**
- Check tenancy agreement clauses against list of now-prohibited clauses (blanket no-pet clauses, etc.)
- AI Copilot can analyse uploaded agreements for prohibited terms

---

## LEVEL 7 — AI & INTELLIGENCE
### Agentic rent chase, yield intelligence, portfolio benchmarking, tenant risk scoring, MTD AI, certificate extraction

---

### Step 37 — AI Copilot Extensions: Certificate & Document Intelligence

**Extend existing AI Copilot to be document-aware.**

**Certificate Auto-Extraction:**
When a document is uploaded to the Compliance section:
1. Edge Function calls Anthropic API (Claude claude-haiku-4-5-20251001 — cheapest model, perfect for extraction tasks)
2. Prompt: extract property address, expiry date, issuing engineer/company, certificate type, pass/fail status from the document
3. Returns structured JSON
4. Pre-fills compliance record form with extracted data — agent just confirms

**Lease Intelligence:**
When a tenancy agreement PDF is uploaded:
1. AI extracts: all tenant names, start date, end date, monthly rent, deposit amount, break clauses, special conditions, rent review clauses
2. Creates a structured "Lease Summary" panel on tenancy detail page
3. Flags non-standard clauses and potentially prohibited clauses (RRA 2026 check)

**Natural Language Portfolio Q&A:**
Extend AI Copilot chat with portfolio data context:
- "What's my total outstanding rent across all properties?"
- "Which properties have certificates expiring in the next 60 days?"
- "Show me all tenancies ending in Q3 2026"
- "What did I spend on maintenance at [address] last year?"

AI fetches data via secure server-side Supabase calls and returns answers in natural language with table/chart formatting.

**Cost control:** Claude claude-haiku-4-5-20251001 (~$0.00025/1K tokens). Average extraction request = ~2K tokens = $0.0005 per upload. Even at 1,000 uploads/month = $0.50.

---

### Step 38 — Agentic AI Rent Chase with Legal Evidence Chain

**The most commercially powerful AI feature. No competitor has this properly.**

**Architecture: AI Rent Chase Agent**

Supabase Scheduled Function runs daily at 06:00:
1. Queries all active tenancies where payment was due yesterday and not received
2. For each missed payment: creates `possession_evidence` record automatically (Step 33)
3. Determines escalation level based on history:
   - Level 1 (first missed): friendly reminder
   - Level 2 (3+ days overdue): formal reminder
   - Level 3 (7+ days overdue): formal notice of arrears
   - Level 4 (14+ days): legal escalation notice + auto-prepares possession evidence bundle

**Communication channels (priority order by what's enabled):**
- Email (always enabled, no cost)
- SMS via Twilio (addon — agent enters Twilio API key, ~£0.04/SMS)
- WhatsApp via Meta Cloud API (addon — see Step 48)

**All communications:**
- Written by AI (Claude claude-sonnet-4-6) using tenant history, tone calibrated to escalation level
- Professionally worded, legally appropriate
- Stored as `possession_evidence` records with timestamp
- Agent can review/edit before send OR set to fully automatic

**Agent Control Panel:** `/app/money/rent-chase`
- Toggle: "Fully Automatic" vs "Review Before Send"
- Per-tenant escalation level override
- Communication history per tenancy
- "Pause chase" button per tenancy (for tenants on a payment arrangement)
- Payment arrangement logging: terms agreed, amounts, dates — shown in evidence trail

---

### Step 39 — AI Yield & Room Pricing Intelligence

**Route:** `/app/planning/yield-intelligence` — new tab in Planning section

**Data sources (all free):**
- Internal: historical rent received, void periods, maintenance costs per property/room
- External: Rightmove rental listings data (scraped via server-side Edge Function — legitimate for personal/business use)

**Yield calculations per property/room:**
- Gross yield: (annual rent ÷ property value) × 100
- Net yield: ((annual rent - annual costs) ÷ property value) × 100
- Void-adjusted yield: accounts for average days vacant
- Room yield: per-room breakdown for HMOs

**AI Pricing Recommendations:**
- AI analyses: current room rent vs comparable rooms in the same postcode on Rightmove
- Shows: "Your Room 3 at £750/month is £80 below the local market median of £830"
- Shows: "Raising to £800 adds £600/year. With current 5% void rate, net uplift is £540/year"
- Historical context: "Last time you raised rent at this property was 18 months ago"

**Portfolio Performance Dashboard:**
- Properties ranked by net yield (high → low)
- Void rate by property (% of days vacant per year)
- Maintenance cost ratio (maintenance spend as % of gross rent)
- Tenant stability score (average tenancy length per property)
- "Underperformer" flagging: properties in bottom quartile on 2+ metrics

---

### Step 40 — Tenant Quality & Risk Scoring

**Composite tenant risk score (0-100, higher = lower risk):**

Factors (all from internal data — no external API needed initially):
- Payment consistency: % of payments on time in last 12 months (40% weight)
- Payment completeness: % of payments paid in full (20% weight)
- Tenancy length: longer = lower risk (15% weight)
- Maintenance request frequency: very high frequency = flag (10% weight)
- Communication response rate: % of messages responded to within 48h (10% weight)
- Complaints logged: formal complaints in record (5% weight — reduces score)

**Display:**
- Score badge on contact/tenant profile: Green (80-100), Amber (50-79), Red (0-49)
- Score breakdown chart on tenant detail page
- "Risk factors" list: specific items reducing the score
- Score history trend line: improving/deteriorating over time

**Tenancy renewal decision support:**
- When tenancy approaches renewal, AI Copilot prompts: "Tenancy at [address] expires in 60 days. Tenant risk score is 72 (Good). Payment record: 11/12 payments on time. Recommend renewal."

**Future (Phase 2):** Canopy RentPassport integration — pull external reference score into composite calculation.

---

### Step 41 — Portfolio Intelligence & Benchmarking Dashboard

**Route:** `/app/planning/portfolio-intelligence` — new tab in Planning section

**Benchmarking panels:**

**Cross-portfolio comparison table:**
- All properties in one table: yield, void rate, maintenance cost ratio, tenant score, compliance score
- Sort by any column
- Filter by: property type, location, acquisition year
- Export as CSV/PDF

**Performance bands:**
- AI categorises each property: Star (top 25%), Average (mid 50%), Underperformer (bottom 25%)
- Underperformer properties get an "Action plan" AI-generated suggestion: "High maintenance costs — consider roof inspection. Void rate above average — review rent vs market."

**Void analysis:**
- Void calendar: which months have highest vacancy across portfolio
- Average void duration by property type (HMO rooms void faster than whole properties typically)
- Void cost total per year

**Maintenance cost intelligence:**
- Highest maintenance cost properties
- Most common maintenance categories by cost
- "Recurring issue" detection: same category at same property 3+ times in 12 months

---

### Step 42 — MTD AI Tax Categorisation Engine

**Extends the MTD module (Step 13).**

**AI categorisation (Claude claude-haiku-4-5-20251001):**
Every uncategorised expense in `money_expenses`:
1. AI reads: description, supplier name, amount
2. Maps to HMRC property income allowable expense category:
   - Repairs and maintenance
   - Insurance
   - Letting agent fees and management fees
   - Accountancy, legal and other professional fees
   - Utilities (if landlord pays)
   - Ground rent and service charges
   - Other allowable property expenses
   - Mortgage interest (separate line — restricted relief)
   - Capital expenditure (not allowable — separate tracking)
3. Confidence score returned
4. Auto-applies if confidence > 85%
5. Low-confidence items flagged for manual review

**Tax Optimisation Alerts:**
- "You have £3,200 in expenses uncategorised — this may mean you're overpaying tax"
- "Capital item flagged: New boiler at £4,500 — ensure claimed as capital allowance, not repair"
- "Mortgage interest: £12,400 recorded. Finance cost relief restricted to 20% basic rate credit"

**SDLT & CGT Event Logging:**
- Property acquisition: auto-prompts SDLT calculation
- Property sale: triggers CGT event logging (sale price, original cost, improvement costs)
- Both exportable for accountant/HMRC

---

### Step 43 — AI-Powered Compliance Risk Scanner

**Proactive compliance intelligence — runs weekly per workspace.**

**Scanner checks:**
1. Any certificate expiring in next 60 days with no renewal booked → alert
2. Any deposit not protected within 30 days of collection → critical alert
3. Any RTR check not done for a tenancy started in last 28 days → alert
4. Any HMO licence expiring in next 90 days → alert
5. Any property with 5+ occupants but no HMO licence on record → critical alert
6. Any periodic tenancy (post-RRA 2026) that hasn't had a rent review in 12+ months → info alert
7. Any possession case where notice has expired but no court action → prompt alert

**Compliance Risk Score per workspace:**
- 0-100 score displayed on compliance overview page
- Breakdown by category
- Red items block score from reaching 100

**Weekly email digest:** Summary of compliance alerts for the week. Agent can disable per workspace.

---

## LEVEL 8 — INTEGRATIONS & ADD-ONS
### Open Banking, WhatsApp, GoCardless, Xero (detailed), Rent Guarantee, R2R portal

---

### Step 44 — Open Banking Rent Reconciliation (TrueLayer)

**Gated:** Add-on — Free to enable, TrueLayer charges per connection (currently ~£0 for first 90 days, then small per-API-call fee — typically <£5/month for a small portfolio)

**Implementation:**
- Agent connects bank account via TrueLayer OAuth consent flow
- TrueLayer returns bank transactions (last 90 days + ongoing)
- System stores in `bank_transactions` table

**New table:**
```sql
CREATE TABLE bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  bank_connection_id UUID,
  transaction_id TEXT UNIQUE,           -- TrueLayer transaction ID
  account_id TEXT,
  amount NUMERIC(14,2) NOT NULL,
  currency TEXT DEFAULT 'GBP',
  description TEXT,
  transaction_date DATE NOT NULL,
  merchant_name TEXT,
  category TEXT,
  matched_income_id UUID REFERENCES money_income(id),
  matched_expense_id UUID REFERENCES money_expenses(id),
  match_confidence NUMERIC(3,2),        -- 0.0 to 1.0
  match_status TEXT DEFAULT 'unmatched'
    CHECK (match_status IN ('unmatched','auto_matched','manually_matched','excluded')),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Auto-matching logic (Supabase Edge Function):**
1. New transactions fetched from TrueLayer
2. For each transaction, attempt to match to unreconciled `money_income` row:
   - Amount match (within £5 tolerance for bank charges)
   - Date within ±5 days of expected payment date
   - Tenant name or reference appearing in transaction description
3. High confidence match (>0.85): auto-matched, income marked reconciled
4. Medium confidence: presented for agent confirmation
5. No match: shown in "Unmatched transactions" list for manual review

**UI:** `/app/money/reconciliation` — bank feed view, unmatched transactions, one-click match, bulk match for a month

---

### Step 45 — GoCardless Direct Debit Collection

**Gated:** Add-on — GoCardless charges 1% + 20p per transaction, capped at £4. No monthly subscription.

**Implementation:**
- GoCardless API (free to integrate, charges only on transactions)
- Tenant sets up Direct Debit mandate: agent sends mandate link, tenant authorises in their bank
- Rent collected automatically on due date each month

**Setup flow:**
1. Agent enables GoCardless in Add-ons
2. Per tenancy: "Set up Direct Debit" button
3. System creates GoCardless mandate via API
4. Tenant receives mandate authorisation email/link
5. Tenant completes mandate in their bank (5 minutes)
6. Going forward: rent collected automatically on payment day
7. Payment webhook → updates `money_income` status to received

**Benefits shown to agent:** "£X/month collected automatically. 0 chasing actions required."

---

### Step 46 — Rent Guarantee Insurance Integration

**Gated:** Optional add-on / referral revenue stream

**Implementation (affiliate/referral model — no API needed initially):**
- In tenancy detail: "Get Rent Guarantee" banner
- Shows: monthly premium estimate (calculated based on rent amount × standard rate ~3-3.5%)
- Click-through to partner provider: HomeLet / Goodlord / Let Alliance (referral link)
- Propvora earns referral commission from provider (negotiate 5-15% of premium)

**In-platform tracking:**
- `rent_guarantee_policies` table: provider, policy number, premium, cover start/end, max cover per month, claim history
- Alert when policy expires: 60/30 day reminders
- Claim initiation: "Start a claim" button → generates evidence pack from possession evidence chain (Step 33) → agent downloads and submits to insurer

**This turns the possession evidence chain feature into a direct revenue trigger.**

---

### Step 47 — Contractor Marketplace (Public + In-App)

**In-app marketplace (Phase 1):**
- Contractors who are suppliers on ANY Propvora workspace and have verified compliance documents → eligible to appear
- Landlords searching for a contractor: filter by trade type + postcode
- Contractor card shows: trade, areas covered, rating, verification badges, contact button

**Public marketplace (Phase 2):**
- `marketplace.propvora.com` subdomain
- Contractors pay £39/month to be listed (subscription via Stripe)
- Landlords can browse without logging in
- "Hire via Propvora" button → creates account + job

**Route (in-app):** `/app/work/marketplace`

**Revenue:** Contractor subscriptions = recurring B2B revenue stream outside landlord subscriptions.

---

### Step 48 — WhatsApp Business API (Meta Cloud API Add-on)

**Gated:** Add-on. Meta Cloud API pricing: first 1,000 service conversations/month FREE. After that ~$0.04-0.05 per conversation. Very low cost.

**Not Twilio — use Meta Cloud API directly:**
- Free to set up via Meta Business Suite
- Agent creates WhatsApp Business Account, connects phone number
- API keys stored in `workspace_integrations`

**What WhatsApp enables:**
- Rent reminders: "Hi [name], your rent of £[amount] is due tomorrow. Pay via: [bank details link]"
- Maintenance updates: "Your repair request has been assigned to [contractor]. Expected visit: [date]"
- Certificate uploads: "New Gas Safety Certificate uploaded for your property. [View]"
- Tenant onboarding: welcome message with tenant portal link
- Missed payment escalation (feeds into Step 38 AI Rent Chase)

**Audit trail:** All WhatsApp messages stored in `tenant_communications` table (new table, or extend existing contacts activity). Timestamp, direction (in/out), content. Legally timestamped evidence for possession cases.

**Inbound WhatsApp:** Tenant replies received in Propvora inbox. AI can draft suggested replies (extend AI Copilot). Agent sends from Propvora dashboard.

---

### Step 49 — R2R Operator Portal & Dual Ledger UI

**Route:** `/app/rent-to-rent` — new section, gated Agency tier

**Dashboard:**
- All R2R contracts: property address, owner, guaranteed rent per month, actual tenant income, margin
- Portfolio-level margin summary: total guaranteed rent outgoing vs total tenant income incoming
- Properties where margin is compressed (guaranteed rent > tenant income = loss-making period → alert)

**R2R Contract detail:**
- Owner payment schedule: next due date, payment history
- Subletting ledger: all tenant rents collected from this property
- Monthly P&L: gross income - guaranteed rent - maintenance = net margin
- Cash flow projection: 12-month forward projection based on current rents + any known changes

**Owner Portal (separate login):**
- Owner logs in with magic link
- Sees: guaranteed rent received/pending, property condition updates, compliance status
- Cannot see tenant rents or subletting income (privacy)
- Can download monthly payment statements

---

### Step 50 — SA/AST Hybrid Channel Management

**Gated:** Agency tier. For operators running both short-term SA and long-term AST lets.

**Phase 1 — In-platform SA management:**
- Unit type: `serviced_accommodation` added as option
- SA booking calendar: block/available dates, booking records
- Guest records: name, email, check-in/out dates, rate paid
- Revenue per night tracking
- Occupancy rate % per month

**Phase 2 — Channel Manager Integration:**
- Webhook receiver for Airbnb (via Hostaway or direct Airbnb API where available)
- Booking.com connectivity
- Prevents double-booking: SA bookings block calendar dates
- Revenue imported from channel manager into Money section

**Phase 2 approach (no expensive channel manager subscription):**
- iCal sync (free) — Airbnb and Booking.com both support iCal export
- Propvora subscribes to listing iCal feeds → imports bookings
- Outbound: Propvora generates iCal feed for each SA unit → paste into Airbnb/Booking.com
- Two-way sync via iCal polling every 15 minutes (Supabase Edge Function cron)

**SA compliance within Propvora:**
- SA properties still need EPC, gas safety if self-contained
- Fire safety (different requirements for SA)
- Council licensing for SA (some councils require licences)
- Short-term let registration number (Scotland mandatory, England proposed)

---

## LEVEL 9 — MARKET EXPANSION
### Scotland/Wales compliance, EPC advisory, international foundations

---

### Step 51 — Scotland: Private Residential Tenancy (PRT) Support

**What's different in Scotland:**
- PRT has no fixed term — all tenancies are open-ended by default
- Different notice periods: 28 days (tenant, < 6 months), 84 days (tenant, > 6 months), 28 days (landlord in most circumstances)
- First-tier Tribunal (not County Court) for possession
- Rent pressure zones: rent increase restrictions in certain areas
- Letting agent registration: LARN (Letting Agent Registration Number) required
- Deposit return: tenants can request return of deposit at any time (not just end of tenancy)

**Implementation:**
- Tenancy type selector: add `prt_scotland` alongside `ast_england`, `ast_wales`, `licence`
- When PRT selected: different notice period calculations, different termination workflow
- Pre-tenancy information pack generator (legally required in Scotland): tenant rights, landlord details, deposit scheme info
- First-tier Tribunal notice tools (equivalent to Section 8 wizard but Scotland-specific)
- LARN registration tracking field on workspace profile
- Rent pressure zone checker: postcode lookup against known RPZ areas

---

### Step 52 — Wales: Rent Smart Wales Compliance

**What's different in Wales:**
- Landlord registration: all landlords must register with Rent Smart Wales (£58 fee, 5-year renewal)
- Letting agent licensing: agents must be licensed with Rent Smart Wales
- Different EPC requirements timeline
- Welsh language rights for tenants

**Implementation:**
- Landlord RSW registration number field on workspace/contact profile
- RSW renewal reminder (5-year cycle)
- Agent RSW licence number + expiry tracking
- Welsh-language option for tenant portal (translate core tenant-facing strings to Welsh — i18n)
- Compliance dashboard: RSW status badge per landlord client in client accounting section

---

### Step 53 — EPC Upgrade Advisory & Grant Navigator

**Data source:** HMRC/government EPC register API (free, public API) + Ofgem grant database

**Route:** `/app/compliance/epc-advisory`

**Features:**
- Upload EPC certificate → AI extracts current rating, recommendations, estimated upgrade costs
- Shows: what upgrades would move property from current rating to EPC C
- Priority order by cost-to-rating-improvement ratio (cheapest per rating band improvement first)
- Available grants checker:
  - Boiler Upgrade Scheme: up to £7,500 for heat pump
  - Great British Insulation Scheme: loft/wall insulation grants
  - Local authority Flexible Eligibility (council-specific)
  - ECO4 scheme eligibility check
- Mortgage implications: flag properties likely to face lender restrictions if EPC < C post-2030
- EPC improvement project tracker: record what upgrades done, when, by whom, cost

---

### Step 54 — Multi-Property & Cross-Portfolio Benchmarking (Public Benchmarks)

**Extends Step 41 with external benchmark data.**

**Propvora aggregate benchmarks (anonymised):**
As Propvora grows, aggregate anonymised data across all workspaces:
- Average void rate for HMO rooms in [area]
- Average maintenance cost per bedroom type in [area]
- Average tenancy length by property type

**Individual landlord sees their properties vs the benchmark:**
- "Your average void rate: 4.2%. Propvora average for HMOs in Manchester: 3.1%. You are 1.1% above average."
- This data only available when Propvora has enough users (50+ in a given area) — stub the UI now, populate with real data as user base grows

**External data sources:**
- ONS rental market statistics (free government data) — average rents by region
- Land Registry sold prices (free) — property value context for yield calculations

---

### Step 55 — Add-On Store & Billing Integration

**Route:** `/app/workspace-settings/addons` — extend the existing addons page

**Add-on catalogue UI:**
Each add-on shows:
- Name + description
- Monthly cost (£/month added to subscription)
- Free trial option (7 or 14 days)
- "Activate" button → adds to Stripe subscription as metered or flat add-on

**Add-ons catalogue:**

| Add-on | Price | API it enables |
|---|---|---|
| WhatsApp Communications | £12/mo | Meta Cloud API |
| Open Banking | £8/mo | TrueLayer |
| GoCardless Collection | Free (transaction fees apply) | GoCardless |
| Xero Sync | £10/mo | Xero API |
| QuickBooks Sync | £10/mo | QuickBooks API |
| eSignature (additional volume) | Included in Pro+ | Native (free) |
| MTD Submissions | Included in Pro | HMRC MTD API (free) |
| Canopy Referencing | £0 (Canopy charges tenant) | Canopy API |
| SA Channel Sync | £15/mo | iCal + Hostaway webhook |
| Contractor Marketplace | £0 (contractors pay) | Internal |

**Stripe implementation:**
- Stripe Price objects per add-on
- Supabase `workspace_addons` table: `{workspace_id, addon_key, active, stripe_subscription_item_id}`
- Feature gates: `useAddon('whatsapp')` hook checks workspace_addons table
- Add-on activation: updates Stripe subscription via API, inserts workspace_addon row

---

### Step 56 — Release, Rollout & Backward Compatibility Checklist

*The final step before each level is deployed.*

**Database safety:**
- Every migration is additive only (new tables, new columns with defaults)
- No `ALTER COLUMN` that changes existing type
- No `DROP TABLE` or `DROP COLUMN`
- All new FK relationships use `ON DELETE SET NULL` or `ON DELETE CASCADE` appropriately
- RLS policies tested in Supabase SQL editor before deployment

**Feature flags during rollout:**
- All new sections (Leasing, R2R, MTD, Possession) are hidden from nav until explicitly enabled
- Feature flag table: `workspace_features { workspace_id, feature_key, enabled_at }`
- Existing workspaces don't see new sections until they're fully ready
- New sections enabled workspace-by-workspace during beta testing

**Route additions (never break existing routes):**
- All new routes are new paths — no existing routes modified
- New tabs on existing pages (Money, Compliance, Portfolio) are additive components rendered conditionally

**Component strategy:**
- New components added to `src/components/[module]/`
- No changes to `ShellLayout`, `ShellContent`, or global providers
- New layouts follow same pattern as `compliance/layout.tsx`

**Testing per level before moving to next:**
- TypeScript: `npx tsc --noEmit` — zero errors before shipping each level
- Manual test: create a record, read it, update it, delete it — for each new table/form
- RLS test: confirm workspace_id filter works (data from workspace A not visible in workspace B)

---

## SUMMARY: BUILD ORDER RECOMMENDATION

```
Month 1: Level 1 (all 6 DB migrations)
Month 2: Level 6 (Possession + Compliance) — highest commercial urgency post-Section 21
Month 3: Level 2 (Financial Depth) — MTD deadline driving adoption
Month 4: Level 5 (HMO Module) — unique differentiator, no competition
Month 5: Level 3 (Leasing & Occupancy) — fills table-stakes gaps
Month 6: Level 7 (AI Intelligence) — premium features to justify pricing
Month 7: Level 4 (Operations & Maintenance) — ops depth
Month 8: Level 8 (Integrations) — ecosystem connections
Month 9: Level 9 (Market Expansion) — geographic + EPC + benchmarking
```

**Each level is independently deployable.** No level depends on a later level being complete.

**Total new routes:** ~45 new pages
**Total new tables:** ~28 new tables
**Total new migrations:** 6 new migration files (024-029)
**APIs used:** HMRC (free), open.er-api.com (free), Canopy (free to integrate), Meta Cloud API (1,000 free/month), TrueLayer (low cost add-on), GoCardless (transaction-only fees), Xero/QBO OAuth (free), iCal (free)
**Zero DocuSign, Zero Rightmove API subscription, Zero IoT hardware required**

---

*This plan is designed to be executed level-by-level, with each level fully functional before the next begins. No feature in this plan requires a costly third-party API that cannot be offered as a landlord-paid add-on.*
