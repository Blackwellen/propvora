# 03 — Consumer & Buyer Analysis (18 buyer groups)

**Status:** Draft · 2026-06-18 · author: senior commercial analyst
**Conforms to:** `_shared-strategic-brief.md` (verdict = staged property OS / Model 2;
wedge = UK property-ops + compliance for operators; first buyer = self-managing
portfolio landlord / small letting agent, 5–150 units; Layer map §3).
**Pricing anchored to code:** `src/lib/billing/plans.ts`,
`src/lib/billing/entitlements.ts`, `src/lib/billing/gates.ts`,
`src/lib/billing/catalog.generated.json` (LIVE Stripe catalogue, generated
2026-06-12).

> Method note. "Willingness-to-pay" (WTP) is expressed against the real five
> tiers — Starter £29/mo, Operator £79/mo, Scale £149/mo, Pro/Agency £299/mo,
> Enterprise custom (`catalog.generated.json`). Anything not derivable from code,
> schema or the brief is marked `[ASSUMPTION]`; anything needing live confirmation
> is `[VERIFY]`. Every group is mapped to exactly one primary **Layer** (A/B/C/D)
> and a **V-stage** per brief §3.

---

## 0. How to read this document

The brief's verdict is binding: Propvora sells **one buyer first** (the operator)
and keeps the marketplace / consumer / independent-supplier sides in code behind
master flags. This document tests that verdict against demand. For each of the 18
groups it answers: are they a **payer**, a **user-but-not-payer** (rides on a
payer's workspace), or a **future side** (only valuable once a flag flips)? The
commercial conclusion (§19) names the V1 ICP and explains why the other 17 are
deliberately *downstream* of it.

A recurring distinction matters throughout:

- **Budget owner = operator** → the group can be *sold to directly*. These are the
  only true SaaS payers in V1.
- **Budget owner = the operator's customer** (tenant, owner, guest) → the group is
  a **retention surface**, not a revenue line. They never see a Stripe checkout;
  they make the payer stickier. (`portals` entitlement, Scale+, `entitlements.ts`.)
- **Budget owner = self, but a different product** (independent supplier, consumer
  guest) → a **future side** behind `supplierWorkspace` / `customerWorkspace` /
  `marketplaceEnabled` flags (all default OFF, brief §6).

---

## 1. Master buyer table (all 18 groups)

WTP band legend: **£** = ≤£29 (Starter), **££** = £79 (Operator), **£££** = £149
(Scale), **££££** = £299 (Pro/Agency), **£££££** = Enterprise custom, **£0** = does
not pay (rides a payer's workspace or a free side).

| # | Group | Pain | Freq | WTP | Budget owner | Onboarding difficulty | V-stage | Layer | Role |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Small landlords (1–5 units) | Med | Weekly | £ (£29) | Self | Low | **V1** | A | Payer (entry) |
| 2 | Portfolio landlords (5–150) | **High** | Daily | ££–£££ (£79–149) | Self | Med | **V1 ICP** | A | **Primary payer** |
| 3 | Letting agents (small) | **High** | Daily | £££–££££ (£149–299) | Self (principal) | Med-High | **V1 ICP** | A | **Primary payer** |
| 4 | Property managers (in-house) | High | Daily | ££–£££ | Employer | Med | **V1** | A | Payer / seat user |
| 5 | HMO operators | **High** | Daily | £££ (£149) | Self | Med-High | **V1** | A/C | Payer (compliance-led) |
| 6 | Serviced-accommodation (SA) ops | High | Daily | £££ (£149) | Self | High | **V1.5** | B/C | Payer (bookings gated) |
| 7 | Rent-to-rent (R2R) operators | Med-High | Daily | ££ (£79) | Self | Med | **V1.5** | C | Payer (planning-led) |
| 8 | Student-let operators | High | Seasonal | £££ | Self | Med | **V1.5** | A/C | Payer |
| 9 | Commercial / mixed-use ops | Med | Weekly | £££–££££ | Self | High | **V2** | A/D | Payer (later) |
| 10 | Developers / flippers / BRRR | Med | Project | ££ (£79) | Self | Med | **V1.5** | C | Payer (planning add-on) |
| 11 | Tenants | Low (theirs) | Weekly | £0 | Operator | Very low | **V1** | B | Retention user |
| 12 | Landlord / investor portal users | Med | Monthly | £0 | Operator (agent) | Low | **V1** | B | Retention user |
| 13 | Suppliers / trades | Med | Daily | £0→add-ons | Self | Low | **V1 portal / V2 SaaS** | B→D/C | Portal user → future payer |
| 14 | Service providers (pro services) | Low | Ad hoc | £0→listing | Self | Low | **V2** | D | Future side |
| 15 | Guests / customers (consumer) | Low | One-off | £0 | Self | Very low | **V2** | D | Future side (flag OFF) |
| 16 | Emergency users | High (acute) | Rare | £0→fee | Operator/guest | Very low | **V2** | D | Future side (flag OFF) |
| 17 | Accountants / bookkeepers | Med | Monthly | £0→seat/sync | Operator | Med | **V1.5** | A/D | Seat user / integration |
| 18 | Internal Propvora admins/support | n/a | Daily | £0 (cost) | Propvora | n/a | **V1** | Ops | Control plane |

**Reading the table:** exactly **four groups are directly sellable in V1**
(2, 3, 4, 5 — portfolio landlords, small letting agents, in-house PMs, HMO
operators), with group 1 as the low-ACV entry door. Groups 6–10 are *the same
operator buyer* segmented by strategy, unlocked as `bookingManagement` /
`directBookingPages` / planning premium land (V1.5). Groups 11–17 are
retention/integration surfaces or future sides — **none is a V1 acquisition
channel**. Group 18 is internal cost, not revenue.

---

## 2. Small landlords (1–5 units) — V1 entry, Layer A

| Dimension | Finding |
|---|---|
| Jobs-to-be-done | Track rent in/arrears, store certificates (gas/EICR/EPC), chase a repair, hold deposit evidence, file something for tax. |
| Pain intensity | **Medium.** Spreadsheets + a shoebox "work" until a cert lapses or a tenant disputes. RRA-2026 raises the floor of anxiety. |
| Frequency | Weekly (rent day, the odd repair). |
| WTP | **£ (Starter £29/mo, `catalog.generated.json`).** Many resist any subscription; the annual £290 (2 months free) is the conversion lever. |
| Buying trigger | A cert expiry scare, a deposit dispute, an accountant asking for records, or RRA-2026 compliance fear. |
| Budget owner | Themselves (personal cash). |
| Decision process | Solo, impulsive, <1 week; price-led. |
| Onboarding difficulty | **Low** — Starter caps at 5 properties / 1 seat (`PLAN_DISPLAY.starter`); the whole portfolio is enterable in an evening. |
| Existing tools | Excel, WhatsApp, email, Google Drive; maybe Landlord Vision / Hammock free tier. |
| Switch triggers | Compliance fear, a free-tier rival adding a paywall, a recommendation from a landlord forum. |
| Must-have | Compliance tracker, rent/arrears log, document store, deposit record. |
| Nice-but-not-now | AI Copilot (Scale+ only — correctly *not* on Starter), planning engine, portals. |
| Confusing features | Anything marketplace/supplier/booking; the planning engine's deal-analysis depth; 8-item nav can over-serve a 2-property user. |
| Placement | **V1** — the funnel's top; low ACV but high logo count + word-of-mouth. |

**Prose.** Small landlords are the *volume* of the UK market but the *thin* end of
revenue. Their value is as a referral engine and an upgrade pipeline into Operator
once they buy unit #6. Starter's 5-property ceiling is well-judged: it forces the
upgrade conversation exactly when the customer's pain has grown. The risk is that
Starter over-delivers — the same 8-nav operator OS a 100-unit agent uses is
*overwhelming* for a 2-flat landlord. Recommendation: a "simple mode" first-run that
hides Operations/System nav until the user has >5 properties is the cheapest
activation win [ASSUMPTION]. Do **not** discount Starter below £29 — sub-£20 PMS
tools train the market to expect free, and the support cost of a £15 landlord is the
same as a £149 one.

---

## 3. Portfolio landlords (5–150 units) — **V1 PRIMARY ICP**, Layer A

| Dimension | Finding |
|---|---|
| Jobs-to-be-done | Run the whole operation: arrears chasing, planned + reactive maintenance, cert/HMO compliance, owner-level P&L, deposit/possession evidence, supplier coordination — **without bolting Fixflo + Landlord Vision + spreadsheets together** (brief §2). |
| Pain intensity | **High.** This is the brief's named buyer. Pain compounds with unit count; at 20–80 units spreadsheets visibly break and compliance exposure is real (RRA-2026, HMO licensing, cert expiries). |
| Frequency | **Daily.** |
| WTP | **££–£££ (Operator £79 → Scale £149).** A self-managing landlord at this scale loses far more than £149/mo to one void or one missed cert; the value math is trivial to make. |
| Buying trigger | Compliance anxiety (the brief's #1 trigger), a near-miss on a cert/possession, arrears blowing past a threshold, or hiring a first member of staff (seat need). |
| Budget owner | **Themselves** — fast, unbureaucratic. |
| Decision process | Solo or with a spouse/ops partner; 1–4 weeks; value- and trust-led, will run a trial on real data. |
| Onboarding difficulty | **Medium** — needs property + tenancy + cert import. Onboarding & migration add-on (£499 one-time, `catalog.generated.json`) exists precisely for this; advancedReports lands at Operator. |
| Existing tools | Landlord Vision, Arthur, Hammock, Fixflo (maintenance), Goodlord-adjacent point tools, spreadsheets, a bookkeeper. |
| Switch triggers | A compliance scare their current tool didn't surface; consolidation fatigue (paying 3 tools); a deadline (RRA-2026); growth past their current tool's comfort. |
| Must-have | Compliance engine + cert expiry alerts, maintenance/work board, arrears, owner statements, document/evidence store, tenant portal. |
| Nice-but-not-now | AI Copilot (Scale), planning engine premium, white-label, automations. |
| Confusing features | Full double-entry GL (correctly HIDE+FLAG, brief §3), marketplace, independent-supplier SaaS. |
| Placement | **V1 — the wedge.** Every V1 nav and pricing decision should optimise for this group. |

**Prose.** This is the buyer the entire product is sequenced around. The commercial
logic is unusually clean: their pain is acute, daily, self-funded, and *legally
escalating* (RRA-2026 is a forcing function competitors with shallow UK-compliance
depth cannot answer). The two USPs the brief says to protect — **UK regulatory
depth** and the **planning/profitability engine** — map directly onto this buyer's
two unmet needs: "keep me out of legal trouble" and "tell me which deal/strategy
actually makes money". Most rivals do one shallow slice (Hammock = finance, Fixflo =
maintenance, Landlord Vision = bookkeeping). Propvora's wedge is *consolidation with
compliance depth*. Pricing fit is strong: this buyer lands on **Operator £79** when
self-managing solo, and is pulled to **Scale £149** the moment they want AI Copilot,
portals, or cross the 25-property / 3-seat ceiling (`entitlements.ts`). That natural
upgrade staircase is the single most important monetisation mechanic in the product
and must not be diluted.

---

## 4. Letting agents (small, 5–150 managed units) — **V1 PRIMARY ICP**, Layer A

| Dimension | Finding |
|---|---|
| Jobs-to-be-done | Manage landlords' properties as a *service*: owner reporting, client money discipline, compliance per property, maintenance triage, tenant comms — and look professional doing it (branded portals/PDFs). |
| Pain intensity | **High** — they carry *regulatory and reputational liability for other people's assets*. A missed cert is a client lost. |
| Frequency | **Daily.** |
| WTP | **£££–££££ (Scale £149 → Pro/Agency £299).** Per-property managed revenue makes £299/mo a rounding error against fee income. |
| Buying trigger | Winning/losing a landlord client over reporting quality; an audit; a compliance breach; needing white-label to look credible; outgrowing a generic CRM. |
| Budget owner | **The principal/director** — a business expense, decided fast. |
| Decision process | Principal + senior negotiator; 2–6 weeks; references and white-label/portal quality matter. |
| Onboarding difficulty | **Medium-High** — multi-landlord owner portals (`ownerPortals`, Pro/Agency, `entitlements.ts`), more properties, more seats; migration add-on relevant. |
| Existing tools | Reapit, Alto, Goodlord, Fixflo, Arthur, agencyOS point tools, spreadsheets. |
| Switch triggers | Cost of stacked legacy tools; poor owner-reporting in incumbents; white-label need; RRA-2026 process change; consolidation. |
| Must-have | Owner/client portals (`ownerPortals`), white-label (`whiteLabel`, Pro/Agency), compliance per property, advanced reports, seat scaling (25 seats at Pro/Agency). |
| Nice-but-not-now | Marketplace publishing, API access (£49 add-on), full GL. |
| Confusing features | Independent-supplier SaaS, consumer booking. |
| Placement | **V1 — the higher-ACV half of the wedge.** |

**Prose.** Small letting agents are the *highest-ACV V1 buyer* and the cleanest
path to durable MRR: their switching cost, once portals carry their landlord
relationships, is enormous (Layer B = retention engine, brief §3). The entitlement
ladder is purpose-built for them — `whiteLabel` and `ssoSaml` arrive at Pro/Agency,
`ownerPortals` and `procurementRules` at Pro/Agency, 500 properties / 25 seats at
£299 (`entitlements.ts`). One caution: agents are *more* tool-savvy and *more*
demanding on client-money handling and integrations than landlords. The brief's
decision to HIDE+FLAG full double-entry GL and position Xero/QuickBooks as an
*integration* (`accounting_sync` add-on £29/mo) is exactly right for this group —
they already have an accountant and do **not** want an in-app ERP. Sell them
*reporting and compliance*, integrate their *accounting*.

---

## 5. Property managers (in-house / employed) — V1, Layer A

| Dimension | Finding |
|---|---|
| Jobs-to-be-done | Operate a portfolio they don't own: task throughput, contractor coordination, tenant comms, compliance, reporting upward to an owner/employer. |
| Pain intensity | High (operational), but **they are not the budget owner**. |
| Frequency | Daily. |
| WTP | **££–£££**, but spent by their employer — they are usually a **seat** on groups 2/3's plan, not a separate buyer. |
| Budget owner | The landlord/agency that employs them. |
| Decision process | They *influence* (champion), the employer *decides*. |
| Onboarding difficulty | Medium — they are often the power user doing the actual import. |
| Existing tools | Whatever the employer mandates. |
| Switch triggers | A new employer tool; their own frustration escalated to the budget owner. |
| Must-have | Work/task board, calendar, contacts, maintenance, role-scoped permissions. |
| Nice-but-not-now | Billing/plan screens (they shouldn't see them), planning engine. |
| Confusing features | Pricing/upgrade nags aimed at a non-payer seat. |
| Placement | **V1** as a *seat persona*, not a standalone ICP. |

**Prose.** The PM is the **champion**, not the **economic buyer** — a critical
distinction for GTM. They are who you win in a trial (they feel the daily pain) and
who you must *equip to sell upward*. Practical implication: the product should give a
PM seat an easy "share this with the owner" reporting export and suppress
upgrade/billing prompts on non-admin seats (gates already 402 server-side; the UI
should route the nudge to the admin, not the IC). Treat PMs as the activation
surface for groups 2–4.

---

## 6. HMO operators — V1, Layer A/C

| Dimension | Finding |
|---|---|
| Jobs-to-be-done | Per-room lettings, mandatory/additional/selective licensing, HMO-specific fire/safety compliance, higher tenant churn, room-level rent + arrears. |
| Pain intensity | **High** — HMO is the *most regulated* residential category; licensing + safety failures carry fines and rent-repayment-order risk. |
| Frequency | Daily. |
| WTP | **£££ (Scale £149)** — compliance value is existential; AI Copilot + portals justify Scale. |
| Buying trigger | A licence renewal, a council inspection, a new HMO acquisition, an RRO threat. |
| Budget owner | Self. |
| Decision process | Solo; compliance-led; fast when triggered. |
| Onboarding difficulty | Medium-High — room/unit modelling, licence records, more certs per property. |
| Existing tools | Spreadsheets + COHO (HMO-specific), Landlord Vision, manual licence trackers. |
| Switch triggers | A licensing scare; COHO gaps; consolidation; RRA-2026. |
| Must-have | HMO licensing module, room-level units/tenancies, fire/safety certs, deposit handling, possession evidence. |
| Nice-but-not-now | Marketplace, booking pages. |
| Confusing features | Consumer booking, supplier SaaS. |
| Placement | **V1** — a *compliance-led* sub-segment of the ICP; the USP #1 (UK regulatory depth) lands hardest here. COHO is the named competitor to beat on HMO depth. |

**Prose.** HMO operators are the segment where Propvora's **compliance moat** is most
defensible and most willing-to-pay. They are effectively forced buyers of compliance
software. The strategic note: HMO is where Propvora should *lead with depth*, because
generic global PMS and Airbnb-style tools have nothing here. If the planning engine
can model an HMO conversion's profitability (it can — multi-profile incl. HMO, brief
§2), HMO operators get *both* USPs in one buyer. This is arguably the sharpest single
beachhead inside the wedge.

---

## 7. Serviced-accommodation (SA) operators — V1.5, Layer B/C

| Dimension | Finding |
|---|---|
| Jobs-to-be-done | Short-let turnover, channel/calendar sync, dynamic pricing, cleaning/linen coordination, guest comms, per-night revenue, SA-specific compliance. |
| Pain intensity | High (operationally intense), but their **core tooling need is channel management** — adjacent to Propvora's wedge. |
| Frequency | Daily/hourly. |
| WTP | **£££ (Scale £149)**, plus `booking_pages` £19 add-on / `icalSync`. |
| Buying trigger | Outgrowing a channel manager; wanting ops + compliance in one place; expanding from SA into mixed strategy. |
| Budget owner | Self. |
| Decision process | Tool-savvy, comparison-heavy; will test channel sync hard. |
| Onboarding difficulty | **High** — channel sync, calendar, pricing all must work. |
| Existing tools | Hospitable, Guesty, Hostaway, Uplisting, Airbnb/Booking.com native. |
| Switch triggers | Channel-manager price hikes; wanting compliance + accounting in the same tool; multi-strategy portfolios. |
| Must-have | `bookingManagement` (Operator+), `directBookingPages` (Scale+), `icalSync`, calendar, guest comms. |
| Nice-but-not-now | Full marketplace, escrow. |
| Confusing features | Long-let possession/RRA flows (irrelevant to short-let). |
| Placement | **V1.5** — gated behind `bookingManagement` / `directBookingPages` / `icalSync` flags (entitlements + brief §6). Do **not** lead the wedge with SA — Propvora is not yet a best-in-class channel manager, and competing head-on with Guesty/Hostaway dilutes the compliance story. |

**Prose.** SA is a *legitimate expansion segment, badly positioned as a launch
segment*. The booking/listing surface is built but flag-gated for a reason: Propvora's
edge is compliance + planning, not channel management. Sell SA operators the
*multi-strategy* story (run your long-lets and short-lets in one OS) in V1.5, after
the wedge has reference customers — not as a Guesty alternative on day one.

---

## 8. Rent-to-rent (R2R) operators — V1.5, Layer C

| Dimension | Finding |
|---|---|
| Jobs-to-be-done | Model lease-option/R2R deals, manage the gap between head-lease cost and sub-let income, compliance on managed-not-owned stock, cashflow. |
| Pain intensity | Medium-High — margins are thin; deal-modelling errors are fatal. |
| Frequency | Daily ops, project-based deal analysis. |
| WTP | **££ (Operator £79)** for ops; the **planning engine** is their hook. |
| Buying trigger | Evaluating a new R2R deal; scaling beyond a couple of units. |
| Budget owner | Self. |
| Decision process | Numbers-driven; the planning/profitability engine *is* the sale. |
| Onboarding difficulty | Medium. |
| Existing tools | Spreadsheets, property-sourcing tools, generic PMS. |
| Switch triggers | A deal that lost money; wanting ops + deal-analysis together. |
| Must-have | Planning engine (R2R/lease-option profile, brief §2), ops basics, compliance on managed stock. |
| Nice-but-not-now | Owner portals (they're not the owner), marketplace. |
| Placement | **V1.5** — the planning engine (Layer C) is their reason to exist on the platform; price it as premium. |

**Prose.** R2R operators are the clearest demonstration of *why the planning engine
must not be cut* (brief §2 USP #2). They will pay for deal-analysis depth that
generic PMS tools cannot match. They're V1.5 because the planning engine is the
premium hook scheduled for V1.5, not because demand is weak.

---

## 9. Student-let operators — V1.5, Layer A/C

| Dimension | Finding |
|---|---|
| Jobs-to-be-done | Seasonal cohort turnover, guarantor handling, joint-and-several tenancies, group viewings, academic-year cycles, HMO overlap. |
| Pain intensity | High in season, lumpy. |
| Frequency | **Seasonal** spikes (Jun–Sep). |
| WTP | **£££ (Scale £149)**. |
| Buying trigger | The annual re-let scramble; an HMO licensing overlap; guarantor disputes. |
| Budget owner | Self. |
| Onboarding difficulty | Medium. |
| Existing tools | StuRents, spreadsheets, generic PMS. |
| Switch triggers | A painful turnover season; HMO + student in one portfolio. |
| Must-have | HMO/room modelling, guarantor + joint tenancy support, cert tracking, calendar. |
| Nice-but-not-now | Short-let booking, marketplace. |
| Placement | **V1.5** — large overlap with HMO (group 6); serve via the same compliance + room-level depth. |

**Prose.** Student lets are largely a *flavour of HMO* — the same compliance and
room-level modelling, plus guarantor/joint-tenancy specifics and seasonal cadence.
Low incremental build to serve once HMO depth exists. V1.5 because the niche
specifics (guarantors, group tenancies) are secondary to the core wedge.

---

## 10. Commercial / mixed-use operators — V2, Layer A/D

| Dimension | Finding |
|---|---|
| Jobs-to-be-done | Commercial leases (FRI, rent reviews, service charges), business rates, mixed residential/commercial compliance, longer cycles. |
| Pain intensity | Medium but specialised. |
| Frequency | Weekly/monthly (longer cadence). |
| WTP | **£££–££££**, but needs commercial-specific depth Propvora doesn't yet have. |
| Budget owner | Self / company. |
| Onboarding difficulty | **High** — commercial lease modelling is a different data model. |
| Existing tools | Re-Leased, Yardi, MRI, bespoke. |
| Switch triggers | Cost of enterprise commercial PMS; mixed portfolios wanting one tool. |
| Must-have | Commercial lease + service-charge engine (not built), rent reviews. |
| Placement | **V2** — out of scope for the residential-lettings wedge; brief §3 maps commercial as a later layer. Do not chase. |

**Prose.** Commercial/mixed-use is a *different product* (Re-Leased/Yardi territory)
and should be explicitly **deferred to V2**. Serving it now would fracture the data
model and the story. The only V1 touchpoint is a landlord with one commercial unit in
an otherwise residential portfolio — handle as an edge case, not a segment.

---

## 11. Developers / flippers / BRRR — V1.5, Layer C

| Dimension | Finding |
|---|---|
| Jobs-to-be-done | Project-appraise deals (BRRR, flip, assisted sale), model refurb cost vs GDV vs refinance, track project tasks, then transition stabilised stock into management. |
| Pain intensity | Medium — concentrated at the *deal-analysis* moment. |
| Frequency | Per-project (bursty), not daily ops. |
| WTP | **££ (Operator £79)** for ops + the **planning engine** as the hook; some will buy *only* for planning. |
| Buying trigger | Appraising a deal; needing to prove numbers to a lender/JV partner. |
| Budget owner | Self / JV. |
| Onboarding difficulty | Medium. |
| Existing tools | Spreadsheets, PaTMa, property-sourcing tools, lender calculators. |
| Switch triggers | A deal that didn't pencil; wanting appraisal + management continuity. |
| Must-have | Planning engine (BRRR/flip/assisted-sale profiles, brief §2), project tasks. |
| Nice-but-not-now | Tenant portals, full ops (until they stabilise stock). |
| Placement | **V1.5** — second proof point for the planning engine as a *premium, standalone-feeling* module (brief: SPLIT OUT planning as premium). |

**Prose.** This group, with R2R (group 8), is the demand case for **pricing the
planning engine as a premium hook** rather than burying it. A flipper may pay for
Propvora *purely* to appraise deals, then convert to ops once they hold stock — a
natural land-and-expand. Consider a planning-led entry SKU in V1.5 (see `04`).

---

## 12. Tenants — V1, Layer B (retention, £0)

| Dimension | Finding |
|---|---|
| Jobs-to-be-done | Pay rent, report a repair, see their tenancy docs/certs, message the operator, get deposit clarity. |
| Pain intensity | Low *for them*; high *value to the operator* (fewer calls, audit trail). |
| Frequency | Weekly-ish. |
| WTP | **£0** — tenants never pay; they ride the operator's `portals` entitlement (Scale+). |
| Budget owner | The operator. |
| Onboarding difficulty | **Very low** — invite link; the portal must be near-zero-friction. |
| Existing tools | Email, WhatsApp, phone. |
| Switch triggers | n/a (they go where the operator sends them). |
| Must-have | Repair reporting, rent visibility, document access, messaging (`src/lib/portal/messaging.ts`). |
| Confusing features | Anything that looks like *they* are being sold to. |
| Placement | **V1** retention surface — a core reason agents (group 4) can't leave. |

**Prose.** Tenants are the **stickiness multiplier**, not a revenue line. Every
tenant actively using the portal raises the operator's switching cost and reduces the
operator's inbound call volume — a concrete value-prop you sell *to the operator*.
Keep the tenant portal ruthlessly simple; its job is to make the payer's life easier,
not to be a product in itself.

---

## 13. Landlord / investor portal users (the agent's clients) — V1, Layer B (£0)

| Dimension | Finding |
|---|---|
| Jobs-to-be-done | See their property's performance, statements, compliance status, approve works above a threshold, trust their agent. |
| Pain intensity | Medium — they want transparency and reassurance. |
| Frequency | Monthly (statement cadence) + on-demand. |
| WTP | **£0** directly — but their satisfaction *is the agent's retention*; `ownerPortals` (Pro/Agency) is a paid entitlement of the agent. |
| Budget owner | The agent (group 4). |
| Onboarding difficulty | Low. |
| Existing tools | PDF statements by email, phone calls. |
| Must-have | Owner statements, performance view, compliance status, approval flow (`ownerPortals`, `procurementRules`). |
| Placement | **V1** — the feature that lets agents *win and keep landlord clients*; the strongest reason group 4 pays £299. |

**Prose.** The owner/investor portal is the agent's competitive weapon. It converts
the agent from "person who emails a PDF" into "platform my landlord logs into" —
which is precisely the lock-in that justifies Pro/Agency pricing. Its budget owner is
the agent, so it is monetised *through* group 4, never directly.

---

## 14. Suppliers / trades — V1 portal user (£0) → V2 SaaS payer, Layer B→D/C

| Dimension | Finding |
|---|---|
| Jobs-to-be-done | Receive job/quote requests from operators, submit quotes, upload evidence/invoices, get paid, build reputation. |
| Pain intensity | Medium — but their acute need (lead-gen) only exists once a *marketplace* has liquidity. |
| Frequency | Daily (for active trades). |
| WTP | **£0 in V1** (free supplier workspace, 3 active-leads cap — `SUPPLIER_FREE_ENTITLEMENTS`, `entitlements.ts`) → paid **add-ons in V2** (promoted £49, emergency £39, pro profile £19, team £29 — all `priceId: null` = **NOT live**, `catalog.generated.json`). |
| Budget owner | Self. |
| Onboarding difficulty | Low (portal); higher for full supplier SaaS. |
| Existing tools | WhatsApp, phone, Checkatrade, MyBuilder, ServiceM8, Jobber. |
| Switch triggers | Real lead volume from Propvora operators (the only thing that matters). |
| Must-have (V1) | Receive operator job/quote requests via portal; submit quote + evidence. |
| Nice-but-not-now | Promoted ranking, emergency availability, supplier AI, team roster (paid add-ons, V2). |
| Confusing features | Mirrored accounting/automations/calendar inside supplier WS (brief §3: **CUT from supplier**). |
| Placement | **V1: portal participant** in the operator's workflow (Layer B). **V2: independent supplier SaaS / marketplace monetisation** behind `supplierWorkspace` + `marketplaceEnabled` flags. |

**Prose.** Suppliers are the textbook **cold-start trap**. Their willingness to pay
for promoted placement, emergency dispatch, or lead-gen is *entirely a function of
marketplace liquidity that does not yet exist*. The brief is right to keep supplier
add-ons free and capped (3 leads) in V1 and to flag-hide the independent supplier
SaaS. The eight supplier add-ons in the catalogue (£9–£49/mo) are **revenue
optionality for V2, not a V1 line** — and every one is `priceId: null`, confirming
they are not yet sellable [VERIFY: confirm none have been wired live since
2026-06-12]. In V1, suppliers exist only to make the *operator's* maintenance workflow
complete (Layer B coordination), at zero charge.

---

## 15. Service providers (professional services — inventory clerks, EPC assessors, etc.) — V2, Layer D

| Dimension | Finding |
|---|---|
| Jobs-to-be-done | List a service, receive bookings from operators, deliver + invoice. |
| Pain intensity | Low; ad hoc. |
| Frequency | Ad hoc. |
| WTP | £0 → listing/lead fee, only post-liquidity. |
| Budget owner | Self. |
| Existing tools | Direct relationships, directories. |
| Placement | **V2** — a marketplace category behind `marketplaceEnabled`. Same cold-start economics as trades; no V1 role beyond being a contact in the operator's directory. |

**Prose.** A thinner version of group 14's story. No independent demand until the
marketplace has operator-side liquidity. Defer entirely; in V1 they are at most a
contact record.

---

## 16. Guests / customers (consumer) — V2, Layer D (flag OFF)

| Dimension | Finding |
|---|---|
| Jobs-to-be-done | Find/book a stay or service, message a host, pay, leave a review. |
| Pain intensity | Low and well-served by Airbnb/Booking.com. |
| Frequency | One-off / occasional. |
| WTP | £0 to Propvora directly; monetised via booking take-rate *if* the consumer side ever launches. |
| Budget owner | Self. |
| Onboarding difficulty | Very low (consumer-grade expectation). |
| Existing tools | Airbnb, Booking.com, Google. |
| Placement | **V2 — `customerWorkspace` flag OFF (brief §3/§6).** A consumer two-sided marketplace is a *separate company-sized bet* with its own cold start; building it as a launch surface would be the brief's rejected Model 3. |

**Prose.** The customer/guest workspace is real code (30-image pixel build per
memory) but is correctly **flag-hidden**. Launching a consumer marketplace alongside
a B2B operator SaaS is the four-cold-starts mistake the brief explicitly rejects.
This is V2-or-later optionality, not a buyer group to court now.

---

## 17. Emergency users — V2, Layer D (flag OFF)

| Dimension | Finding |
|---|---|
| Jobs-to-be-done | Get an urgent trade dispatched now (leak, no heat, lockout, safety). |
| Pain intensity | **High but acute/rare.** |
| Frequency | Rare. |
| WTP | Premium *per incident* (emergency dispatch), only viable with a dense verified supplier network. |
| Budget owner | The operator (passing cost on) or the guest. |
| Placement | **V2** — `marketplaceEmergency` flag OFF; depends on the supplier-side liquidity that doesn't exist. The `supplier_emergency` add-on (£39/mo, **not live**) is the eventual monetisation. |

**Prose.** Emergency dispatch is a *fantastic* eventual feature and a genuine premium
moment — but it is 100% gated on a verified, available supplier network, i.e. the V2
marketplace. In V1, "emergency" reduces to the operator phoning their own known
contractor through the maintenance workflow. Keep flagged off.

---

## 18. Accountants / bookkeepers — V1.5, Layer A/D

| Dimension | Finding |
|---|---|
| Jobs-to-be-done | Pull clean financial data for a landlord/agency client, reconcile, file (MTD ITSA), advise. |
| Pain intensity | Medium — they want *export and integration*, not to live in the PMS. |
| Frequency | Monthly + year-end spikes. |
| WTP | **£0 directly** → drives the operator's `accounting_sync` (£29/mo) and `mtd_itsa` (£19/mo) add-ons (both **not live**, `catalog.generated.json`). May occupy a *seat*. |
| Budget owner | The operator (their client). |
| Onboarding difficulty | Medium — needs reliable export/sync. |
| Existing tools | **Xero, QuickBooks**, FreeAgent, Sage, spreadsheets. |
| Switch triggers | A client mandating data access; MTD deadlines. |
| Must-have | Clean exports, Xero/QuickBooks sync (the integration, not in-app GL). |
| Confusing features | Full double-entry GL inside Propvora (brief §3: HIDE+FLAG — they already have Xero). |
| Placement | **V1.5** — served via **integration + seat**, never as a standalone payer; validates the brief's "Xero integration not in-app ERP" stance. |

**Prose.** Accountants are the living proof that the brief is right to **HIDE the full
GL and position accounting as an integration**. They do not want to leave Xero; they
want clean, reconciled data out of Propvora. Monetise this group *indirectly* through
the operator's `accounting_sync` / `mtd_itsa` add-ons, and treat the accountant as a
read-mostly seat. Building an in-app ERP to court them would be expensive, slow, and
competing with the world's stickiest SMB software.

---

## 19. Internal Propvora admins / support — V1, Ops layer (cost, not revenue)

| Dimension | Finding |
|---|---|
| Jobs-to-be-done | Run the control plane: users, workspaces, subscriptions, Stripe events, AI usage/cost, audit, security, health, marketplace moderation, supplier verification, risk (brief §6 admin list, `(admin)/admin/*`). |
| Pain intensity | n/a (operational tooling). |
| Frequency | Daily. |
| WTP | **£0 — internal cost centre.** |
| Onboarding difficulty | n/a. |
| Placement | **V1 — keep.** The brief is explicit: this is a *genuine control plane*, not customer nav. It is what makes the whole staged model operable (flag flips, billing, AI cost control). |

**Prose.** The admin surface is a strength, not bloat. It is the cockpit from which
the staged-OS strategy is executed (flag flips per workspace, plan management, AI
cost gates via `admin/ai-usage`). Keep it, keep it internal, and resource its
support-ops UI well — but it is a cost line, never a buyer.

---

## 20. Conclusion — the V1 ICP and why

**The V1 ICP is groups 2, 3, 5 (and 4 as the seat persona): the self-managing
portfolio landlord, the small letting agent, and the HMO operator — all 5–150
units, all UK, all budget-owners of their own subscription.** Group 1 (small
landlords) is the entry door of the same funnel; groups 6–11 (SA, R2R, student,
commercial, BRRR) are the *same operator buyer* segmented by strategy and unlocked
across V1.5–V2 as booking/planning flags flip.

Why these and not the others:

1. **They are the only groups whose budget owner is themselves and whose pain is
   daily, acute, and legally escalating.** RRA-2026 + HMO licensing + cert expiries
   are a forcing function (brief §2). Every other group either doesn't pay (tenants,
   owners, accountants, admins) or has no demand until a marketplace exists (suppliers,
   service providers, guests, emergency).
2. **They are the exact match for the two protected USPs** — UK regulatory depth
   (HMO operators + agents feel this hardest) and the planning/profitability engine
   (R2R/BRRR/landlords planning their next deal). No competitor combines both with UK
   compliance depth.
3. **The pricing ladder already fits them** with no re-architecture: Starter £29
   (entry) → Operator £79 (self-managing landlord) → Scale £149 (AI + portals +
   growth) → Pro/Agency £299 (white-label agency) → Enterprise (large agencies). The
   property/seat ceilings (`entitlements.ts`) drive natural expansion exactly at the
   points where these buyers grow.
4. **Everyone else is downstream of them.** Tenants, owners and accountants are
   *retention/integration surfaces* that make the ICP stickier (Layer B) — sold
   *through* the operator, never to. Suppliers, service providers, guests and emergency
   users are *future sides* whose value is gated on liquidity the ICP creates first
   (Layer D, flags OFF). This is the staged-OS sequencing the brief mandates: **win
   the operator with depth, then light up the adjacent sides you've already built.**

**Contradiction flagged (see also `04` §contradictions):** the catalogue ships **8
supplier add-ons and 9 new operator add-ons** with real display metadata but
`priceId: null` (`catalog.generated.json`) — i.e. *commercially designed but not
sellable*. This is consistent with the staged verdict (supplier monetisation is V2),
but it means any pricing-page or sales claim referencing these add-ons today would be
selling vapour. Treat them as roadmap, not V1 SKUs, until wired live `[VERIFY]`.
