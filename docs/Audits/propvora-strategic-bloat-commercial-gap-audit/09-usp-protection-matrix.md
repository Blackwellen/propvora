# 09 — USP Protection Matrix

**Status:** Draft · 2026-06-18 · Author: Product Strategy (USP defence)
**Aligns to:** `_shared-strategic-brief.md` (USP §2; Layer map §3; Verdict §1 = Model 2 staged OS)
**Companion to:** `07-bloat-analysis-keep-merge-cut.md`
**Purpose:** Define the four real USP pillars, map which features *support* vs *distract* from each, and make the explicit case that cutting bloat must **never** touch Planning or Compliance.

---

## 0. The thesis

The bloat audit (doc 07) cuts ~440 routes from primary nav. The danger of any aggressive cut is **cutting the wrong thing** — stripping the muscle with the fat. This document is the guardrail. It names what makes Propvora **un-clonable by Xero, Zapier, Airbnb, or a generic global PM tool**, and ring-fences it.

**Propvora's real USP is not "property management software."** That market is crowded (Arthur, Re-Leased, Landlord Vision, Fixflo). Propvora's defensible wedge is the **intersection** of:

1. **UK regulatory/compliance depth** — a moat built from jurisdiction, not features.
2. **Multi-profile property strategy & profitability PLANNING** — turns an admin tool into a *decision* tool.
3. **Operator ↔ tenant ↔ landlord ↔ supplier portals** — one operating fabric, a retention + network moat.
4. **AI-assisted ops with evidence/audit trail as first-class** — defensible, compliance-grade automation.

Everything that does **not** deepen one of these four is, by definition, a candidate for HIDE/MERGE/CUT in doc 07.

---

## 1. The USP protection matrix

| USP element | Why it matters (the moat) | Features that SUPPORT it | Features that DISTRACT from it | Must-never-cut | Can-simplify | Should-become-premium | Later-roadmap |
|---|---|---|---|---|---|---|---|
| **1. UK regulatory / compliance depth** | A UK landlord's #1 fear in 2026 is RRA-2026, HMO licensing, cert expiry, deposit penalties. Global tools (Xero/Airbnb) have *zero* of this. It is the buying trigger (§2). | `compliance/*` (certs, HMO, inspections, deposits), `legal/*` (possession/RRA-2026, licences), evidence/audit trail, cert-expiry reminders, jurisdiction setting | Full GL accounting (looks "financial-compliance" but is ERP, not regulatory), automation canvas, marketplace escrow/disputes — *imply* compliance depth they don't add | **Compliance core, Legal core, evidence/audit trail** | Compliance *sub-page* count; collapse to fewer tabs | Advanced possession packs, multi-property HMO licence tracking, RRA-2026 workflow automation (Layer C, V1.5) | Multi-country compliance packs (`globalCountryPacks`, V2) |
| **2. Multi-profile strategy & profitability PLANNING** | This is what makes Propvora *more than admin*. Deal analysis across HMO / R2R / SA / student / BRRR / lease-option / assisted-sale / flip / commercial. No PM tool does this; it's a separate product category (Lendlord/BiggerPockets). It is the **premium hook**. | `planning/*` (43 routes: profiles, sets, wizard, income-model, forecasts, scenarios, AI-review, landlord-offers, yield-/portfolio-intelligence) | The 43-route *surface* itself distracts if shown raw in CORE nav to a first-time operator; deep sub-pages (cost-drivers, ai-questions, upfront-costs) overwhelm before value | **The planning calc engine, multi-profile model, AI-review** | **Entry path** — lead with a wizard, hide the 43 routes behind it | **YES — this is the V1.5 premium tier hook.** Gate by entitlement | Lender/investor-facing exports; portfolio-intelligence as standalone analytics |
| **3. Operator↔tenant↔landlord↔supplier portals** | One operating fabric. Each portal extends the paying operator's workflow and locks in the other three sides — a retention + light network effect. Generic tools are single-sided. | `portals/*`, tenant/landlord/supplier portal shells, in-portal messaging, external portal actions, operator `suppliers` coordination | Standalone `messages` (2 routes — overlaps portal inbox), supplier-**workspace**-as-SaaS (113 routes — confuses "portal" with "separate app"), marketplace | **Portal shells + portal messaging** | Merge `messages` into portal inbox | Branded/white-label tenant portal (enterprise) | Independent supplier SaaS (Layer D, V2, separate app) |
| **4. AI-assisted ops + evidence/audit trail** | Defensible because it's *compliance-grade* AI (cited, evidence-linked, human-approval), not a chatbot. Audit trail = the trust layer regulators and landlords need. | AI Copilot/inbox, AI-review in planning, citation chips, human-approval flow, audit-log surfaces, evidence upload | Automation **canvas/webhooks/usage-limits** (Zapier scope — automation ≠ AI-ops), AI-builder for automations | **Evidence/audit trail, human-approval flow, AI citations** | AI surface count; one Copilot entry | AI Copilot entitlement (`aiCopilot`), advanced reports | Agentic multi-step automations (post-V2) |

