# Money — V2 Money-Rail Feature-Flag Gating (Release Evidence)

**Parent section:** Money
**Parent route:** `/property-manager/money`
**Scope of this doc:** Feature-flag isolation of the V2 marketplace money rails so
V1.5/V2 surface area can no longer leak into the V1 Money section.
**Date:** 2026-06-24
**Author:** Claude Code (qa-release-fixes session)

---

## 1. Problem found

The 13 Money sub-tabs mix **V1 property-ops finance** with **V2 marketplace
payment rails**. Before this change the V2 rails were **completely ungated**:

- **No route guards** — none of the 13 sub-tab folders had a `layout.tsx`, so
  every V2 route (escrow, holds, commissions, payouts, refunds, disputes) was
  reachable by direct URL regardless of flag state.
- **No UI suppression** — `MoneyTabNav` hard-coded all 14 tabs (Overview + 13)
  with zero flag awareness, so the V2 tabs always rendered.
- **No API gate** — the V2 money-rail API routes (`/api/money/holds`,
  `/api/money/release-check`, `/api/money/disputes/[id]/actions`,
  `/api/money/fee-rules`) had no `flagGate` call, so the actions were callable
  by direct request even with the page hidden.

All V2 flags default **OFF**, so in production these tabs and APIs should be
invisible/blocked — but they were fully exposed. This is the "features leaking
across from different versions (V1.5 / V2)" issue.

## 2. V1 / V2 classification

| Sub-tab | Route | Tier | Required flag |
|---|---|---|---|
| Income | `/property-manager/money/income` | **V1** | none |
| Expenses | `/property-manager/money/expenses` | **V1** | none |
| Invoices | `/property-manager/money/invoices` | **V1** | none |
| Bills | `/property-manager/money/bills` | **V1** | none |
| Arrears | `/property-manager/money/arrears` | **V1** | none |
| Deposits | `/property-manager/money/deposits` | **V1** | none |
| Rent Chase | `/property-manager/money/rent-chase` | **V1** | none |
| Escrow | `/property-manager/money/escrow` | V2 | `marketplaceEscrow` |
| Holds | `/property-manager/money/holds` | V2 | `marketplaceEscrow` |
| Commissions | `/property-manager/money/commissions` | V2 | `marketplacePayments` |
| Payouts | `/property-manager/money/payouts` | V2 | `marketplacePayments` |
| Refunds | `/property-manager/money/refunds` | V2 | `marketplacePayments` |
| Disputes | `/property-manager/money/disputes` | V2 | `marketplaceDisputes` |

Flag semantics taken from `src/lib/flags/registry.ts`:
- `marketplacePayments` — "payment capture / payout flows and commission tracking"
- `marketplaceEscrow` — "payment authorisation, delayed capture and platform-hold flows"
- `marketplaceDisputes` — "unified dispute lifecycle and resolution workflows"

## 3. Fix applied (gate in all three places)

### 3.1 Route guards (server `layout.tsx`)
New server-component layouts following the established `contacts/guests/layout.tsx`
precedent — redirect to `/property-manager/money` when the flag is off, with the
`NEXT_PUBLIC_QA_ALL_FLAGS === "true"` QA bypass:

- `src/app/(app)/app/money/escrow/layout.tsx` → `marketplaceEscrow`
- `src/app/(app)/app/money/holds/layout.tsx` → `marketplaceEscrow`
- `src/app/(app)/app/money/commissions/layout.tsx` → `marketplacePayments`
- `src/app/(app)/app/money/payouts/layout.tsx` → `marketplacePayments`
- `src/app/(app)/app/money/refunds/layout.tsx` → `marketplacePayments`
- `src/app/(app)/app/money/disputes/layout.tsx` → `marketplaceDisputes`

### 3.2 UI suppression (tab nav)
`src/components/money/MoneyTabNav.tsx` — each tab now carries an optional `flag`;
the component resolves `marketplaceEscrow` / `marketplacePayments` /
`marketplaceDisputes` via `useFeatureFlag` and filters the V2 tabs out of both
the desktop tab bar and the mobile dropdown when their flag is off. V1 tabs have
no `flag` and always render.

### 3.3 API gate (direct-request leak)
Added `flagGate(...)` (from `src/lib/flags/api-gate.ts`, returns 404 when off,
honours QA bypass) as the first statement of each V2 money-rail handler:

- `src/app/api/money/holds/route.ts` — `POST`, `PATCH` → `marketplaceEscrow`
- `src/app/api/money/release-check/route.ts` — `POST` → `marketplaceEscrow`
- `src/app/api/money/disputes/[id]/actions/route.ts` — `POST` → `marketplaceDisputes`
- `src/app/api/money/fee-rules/route.ts` — shared `guard()` (covers `GET/POST/PATCH/DELETE`) → `marketplacePayments`

### 3.4 Cross-section dead-link prevention
`src/app/(app)/app/work/orders/page.tsx` — the "Escrow management" shortcut
(desktop button + mobile overflow action) pointed at the now-gated
`/property-manager/money/escrow`. Gated it on `marketplaceEscrow` so it is hidden
(not a redirecting dead link) when escrow is off.

