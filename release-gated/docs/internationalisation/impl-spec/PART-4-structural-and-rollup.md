# Propvora i18n — IMPLEMENTATION SPEC · PART 4 / 4 · Structural, cross-cutting & master rollup

**Dimensions:** 15 Money/format/address · 16 Privacy · 17 Housing/tenure models · 18 Tenancy-agreement models · 19 Agent regulation · 25 Notice language · 28 AML/KYC.
**Plus:** the workspace→section rollup, onboarding additions, seed-data plan, and the Phase-0 spine build (the shared components every dimension assumes).
**Compiled:** 2026-06-25 · Facet template + shared spine as in `PART-1-legal-frameworks.md`.

---

# DIM 15 — Money / currency / format / address  *(mostly built — wire & consolidate)*

### 1. How it works
The canonical `formatMoney`/`formatDate` **already exist in `src/lib/i18n`**. Phase-0 work = replace the 3 other `formatCurrency` call-sites with it; derive `properties.currency` from country; roll-ups convert via `fx_rates` showing reporting + local; wire `areaUnit()` into Unit Specifications and `AddressForm`/`PhoneInput` into wizards.

### 2. New features
- One money formatter app-wide; reporting-currency roll-ups with local alongside; area unit (sqm/sqft) per country; country-aware address/phone forms.

### 3. New components
- `src/components/money/MoneyAmount.tsx` (wraps `formatMoney`, shows local + reporting).
- `src/components/money/FxRollup.tsx` (converted total + per-currency breakdown).
- Reuse existing `components/intl/AddressForm.tsx`, `PhoneInput.tsx`.

### 4. Context changes
`reportingCurrency` + `fxConvert` exposed from a `MoneyContext` alongside the locale provider.

### 5. Cross-integration
**Every money figure** + Contacts/Add-Property address + Unit Specifications + all of Parts 1–3 (they all use `formatMoney`).

### 6. Requirements
Phase-0; `fx_rates` table; audit + replace the 3 stray `formatCurrency` implementations.

### 7. Workspace level
Workspace ▸ Region & Jurisdiction: reporting currency. Account ▸ Language & Region: per-user locale.

### 8. Section → sub-tab → wizard → detail
- App-wide; specifically **Portfolio/Home roll-ups**, **Unit ▸ Specifications** (area unit), **Add Property / Add Contact** (address/phone).

### 9. Editable & new fields
- Editable: reporting currency (workspace), locale (user), area unit display.
- New: `workspaces.settings.reporting_currency`; `properties.currency` (derived).

### 10. DB additions
`fx_rates` (base, quote, rate, as_of). `workspaces.settings += reporting_currency`. `properties.currency` derived on write from country.

### 11. Function additions
Reuse `formatMoney`, `formatDate`, `areaUnit`; add `fxConvert(amount, from, to, asOf)`, `rollup(amounts[], reportingCcy)`.

### 12. Onboarding additions
Workspace setup captures reporting currency + default locale; Add-Property derives currency/area unit from country.

### 13. Seed data additions
`fx_rates` rows for GBP/EUR/AED; a mixed-currency portfolio (UK GBP + ES EUR + AE AED) for roll-up testing.

---

# DIM 16 — Privacy / data-protection  *(built in `country-profiles.ts` — surface it)*

### 1. How it works
`country-profiles.ts` already holds DSAR days/breach hours/regime for all 45. Surface as a workspace privacy panel + portal consent copy per recipient jurisdiction.

### 2. New features
- Privacy-duty panel (DSAR/breach timelines); jurisdiction-correct portal consent text.

### 3. New components
- `src/components/settings/PrivacyDutyPanel.tsx`.
- `src/components/portals/ConsentNotice.tsx`.

### 4. Context changes
`privacyProfile(jur)` from country-profiles surfaced via `useActiveJurisdiction`.

### 5. Cross-integration
**Portals** (consent) · **Settings ▸ Privacy** · **Contacts** (data-subject requests) · dim 28 (AML data handling).

### 6. Requirements
Phase-0/6; data exists.

### 7. Workspace level
Workspace ▸ Region; Admin ▸ Global (DPO/representative).

### 8. Section → sub-tab → wizard → detail
- **Settings ▸ Privacy** · **Portals** consent · **Contacts** DSAR.

### 9. Editable & new fields
- Editable: DPO/representative contact, breach-log entries.
- New: `workspaces.settings.dpo_contact`.

