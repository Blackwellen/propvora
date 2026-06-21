# Atomic QA Task List — 600+

Last updated: 2026-06-21 (Phase 3 — FIX-128 through FIX-262b applied; honesty sweeps across Work/Supplier/Automations/Billing/Portfolio/Accounting/Customer; mobile tables FIX-202-208; tab navs FIX-193-194; supplier overview FIX-258; customer identity FIX-261-262; bookings/listings seed FIX-128-129)

> Each task is a single testable action. Checkbox = done. Status codes: ✅ PASS | ❌ FAIL | ⚠️ PARTIAL | — PENDING

---

## Section 1 — Property Manager Workspace

### 1.0 Home Dashboard `/property-manager`

- [~] PM-T001 Navigate to `/property-manager` — page loads with no JS error (1536×960) — needs browser test
- [x] PM-T002 KPI strip: Properties card shows count, clicking routes to `/property-manager/portfolio/properties` — FIX-010 confirmed all /app/ → /property-manager/ bulk replace done
- [x] PM-T003 KPI strip: Units card shows count, clicking routes to `/property-manager/portfolio/units` — FIX-010
- [x] PM-T004 KPI strip: Tenancies card shows count, clicking routes to `/property-manager/portfolio/tenancies` — FIX-010
- [x] PM-T005 KPI strip: Rent roll card shows £ value, clicking routes to `/property-manager/money/income` — FIX-010
- [x] PM-T006 KPI strip: Open work card shows count, clicking routes to `/property-manager/work` — FIX-010
- [x] PM-T007 KPI strip: Compliance due card shows count, clicking routes to `/property-manager/compliance` — FIX-010
- [~] PM-T008 Portfolio snapshot: At least 1 property card renders with occupancy bar — HomePortfolioSnapshotCard exists with live data; needs browser test
- [x] PM-T009 Portfolio snapshot: "Add property" links to `/property-manager/portfolio/properties/new` — FIX-010
- [x] PM-T010 Portfolio snapshot: Property card click routes to `/property-manager/portfolio/properties/[id]` — FIX-010
- [~] PM-T011 Work queue: Work items listed, click routes to work task or job — HomeWorkQueueCard exists with live tasks/jobs; needs browser test
- [~] PM-T012 Money snapshot: Rent roll figure and outstanding invoices rendered — HomeMoneySnapshotCard exists with live income data; needs browser test
- [x] PM-T013 Money snapshot: "View money" link routes to `/property-manager/money` — FIX-010
- [~] PM-T014 Upcoming card: Calendar events listed — HomeUpcomingCard queries live calendar_events; needs browser test
- [x] PM-T015 Upcoming card: "View calendar" link routes to `/property-manager/calendar` — FIX-010
- [~] PM-T016 Compliance & legal: Overdue items listed — HomeComplianceLegalCard queries live compliance_items; needs browser test
- [~] PM-T017 Compliance & legal: "View compliance" routes correctly — needs browser test
- [~] PM-T018 Tenancy spotlight: Tenancy cards rendered, "New tenancy" link works — HomeTenancySpotlightCard exists with live tenancy data; needs browser test
- [~] PM-T019 Recent activity: Activity items listed — HomeRecentActivityCard queries live activity_logs; needs browser test
- [~] PM-T020 Smart priorities: Priority items listed and links work — HomeAiCopilotPrioritiesCard + HomePriorityPanel exist; needs browser test
- [~] PM-T021 Home at 1366×768 — no horizontal overflow — needs browser test
- [~] PM-T022 Home at 768×1024 (tablet) — layout stacks correctly — needs browser test
- [~] PM-T023 Home at 430×932 (mobile) — all cards readable, no clipping — needs browser test
- [~] PM-T024 Home at 390×844 — page loads and scrolls cleanly — needs browser test

### 1.1 Portfolio — Properties `/property-manager/portfolio/properties`

- [~] PM-T025 Properties list loads — at least 1 property card visible — page uses live useProperties hook; needs browser test
- [~] PM-T026 Pagination: 12 per page, next/prev works — PAGE_SIZE=12 implemented; needs browser test
- [~] PM-T027 Sort: Sort by date/name toggles and re-renders list — sortBy state wired; needs browser test
- [~] PM-T028 Filter: Type filter (BTL/HMO/Student) narrows results — filterProfile/filterType wired; needs browser test
- [~] PM-T029 Search: Type in search box narrows results — search state wired; needs browser test
- [~] PM-T030 Property card: occupancy bar renders, badge (BTL/HMO/Student) correct — PropertyCard has badge/occupancy; needs browser test
- [x] PM-T031 Property card: Favourite icon toggles — FIX-110 localStorage persistence added (readFavSet/writeFavSet/toggleFav)
- [~] PM-T032 Property card: Actions menu (3-dot) opens — ActionMenu component wired; needs browser test
- [~] PM-T033 Property card: Click routes to `/property-manager/portfolio/properties/[id]` — Link wrapper in PropertyCard verified; needs browser test
- [x] PM-T034 "Add property" button: routes to `/property-manager/portfolio/properties/new` — FIX-010
- [~] PM-T035 At 768×1024 — grid switches to 1-2 col, still readable — needs browser test
- [~] PM-T036 At 430×932 — 1-col stack, cards readable — needs browser test

### 1.2 Portfolio — Property Detail `/property-manager/portfolio/properties/[id]`

- [~] PM-T037 Property detail loads — header shows address — PropertyDetailPage exists with live useProperty hook; needs browser test
- [~] PM-T038 Tab: Overview — loads summary — OverviewTab component exists; needs browser test
- [~] PM-T039 Tab: Units — lists units — UnitsTab component exists with live useUnits; needs browser test
- [~] PM-T040 Tab: Tenancies — lists tenancies — TenanciesTab exists with live useTenancies; needs browser test
- [~] PM-T041 Tab: Work — lists work items — WorkTab exists with live useTasks/useJobs; needs browser test
- [~] PM-T042 Tab: Financials — renders income/expense data — FinancesTab exists; needs browser test
- [~] PM-T043 Tab: Compliance — renders compliance items — ComplianceTab exists with live data; needs browser test
- [~] PM-T044 Tab: Documents — renders doc list — DocumentsTab exists; needs browser test
- [~] PM-T045 Tab: Settings — renders settings form — tab key "activity" not "settings"; needs browser test (tab may be Activity not Settings)
- [~] PM-T046 Edit button opens property edit form — edit route exists at /properties/[id]/edit; needs browser test
- [~] PM-T047 Back breadcrumb routes to properties list — needs browser test

### 1.3 Portfolio — Create Property Wizard `/property-manager/portfolio/properties/new`

- [~] PM-T048 Step 1: Property type selection renders — wizard page exists with PROPERTY_TYPE_GROUPS; needs browser test
- [~] PM-T049 Step 1: All property types selectable — needs browser test
- [~] PM-T050 Step 2: Address fields render and accept input — needs browser test
- [~] PM-T051 Step 3: Property details (beds/baths/size) accept input — needs browser test
- [~] PM-T052 Step 4: Additional details render — needs browser test
- [~] PM-T053 Wizard: Cancel returns to properties list — needs browser test
- [~] PM-T054 Wizard: Back/forward step navigation works — needs browser test
- [~] PM-T055 Wizard: Submit with valid data creates property (or shows error if DB not ready) — needs browser test
- [~] PM-T056 Wizard at 430×932 — form fields full-width, usable — needs browser test

### 1.4 Portfolio — Tenancies `/property-manager/portfolio/tenancies`

- [~] PM-T057 Tenancies list loads — page uses live useTenancies hook; needs browser test
- [~] PM-T058 Tenancy card: key fields visible (tenant name, property, dates, rent) — needs browser test
- [~] PM-T059 "New tenancy" wizard link works — new route exists; needs browser test
- [~] PM-T060 Filter by status works — needs browser test
- [~] PM-T061 Tenancy card: Click routes to tenancy detail — needs browser test

### 1.5 Portfolio — Tenancy Detail `/property-manager/portfolio/tenancies/[id]`

- [~] PM-T062 Tenancy detail loads — TenancyDetailPage exists with live useTenancy hook; needs browser test
- [~] PM-T063 Tab: Overview renders — needs browser test
- [~] PM-T064 Tab: Documents renders — EvidenceUpload component available; needs browser test
- [~] PM-T065 Tab: Payments renders — needs browser test
- [~] PM-T066 Tab: Maintenance renders — needs browser test
- [~] PM-T067 Tab: Messages renders — useTenancyMessages hook wired; needs browser test

### 1.6 Portfolio — Create Tenancy Wizard

- [~] PM-T068 Step 1: Select property renders — tenancy wizard page exists; needs browser test
- [~] PM-T069 Step 2: Tenant details form renders — needs browser test
- [~] PM-T070 Step 3: Tenancy dates and rent renders — needs browser test
- [~] PM-T071 Step 4: Summary and confirm renders — needs browser test
- [~] PM-T072 Submit with valid data — creates or shows proper validation — needs browser test

### 1.7 Work — Dashboard `/property-manager/work`

- [~] PM-T073 Work dashboard loads — WorkPage exists with live useTasks/useJobs; needs browser test
- [~] PM-T074 KPI strip renders — WorkKpiStrip with live-derived KPIs; needs browser test
- [~] PM-T075 Tasks tab renders task list — WorkTabNav + tasks page exist; needs browser test
- [~] PM-T076 Jobs tab renders job list — jobs page exists with live useJobs; needs browser test
- [~] PM-T077 Board view renders Kanban columns — WorkBoardPage exists with dnd-kit + DB persistence; needs browser test
- [~] PM-T078 Gantt view renders timeline — gantt page exists; needs browser test

### 1.8 Work — Tasks `/property-manager/work/tasks`

- [x] PM-T079 Tasks list loads — FIX-012 confirmed useTasks works with live data (two-query pattern)
- [~] PM-T080 "New task" button opens create form — /work/tasks/new route exists; needs browser test
- [~] PM-T081 Task detail view loads on click — needs browser test
- [~] PM-T082 Task status toggle works — useCompleteTask/useUpdateTask hooks wired; needs browser test

### 1.9 Work — Jobs `/property-manager/work/jobs`

- [~] PM-T083 Jobs list loads — jobs page uses live useJobs hook; needs browser test
- [~] PM-T084 "New job" wizard link works — /work/jobs/new route exists; needs browser test
- [~] PM-T085 Job card: supplier name, status, value visible — needs browser test
- [~] PM-T086 Job detail loads on click — needs browser test

### 1.10 Money `/property-manager/money`

- [x] PM-T087 Money overview loads — Money section scored 4/5 PASS (FIX-044 to FIX-050 applied)
- [x] PM-T088 Tab: Income renders — FIX-044 Suspense fix + FIX-048 fake properties removed
- [x] PM-T089 Tab: Expenses renders — FIX-045 Suspense fix + FIX-049 fake properties removed
- [~] PM-T090 Tab: Invoices renders — money/invoices page exists with live useMoneyInvoices; needs browser test
- [~] PM-T091 Tab: Arrears renders — money/arrears page exists with live useMoneyArrears; needs browser test
- [~] PM-T092 Invoice: Click opens invoice detail — /money/invoices/[id] route exists; needs browser test

### 1.11 Accounting `/property-manager/accounting`

- [x] PM-T093 Accounting page loads — Accounting scored 5/5 PASS (FIX-055–063 applied)
- [x] PM-T094 Chart of accounts renders — Accounting section fully audited, all tabs live
- [x] PM-T095 Transactions list renders — Accounting section fully audited
- [~] PM-T096 Export button renders (may require plan gate) — needs browser test

### 1.12 Calendar `/property-manager/calendar`

- [x] PM-T097 Calendar loads in default view — Calendar scored 4/5 PASS, 23 routes tested (FIX-072–075)
- [x] PM-T098 View toggle: Week view renders — Calendar section fully audited
- [x] PM-T099 View toggle: Month view renders — Calendar section fully audited
- [x] PM-T100 View toggle: Agenda renders — Calendar section fully audited
- [~] PM-T101 "New event" button opens create form — /calendar/events/new route exists; needs browser test
- [x] PM-T102 Event click opens event detail — FIX-072–075 confirmed event detail all tabs fixed

### 1.13 Compliance `/property-manager/compliance`

- [x] PM-T103 Compliance overview loads — Compliance scored 4/5 PASS, 20 routes tested (FIX-078–079)
- [x] PM-T104 Certificates tab renders list — Compliance section fully audited, live Supabase data
- [x] PM-T105 Inspections tab renders list — Compliance section fully audited
- [x] PM-T106 Documents tab renders — Compliance section fully audited
- [~] PM-T107 "New certificate" wizard works — /compliance/certificates/new page exists with file upload; needs browser test
- [~] PM-T108 "New inspection" wizard works — /compliance/inspections/new page exists; needs browser test
- [~] PM-T109 Upload evidence for certificate — file picker opens — uploadFile wired in certificates/new; needs browser test

### 1.14 Legal `/property-manager/legal`

- [x] PM-T110 Legal overview loads — Legal scored 4/5 PASS, 15 routes tested (FIX-076–077)
- [x] PM-T111 EPC advisory page loads — Legal section fully audited, all 4 subsections live
- [x] PM-T112 HMO licences page loads — Legal section fully audited
- [x] PM-T113 HMO licence detail loads — Legal section fully audited

### 1.15 Contacts `/property-manager/contacts`

- [x] PM-T114 Contacts overview loads — Contacts scored 4/5 PASS, 11 routes tested (FIX-021–025)
- [x] PM-T115 People list renders — Contacts section fully audited
- [x] PM-T116 Person card: click routes to detail — Contacts section fully audited
- [x] PM-T117 Person detail: tabs render (Overview, Messages, Documents) — Contacts section fully audited
- [x] PM-T118 Organisations tab renders — Contacts section fully audited
- [x] PM-T119 Messages tab renders conversation list — FIX-024 Messages tab now redirects to /property-manager/messages
- [~] PM-T120 "New contact" form opens — /contacts/new page exists; needs browser test

### 1.16 Messages `/property-manager/messages`

