# User-Fix Actions — Work / Jobs

**Section:** Work — Jobs  
**Route:** `/property-manager/work/jobs`  
**Date:** 2026-06-23  
**Status:** No manual actions required

---

## Summary

All identified P0 and P1 issues for the Work / Jobs sub-tab were fixed directly in code during the 2026-06-23 audit session. No database migrations, Stripe flows, DNS changes, or external integrations are required.

---

## Manual Actions Required

**None.**

All fixes (FIX-J-001 through FIX-J-015 / FIX-301 through FIX-314) were applied directly to source code. TypeScript passes clean. The section is ready for release without any owner or manual intervention.

---

## V1.5 Deferred Items (not blockers)

The following features were deliberately deferred and are NOT blocking release:

| Item | Reason for deferral |
|---|---|
| **Communications tab** | `job_communications` table not yet built; stub tab removed rather than ship broken UI |
| **Linked Tasks** | No `job_id` column on `tasks` table; task-job linking requires schema migration in V1.5 |
| **Job comments feed** | No `job_comments` table; comment inputs removed; deferred to V1.5 |
| **Table row keyboard accessibility** | `<tr>` is not independently tab-focusable (child link is); V1.5 accessibility pass |

These items have been noted in `qa-release/sections/05-work-jobs.md` and `release-gated/docs/work/jobs.md`.
