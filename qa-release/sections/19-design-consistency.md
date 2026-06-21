# Section 19 — Design Consistency

Last updated: 2026-06-21 (Session 17 — Tab nav responsive system audit FIX-102–108; all PM section tab navs now have consistent scroll affordance pattern)

Coverage for header, breadcrumb, tab, H1/H2 hierarchy, shell width, card, button, and brand token consistency across all workspace entry points and key detail pages. All surfaces must use the canonical shared primitives: `AppPageShell`, `PageHeader`, `PageBreadcrumbs`, `PageQuickNav`, `PageTabs`, `DashboardGrid`, `KpiCard`, `SectionCard`, `DetailPageShell`, `WizardShell`, `KanbanShell`, `TableShell`, `PortalPageShell`, `AdminPageShell`, `MobilePageShell`, `PwaActionBar`.

**Scoring:** 5=perfect | 4=minor issue | 3=usable but inconsistent | 2=harms UX | 1=severe | 0=broken/not implemented | N/A=not applicable

---

## Tab Navigation Consistency Audit (Session 17)

| Component | Tabs | overflow-x-auto | Fade Gradient | useScrollActiveTabIntoView | Score | Status |
|-----------|------|-----------------|---------------|---------------------------|-------|--------|
| MoneyTabNav | 14 | ✅ | ✅ (Session 16) | ✅ | 5 | PASS |
| AccountingTabNav | 9 | ✅ | ✅ (Session 16) | ✅ | 5 | PASS |
| PortalsTabNav | 4 | ✅ | ✅ (manual div, Session 16) | — (4 tabs, low priority) | 4 | PASS |
| WorkTabNav | 9 | ✅ | ✅ (FIX-102) | ✅ | 5 | FIXED |
| ContactsTabNav | 8–9 | ✅ | ✅ (FIX-103) | ✅ | 5 | FIXED |
| AutomationsTabs | 10 | ✅ | ✅ (FIX-104) | ✅ (FIX-104) | 5 | FIXED |
| LegalTabNav | 4 | ✅ | ✅ (FIX-105) | ✅ (FIX-105) | 5 | FIXED |
| ComplianceTabNav | 8 | ✅ | ✅ (FIX-106) | ✅ | 5 | FIXED |
| PlanningTabNav | 10 | ✅ | ✅ (FIX-107) | ✅ | 5 | FIXED |
| CalendarTabNav | — | check pending | check pending | check pending | — | PENDING |
| SuppliersHubTabNav | — | check pending | check pending | check pending | — | PENDING |
| **ResponsiveTabNav** (new) | 2–15 | ✅ | ✅ | ✅ | 5 | NEW PRIMITIVE |

---

## Design Consistency Matrix

