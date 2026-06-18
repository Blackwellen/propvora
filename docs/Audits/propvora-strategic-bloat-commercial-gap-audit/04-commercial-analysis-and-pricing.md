# 04 — Commercial Analysis & Pricing

**Status:** Draft · 2026-06-18 · author: senior commercial analyst
**Conforms to:** `_shared-strategic-brief.md` (verdict = staged property OS / Model 2;
wedge = UK property-ops + compliance for operators; first buyer = self-managing
portfolio landlord / small letting agent / HMO operator, 5–150 units).
**Pricing anchored to code (LIVE Stripe catalogue, generated 2026-06-12):**
`src/lib/billing/plans.ts`, `src/lib/billing/entitlements.ts`,
`src/lib/billing/gates.ts`, `src/lib/billing/catalog.generated.json`.

> All £ figures that exist in code are cited as fact. All £ figures proposed by this
> document (not in code) are marked `[ASSUMPTION]`. Items needing live confirmation
> are `[VERIFY]`.

---

## 1. The real, in-code pricing (ground truth)

These are the numbers in the live Stripe catalogue — every commercial recommendation
anchors to them, not to invented prices.

### 1.1 Plans (`plans.ts` + `catalog.generated.json`)

| Tier | Monthly | Annual (eff. /mo) | Properties | Seats | Storage | AI Copilot | Adv. reports | White-label | SSO | Portals | Automation |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Starter** | **£29** | £290 (£24.17) | 5 | 1 | 2 GB | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Operator** ★popular | **£79** | £790 (£65.83) | 25 | 3 | 10 GB | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |
| **Scale** | **£149** | £1,490 (£124.17) | 100 | 10 | 50 GB | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ |
| **Pro / Agency** | **£299** | £2,990 (£249.17) | 500 | 25 | 200 GB | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Enterprise** | Custom | Custom | ∞ | ∞ | ∞ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

Annual = 10× monthly (≈2 months free). Source: `catalog.generated.json` plans block;
flags from `entitlements.ts` `TIER_FEATURES` + `STORAGE_BYTES` + `PLAN_DISPLAY.features`.

### 1.2 Add-ons (`catalog.generated.json` addons + `plans.ts` `ADDON_DISPLAY`)

**LIVE (have a Stripe `priceId`) — sellable today:**

| Add-on | Price | Audience | Eligibility |
|---|---|---|---|
| Extra team seat | £9/mo | operator | All plans |
| +10 properties | £19/mo | operator | Starter–Scale |
| White-label branding | £49/mo | operator | Scale+ |
| AI credit pack (1,000) | £15 one-time | operator | AI-enabled tiers |
| Onboarding & migration | £499 one-time | operator | All plans |

**NOT LIVE (`priceId: null`) — designed, not sellable [VERIFY]:**

| Add-on | Price | Audience |
|---|---|---|
| Open Banking | £19/mo | operator |
| WhatsApp Business | £15/mo | operator |
| eSignature | £15/mo | operator |
| Xero / QuickBooks sync | £29/mo | operator |
| MTD ITSA pack | £19/mo | operator |
| Booking pages | £19/mo | operator |
| Automation pack | £29/mo | operator |
| API access | £49/mo | operator |
| Country pack (beta) | £19/mo | operator |
| Supplier Pro Profile | £19/mo | supplier |
| Supplier Team | £29/mo | supplier |
| Emergency Availability | £39/mo | supplier |
| Verified Plus Review | £9/mo | supplier |
| Promoted Local Placement | £49/mo | supplier |
| Extra Coverage Area | £10/mo | supplier |
| Supplier Automation Pack | £19/mo | supplier |
| Supplier AI Assistant | £15/mo | supplier |

**Supplier base = free**, capped at **3 active marketplace leads**
(`SUPPLIER_FREE_ENTITLEMENTS`, `entitlements.ts`). Supplier monetisation is
*entirely* via add-ons, none of which is wired live.

---

## 2. Positioning

