# Propvora i18n — Full Integration To-Do (with per-section QA gates)

Each lettered workstream lists its build items **and** a **QA GATE**: the surfaces it
produces/modifies, which audit tier each must pass (see
[qa/MASTER-QA-CHECKLISTS.md](qa/MASTER-QA-CHECKLISTS.md)), and the i18n-critical checks
for that workstream. **No item is complete below 100/100**, with a release-evidence doc
per touched surface. Run every gate with Chrome MCP at all 8 viewports **and** test the
code (DB, RLS, edge functions, unit/integration/E2E, security, performance).

**Standing i18n overlay (every gate):** record-true vs lens correct · `<SourcedValue>` +
dismissible `NotLegalAdviceNotice` on every figure · `formatMoney`/`formatDate` in the
property's locale + reporting roll-up · override chain audit-logged · RLS negatives
include wrong-jurisdiction + cross-workspace property leakage · no mock data.

---

## A. Jurisdiction spine (engine)
**Build**
1. [x] `resolveValue()` override chain + 9 unit tests
2. [x] `usePropertyJurisdiction(id)` (record-true)
3. [x] `JurisdictionContextProvider` + `useActiveJurisdiction({sectionKey})` (lens)
4. [x] `NotLegalAdviceNotice`, `SourcedValue`, `JurisdictionChip`
5. [x] Property adapter + types surface `country_code`/`region_code`/`currency`
6. [x] Provider mounted in `(app)/layout.tsx` below `WorkspaceLocaleProvider`
7. [~] `JurisdictionLensSwitcher` built (FIX-536) + `JurisdictionFrameworkPanel` + **wired into Legal overview with real effect** (FIX-542); Compliance/Money/Portfolio/Home overviews pending
8. [x] `buildings` table + `properties.building_id` (FIX-540; RLS applied)
9. [x] `workspaces.settings.reportingCurrency` + `supportedPortalLocales` end-to-end (FIX-541); country/region/currency/locale already existed
10. [x] `fx_rates` + `fxConvert()`/`rollup()` + `MoneyAmount`/`FxRollup` (FIX-537; `MoneyAmount`/`FxRollup` FIX-536; rates seeded)
11. [ ] Consolidate stray `formatCurrency` → `formatMoney` (5 defs: utils/planning/marketplace/countries/portfolio-map — careful delegation pass)
12. [x] `user_notice_dismissals` table (FIX-540; localStorage is the active V1 default in `NotLegalAdviceNotice`)

