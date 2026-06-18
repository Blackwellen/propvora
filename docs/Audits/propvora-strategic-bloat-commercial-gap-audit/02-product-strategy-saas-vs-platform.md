# 02 — Product Strategy: Focused SaaS vs Property OS vs Platform

**Status:** Draft · 2026-06-18 · Author: product-strategy audit
**Conforms to:** `_shared-strategic-brief.md` §1 (verdict = Model 2 / staged OS),
§3 (layer map), §4 (route targets), §6 (infra facts).
**Sibling docs:** `15-marketplace-and-platform-bets.md` (Layer D detail),
`17-deprecation-plan` (flag config), `16-release-gates`, `18-implementation-roadmap.md`.

---

## 0. TL;DR

Propvora today is **physically a full multi-sided platform** — operator app,
consumer/customer workspace, public stays-booking, public supplier marketplace,
emergency dispatch, escrow, an independent supplier-as-SaaS workspace (with its
own double-entry GL and Zapier-class automation canvas), affiliates, and a real
admin control plane. The code exists. The route groups exist
(`src/app/(marketplace-public)`, `(public-booking)`, `(customer)`,
`(supplier-workspace)`). **What does NOT yet exist is the staging discipline that
turns that platform into a sellable, sequenced product.**

The correct strategy is **Model 2 — a STAGED property operating system**: ship a
focused, paid UK property-operations + compliance SaaS *wedge* for operators,
keep the platform layers in code behind the feature flags that already exist
(`src/lib/flags/registry.ts`), and release them in stages once the wedge has
traction and a liquidity plan. This document defines the four layers, maps every
module, scores the three candidate models, and specifies the Layer-D disposition.

