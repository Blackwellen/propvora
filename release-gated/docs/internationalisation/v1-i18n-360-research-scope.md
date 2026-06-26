# Propvora V1 — Full 360° Internationalisation RESEARCH SCOPE

**Purpose:** possession notice periods are **one of ~16 legal/compliance/tax/money dimensions** that must be researched and encoded per country for a true enterprise 360. This is the master research register — every dimension, its codebase status, and the per-country research sequencing. Nothing ships "internationalised" until its row here is green.
**Compiled:** 2026-06-25. **Countries in scope:** 45 (Tier A reviewed-deep; Tier B researched; restricted = generic; banned = blocked).
**Provenance rule:** every researched figure carries a source + `reviewStatus` (researched → counsel-reviewed). Operator override allowed on every default (per master plan §10b).

---

## RESEARCH PROGRESS SNAPSHOT (2026-06-25)
The design-phase research is **substantially complete across all 25 dimensions** (Tier-A deep + key jurisdictions; the 5 core money/legal dimensions cover **all 45**). Sourced docs on disk:

| Dim(s) | Doc | Coverage |
|---|---|---|
| 1 Possession | `legal-frameworks/tier-a-` + `tier-b-notice-periods-sourced.md` | **all 45** |
| 2,6,7,21 Deposit/Rent-control/Acquisition-tax/Recurring-tax | `ALL-45-country-matrix.md` (+ `deposit-rules-`, `rent-regulation-`, `tax-frameworks/property-tax-`) | **all 45** |
| 3,5 Licensing + Registration | `legal-frameworks/licensing-registration-sourced.md` | Tier-A + B representative |
| 4,20 Safety compliance + Trade certs | `compliance-frameworks/safety-compliance-and-trade-certs-sourced.md` | UK/IE/FR/DE/ES + existing 6 |
| 10 Short-let | `legal-frameworks/short-let-licensing-sourced.md` | Scotland/England/ES/FR/IT/PT/NL/AE + pattern |
| 17 Housing/tenure models | `legal-frameworks/housing-tenure-models-sourced.md` | UK/DE/FR/US + B queued (**schema-impacting**) |
| 13,14,18,22 RtR/Energy/Tenancy-models/Tenant-fees | `legal-frameworks/tenancy-rtr-fees-energy-sourced.md` | UK nations deep + EU notes |
| 8,9,19,23,24,25 Income-tax/Agent-reg/Fitness/Insurance/Language | `legal-frameworks/agent-fitness-incometax-language-sourced.md` | UK deep + key jurisdictions |
| 15,16 Money-format + Privacy | `country-profiles.ts` (in code) | **all 45** |

**Remaining = breadth backfill** (extend dims 3/4/8/9/10/17/etc. from "key jurisdictions" to full-45) + counsel sign-off to flip `researched → reviewed`. The **design corpus is sufficient to begin Phase 0 implementation**.

## The research dimensions (the "360" — now 25)

