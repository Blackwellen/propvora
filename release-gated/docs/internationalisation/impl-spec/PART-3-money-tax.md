# Propvora i18n — IMPLEMENTATION SPEC · PART 3 / 4 · Money & Tax

**Dimensions:** 2 Deposits · 7 Acquisition tax · 8 Rental income & VAT/GST · 9 Interest relief · 21 Recurring property tax · 26 Capital gains/disposal.
**Compiled:** 2026-06-25 · Facet template + shared spine as in `PART-1-legal-frameworks.md`.
**Posture:** PM platform, not a tax advisor; every rate/figure is dated + configurable + rendered via `<SourcedValue>` with the permanent dismissible disclaimer. Federal countries (AU/CA/US) are region-keyed.

---

# DIM 2 — Deposits / bonds

### 1. How it works
Create-Tenancy + Track-Deposit + Tenancy/Money Deposit surfaces call `depositRules(jur)` → `{scheme, capMonths|null, protectionRequired, prescribedInfo, returnWindow, disputesBody}`. The cap renders via `<SourcedValue>` on the amount field with a soft over-cap warning. Local currency throughout via `formatMoney`.

### 2. New features
- Jurisdiction deposit scheme + cap + prescribed-info checklist (UK 5wk TDP; DE 3mo Kaution; IE 1mo RTB; ES fianza).
- Over-cap warning + protection-deadline tracking.

### 3. New components
- `src/components/money/DepositRulePanel.tsx` (scheme + cap + prescribed info).
- `src/components/money/DepositCapInput.tsx` (wraps `<SourcedValue>`, over-cap warn).
- `src/components/money/PrescribedInfoChecklist.tsx`.

### 4. Context changes
`depositRules` in money pack; `useDepositRules(propertyId)`.

### 5. Cross-integration
Dim 22 (holding deposit) · dim 11 (tenancy type) · **Tenancy ▸ Deposit** · **Money ▸ Deposits** · **Create Tenancy** · **Track Deposit** · **Money ▸ Record Payment** · **Calendar** (protection deadline).

### 6. Requirements
Phase-3; `deposit-rules-sourced.md` (all 45) typed; `tenancies.deposit_*` extended.

### 7. Workspace level
Workspace ▸ Jurisdiction Customisation: default scheme provider; over-cap override policy.

### 8. Section → sub-tab → wizard → detail
- **Tenancy ▸ Deposit** + **Money ▸ Deposits** (biggest tenancy gap).
- **Wizards: Create Tenancy, Track Deposit** · **Money ▸ Record Payment / Deposit detail**.

### 9. Editable & new fields
- Editable: deposit amount, scheme, protected date, cap-basis, prescribed-info served flag, return outcome.
- New: `deposit_scheme`, `deposit_protected_at`, `deposit_cap_basis`, `prescribed_info_served_at`.

### 10. DB additions
`tenancies`: `+ deposit_scheme text`, `+ deposit_protected_at date`, `+ deposit_cap_basis text`, `+ prescribed_info_served_at date`. Optional `country_deposit_rules` lookup (jurisdiction, scheme, cap_basis, cap_value, protection_days, return_window_days).

### 11. Function additions
`src/lib/money/deposits.ts`: `depositRules(jur)`, `maxDeposit(jur, rent, period)`, `isOverCap(jur, amount, rent)`, `protectionDeadline(jur, receivedAt)`.

### 12. Onboarding additions
Create-Tenancy auto-fills scheme + cap from property jurisdiction; flags protection deadline.

### 13. Seed data additions
2 tenancies with deposits: 1 UK (5-week cap, TDP, prescribed info served) + 1 DE (3-month Kaution). Per Demo Seed Rule, at least one with a near protection deadline.

---

# DIM 7 — Acquisition / transaction tax

### 1. How it works
Planning Cost-Drivers/Upfront-Costs call `acquisitionTax({jur, region, price, isAdditional, isNonResident})` → bands + surcharges (SDLT +5%/+2%, LBTT+ADS 8%, LTT, ITP-AJD, Grunderwerbsteuer 3.5–6.5%, droits ~5.8%). Region-keyed for Scotland/Wales/federal. Rates dated/configurable.

### 2. New features
- Jurisdiction acquisition-tax engine with surcharge flags.
- Region selection for Scotland (LBTT) / Wales (LTT) / federal.

