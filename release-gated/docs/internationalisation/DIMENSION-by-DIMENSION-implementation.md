# Propvora i18n — DIMENSION-BY-DIMENSION IMPLEMENTATION DETAIL (all 28)

**Compiled:** 2026-06-25 · **Companion to** `INTEGRATION-and-IMPLEMENTATION-plan.md` (the "where it mounts" map) and `v1-i18n-360-research-scope.md` (the 28-dimension register).
**Posture:** PM platform, not a legal/tax advisor. Every resolved value renders via `<SourcedValue>` = number + source chip + edit pencil + **dismissible disclaimer**. One `sourced` tier; operator owns the numbers (`LIABILITY-disclaimer-and-customizability-plan.md`).

**How to read each dimension block:**
- **Data** — schema/migration changes (Phase 0 unless noted).
- **Engine/pack** — the new/changed `src/lib/**` module + the sourced doc it loads.
- **Surfaces** — every section/leaf that consumes it (from the founder's section map).
- **Settings** — the control-plane touchpoint.
- **Override** — what the operator can customise (per-case ▸ per-property ▸ per-workspace).
- **Specific changes** — concrete code edits, not hand-waving.

The resolver `resolveValue(dimension, jurisdiction, ctx)` and the two hooks (`usePropertyJurisdiction`, `useActiveJurisdiction`) from the integration plan §1 are assumed; below is **what each dimension feeds into them**.

---

## GROUP 1 — Legal frameworks (dims 1, 3, 5, 6, 10, 11, 12, 13, 22, 23)

### Dim 1 — Possession / eviction
- **Data:** `possession_cases` + `notice_period_overridden` (bool), `notice_override_reason` (text), `notice_override_exemption` (text). No new table — packs are typed code.
- **Engine/pack:** extend `src/lib/legal/jurisdiction.ts` → `PossessionFramework` per jurisdiction `{ routes[], grounds[{id,name,type,noticeDays|null,citation}], court, serviceMethods[] }`. Loads `legal-frameworks/tier-a-` + `tier-b-notice-periods-sourced.md`.
- **Surfaces:** Legal ▸ Possession (overview lens-aware) · **New Possession Case wizard** (record-true, property jurisdiction) · Money ▸ Arrears/Rent-Chase (notice tie-in) · Calendar (notice-expiry calculator) · Tenancy ▸ Timeline (statutory key-dates).
- **Settings:** Workspace ▸ Jurisdiction Customisation (custom default notice periods); Workspace ▸ Region (default jurisdiction).
- **Override:** per-case in the wizard — operator changes the resolved notice value + must add reason/exemption; sub-statutory-minimum shows a **warning, not a block** (master §10b); both statutory citation and override always shown.
- **Specific changes:** ① select-grounds step renders grounds from the property's pack not hardcoded E&W; ② notice-preview computes expiry via `serviceMethods` rules; ③ E&W RRA-2026 route already handled — generalise the route-array so SCT "Notice to Leave" / NI "Notice to Quit" / IE "Notice of Termination" render their own grounds; ④ arrears already captured (FIX-504) — feed `arrears_weeks` into the Ground-8 threshold check per jurisdiction.

### Dim 3 — Shared-occupancy / HMO / rental licensing
- **Data:** none new (typed packs); HMO licence record already exists (`hmo_licences`).
- **Engine/pack:** `src/lib/legal/licensing.ts` → `LicensingFramework { localName, applies, classes[{id,name,threshold(persons/households),authority,conditions[],citation}] }`. Loads `legal-frameworks/licensing-registration-sourced.md`.
- **Surfaces:** Legal ▸ HMO Licences · **Register HMO Licence wizard** (FIX-505, re-point to property pack) · Portfolio ▸ Property ▸ HMO Details · Planning ▸ HMO/Co-living profiles (Compliance tab).
- **Settings:** Workspace ▸ Jurisdiction Customisation (selective-licensing local council additions).
- **Override:** per-property — record a council's *additional* licensing condition; "no licensing in this jurisdiction" empty-state where the concept doesn't exist.
- **Specific changes:** ① HMO wizard Step 1 reads property country → renders that jurisdiction's licence classes (E&W mandatory/additional/selective; SCT/NI licence; IE registration); ② Property ▸ HMO Details tab hides for jurisdictions with no shared-occupancy regime; ③ threshold helper `requiresLicence(jurisdiction, persons, households)`.

### Dim 5 — Mandatory registration
- **Data:** `property_registrations` (property_id, registration_type, authority, reference, status, expires_at) — RLS workspace+property scoped.
- **Engine/pack:** folded into `licensing.ts` `registrationDuties(jurisdiction)` (IE RTB, Scotland Landlord Register, selective licensing). Loads same sourced doc.
- **Surfaces:** Portfolio ▸ Property ▸ Compliance · Compliance ▸ Overview/Coverage · Planning ▸ Starter Checklist (setup steps).
- **Settings:** Workspace ▸ Jurisdiction Customisation.
- **Override:** per-property registration reference + renewal date; operator can mark "not applicable here".
- **Specific changes:** ① Starter-Checklist pulls `registrationDuties` as setup tasks; ② Compliance Coverage shows registration as a coverage row per property jurisdiction.

### Dim 6 — Rent regulation / rent control
- **Data:** `country_rent_rules` (jurisdiction, increase_frequency, index_method, cap_pct|null, pressure_zone_model, notice_days, effective_from) — dated/configurable.
- **Engine/pack:** `src/lib/legal/rent-control.ts` → `rentIncreaseRule(jurisdiction)`. Loads `legal-frameworks/rent-regulation-sourced.md` + matrix.
- **Surfaces:** Money ▸ Income (rent change validation) · Tenancy ▸ Payments/Overview · Planning ▸ Income Model (cap on projected uplift) · Automations (rent-review trigger node).
- **Settings:** Workspace ▸ Jurisdiction Customisation (zone-specific caps).
- **Override:** per-tenancy contractual index; warn if increase exceeds statutory cap (e.g. IE nationwide CPI-or-2% from 1 Mar 2026, Scotland RCA, DE Mietpreisbremse).
- **Specific changes:** ① rent-increase forms compute max allowed + show "above the X% cap for this jurisdiction — verify"; ② Planning Income Model caps annual uplift at the rule; ③ `frequency` enforces once/12mo (UK/IE/NZ).

### Dim 10 — Short-let / holiday-let licensing
- **Data:** `property_short_let` (property_id, registration_no, night_cap|null, change_of_use_status, authority).
- **Engine/pack:** `src/lib/legal/short-let.ts` → `shortLetRule(jurisdiction)` (ES VUT, FR n° enregistrement, PT AL, Scotland control areas, AE). Loads `legal-frameworks/short-let-licensing-sourced.md`.
- **Surfaces:** Planning ▸ **Serviced Accommodation + Holiday Lets profiles** (highest divergence — Compliance/Income tabs) · Portfolio ▸ Property ▸ Compliance.
- **Settings:** Workspace ▸ Jurisdiction Customisation.
- **Override:** per-property registration number + night-cap; profile **gated** where short-let licensing is hostile/banned.
- **Specific changes:** ① SA/Holiday profile Compliance tab renders short-let checklist per country; ② Income Model applies night caps + occupancy/tourist tax; ③ profile applicability flag hides/flags where unmodelled.

### Dim 11 — Tenancy types & minimum terms
- **Data:** `tenancies.tenancy_type` enum already; extend allowed values per jurisdiction via pack, not DB enum lock-in (store as text + validate against pack).
- **Engine/pack:** `src/lib/legal/tenancy-models.ts` → `tenancyTypes(jurisdiction)` (AST→periodic, PRT, bail vide/meublé, 4+4, 3-yr). Loads `legal-frameworks/tenancy-rtr-fees-energy-sourced.md`.
- **Surfaces:** **Create Tenancy wizard** (type dropdown per jurisdiction) · Tenancy ▸ Overview · Tenancy ▸ Documents (agreement template — dim 18).
- **Settings:** —.
- **Override:** per-tenancy min/max term; warn if below statutory minimum.
- **Specific changes:** ① Create-Tenancy type list comes from the pack (E&W AST hidden post-RRA-2026 → periodic; Wales → occupation contract, see dim 18); ② min-term validator.

### Dim 12 — Notice service methods & prescribed forms
- **Data:** none (typed packs).
- **Engine/pack:** folded into `jurisdiction.ts` `serviceMethods[]` + `prescribedForms[]` (registered mail, notary, cantonal form, bailiff, RTB co-service).
- **Surfaces:** New Possession Case wizard (service step) · Money ▸ Rent-Chase · any statutory-notice generation.
- **Settings:** —.
- **Override:** operator selects method; system surfaces the jurisdiction's *required* method as default + warns on non-compliant choice.
- **Specific changes:** ① notice wizard adds a service-method step reading the pack; ② expiry math depends on method (e.g. +days for postal service).

### Dim 13 — Right-to-rent / immigration checks
- **Data:** `tenancy_checks` (tenancy_id, check_type, status, completed_at) — generic, reused across check types.
- **Engine/pack:** `src/lib/legal/tenant-checks.ts` → `requiredTenantChecks(jurisdiction)` (England Right-to-Rent **only**; anti-discrimination limits elsewhere). Loads `tenancy-rtr-fees-energy-sourced.md`.
- **Surfaces:** Create Tenancy wizard · Tenancy ▸ Overview · Compliance ▸ Coverage.
- **Settings:** —.
- **Override:** —.
- **Specific changes:** ① Right-to-Rent step renders **only for England properties** (already England-only in code — re-key from workspace to property); ② no-op/empty for other jurisdictions.

### Dim 22 — Tenant fees / permitted payments
- **Data:** none (packs).
- **Engine/pack:** `src/lib/legal/tenant-fees.ts` → `permittedPayments(jurisdiction)` + `holdingDepositCap` (Tenant Fees Act 2019 E&W, Scotland, Wales). Loads `tenancy-rtr-fees-energy-sourced.md`.
- **Surfaces:** Create Tenancy wizard (fee fields) · Money ▸ Income (fee validation) · Tenancy ▸ Deposit (holding deposit cap).
- **Settings:** —.
- **Override:** warn on charging a banned fee for the jurisdiction.
- **Specific changes:** ① fee inputs validate against permitted list; ② holding-deposit cap (1 week E&W) enforced as a soft warning.

### Dim 23 — Repair / fitness / habitation standards
- **Data:** reuse `compliance_items` with `kind` values for fitness/repair.
- **Engine/pack:** folded into `compliance/requirements.ts` `fitnessStandards(jurisdiction)` (Homes Act 2018, **Awaab's Law**, Repairing Standard SCT, IE S.I.137/2019).
- **Surfaces:** Compliance ▸ Overview/Coverage · Work ▸ Jobs (repair SLAs, e.g. Awaab's Law timescales) · Portfolio ▸ Property ▸ Compliance.
- **Settings:** —.
- **Override:** per-property recorded standard.
- **Specific changes:** ① Awaab's-Law repair-response timescales drive Work job SLA defaults for England social/PRS; ② Repairing Standard checklist for Scotland.

---

## GROUP 2 — Compliance & Work (dims 4, 20, 24, 27)

### Dim 4 — Safety compliance certificates
- **Data:** `compliance_items` exists; ensure `kind` enum covers gas/EICR/EPC/alarms/fire/legionella/PAT; `authority`, `cadence_months`, `next_due` columns.
- **Engine/pack:** extend `src/lib/compliance/requirements.ts` from 6 → 45 jurisdictions. Loads `compliance-frameworks/safety-compliance-and-trade-certs-sourced.md` (FR DDT/DPE, DE Rauchwarnmelder/Schornsteinfeger, ES ITE/cédula added).
- **Surfaces:** **Compliance section (all tabs)** · Add Certificate / Schedule Inspection wizards · Portfolio ▸ Property ▸ Compliance · Planning ▸ Compliance tab (every profile) · Calendar (renewal windows).
- **Settings:** Workspace ▸ Jurisdiction Customisation (extra local certs).
- **Override:** per-property add/remove a cert requirement (exemption, e.g. no gas supply → no CP12).
- **Specific changes:** ① **re-key `useComplianceRequirements` from workspace `countryCode` to property `country_code`** (the single biggest Compliance change); ② Coverage + Reports **group-by-jurisdiction** in a mixed portfolio; ③ cert wizards source their `kind` list from the property pack.

### Dim 20 — Contractor / trade certification & Work regulation
- **Data:** `suppliers` + jurisdiction-keyed credential fields (`gas_safe_no`, `rgi_no`, etc.) — or generic `supplier_credentials` (supplier_id, credential_type, reference, verified_at).
- **Engine/pack:** `src/lib/work/trade-certs.ts` → `requiredTradeCredential(jurisdiction, workType)` (Gas Safe, NICEIC/Part P, RGI, Safe Electric, Schornsteinfeger, AU builder licence). Loads same sourced doc (dim 20 section).
- **Surfaces:** **Work ▸ Suppliers (Directory/Compliance)** · Supplier detail ▸ Compliance · Work ▸ PPM (only credentialed suppliers) · Create Job wizard (supplier eligibility).
- **Settings:** —.
- **Override:** per-supplier verified credential.
- **Specific changes:** ① Supplier Compliance tab renders the **right credential field per jurisdiction + work type** (Gas Safe number for UK gas, RGI for IE); ② a cert is only "valid" if issued by a credentialed supplier — link dim 4 ↔ dim 20; ③ supplier tax-ID label per country (VAT/ABN/EIN — dim 8).

### Dim 24 — Insurance obligations
- **Data:** `property_insurance` (property_id, policy_type, insurer, expires_at) + supplier public-liability on `supplier_credentials`.
- **Engine/pack:** `src/lib/compliance/insurance.ts` → `insuranceDuties(jurisdiction, propertyType)` (buildings insurance, HMO/short-let cover, contractor PL minimums).
- **Surfaces:** Portfolio ▸ Property ▸ Compliance/Documents · Work ▸ Suppliers (PL minimum) · Planning ▸ Cost Drivers (premium estimate).
- **Settings:** —.
- **Override:** per-property policy record.
- **Specific changes:** ① insurance checklist row in Compliance; ② supplier PL-insurance minimum gate in Work.

### Dim 27 — Building safety (high-rise/cladding)
- **Data:** **structural — needs a building entity above unit** (links dim 17): `buildings` (workspace_id, address, is_higher_risk, accountable_person, safety_case_status, cladding_status, ews1_status); `properties.building_id` FK.
- **Engine/pack:** `src/lib/compliance/building-safety.ts` → `buildingSafetyDuties(jurisdiction, building)` (BSA 2022 higher-risk ≥18m/7-storeys + 2 units; leaseholder cost protections). Loads `compliance-frameworks/building-safety-sourced.md`.
- **Surfaces:** Portfolio ▸ Property ▸ Compliance (building-level checklist for blocks) · Compliance ▸ Coverage · Legal (leaseholder cost protections reference).
- **Settings:** —.
- **Override:** per-building Accountable Person + safety-case status.
- **Specific changes:** ① V1 = a **building-level compliance checklist** surfaced on higher-risk blocks (full Accountable-Person workflow is V1.5); ② `is_higher_risk` auto-flag from height/storeys/units.

---

## GROUP 3 — Tax & Money (dims 2, 7, 8, 9, 21, 26)

### Dim 2 — Deposits / bonds
- **Data:** `tenancies.deposit_*` exists (UK-shaped); add `deposit_scheme`, `deposit_protected_at`, `deposit_cap_basis`.
- **Engine/pack:** `src/lib/money/deposits.ts` → `depositRules(jurisdiction)` `{ scheme, capMonths|null, protectionRequired, prescribedInfo, returnWindow, disputesBody }`. Loads `legal-frameworks/deposit-rules-sourced.md` (all 45).
- **Surfaces:** **Tenancy ▸ Deposit** + **Money ▸ Deposits** (biggest tenancy gap) · Create Tenancy wizard · Track Deposit wizard · Money ▸ Record Payment.
- **Settings:** Workspace ▸ Jurisdiction Customisation (scheme provider choice).
- **Override:** per-tenancy cap override + reason; warn above statutory cap (UK 5 weeks <£50k; DE 3mo cold rent; IE 1mo).
- **Specific changes:** ① deposit forms render scheme + cap + prescribed-info checklist per jurisdiction; ② cap validator on the amount field via `<SourcedValue>`; ③ local currency throughout.

### Dim 7 — Acquisition / transaction tax
- **Data:** `country_acquisition_tax` (jurisdiction, region, bands jsonb, surcharges jsonb, effective_from) — dated, region-keyed (federal AU/CA/US).
- **Engine/pack:** `src/lib/planning/acquisition-tax.ts` → `acquisitionTax({ jurisdiction, region, price, isAdditional, isNonResident })` (SDLT +5%/+2%, LBTT+ADS 8%, LTT, ITP-AJD, Grunderwerbsteuer 3.5–6.5%, droits ~5.8%). Loads `tax-frameworks/property-tax-sourced.md` + matrix.
- **Surfaces:** **Planning ▸ Cost Drivers + Upfront Costs** · Planning ▸ Example Forecast · Planning Sets ▸ Upfront Costs · New Planning Set wizard · Portfolio ▸ Property ▸ Finances.
- **Settings:** Workspace ▸ Jurisdiction Customisation (rate overrides at fiscal events).
- **Override:** per-set rate override + reason (e.g. first-time-buyer relief, MDR).
- **Specific changes:** ① Cost-Drivers computes acquisition tax from the property's country/region bands not a UK SDLT formula; ② surcharge flags (additional dwelling, non-resident) in the wizard; ③ Scotland/Wales use LBTT/LTT.

### Dim 8 — Rental income & VAT/GST treatment
- **Data:** `country_tax_rates` exists (rates); add `treatment` columns (rent_vat_applies, reverse_charge, withholding_pct, short_let_vat).
- **Engine/pack:** `src/lib/money/tax.ts` → `computeTax({ jurisdiction, scheme, net, b2b, isShortLet })` (VAT/VAT-OSS/GST/sales-tax/reverse-charge). Loads matrix + `agent-fitness-incometax-language-sourced.md` (income-tax section).
- **Surfaces:** **Money ▸ Invoices + New Invoice** (legal fields + tax per property) · Money ▸ Income/Expenses/Bills · Work ▸ Supplier Invoice · Planning ▸ Income Model (VAT on serviced/holiday) · Contacts ▸ Organisation Invoices.
- **Settings:** Workspace ▸ Region (reporting currency); Admin ▸ Jurisdiction Packs (rate transparency).
- **Override:** per-invoice tax override + reason (exempt/zero-rated).
- **Specific changes:** ① invoice renders the jurisdiction's legal fields (VAT number, reverse-charge note) + correct tax line; ② short-let VAT flag on SA/Holiday income; ③ supplier reverse-charge for cross-border B2B.

### Dim 9 — Mortgage interest / finance-cost relief
- **Data:** none (pack).
- **Engine/pack:** `src/lib/planning/interest-relief.ts` → `interestReliefRule(jurisdiction)` (**UK S24** — interest not deductible, 20% credit only — vs full deductibility DE/FR/ES/IE). Loads `agent-fitness-incometax-language-sourced.md`.
- **Surfaces:** **Planning ▸ Example Forecast** (biggest forecast divergence) · Planning ▸ Refinancing profile · Planning Sets ▸ Forecasts.
- **Settings:** —.
- **Override:** per-set toggle (e.g. corporate vs personal holding changes relief).
- **Specific changes:** ① Forecast applies UK S24 restriction (add-back interest, 20% tax credit) for UK personal landlords vs full deduction elsewhere; ② surfaces the divergence as a labelled assumption.

### Dim 21 — Recurring property tax / local rates
- **Data:** `country_recurring_tax` (jurisdiction, region, basis, rate_or_band jsonb, payer).
- **Engine/pack:** `src/lib/money/recurring-tax.ts` → `recurringTax(jurisdiction, property)` (Council Tax UK, LPT IE, IBI ES, taxe foncière FR, Grundsteuer DE, IMU IT, council rates AU/NZ).
- **Surfaces:** Planning ▸ Cost Drivers/Forecast · Money ▸ Expenses (recurring) · Portfolio ▸ Property ▸ Finances.
- **Settings:** Workspace ▸ Jurisdiction Customisation.
- **Override:** per-property actual annual amount.
- **Specific changes:** ① Cost-Drivers includes the right recurring tax line per country; ② payer (landlord vs occupier) flag (IE LPT landlord; UK Council Tax occupier).

### Dim 26 — Capital Gains / disposal tax
- **Data:** none (pack).
- **Engine/pack:** `src/lib/planning/disposal-tax.ts` → `disposalTax({ jurisdiction, gain, holdingYears, isMainResidence, isNonResident })` (UK CGT 18/24% + 60-day; DE 10yr exempt; IT 5yr; FR taper; US FIRPTA; ES 3% retention). Loads `tax-frameworks/capital-gains-disposal-tax-sourced.md`.
- **Surfaces:** **Planning ▸ Dev/Flip profile** · Planning ▸ Example Forecast (exit modelling) · Money ▸ disposal.
- **Settings:** —.
- **Override:** per-set holding period + residence flags.
- **Specific changes:** ① exit/sale forecast deducts disposal tax (holding-period exemptions + non-resident withholding); ② Dev/Flip profile models VAT on new-build + CGT/income on sale.

---

## GROUP 4 — Structural & cross-cutting (dims 15, 16, 17, 18, 19, 25, 28)

### Dim 15 — Money / currency / format / address  *(mostly built — wire it)*
- **Data:** `properties.currency` derived from country; `workspaces.settings.reporting_currency`; `fx_rates` (base, quote, rate, as_of).
- **Engine/pack:** **canonical `formatMoney` already in `src/lib/i18n`** + `country-profiles.ts` (all 45) + `address-models.ts`/`phone-format.ts`.
- **Surfaces:** **every money figure app-wide** + Contacts/Add-Property address forms + Unit Specifications (area unit).
- **Settings:** Workspace ▸ Region (reporting currency); Account ▸ Language & Region (per-user locale).
- **Override:** —.
- **Specific changes:** ① **consolidate the 3 other `formatCurrency` call-sites onto `formatMoney`** (the only Phase-0 money code work); ② roll-ups convert via `fx_rates` showing reporting + local; ③ wire `areaUnit()` into Unit Specifications; ④ `AddressForm`/`PhoneInput` into Contacts + Add-Property wizards.

### Dim 16 — Privacy / data-protection  *(built — surface it)*
- **Data:** none (in `country-profiles.ts`).
- **Engine/pack:** `country-profiles.ts` privacy block (DSAR days, breach hours, regime).
- **Surfaces:** Portals (consent copy) · Settings ▸ Privacy/Compliance · Contacts (data-subject requests).
- **Settings:** Workspace ▸ Region; Admin ▸ Global.
- **Override:** —.
- **Specific changes:** ① surface DSAR/breach timelines per workspace jurisdiction in a privacy panel; ② portal consent text per recipient jurisdiction.

### Dim 17 — Housing / tenure & ownership models  *(STRUCTURAL — affects the data model itself)*
- **Data:** `properties.tenure_type` (freehold/leasehold/commonhold/condominium/strata/WEG/copropriété), `governance_body`, `periodic_charge` model; `buildings` entity (shared with dim 27); `properties.building_id`.
- **Engine/pack:** `src/lib/portfolio/tenure-models.ts` → `tenureModel(jurisdiction)` `{ tenureTypes[], governanceBody, periodicChargeLabel }`. Loads `legal-frameworks/housing-tenure-models-sourced.md`.
- **Surfaces:** **Portfolio ▸ Property ▸ Overview/Finances** (tenure + service/condo charge) · Add Property/Add Unit wizards · Money ▸ Expenses (service charge/Hausgeld/charges) · Planning ▸ Cost Drivers.
- **Settings:** —.
- **Override:** per-property tenure + charge.
- **Specific changes:** ① property/unit model gains tenure + governance body + periodic-charge so a US condo (HOA), German WEG (Hausgeld), French copropriété (charges/syndic), AU strata (body-corp levies), UK leasehold (service charge/ground rent) each render correctly; ② Money treats these charges per jurisdiction; ③ this is the **one dimension that changes the schema shape, not just labels** — design note required before encoding (see sourced doc).

### Dim 18 — Tenancy-agreement models & mandatory terms
- **Data:** `tenancy_documents` template keyed by jurisdiction + type.
- **Engine/pack:** folded into `tenancy-models.ts` `agreementModel(jurisdiction)` (E&W AST, **Wales occupation contracts (RHW Act 2016)**, Scotland model PRT, FR bail, DE Mietvertrag) + written-statement duty.
- **Surfaces:** Tenancy ▸ Documents · Create Tenancy wizard · Portals (tenant agreement view).
- **Settings:** Workspace ▸ Jurisdiction Customisation (own template upload).
- **Override:** workspace custom agreement template.
- **Specific changes:** ① **Wales renders "occupation contract" not "tenancy"** (different model — terminology + clauses); ② Scotland model PRT prescribed clauses; ③ written-statement-of-terms duty surfaced.

### Dim 19 — Letting-agent / property-manager regulation
- **Data:** `workspaces.settings` agent fields (redress_scheme, cmp_provider, agent_licence_no).
- **Engine/pack:** `src/lib/legal/agent-regulation.ts` → `agentDuties(jurisdiction)` (**Rent Smart Wales**, Scotland Letting Agent Register, England redress + CMP). Loads `agent-fitness-incometax-language-sourced.md`.
- **Surfaces:** **Settings ▸ Workspace** (agent compliance) · Contacts (agent records) · Portals (CMP/redress disclosure footer).
- **Settings:** Workspace ▸ Region & Jurisdiction (licence/CMP/redress fields).
- **Override:** workspace records its licence/CMP/redress membership.
- **Specific changes:** ① a Workspace agent-compliance panel capturing Rent Smart Wales licence / Scotland registration / England redress + CMP; ② portal footers disclose CMP + redress per jurisdiction.

### Dim 25 — Notice & document language requirements
- **Data:** none (drives translation routing — dim/§5).
- **Engine/pack:** `src/lib/i18n/notice-language.ts` → `requiredNoticeLanguages(jurisdiction)` (Wales **bilingual**, Belgium regional language, Quebec FR, Switzerland cantonal).
- **Surfaces:** Messages ▸ Email Templates · Portals · any statutory notice generation · New Possession Case (notice language).
- **Settings:** Workspace ▸ Region (supported portal locales).
- **Override:** —.
- **Specific changes:** ① Wales notices render **bilingual EN/CY**; ② Belgium/Quebec/Switzerland route notice language to the jurisdiction's official language(s); ③ ties statutory notices into the translation catalogue.

### Dim 28 — AML / KYC
- **Data:** `kyc_checks` (subject_id, check_type, source_of_funds, sanctions_screened_at, status); sanctions list already in code.
- **Engine/pack:** `src/lib/legal/aml.ts` → `amlDuties(jurisdiction)` (UK MLR 2017, CDD, source-of-funds, sanctions screening, MLRO). Loads `legal-frameworks/aml-kyc-sourced.md`.
- **Surfaces:** Contacts (CDD on landlord/tenant) · Money (source-of-funds on transactions) · Settings ▸ Workspace (MLRO/AML policy) · Portals (applicant verification).
- **Settings:** Workspace ▸ Region & Jurisdiction (AML registration, MLRO).
- **Override:** workspace AML policy + supervisor registration.
- **Specific changes:** ① CDD checklist on contact onboarding for regulated workspaces; ② sanctions screening already present — surface result; ③ source-of-funds capture on large transactions.

---

## Cross-dimension dependency map (build-order sanity)
- **Dim 17 (tenure) + 27 (building safety)** both need the **`buildings` entity** → build that schema once in Phase 0/1, both consume it.
- **Dim 4 (certs) ↔ 20 (trade credentials)** — a cert is valid only if from a credentialed supplier → build together (Phase 2).
- **Dim 8 (VAT) underpins** Money invoices, Work supplier invoices, Planning income → Phase 3 before Planning Phase 4.
- **Dim 25 (notice language) feeds** the translation pipeline (§5) → sequence after Phase 0 locale infra.
- **Dims 1/11/12/22 (possession/tenancy-type/service/fees)** all read the same tenancy pack → one `tenancy-models.ts` + `jurisdiction.ts` pair.

## Phase rollup (which dims land in which phase)
| Phase | Dimensions delivered |
|---|---|
| **0 Foundations** | 15 (money consolidation), 16 (surface), provider/resolver/SourcedValue/disclaimer, `buildings` skeleton |
| **1 Legal** | 1, 3, 5, 11, 12, 13, 22 + override layer |
| **2 Compliance/Work** | 4, 20, 23, 24, 27 |
| **3 Money/Tax** | 2, 6, 7, 8, 9, 21, 26 |
| **4 Planning** | profile parameterisation consuming 7/8/9/10/21/26 |
| **5 Country UI packs** | `COUNTRY_PACKS` 6→45, 17 (tenure), 18, 19 |
| **6 Translation** | 25 + full catalogue, 22 locales |
| **7 MCP sweep** | all — mixed-portfolio acceptance |

---

> **Every dimension above is encoded as a typed pack fed by a `*-sourced.md` doc, consumed through `resolveValue()` + `<SourcedValue>`, overridable per-case/property/workspace, and rendered with the permanent dismissible disclaimer. No dimension is hardcoded; none claims legal authority.**
