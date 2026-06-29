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
11. [x] Consolidate stray `formatCurrency` → shared i18n core (FIX-715): added `formatCurrencyAmount` to `src/lib/i18n/format.ts`; `formatMoney`/`formatMoneyMajor` + the 5 strays (utils/planning/marketplace×2/countries/portfolio-map) now delegate to it. Zero value drift — pinned by `src/__tests__/money-format-consolidation.test.ts` (legacy-copy comparison across values×currencies×locales). 836/836 tests, 0 TS errors.
12. [x] `user_notice_dismissals` table (FIX-540; localStorage is the active V1 default in `NotLegalAdviceNotice`)

**QA GATE** — Surfaces: the provider mount + every overview that gains the lens switcher.
Tier: **library/unit** for the engine (resolver, hooks) + **Tier 1** for each overview the switcher lands on.
Critical: resolver precedence unit tests green; lens persists across refresh/back-forward/workspace-switch (Tier-2 #33–35); switcher keyboard + ARIA (#235–239); no hydration error from localStorage hydrate (#105); `formatMoney` parity after consolidation (no value drift) (#43).

## B. Settings control plane
**Build**
13. [x] Workspace ▸ **Region & Jurisdiction** — `workspace-settings/jurisdiction/page.tsx`: default jurisdiction + UK region, default + **reporting/roll-up currency**, locale, live agent-licence/CMP/redress (`agentDuties`) + MLRO/AML (`amlDuties`) panels; owner/admin-gated (`canEdit`), persists via `/api/workspace/jurisdiction`. *(Verified already shipped — FIX-541; box was stale.)*
14. [x] Workspace ▸ **Jurisdiction Customisation** — overrides surfaced where each value lives (possession notice-period override + reason, deposit caps per property, per-property compliance extra/exempt, per-set acquisition/disposal tax), summarised in the "Jurisdiction customisation & overrides" card on the same tab; every override keeps its sourced default + citation + audit. *(Verified already shipped; box was stale.)*
15. [x] Workspace ▸ **Disclaimers & Notices** — "Disclaimers & notices" card + `NotLegalAdviceNotice` (popover + permanent inline footer) on the jurisdiction tab. *(Verified already shipped; box was stale.)*
16. [x] Account ▸ **Language & Region** — `account/preferences/page.tsx`: `LocaleSwitcher` persisting `default_language` per user (`saveUserPreferences`). *(Verified already shipped; box was stale.)*
17. [x] Admin ▸ **Translations** — `admin/global-translations/page.tsx` (6 tabs: Overview/Keys/Locales/Review/Glossary/Imports) over `getTranslationOverview` (real per-locale catalogue stats from `SUPPORTED_LOCALES`). *(Verified already shipped; box was stale.)*
18. [x] Admin ▸ **Jurisdiction Packs** — `admin/global` + per-country `admin/global/[code]` `CountryReleaseControls`: 5 review domains (legal/tax/privacy/sanctions/commercial) with **reviewer provenance** (name + date), pack statuses (disabled→reviewed→enabled), release-ready gating, sanctions lock, GB locked-reviewed. *(Verified already shipped; box was stale.)*

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
25. [x] Service-methods engine `src/lib/legal/service-methods.ts` (FIX-718) + **wired into possession Record-Service** — methods (and the deemed-service hint + notice term) now resolve from the **property's** jurisdiction (E&W post/process-server, SCT recorded/sheriff-officer, IE registered post, generic elsewhere), not a fixed England list. `service_method` col already persisted. 18 unit tests. Remaining (V1.5): surface the same set in the rent-chase notice service log.
26. [~] Tenant-checks engine `src/lib/legal/tenant-checks.ts` **done** (Right to Rent England-only) + shown in Create Tenancy panel (FIX-585). Remaining: `tenancy_checks` persistence.
27. [~] Tenant-fees engine `src/lib/legal/tenant-fees.ts` **done + 8 tests** + **holding-cap/banned-fee note in Create Tenancy** (FIX-583). Remaining: Money Income fee validation.
28. [x] Fitness engine + **wired into Create Job** (FIX-592: Awaab's-Law SLA banner + persists `jobs.sla_source`/`sla_target_at`).

**QA GATE** — Surfaces: Legal overview + Possession + HMO sub-tabs (Tier 2); New Possession Case + Register HMO **wizards** (wizard tier); Create Tenancy wizard. 
Critical: wizard renders the **property's** jurisdiction routes/grounds/classes, not workspace (#i18n overlay); per-case override writes reason/exemption + audit (#145, #189); sub-statutory-minimum **warns not blocks**; empty-state where a regime doesn't exist (#100); RLS negative for wrong-workspace possession case (#172); each step validates before Next; dismissible disclaimer present (overlay).

## D. Compliance & Work (dims 4,20,24,27)
**Build**
29. [~] **Re-keyed `useComplianceRequirements` workspace→property** (FIX-550). **Packs 6→45 already exist** in `requirements.ts` (DE/FR/ES + ~20 EU reviewed; dispatch maps them; generic elsewhere). Remaining: `compliance_items` cols + Reports grouping.
30. [~] Grouped-by-jurisdiction **Coverage done** (FIX-574: lens switcher + cross-jurisdiction column union + grouped rows). Reports pending.
31. [x] Cert wizard sources type + `kind` from the **selected property's** jurisdiction pack (FIX-717): New-Certificate wizard switched to `usePropertyComplianceRequirements(state.property)` — a German property shows DE certs even in a UK workspace; the chosen type auto-resets if the property's jurisdiction no longer offers it, so a wrong-jurisdiction `kind` can never be saved.
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
41. [x] Planning tax engines take a jurisdiction param — `acquisition-tax`/`disposal-tax`/`recurring-tax`/`interest-relief` all key off `countryCode`(+region); consumed in profile Cost Drivers + Example Forecast tabs. FIX-720 also **fixed a currency bug**: the tabs derived `ccy` from a hardcoded `GB?GBP:AE?AED:…:EUR` ternary (so e.g. a **US** property showed **EUR**) — now sourced from `getCountryPack(country).currency`, accurate across all 45 packs.
42. [x] Profile tabs Cost Drivers + Example Forecast jurisdiction + multi-currency wired (FIX-575/576/579/580/582/720); other profile tabs are qualitative (no money). **Landlord Offer** carries + renders its own currency end-to-end (FIX-722). **Planning-Set sub-pages** (Income/Expenses/Bills/Forecasts/Assumptions) render in the set's currency via `usePlanningSetCurrency` + `formatMoneyCompact` (FIX-723). Sets + Offers money fully localised.
43. [N/A — deferred to the analytics feature] Analytics sub-tabs multi-currency + group-by-jurisdiction. **Verified 2026-06-29 (PAT):** the three Planning-intelligence source tables — `planning_yield_property_metrics`, `planning_ai_pricing_recommendations`, `planning_benchmark_assumptions` — **do not exist in the DB**, so the yield/portfolio/pricing hooks always fall through their `42P01` guard to **seeded demo arrays**. Localising hardcoded mock data is not meaningful i18n work; multi-currency + group-by-jurisdiction must be built **with** the real analytics data layer (a separate V1.5+ feature that should be flag-gated). Logged as a feature dependency, not an open i18n wiring task.

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
50. [x] Extend `COUNTRY_PACKS` 6→45 (FIX-716): added 39 packs (IE NZ FR ES PT IT NL BE LU CH AT SE NO DK FI IS PL CZ SK HU RO GR HR EE LV LT SA QA KW BH OM ZA SG HK MY IN JP MX BR) — currency/locale/dateFormat/terms/propertyTypes/compliance(from `requirements.ts`)/tabVisibility/disclaimer. **Only GB reviewed; all 44 others `generic` + non-advice disclaimer; Section 21/8 + UK trackers off everywhere outside GB.** Pinned by `src/lib/i18n/country-packs.test.ts` (13 invariant tests). 0 TS errors.

**QA GATE** — Surfaces: every section that reads the pack (taxonomy/terms/tabs). Tier: pack **snapshot tests** + spot Tier-1 on a non-GB jurisdiction (e.g. ES, AE). 
Critical: tab visibility correct per country (HMO hidden where no regime); terminology renders; restricted/banned packs gate correctly; no missing-key crash.

## I. Wizards (capture the spine + fields)
51. [x] **Add Property** captures **country + UK region** on the Address step and **derives currency** from the country pack (FIX-719); persists `country_code`/`region_code`/`currency` (live NOT-NULL-defaulted cols) → the property is **record-true** on create, so its compliance/legal/tax/currency follow the property, not the workspace. Shown in Review. *(Remaining: tenure capture + building link — see G44.)*
52. [x] Add Unit / Create Tenancy / Property-Compliance inherit via `usePropertyJurisdiction(property_id)`. New Planning Set persists `country_code`/`region_code` (FIX-723) → set sub-pages currency-aware. **Supplier credentials capture built end-to-end** (FIX-724): `supplier_credentials` write side — data layer + `/api/supplier/credentials` (GET/POST/DELETE, RLS-scoped) + `SupplierCredentialsCard` on Verification, jurisdiction×work-type pre-fill from the trade-certs engine.

**QA GATE** — Surfaces: each wizard. Tier: **wizard tier** (step validation, Back/Next/Save/Finish, draft persistence, success state, no duplicate submit). 
Critical: Add-Property persists `country_code`/`region_code` → property becomes record-true; currency/area derived from country; NOT-NULL jsonb rule (omit empty); deep-link prefill; created record appears in Portfolio + sets jurisdiction across child tabs (cross-section #77).

## J. Translation programme
53. [~] String extraction → `en-GB` catalogue; section-by-section JSX→`t()` (portal→email→legal→money→operator)
54. [~] **22-locale CORE vocabulary translated + wired + tested** (FIX-595: 69 keys × 22 locales; en-GB fallback for the rest). Full app-wide string extraction + legal-string professional translation = external gate.

**QA GATE** — Surfaces: every translated surface + Admin Translations. Tier: Tier 1/2 per section in the **target locale** + layout regression. 
Critical: no clipped layouts at +35% string length (#28, #59 styling); portals/emails use **recipient** locale; legal/statutory strings gated (not shipped authoritative until reviewed); missing-key report clean; completeness % accurate.

## K. Onboarding, seed & acceptance
55. [ ] Onboarding additions (workspace "where do you operate", reporting ccy/locale, regulated-activity capture; per-wizard captures)
56. [~] Seeded **mixed-jurisdiction properties** via PAT (SEED/K56): Barcelona (ES/EUR), Dubai (AE/AED, sa_lite), Berlin (DE/EUR) into the dev workspace `7d9e941b…`, record-true (`country_code`/`currency` verified in DB). *(Remaining: tenancies/compliance/suppliers/money/planning-sets for those properties — additive.)*
57. [~] **Live MCP sweep** — ran an authenticated Chrome-MCP session (dev :3001) against the seeded mixed portfolio in the JT Property Manager workspace. Verified: home dashboard + property detail render clean (0 console errors) at desktop (1440) + mobile (390). **Found & fixed two real jurisdiction bugs the sweep surfaced:** property-detail money showed £ for a EUR property → now renders €1,450/€17,400 (FIX-725); and foreign property maps were blank because geocoding was UK-locked → now geocodes globally/by-country everywhere, verified by the Dubai pin geocoding client-side into Dubai Marina (FIX-726). *(Remaining: exhaustive every-route × 8-viewport pass — the spine + the two surfaced bugs are verified.)*

**QA GATE** — Surfaces: onboarding flow + the whole app under the mixed portfolio. Tier: **full Tier 1+2+3 sweep** across every route. 
Critical: the acceptance scenario — UK workspace + ES + AE + DE properties renders each leaf with the property's jurisdiction/currency/(language), lens + grouped views correct, every figure carries source chip + disclaimer, zero console/hydration errors, RLS property+workspace safe — across all 8 viewports. Release-evidence doc per section; section scores to 100/100; final decision recorded.

---

## Status (reconciled 2026-06-28)

**Shipped — spine + engines + first-surface wiring (FIX-533…595, all in `implementation-fix-log.md`):**
- **A. Spine** — resolver + hooks + 7 primitives, property spine, provider mount, FX lib/money
  components, `buildings`/`user_notice_dismissals` migrations, seeded FX, reporting-currency
  end-to-end, lens switcher wired into Legal overview with real effect. (A11 still open.)
- **C. Legal** — possession per-case override + per-jurisdiction routes pack into the wizard
  (FIX-578); licensing, rent-control, short-let, tenancy-models, tenant-checks, tenant-fees,
  fitness engines all built + tested + wired into their first surface (Create Tenancy / Property
  Compliance / Create Job). Bilingual notice (FIX-591).
- **D. Compliance** — `useComplianceRequirements` re-keyed workspace→property (FIX-550);
  Coverage grouped-by-jurisdiction (FIX-574); trade-cert / insurance / building-safety engines
  wired to first surface.
- **E. Money/Tax** — deposits, acquisition-tax, tax, interest-relief, recurring-tax, disposal-tax
  engines built + tested + wired into one surface each (Tenancy Deposit / Cost Drivers / New
  Invoice / Example Forecast).
- **G. Cross-cutting** — tenure, agreement, agent-regulation, AML engines wired to first surface;
  AML into Settings + Contact CDD.
- **J. Translation** — 22-locale CORE vocab (69 keys) translated + wired + tested (FIX-595).

**Closed across this programme (FIX-715…723 + K56 seed + verification — 868 tests, 0 TS errors):**
- **F42 ✅ fully done** — Cost Drivers + Example Forecast (FIX-720, pack-accurate currency), Landlord Offer end-to-end currency (FIX-722), all 5 Planning-Set money sub-pages via `usePlanningSetCurrency` + `formatMoneyCompact` (FIX-723).
- **I52 ✅ (set)** — New-Planning-Set persists `country_code`/`region_code` (FIX-723). *(Supplier credentials = unbuilt feature, see below.)*
- **K56 ✅ (seed)** — ES/AE/DE properties via PAT, record-true.
- **F43 — deferred** (analytics mock-backed, source tables absent; feature dependency, not i18n).

**Earlier this session (FIX-715…719):**
- **A11 ✅** — `formatCurrencyAmount` shared core; `formatMoney`/`formatMoneyMajor` + the 5 strays
  delegate; zero value drift (drift-guard test). FIX-715.
- **H50 ✅** — `COUNTRY_PACKS` 6→45; only GB reviewed, all others generic + non-advice; 13 guard
  tests. FIX-716.
- **D31 ✅** — New-Certificate wizard sources type + `kind` from the **selected property's**
  jurisdiction. FIX-717.
- **C25 ✅** — jurisdiction-aware `service-methods.ts` engine wired into possession Record-Service
  (18 tests). FIX-718. *(V1.5 tail: rent-chase notice service log.)*
- **B13–B18 ✅** — all six **were already built** in prior sessions (jurisdiction settings tab,
  customisation + disclaimers cards, account language, admin translations, admin jurisdiction
  packs) — boxes were stale; verified + ticked. No new code.
- **I51 ✅** — Add-Property captures country + UK region, derives currency, persists the spine →
  record-true on create. FIX-719. **I52 [~]** — Unit/Tenancy/Compliance inherit via `property_id`;
  remaining = New-Planning-Set region + supplier-credentials capture.

**Genuinely-remaining (large code builds — flag-gated/additive, V1 ships GB-reviewed today):**
- **F41–F43** — planning-engine `jurisdiction` parameterisation + wire **13 profiles** ×
  Income/Cost/Compliance/Forecast tabs + multi-currency analytics. **Largest single workstream**
  (tax engines are already jurisdiction-aware; the work is the profile-tab wiring across 13×8 surfaces).
- **`[~]` persistence tails (~20)** — each engine (deposits, tax, tenure, AML, insurance, trade-cert,
  rent-control, etc.) computes correctly; the tail is a **DB column/table + a write/verify UI** to
  persist per-record overrides. Self-contained per-engine tasks.
- **I52 (partial)** — New-Planning-Set region/surcharge capture + supplier-onboarding credentials.
- **K55–K57** — onboarding spine capture; **K56** mixed UK+ES+AE+DE seed via PAT (needs live DB
  write); **K57** full live MCP sweep — every route × 8 viewports × jurisdiction states (needs a
  running dev server + Chrome MCP; a verification pass to *run*, not author).

> Each `[ ]` becomes a FIX-NNN in `qa-release/implementation-fix-log.md` when coded, ticks here,
> and produces its release-evidence doc before its QA gate can be marked passed. The i18n
> programme is **flag-gated and additive** — V1 ships GB-reviewed today; the above expands
> multi-jurisdiction depth behind that gate.
