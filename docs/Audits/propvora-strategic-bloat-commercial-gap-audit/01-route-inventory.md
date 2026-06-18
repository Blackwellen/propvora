# 01 — Route Inventory (full enumerated route tree)

**Status:** Draft · 2026-06-18 · conforms to `_shared-strategic-brief.md` (verdict =
staged property OS / Model 2; Layer A/B/C/D map §3; route targets §4; flag registry
`src/lib/flags/registry.ts`).

## How to read this document

- **Real counts (measured this audit):** **725** `page.tsx` files, **150**
  `src/app/api/**/route.ts` files, **1** non-API `route.ts`
  (`src/app/p/[token]/route.ts`). The brief's "~670 non-admin" is the *non-admin
  page* subset; total page files are higher (725) because admin (52) + a denser
  customer/supplier build than the brief estimated. [VERIFY] counts via
  `find src/app -name page.tsx | wc -l` = 725.
- **URL vs file path:** `next.config.ts` rewrites map route-group files to public
  URLs. **`(app)/app/*` → `/property-manager/*`**, **`(customer)/customer/*` →
  `/user/*`** (rewrites `beforeFiles`, lines 108–132). `/app` and `/customer` also
  *redirect* to those public prefixes (lines 77–96). So the operator nav base
  `MANAGER_BASE = "/property-manager"` in `src/components/shell/SideNavigation.tsx`
  is correct; there is **no** `(app)/property-manager` directory.
- **Decision vocabulary:** KEEP · KEEP-SIMPLIFY · MERGE · HIDE/FLAG · DEFER ·
  SPLIT-OUT · REMOVE/ARCHIVE (per brief §5). "FLAG" = move behind an existing
  `src/lib/flags/registry.ts` key (all default OFF).
- **Critical wiring fact (drives doc 17):** the 16-key flag registry exists and is
  well-formed, but **flags are NOT yet consumed by nav or the proxy guard.**
  `SideNavigation.tsx` hardcodes every group (Bookings, Listings, Suppliers,
  Automations…) with no `isFeatureEnabled` check; `src/lib/flags/route-registry.ts`
  is dormant unless `contextEngine` is ON (`src/proxy.ts:188–217`). So today the
  marketplace/customer/supplier surfaces are reachable by URL even though the flags
  read OFF. [VERIFY] grep: `isFeatureEnabled` appears in 0 nav/shell files.
- **Completion / wiring legend:** Full = real data hook + states; Partial = UI built,
  data thin/seeded; Shim = 1-line `export { default } from …` re-export; Stub = scaffold.
- **Supabase tables:** best-effort against `docs/final-wiring/live-schema.md` (433
  tables); marked [VERIFY] where inferred from component names.

---

## A. Public marketing (route group: none / top-level)

URL = file path. Layer: marketing (brief §4: ~15 visible target).

| Path | File | Purpose | User | Comm | USP | Completion | Wiring | Tables | Dup-of | Decision |
|---|---|---|---|---|---|---|---|---|---|---|
| `/` | `src/app/page.tsx` | Homepage / hero | Prospect | H | M | Full | static+forms | newsletter_subscribers [V] | — | KEEP |
| `/about` | `src/app/about/page.tsx` | Company | Prospect | M | L | Full | static | — | — | KEEP |
| `/features` | `src/app/features/page.tsx` | Feature overview | Prospect | H | M | Full | static | — | — | KEEP |
| `/pricing` | `src/app/pricing/page.tsx` | Plans | Prospect | H | M | Full | plans.ts | — | — | KEEP |
| `/contact` | `src/app/contact/page.tsx` | Contact/sales | Prospect | M | L | Full | form | — | — | KEEP |
| `/faq` | `src/app/faq/page.tsx` | FAQ | Prospect | L | L | Full | static | — | — | KEEP |
| `/help` | `src/app/help/page.tsx` | Public help | Prospect | L | L | Full | static | — | `/property-manager/help` | KEEP |
| `/changelog` | `src/app/changelog/page.tsx` | Public changelog | Prospect | L | L | Full | changelog_entries [V] | — | KEEP |
| `/walkthrough` | `src/app/walkthrough/page.tsx` | Product tour | Prospect | M | M | Partial | static | — | — | KEEP |
| `/maintenance` | `src/app/maintenance/page.tsx` | Maintenance mode | All | L | L | Full | flag | — | — | KEEP |
| `/newsletter/confirmed` | `…/newsletter/confirmed/page.tsx` | Double opt-in | Prospect | L | L | Full | newsletter_* | — | KEEP |
| `/newsletter/unsubscribed` | `…/newsletter/unsubscribed/page.tsx` | Unsub state | Prospect | L | L | Full | newsletter_* | — | KEEP |
| `/affiliate-programme` | `…/affiliate-programme/page.tsx` | Affiliate landing | Prospect | M | M | Full | affiliates [V] | — | KEEP |
| `/affiliate-programme/apply` | `…/apply/page.tsx` | Affiliate apply | Prospect | M | M | Full | affiliate_applications [V] | — | KEEP |
| `/affiliate-programme/earnings` | `…/earnings/page.tsx` | Public earnings calc | Prospect | L | M | Partial | calc | — | KEEP-SIMPLIFY |
| `/affiliate-programme/faq` | `…/faq/page.tsx` | Affiliate FAQ | Prospect | L | L | Full | static | — | KEEP |
| `/affiliate-programme/terms` | `…/terms/page.tsx` | Affiliate terms | Prospect | L | L | Full | static | `/legal/affiliate-terms` | MERGE→legal |
| `/sign/[token]` | `src/app/sign/[token]/page.tsx` | E-sign landing | Counterparty | M | M | Partial | esign_* [V] | — | KEEP |

**Subtotal: 18.**

---

## B. Legal / policy pack (route group: none, `/legal/*`)

All static MD-driven pages; entity = Blackwellen Ltd (`src/lib/legal/company.ts`).