| # | Dimension | What must be researched per country | Codebase status today | Research status |
|---|---|---|---|---|
| **1** | **Possession / eviction** | routes, grounds, notice periods, competent court/tribunal, service | E&W only (`legal/jurisdiction.ts`, wizard) | ✅ **DONE** Tier A+B (`tier-a/-b-notice-periods-sourced.md`) — pending counsel sign-off |
| **2** | **Deposits / bonds** | scheme, cap (months), protection/registration duty, prescribed info, return window, disputes body | UK fields only (`tenancies.deposit_*`) | 🔜 **NEXT** |
| **3** | **Shared-occupancy / HMO / rental licensing** | licence/registration classes, thresholds (persons/households), authority, conditions | E&W HMO only (wizard) | ⏳ to research (Tier A first: SCT/NI HMO, IE) |
| **4** | **Safety compliance certificates** | gas, electrical/EICR, EPC/energy, smoke+CO alarms, fire risk, legionella, PAT — cadence + authority | 6 countries (`compliance/requirements.ts`: GB/IE/AU/NZ/US/CA) | 🟡 partial — extend to 45 |
| **5** | **Mandatory registration** | landlord/tenancy registration duty (e.g. IE RTB, Scotland Landlord Register, selective licensing) | none unified | ⏳ to research |
| **6** | **Rent regulation / rent control** | increase frequency, indexation method, caps, rent pressure zones, notice of increase | none | ⏳ to research |
| **7** | **Acquisition / transaction tax** | SDLT/LBTT/LTT, stamp duty, ITP-AJD, Grunderwerbsteuer, droits de mutation — bands | UK-shaped in Planning | ⏳ to research (Planning Cost Drivers) |
| **8** | **Rental income & VAT/GST treatment** | income tax on rent, VAT/GST on rent & services, reverse charge, withholding, short-let VAT | `country_profiles`/`country_tax_rates` have rates; treatment not modelled | 🟡 rates exist; treatment to research |
| **9** | **Mortgage interest / finance-cost relief** | deductibility regime (UK S24 restriction vs full deductibility), local nuances | UK assumption in forecasts | ⏳ to research |
| **10** | **Short-let / holiday-let licensing** | tourist registration/licence, night caps, change-of-use (ES VUT, FR n° d'enregistrement, PT AL, Scotland control areas) | none | ⏳ to research (SA/Holiday profiles) |
| **11** | **Tenancy types & minimum terms** | statutory tenancy types + min/max durations (AST→periodic, PRT, bail vide/meublé, 4+4, 3-yr) | UK only | 🟡 partial (captured in possession research) |
| **12** | **Notice service methods & prescribed forms** | registered mail, notary, official cantonal form, bailiff, RTB co-service, prescribed statutory forms | UK forms only | 🟡 partial (captured in possession research) |
| **13** | **Right-to-rent / immigration & tenant checks** | UK Right to Rent, equivalents, anti-discrimination limits | UK only | ⏳ to research |
| **14** | **Energy-efficiency minimum standards** | MEES (UK EPC ≥E→C roadmap), EU energy-class minimums, bans on letting below grade | UK MEES partial (EPC advisory) | 🟡 partial |
| **15** | **Money / currency / format / address** | currency, VAT rate, date/number format, area unit (sqm/sqft), address model, phone | ✅ `country-profiles.ts` (45) + address engine | ✅ mostly complete — wire it |
| **16** | **Privacy / data-protection** | regime, DSAR days, breach hours, consent model, representative/DPO, transfer mechanism | ✅ `country-profiles.ts` (45) | ✅ complete — surface it |
| **17** | **Housing / tenure & ownership models** | tenure types (freehold/leasehold/commonhold/condominium/co-op/strata/WEG/copropriété/condomínio), building-governance body, service-charge/ground-rent/condo-fee regime, property↔unit structure | UK leasehold/freehold assumed; not modelled per country | ⏳ to research — **affects the property & unit DATA MODEL itself, not just labels** |
| **18** | **Tenancy-agreement models & mandatory terms** | statutory agreement TYPE + prescribed form/clauses + written-statement duty (E&W AST→periodic, **Wales occupation contracts (RHW Act 2016)**, Scotland model PRT, France bail type, Germany Mietvertrag), language requirements | UK AST assumed | ⏳ to research — **Wales is "occupation contracts", not tenancies** |
| **19** | **Letting-agent / property-manager regulation** | agent licensing (**Rent Smart Wales**, **Scotland Letting Agent Register**, England redress + CMP), Client Money Protection, redress scheme, AML/KYC for agency | none | ⏳ to research — affects Settings/Workspace + Contacts(agent) |
| **20** | **Contractor / trade certification & Work regulation** | trade certs/registration (**Gas Safe**, electrical competent-person/Part P/NICEIC, F-Gas, asbestos, **builder licensing AU**, CSCS), public-liability insurance, contractor compliance | supplier compliance generic | ⏳ to research — **drives the WORK ▸ Suppliers/Jobs/PPM section** |
| **21** | **Recurring property tax / local rates** | council tax (UK), **LPT (Ireland)**, IBI (Spain), taxe foncière/d'habitation (France), Grundsteuer (Germany), IMU (Italy), property tax (US), council rates (AU/NZ) | none | ⏳ to research — Money + Planning cost drivers |
| **22** | **Tenant fees / permitted payments** | banned-fee regimes (**Tenant Fees Act 2019 E&W**, Scotland, Wales), permitted payments, holding-deposit caps | UK cap partial (deposits) | ⏳ to research |
| **23** | **Repair / fitness / habitation standards** | fitness-for-habitation (**Homes Act 2018**, **Awaab's Law**), Decent Homes, Repairing Standard (Scotland), minimum standards (IE S.I.137/2019), habitability warranties | none unified | ⏳ to research — Compliance + Work |
| **24** | **Insurance obligations** | buildings insurance duty, landlord liability, HMO/short-let insurance, contractor public-liability minimums | none | ⏳ to research |
| **25** | **Notice & document language requirements** | official-language notice duties (Wales bilingual, Belgium regional language, Quebec FR, Switzerland cantonal), translation duties for tenants | none | ⏳ to research — ties to translation (dim, §5) |

Legend: ✅ done · 🟡 partial · 🔜 next · ⏳ queued.

| **26** | **Capital Gains / disposal tax** | CGT on sale (UK CGT 18/24% residential, PPR relief), plus-value (FR), Spekulationssteuer (DE 10yr), plusvalía municipal (ES), withholding on non-resident sales | none | ⏳ to research — **drives Planning Dev/Flip + exit modelling** |
| **27** | **Building safety (high-rise/cladding)** | Building Safety Act 2022 (E&W) higher-risk buildings, Accountable Person, gateways, **EWS1**/cladding remediation, fire-safety (Fire Safety Act 2021) | none | ⏳ to research — **matters for blocks of flats/units in a building** |
| **28** | **AML / KYC** | anti-money-laundering duties for agency + transactions, source-of-funds, sanctions screening | sanctions list in code | ⏳ to research — Settings/Contacts/transactions |

> **Dimensions 18–25 added 2026-06-25** at founder direction (tenancy models, agent regulation, work/contractor certification, recurring property tax, tenant fees, fitness/repair, insurance, language). **Dimensions 26–28 added 2026-06-25 from the gap audit** (CGT/disposal tax, building safety, AML). Notable structural ones: **#18 Wales** uses *occupation contracts* (Renting Homes (Wales) Act 2016) — a different model from England's tenancies; **#20** drives the entire Work ▸ Suppliers/Jobs/PPM section; **#21** recurring property tax feeds Planning cost drivers and Money; **#27** building safety attaches to the *building*, not the unit (links the housing-model layer §17).

> **Dimension 17 is structural, not cosmetic.** Most dimensions change content/labels; housing-model differences change **how a property and its units are modelled** — e.g. a US condo unit has an HOA + condo declaration; a German apartment is *Sondereigentum* within a *WEG* (owners' association) with a *Hausgeld*; a French lot is in a *copropriété* with *charges de copropriété* and a *syndic*; AU/NZ apartments are *strata/unit title* with a body corporate + levies; UK is leasehold/freehold (commonhold rare, leasehold reform ongoing). This means the property/unit schema needs a **tenure_type**, **governance_body**, and **periodic-charge** model that adapts per jurisdiction, and Money/Planning must account for condo/strata/service charges differently. Research + a data-model design note required before encoding.

---

## Per-country research coverage (rows = country, cols = dimensions 1–16)
**Goal state = every cell sourced + `reviewStatus` set.** Today only dims 15/16 are broadly complete; dim 1 now complete; dim 4 covers 6 countries.

| Tier | Countries | Done now | Biggest outstanding |
|---|---|---|---|
| **A (deep)** | EW, SCT, NI, IE | dim 1 ✅, 15/16 ✅, dim 4 (IE) ✅ | deposits(2), licensing(3), registration(5), rent-reg(6), tax(7–9), short-let(10) |
| **B-EU** | FR,ES,DE,IT,NL,BE,AT,PT,SE,FI,DK,CZ,HR,HU,RO,GR | dim 1 ✅, 15/16 ✅ | dims 2–14 |
| **B-common-law** | AU,NZ,CA,US | dim 1 ✅(state-keyed), 4(AU/NZ/US/CA)✅, 15/16 ✅ | dims 2,3,5–14 + state granularity |
| **B-other** | CH,JP,TH,BR,MX,AE,SA,GL | dim 1 ✅, 15/16 ✅ | dims 2–14 |
| **Restricted** | TR,IN,ID,ZA,NG,KE,PK | dim 1 ✅(reference), 15/16 ✅ | generic only — dims 2–14 reference-tier |
| **Banned** | RU,IR,KP,SY,CU,BY,VE,NI,AF,MM,YE,SD,SO,CN | blocked | n/a |

---

## Research sequencing (priority = enterprise risk × user journey frequency)
1. **Possession (1)** — ✅ done.
2. **Deposits (2)** — 🔜 next. Highest money+legal risk, on Create-Tenancy + Money-Deposits.
3. **Safety compliance (4)** — extend the existing 6→45; Compliance section + Planning.
4. **Licensing/HMO (3) + Registration (5)** — Legal + Portfolio HMO tab.
5. **Rent regulation (6)** — Money + tenancy.
6. **Acquisition tax (7) + income/VAT (8) + interest relief (9)** — Planning engines + Money invoices.
7. **Short-let (10)** — SA/Holiday planning profiles.
8. **Tenancy types (11) + service methods (12)** — finalise from possession research.
9. **Right-to-rent (13) + energy minimums (14)** — compliance/legal polish.
10. **Surface money/format (15) + privacy (16)** — already-built data, wire into UI.

Each dimension = its own sourced doc under `legal-frameworks/` (or `compliance-frameworks/`, `tax-frameworks/`), same provenance/override rules, feeding the typed packs in code.

---

## Planning profiles & Planning Sets — i18n research/build register
Every Planning **profile** is a different economic+legal model, and each must be parameterised by the **property's jurisdiction** (its Income Model, Cost Drivers, Compliance, Forecast, Risks, AI Questions tabs all change). Planning **Sets** and **Landlord Offers** inherit the resolved jurisdiction of their property/area. Drivers below map to the 360 dimensions.

| Profile | Jurisdiction-divergence drivers | Feeds from dims | V1 stance outside reviewed jurisdictions |
|---|---|---|---|
| **Long-Term Let** | acquisition tax, rent regulation, interest relief, deposit, compliance | 2,4,6,7,8,9 | build (generic numbers + verify-locally) |
| **HMO** | shared-occupancy licensing + extra fire/compliance | 3,4 | build where HMO concept exists; else "record locally" |
| **Student-Let** | student council-tax/tax exemptions, seasonal possession (E&W Gd4A) | 1,4,8 | build; exemptions per country |
| **Co-living** | licensing (HMO-like), planning-use class | 3,4 | build / flag |
| **Serviced Accommodation** | **short-let licensing + VAT + business-rates vs council-tax** | 8,10 | **high divergence** — gate per jurisdiction |
| **Holiday Lets** | short-let licensing, tourism/occupancy tax, **UK FHL abolished Apr 2025** | 8,10 | high divergence — gate |
| **Rent-to-Rent** | legality/structure **varies; often unrecognised abroad** | 1,3 | **research-only / flag** outside reviewed |
| **Social Housing** | jurisdiction-specific schemes; **may not exist abroad** | 4,6 | research-only / flag outside UK |
| **Build-to-Rent** | planning incentives, institutional tax treatment | 7,8 | build generic |
| **Commercial** | **different lease law, VAT option-to-tax, business rates** | 7,8 | build generic; flag where unmodelled |
| **Mixed Use** | combination of residential + commercial regimes | 4,7,8 | build generic |
| **Refinancing** | mortgage market + interest-relief regime | 8,9 | build generic |
| **Dev/Flip** | **acquisition tax, VAT on new-build, CGT/income-tax on sale** | 7,8 | build generic |

**Build implication:** the Planning calc engines (`src/lib/planning/*`) must take a `jurisdiction` parameter (property country/region) and resolve: currency, acquisition-tax function, VAT treatment, interest-relief rule, rent-regulation cap, licensing/compliance checklist, and the profile's **applicability** (some profiles flag research-only or hide outside reviewed jurisdictions). Planning Sets/Offers store the resolved jurisdiction so a forecast is reproducible. AI Questions ground on the property jurisdiction (`aiJurisdictionClause`). This is **Phase 4** of the master plan, now expanded to cover all 13 profiles explicitly.

## Output artefacts per dimension (so the research is reusable, not throwaway)
- `…-sourced.md` — cited figures per country (like the possession docs).
- Typed pack module in `src/lib/legal|compliance|tax/…` consuming the sourced data.
- `jurisdiction_review_signoff` rows gate `researched → reviewed`.
- Operator override + workspace customization on every default (master plan §10b).

> **Honest scope note:** full 360 × 45 = ~16 dimensions across 45 jurisdictions. That is a **multi-pass research programme**, executed dimension-by-dimension in the priority order above, each pass cited and provenance-flagged. Possession (the hardest, most-cited) is done as the template; the rest follow the same method. This document is the tracker that guarantees nothing is skipped.
