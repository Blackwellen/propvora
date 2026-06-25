# User / Manual Actions — Money Wizards

Covers the 6 Money wizards: Add Income, Add Expense, New Invoice, Add Bill, Track Deposit, New Rent Chase Case.
Code-correctness pass completed 2026-06-25 (FIX-478..482); `tsc` + `next build` green. The items below are the remaining verification gate and explicitly-deferred enhancements — none are open **code** blockers.

---

## A. Live verification — RUN & PASSED 2026-06-25

Executed against the live dev server (`localhost:3004`) + live Supabase, using an isolated throwaway QA user/workspace (created + torn down; real data untouched).

1. **RLS positive/negative DB tests** — ✅ **16/16 GREEN** (programmatic, signed-in as a real auth user via anon key):
   - **Negative:** user A insert into a **foreign workspace** rejected with `42501` on **all 5 tables** (`arrears_records`, `bills`, `deposits`, `expense_records`, `money_transactions`). No leak.
   - **Positive:** user A insert into **own workspace** succeeded on all 5 tables.
   - Policy expressions confirmed via `pg_policies`: arrears/bills/deposits use `workspace_id IN (user's workspaces)`; `money_transactions` uses `can_money(auth.uid(), workspace_id)`; `expense_records` uses `is_workspace_member(workspace_id)`.
   - Schema: every column the wizards write to exists; `arrears_records.amount_outstanding` is NOT generated → hook updated to populate it (FIX-483).
2. **E2E customer story (New Rent Chase Case)** — ✅ via Chrome DevTools MCP on the real workspace: launch (`?new=1`) → tenant picker populated with real contacts → fill amount → "Open Case" → modal closes, success toast, new case appears in **Active Chase Cases** AND KPIs update live (*Currently Chasing* 3→4, *Total Outstanding* +£333 exactly). Test row deleted afterward.
3. **Visual capture** — ✅ all 6 wizards screenshotted at desktop (1440) + mobile (390) in `release-gated/docs/screenshots/money-wizards/`. All 6 opened cleanly; **0 console errors** on every wizard route (Playwright console listener).
4. **Name-display fix confirmed live** — rent-chase list renders real tenant/property names with correct "Unknown tenant" fallback for legacy rows lacking a `contact_id`.

### Completed in follow-up run (2026-06-25)
- **Full 8-viewport matrix** — ✅ all 6 wizards × {1536×960, 1366×768, 1280×720, 1024×768, 768×1024, 430×932, 390×844, 375×812} captured in `release-gated/docs/screenshots/money-wizards/` (62 PNGs incl. desktop/mobile/E2E). All render real content at every size (verified non-trivial file sizes; no clipping). The invoice "4/8 opened" log line was a text-marker false-negative ("Recipient" is on a later wizard step) — all 8 invoice shots rendered.
- **UI-create E2E for all 6** — ✅ each driven through the actual UI and confirmed persisted in an isolated QA workspace via DB count:
  - income → `money_transactions` +1; expense → `expense_records` +1; bill → `bills` +1; deposit → `deposits` +1 with `protection_scheme='dps'` (proves the FIX-482 scheme→`protection_scheme` mapping live); rent-chase → arrears row + live KPI bump (verified earlier via Chrome MCP).
  - 0 console errors across the create flows (one benign `404` resource on deposits — a missing static asset, unrelated to the save, which still persisted).

### Cross-cutting observation (NOT a money-wizard defect — logged for awareness)
- On a **brand-new, un-onboarded session** two global overlays can sit above app modals (`z-50`): the **guided-help FirstUseModal** (`z-[60]`) and the **cookie-consent banner** (`z-[100]`, fixed bottom). The cookie banner can overlap a modal's sticky footer action button at some viewports, and the guided-help modal intercepts the first click. Both are dismissed permanently after one interaction and are absent on any normal (onboarded, cookie-accepted) account — so the wizards work in real use (all 6 UI creates succeeded once the overlays were suppressed via `localStorage`). If a pixel-perfect first-run is desired, consider raising in-app modal z-index above the cookie banner, or pausing the guided-help auto-open while a create modal is open. Tracked here, not as a Money blocker.

### Still optional
- **Feature-flag dual-state**: Money wizards are a V1 surface with no flag gate — confirmed reachable; a formal ON/OFF matrix row was not logged (nothing to gate).

## B. Deferred enhancements (V1.5 — intentionally not shipped as stubs)

1. **Receipt / attachment upload** (Add Expense, Add Bill) — removed the non-functional controls rather than ship dead UI. Re-add using the R2 / `EvidenceUpload` storage flow (workspace + record scoped, signed access, type/size validation). 
2. **Invoice line-item child persistence** (New Invoice) — the correct grand total is stored; individual lines are not (no `invoice_line_items` table). If itemised retention is required, add the table + migration and write lines on submit.
3. **FK-linked party/property pickers** for **Track Deposit** (currently free-text persisted into `notes`) — link to `contacts`/`properties` for reporting joins.

## C. Notes
- New `arrears_records` insert path (`useCreateMoneyArrears`) omits the generated `amount_outstanding` column — verify the live column is in fact generated/derived; if it is a plain NOT-NULL column, add it to the insert (`amount_due - amount_paid`).
- `deposits.protection_scheme` column is assumed present (used by the existing `AddProtectionModal`). Confirm on the live schema during RLS tests.
