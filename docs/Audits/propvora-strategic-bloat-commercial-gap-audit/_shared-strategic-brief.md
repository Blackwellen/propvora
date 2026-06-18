# Shared Strategic Brief — Canonical Spine (read before authoring any audit doc)

**Status:** Approved baseline · 2026-06-18 · this brief is the single source of
truth for the audit pack. Every document in this folder must align to the verdict,
layer model, USP, and route targets below. If a document's findings contradict
this brief, the author must flag the contradiction explicitly (do not silently
diverge) so it can be reconciled in `19-founder-decision-lock.md`.

---

## 1. Verdict (the answer to the core question)

Propvora is **best positioned as a STAGED property operating system** — i.e.
**Model 2**: launch a focused, paid **UK property-operations + compliance SaaS
wedge** for operators first, and keep the marketplace / consumer / independent-
supplier layers **in code behind the existing master feature flags**, released in
stages once the wedge has traction and liquidity plans exist.

This is not a downgrade to a "small generic SaaS". It is the *correct sequencing*
of a genuine platform: win one paying buyer with depth, then expand into the
adjacent sides you have already built. Crucially, **the architecture already
supports this** — see §6.

**Reject:** Model 1 (pure narrow SaaS — throws away real platform optionality and
the planning USP) and Model 3 (full multi-sided platform at launch — four cold
starts, no liquidity, diluted story, slow, unsellable clarity).

---

## 2. The wedge, the buyer, the USP

- **Wedge (sell first):** *"Run your UK lettings/property operation — compliance,
  maintenance, money and portals — in one place, without spreadsheets, Fixflo and
  Landlord Vision bolted together."*
