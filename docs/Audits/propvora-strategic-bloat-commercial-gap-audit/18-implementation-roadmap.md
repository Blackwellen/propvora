# 18 — Implementation Roadmap (V1 → V1.5 → V2)

**Status:** Draft · 2026-06-18 · Author: product-strategy audit
**Conforms to:** `_shared-strategic-brief.md` §1 (Model 2), §3 (layers), §4 (route
targets), §5 (bands), §6 (flags/plans/infra).
**Reads with:** `02-product-strategy-saas-vs-platform.md`,
`15-marketplace-and-platform-bets.md`, `17-deprecation-plan` (flag config),
`16-release-gates` (gating criteria), `20-route-map`.

---

## 0. Roadmap shape

Three stages, each a sellable release, each gated by an evidence trigger from the
prior stage. **Nothing in a later stage is built from scratch — it is mostly
flag-on + polish of code that already exists.**

```
V1  WEDGE        → Focused paid UK property-ops + compliance SaaS (Layers A+B)
                   Flags wired OFF · nav collapsed to ≤8 · Layer-D hidden
        │  gate: paying operators retained + 30-sec clarity passes
        ▼
V1.5 PREMIUM     → Planning engine (C) · Automations-lite · Advanced compliance/AI
                   · Direct-booking on-ramp · Affiliates (payouts OFF)
        │  gate: premium attach rate + direct-let density forming
        ▼
V2  PLATFORM     → Layer-D flags ON per traction trigger
                   marketplace → customer → independent-supplier (each own GTM)
```

---

## 1. The decisive insight that shapes the whole plan

