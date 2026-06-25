# Release Evidence — Money › Detail Pages

**Section:** Money
**Parent route:** `/property-manager/money`
**Detail pages covered:** Invoice, Bill, Arrears (Chase Arrear + Record Payment), Deposit, Dispute
**Audited:** 2026-06-25 · session `money-detail-qa` (dev :3004, Chrome MCP :9222)
**Auditor:** Claude Code (Opus 4.8)

---

## 1. Scope & record IDs tested

| Detail page | Record type | Route | Test record ID | Exists / workspace |
|---|---|---|---|---|
| Invoice | `invoices` | `/property-manager/money/invoices/{id}` | `b5ada92d-2f7b-4998-ad75-bc186215604e` | ✅ JT Property Manager (`7d9e941b…`) |
| Bill | `bills` (+ `bill_lines`) | `/property-manager/money/bills/{id}` | `bef96bc9-0c4d-49ae-961c-19b4ce738675` | ✅ JT Property Manager |
| Chase Arrear | `arrears_records` | `/property-manager/money/arrears` (list) | n/a (list) | ✅ |
| Record Payment | `payments` | `/property-manager/money/arrears` (list) | n/a (list) | ✅ |
| Deposit | `deposits` | `/property-manager/money/deposits` (list + drawer) | n/a (list) | ✅ |
| Dispute | `marketplace_disputes` (+ `dispute_actions`) | `/property-manager/money/disputes/{id}` | `5eed0014-0000-0000-0001-000000000001` | ✅ (resolved, supplier, £90) |

> Note: the **Chase Arrear**, **Record Payment** and **Deposit** routes in the brief are **list/drawer surfaces**, not per-record detail pages. They are covered here at the list+drawer level. (Bill/Invoice/Dispute are true detail pages.)

---

## 2. Data sources verified (live Supabase, schema-confirmed via Management API)

- `bills` (id, workspace_id, bill_number, bill_type, supplier_contact_id, property_id, unit_id, job_id, status, subtotal, tax_amount, total, currency, due_date, issue_date, notes, created_at…)
- `bill_lines` (description, quantity, unit_price, tax_rate, line_total, sort_order) — **2 real lines** on the test bill
- `invoices` (invoice_number, contact_id, property_id, total, status, due_date, paid_amount, currency…)
- `payments` (workspace_id, payment_type, linked_type, linked_id, amount, currency, payment_date, payment_method, status, reference…)
- `arrears_records`, `deposits`, `marketplace_disputes`, `dispute_actions`
- Embeds verified: `contacts!supplier_contact_id`, `contacts`, `properties` resolve; `units`/`jobs` had **no FK** (fixed — see §5).

---

## 3. Bugs found & fixed (this drop)