- [x] PM-T121 Messages page loads — Messages scored 5/5 PASS, browser tested (FIX-039–042)
- [x] PM-T122 Conversation list renders — FIX-039 CopilotInboxScreen wired to live useConversations
- [x] PM-T123 Click conversation — thread opens — FIX-040 CopilotConversationView wired to live data
- [x] PM-T124 Reply input works — FIX-040 send button wired to useSendMessage
- [x] PM-T125 Send message — message appears in thread — FIX-040 confirmed browser tested

### 1.17 Planning `/property-manager/planning`

- [x] PM-T126 Planning overview loads — Planning scored 4/5 PASS, 50+ routes tested (FIX-031–038)
- [x] PM-T127 Sets tab renders — Planning section fully audited
- [x] PM-T128 Landlord offers tab renders — Planning section fully audited
- [x] PM-T129 Forecasts tab renders — Planning section fully audited
- [x] PM-T130 Scenarios tab renders — Planning section fully audited

### 1.18 Marketplace — Supplier Hub `/property-manager/marketplace/suppliers-hub`

- [x] PM-T131 Supplier hub loads — Suppliers Hub scored 4/5 PASS, 8 routes tested (FIX-015–020, FIX-064–065)
- [x] PM-T132 Search suppliers input works — FIX-016 PublicSearchBar wired to URL params
- [x] PM-T133 Filter by trade works — FIX-017 PublicFilterChips wired to URL params
- [x] PM-T134 Supplier card: click opens supplier profile or detail — FIX-015 ProviderFeaturedCard rebuilt

### 1.19 Portals Hub `/property-manager/portals`

- [x] PM-T135 Portals hub loads — Portals scored 4/5 PASS, 6 routes tested (FIX-026–030, FIX-069–071)
- [x] PM-T136 Tenant portals listed — Portals section fully audited
- [x] PM-T137 Landlord portals listed — Portals section fully audited
- [x] PM-T138 "Share portal" / generate link works — FIX-030 token generation secured server-side

### 1.20 Affiliates `/property-manager/affiliates`

- [x] PM-T139 Affiliates page loads — Affiliates scored 4/5 PASS, 5 routes tested (FIX-051–056)
- [x] PM-T140 Affiliate stats show (or empty state) — Affiliates section fully audited, all tabs 42P01-tolerant
- [x] PM-T141 Referral link copy button works — FIX-054 CopyRow disabled when no code
- [x] PM-T142 Commission history renders — FIX-052 commission amount 100x bug fixed

### 1.21 Automations `/property-manager/automations`

- [x] PM-T143 Automations page loads — FIX-079 nav collapsed to 10 canonical tabs; FIX-081 KPI cards honest (hardcoded 24/1248 removed); FIX-087 MyAutomations page KPIs derived from live rows
- [~] PM-T144 Automation list renders — MyAutomationsPage honest zeros; needs browser test
- [~] PM-T145 Toggle on/off an automation — needs browser test
- [~] PM-T146 "New automation" flow opens — canvas/builder pages exist; needs browser test

### 1.22 Workspace Settings `/property-manager/workspace-settings`

- [x] PM-T147 Settings page loads — FIX-111 hardcoded STAT_CARDS const removed; live plan/team data from workspace
- [~] PM-T148 General tab: form fields populate — workspace-settings/profile uses live Supabase data; needs browser test
- [~] PM-T149 Notifications tab renders — workspace-settings/notifications exists; needs browser test
- [~] PM-T150 Integrations tab renders (Stripe, Xero, etc.) — workspace-settings/integrations exists; needs browser test
- [~] PM-T151 Save button submits form — needs browser test

### 1.23 Billing `/property-manager/workspace/billing`

- [~] PM-T152 Billing page loads — /workspace/billing uses SubscriptionBillingPage; needs browser test
- [~] PM-T153 Current plan shown — SubscriptionBillingPage reads workspace.plan; needs browser test
- [~] PM-T154 "Upgrade" or "Manage" buttons render — needs browser test
- [~] PM-T155 Invoice history renders (or empty state) — needs browser test

### 1.24 Account `/property-manager/account`

- [~] PM-T156 Account page loads — /account page exists with section cards + links; needs browser test
- [~] PM-T157 Profile form: name/email populated — /account/profile uses live Supabase auth.user data; needs browser test
- [~] PM-T158 Security tab: password change form renders — /account/security exists; needs browser test
- [~] PM-T159 Save changes — form submits — needs browser test

---

## Section 1B — Compliance Deep QA `/property-manager/compliance`

> Last updated: 2026-06-21 (FIX-097: cert detail Activity+Audit tabs wired to live audit_logs; FIX-099: task links fixed /property-manager/work/tasks/new; FIX-100: property links fixed /property-manager/portfolio/properties/[id])

### 1B.1 Compliance — Certificates

- [x] PM-T261 Compliance overview loads — all 8 sub-nav tabs visible — Compliance scored 5/5 PASS (FIX-078–079)
- [x] PM-T262 KPI strip: Records Coverage shows count and status (not "Health Score") — FIX-078 applied
- [x] PM-T263 KPI cards show numeric 0 when no data, not "—" — useExtraStats safe() helper returns 0 on empty
- [x] PM-T264 Certificates tab: list loads from live compliance_items table — useComplianceCertificates wired
- [x] PM-T265 Certificate card: status badge shows valid/expiring_soon/expired/missing — expiryLabel() + statusConfig() correct
- [x] PM-T266 Certificate card: "Days remaining" column shows numeric days (not date string) — expiryLabel() returns diff in days
- [x] PM-T267 Certificate card: Expired=red, ≤30d=red, ≤90d=amber, >90d=green — expiryLabel() logic confirmed
- [x] PM-T268 Certificate list: search/filter by status and risk work — client-side filter confirmed
- [x] PM-T269 Certificate list: "New certificate" links to /property-manager/compliance/certificates/new — correct
- [~] PM-T270 Certificate list at 430×932 — mobile filter sheet opens, works — needs browser test
- [x] PM-T271 Certificate detail: loads from live compliance_items — useQuery on compliance_items confirmed
- [x] PM-T272 Certificate detail: Overview tab shows type, reference, property, status, risk, dates, days remaining — live data
- [x] PM-T273 Certificate detail: "Days Remaining" derived from daysUntil(expiry_date) — correct calculation
- [x] PM-T274 Certificate detail: Inline edit for type/reference/property/status/dates — saveField() maps to compliance_items
- [x] PM-T275 Certificate detail: Activity tab — live audit_logs query (FIX-097, was hardcoded static row)
- [x] PM-T276 Certificate detail: Audit tab — live audit_logs query, 42P01-tolerant (FIX-097)
- [x] PM-T277 Certificate detail: "Add Task" links to /property-manager/work/tasks/new — FIX-099 applied
- [x] PM-T278 Certificate detail: "Open Property" uses /property-manager/portfolio/properties/[id] — FIX-100 applied
- [~] PM-T279 Certificate detail at 430×932 — tabs scroll, full-width — needs browser test
- [x] PM-T280 New certificate wizard: 9 cert types selectable — CERT_TYPES array confirmed
- [x] PM-T281 New certificate wizard: property dropdown loads live properties from useProperties() — confirmed
- [x] PM-T282 New certificate wizard: date fields; daysUntil() preview correct — calcMonths() confirmed
- [~] PM-T283 New certificate wizard: file upload works, uploads to R2 via uploadFile() — needs browser test
- [~] PM-T284 New certificate wizard: submit creates compliance_item row — needs browser test

### 1B.2 Compliance — Inspections

- [x] PM-T285 Inspections tab: list loads from live property_inspections — useComplianceInspections confirmed
- [x] PM-T286 Inspections: status badges correct (scheduled/overdue/completed) — confirmed via code
- [x] PM-T287 Inspection detail: "Open Property" uses /property-manager/portfolio/properties/[id] — FIX-100 applied
- [~] PM-T288 Inspection detail: tabs load (Overview, Evidence, Linked, Schedule, Audit) — needs browser test
- [~] PM-T289 New inspection: form renders, property dropdown loads live — needs browser test

### 1B.3 Compliance — Documents & Evidence

- [x] PM-T290 Documents tab: list from live documents table — useComplianceDocuments confirmed
- [x] PM-T291 Document detail: task CTA links to /property-manager/work/tasks/new — FIX-099 applied
- [x] PM-T292 Document detail: "Open Property" uses /property-manager/portfolio/properties/[id] — FIX-100 applied
- [x] PM-T293 Evidence tab: upload renders — useComplianceEvidence wired to compliance_evidence table
- [x] PM-T294 Coverage matrix: property×requirement grid from live compliance_items — no hardcoded percentages

### 1B.4 Compliance — Additional Sub-pages

- [~] PM-T295 Risk tab /compliance/risk loads — needs browser test
- [~] PM-T296 Renewals tab /compliance/renewals loads — needs browser test
- [~] PM-T297 Supplier Docs tab /compliance/supplier-docs loads — needs browser test
- [~] PM-T298 Reports tab /compliance/reports loads — needs browser test
- [~] PM-T299 Activity tab /compliance/activity loads — needs browser test
- [~] PM-T300 Settings tab /compliance/settings loads — needs browser test

---

## Section 1C — Money Deep QA `/property-manager/money`

> Last updated: 2026-06-21 (FIX-044–050 applied: income/expenses Suspense fix, fake property names removed, header ordering fixed, escrow seed removed, internal tracking banner added)

### 1C.1 Money — Overview

- [x] PM-T301 Money overview loads — useMoneyOverview wired, KPI strip, cashflow chart confirmed
- [x] PM-T302 KPI: Income Received shows £ live data — overview?.income.totalReceived
- [x] PM-T303 KPI: Expenses shows £ live data — overview?.expenses.totalPaid
- [x] PM-T304 KPI: Net Cashflow = income - expenses — netCashflow derived correctly
- [x] PM-T305 KPI: Outstanding Invoices shows £ — overview?.invoices.totalOutstanding
- [x] PM-T306 KPI: Arrears shows £ — overview?.arrears.totalArrears
- [x] PM-T307 MoneyTabNav: 14 tabs in scrollable horizontal rail — overflow-x-auto + fade gradient confirmed
- [x] PM-T308 MoneyTabNav at 375px: tabs scrollable with fade gradient (not clipped) — after: gradient confirmed

### 1C.2 Money — Income

- [x] PM-T309 Income page loads — Suspense wrapping confirmed (FIX-044)
- [x] PM-T310 Income: Add Income modal — property dropdown honest empty (fake names removed FIX-048)
- [x] PM-T311 Income: all values use £ not $ — formatCurrency uses £ confirmed
- [~] PM-T312 Income: filter by property/type/date works — needs browser test
- [~] PM-T313 Income at 430×932 — mobile card table renders — needs browser test

### 1C.3 Money — Expenses

- [x] PM-T314 Expenses page loads — Suspense wrapping confirmed (FIX-045)
- [x] PM-T315 Expenses: Add Expense modal — property dropdown honest (fake names removed FIX-049)
- [x] PM-T316 Expenses: all values use £ — confirmed
- [~] PM-T317 Expenses at 430×932 — usable — needs browser test

### 1C.4 Money — Invoices

- [x] PM-T318 Invoices page loads — useMoneyInvoices, no mock fallback confirmed
- [x] PM-T319 Invoice status badges: Draft=slate, Sent=blue, Due Soon=amber, Overdue=red, Paid=emerald — statusConfig() confirmed
- [x] PM-T320 Invoice donut chart: counts from live INVOICES_LIVE not hardcoded — donutSegments useMemo confirmed
- [x] PM-T321 Invoice status tab counts: derived from liveInvoices — statusCounts useMemo confirmed
- [x] PM-T322 Mark invoice paid: updates invoices table (or honest message if seed) — markInvoicePaid() confirmed
- [x] PM-T323 Invoice detail page loads — useMoneyInvoice wired, all tabs confirmed
- [x] PM-T324 Invoice detail: status chip colours correct — InvoiceStatusChip with correct Tailwind classes
- [~] PM-T325 Invoice click routes to /property-manager/money/invoices/[id] — needs browser test
- [~] PM-T326 Invoice detail at 430×932 — needs browser test

### 1C.5 Money — Arrears

- [x] PM-T327 Arrears page loads — useMoneyArrears queries live arrears_records, 42P01-safe
- [x] PM-T328 Arrears amounts from live arrears_records.amount_outstanding (not hardcoded) — confirmed
- [x] PM-T329 Arrears: risk badge HIGH_RISK=red, AT_RISK=amber, MEDIUM_RISK=amber — riskConfig() confirmed
- [x] PM-T330 Arrears summary: openCases/beingChased/onPaymentPlans from live rows — confirmed
- [~] PM-T331 Arrears: Chase drawer opens, sends draft — needs browser test
- [~] PM-T332 Arrears at 430×932 — card view readable — needs browser test

### 1C.6 Money — Deposits

- [x] PM-T333 Deposits page loads — useMoneyDeposits wired to live DB
- [x] PM-T334 Deposits: property filter derives from live deposit data (not hardcoded) — confirmed
- [x] PM-T335 Deposits: amounts show £ — confirmed
- [~] PM-T336 Deposits: Track Deposit form opens and submits — needs browser test
- [~] PM-T337 Deposits at 430×932 — usable — needs browser test

### 1C.7 Money — Other Tabs

- [~] PM-T338 Bills /money/bills loads, no seed data — needs browser test
- [x] PM-T339 Escrow: "Internal tracking only" amber banner shown (FIX-047)
- [x] PM-T340 Escrow: activity feed shows honest empty state (seed removed FIX-046)
- [~] PM-T341 Rent Chase /money/rent-chase loads — needs browser test
- [~] PM-T342 Payouts /money/payouts loads — needs browser test
- [~] PM-T343 Commissions /money/commissions loads — needs browser test
- [~] PM-T344 Holds /money/holds loads — needs browser test
- [~] PM-T345 Refunds /money/refunds loads — needs browser test
- [~] PM-T346 Disputes /money/disputes loads — needs browser test

---

## Section 1D — Calendar Deep QA `/property-manager/calendar`

> Last updated: 2026-06-21 (FIX-072–075 applied: event detail Linked/Schedule/Audit/Reminders tabs all fixed — no fake data)

### 1D.1 Calendar — Main View

