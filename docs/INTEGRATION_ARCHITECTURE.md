# Propvora Integration Architecture
## Navigation, User Journeys, Component Maps, Cross-Integration & Build Contracts

*This is the source of truth for all build agents. Every agent must follow patterns from this doc.*

---

## 1. NAVIGATION ARCHITECTURE

### Existing Side Nav (DO NOT ADD NEW TOP-LEVEL ITEMS)

```
OVERVIEW   → Home          /app
CORE       → Portfolio     /app/portfolio
           → Work          /app/work
           → Planning      /app/planning
           → Contacts      /app/contacts
OPERATIONS → Money         /app/money
           → Calendar      /app/calendar
           → Compliance    /app/compliance
SYSTEM     → Workspace     /app/workspace-settings
```

### New Features Live As Tabs Inside Existing Sections

All new capabilities slot into existing sections via new tab routes. Zero new side nav items.

---

### PORTFOLIO section — New Tabs

**Current tabs (from existing pages):**
Properties | Units | Tenancies | Map | Gallery | Timeline

**New tabs to add:**
```
/app/portfolio/vacancies         → Vacancy Management & Prospect CRM
/app/portfolio/leasing           → Leasing pipeline (Prospects, Viewings, Agreements)
/app/portfolio/r2r               → Rent-to-Rent contracts & dual ledger
```

**Property detail page — new conditional tabs:**
```
/app/portfolio/properties/[id]/hmo          → HMO dashboard (shown if property_type = 'hmo')
/app/portfolio/properties/[id]/hmo/rooms    → Room-level rent & occupancy
/app/portfolio/properties/[id]/hmo/utilities → Utility bill splitting
/app/portfolio/properties/[id]/sa           → SA calendar (shown if property_type = 'sa')
```

**Portfolio tab nav component to update:** `src/components/portfolio/PortfolioTabNav.tsx` (or wherever portfolio tabs live)

---

### MONEY section — New Tabs

**Current tabs (from existing pages):**
Invoices | Bills | Supplier Payments | Stripe | Affiliate | (Reports implied)

**New tabs to add:**
```
/app/money/accounts          → Chart of Accounts + Journal Ledger
/app/money/reconciliation    → Open Banking bank feed & reconciliation
/app/money/mtd               → MTD ITSA quarterly submissions
/app/money/client-accounts   → Client accounting & disbursements (Agency tier)
/app/money/utilities         → HMO utility bills (shown for HMO workspaces)
/app/money/rent-chase        → AI Rent Chase dashboard
```

**Money tab nav component:** `src/components/money/MoneyTabNav.tsx` (already exists — add new tabs)

---

### COMPLIANCE section — New Tabs

**Current tabs:** Overview | Certificates | Inspections | Documents | Evidence | Coverage | Supplier Docs | Reports | Activity

**New tabs to add:**
```
/app/compliance/possession       → Section 8 Possession Wizard & Cases
/app/compliance/hmo-licences     → HMO Licence tracking & renewal
/app/compliance/epc-advisory     → EPC upgrade advisory & grant navigator
/app/compliance/rra2026          → Renters' Rights Act 2026 toolkit
```

**Compliance tab nav component:** `src/components/compliance/ComplianceTabNav.tsx` (already exists — add 4 tabs)

---

### WORK section — New Tabs

**Current tabs:** Jobs | Tasks | Board | Gantt | Calendar | Suppliers

**New tabs to add:**
```
/app/work/ppm            → Planned Preventative Maintenance scheduler
/app/work/marketplace    → Contractor marketplace (vetted trades)
```

---

### PLANNING section — New Tabs

**Current tabs:** Forecasts | Scenarios | Landlord Offers | Conversions | Activity | Sets | Wizard

**New tabs to add:**
```
/app/planning/yield-intelligence      → AI yield & room pricing intelligence
/app/planning/portfolio-intelligence  → Portfolio benchmarking & analytics
```

---

### WORKSPACE SETTINGS — New Add-ons

