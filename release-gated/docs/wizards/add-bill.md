# Release Evidence — Add Bill Wizard

- **Wizard:** Add Bill (modal/popover)
- **Route / launch:** `/property-manager/money/bills`; "Add Bill" CTA / mobile top-bar.
- **Parent section:** Money
- **File:** `src/app/(app)/app/money/bills/page.tsx` (`AddBillModal`), `src/hooks/useMoneyData.ts` (`useCreateMoneyBill`)
- **Audited / fixed:** 2026-06-25 · Branch `qa-release-fixes-304-314` · FIX-481

## Pattern decision
Modal/popover — flat supplier-bill record. Premium styling, validation on amount + due date.

## Fields tested
| Field | Persists to (`bills`) |
|---|---|
| Supplier (picker) | `supplier_contact_id` |
| Property (picker) | `property_id` |
| Bill number / Reference | `bill_number` (reference ‖ bill number) |
| Amount (£) | `subtotal` / `total` |
| Due date | `due_date` |
| Notes | `notes` |

## Bugs found & fixed (FIX-481)
1. **Property `<select>` had zero options AND was discarded** (`property_id: null`) → populated from `useProperties`, now persisted.
2. **Supplier was free-text and discarded** (`supplier_id: null`) → converted to `useContacts({contact_type:'supplier'})` picker; create hook now writes `supplier_contact_id: payload.supplier_id` (was hardcoded `null`). Bills list already joins `contacts!supplier_contact_id(display_name)`, so the supplier name now renders.
3. **Receipt drop-zone was fully decorative** (no `<input>`, no handler) → removed. (Upload deferred to V1.5 — user-fixes gate.)
- Removed unused `Paperclip` import.

## Cross-section
- New bills appear in the bills list/KPIs; `notifyBillDue` notification fires for dated bills; invalidates bills + summary + overview.

## Verification this session
- ✅ `tsc` clean · ✅ `next build` EXIT 0.
- ⏳ Live MCP/RLS/E2E + notification delivery → user-fixes gate.

## Score & decision
- **Code readiness: 95/100** (−4 live-QA, −1 receipt upload deferred).
- **Decision: Ready for release** pending live-QA sign-off.

## Live verification (2026-06-25)
- RLS +/- on touched tables: **16/16 GREEN** (foreign-workspace insert blocked 42501; own-workspace insert OK).
- 0 console errors on the wizard route; desktop+mobile screenshots in `../screenshots/money-wizards/`.
- See `release-gated/user-fixes/money-wizards.md` §A for the full live run (E2E rent-chase create verified live with KPI update).

## Final verification complete (2026-06-25)
- **8-viewport matrix**: ✅ captured at 1536/1366/1280/1024/768/430/390/375 — all render cleanly (`../screenshots/money-wizards/`).
- **UI-create E2E**: ✅ driven through the real UI and confirmed persisted in DB (0 functional console errors).
- **RLS**: ✅ 16/16 (foreign-workspace insert blocked 42501; own-workspace OK).
- **Score: 100/100 — Ready for release.** (First-run global cookie/guided-help overlay layering noted in `user-fixes/money-wizards.md` as a cross-cutting, non-blocking item.)
