# 15 — Marketplace & Platform Bets (Layer D)

**Status:** Draft · 2026-06-18 · Author: product-strategy audit
**Conforms to:** `_shared-strategic-brief.md` §1 (verdict), §3 (Layer D rows),
§5 (decision bands), §6 (flag registry + plans).
**Reads with:** `02-product-strategy-saas-vs-platform.md` (layer model),
`18-implementation-roadmap.md` (stage sequencing), `17-deprecation-plan`.

---

## 0. How to read this doc

Each Layer-D bet is assessed on five axes:
- **Exists in code** — what is actually built (routes / libs / flags cited).
- **Liquidity / chicken-egg** — which side(s) must exist first and how cold the
  start is.
- **GTM prerequisites** — what must be true before flag-on is even attemptable.
- **Staged release trigger** — the *metric* from the wedge that unlocks the bet.
- **V1 disposition** — `flag OFF` / `nav-removed` / `foundation-only` / `trim`.

Each closes with **Reason + Risk + Action** per the brief's authoring rule (§8).

**Cross-cutting flag-wiring caveat (critical):** the flags exist and default OFF
(`src/lib/flags/registry.ts`), the accessor is tolerant
(`src/lib/flags/index.ts`), and the admin toggle writes `platform_feature_flags`
(`(admin)/admin/actions.ts`). **But no route group calls `isFeatureEnabled()`**
(zero hits under `src/app`). So for every bet below, "flag OFF" is currently a
*default-OFF flag with no enforcement point*. The V1 action common to all is:
**wire the route-group `layout.tsx` to call the flag and `notFound()`/redirect
when OFF.** Until that wiring lands, these surfaces are reachable by URL even with
flags off.

---

## 1. Consumer stays-booking marketplace

**Exists in code:** Yes — heavily, and **mounted 3–4 times**:
- Public consumer: `(marketplace-public)/marketplace/stays`, `/stays/[slug]`,
  `/book`, `/checkout`.
- Booking-specific public group: `(public-booking)/stay/**` (`[slug]`,
  `/checkout`, `/pay`, `/confirmation`, `compare`, `map`, `search`, `wishlist`).
- Top-level: `stays/`, `stays/[slug]`, `stays/long-term`, `stays/map`.
- Operator-internal: `(app)/app/marketplace/stays`, `(app)/app/bookings/listings`.
- Customer-side: `(customer)/customer/stays`, `/stays/long-term`.
- APIs: `api/booking/{availability,quote,reserve,ical,keyless,public-search}`,
  `api/marketplace/{checkout,public-search,listings}`.
- Flags: `marketplaceStays`, `bookingManagement`, `directBookingPages`, `icalSync`.

**Liquidity / chicken-egg:** Two-sided (guests ↔ listings) **on top of** a third
side (operators who create listings). Cold on the *guest* side — Propvora has zero
consumer demand and competes with Airbnb/Booking.com for distribution. Supply
(operator listings) is achievable from the wedge base, but supply without demand
is a ghost town that erodes trust.

**GTM prerequisites:** A consumer acquisition channel (SEO on `stays/`, paid, or a
distribution partnership) AND enough operator listings in one geography to make
search non-empty. Direct-booking (`directBookingPages`) is the *lower-liquidity*
on-ramp: an operator drives *their own* guests to *their own* page — no platform
demand needed. **This is the wedge-compatible first step**, not the open
marketplace.

**Staged release trigger:** ≥X operators on Scale+ actively running direct lets
(`bookingManagement` usage) in a single metro, producing ≥N live listings →
*then* open `marketplaceStays` search in that metro. **[ASSUMPTION]** X≈50
operators / N≈300 listings per metro as a non-empty-search floor; founder to set.

**V1 disposition:** `marketplaceStays` **flag OFF + nav-removed**.
`directBookingPages` / `bookingManagement` = **foundation-only, gated to V1.5**
(Layer B/C on-ramp). Top-level `stays/` and `(public-booking)` consumer pages =
flag OFF.

- **Reason:** Open consumer marketplace is the coldest start; direct-booking is the
  liquidity-free path that still monetises the same code.
- **Risk:** Shipping an empty `stays/` search publicly signals a dead platform and
  invites Airbnb comparison Propvora loses.