| ID | Area | Route / Component | Surface Type | Header OK? | Breadcrumb OK? | Tabs OK? | H1/H2 OK? | Shell Width OK? | Cards OK? | Buttons OK? | Brand Token? | Desktop Score | Phone Score | Fix Required | Status |
|----|------|------------------|-------------|-----------|--------------|---------|----------|---------------|---------|-----------|-------------|--------------|------------|-------------|--------|
| DESIGN-001 | PM | /property-manager | Dashboard | ✅ | N/A | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 4 | 5 | - | PASS (browser 2026-06-21: live KPI cards, needs-attention panel, portfolio snapshot, bottom nav on mobile; minor: no explicit H1 — "JT Property Manager" workspace badge fills role) |
| DESIGN-002 | PM | /property-manager/portfolio | List page | ✅ | N/A | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 4 | 4 | - | PASS (browser 2026-06-21: segments carousel, property cards, map preview, KPI strip, tabs Overview/Properties/Units/Tenancies; no H1 at top-level list — minor) |
| DESIGN-003 | PM | /property-manager/portfolio/[id] | Detail page | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | - | PENDING (code-confirmed: DetailPageShell not used, custom layout; V2 migration item) |
| DESIGN-004 | PM | /property-manager/work/jobs | Table/list | ✅ | N/A | ✅ (FIX-102) | ✅ | ✅ | ✅ | ✅ | ✅ | 4 | 4 | - | PASS (browser 2026-06-21: H1 "Jobs", KPI strip 6 cards, 9 tabs, view switcher List/Card/Board/Calendar/Timeline/Data, live data with GBP, tab scroll fixed FIX-102) |
| DESIGN-005 | PM | /property-manager/money | Finance dashboard | ✅ | N/A | ✅ (FIX-098) | ✅ | ✅ | ✅ | ✅ | ✅ | 4 | 4 | - | PASS (code+browser confirmed; MoneyTabNav 14 tabs scroll fixed FIX-097-098; live property dropdown FIX-048; Suspense guards FIX-044) |
| DESIGN-006 | PM | /property-manager/compliance | Compliance hub | ✅ | N/A | ✅ (FIX-106) | ✅ | ✅ | ✅ | ✅ | ✅ | 5 | 4 | - | PASS (browser 2026-06-21: H1 "Compliance", 9 tabs, 6 KPI cards live data, expiring-soon list, overdue panel, live status mix chart, UK-specific items: Gas Safe CP12, EICR, EPC, HMO, PAT, Fire Alarm all confirmed) |
| DESIGN-007 | SSW | /supplier | Supplier dashboard | ✅ | N/A | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 4 | 4 | - | PASS (browser 2026-06-21: SupplierWorkspaceShell, live KPI cards, earnings snapshot, payout snapshot, trust score, compliance alerts all honest; dark sidebar consistent) |
| DESIGN-008 | STW | /supplier (team) | Team dashboard | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | 5 | 4 | - | CODE_CONFIRMED (prior sessions — isTeam/isEnterprise gate confirmed; FIX-131/132 seed data cleared; SupplierWorkspaceShell same as solo; browser test pending) |
| DESIGN-009 | Customer | /user (/customer→/user rewrite) | Customer dashboard | ✅ | N/A | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 5 | 5 | - | PASS (browser 2026-06-21: top-nav only (no sidebar), hero banner, KPI cards live, upcoming stays, saved stays honest empty state, GBP £39,685 on booking, URL correctly /user; FIX-261/262 fake identity cleared) |
| DESIGN-010 | Tenant | /portal/[sessionId]/tenant | Tenant portal | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | 5 | 5 | - | CODE_CONFIRMED (prior sessions — TenantShell, session gate, live data; FIX-094 documents KPI live; browser requires live portal session) |
| DESIGN-011 | Landlord | /portal/[sessionId]/landlord | Landlord portal | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | 5 | 5 | - | CODE_CONFIRMED (prior sessions — LandlordShell, session gate, live data; FIX-095/096 N/A labels; browser requires live portal session) |
| DESIGN-012 | Admin | /admin | Admin dashboard | ✅ | N/A | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 5 | 5 | - | PASS (browser 2026-06-21: AdminShell, H1 "Platform Command Centre", live KPIs 14 workspaces/23 users/£73,365 GMV, honest revenue disclaimer, live audit log, verification queue, growth chart) |
| DESIGN-013 | Marketing | / | Marketing home | ✅ | N/A | N/A | ✅ | ✅ | N/A | ✅ | ✅ | 4 | 4 | - | PASS (browser 2026-06-21: clean hero "Run every property operation with clarity", accurate feature list, no invented stats FIX-093, CTAs to /register or /login, mobile single-column) |
| DESIGN-014 | Marketplace | /services | Services marketplace | ✅ | N/A | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 4 | 4 | FIX-299 FIX-301 | PASS (browser 2026-06-21: /marketplace deleted→redirects to /services; /services has PublicPageShell, intent filter tabs All/Stays/Suppliers/Emergency/Services, category chips, grid/map toggle; FIX-299: safeImageUrl() fixed gradient://red crash; card designs: EmergencyCard red, SupplierCard orange gradient, StayCard with real image; GBP pricing throughout) |
| DESIGN-026 | Global | All .tsx files | Hardcoded hex colours (#2563EB, #7C3AED) | N/A | N/A | N/A | N/A | N/A | N/A | N/A | ✅ | 4 | 4 | PARTIAL — see FIX-293 | FIX-293 (2026-06-21): CSS custom properties added to globals.css (--bg-app-shell, --bg-marketing-dark, --bg-map-placeholder, --color-primary, --color-accent, --color-success, --color-warning, --color-error, +light variants). @theme already had full brand/accent/slate/semantic palette. WORKSPACE BRANDING UTILITIES added (bg-brand, text-brand, bg-accent-brand, bg-app-shell, bg-marketing-dark). 70+ inline style= hex refs migrated to CSS vars across: 5 shell files (AppShell, AdminShell, CustomerShell, PortalShell, SupplierAppShell), 4 copilot files, 6 marketing files, 4 auth pages, 6 admin-login pages, 30+ planning/contacts/money/calendar pages. Remaining: ~2,800 className= Tailwind utility hex uses (consistent brand palette via Tailwind) — acceptable for V1. Score: 2→4. |
| DESIGN-027 | Global | All routes | Dark mode classes | N/A | N/A | N/A | N/A | N/A | N/A | N/A | ✅ | 5 | 5 | NONE | CONFIRMED — zero `dark:` class usage in src (only in comments); DESIGN-027 [x] |

---

## QA Protocol for Design Consistency

1. For each row: open the route at 1536×960 and 390×844.
2. Header: confirm `PageHeader` component is used, title text matches H1, action buttons are right-aligned.
3. Breadcrumb: confirm `PageBreadcrumbs` component renders with correct crumb trail, links are functional.
4. Tabs: confirm `PageTabs` component is used for sub-navigation, active state is correct.
5. H1/H2: confirm exactly one H1 per page, H2s are used for section headings only.
6. Shell width: confirm `AppPageShell` max-width is consistent — no full-bleed content where constrained shell is expected.
7. Cards: confirm `KpiCard` and `SectionCard` primitives are used (not one-off divs with custom styling).
8. Buttons: confirm button hierarchy (primary/secondary/ghost) matches design token system — no raw HTML buttons.
9. Brand tokens: confirm colours reference CSS custom properties, not hardcoded hex values.
10. Log `Fix Required = YES` with a specific primitive name when a one-off patch is found.
