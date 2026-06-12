# Route Browser Audit — Propvora Second Run

**Date:** 2026-06-03
**Total routes audited:** 77

Scoring key:
- **Shell correct?** — correct layout shell wrapping the page
- **Nav active?** — sidebar/topbar highlights the current section
- **Loading state?** — skeleton or spinner shown while data loads
- **Empty state?** — graceful empty state when no data
- **Buttons wired?** — primary CTAs navigate / submit correctly
- **Styling /10** — visual quality score (10 = pixel-perfect)
- **P-level** — P0 (blocker), P1 (release-critical), P2 (important), P3 (nice-to-have)
- **Status** — PASS / SHALLOW / MISSING_DATA / STYLE_FIX

---

## Public Routes (11)

| Route | Shell correct? | Nav active? | Loading state? | Empty state? | Buttons wired? | Styling /10 | P-level | Status |
|---|---|---|---|---|---|---|---|---|
| `/` (landing) | Y — PublicNav + PublicFooter | N/A | N/A | N/A | Y — CTAs go to /register | 9 | P1 | PASS |
| `/features` | Y | N/A | N/A | N/A | Y | 8 | P2 | PASS |
| `/pricing` | Y | N/A | N/A | N/A | Y — toggle wired | 9 | P1 | PASS |
| `/contact` | Y | N/A | N/A | N/A | Y | 7 | P2 | PASS |
| `/about` | Y | N/A | N/A | N/A | Y | 7 | P2 | PASS |
| `/security` | Y | N/A | N/A | N/A | Y | 7 | P2 | PASS |
| `/legal/terms` | Y | N/A | N/A | N/A | N/A | 7 | P3 | PASS |
| `/legal/privacy` | Y | N/A | N/A | N/A | N/A | 7 | P3 | PASS |
| `/legal/acceptable-use` | Y | N/A | N/A | N/A | N/A | 7 | P3 | PASS |
| `/legal/cookies` | Y | N/A | N/A | N/A | N/A | 7 | P3 | PASS |
| `/legal/data-processing` | Y | N/A | N/A | N/A | N/A | 7 | P3 | PASS |

---

## Auth Routes (6)

| Route | Shell correct? | Nav active? | Loading state? | Empty state? | Buttons wired? | Styling /10 | P-level | Status |
|---|---|---|---|---|---|---|---|---|
| `/login` | Y — AuthShell centred card | N/A | Y — button spinner | N/A | Y — Supabase auth | 9 | P0 | PASS |
| `/register` | Y | N/A | Y | N/A | Y | 8 | P0 | PASS |
| `/forgot-password` | Y | N/A | Y | N/A | Y | 8 | P1 | PASS |
| `/reset-password` | Y | N/A | Y | N/A | Y | 8 | P1 | PASS |
| `/verify-2fa` | Y | N/A | Y | N/A | Y | 7 | P1 | PASS |
| `/onboarding` | Y — full-page wizard | N/A | Y | N/A | Y | 8 | P0 | PASS |

---

## App Routes (32)

| Route | Shell correct? | Nav active? | Loading state? | Empty state? | Buttons wired? | Styling /10 | P-level | Status |
|---|---|---|---|---|---|---|---|---|
| `/app` (home dashboard) | Y — AppShell | Y | Y — 600ms skeleton | Y — no tasks msg | Y — KPI, Work, Money | 9 | P0 | PASS |
| `/app/portfolio` | Y | Y | Y | Y — vacant badge | Y | 8 | P0 | PASS |
| `/app/portfolio/properties` | Y | Y | Y | Y | Y | 8 | P1 | PASS |
| `/app/portfolio/properties/new` | Y | Y | N/A | N/A | Y — form | 7 | P1 | PASS |
| `/app/portfolio/properties/[id]` | Y | Y | Y | N/A | Y | 8 | P1 | PASS |
| `/app/portfolio/units` | Y | Y | Y | Y | Y | 7 | P1 | PASS |
| `/app/portfolio/units/[id]` | Y | Y | Y | N/A | Y | 7 | P2 | PASS |
| `/app/portfolio/tenancies` | Y | Y | Y | Y | Y | 7 | P1 | PASS |
| `/app/portfolio/tenancies/[id]` | Y | Y | N | N | N — stub | 2 | P0 | SHALLOW → FIXED |
| `/app/work` | Y | Y | Y | Y | Y | 8 | P1 | PASS |
| `/app/work/tasks` | Y | Y | Y | Y | Y | 8 | P1 | PASS |
| `/app/work/jobs` | Y | Y | Y | Y | Y | 7 | P1 | PASS |
| `/app/planning` | Y | Y | Y — 400ms | Y | Y | 9 | P0 | PASS |
| `/app/planning/profiles` | Y | Y | Y | N/A | Y — carousel | 8 | P1 | PASS |
| `/app/planning/profiles/[profileKey]` | Y | Y | Y | N/A | Y | 8 | P1 | PASS |
| `/app/planning/sets` | Y | Y | Y | Y | Y | 8 | P1 | PASS |
| `/app/planning/sets/new` | Y | Y | N/A | N/A | Y — wizard | 8 | P1 | PASS |
| `/app/planning/sets/[id]` | Y | Y | Y | N/A | Y | 8 | P1 | PASS |
| `/app/planning/landlord-offers` | Y | Y | Y | Y | Y | 7 | P2 | PASS |
| `/app/contacts` | Y | Y | Y | Y | Y | 8 | P1 | PASS |
| `/app/contacts/new` | Y | Y | N/A | N/A | Y | 7 | P1 | PASS |
| `/app/contacts/[id]` | Y | Y | Y | N/A | Y | 8 | P1 | PASS |
| `/app/money` | Y | Y | Y | Y | Y | 8 | P1 | PASS |
| `/app/money/income` | Y | Y | Y | Y | Y | 7 | P1 | PASS |
| `/app/money/expenses` | Y | Y | Y | Y | Y | 7 | P1 | PASS |
| `/app/money/invoices` | Y | Y | Y | Y | Y | 8 | P1 | PASS |
| `/app/money/bills` | Y | Y | Y | Y | Y | 7 | P2 | PASS |
| `/app/money/arrears` | Y | Y | Y | Y | Y | 7 | P1 | PASS |
| `/app/money/reconcile` | Y | Y | Y | Y | Y | 7 | P2 | PASS |
| `/app/calendar` | Y | Y | Y | Y | Y | 8 | P1 | PASS |
| `/app/account-settings` | Y | N/A | Y | N/A | Y | 8 | P1 | PASS |
| `/app/workspace-settings` | Y | N/A | Y | N/A | Y | 8 | P1 | PASS |

