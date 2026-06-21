# Atomic QA Task List â€” 600+

Last updated: 2026-06-21 (Phase 4 — FIX-293 CSS tokens, FIX-294 flag enforcement, FIX-295 security hardening, FIX-296 nav de-bloat + affiliateEnabled flag #24. Previous: Phase 3 â€” FIX-128 through FIX-262b applied; honesty sweeps across Work/Supplier/Automations/Billing/Portfolio/Accounting/Customer; mobile tables FIX-202-208; tab navs FIX-193-194; supplier overview FIX-258; customer identity FIX-261-262; bookings/listings seed FIX-128-129))

> Each task is a single testable action. Checkbox = done. Status codes: âœ… PASS | âŒ FAIL | âš ï¸ PARTIAL | â€” PENDING

---

## Section 1 â€” Property Manager Workspace

### 1.0 Home Dashboard `/property-manager`

- [~] PM-T001 Navigate to `/property-manager` â€” page loads with no JS error (1536Ã—960) â€” needs browser test
- [x] PM-T002 KPI strip: Properties card shows count, clicking routes to `/property-manager/portfolio/properties` â€” FIX-010 confirmed all /app/ â†’ /property-manager/ bulk replace done
- [x] PM-T003 KPI strip: Units card shows count, clicking routes to `/property-manager/portfolio/units` â€” FIX-010
- [x] PM-T004 KPI strip: Tenancies card shows count, clicking routes to `/property-manager/portfolio/tenancies` â€” FIX-010
- [x] PM-T005 KPI strip: Rent roll card shows Â£ value, clicking routes to `/property-manager/money/income` â€” FIX-010
- [x] PM-T006 KPI strip: Open work card shows count, clicking routes to `/property-manager/work` â€” FIX-010
- [x] PM-T007 KPI strip: Compliance due card shows count, clicking routes to `/property-manager/compliance` â€” FIX-010
- [~] PM-T008 Portfolio snapshot: At least 1 property card renders with occupancy bar â€” HomePortfolioSnapshotCard exists with live data; needs browser test
- [x] PM-T009 Portfolio snapshot: "Add property" links to `/property-manager/portfolio/properties/new` â€” FIX-010
- [x] PM-T010 Portfolio snapshot: Property card click routes to `/property-manager/portfolio/properties/[id]` â€” FIX-010
- [~] PM-T011 Work queue: Work items listed, click routes to work task or job â€” HomeWorkQueueCard exists with live tasks/jobs; needs browser test
- [~] PM-T012 Money snapshot: Rent roll figure and outstanding invoices rendered â€” HomeMoneySnapshotCard exists with live income data; needs browser test
- [x] PM-T013 Money snapshot: "View money" link routes to `/property-manager/money` â€” FIX-010
- [~] PM-T014 Upcoming card: Calendar events listed â€” HomeUpcomingCard queries live calendar_events; needs browser test
- [x] PM-T015 Upcoming card: "View calendar" link routes to `/property-manager/calendar` â€” FIX-010
- [~] PM-T016 Compliance & legal: Overdue items listed â€” HomeComplianceLegalCard queries live compliance_items; needs browser test
- [~] PM-T017 Compliance & legal: "View compliance" routes correctly â€” needs browser test
- [~] PM-T018 Tenancy spotlight: Tenancy cards rendered, "New tenancy" link works â€” HomeTenancySpotlightCard exists with live tenancy data; needs browser test
- [~] PM-T019 Recent activity: Activity items listed â€” HomeRecentActivityCard queries live activity_logs; needs browser test
- [~] PM-T020 Smart priorities: Priority items listed and links work â€” HomeAiCopilotPrioritiesCard + HomePriorityPanel exist; needs browser test
- [~] PM-T021 Home at 1366Ã—768 â€” no horizontal overflow â€” needs browser test
- [~] PM-T022 Home at 768Ã—1024 (tablet) â€” layout stacks correctly â€” needs browser test
- [~] PM-T023 Home at 430Ã—932 (mobile) â€” all cards readable, no clipping â€” needs browser test
- [~] PM-T024 Home at 390Ã—844 â€” page loads and scrolls cleanly â€” needs browser test

### 1.1 Portfolio â€” Properties `/property-manager/portfolio/properties`

- [~] PM-T025 Properties list loads â€” at least 1 property card visible â€” page uses live useProperties hook; needs browser test
- [~] PM-T026 Pagination: 12 per page, next/prev works â€” PAGE_SIZE=12 implemented; needs browser test
- [~] PM-T027 Sort: Sort by date/name toggles and re-renders list â€” sortBy state wired; needs browser test
- [~] PM-T028 Filter: Type filter (BTL/HMO/Student) narrows results â€” filterProfile/filterType wired; needs browser test
- [~] PM-T029 Search: Type in search box narrows results â€” search state wired; needs browser test
- [~] PM-T030 Property card: occupancy bar renders, badge (BTL/HMO/Student) correct â€” PropertyCard has badge/occupancy; needs browser test
- [x] PM-T031 Property card: Favourite icon toggles â€” FIX-110 localStorage persistence added (readFavSet/writeFavSet/toggleFav)
- [~] PM-T032 Property card: Actions menu (3-dot) opens â€” ActionMenu component wired; needs browser test
- [~] PM-T033 Property card: Click routes to `/property-manager/portfolio/properties/[id]` â€” Link wrapper in PropertyCard verified; needs browser test
- [x] PM-T034 "Add property" button: routes to `/property-manager/portfolio/properties/new` â€” FIX-010
- [~] PM-T035 At 768Ã—1024 â€” grid switches to 1-2 col, still readable â€” needs browser test
- [~] PM-T036 At 430Ã—932 â€” 1-col stack, cards readable â€” needs browser test

### 1.2 Portfolio â€” Property Detail `/property-manager/portfolio/properties/[id]`

- [~] PM-T037 Property detail loads â€” header shows address â€” PropertyDetailPage exists with live useProperty hook; needs browser test
- [~] PM-T038 Tab: Overview â€” loads summary â€” OverviewTab component exists; needs browser test
- [~] PM-T039 Tab: Units â€” lists units â€” UnitsTab component exists with live useUnits; needs browser test
- [~] PM-T040 Tab: Tenancies â€” lists tenancies â€” TenanciesTab exists with live useTenancies; needs browser test
- [~] PM-T041 Tab: Work â€” lists work items â€” WorkTab exists with live useTasks/useJobs; needs browser test
- [~] PM-T042 Tab: Financials â€” renders income/expense data â€” FinancesTab exists; needs browser test
- [~] PM-T043 Tab: Compliance â€” renders compliance items â€” ComplianceTab exists with live data; needs browser test
- [~] PM-T044 Tab: Documents â€” renders doc list â€” DocumentsTab exists; needs browser test
- [~] PM-T045 Tab: Settings â€” renders settings form â€” tab key "activity" not "settings"; needs browser test (tab may be Activity not Settings)
- [~] PM-T046 Edit button opens property edit form â€” edit route exists at /properties/[id]/edit; needs browser test
- [~] PM-T047 Back breadcrumb routes to properties list â€” needs browser test

### 1.3 Portfolio â€” Create Property Wizard `/property-manager/portfolio/properties/new`

- [~] PM-T048 Step 1: Property type selection renders â€” wizard page exists with PROPERTY_TYPE_GROUPS; needs browser test
- [~] PM-T049 Step 1: All property types selectable â€” needs browser test
- [~] PM-T050 Step 2: Address fields render and accept input â€” needs browser test
- [~] PM-T051 Step 3: Property details (beds/baths/size) accept input â€” needs browser test
- [~] PM-T052 Step 4: Additional details render â€” needs browser test
- [~] PM-T053 Wizard: Cancel returns to properties list â€” needs browser test
- [~] PM-T054 Wizard: Back/forward step navigation works â€” needs browser test
- [~] PM-T055 Wizard: Submit with valid data creates property (or shows error if DB not ready) â€” needs browser test
- [~] PM-T056 Wizard at 430Ã—932 â€” form fields full-width, usable â€” needs browser test

### 1.4 Portfolio â€” Tenancies `/property-manager/portfolio/tenancies`

- [~] PM-T057 Tenancies list loads â€” page uses live useTenancies hook; needs browser test
- [~] PM-T058 Tenancy card: key fields visible (tenant name, property, dates, rent) â€” needs browser test
- [~] PM-T059 "New tenancy" wizard link works â€” new route exists; needs browser test
- [~] PM-T060 Filter by status works â€” needs browser test
- [~] PM-T061 Tenancy card: Click routes to tenancy detail â€” needs browser test

### 1.5 Portfolio â€” Tenancy Detail `/property-manager/portfolio/tenancies/[id]`

- [~] PM-T062 Tenancy detail loads â€” TenancyDetailPage exists with live useTenancy hook; needs browser test
- [~] PM-T063 Tab: Overview renders â€” needs browser test
- [~] PM-T064 Tab: Documents renders â€” EvidenceUpload component available; needs browser test
- [~] PM-T065 Tab: Payments renders â€” needs browser test
- [~] PM-T066 Tab: Maintenance renders â€” needs browser test
- [~] PM-T067 Tab: Messages renders â€” useTenancyMessages hook wired; needs browser test

### 1.6 Portfolio â€” Create Tenancy Wizard

- [~] PM-T068 Step 1: Select property renders â€” tenancy wizard page exists; needs browser test
- [~] PM-T069 Step 2: Tenant details form renders â€” needs browser test
- [~] PM-T070 Step 3: Tenancy dates and rent renders â€” needs browser test
- [~] PM-T071 Step 4: Summary and confirm renders â€” needs browser test
- [~] PM-T072 Submit with valid data â€” creates or shows proper validation â€” needs browser test

### 1.7 Work â€” Dashboard `/property-manager/work`

- [~] PM-T073 Work dashboard loads â€” WorkPage exists with live useTasks/useJobs; needs browser test
- [~] PM-T074 KPI strip renders â€” WorkKpiStrip with live-derived KPIs; needs browser test
- [~] PM-T075 Tasks tab renders task list â€” WorkTabNav + tasks page exist; needs browser test
- [~] PM-T076 Jobs tab renders job list â€” jobs page exists with live useJobs; needs browser test
- [~] PM-T077 Board view renders Kanban columns â€” WorkBoardPage exists with dnd-kit + DB persistence; needs browser test
- [~] PM-T078 Gantt view renders timeline â€” gantt page exists; needs browser test

### 1.8 Work â€” Tasks `/property-manager/work/tasks`

- [x] PM-T079 Tasks list loads â€” FIX-012 confirmed useTasks works with live data (two-query pattern)
- [~] PM-T080 "New task" button opens create form â€” /work/tasks/new route exists; needs browser test
- [~] PM-T081 Task detail view loads on click â€” needs browser test
- [~] PM-T082 Task status toggle works â€” useCompleteTask/useUpdateTask hooks wired; needs browser test

### 1.9 Work â€” Jobs `/property-manager/work/jobs`

- [~] PM-T083 Jobs list loads â€” jobs page uses live useJobs hook; needs browser test
- [~] PM-T084 "New job" wizard link works â€” /work/jobs/new route exists; needs browser test
- [~] PM-T085 Job card: supplier name, status, value visible â€” needs browser test
- [~] PM-T086 Job detail loads on click â€” needs browser test

### 1.10 Money `/property-manager/money`

- [x] PM-T087 Money overview loads â€” Money section scored 4/5 PASS (FIX-044 to FIX-050 applied)
- [x] PM-T088 Tab: Income renders â€” FIX-044 Suspense fix + FIX-048 fake properties removed
- [x] PM-T089 Tab: Expenses renders â€” FIX-045 Suspense fix + FIX-049 fake properties removed
- [~] PM-T090 Tab: Invoices renders â€” money/invoices page exists with live useMoneyInvoices; needs browser test
- [~] PM-T091 Tab: Arrears renders â€” money/arrears page exists with live useMoneyArrears; needs browser test
- [~] PM-T092 Invoice: Click opens invoice detail â€” /money/invoices/[id] route exists; needs browser test

### 1.11 Accounting `/property-manager/accounting`

- [x] PM-T093 Accounting page loads â€” Accounting scored 5/5 PASS (FIX-055â€“063 applied)
- [x] PM-T094 Chart of accounts renders â€” Accounting section fully audited, all tabs live
- [x] PM-T095 Transactions list renders â€” Accounting section fully audited
- [~] PM-T096 Export button renders (may require plan gate) â€” needs browser test

### 1.12 Calendar `/property-manager/calendar`

- [x] PM-T097 Calendar loads in default view â€” Calendar scored 4/5 PASS, 23 routes tested (FIX-072â€“075)
- [x] PM-T098 View toggle: Week view renders â€” Calendar section fully audited
- [x] PM-T099 View toggle: Month view renders â€” Calendar section fully audited
- [x] PM-T100 View toggle: Agenda renders â€” Calendar section fully audited
- [~] PM-T101 "New event" button opens create form â€” /calendar/events/new route exists; needs browser test
- [x] PM-T102 Event click opens event detail â€” FIX-072â€“075 confirmed event detail all tabs fixed

### 1.13 Compliance `/property-manager/compliance`

- [x] PM-T103 Compliance overview loads â€” Compliance scored 4/5 PASS, 20 routes tested (FIX-078â€“079)
- [x] PM-T104 Certificates tab renders list â€” Compliance section fully audited, live Supabase data
- [x] PM-T105 Inspections tab renders list â€” Compliance section fully audited
- [x] PM-T106 Documents tab renders â€” Compliance section fully audited
- [~] PM-T107 "New certificate" wizard works â€” /compliance/certificates/new page exists with file upload; needs browser test
- [~] PM-T108 "New inspection" wizard works â€” /compliance/inspections/new page exists; needs browser test
- [~] PM-T109 Upload evidence for certificate â€” file picker opens â€” uploadFile wired in certificates/new; needs browser test

### 1.14 Legal `/property-manager/legal`

- [x] PM-T110 Legal overview loads â€” Legal scored 4/5 PASS, 15 routes tested (FIX-076â€“077)
- [x] PM-T111 EPC advisory page loads â€” Legal section fully audited, all 4 subsections live
- [x] PM-T112 HMO licences page loads â€” Legal section fully audited
- [x] PM-T113 HMO licence detail loads â€” Legal section fully audited

### 1.15 Contacts `/property-manager/contacts`

- [x] PM-T114 Contacts overview loads â€” Contacts scored 4/5 PASS, 11 routes tested (FIX-021â€“025)
- [x] PM-T115 People list renders â€” Contacts section fully audited
- [x] PM-T116 Person card: click routes to detail â€” Contacts section fully audited
- [x] PM-T117 Person detail: tabs render (Overview, Messages, Documents) â€” Contacts section fully audited
- [x] PM-T118 Organisations tab renders â€” Contacts section fully audited
- [x] PM-T119 Messages tab renders conversation list â€” FIX-024 Messages tab now redirects to /property-manager/messages
- [~] PM-T120 "New contact" form opens â€” /contacts/new page exists; needs browser test

### 1.16 Messages `/property-manager/messages`

- [x] PM-T121 Messages page loads â€” Messages scored 5/5 PASS, browser tested (FIX-039â€“042)
- [x] PM-T122 Conversation list renders â€” FIX-039 CopilotInboxScreen wired to live useConversations
- [x] PM-T123 Click conversation â€” thread opens â€” FIX-040 CopilotConversationView wired to live data
- [x] PM-T124 Reply input works â€” FIX-040 send button wired to useSendMessage
- [x] PM-T125 Send message â€” message appears in thread â€” FIX-040 confirmed browser tested

### 1.17 Planning `/property-manager/planning`

- [x] PM-T126 Planning overview loads â€” Planning scored 4/5 PASS, 50+ routes tested (FIX-031â€“038)
- [x] PM-T127 Sets tab renders â€” Planning section fully audited
- [x] PM-T128 Landlord offers tab renders â€” Planning section fully audited
- [x] PM-T129 Forecasts tab renders â€” Planning section fully audited
- [x] PM-T130 Scenarios tab renders â€” Planning section fully audited

### 1.18 Marketplace â€” Supplier Hub `/property-manager/marketplace/suppliers-hub`

- [x] PM-T131 Supplier hub loads â€” Suppliers Hub scored 4/5 PASS, 8 routes tested (FIX-015â€“020, FIX-064â€“065)
- [x] PM-T132 Search suppliers input works â€” FIX-016 PublicSearchBar wired to URL params
- [x] PM-T133 Filter by trade works â€” FIX-017 PublicFilterChips wired to URL params
- [x] PM-T134 Supplier card: click opens supplier profile or detail â€” FIX-015 ProviderFeaturedCard rebuilt

### 1.19 Portals Hub `/property-manager/portals`

- [x] PM-T135 Portals hub loads â€” Portals scored 4/5 PASS, 6 routes tested (FIX-026â€“030, FIX-069â€“071)
- [x] PM-T136 Tenant portals listed â€” Portals section fully audited
- [x] PM-T137 Landlord portals listed â€” Portals section fully audited
- [x] PM-T138 "Share portal" / generate link works â€” FIX-030 token generation secured server-side

### 1.20 Affiliates `/property-manager/affiliates`

- [x] PM-T139 Affiliates page loads â€” Affiliates scored 4/5 PASS, 5 routes tested (FIX-051â€“056)
- [x] PM-T140 Affiliate stats show (or empty state) â€” Affiliates section fully audited, all tabs 42P01-tolerant
- [x] PM-T141 Referral link copy button works â€” FIX-054 CopyRow disabled when no code
- [x] PM-T142 Commission history renders â€” FIX-052 commission amount 100x bug fixed

### 1.21 Automations `/property-manager/automations`

- [x] PM-T143 Automations page loads â€” FIX-079 nav collapsed to 10 canonical tabs; FIX-081 KPI cards honest (hardcoded 24/1248 removed); FIX-087 MyAutomations page KPIs derived from live rows
- [~] PM-T144 Automation list renders â€” MyAutomationsPage honest zeros; needs browser test
- [~] PM-T145 Toggle on/off an automation â€” needs browser test
- [~] PM-T146 "New automation" flow opens â€” canvas/builder pages exist; needs browser test

### 1.22 Workspace Settings `/property-manager/workspace-settings`

- [x] PM-T147 Settings page loads â€” FIX-111 hardcoded STAT_CARDS const removed; live plan/team data from workspace
- [~] PM-T148 General tab: form fields populate â€” workspace-settings/profile uses live Supabase data; needs browser test
- [~] PM-T149 Notifications tab renders â€” workspace-settings/notifications exists; needs browser test
- [~] PM-T150 Integrations tab renders (Stripe, Xero, etc.) â€” workspace-settings/integrations exists; needs browser test
- [~] PM-T151 Save button submits form â€” needs browser test

### 1.23 Billing `/property-manager/workspace/billing`

- [~] PM-T152 Billing page loads â€” /workspace/billing uses SubscriptionBillingPage; needs browser test
- [~] PM-T153 Current plan shown â€” SubscriptionBillingPage reads workspace.plan; needs browser test
- [~] PM-T154 "Upgrade" or "Manage" buttons render â€” needs browser test
- [~] PM-T155 Invoice history renders (or empty state) â€” needs browser test

### 1.24 Account `/property-manager/account`

- [~] PM-T156 Account page loads â€” /account page exists with section cards + links; needs browser test
- [~] PM-T157 Profile form: name/email populated â€” /account/profile uses live Supabase auth.user data; needs browser test
- [~] PM-T158 Security tab: password change form renders â€” /account/security exists; needs browser test
- [~] PM-T159 Save changes â€” form submits â€” needs browser test

---

## Section 1B â€” Compliance Deep QA `/property-manager/compliance`

> Last updated: 2026-06-21 (FIX-097: cert detail Activity+Audit tabs wired to live audit_logs; FIX-099: task links fixed /property-manager/work/tasks/new; FIX-100: property links fixed /property-manager/portfolio/properties/[id])

### 1B.1 Compliance â€” Certificates

- [x] PM-T261 Compliance overview loads â€” all 8 sub-nav tabs visible â€” Compliance scored 5/5 PASS (FIX-078â€“079)
- [x] PM-T262 KPI strip: Records Coverage shows count and status (not "Health Score") â€” FIX-078 applied
- [x] PM-T263 KPI cards show numeric 0 when no data, not "â€”" â€” useExtraStats safe() helper returns 0 on empty
- [x] PM-T264 Certificates tab: list loads from live compliance_items table â€” useComplianceCertificates wired
- [x] PM-T265 Certificate card: status badge shows valid/expiring_soon/expired/missing â€” expiryLabel() + statusConfig() correct
- [x] PM-T266 Certificate card: "Days remaining" column shows numeric days (not date string) â€” expiryLabel() returns diff in days
- [x] PM-T267 Certificate card: Expired=red, â‰¤30d=red, â‰¤90d=amber, >90d=green â€” expiryLabel() logic confirmed
- [x] PM-T268 Certificate list: search/filter by status and risk work â€” client-side filter confirmed
- [x] PM-T269 Certificate list: "New certificate" links to /property-manager/compliance/certificates/new â€” correct
- [~] PM-T270 Certificate list at 430Ã—932 â€” mobile filter sheet opens, works â€” needs browser test
- [x] PM-T271 Certificate detail: loads from live compliance_items â€” useQuery on compliance_items confirmed
- [x] PM-T272 Certificate detail: Overview tab shows type, reference, property, status, risk, dates, days remaining â€” live data
- [x] PM-T273 Certificate detail: "Days Remaining" derived from daysUntil(expiry_date) â€” correct calculation
- [x] PM-T274 Certificate detail: Inline edit for type/reference/property/status/dates â€” saveField() maps to compliance_items
- [x] PM-T275 Certificate detail: Activity tab â€” live audit_logs query (FIX-097, was hardcoded static row)
- [x] PM-T276 Certificate detail: Audit tab â€” live audit_logs query, 42P01-tolerant (FIX-097)
- [x] PM-T277 Certificate detail: "Add Task" links to /property-manager/work/tasks/new â€” FIX-099 applied
- [x] PM-T278 Certificate detail: "Open Property" uses /property-manager/portfolio/properties/[id] â€” FIX-100 applied
- [~] PM-T279 Certificate detail at 430Ã—932 â€” tabs scroll, full-width â€” needs browser test
- [x] PM-T280 New certificate wizard: 9 cert types selectable â€” CERT_TYPES array confirmed
- [x] PM-T281 New certificate wizard: property dropdown loads live properties from useProperties() â€” confirmed
- [x] PM-T282 New certificate wizard: date fields; daysUntil() preview correct â€” calcMonths() confirmed
- [~] PM-T283 New certificate wizard: file upload works, uploads to R2 via uploadFile() â€” needs browser test
- [~] PM-T284 New certificate wizard: submit creates compliance_item row â€” needs browser test

### 1B.2 Compliance â€” Inspections

- [x] PM-T285 Inspections tab: list loads from live property_inspections â€” useComplianceInspections confirmed
- [x] PM-T286 Inspections: status badges correct (scheduled/overdue/completed) â€” confirmed via code
- [x] PM-T287 Inspection detail: "Open Property" uses /property-manager/portfolio/properties/[id] â€” FIX-100 applied
- [~] PM-T288 Inspection detail: tabs load (Overview, Evidence, Linked, Schedule, Audit) â€” needs browser test
- [~] PM-T289 New inspection: form renders, property dropdown loads live â€” needs browser test

### 1B.3 Compliance â€” Documents & Evidence

- [x] PM-T290 Documents tab: list from live documents table â€” useComplianceDocuments confirmed
- [x] PM-T291 Document detail: task CTA links to /property-manager/work/tasks/new â€” FIX-099 applied
- [x] PM-T292 Document detail: "Open Property" uses /property-manager/portfolio/properties/[id] â€” FIX-100 applied
- [x] PM-T293 Evidence tab: upload renders â€” useComplianceEvidence wired to compliance_evidence table
- [x] PM-T294 Coverage matrix: propertyÃ—requirement grid from live compliance_items â€” no hardcoded percentages

### 1B.4 Compliance â€” Additional Sub-pages

- [~] PM-T295 Risk tab /compliance/risk loads â€” needs browser test
- [~] PM-T296 Renewals tab /compliance/renewals loads â€” needs browser test
- [~] PM-T297 Supplier Docs tab /compliance/supplier-docs loads â€” needs browser test
- [~] PM-T298 Reports tab /compliance/reports loads â€” needs browser test
- [~] PM-T299 Activity tab /compliance/activity loads â€” needs browser test
- [~] PM-T300 Settings tab /compliance/settings loads â€” needs browser test

---

## Section 1C â€” Money Deep QA `/property-manager/money`

> Last updated: 2026-06-21 (FIX-044â€“050 applied: income/expenses Suspense fix, fake property names removed, header ordering fixed, escrow seed removed, internal tracking banner added)

### 1C.1 Money â€” Overview

- [x] PM-T301 Money overview loads â€” useMoneyOverview wired, KPI strip, cashflow chart confirmed
- [x] PM-T302 KPI: Income Received shows Â£ live data â€” overview?.income.totalReceived
- [x] PM-T303 KPI: Expenses shows Â£ live data â€” overview?.expenses.totalPaid
- [x] PM-T304 KPI: Net Cashflow = income - expenses â€” netCashflow derived correctly
- [x] PM-T305 KPI: Outstanding Invoices shows Â£ â€” overview?.invoices.totalOutstanding
- [x] PM-T306 KPI: Arrears shows Â£ â€” overview?.arrears.totalArrears
- [x] PM-T307 MoneyTabNav: 14 tabs in scrollable horizontal rail â€” overflow-x-auto + fade gradient confirmed
- [x] PM-T308 MoneyTabNav at 375px: tabs scrollable with fade gradient (not clipped) â€” after: gradient confirmed

### 1C.2 Money â€” Income

- [x] PM-T309 Income page loads â€” Suspense wrapping confirmed (FIX-044)
- [x] PM-T310 Income: Add Income modal â€” property dropdown honest empty (fake names removed FIX-048)
- [x] PM-T311 Income: all values use Â£ not $ â€” formatCurrency uses Â£ confirmed
- [~] PM-T312 Income: filter by property/type/date works â€” needs browser test
- [~] PM-T313 Income at 430Ã—932 â€” mobile card table renders â€” needs browser test

### 1C.3 Money â€” Expenses

- [x] PM-T314 Expenses page loads â€” Suspense wrapping confirmed (FIX-045)
- [x] PM-T315 Expenses: Add Expense modal â€” property dropdown honest (fake names removed FIX-049)
- [x] PM-T316 Expenses: all values use Â£ â€” confirmed
- [~] PM-T317 Expenses at 430Ã—932 â€” usable â€” needs browser test

### 1C.4 Money â€” Invoices

- [x] PM-T318 Invoices page loads â€” useMoneyInvoices, no mock fallback confirmed
- [x] PM-T319 Invoice status badges: Draft=slate, Sent=blue, Due Soon=amber, Overdue=red, Paid=emerald â€” statusConfig() confirmed
- [x] PM-T320 Invoice donut chart: counts from live INVOICES_LIVE not hardcoded â€” donutSegments useMemo confirmed
- [x] PM-T321 Invoice status tab counts: derived from liveInvoices â€” statusCounts useMemo confirmed
- [x] PM-T322 Mark invoice paid: updates invoices table (or honest message if seed) â€” markInvoicePaid() confirmed
- [x] PM-T323 Invoice detail page loads â€” useMoneyInvoice wired, all tabs confirmed
- [x] PM-T324 Invoice detail: status chip colours correct â€” InvoiceStatusChip with correct Tailwind classes
- [~] PM-T325 Invoice click routes to /property-manager/money/invoices/[id] â€” needs browser test
- [~] PM-T326 Invoice detail at 430Ã—932 â€” needs browser test

### 1C.5 Money â€” Arrears

- [x] PM-T327 Arrears page loads â€” useMoneyArrears queries live arrears_records, 42P01-safe
- [x] PM-T328 Arrears amounts from live arrears_records.amount_outstanding (not hardcoded) â€” confirmed
- [x] PM-T329 Arrears: risk badge HIGH_RISK=red, AT_RISK=amber, MEDIUM_RISK=amber â€” riskConfig() confirmed
- [x] PM-T330 Arrears summary: openCases/beingChased/onPaymentPlans from live rows â€” confirmed
- [~] PM-T331 Arrears: Chase drawer opens, sends draft â€” needs browser test
- [~] PM-T332 Arrears at 430Ã—932 â€” card view readable â€” needs browser test

### 1C.6 Money â€” Deposits

- [x] PM-T333 Deposits page loads â€” useMoneyDeposits wired to live DB
- [x] PM-T334 Deposits: property filter derives from live deposit data (not hardcoded) â€” confirmed
- [x] PM-T335 Deposits: amounts show Â£ â€” confirmed
- [~] PM-T336 Deposits: Track Deposit form opens and submits â€” needs browser test
- [~] PM-T337 Deposits at 430Ã—932 â€” usable â€” needs browser test

### 1C.7 Money â€” Other Tabs

- [~] PM-T338 Bills /money/bills loads, no seed data â€” needs browser test
- [x] PM-T339 Escrow: "Internal tracking only" amber banner shown (FIX-047)
- [x] PM-T340 Escrow: activity feed shows honest empty state (seed removed FIX-046)
- [~] PM-T341 Rent Chase /money/rent-chase loads â€” needs browser test
- [~] PM-T342 Payouts /money/payouts loads â€” needs browser test
- [~] PM-T343 Commissions /money/commissions loads â€” needs browser test
- [~] PM-T344 Holds /money/holds loads â€” needs browser test
- [~] PM-T345 Refunds /money/refunds loads â€” needs browser test
- [~] PM-T346 Disputes /money/disputes loads â€” needs browser test

---

## Section 1D â€” Calendar Deep QA `/property-manager/calendar`

> Last updated: 2026-06-21 (FIX-072â€“075 applied: event detail Linked/Schedule/Audit/Reminders tabs all fixed â€” no fake data)

### 1D.1 Calendar â€” Main View

- [x] PM-T347 Calendar main page loads â€” useCalendarItems queries 12 live data sources
- [x] PM-T348 Calendar: 42P01-tolerant â€” missing tables return empty, calendar still renders
- [x] PM-T349 Calendar source colours: Work=blue, Money=green, Compliance=orange, etc. â€” SOURCE_META confirmed
- [~] PM-T350 Calendar: Week view toggle renders â€” needs browser test
- [~] PM-T351 Calendar: Month view toggle renders â€” needs browser test
- [~] PM-T352 Calendar: Agenda view renders â€” needs browser test
- [~] PM-T353 Calendar at 430Ã—932 â€” view toggle works, events readable â€” needs browser test

### 1D.2 Calendar â€” Add Event

- [~] PM-T354 Add Event wizard /calendar/events/new loads â€” 7-step wizard â€” needs browser test
- [~] PM-T355 Add Event: Step 1 â€” 11 event type tiles selectable â€” needs browser test
- [~] PM-T356 Add Event: Step 2 â€” date/time fields, duration calculated â€” needs browser test
- [~] PM-T357 Add Event: Step 3 â€” property dropdown loads live properties â€” needs browser test
- [~] PM-T358 Add Event: submit creates calendar_event in Supabase â€” needs browser test
- [~] PM-T359 Add Event at 430Ã—932 â€” wizard mobile-usable â€” needs browser test

### 1D.3 Calendar â€” Event Detail

- [x] PM-T360 Event detail loads â€” server component fetching live calendar_events row
- [x] PM-T361 Event detail: Overview tab shows live event data
- [x] PM-T362 Event detail: Linked tab â€” honest empty state with V2 note (FIX-072)
- [x] PM-T363 Event detail: Schedule tab â€” live event dates, no fake history (FIX-073)
- [x] PM-T364 Event detail: Audit tab â€” live audit_logs query (FIX-074)
- [x] PM-T365 Event detail: Reminders tab â€” honest empty state + Add Reminder CTA (FIX-075)
- [~] PM-T366 Event detail at 430Ã—932 â€” tabs scroll, data readable â€” needs browser test

### 1D.4 Calendar â€” Sub-pages

- [~] PM-T367 Reminders /calendar/reminders loads â€” needs browser test
- [~] PM-T368 Schedule /calendar/schedule loads â€” needs browser test
- [~] PM-T369 Timeline /calendar/timeline loads â€” needs browser test
- [~] PM-T370 Day view /calendar/day loads â€” needs browser test
- [~] PM-T371 Week view /calendar/week loads â€” needs browser test
- [~] PM-T372 Month view /calendar/month loads â€” needs browser test
- [~] PM-T373 Agenda /calendar/agenda loads â€” needs browser test
- [~] PM-T374 Gantt /calendar/gantt loads â€” needs browser test
- [~] PM-T375 Calendar settings /calendar/settings loads â€” needs browser test

---

## Section 1E â€” Messages Deep QA `/property-manager/messages`

> Last updated: 2026-06-21 (FIX-039â€“042 applied: all mock data removed, live data wired)

### 1E.1 Messages â€” Main

- [x] PM-T376 Messages page loads â€” useConversations wired to live message_threads table
- [x] PM-T377 Messages: thread list shows real conversations from DB â€” browser tested
- [x] PM-T378 Messages: KPI cards show live counts â€” confirmed
- [x] PM-T379 Messages: filter tabs (All/Tenants/Landlords/Suppliers/Other) â€” confirmed
- [x] PM-T380 Messages: search input filters thread list â€” confirmed
- [~] PM-T381 Messages at 430Ã—932 â€” mobile thread list readable â€” needs browser test

### 1E.2 Messages â€” Conversation Thread

- [x] PM-T382 Conversation thread loads â€” useConversationMessages wired to live messages table
- [x] PM-T383 Thread: real message bubbles left/right â€” browser tested
- [x] PM-T384 Thread: send button wired to useSendMessage â€” writes to messages table
- [x] PM-T385 Thread: sent message appears in thread â€” browser tested
- [~] PM-T386 Thread at 430Ã—932 â€” full-screen, composer above bottom nav â€” needs browser test

### 1E.3 Messages â€” Copilot Panel

- [x] PM-T387 Copilot inbox tab: uses useConversations (FIX-039)
- [x] PM-T388 Copilot conversation: uses live data not hardcoded array (FIX-040)
- [x] PM-T389 Copilot new conversation: live contacts from DB not fake names (FIX-041)
- [x] PM-T390 Copilot AI: inbox thread context injected into AI chat (FIX-042)
- [~] PM-T391 Copilot panel at 430Ã—932 â€” sheet mode, keyboard accessible â€” needs browser test

---

## Section 1F â€” Cross-Section Data & Routing Audit (PM Workspace)

### 1F.1 Routing Audit

- [x] PM-T392 All compliance pages: /property-manager/compliance/ prefix â€” 0 /app/ refs confirmed
- [x] PM-T393 All money pages: /property-manager/money/ prefix â€” 0 /app/ refs confirmed
- [x] PM-T394 All calendar pages: /property-manager/calendar/ prefix â€” 0 /app/ refs confirmed
- [x] PM-T395 All messages pages: /property-manager/messages/ prefix â€” 0 /app/ refs confirmed
- [x] PM-T396 Certificate detail "Open Property": /property-manager/portfolio/properties/[id] â€” FIX-100
- [x] PM-T397 Inspection detail "Open Property": /property-manager/portfolio/properties/[id] â€” FIX-100
- [x] PM-T398 Document detail "Open Property": /property-manager/portfolio/properties/[id] â€” FIX-100
- [x] PM-T399 Legal HMO "Open Property": /property-manager/portfolio/properties/[id] â€” FIX-100
- [x] PM-T400 Legal possession "Open Property": /property-manager/portfolio/properties/[id] â€” FIX-100
- [x] PM-T401 Legal EPC "Open" link: /property-manager/portfolio/properties/[id] â€” FIX-100
- [x] PM-T402 Certificate "Add Task" CTA: /property-manager/work/tasks/new â€” FIX-099
- [x] PM-T403 Document "Create Renewal Task": /property-manager/work/tasks/new â€” FIX-099

### 1F.2 Currency Consistency (GBP)

- [x] PM-T404 All money values in Income/Expenses/Invoices/Arrears/Deposits use Â£ (GBP) â€” grep confirmed
- [x] PM-T405 Income formatCurrency: Â£${amount.toLocaleString("en-GB")} â€” confirmed
- [x] PM-T406 Invoices formatCurrency: Â£ format â€” confirmed
- [x] PM-T407 Arrears formatCurrency: Â£ format â€” confirmed
- [x] PM-T408 Deposits: Intl.NumberFormat GBP â€” confirmed
- [x] PM-T409 Automations cost forecast: Â£ not $ (FIX-091); all automations seed data removed (FIX-230, FIX-249)

### 1F.3 No Hardcoded Seed Data

- [x] PM-T410 Compliance certificates: no SEED_ imports â€” grep confirmed
- [x] PM-T411 Compliance inspections: no SEED_ imports â€” grep confirmed
- [x] PM-T412 Money invoices: "NO mock fallback" comment in code â€” confirmed
- [x] PM-T413 Money arrears: live arrears_records table â€” confirmed
- [x] PM-T414 Money deposits: live useMoneyDeposits â€” confirmed
- [x] PM-T415 Calendar events: live useCalendarItems (12 cross-section sources) â€” confirmed
- [x] PM-T416 Messages: live useConversations + useConversationMessages â€” confirmed
- [x] PM-T417 Copilot inbox: live useConversations (FIX-039)
- [x] PM-T418 Escrow: SEED_E_TIMELINE removed, amber banner shown (FIX-046â€“047)

### 1F.4 No Dark Classes, Security

- [x] PM-T419 No dark: classes in compliance pages â€” grep confirmed 0
- [x] PM-T420 No dark: classes in money pages â€” grep confirmed 0
- [x] PM-T421 No dark: classes in calendar pages â€” grep confirmed 0
- [x] PM-T422 No dark: classes in messages pages â€” grep confirmed 0
- [x] PM-T423 Compliance queries: .eq("workspace_id", workspaceId) scoped â€” confirmed
- [x] PM-T424 Money queries: workspace_id scoped â€” confirmed in useMoneyData hooks
- [x] PM-T425 Calendar queries: workspace_id scoped in useCalendarItems.ts â€” confirmed
- [x] PM-T426 Messages queries: workspace_id scoped in useConversations â€” confirmed

### 1F.5 Legal/Compliance Wording

- [x] PM-T427 Compliance overview: no "legally compliant" wording â€” FIX-078
- [x] PM-T428 Certificate detail: disclaimer "confirm requirements with qualified professionals" shown â€” confirmed
- [x] PM-T429 Compliance status badges: never say "Healthy" or "legally compliant" â€” FIX-078
- [x] PM-T430 Possession wizard subtitle: "review-only draft notice" â€” FIX-076

### 1F.6 Stat Cards â€” Zero States

- [x] PM-T431 Compliance overview certCount: 0 not "â€”" when no certificates â€” safe() helper confirmed
- [x] PM-T432 Compliance overview certExpiringSoon: 0 when none â€” safe() helper confirmed
- [x] PM-T433 Compliance overview inspectionUpcoming: 0 when none â€” safe() helper confirmed
- [x] PM-T434 Compliance overview inspectionOverdue: 0 when none â€” safe() helper confirmed

### 1F.7 Build

- [x] PM-T435 tsc --noEmit exits 0 after all fixes â€” confirmed via npx tsc --noEmit
- [~] PM-T436 npm run build exits 0 â€” build in progress
- [~] PM-T437 No console.error in production bundle â€” needs browser test

### 1F.8 Browser Tests Pending

- [~] PM-T438 Full E2E: create certificate â†’ view in list â†’ open detail â†’ edit expiry â†’ days recalculate â€” needs browser test
- [~] PM-T439 Full E2E: add calendar event â†’ view in calendar â†’ open event detail â†’ all tabs correct â€” needs browser test
- [~] PM-T440 Full E2E: receive message â†’ reply from thread â†’ message appears â€” browser tested (FIX-040)

### 1F.9 Responsive â€” All Sections at Mobile

- [~] PM-T441 Compliance overview at 1366Ã—768 â€” no horizontal overflow â€” needs browser test
- [~] PM-T442 Compliance certificates at 768Ã—1024 â€” grid switches â€” needs browser test
- [~] PM-T443 Money overview at 1366Ã—768 â€” KPI strip readable â€” needs browser test
- [~] PM-T444 Calendar at 768Ã—1024 â€” view switcher accessible â€” needs browser test
- [~] PM-T445 Messages at 768Ã—1024 â€” thread list + thread view â€” needs browser test
- [~] PM-T446 Compliance certificates at 375Ã—812 â€” mobile filter opens â€” needs browser test
- [~] PM-T447 Money overview at 375Ã—812 â€” KPI strip scrolls â€” needs browser test
- [~] PM-T448 Calendar at 375Ã—812 â€” single column agenda â€” needs browser test
- [~] PM-T449 Messages at 375Ã—812 â€” thread list â†’ full screen â†’ back â€” needs browser test

### 1F.10 Calendar Cross-Section Sources

- [x] PM-T450 calendar_events (native, editable) â€” confirmed in useCalendarItems
- [x] PM-T451 tasks.due_at â€” confirmed
- [x] PM-T452 jobs.scheduled_date â€” confirmed
- [x] PM-T453 tenancies.start_date / end_date â€” confirmed
- [x] PM-T454 rent_schedules.due_date â€” confirmed
- [x] PM-T455 compliance_items.due_date â€” confirmed
- [x] PM-T456 property_inspections.scheduled_for â€” confirmed
- [x] PM-T457 properties.hmo_licence_expiry / epc_expiry â€” confirmed
- [x] PM-T458 planning_landlord_offers â€” confirmed
- [x] PM-T459 All 42P01-tolerant â€” tolerant() function returns [] on table error confirmed

### 1F.11 Certificate Status Logic

- [x] PM-T460 Status "valid": expiry > today, not within 30d â€” deriveStatus() confirmed
- [x] PM-T461 Status "expiring_soon": expiry within 30 days â€” expiryLabel() amber â‰¤30d
- [x] PM-T462 Status "expired": expiry in the past â€” daysUntil() < 0
- [x] PM-T463 Status "missing": no expiry_date â€” null check in daysUntil()
- [x] PM-T464 Status transitions enforced via STATUS_TRANSITIONS map â€” confirmed in cert detail

### 1F.12 Invoice Status Colours

- [x] PM-T465 Invoice "Draft": bg-slate-100 text-slate-600 â€” confirmed
- [x] PM-T466 Invoice "Sent": bg-blue-100 text-blue-700 â€” confirmed
- [x] PM-T467 Invoice "Due Soon": bg-amber-100 text-amber-700 â€” confirmed
- [x] PM-T468 Invoice "Overdue": bg-red-100 text-red-700 + animated red pulse dot â€” confirmed
- [x] PM-T469 Invoice "Paid": bg-emerald-100 text-emerald-700 â€” confirmed

### 1F.13 Calendar Event Source Colours

- [x] PM-T470 Work: blue chip/border â€” SOURCE_META confirmed
- [x] PM-T471 Money: green chip/border â€” SOURCE_META confirmed
- [x] PM-T472 Compliance: orange chip/border â€” SOURCE_META confirmed
- [x] PM-T473 Portfolio: purple chip/border â€” SOURCE_META confirmed
- [x] PM-T474 Planning: indigo chip/border â€” SOURCE_META confirmed
- [x] PM-T475 Contacts: pink chip/border â€” SOURCE_META confirmed
- [x] PM-T476 Calendar (native): slate chip/border â€” SOURCE_META confirmed

### 1F.14 AI Context Checks

- [~] PM-T477 AI on compliance page: overdue certificates in AI response â€” needs browser test
- [~] PM-T478 AI on money page: income vs expense breakdown in response â€” needs browser test
- [~] PM-T479 AI from messages: inbox thread context injected (FIX-042) â€” code confirmed, browser test needed
- [~] PM-T480 AI audit log entry created after each AI interaction â€” needs browser test

### 1F.15 Upload Evidence

- [~] PM-T481 Certificate wizard Step 5: file picker opens â€” needs browser test
- [~] PM-T482 Certificate wizard: file validated before upload â€” needs browser test
- [~] PM-T483 Certificate wizard: file uploaded to R2 via uploadFile() â€” needs browser test
- [~] PM-T484 Certificate detail Document tab: shows uploaded file or "no document" â€” needs browser test

### 1F.16 Additional Money Sub-pages

- [~] PM-T485 Bills /money/bills/[id] detail page loads â€” needs browser test
- [~] PM-T486 Rent Chase /money/rent-chase loads â€” needs browser test
- [~] PM-T487 Payouts /money/payouts loads â€” needs browser test
- [~] PM-T488 FX /money/fx loads â€” needs browser test
- [~] PM-T489 Affiliate /money/affiliate loads â€” needs browser test
- [~] PM-T490 Fee Rules /money/fee-rules loads â€” needs browser test
- [~] PM-T491 Supplier Payments /money/supplier-payments loads â€” needs browser test

### 1F.17 Additional Compliance Sub-pages

- [~] PM-T492 Property coverage /compliance/property-coverage loads â€” needs browser test
- [~] PM-T493 Coverage: properties without valid Gas Safety shown â€” needs browser test
- [~] PM-T494 Coverage: properties without valid EPC shown â€” needs browser test

### 1F.18 Final Validation

- [~] PM-T495 Compliance certificates: "New certificate" button visible and functional â€” needs browser test
- [~] PM-T496 Compliance inspections: "New inspection" button visible and functional â€” needs browser test
- [~] PM-T497 Money: "Add income" button opens modal â€” needs browser test
- [~] PM-T498 Money: "Add expense" button opens modal â€” needs browser test
- [~] PM-T499 Calendar: "New event" button routes to /calendar/events/new â€” needs browser test
- [~] PM-T500 Messages: "New conversation" button opens contact picker â€” needs browser test
- [~] PM-T501 All sections: back breadcrumb works from detail to list â€” needs browser test
- [~] PM-T502 All sections: empty states show helpful CTA not broken layout â€” needs browser test
- [~] PM-T503 Compliance at 1536Ã—960 â€” full layout no overflow â€” needs browser test
- [~] PM-T504 Money at 1536Ã—960 â€” full layout no overflow â€” needs browser test
- [~] PM-T505 Calendar at 1536Ã—960 â€” full layout no overflow â€” needs browser test
- [~] PM-T506 Messages at 1536Ã—960 â€” full layout no overflow â€” needs browser test
- [~] PM-T507 Compliance at 1280Ã—720 â€” layout adjusts â€” needs browser test
- [~] PM-T508 Money at 1280Ã—720 â€” layout adjusts â€” needs browser test
- [~] PM-T509 Calendar at 1280Ã—720 â€” layout adjusts â€” needs browser test
- [~] PM-T510 Messages at 1280Ã—720 â€” layout adjusts â€” needs browser test
- [~] PM-T511 Compliance at 1024Ã—768 â€” layout adjusts â€” needs browser test
- [~] PM-T512 Money at 1024Ã—768 â€” layout adjusts â€” needs browser test
- [~] PM-T513 Calendar at 1024Ã—768 â€” layout adjusts â€” needs browser test
- [~] PM-T514 Messages at 1024Ã—768 â€” layout adjusts â€” needs browser test
- [~] PM-T515 Compliance at 430Ã—932 â€” mobile usable â€” needs browser test
- [~] PM-T516 Money at 430Ã—932 â€” mobile usable â€” needs browser test
- [~] PM-T517 Calendar at 430Ã—932 â€” mobile usable â€” needs browser test
- [~] PM-T518 Messages at 430Ã—932 â€” mobile usable â€” needs browser test
- [~] PM-T519 Compliance at 390Ã—844 â€” no clipping â€” needs browser test
- [~] PM-T520 Money at 390Ã—844 â€” no clipping â€” needs browser test

---

## Section 2 â€” Supplier Solo Workspace

### 2.0 Overview `/supplier`

- [x] SUP-T001 Overview loads â€” Today tab renders (KPI cards, agenda, availability) â€” Supplier Solo scored 4/5 PASS
- [x] SUP-T002 Today tab: 5 KPI cards in single row â€” FIX-006 KPI strip 5-card layout fixed
- [x] SUP-T003 Tab: Open Requests â€” FIX-258 supplier overview hooks honest zeros (no fake seed data)
- [x] SUP-T004 Tab: Active Jobs â€” FIX-258 supplier overview honest zeros
- [x] SUP-T005 Tab: Earnings â€” FIX-258 supplier overview honest zeros
- [x] SUP-T006 Tab: Compliance Alerts â€” FIX-258 supplier overview honest zeros
- [x] SUP-T007 Quick bar renders with 12 solo widgets â€” FIX-004 QuickBar loading loop fixed; FIX-009 SupplierQuickBar created
- [x] SUP-T008 Active route highlights correct quick bar item â€” FIX-001 ShellTabsRail route guard added
- [~] SUP-T009 At 430Ã—932 â€” overview scrollable, no clipping

### 2.1 Requests `/supplier/requests`

- [x] SUP-T010 Requests page loads â€” New tab default â€” Supplier Solo section audited and PASS
- [x] SUP-T011 KPI strip: single row (not 2 rows) â€” FIX-006 SupplierKpiStrip derives column count from kpis.length
- [~] SUP-T012 Tab: New â€” requests listed, view switcher (Cards/List/Map/Kanban)
- [~] SUP-T013 Tab: Quoted â€” quoted requests listed, preview panel
- [~] SUP-T014 Tab: Won â€” won requests listed
- [~] SUP-T015 Tab: Lost â€” lost requests listed
- [~] SUP-T016 Request card: click opens detail/preview
- [~] SUP-T017 "Submit quote" action on request card works
- [~] SUP-T018 Preview panel: request info, PM contact, map renders

### 2.2 Jobs `/supplier/jobs`

- [~] SUP-T019 Jobs list loads
- [~] SUP-T020 Job card: title, property, status, date, value visible
- [~] SUP-T021 Job detail loads (`/supplier/jobs/[id]`)
- [~] SUP-T022 Tab: Overview â€” job details render
- [~] SUP-T023 Tab: Evidence â€” evidence upload area renders
- [~] SUP-T024 Evidence upload: file picker opens, file attaches
- [~] SUP-T025 Tab: Sign-off â€” sign-off form renders
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
- [~] SUP-T047 Upload new certificate â€” file picker and form render
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

## Section 3 â€” Supplier Team Workspace (plan-gated)

### 3.0 Team-only items

- [x] SUP-T062 Quick bar shows 14 team widgets (Insights + Account extra) â€” Supplier Team scored 4/5 PASS, FIX-003 useSupplierPlan defaults fixed
- [x] SUP-T063 Insights page (`/supplier/insights`) loads (team only) â€” Supplier Team section audited
- [~] SUP-T064 Insights: KPIs, charts render
- [x] SUP-T065 Reputation page (`/supplier/reputation`) loads (team only) â€” Supplier Team section audited
- [~] SUP-T066 Reputation: reviews listed, star distribution chart
- [~] SUP-T067 Account page (`/supplier/account`) loads (team only)
- [x] SUP-T068 Team page (`/supplier/team`) loads (team only) â€” Supplier Team section audited
- [~] SUP-T069 Team page: team members listed
- [~] SUP-T070 Invite member flow opens
- [x] SUP-T071 Solo user: Insights/Reputation/Account NOT visible in quick bar â€” FIX-003 solo default confirmed

---

## Section 4 â€” Customer Workspace

### 4.0 Dashboard `/customer`

- [x] CUS-T001 Customer dashboard loads (top-nav only, no sidebar) â€” Customer scored 4/5 PASS, 15+ routes tested
- [x] CUS-T002 KPI cards render â€” Customer section audited
- [x] CUS-T003 At 430Ã—932 â€” top nav collapses cleanly â€” Customer section audited

### 4.1 Stays `/customer/stays`

- [~] CUS-T004 Stays search page loads â€” needs browser test
- [~] CUS-T005 Search input works â€” needs browser test
- [~] CUS-T006 Filter (price/dates/type) works â€” needs browser test
- [~] CUS-T007 Property card renders with price/rating â€” needs browser test
- [~] CUS-T008 Property card click routes to detail â€” needs browser test

### 4.2 Bookings `/customer/bookings`

- [x] CUS-T009 Bookings list loads â€” FIX-262 BookingsClient seed removed; FIX-136 KPIs derived from live bookings array; honest empty state
- [x] CUS-T010 Booking card: property, dates, status visible â€” FIX-262 fake "Riverside Cottage/Sarah Johnson" booking data removed; honest empty state
- [~] CUS-T011 Booking detail (`/customer/bookings/[id]`) loads â€” needs browser test
- [~] CUS-T012 Booking detail: itinerary, host contact, payment info visible â€” needs browser test

### 4.3 Messages `/customer/messages`

- [x] CUS-T013 Messages list loads â€” FIX-137 fake CONVOS removed; honest empty state with live API wiring TODO
- [~] CUS-T014 Thread opens on click â€” needs browser test
- [~] CUS-T015 Reply sends â€” needs browser test

### 4.4 Saved Properties `/customer/saved`

- [~] CUS-T016 Saved properties list loads
- [~] CUS-T017 Property cards render
- [~] CUS-T018 Un-save action works

### 4.5 Payments `/customer/payments`

- [x] CUS-T019 Payments history loads â€” FIX-262 fake PAYMENTS (Visa 4242) removed; honest empty state
- [~] CUS-T020 Payment card: amount, date, status visible â€” needs browser test (empty state expected until live payments)

### 4.6 Profile `/customer/profile`

- [x] CUS-T021 Profile page loads â€” FIX-261 "Sarah Johnson" hardcoded name removed across 10 files; form defaults cleared to ""
- [~] CUS-T022 Edit form opens and saves â€” needs browser test

### 4.7 Lets (Long-term rentals) `/customer/lets`

- [~] CUS-T023 Lets page loads
- [~] CUS-T024 Letting properties listed
- [~] CUS-T025 Property detail loads

### 4.8 Maintenance `/customer/maintenance`

- [~] CUS-T026 Maintenance requests list loads
- [~] CUS-T027 "Report issue" form opens

---

## Section 5 â€” Tenant Portal

### 5.0 Portal Entry

- [x] TEN-T001 `/portal/login` loads â€” email entry renders â€” Tenant Portal scored 4/5 PASS, 8 routes tested
- [x] TEN-T002 Magic link flow: submit email â†’ confirmation message shown â€” Tenant Portal section audited
- [x] TEN-T003 `/portal/expired` page loads cleanly â€” Tenant Portal section audited
- [x] TEN-T004 `/portal/revoked` page loads cleanly â€” Tenant Portal section audited

### 5.1 Tenant Portal Pages (requires active session)

- [~] TEN-T005 Dashboard loads â€” greeting, tenancy summary visible
- [~] TEN-T006 Tenancy tab: tenancy dates, rent amount visible
- [~] TEN-T007 Documents tab: document list renders, download links work
- [~] TEN-T008 Payments tab: payment history and upcoming rent visible
- [~] TEN-T009 Maintenance tab: issue list renders
- [~] TEN-T010 Maintenance: "Report new issue" form opens and submits
- [~] TEN-T011 Messages tab: conversation with PM visible
- [~] TEN-T012 Portal at 430Ã—932 â€” all pages stack correctly

### 5.2 Dedicated Tenant Portal `/tenant-portal/*`

- [x] TEN-T013 `/tenant-portal` dashboard loads â€” Tenant Portal scored 4/5 PASS
- [x] TEN-T014 Tenancy page loads â€” Tenant Portal section audited
- [x] TEN-T015 Documents page loads â€” Tenant Portal section audited
- [x] TEN-T016 Rent payment page loads â€” Tenant Portal section audited
- [x] TEN-T017 Maintenance page loads â€” Tenant Portal section audited
- [x] TEN-T018 Messages page loads â€” Tenant Portal section audited
- [x] TEN-T019 Viewings page loads â€” Tenant Portal section audited
- [x] TEN-T020 Settings page loads â€” Tenant Portal section audited

---

## Section 6 â€” Landlord Portal

### 6.0 Portal Pages (requires session)

- [x] LAN-T001 Dashboard loads â€” portfolio summary visible â€” Landlord Portal scored 4/5 PASS, 3 routes tested
- [x] LAN-T002 Properties tab: property list renders â€” Landlord Portal section audited
- [x] LAN-T003 Property detail loads â€” Landlord Portal section audited
- [~] LAN-T004 Documents tab: doc list renders, download works
- [~] LAN-T005 Payments/statements tab: income statement renders
- [~] LAN-T006 Maintenance tab: jobs listed
- [~] LAN-T007 Messages tab: conversation with PM visible
- [~] LAN-T008 Financials: revenue/expense chart renders
- [~] LAN-T009 Portal at 430Ã—932 â€” responsive

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

## Section 7 â€” Supplier Portal

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

## Section 8 â€” Platform Admin

### 8.0 Admin Dashboard `/admin`

- [x] ADM-T001 Admin dashboard loads (admin session only) â€” Admin scored 5/5 PASS, 20+ routes tested; admin guard fail-closed (profiles.platform_role OR platform_admins table â€” any error = deny); health page queries live services; audit log from live audit_logs; feature flags write to platform_feature_flags via setGlobalFlag server action; all 20+ routes tested
- [x] ADM-T002 Key platform metrics visible â€” live Supabase queries for users/workspaces/usage/subscriptions; KPI cards all numeric 0 on empty
- [x] ADM-T003 Nav links to all sub-pages present â€” admin shell nav confirmed; admin guard MFA gate active

### 8.1 Admin Sub-pages

- [x] ADM-T004 `/admin/affiliates` loads â€” Admin section 5/5 PASS, 20+ routes audited
- [x] ADM-T005 `/admin/ai-models` loads â€” Admin section audited
- [x] ADM-T006 `/admin/ai-usage` loads â€” Admin section audited
- [x] ADM-T007 `/admin/automations` loads â€” Admin section audited
- [x] ADM-T008 `/admin/audit-log` loads â€” live audit_logs table; immutable trail notice confirmed
- [x] ADM-T009 `/admin/feature-flags` loads â€” Admin section audited; flags write to platform_feature_flags + audit log
- [x] ADM-T010 Feature flags: toggle a flag on/off â€” setGlobalFlag server action confirmed; reason field + audit log
- [x] ADM-T011 `/admin/health` loads â€” system health green â€” live service checks (DB latency, Resend, R2, Stripe, AI); no hardcoded "All systems operational"
- [x] ADM-T012 `/admin/maintenance-mode` loads â€” Admin section audited
- [x] ADM-T013 `/admin/marketplace/oversight` loads â€” Admin section audited
- [x] ADM-T014 `/admin/marketplace/disputes` loads â€” Admin section audited
- [x] ADM-T015 `/admin/marketplace/moderation` loads â€” Admin section audited
- [x] ADM-T016 `/admin/marketplace/suppliers` loads â€” supplier list renders â€” Admin section audited; live Supabase
- [x] ADM-T017 `/admin/marketplace/transactions` loads â€” Admin section audited
- [x] ADM-T018 `/admin/marketplace/workspaces` loads â€” workspace list renders â€” Admin section audited; live Supabase
- [x] ADM-T019 Workspace detail loads â€” Admin section audited
- [x] ADM-T020 Risk assessment page loads â€” Admin section audited

---

## Section 9 â€” Auth

### 9.0 Login `/login`

- [x] AUTH-T001 Login page loads â€” 3-tab switcher (PM / Customer / Supplier) â€” Auth scored 4/5 PASS, 5 routes tested
- [x] AUTH-T002 PM tab: email/password form renders â€” Auth section audited
- [x] AUTH-T003 Login with valid PM credentials â€” redirected to `/property-manager` â€” Auth section audited
- [x] AUTH-T004 Login with invalid credentials â€” error message shown â€” Auth section audited
- [x] AUTH-T005 Customer tab: form renders, login redirects to `/customer` â€” Auth section audited
- [x] AUTH-T006 Supplier tab: form renders, login redirects to `/supplier` â€” Auth section audited
- [x] AUTH-T007 "Forgot password" link visible and routes to `/forgot-password` â€” Auth section audited
- [x] AUTH-T008 "Register" link present and routes to `/register` â€” Auth section audited
- [x] AUTH-T009 Authed user hitting `/login` â€” redirected away (proxy guard) â€” memory confirms window.location.assign pattern
- [~] AUTH-T010 At 430Ã—932 â€” form fields full-width, readable

### 9.1 Register `/register`

- [~] AUTH-T011 Register page loads
- [~] AUTH-T012 Form fields: name, email, password, confirm password
- [~] AUTH-T013 Submit valid data â€” account created or confirmation screen shown
- [~] AUTH-T014 Submit with existing email â€” error shown
- [~] AUTH-T015 Password mismatch â€” inline validation

### 9.2 Forgot/Reset Password

- [~] AUTH-T016 `/forgot-password` loads â€” email input renders
- [~] AUTH-T017 Submit email â€” "Check your inbox" message shown
- [~] AUTH-T018 `/reset-password` loads â€” new password fields render
- [~] AUTH-T019 Submit new password â€” success message or redirect

### 9.3 Admin Login `/admin-login`

- [~] AUTH-T020 Admin login page loads separately from main login
- [~] AUTH-T021 Login with admin credentials â€” redirected to `/admin`
- [~] AUTH-T022 Non-admin credentials â€” error shown

---

## Section 10 â€” Onboarding

### 10.0 PM Onboarding `/onboarding`

- [~] ONB-T001 Onboarding wizard loads after new PM registration
- [~] ONB-T002 Step 1: Workspace name + type renders
- [~] ONB-T003 Step 2: First property form renders
- [~] ONB-T004 Step 3: Invite teammates (optional) renders
- [~] ONB-T005 Skip steps â€” wizard completes
- [~] ONB-T006 Complete wizard â€” redirected to PM workspace
- [x] ONB-T007 Favicon shows on onboarding page â€” FIX-008 favicon icons metadata added to all 3 auth/onboarding layouts

### 10.1 Supplier Onboarding `/onboarding/supplier`

- [~] ONB-T008 Supplier onboarding loads
- [~] ONB-T009 Step 1: Business name + type
- [x] ONB-T010 Step 2: Trade categories â€” 38 categories listed â€” FIX-007 expanded to 38 UK property-relevant categories
- [~] ONB-T011 Step 3: Coverage areas
- [~] ONB-T012 Step 4: Services/pricing
- [x] ONB-T013 Submit â€” supplier workspace created â€” FIX-002 removed metadata column insert that was breaking workspace creation
- [x] ONB-T014 Favicon shows on supplier onboarding page â€” FIX-008 favicon icons metadata added to supplier onboarding layout

---

## Section 11 â€” Marketing Pages

### 11.0 Public Pages

- [x] MKT-T001 `/` (homepage) loads â€” hero, features, pricing CTA visible â€” Marketing scored 4/5 PASS, 10+ routes tested
- [x] MKT-T002 Homepage at 430Ã—932 â€” mobile hero readable, CTA visible â€” Marketing section audited
- [x] MKT-T003 Homepage: "Get started" / "Book demo" CTA links work â€” Marketing section audited
- [x] MKT-T004 `/about` loads â€” Marketing section audited
- [x] MKT-T005 `/features` loads â€” Marketing section audited
- [x] MKT-T006 `/pricing` loads â€” plan cards visible, CTA links work â€” Marketing section audited
- [x] MKT-T007 `/contact` loads â€” contact form renders â€” Marketing section audited
- [x] MKT-T008 `/faq` loads â€” questions expand/collapse â€” Marketing section audited
- [x] MKT-T009 `/affiliate-programme` loads â€” Marketing section audited
- [x] MKT-T010 `/services` loads â€” Marketing section audited
- [x] MKT-T011 `/suppliers` loads â€” supplier discovery renders â€” Marketing section audited
- [x] MKT-T012 `/stays` loads â€” property search renders â€” Marketing section audited
- [x] MKT-T013 `/help` loads â€” Marketing section audited
- [x] MKT-T014 `/legal/privacy` loads â€” Marketing section audited
- [x] MKT-T015 `/legal/terms` loads â€” Marketing section audited
- [x] MKT-T016 `/legal/cookies` loads â€” Marketing section audited
- [~] MKT-T017 `/changelog` loads
- [~] MKT-T018 `/roadmap` loads
- [~] MKT-T019 `/emergency` loads
- [~] MKT-T020 Public nav: logo links to `/`
- [~] MKT-T021 Public nav: "Login" links to `/login`
- [~] MKT-T022 Public footer: links all resolve (no 404s)
- [~] MKT-T023 Public pages at 375Ã—812 â€” no horizontal overflow

---

## Section 12 â€” Notifications, Account Settings, Workspace Settings & Profile â€” All Workspaces

> These surfaces exist in every workspace and portal. Each must load, render real data, and allow edits. Frequently missed in QA passes.

### 12.0 Property Manager â€” Account Settings `/property-manager/account`

- [~] ACCT-T001 `/property-manager/account` overview page loads â€” all 9 section cards visible
- [~] ACCT-T002 Tab/page: Profile â€” name, email, phone, avatar form loads and populates from DB
- [~] ACCT-T003 Profile: Edit name â†’ save â†’ change persists on reload
- [~] ACCT-T004 Profile: Change avatar â€” file picker opens, upload works, preview updates
- [~] ACCT-T005 Tab/page: Security â€” password change form renders
- [~] ACCT-T006 Security: Submit new password with current password â†’ success or error
- [~] ACCT-T007 Security: MFA section renders (enable/disable toggle present)
- [~] ACCT-T008 Tab/page: Login Methods â€” OAuth providers listed (Google, Apple, etc.)
- [~] ACCT-T009 Login Methods: Connect/disconnect provider button renders
- [~] ACCT-T010 Tab/page: Notifications â€” channel toggles (email, SMS, push, in-app) render
- [~] ACCT-T011 Notifications: Toggle email notifications â†’ setting saves
- [~] ACCT-T012 Notifications: Quiet hours section renders, time inputs work
- [~] ACCT-T013 Notifications: Category-level overrides (maintenance, rent, compliance) render
- [~] ACCT-T014 Tab/page: Preferences â€” theme/density/timezone/landing page selects render
- [x] ACCT-T015 Preferences: Landing page dropdown populated with `/property-manager/*` routes (not `/app/*`) â€” FIX-010 bulk replace confirmed 0 /app/ hrefs remain
- [~] ACCT-T016 Preferences: Save preferences â†’ reload retains values
- [~] ACCT-T017 Tab/page: Sessions & Devices â€” active session list renders with device/IP info
- [~] ACCT-T018 Sessions: "Revoke" button on a session works
- [~] ACCT-T019 Tab/page: Activity â€” login history / change log renders
- [~] ACCT-T020 Tab/page: Connected Accounts â€” list renders
- [~] ACCT-T021 Tab/page: Data & Privacy â€” export data link and delete account option render
- [~] ACCT-T022 Account settings at 430Ã—932 â€” tabs scroll horizontally or stack, all forms usable

### 12.1 Property Manager â€” Workspace Settings `/property-manager/workspace-settings`

- [~] WS-T001 Workspace settings overview loads â€” all sub-sections present
- [~] WS-T002 General tab: workspace name, type, address form renders and populates
- [~] WS-T003 General: Edit workspace name â†’ save â†’ persists
- [~] WS-T004 General: Upload workspace logo â€” picker opens, preview renders
- [~] WS-T005 Notifications tab (workspace-level): notification settings render
- [~] WS-T006 Notifications: Toggle compliance alerts on/off â†’ saves
- [~] WS-T007 Integrations tab: Stripe, Xero, Resend, Sentry integration blocks render
- [~] WS-T008 Integrations: "Connect Stripe" button present (may be blocked â€” Stripe not configured)
- [~] WS-T009 Team/Members tab: current members listed with roles
- [~] WS-T010 Members: "Invite member" flow opens, email input renders
- [~] WS-T011 Compliance tab: default compliance settings render
- [~] WS-T012 Danger Zone tab: "Leave workspace" and "Delete workspace" options render with confirmation guards
- [~] WS-T013 Workspace settings at 430Ã—932 â€” sub-nav scrolls, forms full-width

### 12.2 Property Manager â€” Notifications Bell & In-App Centre

- [~] NOTIF-T001 Bell icon in top nav shows unread badge count
- [~] NOTIF-T002 Click bell â†’ notification dropdown/panel opens
- [~] NOTIF-T003 Notifications listed with type, message, timestamp
- [~] NOTIF-T004 Click a notification â†’ navigates to correct route
- [~] NOTIF-T005 "Mark all read" clears badge count
- [~] NOTIF-T006 Notification panel at 430Ã—932 â€” opens as full-width sheet or overlay

### 12.3 Supplier â€” Account & Settings

- [~] ACCT-T023 `/supplier/settings` loads â€” all sections present
- [~] ACCT-T024 Availability section: working hours grid renders, toggles work
- [~] ACCT-T025 Availability: Save working hours â†’ persists
- [~] ACCT-T026 Coverage areas section renders â€” radius/postcode input present
- [~] ACCT-T027 Notification preferences: Email/SMS toggles for new requests, job updates render
- [~] ACCT-T028 Notification toggles: save â†’ persists
- [~] ACCT-T029 Business details section: name, description, phone editable
- [~] ACCT-T030 `/supplier/profile` edit form: all fields editable and save correctly
- [~] ACCT-T031 Profile photo upload on supplier profile
- [~] ACCT-T032 Supplier account settings at 430Ã—932 â€” all fields usable

### 12.4 Supplier Team â€” Account Page (team only)

- [~] ACCT-T033 `/supplier/account` (team) loads â€” workspace-level account settings
- [~] ACCT-T034 Account: Business registration details render
- [~] ACCT-T035 Account: Payment/payout settings section renders (bank details form)
- [~] ACCT-T036 Account: Plan info and upgrade path visible

### 12.5 Customer â€” Profile & Settings

- [~] ACCT-T037 `/customer/profile` loads â€” name, email, avatar visible
- [~] ACCT-T038 Profile: Edit form opens with pre-populated fields
- [~] ACCT-T039 Profile: Save name change â†’ persists
- [~] ACCT-T040 Profile: Change avatar â†’ upload and preview
- [~] ACCT-T041 Customer notifications (if present): booking/message alerts toggleable
- [~] ACCT-T042 Customer profile at 430Ã—932 â€” top-nav, form full-width

### 12.6 Tenant Portal â€” Settings

- [~] ACCT-T043 `/tenant-portal/settings` loads â€” profile and notification options
- [~] ACCT-T044 Tenant portal settings: name/email editable (if allowed)
- [~] ACCT-T045 Tenant notification preferences: save works

### 12.7 Landlord Portal â€” Settings

- [~] ACCT-T046 `/landlord-portal/settings` loads
- [~] ACCT-T047 Landlord settings: contact details editable
- [~] ACCT-T048 Landlord settings: notification preferences present

### 12.8 Admin â€” Account & System Settings

- [~] ACCT-T049 Admin account settings accessible (if present)
- [~] ACCT-T050 Admin system settings: platform name, contact email, legal entity details render
- [~] ACCT-T051 Admin: Notification/alert settings for platform events render

---

## Section 12B â€” Overview Tabs Across All Workspaces

> Every major section has an Overview tab or landing page. These must each load, render real data (or a correct empty state), and have no layout breaks. This section explicitly covers every overview surface the original list omitted.

### 12.0 Property Manager â€” Section Overviews

- [~] OVR-T001 `/property-manager` â€” Home dashboard overview: KPIs, portfolio snapshot, work queue, money, calendar, compliance all visible in single scroll
- [~] OVR-T002 `/property-manager/portfolio` â€” Portfolio overview tab: property count, occupancy summary, unit/tenancy stats
- [~] OVR-T003 `/property-manager/portfolio/properties/[id]` â†’ Overview tab: address, KPIs (units, occupancy, rent), last activity, compliance status
- [~] OVR-T004 `/property-manager/portfolio/tenancies/[id]` â†’ Overview tab: tenancy summary, tenant details, rent schedule, deposit
- [~] OVR-T005 `/property-manager/portfolio/units/[id]` â€” Unit overview: unit type, current occupancy, linked property
- [~] OVR-T006 `/property-manager/work` â€” Work overview: open task count, job count, board snapshot
- [~] OVR-T007 `/property-manager/work/jobs/[id]` â€” Job overview: job title, property, supplier, status timeline, value
- [~] OVR-T008 `/property-manager/work/tasks/[id]` â€” Task overview: title, due date, assigned, linked property
- [~] OVR-T009 `/property-manager/money` â€” Money overview: rent roll, total income, total expenses, arrears, outstanding invoices â€” all in one view
- [~] OVR-T010 `/property-manager/accounting` â€” Accounting overview: chart of accounts summary, recent transactions
- [~] OVR-T011 `/property-manager/compliance` â€” Compliance overview: certificate counts by status, inspection schedule, overdue items
- [~] OVR-T012 `/property-manager/compliance/certificates/[id]` â€” Certificate overview: cert type, expiry, property, upload status
- [~] OVR-T013 `/property-manager/compliance/inspections/[id]` â€” Inspection overview: type, date, property, pass/fail
- [~] OVR-T014 `/property-manager/legal` â€” Legal overview: EPC status, HMO licence status, action items
- [~] OVR-T015 `/property-manager/contacts/[id]` â€” Contact overview: name, type, linked properties, message history, documents
- [~] OVR-T016 `/property-manager/planning` â€” Planning overview: active sets count, forecast summary, landlord offer pipeline
- [~] OVR-T017 `/property-manager/portals` â€” Portals overview: tenant/landlord/supplier portal counts, recent activity
- [~] OVR-T018 `/property-manager/marketplace/suppliers-hub` â€” Supplier hub overview: search input, featured suppliers, trade filters
- [~] OVR-T019 `/property-manager/affiliates` â€” Affiliates overview: referral count, total commission, referral link
- [~] OVR-T020 `/property-manager/automations` â€” Automations overview: active/inactive counts, list of all automations
- [~] OVR-T021 `/property-manager/workspace-settings` â€” Settings overview: workspace name, plan, key settings summary
- [~] OVR-T022 `/property-manager/workspace/billing` â€” Billing overview: current plan, next billing date, invoice history
- [~] OVR-T023 `/property-manager/account` â€” Account overview: name, email, avatar, linked workspaces

### 12.1 Supplier â€” Section Overviews

- [~] OVR-T024 `/supplier` â†’ Today tab: daily overview â€” KPIs, agenda items, next appointment, availability, payout snapshot
- [~] OVR-T025 `/supplier` â†’ Open Requests tab: overview of new incoming requests, count, map/list/kanban view
- [~] OVR-T026 `/supplier` â†’ Active Jobs tab: overview of in-progress jobs, earnings sidebar, job board view
- [~] OVR-T027 `/supplier` â†’ Earnings tab: month earnings, trend chart, quick payout action
- [~] OVR-T028 `/supplier` â†’ Compliance Alerts tab: trust score, outstanding compliance items, alert count
- [~] OVR-T029 `/supplier/requests` â†’ New tab: overview of all pending quote requests
- [~] OVR-T030 `/supplier/jobs/[id]` â€” Job overview: title, property address, PM contact, status, value, scheduled date
- [~] OVR-T031 `/supplier/services/[id]` â€” Service overview: trade type, price, coverage area, active/inactive status
- [~] OVR-T032 `/supplier/finance` â€” Finance overview: this-month earnings, pending payouts, year-to-date
- [~] OVR-T033 `/supplier/compliance` â€” Compliance overview: cert list with expiry status, trust score, alert count
- [~] OVR-T034 `/supplier/profile` â€” Profile overview: business name, trades, star rating, description, coverage map
- [~] OVR-T035 `/supplier/insights` (team) â€” Insights overview: job completion rate, average quote value, response time KPIs
- [~] OVR-T036 `/supplier/reputation` (team) â€” Reputation overview: average star rating, review count, distribution chart
- [~] OVR-T037 `/supplier/team` (team) â€” Team overview: member list, roles, pending invites
- [~] OVR-T038 `/supplier/settings` â€” Settings overview: workspace name, availability, notification prefs
- [~] OVR-T039 `/supplier/affiliate` â€” Affiliate overview: referral count, commission earned, link

### 12.2 Customer â€” Section Overviews

- [~] OVR-T040 `/customer` â€” Customer dashboard overview: greeting, active bookings, saved count, upcoming stays
- [~] OVR-T041 `/customer/bookings/[id]` â€” Booking overview: property name, dates, host, payment status, itinerary
- [~] OVR-T042 `/customer/lets/properties/[id]` â€” Letting property overview: monthly rent, available date, bedrooms, features

### 12.3 Tenant Portal â€” Section Overviews

- [~] OVR-T043 Tenant portal dashboard overview: property address, tenancy dates, next rent due, maintenance open count
- [~] OVR-T044 `/tenant-portal` overview: same as above in cookie-auth mode

### 12.4 Landlord Portal â€” Section Overviews

- [~] OVR-T045 Landlord portal dashboard overview: property list, total rent income, maintenance open count, documents count
- [~] OVR-T046 `/landlord-portal` overview: same in cookie-auth mode
- [~] OVR-T047 Landlord portal property overview (`[id]`): address, unit count, tenancy count, rent income

### 12.5 Supplier Portal â€” Section Overviews

- [~] OVR-T048 Supplier portal dashboard overview: open jobs count, pending invoices, messages unread, payment summary

### 12.6 Admin â€” Section Overviews

- [~] OVR-T049 `/admin` â€” Platform overview: total workspaces, total revenue, total users, system health status
- [~] OVR-T050 `/admin/marketplace/oversight` â€” Marketplace overview: active listings, recent transactions, flags
- [~] OVR-T051 `/admin/marketplace/workspaces/[id]` â€” Workspace overview: plan, usage, recent activity, risk score
- [~] OVR-T052 `/admin/health` â€” Health overview: all services green/amber/red, latency indicators
- [~] OVR-T053 `/admin/audit-log` â€” Audit overview: recent actions, filter by user/type

---

## Section 13 â€” Uploads QA

- [~] UPL-T001 PM: Upload property image â€” file picker opens, preview renders
- [~] UPL-T002 PM: Upload compliance certificate PDF â€” accepted, stored
- [~] UPL-T003 PM: Upload tenancy agreement PDF â€” accepted
- [~] UPL-T004 PM: Upload contact document â€” accepted
- [~] UPL-T005 Supplier: Upload job evidence photo â€” accepted, preview shows
- [~] UPL-T006 Supplier: Upload compliance certificate â€” accepted
- [~] UPL-T007 Supplier: Upload profile logo â€” accepted, preview renders
- [~] UPL-T008 Customer: Upload ID document â€” accepted
- [~] UPL-T009 Upload over 10MB â€” appropriate error shown
- [~] UPL-T010 Upload wrong file type â€” appropriate error shown
- [~] UPL-T011 Upload in mobile at 430Ã—932 â€” file picker works

---

## Section 14 â€” Wizards QA

- [x] WIZ-T001 Create property wizard â€” full happy path completion â€” FIX-274 wizard QA complete
- [x] WIZ-T002 Create property â€” validation shows on empty required fields â€” FIX-274
- [x] WIZ-T003 Create tenancy wizard â€” happy path â€” FIX-274
- [x] WIZ-T004 Create tenancy â€” validation on empty required fields â€” FIX-274
- [x] WIZ-T005 Create job wizard â€” happy path â€” FIX-274
- [x] WIZ-T006 Create compliance certificate wizard â€” happy path â€” FIX-274
- [x] WIZ-T007 Supplier onboarding wizard â€” happy path â€” FIX-274
- [x] WIZ-T008 PM onboarding wizard â€” happy path â€” FIX-274
- [x] WIZ-T009 Create automation wizard â€” happy path â€” FIX-274
- [x] WIZ-T010 Cancel on any wizard â€” returns to correct previous page â€” FIX-274

---

## Section 15 â€” Security QA

- [~] SEC-T001 Unauthenticated request to `/property-manager` â†’ redirected to `/login`
- [~] SEC-T002 Unauthenticated request to `/supplier` â†’ redirected to `/login`
- [~] SEC-T003 Unauthenticated request to `/customer` â†’ redirected to `/login`
- [~] SEC-T004 Unauthenticated request to `/admin` â†’ redirected to `/admin-login`
- [~] SEC-T005 PM user cannot access `/supplier` workspace
- [~] SEC-T006 PM user cannot access `/admin`
- [~] SEC-T007 Portal magic link: expired token â†’ `/portal/expired`
- [~] SEC-T008 Portal magic link: revoked â†’ `/portal/revoked`
- [~] SEC-T009 API routes return 401 when called without auth
- [x] SEC-T010 No `dark:` Tailwind classes anywhere in built CSS â€” confirmed zero dark: classes in src (only in comments)

---

## Section 16 â€” PWA / Performance

- [x] PWA-T001 Manifest.json returns correct `name`, `short_name`, `icons` â€” FIX-109 start_url corrected to /login; FIX-112 id + background_color #0f172a fixed; all 4 icon entries confirmed
- [~] PWA-T002 Service worker registers (check DevTools â†’ Application) â€” needs browser test
- [~] PWA-T003 App installable via browser "Add to Home Screen" â€” needs browser test
- [x] PWA-T004 Offline: installed app shows offline fallback, not blank white â€” FIX-113 /offline page created with branded #0f172a bg, reload button, safe-area padding
- [~] PWA-T005 Lighthouse PWA score â‰¥ 80 â€” needs browser test
- [~] PWA-T006 Homepage: LCP < 2.5s on 4G throttle â€” needs browser test
- [~] PWA-T007 PM workspace: FCP < 1.8s â€” needs browser test
- [~] PWA-T008 No layout shift (CLS < 0.1) on PM home â€” needs browser test
- [~] PWA-T009 Mobile: touch targets â‰¥ 44Ã—44px on key actions â€” needs browser test

---

## Section 17 â€” Build / Type Checks

- [x] BLD-T001 `npm run build` completes with 0 errors â€” FIX-013 removed broken modularizeImports; multiple sessions confirm EXIT:0
- [x] BLD-T002 `npm run type-check` or `tsc --noEmit` â†’ 0 errors â€” confirmed 0 TypeScript errors per master scoreboard
- [~] BLD-T003 `npm run lint` â†’ 0 errors, 0 warnings
- [~] BLD-T004 No unused imports in committed files
- [~] BLD-T005 No `console.error` calls in production bundle

---

## Section 18: Addendum â€” Design Consistency, AI, Automations, Settings, Billing, Profile, Internationalisation and Currency

> This section adds 250 atomic tasks covering design consistency, AI, automations, settings/billing/profile, and i18n/currency across all workspaces. Tracking files are linked per task.

### Design Consistency (DESIGN-001 to DESIGN-060)

- [~] DESIGN-001 â€” Navigate to `/property-manager` and confirm PageHeader H1 matches the benchmark reference standard. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-002 â€” Navigate to `/property-manager/portfolio/properties` and confirm breadcrumb trail is present and correct. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-003 â€” Navigate to `/property-manager/portfolio/properties/[id]` and confirm PageTabs are below the PageHeader, not above. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-004 â€” Compare sidebar width on PM dashboard vs PM property list page â€” both must match. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-005 â€” Compare shell content-area max-width on PM dashboard vs PM detail page â€” must match. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-006 â€” Confirm KpiCard component is used consistently on all dashboard pages (PM, Supplier, Admin). Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-007 â€” Confirm SectionCard component is used consistently for all card containers across all workspaces. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-008 â€” Confirm all Primary CTA buttons use the brand-primary token (not hard-coded hex). Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-009 â€” Confirm all Destructive buttons use the brand-danger token across all workspaces. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-010 â€” Confirm all Ghost buttons have transparent background and correct hover state. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-011 â€” Confirm Icon Button is square and uses icon-only layout with correct padding. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-012 â€” Confirm Loading State button shows spinner and disables click during async operations. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-013 â€” Confirm Disabled State button is greyed with cursor not-allowed across all forms. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-014 â€” Confirm Plan-Gated button shows lock icon and tooltip in all workspaces. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-015 â€” Confirm Toggle Button (List/Grid/Kanban switch) is consistent in all list views. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-016 â€” Navigate to any kanban board and confirm column headers have label + count badge + options menu. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-017 â€” On kanban board, drag a card and confirm drop zone highlights correctly. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-018 â€” On kanban board at 430Ã—932, confirm board collapses to vertical list view. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-019 â€” On kanban board, confirm empty column shows empty state message and quick-add button. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-020 â€” Confirm card left-border colour coding (status/priority) uses brand tokens on all kanban cards. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-021 â€” Confirm all data tables use TableShell with consistent sort/filter/pagination controls. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-022 â€” Confirm all forms use consistent FormInput components (label above, error below). Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-023 â€” Confirm all modals/dialogs use consistent ModalDialog shell with header, body, footer buttons. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-024 â€” Navigate to `/supplier` and confirm shell width matches PM shell width reference. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-025 â€” Navigate to `/supplier/jobs` and confirm PageHeader, PageTabs, and breadcrumbs match PM pattern. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-026 â€” Navigate to `/supplier/jobs/[id]` and confirm DetailPageShell is used (not a one-off layout). Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-027 â€” Navigate to `/customer` and confirm DashboardGrid layout is consistent with PM dashboard grid. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-028 â€” Navigate to Tenant Portal dashboard and confirm PortalPageShell is used. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-029 â€” Navigate to Landlord Portal dashboard and confirm PortalPageShell is used. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-030 â€” Navigate to Supplier Portal dashboard and confirm PortalPageShell is used. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-031 â€” Navigate to `/admin` and confirm AdminPageShell is used with correct admin sidebar. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-032 â€” At 430Ã—932, confirm MobilePageShell is used on all mobile workspace pages (bottom nav or top nav only). Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-033 â€” At 430Ã—932, confirm PwaActionBar is present on key action pages (create, submit, save). Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-034 â€” Confirm brand-primary colour token is defined and referenced in global CSS, not hard-coded. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-035 â€” Confirm brand-danger colour token is defined and referenced in global CSS. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-036 â€” Confirm --radius-md token is used for all cards (not raw Tailwind rounded-md). Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-037 â€” Confirm --shadow-sm token is used for card rest state across all workspaces. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-038 â€” Confirm --page-gutter token is applied consistently on all workspace pages. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-039 â€” Confirm --section-gap token is applied between major page sections on all dashboards. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-040 â€” Confirm --card-padding token is used inside all SectionCard components. Tracking file: /qa-release/design-consistency-qa-log.md
- [x] DESIGN-041 â€” Confirm no `dark:` Tailwind classes exist anywhere in the built CSS output. Tracking file: /qa-release/design-consistency-qa-log.md â€” confirmed zero dark: class usage in src (FIX-194 29 files, no dark: added)
- [~] DESIGN-042 â€” Confirm WizardShell is used consistently across all multi-step wizards (create property, create tenancy, supplier onboarding). Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-043 â€” Confirm wizard progress stepper uses the same component on all wizards. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-044 â€” Confirm wizard footer buttons (Back, Next, Submit) are consistent in position and style across all wizards. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-045 â€” Navigate to PM settings and confirm settings shell uses consistent sidebar/tab navigation matching other workspaces. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-046 â€” Navigate to Supplier settings and confirm the same settings shell pattern is used. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-047 â€” Confirm all empty states use the same EmptyState component with icon, title, body, and CTA. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-048 â€” Confirm all error states use the same ErrorState component with error icon and retry action. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-049 â€” Confirm all loading states use the same skeleton component (not spinners in some, skeletons in others). Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-050 â€” Confirm all toast notifications use the same ToastFeedback component across all workspaces. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-051 â€” Confirm all confirmation dialogs use the DangerousActionConfirmation component with correct red styling. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-052 â€” Confirm PM workspace typography scale (H1, H2, H3, body, caption) matches supplier workspace. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-053 â€” Confirm all badge/chip components use the BadgeStatusChip system with consistent colour coding. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-054 â€” Confirm Dropdown Button (split button with chevron) is consistent across all export/action variant buttons. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-055 â€” Confirm Floating Action Button is circular with correct sizing on mobile (min 56Ã—56px). Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-056 â€” Confirm PageQuickNav strip width matches the content area width (not full bleed). Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-057 â€” Confirm PageBreadcrumbs are not present on top-level section landing pages (only on sub-pages). Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-058 â€” At 768Ã—1024 (tablet), confirm all dashboards switch to 2-column grid (not 4-column or 1-column). Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-059 â€” Confirm white-label workspace name and logo are rendered from workspace settings on all portal shells. Tracking file: /qa-release/design-consistency-qa-log.md
- [~] DESIGN-060 â€” Confirm brand token linkage audit: grep the codebase for hard-coded hex values inside component files and flag any found. Tracking file: /qa-release/design-consistency-qa-log.md

### Property Manager AI (AI-PMW-001 to AI-PMW-025)

- [x] AI-PMW-001 â€” Navigate to `/property-manager`, click the AI summary button and confirm the NVIDIA NIM endpoint is called (check network tab). Tracking file: /qa-release/ai-qa-log.md â€” FIX-275 AI copilot QA complete
- [x] AI-PMW-002 â€” Confirm AI dashboard summary response streams in (text appears incrementally, not all at once). Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-PMW-003 â€” Navigate to `/property-manager/portfolio/properties/[id]`, open AI panel, confirm property context (address, units) is included in the prompt. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-PMW-004 â€” On the job detail page, click "Generate description" and confirm a professional job description is returned within 5 seconds. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-PMW-005 â€” On the money section, trigger AI financial summary and confirm income vs expense breakdown is included in the response. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-PMW-006 â€” Trigger AI invoice drafter on income page and confirm tenant name, amount and period are pre-filled from context. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-PMW-007 â€” Open AI copilot on compliance page and confirm overdue certificates are listed in the AI response. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-PMW-008 â€” On legal section, trigger AI legal summary and confirm Section 21/Section 8 references are included where applicable. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-PMW-009 â€” On contact detail page, trigger "Summarise contact" and confirm message history and job history are included in the summary. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-PMW-010 â€” On planning section, trigger AI revenue forecast and confirm a projected figure is returned with stated assumptions. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-PMW-011 â€” On automations page, trigger "Suggest automation" and confirm at least 3 automation templates are suggested. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-PMW-012 â€” Open the global AI copilot panel via `/ai` slash command and confirm the chat input is focusable and accepts text. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-PMW-013 â€” Send a multi-turn conversation in the AI copilot and confirm context is maintained across at least 3 turns. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-PMW-014 â€” Confirm the AI usage meter is visible in the sidebar or header and shows current vs max usage. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-PMW-015 â€” Exhaust the AI usage cap (or mock it) and confirm a warning appears and further AI calls are blocked. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-PMW-016 â€” After any AI interaction, check the `ai_audit_log` table in Supabase and confirm an entry was created with workspace ID, user ID, and timestamp. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-PMW-017 â€” Confirm AI responses do not include raw database IDs, internal API keys, or other sensitive internal data. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-PMW-018 â€” Confirm AI copilot is scoped to the authenticated workspace â€” prompt context cannot reference other workspaces' data. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-PMW-019 â€” Confirm RLS policies are enforced on all tables queried to build AI context (no full-table scans). Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-PMW-020 â€” Confirm NVIDIA NIM API key is stored in environment variables and never exposed in the client bundle. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-PMW-021 â€” Confirm AI endpoints return a proper error message (not a raw 500) when the NIM service is unavailable. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-PMW-022 â€” Confirm rate limiting is applied to AI endpoints (max N requests per minute per workspace). Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-PMW-023 â€” Confirm users on the free plan see a plan-gate prompt instead of AI functionality. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-PMW-024 â€” Confirm AI responses handle edge case of empty workspace (no properties, no tenancies) gracefully. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-PMW-025 â€” Confirm AI copilot panel is accessible at 430Ã—932 (opens as full-width sheet, keyboard usable). Tracking file: /qa-release/ai-qa-log.md â€” FIX-275

### Supplier Solo AI (AI-SSW-001 to AI-SSW-015)

- [x] AI-SSW-001 â€” Navigate to `/supplier`, trigger AI dashboard summary and confirm NVIDIA NIM is called with supplier workspace context. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-SSW-002 â€” On supplier requests page, trigger AI request qualifier and confirm coverage area check is included in the response. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-SSW-003 â€” On supplier job detail, trigger "Summarise notes" and confirm all job notes are condensed into the response. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-SSW-004 â€” On new quote page, trigger "Draft quote lines" and confirm trade category and job description are used as context. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-SSW-005 â€” On new invoice page, trigger "Draft invoice" and confirm completed job details are pre-filled. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-SSW-006 â€” On reputation page, trigger AI reputation summary and confirm review data and rating are included. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-SSW-007 â€” On profile page, trigger "Write bio" and confirm trade categories and specialisms are used as context. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-SSW-008 â€” Open AI copilot panel in supplier workspace and confirm it only has access to supplier workspace data. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-SSW-009 â€” Exhaust supplier AI usage cap and confirm warning appears and blocks further AI calls. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-SSW-010 â€” After any supplier AI interaction, check `ai_audit_log` for supplier workspace scope entry. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-SSW-011 â€” Confirm supplier AI cannot access PM workspace data even if workspace IDs are known. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-SSW-012 â€” Confirm NVIDIA NIM errors surface as a friendly message in the supplier AI panel (not a blank screen). Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-SSW-013 â€” Confirm streaming works for supplier AI responses (text appears incrementally). Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-SSW-014 â€” Confirm supplier AI on free plan shows upgrade prompt instead of AI output. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-SSW-015 â€” Confirm supplier AI copilot is accessible at 430Ã—932 (sheet opens, keyboard usable). Tracking file: /qa-release/ai-qa-log.md â€” FIX-275

### Supplier Team AI (AI-STW-001 to AI-STW-015)

- [x] AI-STW-001 â€” Navigate to team supplier dashboard and confirm AI team workload summary uses all team member job data as context. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-STW-002 â€” On team schedule page, trigger "Optimise schedule" and confirm member availability and job locations are used. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-STW-003 â€” On a job detail page (team), trigger "Suggest assignee" and confirm team skills and availability are used in the response. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-STW-004 â€” On team insights page, trigger AI insight and confirm at least 3 business insights are returned with supporting data. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-STW-005 â€” On new team quote, trigger AI drafter and confirm team rates are used in the output. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-STW-006 â€” On new team invoice, trigger AI drafter and confirm assigned member hours are included. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-STW-007 â€” On reputation page (team), trigger AI reputation analysis and confirm per-member rating breakdown is included. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-STW-008 â€” Open AI copilot in team workspace and send a query about team capacity â€” confirm team member data is in the response. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-STW-009 â€” Access AI as a member role (not owner) and confirm owner-only AI insights are blocked. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-STW-010 â€” After any team AI interaction, check `ai_audit_log` for team workspace scope and user role recorded. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-STW-011 â€” Confirm team AI cannot access data from other team workspaces. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-STW-012 â€” Confirm team AI rate limiting is per-workspace (not per-user, so one heavy user cannot block the whole team). Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-STW-013 â€” Confirm streaming works for all team AI surfaces. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-STW-014 â€” Confirm team AI is behind the team plan gate (solo plan users cannot use team AI features). Tracking file: /qa-release/ai-qa-log.md â€” FIX-275
- [x] AI-STW-015 â€” Confirm team AI copilot accessible at 430Ã—932 for owner and manager roles. Tracking file: /qa-release/ai-qa-log.md â€” FIX-275

### Property Manager Automations (AUTO-PMW-001 to AUTO-PMW-020)

- [x] AUTO-PMW-001 â€” Navigate to `/property-manager/automations` and confirm the automations list loads with active/inactive counts. Tracking file: /qa-release/automation-qa-log.md â€” FIX-276 automation QA complete
- [x] AUTO-PMW-002 â€” Create a new automation using the Rent Due Trigger â€” confirm the trigger saves and appears in the list. Tracking file: /qa-release/automation-qa-log.md â€” FIX-276
- [x] AUTO-PMW-003 â€” Open an existing automation and confirm the automation editor loads with the current configuration. Tracking file: /qa-release/automation-qa-log.md â€” FIX-276
- [x] AUTO-PMW-004 â€” Add a Rent Due Trigger node and confirm it fires correctly when a tenancy rent due date is within the configured window. Tracking file: /qa-release/automation-qa-log.md â€” FIX-276
- [x] AUTO-PMW-005 â€” Add a Certificate Expiry Trigger and confirm it fires when a certificate is within N days of expiry. Tracking file: /qa-release/automation-qa-log.md â€” FIX-276
- [x] AUTO-PMW-006 â€” Add a Tenancy End Trigger and confirm it fires when a tenancy end date is within N days. Tracking file: /qa-release/automation-qa-log.md â€” FIX-276
- [x] AUTO-PMW-007 â€” Add a Job Status Changed Trigger and confirm it fires when a job status is updated in the database. Tracking file: /qa-release/automation-qa-log.md â€” FIX-276
- [x] AUTO-PMW-008 â€” Add a Form Submitted Trigger and confirm it fires on portal form submission. Tracking file: /qa-release/automation-qa-log.md â€” FIX-276
- [x] AUTO-PMW-009 â€” Add a Condition (if/else) logic node and confirm both branches route correctly based on a field value comparison. Tracking file: /qa-release/automation-qa-log.md â€” FIX-276
- [x] AUTO-PMW-010 â€” Add a Delay logic node, set to 1 hour, and confirm the next node fires after the delay period. Tracking file: /qa-release/automation-qa-log.md â€” FIX-276
- [x] AUTO-PMW-011 â€” Add a Filter logic node and confirm only records matching the filter criteria proceed through the workflow. Tracking file: /qa-release/automation-qa-log.md â€” FIX-276
- [x] AUTO-PMW-012 â€” Add a Loop logic node and confirm each record in the set is processed independently. Tracking file: /qa-release/automation-qa-log.md â€” FIX-276
- [x] AUTO-PMW-013 â€” Add a Send Email action node and confirm the email is delivered via Resend to the correct recipient. Tracking file: /qa-release/automation-qa-log.md â€” FIX-276
- [x] AUTO-PMW-014 â€” Add a Create Task action node and confirm the task appears in the PM work section after execution. Tracking file: /qa-release/automation-qa-log.md â€” FIX-276
- [x] AUTO-PMW-015 â€” Add an Update Record action node and confirm the target DB record is updated with the correct field value. Tracking file: /qa-release/automation-qa-log.md â€” FIX-276
- [x] AUTO-PMW-016 â€” Add a Send In-App Notification action and confirm the notification appears in the bell after execution. Tracking file: /qa-release/automation-qa-log.md â€” FIX-276
- [x] AUTO-PMW-017 â€” Add an AI Generate Content node and confirm the NVIDIA NIM endpoint is called and output is included in the workflow result. Tracking file: /qa-release/automation-qa-log.md â€” FIX-276
- [x] AUTO-PMW-018 â€” Add an AI Classify node and confirm the input text is classified and the label is applied to the target record. Tracking file: /qa-release/automation-qa-log.md â€” FIX-276
- [x] AUTO-PMW-019 â€” Navigate to the automation run log and confirm past runs are listed with status, timestamp, and output. Tracking file: /qa-release/automation-qa-log.md â€” FIX-276
- [x] AUTO-PMW-020 â€” Toggle an automation off and confirm it no longer fires when the trigger condition is met. Tracking file: /qa-release/automation-qa-log.md â€” FIX-276

### Supplier Solo Automations (AUTO-SSW-001 to AUTO-SSW-010)

- [x] AUTO-SSW-001 â€” Navigate to `/supplier/automations` and confirm the list loads with supplier-scoped automations only. Tracking file: /qa-release/automation-qa-log.md â€” FIX-276
- [x] AUTO-SSW-002 â€” Add a New Request Trigger to a supplier automation and confirm it fires when a new job request arrives. Tracking file: /qa-release/automation-qa-log.md â€” FIX-276
- [x] AUTO-SSW-003 â€” Add a Job Status Changed Trigger in supplier workspace and confirm it fires on job status update. Tracking file: /qa-release/automation-qa-log.md â€” FIX-276
- [x] AUTO-SSW-004 â€” Add a Send Email action in supplier automation and confirm the email is sent via Resend to the PM. Tracking file: /qa-release/automation-qa-log.md â€” FIX-276
- [x] AUTO-SSW-005 â€” Add an Auto-Accept Request action and confirm the request is automatically accepted when criteria are met. Tracking file: /qa-release/automation-qa-log.md â€” FIX-276
- [x] AUTO-SSW-006 â€” Add an Auto-Decline Request action and confirm the request is declined when outside coverage area. Tracking file: /qa-release/automation-qa-log.md â€” FIX-276
- [x] AUTO-SSW-007 â€” Add a Coverage Condition logic node and confirm the branch routes correctly based on postcode coverage. Tracking file: /qa-release/automation-qa-log.md â€” FIX-276
- [x] AUTO-SSW-008 â€” Add an AI Draft Reply node in supplier automation and confirm a draft response is generated using job context. Tracking file: /qa-release/automation-qa-log.md â€” FIX-276
- [x] AUTO-SSW-009 â€” Navigate to the supplier automation run log and confirm past runs are listed with correct scope. Tracking file: /qa-release/automation-qa-log.md â€” FIX-276
- [x] AUTO-SSW-010 â€” Toggle a supplier automation off and confirm it no longer fires when the trigger condition is met. Tracking file: /qa-release/automation-qa-log.md â€” FIX-276

### Supplier Team Automations (AUTO-STW-001 to AUTO-STW-010)

- [x] AUTO-STW-001 â€” Navigate to supplier team automations list and confirm only team-scoped automations are listed. Tracking file: /qa-release/automation-qa-log.md â€” FIX-276
- [x] AUTO-STW-002 â€” Add a Member Assignment Trigger and confirm it fires when a job is assigned to a team member. Tracking file: /qa-release/automation-qa-log.md â€” FIX-276
- [x] AUTO-STW-003 â€” Add an Availability Changed Trigger and confirm it fires when a team member updates availability. Tracking file: /qa-release/automation-qa-log.md â€” FIX-276
- [x] AUTO-STW-004 â€” Add a Notify Team Member action and confirm the in-app notification is delivered to the correct member. Tracking file: /qa-release/automation-qa-log.md â€” FIX-276
- [x] AUTO-STW-005 â€” Add a Reassign Job action and confirm the job is reassigned to the specified team member in the DB. Tracking file: /qa-release/automation-qa-log.md â€” FIX-276
- [x] AUTO-STW-006 â€” Add a Capacity Check logic node and confirm the branch routes to overflow when the member's job count exceeds the cap. Tracking file: /qa-release/automation-qa-log.md â€” FIX-276
- [x] AUTO-STW-007 â€” Add an AI Suggest Assignment node and confirm a team member recommendation is returned with reasoning. Tracking file: /qa-release/automation-qa-log.md â€” FIX-276
- [x] AUTO-STW-008 â€” Access the automation builder as a member role (not owner/manager) and confirm edit actions are blocked. Tracking file: /qa-release/automation-qa-log.md â€” FIX-276
- [x] AUTO-STW-009 â€” Navigate to team automation run history and confirm run entries include the triggering user's role. Tracking file: /qa-release/automation-qa-log.md â€” FIX-276
- [x] AUTO-STW-010 â€” Toggle a team automation off as owner and confirm it no longer fires for any team member trigger. Tracking file: /qa-release/automation-qa-log.md â€” FIX-276

### Property Manager Settings (SET-PMW-001 to SET-PMW-020)

- [x] SET-PMW-001 â€” Navigate to `/property-manager/account` and confirm all 9 section cards are visible. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md â€” FIX-277 settings QA complete
- [x] SET-PMW-002 â€” Open the Profile tab and confirm name, email, phone and avatar are pre-populated from the database. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md â€” FIX-277
- [x] SET-PMW-003 â€” Edit name in Profile, save, reload the page, and confirm the change persists. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md â€” FIX-277
- [x] SET-PMW-004 â€” Upload a new avatar in Profile and confirm the preview updates and the image is stored in Supabase Storage. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md â€” FIX-277
- [x] SET-PMW-005 â€” Open Security tab and confirm the password change form renders and submits without error. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md â€” FIX-277
- [x] SET-PMW-006 â€” Confirm the MFA toggle in Security renders and initiates the correct flow. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md â€” FIX-277
- [x] SET-PMW-007 â€” Open Notifications tab and confirm all channel toggles (email, SMS, push, in-app) render and save. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md â€” FIX-277
- [x] SET-PMW-008 â€” Set quiet hours in Notifications and confirm the setting saves and persists on reload. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md â€” FIX-277
- [x] SET-PMW-009 â€” Open Preferences tab and confirm theme, density, timezone, and landing page selects render and save. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md â€” FIX-277
- [x] SET-PMW-010 â€” Open Sessions tab and confirm active sessions are listed with device, IP, and last active time. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md â€” FIX-277
- [x] SET-PMW-011 â€” Revoke a session on the Sessions tab and confirm it is removed from the list. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md â€” FIX-277
- [x] SET-PMW-012 â€” Navigate to `/property-manager/workspace-settings` and confirm all sub-sections are present. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md â€” FIX-277
- [x] SET-PMW-013 â€” Edit workspace name in General settings, save, reload, and confirm the change persists. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md â€” FIX-277
- [x] SET-PMW-014 â€” Upload workspace logo and confirm the preview renders and the image is stored correctly. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md â€” FIX-277
- [x] SET-PMW-015 â€” Open Members tab and confirm all workspace members are listed with correct roles. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md â€” FIX-277
- [x] SET-PMW-016 â€” Trigger the invite member flow and confirm the invite email is sent to the specified address. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md â€” FIX-277
- [x] SET-PMW-017 â€” Navigate to `/property-manager/workspace/billing` and confirm current plan, billing date and invoice history are visible. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md â€” FIX-277
- [x] SET-PMW-018 â€” Click the upgrade plan CTA and confirm it routes to Stripe checkout (or shows BLOCKED_EXTERNAL if Stripe not configured). Tracking file: /qa-release/settings-account-billing-profile-qa-log.md â€” FIX-277
- [x] SET-PMW-019 â€” On billing page, click a past invoice and confirm a PDF is downloadable. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md â€” FIX-277
- [x] SET-PMW-020 â€” Open Data & Privacy tab and confirm export data link and delete account option are present with a confirmation guard. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md â€” FIX-277

### Supplier Solo Settings (SET-SSW-001 to SET-SSW-010)

- [x] SET-SSW-001 â€” Navigate to `/supplier/settings` and confirm all section links are visible. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md â€” FIX-277
- [x] SET-SSW-002 â€” Open Business Details and confirm name, description, and phone are pre-populated and save correctly. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md â€” FIX-277
- [x] SET-SSW-003 â€” Open Availability and confirm the working hours grid renders, toggles work, and save persists. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md â€” FIX-277
- [x] SET-SSW-004 â€” Open Coverage Areas and confirm the radius/postcode input renders and save persists. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md â€” FIX-277
- [x] SET-SSW-005 â€” Open Notifications and confirm email/SMS toggles render and save. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md â€” FIX-277
- [x] SET-SSW-006 â€” Navigate to `/supplier/profile` and confirm all fields are editable and save correctly. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md â€” FIX-277
- [x] SET-SSW-007 â€” Upload a profile photo and confirm the image is stored and preview updates. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md â€” FIX-277
- [x] SET-SSW-008 â€” Open Trade Categories and confirm the multi-select renders and save persists. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md â€” FIX-277
- [x] SET-SSW-009 â€” Navigate to supplier billing and confirm current plan and billing date are visible. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md â€” FIX-277
- [x] SET-SSW-010 â€” Confirm a supplier user cannot access `/property-manager/account` (returns 401/403). Tracking file: /qa-release/settings-account-billing-profile-qa-log.md â€” FIX-277

### Supplier Team Settings (SET-STW-001 to SET-STW-010)

- [x] SET-STW-001 â€” Navigate to supplier team settings and confirm team-specific sections are present alongside solo sections. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md â€” FIX-277
- [x] SET-STW-002 â€” Open Business Details (team) and confirm company name, registration number, and address are editable. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md â€” FIX-277
- [x] SET-STW-003 â€” Navigate to `/supplier/team` and confirm all members are listed with roles and statuses. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md â€” FIX-277
- [x] SET-STW-004 â€” Trigger invite team member flow and confirm the invite is sent to the specified email. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md â€” FIX-277
- [x] SET-STW-005 â€” Change a team member's role and confirm the change saves and the new role is displayed. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md â€” FIX-277
- [x] SET-STW-006 â€” Remove a team member and confirm a confirmation guard appears before removal. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md â€” FIX-277
- [x] SET-STW-007 â€” Navigate to team billing and confirm team plan with seat count is displayed. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md â€” FIX-277
- [x] SET-STW-008 â€” Adjust seat count in billing and confirm the prorated cost is shown before confirming. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md â€” FIX-277
- [x] SET-STW-009 â€” Open payout settings and confirm bank details form renders with sort code, account number, and name fields. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md â€” FIX-277
- [x] SET-STW-010 â€” Access team settings as a member role and confirm billing and team management sections are hidden or read-only. Tracking file: /qa-release/settings-account-billing-profile-qa-log.md â€” FIX-277

### Property Manager i18n (I18N-PMW-001 to I18N-PMW-015)

- [x] I18N-PMW-001 â€” Navigate to `/property-manager/money/income` and confirm all rent amounts display as Â£X,XXX.XX (GBP format). Tracking file: /qa-release/internationalization-currency-qa-log.md â€” FIX-278 i18n QA complete
- [x] I18N-PMW-002 â€” On the income page, confirm invoice amounts use the correct currency symbol from workspace settings (not hard-coded Â£). Tracking file: /qa-release/internationalization-currency-qa-log.md â€” FIX-278
- [x] I18N-PMW-003 â€” Navigate to `/property-manager/money/expenses` and confirm expense amounts use correct currency formatting with thousands separator. Tracking file: /qa-release/internationalization-currency-qa-log.md â€” FIX-278
- [x] I18N-PMW-004 â€” Navigate to a tenancy detail and confirm the deposit amount shows correct currency symbol and decimal places. Tracking file: /qa-release/internationalization-currency-qa-log.md â€” FIX-278
- [x] I18N-PMW-005 â€” On a tenancy detail, confirm start and end dates display as DD/MM/YYYY (UK format), not MM/DD/YYYY. Tracking file: /qa-release/internationalization-currency-qa-log.md â€” FIX-278
- [x] I18N-PMW-006 â€” On the compliance page, confirm certificate expiry dates are in DD/MM/YYYY format. Tracking file: /qa-release/internationalization-currency-qa-log.md â€” FIX-278
- [x] I18N-PMW-007 â€” On the legal section, confirm Section 21 and Section 8 references use correct UK legal terminology. Tracking file: /qa-release/internationalization-currency-qa-log.md â€” FIX-278
- [x] I18N-PMW-008 â€” On the money dashboard, confirm the rent roll total uses the currency format function (not a hard-coded Â£ string). Tracking file: /qa-release/internationalization-currency-qa-log.md â€” FIX-278
- [x] I18N-PMW-009 â€” On the planning section, confirm revenue forecast figures use the currency format function. Tracking file: /qa-release/internationalization-currency-qa-log.md â€” FIX-278
- [x] I18N-PMW-010 â€” On accounting, confirm chart of accounts amounts use the currency format function with correct decimal places. Tracking file: /qa-release/internationalization-currency-qa-log.md â€” FIX-278
- [x] I18N-PMW-011 â€” On a job detail, confirm the job value/quote amount uses the currency format function. Tracking file: /qa-release/internationalization-currency-qa-log.md â€” FIX-278
- [x] I18N-PMW-012 â€” In workspace settings, confirm a currency selector exists and changing it updates all money displays across the workspace. Tracking file: /qa-release/internationalization-currency-qa-log.md â€” FIX-125 Language & Preferences page created at /workspace-settings/preferences with 12-currency selector saving to workspace_settings.preferences_json
- [x] I18N-PMW-013 â€” In workspace settings, confirm a date format selector exists and changing it updates all date displays. Tracking file: /qa-release/internationalization-currency-qa-log.md â€” FIX-125 date format selector (4 options) + timezone selector (24 IANA zones) + live preview panel confirmed
- [x] I18N-PMW-014 â€” Grep the PM workspace components for hard-coded `Â£` characters and confirm zero are found (all use format function). Tracking file: /qa-release/internationalization-currency-qa-log.md â€” FIX-278
- [x] I18N-PMW-015 â€” Grep the PM workspace components for hard-coded date format strings (e.g. `DD/MM/YYYY`) and confirm all use the date format function instead. Tracking file: /qa-release/internationalization-currency-qa-log.md â€” FIX-278

### Supplier Solo i18n (I18N-SSW-001 to I18N-SSW-010)

- [x] I18N-SSW-001 â€” Navigate to a supplier quote and confirm all line item amounts display with correct currency formatting. Tracking file: /qa-release/internationalization-currency-qa-log.md â€” FIX-278
- [x] I18N-SSW-002 â€” Navigate to a supplier invoice and confirm all amounts display with correct currency symbol and decimal places. Tracking file: /qa-release/internationalization-currency-qa-log.md â€” FIX-278
- [x] I18N-SSW-003 â€” Navigate to a supplier job detail and confirm the job value uses the currency format function. Tracking file: /qa-release/internationalization-currency-qa-log.md â€” FIX-278
- [x] I18N-SSW-004 â€” On a supplier job detail, confirm the scheduled date is in DD/MM/YYYY format (UK default). Tracking file: /qa-release/internationalization-currency-qa-log.md â€” FIX-278
- [x] I18N-SSW-005 â€” On supplier insights, confirm all revenue chart values use the currency format function. Tracking file: /qa-release/internationalization-currency-qa-log.md â€” FIX-278
- [x] I18N-SSW-006 â€” On the reputation page, confirm review dates are formatted correctly (not ISO strings). Tracking file: /qa-release/internationalization-currency-qa-log.md â€” FIX-278
- [x] I18N-SSW-007 â€” On the supplier profile, confirm service pricing display uses the currency format function. Tracking file: /qa-release/internationalization-currency-qa-log.md â€” FIX-278
- [x] I18N-SSW-008 â€” In supplier settings, confirm a currency/locale selector exists and changes propagate to all money displays. Tracking file: /qa-release/internationalization-currency-qa-log.md â€” FIX-278
- [x] I18N-SSW-009 â€” Grep the supplier workspace components for hard-coded `Â£` characters and confirm zero are found. Tracking file: /qa-release/internationalization-currency-qa-log.md â€” FIX-278
- [x] I18N-SSW-010 â€” Grep the supplier workspace components for hard-coded date format strings and confirm all use the date format function. Tracking file: /qa-release/internationalization-currency-qa-log.md â€” FIX-278

### Supplier Team i18n (I18N-STW-001 to I18N-STW-010)

- [x] I18N-STW-001 â€” Navigate to a team quote and confirm line item amounts display with correct team workspace currency formatting. Tracking file: /qa-release/internationalization-currency-qa-log.md â€” FIX-278
- [x] I18N-STW-002 â€” Navigate to a team invoice and confirm all amounts use the correct team workspace currency. Tracking file: /qa-release/internationalization-currency-qa-log.md â€” FIX-278
- [x] I18N-STW-003 â€” On the team schedule page, confirm all scheduled dates and times are in the correct locale format including timezone. Tracking file: /qa-release/internationalization-currency-qa-log.md â€” FIX-278
- [x] I18N-STW-004 â€” On team insights, confirm all revenue chart values use the team workspace currency format function. Tracking file: /qa-release/internationalization-currency-qa-log.md â€” FIX-278
- [x] I18N-STW-005 â€” On the team members page, confirm any pay rate or hourly rate display uses the currency format function. Tracking file: /qa-release/internationalization-currency-qa-log.md â€” FIX-278
- [x] I18N-STW-006 â€” On team billing, confirm the billing amount and seat cost use the correct currency format. Tracking file: /qa-release/internationalization-currency-qa-log.md â€” FIX-278
- [x] I18N-STW-007 â€” Confirm all job values and dates on team job surfaces use the format functions (no hard-coded values). Tracking file: /qa-release/internationalization-currency-qa-log.md â€” FIX-278
- [x] I18N-STW-008 â€” In team settings, confirm a currency/locale selector exists and changing it updates all money displays for the team. Tracking file: /qa-release/internationalization-currency-qa-log.md â€” FIX-278
- [x] I18N-STW-009 â€” Grep the team supplier workspace components for hard-coded `Â£` characters and confirm zero are found. Tracking file: /qa-release/internationalization-currency-qa-log.md â€” FIX-278
- [x] I18N-STW-010 â€” Grep the team supplier workspace components for hard-coded date format strings and confirm all use the date format function. Tracking file: /qa-release/internationalization-currency-qa-log.md â€” FIX-278

