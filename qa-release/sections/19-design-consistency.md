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
| DESIGN-001 | PM | /property-manager | Dashboard | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | - | BROWSER_REQUIRED |
| DESIGN-002 | PM | /property-manager/portfolio | List page | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | - | BROWSER_REQUIRED |
| DESIGN-003 | PM | /property-manager/portfolio/[id] | Detail page | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | - | BROWSER_REQUIRED |
| DESIGN-004 | PM | /property-manager/work/jobs | Table/list | [~] | [~] | YES (FIX-102) | [~] | [~] | [~] | [~] | [~] | [~] | [~] | - | BROWSER_REQUIRED (tab scroll fixed) |
| DESIGN-005 | PM | /property-manager/money | Finance dashboard | [~] | [~] | YES (FIX-098) | [~] | [~] | [~] | [~] | [~] | [~] | [~] | - | BROWSER_REQUIRED (tab scroll fixed) |
| DESIGN-006 | PM | /property-manager/compliance | Compliance hub | [~] | [~] | YES (FIX-106) | [~] | [~] | [~] | [~] | [~] | [~] | [~] | - | BROWSER_REQUIRED (tab scroll fixed) |
| DESIGN-007 | SSW | /supplier | Supplier dashboard | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | - | BROWSER_REQUIRED |
| DESIGN-008 | STW | /supplier (team) | Team dashboard | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | - | BROWSER_REQUIRED |
| DESIGN-009 | Customer | /customer | Customer dashboard | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | - | BROWSER_REQUIRED |
| DESIGN-010 | Tenant | /tenant-portal | Tenant portal | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | - | BROWSER_REQUIRED |
| DESIGN-011 | Landlord | /landlord-portal | Landlord portal | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | - | BROWSER_REQUIRED |
| DESIGN-012 | Admin | /admin | Admin dashboard | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | - | BROWSER_REQUIRED |
| DESIGN-013 | Marketing | / | Marketing home | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | - | BROWSER_REQUIRED |
| DESIGN-014 | Marketplace | /marketplace | Marketplace hub | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | - | BROWSER_REQUIRED |
| DESIGN-027 | Global | All routes | Dark mode classes | N/A | N/A | N/A | N/A | N/A | N/A | N/A | ✅ | 5 | 5 | NONE | CONFIRMED — zero dark: class usage in src; DESIGN-027 [x] |

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
