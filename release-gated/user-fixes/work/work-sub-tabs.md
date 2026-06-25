# Work Sub-Tabs — Remaining / Deferred Items

**Date:** 2026-06-24 · **Branch:** `qa-release-fixes-304-314`

All in-scope wiring/data/route blockers for Board, Gantt, PPM Overview,
Suppliers (Preferred), Complaints and Reports were fixed in-session (FIX-373…399,
`tsc` clean + `npm run build` ✓ green, browser-verified live on the running app).

## 1. Supplier Compliance & Performance sub-pages — ✅ RESOLVED (built)
Both pages were missing (404s referenced by the supplier sub-nav). They are now
**built and live**, and re-added to `SuppliersTabNav`:
- `/work/suppliers/performance` (FIX-394) — per-supplier scorecard from live `jobs`
  grouped by `supplier_contact_id` (completion %, jobs, active, invoiced, avg value)
  + internal rating average. CSV export. Browser-verified.
- `/work/suppliers/compliance` (FIX-395) — per-supplier document status from live
  `supplier_documents` (valid / expiring ≤30d / expired / none) with KPI strip,
  status filter, CSV export. Browser-verified.

## 2. Supplier ratings source — ✅ RESOLVED (now real, not seeded)
**How suppliers are rated:** a team member opens a supplier
(`/work/suppliers/{id}`) → the **Internal Rating** panel (`SupplierRatingPanel`) →
**Add rating** → scores 7 dimensions (quality, speed, communication, reliability,
price/value, compliance, tenant satisfaction) + "would use again" + internal notes
→ saves to the live `supplier_ratings` table via `useCreateSupplierRating`.

The Directory / Performance pages now read **real averages** from
`useWorkspaceSupplierRatings` (mean of each rating's populated dimensions) and show
**"Unrated"** when a supplier has no team rating yet — replacing the previous
deterministic seeded stars (FIX-397). So "Unrated" is the honest current state
(no internal reviews recorded yet), and it becomes a real score the moment a team
member adds a rating.

_Remaining (optional):_ an "Avg Response Time" / SLA metric still shows "—" because
there is no response-timestamp telemetry on jobs yet. That needs a job-cycle
timestamp (assigned→responded) before it can be computed — out of scope for V1.

## 3. PPM demo seed — ✅ not needed
`ppm_plans` already contains realistic live data (7 schedules verified in the UI).
Empty states ship correctly and the hook is 42P01-tolerant. No seed required.

## Verification note
The live end-to-end "add a rating" click could not be completed this session
because the shared Chrome MCP profile was held by a concurrent QA session
(tooling conflict, not a code issue). The rating **read/display** path and the
production build are verified green; the **write** path is code-verified
(`SupplierRatingPanel` → `useCreateSupplierRating` → `supplier_ratings` insert with
RLS + `created_by`). Re-run the add-rating click once the browser profile is free
to capture the end-to-end screenshot.

_No external-credential blockers (Stripe/Vercel/DNS/Sentry) apply to these sub-tabs._
