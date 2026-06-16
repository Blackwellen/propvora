# Propvora Site Audit — Issues, Errors, Breaks & Unfinished Work

**Date:** 2026-06-15
**Branch:** Propvora-release-version.2.0
**Scope:** Whole app, with deep focus on v2 surfaces (marketplace, supplier workspace, booking/stay, payments/escrow, identity/KYC, customer workspace, admin marketplace + risk, automation v2, network, international).
**Mode:** Read-only audit. No app code modified. Fixes to follow.

---

## Build / Type / Test Health

| Check | Result |
|---|---|
| `npx tsc --noEmit` | **PASS** — 0 errors. |
| `npx next build` | **PASS** — compiled successfully (27.5s), full route tree generated. **1 warning:** `@stripe/stripe-js` module not found (see C-5). |
| `node scripts/audit-queries.mjs` | 23 "misaligned column" findings — **but the snapshot `docs/final-wiring/live-schema.json` is STALE** (dated Jun 15 but missing columns that exist live). Re-verified every finding against the live DB via the Management API. **20 of 23 are FALSE POSITIVES**; 3 are real (see C-2, H-3). The audit gate is currently giving false confidence — see M-7. |
| Vitest | Not executed in this pass (tsc+build were the gating checks). Tests exist under `src/__tests__` and `e2e/`. Recommend running `npx vitest run` before sign-off. |

**Live DB verified** via Supabase Management API (ref `oovgfknmzjcgbilwumch`). All v2 tables confirmed present EXCEPT `booking_reservations` and `supplier_reviews` (neither is load-bearing — see notes). `profiles` has **no** `role`, `is_platform_admin`, or `full_name` columns.

---

## ⚠️ WIRED BUT DEAD (priority section)

Features that look built but silently do nothing due to a contract/schema/URL mismatch. The v2 surfaces lean heavily on tolerant "notReady → render calm empty state" fallbacks, which means a wiring bug presents as a polished *"coming online"* screen instead of an error — hiding the defect.

### WD-1 (CRITICAL) — Entire supplier workspace is dead except the marketplace tab
- **Files:**
  - `src/app/(supplier-workspace)/layout.tsx:31-60` — resolves `workspaceId` server-side then **discards it**, passing only `supplierName` to the shell.
  - `src/app/(supplier-workspace)/supplier/jobs/page.tsx:31` — `useSupplierApi("/api/supplier/jobs")` — **no `?workspaceId=`**.
  - Same defect in `quotes/page.tsx`, `earnings/page.tsx`, `profile/page.tsx`, `reviews/page.tsx`, `availability`, `services`, `onboarding`, `verification` pages.
  - `src/app/api/supplier/jobs/route.ts:42-44` (and quotes/profile routes) — `if (!workspaceId) return 400`.
  - `src/components/supplier-workspace/useSupplierApi.ts:57-58` — **any non-2xx (incl. 400/404/500) → `notReady=true`**.
- **What's wrong:** Every supplier-workspace page calls its API with no `workspaceId`. The API returns HTTP 400. `useSupplierApi` swallows that into `notReady`, so each page permanently renders *"Jobs/Quotes/Earnings coming online…"*. The data layer, RLS, and routes are all built and correct — the UI just never sends the one required parameter. Only `supplier/marketplace/page.tsx` works, because it alone calls `useSupplierWorkspaceId()` and threads the id.
- **Fix:** Thread `workspaceId` from the layout into a client context (e.g. `SupplierWorkspaceProvider`) and have `useSupplierApi` (or each call site) append `?workspaceId=...`. Simplest: in each page, call `useSupplierWorkspaceId()`, `skip` until resolved, then build the URL with the id — mirroring the marketplace page.