### 3. New components
- `src/components/planning/AcquisitionTaxBreakdown.tsx` (bands + surcharges + `<SourcedValue>`).
- `src/components/planning/SurchargeToggles.tsx` (additional dwelling / non-resident).

### 4. Context changes
`acquisitionTax` in tax engine; `useAcquisitionTax(propertyId)`.

### 5. Cross-integration
Dim 21 (recurring) · dim 26 (disposal, exit) · **Planning ▸ Cost Drivers + Upfront Costs** · **Planning ▸ Example Forecast** · **Planning Sets ▸ Upfront Costs** · **New Planning Set wizard** · **Portfolio ▸ Property ▸ Finances**.

### 6. Requirements
Phase-3/4; `country_acquisition_tax` populated from `tax-frameworks/property-tax-sourced.md` + matrix.

### 7. Workspace level
Workspace ▸ Jurisdiction Customisation: override a rate after a fiscal event (dated).

### 8. Section → sub-tab → wizard → detail
- **Planning ▸ Cost Drivers / Upfront Costs / Example Forecast** (every profile).
- **Planning Sets ▸ Upfront Costs** · **Wizard: New Planning Set**.
- **Portfolio ▸ Property ▸ Finances** (acquisition context).

### 9. Editable & new fields
- Editable: purchase price, additional-dwelling flag, non-resident flag, region, rate override + reason.
- New: `planning_sets.acquisition_region`, `planning_sets.acquisition_tax_override`.

### 10. DB additions
`country_acquisition_tax` (jurisdiction, region, bands jsonb, surcharges jsonb, effective_from). `planning_sets`: `+ acquisition_region text`, `+ acquisition_tax_override numeric`, `+ acquisition_tax_override_reason text`.

### 11. Function additions
`src/lib/planning/acquisition-tax.ts`: `acquisitionTax({jur, region, price, isAdditional, isNonResident}): {total, bands[]}`, `surchargesFor(jur, flags)`.

### 12. Onboarding additions
New Planning Set captures region + surcharge flags up front.

### 13. Seed data additions
3 planning sets: EW (SDLT + 5% additional), SCT (LBTT + ADS 8%), ES (ITP) so the engine + region keying are testable.

---

# DIM 8 — Rental income & VAT/GST treatment

### 1. How it works
Invoice/income/expense surfaces call `computeTax({jur, scheme, net, b2b, isShortLet})` → VAT/VAT-OSS/GST/sales-tax/reverse-charge per the **property's** jurisdiction. Invoices render the jurisdiction's legal fields (VAT number, reverse-charge note) + correct tax line.

### 2. New features
- Jurisdiction tax engine on every money document.
- Reverse-charge for cross-border B2B; short-let VAT flag.
- Legal invoice fields per country.

### 3. New components
- `src/components/money/TaxLine.tsx` (computed tax + scheme label).
- `src/components/money/InvoiceLegalFields.tsx` (VAT no, reverse-charge note).
- `src/components/money/TaxSchemeBadge.tsx`.

### 4. Context changes
`computeTax` + `taxScheme(jur)` in money pack; `useTaxScheme(propertyId)`.

### 5. Cross-integration
Dim 20 (supplier tax-ID/reverse charge) · dim 10 (short-let VAT) · **Money ▸ Invoices/Income/Expenses/Bills** · **New Invoice wizard** · **Work ▸ Supplier Invoice** · **Contacts ▸ Organisation ▸ Invoices** · **Planning ▸ Income Model**.

### 6. Requirements
Phase-3 (before Planning Phase 4); `country_tax_rates` (exists) extended with treatment columns.

### 7. Workspace level
Workspace ▸ Region (reporting currency); Admin ▸ Jurisdiction Packs (rate transparency).

### 8. Section → sub-tab → wizard → detail
- **Money ▸ Invoices / Income / Expenses / Bills** + **Invoice/Bill detail**.
- **Wizards: New Invoice, Add Income, Add Expense, Add Bill**.
- **Work ▸ Supplier ▸ Invoice** · **Contacts ▸ Organisation ▸ Invoices** · **Planning ▸ Income Model**.

