# Propvora Commercial Audit + Competitive Analysis

**Date:** 2026-06-15
**Entity:** Blackwellen Ltd t/a Propvora
**Branch:** Propvora-release-version.2.0
**Scope:** Commercial / competitive analysis only. No app code was modified. Every Propvora claim below is grounded in files read in the repo (paths cited inline).

---

## 1. Executive Summary

### The thesis
Propvora's v2 bet is the **"one operating system for the whole property transaction"**: a single platform where an **operator** runs the portfolio (ops, money, compliance, work), invites **suppliers** into free workspaces, sells/serves **customers** (tenants, guests, owners) through portals and direct booking, and clears money between all three sides via **Stripe Connect with escrow-style holds, KYC and a DB-driven marketplace take rate** — wrapped in **automation** and an **international capability framework**. The commercial model is a **SaaS-plus-marketplace hybrid**: five operator subscription tiers (£29–£299/mo + custom Enterprise), ~17 add-ons split across operator and supplier audiences, a permanent **free supplier tier**, and a **2.5% default marketplace fee** that rises to 5% for higher-burden jobs.

### Who it competes with
Propvora doesn't sit in one category — it straddles four, and that is both its differentiation and its risk:
- **Property-ops / compliance SaaS** — Arthur Online, Re-Leased, COHO (HMO), Landlord Vision, Hammock, Reapit/MRI/Yardi (up-market).
- **Maintenance + contractor marketplaces** — Fixflo, Plentific, plus consumer trade directories (Checkatrade, MyBuilder, Rated People) as the supplier-acquisition reference.
- **Short-stay PMS / channel** — Guesty, Hostaway, Lodgify, Hospitable, Uplisting; Breezeway for ops.
- **Marketplace/payments hybrids** — the vertical-SaaS-plus-fintech pattern (sub-1% SaaS take rate vs 20%+ marketplace take rate; Propvora's 2.5–5% sits deliberately between).

### Headline verdict
**The engineering is well ahead of the commercialisation.** The v2 backend is genuinely strong and unusually disciplined: a DB-driven fee engine with specificity resolution and a safe fallback (`src/lib/marketplace/fees.ts`), real escrow hold/release/refund state machine (`src/lib/payments/escrow.ts`), honest KYC that reuses Connect onboarding rather than faking verification (`src/lib/identity/verification.ts`), a workspace-typed entitlement system that keeps suppliers free (`src/lib/billing/entitlements.ts`), and a comprehensive admin control plane (disputes, payouts, transactions, risk, verification — `src/app/(admin)/admin/marketplace/*`, `/risk`, `/verification`). Marketplace and booking front-ends are real client islands (270–430 lines each), not stubs.

But as a **commercial proposition** there are four material gaps: (1) **the booking pillar has no channel/OTA distribution** — no Airbnb/Booking.com/Vrbo/iCal sync exists anywhere in `src/lib/booking` or `src/lib/marketplace`, which is the single most important feature a short-stay PMS sells; (2) **marketplace liquidity is unproven and unfunded** — the model assumes free suppliers will arrive, but there is no supplier-acquisition surface, no seeded supply, and no take-rate justification beyond "lower than OTAs"; (3) **pricing is property-count-based while the platform's cost and value are increasingly transaction- and seat-based**, leaving marketplace/booking GMV almost entirely uncaptured outside the 2.5% fee; and (4) **the international framework is a control-plane scaffold with only GB actually enabled** (`src/lib/international/countries.ts`), so "global platform" is a roadmap claim, not shippable revenue. Propvora is a credible UK operator+compliance product with a real, well-built marketplace substrate — but the marketplace and booking sides are currently **infrastructure in search of demand and distribution**.

---

## 2. Product Inventory

| Pillar | What exists (grounded in repo) | Maturity |
|---|---|---|
| **Operator ops core** (portfolio, work, contacts, calendar, planning, money, documents) | Full section set under `src/app/(app)/app/*` — portfolio, work, contacts, calendar, planning, money (income/expenses/arrears/rent-chase/deposits/bills/invoices), documents, messages. This is the V1 product and it is dense. | **Solid** |
| **Compliance** | Dedicated `compliance` section + automation triggers (`compliance_due_soon`, `compliance_overdue` in `src/lib/automation/catalogue.ts`). UK-grade (Gas/EICR/EPC). | **Solid** |
| **Money / accounting** | `money` section with deposits, arrears, rent-chase, bills, invoices, supplier-payments, payouts, Stripe; double-entry ledger lib (`src/lib/accounting/ledger.ts`). | **Solid** |
| **Supplier marketplace** | `src/lib/marketplace/{listings,search,transactions,reviews,disputes,fees,risk,terms}.ts` + `src/lib/supplier/*` (profile, jobs, quotes, coverage, availability). App: `marketplace/`, `marketplace/[id]`, `my-listings`. Rich client islands (`MarketplaceBrowseClient`, `MyListingsClient`, `ListingFormDialog`). | **Solid (supply-empty)** |
| **Short-stay / direct booking** | `src/lib/booking/{availability,pricing,rates,reservations}.ts` — pure pence quoting, weekend uplift, anon checkout via SECURITY DEFINER. App: `bookings/`, `bookings/[id]`, `bookings/listings`; islands `BookingsOverviewClient`, `ReservationDetailClient`, `BookingCalendar`. | **Solid core, NO channel/OTA** |
| **Payments + escrow** | `src/lib/payments/{escrow,intents,connect-transfers,payouts,refunds,reconciliation,webhooks}.ts`. Real hold→release→refund state machine; release tied to source status. | **Solid** |
| **KYC / trust** | `src/lib/identity/{verification,screening,documents}.ts`. Honest: treats fully-enabled Connect account as identity proof; status only set by webhook/admin. Sanctioned-country hard-block in code. | **Solid** |
| **Customer workspaces** | `src/lib/customer/*` + portals (`portals` section, `src/lib/portal/messaging.ts`). Tenant/landlord/owner portals. | **Solid–thin** (portal UX exists; customer-side depth lighter than operator) |
| **Automation v2** | `src/lib/automation/*` (engine, evaluate, execute, dry-run, caps). 12 app surfaces incl. Canvas. Catalogue ~23 trigger/action defs, but only **8 templates** in `templates.ts`. All actions reversible/safe by design. | **Solid engine, thin template library** |
| **Admin control plane + risk** | `src/app/(admin)/admin/*`: marketplace (disputes, payouts, transactions, workspaces), risk + per-workspace risk, verification, subscriptions, stripe-events, audit, health, data-requests. `src/lib/risk/*` advisory scoring engine. | **Solid** |
| **Network / agency** | `src/lib/network/*` (partners, activity); `network` section. | **Thin** |
| **International / jurisdiction** | `src/lib/international/*` (countries, jurisdiction, tax, guardrails, sections). GB is the only hard-coded *enabled* profile; others are a `country_packs` control-plane scaffold. Sanctioned-country list enforced. | **Stub→scaffold (GB-only live)** |
| **Commercial model** | `src/lib/billing/{plans,entitlements,gates,connect,checkout}.ts` + `catalog.generated.json`. 5 tiers, 17 add-ons (9 operator new + 8 supplier), free supplier tier, DB-driven fee rules. **Supplier add-on Stripe products are null** (owner hasn't run setup script). | **Solid model, half-provisioned** |

---

## 3. Competitor Landscape

### 3a. UK / global property-ops + compliance SaaS

| Product | Positioning | Pricing model | Better than Propvora | Worse than Propvora |
|---|---|---|---|---|
| **Arthur Online** | Mid-market lettings/PM ops | ~£70/mo Standard (+£1.40/unit), ~£96/mo Pro (+£1.60/unit), Enterprise ~£126 | Mature integrations marketplace, established agency base, per-unit elasticity | No supplier marketplace, no native escrow/marketplace fee, no direct-booking |
| **Re-Leased** | Premium commercial/large portfolio | Quote-based, premium | Commercial-grade lease accounting, enterprise credibility | Heavy/expensive; not multi-sided; no SMB on-ramp |
| **COHO** | HMO / co-living specialist | £30/mo up to 12 units, +£2.50/unit | Best-in-class HMO room-level model + tenant-find network | Narrow (HMO); no marketplace/booking/payments breadth |
| **Landlord Vision** | Landlord accounting + MTD | From £21.97/mo | Deep accounting, native HMO rent-roll, MTD-recognised | Accounting-first, not an ops/marketplace platform |
| **Hammock** | Banking-led landlord software, MTD | £8/mo → £25+VAT/mo | First HMRC MTD-recognised landlord software, banking UX | Narrow scope; no supplier/booking/marketplace |
| **Reapit / MRI / Yardi** | Enterprise agency/commercial | Enterprise quote | Scale, breadth, brand | Legacy, slow, costly; no SMB multi-sided play |

**Read:** Propvora's per-property tiers (£29–£299) are priced **above** the lightweight landlord tools (Hammock/Landlord Vision/COHO at £8–£30) and **in line with** Arthur. That is defensible *only because of the v2 breadth* — but the breadth (marketplace/booking/payments) is exactly the part that is unproven. Against COHO/Hammock specifically, Propvora is more expensive for a landlord who just wants HMO or MTD.

### 3b. Compliance / maintenance + contractor marketplaces

| Product | Positioning | Pricing model | Better | Worse |
|---|---|---|---|---|
| **Fixflo** | Repairs/maintenance workflow + vetted contractor network | ~£50/mo software fee, min 50 properties, 4 tiers | Category leader for repairs intake; established contractor network; works-management fee up to ~20% in partner setups | Not a full ops platform; bolt-on, not multi-sided OS |
| **Plentific** | Enterprise vendor/contractor marketplace (social housing, large landlords) | Enterprise / custom | AI-guided competitive quoting, scale, large-landlord credibility | Enterprise-only; no SMB/landlord self-serve; no booking |
| **Checkatrade / MyBuilder / Rated People** | Consumer trade lead directories | Checkatrade ~£30+VAT/mo+; MyBuilder pay-per-shortlist (leads from ~£7); Rated People membership/unlimited-leads | Massive existing supplier supply + consumer demand | Not B2B/operator-integrated; lead-quality complaints; no ops/compliance |

**Read:** This is where Propvora's **2.5–5% transaction model is genuinely differentiated** — it is structurally cheaper and more transparent than Fixflo's up-to-20% works fee and avoids the lead-fee fatigue suppliers feel on Checkatrade/MyBuilder. The free supplier tier is the right liquidity strategy. **But Propvora has zero existing supply**, while these incumbents have national contractor density. The model is sound; the cold-start problem is unsolved.

### 3c. Short-stay / direct booking + channel

| Product | Positioning | Pricing model | Better | Worse |
|---|---|---|---|---|
| **Guesty** | Enterprise STR PMS + Distribution Hub | ~$16–$300/listing/mo across tiers | 60+ channel sync (Airbnb/Vrbo/Booking.com), the category standard for 20+ listings | Expensive; not an operator/compliance OS; no supplier marketplace |
| **Hostaway** | Mid-market STR PMS + channel | Custom, ~$20–40/listing/mo + ~$500 setup | 200+ integration ecosystem, strong channel | No public pricing; STR-only |
| **Lodgify** | SMB STR + direct booking site | ~$16/listing/mo + 1.9% booking fee | Direct-booking website builder + channel | STR-only; thin ops |
| **Hospitable** | Automation-led STR | ~$32/mo for 5 listings | Best messaging automation; cheap per-listing | STR-only; no marketplace/compliance |
| **Breezeway** | STR operations/cleaning | Ops add-on | Best-in-class turnover ops | Ops-only, not a PMS |

**Read:** **This is Propvora's weakest competitive position.** Every serious short-stay tool's core value is **channel distribution** (sync to Airbnb/Vrbo/Booking.com) and Propvora has **none** — confirmed by zero OTA/iCal references in `src/lib/booking` or `src/lib/marketplace`. Propvora's booking is a *direct-booking + internal marketplace* engine only. A short-stay operator cannot replace Guesty/Hostaway with Propvora today; they would run Propvora *alongside* one. The 2.5–5% public-booking fee is moot if there is no demand channel feeding it.

### 3d. Marketplace / payments / monetisation patterns

- **Vertical SaaS** typically monetises at **<1% take rate**; **marketplaces at 20%+** (Tidemark / Origami benchmarks). Propvora's **2.5–5%** is a deliberate middle path — low enough to be defensible vs Fixflo/OTAs, high enough to matter *if GMV materialises*.
- **Hybrid pricing** (subscription + usage/transaction) is now used by ~43% of SaaS, projected ~61% by end-2026, and correlates with ~38% higher revenue growth (Chargebee/SaaSMag). Propvora's hybrid instinct is on-trend.
- **Airbnb** host fee ~3% (split model); OTA partner commissions materially higher. Propvora's "below OTA" framing in `docs/upgrade/new subscription and addon tiers.md` §7 is accurate.

---

## 4. Value-Proposition Assessment per Pillar

### Operator ops + compliance — **STRONG**
- **Strength:** Genuine depth across portfolio/money/compliance/work; double-entry ledger; UK compliance baked into automation triggers. This is a real, sellable product **today** with no marketplace dependency.
- **Differentiation:** The integration with everything else (one record flows from compliance → work → supplier job → payment) is the moat the point tools lack.
- **Risk:** Priced above COHO/Hammock/Landlord Vision for a landlord who only wants their niche. Needs the v2 breadth to justify the premium — circular dependency on the unproven pillars.

### Supplier marketplace — **STRONG SUBSTRATE, NO LIQUIDITY**
- **Strength:** Best-engineered pillar. DB-driven fees with specificity resolution, disputes with SECURITY DEFINER resolution authority, reviews + trust scores, risk engine, free supplier entry. Commercially the cleanest story (low transparent fee vs Fixflo 20% / OTA).
- **Differentiation:** "Operator already has the job → one click to marketplace" is a warm-supply advantage Checkatrade/MyBuilder can't replicate.
- **Risk:** **Cold start.** No supplier-acquisition funnel, no seeded supply, no demonstrated demand. A marketplace with no suppliers in a postcode is worse than no marketplace (erodes trust). Supplier add-on Stripe products are **null/unprovisioned** in `catalog.generated.json`.

### Booking / short-stay — **CORE OK, DISTRIBUTION MISSING**
- **Strength:** Honest, well-built quoting + anon checkout + escrow on stays.
- **Differentiation:** Direct booking inside the operator OS (no separate tool) is nice — *but only as a complement.*
- **Risk:** **No channel manager / OTA / iCal sync.** This is the defining feature of the category and its total absence means Propvora cannot win a short-stay operator as their primary tool. The public-booking marketplace fee has no traffic source.

### Payments / escrow — **STRONG + HONEST**
- **Strength:** Real Connect transfers, hold/release/refund, reconciliation, webhooks. Code is explicitly honest about *not* calling it "escrow" unless the regulated flow supports it (`docs/upgrade` §6, `escrow.ts` header).
- **Risk:** The compliance/regulatory framing of holding client money (CASS / client-money-protection in UK lettings) is not addressed in code — a liability/positioning gap for an agency buyer. The honesty is good engineering but the *commercial* trust story (CMP scheme, ring-fencing) is unwritten.

### KYC / trust — **STRONG**
- **Strength:** Reuses Connect KYC, never auto-approves, sanctions hard-block. This is exactly right for a marketplace.
- **Risk:** Trust badges + verified-plus are a revenue line (`supplier_verified_plus`) but the *liability model* (who is responsible if a "verified" supplier causes damage?) — i.e., marketplace operator liability, insurance, indemnity — is not surfaced commercially.

### Automation — **STRONG ENGINE, THIN CATALOGUE**
- **Strength:** Safe-by-design (all actions reversible), caps, dry-run, Canvas. Tier-gated cleanly.
- **Risk:** Only **8 templates**. Hospitable/automation-led competitors win on recipe breadth. Thin library undersells the engine.

### International — **SCAFFOLD ONLY**
- **Strength:** Architecturally real (jurisdiction control plane, tax, guardrails, sanctions).
- **Risk:** **GB is the only enabled profile.** "Global platform" / "country packs" is a roadmap, not revenue. Selling `country_pack_beta` (£19/mo) against a scaffold is a credibility risk.

---

## 5. Commercial Gaps (with recommendations + priority)

| # | Gap | Why it matters | Recommendation | Priority |
|---|---|---|---|---|
| 1 | **No channel/OTA distribution for bookings** (no Airbnb/Vrbo/Booking.com/iCal sync anywhere in `src/lib/booking`). | The booking pillar cannot compete with Guesty/Hostaway/Lodgify, whose entire value is distribution. The public-booking marketplace fee has no demand source. | Either (a) ship at minimum **iCal two-way sync** + one OTA connection to make booking a real product, or (b) **reposition booking honestly** as "direct-booking + supplier marketplace for operators who already have demand," and stop implying short-stay PMS parity. Do not market a 2.5% public-booking fee until there is traffic. | **P0** |
| 2 | **Marketplace cold-start / no supplier acquisition surface.** Free supplier tier exists but nothing drives supply; supplier add-on Stripe products are unprovisioned (null in `catalog.generated.json`). | A 2.5% take rate on £0 GMV is £0. Empty-postcode results erode operator trust in the whole platform. | Build a **supplier-invite + onboarding funnel** (operators invite their existing contractors → instant warm supply), seed 2–3 launch categories/cities, and **run `stripe-setup-catalog.mjs`** so supplier add-ons can actually bill. Treat the operator's existing contractor list as the liquidity bootstrap. | **P0** |
| 3 | **Take-rate justification is thin / GMV largely uncaptured.** 2.5–5% is asserted as "below OTAs" but there's no value-add (no insurance, no guarantee, no dispute-backed protection bundled with the fee). | Suppliers/operators will route around a fee that buys them nothing they couldn't get with a manual supplier (which the model itself charges 0% for). | Attach **tangible value to the fee**: payment protection / escrow guarantee, dispute resolution SLA, verified-supplier indemnity, or work guarantee. Make the marketplace job *safer* than the manual job, justifying the 2.5%. Otherwise operators will keep adding suppliers manually at 0%. | **P0** |
| 4 | **Pricing axis (property count) is misaligned with cost & value drivers (seats, AI, transactions, GMV).** Tiers gate on properties/seats; marketplace and booking GMV mostly escape capture beyond the flat fee; AI/automation are infra-cost centres gated only loosely. | Heavy marketplace/booking users on a low property tier can consume disproportionate infra and GMV while paying little. Conversely a 500-property Pro/Agency may barely touch v2. | Introduce a **GMV/transaction-volume dimension** to packaging (e.g. fee tiers that drop with subscription level, or a marketplace-volume add-on), and consider **seat/AI-credit-led** elasticity for agencies. Align the public pricing page with `plans.ts` (note: white-label was £99 on legacy page vs £49 canonical — already flagged in upgrade doc §8). | **P1** |
| 5 | **Marketplace operator liability / trust framing absent commercially.** Code is honest about not over-claiming escrow, but there is no public trust/safety, insurance, indemnity, or client-money-protection (CMP/CASS) positioning. | UK lettings agencies are legally required to use CMP schemes; a marketplace handling third-party money/work without a clear liability and protection story is a hard sell to agency buyers and a litigation risk. | Publish a **trust & safety + money-protection model**: who holds funds, CMP scheme membership, supplier-vetting liability boundaries, dispute guarantees. This is both a sales asset and a risk mitigant. | **P1** |
| 6 | **International revenue is a scaffold.** Only GB enabled; `country_pack_beta` is sellable against non-functional packs. | Selling beta country packs against a scaffold risks refunds and credibility damage; "global" positioning is currently aspirational. | Keep international as **roadmap/Enterprise-bespoke only** until a 2nd country profile is genuinely enabled. Don't list `country_pack_beta` on the public catalogue yet. | **P1** |
| 7 | **Automation template library too thin (8 templates).** | Undersells a strong engine; automation-led competitors (Hospitable) win on recipe breadth. | Expand to **25–40 templates** mapped to the compliance/work/booking/supplier lifecycle. Cheap, high-perceived-value, drives Scale-tier upgrades. | **P2** |
| 8 | **No distribution / GTM surface for the platform itself.** No referral/affiliate-for-suppliers, no public supplier directory SEO, no partner channel beyond the existing affiliate programme. | A multi-sided platform needs a demand *and* supply acquisition engine; reliance on operator self-serve caps liquidity. | Add a **public, SEO-indexed supplier directory** (demand magnet + supply incentive) and a supplier referral loop. Leverage the existing affiliate infra (`src/lib/affiliate/*`) toward supplier acquisition. | **P2** |

---

## 6. Prioritised Commercial Roadmap (shortlist)

1. **(P0) Decide the booking story.** Ship iCal/OTA sync *or* reposition booking as direct-only + marketplace. Do not sell against Guesty without distribution. — *unblocks the booking pillar's credibility.*
2. **(P0) Bootstrap marketplace liquidity from operators' own contractors.** Invite funnel + seeded launch categories + run the Stripe setup script so supplier add-ons bill. — *turns the best-built pillar into actual GMV.*
3. **(P0) Make the take rate buy something.** Bundle payment protection / dispute SLA / verified-supplier indemnity into the 2.5% so the marketplace job beats the free manual job. — *justifies monetisation; defends against route-around.*
4. **(P1) Add a GMV/transaction dimension to packaging** and finish pricing-page ↔ `plans.ts` reconciliation. — *captures the value the flat fee misses.*
5. **(P1) Publish the trust/safety + client-money-protection model.** — *unlocks agency buyers; mitigates liability.*
6. **(P1) Hold international as Enterprise-bespoke**; pull `country_pack_beta` from the public catalogue until a 2nd country is live. — *protects credibility.*
7. **(P2) Expand automation templates to 25–40; launch a public supplier directory** for SEO-driven supply/demand. — *upsell + distribution flywheel.*

---

## 7. Bottom Line

Propvora has built a **genuinely strong, honest v2 platform substrate** — the fee engine, escrow, KYC, entitlements, disputes and admin control plane are better-engineered than most early marketplaces. The **operator + compliance core is a real, sellable UK product today.** The commercial weakness is not the code — it is that the **marketplace and booking sides are infrastructure without demand, distribution, or a monetisation hook that buys the customer anything**, and the **pricing axis doesn't yet capture the transaction value the platform is built to move.** Fix distribution (booking), liquidity (suppliers), and fee-value (protection) before scaling spend on the v2 surfaces. The "one OS for operator + supplier + customer + marketplace + compliance" thesis is differentiated and defensible — but only once at least one of the two marketplace sides has real liquidity behind it.

---

## Sources

- [Arthur Online pricing — Capterra UK](https://www.capterra.co.uk/software/145260/arthur-online)
- [Re-Leased pricing — Capterra UK](https://www.capterra.co.uk/software/133226/re-leased)
- [Best PM software for UK landlords 2026 — Landlord Studio](https://www.landlordstudio.com/uk-blog/best-property-management-software-for-uk-landlords)
- [PM software costs 2026 — Property Store](https://www.property-store.co.uk/post/how-much-does-property-management-software-cost-in-2026)
- [COHO pricing — Capterra UK](https://www.capterra.co.uk/software/1022425/coho)
- [Landlord Vision vs Hammock 2026 — RentalBux](https://rentalbux.com/blogs/landlord-vision-vs-hammock)
- [Best HMO management software 2026 — Letavo](https://letavo.co.uk/blog/hmo-management-software-uk)
- [Fixflo pricing — Capterra](https://www.capterra.com/p/163230/Fixflo-Lettings/)
- [Plentific contractor marketplace](https://www.plentific.com/contractor-marketplace/)
- [Guesty vs Hostaway vs Lodgify — Guesty](https://www.guesty.com/blog/guesty-vs-hostaway-vs-lodgify/)
- [Hostaway pricing 2026 — Comparatif Channel Manager](https://comparatifchannelmanager.fr/en/hostaway-pricing/)
- [Best STR channel managers 2026 — StaySTRA](https://staystra.com/best-str-channel-manager-2026-hostaway-guesty-lodgify-ownerrez-beds24/)
- [Vacation rental channel manager 2026 — Comparatif Channel Manager](https://comparatifchannelmanager.fr/en/vacation-rental-channel-manager/)
- [Marketplace take rate guide 2026 — Origami](https://origami-marketplace.com/en-gb/marketplace-take-rate-a-guide-for-marketplace-operators/)
- [Marketplace take rates — Tidemark](https://www.tidemarkcap.com/vskp-chapter/marketplace-take-rates)
- [Hybrid pricing in SaaS 2026 — SaaSMag](https://www.saasmag.com/hybrid-pricing-saas-growth-2026/)
- [Vertical SaaS M&A/VC report 2026 — SaaSRise](https://www.saasrise.com/blog/vertical-saas-ma-vc-report-2026)