| Ref | Page | Severity | Issue → Fix |
|---|---|---|---|
| FIX-460 | Bill | **P1** | Detail page was a mock shell: blanked live supplier/property/unit/job/line-items, no not-found state, fabricated payment/activity/audit/supplier-invoice/supplier-history, dead upload buttons, list-page links, `undefined` type label. → Full rewire to live `bills`+`bill_lines`+`payments`+`documents`+`audit_logs`, real joins, not-found + loading states, real deep links, `formatCurrency`, all fabrication removed. |
| FIX-461 | Invoice | P2 | Recipient/Property/Related showed raw UUIDs (single-invoice hook didn't join). → Joined `contacts`/`properties` in `useMoneyInvoice`; page renders resolved names. |
| FIX-462 | Bill (schema) | P2 | `bills.unit_id`/`job_id` had no FK (integrity gap + broke embeds). → Added both FKs `ON DELETE SET NULL` (0 orphans verified); reproducible migration committed. |
| FIX-463 | Deposit | P2 | Protected deposits showed "— Not protected" (contradicting their badge) and the scheme filter was dead — `mapDeposit` never mapped `protection_scheme` and the page hardcoded `scheme: null`. → Mapped `protection_scheme`, normalised the protect-write to a canonical short code (`toSchemeCode`). Verified: rows now show MyDeposits/TDS/DPS. |

---

## 4. Verification performed

**TypeScript:** `npx tsc --noEmit` → **exit 0, 0 errors** (after all edits).

**Live browser (Chrome MCP, dev :3004, authenticated as workspace owner):**

| Check | Bill `bef96bc9…` | Invoice `b5ada92d…` |
|---|---|---|
| Renders real record (not placeholder) | ✅ Dave Holloway / 14 Oak Lane | ✅ Emma Williams / 12 Harbour View |
| Money totals correct | ✅ Subtotal £325 · Tax £65 · Total £390 · Outstanding £390 | ✅ Subtotal £1,640 · Total £1,640 · Outstanding £1,640 |
| Line items live | ✅ 2 lines (Replace diverter valve £210, Labour 2.5 hrs £115) | ✅ tab present |
| No raw UUIDs in UI | ✅ | ✅ (was failing — fixed) |
| Related links → real record routes | ✅ contact + property uuids in href, names in text | ✅ |
| Not-found / no-access state | ✅ styled "Bill not found" (verified via cross-workspace id) | ✅ "Invoice not found" |
| Console errors | ✅ none (was a 400 PGRST200 — fixed) | ✅ none |
| Desktop 1440 | ✅ | ✅ |
| Mobile 390×844 | ✅ no overflow, MobileTopBar + MobileTabs, responsive KPI grid | (code-reviewed; shares shell) |

**RLS / workspace isolation:** confirmed live — the test bill is workspace-scoped; querying it from a different active workspace returns the not-found state (no leak). All detail queries filter `workspace_id` + id.

**Additional live verification (this pass, dev :3004):**

| Page | Verified |
|---|---|
| **Dispute** (`5eed0014…`) | **Dual-state flag test.** Flag OFF: direct URL redirects to `/property-manager/money` (no V2 leak) ✅. Flag ON (`NEXT_PUBLIC_QA_ALL_FLAGS=true`): renders real record — "work_incomplete", Resolved, £90 disputed / £90 refunded, real detail text, 9 tabs, 9 wired admin actions (request-evidence / hold/release payout / partial/full refund / settle / suspend / escalate / close), party-membership auth passed, console clean. |
| **Deposit** (`/money/deposits`) | 9 real deposits, £12,846 tracked / £10,321 protected (80%), KPI strip, status/scheme/property filters (real property options), TDP legal notice, right-rail (Deposit Status donut, Upcoming Returns, Needs Attention). Scheme display fixed (FIX-463) — MyDeposits/TDS/DPS now show correctly. Console clean. |
| **Arrears** (`/money/arrears`) | Real data: £3,475 total / 2 open / 1 chasing / 1 payment-plan / 1 resolved; Card+List toggle; case Marcus Chen (HIGH RISK, £1,980, 8d overdue, last chased 27/05 email); **Chase Now** + **Record Payment** + Invoice + Contact actions present; right-rail Arrears Exposure + High-Risk Cases. Console clean. |

**Feature-flag note:** Disputes (and Escrow/Holds/Commissions/Payouts/Refunds) are V2 surfaces gated behind `marketplaceDisputes` etc. — they correctly redirect to `/money` when off. Bill/Invoice/Arrears/Deposit are V1 and always available.

---

## 5. Code-level audit results (per page)

- **Invoice** — uses `useMoneyInvoice` (workspace-scoped, 42P01-tolerant), loading skeleton, not-found, R2 document upload, real `payments`/`audit_logs`, resend via `/api/invoices/{id}/resend`, draft-only inline edit locks. Status timeline shows honest empty state when no audit rows. **Good.**
- **Bill** — rewired (FIX-460). Now matches the invoice quality bar.
- **Arrears** (`/money/arrears`) — uses `useMoneyArrears` + summary, honest empty state, no mock fallback. **Good.**
- **Record Payment** — payments now insert into the real `payments` ledger (wired on the bill page; arrears chase flow uses `arrears_records`). **Good.**
- **Deposit** (`/money/deposits` + `DepositDetailDrawer`) — uses `useMoneyDeposits` + summary + `useCreateMoneyDeposit`, real empty states, distinct-property filter from live data. **Good.**
- **Dispute** (`/money/disputes/{id}`) — server component with admin-client fetch + explicit party-membership authorisation (`assertWorkspaceMember`), `notFound()` on missing/unauthorised, append-only `dispute_actions` audit, wired admin actions via `/api/money/disputes/{id}/actions`. **Good.**

---

## 6. Remaining / not-completed in this drop

See `release-gated/user-fixes/money/detail-pages.md`. Summary:
- Full 8-viewport sweep was performed for **Bill** (desktop+mobile live); the other four pages were code-reviewed against the shared shell, not individually screenshotted at all 8 sizes.
- Formal automated **RLS positive/negative** + **E2E** + **visual-regression** suites for these pages are not yet written (manual live RLS isolation was verified for Bill).
- "Pay via Stripe" remains intentionally disabled pending Stripe Connect onboarding (external gate).

---

## 7. Scores (honest)

| Page | Score | Notes |
|---|---|---|
| **Bill** | **96 / 100** | Fully rewired + live-verified desktop+mobile. −4: automated RLS/E2E suite not written; Stripe Connect external. |
| **Invoice** | **95 / 100** | UUID→name fixed + live-verified. −5: full 8-viewport screenshots + automated tests pending. |
| **Dispute** | **95 / 100** | Strong server-side auth + audit; **dual-state flag verified live** + real record render. −5: automated tests pending. |
| **Arrears / Record Payment** | **94 / 100** | Hook-wired, honest states, **live-verified** (real case, Chase/Record-Payment actions). −6: automated tests pending. |
| **Deposit** | **94 / 100** | Hook-wired list+drawer, **live-verified**, scheme-display bug fixed (FIX-463). −6: some seed deposits lack a linked tenant ("Unknown Tenant"); automated tests pending. |

**Section release decision:** **Ready for release** — all five surfaces live-verified with real data, console clean, no blocking defects. Residual items (automated test suites, full 8-viewport screenshot matrix, Stripe Connect external gate, deposit seed-tenant backfill) are logged in user-fixes; none block release.

---

## 8. Pass 2 — remaining items completed (2026-06-25, follow-up)

Note: per founder instruction, **Playwright was not used**; verification is via Chrome
MCP (responsive matrix) + a Node RLS script + live DB checks.

| Item | Status | Evidence |
|---|---|---|
| **Deposit seed polish** (FIX: data) | ✅ Done | Backfilled the 5 deposits missing a tenant/property via Management API PAT — created 5 realistic tenant contacts (Tom Bradley, Aisha Khan, Daniel Reed, Grace Bennett, Liam Foster) + linked 2 spare properties (3 Mill Lane, 9 Oakwood Terrace). Verified: **0 deposits** now lack a contact or property; no more "Unknown Tenant"/"Unknown Property". |
| **Automated RLS suite** (TEST-MONEY-RLS) | ✅ Done | New `scripts/test/money-rls.mjs` (Node, not Playwright), registered in `scripts/test/run-all.mjs` + `npm run test:integration`. Seeds invoices/invoice_lines/bills/bill_lines/payments/deposits/arrears_records in a second workspace, asserts cross-workspace LIST/FETCH/INSERT/UPDATE/DELETE isolation + positive owner-reads. **Result: 24/24 passed** on the live DB. |
| **Stripe "Pay via Stripe"** (FIX-464) | ✅ Done (code) | New `StripeConnectButton` reads live `/api/connect/status`: V1 (flag off) → truthfully disabled w/ reason; flag on + not onboarded → real "Set up Stripe" → `/api/connect/onboard`; connected+charges → enabled → opens Record Payment. Wired into both bill-page instances. Verified live: disabled state renders correctly. **External step remaining:** the founder's Stripe Connect OAuth onboarding (cannot be automated). |
| **8-viewport matrix** | ◑ Partial | **Bill: 8/8** captured to `screenshots/money/matrix/` + verified (desktop rail / mobile shell switch / no overflow). Invoice, Dispute, Deposit, Arrears live-verified at desktop (+ Dispute flag on/off). Full 8-size archive for those 4 interrupted by a Chrome MCP connection drop (tooling, not app) — see matrix README. |

**TypeScript after all Pass-2 edits:** `npx tsc --noEmit` → exit 0, 0 errors.

### Revised scores
- **Bill 98** (full matrix + RLS + honest Stripe button), **Invoice 96**, **Deposit 95** (seed + scheme fixed), **Dispute 94**, **Arrears 92**.
- **Release decision:** Bill / Invoice / Deposit / Arrears — **Ready for release**. Dispute — **Ready behind `marketplaceDisputes` flag** (V2). Only external gate: Stripe Connect OAuth (founder).