### 9. Editable & new fields
- Editable: net amount, tax scheme, B2B flag, short-let flag, tax override + reason, VAT number.
- New: `invoices.tax_scheme`, `invoices.reverse_charge`, `invoices.tax_override`, party `vat_number`.

### 10. DB additions
`country_tax_rates`: `+ rent_vat_applies bool`, `+ reverse_charge bool`, `+ withholding_pct numeric`, `+ short_let_vat numeric`. `invoices`: `+ tax_scheme text`, `+ reverse_charge bool`, `+ tax_override numeric`, `+ tax_override_reason text`. `contacts/organisations`: `+ vat_number text`.

### 11. Function additions
`src/lib/money/tax.ts`: `computeTax({jur, scheme, net, b2b, isShortLet})`, `taxScheme(jur)`, `invoiceLegalFields(jur)`, `isReverseCharge(jur, supplierJur, b2b)`.

### 12. Onboarding additions
Workspace setup captures VAT-registration status → drives whether tax lines show.

### 13. Seed data additions
2 invoices: 1 UK VAT-registered (20% line) + 1 cross-border reverse-charge; per Demo Seed Rule 1 paid + 1 unpaid.

---

# DIM 9 — Mortgage interest / finance-cost relief

### 1. How it works
Planning Example-Forecast calls `interestReliefRule(jur)` → applies **UK S24** (interest not deductible; 20% tax credit) for UK personal landlords vs full deductibility elsewhere (DE/FR/ES/IE). Surfaces the divergence as a labelled assumption.

### 2. New features
- Correct interest-relief modelling per jurisdiction (the biggest forecast divergence).
- Personal-vs-corporate holding toggle (changes relief).

### 3. New components
- `src/components/planning/InterestReliefAssumption.tsx` (labelled assumption + `<SourcedValue>`).
- `src/components/planning/HoldingStructureToggle.tsx`.

### 4. Context changes
`interestReliefRule` in planning engine; `useInterestRelief(propertyId)`.

### 5. Cross-integration
Dim 7 (acquisition) · dim 8 (income tax) · **Planning ▸ Example Forecast** · **Planning ▸ Refinancing profile** · **Planning Sets ▸ Forecasts**.

### 6. Requirements
Phase-4; pack only (no table) from `agent-fitness-incometax-language-sourced.md`.

### 7. Workspace level
None.

### 8. Section → sub-tab → wizard → detail
- **Planning ▸ Example Forecast** (all profiles) · **Refinancing profile** · **Planning Sets ▸ Forecasts**.

### 9. Editable & new fields
- Editable: holding structure (personal/corporate), mortgage interest, tax band.
- New: `planning_sets.holding_structure`.

### 10. DB additions
`planning_sets`: `+ holding_structure text default 'personal'`.

### 11. Function additions
`src/lib/planning/interest-relief.ts`: `interestReliefRule(jur)`, `applyRelief({jur, structure, interest, taxBand, profit})`.

### 12. Onboarding additions
None.

### 13. Seed data additions
1 UK personal-holding planning set (S24 add-back visible) + 1 DE set (full deduction) to contrast.

---

# DIM 21 — Recurring property tax / local rates

### 1. How it works
Planning Cost-Drivers + Money Expenses call `recurringTax(jur, property)` → the right annual tax line (Council Tax UK, LPT IE, IBI ES, taxe foncière FR, Grundsteuer DE, IMU IT, council rates AU/NZ) + payer (landlord vs occupier).

### 2. New features
- Correct recurring tax line per country + payer flag.

### 3. New components
- `src/components/money/RecurringTaxLine.tsx`.
- `src/components/money/PayerBadge.tsx` (landlord/occupier).

### 4. Context changes
`recurringTax` in money pack; `useRecurringTax(propertyId)`.

### 5. Cross-integration
Dim 7 (acquisition) · dim 10 (business-rates vs council-tax for short-let) · **Planning ▸ Cost Drivers / Forecast** · **Money ▸ Expenses** · **Portfolio ▸ Property ▸ Finances**.

### 6. Requirements
Phase-3; `country_recurring_tax` table.

### 7. Workspace level
Workspace ▸ Jurisdiction Customisation: override actual amount.

### 8. Section → sub-tab → wizard → detail
- **Planning ▸ Cost Drivers / Example Forecast** · **Money ▸ Expenses** (recurring) · **Portfolio ▸ Property ▸ Finances**.

