# Propvora Atomic QA Task List — 900+ Tasks
<!-- Last updated: 2026-06-21 Session 18 — FIX-293 CSS tokens (DESIGN-026 4/5), FIX-294 flag enforcement (FLAG-009/010/011/012/014/017/018/022/023 CODE_CONFIRMED), FIX-295 security hardening (SEC-012/013/014/021/023/024 CODE_CONFIRMED), FIX-296 nav de-bloat + FLAG-024 affiliateEnabled. Previous Session 17: — FIX-128 through FIX-262b applied: honesty sweeps across Work/Supplier/Automations/Billing/Portfolio/Accounting/Customer; mobile tables FIX-202-208; tab navs FIX-193-194; supplier overview FIX-258; customer identity FIX-261-262; bookings/listings seed FIX-128-129; coupon system FIX-170/173-174; i18n preferences FIX-125; billing seed FIX-229; PWA FIX-109-115 -->

**Format:** `- [ ] PREFIX-NNN — [specific action]. Tracking file: /qa-release/sections/XX-name.md`

**Screen sizes:** 1536×960 | 1366×768 | 1280×720 | 1024×768 | 768×1024 | 430×932 | 390×844 | 375×812

**Scoring:** 5=perfect | 4=minor issue | 3=usable but inconsistent | 2=harms UX | 1=severe | 0=broken/not implemented

---

## PMW — Property Manager Workspace (001–150)

- [~] PMW-001 — Inspect PM dashboard at 1536×960: check KPI cards, quick nav, side nav, needs-attention panel, portfolio snapshot. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-002 — Inspect PM dashboard at 1366×768. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-003 — Inspect PM dashboard at 1280×720. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-004 — Inspect PM dashboard at 1024×768. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-005 — Inspect PM dashboard at 768×1024. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-006 — Inspect PM dashboard at 430×932. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-007 — Inspect PM dashboard at 390×844. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-008 — Inspect PM dashboard at 375×812. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-009 — Click each KPI card on dashboard, verify navigation and data. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-010 — Test Quick Action button on dashboard. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-011 — Verify needs-attention panel items are clickable and navigate correctly. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-012 — Verify portfolio snapshot cards link to correct property detail pages. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-013 — Open side navigation, expand all groups, verify all links resolve. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-014 — Inspect /property-manager/portfolio list at 1536×960. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-015 — Inspect /property-manager/portfolio list at 390×844. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-016 — Switch portfolio between card view, list view, map view. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-017 — Apply filter on portfolio list, confirm results filter correctly. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-018 — Search portfolio by property name. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-019 — Open a property detail page from portfolio. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-020 — Inspect property detail page at 1536×960: header, breadcrumb, tabs, KPIs, right rail. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-021 — Inspect property detail page at 390×844. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-022 — Click all tabs on property detail page: Overview, Tenancy, Compliance, Finance, Documents, Media, Maintenance. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-023 — Inspect /property-manager/work/jobs at 1536×960. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-024 — Inspect /property-manager/work/jobs at 390×844. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-025 — Switch jobs between table view and kanban view. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-026 — Create a new job via the create button on /property-manager/work/jobs. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-027 — Open a job detail page, inspect all tabs. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-028 — Drag a kanban card to a new column, confirm status update. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-029 — Inspect /property-manager/work/inspections at 1536×960. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-030 — Inspect /property-manager/work/inspections at 390×844. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-031 — Create a new inspection record. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-032 — Inspect /property-manager/work/contractors at 1536×960. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-033 — Inspect /property-manager/work/contractors at 390×844. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-034 — Inspect /property-manager/compliance at 1536×960. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-035 — Inspect /property-manager/compliance at 390×844. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-036 — Click all compliance sub-tabs: Certificates, Safety, Licences, Planning. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-037 — Add a new compliance certificate record. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-038 — Verify expiry date alerts are displayed for near-expiry certificates. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-039 — Inspect /property-manager/compliance/certificates at 1536×960. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-040 — Inspect /property-manager/compliance/safety at 1536×960. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-041 — Inspect /property-manager/compliance/licences at 1536×960. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-042 — Inspect /property-manager/compliance/planning at 1536×960. Tracking file: /qa-release/sections/01-pm-workspace.md
- [x] PMW-043 — Inspect /property-manager/money at 1536×960: KPI strip, income/expense chart, rent schedule. Tracking file: /qa-release/sections/01-pm-workspace.md — Money scored 4/5 PASS (FIX-044–050)
- [x] PMW-044 — Inspect /property-manager/money at 390×844. Tracking file: /qa-release/sections/01-pm-workspace.md — Money section mobile audited
- [x] PMW-045 — Click all money sub-tabs: Overview, Income, Expenses, Rent, Invoices, Reports. Tracking file: /qa-release/sections/01-pm-workspace.md — Money section 35 routes audited
- [x] PMW-046 — Inspect /property-manager/money/income at 1536×960. Tracking file: /qa-release/sections/01-pm-workspace.md — FIX-044 Suspense fix + FIX-048 fake properties removed + FIX-050 header ordering fixed
- [x] PMW-047 — Inspect /property-manager/money/expenses at 1536×960. Tracking file: /qa-release/sections/01-pm-workspace.md — FIX-045 Suspense fix + FIX-049 fake properties removed + FIX-050 header ordering fixed
- [~] PMW-048 — Inspect /property-manager/money/rent at 1536×960: rent schedule, arrears panel. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-049 — Mark a rent payment as received. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-050 — Inspect /property-manager/money/invoices at 1536×960. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-051 — Create a new invoice. Tracking file: /qa-release/sections/01-pm-workspace.md
- [x] PMW-052 — Inspect /property-manager/messages at 1536×960. Tracking file: /qa-release/sections/01-pm-workspace.md — Messages scored 5/5 PASS, browser tested (FIX-039–042)
- [x] PMW-053 — Inspect /property-manager/messages at 390×844. Tracking file: /qa-release/sections/01-pm-workspace.md — Messages section mobile audited
- [x] PMW-054 — Send a message to a tenant from the messages hub. Tracking file: /qa-release/sections/01-pm-workspace.md — FIX-040 send wired to useSendMessage, browser tested
- [~] PMW-055 — Send a message to a landlord from the messages hub. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-056 — Inspect /property-manager/tenants at 1536×960. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-057 — Inspect /property-manager/tenants at 390×844. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-058 — Open a tenant detail page, check all tabs. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-059 — Inspect /property-manager/landlords at 1536×960. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-060 — Open a landlord detail page, check all tabs. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-061 — Inspect /property-manager/legal at 1536×960. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-062 — Inspect /property-manager/legal at 390×844. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-063 — Click all legal sub-tabs: Cases, Notices, Documents. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-064 — Create a new legal case record. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-065 — Inspect /property-manager/documents at 1536×960. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-066 — Upload a document, verify it appears in the list. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-067 — Download a document, confirm signed URL works. Tracking file: /qa-release/sections/01-pm-workspace.md
- [x] PMW-068 — Inspect /property-manager/planning at 1536×960. Tracking file: /qa-release/sections/01-pm-workspace.md — Planning scored 4/5 PASS, 50+ routes tested (FIX-031–038)
- [x] PMW-069 — Inspect /property-manager/planning at 390×844. Tracking file: /qa-release/sections/01-pm-workspace.md — Planning section mobile audited
- [x] PMW-070 — Click all planning sub-tabs. Tracking file: /qa-release/sections/01-pm-workspace.md — Planning section fully audited
- [~] PMW-071 — Inspect /property-manager/reports at 1536×960. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-072 — Generate a report, verify download/export works. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-073 — Inspect /property-manager/automations at 1536×960 (flag: canvasLite=ON). Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-074 — Inspect /property-manager/automations at 390×844. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-075 — Create a new automation workflow. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-076 — Add a trigger node to a workflow. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-077 — Add an action node to a workflow and connect to trigger. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-078 — Enable and run a workflow manually. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-079 — Check automation run log for completed execution. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-080 — Inspect /property-manager/suppliers at 1536×960 (flag: supplierWorkspace=ON). Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-081 — Inspect /property-manager/suppliers at 390×844. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-082 — Browse supplier marketplace tab from PM suppliers hub. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-083 — Inspect /property-manager/listings at 1536×960 (flag: directBookingPages=ON). Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-084 — Inspect /property-manager/listings at 390×844. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-085 — Inspect /property-manager/bookings at 1536×960 (flag: bookingManagement=ON). Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-086 — Inspect /property-manager/bookings at 390×844. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-087 — Inspect /property-manager/money/escrow at 1536×960 (flag: marketplaceEscrow=ON). Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-088 — Inspect /property-manager/money/disputes at 1536×960 (flag: marketplaceDisputes=ON). Tracking file: /qa-release/sections/01-pm-workspace.md
- [x] PMW-089 — Inspect /property-manager/accounting at 1536×960 (flag: accountingGl=ON). Tracking file: /qa-release/sections/01-pm-workspace.md — Accounting scored 5/5 PASS, 20 routes tested (FIX-055–063)
- [x] PMW-090 — Inspect /property-manager/accounting at 390×844. Tracking file: /qa-release/sections/01-pm-workspace.md — Accounting section mobile audited
- [~] PMW-091 — Inspect /property-manager/workspace-settings at 1536×960. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-092 — Inspect /property-manager/workspace-settings/members at 1536×960. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-093 — Invite a team member via workspace settings. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-094 — Change a member role and confirm save. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-095 — Inspect /property-manager/workspace-settings/branding at 1536×960. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-096 — Update brand colour and verify portal header reflects it. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-097 — Inspect /property-manager/workspace-settings/billing at 1536×960. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-098 — Inspect /property-manager/account/profile at 1536×960. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-099 — Edit profile name and save. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-100 — Upload avatar and verify display. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-101 — Inspect /property-manager/account/security at 1536×960. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-102 — Change password and confirm session handling. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-103 — Inspect /property-manager/account/notifications at 1536×960. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-104 — Toggle notification preference and confirm save. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-105 — Open AI copilot chat bubble at /property-manager. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-106 — Send a message in the AI copilot chat, verify response streams. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-107 — Verify AI usage counter increments after each AI call. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-108 — Inspect breadcrumb trail on /property-manager/portfolio/[id]/compliance. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-109 — Inspect breadcrumb trail on /property-manager/work/jobs/[id]. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-110 — Verify back button on job detail returns to jobs list. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-111 — Inspect /property-manager/money/reports at 1536×960. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-112 — Export money report as CSV or PDF. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-113 — Inspect notification bell in PM top bar, click to view notifications. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-114 — Mark a notification as read. Tracking file: /qa-release/sections/01-pm-workspace.md
- [x] PMW-115 — Inspect /property-manager/work/tasks at 1536×960. Tracking file: /qa-release/sections/01-pm-workspace.md — FIX-012 tasks PROPERTY column fixed with two-query pattern
- [~] PMW-116 — Create a new task. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-117 — Assign a task to a team member. Tracking file: /qa-release/sections/01-pm-workspace.md
- [x] PMW-118 — Inspect /property-manager/calendar at 1536×960. Tracking file: /qa-release/sections/01-pm-workspace.md — Calendar scored 4/5 PASS, 23 routes tested (FIX-072–075)
- [x] PMW-119 — Inspect /property-manager/calendar at 390×844. Tracking file: /qa-release/sections/01-pm-workspace.md — Calendar section mobile audited
- [x] PMW-120 — Switch calendar between day, week, month views. Tracking file: /qa-release/sections/01-pm-workspace.md — Calendar section fully audited
- [x] PMW-121 — Click a calendar event to open detail. Tracking file: /qa-release/sections/01-pm-workspace.md — FIX-072–075 confirmed event detail all tabs fixed
- [~] PMW-122 — Inspect /property-manager/analytics at 1536×960. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-123 — Inspect /property-manager/analytics at 390×844. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-124 — Interact with chart on analytics page: hover tooltip, change date range. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-125 — Inspect /property-manager/tenancy-agreements at 1536×960. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-126 — Create or view a tenancy agreement document. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-127 — Inspect /property-manager/notices at 1536×960. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-128 — Create a new notice (Section 8 or Section 21). Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-129 — Inspect global search in PM workspace. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-130 — Search for a property name in global search. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-131 — Search for a tenant name in global search. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-132 — Open command palette (keyboard shortcut), confirm it opens. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-133 — Inspect empty state on /property-manager/work/jobs with no jobs. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-134 — Inspect empty state on /property-manager/documents with no documents. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-135 — Inspect /property-manager/money/holds at 1536×960 (flag: marketplacePayments=ON). Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-136 — Verify all KPI numbers on dashboard are GBP formatted. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-137 — Verify all dates in PM workspace use DD/MM/YYYY format. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-138 — Verify UK-specific compliance copy (EPC, Gas Safe, EICR) appears correctly. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-139 — Test iCal sync import (flag: icalSync=ON). Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-140 — Test iCal sync export. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-141 — Confirm plan gate blocks adding more than allowed properties on Starter plan. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-142 — Confirm plan gate blocks adding more than allowed team members on Starter plan. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-143 — Inspect /property-manager/work/jobs in kanban view at 390×844. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-144 — Verify side nav collapses correctly on tablet (768×1024). Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-145 — Verify side nav shows hamburger/drawer on mobile (430×932). Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-146 — Inspect /property-manager/portfolio/[id]/media tab: image gallery loads. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-147 — Upload an image to a property media gallery. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-148 — Inspect /property-manager/portfolio/[id]/documents tab. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-149 — Inspect /property-manager/portfolio/[id]/finance tab: rent history, expenses. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] PMW-150 — Inspect /property-manager/portfolio/[id]/tenancy tab: tenancy details, contacts. Tracking file: /qa-release/sections/01-pm-workspace.md

---

## SSW — Supplier Solo Workspace (001–080)

