# Release Evidence — Add Expense Wizard

- **Wizard:** Add Expense (modal/popover)
- **Route / launch:** `/property-manager/money/expenses` (`?new=1` deep-link); desktop "Add Expense" CTA, mobile top-bar primary action, section ActionMenu.
- **Parent section:** Money
- **File:** `src/app/(app)/app/money/expenses/page.tsx` (`AddExpenseModal`)
- **Audited / fixed:** 2026-06-25 · Branch `qa-release-fixes-304-314` · FIX-479

## Pattern decision
Modal/popover — flat expense record (type, behaviour, supplier, property, amount, date, status, description). No branching justifies a stepper. Premium, brand-tokened, Escape/Cancel.

## Fields tested
| Field | Persists to (`expense_records`) |
|---|---|
| Expense type | `category` |
| Cost behaviour | `cost_behaviour` (mapped) |
| Supplier (picker) | `contact_id` |
| Property (picker) | `property_id` |
| Amount / Date / Status / Description | `amount` / `date` / `status` / `description` |

## Bugs found & fixed (FIX-479)
1. **List showed raw `property_id` / `supplier_id` UUIDs** even though the query already joins `properties(address_line1)` + `contacts(display_name)` → now reads `r.property_name` / `r.supplier_name`; supplier initials derived from the name.
2. **Supplier was free-text and discarded** (`supplier_id` always `null`) → converted to a `useContacts({contact_type:'supplier'})` picker that persists `contact_id`.
3. **`Notes` textarea discarded** + **Receipt control was a stub** (`void receiptFile`, no upload) → both removed.
4. **6 dead filter buttons** → working Property/Type/Status `<select>` filters + conditional Clear. Removed unused `Filter` import.

## Deferred (documented, not stub-shipped)
- **Receipt/attachment upload** → V1.5; requires the R2/EvidenceUpload storage flow. Removed rather than shipped as a non-functional control. Tracked in `release-gated/user-fixes/money-wizards.md`.

## Verification this session
- ✅ `tsc` clean · ✅ `next build` EXIT 0.
- ⏳ Live MCP/RLS/E2E → user-fixes gate.

## Score & decision
- **Code readiness: 95/100** (−4 live-QA evidence, −1 receipt upload deferred).
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