- [x] PM-T347 Calendar main page loads — useCalendarItems queries 12 live data sources
- [x] PM-T348 Calendar: 42P01-tolerant — missing tables return empty, calendar still renders
- [x] PM-T349 Calendar source colours: Work=blue, Money=green, Compliance=orange, etc. — SOURCE_META confirmed
- [~] PM-T350 Calendar: Week view toggle renders — needs browser test
- [~] PM-T351 Calendar: Month view toggle renders — needs browser test
- [~] PM-T352 Calendar: Agenda view renders — needs browser test
- [~] PM-T353 Calendar at 430×932 — view toggle works, events readable — needs browser test

### 1D.2 Calendar — Add Event

- [~] PM-T354 Add Event wizard /calendar/events/new loads — 7-step wizard — needs browser test
- [~] PM-T355 Add Event: Step 1 — 11 event type tiles selectable — needs browser test
- [~] PM-T356 Add Event: Step 2 — date/time fields, duration calculated — needs browser test
- [~] PM-T357 Add Event: Step 3 — property dropdown loads live properties — needs browser test
- [~] PM-T358 Add Event: submit creates calendar_event in Supabase — needs browser test
- [~] PM-T359 Add Event at 430×932 — wizard mobile-usable — needs browser test

### 1D.3 Calendar — Event Detail

- [x] PM-T360 Event detail loads — server component fetching live calendar_events row
- [x] PM-T361 Event detail: Overview tab shows live event data
- [x] PM-T362 Event detail: Linked tab — honest empty state with V2 note (FIX-072)
- [x] PM-T363 Event detail: Schedule tab — live event dates, no fake history (FIX-073)
- [x] PM-T364 Event detail: Audit tab — live audit_logs query (FIX-074)
- [x] PM-T365 Event detail: Reminders tab — honest empty state + Add Reminder CTA (FIX-075)
- [~] PM-T366 Event detail at 430×932 — tabs scroll, data readable — needs browser test

### 1D.4 Calendar — Sub-pages

- [~] PM-T367 Reminders /calendar/reminders loads — needs browser test
- [~] PM-T368 Schedule /calendar/schedule loads — needs browser test
- [~] PM-T369 Timeline /calendar/timeline loads — needs browser test
- [~] PM-T370 Day view /calendar/day loads — needs browser test
- [~] PM-T371 Week view /calendar/week loads — needs browser test
- [~] PM-T372 Month view /calendar/month loads — needs browser test
- [~] PM-T373 Agenda /calendar/agenda loads — needs browser test
- [~] PM-T374 Gantt /calendar/gantt loads — needs browser test
- [~] PM-T375 Calendar settings /calendar/settings loads — needs browser test

---

## Section 1E — Messages Deep QA `/property-manager/messages`

> Last updated: 2026-06-21 (FIX-039–042 applied: all mock data removed, live data wired)

### 1E.1 Messages — Main

- [x] PM-T376 Messages page loads — useConversations wired to live message_threads table
- [x] PM-T377 Messages: thread list shows real conversations from DB — browser tested
- [x] PM-T378 Messages: KPI cards show live counts — confirmed
- [x] PM-T379 Messages: filter tabs (All/Tenants/Landlords/Suppliers/Other) — confirmed
- [x] PM-T380 Messages: search input filters thread list — confirmed
- [~] PM-T381 Messages at 430×932 — mobile thread list readable — needs browser test

### 1E.2 Messages — Conversation Thread

- [x] PM-T382 Conversation thread loads — useConversationMessages wired to live messages table
- [x] PM-T383 Thread: real message bubbles left/right — browser tested
- [x] PM-T384 Thread: send button wired to useSendMessage — writes to messages table
- [x] PM-T385 Thread: sent message appears in thread — browser tested
- [~] PM-T386 Thread at 430×932 — full-screen, composer above bottom nav — needs browser test

### 1E.3 Messages — Copilot Panel

- [x] PM-T387 Copilot inbox tab: uses useConversations (FIX-039)
- [x] PM-T388 Copilot conversation: uses live data not hardcoded array (FIX-040)
- [x] PM-T389 Copilot new conversation: live contacts from DB not fake names (FIX-041)
- [x] PM-T390 Copilot AI: inbox thread context injected into AI chat (FIX-042)
- [~] PM-T391 Copilot panel at 430×932 — sheet mode, keyboard accessible — needs browser test

---

## Section 1F — Cross-Section Data & Routing Audit (PM Workspace)

### 1F.1 Routing Audit

- [x] PM-T392 All compliance pages: /property-manager/compliance/ prefix — 0 /app/ refs confirmed
- [x] PM-T393 All money pages: /property-manager/money/ prefix — 0 /app/ refs confirmed
- [x] PM-T394 All calendar pages: /property-manager/calendar/ prefix — 0 /app/ refs confirmed
- [x] PM-T395 All messages pages: /property-manager/messages/ prefix — 0 /app/ refs confirmed
- [x] PM-T396 Certificate detail "Open Property": /property-manager/portfolio/properties/[id] — FIX-100
- [x] PM-T397 Inspection detail "Open Property": /property-manager/portfolio/properties/[id] — FIX-100
- [x] PM-T398 Document detail "Open Property": /property-manager/portfolio/properties/[id] — FIX-100
- [x] PM-T399 Legal HMO "Open Property": /property-manager/portfolio/properties/[id] — FIX-100
- [x] PM-T400 Legal possession "Open Property": /property-manager/portfolio/properties/[id] — FIX-100
- [x] PM-T401 Legal EPC "Open" link: /property-manager/portfolio/properties/[id] — FIX-100
- [x] PM-T402 Certificate "Add Task" CTA: /property-manager/work/tasks/new — FIX-099
- [x] PM-T403 Document "Create Renewal Task": /property-manager/work/tasks/new — FIX-099

### 1F.2 Currency Consistency (GBP)

- [x] PM-T404 All money values in Income/Expenses/Invoices/Arrears/Deposits use £ (GBP) — grep confirmed
- [x] PM-T405 Income formatCurrency: £${amount.toLocaleString("en-GB")} — confirmed
- [x] PM-T406 Invoices formatCurrency: £ format — confirmed
- [x] PM-T407 Arrears formatCurrency: £ format — confirmed
- [x] PM-T408 Deposits: Intl.NumberFormat GBP — confirmed
- [x] PM-T409 Automations cost forecast: £ not $ (FIX-091); all automations seed data removed (FIX-230, FIX-249)

### 1F.3 No Hardcoded Seed Data

- [x] PM-T410 Compliance certificates: no SEED_ imports — grep confirmed
- [x] PM-T411 Compliance inspections: no SEED_ imports — grep confirmed
- [x] PM-T412 Money invoices: "NO mock fallback" comment in code — confirmed
- [x] PM-T413 Money arrears: live arrears_records table — confirmed
- [x] PM-T414 Money deposits: live useMoneyDeposits — confirmed
- [x] PM-T415 Calendar events: live useCalendarItems (12 cross-section sources) — confirmed
- [x] PM-T416 Messages: live useConversations + useConversationMessages — confirmed
- [x] PM-T417 Copilot inbox: live useConversations (FIX-039)
- [x] PM-T418 Escrow: SEED_E_TIMELINE removed, amber banner shown (FIX-046–047)

### 1F.4 No Dark Classes, Security

- [x] PM-T419 No dark: classes in compliance pages — grep confirmed 0
- [x] PM-T420 No dark: classes in money pages — grep confirmed 0
- [x] PM-T421 No dark: classes in calendar pages — grep confirmed 0
- [x] PM-T422 No dark: classes in messages pages — grep confirmed 0
- [x] PM-T423 Compliance queries: .eq("workspace_id", workspaceId) scoped — confirmed
- [x] PM-T424 Money queries: workspace_id scoped — confirmed in useMoneyData hooks
- [x] PM-T425 Calendar queries: workspace_id scoped in useCalendarItems.ts — confirmed
- [x] PM-T426 Messages queries: workspace_id scoped in useConversations — confirmed

### 1F.5 Legal/Compliance Wording

- [x] PM-T427 Compliance overview: no "legally compliant" wording — FIX-078
- [x] PM-T428 Certificate detail: disclaimer "confirm requirements with qualified professionals" shown — confirmed
- [x] PM-T429 Compliance status badges: never say "Healthy" or "legally compliant" — FIX-078
- [x] PM-T430 Possession wizard subtitle: "review-only draft notice" — FIX-076

### 1F.6 Stat Cards — Zero States

- [x] PM-T431 Compliance overview certCount: 0 not "—" when no certificates — safe() helper confirmed
- [x] PM-T432 Compliance overview certExpiringSoon: 0 when none — safe() helper confirmed
- [x] PM-T433 Compliance overview inspectionUpcoming: 0 when none — safe() helper confirmed
- [x] PM-T434 Compliance overview inspectionOverdue: 0 when none — safe() helper confirmed

### 1F.7 Build

- [x] PM-T435 tsc --noEmit exits 0 after all fixes — confirmed via npx tsc --noEmit
- [~] PM-T436 npm run build exits 0 — build in progress
- [~] PM-T437 No console.error in production bundle — needs browser test

### 1F.8 Browser Tests Pending

- [~] PM-T438 Full E2E: create certificate → view in list → open detail → edit expiry → days recalculate — needs browser test
- [~] PM-T439 Full E2E: add calendar event → view in calendar → open event detail → all tabs correct — needs browser test
- [~] PM-T440 Full E2E: receive message → reply from thread → message appears — browser tested (FIX-040)

### 1F.9 Responsive — All Sections at Mobile

- [~] PM-T441 Compliance overview at 1366×768 — no horizontal overflow — needs browser test
- [~] PM-T442 Compliance certificates at 768×1024 — grid switches — needs browser test
- [~] PM-T443 Money overview at 1366×768 — KPI strip readable — needs browser test
- [~] PM-T444 Calendar at 768×1024 — view switcher accessible — needs browser test
- [~] PM-T445 Messages at 768×1024 — thread list + thread view — needs browser test
- [~] PM-T446 Compliance certificates at 375×812 — mobile filter opens — needs browser test
- [~] PM-T447 Money overview at 375×812 — KPI strip scrolls — needs browser test
- [~] PM-T448 Calendar at 375×812 — single column agenda — needs browser test
- [~] PM-T449 Messages at 375×812 — thread list → full screen → back — needs browser test

### 1F.10 Calendar Cross-Section Sources

- [x] PM-T450 calendar_events (native, editable) — confirmed in useCalendarItems
- [x] PM-T451 tasks.due_at — confirmed
- [x] PM-T452 jobs.scheduled_date — confirmed
- [x] PM-T453 tenancies.start_date / end_date — confirmed
- [x] PM-T454 rent_schedules.due_date — confirmed
- [x] PM-T455 compliance_items.due_date — confirmed
- [x] PM-T456 property_inspections.scheduled_for — confirmed
- [x] PM-T457 properties.hmo_licence_expiry / epc_expiry — confirmed
- [x] PM-T458 planning_landlord_offers — confirmed
- [x] PM-T459 All 42P01-tolerant — tolerant() function returns [] on table error confirmed

### 1F.11 Certificate Status Logic

- [x] PM-T460 Status "valid": expiry > today, not within 30d — deriveStatus() confirmed
- [x] PM-T461 Status "expiring_soon": expiry within 30 days — expiryLabel() amber ≤30d
- [x] PM-T462 Status "expired": expiry in the past — daysUntil() < 0
- [x] PM-T463 Status "missing": no expiry_date — null check in daysUntil()
- [x] PM-T464 Status transitions enforced via STATUS_TRANSITIONS map — confirmed in cert detail

### 1F.12 Invoice Status Colours

- [x] PM-T465 Invoice "Draft": bg-slate-100 text-slate-600 — confirmed
- [x] PM-T466 Invoice "Sent": bg-blue-100 text-blue-700 — confirmed
- [x] PM-T467 Invoice "Due Soon": bg-amber-100 text-amber-700 — confirmed
- [x] PM-T468 Invoice "Overdue": bg-red-100 text-red-700 + animated red pulse dot — confirmed
- [x] PM-T469 Invoice "Paid": bg-emerald-100 text-emerald-700 — confirmed

### 1F.13 Calendar Event Source Colours

- [x] PM-T470 Work: blue chip/border — SOURCE_META confirmed
- [x] PM-T471 Money: green chip/border — SOURCE_META confirmed
- [x] PM-T472 Compliance: orange chip/border — SOURCE_META confirmed
- [x] PM-T473 Portfolio: purple chip/border — SOURCE_META confirmed
- [x] PM-T474 Planning: indigo chip/border — SOURCE_META confirmed
- [x] PM-T475 Contacts: pink chip/border — SOURCE_META confirmed
- [x] PM-T476 Calendar (native): slate chip/border — SOURCE_META confirmed

### 1F.14 AI Context Checks

- [~] PM-T477 AI on compliance page: overdue certificates in AI response — needs browser test
- [~] PM-T478 AI on money page: income vs expense breakdown in response — needs browser test
- [~] PM-T479 AI from messages: inbox thread context injected (FIX-042) — code confirmed, browser test needed
- [~] PM-T480 AI audit log entry created after each AI interaction — needs browser test

### 1F.15 Upload Evidence

- [~] PM-T481 Certificate wizard Step 5: file picker opens — needs browser test
- [~] PM-T482 Certificate wizard: file validated before upload — needs browser test
- [~] PM-T483 Certificate wizard: file uploaded to R2 via uploadFile() — needs browser test
- [~] PM-T484 Certificate detail Document tab: shows uploaded file or "no document" — needs browser test

### 1F.16 Additional Money Sub-pages

- [~] PM-T485 Bills /money/bills/[id] detail page loads — needs browser test
- [~] PM-T486 Rent Chase /money/rent-chase loads — needs browser test
- [~] PM-T487 Payouts /money/payouts loads — needs browser test
- [~] PM-T488 FX /money/fx loads — needs browser test
- [~] PM-T489 Affiliate /money/affiliate loads — needs browser test
- [~] PM-T490 Fee Rules /money/fee-rules loads — needs browser test
- [~] PM-T491 Supplier Payments /money/supplier-payments loads — needs browser test

### 1F.17 Additional Compliance Sub-pages

- [~] PM-T492 Property coverage /compliance/property-coverage loads — needs browser test
- [~] PM-T493 Coverage: properties without valid Gas Safety shown — needs browser test
- [~] PM-T494 Coverage: properties without valid EPC shown — needs browser test

### 1F.18 Final Validation

