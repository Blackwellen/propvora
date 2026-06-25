# User / Manual Follow-ups — Work Detail Pages (Suppliers · Tasks · Jobs · PPM)

These items could not be fully completed/verified in this session. Each states **why**.

## 1. Live multi-viewport browser QA
**Why not done now:** the running dev server (port 3002) is owned by another active Claude session per `.claude/port-registry.md`; starting a second server / Chrome MCP would risk a port collision against that session's work.
**Exact steps:**
1. Claim a free dev + Chrome port in `.claude/port-registry.md` (e.g. 3004 / 9225).
2. `npm run dev -- -p 3004` with `NODE_OPTIONS=--max-old-space-size=4096`.
3. Visit each route at 1536×960, 1366×768, 1280×720, 1024×768, 768×1024, 430×932, 390×844, 375×812 **and** PWA installed mode:
   - `/property-manager/work/suppliers/df423abd-1fb6-4bac-8504-c62a625dab40`
   - `/property-manager/work/tasks/524f6e42-6875-41f4-b601-9290f279c66b`
   - `/property-manager/work/jobs/91f04382-2bc4-4ffc-ab97-ebb1d1ed4be0`
   - `/property-manager/work/ppm/a79fff4e-c4e7-469e-b758-31ea15b4be8e`
4. Click every sub-tab; confirm: no console errors, no horizontal scroll on mobile, the new live cards/lists render, **upload a file then hard-refresh and confirm it still appears** (verifies FIX-W03/W04).

## 2. RLS positive/negative tests — ✅ DONE (2026-06-24, via PAT role-simulation)
**Verified** with the Management API PAT using `request.jwt.claims` role simulation
(no live second session needed). `job_documents` and `task_documents` both carry
workspace-scoped policies — `"Members read …"` (SELECT) and `"Members write …"`
(ALL). Cross-workspace isolation confirmed on populated sibling tables
(`properties` 10→0, `property_units` 16→0, `tenancies` 5→0 for member vs
non-member). `jobs.ppm_plan_id` reads inherit the existing `jobs` "Members read"
policy — no separate policy, no leakage path.

## 3. End-to-end "Generate Job from PPM" smoke test
**Why not done now:** needs a live PPM plan row + auth to exercise the mutation against the real DB.
**Exact steps:** open a live PPM plan → **Generate Job** → confirm redirect to the new job, then return to the plan's **Generated Jobs** tab and confirm the new work order is listed (this exercises the `ppm_plan_id` linkage added this session). Generate twice and confirm both appear (no dedupe loss).

## 4. Optional enhancements (not release blockers)
- **Per-sub-tab URL state:** sub-tabs are in-memory only; add `?tab=` sync if deep-link-to-sub-tab + refresh-preserves-tab is required by the checklist (items 16/19/79).
- **Full activity/audit feeds:** Job and PPM **Activity** tabs show derived lifecycle events (created/scheduled/completed), not a full `activity_logs` history. Wire to `activity_logs` if a complete audit trail is required on these pages.

---

## 5. Apply the `activity_logs` read RLS policy — ✅ DONE (verified 2026-06-24)
**Status:** the `"Members read activity"` SELECT policy
(`USING is_workspace_member(workspace_id)`) **is present on the live
`activity_logs` table** (confirmed via `pg_policies`), and the table holds real
data — the dev workspace `7d9e941b…` has **100 rows** readable. The Job/Task/PPM
Activity tabs and the home-dashboard activity feed are unblocked. No further
action; the migration `supabase/migrations/20260624000001_activity_logs_read_policy.sql`
matches the live state for fresh-DB reproduction.

## 6. Authenticated browser QA — how to unblock
A fresh headless browser can't reach `/property-manager/*` (307 → `/login`; no dev bypass; no test creds in repo). To run the live multi-viewport pass, pick one:
- **Provide a QA login** (email + password for a workspace member), or
- **Import your real Chromium cookies** into a headless session (you're already logged in), or
- **Run a git worktree** so Next allows a second `dev` instance on an isolated port (3004), then log in there.
