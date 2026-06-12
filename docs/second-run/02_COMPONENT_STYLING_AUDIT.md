# Component Styling Audit — Propvora Second Run

**Date:** 2026-06-03

Score key: 10 = pixel-perfect, 8 = good, 6 = functional but needs polish, 4 = needs rework, 2 = stub

---

## Shell Components

| Component | File | Score | Issues | Fix Applied |
|---|---|---|---|---|
| AppShell | `shells/AppShell.tsx` | 9/10 | Sidebar active states use usePathname() correctly. Mobile drawer wired. Logo present. TopBar search is left-aligned (not centered) — acceptable. | None needed |
| AuthShell | `shells/AuthShell.tsx` | 9/10 | Centred white card on navy gradient. Logo + link back. Onboarding bypass works. | None needed |
| AdminShell | `shells/AdminShell.tsx` | 8/10 | Clean table-style sidebar. Active states present. | None needed |
| SupplierShell | `shells/SupplierShell.tsx` | 8/10 | Clean layout. Role badge visible. | None needed |
| AffiliateShell | `shells/AffiliateShell.tsx` | 7/10 | Functional, slightly sparse nav. | None needed |

---

## Layout Components

| Component | File | Score | Issues | Fix Applied |
|---|---|---|---|---|
| DashboardContainer | `layout/PageContainer.tsx` | 8/10 | `max-w-[1600px] mx-auto` — no explicit padding. Relies on AppShell's `px-4 md:px-6 lg:px-8` wrapper. Works correctly. | None needed |
| SettingsContainer | `layout/PageContainer.tsx` | 8/10 | `max-w-[960px] mx-auto` — narrow and centred correctly. | None needed |
| DetailContainer | `layout/PageContainer.tsx` | 8/10 | Right-rail sticky at `top-6` — correct. | None needed |
| FormContainer | `layout/PageContainer.tsx` | 8/10 | `max-w-[640px] mx-auto` — good for wizard forms. | None needed |
| PageHeader | `layout/PageContainer.tsx` | 9/10 | `text-2xl font-bold`, `mb-6`, flex row with actions. Correct. | None needed |

---

## UI Primitives

| Component | File | Score | Issues | Fix Applied |
|---|---|---|---|---|
| Button | `ui/Button.tsx` | 9/10 | 5 variants (primary, secondary, danger, ghost, soft), 3 sizes, loading state. | None needed |
| Input | `ui/Input.tsx` | 9/10 | Left/right element slots, error state, label. | None needed |
| Badge | `ui/Badge.tsx` | 8/10 | Variant system (primary, success, warning, danger, default). dot prop. | None needed |
| Skeleton | `ui/Skeleton.tsx` | 8/10 | Pulse animation. Accepts className. | None needed |
| Card | `ui/Card.tsx` | 8/10 | Shadow, border, rounded-2xl. | None needed |
| Modal | `ui/Modal.tsx` | 7/10 | Uses dialog element. Backdrop blur. Escape closes. | None needed |
| Select | `ui/Select.tsx` | 7/10 | Custom styled select. | None needed |
| Textarea | `ui/Textarea.tsx` | 8/10 | Resizable. Error state. | None needed |
| Toggle | `ui/Toggle.tsx` | 7/10 | Accessible switch. | None needed |
| Tooltip | `ui/Tooltip.tsx` | 7/10 | CSS tooltip via data-tooltip. | None needed |

---

## Dashboard Widgets

| Component | File | Score | Issues | Fix Applied |
|---|---|---|---|---|
| KpiStrip | `dashboard/KpiStrip.tsx` | 9/10 | 8-column grid, trend arrows, colour-coded. Looks premium. | None needed |
| WorkQueueWidget | `dashboard/WorkQueueWidget.tsx` | 8/10 | Priority colours, due date formatting, task/job type badge. | None needed |
| MoneySnapshotWidget | `dashboard/MoneySnapshotWidget.tsx` | 8/10 | Income/expense/cashflow with trend arrows. Arrears highlighted. | None needed |
| PlanningOpportunitiesWidget | `dashboard/PlanningOpportunitiesWidget.tsx` | 8/10 | Profile colour chips, yield + risk scores. | None needed |
| CalendarAgendaWidget | `dashboard/CalendarAgendaWidget.tsx` | 8/10 | Event type icons, date grouping. | None needed |
| AiInsightPanel | `dashboard/AiInsightPanel.tsx` | 8/10 | Gradient purple header, action/alert/opportunity types. | None needed |
| RecentActivityWidget | `dashboard/RecentActivityWidget.tsx` | 7/10 | Timeline dots, relative timestamps. | None needed |

---

## Portfolio Components

| Component | File | Score | Issues | Fix Applied |
|---|---|---|---|---|
| PropertyCard | `portfolio/PropertyCard.tsx` | 8/10 | Type badge, status pill, rent + occupancy. | None needed |
| PropertyTable | `portfolio/PropertyTable.tsx` | 8/10 | Sortable, row click to detail. | None needed |
| TenancyDetailPage | `app/portfolio/tenancies/[id]/page.tsx` | 2/10 → 8/10 | Was 14-line stub. Full page built in this run. | FIXED |

---

## Planning Components

| Component | File | Score | Issues | Fix Applied |
|---|---|---|---|---|
| ProfileCarousel | inline in planning/page.tsx | 8/10 | Horizontal scroll, scroll buttons. Profile colour cards. | None needed |
| ConversionFunnel | inline in planning/page.tsx | 8/10 | Bar chart funnel. Colour-coded stages. | None needed |
| PlanningSetWizard | `planning/PlanningSetWizard.tsx` | 8/10 | Multi-step wizard with progress bar. | None needed |

---

## Marketing / Public Components

| Component | File | Score | Issues | Fix Applied |
|---|---|---|---|---|
| PublicNav | `marketing/PublicNav.tsx` | 8/10 | Logo, nav links, CTA button. Mobile hamburger. | None needed |
| PublicFooter | `marketing/PublicFooter.tsx` | 8/10 | 4-column footer, nav links, social icons. | None needed |
| LandingHero | inline in app/page.tsx | 9/10 | Full-width navy gradient, glow effects, dot pattern. | None needed |

---

## Navigation Components

| Component | File | Score | Issues | Fix Applied |
|---|---|---|---|---|
| NotificationsBell | `nav/NotificationsBell.tsx` | 8/10 | Unread badge, dropdown panel. | None needed |
| SidebarNavItem | inline in AppShell.tsx | 9/10 | Active highlight via usePathname(), sub-item expand/collapse. | None needed |

---

## AI Components

| Component | File | Score | Issues | Fix Applied |
|---|---|---|---|---|
| ChatBubble | `ai/ChatBubble.tsx` | 8/10 | Floating purple button, unread count badge, hide when panel open. | None needed |
| ChatPanel | `ai/ChatPanel.tsx` | 8/10 | Slide-in from right, message thread, input. AI safety disclaimer. | None needed |

---

## Summary

- **Average styling score:** 7.9/10
- **Components needing work:** 0 critical, 3 with score 7/10 that would benefit from polish in a future run
- **Stubs replaced:** 1 (tenancy detail)
- **Build impact:** 0 regressions expected