---

## 2. The case for protecting Planning (even while cutting bloat)

Doc 07 cuts hard. The instinct under a bloat audit is "43 routes for planning = bloat, cut it." **That instinct is wrong, and here is the argument:**

- **Planning is the differentiator, not the bloat.** §2 names it pillar #2 of the USP and says explicitly: *"Do not cut — make it the premium hook (Layer C)."* Cutting Accounting loses an ERP feature any buyer can get from Xero. Cutting Planning loses the **only reason Propvora is more than a cheaper Arthur.**
- **It changes the buyer's job.** Compliance/Money/Work make Propvora a *system of record*. Planning makes it a *system of decision* — "should I convert this to an HMO?", "what's the yield on R2R vs SA here?". That is what justifies a premium tier and a higher ACV.
- **It is the upsell engine of Model 2.** The staged-OS verdict (§1) needs a premium hook to expand revenue *before* the marketplace turns on. Planning is that hook. Kill it and V1.5 has nothing to sell upward.
- **The 43 routes are a packaging problem, not a value problem.** The fix is entry simplification (lead with the wizard `planning/wizard`, present one "new analysis" CTA), **not deletion.** Keep all 43 in code; surface 1 entry point.

**Protection rule:** Planning may be **gated** (premium), **simplified at entry** (wizard-first), and **moved out of free CORE nav** — but its calc engine, multi-profile models, AI-review, and forecasts are **must-never-cut.**

---

## 3. The case for protecting Compliance (the moat)

