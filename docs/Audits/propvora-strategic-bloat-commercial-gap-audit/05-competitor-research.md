# 05 — Competitor Research

**Status:** Draft · 2026-06-18 · Author: Market Analyst
**Aligns to:** `_shared-strategic-brief.md` (verdict = staged property OS; wedge =
UK property-ops + compliance; USP = UK regulatory depth + strategy/profitability
planning + operator/tenant/landlord/supplier portals + AI ops).

> **Sourcing discipline.** Every pricing/feature claim below carries a source URL.
> Claims I could not verify against a live source are marked `[VERIFY]`.
> Pricing for enterprise tools (Reapit, MRI, Street, Goodlord, PayProp, Rightmove,
> Zoopla, Fixflo) is quote-only — public figures are third-party estimates and are
> marked `[VERIFY]` accordingly. All FX: STR tools price in USD; noted inline.

---

## 0. How to read this document

For each competitor I give: **what they do · who they sell to · strongest
features · weakest gaps · pricing/model (source) · COPY · AVOID · DIFFERENTIATE ·
direct/indirect · wedge-fit**. "Wedge-fit" maps the competitor to Propvora's
layer model (§3 of the brief): does it threaten the **V1 SaaS wedge (Layer A/B)**,
the **planning premium (Layer C)**, or only a **later flag-gated module (Layer D)**?

The single most important market finding sits up front because it is the whole
investment thesis:

> **The UK property operator runs a STACK, not a platform.** A typical
> self-managing portfolio landlord / small agent in 2026 bolts together: a CRM or
> spreadsheet for tenancies + **Fixflo** for repairs/compliance + **Landlord
> Vision/Hammock/Xero** for accounting/MTD + **OpenRent/Rightmove** for listings +
> **Goodlord** for referencing + **PayProp/GoCardless** for rent + **Airbnb/
> Hostaway** for any SA units + **Checkatrade** to find a plumber. No single
> incumbent owns *compliance + planning + portals + AI ops* in one paid product.
> The market itself describes the state of the art as "stacking complementary
> platforms… true all-in-one solutions remain aspirational" — this is the
> white-space Propvora is built for. (Source: MRI / Lightwork / Buildium proptech
> 2026 trend pieces — see Synthesis §8.)

---

## Category 1 — UK property / letting management

These are Propvora's **most direct** competitors — they fight for the same
operator budget and the same "run my lettings operation" job-to-be-done.

### Summary table