- **Action:** Wire `(marketplace-public)` + `(public-booking)` layouts to
  `marketplaceStays`/`bookingManagement` flags → `notFound()` when OFF. Remove
  Bookings/Listings from PM V1 nav. Keep direct-booking as the V1.5 on-ramp.

---

## 2. Public supplier / services marketplace

**Exists in code:** Yes — `(marketplace-public)/marketplace/suppliers`,
`/suppliers/[slug]`, `/services`, `/services/[slug]`, `/request`; top-level
`services/`, `providers/`, `suppliers/`; operator-internal
`(app)/app/marketplace/suppliers`, `/suppliers-hub/**` (services, map, emergency),
`/marketplace/requests`. APIs: `api/marketplace/{suppliers,quote-requests,
enquiries,search}`, `api/supplier/search`. Supplier-side listing:
`(supplier-workspace)/supplier/marketplace`. Flag: `marketplaceSuppliers`.
Monetisation already modelled: supplier add-ons in `plans.ts`
(`supplier_promoted`, `supplier_emergency`, `supplier_verified_plus`).

**Liquidity / chicken-egg:** Two-sided (operators seeking suppliers ↔ suppliers
seeking jobs). **Warmer than stays** because the *operator wedge already needs
suppliers* — demand is endogenous. But a public, open supplier directory competing
with Checkatrade/Rated People is a different, colder beast than operator-internal
supplier coordination.

**GTM prerequisites:** A critical mass of verified suppliers in a trade × geography
cell such that an operator request gets ≥3 quotes. Verification pipeline already
exists (`api/supplier-verification`, `(admin)/admin/supplier-verification`).

**Staged release trigger:** Operator-side supplier coordination
(`(app)/app/work/suppliers`) shows ≥N operators routing real jobs to suppliers AND
≥M verified suppliers per core trade in a metro → open `marketplaceSuppliers`
discovery. **[ASSUMPTION]** founder to set N/M for "3-quotes-per-request" floor.

**V1 disposition:** `marketplaceSuppliers` **flag OFF + nav-removed** for the
*public/open* directory. **KEEP** operator-side supplier coordination as **Layer B
V1** (`work/suppliers`, `suppliers/directory`) — that is workflow, not marketplace.

- **Reason:** The operator already coordinates suppliers privately (Layer B); the
  *public* two-sided directory is the cold part and must wait for supplier density.
- **Risk:** Conflating "operator dispatches their own supplier" (keep) with "open
  public marketplace" (defer) — the nav currently points PM "Suppliers" straight at
  `/marketplace/suppliers-hub` (`SideNavigation.tsx` L80), leaking the marketplace.
- **Action:** Repoint PM "Suppliers" nav to operator coordination (`work/suppliers`
  or `suppliers/directory`), NOT `suppliers-hub`. Flag-gate `(marketplace-public)`
  supplier routes and top-level `services/`/`providers/`/`suppliers/`.

---

## 3. Emergency services / dispatch

**Exists in code:** Yes — top-level `emergency/`, `emergency/[slug]`;
`(marketplace-public)/marketplace/emergency`; operator
`(app)/app/marketplace/emergency`, `/suppliers-hub/emergency/**`;
`checkout/emergency/[emergencyOrderId]`; legal
`legal/safety-emergency-disclaimer`. Flag: `marketplaceEmergency`. Supplier add-on
`supplier_emergency` (24/7 badge, dispatch eligibility, SLA fields) in `plans.ts`.

**Liquidity / chicken-egg:** The hardest and **highest-liability** bet. Emergency
dispatch requires *guaranteed* real-time supplier availability — a thin two-sided
market with a hard SLA. An empty emergency marketplace is not just useless, it is a
**safety and reputational hazard** (a landlord trusts a "24/7 emergency" promise
and no one shows). Liability is why a `safety-emergency-disclaimer` already exists.

**GTM prerequisites:** Dense, verified, on-call supplier coverage per metro × trade
with SLA contracts and an escalation/fallback path. This is operationally heavy
(on-call rotas, response-time monitoring) — closer to a managed service than a
software flag.

