# Release Evidence — Supplier Workspace

**Audit date:** 2026-06-27 · **Auditor:** Claude Code · **Branch:** main
**QA matrix:** [qa-release/sections/16-supplier-workspace.md](../../../qa-release/sections/16-supplier-workspace.md)
**Backend-deferred items:** [user-fixes/supplier-workspace/backend-deferred-items.md](../../user-fixes/supplier-workspace/backend-deferred-items.md)

Section: Supplier workspace (`/supplier/*`) — **114 routes**. Separate shell
(`SupplierWorkspaceShell` + `src/components/supplier-workspace/nav.ts`) from the operator side.

## Architecture

Real API layer: **31 routes under `/api/supplier/*`** over `supplier_*` Supabase tables. Most
pages are live-wired via `useSupplierApi`. This audit prioritised (1) hardcoded data presented
as real, (2) dead buttons, (3) state coverage.

## Surfaces / routes tested

| Group | Avg | Notes |
|-------|-----|-------|
| Core Operations (jobs / quotes / requests / leads / services / packages) | 4.75/5 | All read/list/CRUD live |
| Finance (finance / invoices / earnings / payouts / disputes) | 4.2/5 | Reads + most writes live; create/Stripe-payout surfaces deferred |
| Profile / Reputation / Coverage / Ops | 4.6/5 | Live via `useSupplierApi`; a few preview/write surfaces deferred |
| **Weighted section score** | **~91/100** | |

Deductions are entirely seed-rendered / no-endpoint surfaces (job evidence/sign-off, payouts
detail, invoice-create, insurance/verification submit) — all documented as backend-deferred with
the existing-or-needed endpoint specified.

## Bugs found & fixed this session

| ID | File | Fix |
|----|------|-----|
| FIX-632 | `supplier/jobs/page.tsx` | "SLA risk" KPI now computed from active jobs with `scheduled_for` ≤ now+24h (was hardcoded `0`) |
| FIX-633 | `supplier/quotes/[quoteId]/page.tsx` | "Convert to job" → V1-accurate semantics: accepted → "View job" link; pending → disabled "Awaiting client acceptance" tooltip (was a misleading toast) |
| FIX-634 | `supplier/requests/page.tsx` | Replaced "Avg response — Requires live data" placeholder KPI with computed "Due soon (48h)" from `dueAt` |
| FIX-635 | `supplier/services/[id]/page.tsx` | Removed fabricated perf metrics (94% SLA / 88% FTF / £58.4k / hardcoded compliance arrays) → honest empty state; removed unused imports/`PerfStat` |
| FIX-724 | `lib/supplier/credentials.ts`, `api/supplier/credentials/route.ts`, `SupplierCredentialsCard.tsx`, `supplier/verification/page.tsx` | **Built the supplier trade-credentials capture (was an unbuilt feature).** New data layer + GET/POST/DELETE API (RLS workspace-scoped, supplier-membership-checked) + a card on the Verification tab that lists credentials with lifecycle status and adds them via a drawer **pre-filled per jurisdiction × work-type from the trade-certs engine** (Gas Safe / NICEIC / RGI / Meister …). Insert verified against the live DB; 6 unit tests. |

## Feature-flagged V2 areas (confirmed gated OFF for V1)

| Area | Status |
|------|--------|
| `accounting/*` (GL, ledger, MTD, reconciliation) | Flag-gated OFF — V2 |
| `automations/*` | Flag-gated OFF — V2 |
| `affiliate/*` | Flag-gated OFF (payouts off) |
| `marketplace/*` | Flag-gated OFF — V2 |

None leak into V1 nav. Not deep-audited (out of V1 scope).

## Backend-deferred items (V1.5 — none block V1)

Originally 6 items in `user-fixes/supplier-workspace/backend-deferred-items.md`. **Now 5** —
the **trade-credentials capture is built** (FIX-724, see above), leaving: job evidence upload
(R2 flow), job sign-off (status endpoint), payout-blocker resolution (**Stripe Connect — founder
gate**), invoice create, request decline. Each names the existing or required endpoint.

## Final score & decision

**~91/100 — Ready for release** (core V1 supplier surfaces) **+ V1.5 backend-completion items
documented.** Core operations (jobs, quotes, requests, leads, services, packages, earnings,
payouts read, disputes, profile, reputation, coverage, compliance, messaging, settings, team)
are production-wired. Seed-rendered completion/finance-write surfaces are documented for the
V1.5 supplier backend build and do not block V1.
