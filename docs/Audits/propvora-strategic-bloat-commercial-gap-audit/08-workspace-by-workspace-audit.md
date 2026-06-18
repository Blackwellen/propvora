# 08 — Workspace-by-Workspace Audit

**Status:** Draft · 2026-06-18 · Owner: Product + UX audit
**Conforms to:** `_shared-strategic-brief.md` (Verdict = Model 2 staged property OS;
Layer model §3; route targets §4; scoring rubric §5; infra facts §6).
**Scope:** every shipped surface, audited individually with a consistent template.
This is the largest doc in the pack and is intentionally exhaustive.

> **Layer key (binding, from brief §3):** **A** = V1 operator core (KEEP/ship).
> **B** = portals / operator-side supplier coordination (retention fabric, V1).
> **C** = premium differentiators — Planning, AI Copilot, advanced compliance/legal
> (V1.5, gate + price). **D** = future multi-sided platform — marketplace, customer
> workspace, independent-supplier SaaS, full GL, automation canvas (V2,
> **code stays, flag OFF**). **Ops** = internal control plane (admin).

> **Disposition verbs:** KEEP · MERGE · CUT · DEFER · FEATURE-FLAG (FLAG) ·
> IMPROVE · SPLIT-OUT. Every keep/cut ties to a layer.

---

## 0. Ground-truth route map (measured, not estimated)

All counts are `page.tsx` files under `src/app`, measured 2026-06-18.

| Route group | Path prefix | `page.tsx` count | Layer | Brief alignment |
|---|---|---:|---|---|
| Operator app | `(app)/app/*` | **351** | A/B/C/D mixed | brief said "operator 350" ✓ |
| Independent supplier workspace | `(supplier-workspace)/supplier/*` | **124** | D/C | brief said "supplier 112" — now **124** [VERIFY drift] |
| Customer/guest workspace | `(customer)/customer/*` | **46** | D | flag `customerWorkspace` OFF |
| Admin control plane | `(admin)/admin/*` | **52** | Ops | brief said ~50 ✓ |
| Session portal (tenant/landlord/supplier) | `(portal)/portal/*` | **35** | B | retention fabric |
| Marketplace public | `(marketplace-public)/marketplace/*` | **11** | D | flag OFF |
| Public booking / stays | `(public-booking)/*` | **10** | D | flag OFF |
| Tenant portal (standalone) | `(tenant)/tenant-portal/*` | **8** | B | **DUPLICATE of session portal** |
| Landlord portal (standalone) | `(landlord)/landlord-portal/*` | **8** | B | **DUPLICATE of session portal** |
| Auth | `(auth)/*` + `(admin-auth)` | **9** | A | KEEP |
| Supplier portal (standalone) | `(supplier)/supplier-portal/*` | **7** | B | **DUPLICATE of session portal** |
| Error/empty states | `(states)/*` | **5** | A | KEEP |
| Public marketing + root pages | root (no group) | **~17** distinct | A | trim |
| **TOTAL `page.tsx`** | — | **725** | — | brief "~670" understated by ~55 |