### 10. DB additions
`workspaces.settings += dpo_contact, privacy_representative`. Optional `data_subject_requests` table (V1.5).

### 11. Function additions
`privacyProfile(jur)` (read-through to country-profiles); `dsarDeadline(jur, requestedAt)`.

### 12. Onboarding additions
Workspace setup optionally captures DPO/representative.

### 13. Seed data additions
None required (config-level).

---

# DIM 17 — Housing / tenure & ownership models  *(STRUCTURAL — changes the property/unit schema)*

### 1. How it works
The property/unit model gains `tenure_type`, `governance_body`, and a `periodic_charge` model resolved by `tenureModel(jur)`. A US condo (HOA), German WEG (Hausgeld), French copropriété (charges/syndic), AU strata (body-corp levies) and UK leasehold (service charge/ground rent) each render correctly. Shares the **`buildings`** entity with dim 27.

### 2. New features
- Per-jurisdiction tenure types + governance body + periodic-charge label/handling.
- Building→unit structure where ownership is collective.

### 3. New components
- `src/components/portfolio/TenureSelect.tsx`.
- `src/components/portfolio/PeriodicChargeCard.tsx` (service charge/Hausgeld/charges/levies).
- `src/components/portfolio/GovernanceBodyPanel.tsx` (syndic/HOA/body corporate).

### 4. Context changes
`tenureModel` in portfolio pack; `useTenure(propertyId)` resolves tenure + charge label.

### 5. Cross-integration
**Dim 27 shares `buildings`** · dim 21 (charges vs tax) · **Portfolio ▸ Property ▸ Overview/Finances** · **Add Property/Unit wizards** · **Money ▸ Expenses** (periodic charge) · **Planning ▸ Cost Drivers**.

### 6. Requirements
Phase-0/1 builds `buildings` skeleton + tenure columns; Phase-5 fills all-45 labels. **Design note required before encoding** (schema-shaping).

### 7. Workspace level
None.

### 8. Section → sub-tab → wizard → detail
- **Portfolio ▸ Property ▸ Overview / Finances** (tenure + charge).
- **Wizards: Add Property, Add Unit** (tenure capture).
- **Money ▸ Expenses** (periodic charge category).

### 9. Editable & new fields
- Editable: tenure type, governance body, periodic charge amount/frequency, ground rent.
- New: `properties.tenure_type`, `governance_body`, `periodic_charge_amount`, `periodic_charge_frequency`, `ground_rent`.

### 10. DB additions
`properties`: `+ tenure_type text`, `+ governance_body text`, `+ periodic_charge_amount numeric`, `+ periodic_charge_frequency text`, `+ ground_rent numeric`, `+ building_id uuid` (shared dim 27). `buildings` entity (NEW, shared).

### 11. Function additions
`src/lib/portfolio/tenure-models.ts`: `tenureModel(jur)`, `periodicChargeLabel(jur)`, `governanceBodyLabel(jur)`.

### 12. Onboarding additions
Add-Property captures tenure type per jurisdiction (leasehold/freehold/commonhold/condominium/strata/WEG/copropriété).

### 13. Seed data additions
1 UK leasehold flat (service charge + ground rent), 1 DE WEG apartment (Hausgeld + syndic-equivalent), 1 US condo (HOA), each linked to a building.

---

# DIM 18 — Tenancy-agreement models & mandatory terms

### 1. How it works
`agreementModel(jur)` resolves the statutory agreement type + prescribed clauses + written-statement duty. **Wales renders "occupation contract" (RHW Act 2016), not "tenancy"** — terminology + clauses differ. Drives Tenancy ▸ Documents templates.

### 2. New features
- Jurisdiction agreement type + prescribed-clause checklist + written-statement-of-terms duty.
- Wales occupation-contract model.

### 3. New components
- `src/components/portfolio/AgreementModelPanel.tsx`.
- `src/components/portfolio/PrescribedClauseChecklist.tsx`.

### 4. Context changes
`agreementModel` folded into `tenancy-models.ts`; `useAgreementModel(propertyId)`.

### 5. Cross-integration
Dim 11 (tenancy type) · dim 25 (language) · **Tenancy ▸ Documents** · **Create Tenancy wizard** · **Portals** (tenant agreement view).

### 6. Requirements
Phase-1/5; templates per jurisdiction.

### 7. Workspace level
Workspace ▸ Jurisdiction Customisation: upload own agreement template.

### 8. Section → sub-tab → wizard → detail
- **Tenancy ▸ Documents** · **Create Tenancy** · **Portals** tenant view.

