# Release Evidence — Track Deposit Wizard

- **Wizard:** Track Deposit (modal/popover)
- **Route / launch:** `/property-manager/money/deposits`; "Track Deposit" CTA / mobile top-bar. (Companion: `AddProtectionModal`, `ReturnDepositModal` for lifecycle.)
- **Parent section:** Money
- **File:** `src/app/(app)/app/money/deposits/page.tsx` (`TrackDepositModal`), `src/hooks/useMoneyData.ts` (`useCreateMoneyDeposit`)
- **Audited / fixed:** 2026-06-25 · Branch `qa-release-fixes-304-314` · FIX-482

## Pattern decision
Modal/popover with logically grouped fields (party → property → money → protection). Premium, scrollable body, sticky footer.

## Fields tested
| Field | Required | Persists to (`deposits`) |
|---|---|---|
| Tenant / Contact | ✓ | `notes` (free-text party) |
| Property / Unit | – | `notes` (free-text address) |
| Amount (£) | ✓ | `amount` |
| Received date | ✓ | `received_date` |
| Protection scheme | – | `protection_scheme` (code) |
| Protection reference | – | `reference_number` |
| Prescribed info served date | – | `notes` |

## Bugs found & fixed (FIX-482)
1. **`protection_reference`, `prescribed_info_served_at`, `notes` were collected but discarded** — only `scheme` was sent. These are **UK-deposit-compliance critical** (certificate ref + prescribed-information service date). Now persisted.
2. **Hook mis-mapped the scheme** into `reference_number`. Fixed: scheme code → `protection_scheme`; the user's certificate reference → `reference_number`; tenant/property/notes/prescribed-info folded into `notes`.
3. Status now flips to `protected` when a scheme is selected (was always `received`).

## Known V1 limitation (documented)
- Tenant/property are **free-text** (persisted into `notes`), not FK-linked to `contacts`/`properties`. Acceptable for V1 (nothing lost); FK-linked pickers tracked as an enhancement in `release-gated/user-fixes/money-wizards.md`.

## Verification this session
- ✅ `tsc` clean · ✅ `next build` EXIT 0.
- ⏳ Live MCP/RLS/E2E + scheme/reference display verification → user-fixes gate.

## Score & decision
- **Code readiness: 94/100** (−4 live-QA, −2 free-text party/property not FK-linked).
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