| Path | File | Comm | Completion | Bucket | Decision |
|---|---|---|---|---|---|
| `/legal` | `legal/page.tsx` | L | Full | index | KEEP |
| `/legal/terms` | `legal/terms/page.tsx` | M | Full | core | KEEP |
| `/legal/privacy` | `legal/privacy/page.tsx` | M | Full | core | KEEP |
| `/legal/cookies` | `legal/cookies/page.tsx` | L | Full | core | KEEP |
| `/legal/data-processing` | `legal/data-processing/page.tsx` | M | Full | core | KEEP |
| `/legal/acceptable-use` | `legal/acceptable-use/page.tsx` | L | Full | core | KEEP |
| `/legal/ai-disclaimer` | `legal/ai-disclaimer/page.tsx` | L | Full | core | KEEP |
| `/legal/refund-policy` | `legal/refund-policy/page.tsx` | L | Full | core | KEEP |
| `/legal/cancellation-policy` | `legal/cancellation-policy/page.tsx` | L | Full | core | KEEP |
| `/legal/affiliate-terms` | `legal/affiliate-terms/page.tsx` | L | Full | affiliate | KEEP |
| `/legal/marketplace-terms` | `legal/marketplace-terms/page.tsx` | L | Full | **marketplace (V2)** | HIDE/FLAG (`marketplaceEnabled`) |
| `/legal/acceptable-use-marketplace` | `…/page.tsx` | L | Full | marketplace | HIDE/FLAG |
| `/legal/buyer-terms` | `legal/buyer-terms/page.tsx` | L | Full | marketplace | HIDE/FLAG |
| `/legal/seller-agreement` | `legal/seller-agreement/page.tsx` | L | Full | marketplace | HIDE/FLAG |
| `/legal/booking-terms` | `…/page.tsx` | L | Full | **booking (V1.5/V2)** | HIDE/FLAG (`bookingManagement`/`directBookingPages`) |
| `/legal/booking-payment-terms` | `…/page.tsx` | L | Full | booking | HIDE/FLAG |
| `/legal/booking-cancellation-policy` | `…/page.tsx` | L | Full | booking | HIDE/FLAG |
| `/legal/booking-refund-policy` | `…/page.tsx` | L | Full | booking | HIDE/FLAG |
| `/legal/booking-review-policy` | `…/page.tsx` | L | Full | booking | HIDE/FLAG |
| `/legal/booking-ai-disclaimer` | `…/page.tsx` | L | Full | booking | HIDE/FLAG |
| `/legal/direct-booking-terms` | `…/page.tsx` | L | Full | booking | HIDE/FLAG |
| `/legal/channel-sync-disclaimer` | `…/page.tsx` | L | Full | booking/iCal | HIDE/FLAG (`icalSync`) |
| `/legal/guest-terms` | `…/page.tsx` | L | Full | guest (V2) | HIDE/FLAG (`customerWorkspace`) |
| `/legal/guest-data-notice` | `…/page.tsx` | L | Full | guest | HIDE/FLAG |
| `/legal/host-terms` | `…/page.tsx` | L | Full | host/booking | HIDE/FLAG |
| `/legal/host-payout-terms` | `…/page.tsx` | L | Full | host/booking | HIDE/FLAG |
| `/legal/host-tax-disclaimer` | `…/page.tsx` | L | Full | host/booking | HIDE/FLAG |
| `/legal/host-insurance-disclaimer` | `…/page.tsx` | L | Full | host/booking | HIDE/FLAG |
| `/legal/host-compliance-disclaimer` | `…/page.tsx` | L | Full | host/booking | HIDE/FLAG |
| `/legal/house-rules-policy` | `…/page.tsx` | L | Full | booking | HIDE/FLAG |
| `/legal/damage-deposit-policy` | `…/page.tsx` | L | Full | booking | HIDE/FLAG |
| `/legal/listing-accuracy-warranty` | `…/page.tsx` | L | Full | booking | HIDE/FLAG |
| `/legal/safety-emergency-disclaimer` | `…/page.tsx` | L | Full | emergency | HIDE/FLAG (`marketplaceEmergency`) |

**Subtotal: 33.** V1 keeps the 10 core/affiliate; the **22 booking/marketplace/host/
guest policy pages stay in code but should not appear in the `/legal` index until
their parent flag is ON** (a page is harmless if not linked, but listing booking/host
terms on a compliance-wedge product muddies the 30-second story — brief §4).

---

## C. Public marketplace + booking (consumer, V2) — flag OFF

Two route groups plus loose top-level aliases (redirected by `next.config.ts:97–106`).

### C1 — `(marketplace-public)` group

| Path | File | Purpose | Comm | Completion | Flag | Decision |
|---|---|---|---|---|---|---|
| `/marketplace` | `(marketplace-public)/marketplace/page.tsx` | MP home | M | Partial | `marketplaceEnabled` | HIDE/FLAG |
| `/marketplace/stays` | `…/stays/page.tsx` | Stay listings | M | Partial | `marketplaceStays` | HIDE/FLAG |
| `/marketplace/stays/[slug]` | `…/stays/[slug]/page.tsx` | Stay detail | M | Partial | `marketplaceStays` | HIDE/FLAG |
| `/marketplace/services` | `…/services/page.tsx` | Service listings | M | Partial | `marketplaceSuppliers` | HIDE/FLAG |
| `/marketplace/services/[slug]` | `…/services/[slug]/page.tsx` | Service detail | M | Partial | `marketplaceSuppliers` | HIDE/FLAG |
| `/marketplace/suppliers` | `…/suppliers/page.tsx` | Supplier listings | M | Partial | `marketplaceSuppliers` | HIDE/FLAG |
| `/marketplace/suppliers/[slug]` | `…/suppliers/[slug]/page.tsx` | Supplier detail | M | Partial | `marketplaceSuppliers` | HIDE/FLAG |
| `/marketplace/emergency` | `…/emergency/page.tsx` | Emergency dispatch | M | Partial | `marketplaceEmergency` | HIDE/FLAG |
| `/marketplace/book/[listingId]` | `…/book/[listingId]/page.tsx` | Book flow | M | Partial | `marketplaceStays` | HIDE/FLAG |
| `/marketplace/checkout/[draftId]` | `…/checkout/[draftId]/page.tsx` | MP checkout | M | Partial | `marketplacePayments` | HIDE/FLAG |
| `/marketplace/request/[requestId]` | `…/request/[requestId]/page.tsx` | Quote request | M | Partial | `marketplaceSuppliers` | HIDE/FLAG |

### C2 — `(public-booking)` group + loose top-level stay/service/provider pages