### 9. Editable & new fields
- Editable: agreement type, template choice, written-statement issued flag.
- New: `tenancies.agreement_model`, `tenancies.written_statement_issued_at`.

### 10. DB additions
`tenancies`: `+ agreement_model text`, `+ written_statement_issued_at date`. `tenancy_documents` template keyed by (jurisdiction, type).

### 11. Function additions
`agreementModel(jur)`, `prescribedClauses(jur, type)`, `writtenStatementDuty(jur)`.

### 12. Onboarding additions
Create-Tenancy defaults agreement model from property jurisdiction (Wales → occupation contract).

### 13. Seed data additions
1 Wales occupation contract + 1 SCT model PRT, with prescribed-clause checklists.

---

# DIM 19 — Letting-agent / property-manager regulation

### 1. How it works
`agentDuties(jur)` resolves agent licensing/redress/CMP (Rent Smart Wales, Scotland Letting Agent Register, England redress + CMP). A Workspace agent-compliance panel captures the workspace's memberships; portal footers disclose CMP + redress per jurisdiction.

### 2. New features
- Workspace agent-compliance panel; jurisdiction-correct CMP/redress portal disclosure.

### 3. New components
- `src/components/settings/AgentCompliancePanel.tsx`.
- `src/components/portals/CmpRedressFooter.tsx`.

### 4. Context changes
`agentDuties` in legal pack; surfaced in Settings + portal shells.

### 5. Cross-integration
Dim 28 (agency AML) · **Settings ▸ Workspace** · **Contacts** (agent records) · **Portals** (disclosure footer).

### 6. Requirements
Phase-5; `workspaces.settings` agent fields.

### 7. Workspace level
**Workspace ▸ Region & Jurisdiction** captures licence no / CMP provider / redress scheme.

### 8. Section → sub-tab → wizard → detail
- **Settings ▸ Workspace** (agent compliance) · **Portals** (footer disclosure).

### 9. Editable & new fields
- Editable: agent licence no, CMP provider, redress scheme.
- New: `workspaces.settings.agent_licence_no`, `cmp_provider`, `redress_scheme`.

### 10. DB additions
`workspaces.settings += agent_licence_no, cmp_provider, redress_scheme`.

### 11. Function additions
`src/lib/legal/agent-regulation.ts`: `agentDuties(jur)`, `requiresCmp(jur)`, `redressSchemes(jur)`.

### 12. Onboarding additions
Workspace setup ▸ if operating in Wales/Scotland/England, prompts for licence/CMP/redress (a real first-run step).

### 13. Seed data additions
Workspace seeded with a Rent Smart Wales licence + an England redress scheme for the demo.

---

# DIM 25 — Notice & document language requirements

### 1. How it works
`requiredNoticeLanguages(jur)` routes statutory notices/portal copy to the jurisdiction's official language(s): **Wales bilingual EN/CY**, Belgium regional, Quebec FR, Switzerland cantonal. Ties statutory notices into the translation catalogue (§5).

### 2. New features
- Bilingual/official-language notice rendering; recipient-language routing.

### 3. New components
- `src/components/i18n/BilingualNotice.tsx`.
- Language routing in `MessageTemplateRenderer`.

### 4. Context changes
`requiredNoticeLanguages(jur)` from a new i18n helper; consumed by notice + portal renderers.

### 5. Cross-integration
Dim 12 (notice forms) · dim 1 (possession notices) · **Messages ▸ Email Templates** · **Portals** · **New Possession Case** (notice language).

### 6. Requirements
Phase-6 (after locale infra); translation catalogue.

### 7. Workspace level
Workspace ▸ Region: supported portal locales.

### 8. Section → sub-tab → wizard → detail
- **Messages ▸ Email Templates** · **Portals** · **Possession/Rent-Chase notices**.

### 9. Editable & new fields
- Editable: notice language override.
- New: validation/routing only.

### 10. DB additions
None (uses translation catalogue + jurisdiction config).

### 11. Function additions
`src/lib/i18n/notice-language.ts`: `requiredNoticeLanguages(jur)`, `renderBilingual(keys, langs)`.

### 12. Onboarding additions
None.

### 13. Seed data additions
1 Wales tenant with a bilingual notice rendered EN/CY.

---

# DIM 28 — AML / KYC

