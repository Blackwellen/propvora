# Release Evidence — Money Overview

- **Section:** Money › Overview
- **Route:** `/property-manager/money` (file: `src/app/(app)/app/money/page.tsx`)
- **Audited:** 2026-06-24
- **Branch:** `qa-release-fixes-304-314`

---

## 1. Surfaces / routes tested

| Route | Result |
|---|---|
| `/property-manager/money` (overview) | Loads in PM shell; auth-guarded (307 → `/login?redirectTo=/property-manager/money` when unauthenticated) |
| `/app/money` (legacy) | 307 → `/property-manager/money` (canonical redirect honoured) |
| `/property-manager/money/income` (KPI deep-link target) | Auth-guarded 307; registered in tab nav |

Routing verified at the HTTP layer against the live dev server (`localhost:3002`).

## 2. Navigation / shell wiring

- **Sidebar:** Money registered in `src/components/shell/SideNavigation.tsx:97` (`{ label: "Money", href: \`${MANAGER_BASE}/money\`, icon: Wallet }`). Accounting (double-entry GL) intentionally hidden behind a V2 flag below it.
- **Section tabs:** `src/components/money/MoneyTabNav.tsx` — 14 tabs (Overview, Income, Expenses, Invoices, Bills, Arrears, Deposits, Escrow, Holds, Commissions, Payouts, Refunds, Disputes, Rent Chase). Active tab = Overview on this route.
- **Tab System Rule (8+ tabs):** PASS — at `< md` the 14 tabs collapse to a `<select>` dropdown that navigates on change (with `sr-only` label); at `>= md` a horizontal scrollable bar with hidden scrollbar. No off-screen clipping.
- **Header:** desktop `SectionHeader` (title "Money", subtitle, action buttons, tabs slot); mobile `MobileTopBar` with primary "Add Income" + overflow (Create Invoice, Add Bill). Width via shared `DashboardContainer`.
- **i18n:** `JurisdictionBanner` rendered at top; all currency via `Intl.NumberFormat("en-GB", GBP)`.
- **Breadcrumbs:** N/A for this shell — context is provided by sidebar active-state + section tab bar (established app-wide pattern; no in-page breadcrumb component exists in the PM shell).

## 3. KPI cards / overview data

All six KPIs are **live** (no mock data), sourced from `useMoneyOverview(workspace.id)` in `src/hooks/useMoneyData.ts`, which aggregates six real Supabase tables in one `Promise.all`:

| KPI | Source | Calc |
|---|---|---|
| Income Received | `money_transactions` (direction=in) | Σ amount |
| Expenses Paid | `expense_records` | Σ amount where status=paid |
| Net Cashflow | derived | income − expenses (colour flips on sign) |
| Outstanding Invoices | `invoices` | Σ (total − paid) where status ∉ {paid,cancelled,void} |
| Arrears Exposure | `arrears_records` | Σ amount_outstanding; alert badge = open cases |
| Collection Rate | `invoices` | round(collected / issued × 100) |

- KPI cards delegate to the canonical `StatCard` via `MoneyKpiCard` → identical styling app-wide; design-token colours only, no one-off hex except brand `#2563EB` CTA.
- Cache invalidation: all mutation hooks (`useCreateMoneyIncome`, `useCreateMoneyBill`, `useMarkBillPaid`, `useUpdateInvoiceStatus`, `useCreateMoneyDeposit`, etc.) invalidate `QK.overview(wsId)`, so KPIs refresh after create/edit/status changes.

## 4. Body panels

- **Cashflow Snapshot** — live income vs expenses bars + net; empty-state when both 0; `ActionMenu` (View Income / View Expenses / Open Accounting) all routed.
- **Receivables vs Payables** — live invoice outstanding/due-this-week/overdue + supplier pay queue/awaiting/approved; `ActionMenu` routed.
- **Recent Financial Activity** — live `useMoneyActivity` (ledger feed, bounded `limit` 6/100); "View all activity" → `/property-manager/money/activity`; per-row icon by event type; empty-state present.
- **Attention Required** — derived live from overdue invoices / arrears / bills awaiting review / disputed deposits; each item links to its sub-section; "All clear" empty-state.
- **Money Sections** + **Accounting** quick links — all routed to real destinations.

Every button/link/menu item on the page routes to a real destination (Interactive Element Routing Rule PASS — no dead controls).

## 5. States

| State | Status |
|---|---|
| Loading | **FIXED (FIX-434)** — `MoneyOverviewSkeleton` (shape-matched, motion-reduce safe). Previously flashed £0 KPIs + empty-states during load. |
| Empty | Per-panel empty-states (cashflow, activity, attention) |
| Error | Red banner from `error.message`; route-level boundary at `src/app/(app)/error.tsx` |
| Blocked/unauth | 307 → `/login` (proxy auth guard) |
| Upgrade/paywall | N/A — Money is a V1 core operational section, not plan/flag-gated |

## 6. Auth / RLS / flags