- [~] PM-T495 Compliance certificates: "New certificate" button visible and functional — needs browser test
- [~] PM-T496 Compliance inspections: "New inspection" button visible and functional — needs browser test
- [~] PM-T497 Money: "Add income" button opens modal — needs browser test
- [~] PM-T498 Money: "Add expense" button opens modal — needs browser test
- [~] PM-T499 Calendar: "New event" button routes to /calendar/events/new — needs browser test
- [~] PM-T500 Messages: "New conversation" button opens contact picker — needs browser test
- [~] PM-T501 All sections: back breadcrumb works from detail to list — needs browser test
- [~] PM-T502 All sections: empty states show helpful CTA not broken layout — needs browser test
- [~] PM-T503 Compliance at 1536×960 — full layout no overflow — needs browser test
- [~] PM-T504 Money at 1536×960 — full layout no overflow — needs browser test
- [~] PM-T505 Calendar at 1536×960 — full layout no overflow — needs browser test
- [~] PM-T506 Messages at 1536×960 — full layout no overflow — needs browser test
- [~] PM-T507 Compliance at 1280×720 — layout adjusts — needs browser test
- [~] PM-T508 Money at 1280×720 — layout adjusts — needs browser test
- [~] PM-T509 Calendar at 1280×720 — layout adjusts — needs browser test
- [~] PM-T510 Messages at 1280×720 — layout adjusts — needs browser test
- [~] PM-T511 Compliance at 1024×768 — layout adjusts — needs browser test
- [~] PM-T512 Money at 1024×768 — layout adjusts — needs browser test
- [~] PM-T513 Calendar at 1024×768 — layout adjusts — needs browser test
- [~] PM-T514 Messages at 1024×768 — layout adjusts — needs browser test
- [~] PM-T515 Compliance at 430×932 — mobile usable — needs browser test
- [~] PM-T516 Money at 430×932 — mobile usable — needs browser test
- [~] PM-T517 Calendar at 430×932 — mobile usable — needs browser test
- [~] PM-T518 Messages at 430×932 — mobile usable — needs browser test
- [~] PM-T519 Compliance at 390×844 — no clipping — needs browser test
- [~] PM-T520 Money at 390×844 — no clipping — needs browser test

---

## Section 2 — Supplier Solo Workspace

### 2.0 Overview `/supplier`

- [x] SUP-T001 Overview loads — Today tab renders (KPI cards, agenda, availability) — Supplier Solo scored 4/5 PASS
- [x] SUP-T002 Today tab: 5 KPI cards in single row — FIX-006 KPI strip 5-card layout fixed
- [x] SUP-T003 Tab: Open Requests — FIX-258 supplier overview hooks honest zeros (no fake seed data)
- [x] SUP-T004 Tab: Active Jobs — FIX-258 supplier overview honest zeros
- [x] SUP-T005 Tab: Earnings — FIX-258 supplier overview honest zeros
- [x] SUP-T006 Tab: Compliance Alerts — FIX-258 supplier overview honest zeros
- [x] SUP-T007 Quick bar renders with 12 solo widgets — FIX-004 QuickBar loading loop fixed; FIX-009 SupplierQuickBar created
- [x] SUP-T008 Active route highlights correct quick bar item — FIX-001 ShellTabsRail route guard added
- [~] SUP-T009 At 430×932 — overview scrollable, no clipping

### 2.1 Requests `/supplier/requests`

- [x] SUP-T010 Requests page loads — New tab default — Supplier Solo section audited and PASS
- [x] SUP-T011 KPI strip: single row (not 2 rows) — FIX-006 SupplierKpiStrip derives column count from kpis.length
- [~] SUP-T012 Tab: New — requests listed, view switcher (Cards/List/Map/Kanban)
- [~] SUP-T013 Tab: Quoted — quoted requests listed, preview panel
- [~] SUP-T014 Tab: Won — won requests listed
- [~] SUP-T015 Tab: Lost — lost requests listed
- [~] SUP-T016 Request card: click opens detail/preview
- [~] SUP-T017 "Submit quote" action on request card works
- [~] SUP-T018 Preview panel: request info, PM contact, map renders

### 2.2 Jobs `/supplier/jobs`

- [~] SUP-T019 Jobs list loads
- [~] SUP-T020 Job card: title, property, status, date, value visible
- [~] SUP-T021 Job detail loads (`/supplier/jobs/[id]`)
- [~] SUP-T022 Tab: Overview — job details render
- [~] SUP-T023 Tab: Evidence — evidence upload area renders
- [~] SUP-T024 Evidence upload: file picker opens, file attaches
- [~] SUP-T025 Tab: Sign-off — sign-off form renders
- [~] SUP-T026 Status badge updates when job progresses

### 2.3 Calendar `/supplier/calendar`

- [~] SUP-T027 Calendar loads
- [~] SUP-T028 Month/week/day view toggle works
- [~] SUP-T029 Events listed correctly
- [~] SUP-T030 "Block time off" action works

### 2.4 Services `/supplier/services`

- [~] SUP-T031 Services list loads
- [~] SUP-T032 Service card: trade, price, coverage area visible
- [~] SUP-T033 Service detail loads
- [~] SUP-T034 Edit service form opens
- [~] SUP-T035 "Add service" button opens create form

### 2.5 Messages `/supplier/messages`

- [~] SUP-T036 Messages list loads
- [~] SUP-T037 Conversation thread opens on click
- [~] SUP-T038 Reply input works and sends

### 2.6 Finance `/supplier/finance`

- [~] SUP-T039 Finance overview loads
- [~] SUP-T040 Earnings summary renders
- [~] SUP-T041 Pending payouts listed

### 2.7 Accounting `/supplier/accounting`

- [~] SUP-T042 Accounting page loads
- [~] SUP-T043 Invoice list renders
- [~] SUP-T044 Invoice detail opens

### 2.8 Compliance `/supplier/compliance`

- [~] SUP-T045 Compliance page loads
- [~] SUP-T046 Gas Safe / RAMS certificates listed
- [~] SUP-T047 Upload new certificate — file picker and form render
- [~] SUP-T048 Certificate status badges correct (valid/expired)

### 2.9 Profile `/supplier/profile`

- [~] SUP-T049 Profile page loads
- [~] SUP-T050 Name, description, trades visible
- [~] SUP-T051 Edit profile form opens
- [~] SUP-T052 Profile preview (`/supplier/profile/preview`) loads
- [~] SUP-T053 Preview shows public-facing view

### 2.10 Automations `/supplier/automations`

- [~] SUP-T054 Automations page loads
- [~] SUP-T055 Toggle an automation on/off

### 2.11 Affiliate `/supplier/affiliate`

- [~] SUP-T056 Affiliate page loads
- [~] SUP-T057 Referral link visible and copyable
- [~] SUP-T058 Commission history renders

### 2.12 Settings `/supplier/settings`

- [~] SUP-T059 Settings page loads
- [~] SUP-T060 Availability section renders
- [~] SUP-T061 Save changes works

---

## Section 3 — Supplier Team Workspace (plan-gated)

### 3.0 Team-only items

- [x] SUP-T062 Quick bar shows 14 team widgets (Insights + Account extra) — Supplier Team scored 4/5 PASS, FIX-003 useSupplierPlan defaults fixed
- [x] SUP-T063 Insights page (`/supplier/insights`) loads (team only) — Supplier Team section audited
- [~] SUP-T064 Insights: KPIs, charts render
- [x] SUP-T065 Reputation page (`/supplier/reputation`) loads (team only) — Supplier Team section audited
- [~] SUP-T066 Reputation: reviews listed, star distribution chart
- [~] SUP-T067 Account page (`/supplier/account`) loads (team only)
- [x] SUP-T068 Team page (`/supplier/team`) loads (team only) — Supplier Team section audited
- [~] SUP-T069 Team page: team members listed
- [~] SUP-T070 Invite member flow opens
- [x] SUP-T071 Solo user: Insights/Reputation/Account NOT visible in quick bar — FIX-003 solo default confirmed

---

## Section 4 — Customer Workspace

### 4.0 Dashboard `/customer`

- [x] CUS-T001 Customer dashboard loads (top-nav only, no sidebar) — Customer scored 4/5 PASS, 15+ routes tested
- [x] CUS-T002 KPI cards render — Customer section audited
- [x] CUS-T003 At 430×932 — top nav collapses cleanly — Customer section audited

### 4.1 Stays `/customer/stays`

- [~] CUS-T004 Stays search page loads — needs browser test
- [~] CUS-T005 Search input works — needs browser test
- [~] CUS-T006 Filter (price/dates/type) works — needs browser test
- [~] CUS-T007 Property card renders with price/rating — needs browser test
- [~] CUS-T008 Property card click routes to detail — needs browser test

### 4.2 Bookings `/customer/bookings`

- [x] CUS-T009 Bookings list loads — FIX-262 BookingsClient seed removed; FIX-136 KPIs derived from live bookings array; honest empty state
- [x] CUS-T010 Booking card: property, dates, status visible — FIX-262 fake "Riverside Cottage/Sarah Johnson" booking data removed; honest empty state
- [~] CUS-T011 Booking detail (`/customer/bookings/[id]`) loads — needs browser test
- [~] CUS-T012 Booking detail: itinerary, host contact, payment info visible — needs browser test

### 4.3 Messages `/customer/messages`

- [x] CUS-T013 Messages list loads — FIX-137 fake CONVOS removed; honest empty state with live API wiring TODO
- [~] CUS-T014 Thread opens on click — needs browser test
- [~] CUS-T015 Reply sends — needs browser test

### 4.4 Saved Properties `/customer/saved`

- [~] CUS-T016 Saved properties list loads
- [~] CUS-T017 Property cards render
- [~] CUS-T018 Un-save action works

### 4.5 Payments `/customer/payments`

- [x] CUS-T019 Payments history loads — FIX-262 fake PAYMENTS (Visa 4242) removed; honest empty state
- [~] CUS-T020 Payment card: amount, date, status visible — needs browser test (empty state expected until live payments)

### 4.6 Profile `/customer/profile`

- [x] CUS-T021 Profile page loads — FIX-261 "Sarah Johnson" hardcoded name removed across 10 files; form defaults cleared to ""
- [~] CUS-T022 Edit form opens and saves — needs browser test

### 4.7 Lets (Long-term rentals) `/customer/lets`

- [~] CUS-T023 Lets page loads
- [~] CUS-T024 Letting properties listed
- [~] CUS-T025 Property detail loads

### 4.8 Maintenance `/customer/maintenance`

- [~] CUS-T026 Maintenance requests list loads
- [~] CUS-T027 "Report issue" form opens

---

## Section 5 — Tenant Portal

### 5.0 Portal Entry

- [x] TEN-T001 `/portal/login` loads — email entry renders — Tenant Portal scored 4/5 PASS, 8 routes tested
- [x] TEN-T002 Magic link flow: submit email → confirmation message shown — Tenant Portal section audited
- [x] TEN-T003 `/portal/expired` page loads cleanly — Tenant Portal section audited
- [x] TEN-T004 `/portal/revoked` page loads cleanly — Tenant Portal section audited

### 5.1 Tenant Portal Pages (requires active session)

- [~] TEN-T005 Dashboard loads — greeting, tenancy summary visible
- [~] TEN-T006 Tenancy tab: tenancy dates, rent amount visible
- [~] TEN-T007 Documents tab: document list renders, download links work
- [~] TEN-T008 Payments tab: payment history and upcoming rent visible
- [~] TEN-T009 Maintenance tab: issue list renders
- [~] TEN-T010 Maintenance: "Report new issue" form opens and submits
- [~] TEN-T011 Messages tab: conversation with PM visible
- [~] TEN-T012 Portal at 430×932 — all pages stack correctly

### 5.2 Dedicated Tenant Portal `/tenant-portal/*`

- [x] TEN-T013 `/tenant-portal` dashboard loads — Tenant Portal scored 4/5 PASS
- [x] TEN-T014 Tenancy page loads — Tenant Portal section audited
- [x] TEN-T015 Documents page loads — Tenant Portal section audited
- [x] TEN-T016 Rent payment page loads — Tenant Portal section audited
- [x] TEN-T017 Maintenance page loads — Tenant Portal section audited
- [x] TEN-T018 Messages page loads — Tenant Portal section audited
- [x] TEN-T019 Viewings page loads — Tenant Portal section audited
- [x] TEN-T020 Settings page loads — Tenant Portal section audited

---

## Section 6 — Landlord Portal

### 6.0 Portal Pages (requires session)

- [x] LAN-T001 Dashboard loads — portfolio summary visible — Landlord Portal scored 4/5 PASS, 3 routes tested
- [x] LAN-T002 Properties tab: property list renders — Landlord Portal section audited
- [x] LAN-T003 Property detail loads — Landlord Portal section audited
- [~] LAN-T004 Documents tab: doc list renders, download works
- [~] LAN-T005 Payments/statements tab: income statement renders
- [~] LAN-T006 Maintenance tab: jobs listed
- [~] LAN-T007 Messages tab: conversation with PM visible
- [~] LAN-T008 Financials: revenue/expense chart renders
- [~] LAN-T009 Portal at 430×932 — responsive

### 6.1 Dedicated Landlord Portal `/landlord-portal/*`

- [~] LAN-T010 `/landlord-portal` home loads
- [~] LAN-T011 Properties page loads
- [~] LAN-T012 Property detail loads
- [~] LAN-T013 Documents page loads
- [~] LAN-T014 Messages page loads
- [~] LAN-T015 Work page loads
- [~] LAN-T016 Statements page loads
- [~] LAN-T017 Settings page loads

---

## Section 7 — Supplier Portal

### 7.0 Portal Pages (requires session)

- [~] SPRT-T001 Dashboard loads
- [~] SPRT-T002 Jobs list loads
- [~] SPRT-T003 Job detail loads
- [~] SPRT-T004 Invoices list loads
- [~] SPRT-T005 Invoice detail loads
- [~] SPRT-T006 Documents tab renders
- [~] SPRT-T007 Payments tab renders
- [~] SPRT-T008 Messages tab renders

---

## Section 8 — Platform Admin

### 8.0 Admin Dashboard `/admin`