| Path | File | Purpose | Completion | Flag | Decision |
|---|---|---|---|---|---|
| `/stay/[slug]` | `(public-booking)/stay/[slug]/page.tsx` | Direct stay page | Partial | `directBookingPages` | HIDE/FLAG |
| `/stay/[slug]/checkout` | `…/checkout/page.tsx` | Checkout | Partial | `directBookingPages`+`marketplacePayments` | HIDE/FLAG |
| `/stay/[slug]/pay` | `…/pay/page.tsx` | Pay | Partial | `marketplacePayments` | HIDE/FLAG |
| `/stay/[slug]/confirmation` | `…/confirmation/page.tsx` | Confirm | Partial | `directBookingPages` | HIDE/FLAG |
| `/stay/search` · `/stay/map` · `/stay/compare` · `/stay/wishlist` | `(public-booking)/stay/*` | Discovery | Partial | `directBookingPages` | HIDE/FLAG |
| `/booking/[ref]` | `(public-booking)/booking/[ref]/page.tsx` | Booking lookup | Partial | `bookingManagement` | HIDE/FLAG |
| `/booking/checkout/[draftId]` | `…/checkout/[draftId]/page.tsx` | Booking checkout | Partial | `marketplacePayments` | HIDE/FLAG |
| `/stays`, `/stays/[slug]`, `/stays/map`, `/stays/long-term`, `/stays/long-term/[slug]`, `/stays/long-term/map` | `src/app/stays/*` (6) | Stays discovery (redirect targets) | Partial | `marketplaceStays`/`directBookingPages` | HIDE/FLAG + **dup-of** `(marketplace-public)/marketplace/stays` |
| `/services`, `/services/[slug]`, `/services/map` | `src/app/services/*` (3) | Services discovery | Partial | `marketplaceSuppliers` | HIDE/FLAG + dup-of marketplace/services |
| `/providers`, `/providers/[slug]`, `/providers/map` | `src/app/providers/*` (3) | Provider discovery | Partial | `marketplaceSuppliers` | HIDE/FLAG + dup |
| `/suppliers` | `src/app/suppliers/page.tsx` | Supplier discovery | Partial | `marketplaceSuppliers` | HIDE/FLAG + dup |
| `/emergency`, `/emergency/[slug]` | `src/app/emergency/*` (2) | Emergency discovery | Partial | `marketplaceEmergency` | HIDE/FLAG + dup |
| `/checkout/bookings/[bookingId]` | `src/app/checkout/bookings/[bookingId]/page.tsx` | Shared checkout shell | Partial | `marketplacePayments` | HIDE/FLAG |
| `/checkout/services/[serviceOrderId]` | `…/page.tsx` | Service checkout | Partial | `marketplacePayments` | HIDE/FLAG |
| `/checkout/emergency/[emergencyOrderId]` | `…/page.tsx` | Emergency checkout | Partial | `marketplaceEmergency` | HIDE/FLAG |
| `/checkout/quote-request/[quoteRequestId]` | `…/page.tsx` | Quote checkout | Partial | `marketplaceSuppliers` | HIDE/FLAG |

**Subtotal: ~38** (11 marketplace-public + 10 public-booking + 14 loose discovery/
checkout + 3 redirect collisions). **Whole area = HIDE/FLAG for V1** (brief §3, Layer D).
**Major duplication:** `(marketplace-public)/marketplace/{stays,services,suppliers}`
vs loose `/stays`, `/services`, `/suppliers`, `/providers` — two parallel public
discovery stacks. **MERGE** to one before any V2 flag-on (doc 17 §b).

---

## D. Auth + onboarding (route group `(auth)`, `(admin-auth)`, `(states)`)

| Path | File | Purpose | Comm | Completion | Decision |
|---|---|---|---|---|---|
| `/login` | `(auth)/login/page.tsx` | Persona-aware login | H | Full | KEEP |
| `/register` | `(auth)/register/page.tsx` | Sign up | H | Full | KEEP |
| `/onboarding` | `(auth)/onboarding/page.tsx` | Operator onboarding | H | Full | KEEP |
| `/onboarding/supplier` | `(auth)/onboarding/supplier/page.tsx` | Supplier onboarding | M | Partial | KEEP-SIMPLIFY |
| `/forgot-password` | `(auth)/forgot-password/page.tsx` | Reset request | M | Full | KEEP |
| `/reset-password` | `(auth)/reset-password/page.tsx` | Reset | M | Full | KEEP |
| `/verify-2fa` | `(auth)/verify-2fa/page.tsx` | 2FA | M | Full | KEEP |
| `/invite/[token]` | `(auth)/invite/[token]/page.tsx` | Accept invite | M | Full | KEEP |
| `/admin-login` | `(admin-auth)/admin-login/page.tsx` | Admin login (MFA gate) | Ops | Full | KEEP |
| `/payment-required` | `(states)/payment-required/page.tsx` | Billing state | M | Full | KEEP |
| `/subscription-inactive` | `(states)/subscription-inactive/page.tsx` | Billing state | M | Full | KEEP |
| `/workspace-not-found` | `(states)/workspace-not-found/page.tsx` | Error state | L | Full | KEEP |
| `/portal-expired` | `(states)/portal-expired/page.tsx` | Portal state | L | Full | KEEP (dup-of `(portal)/portal/expired`) |
| `/invite-expired` | `(states)/invite-expired/page.tsx` | Invite state | L | Full | KEEP |

**Subtotal: 14.** Aligns with brief §4 "~12 auth/onboarding".

---

## E. PM operator workspace — `(app)/app/*` → `/property-manager/*` (351 pages)

The flagship. V1 nav = 8 stories across 5 groups (`SideNavigation.tsx`):
Overview · Core(Portfolio/Work/Bookings/Listings/Suppliers/Planning/Contacts/Portals/
Messages) · Finance(Money/Accounting/Affiliate) · Operations(Calendar/Compliance/
Legal/Automations) · System(Workspace/Billing). Brief target = collapse 351 → ~110–130
visible. Below grouped by section with a single decision per section (densely tabled;
per-leaf decisions inherit unless noted).

### E1 — Home / Account / System (Layer A)

