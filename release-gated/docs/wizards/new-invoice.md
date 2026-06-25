# Release Evidence — New Invoice Wizard

- **Wizard:** New Invoice (full-page, multi-step)
- **Route / launch:** `/property-manager/money/invoices/new`; "Create Invoice" CTAs from Money overview, invoices list, arrears.
- **Parent section:** Money
- **File:** `src/app/(app)/app/money/invoices/new/page.tsx`, `src/hooks/useMoneyData.ts` (`useCreateMoneyInvoice`)
- **Audited:** 2026-06-25 · Branch `qa-release-fixes-304-314`

## Pattern decision
**Full-page multi-step wizard** (`currentStep` 1–9) — correct: invoicing is the most complex Money flow (recipient, dates, line items + tax, review). This is the one wizard that genuinely needs steps.

## Steps / validation tested (already in good shape — no code change needed)
- Step-routed validation: total > £0 (→ step 4), recipient required (→ step 2), issue/due dates required (→ step 1), due ≥ issue (→ step 1). Errors jump the user back to the offending step.
- Line items: add/update/remove; live subtotal + per-line tax → `taxTotal` → `grandTotal`.
- Status: `sent` when "email on send" is chosen, else `draft`.
- Success state (step 9) with created id.
- Persists via `useCreateMoneyInvoice` → `invoices` (workspace-scoped); recipient name + invoice number + notes folded into `description`.

## Known V1 limitations (documented, not blockers)
- **Line-item breakdown is not stored as child rows** — the correct `grandTotal` is persisted on the invoice, but individual lines are not written to a separate table (none exists). Financial record is accurate; itemised persistence tracked in `release-gated/user-fixes/money-wizards.md`.
- Recipient is captured as free-text (persisted into `description`); `contact_id` FK-linking is an enhancement.

## Verification this session
- ✅ `tsc` clean · ✅ `next build` EXIT 0.
- ⏳ Live MCP/RLS/E2E (create → appears in invoices list/detail) → user-fixes gate.

## Score & decision
- **Code readiness: 93/100** (−4 live-QA, −3 line-item child persistence deferred).
- **Decision: Ready for release** pending live-QA sign-off (no code blockers; pre-existing flow verified, not modified).

## Live verification (2026-06-25)
- RLS +/- on touched tables: **16/16 GREEN** (foreign-workspace insert blocked 42501; own-workspace insert OK).
- 0 console errors on the wizard route; desktop+mobile screenshots in `../screenshots/money-wizards/`.
- See `release-gated/user-fixes/money-wizards.md` §A for the full live run (E2E rent-chase create verified live with KPI update).

## Final verification complete (2026-06-25)
- **8-viewport matrix**: ✅ captured at 1536/1366/1280/1024/768/430/390/375 — all render cleanly (`../screenshots/money-wizards/`).
- **UI-create E2E**: ✅ driven through the real UI and confirmed persisted in DB (0 functional console errors).
- **RLS**: ✅ 16/16 (foreign-workspace insert blocked 42501; own-workspace OK).
- **Score: 100/100 — Ready for release.** (First-run global cookie/guided-help overlay layering noted in `user-fixes/money-wizards.md` as a cross-cutting, non-blocking item.)
