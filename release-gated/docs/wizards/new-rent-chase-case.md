# Release Evidence — New Rent Chase Case Wizard

- **Wizard:** New Rent Chase Case (modal/popover) — **built this session**
- **Route / launch:** `/property-manager/money/rent-chase` (`?new=1` deep-link); desktop "New Case" button + mobile top-bar primary action.
- **Parent section:** Money
- **Files:** `src/app/(app)/app/money/rent-chase/page.tsx` (`NewRentChaseCaseModal`), `src/hooks/useMoneyData.ts` (`useCreateMoneyArrears`)
- **Audited / built:** 2026-06-25 · Branch `qa-release-fixes-304-314` · FIX-480

## Critical finding (now fixed)
The "New Rent Chase Case" wizard **did not exist**. Rent-chase's "New Case" linked to `/money/arrears`, and arrears' "Rent Chase" linked back to `/money/rent-chase` — a **circular dead-stub** with no creation path anywhere (Interactive Element Routing Rule = release blocker). A real creation flow has been built.

## Pattern decision
Modal/popover — opening an arrears case is a focused 5-field action. Premium card, ARIA `role="dialog"`, Escape-close, required-field markers, friendly `42P01` fallback when the arrears table is unprovisioned.

## Fields tested
| Field | Required | Persists to (`arrears_records`) |
|---|---|---|
| Tenant (picker, `useContacts type=tenant`) | ✓ | `contact_id` |
| Property (picker) | – | `property_id` |
| Amount outstanding (£) | ✓ | `amount_due` (+ `amount_paid: 0`) |
| Rent due date | – | drives computed `days_overdue` |
| Notes | – | `notes` |

- `amount_outstanding` is a generated/derived column → **omitted** from insert (NOT-NULL/generated-col rule).
- Validation: amount must be finite & > 0; tenant required; workspace must be loaded.

## Cross-section
- A new case immediately appears in **Active Chase Cases** here AND in **Money → Arrears** (same `arrears_records` source); invalidates arrears, arrears-summary, overview, activity query keys.
- Also fixed the chase-case list to render `tenant_name` / `property_name` (was raw UUIDs).

## Verification this session
- ✅ `tsc` clean · ✅ `next build` EXIT 0 (rent-chase is `force-dynamic`, so the new `useSearchParams` does not break prerender).
- ⏳ Live MCP/RLS/E2E (create → appears in arrears) → user-fixes gate.

## Score & decision
- **Code readiness: 95/100** (−5 live create→arrears E2E + RLS evidence outstanding).
- **Decision: Ready for release** pending live-QA sign-off — the P0 dead-stub blocker is resolved.

## Live verification (2026-06-25)
- RLS +/- on touched tables: **16/16 GREEN** (foreign-workspace insert blocked 42501; own-workspace insert OK).
- 0 console errors on the wizard route; desktop+mobile screenshots in `../screenshots/money-wizards/`.
- See `release-gated/user-fixes/money-wizards.md` §A for the full live run (E2E rent-chase create verified live with KPI update).

## Final verification complete (2026-06-25)
- **8-viewport matrix**: ✅ captured at 1536/1366/1280/1024/768/430/390/375 — all render cleanly (`../screenshots/money-wizards/`).
- **UI-create E2E**: ✅ driven through the real UI and confirmed persisted in DB (0 functional console errors).
- **RLS**: ✅ 16/16 (foreign-workspace insert blocked 42501; own-workspace OK).
- **Score: 100/100 — Ready for release.** (First-run global cookie/guided-help overlay layering noted in `user-fixes/money-wizards.md` as a cross-cutting, non-blocking item.)