### 1. How it works
`amlDuties(jur)` resolves AML obligations (UK MLR 2017, CDD, source-of-funds, sanctions screening, MLRO). A CDD checklist appears on contact onboarding for regulated workspaces; sanctions screening (already in code) surfaces its result; source-of-funds captured on large transactions.

### 2. New features
- CDD checklist + source-of-funds capture + MLRO/policy record.

### 3. New components
- `src/components/contacts/CddChecklist.tsx`.
- `src/components/money/SourceOfFundsField.tsx`.
- `src/components/settings/AmlPolicyPanel.tsx`.

### 4. Context changes
`amlDuties` in legal pack; `useAml(jur)`.

### 5. Cross-integration
Dim 19 (agency AML) · dim 13 (RtR overlap) · dim 16 (data handling) · **Contacts** (CDD) · **Money** (source of funds) · **Settings ▸ Workspace** (MLRO) · **Portals** (applicant verification).

### 6. Requirements
Phase-5/6; `kyc_checks` table; sanctions list exists.

### 7. Workspace level
**Workspace ▸ Region & Jurisdiction**: AML supervisor registration + MLRO.

### 8. Section → sub-tab → wizard → detail
- **Contacts ▸ detail ▸ Audit/Overview** (CDD) · **Money** transactions (source of funds) · **Settings ▸ Workspace** (policy) · **Portals** (applicant).

### 9. Editable & new fields
- Editable: CDD status, source-of-funds, sanctions result, MLRO contact.
- New: `kyc_checks` rows; `workspaces.settings.mlro_contact`, `aml_supervisor`.

### 10. DB additions
`kyc_checks` (id, workspace_id, subject_id, check_type, source_of_funds, sanctions_screened_at, status) — RLS scoped. `workspaces.settings += mlro_contact, aml_supervisor`.

### 11. Function additions
`src/lib/legal/aml.ts`: `amlDuties(jur)`, `requiresCdd(jur, dealType)`, `screenSanctions(name)` (reuse existing list).

### 12. Onboarding additions
Workspace setup ▸ regulated activity prompts for MLRO + AML supervisor registration.

### 13. Seed data additions
1 contact with a completed CDD + sanctions-clear result.

---

# PHASE 0 — the shared spine every dimension assumes (build first)

| Build | File | Purpose |
|---|---|---|
| Jurisdiction context | `src/lib/jurisdiction/context.tsx` | `JurisdictionContextProvider` mounts in `AppShell`/`PortalPageShell` |
| Resolution hooks | `src/lib/jurisdiction/hooks.ts` | `usePropertyJurisdiction`, `useActiveJurisdiction` |
| Override resolver | `src/lib/jurisdiction/resolve.ts` | `resolveValue(dim, jur, ctx)` walks per-case▸property▸workspace▸sourced▸blank |
| Render wrapper | `src/components/jurisdiction/SourcedValue.tsx` | value + source chip + edit + disclaimer trigger |
| Chips/switcher | `src/components/jurisdiction/JurisdictionChip.tsx`, `JurisdictionLensSwitcher.tsx` | record-true chip + section lens |
| Disclaimer | `src/components/jurisdiction/NotLegalAdviceNotice.tsx` | permanent, dismissible (Acknowledge + Close), per-user persistence |
| Money consolidation | reuse `src/lib/i18n/formatMoney` | replace 3 stray `formatCurrency` |
| Buildings skeleton | migration + `buildings` table | shared by dims 17 + 27 |

**Phase-0 migrations:** `properties.country_code/region_code` (verify/add/backfill), `workspaces.settings` (default_country_code, default_region, reporting_currency, supported_portal_locales), `user_section_jurisdiction_lens`, `user_notice_dismissals`, `fx_rates`, `buildings` + `properties.building_id`.

---

# WORKSPACE → SECTION ROLLUP (how the whole thing flows)

```
Workspace (default jurisdiction, reporting currency, agent/AML/privacy config, customisations)
  └─ Property (country_code/region_code = the spine; tenure; building link)        ← record-true
       ├─ Tenancy (deposit, type, agreement model, checks, rent rule)
       ├─ Compliance items (certs per property jurisdiction)
       ├─ Registrations / licences / insurance / short-let
       ├─ Building (higher-risk safety, tenure governance)                          ← shared 17/27
       └─ Planning sets (acquisition/recurring/disposal tax, interest relief)
  └─ Section overviews (Compliance/Legal/Money/Portfolio/Home)                      ← section-lens (switchable / grouped)
  └─ Suppliers (trade credentials, tax-ID, PL insurance)                            ← supplier-jurisdiction
  └─ Portals & Messages (recipient locale + jurisdiction rights/notice language)    ← recipient-jurisdiction
```
- **Record-true** surfaces lock to the property/asset jurisdiction (detail pages, wizards on a property, cases, certs, invoices-on-property).
- **Section-lens** surfaces (overviews) default to "All (grouped)" for Compliance/Legal and let the operator switch lens — the "UAE one minute, UK the next" control.
- **Context-default** surfaces (settings, global create) use the workspace default.