```
/app/workspace-settings/addons → Already exists — extend with new addon catalogue
```

New sub-pages:
```
/app/workspace-settings/integrations/xero         → Xero OAuth setup & sync
/app/workspace-settings/integrations/open-banking → TrueLayer bank connection
/app/workspace-settings/integrations/whatsapp     → Meta Cloud API setup
/app/workspace-settings/integrations/gocardless   → GoCardless mandate settings
/app/workspace-settings/integrations/mtd          → HMRC MTD connection
```

---

### SIGN ROUTES (Public — Outside (app) layout)

```
/sign/[token]    → eSignature signing page (no auth required, token-gated)
```

---

## 2. DESIGN SYSTEM RULES (All Agents Must Follow)

### Shell & Layout
- Sidebar: dark floating nav, `radial-gradient` + `linear-gradient` on `#020617 → #06142E → #071B4D`
- Content: `background: #F6FAFF`
- Page header pattern: `bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between`
- Content padding: `px-6 pb-6` (matches ShellContent's `px-6 py-6`)
- Tab nav: `border-b border-slate-200 bg-white` with `-mx-6 -mt-6` in layouts
- Max content width: `DashboardContainer` = `w-full max-w-[1600px] mx-auto`

### Cards
```tsx
<div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
    <h2 className="text-sm font-semibold text-slate-900">Title</h2>
  </div>
  {/* content */}
</div>
```

### Buttons
- Primary: `bg-blue-600 text-white hover:bg-blue-700 text-xs font-medium px-3 py-1.5 rounded-lg`
- Secondary: `border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium px-3 py-1.5 rounded-lg`
- Icon-only: `border border-slate-200 text-slate-600 p-1.5 rounded-lg hover:bg-slate-50`
- Danger: `bg-red-600 text-white hover:bg-red-700 text-xs font-medium px-3 py-1.5 rounded-lg`

### Status Badges
```tsx
// Green: bg-emerald-50 text-emerald-700 border border-emerald-200
// Amber: bg-amber-50 text-amber-700 border border-amber-200
// Red:   bg-red-50 text-red-700 border border-red-200
// Blue:  bg-blue-50 text-blue-700 border border-blue-200
// Slate: bg-slate-100 text-slate-600
```

### KPI Cards pattern (from ComplianceKpiCard, MoneyKpiCard):
```tsx
<div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
  <div className="flex items-center justify-between mb-2">
    <span className="text-xs text-slate-500 font-medium">{label}</span>
    <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
      <Icon className={`w-4 h-4 ${iconColor}`} />
    </div>
  </div>
  <p className="text-2xl font-bold text-slate-900">{value}</p>
  <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
  <p className={`text-xs mt-1 font-medium ${trendPositive ? 'text-emerald-600' : 'text-red-500'}`}>{trend}</p>
</div>
```

### Tab strip pattern (from ComplianceTabNav):
```tsx
"use client"
// ALWAYS FIRST LINE — no comments above it
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

// border-b-2 active tab: border-[#2563EB] text-[#2563EB]
// inactive: border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300
// padding: px-5 py-3.5
// font: text-[13px] font-medium
```

### File rules (MANDATORY):
- `"use client"` must be the ABSOLUTE FIRST LINE — nothing before it, not even comments
- Every page: `export const dynamic = "force-dynamic"`
- No TypeScript `any` — use proper types or `unknown`
- Imports after `"use client"` only

---

## 3. USER JOURNEY MAPS

### Journey 1: HMO Landlord adds new property and manages rooms

```
1. Portfolio → Properties → New Property
   └─ Selects property_type = "HMO"
   └─ Sets number of rooms/units
   └─ System creates Unit records for each room

2. Portfolio → Properties → [id] → HMO tab (appears)
   └─ Room grid: all rooms with status chips
   └─ "Add room tenant" button per room → goes to Room Onboarding Wizard

3. Room Onboarding Wizard (step-by-step drawer/modal):
   Step 1: Select room (unit)
   Step 2: Add prospect details or pick from contacts
   Step 3: Set rent amount + payment day → creates room_rent_schedule
   Step 4: Generate room AST → agreement builder pre-fills
   Step 5: Send for eSignature
   Step 6: Record deposit → select protection scheme → logs room_deposit
   Step 7: Right to Rent check record
   Step 8: Keys issued log
   Step 9: Add to utility split → utility_room_splits updated
   Step 10: Send tenant portal invitation → email with magic link
   └─ Wizard marks each step complete/pending on the room card

4. Money → Utilities tab
   └─ Add utility bill for the HMO property
   └─ System shows all current room occupants
   └─ Selects split method → calculates per-room amounts
   └─ "Generate invoices" → creates invoice per tenant

5. Compliance → HMO Licences tab
   └─ Register HMO licence: licence number, expiry, conditions
   └─ Alerts set for 90/60/30 days before expiry

6. Portfolio → Properties → [id] → HMO → Analytics
   └─ Room yield analysis, void tracker, pricing recommendations
```

---

### Journey 2: Rent arrears → AI chase → possession case

```
1. Money → Income (existing)
   └─ Rent payment expected, not received
   └─ Status auto-moves to "overdue" after due date passes

2. Money → Rent Chase tab (new)
   └─ Shows all overdue tenancies with escalation level
   └─ AI Chase Agent fires Day 1: friendly email to tenant (auto if enabled)
   └─ Day 3: formal reminder (email + SMS if addon enabled)
   └─ Day 7: formal notice of arrears (email + SMS + WhatsApp if addon)
   └─ Day 14: legal escalation alert — "Start Possession Case" prompt

3. Agent clicks "Start Possession Case" (from rent chase or tenancy record)
   └─ Opens Possession Wizard

4. Compliance → Possession → New Case Wizard:
   Step 1: Select tenancy — auto-shows arrears amount, weeks
   Step 2: Select ground(s) — Ground 8 pre-highlighted if ≥2 months arrears
   Step 3: Evidence review — system shows auto-gathered evidence from rent chase
            └─ Every missed/late payment is already an evidence record
            └─ Every AI-sent communication is an evidence record
            └─ Agent adds any additional documents
   Step 4: Generate Section 8 Notice — Form 3, pre-populated
            └─ Agent reviews, can edit
            └─ "Generate PDF" → formatted legal document
   Step 5: Record service — how served, date, method
            └─ System calculates notice expiry date
            └─ Case status moves to "notice_served"

5. Compliance → Possession → [case id]
   └─ Timeline of case stages
   └─ Evidence bundle grows automatically as communications continue
   └─ "Generate Court Bundle" → full PDF with all evidence numbered
   └─ If rent guarantee insurance active → "Start Claim" button pre-fills evidence pack

6. If tenant pays during notice period:
   └─ Money → Income → payment received
   └─ System asks: "This payment relates to a possession case. Mark case as resolved?"
   └─ Agent marks resolved → case archived with outcome
```

---

### Journey 3: Letting agent creates tenancy agreement with eSignature

```
1. Portfolio → Leasing → Vacancies → [vacancy]
   └─ Prospect in "Referencing" status, reference passed
   └─ "Create Agreement" button

2. Agreement Builder opens (full-page):
   Step 1: Select template (AST England & Wales / PRT Scotland / Licence)
   Step 2: Link to tenancy record → auto-fills variables:
            {{property_address}}, {{monthly_rent}}, {{deposit_amount}},
            {{tenant_name}}, {{landlord_name}}, {{start_date}}
   Step 3: Review filled agreement (rich text view)
            └─ Can edit any section
            └─ Can add/remove clauses from library
   Step 4: Add signatories:
            └─ Tenant(s) — auto-added from prospect record
            └─ Landlord — auto-added from property owner contact
            └─ Guarantor (optional)
            └─ Set signing order
   Step 5: Set signing deadline (default: 7 days)
   Step 6: "Send for signature" → emails each signatory with unique link

3. /sign/[token] — signatory receives email
   └─ Opens agreement in clean signing page (no app chrome)
   └─ Reads agreement (scroll tracking)
   └─ Types full name (this IS the signature)
   └─ Checks "I have read and agree to this agreement"
   └─ Clicks "Sign Agreement"
   └─ System records: signed_at, ip_address, user_agent
   └─ Email sent to signatory confirming their signature

4. All signatories sign:
   └─ System renders final PDF:
            └─ Agreement content
            └─ Signature certificate page (all signatories, IPs, timestamps, content hash)
   └─ PDF stored in Supabase Storage
   └─ Email to all parties with completed PDF attached
   └─ Tenancy record updated: agreement_status = 'fully_signed'
   └─ Certificate delivery trigger fires (if tenant portal configured)

5. Post-signing auto-actions:
   └─ Deposit record created (awaiting protection registration)
   └─ Compliance alert: "Register deposit within 30 days"
   └─ If HMO property: utility split updated for new tenant
   └─ Tenant portal invitation sent
```

---

### Journey 4: Rent-to-Rent operator manages a property

```
1. Portfolio → R2R tab → New R2R Contract:
   └─ Select property (or create new)
   └─ Select owner contact (the landlord you rent from)
   └─ Set guaranteed rent monthly + payment day
   └─ Set management model (HMO/SA/Single Let)
   └─ Upload signed subletting agreement (optional but logged)
   └─ Status: active

2. Every month:
   └─ Supabase function creates r2r_ledger row:
            - guaranteed_rent_due = contract amount
            - tenant_income_expected = sum of all unit rents at this property
   └─ Agent pays owner → marks guaranteed_rent_paid
   └─ Tenant rents received → updates tenant_income_received
   └─ Margin auto-calculated: tenant_income_received - guaranteed_rent_paid

3. Portfolio → R2R → [contract id]:
   └─ Dual ledger view: WHAT I OWE OWNER vs WHAT TENANTS OWE ME
   └─ Monthly P&L per period
   └─ Cash flow projection (12 months forward)
   └─ Margin alerts: if any month gross margin < 0 → red warning

4. Owner portal (separate login):
   └─ Owner receives monthly magic link
   └─ Sees: guaranteed rent due, paid date, property condition
   └─ Cannot see: subletting income, tenants, margin

5. Cross-integration:
   └─ Property's compliance section still applies (R2R operator responsible for certificates)
   └─ Work jobs on the property deduct from margin calculation
   └─ If SA model: SA calendar shows bookings vs guaranteed rent (yield vs cost)
```

---

### Journey 5: MTD quarterly submission

```
1. Money → MTD tab → First Visit:
   └─ Setup wizard if not connected
   └─ Enter UTR number
   └─ Connect HMRC account (OAuth redirect)
   └─ HMRC grants access → tokens stored encrypted

2. Year-round:
   └─ Every expense/income created → AI suggests MTD category
   └─ Money → MTD → "Uncategorised items" queue
   └─ Agent reviews AI suggestions, confirms or changes
   └─ Tax Readiness Score updates after each categorisation

3. Quarter end:
   └─ Money → MTD → Quarterly Submissions
   └─ Q1 card shows: "Review due by 7 August"
   └─ "Review Q1" → shows summary: total income, total allowable expenses, profit
   └─ Breakdown by HMRC category
   └─ "Submit to HMRC" → API call
   └─ Confirmation receipt number stored

4. Annual declaration:
   └─ Money → MTD → Annual Declaration
   └─ Reviews all 4 quarters
   └─ Adjusts for: prior year losses, personal allowance, finance cost restriction
   └─ Submits final declaration

Cross-integration:
   └─ Journal entries (double-entry) auto-populate MTD categories
   └─ HMO utility bills appear as allowable expenses
   └─ R2R guaranteed rent paid = allowable expense
```

---

### Journey 6: Open Banking reconciliation

```
1. Workspace Settings → Integrations → Open Banking
   └─ "Connect Bank Account" → TrueLayer OAuth
   └─ Landlord authenticates with their bank
   └─ Transactions imported (last 90 days)

2. Money → Reconciliation tab:
   └─ Bank feed shows all transactions
   └─ Auto-matched items: green tick, shows matched income/expense record
   └─ Unmatched: flagged in queue
   └─ Agent reviews unmatched: "Match to income" or "Create new expense" or "Exclude"
   └─ One-click bulk reconcile for a month: "Confirm all auto-matched for May"

Cross-integration:
   └─ Matched income → marks money_income.status = 'reconciled'
   └─ Matched payment → feeds possession_evidence if tenancy has active chase
   └─ Reconciled data feeds MTD income figures
```

---

### Journey 7: Contractor Marketplace

```
1. Supplier registers (Supplier Portal):
   └─ Fills in trades, coverage postcodes, insurance expiry, certifications
   └─ Uploads compliance documents
   └─ Propvora team verifies (or auto-verify if document AI extracts valid cert)

2. Work → Jobs → [job id] → "Find Contractor" button:
   └─ Opens marketplace search filtered by: job category + property postcode
   └─ Shows matching verified contractors with ratings
   └─ "Invite to quote" → sends job to contractor via Supplier Portal feed

3. Work → Marketplace tab:
   └─ Browse all verified contractors
   └─ Filter by trade, location, rating
   └─ View contractor profile: jobs done, ratings, compliance badges

4. Revenue model:
   └─ Contractor listings: free within workspace (suppliers already in Propvora)
   └─ Public marketplace (future): contractor pays £39/month subscription
```

---

### Journey 8: AI Certificate Extraction

```
1. Compliance → Certificates → New Certificate:
   └─ Agent uploads PDF or photo of certificate
   └─ "Extract with AI" button (or auto-fires on upload)

2. AI extraction (Edge Function → Claude claude-haiku-4-5-20251001):
   └─ Prompt: extract certificate type, property address, issue date, expiry date,
              issuing engineer name, registration number, pass/fail
   └─ Returns JSON with confidence score
   └─ Form pre-filled with extracted data + confidence indicators

3. Agent reviews (10 seconds vs 2 minutes manual):
   └─ Green check on high-confidence fields
   └─ Yellow warning on low-confidence fields (manual review needed)
   └─ Clicks "Confirm" → certificate record created

Cross-integration:
   └─ Certificate created → delivery trigger fires → tenant portal notified
   └─ Expiry date auto-schedules compliance reminder
   └─ If HMO licence uploaded → hmo_licences table populated
```

---

## 4. COMPONENT INVENTORY

### New Components Required Per Feature

#### HMO Module
```
src/components/hmo/HMORoomGrid.tsx          — room status grid for property detail
src/components/hmo/RoomCard.tsx             — individual room card: tenant, rent, status
src/components/hmo/HMOOnboardingWizard.tsx  — 10-step room onboarding drawer
src/components/hmo/HMODashboardKpis.tsx    — HMO-specific KPI row
src/components/hmo/RoomRentSchedule.tsx    — per-room rent schedule table
src/components/hmo/HMOLicenceCard.tsx      — licence status with countdown
src/components/hmo/UtilityBillForm.tsx     — utility bill entry form
src/components/hmo/UtilitySplitTable.tsx   — per-room split calculation table
src/components/hmo/UtilityDashboard.tsx    — utility cost trends charts
src/components/hmo/VoidTracker.tsx         — void periods visualisation per room
src/components/hmo/RoomAnalytics.tsx       — room-level yield analysis
src/components/hmo/HMOTabStrip.tsx         — HMO sub-section tab navigation
```

#### Leasing & eSignature
```
src/components/leasing/VacancyKanban.tsx      — vacancy status board
src/components/leasing/VacancyCard.tsx        — vacancy card with portal status badges
src/components/leasing/VacancyForm.tsx        — create/edit vacancy form
src/components/leasing/ProspectTable.tsx      — prospects CRM table
src/components/leasing/ProspectKanban.tsx     — prospect pipeline kanban
src/components/leasing/ProspectCard.tsx       — prospect contact card
src/components/leasing/ViewingScheduler.tsx   — date/time picker for viewings
src/components/leasing/ViewingCard.tsx        — viewing record card
src/components/leasing/AgreementBuilder.tsx   — rich text agreement editor
src/components/leasing/AgreementPreview.tsx   — rendered agreement preview
src/components/leasing/SignatoriesPanel.tsx   — add/manage signatories
src/components/leasing/SigningStatusBadge.tsx — signatory status chip
src/components/leasing/LeasingTabStrip.tsx    — leasing sub-section tabs
src/components/leasing/InventoryReport.tsx    — room-by-room inventory form
```

#### Possession & Compliance
```
src/components/possession/PossessionCaseCard.tsx    — case summary card
src/components/possession/PossessionWizard.tsx      — 5-step possession wizard
src/components/possession/EvidenceTimeline.tsx      — timestamped evidence list
src/components/possession/EvidenceItem.tsx          — single evidence record row
src/components/possession/Section8NoticePreview.tsx — Form 3 PDF preview
src/components/possession/CourtBundleGenerator.tsx  — bundle generation panel
src/components/possession/PossessionKpis.tsx        — cases summary KPIs
src/components/compliance/HMOLicenceCard.tsx        — licence card with status
src/components/compliance/EPCAdvisoryCard.tsx       — EPC improvement recommendations
src/components/compliance/RRAToolkit.tsx            — RRA 2026 compliance checks
```

#### Money & Financial
```
src/components/money/AccountsTree.tsx         — chart of accounts tree
src/components/money/JournalLedger.tsx        — journal entries table
src/components/money/BankFeedTable.tsx        — bank transactions feed
src/components/money/ReconciliationQueue.tsx  — unmatched transactions panel
src/components/money/MTDDashboard.tsx         — MTD submissions status
src/components/money/MTDSetupWizard.tsx       — HMRC connection wizard
src/components/money/MTDQuarterCard.tsx       — quarter submission card
src/components/money/RentChaseTable.tsx       — overdue tenancies with AI status
src/components/money/RentChaseTimeline.tsx    — communication history per tenancy
src/components/money/ClientAccountCard.tsx   — landlord client account summary
src/components/money/DisbursementForm.tsx    — disbursement creation form
src/components/money/DisbursementPreview.tsx — statement preview before approval
```

#### R2R
```
src/components/r2r/R2RContractCard.tsx     — contract summary card
src/components/r2r/R2RDualLedger.tsx       — owner payments vs tenant income table
src/components/r2r/R2RMarginChart.tsx      — monthly margin bar chart
src/components/r2r/R2RCashFlow.tsx         — 12-month forward projection
src/components/r2r/R2RContractForm.tsx     — create/edit R2R contract
```

#### AI Features
```
src/components/ai/CertificateExtractor.tsx     — AI extraction preview panel
src/components/ai/ExtractionConfidence.tsx     — confidence indicators per field
src/components/ai/YieldRecommendation.tsx      — AI pricing recommendation card
src/components/ai/PortfolioIntelligence.tsx    — portfolio benchmarking dashboard
src/components/ai/TenantRiskScore.tsx          — risk score badge + breakdown
src/components/ai/MTDCategoriser.tsx           — AI expense categorisation panel
```

#### Planning
```
src/components/planning/YieldDashboard.tsx          — portfolio yield overview
src/components/planning/RoomPricingCard.tsx         — per-room AI pricing card
src/components/planning/PortfolioHeatmap.tsx        — property performance grid
src/components/planning/VoidAnalysisChart.tsx       — void periods visualisation
src/components/planning/MaintenanceCostChart.tsx    — maintenance spend analysis
```

#### Work
```
src/components/work/PPMScheduleCard.tsx     — PPM schedule summary card
src/components/work/PPMCalendar.tsx         — upcoming PPM calendar view
src/components/work/ContractorProfile.tsx   — contractor marketplace card
src/components/work/DispatchPanel.tsx       — multi-contractor dispatch UI
src/components/work/JobCostPanel.tsx        — job cost vs estimate panel
```

#### Integrations
```
src/components/integrations/OpenBankingSetup.tsx  — TrueLayer connection flow
src/components/integrations/WhatsAppSetup.tsx     — Meta Cloud API setup
src/components/integrations/XeroSetup.tsx         — Xero OAuth flow
src/components/integrations/AddonCard.tsx         — individual addon card
src/components/integrations/AddonStore.tsx        — addon catalogue grid
```

---

## 5. SUPABASE MIGRATION FILES

All migrations go in `supabase/migrations/` following existing naming:

```
024_accounting_schema.sql      → journal_entries, journal_lines, chart_of_accounts, currency_exchange_rates
025_hmo_schema.sql             → hmo_licences, room_rent_schedules, utility_bills, utility_room_splits, room_deposits
026_leasing_schema.sql         → property_vacancies, prospects, viewings, tenancy_agreements, agreement_signatories
027_possession_schema.sql      → possession_cases, possession_evidence, r2r_ledger, rent_to_rent_contracts
028_financial_ops_schema.sql   → client_accounts, client_disbursements, disbursement_line_items, bank_transactions, ppm_schedules, job_dispatch_invites, supplier_compliance, service_charge_budgets
029_workspace_features_schema.sql → workspace_features, workspace_addons, workspace_currencies
```

### RLS Template (every new table must follow this):
```sql
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;

CREATE POLICY "{table_name}_workspace_isolation" ON {table_name}
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  ));
```

---

## 6. CROSS-INTEGRATION MAP

```
money_income (missed) ──────────────────► possession_evidence (auto-created)
                                                    │
                                                    ▼
                                         possession_cases (when opened)
                                                    │
                                                    ▼
                                         court bundle PDF (generated)
                                                    │
                                                    ▼
                                    rent_guarantee claim (if policy active)

compliance_certificates (uploaded)
        │
        ▼
AI extraction (Edge Fn) ──────────────► certificate record populated
        │
        ▼
tenant_portal notification ──────────► tenant sees new certificate

agreement_signatories (all signed)
        │
        ├──► tenancy record updated (agreement_status = fully_signed)
        ├──► room_deposits (created — awaiting protection)
        ├──► compliance alert (30-day deposit protection warning)
        ├──► utility_room_splits (updated for new tenant)
        └──► tenant portal invitation (sent)

r2r_ledger (monthly)
        │
        ├──► money_income (tenant rents feed here)
        ├──► money_expenses (guaranteed rent paid = expense)
        └──► journal_entry (double-entry: DR R2R Cost, CR Bank)

bank_transactions (reconciled)
        │
        ├──► money_income.status → 'reconciled'
        ├──► possession_evidence (payment received = evidence)
        └──► mtd_data (feeds quarterly income figures)

ppm_schedules (due date reached)
        │
        └──► work_jobs (auto-created, assigned to preferred supplier)
                │
                └──► job_dispatch_invites (multi-contractor dispatch)
                            │
                            └──► contractor accepts → work_jobs.assigned_supplier_id updated

utility_bills (created for HMO)
        │
        ├──► utility_room_splits (per-room amounts calculated)
        └──► money_invoices (per-tenant utility invoices created)

hmo_licences (expiring)
        │
        └──► compliance alerts (90/60/30 day reminders)
                │
                └──► workspace notifications + email digest
```

---

## 7. API ROUTES REQUIRED

```
/api/sign/[token]/route.ts           → verify signing token, return agreement content
/api/sign/[token]/submit/route.ts    → record signature (IP, timestamp, name)
/api/sign/[token]/complete/route.ts  → check all signatories, generate final PDF

/api/webhooks/canopy/route.ts        → receive referencing status updates
/api/webhooks/gocardless/route.ts    → receive payment confirmations
/api/webhooks/truelayer/route.ts     → receive bank transaction updates
/api/webhooks/meta-whatsapp/route.ts → receive inbound WhatsApp messages

/api/ai/extract-certificate/route.ts → POST {file_url} → returns extracted fields
/api/ai/categorise-expense/route.ts  → POST {description, amount} → returns MTD category
/api/ai/generate-notice/route.ts     → POST {case_id} → returns Section 8 notice HTML

/api/mtd/connect/route.ts            → initiate HMRC OAuth flow
/api/mtd/callback/route.ts           → handle HMRC OAuth callback
/api/mtd/submit-quarter/route.ts     → POST quarterly update to HMRC
```

---

## 8. EDGE FUNCTIONS (SUPABASE)

```
create_journal_entry        → triggered by money_income/expenses insert
sync_exchange_rates         → cron: daily, fetches open.er-api.com
ai_rent_chase_agent         → cron: daily 06:00, checks overdue payments, sends comms
ppm_job_creator             → cron: daily, creates jobs for due PPM schedules
compliance_scanner          → cron: weekly, runs 12 compliance checks, creates alerts
certificate_delivery        → trigger: compliance_certificates insert → notify tenant
possession_evidence_auto    → trigger: money_income.status → 'overdue' → create evidence
disbursement_auto_creator   → cron: daily, creates disbursement drafts on due dates
r2r_ledger_monthly          → cron: 1st of month, creates r2r_ledger rows
```

---

## 9. FEATURE GATING (workspace_features table)

```typescript
// Feature keys:
'hmo_module'              → HMO tabs on properties
'leasing'                 → Leasing section tabs
'r2r_module'              → R2R portfolio section
'client_accounting'       → Client accounts + disbursements (Agency tier)
'mtd'                     → MTD submissions (Professional+)
'possession_wizard'       → Section 8 possession tools
'double_entry'            → Chart of accounts + journal
'ai_rent_chase'           → Automated rent chase agent
'ai_yield_intelligence'   → Yield & pricing recommendations
'open_banking'            → Bank feed reconciliation (addon)
'whatsapp'                → WhatsApp communications (addon)
'gocardless'              → Direct debit collection (addon)
'xero_sync'               → Xero two-way sync (addon)
'contractor_marketplace'  → Public contractor marketplace
'epc_advisory'            → EPC upgrade advisory
'scotland_prt'            → Scotland PRT compliance tools
```

Usage in components:
```typescript
// src/hooks/useFeatureFlag.ts
export function useFeatureFlag(key: string): boolean {
  // queries workspace_features for current workspace
}
```

---

## 10. BUILD CONTRACTS FOR AGENTS

Each agent receives this document + specific instructions for their module.

**Universal agent rules:**
1. Read all files before editing
2. `"use client"` MUST be absolute first line — no comments above it
3. `export const dynamic = "force-dynamic"` on every page
4. No TypeScript `any` — use `unknown` or proper types
5. Follow design system from Section 2 exactly
6. Use `DashboardContainer` for page content width
7. Mock data in pages (no live Supabase queries needed initially — connect hooks later)
8. Every new component: proper TypeScript interface for all props
9. Icons from `lucide-react` only
10. No new npm packages unless absolutely necessary (use what's already in package.json)

**Page file structure:**
```tsx
"use client"
import React, { useState } from "react"
import { /* icons */ } from "lucide-react"
import { cn } from "@/lib/utils"
// other imports

export const dynamic = "force-dynamic"

// Types
interface Foo { ... }

// Mock data
const MOCK_DATA: Foo[] = [...]

// Sub-components
function SubComponent() { ... }

// Page
export default function PageName() {
  const [state, setState] = useState(...)
  return (
    <>
      {/* Page header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        ...
      </div>
      {/* Content */}
      <div className="px-6 pb-6 ...">
        ...
      </div>
    </>
  )
}
```
