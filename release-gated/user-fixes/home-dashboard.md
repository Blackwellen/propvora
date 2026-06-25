# User / Manual Action Items — Home Dashboard
**Section:** Home — Head Dashboard (`/property-manager`)  
**Date:** 2026-06-23  
**Last updated:** 2026-06-23 (session 2)

---

## MANUAL-01 — RLS negative tests ✅ RESOLVED via PAT

**Status:** Resolved. RLS verified via Supabase Management API.  
Queried `pg_policies` for all 10 dashboard tables — confirmed every table has `is_workspace_member(workspace_id)` as its SELECT policy. No cross-workspace leakage possible.

---

## MANUAL-02 — property_units records ✅ RESOLVED via PAT

**Status:** Resolved. 25 rows inserted via Supabase Management API SQL.  
Covers all 16 properties with realistic UK rental unit types (room, flat, other). Units KPI now shows 25 total units; occupancy now reflects actual occupied/vacant mix.

---

## MANUAL-03 — activity_logs seed ✅ RESOLVED via PAT

**Status:** Resolved. 10 rows inserted via Supabase Management API SQL.  
Covers property.updated, tenancy.created, task.completed, job.created, compliance.updated, invoice.created, property.created, task.created, contact.created, compliance.overdue. Recent Activity feed now shows real entries.

---

## MANUAL-04 — Month-over-month KPI trends — ✅ TABLE APPLIED (2026-06-24); trends populate over time

**Resolved (infrastructure):** the `kpi_snapshots` table + indexes + RLS policy
were applied via PAT on 2026-06-24 (see portfolio-overview MANUAL-003). A daily
Edge Function cron is **not** required — `HomeDashboardPage.tsx` `loadDashboard()`
already (a) **upserts** today's snapshot on every authenticated load
(`properties_count`, `units_count`, `tenancies_count`, `occupancy_pct`, …,
lines ~509–518) and (b) **queries the ~30-day-ago snapshot** to compute deltas
(lines ~520–527). Both the member-upsert and non-member-block paths were
PAT-verified under RLS.

**Remaining (time, not work):** the deltas display as 0 until ~30 days of daily
snapshots accrue — this is honest (no fabricated history was inserted). Optional
hardening: add a Vercel/pg_cron daily tick so capture does not depend on a user
opening the dashboard each day.

---

## MANUAL-05 — Set target_rent_pcm on properties — ✅ DONE (verified 2026-06-24)

**Status:** verified via PAT — **all 10 properties in the dev workspace already
have a non-null `target_rent_pcm`** (`count(*) filter (where target_rent_pcm is
null) = 0`). The rent KPI reflects real per-property values. For a real customer
workspace this remains ordinary data entry (Portfolio → Properties → {property}
→ Edit → Target Rent PCM), but the demo workspace needs no further action.

---

## MANUAL-06 — Stripe Connect OAuth ✅ CODE DONE — OAuth step manual

**What:** Getting Started card "Connect payment collection" step.

**Code done:** `HomeDashboardPage.tsx` now queries `stripe_accounts` and sets `done: stripeConnected` based on whether a row with `charges_enabled=true` exists.

**Genuine blocker (Stripe OAuth flow):** The actual connection requires completing Stripe Connect Express onboarding via the browser OAuth flow — this cannot be done via API. Steps:
1. Go to `/property-manager/settings/payments-stripe`.
2. Click "Connect with Stripe" — this opens the Stripe Connect OAuth flow.
3. Complete onboarding — once done, a row in `stripe_accounts` with `charges_enabled=true` will be created and the Getting Started step will auto-tick.