**QA GATE** — Surfaces: the provider mount + every overview that gains the lens switcher.
Tier: **library/unit** for the engine (resolver, hooks) + **Tier 1** for each overview the switcher lands on.
Critical: resolver precedence unit tests green; lens persists across refresh/back-forward/workspace-switch (Tier-2 #33–35); switcher keyboard + ARIA (#235–239); no hydration error from localStorage hydrate (#105); `formatMoney` parity after consolidation (no value drift) (#43).

## B. Settings control plane
**Build**
13. [ ] Workspace ▸ **Region & Jurisdiction** tab (default jurisdiction, reporting currency, portal locales, agent licence/CMP/redress, MLRO/AML, DPO)
14. [ ] Workspace ▸ **Jurisdiction Customisation** tab (per-jurisdiction overrides; extends `workspace_legal_modules`)
15. [ ] Workspace ▸ **Disclaimers & Notices** tab
16. [ ] Account ▸ **Language & Region** (per-user locale)
17. [ ] Admin ▸ **Translations** (catalogue completeness/publish)
18. [ ] Admin ▸ **Jurisdiction Packs** (read-only provenance + citations)

**QA GATE** — Surfaces: each settings route above. Tier: **Tier 2** (sub-tabs of Settings/Admin).
Critical: owner/admin-only RLS + negative tests for member/read-only (#166–173); writes persist on refresh (#138–142); changing the default jurisdiction/reporting currency flows downstream (cross-section #194–196); Admin surfaces blocked from workspace users (#20, #182); dual-state flag test where flag-gated; audit log on every settings write (#189–190).

## C. Legal frameworks (dims 1,3,5,6,10,11,12,13,22,23)
**Build**
19. [x] Possession: per-case notice override (FIX-543) + **per-jurisdiction routes pack (SCT/NI/IE + generic) wired into the wizard** (FIX-578). E&W keeps Section 8/21; other jurisdictions render their own routes feeding the override + persistence.
20. [~] Licensing engine `src/lib/legal/licensing.ts` (HMO classes + `requiresLicence` + registration duties) **done** + panel on Property ▸ Compliance (FIX-584). Remaining: wire into Register-HMO wizard.
21. [~] Registration duties **folded into `licensing.ts`** (SCT Landlord Register, IE RTB) + shown on Property ▸ Compliance (FIX-584). Remaining: `property_registrations` table + Starter Checklist tasks.
22. [~] Rent-control engine `src/lib/legal/rent-control.ts` **done + 10 tests** + **jurisdiction-rules panel in Create Tenancy** (FIX-583). Remaining: Money Income increase validator + Planning Income Model cap.
23. [~] Short-let engine `src/lib/legal/short-let.ts` **done + 5 tests** + **panel on SA/Holiday profile Compliance tabs** (FIX-581). Remaining: `property_short_let` per-property registration record.
24. [~] Tenancy-types/agreement engine `src/lib/legal/tenancy-models.ts` **done** (Wales occupation contracts, SCT PRT, FR bail) + shown in Create Tenancy panel (FIX-585). Remaining: source the type dropdown from the pack.
25. [ ] Service-methods/forms + `service_method` col → possession/rent-chase notices
26. [~] Tenant-checks engine `src/lib/legal/tenant-checks.ts` **done** (Right to Rent England-only) + shown in Create Tenancy panel (FIX-585). Remaining: `tenancy_checks` persistence.
27. [~] Tenant-fees engine `src/lib/legal/tenant-fees.ts` **done + 8 tests** + **holding-cap/banned-fee note in Create Tenancy** (FIX-583). Remaining: Money Income fee validation.
28. [x] Fitness engine + **wired into Create Job** (FIX-592: Awaab's-Law SLA banner + persists `jobs.sla_source`/`sla_target_at`).

**QA GATE** — Surfaces: Legal overview + Possession + HMO sub-tabs (Tier 2); New Possession Case + Register HMO **wizards** (wizard tier); Create Tenancy wizard. 
Critical: wizard renders the **property's** jurisdiction routes/grounds/classes, not workspace (#i18n overlay); per-case override writes reason/exemption + audit (#145, #189); sub-statutory-minimum **warns not blocks**; empty-state where a regime doesn't exist (#100); RLS negative for wrong-workspace possession case (#172); each step validates before Next; dismissible disclaimer present (overlay).

## D. Compliance & Work (dims 4,20,24,27)
**Build**
29. [~] **Re-keyed `useComplianceRequirements` workspace→property** (FIX-550). **Packs 6→45 already exist** in `requirements.ts` (DE/FR/ES + ~20 EU reviewed; dispatch maps them; generic elsewhere). Remaining: `compliance_items` cols + Reports grouping.
30. [~] Grouped-by-jurisdiction **Coverage done** (FIX-574: lens switcher + cross-jurisdiction column union + grouped rows). Reports pending.
31. [ ] Cert wizards source `kind` from property pack
32. [~] Trade-cert engine + **wired into Supplier Compliance card** (FIX-593: required credentials + tax-ID label). Remaining: `supplier_credentials` write/verify UI.
33. [~] Insurance engine + **wired into Property ▸ Compliance** (FIX-589). Remaining: `property_insurance` write UI.
34. [~] Building-safety engine `src/lib/compliance/building-safety.ts` **done + tested** + panel on Property ▸ Compliance (FIX-584). `buildings` entity already migrated. Remaining: building-level checklist from real building dims.

**QA GATE** — Surfaces: Compliance Overview/Certificates/Inspections/Coverage/Reports (Tier 2); Add Certificate/Schedule Inspection/Upload Doc/Evidence (wizards); Work ▸ Suppliers + Supplier detail (Tier 2 + detail). 
Critical: a property's cert set matches its jurisdiction (#i18n); Coverage groups correctly in mixed portfolio; cert valid only if issuing supplier credentialed (dim 4↔20); KPI counts update after cert create/expire (#90–91); building-level checklist only on higher-risk blocks; RLS negative cross-workspace supplier/cert (#172).

## E. Money & Tax (dims 2,7,8,9,21,26)
**Build**
35. [~] Deposit pack `src/lib/money/deposits.ts` **done + 14 tests** (FIX-545) + `DepositRulePanel` **wired into Tenancy ▸ Deposit** (FIX-546). Remaining: Money ▸ Deposits + Track Deposit wizard + `tenancies.deposit_*` cols.
36. [~] Acquisition-tax engine `src/lib/planning/acquisition-tax.ts` **done + 9 tests** + interactive estimator wired into Planning ▸ Cost Drivers (FIX-575). Remaining: Upfront Costs (per-set, real price) + `planning_sets` override cols.
37. [~] Tax engine `src/lib/money/tax.ts` **done + 9 tests** + **wired into New Invoice** (FIX-577: jurisdiction tax options + rent-exempt/reverse-charge treatment note). Remaining: Income/Expenses/Bills + supplier invoices + `invoices` tax cols.
38. [~] Interest-relief engine `src/lib/planning/interest-relief.ts` **done + 6 tests** + **comparison panel wired into Planning ▸ Example Forecast** (FIX-576, UK S24 vs full). Remaining: `planning_sets.holding_structure` persistence on real sets.
39. [~] Recurring-tax engine `src/lib/money/recurring-tax.ts` **done + 5 tests** + **line in Cost Drivers estimator** (FIX-579). Remaining: Money Expenses recurring line + `properties.recurring_tax_*`.
40. [~] Disposal-tax engine `src/lib/planning/disposal-tax.ts` **done + 8 tests** + **panel in Example Forecast** (FIX-580); `planning_sets` cols added (FIX-582). Remaining: bind panel to a real set.

**QA GATE** — Surfaces: Money Overview + all 13 sub-tabs (Tier 2); Invoice/Bill/Deposit detail pages; New Invoice/Add Income/Add Expense/Add Bill/Track Deposit/New Rent Chase **wizards**. 
Critical: tax math correct per scheme (unit tests, #39 main-tier KPI calc); over-cap deposit warns; currency = property's via `formatMoney` + reporting roll-up (#43, overlay); invoice legal fields per jurisdiction; double-submit doesn't duplicate (#143–144); RLS negative wrong-workspace invoice (#172); audit log on financial mutations (#189).

## F. Planning parameterisation
**Build**
41. [ ] `src/lib/planning/*` engines take a `jurisdiction` param (currency, acquisition/recurring/disposal tax, VAT, interest relief, rent cap, applicability)
42. [ ] Wire all 13 profiles' Income/Cost/Compliance/Forecast tabs + Planning Sets + Landlord Offer to property jurisdiction
43. [ ] Analytics sub-tabs (Forecasts/Yield/Portfolio Intelligence/Scenario/Conversion) multi-currency + group-by-jurisdiction

**QA GATE** — Surfaces: Planning Overview + 9 sub-tabs (Tier 2); 13 profile detail pages × 8 tabs (Tier 3 nested); Planning Set + Landlord Offer detail (Tier 3); New Planning Set/New Offer wizards. 
Critical: each profile tab parameterised by the **property/set jurisdiction**; forecast tax model correct (S24 vs full deduction) with labelled assumption; analytics roll-ups multi-currency; profile applicability gates research-only profiles outside reviewed jurisdictions; AI Questions grounded on jurisdiction + permission-safe (#118–120).

## G. Structural & cross-cutting (dims 15,16,17,18,19,25,28)
**Build**
44. [~] Tenure engine `src/lib/portfolio/tenure-models.ts` **done + tested** + panel on Property ▸ Compliance (FIX-584). Remaining: `properties.tenure_*` cols + Money periodic-charge line.
45. [~] Agreement models **in `tenancy-models.ts`** (Wales occupation contract) + Create Tenancy panel (FIX-585). Remaining: `tenancies.agreement_model` + Documents templates.
46. [~] Agent-regulation engine `src/lib/legal/agent-regulation.ts` **done + tested** + panel in Region & Jurisdiction settings (FIX-586). Remaining: workspace agent-licence fields + portal CMP footer.
47. [x] Notice-language engine + **`BilingualNotice` wired into possession notice-preview** (FIX-591, Wales EN/CY).
48. [~] AML engine + **wired into Settings (FIX-586) and Contact Profile CDD checklist (FIX-594)**. Remaining: `kyc_checks` write/persist.
49. [ ] Privacy panel (DSAR/breach) + portal consent copy

**QA GATE** — Surfaces: Property Overview/Finances (tenure/charge), Tenancy Documents (agreement), Settings ▸ Workspace (agent/AML/privacy), Portals (consent/CMP footer/bilingual). Tier: Tier 1/2 + detail + portal-shell. 
Critical: tenure model changes the property/unit schema correctly (US condo/DE WEG/FR copropriété); Wales shows "occupation contract" not "tenancy"; bilingual notice renders both languages; AML CDD permission-gated + audit; portal consent in **recipient** jurisdiction (portal-boundary #portal).

## H. Country UI packs
50. [ ] Extend `COUNTRY_PACKS` 6→45 (terms/types/tabs/disclaimers/area unit)

**QA GATE** — Surfaces: every section that reads the pack (taxonomy/terms/tabs). Tier: pack **snapshot tests** + spot Tier-1 on a non-GB jurisdiction (e.g. ES, AE). 
Critical: tab visibility correct per country (HMO hidden where no regime); terminology renders; restricted/banned packs gate correctly; no missing-key crash.

## I. Wizards (capture the spine + fields)
51. [ ] **Add Property** Step 1: capture country/region (sets spine) + tenure + building link + derive currency/area
52. [ ] Add Unit (inherit), Create Tenancy (deposit/type/agreement/checks), Supplier onboarding (credentials), New Planning Set (region/surcharges)

**QA GATE** — Surfaces: each wizard. Tier: **wizard tier** (step validation, Back/Next/Save/Finish, draft persistence, success state, no duplicate submit). 
Critical: Add-Property persists `country_code`/`region_code` → property becomes record-true; currency/area derived from country; NOT-NULL jsonb rule (omit empty); deep-link prefill; created record appears in Portfolio + sets jurisdiction across child tabs (cross-section #77).

## J. Translation programme
53. [~] String extraction → `en-GB` catalogue; section-by-section JSX→`t()` (portal→email→legal→money→operator)
54. [~] **22-locale CORE vocabulary translated + wired + tested** (FIX-595: 69 keys × 22 locales; en-GB fallback for the rest). Full app-wide string extraction + legal-string professional translation = external gate.

**QA GATE** — Surfaces: every translated surface + Admin Translations. Tier: Tier 1/2 per section in the **target locale** + layout regression. 
Critical: no clipped layouts at +35% string length (#28, #59 styling); portals/emails use **recipient** locale; legal/statutory strings gated (not shipped authoritative until reviewed); missing-key report clean; completeness % accurate.

## K. Onboarding, seed & acceptance
55. [ ] Onboarding additions (workspace "where do you operate", reporting ccy/locale, regulated-activity capture; per-wizard captures)
56. [ ] Seed mixed UK+ES+AE+DE portfolio (buildings, tenancies, compliance, suppliers, money, planning sets, FX) via PAT
57. [ ] **Live MCP sweep (last):** every route × 8 viewports × jurisdiction/locale states; mixed-portfolio acceptance, zero console errors

**QA GATE** — Surfaces: onboarding flow + the whole app under the mixed portfolio. Tier: **full Tier 1+2+3 sweep** across every route. 
Critical: the acceptance scenario — UK workspace + ES + AE + DE properties renders each leaf with the property's jurisdiction/currency/(language), lens + grouped views correct, every figure carries source chip + disclaimer, zero console/hydration errors, RLS property+workspace safe — across all 8 viewports. Release-evidence doc per section; section scores to 100/100; final decision recorded.

---

## Status
- **Shipped (A1–A10, A12; A11 pending):** engine + 7 primitives (incl. `JurisdictionFrameworkPanel`) + property spine + provider mount + FX lib/money components + `buildings`/`user_notice_dismissals` migrations + seeded FX + **reporting-currency end-to-end (B-partial: Region & Jurisdiction settings tab extended)** + **lens switcher wired into Legal overview with real effect**. **0 TS errors, 17/17 tests.** FIX-533…542.
- **Next:** A11 (formatCurrency delegation), wire lens into Compliance/Money/Portfolio/Home overviews, B14–B15 (Jurisdiction Customisation + Disclaimers settings tabs), then **C (Legal)** — possession pack + per-case override into the New Possession Case wizard.

> Each `[ ]` becomes a FIX-NNN in `qa-release/implementation-fix-log.md` when coded, ticks here, and produces its release-evidence doc before its QA gate can be marked passed.