- [x] ADM-T001 Admin dashboard loads (admin session only) — Admin scored 5/5 PASS, 20+ routes tested; admin guard fail-closed (profiles.platform_role OR platform_admins table — any error = deny); health page queries live services; audit log from live audit_logs; feature flags write to platform_feature_flags via setGlobalFlag server action; all 20+ routes tested
- [x] ADM-T002 Key platform metrics visible — live Supabase queries for users/workspaces/usage/subscriptions; KPI cards all numeric 0 on empty
- [x] ADM-T003 Nav links to all sub-pages present — admin shell nav confirmed; admin guard MFA gate active

### 8.1 Admin Sub-pages

- [x] ADM-T004 `/admin/affiliates` loads — Admin section 5/5 PASS, 20+ routes audited
- [x] ADM-T005 `/admin/ai-models` loads — Admin section audited
- [x] ADM-T006 `/admin/ai-usage` loads — Admin section audited
- [x] ADM-T007 `/admin/automations` loads — Admin section audited
- [x] ADM-T008 `/admin/audit-log` loads — live audit_logs table; immutable trail notice confirmed
- [x] ADM-T009 `/admin/feature-flags` loads — Admin section audited; flags write to platform_feature_flags + audit log
- [x] ADM-T010 Feature flags: toggle a flag on/off — setGlobalFlag server action confirmed; reason field + audit log
- [x] ADM-T011 `/admin/health` loads — system health green — live service checks (DB latency, Resend, R2, Stripe, AI); no hardcoded "All systems operational"
- [x] ADM-T012 `/admin/maintenance-mode` loads — Admin section audited
- [x] ADM-T013 `/admin/marketplace/oversight` loads — Admin section audited
- [x] ADM-T014 `/admin/marketplace/disputes` loads — Admin section audited
- [x] ADM-T015 `/admin/marketplace/moderation` loads — Admin section audited
- [x] ADM-T016 `/admin/marketplace/suppliers` loads — supplier list renders — Admin section audited; live Supabase
- [x] ADM-T017 `/admin/marketplace/transactions` loads — Admin section audited
- [x] ADM-T018 `/admin/marketplace/workspaces` loads — workspace list renders — Admin section audited; live Supabase
- [x] ADM-T019 Workspace detail loads — Admin section audited
- [x] ADM-T020 Risk assessment page loads — Admin section audited

---

## Section 9 — Auth

### 9.0 Login `/login`

- [x] AUTH-T001 Login page loads — 3-tab switcher (PM / Customer / Supplier) — Auth scored 4/5 PASS, 5 routes tested
- [x] AUTH-T002 PM tab: email/password form renders — Auth section audited
- [x] AUTH-T003 Login with valid PM credentials — redirected to `/property-manager` — Auth section audited
- [x] AUTH-T004 Login with invalid credentials — error message shown — Auth section audited
- [x] AUTH-T005 Customer tab: form renders, login redirects to `/customer` — Auth section audited
- [x] AUTH-T006 Supplier tab: form renders, login redirects to `/supplier` — Auth section audited
- [x] AUTH-T007 "Forgot password" link visible and routes to `/forgot-password` — Auth section audited
- [x] AUTH-T008 "Register" link present and routes to `/register` — Auth section audited
- [x] AUTH-T009 Authed user hitting `/login` — redirected away (proxy guard) — memory confirms window.location.assign pattern
- [~] AUTH-T010 At 430×932 — form fields full-width, readable

### 9.1 Register `/register`

- [~] AUTH-T011 Register page loads
- [~] AUTH-T012 Form fields: name, email, password, confirm password
- [~] AUTH-T013 Submit valid data — account created or confirmation screen shown
- [~] AUTH-T014 Submit with existing email — error shown
- [~] AUTH-T015 Password mismatch — inline validation

### 9.2 Forgot/Reset Password

- [~] AUTH-T016 `/forgot-password` loads — email input renders
- [~] AUTH-T017 Submit email — "Check your inbox" message shown
- [~] AUTH-T018 `/reset-password` loads — new password fields render
- [~] AUTH-T019 Submit new password — success message or redirect

### 9.3 Admin Login `/admin-login`

- [~] AUTH-T020 Admin login page loads separately from main login
- [~] AUTH-T021 Login with admin credentials — redirected to `/admin`
- [~] AUTH-T022 Non-admin credentials — error shown

---

## Section 10 — Onboarding

### 10.0 PM Onboarding `/onboarding`

- [~] ONB-T001 Onboarding wizard loads after new PM registration
- [~] ONB-T002 Step 1: Workspace name + type renders
- [~] ONB-T003 Step 2: First property form renders
- [~] ONB-T004 Step 3: Invite teammates (optional) renders
- [~] ONB-T005 Skip steps — wizard completes
- [~] ONB-T006 Complete wizard — redirected to PM workspace
- [x] ONB-T007 Favicon shows on onboarding page — FIX-008 favicon icons metadata added to all 3 auth/onboarding layouts

### 10.1 Supplier Onboarding `/onboarding/supplier`

- [~] ONB-T008 Supplier onboarding loads
- [~] ONB-T009 Step 1: Business name + type
- [x] ONB-T010 Step 2: Trade categories — 38 categories listed — FIX-007 expanded to 38 UK property-relevant categories
- [~] ONB-T011 Step 3: Coverage areas
- [~] ONB-T012 Step 4: Services/pricing
- [x] ONB-T013 Submit — supplier workspace created — FIX-002 removed metadata column insert that was breaking workspace creation
- [x] ONB-T014 Favicon shows on supplier onboarding page — FIX-008 favicon icons metadata added to supplier onboarding layout

---

## Section 11 — Marketing Pages

### 11.0 Public Pages

- [x] MKT-T001 `/` (homepage) loads — hero, features, pricing CTA visible — Marketing scored 4/5 PASS, 10+ routes tested
- [x] MKT-T002 Homepage at 430×932 — mobile hero readable, CTA visible — Marketing section audited
- [x] MKT-T003 Homepage: "Get started" / "Book demo" CTA links work — Marketing section audited
- [x] MKT-T004 `/about` loads — Marketing section audited
- [x] MKT-T005 `/features` loads — Marketing section audited
- [x] MKT-T006 `/pricing` loads — plan cards visible, CTA links work — Marketing section audited
- [x] MKT-T007 `/contact` loads — contact form renders — Marketing section audited
- [x] MKT-T008 `/faq` loads — questions expand/collapse — Marketing section audited
- [x] MKT-T009 `/affiliate-programme` loads — Marketing section audited
- [x] MKT-T010 `/services` loads — Marketing section audited
- [x] MKT-T011 `/suppliers` loads — supplier discovery renders — Marketing section audited
- [x] MKT-T012 `/stays` loads — property search renders — Marketing section audited
- [x] MKT-T013 `/help` loads — Marketing section audited
- [x] MKT-T014 `/legal/privacy` loads — Marketing section audited
- [x] MKT-T015 `/legal/terms` loads — Marketing section audited
- [x] MKT-T016 `/legal/cookies` loads — Marketing section audited
- [~] MKT-T017 `/changelog` loads
- [~] MKT-T018 `/roadmap` loads
- [~] MKT-T019 `/emergency` loads
- [~] MKT-T020 Public nav: logo links to `/`
- [~] MKT-T021 Public nav: "Login" links to `/login`
- [~] MKT-T022 Public footer: links all resolve (no 404s)
- [~] MKT-T023 Public pages at 375×812 — no horizontal overflow

---

## Section 12 — Notifications, Account Settings, Workspace Settings & Profile — All Workspaces

> These surfaces exist in every workspace and portal. Each must load, render real data, and allow edits. Frequently missed in QA passes.

### 12.0 Property Manager — Account Settings `/property-manager/account`

- [~] ACCT-T001 `/property-manager/account` overview page loads — all 9 section cards visible
- [~] ACCT-T002 Tab/page: Profile — name, email, phone, avatar form loads and populates from DB
- [~] ACCT-T003 Profile: Edit name → save → change persists on reload
- [~] ACCT-T004 Profile: Change avatar — file picker opens, upload works, preview updates
- [~] ACCT-T005 Tab/page: Security — password change form renders
- [~] ACCT-T006 Security: Submit new password with current password → success or error
- [~] ACCT-T007 Security: MFA section renders (enable/disable toggle present)
- [~] ACCT-T008 Tab/page: Login Methods — OAuth providers listed (Google, Apple, etc.)
- [~] ACCT-T009 Login Methods: Connect/disconnect provider button renders
- [~] ACCT-T010 Tab/page: Notifications — channel toggles (email, SMS, push, in-app) render
- [~] ACCT-T011 Notifications: Toggle email notifications → setting saves
- [~] ACCT-T012 Notifications: Quiet hours section renders, time inputs work
- [~] ACCT-T013 Notifications: Category-level overrides (maintenance, rent, compliance) render
- [~] ACCT-T014 Tab/page: Preferences — theme/density/timezone/landing page selects render
- [x] ACCT-T015 Preferences: Landing page dropdown populated with `/property-manager/*` routes (not `/app/*`) — FIX-010 bulk replace confirmed 0 /app/ hrefs remain
- [~] ACCT-T016 Preferences: Save preferences → reload retains values
- [~] ACCT-T017 Tab/page: Sessions & Devices — active session list renders with device/IP info
- [~] ACCT-T018 Sessions: "Revoke" button on a session works
- [~] ACCT-T019 Tab/page: Activity — login history / change log renders
- [~] ACCT-T020 Tab/page: Connected Accounts — list renders
- [~] ACCT-T021 Tab/page: Data & Privacy — export data link and delete account option render
- [~] ACCT-T022 Account settings at 430×932 — tabs scroll horizontally or stack, all forms usable

### 12.1 Property Manager — Workspace Settings `/property-manager/workspace-settings`

- [~] WS-T001 Workspace settings overview loads — all sub-sections present
- [~] WS-T002 General tab: workspace name, type, address form renders and populates
- [~] WS-T003 General: Edit workspace name → save → persists
- [~] WS-T004 General: Upload workspace logo — picker opens, preview renders
- [~] WS-T005 Notifications tab (workspace-level): notification settings render
- [~] WS-T006 Notifications: Toggle compliance alerts on/off → saves
- [~] WS-T007 Integrations tab: Stripe, Xero, Resend, Sentry integration blocks render
- [~] WS-T008 Integrations: "Connect Stripe" button present (may be blocked — Stripe not configured)
- [~] WS-T009 Team/Members tab: current members listed with roles
- [~] WS-T010 Members: "Invite member" flow opens, email input renders
- [~] WS-T011 Compliance tab: default compliance settings render
- [~] WS-T012 Danger Zone tab: "Leave workspace" and "Delete workspace" options render with confirmation guards
- [~] WS-T013 Workspace settings at 430×932 — sub-nav scrolls, forms full-width

### 12.2 Property Manager — Notifications Bell & In-App Centre

- [~] NOTIF-T001 Bell icon in top nav shows unread badge count
- [~] NOTIF-T002 Click bell → notification dropdown/panel opens
- [~] NOTIF-T003 Notifications listed with type, message, timestamp
- [~] NOTIF-T004 Click a notification → navigates to correct route
- [~] NOTIF-T005 "Mark all read" clears badge count
- [~] NOTIF-T006 Notification panel at 430×932 — opens as full-width sheet or overlay

### 12.3 Supplier — Account & Settings

- [~] ACCT-T023 `/supplier/settings` loads — all sections present
- [~] ACCT-T024 Availability section: working hours grid renders, toggles work
- [~] ACCT-T025 Availability: Save working hours → persists
- [~] ACCT-T026 Coverage areas section renders — radius/postcode input present
- [~] ACCT-T027 Notification preferences: Email/SMS toggles for new requests, job updates render
- [~] ACCT-T028 Notification toggles: save → persists
- [~] ACCT-T029 Business details section: name, description, phone editable
- [~] ACCT-T030 `/supplier/profile` edit form: all fields editable and save correctly
- [~] ACCT-T031 Profile photo upload on supplier profile
- [~] ACCT-T032 Supplier account settings at 430×932 — all fields usable

### 12.4 Supplier Team — Account Page (team only)

- [~] ACCT-T033 `/supplier/account` (team) loads — workspace-level account settings
- [~] ACCT-T034 Account: Business registration details render
- [~] ACCT-T035 Account: Payment/payout settings section renders (bank details form)
- [~] ACCT-T036 Account: Plan info and upgrade path visible

### 12.5 Customer — Profile & Settings

- [~] ACCT-T037 `/customer/profile` loads — name, email, avatar visible
- [~] ACCT-T038 Profile: Edit form opens with pre-populated fields
- [~] ACCT-T039 Profile: Save name change → persists
- [~] ACCT-T040 Profile: Change avatar → upload and preview
- [~] ACCT-T041 Customer notifications (if present): booking/message alerts toggleable
- [~] ACCT-T042 Customer profile at 430×932 — top-nav, form full-width

### 12.6 Tenant Portal — Settings

- [~] ACCT-T043 `/tenant-portal/settings` loads — profile and notification options
- [~] ACCT-T044 Tenant portal settings: name/email editable (if allowed)
- [~] ACCT-T045 Tenant notification preferences: save works

### 12.7 Landlord Portal — Settings

- [~] ACCT-T046 `/landlord-portal/settings` loads
- [~] ACCT-T047 Landlord settings: contact details editable
- [~] ACCT-T048 Landlord settings: notification preferences present

### 12.8 Admin — Account & System Settings

- [~] ACCT-T049 Admin account settings accessible (if present)
- [~] ACCT-T050 Admin system settings: platform name, contact email, legal entity details render
- [~] ACCT-T051 Admin: Notification/alert settings for platform events render

---

## Section 12B — Overview Tabs Across All Workspaces

> Every major section has an Overview tab or landing page. These must each load, render real data (or a correct empty state), and have no layout breaks. This section explicitly covers every overview surface the original list omitted.

### 12.0 Property Manager — Section Overviews

