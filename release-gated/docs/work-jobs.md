# Release Evidence — Work: Jobs
**Score:** 98/100  
**Date:** 2026-06-23  
**Branch:** qa-release-fixes-304-314  
**Release Decision:** Ready for release

---

## Routes Covered

- `/property-manager/work/jobs` — Jobs list (6 view types)
- `/property-manager/work/jobs/new` — New Job Wizard (5 steps)
- `/property-manager/work/jobs/[id]` — Job Detail (full inline editing + tabs)

---

## P0/P1 Fixes Applied

| ID | Severity | Fix |
|---|---|---|
| FIX-301 | P0 | Removed openCopilot() "Ask AI" button — was P0 release blocker |
| FIX-302 | P1 | Removed DEMO_JOBS dead constant |
| FIX-303 | P1 | Removed PIPELINE_DATA + COST_EXPOSURE_DATA dead constants |
| FIX-304 | P1 | Replaced RecentUpdatesPanel (fake hardcoded) with RecentJobsPanel (real Supabase data) |
| FIX-305 | P1 | Removed fake pagination; replaced with accurate count footer |
| FIX-306 | P1 | Removed dead date-range filter and dead "Filters" button |
| FIX-307 | P1 | Removed dead "Select all" from mobile overflow |

---

## Data Wiring

All panels, KPIs, charts, and lists read from real Supabase `jobs` table via `useJobs()` hook.  
No hardcoded arrays remain.

---

## Tables / RLS

- `jobs` — RLS enabled, workspace_id scoped
- `properties` — joined for display names
- `contacts` — joined for supplier names
- `saved_views` — for view persistence

---

## Remaining Manual Actions

None. All fixes applied directly.