- **It is the buying trigger.** §2: the V1 ICP buys because of *"compliance anxiety (RRA-2026, HMO licensing, cert expiries)."* Cut compliance depth and you remove the *reason the cheque is signed.*
- **It is structurally un-clonable by the four threats.** Xero (accounting), Zapier (automation), Airbnb (booking), and generic global PM tools **cannot** replicate UK-specific HMO/RRA/deposit logic without rebuilding Propvora's jurisdiction layer. The moat is the *narrowness*, not breadth.
- **Evidence/audit trail is the trust layer.** Possession claims, deposit disputes, and licensing all turn on documentation. Propvora treating evidence as first-class (pillar #4) is what makes compliance *defensible in a tribunal*, not just a checklist.

**Protection rule:** Compliance and Legal core are **KEEP, non-negotiable**. Advanced flows (possession packs, multi-licence HMO, RRA automation) may be **gated to Layer C / V1.5** — but the certs/HMO/deposits/inspections core ships in V1, in primary nav, ungated.

---

## 4. What is safe to cut *because* it does not touch USP

The mirror-image of protection: these are safe precisely because no USP pillar depends on them.

| Cut/hide (doc 07) | Which USP pillar it touches | Verdict |
|---|---|---|
| Full GL accounting / MTD / trial balance | None — it's ERP, Xero's job. *Imitates* pillar 1 but adds no UK-regulatory depth | **HIDE — safe.** Position as Xero integration |
| Automation canvas / webhooks / usage-limits | None — Zapier's job. Distracts from pillar 4 (AI-ops ≠ workflow-DAG) | **HIDE — safe.** Keep `canvasLite` recipes |
| Marketplace / escrow / disputes / bookings / listings | None for V1 — Airbnb's job, a different side | **HIDE — safe** behind `marketplaceEnabled` |
| Supplier-workspace-as-SaaS (incl. its mirrored accounting/automations) | Touches pillar 3 only via the *portal*, not the SaaS | **HIDE/CUT — safe.** Suppliers act via portal in V1 |
| Customer/guest workspace | None for V1 — consumer side | **HIDE — safe** (`customerWorkspace` OFF) |
| Settings ×5 / calendar ×2 / messages standalone | None — pure duplication | **MERGE — safe** |

Every safe cut is safe **because** it fails the "does it deepen a USP pillar?" test. Every protected item passes it. That is the discipline.

---

## 5. Premium / roadmap staging of the USP

| Tier | USP-aligned offering |
|---|---|
| **V1 (paid wedge)** | Compliance core, Legal core, Portfolio/Work/Money basics, Portals, evidence/audit, basic AI |
| **V1.5 (premium upsell)** | **Planning engine (premium hook)**, advanced compliance/possession, AI Copilot entitlement, automations-lite recipes, affiliates |
| **V2 (platform on)** | Marketplace, customer workspace, independent supplier SaaS, multi-country compliance packs — all behind existing flags |

This staging *is* the USP-protection plan: depth first (compliance), decision-tool next (planning), platform breadth last (marketplace) — never the reverse.

---

## 6. Contradictions flagged (for `19-founder-decision-lock.md`)

- **[VERIFY] Planning is currently free + in CORE nav.** Live `SideNavigation.tsx` lists Planning in CORE alongside Portfolio (ungated). This document and §3 want it **premium-gated, Layer C, wizard-first**. Direct contradiction with shipped state — founder must decide: gate now (risk: removing a free feature operators may already use) vs. grandfather V1 and gate new value in V1.5.
- **[VERIFY] Compliance "advanced → C" boundary is undefined.** §3 says compliance core = A, advanced = C, but the repo's 22 compliance routes are not tagged core-vs-advanced. Need an explicit list of which sub-pages are V1-free vs V1.5-premium before gating, or risk gating the moat itself.
- **[ASSUMPTION] AI evidence/audit trail is wired to real audit tables.** Pillar 4 assumes the audit-log surfaces persist to live schema (433 tables). If audit trail is UI-only, the "compliance-grade AI" claim is weaker than stated — verify against `live-schema.md`.
- **[CONTRADICTION with doc 07] Accounting "owner-statements".** Doc 07 keeps owner-statements (Money, Layer A) while hiding the rest of Accounting (Layer D). Owner-statements currently live under `accounting/owner-statements` — moving it to Money without dragging GL dependencies needs verification.

---

## Evidence Appendix (verified 2026-06-18)

- Planning surface: **43** routes — the premium hook; entry simplification, not deletion (doc 07 §6, this doc §2).
- Compliance surface: **22** routes; Legal section present — pillar #1, KEEP (this doc §3).
- Portals: **5** routes + portal shells; supplier coordination via operator `suppliers` (4) — pillar #3.
- Flag registry `src/lib/flags/registry.ts`: `marketplaceEnabled`, `customerWorkspace`, `supplierWorkspace`, `canvasLite`, `globalCountryPacks` etc. all default OFF — enables staged USP rollout without code deletion (§4–5).
- Live nav `SideNavigation.tsx`: Planning in CORE, ungated — contradiction flagged §6.