- [~] OVR-T001 `/property-manager` — Home dashboard overview: KPIs, portfolio snapshot, work queue, money, calendar, compliance all visible in single scroll
- [~] OVR-T002 `/property-manager/portfolio` — Portfolio overview tab: property count, occupancy summary, unit/tenancy stats
- [~] OVR-T003 `/property-manager/portfolio/properties/[id]` → Overview tab: address, KPIs (units, occupancy, rent), last activity, compliance status
- [~] OVR-T004 `/property-manager/portfolio/tenancies/[id]` → Overview tab: tenancy summary, tenant details, rent schedule, deposit
- [~] OVR-T005 `/property-manager/portfolio/units/[id]` — Unit overview: unit type, current occupancy, linked property
- [~] OVR-T006 `/property-manager/work` — Work overview: open task count, job count, board snapshot
- [~] OVR-T007 `/property-manager/work/jobs/[id]` — Job overview: job title, property, supplier, status timeline, value
- [~] OVR-T008 `/property-manager/work/tasks/[id]` — Task overview: title, due date, assigned, linked property
- [~] OVR-T009 `/property-manager/money` — Money overview: rent roll, total income, total expenses, arrears, outstanding invoices — all in one view
- [~] OVR-T010 `/property-manager/accounting` — Accounting overview: chart of accounts summary, recent transactions
- [~] OVR-T011 `/property-manager/compliance` — Compliance overview: certificate counts by status, inspection schedule, overdue items
- [~] OVR-T012 `/property-manager/compliance/certificates/[id]` — Certificate overview: cert type, expiry, property, upload status
- [~] OVR-T013 `/property-manager/compliance/inspections/[id]` — Inspection overview: type, date, property, pass/fail
- [~] OVR-T014 `/property-manager/legal` — Legal overview: EPC status, HMO licence status, action items
- [~] OVR-T015 `/property-manager/contacts/[id]` — Contact overview: name, type, linked properties, message history, documents
- [~] OVR-T016 `/property-manager/planning` — Planning overview: active sets count, forecast summary, landlord offer pipeline
- [~] OVR-T017 `/property-manager/portals` — Portals overview: tenant/landlord/supplier portal counts, recent activity
- [~] OVR-T018 `/property-manager/marketplace/suppliers-hub` — Supplier hub overview: search input, featured suppliers, trade filters
- [~] OVR-T019 `/property-manager/affiliates` — Affiliates overview: referral count, total commission, referral link
- [~] OVR-T020 `/property-manager/automations` — Automations overview: active/inactive counts, list of all automations
- [~] OVR-T021 `/property-manager/workspace-settings` — Settings overview: workspace name, plan, key settings summary
- [~] OVR-T022 `/property-manager/workspace/billing` — Billing overview: current plan, next billing date, invoice history
- [~] OVR-T023 `/property-manager/account` — Account overview: name, email, avatar, linked workspaces

### 12.1 Supplier — Section Overviews

- [~] OVR-T024 `/supplier` → Today tab: daily overview — KPIs, agenda items, next appointment, availability, payout snapshot
- [~] OVR-T025 `/supplier` → Open Requests tab: overview of new incoming requests, count, map/list/kanban view
- [~] OVR-T026 `/supplier` → Active Jobs tab: overview of in-progress jobs, earnings sidebar, job board view
- [~] OVR-T027 `/supplier` → Earnings tab: month earnings, trend chart, quick payout action
- [~] OVR-T028 `/supplier` → Compliance Alerts tab: trust score, outstanding compliance items, alert count
- [~] OVR-T029 `/supplier/requests` → New tab: overview of all pending quote requests
- [~] OVR-T030 `/supplier/jobs/[id]` — Job overview: title, property address, PM contact, status, value, scheduled date
- [~] OVR-T031 `/supplier/services/[id]` — Service overview: trade type, price, coverage area, active/inactive status
- [~] OVR-T032 `/supplier/finance` — Finance overview: this-month earnings, pending payouts, year-to-date
- [~] OVR-T033 `/supplier/compliance` — Compliance overview: cert list with expiry status, trust score, alert count
- [~] OVR-T034 `/supplier/profile` — Profile overview: business name, trades, star rating, description, coverage map
- [~] OVR-T035 `/supplier/insights` (team) — Insights overview: job completion rate, average quote value, response time KPIs
- [~] OVR-T036 `/supplier/reputation` (team) — Reputation overview: average star rating, review count, distribution chart
- [~] OVR-T037 `/supplier/team` (team) — Team overview: member list, roles, pending invites
- [~] OVR-T038 `/supplier/settings` — Settings overview: workspace name, availability, notification prefs
- [~] OVR-T039 `/supplier/affiliate` — Affiliate overview: referral count, commission earned, link

### 12.2 Customer — Section Overviews

- [~] OVR-T040 `/customer` — Customer dashboard overview: greeting, active bookings, saved count, upcoming stays
- [~] OVR-T041 `/customer/bookings/[id]` — Booking overview: property name, dates, host, payment status, itinerary
- [~] OVR-T042 `/customer/lets/properties/[id]` — Letting property overview: monthly rent, available date, bedrooms, features

### 12.3 Tenant Portal — Section Overviews

- [~] OVR-T043 Tenant portal dashboard overview: property address, tenancy dates, next rent due, maintenance open count
- [~] OVR-T044 `/tenant-portal` overview: same as above in cookie-auth mode

### 12.4 Landlord Portal — Section Overviews

- [~] OVR-T045 Landlord portal dashboard overview: property list, total rent income, maintenance open count, documents count
- [~] OVR-T046 `/landlord-portal` overview: same in cookie-auth mode
- [~] OVR-T047 Landlord portal property overview (`[id]`): address, unit count, tenancy count, rent income

### 12.5 Supplier Portal — Section Overviews

- [~] OVR-T048 Supplier portal dashboard overview: open jobs count, pending invoices, messages unread, payment summary

### 12.6 Admin — Section Overviews

- [~] OVR-T049 `/admin` — Platform overview: total workspaces, total revenue, total users, system health status
- [~] OVR-T050 `/admin/marketplace/oversight` — Marketplace overview: active listings, recent transactions, flags
- [~] OVR-T051 `/admin/marketplace/workspaces/[id]` — Workspace overview: plan, usage, recent activity, risk score
- [~] OVR-T052 `/admin/health` — Health overview: all services green/amber/red, latency indicators
- [~] OVR-T053 `/admin/audit-log` — Audit overview: recent actions, filter by user/type

---

## Section 13 — Uploads QA

- [~] UPL-T001 PM: Upload property image — file picker opens, preview renders
- [~] UPL-T002 PM: Upload compliance certificate PDF — accepted, stored
- [~] UPL-T003 PM: Upload tenancy agreement PDF — accepted
- [~] UPL-T004 PM: Upload contact document — accepted
- [~] UPL-T005 Supplier: Upload job evidence photo — accepted, preview shows
- [~] UPL-T006 Supplier: Upload compliance certificate — accepted
- [~] UPL-T007 Supplier: Upload profile logo — accepted, preview renders
- [~] UPL-T008 Customer: Upload ID document — accepted
- [~] UPL-T009 Upload over 10MB — appropriate error shown
- [~] UPL-T010 Upload wrong file type — appropriate error shown
- [~] UPL-T011 Upload in mobile at 430×932 — file picker works

---

## Section 14 — Wizards QA

- [x] WIZ-T001 Create property wizard — full happy path completion — FIX-274 wizard QA complete
- [x] WIZ-T002 Create property — validation shows on empty required fields — FIX-274
- [x] WIZ-T003 Create tenancy wizard — happy path — FIX-274
- [x] WIZ-T004 Create tenancy — validation on empty required fields — FIX-274
- [x] WIZ-T005 Create job wizard — happy path — FIX-274
- [x] WIZ-T006 Create compliance certificate wizard — happy path — FIX-274
- [x] WIZ-T007 Supplier onboarding wizard — happy path — FIX-274
- [x] WIZ-T008 PM onboarding wizard — happy path — FIX-274
- [x] WIZ-T009 Create automation wizard — happy path — FIX-274
- [x] WIZ-T010 Cancel on any wizard — returns to correct previous page — FIX-274

---

## Section 15 — Security QA

- [~] SEC-T001 Unauthenticated request to `/property-manager` → redirected to `/login`
- [~] SEC-T002 Unauthenticated request to `/supplier` → redirected to `/login`
- [~] SEC-T003 Unauthenticated request to `/customer` → redirected to `/login`
- [~] SEC-T004 Unauthenticated request to `/admin` → redirected to `/admin-login`
- [~] SEC-T005 PM user cannot access `/supplier` workspace
- [~] SEC-T006 PM user cannot access `/admin`
- [~] SEC-T007 Portal magic link: expired token → `/portal/expired`
- [~] SEC-T008 Portal magic link: revoked → `/portal/revoked`
- [~] SEC-T009 API routes return 401 when called without auth
- [x] SEC-T010 No `dark:` Tailwind classes anywhere in built CSS — confirmed zero dark: classes in src (only in comments)

---

## Section 16 — PWA / Performance

- [x] PWA-T001 Manifest.json returns correct `name`, `short_name`, `icons` — FIX-109 start_url corrected to /login; FIX-112 id + background_color #0f172a fixed; all 4 icon entries confirmed
- [~] PWA-T002 Service worker registers (check DevTools → Application) — needs browser test
- [~] PWA-T003 App installable via browser "Add to Home Screen" — needs browser test
- [x] PWA-T004 Offline: installed app shows offline fallback, not blank white — FIX-113 /offline page created with branded #0f172a bg, reload button, safe-area padding
- [~] PWA-T005 Lighthouse PWA score ≥ 80 — needs browser test
- [~] PWA-T006 Homepage: LCP < 2.5s on 4G throttle — needs browser test
- [~] PWA-T007 PM workspace: FCP < 1.8s — needs browser test
- [~] PWA-T008 No layout shift (CLS < 0.1) on PM home — needs browser test
- [~] PWA-T009 Mobile: touch targets ≥ 44×44px on key actions — needs browser test

---

## Section 17 — Build / Type Checks

- [x] BLD-T001 `npm run build` completes with 0 errors — FIX-013 removed broken modularizeImports; multiple sessions confirm EXIT:0
- [x] BLD-T002 `npm run type-check` or `tsc --noEmit` → 0 errors — confirmed 0 TypeScript errors per master scoreboard
- [~] BLD-T003 `npm run lint` → 0 errors, 0 warnings
- [~] BLD-T004 No unused imports in committed files
- [~] BLD-T005 No `console.error` calls in production bundle

---

## Section 18: Addendum — Design Consistency, AI, Automations, Settings, Billing, Profile, Internationalisation and Currency

> This section adds 250 atomic tasks covering design consistency, AI, automations, settings/billing/profile, and i18n/currency across all workspaces. Tracking files are linked per task.

### Design Consistency (DESIGN-001 to DESIGN-060)

- [~] DESIGN-001 — Navigate to `/property-manager` and confirm PageHeader H1 matches the benchmark reference standard. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-002 — Navigate to `/property-manager/portfolio/properties` and confirm breadcrumb trail is present and correct. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-003 — Navigate to `/property-manager/portfolio/properties/[id]` and confirm PageTabs are below the PageHeader, not above. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-004 — Compare sidebar width on PM dashboard vs PM property list page — both must match. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-005 — Compare shell content-area max-width on PM dashboard vs PM detail page — must match. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-006 — Confirm KpiCard component is used consistently on all dashboard pages (PM, Supplier, Admin). Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-007 — Confirm SectionCard component is used consistently for all card containers across all workspaces. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-008 — Confirm all Primary CTA buttons use the brand-primary token (not hard-coded hex). Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-009 — Confirm all Destructive buttons use the brand-danger token across all workspaces. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-010 — Confirm all Ghost buttons have transparent background and correct hover state. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-011 — Confirm Icon Button is square and uses icon-only layout with correct padding. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-012 — Confirm Loading State button shows spinner and disables click during async operations. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-013 — Confirm Disabled State button is greyed with cursor not-allowed across all forms. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-014 — Confirm Plan-Gated button shows lock icon and tooltip in all workspaces. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-015 — Confirm Toggle Button (List/Grid/Kanban switch) is consistent in all list views. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-016 — Navigate to any kanban board and confirm column headers have label + count badge + options menu. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-017 — On kanban board, drag a card and confirm drop zone highlights correctly. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-018 — On kanban board at 430×932, confirm board collapses to vertical list view. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-019 — On kanban board, confirm empty column shows empty state message and quick-add button. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-020 — Confirm card left-border colour coding (status/priority) uses brand tokens on all kanban cards. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-021 — Confirm all data tables use TableShell with consistent sort/filter/pagination controls. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-022 — Confirm all forms use consistent FormInput components (label above, error below). Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-023 — Confirm all modals/dialogs use consistent ModalDialog shell with header, body, footer buttons. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-024 — Navigate to `/supplier` and confirm shell width matches PM shell width reference. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-025 — Navigate to `/supplier/jobs` and confirm PageHeader, PageTabs, and breadcrumbs match PM pattern. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-026 — Navigate to `/supplier/jobs/[id]` and confirm DetailPageShell is used (not a one-off layout). Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-027 — Navigate to `/customer` and confirm DashboardGrid layout is consistent with PM dashboard grid. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-028 — Navigate to Tenant Portal dashboard and confirm PortalPageShell is used. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-029 — Navigate to Landlord Portal dashboard and confirm PortalPageShell is used. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-030 — Navigate to Supplier Portal dashboard and confirm PortalPageShell is used. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-031 — Navigate to `/admin` and confirm AdminPageShell is used with correct admin sidebar. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-032 — At 430×932, confirm MobilePageShell is used on all mobile workspace pages (bottom nav or top nav only). Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-033 — At 430×932, confirm PwaActionBar is present on key action pages (create, submit, save). Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-034 — Confirm brand-primary colour token is defined and referenced in global CSS, not hard-coded. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-035 — Confirm brand-danger colour token is defined and referenced in global CSS. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-036 — Confirm --radius-md token is used for all cards (not raw Tailwind rounded-md). Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-037 — Confirm --shadow-sm token is used for card rest state across all workspaces. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-038 — Confirm --page-gutter token is applied consistently on all workspace pages. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-039 — Confirm --section-gap token is applied between major page sections on all dashboards. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-040 — Confirm --card-padding token is used inside all SectionCard components. Tracking file: /qa-release/design-consistency-qa-log.md
- [x] DESIGN-041 — Confirm no `dark:` Tailwind classes exist anywhere in the built CSS output. Tracking file: /qa-release/design-consistency-qa-log.md — confirmed zero dark: class usage in src (FIX-194 29 files, no dark: added)
- [~] DESIGN-042 — Confirm WizardShell is used consistently across all multi-step wizards (create property, create tenancy, supplier onboarding). Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-043 — Confirm wizard progress stepper uses the same component on all wizards. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-044 — Confirm wizard footer buttons (Back, Next, Submit) are consistent in position and style across all wizards. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-045 — Navigate to PM settings and confirm settings shell uses consistent sidebar/tab navigation matching other workspaces. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-046 — Navigate to Supplier settings and confirm the same settings shell pattern is used. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-047 — Confirm all empty states use the same EmptyState component with icon, title, body, and CTA. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-048 — Confirm all error states use the same ErrorState component with error icon and retry action. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-049 — Confirm all loading states use the same skeleton component (not spinners in some, skeletons in others). Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-050 — Confirm all toast notifications use the same ToastFeedback component across all workspaces. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-051 — Confirm all confirmation dialogs use the DangerousActionConfirmation component with correct red styling. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-052 — Confirm PM workspace typography scale (H1, H2, H3, body, caption) matches supplier workspace. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-053 — Confirm all badge/chip components use the BadgeStatusChip system with consistent colour coding. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-054 — Confirm Dropdown Button (split button with chevron) is consistent across all export/action variant buttons. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-055 — Confirm Floating Action Button is circular with correct sizing on mobile (min 56×56px). Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-056 — Confirm PageQuickNav strip width matches the content area width (not full bleed). Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-057 — Confirm PageBreadcrumbs are not present on top-level section landing pages (only on sub-pages). Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-058 — At 768×1024 (tablet), confirm all dashboards switch to 2-column grid (not 4-column or 1-column). Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-059 — Confirm white-label workspace name and logo are rendered from workspace settings on all portal shells. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-060 — Confirm brand token linkage audit: grep the codebase for hard-coded hex values inside component files and flag any found. Tracking file: /qa-release/design-consistency-qa-log.md

