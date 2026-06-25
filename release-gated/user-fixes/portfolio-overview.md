# User / Manual Actions — Portfolio Overview
**Section:** Portfolio  
**Date:** 2026-06-23 (updated)  
**Status:** Ready for release — 1 remaining manual action (RLS negative test)

---

## MANUAL-002 — RLS negative test (cross-workspace leakage) — ✅ DONE (2026-06-24)

**Status:** verified via the Management API PAT using the `request.jwt.claims`
role-simulation pattern (no need for two live browser sessions). Ran each query
twice in a rolled-back transaction — once as the workspace owner
(`55ce717b…`), once as a non-member (`00000000-…-0999`) — against workspace
`7d9e941b…`:

| Table | Member sees | Non-member sees |
|---|---|---|
| `properties` | 10 | **0** ✅ |
| `property_units` | 16 | **0** ✅ |
| `tenancies` | 5 | **0** ✅ |

Cross-workspace read leakage is blocked by RLS on all three tables. (Same
pattern confirmed `job_documents`/`task_documents` carry workspace-scoped
read+write policies.)

---

## MANUAL-003 — Apply kpi_snapshots migration — ✅ DONE (2026-06-24)

**Status:** applied via the Management API PAT (the PAT *is* present as
`SUPABASE_PERSONAL_ACCESS_KEY` — the earlier "not stored" note was incorrect).
Ran `supabase/migrations/20260623130000_kpi_snapshots.sql`:
`select to_regclass('public.kpi_snapshots')` → `kpi_snapshots` (table + 2
indexes + the `workspace_members_kpi_snapshots` RLS policy all created).

**Verified end-to-end (PAT, RLS role-simulation):**
- Member upsert of today's snapshot (the exact `HomeDashboardPage.loadDashboard()`
  upsert) **succeeds** → daily capture works on the next authenticated load.
- Non-member upsert **blocked** (`42501` RLS violation).

`HomeDashboardPage.tsx` already contains the full capture + 30-day-delta logic
(lines ~509–527), so month-over-month trends now populate honestly once 30 days
of snapshots accrue. No fabricated historical rows were inserted.

---

## Completed Items (no longer manual)

- ✅ MANUAL-001 (Browser QA at 8 screen sizes) — Chrome MCP guidance added to AGENTS.md; port conflicts are never blockers
- ✅ MANUAL-003 (Leasing data wiring) — All 3 leasing pages wired to Supabase (FIX-025/026/027)
- ✅ MANUAL-004 (Property geocoding) — `handleSubmit` in `/properties/new/page.tsx` now calls `geocodeAddress` before `.insert()`
- ✅ MANUAL-005 (target_rent_pcm) — Seeded £975–£2,200/pcm for 6 demo properties via REST API (DATA-001)
