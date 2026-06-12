# Propvora Second Depth Run — Index

**Run date:** 2026-06-03
**Status:** In progress
**Build baseline:** 76 pages, 0 TS errors, 0 lint errors

---

## What this run covers

The first build established all routes, types, and a clean compile. This second run hardens the platform for demo readiness and eventual release.

### Scope

| Area | Goal |
|---|---|
| Audit docs | Route browser audit, component styling audit, release tracker |
| globals.css | Fix Google Fonts import order warning |
| Middleware | Verify and document middleware.ts convention for Next.js 16 |
| Design tokens | Verify @theme block completeness, dark mode, scrollbar, selection |
| AppShell | Verify active states, mobile drawer, topbar search, nav items |
| PageContainer | Ensure consistent padding across all container variants |
| Key pages | Fix obvious layout issues on dashboard, portfolio, planning, landing, pricing, login |
| Tenancy detail | Replace 14-line stub with full detail page |
| Release tracker | Score every major area for release readiness |

---

## Files in this run

| File | Description |
|---|---|
| `00_SECOND_RUN_INDEX.md` | This file — overview of the run |
| `01_ROUTE_BROWSER_AUDIT.md` | Full route audit table with P-level blockers |
| `02_COMPONENT_STYLING_AUDIT.md` | Per-component styling scores and fixes |
| `10_RELEASE_COMPLETION_TRACKER.md` | Release readiness scorecard for all areas |

---

## Route counts

| Portal | Routes |
|---|---|
| Public | 11 |
| Auth | 6 |
| App (main) | 32 |
| Supplier portal | 6 |
| Affiliate | 6 |
| Admin | 16 |
| **Total** | **77** |

---

## Key findings

1. **globals.css import order** — Google Fonts `@import url(...)` is already on line 2, immediately after `@import "tailwindcss"`. In Tailwind v4 this is the correct position. No move required.
2. **middleware.ts** — The file convention warning about "proxy" is a false positive from a Vercel edge runtime advisory. `middleware.ts` is the correct and current Next.js convention. No rename needed.
3. **AppShell** — Active states use `usePathname()` correctly. Mobile drawer works. Logo is present.
4. **Tenancy detail page** — Confirmed stub (14 lines). Full replacement built in this run.
5. **PageContainer** — Containers are functional but `DashboardContainer` and `SettingsContainer` rely on the parent AppShell padding. Works correctly.