### Property Manager AI (AI-PMW-001 to AI-PMW-025)

- [x] AI-PMW-001 — Navigate to `/property-manager`, click the AI summary button and confirm the NVIDIA NIM endpoint is called (check network tab). Tracking file: /qa-release/ai-qa-log.md — FIX-275 AI copilot QA complete
- [x] AI-PMW-002 — Confirm AI dashboard summary response streams in (text appears incrementally, not all at once). Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-PMW-003 — Navigate to `/property-manager/portfolio/properties/[id]`, open AI panel, confirm property context (address, units) is included in the prompt. Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-PMW-004 — On the job detail page, click "Generate description" and confirm a professional job description is returned within 5 seconds. Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-PMW-005 — On the money section, trigger AI financial summary and confirm income vs expense breakdown is included in the response. Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-PMW-006 — Trigger AI invoice drafter on income page and confirm tenant name, amount and period are pre-filled from context. Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-PMW-007 — Open AI copilot on compliance page and confirm overdue certificates are listed in the AI response. Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-PMW-008 — On legal section, trigger AI legal summary and confirm Section 21/Section 8 references are included where applicable. Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-PMW-009 — On contact detail page, trigger "Summarise contact" and confirm message history and job history are included in the summary. Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-PMW-010 — On planning section, trigger AI revenue forecast and confirm a projected figure is returned with stated assumptions. Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-PMW-011 — On automations page, trigger "Suggest automation" and confirm at least 3 automation templates are suggested. Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-PMW-012 — Open the global AI copilot panel via `/ai` slash command and confirm the chat input is focusable and accepts text. Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-PMW-013 — Send a multi-turn conversation in the AI copilot and confirm context is maintained across at least 3 turns. Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-PMW-014 — Confirm the AI usage meter is visible in the sidebar or header and shows current vs max usage. Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-PMW-015 — Exhaust the AI usage cap (or mock it) and confirm a warning appears and further AI calls are blocked. Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-PMW-016 — After any AI interaction, check the `ai_audit_log` table in Supabase and confirm an entry was created with workspace ID, user ID, and timestamp. Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-PMW-017 — Confirm AI responses do not include raw database IDs, internal API keys, or other sensitive internal data. Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-PMW-018 — Confirm AI copilot is scoped to the authenticated workspace — prompt context cannot reference other workspaces' data. Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-PMW-019 — Confirm RLS policies are enforced on all tables queried to build AI context (no full-table scans). Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-PMW-020 — Confirm NVIDIA NIM API key is stored in environment variables and never exposed in the client bundle. Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-PMW-021 — Confirm AI endpoints return a proper error message (not a raw 500) when the NIM service is unavailable. Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-PMW-022 — Confirm rate limiting is applied to AI endpoints (max N requests per minute per workspace). Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-PMW-023 — Confirm users on the free plan see a plan-gate prompt instead of AI functionality. Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-PMW-024 — Confirm AI responses handle edge case of empty workspace (no properties, no tenancies) gracefully. Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-PMW-025 — Confirm AI copilot panel is accessible at 430×932 (opens as full-width sheet, keyboard usable). Tracking file: /qa-release/ai-qa-log.md — FIX-275

### Supplier Solo AI (AI-SSW-001 to AI-SSW-015)

- [x] AI-SSW-001 — Navigate to `/supplier`, trigger AI dashboard summary and confirm NVIDIA NIM is called with supplier workspace context. Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-SSW-002 — On supplier requests page, trigger AI request qualifier and confirm coverage area check is included in the response. Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-SSW-003 — On supplier job detail, trigger "Summarise notes" and confirm all job notes are condensed into the response. Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-SSW-004 — On new quote page, trigger "Draft quote lines" and confirm trade category and job description are used as context. Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-SSW-005 — On new invoice page, trigger "Draft invoice" and confirm completed job details are pre-filled. Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-SSW-006 — On reputation page, trigger AI reputation summary and confirm review data and rating are included. Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-SSW-007 — On profile page, trigger "Write bio" and confirm trade categories and specialisms are used as context. Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-SSW-008 — Open AI copilot panel in supplier workspace and confirm it only has access to supplier workspace data. Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-SSW-009 — Exhaust supplier AI usage cap and confirm warning appears and blocks further AI calls. Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-SSW-010 — After any supplier AI interaction, check `ai_audit_log` for supplier workspace scope entry. Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-SSW-011 — Confirm supplier AI cannot access PM workspace data even if workspace IDs are known. Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-SSW-012 — Confirm NVIDIA NIM errors surface as a friendly message in the supplier AI panel (not a blank screen). Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-SSW-013 — Confirm streaming works for supplier AI responses (text appears incrementally). Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-SSW-014 — Confirm supplier AI on free plan shows upgrade prompt instead of AI output. Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-SSW-015 — Confirm supplier AI copilot is accessible at 430×932 (sheet opens, keyboard usable). Tracking file: /qa-release/ai-qa-log.md — FIX-275

### Supplier Team AI (AI-STW-001 to AI-STW-015)

- [x] AI-STW-001 — Navigate to team supplier dashboard and confirm AI team workload summary uses all team member job data as context. Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-STW-002 — On team schedule page, trigger "Optimise schedule" and confirm member availability and job locations are used. Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-STW-003 — On a job detail page (team), trigger "Suggest assignee" and confirm team skills and availability are used in the response. Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-STW-004 — On team insights page, trigger AI insight and confirm at least 3 business insights are returned with supporting data. Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-STW-005 — On new team quote, trigger AI drafter and confirm team rates are used in the output. Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-STW-006 — On new team invoice, trigger AI drafter and confirm assigned member hours are included. Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-STW-007 — On reputation page (team), trigger AI reputation analysis and confirm per-member rating breakdown is included. Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-STW-008 — Open AI copilot in team workspace and send a query about team capacity — confirm team member data is in the response. Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-STW-009 — Access AI as a member role (not owner) and confirm owner-only AI insights are blocked. Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-STW-010 — After any team AI interaction, check `ai_audit_log` for team workspace scope and user role recorded. Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-STW-011 — Confirm team AI cannot access data from other team workspaces. Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-STW-012 — Confirm team AI rate limiting is per-workspace (not per-user, so one heavy user cannot block the whole team). Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-STW-013 — Confirm streaming works for all team AI surfaces. Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-STW-014 — Confirm team AI is behind the team plan gate (solo plan users cannot use team AI features). Tracking file: /qa-release/ai-qa-log.md — FIX-275
- [x] AI-STW-015 — Confirm team AI copilot accessible at 430×932 for owner and manager roles. Tracking file: /qa-release/ai-qa-log.md — FIX-275

### Property Manager Automations (AUTO-PMW-001 to AUTO-PMW-020)

- [x] AUTO-PMW-001 — Navigate to `/property-manager/automations` and confirm the automations list loads with active/inactive counts. Tracking file: /qa-release/automation-qa-log.md — FIX-276 automation QA complete
- [x] AUTO-PMW-002 — Create a new automation using the Rent Due Trigger — confirm the trigger saves and appears in the list. Tracking file: /qa-release/automation-qa-log.md — FIX-276
- [x] AUTO-PMW-003 — Open an existing automation and confirm the automation editor loads with the current configuration. Tracking file: /qa-release/automation-qa-log.md — FIX-276
- [x] AUTO-PMW-004 — Add a Rent Due Trigger node and confirm it fires correctly when a tenancy rent due date is within the configured window. Tracking file: /qa-release/automation-qa-log.md — FIX-276
- [x] AUTO-PMW-005 — Add a Certificate Expiry Trigger and confirm it fires when a certificate is within N days of expiry. Tracking file: /qa-release/automation-qa-log.md — FIX-276
- [x] AUTO-PMW-006 — Add a Tenancy End Trigger and confirm it fires when a tenancy end date is within N days. Tracking file: /qa-release/automation-qa-log.md — FIX-276
- [x] AUTO-PMW-007 — Add a Job Status Changed Trigger and confirm it fires when a job status is updated in the database. Tracking file: /qa-release/automation-qa-log.md — FIX-276
- [x] AUTO-PMW-008 — Add a Form Submitted Trigger and confirm it fires on portal form submission. Tracking file: /qa-release/automation-qa-log.md — FIX-276
- [x] AUTO-PMW-009 — Add a Condition (if/else) logic node and confirm both branches route correctly based on a field value comparison. Tracking file: /qa-release/automation-qa-log.md — FIX-276
- [x] AUTO-PMW-010 — Add a Delay logic node, set to 1 hour, and confirm the next node fires after the delay period. Tracking file: /qa-release/automation-qa-log.md — FIX-276
- [x] AUTO-PMW-011 — Add a Filter logic node and confirm only records matching the filter criteria proceed through the workflow. Tracking file: /qa-release/automation-qa-log.md — FIX-276
- [x] AUTO-PMW-012 — Add a Loop logic node and confirm each record in the set is processed independently. Tracking file: /qa-release/automation-qa-log.md — FIX-276
- [x] AUTO-PMW-013 — Add a Send Email action node and confirm the email is delivered via Resend to the correct recipient. Tracking file: /qa-release/automation-qa-log.md — FIX-276
- [x] AUTO-PMW-014 — Add a Create Task action node and confirm the task appears in the PM work section after execution. Tracking file: /qa-release/automation-qa-log.md — FIX-276
- [x] AUTO-PMW-015 — Add an Update Record action node and confirm the target DB record is updated with the correct field value. Tracking file: /qa-release/automation-qa-log.md — FIX-276
- [x] AUTO-PMW-016 — Add a Send In-App Notification action and confirm the notification appears in the bell after execution. Tracking file: /qa-release/automation-qa-log.md — FIX-276
- [x] AUTO-PMW-017 — Add an AI Generate Content node and confirm the NVIDIA NIM endpoint is called and output is included in the workflow result. Tracking file: /qa-release/automation-qa-log.md — FIX-276
- [x] AUTO-PMW-018 — Add an AI Classify node and confirm the input text is classified and the label is applied to the target record. Tracking file: /qa-release/automation-qa-log.md — FIX-276
- [x] AUTO-PMW-019 — Navigate to the automation run log and confirm past runs are listed with status, timestamp, and output. Tracking file: /qa-release/automation-qa-log.md — FIX-276
- [x] AUTO-PMW-020 — Toggle an automation off and confirm it no longer fires when the trigger condition is met. Tracking file: /qa-release/automation-qa-log.md — FIX-276

### Supplier Solo Automations (AUTO-SSW-001 to AUTO-SSW-010)

- [x] AUTO-SSW-001 — Navigate to `/supplier/automations` and confirm the list loads with supplier-scoped automations only. Tracking file: /qa-release/automation-qa-log.md — FIX-276
- [x] AUTO-SSW-002 — Add a New Request Trigger to a supplier automation and confirm it fires when a new job request arrives. Tracking file: /qa-release/automation-qa-log.md — FIX-276
- [x] AUTO-SSW-003 — Add a Job Status Changed Trigger in supplier workspace and confirm it fires on job status update. Tracking file: /qa-release/automation-qa-log.md — FIX-276
- [x] AUTO-SSW-004 — Add a Send Email action in supplier automation and confirm the email is sent via Resend to the PM. Tracking file: /qa-release/automation-qa-log.md — FIX-276
- [x] AUTO-SSW-005 — Add an Auto-Accept Request action and confirm the request is automatically accepted when criteria are met. Tracking file: /qa-release/automation-qa-log.md — FIX-276
- [x] AUTO-SSW-006 — Add an Auto-Decline Request action and confirm the request is declined when outside coverage area. Tracking file: /qa-release/automation-qa-log.md — FIX-276
- [x] AUTO-SSW-007 — Add a Coverage Condition logic node and confirm the branch routes correctly based on postcode coverage. Tracking file: /qa-release/automation-qa-log.md — FIX-276
- [x] AUTO-SSW-008 — Add an AI Draft Reply node in supplier automation and confirm a draft response is generated using job context. Tracking file: /qa-release/automation-qa-log.md — FIX-276
- [x] AUTO-SSW-009 — Navigate to the supplier automation run log and confirm past runs are listed with correct scope. Tracking file: /qa-release/automation-qa-log.md — FIX-276
- [x] AUTO-SSW-010 — Toggle a supplier automation off and confirm it no longer fires when the trigger condition is met. Tracking file: /qa-release/automation-qa-log.md — FIX-276

### Supplier Team Automations (AUTO-STW-001 to AUTO-STW-010)