- **First buyer (V1 ICP):** the **self-managing portfolio landlord & small
  letting agent / property manager, ~5–150 units**, often with HMO / student / SA
  exposure. Budget owner = the operator themselves. Buying trigger = compliance
  anxiety (Renters' Rights Act 2026, HMO licensing, cert expiries) + maintenance
  chaos + arrears chasing.
- **Real USP (protect at all costs):**
  1. **UK regulatory depth** — compliance/legal: HMO licensing, possession (RRA-
     2026), certificates, deposits, evidence/audit trail. This is a *moat*;
     generic global tools and Airbnb-style booking do not have it.
  2. **Property strategy & profitability PLANNING engine** — multi-profile deal
     analysis (HMO, R2R, SA/serviced accommodation, student, BRRR, lease option,
     assisted sale, flip, commercial/mixed-use). This is the differentiator that
     makes Propvora *more* than an admin tool. **Do not cut — make it the premium
     hook (Layer C).**
  3. **Operator ↔ tenant ↔ landlord ↔ supplier portals** — one operating fabric
     that extends the paying operator's workflow (Layer B).
  4. **AI-assisted operations** + documentation/evidence as a first-class citizen.

---

## 3. Layer model — canonical module assignment

Every workspace/feature MUST be mapped to exactly one primary layer. This table is
binding for `02`, `07`, `08`, `10`, `15`, `17`, `18`.

| Module / surface | Layer | V‑stage | Disposition |
|---|---|---|---|
| Portfolio / Properties / Units / Tenancies | **A** | V1 | KEEP |
| Work / Tasks / Jobs / Maintenance | **A** | V1 | KEEP |
| Compliance (certs, HMO, inspections, deposits) | **A** | V1 | KEEP (core); advanced → C |
| Legal (possession/RRA‑2026, HMO licences) | **A/C** | V1 core, advanced V1.5 | KEEP, gate advanced |
| Money basics (rent, arrears, invoices, expenses, owner statements, deposits, payouts) | **A** | V1 | KEEP |
| **Accounting full double‑entry GL** (journal, trial‑balance, chart, MTD, reconciliation) | **D** | V2 / integration | **HIDE+FLAG**; position as Xero/QuickBooks **integration**, not in‑app ERP |
| Documents / storage | **A** | V1 | KEEP |
| Messaging / inbox | **A** | V1 | KEEP |
| Calendar | **A** | V1 | KEEP but **MERGE views to toggles** (not N routes) |
| Contacts | **A** | V1 | KEEP (simplify sub‑pages) |
| Suppliers — operator‑side coordination | **B** | V1 | KEEP |
| **Planning engine** (multi‑profile strategy/profitability) | **C** | V1.5 | **PROTECT**, price as premium, simplify entry; do NOT cut |
| Automations — preset recipes / approvals | **C‑lite** | V1.5 | KEEP small (`canvasLite` flag) |
| Automations — full canvas/webhooks/integrations/usage/marketplace | **D** | V2 | HIDE+FLAG (Zapier‑clone scope) |
| Bookings / listings — direct‑let ops | **B/C** | V1.5 | gated |
| Portals — tenant / landlord / supplier | **B** | V1 | KEEP (retention engine) |
| **Customer/guest workspace** (consumer) | **D** | V2 | HIDE (`customerWorkspace` flag OFF) |
| **Independent Supplier workspace** (supplier‑as‑SaaS) | **D/C** | V2 | TRIM hard; in V1 suppliers act via portal + operator coordination; mirrored accounting/automations/calendar = CUT from supplier |
| **Marketplace** (stays/suppliers/emergency/escrow/disputes) | **D** | V2 | KEEP CODE, `marketplaceEnabled` OFF for V1 |
| Public booking / stays / services / providers / emergency (consumer) | **D** | V2 | flag OFF |
| Affiliates | **B/C** | V1.5 | KEEP, payouts flag OFF |
| AI Copilot / inbox | **C** | V1.5 | gate by `aiCopilot` entitlement |
| Platform Admin | **Ops** | V1 | KEEP (control plane — internal, not customer nav) |
| Settings (workspace/account/billing/AI/integrations/security/etc.) | **A** | V1 | **MERGE** 45 routes → clean tabbed structure |

---

## 4. Route‑count targets (binding for `07`, `10`, `18`, `20`)

- **Current non‑admin route files:** ~670 (incl. ~50 marketing/legal). Operator
  app alone = 350; supplier workspace = 112.
- **V1 — operator‑visible primary nav:** tell the story in **8 sidebar items**;
  collapse to **~110–130 visible operator routes** (rest merged or flag‑hidden).
- **V1 total shipped surface (visible):** operator (~120) + portals (~25) +
  auth/onboarding (~12) + trimmed settings (~8) + public marketing (~15) +
  internal admin (~45, not customer nav) ≈ **~225 visible**, the rest **in code,
  flag‑hidden**.
- **V1.5:** +Planning premium, +Automations‑lite, +advanced compliance/AI (~+50).
- **V2 platform:** marketplace + customer + independent‑supplier flags ON (~+300
  already built behind flags).
- **The number that matters commercially:** a new operator must understand the
  product in **30 seconds** → ≤8 top‑level nav items, zero ERP jargon on the
  surface.

---

## 5. Scoring rubric (use verbatim in `07` bloat analysis)

Score every major feature 1–10 on: Customer‑pain, Revenue, USP, Frequency,
Complexity, Support‑burden, Data/compliance‑risk, Launch‑readiness, Nav‑clarity,
Strategic‑fit. Decision bands:
- **KEEP**: high pain/USP/frequency, V1 ready.
- **KEEP BUT SIMPLIFY**: valuable but overbuilt (e.g. calendar, settings, contacts).
- **MERGE**: duplicate/fragmented (calendar views, settings, suppliers vs suppliers‑hub).
- **HIDE/FLAG**: future value, not launch nav (marketplace, customer ws, full GL, automation canvas).
- **DEFER**: roadmap (consumer booking, emergency marketplace).
- **SPLIT OUT**: a separate product hiding inside (Planning engine = premium module; independent Supplier SaaS = future app).
- **DELETE/ARCHIVE**: decorative/duplicate only (verify no dependency first).

---

## 6. Infrastructure facts (cite these; do not re‑derive)

- **Framework:** Next.js 16 App Router (route groups), React 19, Tailwind v4
  (light only, zero `dark:`), TypeScript strict, Supabase (Postgres + RLS),
  Stripe, Vercel. Auth guard = `src/proxy.ts` (Next 16 renamed middleware→proxy).
- **Live schema:** **431 tables (+42 enums)** (`docs/final-wiring/live-schema.md` /
  `.json`). [Corrected from an earlier "433" estimate.]
- **Route totals (measured):** **725 `page.tsx`** (670 non-admin + ~52 admin) +
  **150 Next API routes**. Operator app 351 · supplier workspace ~113–124 · customer
  46 · admin 52. The "~670" used elsewhere is the *non-admin page* subset.
- **URL aliases (next.config rewrites):** operator app physically lives at
  `(app)/app/*`; `/property-manager/* ↔ /app/*` and `/user/* ↔ /customer/*` are
  rewrites. The operator sidebar's `/property-manager/*` links resolve correctly —
  **not broken** (a workspace-audit [VERIFY] item, now confirmed).
- **API surface:** **150 Next API routes** (`src/app/api/**/route.ts`). **No
  Supabase edge functions** (`supabase/functions` empty) — "edge/internal" = Next
  API routes + server actions.
- **Plans:** 5 tiers `starter | operator | scale | pro_agency | enterprise`
  (`src/lib/billing/plans.ts`); entitlement limits = properties/seats/storage +
  `aiCopilot`/`advancedReports` flags (`src/lib/billing/entitlements.ts`); supplier
  monetised via **paid add‑ons** (promoted ranking, emergency availability), not a
  base plan.
- **Feature‑flag registry already exists** — `src/lib/flags/registry.ts` +
  `src/lib/flags/index.ts` + `src/lib/portal/flags.ts`. Flags map directly to the
  staging plan:
  `marketplaceEnabled` (master), `marketplaceStays/Suppliers/Emergency/Payments/
  Escrow/Disputes`, `bookingManagement`, `directBookingPages`, `customerWorkspace`,
  `supplierWorkspace`, `icalSync`, `canvasLite`, `multiCountryPortfolio`,
  `globalCountryPacks`, `contextEngine` ("Off = V1 single‑context behaviour").
  → **CORRECTION (verified by 4 agents):** the registry exists and all flags
  default OFF, **but the flags are currently INERT** — no route group / nav /
  proxy calls `isFeatureEnabled()` (grep = 0), so Layer-D surfaces are URL-
  reachable today regardless of flag state. Two Layer-D surfaces (**full
  accounting GL**, **automation canvas**) have **no flag key at all** — `17`
  proposes adding `accountingGl` + `automationsFull`. So the deprecation plan is
  **render-guard + nav wiring + 2 new flags**, not pure config and not code
  deletion — still reversible, flag-first, no migrations.
- **Server‑side plan gates:** `src/lib/billing/gates.ts` (seat/AI/storage).
- **Shells/nav:** PM `SideNavigation.tsx` (Overview/Core/Finance/Operations/
  System); Supplier `supplier-workspace/nav.ts`; Customer `CustomerTopNav.tsx`;
  Portal `PortalShell`/`PortalTopNavigation`; Admin `AdminShell`.
- **Admin** (~50 routes, `(admin)/admin/*`): users, workspaces, subscriptions,
  stripe‑events, ai‑models, ai‑usage, audit, security, health, maintenance,
  announcements(+bar), changelog, bugs, data‑requests, cron, marketplace
  moderation/disputes/payouts/transactions, supplier‑verification, risk. **This is
  a genuine control plane — keep.**

## 7. Existing docs to mine / reference (don't duplicate; cite)
- `docs/final-wiring/live-schema.md` (+`.json`) — authoritative schema.
- `docs/Todos_gaps_requirements/<workspace>/<section>/*` — deep per‑section gap
  files (PM, supplier, tenant/landlord/supplier portals, customer, AI copilot,
  automations) — rich existing gap material.
- `docs/Audits/*image-manifest.md` — pixel build manifests (customer, supplier,
  tenant portal).
- `docs/_coverage matrix.md`, `docs/Release-Readiness-Takslist.md`,
  `docs/_documentation standards.md` (status values: Draft/In Review/Approved/
  Blocked/Deprecated).

## 8. Authoring rules
- PhD‑depth, ruthless but intelligent, implementation‑ready. Cite real files/routes.
- Mark assumptions `[ASSUMPTION]`. Mark items needing live verification `[VERIFY]`.
- Every recommendation = **Reason + Risk + Implementation action**.
- Do not invent completion where code is missing. Do not protect dead weight; do
  not remove ambition. Use tables AND prose.
- Conform to the verdict (§1), layer map (§3), targets (§4). Flag contradictions.