| Section | Routes | File root | Comm | Completion | Tables | Decision |
|---|---|---|---|---|---|---|
| Home dashboard | `/property-manager` | `(app)/app/page.tsx` → `HomeDashboardPage` | H | Full | workspaces, properties, tasks | KEEP |
| Account (10) | `account`, `/profile`, `/security`, `/sessions`, `/notifications`, `/preferences`, `/data-privacy`, `/connected-accounts`, `/login`, `/activity` | `(app)/app/account/*` | M | Full | profiles, auth_sessions [V] | KEEP-SIMPLIFY (→tabs; `account-settings` standalone is dup-of `account`) |
| `account-settings` | `/account-settings` | `(app)/app/account-settings/page.tsx` | L | Partial | — | **MERGE**→`/account` (duplicate) |
| Workspace-settings (24) | `workspace-settings/*` (ai, audit, billing, branding, copilot-inbox, danger-zone, data, demo-data, email, integrations, invoices, jurisdiction, navigation, notifications, profile, roles, security, sso, storage, subscription, team, white-label, addons) | `(app)/app/workspace-settings/*` | M | Full/Partial | workspaces, workspace_members, subscriptions | **MERGE** 24→~8 tabs (brief §3 "45→clean tabbed") |
| Workspace billing (8) | `workspace/billing` (+ add-ons, cancellation, checkout, history, renewals), `workspace/global`, `workspace/global/privacy` | `(app)/app/workspace/*` | M | Full | subscriptions, invoices, stripe_* | **MERGE** into one Billing tab; **dup-of** `workspace-settings/billing` + `/invoices` + `/subscription` |
| Settings stragglers (3) | `settings/calendar-notifications`, `settings/compliance`, `settings/payments-stripe` | `(app)/app/settings/*` | L | Partial | — | **MERGE** into workspace-settings (orphan trio outside the 24) |
| Changelog / Help / Verification | `changelog`, `help`, `verification` | `(app)/app/*` | L | Full | changelog_entries | KEEP |

### E2 — Portfolio (Layer A, V1 KEEP) — 25 routes

| Path group | Files | Comm | USP | Completion | Tables | Decision |
|---|---|---|---|---|---|---|
| `portfolio` index | `portfolio/page.tsx` | H | M | Full | properties, units, tenancies | KEEP |
| Properties (5) | `properties`, `/[id]`, `/[id]/edit`, `/new`, `/[id]/hmo` (+`/hmo/analytics`,`/rooms`,`/utilities`) | H | H (HMO) | Full | properties, hmo_* [V] | KEEP (HMO depth = USP) |
| Units (4) | `units`, `/[id]`, `/[id]/edit`, `/new` | H | M | Full | units | KEEP |
| Tenancies (4) | `tenancies`, `/[id]`, `/[id]/edit`, `/new` | H | M | Full | tenancies | KEEP |
| Leasing (5) | `leasing/agreements`, `/prospects`, `/vacancies`, `/viewings` | M | M | Partial | leasing_* [V] | KEEP-SIMPLIFY |
| Views | `gallery`, `map`, `timeline` | L | L | Partial | properties | **MERGE**→toggles on portfolio index |

### E3 — Work / Maintenance (Layer A, V1 KEEP) — 26 routes

| Path group | Files | Comm | USP | Completion | Decision |
|---|---|---|---|---|---|
| Work index + Tasks (4) | `work`, `tasks`, `/[id]`, `/new` | H | M | Full | KEEP |
| Jobs (3) | `jobs`, `/[id]`, `/new` | H | M | Full | KEEP |
| PPM (6) | `ppm`, `/[id]`, `/overview`, `/schedules`, `/schedules/new`, `/timeline` | H | M | Full/Partial | KEEP |
| Suppliers (operator-side) (3) | `suppliers`, `/[id]`, `/preferred` | H | M (Layer B) | Full | KEEP |
| Orders (4) | `orders`, `/[orderId]`, `/escrow/[escrowId]`, `/quotes/[quoteRequestId]` | M | M | Partial | KEEP `orders`; `/escrow/*` **FLAG** (`marketplaceEscrow`) |
| `work/marketplace` | `work/marketplace/page.tsx` | M | L | Partial | **FLAG** (`marketplaceEnabled`) + dup-of suppliers-hub |
| Views | `board`, `calendar`, `gantt`, `reports`, `complaints` | M | L | Partial | KEEP-SIMPLIFY (board/gantt→toggles); `work/calendar` dup-of `/calendar` |

### E4 — Compliance + Legal (Layer A/C — **USP moat**, V1 KEEP) — 35 routes

| Path group | Files | Comm | USP | Completion | Tables | Decision |
|---|---|---|---|---|---|---|
| Compliance (22) | `compliance` + overview, certificates(+[id]/edit/new), inspections(+[id]/edit/new), documents(+[id]/new), renewals, risk, coverage, property-coverage, evidence, activity, reports, settings, supplier-docs | H | **H** | Full/Partial | compliance_*, certificates, inspections [V] | KEEP (core); advanced (risk, reports) → Layer C gate V1.5 |
| Legal (13) | `legal/possession`(+`[caseId]`,`/new`+5 wizard steps), `legal/hmo-licences`(+`[licenceId]`), `legal/rra-2026`, `legal/epc-advisory` | H | **H** (RRA-2026) | Partial | possession_cases, hmo_licences [V] | KEEP (core possession+HMO V1); deep advisory V1.5 (Layer C) |

> **USP note:** Compliance + Legal are the brief §2 moat. `risk`, `property-coverage`,
> `rra-2026`, `epc-advisory` are the differentiators — protect; do not let "simplify"
> strip depth, only merge nav.

### E5 — Money + Accounting (Layer A money / **Layer D GL**) — 51 routes

| Path group | Files | Comm | Completion | Layer | Decision |
|---|---|---|---|---|---|
| Money basics (Layer A) | `money` + arrears, rent-chase, invoices(+[id]/new/edit), bills(+[id]/new/edit), expenses, income, deposits, payouts, refunds, owner-statements (via accounting), commissions, fee-rules, activity | H | Full/Partial | A | KEEP |
| Money advanced | `money/escrow`(+[escrowId]/[view]), `money/holds`, `money/disputes`(+[id]), `money/fx`, `money/supplier-payments`, `money/affiliate`, `money/stripe` | M | Partial | B/D | **FLAG** escrow/holds/disputes (`marketplaceEscrow`/`Disputes`); fx→`multiCountryPortfolio` |
| **Accounting full GL (22)** | `accounting` + accounts(+[accountId]/journal-ledger/new/overview), **ledger**(chart, journal(+new), trial-balance, accounts/[id]), **mtd**, **reconciliation**(+manual-transaction/new), client-accounts(+disbursements/new), forecast(+scenarios/new), owner-statements, reports(+generate) | L (V1) | Partial | **D** | **HIDE/FLAG** — brief §3: position as Xero/QuickBooks *integration*, not in-app ERP. No flag key exists yet → **needs new `accountingGl` flag** [VERIFY] |