**Staged release trigger:** `marketplaceSuppliers` is live AND a metro has
contracted 24/7 coverage for the core emergency trades (gas, water, electrical,
locks) with monitored SLA. **Highest trigger bar of all bets.**

**V1 disposition:** `marketplaceEmergency` **flag OFF + nav-removed +
foundation-only**. Last bet to light up.

- **Reason:** Liability + the thinnest liquidity make this the riskiest cold start.
- **Risk:** A single failed emergency dispatch is a brand-ending, possibly legally
  actionable event.
- **Action:** Keep code; flag OFF; do not surface in any nav or public page in V1.
  Gate behind both `marketplaceEnabled` and `marketplaceEmergency`. Treat as a
  managed-ops product, not a self-serve flag, when it does launch.

---

## 4. Independent supplier-as-SaaS workspace

**Exists in code:** Yes — extensively, ~112 routes under
`(supplier-workspace)/supplier/**`. It is a **full standalone SaaS**: own dashboard,
jobs, quotes, requests, services, packages, calendar (with
`views/{agenda,day,gantt,month,week}`), inbox/messages, finance/invoices, **a
complete double-entry GL** (`accounting/ledger/{chart,journal,trial-balance}`,
`/mtd`, `/reconciliation`, `/forecast/scenarios`, `client-accounts/disbursements`),
**a full automation engine** (`automations/{canvas,webhooks,integrations,recipes,
runs,usage-limits,ai-builder}`), compliance, reputation, insights, team, affiliate,
payouts. Flag: `supplierWorkspace`. Separate lighter portal also exists:
`(supplier)/supplier-portal/**` and `(portal)/portal/[sessionId]/supplier/**`.

**Liquidity / chicken-egg:** This bet has **no marketplace liquidity problem** — it
is a *single-sided SaaS* sold to suppliers. But it is **a different product with a
different buyer, different GTM, and different competition** (Tradify, Jobber,
ServiceM8). Bundling it into Propvora's operator launch dilutes the story and
doubles the build/support surface for no operator-side benefit.

**GTM prerequisites:** Its own positioning, pricing (supplier add-ons exist in
`plans.ts` but there is no supplier *base plan* — brief §6), acquisition channel,
and onboarding. Effectively a **second company motion**.

**Staged release trigger:** Operator wedge is cash-flow positive AND there is
demonstrated pull from suppliers *already on the portal* wanting more (e.g. portal
suppliers requesting their own jobs/invoicing). **Pull-driven, not push.**

**V1 disposition:** **TRIM HARD.** In V1 suppliers act via the **portal**
(`(portal)/portal/[sessionId]/supplier/**`) + operator coordination only. The full
`(supplier-workspace)` = `supplierWorkspace` **flag OFF + nav-removed**. **CUT** the
mirrored heavy modules from the supplier surface entirely:
- supplier **double-entry GL** (`accounting/ledger/**`, `/mtd`) — suppliers don't
  need an ERP;
- supplier **automation canvas/webhooks/integrations** — Zapier-mirror;
- supplier **calendar view explosion** — MERGE to one view + toggles.

- **Reason:** It is a separate product (Layer D/C). Shipping it with V1 quadruples
  surface and confuses "who is the buyer?" — the brief's clarity test fails.
- **Risk:** Maintaining 112 inert routes (incl. a second GL and a second automation
  engine) is a real green-build and security tax even while hidden.
