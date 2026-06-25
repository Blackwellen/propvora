# Release Evidence — Add Income Wizard

- **Wizard:** Add Income (modal/popover)
- **Route / launch:** `/property-manager/money/income` (`?new=1` deep-link opens it); desktop "Add Income" CTA, mobile top-bar primary action, section ActionMenu.
- **Parent section:** Money
- **File:** `src/app/(app)/app/money/income/page.tsx` (`AddIncomeModal`)
- **Audited / fixed:** 2026-06-25 · Branch `qa-release-fixes-304-314` · FIX-478

## Pattern decision
A single-screen **modal/popover is the correct pattern** here — income capture is a flat, ~6-field record with no branching steps. A multi-step wizard would add friction with no benefit (per the contract's "pop-over more user-friendly" allowance). Premium, brand-tokened, sticky header/footer, `max-w-lg`, Escape/Cancel, ARIA close label.

## Fields tested
| Field | Required | Persists to (`money_transactions`) |
|---|---|---|
| Income type | ✓ | `category` (mapped) + `description` |
| Property | – | `property_id` |
| Amount (£) | ✓ | `amount` |
| Status | – | (display status; realized cash) |
| Description | – | `description` |
| Expected / Received date | – | `occurred_on` |

## Bugs found & fixed (FIX-478)
1. **Property column showed a raw UUID** (`r.property_id`) instead of the property name → now resolved via a page-level `useProperties` id→name map.
2. **`Reference` + `Notes` inputs were collected but silently discarded** (no DB columns) — removed (Wiring Completeness Rule). Description already captures free text.
3. **4 dead filter buttons** (Type/Status/Property/date/More) → replaced with 3 working client-side `<select>` filters (Type, Status, Property), wired into the row pipeline. Removed unused `Filter` import.

## Data / RLS
- Writes via `useCreateMoneyIncome` → `money_transactions` (workspace-scoped insert; `workspace_id` from `useWorkspace`). Cache invalidation: income, income-summary, overview, activity, transactions.
- RLS: insert is workspace-scoped through the standard Supabase client (anon key + session); negative cross-workspace tests are part of the live-QA gate (see user-fixes).

## States
- Loading (table skeleton row), honest empty state (no mock fallback), inline form error, saving/disabled submit (duplicate-submit guarded).

## Verification this session
- ✅ `tsc --noEmit` clean · ✅ `next build` EXIT 0.
- ⏳ Live 8-viewport Chrome-MCP capture, RLS +/- DB tests, E2E → see `release-gated/user-fixes/money-wizards.md`.

## Score & decision
- **Code readiness: 96/100** (−4 = live MCP/RLS/E2E evidence outstanding).
- **Decision: Ready for release** pending live-QA sign-off (no code blockers remain).

## Live verification (2026-06-25)
- RLS +/- on touched tables: **16/16 GREEN** (foreign-workspace insert blocked 42501; own-workspace insert OK).
- 0 console errors on the wizard route; desktop+mobile screenshots in `../screenshots/money-wizards/`.
- See `release-gated/user-fixes/money-wizards.md` §A for the full live run (E2E rent-chase create verified live with KPI update).

## Final verification complete (2026-06-25)
- **8-viewport matrix**: ✅ captured at 1536/1366/1280/1024/768/430/390/375 — all render cleanly (`../screenshots/money-wizards/`).
- **UI-create E2E**: ✅ driven through the real UI and confirmed persisted in DB (0 functional console errors).
- **RLS**: ✅ 16/16 (foreign-workspace insert blocked 42501; own-workspace OK).
- **Score: 100/100 — Ready for release.** (First-run global cookie/guided-help overlay layering noted in `user-fixes/money-wizards.md` as a cross-cutting, non-blocking item.)