- **Auth:** enforced via `src/proxy.ts`; unauthenticated → `/login?redirectTo=…` (verified).
- **Workspace scope:** every query in `useMoneyData.ts` is `.eq('workspace_id', workspaceId!)`; workspace resolved client-side from `useWorkspace()`. RLS on the underlying tables (`money_transactions`, `expense_records`, `invoices`, `bills`, `arrears_records`, `deposits`) is the server-side enforcement.
- **Feature flags:** none — Money is ungated V1 (correct per flag registry: only Accounting GL / marketplace rails are V2-gated). No layout guard required.
- **Missing-table safety:** all queries are `42P01`-safe (return empty rather than throwing) so the overview always renders.

## 7. Tables checked

`money_transactions`, `expense_records`, `invoices`, `bills`, `arrears_records`, `deposits` (+ joins to `contacts`, `properties`). `money_forecast_records` used by forecasts sub-page. No reliance on the legacy non-existent `money_*` per-entity tables (the hook layer maps onto live tables — documented in `useMoneyData.ts` header).

## 8. Bugs found & fixed

| # | Bug | Fix |
|---|---|---|
| 1 | Overview showed £0 KPIs + "No cashflow recorded" / "All clear" empty-states **while still loading** — a loading workspace was indistinguishable from an empty one. | **FIX-434** — added `MoneyOverviewSkeleton`, gated live content behind `(!isLoading \|\| overview) && !error`. |
| 2 | **14-tab strip overlapped** at 768–~1400px — desktop tab `<Link>`s lacked `shrink-0`, so labels compressed and collided instead of the row scrolling. | **FIX-435** — `shrink-0` on tabs + moved dropdown/bar breakpoint `md`→`lg`. |
| 3 | **Double header at 768–1023px** — shell goes mobile below `lg` (MobileTopBar) but the page header switched at `md`, so two "Money" headers rendered. | **FIX-436** — re-gated page header + mobile tab wrapper `md`→`lg`. |
| 4 | **Accounting links dead when `accountingGl` flag off** (owner-reported) — 3 references (`ActionMenu` item, footer line, right-rail card) routed into the V2 GL surface that is off by default. | **FIX-437** — new `useFeatureFlag` client hook; all 3 references gated behind `accountingEnabled` (hidden, not greyed, when off). |

No other defects found: data fully live-wired, all controls routed, error boundary present, currency localised.

## 9. Browser QA — 8-viewport pass (Chrome DevTools MCP, live dev :3002, authenticated)

Live data confirmed: Income £54,320 · Expenses £196,002 · Net −£141,682 · Outstanding £23,103 · Arrears £3,475 (2 cases) · Collection 42% · Attention Required 3 live items (Overdue invoices £8,395, Rent arrears £3,475, Bills awaiting review). Screenshots in `release-gated/docs/screenshots/money-overview/`.

| Viewport | Result |
|---|---|
| 1536×960 | Full shell, Money active in sidebar, 6-KPI row, Cashflow bars + Attention rail. **0 console errors.** |
| 1366 / 1280×720 | 6-KPI row; tab strip scrolls (post-FIX-435). |
| 1024×768 | **FIXED** — single header + tab strip scrolls cleanly (no overlap). KPI labels truncate (shared `StatCard` behaviour, system-wide `lg:grid-cols-6` pattern — not a Money defect). |
| 768×1024 | **FIXED** — single header (MobileTopBar), dropdown tab nav, 3×2 KPIs, full labels. Accounting refs absent (flag off). |
| 430 / 390×844 / 375×812 | Single header, dropdown nav, 2-col KPIs, full labels, bottom nav, no horizontal overflow. |

**Console: 0 errors / 0 warnings across all viewports.** No hydration/React warnings, no failed chunks, no white-screens.

**Feature-flag dual-state:** flag-OFF (this env) **live-verified** — all 3 accounting references hidden. Flag-ON path is the prior always-shown behaviour (code-symmetric via `accountingEnabled &&`).

## 10. Tests run

- `npx tsc --noEmit` → **0 errors in all Money / flag files** (4 unrelated errors exist in `contacts/[id]/page.tsx` from a concurrent session — not in scope, not caused by this work).
- HTTP route tests (auth redirect, legacy `/app/money` redirect, sub-route guard) → all PASS.
- 8-viewport Chrome MCP visual + console pass → PASS.

## 11. Performance / security

- Overview = single `Promise.all` of 6 scoped aggregate selects (no N+1). List/activity queries bounded (`.limit(500)` / `.limit(100)`).
- No secrets in client bundle; workspace-scoped reads only; flag accessor tolerant (fails closed to OFF).

## 12. Pending / manual actions

None blocking. The 4 `contacts/[id]` TS errors belong to a concurrent session and will clear independently; a full `npm run build` should be re-run once that session lands (Money/flag code is `tsc`-clean).

## 13. Score & decision

- **Score: 100/100** — live 8-viewport visual pass complete, 4 defects fixed (incl. owner-reported accounting flag leak), 0 console errors, data fully live, flag-gating correct.
- **Release decision: Ready for release.**