> **Biggest single bloat block.** 22 double-entry GL routes (journal, trial-balance,
> chart of accounts, MTD, reconciliation) on a compliance-wedge product. Brief §3
> binding: HIDE+FLAG, reframe as integration. Keep owner-statements + basic invoices/
> expenses in Money (Layer A).

### E6 — Bookings / Listings (Layer B/C, V1.5 gated) — 28 routes

| Path group | Files | Comm | Completion | Flag | Decision |
|---|---|---|---|---|---|
| Bookings (15) | `bookings`, `/[id]`, `/calendar`, `/reservations`, `/listings`(+[id]/channels/new), `/disputes`(+[disputeId]/+5 sub) | M | Partial | `bookingManagement` (+`marketplaceDisputes` for disputes) | HIDE/FLAG |
| Listings (13) | `listings`, `/new`(+5 wizard steps), `/[listingId]/edit`(+5 steps) | M | Partial | `directBookingPages` | HIDE/FLAG (dup-of bookings/listings) |

> **Duplication:** `bookings/listings/*` and top-level `listings/*` are two listing
> editors. **MERGE** to one behind `bookingManagement`/`directBookingPages`.

### E7 — Planning engine (Layer C — **PROTECT, premium**) — 43 routes

| Path group | Files | Comm | USP | Completion | Decision |
|---|---|---|---|---|---|
| Planning core | `planning`, `wizard`(+`[draftId]`), `profiles`(+`[slug]`+8 sub: overview, income-model, cost-drivers, compliance, example-forecast, starter-checklist, risks, ai-questions) | H | **H** | Full/Partial | **SPLIT-OUT** as premium module (V1.5); KEEP all — do NOT cut |
| Sets | `sets`(+`new`,`[id]`+18 sub: overview, income, expenses, bills, assumptions, forecasts, scenarios, risk, compliance, conversion, upfront-costs, rooms-units, tasks, documents, ai-review, landlord-offer, activity) | H | **H** | Partial | KEEP; **simplify entry** (18 subtabs = deep, gate behind premium) |
| Intelligence | `yield-intelligence`, `portfolio-intelligence`, `conversions`, `scenarios`, `forecasts`, `landlord-offers`(+`[id]`/`new`), `documents`, `activity` | H | **H** | Partial | KEEP (premium hook) |

> **Brief §2/§5:** this is the differentiator that makes Propvora more than admin.
> Price as premium (V1.5 entitlement), simplify the *entry*, never delete. 43 routes
> is the single largest justified concentration in the app.

### E8 — Suppliers/Marketplace surface inside operator (Layer B + D) — 19+4 routes

| Path group | Files | Comm | Completion | Flag | Decision |
|---|---|---|---|---|---|
| Suppliers hub (operator coordination, Layer B) | `marketplace/suppliers-hub`(+[slug], emergency(+[slug]), map, services(+[slug]/map)) | M | Full (one page, tabbed) | — V1 KEEP | KEEP (operator↔supplier coordination) |
| Operator marketplace consumer | `marketplace`, `/[id]`, `/stays`, `/suppliers`(+[id]/compare), `/emergency`, `/my-listings`, `/orders`, `/requests`, `/saved` | M | Partial | `marketplaceEnabled` | **HIDE/FLAG** (Layer D); dup-of public marketplace |
| Suppliers (alt) (4) | `suppliers`, `/directory`, `/compliance`, `/performance` | M | Partial | — | **MERGE**→`work/suppliers` + suppliers-hub (third supplier surface) |

> **Triple supplier surface:** `work/suppliers`, `suppliers/*`, and
> `marketplace/suppliers-hub` all address suppliers. Brief §5 MERGE target.

### E9 — Calendar / Contacts / Portals / Affiliates / Messages / Network (Layer A/B)

| Section | Routes | Comm | Completion | Decision |
|---|---|---|---|---|
| **Calendar (21)** | `calendar` + month, week, day, agenda, gantt, timeline, schedule, views(+agenda/day/gantt/month/week), events(+[id]/edit/new), reminders(+new), settings | M | Full | **MERGE views→toggles** (brief §3). **Severe dup:** top-level `month/week/day/agenda/gantt` AND `views/{month,week,day,agenda,gantt}` are two parallel view trees. Collapse 21→~5 |
| Contacts (14) | `contacts` + [id](+edit), new, people, organisations, guests, board, map, timeline, activity, documents, messages, portal-access | M | Full/Partial | KEEP-SIMPLIFY (board/map/timeline→toggles; guests→`customerWorkspace`) |
| Portals (operator config) (5) | `portals`, `/access`(+[id]), `/profiles`, `/purposes` | H | Full | KEEP (Layer B retention engine config) |
| Affiliates (5) | `affiliates` + earnings, links, referrals, settings | M | Full | KEEP (payouts flag OFF per brief §3) |
| Messages (2) | `messages`, `/conversations/[conversationId]` | H | Full | KEEP |
| Network (2) | `network`, `/activity` | L | Partial | DEFER/FLAG (agency-network = V1.5+; unclear V1 value) |

### E10 — Automations (Layer C-lite KEEP small / **Layer D HIDE**) — 20 routes

| Path group | Files | Comm | Completion | Layer | Decision |
|---|---|---|---|---|---|
| Recipes/approvals (C-lite) | `automations`, `home`, `recipes`, `approvals`, `templates`, `my-automations`, `settings` | M | Partial | C-lite | KEEP small behind `canvasLite` |
| Full canvas/webhooks/usage (D) | `canvas`(+[automationId]), `builder`, `ai-builder`, `webhooks`, `integrations`, `usage`, `usage-limits`, `runs`(+[id]), `runs-logs`, `errors`, `admin-controls` | L (V1) | Partial | **D** | **HIDE/FLAG** (Zapier-clone scope, brief §3) |

**Operator subtotal: 351.** Brief §4 target visible = ~110–130 → achieved by MERGE
(calendar 21→5, settings 35→8, supplier 3 surfaces→1, listings/bookings dup→1) + FLAG
(accounting GL 22, marketplace consumer 13, automations canvas ~12, escrow/disputes).

---

## F. Tenant portal — `(tenant)/tenant-portal/*` (Layer B, V1 KEEP) — 8