- [x] SSW-001 — Inspect /supplier dashboard at 1536×960: KPI strip, jobs panel, notifications. Tracking file: /qa-release/sections/02-supplier-solo.md — Supplier Solo scored 4/5 PASS, 25+ routes tested (FIX-001–009)
- [~] SSW-002 — Inspect /supplier dashboard at 1366×768. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-003 — Inspect /supplier dashboard at 1280×720. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-004 — Inspect /supplier dashboard at 1024×768. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-005 — Inspect /supplier dashboard at 768×1024. Tracking file: /qa-release/sections/02-supplier-solo.md
- [x] SSW-006 — Inspect /supplier dashboard at 430×932. Tracking file: /qa-release/sections/02-supplier-solo.md — Supplier Solo mobile tested
- [x] SSW-007 — Inspect /supplier dashboard at 390×844. Tracking file: /qa-release/sections/02-supplier-solo.md — Supplier Solo mobile tested
- [~] SSW-008 — Inspect /supplier dashboard at 375×812. Tracking file: /qa-release/sections/02-supplier-solo.md
- [x] SSW-009 — Click each KPI card on supplier dashboard. Tracking file: /qa-release/sections/02-supplier-solo.md — FIX-006 KPI strip single row fixed; all cards functional
- [~] SSW-010 — Inspect /supplier/jobs at 1536×960: job list, filters, status tabs. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-011 — Inspect /supplier/jobs at 390×844. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-012 — Open a job detail page /supplier/jobs/[id] at 1536×960. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-013 — Inspect /supplier/jobs/[id] at 390×844. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-014 — Update job status from In Progress to Completed. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-015 — Add a note/comment on a job detail page. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-016 — Upload an evidence photo on a job. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-017 — Inspect /supplier/quotes at 1536×960. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-018 — Create a new quote for a job. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-019 — Inspect /supplier/invoices at 1536×960. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-020 — Inspect /supplier/invoices at 390×844. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-021 — Create a new supplier invoice. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-022 — View an existing invoice detail page. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-023 — Inspect /supplier/messages at 1536×960. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-024 — Inspect /supplier/messages at 390×844. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-025 — Send a message to a property manager. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-026 — Inspect /supplier/profile at 1536×960: business info, service areas, categories. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-027 — Edit supplier business profile and save. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-028 — Upload supplier logo/avatar. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-029 — Inspect /supplier/availability at 1536×960. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-030 — Set availability slots on supplier calendar. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-031 — Inspect /supplier/reviews at 1536×960. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-032 — Inspect /supplier/analytics at 1536×960. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-033 — Inspect /supplier/analytics at 390×844. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-034 — Inspect /supplier/documents at 1536×960. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-035 — Upload a trade document (insurance cert, qualification). Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-036 — Inspect /supplier/settings/profile at 1536×960. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-037 — Inspect /supplier/settings/account at 1536×960. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-038 — Inspect /supplier/settings/billing at 1536×960. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-039 — Verify supplier side nav all groups expand correctly. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-040 — Verify supplier nav collapses to mobile drawer at 430×932. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-041 — Inspect /supplier/jobs empty state with no jobs. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-042 — Open AI helper on /supplier/jobs/[id], verify response. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-043 — Open AI message draft on /supplier/messages. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-044 — Verify AI invoice draft on /supplier/invoices. Tracking file: /qa-release/sections/02-supplier-solo.md
- [x] SSW-045 — Verify GBP currency formatting on all invoice amounts. Tracking file: /qa-release/sections/02-supplier-solo.md — CODE_CONFIRMED FIX-291: useWorkspaceCurrency hook wired; formatCurrency uses locale from workspace.settings.
- [~] SSW-046 — Verify DD/MM/YYYY date format on all supplier pages. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-047 — Inspect /supplier/reputation at 1536×960. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-048 — Inspect /supplier/insights at 1536×960. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-049 — Inspect /supplier/network at 1536×960. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-050 — Inspect /supplier/help at 1536×960. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-051 — Inspect /supplier/requests at 1536×960: incoming job requests. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-052 — Accept a job request. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-053 — Decline a job request. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-054 — Verify plan gate: confirm solo supplier cannot access team features. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-055 — Inspect supplier portal link from within supplier workspace. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-056 — Verify breadcrumb on /supplier/jobs/[id]: Supplier > Jobs > [Job Name]. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-057 — Inspect /supplier/jobs kanban view at 1536×960. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-058 — Inspect /supplier/jobs kanban view at 390×844. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-059 — Check notification bell in supplier top bar. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-060 — Inspect /supplier/automations at 1536×960 (flag: canvasLite=ON). Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-061 — Add a trigger node to supplier automation. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-062 — Add an action node to supplier automation. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-063 — Inspect /supplier/earnings at 1536×960. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-064 — Inspect /supplier/earnings at 390×844. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-065 — Inspect /supplier/schedule at 1536×960. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-066 — Inspect /supplier/schedule at 390×844. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-067 — Inspect shell design consistency: header, breadcrumb, tabs vs PM workspace. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-068 — Verify SupplierWorkspaceShell wraps all supplier routes. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-069 — Inspect /supplier/media at 1536×960. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-070 — Upload an image to supplier media gallery. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-071 — Inspect /supplier/certifications at 1536×960. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-072 — Add a certification record. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-073 — Verify AI chat bubble on supplier dashboard. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-074 — Inspect /supplier at 375×812: confirm no horizontal overflow. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-075 — Inspect /supplier/jobs/[id] at 375×812. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-076 — Verify PWA action bar visible at 390×844 on supplier pages. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-077 — Test supplier registration flow (flag: registrationSupplier=ON). Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-078 — Verify supplier workspace requires auth — unauthenticated redirect to /login. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-079 — Inspect /supplier/jobs filter drawer at 1536×960. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SSW-080 — Inspect /supplier/jobs filter drawer at 390×844. Tracking file: /qa-release/sections/02-supplier-solo.md

---

## STW — Supplier Team Workspace (001–060)

- [~] STW-001 — Inspect /supplier (team view) dashboard at 1536×960: team KPIs, member workload. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-002 — Inspect /supplier (team view) dashboard at 390×844. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-003 — Inspect /supplier/team at 1536×960: team member list. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-004 — Inspect /supplier/team at 390×844. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-005 — Invite a new team member. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-006 — Change a team member role. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-007 — Assign a job to a specific team member. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-008 — Inspect /supplier/team/jobs at 1536×960: all jobs across team. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-009 — Inspect /supplier/team/jobs at 390×844. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-010 — Filter team jobs by assigned member. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-011 — Inspect /supplier/team/schedule at 1536×960: team schedule view. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-012 — Inspect /supplier/team/schedule at 390×844. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-013 — Inspect /supplier/team/performance at 1536×960. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-014 — Verify team billing page at /supplier/settings/billing shows team plan. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-015 — Verify plan gate: team features hidden on solo plan. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-016 — Verify isTeam flag gates team nav items correctly. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-017 — Inspect /supplier/settings/team at 1536×960. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-018 — Inspect /supplier/settings/team at 390×844. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-019 — AI workload summary on team dashboard. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-020 — AI job assignment suggestion on /supplier/team. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-021 — AI team performance summary. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-022 — Automation trigger: job assigned — verify fires correctly. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-023 — Automation action: assign team member — verify executes. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-024 — Verify /supplier/automations with team triggers at 1536×960. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-025 — Inspect /supplier/team/analytics at 1536×960. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-026 — Verify team payment amounts formatted as GBP. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-027 — Inspect isEnterprise plan gate (Enterprise features locked on Team plan). Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-028 — Verify current sidebar persists between solo and team views (no duplicate nav). Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-029 — Inspect /supplier/team/[memberId] detail page at 1536×960. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-030 — Inspect /supplier/team/[memberId] detail page at 390×844. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-031 — Remove a team member and verify access revoked. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-032 — Inspect team notification settings. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-033 — Inspect /supplier/team/messages at 1536×960. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-034 — Send internal team message. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-035 — Verify team-level audit log captures member changes. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-036 — Inspect /supplier/team/invoices at 1536×960. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-037 — Verify team invoices show GBP amounts. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-038 — Inspect empty state for team with no jobs assigned. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-039 — Inspect /supplier/team at 375×812: no horizontal overflow. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-040 — Inspect PWA action bar on team supplier pages at 390×844. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-041 — Inspect /supplier/team/documents at 1536×960. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-042 — Verify breadcrumb on /supplier/team/jobs/[id]. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-043 — Verify team-aware workspace shell headers. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-044 — Inspect /supplier/team/reports at 1536×960. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-045 — Export team performance report. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-046 — Inspect /supplier/team/compliance at 1536×960 if applicable. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-047 — Verify RLS: team member cannot access another team's data. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-048 — Inspect team onboarding wizard if available. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-049 — Inspect /supplier/team/availability at 1536×960. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-050 — Set team member availability. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-051 — Verify notification bell shows team-level alerts. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-052 — Inspect /supplier/team/earnings at 1536×960. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-053 — Inspect /supplier/team/earnings at 390×844. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-054 — Check AI chat bubble present on team dashboard. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-055 — Verify AI cap enforcement applies at team-workspace level. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-056 — Test upgrade prompt when team AI cap is exceeded. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-057 — Inspect /supplier/team/settings at 1536×960. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-058 — Inspect /supplier/team/settings at 390×844. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-059 — Verify team settings save correctly. Tracking file: /qa-release/sections/03-supplier-team.md
- [~] STW-060 — Inspect design consistency: team dashboard uses same shell primitives as solo. Tracking file: /qa-release/sections/03-supplier-team.md

---

## CUST — Customer Workspace (001–040)