### WD-2 (CRITICAL) — Supplier earnings/payments/reviews call routes that don't exist
- **Files:** `src/app/(supplier-workspace)/supplier/earnings/page.tsx:23,26` calls `/api/supplier/jobs/earnings` and `/api/supplier/jobs/payments`; job-detail page calls `/api/supplier/jobs/[id]/events` and `/[id]/status`. Reviews page references `/api/supplier/jobs/reviews`.
- **What's wrong:** Only `src/app/api/supplier/jobs/route.ts` and `.../jobs/[id]/route.ts` exist. `/jobs/earnings` resolves to `[id]` with `id="earnings"` → 404; `/jobs/[id]/events` and `/[id]/status` have no handler → 404. All collapse to `notReady`. The earnings tab is therefore doubly dead (WD-1 + missing routes).
- **Fix:** Create the missing route handlers (`jobs/earnings`, `jobs/payments`, `jobs/[id]/events`, `jobs/[id]/status`, reviews endpoint) OR repoint the pages at existing endpoints. Confirm the intended contract from the page's `select()` shape.

### WD-3 (HIGH) — Platform-admin permission flag never sets (wrong columns)
- **File:** `src/lib/context/actor-context.ts:38-44`.
- **What's wrong:** Selects `profiles.role, is_platform_admin` — **neither column exists** (the real column is `platform_role`). Wrapped in `safeRow`, so it silently returns null → `actor.isPlatformAdmin` is **always false**, and `actor.role` is always null. `src/lib/context/permission-context.ts:27,43` derives `canAdminister` / `canManageWorkspace` from this, so the situational permission context never grants admin capability. **Not a security hole** (the real guard `src/proxy.ts:21` and `src/lib/admin/guard.ts:57` both correctly use `platform_role`), but any UI gated on the *context* layer is silently denied to admins.
- **Fix:** `select("platform_role")` and map `isPlatformAdmin = platform_role === "admin"`, `role = platform_role`. (Compare to the correct pattern in `src/lib/admin/data.ts:283` which aliases `role:platform_role`.)

### WD-4 (HIGH) — Admin verification queue shows blank user names
- **File:** `src/components/admin-verification/data.ts:88`.
- **What's wrong:** `admin.from("profiles").select("id, full_name")` — `full_name` does not exist (correct column is `display_name`). Wrapped in try/catch → `userNamesFor()` always returns `{}` → every 'user' subject in the verification queue renders without a name.
- **Fix:** `select("id, display_name")` (or alias `full_name:display_name`) and read `p.display_name`.

### WD-5 (MEDIUM) — Bookings operator overview has a dead fallback path on a non-existent table
- **Files:** `src/components/bookings/server.ts:346,447` and `src/components/bookings/actions.ts:113` query `booking_reservations` (does **not** exist; the real table is `bookings`).
- **What's wrong:** The **primary** path (`loadBookingsData` → `lib.listBookings` from `src/lib/booking/reservations.ts`, which correctly uses `bookings`) works, so the overview is *currently* functional. But the `readReservationsDirect`/`directStatusUpdate` fallbacks point at a phantom table — if the lib import ever fails, the feature silently degrades to "not provisioned" instead of working. Latent split-brain between two parallel agents (lib uses `bookings`, components use `booking_reservations`).
- **Fix:** Change the three `booking_reservations` references to `bookings`, or delete the dead fallback now that the lib is the source of truth.

### WD-6 (MEDIUM) — `useSupplierApi` masks ALL failures as "not ready"
- **File:** `src/components/supplier-workspace/useSupplierApi.ts:57-77`.
- **What's wrong:** Treats 400/401/403/404/500 and network errors all identically as `notReady`. This is the mechanism that turned WD-1/WD-2 from visible errors into invisible dead screens. It will hide every future supplier-API regression.
- **Fix:** Distinguish 503/"not provisioned" (calm empty state) from 4xx/5xx/network (surface an error state, log to observability). Same pattern should be reviewed in the parallel verification/payments fetchers (`useVerification.ts`, `PaymentForm.tsx`) which at least key off 503 specifically — preferable.

---

## CRITICAL (broken / dead / data-loss / security)

