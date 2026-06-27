# Supplier Workspace — Backend-Deferred Items

**Section:** Supplier workspace (`/supplier/*`)
**Date:** 2026-06-27
**Context:** The supplier workspace ships with a real API layer (`/api/supplier/*`, 31 routes
over `supplier_*` tables). Most pages are fully wired. The items below are the remaining
surfaces where a specific backend capability does not yet exist, so the UI cannot be wired
without first building that capability. Each item states the EXACT missing piece — these are
not vague deferrals.

This session fixed everything that was wireable against the existing API (see
`qa-release/sections/16-supplier-workspace.md` for the full matrix and FIX log).

---

## 1. Job evidence upload — `/supplier/jobs/[id]/evidence`

**Status:** UI renders from seed (`getSeedJobCompletion`); upload + submit are local-only stubs.

**Why Claude Code did not fully wire it:** The page reads from a seed helper, not the live
job. The evidence POST endpoint **does exist** (`POST /api/supplier/jobs/[id]/evidence`,
accepts `{ phase, r2Key, metadata }`), but it expects an **R2 object key that has already
been uploaded client-side**. The page has no R2 direct-upload flow wired (presign → PUT → key),
and it currently loads a seed object rather than the real assignment.

**Exact steps to complete:**
1. Replace `getSeedJobCompletion(id)` with `useSupplierApi("/api/supplier/jobs/" + id)` to load
   the live assignment + existing evidence (the GET on that route already returns evidence).
2. Add an R2 presign step: call the existing R2 presign endpoint used elsewhere in the app
   (see `src/components/work/EvidenceUpload.tsx` for the operator-side pattern), PUT the file,
   then POST the returned `r2Key` to `/api/supplier/jobs/[id]/evidence` with the correct `phase`.
3. On success, refresh the evidence list from the GET.

**External blocker:** None — this is buildable by Claude Code, but it is a non-trivial wiring
task that was out of scope for this audit pass (which prioritised correctness bugs and
hardcoded data across 114 pages). Estimated 1–2 hours.

---

## 2. Job sign-off submit — `/supplier/jobs/[id]/sign-off`

**Status:** UI renders from seed; "request sign-off" is a local toast.

**Why:** Same seed-data root cause as evidence. The status endpoint **exists**
(`PATCH /api/supplier/jobs/[id]/status` with `{ to: "completed" }`), so the action is wireable.

**Exact steps:**
1. Load the live assignment (as in item 1).
2. Wire the "request sign-off / mark complete" button to
   `PATCH /api/supplier/jobs/[id]/status { to: "completed" }`.
3. Handle the state-machine error response (the endpoint enforces valid transitions).

**External blocker:** None — buildable, deferred for the same scope reason as item 1.

---

## 3. Payout blocker resolution — `/supplier/payouts/[payoutId]/blockers`

**Status:** UI renders from seed (`getSeedPayoutDetail`); "resolve blocker" + file upload are stubs.

**Why Claude Code did not wire it:** There is **NO resolution endpoint**. `/api/supplier/payouts`
is **GET-only** — there is no POST/PATCH to resolve or unblock a payout. Payout blockers are
also a function of Stripe Connect payout state, which is itself gated behind the unconfigured
`STRIPE_CLIENT_ID` (Stripe Connect OAuth — see MASTER-TODO item 4).

**Exact steps to complete (requires backend work first):**
1. Build `PATCH /api/supplier/payouts/[payoutId]` (or a dedicated `/blockers` route) that marks
   a blocker resolved and, where relevant, triggers a Stripe Connect payout retry.
2. Most blocker types (missing W-9/identity, bank not connected) are resolved by completing
   Stripe Connect onboarding — so this is blocked on **Stripe Connect OAuth** being live.

**External blocker:** YES — Stripe Connect (`STRIPE_CLIENT_ID`) must be configured first.
This is a founder action (MASTER-TODO item 4). Until then, payout pages are correctly read-only.

---

## 4. Supplier invoice create — `/supplier/finance/invoices/new`

**Status:** Wizard renders but `COMPLETED_JOBS` is an empty array, so there are no jobs to
invoice against; submit is a stub.

**Why:** The page hardcodes `const COMPLETED_JOBS = []` instead of loading completed jobs. The
**create endpoint exists** (`POST /api/supplier/invoices`, then `PATCH … { action: "submit" }`).

**Exact steps:**
1. Load completed, un-invoiced jobs via `useSupplierApi("/api/supplier/jobs")` filtered to
   `status === "completed"` and no existing invoice.
2. Wire submit to `POST /api/supplier/invoices` then `PATCH /api/supplier/invoices { action: "submit" }`.

**External blocker:** None — buildable, deferred for scope.

---

## 5. Supplier request decline — `/supplier/requests/[requestId]`

**Status:** "Decline" button shows a banner only.

**Why:** There is no "decline request" endpoint. A supplier declining an inbound lead is not a
destructive/persisted action in V1 — suppliers simply don't quote. The quote-level decline that
exists (`PATCH /api/supplier/quotes/[id] { action: "decline" }`) is the **operator** declining a
**submitted quote**, which is different semantics.

**Recommendation:** For V1, either (a) remove the Decline button (ignoring = not quoting is the
V1 path), or (b) build `PATCH /api/supplier/requests/[id] { action: "dismiss" }` to hide the lead
from the supplier's pipeline. Low priority — not a release blocker.

**External blocker:** None — minor backend addition or a UI removal. Deferred as non-blocking.

---

## 6. Insurance renew + business verification submit — `/supplier/insurance/renew`, `/supplier/verification/business`

**Status:** Forms render with hardcoded current-policy seed; submit is a 600ms timeout + redirect.

**Why:** No supplier-insurance or business-verification write endpoint exists; document upload has
no R2 flow wired. The verification GET exists (`/api/supplier/verification`) but is read-only.

**Exact steps (requires backend):**
1. Build `POST /api/supplier/verification` (or `/insurance`) accepting an R2 document key + policy
   metadata, writing to `supplier_documents` / a verification table.
2. Wire the R2 presign→PUT→key flow on the form.
3. Replace the hardcoded `CURRENT_POLICY` / `COVERAGE_BY_SERVICE` seed with a GET of the supplier's
   real documents.

**External blocker:** Partial — needs the write endpoint built first. Deferred as non-blocking
for V1 (insurance/verification can be handled manually by admins in the interim).

---

## Summary

| Item | Wireable now? | Blocker |
|------|---------------|---------|
| Job evidence upload | Yes (endpoint exists) | Scope only — needs R2 flow + live load |
| Job sign-off | Yes (endpoint exists) | Scope only |
| Payout blocker resolution | No | Stripe Connect OAuth (founder) + missing endpoint |
| Invoice create | Yes (endpoint exists) | Scope only |
| Request decline | N/A | Minor backend or UI removal; non-blocking |
| Insurance/verification submit | Partial | Missing write endpoint |

**None of these are V1 release blockers** — the supplier workspace's core read/quote/job/finance
surfaces are wired to the live API. These are completion items for the V1.5 supplier backend build.