**Total measured: 725 route files** (725 vs brief's ~670 estimate). The gap is
the standalone-portal triplicate (23 routes) plus customer-workspace growth.

> **CONTRADICTION #1 (route base path).** The PM `SideNavigation.tsx` links to
> `MANAGER_BASE = "/property-manager"` for **every** item (e.g.
> `/property-manager/portfolio`), but the operator app physically lives at
> `src/app/(app)/app/*` → URL `/app/*`. Either a rewrite/alias exists in
> `proxy.ts`/`next.config` [VERIFY], or **the entire operator sidebar is broken**.
> The brief's route targets assume `/app/*`. This must be reconciled in `19`.

---

## Audit template (applied to every surface)

> Each surface below uses this fixed sub-structure: **Routes · Purpose · Actual
> user · Commercial value · USP value · Bloat · Duplications · Missing essentials ·
> Disposition lists · Route architecture after trim · Navigation after trim ·
> DB/schema · UI · Tests · FINAL.** Scores (1–10) use brief §5 rubric where useful.

---

# PART 1 — PUBLIC / UNAUTHENTICATED SURFACES

## 1.1 Public marketing site

| Field | Finding |
|---|---|
| **Routes** | ~17 root pages: `/`, `/about`, `/pricing`, `/features`, `/contact`, `/faq`, `/help`, `/legal` (+33 legal subpages), `/changelog`, `/walkthrough`, `/affiliate-programme` (+faq/terms), `/maintenance`. Plus consumer marketing `/stays`, `/services`, `/suppliers`, `/providers`, `/emergency` that **shadow the D-layer**. |
| **Purpose** | Convert operators; explain wedge; legal/SEO. |
| **Actual user** | Prospective operator (ICP), legal/compliance reviewers, SEO crawlers. |
| **Commercial value** | HIGH — this is where the 30-second story lands (brief §4). Layer A. |
| **USP value** | HIGH if it foregrounds UK compliance + Planning; LOW if it leads with "marketplace/stays/booking". |
| **Bloat** | `/stays`, `/services`, `/suppliers`, `/providers`, `/emergency` are **consumer-marketplace marketing** pages for a layer flagged OFF (D). They dilute the operator story and promise a product not shipped → landing-page-no-lying risk. |
| **Duplications** | `/help` (marketing) vs `/app/help` vs `/customer/help` vs `/supplier/help` — four help surfaces. `/affiliate-programme` marketing vs in-app affiliates. |
| **Missing essentials** | A focused **"For operators"** solution page tying compliance + maintenance + money + portals into one demo narrative; an honest **roadmap** strip for marketplace ("coming"). |
| **KEEP (A)** | `/`, `/about`, `/pricing`, `/features`, `/contact`, `/faq`, `/legal`, `/changelog`, `/walkthrough`, `/affiliate-programme`. |
| **CUT/FLAG (D)** | `/stays`, `/services`, `/suppliers`, `/providers`, `/emergency` — gate behind `marketplaceEnabled`; remove from public nav until V2. |
| **MERGE** | Consolidate `/help` content into one public help shell; deep-link in-app helps to it. |
| **Route architecture after trim** | ~12 operator-focused marketing routes + 33 legal (legal stays). |
| **Navigation after trim** | Mega-menu: Product · Pricing · Compliance(USP) · Planning(USP) · Resources · Login. No "Stays/Services/Emergency" top-level. |
| **DB/schema** | None (static + `platform_feature_flags` to gate consumer pages). |
| **UI** | Lead hero with compliance/Planning USP; demote consumer imagery. |
| **Tests** | Smoke render all marketing routes; assert consumer pages 404/redirect when `marketplaceEnabled=false`. |
| **FINAL** | KEEP operator marketing (A); **FLAG-OFF the 5 consumer marketing pages (D)**. |

## 1.2 Public marketplace / stays / services / providers / emergency

| Field | Finding |
|---|---|
| **Routes** | `(marketplace-public)/marketplace/*` = **11** (`marketplace`, `stays`, `stays/[slug]`, `services`, `services/[slug]`, `suppliers`, `suppliers/[slug]`, `emergency`, `book/[listingId]`, `request/[requestId]`, `checkout/[draftId]`). Plus `(public-booking)/*` = **10** (`booking/[ref]`, `booking/checkout/[draftId]`, `stay/search|map|compare|wishlist`, `stay/[slug]` + `/checkout`/`/pay`/`/confirmation`). |
| **Purpose** | Consumer-facing booking & supplier discovery storefront. |
| **Actual user** | End consumers / guests — **NOT the V1 paying buyer**. |
| **Commercial value** | V1: ZERO (no liquidity, cold start — brief §1 rejects Model 3). V2: high optionality. |
| **USP value** | Marketplace is explicitly **not** the moat (brief §2.4); compliance + Planning are. |
| **Bloat** | All 21 routes are pre-liquidity. Two overlapping consumer flows: `(marketplace-public)/marketplace/stays` **and** `(public-booking)/stay/*` are **parallel booking funnels**. |
| **Duplications** | `marketplace/book/[listingId]` + `marketplace/checkout/[draftId]` vs `booking/[ref]` + `booking/checkout/[draftId]` vs `stay/[slug]/checkout`+`/pay` = **three checkout paths**. |
| **Missing essentials** | (V2) real listing inventory, payment rails proven, trust/safety, dispute SLA. |
| **KEEP-CODE / FLAG (D)** | All — `marketplaceEnabled` master + `marketplaceStays`/`Suppliers`/`Emergency`/`Payments`. Do not delete (optionality is the platform thesis). |
| **MERGE (V2 work)** | Collapse the **three checkout funnels into one** before V2 launch; pick `(public-booking)/stay/*` OR `marketplace/*` as canonical. |
| **DEFER** | Emergency consumer dispatch (`/marketplace/emergency`) → V2 with on-call supplier liquidity. |
| **Route architecture after trim** | 0 visible in V1; ~15 (post-merge) visible in V2. |
| **Navigation after trim** | None in V1 nav. |
| **DB/schema** | Marketplace tables remain dormant; no V1 migration. |
| **UI** | None in V1. |
| **Tests** | Assert all 21 routes are unreachable (redirect to marketing) with flags OFF. |
| **FINAL** | **FLAG-OFF, keep code (D).** Pre-V2: dedupe 3 checkout funnels + 2 stay funnels into 1. |

---

# PART 2 — AUTH & ONBOARDING

## 2.1 Auth (login / register / OTP / MFA / reset / invite)

| Field | Finding |
|---|---|
| **Routes** | 9: `login`, `register`, `forgot-password`, `reset-password`, `verify-2fa`, `invite/[token]`, `onboarding`, `onboarding/supplier`, `admin-login`. |
| **Purpose** | Single-account / multi-membership auth; persona-aware login (memory: Customer/PM/Supplier switch). |
| **Actual user** | All personas; operator is V1 priority. |
| **Commercial value** | HIGH (gate to revenue). Layer A. |
| **USP value** | Neutral; must not leak un-shipped personas (customer hidden from switcher per memory). |
| **Bloat** | `onboarding/supplier` is independent-supplier (D) onboarding — should be flag-gated with `supplierWorkspace`. |
| **Duplications** | None material. `admin-login` correctly isolated. |
| **Missing essentials** | [VERIFY] MFA enforcement on admin (`admin-mfa-otp-gate`); email-verification gate; rate-limit UI on `forgot-password`. |
| **KEEP (A)** | login, register, forgot/reset, verify-2fa, invite, onboarding, admin-login. |
| **FLAG (D)** | `onboarding/supplier` behind `supplierWorkspace`. |
| **Route architecture after trim** | 8 visible + 1 flagged. |
| **Navigation** | Persona switch surfaces only enabled personas in V1 (operator; supplier if flag). |
| **DB/schema** | `profiles`, memberships, `workspace` plan; ensure invite token RLS. |
| **UI** | Confirm zero `dark:`; persona switcher hides customer (memory). |
| **Tests** | E2E: register→onboard→login; MFA; invite-accept; reset; expired-invite state. |
| **FINAL** | KEEP (A); gate supplier onboarding. |

## 2.2 Onboarding (operator + supplier)

| Field | Finding |
|---|---|
| **Routes** | Operator `(auth)/onboarding`; supplier `(auth)/onboarding/supplier` + `(supplier-workspace)/supplier/onboarding` (`/`, `/readiness`, `/complete`). |
| **Purpose** | First-value setup. |
| **Actual user** | New operator (V1); supplier (V2). |
| **Commercial value** | HIGH — activation drives retention. Layer A (operator). |
| **USP value** | Operator onboarding should seed a compliance + Planning "first win". |
| **Bloat** | Supplier onboarding (4 routes) is D-layer pre-V2. |
| **Duplications** | Two supplier-onboarding entry points (`(auth)/onboarding/supplier` and `(supplier-workspace)/supplier/onboarding`). MERGE. |
| **Missing essentials** | Operator: guided "add first property → first cert → first portal invite" path (links to `empty-state-to-onboarding-path`). |
| **KEEP (A)** | Operator onboarding. |
| **MERGE** | Two supplier onboarding entries → one. |
| **FLAG (D)** | All supplier onboarding behind `supplierWorkspace`. |
| **DB/schema** | `onboarding_state`/workspace flags [VERIFY table]. |
| **Tests** | Operator onboarding completion → home with seeded first-record CTA. |
| **FINAL** | KEEP operator (A); merge + flag supplier (D). |

---

# PART 3 — OPERATOR WORKSPACE (Layer A core, the product we sell)

> Operator sidebar (`SideNavigation.tsx`) declares **5 groups, 17 items**:
> OVERVIEW(Home) · CORE(Portfolio, Work, **Bookings**, **Listings**, Suppliers,
> Planning, Contacts, Portals, Messages) · FINANCE(Money, **Accounting**,
> Affiliate) · OPERATIONS(Calendar, Compliance, Legal, **Automations**) ·
> SYSTEM(Workspace, Billing). Brief §4 target = **≤8 sidebar items**. Bolded
> items are layer-C/D and should leave the V1 surface.

### 3.0 Operator HOME

| Field | Finding |
|---|---|
| **Routes** | `(app)/app/page.tsx` (1). `features/home/*` components incl. `HomeAiCopilotPrioritiesCard`. |
| **Purpose** | Daily operating cockpit — priorities, arrears, cert expiries, jobs. |
| **Actual user** | Operator. **Commercial: HIGH. USP: HIGH** (compliance + AI priorities). Layer A. |
| **Bloat** | Risk of surfacing marketplace/customer KPIs that are flag-off. |
| **Missing** | Renters' Rights Act / cert-expiry alert strip front-and-centre. |
| **Disposition** | **KEEP + IMPROVE (A)** — make it the compliance-anxiety relief surface. |
| **Tests** | Home renders with empty + seeded workspace; AI card hidden without `aiCopilot`. |
| **FINAL** | KEEP/IMPROVE (A). |

### 3.1 Portfolio / Properties / Units / Tenancies

| Field | Finding |
|---|---|
| **Routes** | `portfolio/*` = **25**: `properties`(+new/[id]/edit/hmo{,/rooms,/utilities,/analytics}), `units`(+new/[id]/edit), `tenancies`(+new/[id]/edit), `leasing/*`(agreements, prospects, vacancies, viewings), `gallery`, `map`, `timeline`. Note duplicate `portfolio/tenancies` vs root mention. |
| **Purpose** | Core asset + occupancy model. |
| **Actual user** | Operator. **Commercial HIGH, USP HIGH (HMO depth), Frequency HIGH.** Layer A. |
| **Bloat** | `gallery`, `map`, `timeline` are alternate *views* — should be toggles on Portfolio, not 3 routes. `leasing/*` (5) overlaps Bookings/Listings (let vs short-let). |
| **Duplications** | `portfolio/leasing/viewings` vs `customer/lets/viewings`; `portfolio/map` vs `portfolio` map toggle. |
| **Missing essentials** | Unit-level compliance rollup; tenancy → arrears → cert linkage on the property hero. |
| **KEEP (A)** | properties, units, tenancies (+CRUD), HMO subtree (USP). |
| **MERGE** | `gallery`/`map`/`timeline` → view toggles on `portfolio`. Fold `leasing` into Tenancies (long-let) and gate short-let pieces with `bookingManagement`. |
| **Route architecture after trim** | ~16 (from 25). |
| **Navigation** | One sidebar item **Portfolio** with tabs: Properties · Units · Tenancies · Leasing · Map. |
| **DB/schema** | `properties`, `units`, `tenancies`, `hmo_*`; confirm RLS workspace scoping. |
| **UI** | Entity hero + linked compliance/money tabs. |
| **Tests** | CRUD each entity; HMO room/utility flows; RLS isolation. |
| **FINAL** | KEEP core (A); MERGE 3 view routes + leasing. |

### 3.2 Work / Tasks / Jobs / Maintenance / PPM

| Field | Finding |
|---|---|
| **Routes** | `work/*` = **26**: `tasks`(+new/[id]), `jobs`(+new/[id]), `board`, `calendar`, `gantt`, `complaints`, `ppm`(+overview/timeline/schedules{,/new}/[id]), `reports`, `suppliers`(+preferred/[id]), `orders`(+[orderId]/escrow/quotes), `marketplace`. |
| **Purpose** | Maintenance + task operations (a core wedge pain). |
| **Actual user** | Operator. **Commercial HIGH, USP MED-HIGH, Frequency HIGH.** Layer A. |
| **Bloat** | `board`, `calendar`, `gantt` are **view duplicates** of one work list. `work/marketplace` + `work/orders/escrow|quotes` = marketplace (D) bleeding into Work. `work/suppliers` duplicates the top-level Suppliers item. |
| **Duplications** | `work/calendar` vs global `/calendar`; `work/gantt` vs `calendar/gantt`; `work/suppliers` vs `/suppliers` vs `/marketplace/suppliers-hub`. |
| **Missing essentials** | Tenant-reported-issue → job pipeline tied to portal (B). |
| **KEEP (A)** | tasks, jobs, ppm, complaints, reports. |
| **MERGE** | board/calendar/gantt → view toggles on Work. Fold `work/suppliers` into Suppliers. |
| **FLAG (D)** | `work/marketplace`, `work/orders/escrow`, `work/orders/quotes` behind `marketplaceEnabled`. |
| **Route architecture after trim** | ~14 (from 26). |
| **Navigation** | **Work** item; tabs: Tasks · Jobs · PPM · Complaints. View toggle = List/Board/Calendar/Gantt. |
| **DB/schema** | `jobs`, `tasks`, `ppm_schedules`, `work_orders`. |
| **Tests** | Task/job CRUD; PPM schedule generation; portal-issue→job. |
| **FINAL** | KEEP (A); collapse views; flag marketplace bleed. |

### 3.3 Suppliers / Trades (operator-side coordination)

| Field | Finding |
|---|---|
| **Routes** | `suppliers/*` = **4** (`directory`, `compliance`, `performance`) **+** sidebar points "Suppliers" at `marketplace/suppliers-hub` (**D**) **+** `work/suppliers` (3) **+** `network` (2). |
| **Purpose** | Operator coordinates its trades/contractors. Layer B (brief §3). |
| **Actual user** | Operator. **Commercial MED-HIGH, USP MED.** |
| **Bloat** | Sidebar routes "Suppliers" to a **marketplace** hub (D) — wrong layer; should point to operator supplier directory (B). |
| **Duplications** | FOUR supplier surfaces: `/suppliers`, `/work/suppliers`, `/marketplace/suppliers-hub`, `/network`. |
| **Missing essentials** | Preferred-supplier list with rate cards + compliance docs in ONE place. |
| **KEEP (B)** | `suppliers/directory`, `/compliance`, `/performance`. |
| **MERGE** | `work/suppliers/preferred` + `network` → into `/suppliers`. |
| **FLAG (D)** | `marketplace/suppliers-hub` behind `marketplaceSuppliers`; **repoint sidebar to `/suppliers`**. |
| **Route architecture after trim** | ~4 (from ~9 spread). |
| **Navigation** | **Suppliers** → operator directory (B), not marketplace. |
| **DB/schema** | `suppliers`, `supplier_compliance`, `supplier_performance`. |
| **Tests** | Add supplier; attach compliance doc; assign to job. |
| **FINAL** | KEEP operator coordination (B); **repoint nav off marketplace**; merge 4→1. |

### 3.4 Planning engine (THE premium differentiator — Layer C)

| Field | Finding |
|---|---|
| **Routes** | `planning/*` = **43** (largest section): `wizard`(+[draftId]), `profiles`(+[slug] with overview/income-model/cost-drivers/compliance/example-forecast/starter-checklist/risks/ai-questions), `sets`(+[id] with compliance/upfront-costs/conversion + new), `scenarios`, `conversions`, `yield-intelligence`, `activity`. 11 income-model profile types per memory. |
| **Purpose** | Multi-profile deal/profitability analysis (HMO, R2R, SA, student, BRRR, flip…). Brief §2.2: **PROTECT, premium hook.** |
| **Actual user** | Operator/investor evaluating strategy. **Commercial: differentiator. USP: HIGHEST.** Layer C. |
| **Bloat** | 43 routes is heavy; entry point complexity may scare V1 operators. Many `profiles/[slug]/*` subpages = good depth but need a guided wizard front door. |
| **Duplications** | `planning/scenarios` vs `sets/[id]/scenarios` vs `accounting/forecast/scenarios` — three "scenario" notions. |
| **Missing essentials** | Clear premium paywall/entitlement gate; "import my real property → model it" bridge from Portfolio. |
| **KEEP / SPLIT-OUT (C)** | Entire engine — but **price as premium module** and **simplify entry** (one wizard, progressive depth). |
| **MERGE** | Unify scenario surfaces; one `scenarios` concept. |
| **Route architecture after trim** | Keep depth (~35) but front it with a single wizard; gate by entitlement. |
| **Navigation** | **Planning** sidebar item (V1.5), entitlement-gated. |
| **DB/schema** | `planning_*` (profiles, sets, scenarios) — keep. |
| **UI** | Wizard-first; `wizard-preview-panel`; premium styling. |
| **Tests** | Wizard → profile → forecast; entitlement gate blocks on starter plan. |
| **FINAL** | **PROTECT + SPLIT-OUT as premium (C). Do NOT cut.** Simplify entry; gate by `advancedReports`/dedicated entitlement. |

### 3.5 Compliance (USP core — Layer A, advanced → C)

| Field | Finding |
|---|---|
| **Routes** | `compliance/*` = **22**: `certificates`(+new/[id]/edit), `inspections`(+new/[id]/edit), `documents`(+new/[id]), `renewals`, `risk`, `coverage`, `property-coverage`, `evidence`, `reports`, `activity`, `overview`, `settings`, `supplier-docs`. |
| **Purpose** | Cert tracking, HMO, inspections, deposits, evidence/audit trail. **The moat (brief §2.1).** |
| **Actual user** | Operator under compliance anxiety. **Commercial HIGH, USP HIGHEST, Risk HIGH.** Layer A (advanced → C). |
| **Bloat** | `coverage` vs `property-coverage` = duplicate. `overview` vs `page.tsx` root = duplicate landing. |
| **Duplications** | `compliance/coverage` ↔ `compliance/property-coverage`; `compliance/documents` ↔ global Documents; `compliance/supplier-docs` ↔ `suppliers/compliance`. |
| **Missing essentials** | RRA-2026 readiness dashboard linked to Legal; auto-renewal reminders → Calendar/Notifications. |
| **KEEP (A)** | certificates, inspections, renewals, evidence, reports, risk. |
| **MERGE** | `coverage`+`property-coverage` → one Coverage tab; `overview`→root. |
| **GATE → C** | `risk` scoring + advanced reports as premium. |
| **Route architecture after trim** | ~16 (from 22). |
| **Navigation** | **Compliance** item; tabs: Certificates · Inspections · Renewals · Coverage · Evidence · Risk(premium). |
| **DB/schema** | `compliance_certificates`, `inspections`, `compliance_evidence`. |
| **Tests** | Cert expiry → renewal → reminder; evidence upload + audit log. |
| **FINAL** | KEEP (A) — protect the moat; merge dup coverage; gate risk/advanced (C). |

### 3.6 Legal (possession / RRA-2026 / HMO licences — Layer A/C)

| Field | Finding |
|---|---|
| **Routes** | `legal/*` = **13**: `possession`(+[caseId] + multi-step `new/{select-tenancy,select-grounds,review-evidence,record-service,notice-preview}`), `hmo-licences`(+[licenceId]), `rra-2026`, `epc-advisory`. |
| **Purpose** | Possession workflow (RRA-2026), HMO licensing. **USP moat (brief §2.1).** |
| **Actual user** | Operator/agent facing legal action. **Commercial HIGH, USP HIGHEST.** Layer A core, advanced → C. |
| **Bloat** | Low — this is genuine depth. Possession wizard (6 steps) is appropriate. |
| **Duplications** | `legal/possession/new/select-tenancy` exists twice in tree [VERIFY]; align with `compliance`. |
| **Missing essentials** | Section 8/21 ground templates kept current with RRA-2026; e-service evidence trail. |
| **KEEP (A)** | possession, hmo-licences, rra-2026. |
| **GATE → C** | Advanced possession automation / document generation as premium. |
| **Route architecture after trim** | ~12 (keep). |
| **Navigation** | **Legal** item (V1 core); advanced gated. |
| **DB/schema** | `possession_cases`, `hmo_licences`, evidence linkage. |
| **Tests** | Full possession wizard → notice preview → record service; licence expiry alert. |
| **FINAL** | KEEP (A) — moat; gate advanced (C). `legal-no-lying-claims` review on copy. |

### 3.7 Money (Layer A — rent, arrears, invoices, deposits, payouts)

| Field | Finding |
|---|---|
| **Routes** | `money/*` = **29**: `income`, `expenses`, `arrears`, `rent-chase`, `invoices`(+new/[id]/edit), `bills`(+new/[id]/edit), `deposits`, `commissions`, `fee-rules`, `owner statements`[VERIFY], `payouts`, `refunds`, `disputes`(+[id]), `escrow`(+[escrowId]/[view]), `holds`, `fx`, `supplier-payments`, `stripe`, `affiliate`, `activity`. |
| **Purpose** | Operator cash operations (a core wedge pain: arrears chasing). |
| **Actual user** | Operator. **Commercial HIGH, USP MED, Frequency HIGH.** Layer A. |
| **Bloat** | `escrow`, `holds`, `disputes`, `refunds`, `fx` are **marketplace-payment (D)** concerns inside operator Money. `commissions`/`fee-rules` = agency/marketplace monetisation (D). |
| **Duplications** | `money/affiliate` ↔ `/affiliates` section; `money/disputes` ↔ `bookings/disputes` ↔ `customer/bookings/disputes`; `money/supplier-payments` ↔ portal supplier payments. |
| **Missing essentials** | Owner statements as first-class (brief lists as A); MTD-friendly export (without full GL). |
| **KEEP (A)** | income, expenses, arrears, rent-chase, invoices, bills, deposits, owner-statements, payouts. |
| **FLAG (D)** | escrow, holds, fx, money/disputes, refunds (marketplace), commissions, fee-rules → `marketplacePayments`/`marketplaceEscrow`. |
| **MERGE** | `money/affiliate`→ Affiliates; one disputes surface. |
| **Route architecture after trim** | ~14 visible (from 29). |
| **Navigation** | **Money** item; tabs: Rent & Arrears · Invoices · Bills · Expenses · Deposits · Owner statements. |
| **DB/schema** | `invoices`, `bills`, `arrears`, `deposits`, `owner_statements`. |
| **Tests** | Invoice→payment→arrears; deposit protection; owner statement generation. |
| **FINAL** | KEEP operator money (A); **FLAG-OFF the ~10 marketplace-payment routes (D)**. |

### 3.8 Accounting (full double-entry GL — Layer D, HIDE+FLAG)

| Field | Finding |
|---|---|
| **Routes** | `accounting/*` = **22**: `ledger`(+journal{,/new}/trial-balance/chart/accounts/[id]), `accounts`(+overview/journal-ledger/new/[id]), `reconciliation`(+manual-transaction/new), `mtd`, `forecast`(+scenarios/new), `owner-statements`, `client-accounts`(+disbursements/new), `reports`(+generate). |
| **Purpose** | In-app double-entry ERP (journal, trial balance, chart, MTD). |
| **Actual user** | Bookkeeper/agency finance — **not the V1 ICP buying trigger.** |
| **Commercial value** | LOW for V1 wedge; HIGH support-burden + scope risk. |
| **USP value** | NEGATIVE — competes with Xero/QuickBooks; brief §3 says **position as integration, not in-app ERP**. |
| **Bloat** | Entire double-entry GL (22 routes) is brief-designated **D / HIDE+FLAG**. |
| **Duplications** | `accounting/owner-statements` ↔ `money/owner-statements`; `accounting/forecast/scenarios` ↔ `planning/scenarios`; `accounting/reports` ↔ `money/activity`+`compliance/reports`. |
| **Missing essentials** | (V2) actual Xero/QuickBooks connector. |
| **HIDE+FLAG (D)** | Full GL: ledger, journal, trial-balance, chart, mtd, reconciliation, client-accounts, forecast. |
| **KEEP (A, move to Money)** | `owner-statements` (consolidate into Money). |
| **DEFER → integration** | Replace in-app GL with **"Connect Xero/QuickBooks"** card. |
| **Route architecture after trim** | 0 visible (flag-off); 1 integration settings card. |
| **Navigation** | **Remove "Accounting" from FINANCE group.** |
| **DB/schema** | GL tables remain dormant. |
| **Tests** | Assert `/app/accounting/*` redirects/404 in V1; integration card renders. |
| **FINAL** | **HIDE+FLAG entire GL (D).** Move owner-statements to Money. Reposition as integration. |

### 3.9 Calendar (Layer A — but MERGE views)

| Field | Finding |
|---|---|
| **Routes** | `calendar/*` = **21**: `month`, `week`, `day`, `agenda`, `gantt`, `timeline`, `schedule` **AND a duplicate `views/{month,week,day,agenda,gantt,page}`**, plus `events`(+new/[id]/edit), `reminders`(+new), `settings`. |
| **Purpose** | Unified schedule (jobs, inspections, cert expiries, tenancies). |
| **Actual user** | Operator. **Commercial MED, USP LOW, Frequency MED.** Layer A. |
| **Bloat** | **SEVERE** — view-as-route antipattern: month/week/day/agenda/gantt exist **twice** (top-level + under `views/`). Brief §3 explicitly: "**MERGE views to toggles (not N routes)**". |
| **Duplications** | `calendar/{view}` ↔ `calendar/views/{view}`; `calendar/gantt` ↔ `work/gantt`; `calendar/timeline` ↔ `portfolio/timeline`. |
| **Missing essentials** | Cert-expiry + arrears + tenancy-end auto-feed into one calendar. |
| **KEEP (A)** | One `calendar` route + `events` + `reminders` + `settings`. |
| **MERGE/CUT** | Collapse all 12 view routes → in-page toggle (Month/Week/Day/Agenda/Gantt). Delete `views/*` duplicate tree. |
| **Route architecture after trim** | ~5 (from 21). |
| **Navigation** | **Calendar** item; view toggle component. |
| **DB/schema** | `calendar_events`, `reminders`; feed compliance/work. |
| **Tests** | View toggle preserves state in URL (`view-state-url-sync`); event CRUD. |
| **FINAL** | KEEP (A) but **MERGE 12 view routes → 1 with toggles**; delete duplicate `views/` tree. |

### 3.10 Contacts (Layer A — simplify)

| Field | Finding |
|---|---|
| **Routes** | `contacts/*` = **14**: `people`, `organisations`, `guests`, `board`, `map`, `timeline`, `activity`, `documents`, `messages`, `portal-access`, `new`, `[id]`(+edit). |
| **Purpose** | People/org CRM (tenants, landlords, contractors, guests). |
| **Actual user** | Operator. **Commercial MED, USP LOW, Frequency MED.** Layer A (simplify per brief §3). |
| **Bloat** | `board`, `map`, `timeline`, `activity` = view duplicates. `guests` = marketplace/booking (D). `messages` ↔ global Messages; `documents` ↔ global Documents; `portal-access` ↔ Portals section. |
| **Duplications** | `contacts/messages`/`contacts/documents`/`contacts/portal-access` all duplicate dedicated sections. |
| **KEEP (A)** | `people`, `organisations`, `[id]`(+edit), `new`. |
| **MERGE** | board/map/timeline/activity → contact list toggles + detail tabs. Fold messages/documents/portal-access into the contact **detail** (linked-records), not separate routes. |
| **FLAG (D)** | `guests` behind `bookingManagement`/`marketplaceStays`. |
| **Route architecture after trim** | ~5 (from 14). |
| **Navigation** | **Contacts** item; tabs People · Organisations. |
| **DB/schema** | `contacts`, `organisations`. |
| **Tests** | Contact CRUD; detail tabs lazy-load (`detail-page-subtab-loading`). |
| **FINAL** | KEEP (A); collapse views; fold cross-section dups into detail tabs; flag guests. |

### 3.11 Bookings & Listings (direct-let ops — Layer B/C, gated)

| Field | Finding |
|---|---|
| **Routes** | `bookings/*` = **15** (`listings`+channels, `reservations`, `calendar`, `disputes/[disputeId]/*` 7-step, `[id]`); `listings/*` = **13** (multi-step `new/*` + `[listingId]/edit/*` wizards). Both are **separate sidebar items**. |
| **Purpose** | Direct-let / short-let / serviced-accommodation operations. Brief §3: B/C, V1.5, **gated**. |
| **Actual user** | Operator running SA/short-let — a *subset* of ICP. |
| **Commercial value** | MED (SA exposure in ICP) but pre-liquidity for channels. |
| **USP value** | Planning covers SA strategy (C); operational booking is secondary. |
| **Bloat** | Two sidebar items (Bookings + Listings) for one concept. `bookings/disputes` (7 routes) = marketplace dispute machinery (D). `listings` wizard duplicates `listings/[listingId]/edit` wizard (12 of 13 are wizard steps). |
| **Duplications** | `bookings/calendar` ↔ global Calendar; `bookings/listings` ↔ `listings` ↔ `marketplace/my-listings`; `bookings/disputes` ↔ `money/disputes` ↔ `customer/bookings/disputes`. |
| **MERGE** | Bookings + Listings → **one "Bookings" item** with Listings as a tab. |
| **FLAG (B/C)** | Behind `bookingManagement` + `directBookingPages`. |
| **FLAG (D)** | `bookings/disputes/*`, `listings/[id]/channels` → `marketplaceDisputes`/channel flags. |
| **Route architecture after trim** | ~8 (from 28), flag-gated. |
| **Navigation** | **Not in V1 default nav**; appears when `bookingManagement` ON (V1.5). |
| **DB/schema** | `listings`, `reservations`, `channels`. |
| **Tests** | Listing wizard; reservation; assert hidden when flag off. |
| **FINAL** | **MERGE Bookings+Listings → 1 item; FLAG (B/C); flag disputes/channels (D).** Remove both from V1 default sidebar. |

### 3.12 Automations (Layer C-lite KEEP small / D HIDE canvas)

| Field | Finding |
|---|---|
| **Routes** | `automations/*` = **20**: `recipes`, `templates`, `approvals`, `my-automations`, `home`, `runs`(+[id]), `runs-logs`, `errors`, **`canvas`(+[automationId])**, **`builder`**, **`ai-builder`**, **`webhooks`**, **`integrations`**, **`usage`**, **`usage-limits`**, **`admin-controls`**, `settings`. |
| **Purpose** | Workflow automation. Brief §3: C-lite (recipes/approvals) KEEP small via `canvasLite`; full canvas/webhooks/usage = **D HIDE+FLAG (Zapier-clone scope)**. |
| **Actual user** | Operator wanting "remind on cert expiry" presets. **Commercial MED, USP LOW.** |
| **Bloat** | Full builder/canvas/webhooks/integrations/usage-marketplace = D Zapier-clone. ~13 of 20 routes are D. |
| **Duplications** | `runs` ↔ `runs-logs`; `builder` ↔ `canvas` ↔ `ai-builder`; `usage` ↔ `usage-limits`. |
| **KEEP (C-lite)** | `recipes`, `templates`, `approvals`, `my-automations`, `runs`, `settings` (under `canvasLite`). |
| **HIDE+FLAG (D)** | `canvas`, `builder`, `ai-builder`, `webhooks`, `integrations`, `usage`, `usage-limits`, `admin-controls`, `errors`, `runs-logs`. |
| **MERGE** | `runs`+`runs-logs`; `usage`+`usage-limits`. |
| **Route architecture after trim** | ~6 visible (C-lite); rest flag-off. |
| **Navigation** | **Automations** appears V1.5 (`canvasLite`); not V1 default. |
| **DB/schema** | `automation_recipes`, `automation_runs`. |
| **Tests** | Recipe enable → run logged; canvas hidden when flag off. |
| **FINAL** | **KEEP recipes/approvals (C-lite, `canvasLite`); HIDE+FLAG canvas+webhooks (D).** |

### 3.13 Portals (operator-side management of tenant/landlord/supplier access)

| Field | Finding |
|---|---|
| **Routes** | `portals/*` = **5**: `page`, `access`(+[id]), `profiles`, `purposes`. |
| **Purpose** | Operator issues/manages portal access links. Retention fabric. Layer B. |
| **Actual user** | Operator. **Commercial HIGH (retention), USP MED.** |
| **Bloat** | Low. |
| **Duplications** | `contacts/portal-access` duplicates this. |
| **KEEP (B)** | All 5. |
| **MERGE** | Fold `contacts/portal-access` here. |
| **DB/schema** | `portal_sessions`, `portal_access`. |
| **Tests** | Issue link → expiry → revoke. |
| **FINAL** | KEEP (B). |

### 3.14 Messages / Inbox (Layer A)

| Field | Finding |
|---|---|
| **Routes** | `messages/*` = **2**. Plus per-section message dups (`contacts/messages`, portal messages). |
| **Purpose** | Operator messaging across tenants/landlords/suppliers. Layer A. |
| **Commercial** | HIGH (retention). **USP MED.** |
| **Duplications** | `contacts/messages`, supplier/customer/portal message surfaces — many. Memory: `src/lib/portal/messaging.ts` is the schema-correct data layer. |
| **KEEP (A)** | `/messages` as the single operator inbox. |
| **MERGE** | Route all section message links into `/messages` threads. |
| **DB/schema** | Use `src/lib/portal/messaging.ts` (per memory). |
| **Tests** | Send/receive across persona threads. |
| **FINAL** | KEEP (A); consolidate scattered message routes. |

### 3.15 Affiliates (Layer B/C, payouts flag OFF)

| Field | Finding |
|---|---|
| **Routes** | `affiliates/*` = **5**. Plus `money/affiliate`, `account` affiliate, supplier/customer affiliate trees (memory: two enrolment doors, one ledger). |
| **Purpose** | Referral programme. Layer B/C (brief §3), payouts flagged OFF. |
| **Commercial** | MED (growth loop). |
| **Duplications** | `affiliates` ↔ `money/affiliate`; supplier `/affiliate/*` (5) + customer `/affiliate/*` (5) mirror it. |
| **KEEP (B/C)** | Operator `affiliates`. **Payouts flag OFF.** |
| **MERGE** | Single affiliate ledger (memory); dedupe `money/affiliate`. |
| **FINAL** | KEEP (B/C), payouts OFF; dedupe. |

### 3.16 Workspace settings (Layer A — MERGE 45→tabs)

| Field | Finding |
|---|---|
| **Routes** | `workspace-settings/*` = **24**: profile, team, roles, branding, white-label, billing, subscription, invoices, addons, security, sso, audit, data, demo-data, storage, notifications, email, integrations, ai, copilot-inbox, jurisdiction, navigation, danger-zone. Plus `workspace/*` (8), `settings/*` (3), `account/*` (10) elsewhere. |
| **Purpose** | Workspace admin. Brief §3/§4: **MERGE ~45 settings routes → clean tabbed structure (≤8)**. |
| **Actual user** | Operator admin. **Commercial MED, USP LOW.** Layer A. |
| **Bloat** | **SEVERE fragmentation** — settings split across `workspace-settings/*`, `workspace/*`, `settings/*`. `white-label`+`branding` dup; `billing`+`subscription`+`invoices`+`addons` should be one Billing tab; `copilot-inbox` belongs to AI. |
| **Duplications** | `workspace-settings/billing` ↔ sidebar `workspace/billing` ↔ `workspace-settings/subscription`/`invoices`/`addons`. `branding`↔`white-label`. |
| **MERGE** | Into ≤8 tabbed groups: **General**(profile/jurisdiction/branding) · **Team & Roles** · **Billing**(subscription/invoices/addons) · **Security**(sso/audit/sessions) · **Data**(storage/data/demo-data/danger-zone) · **Notifications & Email** · **AI**(ai/copilot-inbox) · **Integrations**. |
| **Route architecture after trim** | ~8 tab routes (from 24+8+3). |
| **Navigation** | One **Settings** entry; remove separate Billing sidebar item (fold into Settings or keep one). |
| **DB/schema** | `workspace_settings`, `roles`, `subscriptions`. |
| **Tests** | Each settings tab saves; role gating. |
| **FINAL** | KEEP (A) but **MERGE 35 routes → 8 tabs**. |

### 3.17 Account settings (Layer A)

| Field | Finding |
|---|---|
| **Routes** | `account/*` = **10**: profile, security, sessions, login, notifications, preferences, connected-accounts, data-privacy, activity. Plus `account-settings` (1). |
| **Purpose** | Per-user account. Layer A. |
| **Duplications** | `account/login` ↔ auth; `account-settings` ↔ `account`; `account/notifications` ↔ workspace notifications. |
| **MERGE** | Collapse to ~5 tabs: Profile · Security & Sessions · Notifications · Privacy · Connected accounts. |
| **FINAL** | KEEP (A); merge to tabbed account. |

### 3.18 AI Copilot (Layer C — gate by `aiCopilot`)

| Field | Finding |
|---|---|
| **Routes** | **No dedicated page route** — it's a **panel** (`src/features/copilot/*`: PanelShell, ChatScreen, InboxScreen, ComplianceResultCard, DraftMessageCard, SlashCommandPalette). Admin surface `workspace-settings/copilot-inbox` (1). Admin: `ai-models`, `ai-usage`. |
| **Purpose** | AI-assisted operations + compliance answers + draft messages. Brief §2.4/§3: Layer C, gate by `aiCopilot` entitlement. |
| **Actual user** | Operator (premium). **Commercial HIGH (upsell), USP HIGH.** |
| **Bloat** | Low — panel architecture is correct (no route bloat). |
| **Missing essentials** | Citation chips on compliance answers (`ai-citation-chip-system`); cost-control surfacing; clear disclaimer (`ai-disclaimer-ui`). |
| **KEEP (C)** | Copilot panel; gate by `aiCopilot` entitlement (`src/lib/billing/entitlements.ts`). |
| **DB/schema** | `ai_conversations`, `ai_usage`, `ai_models`. |
| **Tests** | Copilot hidden without entitlement; compliance answer renders citations; usage metered. |
| **FINAL** | KEEP (C), entitlement-gated. Add citations + disclaimer + cost meter. |

### 3.19 Search & Notifications (Layer A — chrome)

| Field | Finding |
|---|---|
| **Routes** | No dedicated routes — components: `shell/GlobalSearch.tsx`, `search/CommandPalette.tsx`, `supplier-workspace/SupplierGlobalSearch.tsx`; notifications are a bell + `account/notifications`, `customer/notifications` (1). |
| **Purpose** | Cross-workspace search + alerting. Layer A chrome. |
| **Duplications** | Two search components (operator + supplier) — acceptable (separate shells) but could share core. |
| **Missing essentials** | Notification centre with cert-expiry/arrears/job alerts (`notification-centre-design`). |
| **KEEP (A)** | Command palette + global search + notification bell. |
| **FINAL** | KEEP (A); unify search core; build notification centre feeding compliance/money alerts. |

---

# PART 4 — PORTALS (Layer B — retention fabric)

> **CONTRADICTION #2 / biggest duplication in the codebase.** There are **TWO
> parallel portal implementations**: (a) standalone `(tenant)/tenant-portal` (8),
> `(landlord)/landlord-portal` (8), `(supplier)/supplier-portal` (7) = 23 routes;
> and (b) session-based `(portal)/portal/[sessionId]/{tenant,landlord,supplier}`
> (35 routes). They cover the same tenant/landlord/supplier portal surface twice.

## 4.1 Tenant portal

| Field | Finding |
|---|---|
| **Routes** | Standalone `(tenant)/tenant-portal/*` = **8** (tenancy, rent, maintenance, messages, documents, viewings, settings). Session `(portal)/portal/[sessionId]/tenant/*` = **9** (tenancy, payments+[id], maintenance+report+[id], messages, documents). |
| **Purpose** | Tenant self-service (pay rent, report issues, view docs). Layer B. |
| **Actual user** | Tenant. **Commercial HIGH (retention/extends operator workflow), USP MED.** |
| **Bloat** | The **duplicate implementation** itself. |
| **Duplications** | Entire standalone ↔ session portal. |
| **KEEP (B)** | **ONE** implementation. Session-based `(portal)/portal/[sessionId]/*` is the richer + access-controlled model (memory: `portal_sessions`); make it canonical. |
| **CUT** | Standalone `(tenant)/tenant-portal/*` (8) — **archive after confirming no auth path depends on it** [VERIFY proxy routing]. |
| **Route architecture after trim** | ~9 (session) for tenant. |
| **DB/schema** | `portal_sessions`, `tenancies`, `maintenance_requests`. |
| **Tests** | Tenant pays rent; reports issue → operator Work job; doc access RLS. |
| **FINAL** | KEEP session portal (B); **CUT standalone duplicate.** |

## 4.2 Landlord portal

| Field | Finding |
|---|---|
| **Routes** | Standalone `(landlord)/landlord-portal/*` = **8**; session `(portal)/portal/[sessionId]/landlord/*` = **10** (properties+[id], financials, maintenance+[id], messages, payments+[id], documents). |
| **Purpose** | Landlord owner-view (statements, maintenance approvals). Layer B. |
| **Commercial** | HIGH (agency retention). **USP MED.** |
| **Duplications** | Standalone ↔ session (same as tenant). |
| **KEEP (B)** | Session portal. **CUT** standalone (8). |
| **FINAL** | KEEP session (B); CUT standalone duplicate. |

## 4.3 Supplier portal (operator-coordinated, Layer B)

| Field | Finding |
|---|---|
| **Routes** | Standalone `(supplier)/supplier-portal/*` = **7**; session `(portal)/portal/[sessionId]/supplier/*` = **9** (jobs+[id], invoices+[id], payments+[id], documents+[id], messages). |
| **Purpose** | Supplier receives jobs, submits invoices **via operator's workflow**. Brief §3: in V1 suppliers act via **portal + operator coordination** (B), NOT the independent SaaS. |
| **Commercial** | HIGH (closes the maintenance loop). **USP MED.** |
| **Duplications** | Standalone ↔ session. |
| **KEEP (B)** | Session supplier portal. **CUT** standalone (7). |
| **FINAL** | KEEP session (B); CUT standalone duplicate. This is the V1 supplier experience — not `(supplier-workspace)`. |

## 4.4 Portal shared login / state

| Field | Finding |
|---|---|
| **Routes** | `(portal)/portal/{login,expired,revoked,page,[sessionId]}` (5 chrome). |
| **KEEP (B)** | All — clean access/expiry model. |
| **FINAL** | KEEP (B). |

---

# PART 5 — INDEPENDENT SUPPLIER WORKSPACE (Layer D/C — TRIM HARD)

| Field | Finding |
|---|---|
| **Routes** | `(supplier-workspace)/supplier/*` = **124** (grew from brief's 112). Nav (`supplier-workspace/nav.ts`) = 7 groups solo/team. Sub-trees: `accounting` (full GL mirror ~22), `automations` (canvas mirror), `affiliate` (5), `finance`, `requests`, `jobs`, `services`, `calendar`/`schedule`, `messages`/`inbox`, `compliance`, `reputation`, `insights`, `profile`, `account`, `settings`. |
| **Purpose** | Supplier-as-SaaS standalone product. Brief §3: **D/C, V2, TRIM hard.** "Mirrored accounting / automations / calendar = CUT from supplier." |
| **Actual user** | Independent trade business — **NOT the V1 buyer.** |
| **Commercial value** | V1: ZERO (second cold-start). V2: real (supplier monetised via paid add-ons per brief §6). |
| **USP value** | None for the operator wedge. |
| **Bloat** | **MASSIVE** — 124 routes mirror the entire operator app (its own GL, automations canvas, calendar, accounting) for a flagged-off persona. This is the single largest bloat concentration after marketplace. |
| **Duplications** | `supplier/accounting/*` mirrors operator `accounting/*` (both D GL); `supplier/automations/*` mirrors operator automations canvas; `supplier/messages`+`supplier/inbox` (nav.ts admits this dup); `supplier/calendar`+`supplier/schedule` (nav admits dup). |
| **Missing essentials** | (V2) the supplier add-on monetisation surfaces (promoted ranking, emergency availability) — these are the actual revenue model. |
| **KEEP-CODE / FLAG (D)** | Whole workspace behind `supplierWorkspace` (OFF in V1). |
| **CUT (per brief)** | From the supplier workspace: **mirrored accounting GL, automations canvas, mirrored calendar** — suppliers don't need their own ERP. Even in V2, trim to: Requests · Jobs · Schedule · Finance(basic) · Profile · Compliance · Reputation. |
| **MERGE** | `messages`+`inbox` → Messages; `calendar`+`schedule` → Schedule (nav.ts already flags these). |
| **Route architecture after trim** | V1: 0 visible. V2 target: **~40** (from 124) after cutting GL/automations/mirror-calendar. |
| **Navigation** | None in V1; `supplier-workspace/nav.ts` is correct shape for V2. |
| **DB/schema** | Supplier `supplier_*` backend deferred (memory). |
| **Tests** | Assert `/supplier/*` unreachable when `supplierWorkspace` OFF. |
| **FINAL** | **FLAG-OFF (D); in V2 TRIM ~124→~40** (cut accounting GL, automations canvas, mirrored calendar; merge messages/inbox + calendar/schedule). The V1 supplier experience is the **portal (B)**, not this. |

---

# PART 6 — CUSTOMER / GUEST WORKSPACE (Layer D — HIDE)

| Field | Finding |
|---|---|
| **Routes** | `(customer)/customer/*` = **46**: `home`, `stays`(+long-term/map/[slug]), `lets`(+search/properties/offers/applications/viewings/tenancies with move-in/setup/rent-payments/documents/maintenance), `bookings`(+modify/dispute/report-issue/completed/disputes), `maintenance`, `messages`, `payments`, `orders`, `favourites`/`saved`, `reviews`, `affiliate`(5), `notifications`, `profile`, `account-settings`, `search`, `help`. |
| **Purpose** | Consumer/guest workspace (book stays, rent a let, dispute). Brief §3: **D, V2, HIDE (`customerWorkspace` OFF).** |
| **Actual user** | End consumer — **NOT V1 buyer.** |
| **Commercial value** | V1: ZERO. V2: depends on marketplace liquidity. |
| **USP value** | None for the wedge. |
| **Bloat** | All 46 (flag-off). `customer/lets/*` overlaps tenant portal (B); `customer/affiliate/*` (5) mirrors affiliate ledger; `customer/stays` overlaps `(public-booking)` + `marketplace/stays`. |
| **Duplications** | `customer/lets/tenancies/[id]/maintenance` ↔ tenant portal maintenance; `customer/stays` ↔ public booking ↔ marketplace stays; `customer/disputes` ↔ booking disputes ↔ money disputes. |
| **KEEP-CODE / HIDE (D)** | All behind `customerWorkspace`. |
| **DEFER** | Entire surface to V2; tie to marketplace liquidity. |
| **Route architecture after trim** | 0 visible in V1. |
| **Navigation** | Customer hidden from persona switcher (memory). |
| **DB/schema** | `customer_*`/`let_*` migration `20260617230000` **written but NOT applied** (memory) — keep unapplied in V1. |
| **Tests** | Assert `/customer/*` unreachable with flag OFF; migration not applied in V1 env. |
| **FINAL** | **HIDE (D), `customerWorkspace` OFF.** Keep code; defer migration. |

---

# PART 7 — INTERNAL CONTROL PLANE (Layer Ops)

## 7.1 Platform Admin

| Field | Finding |
|---|---|
| **Routes** | `(admin)/admin/*` = **52**: users, workspaces, subscriptions(+[id]), stripe-events, ai-models, ai-usage, audit, security, health, maintenance, announcements(+bar), changelog, bugs, data-requests, cron, **marketplace (9 sub: moderation/disputes/payouts/transactions/suppliers/stays…)**, supplier-verification(+[id]), suppliers, risk, affiliates, portfolios, work, planning, portals, documents, customers, stays, bookings, global (3), settings. `(admin-auth)/admin-login` (1). |
| **Purpose** | Genuine control plane (brief §6 "keep"). Layer Ops — **internal, not customer nav.** |
| **Actual user** | Platform operators (you). **Commercial: enabling. USP: N/A.** |
| **Bloat** | Admin **marketplace/stays/bookings/customers** moderation surfaces (≈13) are for flagged-off D layers — fine to keep dormant, but should be **flag-gated to appear only when the corresponding feature flag is ON** (don't show marketplace-moderation when `marketplaceEnabled=false`). |
| **Duplications** | Low — admin is appropriately distinct. |
| **Missing essentials** | Feature-flag console wired to `platform_feature_flags` (admin-feature-flags-ui) — **this is the lever for the whole staging plan.** [VERIFY it exists]. |
| **KEEP (Ops)** | All core: users, workspaces, subscriptions, stripe-events, ai-*, audit, security, health, maintenance, announcements, changelog, bugs, data-requests, cron, risk, supplier-verification, affiliates. |
| **FLAG (Ops)** | Marketplace/stays/bookings/customer moderation panels — show only when feature flag ON. |
| **Route architecture after trim** | ~52 (keep all; conditionally render ~13). |
| **Navigation** | `AdminShell` — never in customer nav (brief §6). MFA-gate (`admin-mfa-otp-gate`). |
| **DB/schema** | `platform_feature_flags`, `audit_log`, `subscriptions`. |
| **Tests** | Admin-only RBAC; flag console toggles surface visibility; MFA gate. |
| **FINAL** | **KEEP entire control plane (Ops).** Conditionally render D-layer moderation by flag. Ensure feature-flag console exists. |

---

# PART 8 — CROSS-CUTTING SURFACES

## 8.1 Support / Help / Tutorials

| Field | Finding |
|---|---|
| **Routes** | `/help` (marketing), `/app/help`, `/customer/help`, `/supplier/help`, `/faq`. Guided-help engine (memory: `src/guided-help`, mounted in AppShell, `guided_help_state` table, 42P01-safe). |
| **Purpose** | Onboarding + in-context help. Layer A. |
| **Bloat** | Four help routes. |
| **Duplications** | `/help` ×4 across personas. |
| **KEEP (A)** | Operator `/app/help` + guided-help engine + `/faq`. |
| **MERGE** | One help content source; persona helps deep-link. Customer/supplier helps flag-gated. |
| **FINAL** | KEEP guided-help (A); consolidate help routes. |

## 8.2 API / Edge

| Field | Finding |
|---|---|
| **Routes** | **150** Next API routes (`src/app/api/**/route.ts`). **No Supabase edge functions** (brief §6) — "edge" = Next API + server actions. |
| **Purpose** | Server actions, webhooks (Stripe), data ops. |
| **Bloat** | [VERIFY] APIs serving flagged-off D layers (marketplace/customer/supplier-ws) should be gated server-side too, not just UI. |
| **KEEP (A)** | Operator/portal/admin APIs. |
| **FLAG (D)** | Marketplace/customer/supplier-workspace API routes gated by flag at the handler. |
| **Missing essentials** | Server-side flag enforcement so a hidden UI can't be hit via direct API (`direct-url-protection-ui` + handler gate). |
| **Tests** | API contract tests; flag-off APIs return 404/403. |
| **FINAL** | KEEP (A); **gate D-layer APIs server-side** (security, not just nav). |

## 8.3 Supabase schema / RLS (brief only — doc 12 owns depth)

| Field | Finding |
|---|---|
| **Facts** | **433 live tables** (`docs/final-wiring/live-schema.md`). Customer/let migration `20260617230000` written, NOT applied (memory). |
| **Layer note** | A large share of the 433 tables back flagged-off D layers (marketplace/customer/supplier). KEEP dormant; **do not apply the customer/let migration for V1.** |
| **RLS** | Workspace-scoped isolation is the gate (memory: `audit-queries.mjs` = 0). |
| **FINAL** | **Doc 12 owns depth.** For V1: keep schema, hold unapplied migrations, verify RLS on portal-session access. |

## 8.4 Tests / Release gates

| Field | Finding |
|---|---|
| **Facts** | Memory: `npm run build` catches client `useSearchParams` Suspense prerender failures (tsc won't); `audit-queries.mjs` schema gate = 0; MAX-RELEASE trackers in `docs/release` say **NOT release-ready.** |
| **Bloat** | Test effort spread across 725 routes incl. flagged-off surfaces. |
| **KEEP** | Focus V1 gates on the **~225 visible** surface (brief §4): operator core, portals, auth, settings, admin. |
| **Missing essentials** | E2E for: onboarding→first-property→first-cert; possession wizard; portal session; flag-off assertions (every D route unreachable). |
| **FINAL** | Re-scope release gates to V1-visible surface; add flag-off reachability tests as a release gate. |

## 8.5 Documentation

| Field | Finding |
|---|---|
| **Facts** | Rich existing gap material in `docs/Todos_gaps_requirements/{property-manager workspace, supplier_and_supplier_team workspace, Customer workspace, tenant/landlord/supplier portal, ai coilot and chat, automations}` + image manifests + this audit pack. |
| **Bloat** | Docs describe the full multi-sided platform as if V1 — risk of building to docs that contradict the staged verdict. |
| **FINAL** | Reconcile gap docs against this staged plan in `19-founder-decision-lock.md`; mark D-layer gap docs "V2". Status per `_documentation standards.md`. |

---

# PART 9 — REQUIRED V1 NAVIGATION (after trimming)

Brief §4 target = **≤8 sidebar items**, 30-second comprehension, zero ERP jargon.
Current = 17 items across 5 groups. Proposed V1 operator sidebar:

| # | Item | Replaces / absorbs | Layer |
|---|---|---|---|
| 1 | **Home** | Home | A |
| 2 | **Portfolio** | Portfolio + Properties/Units/Tenancies/Leasing + gallery/map/timeline (tabs) | A |
| 3 | **Work** | Work + tasks/jobs/ppm/complaints + board/calendar/gantt (toggles) | A |
| 4 | **Compliance** | Compliance + Legal (Legal as a tab/section) | A (adv→C) |
| 5 | **Money** | Money (minus marketplace-payment routes) + owner-statements | A |
| 6 | **Contacts & Suppliers** | Contacts + Suppliers directory + Portals (portal access) | A/B |
| 7 | **Messages** | Messages (single inbox) | A |
| 8 | **Settings** | Workspace + Account + Billing (tabbed) | A |

**Premium (V1.5, entitlement/flag-gated, appear when ON):** Planning (C),
AI Copilot panel (C), Automations-lite (C-lite), Bookings (B/C), Affiliates (B/C).

**Removed from V1 default nav:** Bookings, Listings (→merged, flagged),
Accounting (→D/integration), Automations (→V1.5 lite), Affiliate (→V1.5),
marketplace Suppliers hub (→repoint to operator Suppliers).

---

# PART 10 — SUMMARY DISPOSITION TABLE

| Surface | Current routes | Layer | Disposition | V1-visible target |
|---|---:|---|---|---:|
| Public marketing | ~17 | A | KEEP core, FLAG 5 consumer | ~12 |
| Public marketplace/booking | 21 | D | FLAG-OFF; dedupe 3 checkouts | 0 |
| Auth | 9 | A | KEEP; gate supplier onboard | 8 |
| Onboarding | 6 | A/D | KEEP operator; merge+flag supplier | 2 |
| Home | 1 | A | KEEP+IMPROVE | 1 |
| Portfolio | 25 | A | KEEP; merge views+leasing | ~16 |
| Work | 26 | A | KEEP; collapse views; flag marketplace | ~14 |
| Suppliers | ~9 spread | B | MERGE 4→1; repoint nav off marketplace | ~4 |
| Planning | 43 | C | PROTECT + SPLIT-OUT premium; simplify entry | ~35 (V1.5) |
| Compliance | 22 | A | KEEP; merge dup coverage; gate risk | ~16 |
| Legal | 13 | A/C | KEEP; gate advanced | ~12 |
| Money | 29 | A | KEEP; FLAG ~10 marketplace-pay | ~14 |
| Accounting (GL) | 22 | D | HIDE+FLAG; → integration | 0 (+1 card) |
| Calendar | 21 | A | MERGE 12 views→1; del `views/` | ~5 |
| Contacts | 14 | A | KEEP; collapse views; flag guests | ~5 |
| Bookings+Listings | 28 | B/C+D | MERGE→1; FLAG; flag disputes | ~8 (V1.5) |
| Automations | 20 | C-lite/D | KEEP recipes; HIDE canvas | ~6 (V1.5) |
| Portals (operator) | 5 | B | KEEP | 5 |
| Messages | 2 | A | KEEP; consolidate dups | 2 |
| Affiliates | 5 | B/C | KEEP, payouts OFF; dedupe | ~5 (V1.5) |
| Workspace settings | 24+8+3 | A | MERGE 35→8 tabs | ~8 |
| Account | 10+1 | A | MERGE→5 tabs | ~5 |
| AI Copilot | panel | C | KEEP, entitlement-gate | panel (V1.5) |
| Search/Notifications | chrome | A | KEEP; build notif centre | chrome |
| **Tenant portal (standalone)** | 8 | B | **CUT (dup)** | 0 |
| **Landlord portal (standalone)** | 8 | B | **CUT (dup)** | 0 |
| **Supplier portal (standalone)** | 7 | B | **CUT (dup)** | 0 |
| Session portals (all 3) | 35 | B | KEEP (canonical) | ~28 |
| Independent supplier workspace | 124 | D/C | FLAG-OFF; V2 trim →~40 | 0 |
| Customer workspace | 46 | D | HIDE-FLAG; defer migration | 0 |
| Admin control plane | 52 | Ops | KEEP; conditionally render D panels | 52 (internal) |
| API routes | 150 | A/D | KEEP; gate D-layer server-side | — |

**V1-visible operator app target: ~110–130** (brief §4 ✓ achievable by merging
views, flagging Accounting/marketplace/supplier-ws/customer, cutting standalone
portals). **Total V1-visible ≈ 225** (brief §4 ✓).

---

## Appendix — required tests (consolidated release gate)

1. **Flag-off reachability:** every D route (`marketplace*`, `customer/*`,
   `supplier/*` workspace, `accounting/ledger*`, `automations/canvas*`,
   `bookings/disputes*`) returns 404/redirect with its flag OFF — UI **and** API.
2. **Operator golden path E2E:** register → onboard → add property → add cert →
   issue tenant portal link → log a job → invoice.
3. **USP depth E2E:** possession wizard (6 steps) → notice preview; Planning
   wizard → forecast (entitlement-gated).
4. **Portal session E2E:** issue → access → expire → revoke; tenant issue→operator
   Work job.
5. **Settings merge:** all 8 settings tabs save; billing/subscription consolidated.
6. **Dedup regressions:** assert single canonical for messages, disputes,
   affiliates, suppliers, portals.

---

**END — `08-workspace-by-workspace-audit.md`**