**One-line position (sell this):** *"The UK property operations platform that keeps
you compliant and tells you which deals make money — your lettings, maintenance,
compliance and money in one place, instead of Fixflo + Landlord Vision + a
spreadsheet."* (Brief §2 wedge.)

- **Category:** UK property-operations + compliance OS for operators (not a generic
  global PMS, not a channel manager, not an Airbnb clone).
- **Against the field:** Landlord Vision / Hammock (finance-shallow on ops &
  compliance), Fixflo (maintenance-only), COHO (HMO-only), Arthur (ops but weak
  compliance depth & no planning engine), Re-Leased/Yardi (commercial, enterprise,
  expensive). Propvora's whitespace = **consolidation × UK-compliance depth ×
  profitability planning** — no single incumbent owns all three.
- **Two moats to protect (brief §2):** (1) **UK regulatory depth** — RRA-2026, HMO
  licensing, certs, deposits, possession evidence/audit trail; (2) **multi-profile
  planning/profitability engine** (HMO, R2R, SA, student, BRRR, flip, lease option,
  commercial). The first defends against global tools; the second turns an admin tool
  into a *decision* tool and justifies premium pricing.

---

## 3. Best first buyer

Per `03` §20 and brief §2: **the self-managing portfolio landlord, small letting
agent, and HMO operator (5–150 units, UK).** Within that, the **sharpest single
beachhead is HMO operators** — most-regulated, most-forced-to-buy compliance, and
both USPs land hardest. The **highest-ACV** sub-segment is **small letting agents**
(Scale/Pro-Agency, £149–£299, portal lock-in). Recommended GTM order: **HMO/portfolio
landlord first** (compliance-led, fast solo decision, viral in landlord communities),
**small agents second** (higher ACV, longer sales cycle, white-label lock-in).

---

## 4. Pricing options & packaging (anchored to the real 5 tiers)

### 4.1 Keep the five-tier ladder — it is well-constructed

The existing ladder is genuinely good and needs **no re-pricing for launch**:

- **£29 → £79** is a 2.7× step justified by 5→25 properties + advanced reports.
- **£79 → £149** is the *money step*: adds AI Copilot + portals + automation +
  100 properties/10 seats. This is where landlords become agencies. Protect it.
- **£149 → £299** adds white-label + SSO + owner portals + procurement rules +
  500 properties/25 seats — the agency tier.

Natural expansion is **engineered into the limits** (`gatePropertyCount`,
`gateTeamSeats` in `gates.ts`): the customer hits a wall exactly when they've grown
enough to pay more. This is best-practice usage-bounded SaaS.

### 4.2 Packaging recommendation: feature-gate the two USPs deliberately

| USP | Current gating | Recommendation |
|---|---|---|
| **AI Copilot** | Scale+ (`aiCopilot`, gates.ts) | ✓ Correct — keep as the headline Scale upsell. |
| **Planning engine** | *Not separately gated in code* `[VERIFY]` | **Gate it** as a premium module — see §5. Today it appears ungated; the brief says SPLIT OUT + price as premium. This is the single biggest unmonetised asset. |

### 4.3 Annual push

Annual is 10×/year (≈17% discount). For a self-funded landlord, **lead with annual on
the pricing page** — it improves cash and cuts churn. `[ASSUMPTION]` Add a "2 months
free" badge; it's already true in the catalogue but not necessarily surfaced.

---

## 5. The planning engine — premium pricing (biggest opportunity)

The brief names the planning/profitability engine as USP #2 and says **PROTECT,
price as premium, do NOT cut** (§2/§3, V1.5). In code it is not yet behind a billing
gate `[VERIFY]`. Three packaging options:

| Option | Mechanism | Price `[ASSUMPTION]` | Pros | Cons |
|---|---|---|---|---|
| **A. Bundle into Scale+** | Planning unlocks at Scale (£149) alongside AI | £0 incremental | Simple; strengthens the £79→£149 step | Leaves money on the table from R2R/BRRR buyers who'd pay *only* for planning |
| **B. Planning add-on** | New operator add-on, any tier | **£39/mo** `[ASSUMPTION]` | Captures planning-only buyers (flippers, sourcers); lands on the existing add-on rail | Risks under-pricing a core USP |
| **C. Planning-led entry SKU** | A "Propvora Plan" standalone (planning + light portfolio) | **£49/mo** `[ASSUMPTION]` | A second top-of-funnel door for deal-sourcers; land-and-expand into ops | New SKU to maintain; positioning overlap with Starter |

**Recommendation: A + B.** Bundle the planning *basics* into Scale to fortify the key
upgrade step, AND offer a **£39/mo planning add-on** so R2R/BRRR/flipper buyers (`03`
groups 8, 11) can buy the engine on Operator without forcing a full Scale upgrade.
Defer the standalone SKU (Option C) until there's evidence of planning-only demand.
Implementation: add a `planningEngine` feature key to `FeatureFlags` + a
`gatePlanning` helper mirroring `gateAiCopilot` (`gates.ts`), plus a `planning_pro`
add-on in the catalogue.

---

## 6. Usage-based & AI-credit pricing

- **AI credits already exist**: `ai_credits_1k` = £15 one-time for 1,000 credits
  (LIVE). AI Copilot access is plan-gated (Scale+); *consumption* is credit-metered.
  This hybrid (gate the feature, meter the usage) is the right model.
- **Recommendation:** give each AI-enabled tier a **monthly included credit
  allowance** `[ASSUMPTION]` (e.g. Scale 2,000/mo, Pro/Agency 10,000/mo), then sell
  top-ups at £15/1k. Surface a usage meter (admin already has `admin/ai-usage` +
  `gateAiCopilot`; cost control is a strength per brief §6). This protects margin on
  the most variable-cost feature and creates a natural expansion lever as AI usage
  grows.
- **Open Banking / WhatsApp / eSignature** add-ons (£15–£19/mo, not live) are
  usage-bearing — price the *access* as the add-on and pass *consumption* through (the
  display copy already says "usage extra" for WhatsApp/eSignature). Wire these live
  only when the underlying integration is real `[VERIFY]`.

---

## 7. White-label / agency pricing

- White-label is **both** a Pro/Agency entitlement (`whiteLabel`, £299 tier) **and** a
  £49/mo add-on for Scale (`white_label`, LIVE). Good: a Scale agency can buy branding
  for £149+£49=£198 before committing to £299.
- **Recommendation:** keep white-label as the **anchor reason to reach Pro/Agency**.
  For larger agencies, **Enterprise** (custom) should carry: SSO/SAML (already gated),
  dedicated onboarding (the £499 onboarding add-on becomes "included"), API access
  (£49 add-on → included), and a **per-property or per-seat volume deal** above 500
  properties `[ASSUMPTION: £0.50–£2.00 per managed property/mo as the enterprise
  meter]`. This converts the unbounded "∞ properties" into actual ACV expansion.

---

## 8. Marketplace take-rate, supplier lead & booking/guest monetisation (all V2)

These are **Layer D, flags OFF in V1** (brief §3/§6). Document the *eventual* model;
do not build/sell now.

| Stream | Mechanism | Price `[ASSUMPTION]` | Gate |
|---|---|---|---|
| **Marketplace take-rate** | % of supplier job value transacted via Propvora | 5–10% `[ASSUMPTION]` | `marketplaceEnabled` |
| **Supplier lead monetisation** | Promoted placement + emergency dispatch + pro profile | £19–£49/mo (in catalogue, not live) | `supplierWorkspace` |
| **Supplier verification** | Verified Plus manual review | £9/mo (catalogue) | — |
| **Booking / guest** | Direct-booking pages + booking take-rate | `booking_pages` £19/mo (not live) + 1–3% `[ASSUMPTION]` | `directBookingPages` / `bookingManagement` |
| **Escrow/disputes** | Payment processing margin | spread `[ASSUMPTION]` | `marketplacePayments`/`Escrow` |