- [~] CUST-001 — Inspect /customer dashboard at 1536×960: stays summary, bookings, quick nav. Tracking file: /qa-release/sections/04-customer.md
- [~] CUST-002 — Inspect /customer dashboard at 390×844. Tracking file: /qa-release/sections/04-customer.md
- [~] CUST-003 — Inspect /customer dashboard at 375×812: no overflow. Tracking file: /qa-release/sections/04-customer.md
- [~] CUST-004 — Inspect /customer/stays at 1536×960: stay search, filters, map. Tracking file: /qa-release/sections/04-customer.md
- [~] CUST-005 — Inspect /customer/stays at 390×844. Tracking file: /qa-release/sections/04-customer.md
- [~] CUST-006 — Search for stays by location. Tracking file: /qa-release/sections/04-customer.md
- [~] CUST-007 — Apply date filter on stays search. Tracking file: /qa-release/sections/04-customer.md
- [~] CUST-008 — Open a stay detail page /customer/stays/[id]. Tracking file: /qa-release/sections/04-customer.md
- [~] CUST-009 — Initiate a stay booking from detail page. Tracking file: /qa-release/sections/04-customer.md
- [~] CUST-010 — Inspect /customer/bookings at 1536×960: active, past bookings. Tracking file: /qa-release/sections/04-customer.md
- [~] CUST-011 — Inspect /customer/bookings at 390×844. Tracking file: /qa-release/sections/04-customer.md
- [~] CUST-012 — Open a booking detail page. Tracking file: /qa-release/sections/04-customer.md
- [~] CUST-013 — Inspect /customer/messages at 1536×960. Tracking file: /qa-release/sections/04-customer.md
- [~] CUST-014 — Send a message to a property manager. Tracking file: /qa-release/sections/04-customer.md
- [~] CUST-015 — Inspect /customer/profile at 1536×960. Tracking file: /qa-release/sections/04-customer.md
- [~] CUST-016 — Edit customer profile and save. Tracking file: /qa-release/sections/04-customer.md
- [~] CUST-017 — Inspect /customer/favourites at 1536×960. Tracking file: /qa-release/sections/04-customer.md
- [~] CUST-018 — Add a stay to favourites from stay detail page. Tracking file: /qa-release/sections/04-customer.md
- [~] CUST-019 — Inspect /customer/payments at 1536×960. Tracking file: /qa-release/sections/04-customer.md
- [~] CUST-020 — Inspect /customer/payments at 390×844. Tracking file: /qa-release/sections/04-customer.md
- [~] CUST-021 — Inspect /customer/reviews at 1536×960. Tracking file: /qa-release/sections/04-customer.md
- [~] CUST-022 — Leave a review for a completed stay. Tracking file: /qa-release/sections/04-customer.md
- [~] CUST-023 — Inspect /customer/settings at 1536×960. Tracking file: /qa-release/sections/04-customer.md
- [~] CUST-024 — Update notification preferences in customer settings. Tracking file: /qa-release/sections/04-customer.md
- [~] CUST-025 — Verify customer workspace top-nav only (no sidebar). Tracking file: /qa-release/sections/04-customer.md
- [~] CUST-026 — Verify customer workspace requires auth — redirect to /login if unauthenticated. Tracking file: /qa-release/sections/04-customer.md
- [~] CUST-027 — Verify customer persona cannot access PM or supplier routes. Tracking file: /qa-release/sections/04-customer.md
- [~] CUST-028 — Verify customer stays use canonical StayCard component. Tracking file: /qa-release/sections/04-customer.md
- [~] CUST-029 — Inspect customer workspace at 768×1024 (tablet). Tracking file: /qa-release/sections/04-customer.md
- [~] CUST-030 — Inspect customer empty state: no bookings. Tracking file: /qa-release/sections/04-customer.md
- [~] CUST-031 — Inspect customer empty state: no stays in search. Tracking file: /qa-release/sections/04-customer.md
- [~] CUST-032 — Verify customer registration flow (flag: registrationCustomer=ON). Tracking file: /qa-release/sections/04-customer.md
- [~] CUST-033 — Verify customer is hidden from persona switcher in PM/supplier login. Tracking file: /qa-release/sections/04-customer.md
- [~] CUST-034 — Verify /customer routes redirect to /user/* file structure correctly. Tracking file: /qa-release/sections/04-customer.md
- [~] CUST-035 — Inspect /customer/help at 1536×960. Tracking file: /qa-release/sections/04-customer.md
- [~] CUST-036 — Inspect /customer/notifications at 1536×960. Tracking file: /qa-release/sections/04-customer.md
- [~] CUST-037 — Mark customer notification as read. Tracking file: /qa-release/sections/04-customer.md
- [~] CUST-038 — Inspect customer dashboard at 1366×768. Tracking file: /qa-release/sections/04-customer.md
- [~] CUST-039 — Verify GBP formatting on customer payment pages. Tracking file: /qa-release/sections/04-customer.md
- [~] CUST-040 — Verify DD/MM/YYYY date format on customer booking pages. Tracking file: /qa-release/sections/04-customer.md

---

## TENANT — Tenant Portal (001–040)

- [~] TENANT-001 — Inspect /tenant-portal at 1536×960: overview, rent due, documents, messages. Tracking file: /qa-release/sections/05-tenant-portal.md
- [~] TENANT-002 — Inspect /tenant-portal at 390×844. Tracking file: /qa-release/sections/05-tenant-portal.md
- [~] TENANT-003 — Inspect /tenant-portal at 375×812: no horizontal overflow. Tracking file: /qa-release/sections/05-tenant-portal.md
- [~] TENANT-004 — Verify tenant portal accessible via share link without login (if configured). Tracking file: /qa-release/sections/05-tenant-portal.md
- [~] TENANT-005 — Inspect /tenant-portal/rent at 1536×960: rent schedule, payment history. Tracking file: /qa-release/sections/05-tenant-portal.md
- [~] TENANT-006 — Inspect /tenant-portal/rent at 390×844. Tracking file: /qa-release/sections/05-tenant-portal.md
- [~] TENANT-007 — Inspect /tenant-portal/documents at 1536×960. Tracking file: /qa-release/sections/05-tenant-portal.md
- [~] TENANT-008 — Download a tenancy agreement from tenant portal. Tracking file: /qa-release/sections/05-tenant-portal.md
- [~] TENANT-009 — Inspect /tenant-portal/maintenance at 1536×960. Tracking file: /qa-release/sections/05-tenant-portal.md
- [~] TENANT-010 — Submit a maintenance request from tenant portal. Tracking file: /qa-release/sections/05-tenant-portal.md
- [~] TENANT-011 — Inspect /tenant-portal/messages at 1536×960. Tracking file: /qa-release/sections/05-tenant-portal.md
- [~] TENANT-012 — Send a message to the property manager from tenant portal. Tracking file: /qa-release/sections/05-tenant-portal.md
- [~] TENANT-013 — Inspect /tenant-portal/profile at 1536×960. Tracking file: /qa-release/sections/05-tenant-portal.md
- [~] TENANT-014 — Verify portal branding reflects workspace brand colours. Tracking file: /qa-release/sections/05-tenant-portal.md
- [~] TENANT-015 — Verify PortalPageShell is used throughout tenant portal. Tracking file: /qa-release/sections/05-tenant-portal.md
- [~] TENANT-016 — Verify tenant portal requires portalTenant flag = ON. Tracking file: /qa-release/sections/05-tenant-portal.md
- [~] TENANT-017 — Verify tenant cannot access PM workspace routes. Tracking file: /qa-release/sections/05-tenant-portal.md
- [~] TENANT-018 — Inspect /tenant-portal/notices at 1536×960. Tracking file: /qa-release/sections/05-tenant-portal.md
- [~] TENANT-019 — Inspect /tenant-portal at 1024×768. Tracking file: /qa-release/sections/05-tenant-portal.md
- [~] TENANT-020 — Inspect /tenant-portal at 768×1024. Tracking file: /qa-release/sections/05-tenant-portal.md
- [~] TENANT-021 — Verify rent amounts formatted as GBP in tenant portal. Tracking file: /qa-release/sections/05-tenant-portal.md
- [~] TENANT-022 — Verify dates use DD/MM/YYYY in tenant portal. Tracking file: /qa-release/sections/05-tenant-portal.md
- [~] TENANT-023 — Inspect tenant portal empty state: no documents. Tracking file: /qa-release/sections/05-tenant-portal.md
- [~] TENANT-024 — Inspect tenant portal empty state: no maintenance requests. Tracking file: /qa-release/sections/05-tenant-portal.md
- [~] TENANT-025 — Verify tenant portal nav links all resolve. Tracking file: /qa-release/sections/05-tenant-portal.md
- [~] TENANT-026 — Inspect /tenant-portal/move-in at 1536×960 if applicable. Tracking file: /qa-release/sections/05-tenant-portal.md
- [~] TENANT-027 — Inspect /tenant-portal/move-out at 1536×960 if applicable. Tracking file: /qa-release/sections/05-tenant-portal.md
- [~] TENANT-028 — Inspect /tenant-portal on PWA standalone at 390×844. Tracking file: /qa-release/sections/05-tenant-portal.md
- [~] TENANT-029 — Verify portal messaging uses src/lib/portal/messaging.ts schema correctly. Tracking file: /qa-release/sections/05-tenant-portal.md
- [~] TENANT-030 — Inspect tenant portal header: workspace logo/name visible. Tracking file: /qa-release/sections/05-tenant-portal.md
- [~] TENANT-031 — Inspect /tenant-portal/payments at 1536×960. Tracking file: /qa-release/sections/05-tenant-portal.md
- [~] TENANT-032 — Inspect /tenant-portal/payments at 390×844. Tracking file: /qa-release/sections/05-tenant-portal.md
- [~] TENANT-033 — Verify RLS: tenant can only see their own records. Tracking file: /qa-release/sections/05-tenant-portal.md
- [~] TENANT-034 — Inspect notification in tenant portal: new message alert. Tracking file: /qa-release/sections/05-tenant-portal.md
- [~] TENANT-035 — Inspect /tenant-portal/account at 1536×960. Tracking file: /qa-release/sections/05-tenant-portal.md
- [~] TENANT-036 — Update tenant contact details and save. Tracking file: /qa-release/sections/05-tenant-portal.md
- [~] TENANT-037 — Inspect /tenant-portal at 1366×768. Tracking file: /qa-release/sections/05-tenant-portal.md
- [~] TENANT-038 — Inspect /tenant-portal at 1280×720. Tracking file: /qa-release/sections/05-tenant-portal.md
- [~] TENANT-039 — Confirm UK legal terminology in tenancy agreement copy (assured shorthold tenancy, Section 21, deposit protection). Tracking file: /qa-release/sections/05-tenant-portal.md
- [~] TENANT-040 — Verify button hierarchy in tenant portal uses design token system. Tracking file: /qa-release/sections/05-tenant-portal.md

---

## LANDLORD — Landlord Portal (001–040)

- [~] LANDLORD-001 — Inspect /landlord-portal at 1536×960: income summary, properties, messages. Tracking file: /qa-release/sections/06-landlord-portal.md
- [~] LANDLORD-002 — Inspect /landlord-portal at 390×844. Tracking file: /qa-release/sections/06-landlord-portal.md
- [~] LANDLORD-003 — Inspect /landlord-portal at 375×812. Tracking file: /qa-release/sections/06-landlord-portal.md
- [~] LANDLORD-004 — Inspect /landlord-portal/properties at 1536×960. Tracking file: /qa-release/sections/06-landlord-portal.md
- [~] LANDLORD-005 — Open property detail from landlord portal. Tracking file: /qa-release/sections/06-landlord-portal.md
- [~] LANDLORD-006 — Inspect /landlord-portal/income at 1536×960: rent received, expenses. Tracking file: /qa-release/sections/06-landlord-portal.md
- [~] LANDLORD-007 — Inspect /landlord-portal/income at 390×844. Tracking file: /qa-release/sections/06-landlord-portal.md
- [x] LANDLORD-008 — Verify GBP currency on all income figures. Tracking file: /qa-release/sections/06-landlord-portal.md — CODE_CONFIRMED FIX-291: formatCurrency + useWorkspaceCurrency wired.
- [~] LANDLORD-009 — Inspect /landlord-portal/documents at 1536×960. Tracking file: /qa-release/sections/06-landlord-portal.md
- [~] LANDLORD-010 — Download a document from landlord portal. Tracking file: /qa-release/sections/06-landlord-portal.md
- [~] LANDLORD-011 — Inspect /landlord-portal/messages at 1536×960. Tracking file: /qa-release/sections/06-landlord-portal.md
- [~] LANDLORD-012 — Send a message to property manager. Tracking file: /qa-release/sections/06-landlord-portal.md
- [~] LANDLORD-013 — Inspect /landlord-portal/compliance at 1536×960. Tracking file: /qa-release/sections/06-landlord-portal.md
- [~] LANDLORD-014 — Inspect /landlord-portal/reports at 1536×960. Tracking file: /qa-release/sections/06-landlord-portal.md
- [~] LANDLORD-015 — Verify portal branding reflects workspace brand colours. Tracking file: /qa-release/sections/06-landlord-portal.md
- [~] LANDLORD-016 — Verify PortalPageShell used throughout landlord portal. Tracking file: /qa-release/sections/06-landlord-portal.md
- [~] LANDLORD-017 — Verify portalLandlord flag = ON required. Tracking file: /qa-release/sections/06-landlord-portal.md
- [~] LANDLORD-018 — Verify landlord cannot access PM workspace routes. Tracking file: /qa-release/sections/06-landlord-portal.md
- [~] LANDLORD-019 — Verify RLS: landlord sees only their own properties. Tracking file: /qa-release/sections/06-landlord-portal.md
- [~] LANDLORD-020 — Inspect /landlord-portal at 1024×768. Tracking file: /qa-release/sections/06-landlord-portal.md
- [~] LANDLORD-021 — Inspect /landlord-portal at 768×1024. Tracking file: /qa-release/sections/06-landlord-portal.md
- [~] LANDLORD-022 — Inspect /landlord-portal at 1366×768. Tracking file: /qa-release/sections/06-landlord-portal.md
- [~] LANDLORD-023 — Verify DD/MM/YYYY date format throughout landlord portal. Tracking file: /qa-release/sections/06-landlord-portal.md
- [~] LANDLORD-024 — Inspect /landlord-portal/account at 1536×960. Tracking file: /qa-release/sections/06-landlord-portal.md
- [~] LANDLORD-025 — Inspect empty state: no properties. Tracking file: /qa-release/sections/06-landlord-portal.md
- [~] LANDLORD-026 — Inspect /landlord-portal on PWA standalone at 390×844. Tracking file: /qa-release/sections/06-landlord-portal.md
- [~] LANDLORD-027 — Verify landlord portal messaging uses portal/messaging.ts correctly. Tracking file: /qa-release/sections/06-landlord-portal.md
- [~] LANDLORD-028 — Inspect landlord portal header: workspace logo/name visible. Tracking file: /qa-release/sections/06-landlord-portal.md
- [~] LANDLORD-029 — Verify landlord portal nav links all resolve. Tracking file: /qa-release/sections/06-landlord-portal.md
- [~] LANDLORD-030 — Inspect /landlord-portal/invoices at 1536×960. Tracking file: /qa-release/sections/06-landlord-portal.md
- [~] LANDLORD-031 — Inspect /landlord-portal/invoices at 390×844. Tracking file: /qa-release/sections/06-landlord-portal.md
- [~] LANDLORD-032 — Verify button hierarchy in landlord portal uses design token system. Tracking file: /qa-release/sections/06-landlord-portal.md
- [~] LANDLORD-033 — Inspect notification bell in landlord portal. Tracking file: /qa-release/sections/06-landlord-portal.md
- [~] LANDLORD-034 — Inspect /landlord-portal/maintenance at 1536×960. Tracking file: /qa-release/sections/06-landlord-portal.md
- [~] LANDLORD-035 — Inspect /landlord-portal/maintenance at 390×844. Tracking file: /qa-release/sections/06-landlord-portal.md
- [~] LANDLORD-036 — Verify landlord can view maintenance job status. Tracking file: /qa-release/sections/06-landlord-portal.md
- [~] LANDLORD-037 — Inspect /landlord-portal at 1280×720. Tracking file: /qa-release/sections/06-landlord-portal.md
- [~] LANDLORD-038 — Inspect card design consistency vs PM workspace cards. Tracking file: /qa-release/sections/06-landlord-portal.md
- [~] LANDLORD-039 — Verify landlord portal breadcrumb pattern. Tracking file: /qa-release/sections/06-landlord-portal.md
- [~] LANDLORD-040 — Inspect /landlord-portal/certificates at 1536×960: compliance cert view. Tracking file: /qa-release/sections/06-landlord-portal.md

---

## SUPPLIERPORTAL — Supplier Portal (001–040)

- [~] SUPPLIERPORTAL-001 — Inspect /supplier-portal at 1536×960: job list, messages, profile. Tracking file: /qa-release/sections/07-supplier-portal.md
- [~] SUPPLIERPORTAL-002 — Inspect /supplier-portal at 390×844. Tracking file: /qa-release/sections/07-supplier-portal.md
- [~] SUPPLIERPORTAL-003 — Inspect /supplier-portal at 375×812: no overflow. Tracking file: /qa-release/sections/07-supplier-portal.md
- [~] SUPPLIERPORTAL-004 — Inspect /supplier-portal/jobs at 1536×960. Tracking file: /qa-release/sections/07-supplier-portal.md
- [~] SUPPLIERPORTAL-005 — Open a job detail from supplier portal. Tracking file: /qa-release/sections/07-supplier-portal.md
- [~] SUPPLIERPORTAL-006 — Update job status from supplier portal. Tracking file: /qa-release/sections/07-supplier-portal.md
- [~] SUPPLIERPORTAL-007 — Inspect /supplier-portal/messages at 1536×960. Tracking file: /qa-release/sections/07-supplier-portal.md
- [~] SUPPLIERPORTAL-008 — Send message to property manager from supplier portal. Tracking file: /qa-release/sections/07-supplier-portal.md
- [~] SUPPLIERPORTAL-009 — Inspect /supplier-portal/quotes at 1536×960. Tracking file: /qa-release/sections/07-supplier-portal.md
- [~] SUPPLIERPORTAL-010 — Submit a quote from supplier portal. Tracking file: /qa-release/sections/07-supplier-portal.md
- [~] SUPPLIERPORTAL-011 — Inspect /supplier-portal/invoices at 1536×960. Tracking file: /qa-release/sections/07-supplier-portal.md
- [~] SUPPLIERPORTAL-012 — Inspect /supplier-portal/documents at 1536×960. Tracking file: /qa-release/sections/07-supplier-portal.md
- [~] SUPPLIERPORTAL-013 — Verify portalSupplier flag = ON required. Tracking file: /qa-release/sections/07-supplier-portal.md
- [~] SUPPLIERPORTAL-014 — Verify portal branding reflects PM workspace brand colours. Tracking file: /qa-release/sections/07-supplier-portal.md
- [~] SUPPLIERPORTAL-015 — Verify PortalPageShell used throughout supplier portal. Tracking file: /qa-release/sections/07-supplier-portal.md
- [~] SUPPLIERPORTAL-016 — Verify RLS: supplier portal user sees only their assigned jobs. Tracking file: /qa-release/sections/07-supplier-portal.md
- [~] SUPPLIERPORTAL-017 — Verify supplier portal cannot access PM workspace routes. Tracking file: /qa-release/sections/07-supplier-portal.md
- [~] SUPPLIERPORTAL-018 — Inspect /supplier-portal at 1024×768. Tracking file: /qa-release/sections/07-supplier-portal.md
- [~] SUPPLIERPORTAL-019 — Inspect /supplier-portal at 768×1024. Tracking file: /qa-release/sections/07-supplier-portal.md
- [x] SUPPLIERPORTAL-020 — Verify GBP currency on supplier portal invoice amounts. Tracking file: /qa-release/sections/07-supplier-portal.md — CODE_CONFIRMED FIX-291: formatCurrency locale-aware.
- [~] SUPPLIERPORTAL-021 — Verify DD/MM/YYYY dates on supplier portal. Tracking file: /qa-release/sections/07-supplier-portal.md
- [~] SUPPLIERPORTAL-022 — Inspect empty state: no jobs assigned. Tracking file: /qa-release/sections/07-supplier-portal.md
- [~] SUPPLIERPORTAL-023 — Inspect /supplier-portal on PWA standalone at 390×844. Tracking file: /qa-release/sections/07-supplier-portal.md
- [~] SUPPLIERPORTAL-024 — Inspect supplier portal header: PM workspace branding visible. Tracking file: /qa-release/sections/07-supplier-portal.md
- [~] SUPPLIERPORTAL-025 — Inspect /supplier-portal/account at 1536×960. Tracking file: /qa-release/sections/07-supplier-portal.md
- [~] SUPPLIERPORTAL-026 — Inspect /supplier-portal/profile at 1536×960. Tracking file: /qa-release/sections/07-supplier-portal.md
- [~] SUPPLIERPORTAL-027 — Edit supplier portal profile and save. Tracking file: /qa-release/sections/07-supplier-portal.md
- [~] SUPPLIERPORTAL-028 — Inspect /supplier-portal/notifications at 1536×960. Tracking file: /qa-release/sections/07-supplier-portal.md
- [~] SUPPLIERPORTAL-029 — Inspect supplier portal nav links all resolve. Tracking file: /qa-release/sections/07-supplier-portal.md
- [~] SUPPLIERPORTAL-030 — Inspect /supplier-portal at 1366×768. Tracking file: /qa-release/sections/07-supplier-portal.md
- [~] SUPPLIERPORTAL-031 — Inspect /supplier-portal at 1280×720. Tracking file: /qa-release/sections/07-supplier-portal.md
- [~] SUPPLIERPORTAL-032 — Inspect button hierarchy consistency in supplier portal. Tracking file: /qa-release/sections/07-supplier-portal.md
- [~] SUPPLIERPORTAL-033 — Inspect /supplier-portal/jobs/[id] at 1536×960. Tracking file: /qa-release/sections/07-supplier-portal.md
- [~] SUPPLIERPORTAL-034 — Inspect /supplier-portal/jobs/[id] at 390×844. Tracking file: /qa-release/sections/07-supplier-portal.md
- [~] SUPPLIERPORTAL-035 — Upload evidence photo from supplier portal job detail. Tracking file: /qa-release/sections/07-supplier-portal.md
- [~] SUPPLIERPORTAL-036 — Verify breadcrumb on /supplier-portal/jobs/[id]. Tracking file: /qa-release/sections/07-supplier-portal.md
- [~] SUPPLIERPORTAL-037 — Verify supplier portal uses portal/messaging.ts correctly. Tracking file: /qa-release/sections/07-supplier-portal.md
- [~] SUPPLIERPORTAL-038 — Inspect /supplier-portal at 375×812. Tracking file: /qa-release/sections/07-supplier-portal.md
- [~] SUPPLIERPORTAL-039 — Verify card design consistency with PM workspace. Tracking file: /qa-release/sections/07-supplier-portal.md
- [~] SUPPLIERPORTAL-040 — Verify supplier portal messaging delivers to PM messages hub. Tracking file: /qa-release/sections/07-supplier-portal.md

---

## ADMIN — Platform Admin (001–080)

- [~] ADMIN-001 — Inspect /admin dashboard at 1536×960: workspace list, user count, platform health. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-002 — Inspect /admin dashboard at 1366×768. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-003 — Inspect /admin dashboard at 1280×720. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-004 — Inspect /admin dashboard at 1024×768. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-005 — Inspect /admin dashboard at 390×844. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-006 — Inspect /admin/workspaces at 1536×960: workspace list, search, filters. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-007 — Open a workspace detail page from admin. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-008 — Inspect /admin/users at 1536×960. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-009 — Search for a user in admin users list. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-010 — Open a user detail page. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-011 — Inspect /admin/billing at 1536×960: subscriptions, revenue summary. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-012 — Inspect /admin/billing at 390×844. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-013 — Inspect /admin/feature-flags at 1536×960: flag registry list. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-014 — Toggle a feature flag ON/OFF from admin panel. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-015 — Verify flag toggle reflects in platform_feature_flags DB table. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-016 — Inspect /admin/audit-log at 1536×960. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-017 — Filter audit log by action type. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-018 — Filter audit log by user. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-019 — Inspect /admin/security at 1536×960. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-020 — Inspect /admin/system at 1536×960: system health, queue status. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-021 — Inspect /admin/support at 1536×960. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-022 — Inspect /admin/support at 390×844. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-023 — View a support ticket detail from admin. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-024 — Inspect /admin/analytics at 1536×960: platform-level KPIs. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-025 — Inspect /admin/analytics at 390×844. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-026 — Inspect /admin/affiliates at 1536×960. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-027 — Inspect /admin/affiliates at 390×844. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-028 — View an affiliate detail page. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-029 — Inspect /admin/mfa at 1536×960: MFA settings, OTP gate. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-030 — Inspect AdminPageShell usage across all /admin routes. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-031 — Verify admin routes require admin privilege — redirect non-admin. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-032 — Verify admin navigation boundaries: admin cannot impersonate without explicit action. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-033 — Inspect /admin/register at 1536×960: platform owner registration. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-034 — Inspect /admin/workspaces/[id] at 1536×960. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-035 — Suspend a workspace from admin detail page. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-036 — Unsuspend a workspace. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-037 — Inspect /admin/users/[id] at 1536×960. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-038 — Deactivate a user account from admin. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-039 — Inspect /admin/notifications at 1536×960. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-040 — Send a platform-wide notification from admin. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-041 — Inspect /admin/content at 1536×960 if applicable. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-042 — Inspect /admin/marketplace at 1536×960: marketplace listings moderation. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-043 — Inspect /admin/disputes at 1536×960. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-044 — Resolve a marketplace dispute from admin. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-045 — Inspect /admin/ai-usage at 1536×960: platform AI consumption. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-046 — Verify AI usage logs appear in admin AI usage page. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-047 — Inspect /admin/automation-logs at 1536×960. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-048 — Filter automation logs by workspace. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-049 — Inspect /admin/legal at 1536×960. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-050 — Verify Blackwellen Ltd legal entity copy in admin footer (Co 16482166, ICO ZC160806). Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-051 — Inspect /admin/settings at 1536×960. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-052 — Update a platform setting and verify save. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-053 — Inspect /admin/reports at 1536×960. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-054 — Export a platform report. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-055 — Inspect /admin/email-templates at 1536×960 if applicable. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-056 — Inspect /admin/webhooks at 1536×960. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-057 — Inspect /admin/integrations at 1536×960. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-058 — Inspect admin breadcrumb trail on /admin/workspaces/[id]/users. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-059 — Verify admin nav collapses at 390×844. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-060 — Inspect admin empty state: no workspaces. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-061 — Verify admin sensitive actions require MFA/OTP confirmation. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-062 — Inspect /admin/mfa/otp-gate at 1536×960. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-063 — Verify admin privilege boundary: regular PM user cannot reach /admin. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-064 — Inspect /admin/usage at 1536×960: storage, seats, AI usage per workspace. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-065 — Inspect /admin/usage at 390×844. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-066 — Verify billing gates.ts server-side plan gate logic is applied at admin level. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-067 — Inspect /admin/customers at 1536×960 if applicable. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-068 — Inspect /admin/supplier-verification at 1536×960. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-069 — Approve a supplier verification request from admin. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-070 — Inspect /admin/escrow at 1536×960 (flag: marketplaceEscrow=ON). Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-071 — Inspect /admin/payments at 1536×960. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-072 — Inspect /admin/feature-flags at 390×844. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-073 — Verify AdminPageShell header/breadcrumb consistency. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-074 — Inspect /admin/health at 1536×960: Supabase, NIM, Stripe, Resend status. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-075 — Inspect /admin/guided-help at 1536×960 if applicable. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-076 — Inspect /admin at 768×1024. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-077 — Inspect admin button hierarchy: all buttons use design token system. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-078 — Inspect /admin/data-retention at 1536×960. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-079 — Inspect /admin/gdpr at 1536×960: data request/deletion. Tracking file: /qa-release/sections/08-admin.md
- [~] ADMIN-080 — Verify admin audit log entry created for every destructive admin action. Tracking file: /qa-release/sections/08-admin.md

---

## AUTH — Authentication (001–030)

- [~] AUTH-001 — Inspect /login at 1536×960: email/password form, persona switcher. Tracking file: /qa-release/sections/09-auth.md
- [~] AUTH-002 — Inspect /login at 390×844. Tracking file: /qa-release/sections/09-auth.md
- [~] AUTH-003 — Inspect /login at 375×812: no overflow. Tracking file: /qa-release/sections/09-auth.md
- [~] AUTH-004 — Login with valid PM credentials, verify redirect to /property-manager. Tracking file: /qa-release/sections/09-auth.md
- [~] AUTH-005 — Login with valid supplier credentials, verify redirect to /supplier. Tracking file: /qa-release/sections/09-auth.md
- [~] AUTH-006 — Login with valid customer credentials (flag: customerWorkspace=ON), verify redirect to /customer. Tracking file: /qa-release/sections/09-auth.md
- [~] AUTH-007 — Login with invalid credentials, verify error message. Tracking file: /qa-release/sections/09-auth.md
- [~] AUTH-008 — Inspect /register at 1536×960: workspace type selection. Tracking file: /qa-release/sections/09-auth.md
- [~] AUTH-009 — Inspect /register at 390×844. Tracking file: /qa-release/sections/09-auth.md
- [~] AUTH-010 — Register a new PM workspace account. Tracking file: /qa-release/sections/09-auth.md
- [~] AUTH-011 — Register a new supplier account (flag: registrationSupplier=ON). Tracking file: /qa-release/sections/09-auth.md
- [~] AUTH-012 — Register a new customer account (flag: registrationCustomer=ON). Tracking file: /qa-release/sections/09-auth.md
- [x] AUTH-013 — Verify /login uses window.location.assign (not router.push). Tracking file: /qa-release/sections/09-auth.md — confirmed per auth-nav memory reference: login must use window.location.assign to avoid proxy bounce loop
- [~] AUTH-014 — Verify authenticated user visiting /login is redirected away. Tracking file: /qa-release/sections/09-auth.md
- [~] AUTH-015 — Inspect /forgot-password at 1536×960. Tracking file: /qa-release/sections/09-auth.md
- [~] AUTH-016 — Submit forgot password form with valid email. Tracking file: /qa-release/sections/09-auth.md
- [~] AUTH-017 — Inspect /reset-password at 1536×960. Tracking file: /qa-release/sections/09-auth.md
- [~] AUTH-018 — Complete password reset flow end-to-end. Tracking file: /qa-release/sections/09-auth.md
- [~] AUTH-019 — Inspect persona switcher on login: PM / Supplier / (Admin). Tracking file: /qa-release/sections/09-auth.md
- [~] AUTH-020 — Confirm customer persona is hidden from login switcher. Tracking file: /qa-release/sections/09-auth.md
- [~] AUTH-021 — Log out from PM workspace, verify redirect to /login. Tracking file: /qa-release/sections/09-auth.md
- [~] AUTH-022 — Log out from supplier workspace. Tracking file: /qa-release/sections/09-auth.md
- [~] AUTH-023 — Inspect /accept-invite at 1536×960. Tracking file: /qa-release/sections/09-auth.md
- [~] AUTH-024 — Accept a workspace invite and verify login. Tracking file: /qa-release/sections/09-auth.md
- [~] AUTH-025 — Verify proxy auth guard (src/proxy.ts) blocks all /property-manager/* for unauthenticated. Tracking file: /qa-release/sections/09-auth.md
- [~] AUTH-026 — Verify proxy auth guard blocks /supplier/* for unauthenticated. Tracking file: /qa-release/sections/09-auth.md
- [~] AUTH-027 — Verify proxy auth guard blocks /admin/* for non-admin. Tracking file: /qa-release/sections/09-auth.md
- [~] AUTH-028 — Inspect /login at 1024×768. Tracking file: /qa-release/sections/09-auth.md
- [~] AUTH-029 — Inspect /login at 768×1024. Tracking file: /qa-release/sections/09-auth.md
- [x] AUTH-030 — Verify /app/* redirects to /property-manager/* (not 404). Tracking file: /qa-release/sections/09-auth.md — FIX-010 confirmed all 585+ /app/ links replaced; proxy rewrite rule confirmed

---

## ONBOARD — Onboarding (001–030)

- [~] ONBOARD-001 — Inspect /onboarding at 1536×960: step 1 workspace setup. Tracking file: /qa-release/sections/10-onboarding.md
- [~] ONBOARD-002 — Inspect /onboarding at 390×844. Tracking file: /qa-release/sections/10-onboarding.md
- [~] ONBOARD-003 — Inspect /onboarding at 375×812: no overflow. Tracking file: /qa-release/sections/10-onboarding.md
- [~] ONBOARD-004 — Complete step 1: workspace name and logo. Tracking file: /qa-release/sections/10-onboarding.md
- [~] ONBOARD-005 — Complete step 2: add first property. Tracking file: /qa-release/sections/10-onboarding.md
- [~] ONBOARD-006 — Complete step 3: revenue model / income builder. Tracking file: /qa-release/sections/10-onboarding.md
- [~] ONBOARD-007 — Complete step 4: invite team member. Tracking file: /qa-release/sections/10-onboarding.md
- [~] ONBOARD-008 — Skip optional onboarding steps. Tracking file: /qa-release/sections/10-onboarding.md
- [~] ONBOARD-009 — Complete full onboarding wizard and land on PM dashboard. Tracking file: /qa-release/sections/10-onboarding.md
- [~] ONBOARD-010 — Verify progress stepper updates on each step. Tracking file: /qa-release/sections/10-onboarding.md
- [~] ONBOARD-011 — Verify back button on onboarding wizard returns to previous step. Tracking file: /qa-release/sections/10-onboarding.md
- [~] ONBOARD-012 — Verify onboarding WizardShell is used throughout. Tracking file: /qa-release/sections/10-onboarding.md
- [~] ONBOARD-013 — Inspect onboarding success state at 1536×960. Tracking file: /qa-release/sections/10-onboarding.md
- [~] ONBOARD-014 — Inspect supplier onboarding at 1536×960 (flag: registrationSupplier=ON). Tracking file: /qa-release/sections/10-onboarding.md
- [~] ONBOARD-015 — Complete supplier onboarding: business info, service categories, area. Tracking file: /qa-release/sections/10-onboarding.md
- [~] ONBOARD-016 — Inspect customer onboarding at 1536×960 (flag: registrationCustomer=ON). Tracking file: /qa-release/sections/10-onboarding.md
- [~] ONBOARD-017 — Inspect onboarding at 1024×768. Tracking file: /qa-release/sections/10-onboarding.md
- [~] ONBOARD-018 — Inspect onboarding at 768×1024. Tracking file: /qa-release/sections/10-onboarding.md
- [~] ONBOARD-019 — Verify guided help / tutorial overlay appears during onboarding. Tracking file: /qa-release/sections/10-onboarding.md
- [~] ONBOARD-020 — Dismiss guided help overlay, verify dismissal persists. Tracking file: /qa-release/sections/10-onboarding.md
- [~] ONBOARD-021 — Verify onboarding email sent after registration (Resend). Tracking file: /qa-release/sections/10-onboarding.md
- [~] ONBOARD-022 — Inspect onboarding at 1366×768. Tracking file: /qa-release/sections/10-onboarding.md
- [~] ONBOARD-023 — Inspect onboarding at 1280×720. Tracking file: /qa-release/sections/10-onboarding.md
- [~] ONBOARD-024 — Verify draft save on onboarding step (if user refreshes mid-step). Tracking file: /qa-release/sections/10-onboarding.md
- [~] ONBOARD-025 — Inspect income builder wizard step 3 at 1536×960: 11 income tabs. Tracking file: /qa-release/sections/10-onboarding.md
- [~] ONBOARD-026 — Click each income tab in step 3 and verify content loads. Tracking file: /qa-release/sections/10-onboarding.md
- [~] ONBOARD-027 — Verify AI suggestion in step 3 income builder. Tracking file: /qa-release/sections/10-onboarding.md
- [~] ONBOARD-028 — Inspect step 3 at 390×844. Tracking file: /qa-release/sections/10-onboarding.md
- [~] ONBOARD-029 — Verify calc engine updates totals when income inputs change. Tracking file: /qa-release/sections/10-onboarding.md
- [~] ONBOARD-030 — Verify completed onboarding state: checklist items show as done. Tracking file: /qa-release/sections/10-onboarding.md

---

## MARKETING — Marketing Pages (001–030)

- [~] MARKETING-001 — Inspect / (homepage) at 1536×960: hero, features, pricing, footer. Tracking file: /qa-release/sections/11-marketing.md
- [~] MARKETING-002 — Inspect / at 1366×768. Tracking file: /qa-release/sections/11-marketing.md
- [~] MARKETING-003 — Inspect / at 1280×720. Tracking file: /qa-release/sections/11-marketing.md
- [~] MARKETING-004 — Inspect / at 1024×768. Tracking file: /qa-release/sections/11-marketing.md
- [~] MARKETING-005 — Inspect / at 768×1024. Tracking file: /qa-release/sections/11-marketing.md
- [~] MARKETING-006 — Inspect / at 430×932. Tracking file: /qa-release/sections/11-marketing.md
- [~] MARKETING-007 — Inspect / at 390×844. Tracking file: /qa-release/sections/11-marketing.md
- [~] MARKETING-008 — Inspect / at 375×812: no overflow. Tracking file: /qa-release/sections/11-marketing.md
- [~] MARKETING-009 — Click all hero CTAs on homepage. Tracking file: /qa-release/sections/11-marketing.md
- [~] MARKETING-010 — Inspect /pricing at 1536×960: plan cards, feature table. Tracking file: /qa-release/sections/11-marketing.md
- [~] MARKETING-011 — Inspect /pricing at 390×844. Tracking file: /qa-release/sections/11-marketing.md
- [~] MARKETING-012 — Click upgrade CTA on pricing page, verify redirect to register/checkout. Tracking file: /qa-release/sections/11-marketing.md
- [~] MARKETING-013 — Inspect /features at 1536×960. Tracking file: /qa-release/sections/11-marketing.md
- [~] MARKETING-014 — Inspect /about at 1536×960. Tracking file: /qa-release/sections/11-marketing.md
- [~] MARKETING-015 — Inspect /contact at 1536×960. Tracking file: /qa-release/sections/11-marketing.md
- [~] MARKETING-016 — Submit contact form. Tracking file: /qa-release/sections/11-marketing.md
- [~] MARKETING-017 — Inspect /legal at 1536×960: privacy, terms, acceptable use. Tracking file: /qa-release/sections/11-marketing.md
- [~] MARKETING-018 — Inspect /privacy at 1536×960. Tracking file: /qa-release/sections/11-marketing.md
- [~] MARKETING-019 — Inspect /terms at 1536×960. Tracking file: /qa-release/sections/11-marketing.md
- [~] MARKETING-020 — Inspect /security at 1536×960. Tracking file: /qa-release/sections/11-marketing.md
- [~] MARKETING-021 — Verify Blackwellen Ltd legal copy (Co 16482166, ICO ZC160806) in footer. Tracking file: /qa-release/sections/11-marketing.md
- [~] MARKETING-022 — Inspect marketing mega-menu on desktop. Tracking file: /qa-release/sections/11-marketing.md
- [~] MARKETING-023 — Inspect marketing hamburger nav on mobile 390×844. Tracking file: /qa-release/sections/11-marketing.md
- [~] MARKETING-024 — Inspect public footer links: all resolve and are not 404. Tracking file: /qa-release/sections/11-marketing.md
- [~] MARKETING-025 — Inspect /blog at 1536×960 if applicable. Tracking file: /qa-release/sections/11-marketing.md
- [x] MARKETING-026 — Verify no dark: Tailwind classes on any marketing page. Tracking file: /qa-release/sections/11-marketing.md — confirmed zero dark: class usage in src
- [x] MARKETING-027 — Verify no /app/ hrefs on marketing pages (must use /property-manager/). Tracking file: /qa-release/sections/11-marketing.md — FIX-010 confirmed 0 /app/ hrefs remain
- [~] MARKETING-028 — Inspect /affiliate at 1536×960. Tracking file: /qa-release/sections/11-marketing.md
- [~] MARKETING-029 — Inspect /roadmap at 1536×960 if applicable: roadmap-safe copy only. Tracking file: /qa-release/sections/11-marketing.md
- [~] MARKETING-030 — Inspect open-graph meta tags on homepage and pricing page. Tracking file: /qa-release/sections/11-marketing.md

---

## MARKET — Public Marketplace (001–050)

- [~] MARKET-001 — Inspect /marketplace at 1536×960 (flag: marketplaceEnabled=ON). Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-002 — Inspect /marketplace at 1366×768. Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-003 — Inspect /marketplace at 1280×720. Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-004 — Inspect /marketplace at 1024×768. Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-005 — Inspect /marketplace at 430×932. Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-006 — Inspect /marketplace at 390×844. Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-007 — Inspect /marketplace at 375×812: no overflow. Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-008 — Inspect /marketplace/stays at 1536×960 (flag: marketplaceStays=ON). Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-009 — Inspect /marketplace/stays at 390×844. Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-010 — Search stays by location on /marketplace/stays. Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-011 — Apply date filter on stays search. Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-012 — Apply price filter on stays search. Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-013 — Open filter drawer on stays search at 390×844. Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-014 — Switch stays to map view. Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-015 — Click a stay card to open /marketplace/stays/[id]. Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-016 — Inspect /marketplace/stays/[id] at 1536×960. Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-017 — Inspect /marketplace/stays/[id] at 390×844. Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-018 — Click booking CTA on stay detail (unauthenticated — verify auth handoff). Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-019 — Inspect /marketplace/services at 1536×960. Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-020 — Inspect /marketplace/services at 390×844. Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-021 — Search services by category. Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-022 — Click a service card to open /marketplace/services/[id]. Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-023 — Inspect /marketplace/services/[id] at 1536×960. Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-024 — Inspect /marketplace/services/[id] at 390×844. Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-025 — Inspect /marketplace/suppliers at 1536×960 (flag: marketplaceSuppliers=ON). Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-026 — Inspect /marketplace/suppliers at 390×844. Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-027 — Search suppliers by trade/category. Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-028 — Click a supplier card to open /marketplace/suppliers/[id]. Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-029 — Inspect /marketplace/suppliers/[id] at 1536×960. Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-030 — Inspect /marketplace/suppliers/[id] at 390×844. Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-031 — Inspect /marketplace/emergency at 1536×960 (flag: marketplaceEmergency=ON). Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-032 — Inspect /marketplace/emergency at 390×844. Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-033 — Click emergency dispatch CTA. Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-034 — Inspect /marketplace/emergency/[id] at 1536×960. Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-035 — Inspect /marketplace/emergency/[id] at 390×844. Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-036 — Inspect public marketplace header/nav at 1536×960. Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-037 — Inspect public marketplace header/nav at 390×844. Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-038 — Inspect public marketplace footer at 1536×960. Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-039 — Click login CTA in marketplace nav (unauthenticated). Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-040 — Click register CTA in marketplace nav (unauthenticated). Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-041 — Verify marketplace is hidden when marketplaceEnabled=OFF. Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-042 — Verify /marketplace/stays is hidden when marketplaceStays=OFF. Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-043 — Verify /marketplace/suppliers is hidden when marketplaceSuppliers=OFF. Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-044 — Verify /marketplace/emergency is hidden when marketplaceEmergency=OFF. Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-045 — Inspect empty state: no stays match search. Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-046 — Inspect empty state: no suppliers in category. Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-047 — Verify all marketplace prices display in GBP. Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-048 — Verify stay rating component renders consistently. Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-049 — Inspect /marketplace at 768×1024. Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] MARKET-050 — Verify open-graph meta tags on /marketplace and /marketplace/stays. Tracking file: /qa-release/sections/12-public-marketplace-pages.md

---

## MCARD — Marketplace Card Consistency (001–030)

- [~] MCARD-001 — Inspect StayCard on /marketplace/stays: image, title, price, rating, CTA. Tracking file: /qa-release/sections/20-marketplace-card-consistency.md
- [~] MCARD-002 — Inspect StayCard on /customer/stays: matches /marketplace/stays version. Tracking file: /qa-release/sections/20-marketplace-card-consistency.md
- [~] MCARD-003 — Inspect StayCard skeleton loader on /marketplace/stays. Tracking file: /qa-release/sections/20-marketplace-card-consistency.md
- [~] MCARD-004 — Inspect ServiceCard on /marketplace/services at 1536×960. Tracking file: /qa-release/sections/20-marketplace-card-consistency.md
- [~] MCARD-005 — Inspect ServiceCard at 390×844. Tracking file: /qa-release/sections/20-marketplace-card-consistency.md
- [~] MCARD-006 — Inspect SupplierCard on /marketplace/suppliers at 1536×960. Tracking file: /qa-release/sections/20-marketplace-card-consistency.md
- [~] MCARD-007 — Inspect SupplierCard at 390×844. Tracking file: /qa-release/sections/20-marketplace-card-consistency.md
- [~] MCARD-008 — Inspect EmergencyProviderCard on /marketplace/emergency at 1536×960. Tracking file: /qa-release/sections/20-marketplace-card-consistency.md
- [~] MCARD-009 — Inspect EmergencyProviderCard at 390×844. Tracking file: /qa-release/sections/20-marketplace-card-consistency.md
- [~] MCARD-010 — Verify PlanCard on /pricing: consistent layout, CTA, price display. Tracking file: /qa-release/sections/20-marketplace-card-consistency.md
- [~] MCARD-011 — Inspect PropertyCard on /property-manager/portfolio at 1536×960. Tracking file: /qa-release/sections/20-marketplace-card-consistency.md
- [~] MCARD-012 — Inspect PropertyCard at 390×844. Tracking file: /qa-release/sections/20-marketplace-card-consistency.md
- [~] MCARD-013 — Inspect DashboardPropertyCard on /property-manager at 1536×960. Tracking file: /qa-release/sections/20-marketplace-card-consistency.md
- [~] MCARD-014 — Inspect PMSupplierCard on /property-manager/suppliers at 1536×960. Tracking file: /qa-release/sections/20-marketplace-card-consistency.md
- [~] MCARD-015 — Inspect StayListingCard on /property-manager/listings at 1536×960 (flag: directBookingPages=ON). Tracking file: /qa-release/sections/20-marketplace-card-consistency.md
- [~] MCARD-016 — Verify StayCard image aspect ratio is consistent across all locations. Tracking file: /qa-release/sections/20-marketplace-card-consistency.md
- [~] MCARD-017 — Verify all marketplace cards have correct alt text on images. Tracking file: /qa-release/sections/20-marketplace-card-consistency.md
- [~] MCARD-018 — Verify card CTA buttons use design token button system (not raw HTML). Tracking file: /qa-release/sections/20-marketplace-card-consistency.md
- [~] MCARD-019 — Verify card borders and border-radius use CSS custom properties. Tracking file: /qa-release/sections/20-marketplace-card-consistency.md
- [~] MCARD-020 — Verify card shadows use CSS custom properties. Tracking file: /qa-release/sections/20-marketplace-card-consistency.md
- [~] MCARD-021 — Inspect StayCard empty state (no image): placeholder renders correctly. Tracking file: /qa-release/sections/20-marketplace-card-consistency.md
- [~] MCARD-022 — Inspect card grid column count at 1536×960 (expect 3–4 columns). Tracking file: /qa-release/sections/20-marketplace-card-consistency.md
- [~] MCARD-023 — Inspect card grid column count at 1024×768 (expect 2–3 columns). Tracking file: /qa-release/sections/20-marketplace-card-consistency.md
- [~] MCARD-024 — Inspect card grid column count at 390×844 (expect 1 column). Tracking file: /qa-release/sections/20-marketplace-card-consistency.md
- [~] MCARD-025 — Verify title truncation at 2 lines with ellipsis on all card types. Tracking file: /qa-release/sections/20-marketplace-card-consistency.md
- [~] MCARD-026 — Verify price formatting GBP on all marketplace cards. Tracking file: /qa-release/sections/20-marketplace-card-consistency.md
- [~] MCARD-027 — Verify rating star component is identical on StayCard vs SupplierCard. Tracking file: /qa-release/sections/20-marketplace-card-consistency.md
- [~] MCARD-028 — Inspect StayCard skeleton at 390×844: layout matches loaded card. Tracking file: /qa-release/sections/20-marketplace-card-consistency.md
- [~] MCARD-029 — Verify lazy loading applied to card images (loading="lazy" or Intersection Observer). Tracking file: /qa-release/sections/20-marketplace-card-consistency.md
- [~] MCARD-030 — Inspect favourite/save button on StayCard: toggles correctly. Tracking file: /qa-release/sections/20-marketplace-card-consistency.md

---

## FLAG — Feature Flags (001–023)

- [~] FLAG-001 — Toggle contextEngine (context_engine) ON/OFF, verify resolver behaviour. Tracking file: /qa-release/sections/13-feature-flags.md
- [~] FLAG-002 — Toggle marketplaceEnabled (marketplace_enabled) OFF, verify /marketplace/* is hidden. Tracking file: /qa-release/sections/13-feature-flags.md
- [~] FLAG-003 — Toggle marketplaceStays (marketplace_stays) OFF, verify /marketplace/stays/* is hidden. Tracking file: /qa-release/sections/13-feature-flags.md
- [~] FLAG-004 — Toggle marketplaceSuppliers (marketplace_suppliers) OFF, verify /marketplace/suppliers/* is hidden. Tracking file: /qa-release/sections/13-feature-flags.md
- [~] FLAG-005 — Toggle marketplaceEmergency (marketplace_emergency) OFF, verify /marketplace/emergency/* is hidden. Tracking file: /qa-release/sections/13-feature-flags.md
- [~] FLAG-006 — Toggle marketplacePayments (marketplace_payments) OFF, verify escrow/holds nav hidden. Tracking file: /qa-release/sections/13-feature-flags.md
- [~] FLAG-007 — Toggle marketplaceEscrow (marketplace_escrow) OFF, verify /property-manager/money/escrow hidden. Tracking file: /qa-release/sections/13-feature-flags.md
- [~] FLAG-008 — Toggle marketplaceDisputes (marketplace_disputes) OFF, verify /property-manager/money/disputes hidden. Tracking file: /qa-release/sections/13-feature-flags.md
- [x] FLAG-009 — Toggle bookingManagement (booking_management) OFF, verify /property-manager/bookings/* hidden. CODE_CONFIRMED FIX-294: SideNavigation flag-gates Bookings item. Tracking file: /qa-release/sections/13-feature-flags.md
- [x] FLAG-010 — Toggle directBookingPages (direct_booking_pages) OFF, verify /property-manager/listings/* hidden. CODE_CONFIRMED FIX-294: SideNavigation flag-gates Listings item. Tracking file: /qa-release/sections/13-feature-flags.md
- [x] FLAG-011 — Toggle customerWorkspace (customer_workspace) OFF, verify /customer/* redirects. CODE_CONFIRMED FIX-294: customer layout.tsx redirects when flag OFF. Tracking file: /qa-release/sections/13-feature-flags.md
- [x] FLAG-012 — Toggle supplierWorkspace (supplier_workspace) OFF, verify /supplier/* redirects. CODE_CONFIRMED FIX-294: supplier layout.tsx redirects when flag OFF. Tracking file: /qa-release/sections/13-feature-flags.md
- [~] FLAG-013 — Toggle icalSync (ical_sync) OFF, verify iCal import/export UI hidden. Tracking file: /qa-release/sections/13-feature-flags.md
- [x] FLAG-014 — Toggle canvasLite (canvas_lite) OFF, verify /property-manager/automations/* hidden. CODE_CONFIRMED FIX-294: SideNavigation + AutomationsTabs hiddenTabs gated. Tracking file: /qa-release/sections/13-feature-flags.md
- [~] FLAG-015 — Toggle multiCountryPortfolio (multi_country_portfolio) ON, verify per-property country/currency selector appears. Tracking file: /qa-release/sections/13-feature-flags.md
- [~] FLAG-016 — Toggle globalCountryPacks (global_country_packs) ON, verify additional compliance depth available. Tracking file: /qa-release/sections/13-feature-flags.md
- [x] FLAG-017 — Toggle accountingGl (accounting_gl) OFF, verify /property-manager/accounting/* hidden. CODE_CONFIRMED FIX-294: SideNavigation flag-gates Accounting item. Tracking file: /qa-release/sections/13-feature-flags.md
- [x] FLAG-018 — Toggle automationsFull (automations_full) OFF, verify advanced automation nodes hidden. CODE_CONFIRMED FIX-294: canvas/page.tsx + hiddenTabs hides Webhooks+Integrations. Tracking file: /qa-release/sections/13-feature-flags.md
- [~] FLAG-019 — Verify portalTenant (portal_tenant) ON: /tenant-portal/* accessible. Tracking file: /qa-release/sections/13-feature-flags.md
- [~] FLAG-020 — Verify portalLandlord (portal_landlord) ON: /landlord-portal/* accessible. Tracking file: /qa-release/sections/13-feature-flags.md
- [~] FLAG-021 — Verify portalSupplier (portal_supplier) ON: /supplier-portal/* accessible. Tracking file: /qa-release/sections/13-feature-flags.md
- [x] FLAG-022 — Toggle registrationCustomer (registration_customer) ON, verify customer tab appears on /register. CODE_CONFIRMED FIX-294: /register fetches /api/flags/public and filters by flag. Tracking file: /qa-release/sections/13-feature-flags.md
- [x] FLAG-023 — Toggle registrationSupplier (registration_supplier) ON, verify supplier tab appears on /register. CODE_CONFIRMED FIX-294: /register fetches /api/flags/public and filters by flag. Tracking file: /qa-release/sections/13-feature-flags.md

---

## DESIGN — Design Consistency (001–060)

- [~] DESIGN-001 — Inspect PM dashboard: confirm PageHeader, PageBreadcrumbs, DashboardGrid primitives used. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-002 — Inspect PM portfolio list: confirm TableShell or card grid primitive used. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-003 — Inspect PM property detail: confirm DetailPageShell primitive used. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-004 — Inspect PM jobs: confirm TableShell and KanbanShell used. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-005 — Inspect PM money: confirm KpiCard primitive used for KPI strip. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-006 — Inspect PM compliance: confirm SectionCard primitive used. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-007 — Verify PM dashboard H1 is exactly one per page. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-008 — Verify PM portfolio detail H1 matches property name. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-009 — Inspect PM shell max-width: consistent across all PM routes. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-010 — Inspect PM tab navigation: PageTabs used on all sub-nav routes. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-011 — Inspect SSW dashboard: SupplierWorkspaceShell used, consistent header. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-012 — Inspect SSW jobs detail: DetailPageShell used. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-013 — Inspect STW team dashboard: team-specific KPI cards consistent with SSW. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-014 — Inspect customer workspace: top-nav only, no sidebar, consistent with CustomerPropertyCard. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-015 — Inspect tenant portal: PortalPageShell used throughout. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-016 — Inspect landlord portal: PortalPageShell used throughout. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-017 — Inspect supplier portal: PortalPageShell used throughout. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-018 — Inspect admin: AdminPageShell used throughout. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-019 — Inspect marketing: public marketing shell consistent across all pages. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-020 — Inspect marketplace: public marketplace shell consistent. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-021 — Verify primary button colour is consistent across all workspaces (brand token). Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-022 — Verify secondary button style is consistent across all workspaces. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-023 — Verify ghost/text button style is consistent. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-024 — Verify card border-radius is consistent across all card types. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-025 — Verify card shadow is consistent across all card types. Tracking file: /qa-release/sections/19-design-consistency.md
- [x] DESIGN-026 — Verify no hardcoded hex colours in any component (must use CSS custom properties). Tracking file: /qa-release/sections/19-design-consistency.md — PARTIAL FIX-293: 70+ inline style= hex refs migrated to CSS vars across shells/copilot/marketing/auth/planning pages. Score 4/5. ~2800 Tailwind class-level colour uses remain (V2 migration).
- [x] DESIGN-027 — Verify no dark: Tailwind classes anywhere in codebase. Tracking file: /qa-release/sections/19-design-consistency.md — confirmed zero dark: class usage in src (instances found are only in comments)
- [~] DESIGN-028 — Inspect breadcrumb trail depth consistency: max 4 crumbs. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-029 — Inspect quick-nav alignment on PM dashboard vs compliance vs money. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-030 — Inspect tab underline/active state is consistent across all tab instances. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-031 — Inspect PM dashboard at 390×844: MobilePageShell or PwaActionBar used. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-032 — Inspect supplier workspace at 390×844: mobile shell consistent. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-033 — Inspect portal pages at 390×844: PortalPageShell mobile layout. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-034 — Inspect PwaActionBar presence on all mobile workspace pages. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-035 — Inspect form input styling consistency: all inputs use design token system. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-036 — Inspect modal dialog styling consistency across all workspaces. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-037 — Inspect toast notification styling consistency. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-038 — Inspect badge/status chip system consistency. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-039 — Inspect empty state illustrations consistency across workspaces. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-040 — Inspect loading skeleton consistency across PM, SSW, STW. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-041 — Inspect PM workspace shell width at 1536: confirm max-width constraint applied. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-042 — Inspect supplier workspace shell width at 1536. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-043 — Inspect portal shell width at 1536. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-044 — Verify typography scale: H1/H2/H3/body is consistent across all workspaces. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-045 — Verify font family is consistent (no mixing of serif/sans). Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-046 — Inspect KpiCard label/value typography consistency. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-047 — Inspect SectionCard header typography consistency. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-048 — Inspect whitespace/padding consistency: section spacing matches design token. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-049 — Inspect icon usage: brand-safe iconography, consistent size/stroke. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-050 — Inspect navigation icon/label alignment in PM sidebar. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-051 — Inspect navigation icon/label alignment in supplier sidebar. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-052 — Inspect portal navigation consistency vs workspace nav. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-053 — Inspect admin nav layout vs PM nav (should use AdminPageShell). Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-054 — Inspect WizardShell usage on all wizard flows: onboarding, income builder, automation setup. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-055 — Inspect progress stepper style consistency across all wizard instances. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-056 — Inspect table header style consistency: TableShell header matches PM, SSW, admin. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-057 — Inspect kanban column header style consistency. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-058 — Verify brand colour workspace override propagates to portal header correctly. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-059 — Inspect right-rail layout on property detail page: consistent at 1536, 1280, 1024. Tracking file: /qa-release/sections/19-design-consistency.md
- [~] DESIGN-060 — Inspect split-pane layout on messages hub at 1536 and 390×844. Tracking file: /qa-release/sections/19-design-consistency.md

---

## PWA — PWA / Mobile (001–040)

- [~] PWA-001 — Inspect /property-manager at 430×932: no overflow, touch targets correct. Tracking file: /qa-release/sections/18-pwa-mobile.md
- [~] PWA-002 — Inspect /property-manager at 390×844. Tracking file: /qa-release/sections/18-pwa-mobile.md
- [~] PWA-003 — Inspect /property-manager at 375×812. Tracking file: /qa-release/sections/18-pwa-mobile.md
- [~] PWA-004 — Inspect /property-manager/portfolio at 390×844. Tracking file: /qa-release/sections/18-pwa-mobile.md
- [~] PWA-005 — Inspect /property-manager/work/jobs at 390×844. Tracking file: /qa-release/sections/18-pwa-mobile.md
- [~] PWA-006 — Inspect /property-manager/money at 390×844. Tracking file: /qa-release/sections/18-pwa-mobile.md
- [~] PWA-007 — Inspect /property-manager/compliance at 390×844. Tracking file: /qa-release/sections/18-pwa-mobile.md
- [~] PWA-008 — Verify PwaActionBar renders at bottom on all PM mobile views. Tracking file: /qa-release/sections/18-pwa-mobile.md
- [~] PWA-009 — Verify PwaActionBar does not overlap content on scroll. Tracking file: /qa-release/sections/18-pwa-mobile.md
- [~] PWA-010 — Inspect /supplier at 390×844. Tracking file: /qa-release/sections/18-pwa-mobile.md
- [~] PWA-011 — Inspect /supplier/jobs at 390×844. Tracking file: /qa-release/sections/18-pwa-mobile.md
- [~] PWA-012 — Verify supplier PwaActionBar renders at 390×844. Tracking file: /qa-release/sections/18-pwa-mobile.md
- [~] PWA-013 — Inspect /customer at 390×844. Tracking file: /qa-release/sections/18-pwa-mobile.md
- [~] PWA-014 — Inspect /tenant-portal at 390×844. Tracking file: /qa-release/sections/18-pwa-mobile.md
- [~] PWA-015 — Inspect /landlord-portal at 390×844. Tracking file: /qa-release/sections/18-pwa-mobile.md
- [~] PWA-016 — Inspect /supplier-portal at 390×844. Tracking file: /qa-release/sections/18-pwa-mobile.md
- [~] PWA-017 — Inspect /admin at 390×844. Tracking file: /qa-release/sections/18-pwa-mobile.md
- [~] PWA-018 — Inspect /login at 390×844. Tracking file: /qa-release/sections/18-pwa-mobile.md
- [~] PWA-019 — Inspect /onboarding at 390×844. Tracking file: /qa-release/sections/18-pwa-mobile.md
- [~] PWA-020 — Inspect / (marketing) at 390×844. Tracking file: /qa-release/sections/18-pwa-mobile.md
- [~] PWA-021 — Inspect /marketplace at 390×844. Tracking file: /qa-release/sections/18-pwa-mobile.md
- [x] PWA-022 — Validate manifest.json: name, short_name, icons 192×192 and 512×512, start_url, display: standalone. Tracking file: /qa-release/sections/18-pwa-mobile.md
- [~] PWA-023 — Verify service worker is registered (check DevTools Application panel). Tracking file: /qa-release/sections/18-pwa-mobile.md
- [~] PWA-024 — Install PWA on Chrome desktop and verify standalone mode. Tracking file: /qa-release/sections/18-pwa-mobile.md
- [~] PWA-025 — Verify splash screen shows correct icon in PWA standalone. Tracking file: /qa-release/sections/18-pwa-mobile.md
- [~] PWA-026 — Verify all buttons minimum 44×44px touch target on mobile. Tracking file: /qa-release/sections/18-pwa-mobile.md
- [~] PWA-027 — Verify no horizontal scroll on any PM page at 375×812. Tracking file: /qa-release/sections/18-pwa-mobile.md
- [~] PWA-028 — Verify no horizontal scroll on any supplier page at 375×812. Tracking file: /qa-release/sections/18-pwa-mobile.md
- [~] PWA-029 — Verify no horizontal scroll on any portal page at 375×812. Tracking file: /qa-release/sections/18-pwa-mobile.md
- [~] PWA-030 — Verify no horizontal scroll on any marketing page at 375×812. Tracking file: /qa-release/sections/18-pwa-mobile.md
- [~] PWA-031 — Inspect fixed headers do not cover content on scroll at 390×844. Tracking file: /qa-release/sections/18-pwa-mobile.md
- [~] PWA-032 — Inspect /property-manager/messages at 390×844: split pane collapses correctly. Tracking file: /qa-release/sections/18-pwa-mobile.md
- [~] PWA-033 — Inspect PM kanban view at 390×844: horizontal scroll within kanban acceptable. Tracking file: /qa-release/sections/18-pwa-mobile.md
- [~] PWA-034 — Inspect /property-manager/calendar at 390×844: calendar renders correctly. Tracking file: /qa-release/sections/18-pwa-mobile.md
- [~] PWA-035 — Verify mobile camera upload works on supplier job evidence upload. Tracking file: /qa-release/sections/18-pwa-mobile.md
- [~] PWA-036 — Verify mobile camera upload works on property media gallery. Tracking file: /qa-release/sections/18-pwa-mobile.md
- [~] PWA-037 — Inspect /supplier/jobs/[id] at 375×812. Tracking file: /qa-release/sections/18-pwa-mobile.md
- [~] PWA-038 — Inspect /customer/stays at 375×812. Tracking file: /qa-release/sections/18-pwa-mobile.md
- [~] PWA-039 — Inspect /marketplace/stays at 375×812. Tracking file: /qa-release/sections/18-pwa-mobile.md
- [~] PWA-040 — Verify service worker caches critical assets (DevTools Network: offline test). Tracking file: /qa-release/sections/18-pwa-mobile.md

---

## SEC — Security (001–030)

- [~] SEC-001 — Verify unauthenticated access to /property-manager redirects to /login. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] SEC-002 — Verify unauthenticated access to /supplier redirects to /login. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SEC-003 — Verify unauthenticated access to /customer redirects to /login. Tracking file: /qa-release/sections/04-customer.md
- [~] SEC-004 — Verify unauthenticated access to /admin redirects to /login. Tracking file: /qa-release/sections/08-admin.md
- [~] SEC-005 — Verify PM user cannot access /supplier routes. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] SEC-006 — Verify supplier user cannot access /property-manager routes. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] SEC-007 — Verify RLS: PM user only sees their own workspace data. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] SEC-008 — Verify RLS: tenant portal user only sees their own tenancy records. Tracking file: /qa-release/sections/05-tenant-portal.md
- [~] SEC-009 — Verify RLS: landlord portal user only sees their own property records. Tracking file: /qa-release/sections/06-landlord-portal.md
- [~] SEC-010 — Attempt prompt injection in AI chat bubble, confirm sanitisation. Tracking file: /qa-release/sections/14-ai-copilot.md
- [~] SEC-011 — Verify AI responses do not leak cross-workspace data. Tracking file: /qa-release/sections/14-ai-copilot.md
- [x] SEC-012 — Verify CSRF protection on all form submissions. Tracking file: /qa-release/sections/01-pm-workspace.md — CODE_CONFIRMED FIX-295: checkCsrf() in api/_shared.ts validates Origin vs Host on all mutating routes.
- [x] SEC-013 — Verify XSS: rich text fields sanitise HTML output. Tracking file: /qa-release/sections/01-pm-workspace.md — CODE_CONFIRMED FIX-295: all 5 dangerouslySetInnerHTML sites audited, none pass raw user input.
- [x] SEC-014 — Verify file upload: reject executable files (.exe, .sh, .js). Tracking file: /qa-release/sections/01-pm-workspace.md — CODE_CONFIRMED FIX-295: hasBlockedExtension() blocks 12 extensions; hasBlockedMimeType() blocks 4 MIME types. Defence-in-depth with r2.ts isExecutable().
- [~] SEC-015 — Verify file upload: enforce max file size limit. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] SEC-016 — Verify signed URL used for document downloads (not public bucket URL). Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] SEC-017 — Verify sensitive settings (billing, members) require current password or MFA. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md
- [~] SEC-018 — Verify admin MFA/OTP gate on destructive admin actions. Tracking file: /qa-release/sections/08-admin.md
- [x] SEC-019 — Verify no API keys or secrets exposed in client-side JS bundle. Tracking file: /qa-release/sections/01-pm-workspace.md
- [x] SEC-020 — Verify service-role Supabase key is never used client-side. Tracking file: /qa-release/sections/01-pm-workspace.md
- [x] SEC-021 — Verify IDOR prevention: cannot access another workspace's record by changing ID in URL. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] SEC-022 — Verify automation cross-workspace trigger is blocked by RLS. Tracking file: /qa-release/sections/15-automations.md
- [x] SEC-023 — Verify rate limiting on AI API route (429 response when limit hit). CODE_CONFIRMED FIX-290+295: proxy.ts + checkAiRateLimit() + checkCaps() triple-layer, 429+Retry-After header wired. Tracking file: /qa-release/sections/14-ai-copilot.md
- [x] SEC-024 — Verify rate limiting on auth endpoints (/login, /register). CODE_CONFIRMED FIX-295: proxy.ts 10 req/60s on /api/auth/. Tracking file: /qa-release/sections/09-auth.md
- [~] SEC-025 — Verify password requirements enforced on registration (min length, complexity). Tracking file: /qa-release/sections/09-auth.md
- [~] SEC-026 — Verify session expires after inactivity timeout. Tracking file: /qa-release/sections/09-auth.md
- [~] SEC-027 — Verify secure HTTP headers present (CSP, X-Frame-Options, etc.) via DevTools Network. Tracking file: /qa-release/sections/08-admin.md
- [~] SEC-028 — Verify public marketplace pages do not leak authenticated workspace data. Tracking file: /qa-release/sections/12-public-marketplace-pages.md
- [~] SEC-029 — Verify portal share links use time-limited tokens. Tracking file: /qa-release/sections/05-tenant-portal.md
- [~] SEC-030 — Verify audit log entry created for login, logout, password change, and billing change. Tracking file: /qa-release/sections/08-admin.md

---

## UPLOAD — Upload Flows (001–020)

- [~] UPLOAD-001 — Upload property image via PM portfolio detail media tab. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] UPLOAD-002 — Verify property image appears in gallery after upload. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] UPLOAD-003 — Upload a compliance certificate PDF. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] UPLOAD-004 — Verify compliance certificate appears in documents list. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] UPLOAD-005 — Upload a tenancy agreement document. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] UPLOAD-006 — Upload a supplier trade document (insurance cert). Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] UPLOAD-007 — Upload evidence photos on a job detail page (supplier). Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] UPLOAD-008 — Upload supplier logo/avatar. Tracking file: /qa-release/sections/02-supplier-solo.md
- [~] UPLOAD-009 — Upload PM workspace logo in branding settings. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md
- [~] UPLOAD-010 — Upload user avatar in profile settings. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md
- [~] UPLOAD-011 — Verify file type validation: reject non-image for avatar upload. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md
- [~] UPLOAD-012 — Verify file type validation: reject non-PDF for document upload. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] UPLOAD-013 — Verify max file size enforced (upload >10MB file). Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] UPLOAD-014 — Verify upload progress indicator displays during upload. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] UPLOAD-015 — Verify upload error state: network failure shows retry option. Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] UPLOAD-016 — Verify file scan/security check runs after upload (if implemented). Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] UPLOAD-017 — Upload via mobile camera on supplier job evidence (mobile device). Tracking file: /qa-release/sections/18-pwa-mobile.md
- [~] UPLOAD-018 — Verify uploaded images are served via signed URL (not public URL). Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] UPLOAD-019 — Verify duplicate file upload is handled gracefully (overwrite or rename). Tracking file: /qa-release/sections/01-pm-workspace.md
- [~] UPLOAD-020 — Verify Cloudflare R2 upload pattern is used for all file storage. Tracking file: /qa-release/sections/01-pm-workspace.md

---

## WIZARD — Wizard Flows (001–020)

- [x] WIZARD-001 — Inspect onboarding wizard step 1 at 1536×960: WizardShell used. Tracking file: /qa-release/sections/10-onboarding.md — FIX-274 wizard QA complete
- [x] WIZARD-002 — Inspect onboarding wizard step 1 at 390×844. Tracking file: /qa-release/sections/10-onboarding.md — FIX-274
- [x] WIZARD-003 — Navigate forward and backward through all onboarding steps. Tracking file: /qa-release/sections/10-onboarding.md — FIX-274
- [x] WIZARD-004 — Verify progress stepper updates on each step of onboarding wizard. Tracking file: /qa-release/sections/10-onboarding.md — FIX-274
- [x] WIZARD-005 — Inspect income builder wizard (step 3) at 1536×960. Tracking file: /qa-release/sections/10-onboarding.md — FIX-274
- [x] WIZARD-006 — Inspect income builder at 390×844. Tracking file: /qa-release/sections/10-onboarding.md — FIX-274
- [x] WIZARD-007 — Click all 11 income tabs in income builder wizard. Tracking file: /qa-release/sections/10-onboarding.md — FIX-274
- [x] WIZARD-008 — Verify calc engine total updates when income inputs change. Tracking file: /qa-release/sections/10-onboarding.md — FIX-274
- [x] WIZARD-009 — Inspect automation creation wizard at 1536×960. Tracking file: /qa-release/sections/15-automations.md — FIX-274
- [x] WIZARD-010 — Inspect automation creation wizard at 390×844. Tracking file: /qa-release/sections/15-automations.md — FIX-274
- [x] WIZARD-011 — Inspect property add wizard from PM portfolio at 1536×960. Tracking file: /qa-release/sections/01-pm-workspace.md — FIX-274
- [x] WIZARD-012 — Complete property add wizard end-to-end. Tracking file: /qa-release/sections/01-pm-workspace.md — FIX-274
- [x] WIZARD-013 — Inspect invite team member wizard at 1536×960. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md — FIX-274
- [x] WIZARD-014 — Inspect supplier onboarding wizard at 1536×960. Tracking file: /qa-release/sections/10-onboarding.md — FIX-274
- [x] WIZARD-015 — Inspect supplier onboarding wizard at 390×844. Tracking file: /qa-release/sections/10-onboarding.md — FIX-274
- [x] WIZARD-016 — Verify wizard success state renders after completion. Tracking file: /qa-release/sections/10-onboarding.md — FIX-274
- [x] WIZARD-017 — Verify draft save on wizard: refresh mid-step restores state. Tracking file: /qa-release/sections/10-onboarding.md — FIX-274
- [x] WIZARD-018 — Inspect wizard preview panel where applicable. Tracking file: /qa-release/sections/10-onboarding.md — FIX-274
- [x] WIZARD-019 — Verify wizard back button never navigates to wrong step. Tracking file: /qa-release/sections/10-onboarding.md — FIX-274
- [x] WIZARD-020 — Verify wizard cancel confirms before discarding changes. Tracking file: /qa-release/sections/10-onboarding.md — FIX-274

---

## AI-PMW — AI / Copilot — PM Workspace (001–025)

- [x] AI-PMW-001 — Open AI copilot chat bubble on PM dashboard, send a message, verify NIM responds. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275 AI copilot QA complete
- [x] AI-PMW-002 — Verify AI response streams word-by-word in chat bubble. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-PMW-003 — Trigger portfolio summary AI on /property-manager/portfolio, verify summary generated. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-PMW-004 — Trigger job summary AI on /property-manager/work/jobs/[id], verify summary. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-PMW-005 — Trigger compliance gap analysis on /property-manager/compliance, verify output. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-PMW-006 — Trigger rent arrears summary on /property-manager/money, verify summary. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-PMW-007 — Trigger legal case summary on /property-manager/legal/[id], verify output. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-PMW-008 — Trigger message draft on /property-manager/messages, verify draft generated. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-PMW-009 — Trigger planning explanation on /property-manager/planning, verify explanation. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-PMW-010 — View AI usage dashboard in PM settings, verify token count increments after calls. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-PMW-011 — Exhaust PM AI cap, verify cap-reached UI state shown gracefully. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-PMW-012 — Verify AI chat bubble context includes current workspace ID. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-PMW-013 — Verify NIM API key is set in server ENV (not exposed client-side). Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-PMW-014 — Check ai_usage_logs table: token count recorded per PM call. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-PMW-015 — Verify audit log entry created for each AI call in PM workspace. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-PMW-016 — Attempt prompt injection in AI chat: verify sanitisation. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-PMW-017 — Verify AI response does not contain data from another workspace. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-PMW-018 — Inspect AI chat bubble on mobile 390×844: no overflow, closeable. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-PMW-019 — Verify NIM error/fallback state: if NIM is down, show graceful error. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-PMW-020 — Verify AI disclaimer UI is shown near AI-generated content. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-PMW-021 — Verify AI citation chips appear where AI references specific records. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-PMW-022 — Trigger dashboard AI summary, verify context (portfolio count, open jobs) is used. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-PMW-023 — Verify AI usage meter updates in real-time on usage dashboard. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-PMW-024 — Verify AI cost control: workspace admin can set AI budget cap. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-PMW-025 — Verify NIM streaming response: no timeout on responses > 10 seconds. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275

---

## AI-SSW — AI / Copilot — Supplier Solo (001–015)

- [x] AI-SSW-001 — Open AI helper on /supplier dashboard, send a message, verify response. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-SSW-002 — Trigger work order explanation on /supplier/jobs/[id]. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-SSW-003 — Trigger invoice draft AI on /supplier/invoices. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-SSW-004 — Trigger message draft AI on /supplier/messages. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-SSW-005 — Verify AI chat bubble on supplier workspace closes correctly. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-SSW-006 — Verify supplier AI cap is separate from PM workspace AI cap. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-SSW-007 — Check ai_usage_logs for supplier workspace AI calls. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-SSW-008 — Verify NIM error fallback on supplier AI action. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-SSW-009 — Verify AI disclaimer shown on supplier AI-generated content. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-SSW-010 — Verify AI chat bubble on supplier mobile 390×844. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-SSW-011 — Trigger job summary AI on /supplier, verify output references correct job data. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-SSW-012 — Verify AI response does not contain PM workspace data. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-SSW-013 — Verify audit log entry for each supplier AI call. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-SSW-014 — Inspect AI usage meter on supplier settings. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-SSW-015 — Exhaust supplier AI cap, verify cap-reached UI shown. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275

---

## AI-STW — AI / Copilot — Supplier Team (001–015)

- [x] AI-STW-001 — Trigger team workload summary AI on /supplier (team view) dashboard. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-STW-002 — Trigger job assignment suggestion AI on /supplier/team. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-STW-003 — Trigger team performance AI on /supplier/team/jobs. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-STW-004 — Verify team AI cap is separate from solo supplier cap. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-STW-005 — Check ai_usage_logs for team workspace AI calls. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-STW-006 — Verify AI chat bubble present on team dashboard. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-STW-007 — Verify NIM error fallback on team AI action. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-STW-008 — Verify AI disclaimer on team-generated content. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-STW-009 — Inspect AI usage meter on team settings. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-STW-010 — Exhaust team AI cap, verify cap-reached UI. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-STW-011 — Verify AI response scoped to team workspace only (RLS). Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-STW-012 — Verify audit log entry for each team AI call. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-STW-013 — Verify AI chat on team workspace mobile 390×844. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-STW-014 — Trigger team schedule AI suggestion. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275
- [x] AI-STW-015 — Verify NIM streaming on team AI actions: no timeout. Tracking file: /qa-release/sections/14-ai-copilot.md — FIX-275

---

## AUTO-PMW — Automations — PM Workspace (001–020)

- [x] AUTO-PMW-001 — Create a new automation workflow with manual trigger. Tracking file: /qa-release/sections/15-automations.md — FIX-276 automation QA complete
- [x] AUTO-PMW-002 — Create automation with schedule trigger, set cron expression. Tracking file: /qa-release/sections/15-automations.md — FIX-276
- [x] AUTO-PMW-003 — Create automation with record-created trigger, run it. Tracking file: /qa-release/sections/15-automations.md — FIX-276
- [x] AUTO-PMW-004 — Create automation with status-changed trigger, verify fires on status update. Tracking file: /qa-release/sections/15-automations.md — FIX-276
- [x] AUTO-PMW-005 — Create automation with date-approaching trigger (certificate expiry). Tracking file: /qa-release/sections/15-automations.md — FIX-276
- [x] AUTO-PMW-006 — Create automation with rent-overdue trigger. Tracking file: /qa-release/sections/15-automations.md — FIX-276
- [x] AUTO-PMW-007 — Add if/else logic node to workflow, verify branching. Tracking file: /qa-release/sections/15-automations.md — FIX-276
- [x] AUTO-PMW-008 — Add delay/wait logic node, verify workflow pauses. Tracking file: /qa-release/sections/15-automations.md — FIX-276
- [x] AUTO-PMW-009 — Add create-task action node, verify task is created on run. Tracking file: /qa-release/sections/15-automations.md — FIX-276
- [x] AUTO-PMW-010 — Add send-notification action node, verify notification delivered. Tracking file: /qa-release/sections/15-automations.md — FIX-276
- [x] AUTO-PMW-011 — Add send-email action node, verify email delivered via Resend. Tracking file: /qa-release/sections/15-automations.md — FIX-276
- [x] AUTO-PMW-012 — Add update-status action node, verify record status updates. Tracking file: /qa-release/sections/15-automations.md — FIX-276
- [x] AUTO-PMW-013 — Add create-invoice action node, verify invoice created. Tracking file: /qa-release/sections/15-automations.md — FIX-276
- [x] AUTO-PMW-014 — Add AI-summarise node to workflow, verify NIM call fires. Tracking file: /qa-release/sections/15-automations.md — FIX-276
- [x] AUTO-PMW-015 — Add AI-draft-message node, verify message drafted by NIM. Tracking file: /qa-release/sections/15-automations.md — FIX-276
- [x] AUTO-PMW-016 — Add AI-classify node, verify record classified by NIM. Tracking file: /qa-release/sections/15-automations.md — FIX-276
- [x] AUTO-PMW-017 — Check automation_run_logs table for correct entry after execution. Tracking file: /qa-release/sections/15-automations.md — FIX-276
- [x] AUTO-PMW-018 — Verify plan gate: automation creation blocked on Starter plan. Tracking file: /qa-release/sections/15-automations.md — FIX-276
- [x] AUTO-PMW-019 — Verify automation RLS: cannot trigger another workspace's automation. Tracking file: /qa-release/sections/15-automations.md — FIX-276
- [x] AUTO-PMW-020 — Inspect automations canvas at 1536×960: node layout, connection lines. Tracking file: /qa-release/sections/15-automations.md — FIX-276

---

## AUTO-SSW — Automations — Supplier Solo (001–010)

- [x] AUTO-SSW-001 — Create supplier automation with job-created trigger. Tracking file: /qa-release/sections/15-automations.md — FIX-276
- [x] AUTO-SSW-002 — Add send-notification action, verify fires on job creation. Tracking file: /qa-release/sections/15-automations.md — FIX-276
- [x] AUTO-SSW-003 — Check automation_run_logs for supplier execution. Tracking file: /qa-release/sections/15-automations.md — FIX-276
- [x] AUTO-SSW-004 — Verify supplier automation RLS. Tracking file: /qa-release/sections/15-automations.md — FIX-276
- [x] AUTO-SSW-005 — Verify plan gate on supplier automations. Tracking file: /qa-release/sections/15-automations.md — FIX-276
- [x] AUTO-SSW-006 — Inspect /supplier/automations canvas at 1536×960. Tracking file: /qa-release/sections/15-automations.md — FIX-276
- [x] AUTO-SSW-007 — Inspect /supplier/automations at 390×844. Tracking file: /qa-release/sections/15-automations.md — FIX-276
- [x] AUTO-SSW-008 — Enable supplier automation and verify it runs. Tracking file: /qa-release/sections/15-automations.md — FIX-276
- [x] AUTO-SSW-009 — Disable supplier automation and verify it does not run. Tracking file: /qa-release/sections/15-automations.md — FIX-276
- [x] AUTO-SSW-010 — Delete supplier automation workflow. Tracking file: /qa-release/sections/15-automations.md — FIX-276

---

## AUTO-STW — Automations — Supplier Team (001–010)

- [x] AUTO-STW-001 — Create team automation with job-assigned trigger. Tracking file: /qa-release/sections/15-automations.md — FIX-276
- [x] AUTO-STW-002 — Add assign-team-member action, verify team member assigned on trigger. Tracking file: /qa-release/sections/15-automations.md — FIX-276
- [x] AUTO-STW-003 — Check automation_run_logs for team execution. Tracking file: /qa-release/sections/15-automations.md — FIX-276
- [x] AUTO-STW-004 — Verify team automation RLS: team workspace only. Tracking file: /qa-release/sections/15-automations.md — FIX-276
- [x] AUTO-STW-005 — Verify plan gate: team automations require Team plan. Tracking file: /qa-release/sections/15-automations.md — FIX-276
- [x] AUTO-STW-006 — Inspect /supplier/automations team canvas at 1536×960. Tracking file: /qa-release/sections/15-automations.md — FIX-276
- [x] AUTO-STW-007 — Inspect /supplier/automations team canvas at 390×844. Tracking file: /qa-release/sections/15-automations.md — FIX-276
- [x] AUTO-STW-008 — Enable team automation and verify it runs on trigger. Tracking file: /qa-release/sections/15-automations.md — FIX-276
- [x] AUTO-STW-009 — Verify team automation audit log entry. Tracking file: /qa-release/sections/15-automations.md — FIX-276
- [x] AUTO-STW-010 — Delete team automation workflow. Tracking file: /qa-release/sections/15-automations.md — FIX-276

---

## SET-PMW — Settings / Account / Billing — PM Workspace (001–020)

- [x] SET-PMW-001 — Navigate to /property-manager/account/profile at 1536×960, verify form loads. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md — FIX-277 settings QA complete
- [x] SET-PMW-002 — Edit display name and save, reload page, confirm persistence. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md — FIX-277
- [x] SET-PMW-003 — Upload avatar, verify it appears in nav and profile page. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md — FIX-277
- [x] SET-PMW-004 — Navigate to /property-manager/account/security, change password. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md — FIX-277
- [x] SET-PMW-005 — Verify incorrect current password blocks password change. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md — FIX-277
- [x] SET-PMW-006 — Navigate to /property-manager/account/notifications, toggle preferences, save. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md — FIX-277
- [x] SET-PMW-007 — Navigate to /property-manager/workspace-settings, update workspace name, save. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md — FIX-277
- [x] SET-PMW-008 — Navigate to /property-manager/workspace-settings/members, view member list. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md — FIX-277
- [x] SET-PMW-009 — Invite a team member, verify invite email sent via Resend. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md — FIX-277
- [x] SET-PMW-010 — Change a team member role, verify save. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md — FIX-277
- [x] SET-PMW-011 — Remove a team member, verify access revoked. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md — FIX-277
- [x] SET-PMW-012 — Navigate to /property-manager/workspace-settings/branding, set brand colour. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md — FIX-277
- [x] SET-PMW-013 — Verify brand colour propagates to tenant portal header. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md — FIX-277
- [x] SET-PMW-014 — Navigate to /property-manager/workspace-settings/billing, view current plan. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md — FIX-277
- [x] SET-PMW-015 — Click upgrade plan, verify Stripe checkout loads. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md — FIX-277
- [x] SET-PMW-016 — View billing invoices list. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md — FIX-277
- [x] SET-PMW-017 — Download a billing invoice PDF. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md — FIX-277
- [x] SET-PMW-018 — View payment method on file. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md — FIX-277
- [x] SET-PMW-019 — Verify audit log entry created for billing plan change. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md — FIX-277
- [x] SET-PMW-020 — Inspect all settings pages at 390×844: no overflow. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md — FIX-277

---

## SET-SSW — Settings — Supplier Solo (001–010)

- [x] SET-SSW-001 — Navigate to /supplier/settings/profile, edit business info, save. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md — FIX-277
- [x] SET-SSW-002 — Upload supplier logo in profile settings. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md — FIX-277
- [x] SET-SSW-003 — Navigate to /supplier/settings/account, update email notification prefs. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md — FIX-277
- [x] SET-SSW-004 — Navigate to /supplier/settings/billing, view subscription. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md — FIX-277
- [x] SET-SSW-005 — Click upgrade on supplier billing page. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md — FIX-277
- [x] SET-SSW-006 — Inspect /supplier/settings pages at 390×844: no overflow. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md — FIX-277
- [x] SET-SSW-007 — Verify supplier settings save correctly after reload. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md — FIX-277
- [x] SET-SSW-008 — Verify audit log entry for supplier profile change. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md — FIX-277
- [x] SET-SSW-009 — Verify GBP currency on supplier billing page. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md — FIX-277
- [x] SET-SSW-010 — Inspect supplier settings nav links all resolve. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md — FIX-277

---

## SET-STW — Settings — Supplier Team (001–010)

- [x] SET-STW-001 — Navigate to /supplier/settings/team, view team members list. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md — FIX-277
- [x] SET-STW-002 — Invite a team member from team settings. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md — FIX-277
- [x] SET-STW-003 — Change team member role in team settings. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md — FIX-277
- [x] SET-STW-004 — Remove a team member from team settings. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md — FIX-277
- [x] SET-STW-005 — Navigate to /supplier/settings/billing (team), view team subscription. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md — FIX-277
- [x] SET-STW-006 — Click upgrade on team billing page. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md — FIX-277
- [x] SET-STW-007 — Inspect /supplier/settings/team at 390×844: no overflow. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md — FIX-277
- [x] SET-STW-008 — Verify team settings save correctly after reload. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md — FIX-277
- [x] SET-STW-009 — Verify audit log entry for team member change. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md — FIX-277
- [x] SET-STW-010 — Verify plan gate: team settings only accessible on Team/Enterprise plan. Tracking file: /qa-release/sections/16-settings-account-billing-profile.md — FIX-277

---

## I18N-PMW — Internationalisation — PM Workspace (001–015)

- [x] I18N-PMW-001 — Verify all KPI card amounts on PM dashboard display as GBP (£X,XXX.XX). Tracking file: /qa-release/sections/17-internationalization-currency-legal-context.md — FIX-278 i18n QA complete
- [x] I18N-PMW-002 — Verify all rent amounts on /property-manager/money/rent display as GBP. Tracking file: /qa-release/sections/17-internationalization-currency-legal-context.md — FIX-278
- [x] I18N-PMW-003 — Verify all income table amounts on /property-manager/money/income display as GBP. Tracking file: /qa-release/sections/17-internationalization-currency-legal-context.md — FIX-278
- [x] I18N-PMW-004 — Verify all expense amounts on /property-manager/money/expenses display as GBP. Tracking file: /qa-release/sections/17-internationalization-currency-legal-context.md — FIX-278
- [x] I18N-PMW-005 — Verify all invoice amounts on /property-manager/money/invoices display as GBP. Tracking file: /qa-release/sections/17-internationalization-currency-legal-context.md — FIX-278
- [x] I18N-PMW-006 — Verify all dates in PM workspace use DD/MM/YYYY format. Tracking file: /qa-release/sections/17-internationalization-currency-legal-context.md — FIX-278
- [x] I18N-PMW-007 — Verify compliance dates (certificate expiry) use DD/MM/YYYY. Tracking file: /qa-release/sections/17-internationalization-currency-legal-context.md — FIX-278
- [x] I18N-PMW-008 — Verify tenancy start/end dates use DD/MM/YYYY. Tracking file: /qa-release/sections/17-internationalization-currency-legal-context.md — FIX-278
- [x] I18N-PMW-009 — Verify UK compliance terminology: EPC, Gas Safe Certificate, EICR in compliance section. Tracking file: /qa-release/sections/17-internationalization-currency-legal-context.md — FIX-278
- [x] I18N-PMW-010 — Verify legal copy uses UK terms: assured shorthold tenancy, Section 21, Section 8, deposit protection. Tracking file: /qa-release/sections/17-internationalization-currency-legal-context.md — FIX-278
- [x] I18N-PMW-011 — Verify no hardcoded $ or USD symbols in PM workspace. Tracking file: /qa-release/sections/17-internationalization-currency-legal-context.md
- [x] I18N-PMW-012 — Verify thousand separator uses comma (1,234.56 not 1.234,56). Tracking file: /qa-release/sections/17-internationalization-currency-legal-context.md — FIX-278
- [x] I18N-PMW-013 — Enable multiCountryPortfolio flag, set a property to USD, verify currency switches on that property. Tracking file: /qa-release/sections/17-internationalization-currency-legal-context.md — FIX-278
- [x] I18N-PMW-014 — Enable globalCountryPacks flag, verify additional compliance content available. Tracking file: /qa-release/sections/17-internationalization-currency-legal-context.md — FIX-278
- [x] I18N-PMW-015 — Verify workspace-level currency setting propagates to all money sub-pages. Tracking file: /qa-release/sections/17-internationalization-currency-legal-context.md — FIX-278

---

## I18N-SSW — Internationalisation — Supplier Solo (001–010)

- [x] I18N-SSW-001 — Verify all invoice amounts on /supplier/invoices display as GBP. Tracking file: /qa-release/sections/17-internationalization-currency-legal-context.md — FIX-278
- [x] I18N-SSW-002 — Verify earnings amounts on /supplier/earnings display as GBP. Tracking file: /qa-release/sections/17-internationalization-currency-legal-context.md — FIX-278
- [x] I18N-SSW-003 — Verify all dates on supplier pages use DD/MM/YYYY. Tracking file: /qa-release/sections/17-internationalization-currency-legal-context.md — FIX-278
- [x] I18N-SSW-004 — Verify no $ or USD symbols on supplier pages. Tracking file: /qa-release/sections/17-internationalization-currency-legal-context.md — FIX-278
- [x] I18N-SSW-005 — Verify thousand separator format on supplier invoice amounts. Tracking file: /qa-release/sections/17-internationalization-currency-legal-context.md — FIX-278
- [x] I18N-SSW-006 — Verify job date fields use DD/MM/YYYY. Tracking file: /qa-release/sections/17-internationalization-currency-legal-context.md — FIX-278
- [x] I18N-SSW-007 — Verify supplier billing page shows GBP subscription price. Tracking file: /qa-release/sections/17-internationalization-currency-legal-context.md — FIX-278
- [x] I18N-SSW-008 — Verify quote amounts on /supplier/quotes display as GBP. Tracking file: /qa-release/sections/17-internationalization-currency-legal-context.md — FIX-278
- [x] I18N-SSW-009 — Verify analytics revenue figures on /supplier/analytics display as GBP. Tracking file: /qa-release/sections/17-internationalization-currency-legal-context.md — FIX-278
- [x] I18N-SSW-010 — Verify no MM/DD/YYYY date format appears on any supplier page. Tracking file: /qa-release/sections/17-internationalization-currency-legal-context.md — FIX-278

---

## I18N-STW — Internationalisation — Supplier Team (001–010)

- [x] I18N-STW-001 — Verify team payment amounts display as GBP on /supplier/team. Tracking file: /qa-release/sections/17-internationalization-currency-legal-context.md — FIX-278
- [x] I18N-STW-002 — Verify team invoice amounts display as GBP on /supplier/team/invoices. Tracking file: /qa-release/sections/17-internationalization-currency-legal-context.md — FIX-278
- [x] I18N-STW-003 — Verify all team dates use DD/MM/YYYY. Tracking file: /qa-release/sections/17-internationalization-currency-legal-context.md — FIX-278
- [x] I18N-STW-004 — Verify no $ or USD symbols on team workspace pages. Tracking file: /qa-release/sections/17-internationalization-currency-legal-context.md — FIX-278
- [x] I18N-STW-005 — Verify team earnings amounts on /supplier/team/earnings display as GBP. Tracking file: /qa-release/sections/17-internationalization-currency-legal-context.md — FIX-278
- [x] I18N-STW-006 — Verify team billing page shows GBP subscription price. Tracking file: /qa-release/sections/17-internationalization-currency-legal-context.md — FIX-278
- [x] I18N-STW-007 — Verify team analytics revenue figures display as GBP. Tracking file: /qa-release/sections/17-internationalization-currency-legal-context.md — FIX-278
- [x] I18N-STW-008 — Verify job assigned dates on team workspace use DD/MM/YYYY. Tracking file: /qa-release/sections/17-internationalization-currency-legal-context.md — FIX-278
- [x] I18N-STW-009 — Verify team performance dates use DD/MM/YYYY. Tracking file: /qa-release/sections/17-internationalization-currency-legal-context.md — FIX-278
- [x] I18N-STW-010 — Verify no MM/DD/YYYY date format on any team supplier page. Tracking file: /qa-release/sections/17-internationalization-currency-legal-context.md — FIX-278

---

*Total tasks: 150 (PMW) + 80 (SSW) + 60 (STW) + 40 (CUST) + 40 (TENANT) + 40 (LANDLORD) + 40 (SUPPLIERPORTAL) + 80 (ADMIN) + 30 (AUTH) + 30 (ONBOARD) + 30 (MARKETING) + 50 (MARKET) + 30 (MCARD) + 23 (FLAG) + 60 (DESIGN) + 40 (PWA) + 30 (SEC) + 20 (UPLOAD) + 20 (WIZARD) + 25 (AI-PMW) + 15 (AI-SSW) + 15 (AI-STW) + 20 (AUTO-PMW) + 10 (AUTO-SSW) + 10 (AUTO-STW) + 20 (SET-PMW) + 10 (SET-SSW) + 10 (SET-STW) + 15 (I18N-PMW) + 10 (I18N-SSW) + 10 (I18N-STW) = **1,053 tasks***



















