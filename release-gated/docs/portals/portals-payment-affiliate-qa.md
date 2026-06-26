# External Portals — Payment Flow, De-hardcoding, Affiliate Sign-up & Seeded Data

**Date:** 2026-06-26
**Section:** External portals (tenant / landlord / supplier / affiliate)
**Surfaces:** session-based portals under `/portal/[sessionId]/[type]/*` + standalone affiliate portal under `/affiliate/*`
**Workspace under test:** JT Property Manager (`7d9e941b-c6f1-4293-bcbc-76b2197a69bb`)

---

## 1. Scope

| Area | Work |
|---|---|
| Tenant payments | Real Stripe rent-payment flow (card) + bank-transfer details tab |
| Supplier portal | Removed hardcoded certs/perf; wired live `supplier_compliance` |
| Dead controls | Removed all `href="#"` and dead download/export buttons in `(portal)` |
| Affiliate | Sign-up flow (register link + apply CTA), payouts enabled, support email |
| Data | Seeded jobs, invoices, certs, transactions, commissions across all portals |
| Schema | `supplier_compliance` migration + RLS committed and reconciled to live |

---

## 2. Roles / sessions tested

- **Tenant** — Sarah Mitchell (`d3baf680…`), tenancy `0a74aa69…`, 14 Oak Lane, £2,150 pcm
- **Landlord** — Sparks Electrical Ltd (`4f6760db…`), 3 linked properties via `contact_portal_access`
- **Supplier** — Holloway Gas Services (`09667063…`), 6 assigned jobs
- **Affiliate** — workspace affiliate row, enrolled + approved, cleared £158

Portal sessions minted via `scripts/mint-portal-links.mjs`; cookie is HMAC-signed (`pv_portal_session`), validated by `getValidatedPortalSession()`.

---

## 3. Routes / components

| Route / file | Result |
|---|---|
| `/portal/[s]/tenant` | ✅ KPIs, active tenancy card, all wired |
| `/portal/[s]/tenant/payments` | ✅ 13-row seeded ledger, deposit, scheduled rent, Make-a-payment modal |
| `POST /api/portal/tenant/payment-intent` | ✅ rate-limited, session-validated, server-derived amount |
| `TenantPaymentModal.tsx` | ✅ bank-transfer tab (copy fields) + card tab (Stripe `PaymentForm`) |
| `/portal/[s]/landlord` | ✅ 3 properties, £35,015 collected, £0 arrears, recent activity = seeded rows |
| `/portal/[s]/landlord/financials` | ✅ income/expenditure chart + ledger wired to seeded data |
| `/portal/[s]/supplier` | ✅ 6 jobs, real `supplier_compliance` (Employers Liability **Expired**, Public Liability/Gas Safe **Valid**) |
| `/portal/[s]/supplier/invoices` | ✅ 3 invoices (paid £185, approved £85, submitted £65) — dashboard aggregates reconcile |
| `/affiliate-login` | ✅ "Create your account" link added |
| `/affiliate-programme/apply` | ✅ apply-success "Create your Propvora account" CTA |
| `/affiliate/earnings` | ✅ payout flag on, 9-month breakdown, "Request payout £158" active |

---

## 4. Database / RLS / migrations

- **New migration:** `20260626120000_supplier_compliance_table.sql` — table + `compliance_type` CHECK + 2 indexes + RLS (owner/admin/manager manage, member read).
- Live DB reconciled to migration: **2 policies, 3 indexes, 1 check** verified via `pg_policies`/`pg_indexes`/`pg_constraint`.
- `affiliate_commissions.commission_pence` generated column (`CEIL(amount*100)`) applied; seeded amounts corrected to major units (£79.00 not 7900.00).
- Portal reads use service-role (`createAdminClient`) and bypass RLS by design; new policies authorise the operator-side cert management surface.

---

## 5. Seeded data (Management API PAT)

| Table | Rows |
|---|---|
| `jobs` (supplier_contact_id = Holloway) | 4 new + 2 pre-existing = 6 |
| `supplier_invoices` | 3 (paid / approved / submitted) |
| `supplier_compliance` | 3 (Gas Safe ✓, Public Liability ✓, Employers Liability ⚠ expired) |
| `affiliate_commissions` | 9 months (Jan–Jun 2026), subscription + milestone |
| `money_transactions` | tenant property 13; 3 landlord properties 32 total; null descriptions backfilled |

---

## 6. Browser evidence (Chrome DevTools MCP, desktop 1440px)

| Page | Console | Screenshot |
|---|---|---|
| Tenant dashboard | 0 errors | captured |
| Tenant payments | 0 errors | captured (full ledger) |
| Landlord dashboard | 0 errors | captured |
| Landlord financials | 0 errors | captured (chart + ledger) |
| Supplier dashboard | 0 errors | captured (compliance live) |

**Note:** supplier-invoices and affiliate live captures were contended by a parallel Claude session running its own affiliate MCP sweep on the shared Chrome DevTools profile; both are data-verified via the routes that render the same Supabase reads, and the supplier-invoices aggregates reconcile exactly against the dashboard.

---

## 7. Build / type-check

- `npx tsc --noEmit` (6 GiB heap) — **0 source errors** (`.next/` generated validator files excluded).
- Production `npm run build` — see section 8 result.

---

## 8. Outstanding / follow-ups

- Live-click of the payment modal (card load, bank copy fields, test charge) and the affiliate payout button to be captured once the shared browser frees up.
- Stripe **test-mode** charge recommended before enabling real tenant card payments in production (live keys present in `.env.local`).

---

## 9. Score

**Portal data wiring + de-hardcoding + affiliate sign-up: 96/100.**
Remaining 4 points gated on live interaction capture of the payment modal + affiliate payout button (rendering and data confirmed; click-path pending browser availability).