The flag registry is **built but inert** — no `src/app` route group calls
`isFeatureEnabled()` (verified: zero hits under `src/app`; `(customer)/layout.tsx`
gates by membership and declares "no feature flags";
`components/shells/workspace-shells.ts` is a "pure declarative scaffold [that]
changes NOTHING at runtime"). Therefore **V1's largest workstream is not building
features — it is (a) wiring the existing OFF flags to enforcement points, (b)
adding the two missing flags (`accountingLedger`, `automationCanvas`
[ASSUMPTION]), and (c) collapsing the nav.** This is config + plumbing scale, not a
rebuild — which is exactly why Model 2 is fast.

---

## 2. V1 — THE WEDGE (ship first, paid)

**Goal:** A self-managing portfolio landlord / small PM (5–150 units) understands
and buys the product in 30 seconds (brief §4). ≤8 sidebar items, zero ERP jargon.

**Visible surface target (brief §4):** operator (~120) + portals (~25) +
auth/onboarding (~12) + trimmed settings (~8) + public marketing (~15) + admin
(~45, internal) ≈ **~225 visible**; everything else in code, flag-hidden.

### Workstreams

| WS | Work | Layer | Depends on | Evidence |
|---|---|---|---|---|
| **W1 Flag enforcement** | Wire `(marketplace-public)`, `(public-booking)`, `(supplier-workspace)` layouts to call `isFeatureEnabled()` → `notFound()` when master flag OFF; add flag check to `(customer)/layout.tsx` alongside membership | infra | flag registry (exists) | route returns 404 with flags OFF |
| **W2 Missing flags** | Add `accountingLedger` + `automationCanvas` flags [ASSUMPTION] to `registry.ts` (default OFF); gate `(app)/app/accounting/ledger/**` and `(app)/app/automations/{canvas,webhooks,integrations,node-registry}` | infra | W1 pattern | ledger/canvas 404 when OFF |
| **W3 Nav collapse** | Reduce PM `SideNavigation.tsx` to ≤8 story items; remove Bookings, Listings, and repoint "Suppliers" off `/marketplace/suppliers-hub` to operator coordination | A | W1/W2 | ≤8 top-level items |
| **W4 Core depth** | Harden Layers A+B: Portfolio, Work/Maintenance, Compliance, Legal (core), Money basics, Documents, Messages, Calendar, Contacts, Portals | A/B | — | per-section gap files in `docs/Todos_gaps_requirements/**` closed |
| **W5 Calendar/Settings merge** | Calendar `views/*` → one view + toggles; merge fragmented Settings (brief §3) to clean tabs | A | W4 | route count down, 1 calendar route |
| **W6 Supplier trim** | CUT supplier GL + automation canvas + calendar-view explosion (doc 15 §4); keep `(portal)` supplier surface | D | W2 dependency check | mirrored modules deleted/archived |
| **W7 Pricing/entitlements** | Confirm 5-tier plans + entitlements gate correctly (`plans.ts`, `entitlements.ts`, `gates.ts`); `aiCopilot` Scale+, `advancedReports` Operator+ | A | — | seat/AI/storage gates enforce |
| **W8 Marketplace dedup** | Pick canonical consumer-marketplace mount (brief: public StayCard); archive redundant `stays/`,`services/`,`providers/` duplicates after dependency check | D | W1 | one canonical mount |

### V1 → V1.5 gating criteria (ties to doc 16)
- Flags-OFF audit: **no Layer-D surface reachable** (URL test + nav test).
- 30-second clarity: ≤8 nav items, no ERP jargon on surface.
- Paying operators onboarded and **retained** past first renewal cohort.
- Green build + `node scripts/audit-queries.mjs` = 0 (schema alignment, per MEMORY).

---

## 3. V1.5 — PREMIUM (the differentiator + margin)

**Goal:** Convert wedge users to higher tiers via depth they will pay for.

| WS | Work | Layer | Flag/entitlement | Depends on |
|---|---|---|---|---|
| **P1 Planning engine** | Surface `(app)/app/planning/**` as the premium hook; simplify entry (wizard); price as Scale+ module | C | entitlement (advancedReports/new `planning`) | V1 stable core |
| **P2 Automations-lite** | Recipes + approvals only (`canvasLite` ON); canvas/webhooks stay OFF | C-lite | `canvasLite` | W2 flags |
| **P3 Advanced compliance/legal** | RRA-2026 possession workflows, HMO licence depth as premium gate | C (from A core) | entitlement | V1 compliance core |
| **P4 AI Copilot/inbox** | `aiCopilot` entitlement (already Scale+ in `plans.ts`); cost controls via `(admin)/admin/ai-usage` | C | `aiCopilot` | P1 data |
| **P5 Direct-booking on-ramp** | `directBookingPages` + `bookingManagement` (operator's own guests, no platform liquidity) | B/C | `directBookingPages`,`bookingManagement` | W1 flag wiring |
| **P6 Affiliates** | `(app)/app/affiliates` ON; **payouts flag OFF** (per MEMORY affiliate programme) | B/C | payouts OFF | — |

**Brief §4 target:** V1.5 adds ~+50 visible routes (Planning + Automations-lite +
advanced compliance/AI).

### V1.5 → V2 gating criteria
- Premium **attach rate** on Scale+/Pro meaningful (founder threshold).
- Direct-let **density forming** in ≥1 metro (the stays-marketplace precondition,
  doc 15 §1).
- Verified-supplier **density forming** per trade×metro (supplier-marketplace
  precondition, doc 15 §2).
- AI cost per active user within target (admin AI-usage telemetry).

---

## 4. V2 — PLATFORM (Layer-D flags ON, per trigger)

**Goal:** Light up the platform sides — but **only on their individual traction
triggers** (doc 15), each with its **own GTM and liquidity plan**. Never all at
once (that is Model 3, rejected).

**Sequencing (least-cold first):**

| Order | Bet | Flag(s) | Unlock trigger (doc 15) | Own GTM needed |
|---|---|---|---|---|
| 1 | Public **supplier** marketplace | `marketplaceEnabled`+`marketplaceSuppliers` | Verified supplier density (3 quotes/req) | supplier acquisition |
| 2 | Consumer **stays** marketplace | +`marketplaceStays` | Operator direct-let density per metro | consumer acquisition (SEO/partner) |
| 3 | **Payments + escrow** | `marketplacePayments`+`marketplaceEscrow` | Lights up *with* first paid flow; **regulatory clearance** | FCA/safeguarding check (doc 15 §5) |
| 4 | **Disputes** | `marketplaceDisputes` | After payments live | trust/ops |
| 5 | **Customer** workspace | `customerWorkspace` + membership | Consumer demand proven via stays | consumer onboarding |
| 6 | **Independent supplier** SaaS | `supplierWorkspace` | Pull from portal suppliers | **separate product motion** |
| 7 | **Emergency** dispatch | `marketplaceEmergency` | Contracted 24/7 metro coverage + SLA | managed-ops, highest bar |
| 8 | **Full GL** | `accountingLedger` | **Prefer never** in-app; ship Xero/QB sync instead | — |
| 9 | **Automation canvas** | `automationCanvas` | Operators exceed preset limits | integration ecosystem |

**Brief §4 target:** V2 = ~+300 routes already built behind flags switched ON
incrementally.

### V2 gating criteria (per bet, not blanket)
- Liquidity floor met for *that* bet's market (non-empty search / 3-quotes).
- GTM + acquisition channel funded and live for *that* side.
- Regulatory/legal clearance where money is held (escrow) or safety promised
  (emergency).
- Admin control-plane ready: moderation, disputes, payouts, verification (all exist
  under `(admin)/admin/marketplace/**` and `supplier-verification`).

---

## 5. Dependency graph (critical path)

```
W1 flag enforcement ─┬─> W2 missing flags ─┬─> W3 nav collapse ─> V1 ship
                     │                     └─> W6 supplier trim
                     └─> W8 marketplace dedup
W4 core depth ──> W5 merge ──> V1 ship
                                  │
                                  ▼
                 P1 Planning ─┬─ P3 advanced compliance ─┬─> V1.5 ship
                 P2 auto-lite ┘ P4 AI ─ P5 direct-booking ┘
                                  │
                                  ▼
                 (density triggers) ─> V2 bet 1 (suppliers) ─> bet 2 (stays)
                                       ─> 3 payments/escrow ─> 4 disputes
                                       ─> 5 customer ─> 6 supplier-SaaS ─> 7 emergency
```

**Hard ordering rules:**
- No V2 bet flips ON before V1 flag-enforcement (W1) exists — otherwise "OFF" is
  meaningless.
- Escrow (`marketplacePayments`/`marketplaceEscrow`) **cannot** precede a live
  marketplace flow nor regulatory clearance.
- Emergency is **always last** (liability + thinnest liquidity).
- The full GL is **deferred indefinitely** in favour of the `accounting_sync`
  add-on already in `plans.ts`.

---

## 6. Tie-in to deprecation plan (17) and release gates (16)

- **Doc 17 (deprecation):** is *mostly flag config* (brief §6) — but W1/W2 above are
  the prerequisite that makes that config *bite*. Doc 17 should enumerate the
  per-route flag assignments; this roadmap supplies the *order* and the two missing
  flags it must add.
- **Doc 16 (release gates):** the V1→V1.5 and V1.5→V2 gating criteria in §2–§4 are
  the input. Add a **flags-OFF reachability test** to the V1 gate, and a
  **per-bet liquidity + regulatory checklist** to the V2 gate (esp. escrow §5,
  emergency §3 in doc 15).

---

## 7. Findings → `19-founder-decision-lock.md`

1. **V1's biggest workstream is plumbing, not features:** wiring inert flags to
   enforcement points + adding two missing flags (`accountingLedger`,
   `automationCanvas`) + nav collapse. This is why Model 2 ships fast.
2. **Two missing flags block a clean V1 cut** — the operator GL and the automation
   canvas have no governing flag and sit in the always-on `(app)` group.
3. **Supplier-trim (W6) removes ~half the Layer-D maintenance tax** by deleting the
   mirrored GL + automation engine — do it in V1, not later.
4. **Direct-booking (P5) is the correct first booking step** — liquidity-free,
   monetises the stays code, belongs in V1.5 ahead of the open marketplace.
5. **V2 must be sequenced bet-by-bet on individual triggers**, not flipped as a
   block — supplier-marketplace first (warmest), emergency last (coldest + highest
   liability), full GL preferably never in-app.

---

## 8. Contradictions logged against the brief

- Brief §6: "deprecation = mostly flag config, not code deletion." **Refined:** true
  for the catalogue, but flags are currently **inert** (no enforcement) and **two
  Layer-D surfaces have no flag at all**, so V1 also requires one-time wiring +
  two new flags. Still config-scale; not a rebuild. → reconcile in doc 19.
- Brief §3 maps `customerWorkspace` as the customer gate; **the code gates by
  membership and declares "no feature flags"** (`(customer)/layout.tsx`). Decide:
  add the flag (brief intent) or accept membership-only gating. → reconcile in 19.