- **Action:** Flag OFF + nav-removed for the workspace; **delete/archive** the
  mirrored GL + automation-canvas from the supplier tree after dependency check
  (verify portal/jobs flows don't import them); keep portal as the V1 supplier
  surface. Split the workspace out as a future standalone app with its own GTM.

---

## 5. Escrow / payment holds

**Exists in code:** Yes — a **complete payments library**:
`src/lib/payments/{escrow,holds,intents,connect-transfers,payouts,refunds,
release-blocks,reconciliation,webhooks,supplier-flow}.ts`. Routes:
`(app)/app/money/escrow/[escrowId]/[view]`, `(app)/app/work/orders/escrow`,
`checkout/**`, `api/money/release-check`. Flag: `marketplaceEscrow`. This is
**not a stub** — there is real Stripe-Connect-class transfer/hold/release logic.

**Liquidity / chicken-egg:** Escrow has **no liquidity problem of its own** — it is
*infrastructure for the marketplace bets*, not a market. It only has meaning when
there is a marketplace transaction to hold funds for (stays booking, supplier job).
It is therefore **dependent on bets 1–3**, not independent.

**GTM prerequisites:** A live marketplace transaction flow (`marketplacePayments`)
to escrow. Plus regulatory care — holding client money implicates FCA/safeguarding
and the existing operator **client-accounts** logic. **[VERIFY]** safeguarding /
e-money permissions for platform-held funds.

**Staged release trigger:** Activates *with* the first paid marketplace flow
(`marketplacePayments` ON). Not independently triggerable.

**V1 disposition:** `marketplaceEscrow` + `marketplacePayments` **flag OFF +
foundation-only**. Keep the library — it is high-value infra for V2.

- **Reason:** Pure infra; nothing to sell standalone; lights up with the
  marketplace it serves.
- **Risk:** Holding third-party funds without the right regulatory permissions is a
  compliance landmine — must be cleared before flag-on.
- **Action:** Flag OFF; keep `src/lib/payments/**` compiled and tested; gate all
  escrow routes behind `marketplacePayments`/`marketplaceEscrow`; add a
  pre-flag-on regulatory checklist to doc 16 release gates.

---

## 6. Full accounting GL replacement (double-entry ERP)

**Exists in code:** Yes — operator `(app)/app/accounting/ledger/{chart,journal,
journal/new,trial-balance,accounts/[accountId]}`, mirrored in the supplier
workspace. There is **no flag** for the operator GL today (it currently sits inside
the always-on `(app)` group).

**Liquidity / chicken-egg:** None — single-sided depth feature. The issue is
**scope, not liquidity**. A full double-entry GL with chart-of-accounts, journals,
trial balance, MTD and reconciliation **is a competing product to Xero/QuickBooks**
and a bottomless support/compliance commitment (MTD submission correctness,
accountant trust, audit). The brief (§3) is explicit: **HIDE+FLAG and reposition as
an integration.**

**GTM prerequisites:** None to *defer*. To ever *build* it as in-app ERP you would
need accounting credibility, accountant partnerships, and MTD certification — a
multi-quarter commitment Propvora should not make at the wedge stage.

**Staged release trigger:** Frankly, **prefer never** as in-app ERP. The real V1
answer is the **`accounting_sync` add-on** (Xero/QuickBooks two-way sync) already in
`plans.ts` — push money *out* to the tools accountants already trust.

**V1 disposition:** **HIDE+FLAG.** Money *basics* (rent, arrears, invoices,
expenses, owner statements, deposits, payouts) stay Layer A V1. The **GL/ledger**
(`accounting/ledger/**`, MTD, trial-balance, journals) → **flag OFF + nav-removed**;
surface the **Xero/QuickBooks integration** instead.

- **Reason:** In-app ERP is the wrong product to compete on; integration wins trust
  faster and carries none of the MTD-correctness liability.
- **Risk:** Exposing a half-trusted GL invites "is your trial balance correct?"
  scrutiny that can sink credibility on the core product.
- **Action:** Add an `accountingLedger` flag **[ASSUMPTION]** (none exists today),
  default OFF; nav-remove `accounting/ledger/**`; keep Money basics in nav;
  position `accounting_sync` add-on as the V1 answer. Apply the same to the supplier
  GL mirror (delete per §4).

---

## 7. Automation marketplace / canvas / webhooks (Zapier-class)

**Exists in code:** Yes — operator `(app)/app/automations/**`: `canvas`,
`canvas/[automationId]`, `webhooks`, `integrations`, `node-registry`, `usage`,
`usage-limits`, `templates`, `recipes`, `approvals`, `runs`, `ai-builder`,
`my-automations`. APIs: `api/automations/{definitions,dry-run,node-registry,nodes,
trigger/[token],webhooks,integrations,usage,recipes}`. Admin caps:
`(admin)/admin/automations/usage-caps`. Mirrored in supplier workspace. Flag:
**`canvasLite` only** (covers the *lite* board; there is **no flag for the full
canvas/webhooks/marketplace** scope).

**Liquidity / chicken-egg:** A template/integration *marketplace* would be
two-sided (builders ↔ users), but Propvora's near-term value is single-sided preset
automation. The full **visual canvas + webhooks + node registry + integration
marketplace** is a **Zapier/Make clone** — enormous support surface (every
integration is a maintenance contract) for marginal wedge value.

**GTM prerequisites:** For *lite* (recipes + approvals): none beyond V1.5 polish —
operators want "when cert expires → notify", "when rent late → chase". For the full
canvas/marketplace: an integration ecosystem and partner pipeline — a platform play.

**Staged release trigger:** **Automations-lite** (`canvasLite`, recipes, approvals)
ships in **V1.5** on its own merit. The **full canvas/webhooks/marketplace** waits
for V2 platform stage and evidence operators hit the limits of presets.

**V1 disposition:** **Split.** Automations-**lite** (recipes/approvals,
`canvasLite`) = Layer C-lite, **V1.5**. Full **canvas/webhooks/integrations/
node-registry/usage-marketplace** = Layer D, **flag OFF + nav-removed**.

- **Reason:** Presets deliver 80% of operator value at 5% of the support cost; the
  canvas is a product unto itself.
- **Risk:** Every exposed integration/webhook is a perpetual maintenance + security
  liability (webhook auth, third-party API drift).
- **Action:** Keep `canvasLite` for V1.5 lite surface. Add an `automationCanvas`
  flag **[ASSUMPTION]** (only `canvasLite` exists), default OFF, gating
  `automations/{canvas,webhooks,integrations,node-registry}`; nav-remove them; delete
  the supplier automation mirror (§4).

---

## 8. Summary matrix

| Bet | Code maturity | Liquidity start | Trigger to unlock | V1 disposition |
|---|---|---|---|---|
| 1. Consumer stays marketplace | High (mounted 3–4×) | Cold (guest side) | Operator direct-let density per metro | flag OFF + nav-removed; direct-booking = V1.5 on-ramp |
| 2. Public supplier marketplace | High | Warm-ish (endogenous demand) | Verified supplier density (3 quotes/req) | flag OFF + nav-removed; keep operator coordination (B) |
| 3. Emergency dispatch | Medium-high | Coldest + high liability | Contracted 24/7 metro coverage + SLA | flag OFF + nav-removed + foundation-only |
| 4. Independent supplier SaaS | Very high (112 routes) | N/A (single-sided, separate buyer) | Pull from portal suppliers | TRIM HARD; flag OFF; CUT mirrored GL/automations; split out |
| 5. Escrow / holds | High (full lib) | N/A (infra for 1–3) | Lights up with `marketplacePayments` | flag OFF + foundation-only; regulatory check first |
| 6. Full GL / ERP | High | N/A (scope, not liquidity) | Prefer never in-app; use Xero/QB sync | HIDE+FLAG; nav-remove ledger; keep Money basics + sync add-on |
| 7. Automation canvas/marketplace | Very high | N/A near-term | Operators exceed preset limits | Split: lite V1.5; canvas/webhooks flag OFF + nav-removed |

---

## 9. Findings → `19-founder-decision-lock.md`

1. **Two Layer-D bets have NO governing flag today:** the operator **GL/ledger**
   and the **full automation canvas/webhooks** (only `canvasLite` exists). They sit
   inside the always-on `(app)` group → they ship in V1 unless flags are added.
2. **Escrow and the payments lib are production-grade, not stubs** — real
   Connect-transfer/hold/release logic. High V2 value; regulatory clearance is the
   gate, not code.
3. **The supplier workspace duplicates the two heaviest operator bets** (full GL +
   automation canvas) — trimming it removes ~half the Layer-D maintenance tax.
4. **The consumer marketplace is mounted 3–4 times** across `(marketplace-public)`,
   `(public-booking)`, top-level `stays/`, and operator-internal `(app)/app/
   marketplace` — canonicalisation needed before any V2 flag-on.
5. **Direct-booking (`directBookingPages`) is the liquidity-free on-ramp** to the
   stays bet — it monetises the same code with zero platform demand, and belongs in
   V1.5, ahead of the open marketplace.