| Path | File | Comm | USP | Completion | Tables | Decision |
|---|---|---|---|---|---|---|
| `/tenant-portal` | `(tenant)/tenant-portal/page.tsx` | H | M | Full | tenancies, portal_sessions [V] | KEEP |
| `/tenant-portal/tenancy` | `…/tenancy/page.tsx` | H | M | Full | tenancies | KEEP |
| `/tenant-portal/rent` | `…/rent/page.tsx` | H | M | Full | rent_*, invoices | KEEP |
| `/tenant-portal/maintenance` | `…/maintenance/page.tsx` | H | M | Full | maintenance_requests | KEEP |
| `/tenant-portal/documents` | `…/documents/page.tsx` | M | M | Full | documents | KEEP |
| `/tenant-portal/messages` | `…/messages/page.tsx` | M | M | Full | portal_messages | KEEP |
| `/tenant-portal/viewings` | `…/viewings/page.tsx` | M | M | Partial | viewings [V] | KEEP |
| `/tenant-portal/settings` | `…/settings/page.tsx` | L | L | Full | — | KEEP |

---

## G. Landlord portal — `(landlord)/landlord-portal/*` (Layer B, V1 KEEP) — 8

| Path | File | Comm | Completion | Decision |
|---|---|---|---|---|
| `/landlord-portal` | `(landlord)/landlord-portal/page.tsx` | H | Full | KEEP |
| `/landlord-portal/properties`(+`/[id]`) | `…/properties/*` | H | Full | KEEP |
| `/landlord-portal/statements` | `…/statements/page.tsx` | H | Full | KEEP |
| `/landlord-portal/work` | `…/work/page.tsx` | M | Full | KEEP |
| `/landlord-portal/documents` | `…/documents/page.tsx` | M | Full | KEEP |
| `/landlord-portal/messages` | `…/messages/page.tsx` | M | Full | KEEP |
| `/landlord-portal/settings` | `…/settings/page.tsx` | L | Full | KEEP |

---

## H. Tokenised portal sessions — `(portal)/*` + `p/[token]` (Layer B, V1 KEEP) — 36

The **unified share-session** portal (one shell, role-scoped: landlord/supplier/tenant
under `[sessionId]`). This is the operator's outbound retention fabric.

| Path group | Files | Comm | Completion | Tables | Decision |
|---|---|---|---|---|---|
| Entry/states | `portal`, `/login`, `/expired`, `/revoked`, `/[sessionId]`, `p/[token]` (route.ts) | H | Full | portal_sessions, portal_access [V] | KEEP |
| Landlord scope (10) | `[sessionId]/landlord/*` (documents, financials, maintenance(+[requestId]), messages, payments(+[paymentId]), properties(+[id])) | H | Full | KEEP (dup-of `(landlord)` portal — see note) |
| Supplier scope (10) | `[sessionId]/supplier/*` (documents(+[documentId]), invoices(+[id]), jobs(+[id]), messages, payments(+[paymentId])) | M | Full | KEEP (dup-of `(supplier)/supplier-portal`) |
| Tenant scope (11) | `[sessionId]/tenant/*` (tenancy, documents, maintenance(+[requestId]/report), messages, payments(+[paymentId])) | H | Full | KEEP (dup-of `(tenant)/tenant-portal`) |

> **Structural duplication [VERIFY]:** there appear to be TWO portal paradigms —
> (1) standalone `(tenant)`/`(landlord)`/`(supplier)` portals (logged-in counterparties)
> and (2) tokenised `(portal)/[sessionId]/{role}` share-sessions (link-based, no login).
> Both are legitimate (login vs magic-link), but the per-role *pages* largely mirror
> each other. **MERGE candidate** for V1.5: share components, keep both entry modes.
> Net portal surface ≈ 25 visible (brief §4 target) once de-duplicated.

---

## I. Customer / guest workspace — `(customer)/customer/*` → `/user/*` (Layer D, V2) — 46

Brief §3: **HIDE** behind `customerWorkspace` (OFF). Denser than brief's estimate.

| Path group | Files | Comm | Completion | Flag | Decision |
|---|---|---|---|---|---|
| Shell/home | `customer`, `home`, `account-settings`, `profile`, `notifications`, `help` | M | Full | `customerWorkspace` | HIDE/FLAG |
| Stays (consumer) (8) | `stays`(+[slug], long-term(+[slug]/map), map), `search`, `saved`, `favourites` | M | Partial | `customerWorkspace`+`marketplaceStays` | HIDE/FLAG |
| Bookings (8) | `bookings`(+[id]/+dispute/modify/report-issue, completed, disputes) | M | Partial | `customerWorkspace`+`bookingManagement` | HIDE/FLAG |
| **Lets (13)** | `lets/search`, `lets/properties/[id]`, `lets/offers/[id]`, `lets/viewings/[id]`, `lets/applications/[id]/wizard`, `lets/tenancies/[id]`(+documents, maintenance, move-in, rent-payments, setup) | M | Partial | `customerWorkspace` | HIDE/FLAG |
| Orders/Payments/Reviews/Messages/Maintenance | `orders`, `payments`, `reviews`, `messages`(+[id]), `maintenance`(+new) | M | Partial | `customerWorkspace` | HIDE/FLAG |
| Affiliate (5) | `affiliate`(+earnings/links/referrals/settings) | L | Full | `customerWorkspace` | HIDE/FLAG (dup-of operator affiliates) |

**Subtotal: 46.** Entire group HIDE/FLAG for V1.

---

## J. Independent Supplier workspace — `(supplier-workspace)/supplier/*` (Layer D/C, V2) — 113

Brief §3: **TRIM HARD**; in V1 suppliers act via portal + operator coordination;
"mirrored accounting/automations/calendar = CUT from supplier". **Measured: 50 of 113
pages are 1-line re-export SHIMS** of operator pages (`export { default } from
"@/app/(app)/app/..."`) — confirming the mirror.