### 9. Editable & new fields
- Editable: actual annual amount, payer, band.
- New: `properties.recurring_tax_annual`, `properties.recurring_tax_payer`.

### 10. DB additions
`country_recurring_tax` (jurisdiction, region, basis, rate_or_band jsonb, payer). `properties`: `+ recurring_tax_annual numeric`, `+ recurring_tax_payer text`.

### 11. Function additions
`src/lib/money/recurring-tax.ts`: `recurringTax(jur, property)`, `taxPayer(jur)`.

### 12. Onboarding additions
Add-Property optionally captures the band/amount.

### 13. Seed data additions
1 UK property (Council Tax, occupier) + 1 IE property (LPT, landlord) + 1 ES property (IBI).

---

# DIM 26 — Capital gains / disposal tax

### 1. How it works
Planning Dev/Flip + Example-Forecast exit modelling call `disposalTax({jur, gain, holdingYears, isMainResidence, isNonResident})` → UK CGT 18/24% + 60-day; DE 10yr exempt; IT 5yr; FR taper; US FIRPTA; ES 3% retention. Deducted from net exit proceeds.

### 2. New features
- Disposal-tax modelling with holding-period exemptions + non-resident withholding.

### 3. New components
- `src/components/planning/DisposalTaxBreakdown.tsx` (gain → tax → net + `<SourcedValue>`).
- `src/components/planning/HoldingPeriodInput.tsx`.

### 4. Context changes
`disposalTax` in planning engine; `useDisposalTax(propertyId)`.

### 5. Cross-integration
Dim 7 (acquisition basis) · dim 8 (income vs capital on flips) · **Planning ▸ Dev/Flip profile** · **Planning ▸ Example Forecast (exit)** · **Money ▸ disposal**.

### 6. Requirements
Phase-4; pack from `tax-frameworks/capital-gains-disposal-tax-sourced.md`.

### 7. Workspace level
None.

### 8. Section → sub-tab → wizard → detail
- **Planning ▸ Dev/Flip** profile · **Example Forecast** exit rows · **Money** disposal.

### 9. Editable & new fields
- Editable: expected gain, holding years, main-residence flag, non-resident flag.
- New: `planning_sets.holding_years`, `planning_sets.is_non_resident`.

### 10. DB additions
`planning_sets`: `+ holding_years numeric`, `+ is_non_resident bool`, `+ is_main_residence bool`. (Disposal rates packed in code, dated.)

### 11. Function additions
`src/lib/planning/disposal-tax.ts`: `disposalTax({jur, gain, holdingYears, isMainResidence, isNonResident}): {tax, net, withholding}`.

### 12. Onboarding additions
None.

### 13. Seed data additions
1 UK Dev/Flip set (CGT 24% + 60-day) + 1 DE set held >10yr (exempt) to contrast holding-period logic.

---

## Part-3 build order & dependencies
- **Dim 15 money consolidation (Part 4 / Phase 0) is the prerequisite** — all money figures use `formatMoney`.
- **Dim 8 (VAT) before Planning Phase 4** — Planning income/forecast consume it.
- **Dims 7/21/26 are Planning-facing** — land in Phase 3 (engines) then Phase 4 (profile wiring).
- **Dim 2 (deposits)** is Phase-3 highest money+legal risk; build first in this part.

## Part-3 migration summary (Management API PAT, idempotent, RLS)
| Table | Change |
|---|---|
| `tenancies` | + deposit_scheme, deposit_protected_at, deposit_cap_basis, prescribed_info_served_at |
| `country_deposit_rules` | NEW (optional lookup) |
| `country_acquisition_tax` | NEW |
| `country_recurring_tax` | NEW |
| `country_tax_rates` | + rent_vat_applies, reverse_charge, withholding_pct, short_let_vat |
| `invoices` | + tax_scheme, reverse_charge, tax_override, tax_override_reason |
| `contacts`/`organisations` | + vat_number |
| `planning_sets` | + acquisition_region, acquisition_tax_override(+reason), holding_structure, holding_years, is_non_resident, is_main_residence |
| `properties` | + recurring_tax_annual, recurring_tax_payer |

> **Next:** PART-4 (Structural & cross-cutting — dims 15, 16, 17, 18, 19, 25, 28) + the workspace/onboarding/seed master rollup.