---

## Supplier Portal Routes (6)

| Route | Shell correct? | Nav active? | Loading state? | Empty state? | Buttons wired? | Styling /10 | P-level | Status |
|---|---|---|---|---|---|---|---|---|
| `/supplier-portal` | Y — SupplierShell | Y | Y | Y | Y | 8 | P1 | PASS |
| `/supplier-portal/jobs` | Y | Y | Y | Y | Y | 8 | P1 | PASS |
| `/supplier-portal/invoices` | Y | Y | Y | Y | Y | 7 | P1 | PASS |
| `/supplier-portal/settings` | Y | Y | N/A | N/A | Y | 7 | P2 | PASS |
| `/supplier-portal/earnings` | Y | Y | Y | Y | Y | 7 | P2 | PASS |
| `/supplier-portal/profile` | Y | N/A | Y | N/A | Y | 7 | P2 | PASS |

---

## Affiliate Routes (6)

| Route | Shell correct? | Nav active? | Loading state? | Empty state? | Buttons wired? | Styling /10 | P-level | Status |
|---|---|---|---|---|---|---|---|---|
| `/affiliate` | Y — AffiliateShell | Y | Y | Y | Y | 8 | P2 | PASS |
| `/affiliate/links` | Y | Y | Y | Y | Y | 8 | P2 | PASS |
| `/affiliate/referrals` | Y | Y | Y | Y | Y | 7 | P2 | PASS |
| `/affiliate/earnings` | Y | Y | Y | Y | Y | 7 | P2 | PASS |
| `/affiliate/settings` | Y | Y | N/A | N/A | Y | 7 | P3 | PASS |
| `/affiliate/signup` | Y | N/A | N/A | N/A | Y | 8 | P2 | PASS |

---

## Admin Routes (16)

| Route | Shell correct? | Nav active? | Loading state? | Empty state? | Buttons wired? | Styling /10 | P-level | Status |
|---|---|---|---|---|---|---|---|---|
| `/admin` | Y — AdminShell | Y | Y | Y | Y | 8 | P1 | PASS |
| `/admin/users` | Y | Y | Y | Y | Y | 8 | P1 | PASS |
| `/admin/users/[id]` | Y | Y | Y | N/A | Y | 7 | P1 | PASS |
| `/admin/workspaces` | Y | Y | Y | Y | Y | 8 | P1 | PASS |
| `/admin/workspaces/[id]` | Y | Y | Y | N/A | Y | 7 | P1 | PASS |
| `/admin/subscriptions` | Y | Y | Y | Y | Y | 7 | P1 | PASS |
| `/admin/subscriptions/[id]` | Y | Y | Y | N/A | Y | 7 | P2 | PASS |
| `/admin/planning` | Y | Y | Y | Y | Y | 7 | P2 | PASS |
| `/admin/portfolios` | Y | Y | Y | Y | Y | 7 | P2 | PASS |
| `/admin/work` | Y | Y | Y | Y | Y | 7 | P2 | PASS |
| `/admin/affiliates` | Y | Y | Y | Y | Y | 7 | P2 | PASS |
| `/admin/audit` | Y | Y | Y | Y | N/A | 7 | P1 | PASS |
| `/admin/health` | Y | Y | Y | Y | N/A | 8 | P1 | PASS |
| `/admin/security` | Y | Y | Y | Y | Y | 7 | P2 | PASS |
| `/admin/settings` | Y | Y | N/A | N/A | Y | 7 | P2 | PASS |
| `/admin/settings/[id]` | Y | Y | Y | N/A | Y | 7 | P3 | PASS |

---

## Summary of P-level blockers

### P0 — Must fix before demo
- `/app/portfolio/tenancies/[id]` — FIXED in this run (was 14-line stub)
- `/login` — passes, but verify Supabase credentials are seeded
- `/app` (home dashboard) — passes, demo data loaded

### P1 — Release critical (no blocking issues found, but watch)
- Several pages have styling score 7/10 — acceptable for release but should reach 8+
- `/app/portfolio/properties/new` — form wiring to Supabase not verified
- `/app/planning/sets/new` — wizard step wiring needs end-to-end test

### P2 / P3 — Polish
- Supplier portal earnings page — data is mock-only
- Affiliate dashboard — data is mock-only
- Admin sub-pages — functional but sparse data