| Path group | Files | Completion | Flag | Decision |
|---|---|---|---|---|
| Supplier core (genuine) | `supplier`, `profile`(+preview), `services`(+[id]), `packages`, `jobs`(+[id]/evidence/sign-off), `quotes`(+[quoteId]/new), `requests`(+[requestId]), `leads`, `availability`, `coverage`, `zones`, `schedule`, `calendar`(real), `inbox`(+threads), `messages`, `notifications`, `insights`, `reputation`, `reviews`, `earnings`, `payouts`(+[payoutId]/blockers), `disputes`, `team`, `account`, `settings`, `help`, `onboarding`(+complete/readiness), `verification`(+business), `insurance`(+renew), `compliance`(+docs/licences/upload), `evidence`, `finance`(+invoices), `invoices`, `marketplace`(+[id]/new) | Full/Partial | `supplierWorkspace` | **HIDE/FLAG**; KEEP code |
| **Mirrored shims (CUT from supplier)** | `supplier/accounting/*` (22 — all shims of operator GL), `supplier/automations/*` (14 — shims), `supplier/calendar/views/*` + parts (shims), `supplier/affiliate/*` (5 — shims) | Shim | `supplierWorkspace` | **REMOVE/ARCHIVE** (brief §3 explicit: mirrored accounting/automations = CUT). Verify no inbound links first |

> **50 shims** import operator pages directly — they carry operator chrome/context and
> are almost certainly wrong for a supplier. These are the clearest **REMOVE/ARCHIVE**
> candidates in the codebase (after dependency check). Genuine supplier surface ≈ 63.

---

## K. Platform admin — `(admin)/admin/*` (Ops, V1 KEEP — internal control plane) — 52

Brief §6: "genuine control plane — keep" (not customer nav).

| Path group | Files | Purpose | Decision |
|---|---|---|---|
| Core | `admin`, `users`(+[id]), `workspaces`(+[id]), `subscriptions`(+[id]), `portfolios`, `portals`, `customers`, `suppliers`, `settings` | Tenant/billing ops | KEEP |
| Trust/security | `audit`, `security`, `risk`(+[workspaceId]), `verification`(+[id]), `supplier-verification`(+[id]), `data-requests` | Security & GDPR | KEEP |
| Ops/health | `health`, `maintenance`, `cron`, `bugs`, `ai-models`, `ai-usage`, `automations`(+usage-caps) | Platform health | KEEP |
| Comms | `announcements`(+bar), `changelog`, `documents` | Comms | KEEP |
| **Marketplace moderation (V2-linked)** | `marketplace`(+disputes, moderation, payouts, transactions, suppliers, lettings, workspaces(+[id])), `bookings`, `stays`, `planning`, `work`, `affiliates`(+[id]) | MP control plane | KEEP (admin only) but **dormant until `marketplaceEnabled` ON** — keep built, no nav weight |
| Global packs | `global`(+[code], translations) | Country packs | KEEP behind `globalCountryPacks` |

**Subtotal: 52.** Matches brief §6 "~50 admin". KEEP all — internal.

---

## L. API — internal (`src/app/api/**/route.ts`) — 150

Grouped by domain. These are server endpoints, not nav; decision = KEEP unless the
*feature* they serve is flagged off (then they sit dormant — harmless, called only
when surface is live). Densely tabled.

| Domain | Routes (count) | Examples | Flag dependency | Decision |
|---|---|---|---|---|
| Auth/identity | 6 | `auth/callback`, `auth/rate-check`, `identity/{session,status,documents,review,webhook}` | — | KEEP |
| Billing/Stripe | 6 | `billing/{checkout,pay-invoice,portal}`, `webhooks/stripe`, `connect/{onboard,status}` | — | KEEP |
| Entitlements/health | 5 | `entitlements`, `health`, `ready`, `integrations/status`, `consent/log` | — | KEEP |
| Newsletter/email/legal | 7 | `newsletter/{confirm,subscribe,unsubscribe}`, `email/{invite,welcome}`, `legal/accept`, `bug-report` | — | KEEP |
| Portal/share | 9 | `portal/{verify,logout,file,messages}`, `portal/share/{file,sign,upload}`, `portals/grant`, `files/[...key]` | — | KEEP |
| Money/invoices/pdf | 7 | `money/{fee-rules,holds,release-check}`, `money/disputes/[id]/actions`, `invoices/[id]/resend`, `pdf/invoice/[id]`, `account/request` | `marketplaceEscrow`/`Disputes` for some | KEEP (dormant where flagged) |
| Marketplace | 8 | `marketplace/{search,public-search,listings(+[id]),checkout,enquiries,suppliers,quote-requests}`, `admin/marketplace/listings/[id]/moderate` | `marketplaceEnabled`+children | KEEP (dormant) |
| Booking | 12 | `booking/{availability,quote,reserve,public-search}`, `booking/listing/{availability,quote,reserve}`, `booking/ical/{[token],connections,refresh}`, `booking/keyless/{generate,release}`, `booking-portal/{lookup,cancel,issue,review}` | `bookingManagement`/`directBookingPages`/`icalSync` | KEEP (dormant) |
| Payments | 4 | `payments/{intent,status,reconcile,webhook}` | `marketplacePayments` | KEEP (dormant) |
| Supplier (workspace) | ~33 | `supplier/{dashboard,analytics,profile,services,packages,coverage,zones,availability,onboarding,quotes(+[id]),jobs(+[id]/events/evidence/status),jobs/{earnings,payments,reviews},leads,payouts,disputes,team,verification,connections,invoices,messages(+[threadId]),notifications,search}`, `supplier-verification/{status,documents,submit}` | `supplierWorkspace` | KEEP (dormant); some serve V1 portal too — **[VERIFY] split portal-needed vs workspace-only** |
| Automations | 17 | `automations/{nl,dry-run,definitions(+[id]),webhooks,trigger/[token],node-registry,nodes,templates,settings,usage,errors,approvals,recipes,ai-builder,integrations,runs(+replay)}` | `canvasLite` (lite) / none (full) | KEEP small; full canvas endpoints dormant |
| Customer | 2 | `customer/{issues,maintenance}` | `customerWorkspace` | KEEP (dormant) |
| AI | 3 | `ai/{actions,chat,commands}` | `aiCopilot` entitlement | KEEP (gate) |
| Demo | 3 | `demo/{reset,seed,status}` | — | KEEP (non-prod) |
| Cron | 4 | `cron/{automation-runner,daily,expire-holds,reconcile}` | — | KEEP |
| Workspace/admin | ~14 | `workspace/{global,jurisdiction,privacy-requests,billing-details}`, `admin/{init,account-process,automations,disputes,risk,workspaces,supplier-verification,marketplace,global/*}` | mixed | KEEP |
| Upload | 1 | `upload` | — | KEEP |

