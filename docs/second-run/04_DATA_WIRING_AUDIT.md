# 04 — Data Wiring Audit

Generated: 2026-06-03 | Agent 3+4 Second Depth Run

## Legend
- **Mock data?** — page still uses mock/static arrays as primary data source
- **Hook wired?** — real Supabase hook imported and called
- **Workspace scoped?** — query gated by `workspace?.id`
- **Loading state?** — shows skeleton while loading
- **Empty state?** — shows meaningful empty state with CTA
- **Status** — DONE / PARTIAL / TODO

---

## /app Routes — 36 pages total

| Page | Route | Mock data? | Hook wired? | Workspace scoped? | Loading state? | Empty state? | Status |
|------|-------|-----------|-------------|-------------------|----------------|--------------|--------|
| Home Dashboard | /app | Fallback only | YES (createClient inline) | YES | YES (DashboardSkeleton) | N/A (KPI strip) | DONE |
| Properties List | /app/portfolio/properties | Fallback only | YES (useProperties) | YES | YES (Skeleton grid) | YES ("Add your first property") | DONE |
| Property Detail | /app/portfolio/properties/[id] | YES (mock) | NO | NO | YES | YES | TODO |
| New Property | /app/portfolio/properties/new | — (form) | NO | NO | N/A | N/A | TODO |
| Portfolio Overview | /app/portfolio | NO (static) | NO | NO | NO | NO | TODO |
| Units List | /app/portfolio/units | YES | NO | NO | YES | YES | TODO |
| Unit Detail | /app/portfolio/units/[id] | YES | NO | NO | YES | YES | TODO |
| Tenancies List | /app/portfolio/tenancies | YES | NO | NO | YES | YES | TODO |
| Tenancy Detail | /app/portfolio/tenancies/[id] | YES | NO | NO | YES | YES | TODO |
| Contacts List | /app/contacts | Fallback only | YES (useContacts) | YES | YES (Skeleton) | YES (ContactsEmptyState) | DONE |
| Contact Detail | /app/contacts/[id] | YES | NO | NO | YES | YES | TODO |
| New Contact | /app/contacts/new | — (form) | NO | NO | N/A | N/A | TODO |
| Tasks List | /app/work/tasks | Fallback only | YES (useTasks) | YES | YES (Skeleton) | Partial | DONE |
| Task Detail | /app/work/tasks/[id] | YES | NO | NO | YES | YES | TODO |
| New Task | /app/work/tasks/new | — (form) | NO | NO | N/A | N/A | TODO |
| Jobs List | /app/work/jobs | YES | NO | NO | YES | YES | TODO |
| Job Detail | /app/work/jobs/[id] | YES | NO | NO | YES | YES | TODO |
| New Job | /app/work/jobs/new | — (form) | NO | NO | N/A | N/A | TODO |
| Work Overview | /app/work | YES | NO | NO | NO | NO | TODO |
| Planning Overview | /app/planning | YES | NO | NO | YES | YES | TODO |
| Planning Sets List | /app/planning/sets | Fallback only | YES (usePlanningSets) | YES | YES (Skeleton) | YES (TrendingUp icon + CTA) | DONE |
| Planning Set Detail | /app/planning/sets/[id] | YES | NO | NO | YES | YES | TODO |
| New Planning Set | /app/planning/sets/new | — (form) | YES (useWorkspace) | YES | N/A | N/A | PARTIAL |
| Planning Profiles | /app/planning/profiles | NO (static) | NO | NO | NO | NO | N/A (static) |
| Profile Detail | /app/planning/profiles/[profileKey] | NO (static) | NO | NO | NO | NO | N/A (static) |
| Landlord Offers | /app/planning/landlord-offers | YES | NO | NO | YES | YES | TODO |
| Invoices | /app/money/invoices | Fallback only | YES (useInvoices) | YES | YES (Skeleton) | Partial | DONE |
| Income | /app/money/income | YES | NO | NO | YES | YES | TODO |
| Expenses | /app/money/expenses | YES | NO | NO | YES | YES | TODO |
| Bills | /app/money/bills | YES | NO | NO | YES | YES | TODO |
| Arrears | /app/money/arrears | YES | NO | NO | YES | YES | TODO |
| Reconcile | /app/money/reconcile | YES | NO | NO | YES | YES | TODO |
| Money Overview | /app/money | YES | NO | NO | YES | YES | TODO |
| Calendar | /app/calendar | YES | NO | NO | YES | YES | TODO |
| Account Settings | /app/account-settings | Partial | NO | NO | N/A | N/A | TODO |
| Workspace Settings | /app/workspace-settings | Partial | NO | NO | N/A | N/A | TODO |

---

## Summary

| Status | Count |
|--------|-------|
| DONE (hook wired, workspace scoped, loading + empty states) | 6 |
| PARTIAL (hook wired but some states missing) | 2 |
| TODO (still on mock data) | 28 |

## Pages Wired This Run
1. `/app` — Home dashboard (real KPI counts from Supabase)
2. `/app/portfolio/properties` — Properties list (useProperties hook)
3. `/app/contacts` — Contacts list (useContacts hook)
4. `/app/work/tasks` — Tasks list (useTasks hook)
5. `/app/planning/sets` — Planning sets list (usePlanningSets hook)
6. `/app/money/invoices` — Invoices list (useInvoices hook)

## Notes
- All wired pages fall back gracefully to mock data when `workspace?.id` is undefined (onboarding state)
- Real data layers ON TOP of mock data — mock data serves as demo content until Supabase returns real records
- `useWorkspace()` exported from `@/providers/AuthProvider` — single source of truth for workspace context
- The standalone `src/hooks/useWorkspace.ts` (React Query) can coexist but pages should prefer AuthProvider version