| Competitor | Who they sell to | Pricing (model) | Source | Direct/Indirect | Threatens layer |
|---|---|---|---|---|---|
| **Arthur Online** | Self-managing landlords + small/mid agents, ~50+ units | Standard £70/mo, Pro £96, Enterprise £126; + per-unit £1.40–£1.80 over threshold; annual billing | [arthuronline.co.uk/pricing](https://www.arthuronline.co.uk/pricing); [capterra.co.uk](https://www.capterra.co.uk/software/145260/arthur-online) | **Direct** | A + B (portals) |
| **Reapit** | Multi-branch agencies, corporate groups | Quote-only; est. £1,000–£2,000+/mo for 5+ staff `[VERIFY]` | [reapit.com](https://www.reapit.com/); [tradepick.co.uk](https://www.tradepick.co.uk/guides/best-software-estate-agents-uk-2026) | Indirect (up-market) | A |
| **MRI Software** | Enterprise residential + commercial, BTR, block | Quote/custom; est. ~£1/property/mo + £50–£200/user/mo `[VERIFY]` | [mrisoftware.com/uk](https://www.mrisoftware.com/uk/); [capterra.co.uk](https://www.capterra.co.uk/software/79570/mri-software) | Indirect (enterprise) | A |
| **Alto** (Houseful/Zoopla) | Mid-size letting + estate agents | Tiered from ~£35/user/mo `[VERIFY]` | [altosoftware.co.uk](https://www.altosoftware.co.uk/blog/best-estate-agency-crms-in-2026-alto-vs-reapit-vs-street/) | **Direct** (agents) | A + B (PropertyFile) |
| **Street.co.uk** | Modern single + multi-branch agents | Quote-only; "Cortex" AI add-on £149/mo `[VERIFY]` | [street.co.uk](https://street.co.uk/); [thenegotiator.co.uk](https://thenegotiator.co.uk/news/proptech/street-co-uk-releases-game-changer-ai-tool-for-estate-agents/) | **Direct** (agents) | A + AI |
| **Goodlord** | Letting agents (3,500+) | Per-tenancy, quote-only, not public | [goodlord.com](https://www.goodlord.com/); [capterra.co.uk](https://www.capterra.co.uk/software/201845/goodlord) | **Direct** (lettings flow) | A (onboarding/referencing) |
| **COHO** | HMO / co-living landlords + agents | £30/mo up to 12 units, +£2.50/unit; ~£1+VAT/room/mo | [coho.life/pricing](https://coho.life/pricing/) | **Direct (HMO ICP overlap)** | A + B |
| **Landlord Vision** | Self-managing landlords, tax-focused | Starter £19.97 (5 tenancies) → Enterprise £84.97 (25); MTD included | [landlordvision.co.uk](https://www.landlordvision.co.uk/landlord-software-pricing.html) | **Direct (landlord ICP)** | A (money) + accounting |
| **PayProp** | Agencies at rent-processing scale | License from ~£49/mo + <1% of volume + £600–£2,000 setup `[VERIFY]` | [payprop.com](https://www.payprop.com/); [uselatch.co.uk](https://www.uselatch.co.uk/blog/best-property-management-software-uk-2026) | **Direct (money rail)** | A (money) |

### Prose

**Arthur Online** is the closest structural analogue to Propvora's operator app:
one platform uniting property managers, agents, **tenants, owners and contractors**
via four separate apps (Occupant, Owner, Contractor, Portal) — the exact
four-portal fabric the brief names as USP #3. Its strongest feature is that
stakeholder model plus workflow automation and Xero integration. Its weakest gaps:
(a) **no MTD support at all** — material now that MTD-ITSA is mandatory from April
2026; (b) a **£70/mo floor that prices out sub-50-unit landlords**, which is *the
exact ICP Propvora targets first*; (c) no strategy/profitability planning engine.
([arthuronline.co.uk](https://www.arthuronline.co.uk/),
[capterra.co.uk](https://www.capterra.co.uk/software/145260/arthur-online))
- **COPY (structural):** the multi-app stakeholder model and per-unit overage
  pricing logic; their "Owner App approves maintenance quotes" flow is a clean
  pattern for Propvora's landlord portal.
- **AVOID:** the high price floor and the four-separate-apps fragmentation — keep
  Propvora's portals as one coherent fabric, not four downloads.
- **DIFFERENTIATE:** ship MTD-aware money **and** the planning engine **and**
  UK-compliance depth (RRA-2026, HMO) — Arthur has none of these together.
- **Wedge-fit:** direct threat to Layer A/B; beating Arthur on compliance + price
  for the <50-unit operator IS the wedge.

**Reapit** and **MRI Software** are the enterprise incumbents — 25-year, multi-
country platforms (Reapit just merged with **PayProp**, Dec 2025, and is shipping
the "RAI" AI copilot + no-code agent marketplace in summer 2026). They sell to
multi-branch corporates at four-figure monthly contracts. They are **indirect**
for V1: Propvora should not fight a 350-person enterprise sales motion. But they
signal where the puck goes — **AI copilots and no-code automation are becoming
table stakes at the top**, validating Propvora's Layer-C AI + `canvasLite`
automation bets while warning against full Layer-D automation-canvas scope.
([reapit.com](https://www.reapit.com/),
[propertywire.com](https://www.propertywire.com/company-news/reapit-launches-ai-platform-for-estate-agency-sector/),
[mrisoftware.com/uk](https://www.mrisoftware.com/uk/))
- **COPY:** AI copilot framing and the "marketplace of pre-built agents" as a
  *V2 platform* idea (matches `marketplaceEnabled` staging).
- **AVOID:** enterprise breadth, commercial/BTR modules, multi-country at launch
  (`multiCountryPortfolio`/`globalCountryPacks` stay OFF).
- **DIFFERENTIATE:** transparent self-serve pricing + 30-second comprehension vs
  their opaque, sales-led, module-heavy onboarding.

**Alto** (owned by Houseful, the Zoopla group) and **Street.co.uk** are the
mid-market agent CRMs. Alto bundles **PropertyFile** (branded tenant/landlord/
vendor portal) and portal-feed integrations; Street is the design-led, AI-forward
challenger (won Kerfuffle "Overall EA Supplier" 2025 + 2026). Both are **agent-CRM
first** (sales pipeline, viewings, listings) — lettings *operations and compliance*
are secondary. That is the seam: Propvora is **operations/compliance first, CRM
light**. ([altosoftware.co.uk](https://www.altosoftware.co.uk/blog/best-estate-agency-crms-in-2026-alto-vs-reapit-vs-street/),
[street.co.uk](https://street.co.uk/),
[altosoftware.co.uk/propertyfile](https://www.altosoftware.co.uk/product-features/propertyfile-customer-portal/))
- **COPY:** PropertyFile's portal scope (rent balance, maintenance, statements,
  online document signing) — a checklist for Propvora's portals; Street's
  online booking engine + agent mobile app polish.
- **AVOID:** building a full estate-agency sales CRM (offers, chains, progression)
  — out of wedge.
- **DIFFERENTIATE:** compliance/possession depth + planning engine; agents'
  CRMs do not model HMO licensing or deal profitability.

**Goodlord** owns the **front of the lettings funnel** — referencing, digital
tenancy agreements, Right-to-Rent, move-in money, rent collection — sold per-
tenancy to 3,500+ agencies (1M+ tenancies/yr). It is deep but narrow (pre-tenancy
onboarding), and quote-only/opaque. **Direct** competitor for the onboarding slice
only. ([goodlord.com](https://www.goodlord.com/))
- **COPY:** the referencing + e-sign + move-in-money workflow as a Propvora
  onboarding module; the per-tenancy mental model.
- **AVOID:** becoming an insurance/referencing reseller business (Goodlord's
  monetisation) at V1 — partner/integrate instead.
- **DIFFERENTIATE:** Propvora carries the tenancy *past* move-in into ongoing
  ops, compliance and possession — Goodlord largely stops at move-in.

**COHO** is the **most dangerous near-neighbour to the V1 ICP**: purpose-built for
**HMO / co-living**, room-level rent schedules, Open-Banking + AI payment matching,
GoCardless DD, and automatic tracking of **Gas Safety, EICR and HMO licences** with
auto-generated maintenance tickets — at a landlord-friendly **£30/mo (12 units) +
£2.50/unit, ~£1/room**. The brief explicitly names HMO/student/SA exposure in the
ICP, so COHO overlaps hard on the HMO sub-segment.
([coho.life/pricing](https://coho.life/pricing/),
[coho.life/management](https://coho.life/management/hmo-management-software/))
- **COPY:** room-level rent + bills-inclusive reconciliation; **compliance auto-
  ticketing** (cert expiry → maintenance task) — Propvora's compliance layer
  should do exactly this; their landlord-grade price point.
- **AVOID:** scoping the whole product *only* to HMO — Propvora is multi-strategy.
- **DIFFERENTIATE:** COHO has no profitability/strategy planning engine, no
  possession/RRA legal depth, no SA channel, no supplier marketplace optionality.
  Propvora can position as "COHO-grade HMO ops **plus** every other strategy +
  planning + portals."
- **Wedge-fit:** direct A/B threat on HMO; this is the competitor to out-feature
  on compliance and out-scope on strategy.

**Landlord Vision** is the **landlord-accounting/MTD** incumbent: cheap
(£19.97–£84.97/mo), MTD-for-ITSA included on every tier, SA105-ready reports, deep
HMRC integration. It is the price/feature anchor the cost-conscious self-managing
landlord already knows. **Direct** on the money/accounting slice.
([landlordvision.co.uk](https://www.landlordvision.co.uk/landlord-software-pricing.html))
- **COPY:** MTD-ITSA-ready reporting and the transparent tenancy-count pricing
  ladder (this maps naturally onto Propvora's property/seat entitlements).
- **AVOID:** trying to be a full bookkeeping/tax engine — the brief assigns
  **full double-entry GL to Layer D (HIDE+FLAG)** and says position Xero/QuickBooks
  as an *integration*. Landlord Vision proves "money basics + MTD-aware export,"
  not in-app ERP, is the right altitude.
- **DIFFERENTIATE:** Propvora wraps the same money basics inside compliance +
  ops + planning + portals; Landlord Vision is accounting-only.

**PayProp** is a **rent-processing rail** (license ~£49/mo + <1% of volume + setup
fee), not a full ops platform — automated collection, real-time reconciliation,
auto-payout to landlords, £2.6bn/yr processed, now part of Reapit. **Direct on the
money rail only.** ([payprop.com](https://www.payprop.com/))
- **COPY:** auto-reconciliation + auto-payout UX and the bank-grade audit trail
  (Propvora's money + owner-statement flows).
- **AVOID:** becoming a regulated payment institution / taking float at V1 —
  integrate GoCardless/Open Banking instead (matches `payouts` flag OFF).
- **DIFFERENTIATE:** Propvora surrounds the rail with the rest of the operation.

---

## Category 2 — Maintenance / compliance

The **heart of Propvora's wedge** (Layer A compliance). These two are the tools the
ICP currently bolts on — displacing them is the core sales argument.

| Competitor | Who | Pricing (model) | Source | Direct/Indirect | Layer |
|---|---|---|---|---|---|
| **Fixflo** | Letting + block + BTR agents (40%+ of UK letting agents) | Lettings from ~£50/mo software fee + quote `[VERIFY]` | [fixflo.com/pricing/lettings](https://www.fixflo.com/pricing/lettings) | **Direct** | A (maintenance + compliance) |
| **PropertyFile** | Agencies using Alto/Reapit (add-on) | Bundled with Alto (no standalone public price) `[VERIFY]` | [altosoftware.co.uk/propertyfile](https://www.altosoftware.co.uk/product-features/propertyfile-customer-portal/) | **Direct** (portal) | B (portals) |

**Fixflo** is the category leader the brief names by name ("without spreadsheets,
Fixflo and Landlord Vision bolted together"). It does **repairs + planned
maintenance + compliance** brilliantly: tenant issue reporting with photos,
contractor work-order management, automated recurring compliance (gas safety,
EICR), audit trail, an AI tool ("Aidenn") for fire-risk assessments, and a vetted
contractor network for out-of-hours. Weakest gap: it is *only* maintenance/
compliance — no money, no tenancy lifecycle, no listings, no planning. That is
precisely why operators "bolt it on." ([fixflo.com](https://www.fixflo.com/),
[capterra.co.uk](https://www.capterra.co.uk/software/163230/fixflo-lettings))
- **COPY (structural — high priority):** the issue-reporting → triage → work-order
  → contractor → audit-trail pipeline, and **recurring compliance scheduling**
  (cert type → renewal cadence → reminder → evidence capture). This is the gold
  standard for Propvora's Work + Compliance layers.
- **AVOID:** Fixflo's standalone-bolt-on positioning — Propvora's win is that
  maintenance/compliance is *native*, not a £50/mo add-on.
- **DIFFERENTIATE:** native money + tenancy + planning + possession means the
  compliance event ("EICR expiring") sits next to the financial and legal
  consequence — Fixflo cannot connect those dots.
- **Wedge-fit:** displacing Fixflo + Landlord Vision with one product **is** the
  wedge sentence in the brief. This is the single most important COPY target.

**PropertyFile** is a branded **portal** add-on (Alto/Reapit) — tenants see rent
balance + submit/track maintenance; landlords see statements + arrears +
performance; all parties e-sign documents. It validates Propvora's portal scope
1:1. **Direct** on portals, but it is a thin add-on dependent on a host CRM.
([altosoftware.co.uk/propertyfile](https://www.altosoftware.co.uk/product-features/propertyfile-customer-portal/))
- **COPY:** the exact portal surface (rent balance, maintenance status, statements,
  online signing) as Propvora's portal acceptance checklist.
- **AVOID:** making portals a separate paid add-on — they are Propvora's
  **retention engine** (Layer B, KEEP), bundled in.
- **DIFFERENTIATE:** Propvora's portals reach **four** personas (tenant, landlord,
  supplier, + operator), not just tenant/landlord/vendor.

---

## Category 3 — Property accounting / light bookkeeping

The brief is explicit: **money basics = Layer A KEEP; full double-entry GL = Layer
D HIDE+FLAG, positioned as a Xero/QuickBooks integration.** This category is
therefore mostly **"integrate, don't rebuild."**

| Competitor | Who | Pricing | Source | Direct/Indirect | Layer |
|---|---|---|---|---|---|
| **Hammock** | Self-managing landlords (MTD) | £8/mo (1–3 props) → £15 (4–10) → £25 (11–20) → £31.50 (21+); +VAT; 30-day trial | [usehammock.com/pricing](https://www.usehammock.com/pricing/) | **Direct** (landlord money/MTD) | A money + integration |
| **Xero** | SMEs, accountants, multi-property landlords | Simple from ~£7/mo; std tiers ~£16–£65/mo | [xero.com/uk/pricing-plans](https://www.xero.com/uk/pricing-plans/) | **Indirect** (integrate) | **D** (integration target) |
| **QuickBooks** | Sole traders, SMEs, single-property landlords | Sole Trader £10/mo; Simple Start £14/mo; up to £100+ | [startups.co.uk](https://startups.co.uk/accounting/xero-vs-quickbooks/) | **Indirect** (integrate) | **D** (integration target) |

**Hammock** is a landlord-native accounting/MTD platform — HMRC-recognised for MTD,
Open-Banking bank feeds, P&L, yield/LTV/arrears metrics, and (notably) it is an
**Authorised Payment Institution**. Cheap and sharply focused. **Direct** on the
landlord money/MTD slice that overlaps Propvora's Layer-A money basics.
([usehammock.com](https://www.usehammock.com/))
- **COPY:** Open-Banking bank-feed reconciliation + investor metrics (yield, LTV,
  arrears) surfaced on a dashboard — these belong in Propvora's money + planning
  layers.
- **AVOID:** chasing MTD-ITSA *filing*/regulated-payment status at V1 — heavy,
  regulated, low-USP. Surface MTD-aware exports and integrate.
- **DIFFERENTIATE:** Hammock has no compliance/possession/maintenance/portals;
  Propvora wraps the numbers in the operation.

**Xero / QuickBooks** are the **general-ledger incumbents** Propvora must **not
fight head-on** (Layer D). Both are MTD-ready, cheap, and already embedded in the
operator's accountant relationship. The brief's instruction is correct and
market-validated: **position them as integrations**, keep Propvora's money to
operator-meaningful basics (rent, arrears, invoices, expenses, owner statements,
deposits). Xero handles multi-property + business income in one org; QuickBooks
Sole Trader is single-property only.
([xero.com](https://www.xero.com/uk/pricing-plans/),
[startups.co.uk](https://startups.co.uk/accounting/xero-vs-quickbooks/))
- **COPY:** nothing structurally — instead **build the integration** (export +
  sync) as a trust signal.
- **AVOID (explicit, Layer-D guidance):** in-app double-entry GL, journals,
  trial balance, chart of accounts, reconciliation engine, MTD filing. This is the
  clearest "do NOT beat Xero head-on" line in the whole audit.
- **DIFFERENTIATE:** be the **property-ops system of record that feeds the GL**,
  not the GL.

---

## Category 4 — Listings / lettings (tenant-find)

These are **channels, not platforms** — mostly **indirect**. Propvora should
*integrate/syndicate to* them, never try to replace the portals.

| Competitor | Who | Pricing | Source | Direct/Indirect | Layer |
|---|---|---|---|---|---|
| **OpenRent** | DIY landlords | Free basic; £49 premium (Zoopla/OTM); +£50 Rightmove add-on; referencing £20/tenant | [openrent.co.uk/our-pricing](https://www.openrent.co.uk/our-pricing) | **Indirect** (channel) | B/D (listings) |
| **SpareRoom** | Room/HMO landlords + flatmates | Free standard; paid "Bold"/Early-Bird upgrades + top-up listings (figures not public) `[VERIFY]` | [spareroom.com](https://www.spareroom.com/content/placeditadvert/listing-options/) | **Indirect** (channel) | B/D (HMO listings) |
| **Zoopla** | Agents (consumer portal) | Quote-only per branch `[VERIFY]` | [zoopla.co.uk](https://www.zoopla.co.uk/) | **Indirect** | — (syndication) |
| **Rightmove** | Agents (dominant portal) | Quote-only; ARPA ~£1,530/mo (2025) `[VERIFY]` | [breakevenpointcalculator.com](https://breakevenpointcalculator.com/how-does-rightmove-make-money-revenue-model-explained/) | **Indirect** | — (syndication) |
| **OnTheMarket** | Agents (challenger portal) | Quote-only per branch `[VERIFY]` | [onthemarket.com](https://www.onthemarket.com/) | **Indirect** | — (syndication) |

**Prose.** **Rightmove** (dominant, ~£1,530/mo ARPA, opaque) and **Zoopla**/
**OnTheMarket** are demand aggregators agents *must* pay into. Propvora cannot and
should not compete with portal demand — it should **feed listings to them**.
**OpenRent** is the interesting structural case: a no-frills online letting agent
with **transparent, unbundled, free-tier-led pricing** (free basic + £49 to reach
Zoopla/OTM + £50 Rightmove add-on + £20 referencing). It notably **dropped
Rightmove from default packages**, showing portal-fee volatility.
([openrent.co.uk](https://www.openrent.co.uk/our-pricing),
[onlinemarketplaces.com](https://www.onlinemarketplaces.com/articles/openrent-removes-rightmove-as-a-marketing-option-for-landlords/))
**SpareRoom** is the room/HMO channel (free + paid boosts) and matters because of
the HMO ICP overlap. ([spareroom.com](https://www.spareroom.com/content/placeditadvert/listing-options/))
- **COPY:** OpenRent's **transparent unbundled pricing** and free-tier-led
  acquisition as a pricing-page model; the "add referencing / add a portal"
  modular up-sell.
- **AVOID:** building demand/marketplace liquidity at V1 — listings sit at
  **Layer B/D** behind `directBookingPages`/`marketplaceEnabled`; tenant-find is a
  syndication feature, not the product.
- **DIFFERENTIATE:** Propvora owns the *operation after the listing* (tenancy,
  compliance, money) — the listing is a feeder, not the destination.
- **Wedge-fit:** supports a **later module** (V1.5/V2 syndication), not the wedge.

---

## Category 5 — Serviced accommodation / channel / booking

The brief's hardest "do NOT beat head-on" line: **Airbnb/Booking are demand
networks; Hostaway/Guesty/Lodgify are SA PMS/channel managers.** All sit at
**Layer B/C/D** (bookings/listings gated) — **indirect** for the V1 ops wedge.

| Competitor | Who | Pricing | Source | Direct/Indirect | Layer |
|---|---|---|---|---|---|
| **Airbnb** | SA hosts (demand network) | Host-only **15.5%** fee (UK, by Jun 2026) **+ 20% VAT** on the fee | [tabivista.com](https://www.tabivista.com/blog/airbnb-uk-host-fee-june-2026/); [houst.com](https://www.houst.com/blog/airbnb-hosting-fees) | **Indirect** (channel) | D |
| **Booking.com** | SA + hotel hosts | ~15% commission (12–18% range) + 2–3% payment fee | [tabivista.com](https://www.tabivista.com/blog/airbnb-uk-host-fee-june-2026/) | **Indirect** (channel) | D |
| **Hostaway** | Growing SA operators (4–100 units) | ~$50/property/mo, custom/opaque (USD) | [staystra.com](https://staystra.com/best-str-channel-manager-2026-hostaway-guesty-lodgify-ownerrez-beds24/) | **Indirect** (SA PMS) | B/D |
| **Guesty** | Large SA portfolios (20+) | Lite from ~$16/mo; $9–$50+/listing/mo (USD); 60+ channels | [guesty.com](https://www.guesty.com/blog/guesty-vs-hostaway-vs-lodgify/) | **Indirect** (SA PMS) | B/D |
| **Lodgify** | Small SA hosts wanting direct site | $14–$62/mo/property (USD); strong website builder; 12 channels | [lodgify.com](https://www.lodgify.com/comparisons/hostaway-vs-guesty/) | **Indirect** (SA PMS) | B/D |

**Prose.** **Airbnb** and **Booking.com** are not software competitors — they are
**demand marketplaces** that take **15–15.5% commission** (Airbnb's new UK host-
only model, live by June 2026, **plus 20% VAT on the fee** — so a UK host's
effective take is ~18.6%). No SaaS should try to recreate that liquidity.
([tabivista.com](https://www.tabivista.com/blog/airbnb-uk-host-fee-june-2026/))
**Hostaway, Guesty, Lodgify** are the **SA channel-manager/PMS** layer (sync rates
+ calendars across OTAs, unified inbox, direct-booking sites). They are deep on
*one strategy* — short-stay — and price per-listing in USD. They are **indirect**
for Propvora's wedge: the V1 ICP has *some* SA exposure but is not an SA-only
operator. ([staystra.com](https://staystra.com/best-str-channel-manager-2026-hostaway-guesty-lodgify-ownerrez-beds24/),
[guesty.com](https://www.guesty.com/blog/guesty-vs-hostaway-vs-lodgify/))
- **COPY (later, Layer B/C):** Lodgify's direct-booking-site builder and the
  multi-channel calendar/rate sync pattern — for Propvora's gated
  `bookingManagement` / `directBookingPages` / `icalSync` flags only.
- **AVOID (explicit Layer-D guidance):** do **not** build an OTA, do **not** build
  a 60-channel manager, do **not** chase Airbnb demand. SA is a *strategy profile*
  in the planning engine and a gated ops module — not the product.
- **DIFFERENTIATE:** Propvora treats SA as **one of many UK strategies** (HMO, R2R,
  student, BRRR, flip…) inside the **planning engine** — these tools cannot model
  a mixed portfolio or the UK regulatory/possession layer around it.
- **Wedge-fit:** strictly a **later flag-gated module** (V2 `marketplaceStays`/
  `bookingManagement`). Tied to **Layer D staging** in the synthesis below.

---

## Category 6 — Trades / contractor job-management + marketplaces

Split in two: **job-mgmt SaaS** (Tradify, Jobber — sold to the *tradesperson*,
adjacent to Propvora's supplier-side) and **lead marketplaces** (Checkatrade,
Rated People, TrustATrader — where operators *find* trades). All map to
**Layer B/D** (supplier coordination now; independent-supplier SaaS + emergency
marketplace later). **Indirect** for the V1 operator wedge.

| Competitor | Who | Pricing | Source | Direct/Indirect | Layer |
|---|---|---|---|---|---|
| **Tradify** | Solo + small trade teams | ~$29/user/mo (≈£34 solo); 14-day trial | [tradifyhq.com](https://www.tradifyhq.com/); [tradestackhq.com](https://tradestackhq.com/tradify-vs-jobber-uk-review/) | Indirect (supplier-side) | D (independent supplier) |
| **Jobber** | Scaling trade businesses (5–10+ techs) | From ~$39/mo (1 user) up to £99–£149/mo; 14-day trial | [heybrb.ai](https://heybrb.ai/blog/jobber-vs-tradify-best-for-uk-trades) | Indirect (supplier-side) | D (independent supplier) |
| **Checkatrade** | Homeowners ↔ vetted trades | ~£60–£399/mo membership **+** per-lead £5–£40 | [swiftlead.co.uk](https://www.swiftlead.co.uk/blog/checkatrade-cost-for-tradesmen); [jamiegrand.co.uk](https://jamiegrand.co.uk/blog/checkatrade-vs-own-website-real-cost/) | Indirect (marketplace) | D (supplier marketplace) |
| **Rated People** | Homeowners ↔ trades | ~£30+VAT/mo + pay-per-lead | [tradesmansaver.co.uk](https://www.tradesmansaver.co.uk/tradesman-insights/rated-people-vs-check-trade-use-tradesman-business/) | Indirect (marketplace) | D (supplier marketplace) |
| **TrustATrader** | Homeowners ↔ trades | ~£30–£50/mo fixed, no per-lead | [localsearchnorth.uk](https://localsearchnorth.uk/blog/trustatrader-vs-checkatrade/) | Indirect (marketplace) | D (supplier marketplace) |

**Prose.** **Tradify** and **Jobber** are **trade-business management** apps
(enquiry → quote → job → invoice, scheduling, Xero/QuickBooks sync). They sell to
the *contractor*, which is exactly Propvora's **independent-supplier workspace** —
a **Layer D (V2, TRIM hard)** concern. They show what a supplier-SaaS *would* need,
but the brief says V1 suppliers act via portal + operator coordination, so these
are a **future-module reference, not a V1 competitor**.
([tradifyhq.com](https://www.tradifyhq.com/),
[heybrb.ai](https://heybrb.ai/blog/jobber-vs-tradify-best-for-uk-trades))
**Checkatrade / Rated People / TrustATrader** are **lead marketplaces** with two
revenue models worth noting: Checkatrade = **high membership + per-lead** (£60–£399
/mo + £5–£40/lead — disliked by trades); TrustATrader = **flat fixed fee, no
per-lead**; Rated People = **hybrid**. These map to Propvora's gated **supplier
marketplace** (`marketplaceSuppliers`/`marketplaceEmergency`).
([swiftlead.co.uk](https://www.swiftlead.co.uk/blog/checkatrade-cost-for-tradesmen),
[localsearchnorth.uk](https://localsearchnorth.uk/blog/trustatrader-vs-checkatrade/))
- **COPY (later, Layer D):** TrustATrader's **flat-fee, no-per-lead** model — the
  brief already monetises suppliers via **paid add-ons (promoted ranking,
  emergency availability)**, which is the trade-friendly side of this market; avoid
  Checkatrade's resented pay-per-lead.
- **AVOID:** launching a cold two-sided trades marketplace at V1 (four cold
  starts = rejected Model 3). Keep `marketplaceEnabled` OFF.
- **DIFFERENTIATE:** Propvora's supplier network is **fed by real operator job
  flow** (work orders already in the system) — warm liquidity a cold directory
  cannot match. This is the platform play, staged for V2.
- **Wedge-fit:** **later module only.** Supports the **platform play**, not the
  wedge.

---

## 7. Cross-cutting pricing-model patterns (for `09`/`14` pricing work)

1. **Two pricing archetypes dominate.** (a) **Landlord-friendly, transparent,
   per-property/per-unit** ladders (Landlord Vision £20–£85, Hammock £8–£31.50,
   COHO £30 + £2.50/unit) for the self-managing ICP; (b) **opaque, quote-only,
   four-figure** agency contracts (Reapit, MRI, Street, Goodlord, PayProp,
   Rightmove). **Propvora's V1 ICP demands archetype (a)** — transparent self-serve
   maps directly to the brief's `starter | operator | scale` tiers and the
   "30-second comprehension" rule.
2. **The "+ per-unit overage" pattern is universal** (Arthur, COHO) and matches
   Propvora's property/seat entitlements — use it.
3. **MTD is now a checkbox buyers actively filter on** (April 2026 mandate);
   Landlord Vision/Hammock lead on it, **Arthur conspicuously lacks it**. Propvora
   needs *MTD-aware money* (not a GL) to neutralise the objection.
4. **Add-on monetisation is normalised** (OpenRent referencing, supplier promoted-
   ranking, Street's Cortex AI £149) — supports the brief's supplier-add-on and
   `aiCopilot`-entitlement strategy.
5. **Commission/marketplace economics (Airbnb 15.5%+VAT, Checkatrade leads)** are a
   *different business* from SaaS subscriptions — staging them behind flags (not
   launching them) is the financially correct call.

---

## 8. Synthesis — the UK proptech white-space Propvora can own

### 8.1 The white-space (validated by the research)

Mapping the field onto a 2×2 of **breadth (single-tool ↔ whole operation)** ×
**UK-regulatory depth (shallow ↔ deep)** leaves one quadrant essentially empty:

- **Deep but narrow:** Fixflo (compliance/maintenance only), Landlord Vision/
  Hammock (accounting/MTD only), PayProp (rent rail only), Goodlord (onboarding
  only), COHO (HMO only), Hostaway/Guesty (SA only).
- **Broad but UK-shallow / agent-CRM-centric:** Arthur (no MTD, no planning),
  Reapit/MRI (enterprise, opaque, CRM/commercial-first), Alto/Street (sales-CRM
  first).
- **Broad + UK-deep + operator-priced + planning-aware + portal-native + AI-ops —
  EMPTY.** No incumbent unifies **(1) UK compliance/possession depth (RRA-2026,
  HMO licensing, certs, deposits, evidence/audit) + (2) multi-strategy
  profitability planning + (3) tenant/landlord/supplier portals + (4) AI ops** in
  one self-serve product for the <150-unit operator.

This is corroborated externally: the 2026 trade consensus is that operators
**"stack complementary platforms"** and **"true all-in-one solutions remain
aspirational."** (MRI "Top 8 platforms 2026"; Lightwork "Best proptech tools
2026"; Buildium proptech trends — see Category-summary sources.) Propvora's wedge
sentence — *"without spreadsheets, Fixflo and Landlord Vision bolted together"* —
is literally a description of the gap the rest of the market admits it has not
filled.

### 8.2 The two regulatory tailwinds that make the wedge *time-sensitive*

- **MTD for Income Tax** is mandatory from **April 2026** (>£50k income). Buyers
  now filter on it; Arthur fails it. Propvora needs **MTD-aware money + Xero/QB
  integration** (NOT a GL) to clear the bar.
  ([xero.com MTD guide](https://www.xero.com/uk/guides/market-your-practice-to-landlords/))
- **Renters' Rights Act 2026** — **Section 21 abolished from 1 May 2026**, civil
  penalties up to **£7,000**, mandatory periodic tenancies, written statement of
  terms, **evidence-led Section 8 possession**. This is a once-in-a-generation
  compliance-anxiety event and **directly powers USP #1 (regulatory depth) and the
  documentation/evidence-as-first-class-citizen thesis.** No accounting tool, no
  SA channel manager, and no global PMS can touch this — it is a structural moat.
  ([gov.uk RRA guide](https://www.gov.uk/government/publications/guide-to-the-renters-rights-act/guide-to-the-renters-rights-act),
  [theindependentlandlord.com](https://theindependentlandlord.com/section-21-abolition/))

### 8.3 What to COPY structurally (priority order)

1. **Fixflo's compliance-scheduling + work-order pipeline** (the wedge's core).
2. **COHO's compliance auto-ticketing** (cert expiry → maintenance task) and
   room-level rent — for the HMO sub-ICP.
3. **PropertyFile/Arthur's portal surfaces** (rent balance, maintenance status,
   statements, e-sign) as the portal acceptance checklist.
4. **Landlord Vision/Hammock's transparent per-property pricing + MTD-aware
   reporting**.
5. **OpenRent's transparent, unbundled, free-tier-led pricing** presentation.
6. **TrustATrader's flat-fee / Propvora's add-on supplier model** (avoid
   Checkatrade pay-per-lead) — for the *staged* supplier marketplace.

### 8.4 What to AVOID — the explicit "do NOT beat head-on" list (Layer-D staging)

- **Do NOT beat Xero/QuickBooks head-on.** No in-app double-entry GL, journals,
  trial balance, MTD *filing*. **Integrate** (Layer D: full GL HIDE+FLAG). Be the
  ops system of record that *feeds* the ledger.
- **Do NOT beat Airbnb/Booking.com head-on.** They are 15%+ commission **demand
  networks** with liquidity no SaaS recreates. SA is a **strategy profile +
  flag-gated ops module** (`marketplaceStays`/`bookingManagement`, V2), not a
  channel business.
- **Do NOT beat Hostaway/Guesty head-on at V1.** A 60-channel SA manager is a
  separate product; ship gated `icalSync`/`directBookingPages` for the *operator's
  own* SA units only.
- **Do NOT beat Rightmove/Zoopla head-on.** They are demand portals — **syndicate
  to them**, never compete on demand.
- **Do NOT launch the trades marketplace cold at V1.** Checkatrade/Rated People/
  TrustATrader liquidity took years; keep `marketplaceEnabled` OFF and feed the
  network from real operator job flow when staged (V2 platform play).
- **Do NOT chase Reapit/MRI enterprise breadth** (commercial, BTR, block, multi-
  country) at launch — opaque four-figure sales motion is the wrong wedge.

### 8.5 Where Propvora DIFFERENTIATES (the defensible centre)

Propvora is the **only** product positioned to say: *"Run your whole UK property
operation — RRA-2026-ready compliance and possession, maintenance, money (MTD-aware,
Xero-connected), and tenant/landlord/supplier portals — with AI ops, and plan the
profitability of every strategy (HMO, R2R, SA, student, BRRR, flip) in the same
place."* Every incumbent owns **one slice**; Propvora owns the **connective tissue +
the planning brain + the UK legal moat**, then **stages** the marketplace/consumer/
independent-supplier sides it has already built behind flags — exactly the brief's
Model-2 verdict.

---

## 9. Findings, contradictions & verification gaps

### Top 5 findings
1. **The market admits it has no all-in-one** ("operators stack tools; all-in-one
   remains aspirational"). Propvora's wedge sentence is a direct description of the
   acknowledged gap. (MRI/Lightwork/Buildium 2026.)
2. **COHO is the most dangerous near-ICP competitor** — HMO-native, compliance
   auto-ticketing, landlord-priced (£30 + £2.50/unit). Propvora must out-feature it
   on compliance breadth and out-scope it on multi-strategy planning, not undercut
   it on price.
3. **Arthur Online proves the structure but leaves the door open** — same four-
   portal stakeholder model, but **no MTD, £70/mo floor excludes the sub-50-unit
   ICP, and no planning engine.** Propvora's wedge is precisely "Arthur for the
   smaller operator, with compliance + MTD + planning."
4. **Two regulatory tailwinds (MTD April 2026, RRA / S21-abolition May 2026)** make
   the compliance wedge time-critical and hand Propvora a moat the global/accounting/
   SA tools structurally cannot cross.
5. **Pricing splits cleanly into transparent-landlord vs opaque-agency archetypes**;
   the brief's `starter/operator/scale` self-serve tiers + per-unit overage +
   supplier add-ons are the market-correct model for the V1 ICP.

### Contradictions with the brief (flagged per §1 reconciliation rule)
- **None material.** Every finding *supports* the brief's verdict, layer map, and
  USP. Two reinforcements worth surfacing in `19-founder-decision-lock.md`:
  - (a) **MTD is a harder V1 requirement than the brief implies.** The brief lists
    "Money basics" as Layer A and full GL as Layer D, but the 2026 mandate means
    **MTD-*awareness* (export/summary, Xero sync) is effectively table-stakes for
    the landlord ICP**, not optional. Recommend explicitly scoping "MTD-aware money
    (not a GL)" into V1 Layer A. *(Reinforces, does not contradict, the Layer-D GL
    HIDE+FLAG decision.)*
  - (b) **The HMO sub-segment is more contested than a generic "ops" framing
    suggests** (COHO is strong and cheap). Recommend the planning engine + RRA depth
    be the wedge *into* HMO, rather than competing room-rent-feature-for-feature.

### Verification gaps (`[VERIFY]` — quote-only / non-public pricing)
- **Reapit, MRI, Street, Goodlord, PayProp** monthly figures are third-party
  estimates; all are quote-only. Confirm via direct demo/quote before any
  competitive-pricing claim ships.
- **Rightmove/Zoopla/OnTheMarket** per-branch agent pricing is non-public (ARPA
  ~£1,530/mo is a reported aggregate, not a rate card).
- **SpareRoom** exact paid-upgrade prices not published; PropertyFile has no
  standalone price (bundled with Alto).
- **Hostaway/Guesty/Lodgify** prices are USD and per-listing — convert + re-confirm
  before any GBP comparison.
- **Airbnb 15.5% + 20% VAT** is for the new UK host-only model rolling out through
  **22 June 2026**; verify a given host's exact effective rate near that date.

---

### Source list
- Arthur Online: https://www.arthuronline.co.uk/pricing · https://www.arthuronline.co.uk/ · https://www.capterra.co.uk/software/145260/arthur-online
- Reapit / RAI: https://www.reapit.com/ · https://www.propertywire.com/company-news/reapit-launches-ai-platform-for-estate-agency-sector/ · https://www.tradepick.co.uk/guides/best-software-estate-agents-uk-2026
- MRI Software: https://www.mrisoftware.com/uk/ · https://www.capterra.co.uk/software/79570/mri-software · https://www.mrisoftware.com/uk/blog/top-8-property-management-platforms-for-2026/
- Alto / PropertyFile: https://www.altosoftware.co.uk/blog/best-estate-agency-crms-in-2026-alto-vs-reapit-vs-street/ · https://www.altosoftware.co.uk/product-features/propertyfile-customer-portal/
- Street.co.uk: https://street.co.uk/ · https://thenegotiator.co.uk/news/proptech/street-co-uk-releases-game-changer-ai-tool-for-estate-agents/
- Goodlord: https://www.goodlord.com/ · https://www.capterra.co.uk/software/201845/goodlord
- COHO: https://coho.life/pricing/ · https://coho.life/management/hmo-management-software/
- Landlord Vision: https://www.landlordvision.co.uk/landlord-software-pricing.html
- PayProp: https://www.payprop.com/ · https://www.uselatch.co.uk/blog/best-property-management-software-uk-2026
- Fixflo: https://www.fixflo.com/ · https://www.fixflo.com/pricing/lettings · https://www.capterra.co.uk/software/163230/fixflo-lettings
- Hammock: https://www.usehammock.com/ · https://www.usehammock.com/pricing/
- Xero / QuickBooks: https://www.xero.com/uk/pricing-plans/ · https://www.xero.com/uk/guides/market-your-practice-to-landlords/ · https://startups.co.uk/accounting/xero-vs-quickbooks/
- OpenRent: https://www.openrent.co.uk/our-pricing · https://www.onlinemarketplaces.com/articles/openrent-removes-rightmove-as-a-marketing-option-for-landlords/
- SpareRoom: https://www.spareroom.com/content/placeditadvert/listing-options/
- Rightmove / Zoopla / OnTheMarket: https://breakevenpointcalculator.com/how-does-rightmove-make-money-revenue-model-explained/ · https://www.zoopla.co.uk/ · https://www.onthemarket.com/
- Airbnb / Booking.com: https://www.tabivista.com/blog/airbnb-uk-host-fee-june-2026/ · https://www.houst.com/blog/airbnb-hosting-fees
- Hostaway / Guesty / Lodgify: https://staystra.com/best-str-channel-manager-2026-hostaway-guesty-lodgify-ownerrez-beds24/ · https://www.guesty.com/blog/guesty-vs-hostaway-vs-lodgify/ · https://www.lodgify.com/comparisons/hostaway-vs-guesty/
- Tradify / Jobber: https://www.tradifyhq.com/ · https://tradestackhq.com/tradify-vs-jobber-uk-review/ · https://heybrb.ai/blog/jobber-vs-tradify-best-for-uk-trades
- Checkatrade / Rated People / TrustATrader: https://www.swiftlead.co.uk/blog/checkatrade-cost-for-tradesmen · https://jamiegrand.co.uk/blog/checkatrade-vs-own-website-real-cost/ · https://www.tradesmansaver.co.uk/tradesman-insights/rated-people-vs-check-trade-use-tradesman-business/ · https://localsearchnorth.uk/blog/trustatrader-vs-checkatrade/
- Regulatory: https://www.gov.uk/government/publications/guide-to-the-renters-rights-act/guide-to-the-renters-rights-act · https://theindependentlandlord.com/section-21-abolition/
- Market structure: https://blog.lightwork.co/5-best-proptech-tools-for-uk-estate-agents-and-property-managers-2026/ · https://www.buildium.com/blog/proptech-trends-to-know/