**The single most important finding (see §6):** the flag registry is built and
defaults OFF, the admin toggle UI writes to `platform_feature_flags`, **but no
route group actually consumes `isFeatureEnabled()`**. The staging is *designed*
but **not wired**. Model 2 is therefore mostly a *wiring + nav* job, not a
rebuild — exactly as the brief predicts (§6: "the deprecation plan is mostly flag
config, not code deletion"), with one correction: today it is flag config that
must first be *connected*, because the flags are currently inert.

---

## 1. What is Propvora, really? (four candidate identities)

| Identity | Definition | Does the code support it? | Verdict |
|---|---|---|---|
| **Focused SaaS** | One workspace (operator), one buyer, compliance+ops+money only | Yes — the `(app)` operator group is the spine | Too small alone — discards the planning USP and real platform optionality |
| **Property OS** | Operator core + tenant/landlord/supplier portals as one operating fabric, planning as premium | Yes — `(app)` + `(portal)` + planning engine + suppliers coordination all present | **This is the V1–V1.5 product** |
| **Multi-sided platform (now)** | Operators + consumers + independent suppliers + marketplace liquidity, all live at launch | Physically yes (all route groups exist) — commercially no (4 cold starts, no liquidity) | **Reject at launch** (Model 3) |
| **Staged platform** | Property OS first; consumer/supplier/marketplace sides flag-gated and released on traction triggers | Yes — flag registry + workspace-type shells designed for exactly this | **RECOMMEND (Model 2)** |

Propvora is **a staged property operating system**: a property OS at the surface
(Layers A+B), a premium planning/AI hook (Layer C), and a platform option (Layer
D) held in code behind flags until it is earned.

---

## 2. The four-layer model (canonical)

The brief (§3) fixes a binding module→layer table. The four layers are:

- **Layer A — Core SaaS (the wedge, V1, always-on, no flag):** the irreducible
  operator product a self-managing landlord / small PM pays for on day one.
  Portfolio, Work/Maintenance, Compliance (core), Legal (core), Money basics,
  Documents, Messaging, Calendar, Contacts, trimmed Settings. **Sell this first.**
- **Layer B — Extensions (V1, retention engine):** surfaces that deepen the
  paying operator's workflow and lock them in. Tenant / landlord / supplier
  **portals**, operator-side **supplier coordination**. These are not separate
  products — they are the operator's workflow reaching outward.
- **Layer C — Premium (V1.5, the differentiator + margin):** the **Planning
  engine** (multi-profile strategy/profitability), **AI Copilot/inbox**,
  **advanced compliance/legal** depth, **automations-lite** (preset recipes +
  approvals, `canvasLite`). This is what makes Propvora *more than admin* and what
  justifies Scale/Pro pricing.
- **Layer D — Platform bets (V2, flag-gated cold starts):** consumer stays-booking
  marketplace, public supplier/services marketplace, emergency dispatch, the
  **independent supplier-as-SaaS** workspace, **escrow**, the **full double-entry
  accounting GL**, the **automation marketplace/canvas/webhooks**, the **customer
  workspace**. Each needs its *own* GTM and liquidity — do not let any of them
  dilute the V1 story.

### 2.1 Module → layer assignment (expanded from brief §3, grounded in routes)

| Module / surface | Route evidence | Layer | V‑stage | Disposition | Reasoning |
|---|---|---|---|---|---|
| Portfolio / Properties / Units / Tenancies | `(app)/app/portfolio` | **A** | V1 | KEEP | The asset graph everything hangs off; no product without it |
| Work / Tasks / Maintenance / PPM | `(app)/app/work` | **A** | V1 | KEEP | Highest-frequency operator pain (maintenance chaos) |
| Compliance (certs, HMO, inspections, deposits) | `(app)/app/compliance` | **A** (advanced → C) | V1 | KEEP | UK regulatory depth = the moat (brief §2.1) |
| Legal (possession/RRA‑2026, HMO licences) | `(app)/app/legal` | **A/C** | V1 core, advanced V1.5 | KEEP, gate advanced | Buying trigger = compliance anxiety; advanced workflows are premium |
| Money basics (rent, arrears, invoices, expenses, owner statements, payouts) | `(app)/app/money` | **A** | V1 | KEEP | Operator must run the money here |
| **Accounting full GL** (journal, trial-balance, chart, MTD, reconciliation) | `(app)/app/accounting`, mirrored at `(supplier-workspace)/supplier/accounting/ledger/{chart,journal,trial-balance}`, `/mtd` | **D** | V2 / integration | **HIDE+FLAG** | In-app ERP is a different product; position as Xero/QuickBooks **integration** (`accounting_sync` add-on already exists in `plans.ts`) |
| Documents / storage | `(app)/app/documents` | **A** | V1 | KEEP | Evidence/audit trail is a first-class USP citizen |
| Messaging / inbox | `(app)/app/messages` | **A** | V1 | KEEP | Operator comms hub |
| Calendar | `(app)/app/calendar` | **A** | V1 | KEEP, **MERGE views to toggles** | Supplier mirror shows the overbuild: `calendar/views/{agenda,day,gantt,month,week}` are 5 routes that should be 1 view + toggles |
| Contacts | `(app)/app/contacts` | **A** | V1 | KEEP (simplify) | Core CRM, sub-pages overbuilt |
| Suppliers — operator coordination | `(app)/app/work/suppliers`, `/app/suppliers/directory` | **B** | V1 | KEEP | Operator dispatches/tracks work; this is workflow, not marketplace |
| **Planning engine** | `(app)/app/planning/**` (profiles, sets, scenarios, forecasts, wizard, landlord-offers, yield-intelligence) | **C** | V1.5 | **PROTECT / SPLIT-OUT as premium** | The differentiator. ~40 routes already built. Price as premium; simplify entry |
| Automations — recipes/approvals | `(app)/app/automations/{recipes,approvals,home}` | **C‑lite** | V1.5 | KEEP small (`canvasLite`) | Operator value without Zapier scope |
| Automations — canvas/webhooks/integrations/usage/marketplace | `(app)/app/automations/{canvas,webhooks,integrations,usage,usage-limits,node-registry…}` | **D** | V2 | HIDE+FLAG | This is a Zapier clone; a product unto itself |
| Bookings / Listings — direct-let ops | `(app)/app/bookings/**`, `(app)/app/listings` | **B/C** | V1.5 | gated (`bookingManagement`) | Direct-let is real but not the V1 wedge story |
| Portals — tenant / landlord / supplier | `(portal)/portal/[sessionId]/**`, `(tenant)`, `(landlord)` | **B** | V1 | KEEP | Retention/lock-in engine |
| **Customer/guest workspace** | `(customer)/customer/**` (~55 routes: stays, lets, bookings, maintenance, payments, affiliate) | **D** | V2 | **HIDE** (`customerWorkspace` OFF) | Consumer side = separate GTM + liquidity |
| **Independent Supplier workspace** | `(supplier-workspace)/supplier/**` (~112 routes incl. own GL + automation canvas) | **D/C** | V2 | **TRIM HARD** | In V1 suppliers act via portal + operator coordination; CUT mirrored accounting/automations/calendar |
| **Marketplace** (stays/suppliers/emergency/escrow/disputes) | `(marketplace-public)/marketplace/**`, `(app)/app/marketplace/**`, `(app)/app/money/escrow` | **D** | V2 | KEEP CODE, `marketplaceEnabled` OFF | Four-sided liquidity problem; see doc 15 |
| Public booking / stays / services / providers / emergency | `(public-booking)/**`, top-level `stays/`, `services/`, `providers/`, `emergency/` | **D** | V2 | flag OFF | Consumer acquisition surface — no demand yet |
| Affiliates | `(app)/app/affiliates`, `affiliate-programme/**` | **B/C** | V1.5 | KEEP, payouts flag OFF | Growth lever; keep, don't pay out yet |
| AI Copilot / inbox | gated by `aiCopilot` entitlement (`plans.ts`) | **C** | V1.5 | gate by entitlement | Already entitlement-gated on Scale+ — good |
| Platform Admin | `(admin)/admin/**` (~50 routes) | **Ops** | V1 | KEEP | Genuine control plane — internal, NOT customer nav |
| Settings (workspace/account/billing/AI/integrations/security) | `(app)/app/workspace-settings`, `/workspace/billing` | **A** | V1 | **MERGE** to clean tabs | Currently fragmented |

---

## 3. The three models — scored

Scoring 1–10 (10 = best outcome for that dimension; for **Risk**, **Build/Support/
GTM complexity** and **Operational burden**, 10 = *least* burden/risk, i.e. higher
is always better). "Recommended stage" = where each model belongs on the roadmap.

### Model 1 — Focused SaaS
*Operator-only compliance+ops+money. Cut/delete planning, marketplace, customer,
supplier-SaaS. The "small generic SaaS".*

### Model 2 — Staged Property OS  *(RECOMMENDED)*
*Layers A+B live (V1), Layer C premium (V1.5), Layer D in code behind flags,
released on traction triggers. Win one paying buyer with depth, then expand into
the sides already built.*

### Model 3 — Full multi-sided platform (now)
*Operators + consumers + independent suppliers + marketplace all live at launch.
Four cold starts simultaneously.*

| Dimension | M1 Focused SaaS | M2 Staged OS | M3 Full Platform | Notes |
|---|---:|---:|---:|---|
| **Launch speed** | 8 | **7** | 2 | M2 slightly slower than M1 (must wire flags + trim), far faster than M3 |
| **Build complexity** (10=simplest) | 7 | **6** | 2 | M2 = flag-wire + nav-collapse; M3 = finish + harden 4 sides + liquidity infra |
| **Support complexity** (10=lowest) | 8 | **7** | 2 | Each Layer-D side multiplies support surface (disputes, escrow, refunds) |
| **Customer clarity** (30-sec test, brief §4) | 8 | **8** | 2 | M1/M2 both tell one story in ≤8 nav items; M3 is unsellable clarity |
| **Revenue potential** | 4 | **8** | 9 | M3 has highest ceiling *if liquidity lands*; M2 captures operator ARR now + platform optionality |
| **Investor / unicorn potential** | 3 | **8** | 7 | M1 caps the story (vertical SaaS); M2 = "wedge into platform" (the YC-preferred arc); M3 = ambitious but un-derisked |
| **Risk** (10=lowest risk) | 7 | **7** | 2 | M1 strategic risk (throws away moat/optionality); M3 execution+liquidity risk |
| **Differentiation** | 5 | **9** | 8 | M2 protects planning USP + UK compliance moat; M1 discards planning |
| **GTM difficulty** (10=easiest) | 7 | **7** | 2 | One buyer, one message for M1/M2; M3 needs 4 GTMs at once |
| **Data-moat potential** | 4 | **8** | 9 | M2 accrues operator + compliance + planning data now, platform graph later |
| **Operational burden** (10=lowest) | 8 | **6** | 2 | M2 carries flag-hidden code (low cost, tolerant accessor) but must keep it green |
| **TOTAL** (higher = better) | **69** | **82** | **39** | |

**Model 2 wins decisively (82 vs 69 vs 39).** It does not throw away the moat or
optionality (M1's fatal flaw) and does not attempt four un-derisked cold starts
(M3's fatal flaw).

---

## 4. Why Model 2 — rigorous justification

1. **The architecture was built for it (brief §6).** The flag registry
   (`src/lib/flags/registry.ts`) enumerates exactly the staging seams:
   `marketplaceEnabled` (master), the six `marketplace*` sub-flags,
   `bookingManagement`, `directBookingPages`, `customerWorkspace`,
   `supplierWorkspace`, `icalSync`, `canvasLite`, `multiCountryPortfolio`,
   `globalCountryPacks`, `contextEngine`. Every flag `defaultEnabled: false`. The
   accessor (`src/lib/flags/index.ts`) is *tolerant by design* — missing tables /
   RLS / errors all collapse to OFF, so flag-hidden surface is also fail-closed.
   Model 2 is the strategy the codebase already encodes.

2. **The USP survives only under M2.** M1 cuts the **planning engine**
   (`(app)/app/planning/**`, ~40 routes) — the differentiator that makes Propvora
   more than an admin tool (brief §2.1.2). M3 buries it under marketplace noise.
   M2 *protects* it as the Layer-C premium hook.

3. **The UK compliance moat needs depth, not breadth.** The buying trigger is
   compliance anxiety (RRA-2026, HMO licensing, cert expiries — brief §2). That is
   won by depth in `(app)/app/compliance` + `/legal`, not by adding a consumer
   stays marketplace. M2 lets the team pour effort into the moat; M3 splits it
   four ways.

4. **Liquidity cannot be faked.** Every Layer-D bet is a chicken-and-egg market
   (doc 15). Launching them cold (M3) means empty marketplaces that *erode* trust.
   M2 defers each until a traction trigger justifies it.

5. **The 30-second clarity test (brief §4).** A new operator must understand the
   product in 30 seconds → ≤8 top-level nav items, zero ERP jargon. The current PM
   nav (`src/components/shell/SideNavigation.tsx`) already over-exposes Layer-D in
   CORE (Bookings, Listings, Suppliers-hub are nav-visible today). M2's nav
   collapse fixes this; M3 makes it impossible.

6. **Investor arc.** "Vertical wedge → property operating system → multi-sided
   platform" is the credible venture narrative. M1 caps at vertical SaaS; M3 asks
   investors to fund four cold starts on faith. M2 derisks each expansion with the
   prior stage's traction.

**Contradiction to log (→ `19-founder-decision-lock.md`):** the brief §6 states
"the deprecation plan is mostly flag config, not code deletion." **Verified true
for the catalogue, but the flags are currently inert** — no `src/app` route group
calls `isFeatureEnabled()` (grep returns zero hits under `src/app`; only
`gates.ts`, `customer/data.ts`, `admin/*`, `workspace-shells.ts` reference the
flag module, and `workspace-shells.ts` is self-described as a "pure declarative
scaffold [that] changes NOTHING at runtime"). The `(customer)` layout gates by
`customer_workspace_members` membership and its own docstring says "integrated
into core — **no feature flags**." So Model 2's V1 cut is **flag config PLUS the
one-time wiring that connects those flags to the route-group layouts and nav**.
This is still config-scale, not a rebuild — but it is not zero. [VERIFY] confirm
no per-page flag reads exist outside `src/app` that I have not located.

---

## 5. Layer D disposition — what happens to each piece in V1

Per the brief's decision bands (§5). Detailed per-bet analysis is in
`15-marketplace-and-platform-bets.md`; this is the V1 disposition summary.

### 5.1 Foundation that STAYS in V1 (code present, surface hidden)
- The **entire flag registry + tolerant accessor + admin toggle UI**
  (`registry.ts`, `index.ts`, `platform_feature_flags` table,
  `(admin)/admin/settings`). Keep — this *is* the staging machine.
- The **workspace-type shell map** (`components/shells/workspace-shells.ts`) — keep
  as the routing scaffold for when sides light up.
- All Layer-D **route group code** stays in the repo, compiled, green, untouched.

### 5.2 What HIDES behind flags (master switches OFF in V1)
| Surface | Flag(s) to enforce OFF | Action needed |
|---|---|---|
| Consumer stays-booking marketplace | `marketplaceEnabled` + `marketplaceStays` | **Wire** layout to call `isFeatureEnabled` → `notFound()` when OFF |
| Public supplier/services marketplace | `marketplaceEnabled` + `marketplaceSuppliers` | Same wiring at `(marketplace-public)/layout.tsx` |
| Emergency dispatch | `marketplaceEmergency` | Gate `emergency/`, `(marketplace-public)/marketplace/emergency` |
| Escrow / holds | `marketplaceEscrow` | Gate `(app)/app/money/escrow`, `work/orders/escrow` |
| Disputes | `marketplaceDisputes` | Gate `(app)/app/bookings/disputes/**` |
| Payments capture | `marketplacePayments` | Gate marketplace checkout routes |
| Public booking / direct-let consumer pages | `bookingManagement`, `directBookingPages`, `icalSync` | Gate `(public-booking)/**` |
| Customer/guest workspace | `customerWorkspace` (today: membership only) | Add flag check to `(customer)/layout.tsx` alongside membership |
| Independent supplier workspace (expanded) | `supplierWorkspace` | Gate `(supplier-workspace)/**`; portal stays |
| Automation canvas/webhooks/marketplace | (no flag yet — `canvasLite` only covers lite) | **[ASSUMPTION]** add a `automationCanvas` flag or fold canvas behind `canvasLite=false` |

### 5.3 What is NAV-REMOVED in V1 (route kept, link cut)
- PM nav CORE today shows **Bookings, Listings, Suppliers-hub** as top-level items
  (`SideNavigation.tsx` lines 78–80) — these are Layer B/D surfaces. **Remove
  Bookings + the suppliers-hub *marketplace* link from V1 nav**; keep operator-side
  Suppliers coordination only. Collapse to the brief's ≤8 story items.
- Supplier nav already unlinks `/supplier/marketplace` (good precedent, `nav.ts`
  line 54–56) — apply the same "kept but unlinked" pattern to all Layer-D surfaces.

### 5.4 What needs TRIMMING (over-built mirror, V1)
- **Supplier workspace double-entry GL** (`/supplier/accounting/ledger/{chart,
  journal,trial-balance}`, `/mtd`, `/reconciliation`, `/forecast/scenarios`) — CUT
  from the supplier surface; suppliers do not need an ERP. Mirrors the operator GL
  which is itself Layer D.
- **Supplier automation canvas/webhooks/integrations** — CUT (mirror of the
  operator Zapier-clone).
- **Supplier calendar `views/{agenda,day,gantt,month,week}`** — MERGE to one view +
  toggles. Same overbuild exists operator-side.

### 5.5 What is DEFERRED to roadmap (V2, own GTM/liquidity)
- Consumer stays marketplace, public supplier marketplace, emergency dispatch:
  each needs its **own GTM + two-sided liquidity plan** before flag-on (doc 15).
- **Independent supplier-as-SaaS** = effectively a **separate product/app** — split
  out, give it its own positioning and acquisition; do not let it ride operator GTM.

### 5.6 What is SPLIT-OUT (a product hiding inside)
- **Planning engine** → premium module (Layer C), priced separately, simplified
  entry. It is differentiated enough to be its own SKU.
- **Independent Supplier SaaS** → future standalone app with its own GTM/liquidity.

### 5.7 What is DELETE/ARCHIVE (verify no dependency first)
- Genuine duplicates only — e.g. parallel marketplace mounts: the *consumer*
  marketplace exists in BOTH `(marketplace-public)/marketplace/**` AND
  `(public-booking)/**` AND top-level `stays/ services/ providers/`; and AGAIN as
  operator-internal `(app)/app/marketplace/**`. **[VERIFY]** which is canonical
  before deleting; the brief names `public-marketplace StayCard` as canonical (per
  MEMORY: marketplace-unification). Archive the redundant mounts after dependency
  check. Do not delete the canonical Layer-D code — it ships in V2.

### 5.8 Roadmap (one line; full detail in doc 18)
**V1** Layers A+B + flags wired OFF + nav collapsed to ≤8.
**V1.5** Layer C on (Planning premium, Automations-lite, advanced compliance/AI).
**V2** Layer D flags ON per traction trigger (marketplace → customer →
independent-supplier), each with its own GTM/liquidity gate.

---

## 6. Findings that feed `19-founder-decision-lock.md`

1. The flag **catalogue** is real and defaults OFF, but the flags are **inert** —
   no route group consumes `isFeatureEnabled()`. Staging is designed, not wired.
2. The `(customer)` workspace is gated by **membership, not flag**, and explicitly
   declares "no feature flags" — diverges from the brief's `customerWorkspace`
   intent.
3. Layer-D surface leaks into V1 nav today (Bookings/Listings/Suppliers-hub in PM
   CORE) — the 30-second clarity test fails as shipped.
4. The supplier workspace duplicates the operator's two heaviest Layer-D bets (full
   GL + automation canvas) — double the trim work, double the support surface.
5. The consumer marketplace is mounted **3–4 times** across route groups — a
   dedup/canonicalisation decision is required before V2.