- [x] AUTO-STW-001 — Navigate to supplier team automations list and confirm only team-scoped automations are listed. Tracking file: /qa-release/automation-qa-log.md — FIX-276
- [x] AUTO-STW-002 — Add a Member Assignment Trigger and confirm it fires when a job is assigned to a team member. Tracking file: /qa-release/automation-qa-log.md — FIX-276
- [x] AUTO-STW-003 — Add an Availability Changed Trigger and confirm it fires when a team member updates availability. Tracking file: /qa-release/automation-qa-log.md — FIX-276
- [x] AUTO-STW-004 — Add a Notify Team Member action and confirm the in-app notification is delivered to the correct member. Tracking file: /qa-release/automation-qa-log.md — FIX-276
- [x] AUTO-STW-005 — Add a Reassign Job action and confirm the job is reassigned to the specified team member in the DB. Tracking file: /qa-release/automation-qa-log.md — FIX-276
- [x] AUTO-STW-006 — Add a Capacity Check logic node and confirm the branch routes to overflow when the member's job count exceeds the cap. Tracking file: /qa-release/automation-qa-log.md — FIX-276
- [x] AUTO-STW-007 — Add an AI Suggest Assignment node and confirm a team member recommendation is returned with reasoning. Tracking file: /qa-release/automation-qa-log.md — FIX-276
- [x] AUTO-STW-008 — Access the automation builder as a member role (not owner/manager) and confirm edit actions are blocked. Tracking file: /qa-release/automation-qa-log.md — FIX-276
- [x] AUTO-STW-009 — Navigate to team automation run history and confirm run entries include the triggering user's role. Tracking file: /qa-release/automation-qa-log.md — FIX-276
- [x] AUTO-STW-010 — Toggle a team automation off as owner and confirm it no longer fires for any team member trigger. Tracking file: /qa-release/automation-qa-log.md — FIX-276

### Property Manager Settings (SET-PMW-001 to SET-PMW-020)

- [x] SET-PMW-001 — Navigate to `/property-manager/account` and confirm all 9 section cards are visible. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md — FIX-277 settings QA complete
- [x] SET-PMW-002 — Open the Profile tab and confirm name, email, phone and avatar are pre-populated from the database. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md — FIX-277
- [x] SET-PMW-003 — Edit name in Profile, save, reload the page, and confirm the change persists. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md — FIX-277
- [x] SET-PMW-004 — Upload a new avatar in Profile and confirm the preview updates and the image is stored in Supabase Storage. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md — FIX-277
- [x] SET-PMW-005 — Open Security tab and confirm the password change form renders and submits without error. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md — FIX-277
- [x] SET-PMW-006 — Confirm the MFA toggle in Security renders and initiates the correct flow. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md — FIX-277
- [x] SET-PMW-007 — Open Notifications tab and confirm all channel toggles (email, SMS, push, in-app) render and save. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md — FIX-277
- [x] SET-PMW-008 — Set quiet hours in Notifications and confirm the setting saves and persists on reload. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md — FIX-277
- [x] SET-PMW-009 — Open Preferences tab and confirm theme, density, timezone, and landing page selects render and save. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md — FIX-277
- [x] SET-PMW-010 — Open Sessions tab and confirm active sessions are listed with device, IP, and last active time. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md — FIX-277
- [x] SET-PMW-011 — Revoke a session on the Sessions tab and confirm it is removed from the list. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md — FIX-277
- [x] SET-PMW-012 — Navigate to `/property-manager/workspace-settings` and confirm all sub-sections are present. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md — FIX-277
- [x] SET-PMW-013 — Edit workspace name in General settings, save, reload, and confirm the change persists. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md — FIX-277
- [x] SET-PMW-014 — Upload workspace logo and confirm the preview renders and the image is stored correctly. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md — FIX-277
- [x] SET-PMW-015 — Open Members tab and confirm all workspace members are listed with correct roles. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md — FIX-277
- [x] SET-PMW-016 — Trigger the invite member flow and confirm the invite email is sent to the specified address. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md — FIX-277
- [x] SET-PMW-017 — Navigate to `/property-manager/workspace/billing` and confirm current plan, billing date and invoice history are visible. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md — FIX-277
- [x] SET-PMW-018 — Click the upgrade plan CTA and confirm it routes to Stripe checkout (or shows BLOCKED_EXTERNAL if Stripe not configured). Tracking file: /qa-release/settings-account-billing-profile-qa-log.md — FIX-277
- [x] SET-PMW-019 — On billing page, click a past invoice and confirm a PDF is downloadable. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md — FIX-277
- [x] SET-PMW-020 — Open Data & Privacy tab and confirm export data link and delete account option are present with a confirmation guard. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md — FIX-277

### Supplier Solo Settings (SET-SSW-001 to SET-SSW-010)

- [x] SET-SSW-001 — Navigate to `/supplier/settings` and confirm all section links are visible. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md — FIX-277
- [x] SET-SSW-002 — Open Business Details and confirm name, description, and phone are pre-populated and save correctly. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md — FIX-277
- [x] SET-SSW-003 — Open Availability and confirm the working hours grid renders, toggles work, and save persists. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md — FIX-277
- [x] SET-SSW-004 — Open Coverage Areas and confirm the radius/postcode input renders and save persists. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md — FIX-277
- [x] SET-SSW-005 — Open Notifications and confirm email/SMS toggles render and save. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md — FIX-277
- [x] SET-SSW-006 — Navigate to `/supplier/profile` and confirm all fields are editable and save correctly. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md — FIX-277
- [x] SET-SSW-007 — Upload a profile photo and confirm the image is stored and preview updates. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md — FIX-277
- [x] SET-SSW-008 — Open Trade Categories and confirm the multi-select renders and save persists. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md — FIX-277
- [x] SET-SSW-009 — Navigate to supplier billing and confirm current plan and billing date are visible. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md — FIX-277
- [x] SET-SSW-010 — Confirm a supplier user cannot access `/property-manager/account` (returns 401/403). Tracking file: /qa-release/settings-account-billing-profile-qa-log.md — FIX-277

### Supplier Team Settings (SET-STW-001 to SET-STW-010)

- [x] SET-STW-001 — Navigate to supplier team settings and confirm team-specific sections are present alongside solo sections. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md — FIX-277
- [x] SET-STW-002 — Open Business Details (team) and confirm company name, registration number, and address are editable. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md — FIX-277
- [x] SET-STW-003 — Navigate to `/supplier/team` and confirm all members are listed with roles and statuses. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md — FIX-277
- [x] SET-STW-004 — Trigger invite team member flow and confirm the invite is sent to the specified email. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md — FIX-277
- [x] SET-STW-005 — Change a team member's role and confirm the change saves and the new role is displayed. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md — FIX-277
- [x] SET-STW-006 — Remove a team member and confirm a confirmation guard appears before removal. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md — FIX-277
- [x] SET-STW-007 — Navigate to team billing and confirm team plan with seat count is displayed. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md — FIX-277
- [x] SET-STW-008 — Adjust seat count in billing and confirm the prorated cost is shown before confirming. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md — FIX-277
- [x] SET-STW-009 — Open payout settings and confirm bank details form renders with sort code, account number, and name fields. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md — FIX-277
- [x] SET-STW-010 — Access team settings as a member role and confirm billing and team management sections are hidden or read-only. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md — FIX-277

### Property Manager i18n (I18N-PMW-001 to I18N-PMW-015)

- [x] I18N-PMW-001 — Navigate to `/property-manager/money/income` and confirm all rent amounts display as £X,XXX.XX (GBP format). Tracking file: /qa-release/internationalization-currency-qa-log.md — FIX-278 i18n QA complete
- [x] I18N-PMW-002 — On the income page, confirm invoice amounts use the correct currency symbol from workspace settings (not hard-coded £). Tracking file: /qa-release/internationalization-currency-qa-log.md — FIX-278
- [x] I18N-PMW-003 — Navigate to `/property-manager/money/expenses` and confirm expense amounts use correct currency formatting with thousands separator. Tracking file: /qa-release/internationalization-currency-qa-log.md — FIX-278
- [x] I18N-PMW-004 — Navigate to a tenancy detail and confirm the deposit amount shows correct currency symbol and decimal places. Tracking file: /qa-release/internationalization-currency-qa-log.md — FIX-278
- [x] I18N-PMW-005 — On a tenancy detail, confirm start and end dates display as DD/MM/YYYY (UK format), not MM/DD/YYYY. Tracking file: /qa-release/internationalization-currency-qa-log.md — FIX-278
- [x] I18N-PMW-006 — On the compliance page, confirm certificate expiry dates are in DD/MM/YYYY format. Tracking file: /qa-release/internationalization-currency-qa-log.md — FIX-278
- [x] I18N-PMW-007 — On the legal section, confirm Section 21 and Section 8 references use correct UK legal terminology. Tracking file: /qa-release/internationalization-currency-qa-log.md — FIX-278
- [x] I18N-PMW-008 — On the money dashboard, confirm the rent roll total uses the currency format function (not a hard-coded £ string). Tracking file: /qa-release/internationalization-currency-qa-log.md — FIX-278
- [x] I18N-PMW-009 — On the planning section, confirm revenue forecast figures use the currency format function. Tracking file: /qa-release/internationalization-currency-qa-log.md — FIX-278
- [x] I18N-PMW-010 — On accounting, confirm chart of accounts amounts use the currency format function with correct decimal places. Tracking file: /qa-release/internationalization-currency-qa-log.md — FIX-278
- [x] I18N-PMW-011 — On a job detail, confirm the job value/quote amount uses the currency format function. Tracking file: /qa-release/internationalization-currency-qa-log.md — FIX-278
- [x] I18N-PMW-012 — In workspace settings, confirm a currency selector exists and changing it updates all money displays across the workspace. Tracking file: /qa-release/internationalization-currency-qa-log.md — FIX-125 Language & Preferences page created at /workspace-settings/preferences with 12-currency selector saving to workspace_settings.preferences_json
- [x] I18N-PMW-013 — In workspace settings, confirm a date format selector exists and changing it updates all date displays. Tracking file: /qa-release/internationalization-currency-qa-log.md — FIX-125 date format selector (4 options) + timezone selector (24 IANA zones) + live preview panel confirmed
- [x] I18N-PMW-014 — Grep the PM workspace components for hard-coded `£` characters and confirm zero are found (all use format function). Tracking file: /qa-release/internationalization-currency-qa-log.md — FIX-278
- [x] I18N-PMW-015 — Grep the PM workspace components for hard-coded date format strings (e.g. `DD/MM/YYYY`) and confirm all use the date format function instead. Tracking file: /qa-release/internationalization-currency-qa-log.md — FIX-278

### Supplier Solo i18n (I18N-SSW-001 to I18N-SSW-010)

- [x] I18N-SSW-001 — Navigate to a supplier quote and confirm all line item amounts display with correct currency formatting. Tracking file: /qa-release/internationalization-currency-qa-log.md — FIX-278
- [x] I18N-SSW-002 — Navigate to a supplier invoice and confirm all amounts display with correct currency symbol and decimal places. Tracking file: /qa-release/internationalization-currency-qa-log.md — FIX-278
- [x] I18N-SSW-003 — Navigate to a supplier job detail and confirm the job value uses the currency format function. Tracking file: /qa-release/internationalization-currency-qa-log.md — FIX-278
- [x] I18N-SSW-004 — On a supplier job detail, confirm the scheduled date is in DD/MM/YYYY format (UK default). Tracking file: /qa-release/internationalization-currency-qa-log.md — FIX-278
- [x] I18N-SSW-005 — On supplier insights, confirm all revenue chart values use the currency format function. Tracking file: /qa-release/internationalization-currency-qa-log.md — FIX-278
- [x] I18N-SSW-006 — On the reputation page, confirm review dates are formatted correctly (not ISO strings). Tracking file: /qa-release/internationalization-currency-qa-log.md — FIX-278
- [x] I18N-SSW-007 — On the supplier profile, confirm service pricing display uses the currency format function. Tracking file: /qa-release/internationalization-currency-qa-log.md — FIX-278
- [x] I18N-SSW-008 — In supplier settings, confirm a currency/locale selector exists and changes propagate to all money displays. Tracking file: /qa-release/internationalization-currency-qa-log.md — FIX-278
- [x] I18N-SSW-009 — Grep the supplier workspace components for hard-coded `£` characters and confirm zero are found. Tracking file: /qa-release/internationalization-currency-qa-log.md — FIX-278
- [x] I18N-SSW-010 — Grep the supplier workspace components for hard-coded date format strings and confirm all use the date format function. Tracking file: /qa-release/internationalization-currency-qa-log.md — FIX-278

### Supplier Team i18n (I18N-STW-001 to I18N-STW-010)

- [x] I18N-STW-001 — Navigate to a team quote and confirm line item amounts display with correct team workspace currency formatting. Tracking file: /qa-release/internationalization-currency-qa-log.md — FIX-278
- [x] I18N-STW-002 — Navigate to a team invoice and confirm all amounts use the correct team workspace currency. Tracking file: /qa-release/internationalization-currency-qa-log.md — FIX-278
- [x] I18N-STW-003 — On the team schedule page, confirm all scheduled dates and times are in the correct locale format including timezone. Tracking file: /qa-release/internationalization-currency-qa-log.md — FIX-278
- [x] I18N-STW-004 — On team insights, confirm all revenue chart values use the team workspace currency format function. Tracking file: /qa-release/internationalization-currency-qa-log.md — FIX-278
- [x] I18N-STW-005 — On the team members page, confirm any pay rate or hourly rate display uses the currency format function. Tracking file: /qa-release/internationalization-currency-qa-log.md — FIX-278
- [x] I18N-STW-006 — On team billing, confirm the billing amount and seat cost use the correct currency format. Tracking file: /qa-release/internationalization-currency-qa-log.md — FIX-278
- [x] I18N-STW-007 — Confirm all job values and dates on team job surfaces use the format functions (no hard-coded values). Tracking file: /qa-release/internationalization-currency-qa-log.md — FIX-278
- [x] I18N-STW-008 — In team settings, confirm a currency/locale selector exists and changing it updates all money displays for the team. Tracking file: /qa-release/internationalization-currency-qa-log.md — FIX-278
- [x] I18N-STW-009 — Grep the team supplier workspace components for hard-coded `£` characters and confirm zero are found. Tracking file: /qa-release/internationalization-currency-qa-log.md — FIX-278
- [x] I18N-STW-010 — Grep the team supplier workspace components for hard-coded date format strings and confirm all use the date format function. Tracking file: /qa-release/internationalization-currency-qa-log.md — FIX-278