## 4. Tests run

- `npx tsc --noEmit` — **clean, 0 errors.**

### 4.1 Flags-OFF state — VALIDATED end-to-end (2026-06-24, authenticated Chrome MCP + curl)

Server: shared dev server on :3002 with `NEXT_PUBLIC_QA_ALL_FLAGS=false` and all 4
marketplace global flags `false` (verified via Management API). Authenticated as the
Enterprise workspace owner (jamahlthomas1996@gmail.com / "JT Property Manager").

| Layer | Method | Result |
|---|---|---|
| Tab nav (UI) | Chrome MCP a11y snapshot of `/property-manager/money` | Only Overview + 7 V1 tabs render; **all 6 V2 tabs absent** (Escrow, Holds, Commissions, Payouts, Refunds, Disputes) ✅ |
| Route guard — escrow | Direct nav `/money/escrow` | Redirects → `/property-manager/money` ✅ |
| Route guard — holds | Direct nav `/money/holds` | Redirects → `/property-manager/money` ✅ |
| Route guard — commissions | Direct nav `/money/commissions` | Redirects → `/property-manager/money` ✅ |
| Route guard — payouts | Direct nav `/money/payouts` | Redirects → `/property-manager/money` ✅ |
| Route guard — refunds | Direct nav `/money/refunds` | Redirects → `/property-manager/money` ✅ |
| Route guard — disputes | Direct nav `/money/disputes` | Redirects → `/property-manager/money` ✅ |
| V1 control | Direct nav `/money/income` | Stays on `/money/income` (no redirect) ✅ |
| API gate ×4 | `curl` POST/GET to holds, release-check, disputes/[id]/actions, fee-rules | HTTP **404** with `{"error":"This feature is not available."}` (flagGate body); control route returns Next HTML 404 ✅ |
| Compile health | `curl` all 13 money routes | 307 (proxy auth redirect), no 500s ✅ |

### 4.2 Flags-ON state — verified by code inspection; live browser pass deferred

The ON path (`QA_ALL_FLAGS=true` OR the relevant global marketplace flag = true)
makes `isFeatureEnabled` return true → tabs render, guards pass through, APIs
respond. A live browser ON pass was **not** run because every ON lever on this
machine touches shared resources used by two other concurrent QA sessions:
Next.js 16 forbids a second dev-server instance (so no isolated port), restarting
the shared :3002 server would kill those sessions, and a global flag flip is a
platform-wide shared-DB change. The ON direction is the lower-risk one (it only
reveals existing pages); the security boundary is the OFF state, which is fully
validated above.

### 4.3 Architectural note — gating keys off the GLOBAL flag

Both the new route guards and `MoneyTabNav` (via `useFeatureFlag`) resolve flags
**without** a `workspaceId`, so gating responds to the global
`platform_feature_flags` row (or the QA bypass), not to `workspace_feature_flags`
per-workspace overrides. This matches the existing app-wide convention
(`contacts/guests`, `legal`, `planning` guards and the `useFeatureFlag` hook all
resolve global-only). Failing closed to OFF means there is no cross-workspace
exposure risk. If per-workspace enablement of these Money rails is later required,
both the hook and these guards would need `workspaceId` threaded through — tracked
as a separate enhancement, out of scope for the leak fix.

## 5. Files changed

Route guards (new): 6 × `money/{escrow,holds,commissions,payouts,refunds,disputes}/layout.tsx`
UI: `src/components/money/MoneyTabNav.tsx`
API: `src/app/api/money/{holds,release-check,fee-rules}/route.ts`, `src/app/api/money/disputes/[id]/actions/route.ts`
Cross-section: `src/app/(app)/app/work/orders/page.tsx`

## 6. Cross-section effects checked

- Money overview (`/property-manager/money`) "Money Sections" quick-links and
  "Attention Required" only reference V1 routes (income/expenses/invoices/bills/
  arrears/deposits) — no V2 leak. ✅
- Work → Orders escrow shortcut gated (see 3.4). ✅
- `(app)/layout.tsx` `inEscrow`/`inDisputes` path detection is presentation-only
  (shell awareness), not a nav entry — no leak. ✅

## 7. Remaining manual actions

- None required for the gating itself (defaults OFF = correct V1 production state).
- To **demo** the V2 rails, set the relevant flag ON via
  `platform_feature_flags` / `workspace_feature_flags` (or
  `NEXT_PUBLIC_QA_ALL_FLAGS=true` for QA). Note the registry dependency intent:
  `marketplaceEscrow`/`marketplacePayments`/`marketplaceDisputes` are children of
  `marketplaceEnabled`.

## 8. Score (feature-flag isolation only)

**100/100** for the V2 money-rail flag-gating objective: UI suppression + route
guard + API gate all in place, QA bypass honoured, typecheck clean, no dead
links, V1 tabs untouched.

> NOTE: this doc covers **feature-flag isolation only**, which was the reported
> defect. A full 317-point release audit of each individual V1 sub-tab (data
> wiring, RLS, responsive, a11y, exports, etc.) is a separate, larger pass and is
> not claimed complete here.