### C-1 — Supplier workspace dead (see **WD-1**) and missing routes (see **WD-2**)
Cross-referenced above. This is the single largest functional gap in v2: a fully built supplier portal that shows "coming online" on every tab.

### C-2 — `actor-context` queries non-existent columns (see **WD-3**)
Confirmed against live `profiles` schema. Permission-context admin gating dead.

### C-5 — Stripe.js dependency missing → card capture cannot load
- **Files:** `src/components/payments/stripeClient.ts:84` (`import("@stripe/stripe-js")`), consumed by `PaymentForm.tsx`, `ProviderHandoff.tsx`, `VerificationCentre.tsx`, `src/app/(supplier-workspace)/supplier/verification/page.tsx`. `package.json` does **not** list `@stripe/stripe-js`.
- **What's wrong:** The dynamic import is wrapped in `try/catch` with `// @ts-ignore`, so the build only warns and the runtime falls back to a "not provisioned" message — meaning the Stripe Elements card field never mounts. Any real payment/escrow or identity-via-Stripe flow that needs client-side Stripe is non-functional.
- **Fix:** Add `@stripe/stripe-js` (and `@stripe/react-stripe-js` if used) to dependencies, or confirm the payment UX is intentionally redirect-based (Checkout/hosted) and remove the dead client import + its "not provisioned" copy so the surface is honest about what it does.

### C-6 — `dark:` Tailwind classes reintroduced in v2 (project rule: must be ZERO)
- **Files (12):** `src/app/(public-booking)/layout.tsx`, `src/components/automations-builder/shared.tsx`, `src/components/bookings/primitives.tsx`, `src/components/customer/ui.tsx`, `src/components/jurisdiction/CountryPicker.tsx`, `src/components/jurisdiction/JurisdictionDisclaimer.tsx`, `src/components/legal-marketplace/AcceptanceGate.tsx`, `src/components/legal-marketplace/LegalPrimitives.tsx`, `src/components/legal-marketplace/PolicyBanner.tsx`, `src/components/network/primitives.tsx`, `src/components/search/CommandPalette.tsx`, `src/components/supplier-workspace/ui.tsx`.
- **What's wrong:** Project memory mandates zero `dark:` classes (was 0 as of 2026-06-12). The v2 wave reintroduced them in 12 files. With no dark theme provider these are dead styling, but they violate the standard and can cause inconsistent rendering.
- **Fix:** Strip all `dark:` variants from these 12 files.

*(Severity note: C-6 is rule-mandated as a release blocker per project memory, hence Critical here despite low runtime impact.)*

---

## HIGH (feature incomplete or wired-but-dead)

- **H-3 — Admin verification queue names blank (see WD-4).** `admin-verification/data.ts:88`.
- **H-4 — Permission-context admin capability dead (see WD-3 / C-2).** `permission-context.ts:27,43`.
- **H-5 — Supplier earnings/job-event routes absent (see WD-2).** Build out the missing API handlers.
- **H-6 — Tolerant fetch wrappers hide regressions (see WD-6).** Affects supplier workspace broadly; recommend before launch so QA can actually see failures.

---

## MEDIUM (UX / quality / correctness)

- **M-5 — Bookings phantom-table fallback (see WD-5).** `bookings/server.ts:346,447`, `actions.ts:113`.
- **M-7 — Schema-audit gate is stale and over-reports.** `docs/final-wiring/live-schema.json` is missing live columns (`workspaces.business_country_code`, `tax_country_code`, `default_currency`, `default_language`, `type`; `marketplace_listings.transaction_type`, `base_price_pence`, `location`; `affiliate_payouts.requested_at`, `payout_email`, `payout_reference`, `review_note`). `scripts/audit-queries.mjs` flags all of these as misaligned (false positives), which trains the team to ignore the gate — masking the **real** ones (profiles.role / is_platform_admin / full_name). **Fix:** regenerate the snapshot from live (`scripts/map-schema.mjs`), then the gate will isolate the 3 genuine bugs.
- **M-8 — `as any` (17) and `eslint-disable` (22) occurrences.** Mostly in tolerant sibling-import shims (`@ts-ignore` on optional-dependency dynamic imports). Acceptable as a pattern but each masks a real type contract; spot-review the payments/stripe and booking/supplier import shims once dependencies are pinned.