**Critical commercial point:** every one of these is a **two-sided liquidity bet**
with a cold start (`03` groups 14–17). None produces revenue until the operator side
(the V1 wedge) has created supply-side demand. Treat them as **expansion optionality
the V1 customer base unlocks**, not launch revenue. The fact they're already coded
behind flags is the platform optionality the brief says justifies Model 2 over
Model 1.

---

## 9. Compliance / legal premium & planning-engine premium

- **Compliance is the moat but mostly *core* (Layer A, brief §3).** Basic compliance
  (cert tracking, expiry alerts) must be in every tier *including Starter* — it's the
  acquisition hook (compliance anxiety is the #1 buying trigger). **Advanced
  compliance/legal** (RRA-2026 possession workflows, HMO licence management, evidence
  packs) → Layer C, gate at Scale+ or as a **Legal/Compliance Pro add-on £29/mo**
  `[ASSUMPTION]`.
- **Why this split works:** give away enough compliance to *acquire* (the scare that
  makes them sign up), charge for the depth that *retains* (the possession case they'd
  pay a solicitor £500+ for). This mirrors the planning-engine A+B recommendation in §5.

---

## 10. Upsell / expansion / retention hooks

| Hook | Mechanism (in code) | Lever |
|---|---|---|
| **Property-count wall** | `gatePropertyCount` 402s at limit | Forces Starter→Operator→Scale as portfolio grows |
| **Seat wall** | `gateTeamSeats` 402s at limit, or +£9/seat add-on | Expansion as they hire |
| **AI Copilot gate** | `gateAiCopilot` (Scale+) | The £79→£149 upsell |
| **Portals = lock-in** | `portals`/`ownerPortals` (Scale/Pro) | Tenants + owners on the platform → near-zero churn (`03` §12–13) |
| **White-label** | `whiteLabel` (Pro / +£49 add-on) | Agency brand sunk-cost |
| **Storage wall** | `gateStorage` (2/10/50/200 GB) | Soft expansion (documents accumulate) |
| **Planning engine** | (proposed §5) | Premium upsell + planning-led acquisition |

**Retention thesis:** the strongest moat is **portals + accumulated compliance/document
history**. Once an agent's landlords and tenants log into Propvora and three years of
cert evidence lives there, switching cost is prohibitive. Prioritise portal adoption
as the #1 retention metric.

---

## 11. Virality / referral + affiliate fit

- **Affiliate programme already exists** (memory: two enrolment doors external/internal,
  one cash-commission ledger, payouts **flag OFF**, `project-affiliate.md`). This is the
  intended viral channel.
- **Referral fit by group (`03`):** small landlords (group 1) and portfolio landlords
  (group 2) are highly networked in landlord forums/WhatsApp groups → **landlord-to-
  landlord referral** is the cheapest CAC. Agents refer *other* agents less readily
  (competitive), so weight referral incentives toward landlords.
- **Built-in virality:** every tenant/owner portal invite is a branded Propvora
  touchpoint (especially when *not* white-labelled) — a free top-of-funnel impression
  on the operator's own contacts. **Recommendation:** keep Propvora branding on
  portals for non-white-label tiers (it already is), making each operator a
  distribution surface.
- **Affiliate £ `[ASSUMPTION]`:** 20–30% first-year recurring commission, capped at
  12 months, paid from the cash-commission ledger when payouts flip on. Defer turning
  payouts on until billing is proven live `[VERIFY]`.

---

## 12. Partner & beta channels; first-100-customers route

**Partner channels:** landlord associations (NRLA), HMO/property-investor communities,
mortgage brokers & property-sourcers (feed the planning engine), accountants
(integration partners, not competitors — §18 of `03`), letting-agent networks.

**First 100 customers (concrete route):**
1. **HMO/portfolio landlords via communities** (NRLA, Property Hub, HMO Facebook
   groups) — compliance-anxiety hook, founder-led, free migration (the £499 onboarding
   add-on given gratis to the first cohort) → first ~40 logos.
2. **Landlord referral loop** — early customers refer peers; affiliate incentive →
   next ~30.
3. **Small letting agents via white-label + owner-portal demo** — higher-touch, 2–6
   week cycle → next ~30 (higher ACV).
4. **Content/SEO on RRA-2026 + HMO licensing** — the compliance moat doubles as the
   inbound magnet.

Target mix at 100: ~70 landlords (Operator/Scale) + ~30 agents (Scale/Pro-Agency).
Blended ACV `[ASSUMPTION]` ≈ £130/mo → ~£13k MRR / ~£156k ARR from the first 100.

---

## 13. Biggest revenue risks

1. **Add-ons are vapour.** 17 of 22 add-ons (all supplier + 9 operator) have
   `priceId: null` — **not sellable** (`catalog.generated.json`). Any pricing-page
   claim referencing them today is selling something that can't be bought `[VERIFY]`.
   *Action:* hide non-live add-ons from the public pricing page until wired.
2. **Planning engine unmonetised.** The #2 USP appears ungated `[VERIFY]` — giving
   away the premium differentiator. *Action:* §5.
3. **Over-broad surface confuses the buyer.** ~670 routes / supplier + customer +
   marketplace surfaces risk a "what *is* this?" reaction (brief §4: 30-second
   comprehension, ≤8 nav). *Action:* the flag-hiding plan (`17`) must ship before
   public launch.
4. **Cold-start dependence.** Any revenue model leaning on marketplace/supplier/guest
   liquidity (§8) earns £0 until the operator base creates it. *Action:* keep flags OFF;
   don't forecast V2 revenue into V1 plans.
5. **Billing not proven live.** Five plans + 5 add-ons have live Stripe IDs, but
   end-to-end checkout/webhook reliability is `[VERIFY]` (admin has `stripe-events`).
   *Action:* a clean paid checkout is the true definition of "launch-ready".
6. **Price-anchoring at the bottom.** Heavy Starter (£29) acquisition can anchor the
   brand cheap. *Action:* lead the pricing page with Operator (already `popular`) and
   annual.

---

## 14. Fastest path to first paying customers

1. **Confirm live checkout works** end-to-end on all 5 plans + the 5 live add-ons
   `[VERIFY]` — nothing else matters until a card can be charged.
2. **Ship the flag-hidden V1 surface** (brief §4 targets) so the product reads as a
   focused operator OS in 30 seconds.
3. **Lead with HMO/portfolio landlords**, compliance hook, free onboarding for the
   first cohort, founder-led sales.
4. **Gate + light up the planning engine** as the premium hook (§5) — it's the demo
   moment that closes deal-driven buyers.
5. **Turn on annual-first pricing + landlord referral.**

Fastest realistic path to *first paid*: a focused operator wedge + working checkout +
a founder selling into 2–3 landlord communities can land first paying customers in
weeks, not quarters — because the buyer self-funds and decides fast (`03` §3).

---

## 15. What makes Propvora worth paying for NOW

In one sentence for the V1 buyer: *"It keeps me legally compliant (RRA-2026, HMO,
certs) and shows me which deals make money — and it replaces three tools and a
spreadsheet."* Concretely, the pay-now value is:

- **Compliance peace of mind** — cert/HMO/possession tracking with evidence trail
  (Layer A; the #1 buying trigger).
- **Consolidation** — lettings + maintenance + money + portals in one place (brief §2).
- **The planning engine** — the only PMS-adjacent tool that tells you whether the
  *next* deal works (USP #2).
- **Portals** — fewer tenant calls, professional owner reporting (retention + the
  agent's competitive weapon).

What is **not** a reason to pay now (and shouldn't be sold as one): marketplace,
consumer booking, independent supplier SaaS, full in-app accounting GL — all Layer D,
flags OFF, V2.

---

## 16. The three commercial models — scored

Scored 1–10 (10 = best outcome for Propvora). Models per brief §1.

| Criterion | **M1 Focused SaaS** (narrow ops/compliance only) | **M2 Staged OS** (wedge now, sides behind flags) ✅ | **M3 Full platform** (all sides at launch) |
|---|---|---|---|
| Launch speed | 9 | **8** | 2 |
| Build/support complexity (10 = simplest) | 8 | **6** | 2 |
| Customer clarity | 9 | **8** | 3 |
| Revenue (12–24mo) | 5 | **8** | 4 |
| Unicorn potential | 3 | **9** | 8 |
| Risk (10 = lowest) | 7 | **7** | 2 |
| Differentiation | 6 | **9** | 8 |
| GTM ease | 8 | **8** | 3 |
| Data moat | 4 | **8** | 7 |
| Ops burden (10 = lightest) | 8 | **6** | 2 |
| **Total /100** | **67** | **77** | **41** |

**Notes per model:**

- **M1 Focused SaaS (67).** Fastest, clearest, lightest — but **throws away the
  planning USP and the platform optionality already built** (brief rejects it). Caps
  out as a "nice UK PMS"; low unicorn ceiling, weak data moat. It wins on speed and
  loses on ambition.
- **M2 Staged OS (77) — RECOMMENDED, and matches the brief's binding verdict.** You
  ship the *same focused, sellable product as M1* (so launch speed and clarity stay
  high — the extra surface is flag-hidden, not in the buyer's face), while **keeping
  the marketplace/consumer/supplier sides in code behind master flags** for staged
  release. Highest blended score because it keeps M1's go-to-market simplicity *and*
  M3's platform/data-moat upside, sequenced to avoid cold starts. The cost is ops
  burden (maintaining flag-hidden code) and discipline (not leaking V2 surface into
  V1 nav) — manageable, and exactly what the flag registry (`src/lib/flags/registry.ts`)
  and admin control plane exist to do.
- **M3 Full platform (41).** Four cold starts, no liquidity, diluted story, unsellable
  clarity, brutal ops burden. High theoretical unicorn/differentiation but the lowest
  *survival-weighted* score. The brief rejects it; the scoring confirms it.

**Recommendation: Model 2 (Staged OS).** It is the only model that preserves both
moats, fits the in-code pricing ladder without rework, and uses the existing
feature-flag + admin infrastructure as designed. Ship the operator wedge, keep the
rest dark, expand on traction.

---

## 17. Contradictions flagged (per brief §1 — do not silently diverge)

1. **Add-on catalogue vs. "sellable V1".** `catalog.generated.json` ships 17 add-ons
   with `priceId: null` (every supplier add-on + 9 operator add-ons). They are
   *designed and displayed* (`ADDON_DISPLAY` in `plans.ts`) but **cannot be
   purchased**. Consistent with the staged verdict (supplier = V2), but it means the
   add-on layer is largely roadmap, not revenue. **Reconcile in `19`:** decide which,
   if any, operator add-ons (Open Banking, accounting sync, MTD, eSignature) get wired
   live for V1.5, and confirm all supplier add-ons stay dark until marketplace flags
   flip. `[VERIFY]`
2. **Planning engine: "premium hook" (brief §2/§3) vs. apparently ungated in billing
   code.** No `planningEngine` key in `FeatureFlags` (`entitlements.ts`) and no planning
   gate in `gates.ts` `[VERIFY]`. The brief says price it premium; the code doesn't yet
   gate it. **Reconcile in `19`** via §5 (gate at Scale + £39 add-on).
3. **Supplier "monetised via paid add-ons" (brief §6) vs. all supplier add-ons not
   live.** The brief describes supplier monetisation (promoted ranking, emergency
   availability) as a present mechanic; in code it's £0 free tier + null-priced add-ons.
   Not a true contradiction — it's the staged plan working as intended (supplier
   revenue is V2) — but any external claim of supplier monetisation today is premature.