---

# ONBOARDING ADDITIONS (consolidated)
| Step | Captures | Feeds dims |
|---|---|---|
| Workspace setup ▸ "Where do you operate?" | default jurisdiction(s) + region | 1,5,6,seed defaults |
| Workspace setup ▸ reporting currency + locale | reporting ccy, default locale, portal locales | 15,25 |
| Workspace setup ▸ regulated activity | agent licence/CMP/redress, MLRO, AML supervisor, DPO | 19,28,16 |
| Add-Property wizard ▸ Step 1 | country/region (the spine), tenure, building link, currency/area derived | 2,3,4,5,7,15,17,21,24,27 |
| Supplier-onboarding wizard | jurisdiction → trade credential fields + tax-ID | 20 |
| Create-Tenancy wizard | deposit scheme/cap, tenancy type, agreement model, checks | 2,11,13,18,22 |

---

# SEED-DATA PLAN (mixed-portfolio acceptance — UK + ES + AE + DE)
To satisfy the Demo Seed Rule **and** prove the programme, seed:
- **Properties:** 1 EW leasehold flat (in a higher-risk building), 1 SCT property, 1 ES property (VUT short-let), 1 AE/Dubai property, 1 DE WEG apartment.
- **Buildings:** 1 England higher-risk block (20m/8-storey/12-unit) with the EW flat inside.
- **Tenancies:** with jurisdiction-correct deposits (UK 5wk, DE 3mo), types (EW periodic, SCT PRT, FR bail, Wales occupation contract), checks (England RtR).
- **Compliance:** ≥4 items per property in its jurisdiction's set (EW CP12/EICR/EPC/alarms; FR/DE/ES equivalents).
- **Suppliers:** UK Gas-Safe, IE RGI, DE Schornsteinfeger with verified credentials.
- **Money:** invoices (UK VAT + reverse-charge), deposits, recurring tax (UK Council Tax, IE LPT, ES IBI).
- **Planning sets:** EW (SDLT + S24), SCT (LBTT+ADS), ES (ITP), DE (held >10yr disposal-exempt).
- **FX:** GBP/EUR/AED rows.
All seeded via Management API PAT per the Seed-Before-Test + PAT-First rules; browser-verify counts match KPI cards.

---

# MASTER MIGRATION INDEX (all parts)
Parts 1–3 migration tables + Phase-0 + Part-4:
- **Phase 0:** properties.country_code/region_code, workspaces.settings (defaults/ccy/locales/agent/AML/privacy), user_section_jurisdiction_lens, user_notice_dismissals, fx_rates, buildings (+properties.building_id).
- **Part 1:** possession_cases(+4), hmo_licences(+4), property_registrations, country_rent_rules, tenancies(+rent_index/last_increase/type→text), tenancy_checks, property_short_let, jobs(+sla×2), compliance_items(kind).
- **Part 2:** compliance_items(+5), supplier_credentials, suppliers(+3), property_insurance.
- **Part 3:** tenancies(+deposit×4), country_deposit_rules, country_acquisition_tax, country_recurring_tax, country_tax_rates(+4), invoices(+4), contacts/orgs(+vat), planning_sets(+7), properties(+recurring tax×2).
- **Part 4:** properties(tenure×5), tenancies(agreement×2), workspaces.settings(dpo/representative), kyc_checks.

All idempotent, RLS-enforced, reproducible from clean DB, applied via Management API PAT (project `oovgfknmzjcgbilwumch`). **NOT-NULL jsonb rule:** omit empty jsonb cols on insert.

> **The 4-part implementation spec is complete.** Every one of the 28 dimensions now has: integration mechanism, new features, new components, context changes, cross-integration, requirements, workspace→section→sub-tab→wizard→detail placement, editable/new fields, DB additions, function additions, onboarding additions, and seed data. Phase 0 builds the spine; Phases 1–6 deliver the dimensions per the rollup; Phase 7 is the live mixed-portfolio MCP sweep. Say **"start Phase 0"** to begin building.