---

## LOW (polish / cleanup)

- **L-1 — Dead `supplier_reviews` / `booking_reservations` table names** linger in comments/migrations references though the tables don't exist and aren't the ones queried. Remove to avoid confusing future agents.
- **L-2 — Redundant client `useSupplierWorkspaceId` round-trip.** Once WD-1 is fixed via layout-provided context, the per-page client lookup (`supplier/marketplace/page.tsx`) can be dropped, saving an auth+query on every supplier page load.
- **L-3 — `// @ts-ignore` on the Stripe dynamic import** should become `// @ts-expect-error` (or be removed) once the dependency is added.

---

## What is GOOD (verified working — do not "fix")

- **Customer workspace** (`src/lib/customer/data.ts`, `(customer)/*`) loads server-side via `requireCustomerContext()` and queries real tables (`customer_profiles`, `customer_saved_listings`, `bookings`, `marketplace_transactions`, `message_threads`). Correctly wired — the model the supplier workspace *should* have followed.
- **AI safety** (`src/lib/ai/safety.ts`): `SAFETY_CLAUSES` (no action-claims, no legal/financial/tax advice as fact), prompt-injection sanitisation, and human-approval gate are real and **injected** into `api/ai/chat`, `api/ai/actions`, `api/automations/nl`.
- **Identity & payment status honesty** (`api/identity/status`, `api/payments/status`): only assert `verified`/`paid` from real DB reads, gated 401/403/404, 503 for not-provisioned. No fake confirmations found.
- **Admin gating** (`src/proxy.ts`, `src/lib/admin/guard.ts`) correctly uses `platform_role`. No service-role key reachable from the client (`admin/health/page.tsx` is a server component using `createAdminClient`; only exposes a boolean presence check).
- All v2 escrow/marketplace/risk/network/international tables exist in the live DB and the libs reference real columns (verified `workspaces`, `marketplace_listings`, `profiles`, `affiliate_payouts` directly).

---

## Count Summary

| Severity | Count |
|---|---|
| Critical | 4 (C-1/WD-1, C-2/WD-3, C-5, C-6) |
| High | 4 (H-3/WD-4, H-4, H-5/WD-2, H-6/WD-6) |
| Medium | 3 (M-5/WD-5, M-7, M-8) |
| Low | 3 |
| **Wired-but-dead** | **6 (WD-1…WD-6)** |

---

## Complete These Next (prioritised)

1. **WD-1 / C-1** — Thread `workspaceId` from `(supplier-workspace)/layout.tsx` into a client context and append it to every `useSupplierApi` URL. Unblocks the entire supplier workspace (jobs, quotes, profile, services, availability, onboarding, verification, reviews).
2. **WD-2 / H-5** — Build the missing supplier API routes (`jobs/earnings`, `jobs/payments`, `jobs/[id]/events`, `jobs/[id]/status`, reviews) or repoint pages to existing endpoints.
3. **WD-3 / C-2** — Fix `actor-context.ts` to select `platform_role`. One-line correctness fix to the permission layer.
4. **WD-4 / H-3** — Fix `admin-verification/data.ts` to select `display_name`.
5. **C-5** — Add `@stripe/stripe-js` dependency (or make the payment/verification UX honestly redirect-based and remove the dead import).
6. **WD-6 / H-6** — Make `useSupplierApi` (and siblings) distinguish 503/not-provisioned from real 4xx/5xx/network errors so future regressions are visible to QA.
7. **C-6** — Strip `dark:` classes from the 12 listed files.
8. **M-7** — Regenerate `live-schema.json` so the schema-audit gate reports only genuine misalignments.
9. **WD-5 / M-5** — Repoint `components/bookings` `booking_reservations` references to `bookings`.