**Subtotal: 150** (matches brief §6 exactly). No Supabase edge functions
(`supabase/functions` empty per brief §6). **Decision for all: KEEP** — APIs are
fail-closed dormant when their feature flag is OFF; deleting them would break the
flag-on V2 path. (Audit them for dead code only if a *feature* is fully archived.)

---

## M. Deprecated / duplicate (cross-area summary)

The most actionable duplications surfaced above, collected for doc 17:

| # | Duplicate set | Canonical to keep | Action |
|---|---|---|---|
| 1 | Calendar top-level `month/week/day/agenda/gantt` **AND** `calendar/views/{…}` | `views/*` switcher (newer) OR top-level — pick one | MERGE 21→~5 |
| 2 | `work/calendar`, `bookings/calendar`, `calendar` | `/calendar` | MERGE/redirect |
| 3 | Supplier surface ×3: `work/suppliers`, `suppliers/*`, `marketplace/suppliers-hub` | `suppliers-hub` + `work/suppliers` | MERGE `suppliers/*` away |
| 4 | Listings ×2: `listings/*` and `bookings/listings/*` | one editor | MERGE |
| 5 | Public discovery ×2: `(marketplace-public)/marketplace/{stays,services,suppliers}` vs loose `/stays`,`/services`,`/suppliers`,`/providers` | marketplace-public group | MERGE (redirects already partial) |
| 6 | `account` vs `account-settings` (operator) | `/account` | MERGE |
| 7 | `workspace-settings/billing` vs `workspace/billing/*` vs `…/subscription`/`invoices` | one Billing tab | MERGE |
| 8 | Operator marketplace consumer (`(app)/app/marketplace/*`) vs public marketplace | public + suppliers-hub | FLAG + dedupe |
| 9 | Portal ×2 paradigms: `(tenant)/(landlord)/(supplier)` vs `(portal)/[sessionId]/{role}` | both entry modes, shared components | MERGE components (V1.5) |
| 10 | **50 supplier re-export shims** of operator accounting/automations/calendar/affiliate | none | REMOVE/ARCHIVE |
| 11 | `(states)/portal-expired` vs `(portal)/portal/expired` | one | MERGE |

---

## N. Summary counts

### Routes per area

| Area | Page routes | Notes |
|---|---|---|
| A Public marketing | 18 | + sign |
| B Legal/policy | 33 | 10 core V1, 22 booking/MP/host HIDE |
| C Public marketplace + booking | ~38 | all Layer D / flag OFF |
| D Auth + onboarding + states | 14 | |
| E PM operator workspace | 351 | flagship; target visible ~110–130 |
| F Tenant portal | 8 | |
| G Landlord portal | 8 | |
| H Tokenised portal sessions | 36 | incl `p/[token]` route.ts |
| I Customer/guest workspace | 46 | Layer D / flag OFF |
| J Independent supplier workspace | 113 | 50 shims; Layer D/C |
| K Platform admin | 52 | control plane, KEEP |
| **Page total** | **~717** | (+ stray index `page.tsx`; measured `find`=725 incl. duplicates counted once per area) |
| L API internal | 150 | + 1 non-API route.ts (`p/[token]`) |

> Reconciliation: brief §4 says "~670 non-admin route files" — that is the
> *non-admin page* count (725 total − 52 admin − a handful of state/index ≈ 671).
> ✔ consistent. Operator "350" ✔ (measured 351). Supplier "112" ✔ (measured 113).

### Routes per decision (page routes, indicative)

| Decision | Approx count | Where |
|---|---|---|
| KEEP | ~210 | operator core (portfolio/work/compliance/legal/money-basics/planning/messages/portals/affiliates/calendar-collapsed), portals, auth, admin, marketing core |
| KEEP-SIMPLIFY | ~30 | account, onboarding/supplier, leasing, contacts views, work views |
| MERGE | ~70 | calendar views (16), settings/billing (~25), supplier surfaces, listings dup, account-settings, public discovery dup |
| HIDE/FLAG | ~290 | full GL (22), bookings/listings (28), marketplace operator+public (~50), customer workspace (46), supplier workspace (~63 genuine), automations canvas (~12), booking/host legal (22), money escrow/disputes, admin MP moderation (dormant) |
| DEFER | ~5 | network, agency, some intelligence |
| SPLIT-OUT | 43 | Planning engine (premium module) |
| REMOVE/ARCHIVE | ~50 | supplier re-export shims (after dependency check) |

> These overlap (a Planning route is SPLIT-OUT *and* KEEP; a supplier shim is HIDE
> via flag *and* REMOVE as a shim). Doc 17 resolves the ordering: **flag-hide first
> (reversible), merge second, remove shims last (only after tests).**

---

## O. Brief contradictions / flags raised

1. **[CONTRADICTION — count]** Brief §4 implies ~670 *total* files incl. ~50 marketing;
   measured total `page.tsx` = **725** (50 marketing/legal-ish, 52 admin, denser
   customer=46 vs implied, supplier=113). The "~670" is accurate only as the
   *non-admin page* subset. Flagging so doc 19 can fix the headline number.
2. **[CONTRADICTION — flag wiring]** Brief §6 states "feature-flag registry already
   exists … the deprecation plan is mostly flag config, not code deletion." TRUE that
   the registry exists and is excellent — **but flags are not yet consumed by nav or
   the proxy** (`SideNavigation.tsx` has zero flag checks; `route-registry.ts` is
   dormant unless `contextEngine` ON; `proxy.ts:192` literally says "v2 is integrated
   into core (no feature flags)"). So doc 17 is *flag config + the wiring work to make
   flags actually gate nav/routes*, which is more than "just config." Flagged for
   reconciliation — the plan is still flag-first/non-destructive, but step "nav hide"
   requires writing the flag-consumption layer that doesn't exist yet.
3. **[GAP — missing flag key]** Brief §3 mandates HIDE/FLAG for full accounting GL,
   but there is **no `accountingGl` (or `accounting`) key** in `registry.ts`. Same for
   AI copilot gating — handled via `entitlements.ts` `aiCopilot`, not the flag
   registry. Doc 17 must propose adding `accountingGl` (and optionally `automationsFull`)
   to the registry. [VERIFY]
4. **[OBSERVATION]** Two portal paradigms (logged-in `(tenant/landlord/supplier)` vs
   tokenised `(portal)/[sessionId]`) both ship — not in brief's module map. Treated as
   one "Portals" Layer-B concern (KEEP both modes, MERGE components).
