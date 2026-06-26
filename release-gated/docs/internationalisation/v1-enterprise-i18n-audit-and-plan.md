# Propvora V1 — Enterprise Internationalisation Audit & Build Plan

**Author:** Claude Code (audit grounded in live codebase, 2026-06-25)
**Status:** AUDIT + PLAN — no implementation yet. Awaiting founder sign-off on scope decisions in §9.
**Lens:** translator · barrister/house-solicitor · tax & privacy · product engineer · marketing.
**Scope:** all 45 supported countries · every section in the V1 app map · 4 i18n dimensions (Language, Jurisdiction/Legal, Compliance/Frameworks, Money/Tax/Format) · the per-property vs per-workspace architecture · the 100/100 live MCP sweep.

> **One-line verdict:** Propvora has a *real, well-designed i18n skeleton* (country profiles, country packs, compliance/legal jurisdiction resolvers, a dependency-free `t()` layer) but **three load-bearing gaps make it not enterprise-ready for non-UK or mixed-portfolio operators**: (1) **UI translation is ~0% wired** (scaffold only), (2) **legal/compliance/tax resolve from the *workspace* country, not the *property* country** — so a UK workspace with an EU/UAE property runs UK law on a foreign asset, and (3) **localized legal frameworks exist for England & Wales only**. This document is the map to close all three to enterprise grade.

---

## 1. How internationalisation is wired *today* (grounded findings)

| Subsystem | File(s) | What exists | Real coverage |
|---|---|---|---|
| **Locale registry** | `src/lib/i18n/config.ts` | 22 BCP-47 locales declared; `en-GB` default; native `Intl` only (no i18n lib) | Registry complete |
| **Message/translation layer** | `src/lib/i18n/messages.ts` + `locales/*.json` | Custom `t(key, params)` with 3-step fallback (locale → en-GB → key) | **5 catalogues only** (en-GB **69 keys**, en-US/fr-FR/de-DE/es-ES tiny). **12 declared locales have NO catalogue** → silently fall back to en-GB. `t()` is called in **2 of 2210** UI files. **≈0% of the UI is actually translated.** |
| **Country profiles** | `src/lib/i18n/country-profiles.ts` | **45 countries** with locale, currency, measurement, date format, tax scheme/rate, privacy regime, withdrawal rules, review tier, disclaimer | Metadata good; **legal/possession depth absent** |
| **Country UI packs** | `src/lib/i18n/country-packs.ts` | `CountryPack`: compliance categories, property types, terminology, tab visibility, AI clauses | **Only 6 packs**: GB, US, AU, CA, DE, AE. **39 countries fall back.** |
| **Compliance frameworks** | `src/lib/compliance/requirements.ts` | Jurisdiction-driven requirement sets | **Reviewed: GB, IE, AU, NZ, US, CA.** Rest → `localisedGeneric()` (research-only). |
| **Legal frameworks** | `src/lib/legal/jurisdiction.ts` | Possession / HMO / EPC / RRA module applicability + labels + disclaimers | **Reviewed: England & Wales only.** Scotland/NI: HMO+EPC "applies" but no tooling. All else generic/blocked. |
| **Legal wizards** | `legal/possession/new/*`, `legal/hmo-licences/new` | Section 8/21 possession; HMO register | **England & Wales statute only.** Gated out elsewhere. |
| **Jurisdiction resolution** | `src/hooks/useWorkspaceJurisdiction.ts`, `useLegalJurisdiction.ts`, `useComplianceRequirements` | Reads **workspace** `settings.countryCode` (+ `region`) | ⚠️ **Workspace-scoped, not property-scoped.** |
| **Per-property jurisdiction** | `src/components/jurisdiction/PropertyAddressJurisdiction.tsx` | Renders property-country address form + posture banner; persists country/region to property | **Concept exists but is an island** — not read by Legal, Compliance, Money, Planning or any wizard. Property `country_code`/`region_code` column existence is **unconfirmed** (component is written "tolerant of any column the live schema lacks"). |
| **Intl DB** | `supabase/migrations/20260617080000_country_packs_intl.sql`, `…160000_international_tax.sql` | `country_profiles`, `country_tax_rates`, country compliance/property-type tables | Tables exist; not the binding constraint |
| **Money/format** | `src/lib/utils.ts`, `src/lib/international/countries.ts`, `src/lib/marketplace/money.ts`, `src/lib/planning/calculations.ts` | `formatCurrency` exists in **4 places** | ⚠️ Multiple formatters; not all read workspace/property locale; risk of GBP hardcoding |

**Bottom line:** the *plumbing* is unusually mature for a V1; the *content and the binding* are not. This is good news — most of the work is wiring + content packs, not greenfield architecture.

---

## 2. The four dimensions of "internationalisation" (so we don't conflate them)

Enterprise i18n is **four independent axes**. A property can need a different value on each.

1. **Language (translation/localisation of UI strings).** What the operator *reads*. Driven by the **user's** locale preference. *Today: ~0% wired.*
2. **Jurisdiction / Legal.** Which statute governs possession, licensing, deposits, notices. Driven by the **property's** country/region. *Today: workspace-only, E&W-deep only.*
3. **Compliance / Frameworks.** Which safety certificates, registrations, energy rules apply. Driven by the **property's** country/region. *Today: workspace-only; 6 reviewed jurisdictions.*
4. **Money / Tax / Format.** Currency, VAT/GST, date/number/area units, address shape, phone. Driven by a **mix**: display currency = property's local currency *and* a workspace reporting currency; tax = property jurisdiction; number/date format = user locale. *Today: partial, multi-source.*

> **The single most important architectural decision (see §4): axes 2–3 and the money/tax part of axis 4 must bind to the PROPERTY, not the workspace.** Axis 1 binds to the user. This is the crux of the founder's scenario: *"we might be set to UK jurisdiction but in Portfolio we have properties in the EU or UAE."*

---

## 3. The 45-country reality (what each tier needs)

Source of truth: `country-profiles.ts`. Tiers below drive how much we build per country.

### Tier A — Reviewed / deep (build full localized frameworks)
- **GB-England&Wales** (done), **GB-Scotland**, **GB-Northern Ireland**, **Ireland (IE)**.
- *Rationale:* highest-confidence public statute, most relevant to a UK PropTech's first expansion, citable government sources (gov.scot, nidirect/communities-ni, rtb.ie).

### Tier B — Structured / research (local names + authority + "verify locally", no asserted day-counts)
- EU EPC states: **FR, ES, DE, IT, NL, BE, AT, PT, SE, FI, DK, CZ, HR, HU, RO, GR**
- Common-law: **AU, NZ, CA, US**
- Other research: **CH, JP, TH, BR, MX, AE, SA, GL**

### Tier C — Restricted (generic record-keeping only; no statutory tooling; clear restricted banner)
- **TR, IN, ID, ZA, NG, KE, PK**

### Tier D — Banned/sanctioned (blocked entirely; no tooling, no onboarding)
- **RU, IR, KP, SY, CU, BY, VE, NI(Nicaragua), AF, MM, YE, SD, SO, CN**

**Per-country deliverable matrix** (✅ build / 🟡 structured-generic / ⛔ blocked):

| Capability | Tier A | Tier B | Tier C | Tier D |
|---|---|---|---|---|
| UI translation catalogue (language) | ✅ (en-GB / en-IE; +local) | ✅ where a locale catalogue is shipped | ✅ (English fallback acceptable) | n/a |
| Possession/eviction framework + wizard | ✅ real grounds/notice | 🟡 process name + authority + verify-locally | 🟡 generic record only | ⛔ |
| Shared-occupancy / HMO / rental-registration framework + wizard | ✅ real classes | 🟡 local name + authority | 🟡 generic record | ⛔ |
| Compliance requirement set | ✅ reviewed | 🟡 generic (some reviewed already: AU/NZ/US/CA) | 🟡 generic | ⛔ |
| Money/tax/format | ✅ | ✅ (profiles already carry tax/format) | ✅ | ⛔ |
| Marketing/legal disclaimer wording | ✅ jurisdiction-correct | ✅ research-only wording | ✅ restricted wording | ⛔ blocked wording |

> **Barrister's caveat (non-negotiable):** we assert specific statutory grounds and notice-period **numbers only for Tier A**, each carrying "this is not legal advice — verify with a qualified [jurisdiction] solicitor". Tiers B/C get **process names, the competent court/tribunal/authority, and a structured generic flow** but **never fabricated day-counts**. Shipping a wrong notice period is what gets a notice struck out — we do not do it.

---

## 4. THE architecture decision — per-property jurisdiction resolution

**Problem (founder's exact scenario):** Workspace country = GB. A property is in Spain. Today the Legal/Compliance/Money tooling reads the *workspace* country (`useWorkspaceJurisdiction`) → it would offer **English Section 8 possession** and **UK gas/EICR compliance** on a **Spanish** asset. That is wrong and unsafe.

**Decision: introduce a single `resolveJurisdiction(context)` resolver with a clear precedence chain, and bind legal/compliance/tax to the PROPERTY.**

```
Effective jurisdiction for a record =
  1. the record's own property's country/region        (property-scoped truth)
  2. else the parent property's country/region
  3. else the workspace default country/region          (settings.countryCode)
  4. else GB (system default)
Language (UI) is independent:
  user.locale → workspace.defaultLocale → en-GB
Reporting currency (roll-ups) = workspace.reportingCurrency (default GBP),
  with each property's local currency shown on its own records.
```

**Concrete changes this implies (the heart of the build):**
1. **Property schema:** guarantee `properties.country_code` (ISO-3166-1 a2) + `properties.region_code` (e.g. `EW`/`SCT`/`NI`) columns exist + backfill from address; default `GB`/`EW`. *(Audit could not confirm the column exists live — must verify/add.)*
2. **A `usePropertyJurisdiction(propertyId)` hook** mirroring `useWorkspaceJurisdiction` but property-first.
3. **Re-point Legal & Compliance** off `useWorkspaceJurisdiction` → a jurisdiction context that is property-aware wherever a property is in scope (property detail, tenancy, possession case, HMO licence, certificate, planning set).
4. **Mixed-portfolio surfaces** (Portfolio list, Compliance coverage, Money roll-ups, Calendar) must show **per-row jurisdiction** and aggregate correctly across currencies/regimes (e.g. group compliance by property jurisdiction; convert money to reporting currency with FX + show local).
5. **Workspace setting becomes a *default*, not a *truth*** — relabel "Jurisdiction" → "Default jurisdiction for new properties / workspace-level legal context".

This is the largest single work item and unblocks every section below.

---

## 5. Per-section gap analysis (the full V1 app map)

For each section: **L**=Language/translation, **J**=Jurisdiction/Legal, **C**=Compliance, **M**=Money/format. ✅ ok · 🟡 partial · ❌ gap.

### Home
- L ❌ all dashboard copy/labels hardcoded EN. J ❌ no per-property jurisdiction surfacing in snapshots. C 🟡 reads workspace compliance. M 🟡 KPIs use one formatter.
- **Need:** translate dashboard chrome; jurisdiction chips on property snapshot cards; multi-currency KPI roll-up (reporting currency + local).

### Portfolio (Properties, Units, Tenancies; detail tabs incl. **HMO Details, Compliance, Finances, Map, Deposit**)
- L ❌. J ❌ **the per-property jurisdiction problem lives here** — property detail must declare and drive its own country (the `Address & Jurisdiction` tab exists but is an island). C ❌ compliance tab on a foreign property must show that country's certs. M 🟡 tenancy rent/deposit must use property's local currency; **deposit rules are jurisdiction-specific** (UK TDP/prescribed info vs Spain *fianza* vs Germany *Kaution* 3-month cap).
- **Need:** wire property `country_code`/`region_code` as the spine; tenancy deposit logic per jurisdiction; HMO tab → shared-occupancy framework per country; map labels localized.

### Work (Tasks, Jobs, PPM, Suppliers, Complaints, Reports)
- L ❌. J 🟡 mostly jurisdiction-neutral. C 🟡 PPM cadences differ by jurisdiction (gas annual UK vs biennial AU). M 🟡 supplier invoices/job costs need local currency + tax.
- **Need:** translate; PPM templates per jurisdiction; supplier tax IDs (VAT/ABN/EIN) by country; money in property currency.

### Planning (12 profiles × tabs incl. **Compliance, Income Model, Cost Drivers, Risks, AI Questions**)
- L ❌. J 🟡. C ❌ each profile's **Compliance** tab is UK-shaped; **Income Model/Cost Drivers** assume GBP + UK tax (SDLT, Section 24, VAT). M ❌ forecasts hardcode UK tax & currency.
- **Need:** profile compliance per jurisdiction; income/cost/tax engines parameterised by property country (SDLT vs ITP/AJD vs Grunderwerbsteuer; mortgage-interest relief rules; VAT on SA); AI-questions localized.

### Contacts (People, Organisations; portal access; detail tabs)
- L ❌. J 🟡. C 🟡. M 🟡 org tax IDs/addresses by country.
- **Need:** address/phone/tax-ID forms per country (engine exists in `@/components/intl`); translate.

### Portals (Landlord/Supplier/Tenant/Applicant/Accountant/Solicitor/Generic)
- L ❌ **portal-facing copy is read by external parties** — highest-value translation target (a Spanish tenant should read Spanish). J 🟡 tenant rights wording per jurisdiction. M 🟡 rent/deposit display currency.
- **Need:** portal locale = recipient's locale; jurisdiction-correct tenant-rights notices.

### Money (Income, Expenses, Invoices, Bills, Arrears, Deposits, Escrow, Holds, Commissions, Payouts, Refunds, Disputes, Rent Chase)
- L ❌. J ❌ **deposit/escrow/arrears rules are jurisdiction-specific** (deposit caps, protection schemes, pre-action protocols). C n/a. M ❌ invoices need local **tax scheme** (VAT/GST/sales tax/reverse charge), currency, number format, legal invoice fields per country.
- **Need:** invoice tax engine per country (rates in `country_tax_rates`); deposit-scheme logic per jurisdiction; reporting-currency roll-ups + FX; localized money/date formatting everywhere (consolidate the 4 `formatCurrency`s into one locale-aware util).

### Calendar (Views, Schedule, Timeline, Events, Reminders)
- L ❌ month/day names, event-type labels. J 🟡 statutory key-dates differ (notice expiry maths per jurisdiction). M n/a.
- **Need:** `Intl.DateTimeFormat` localized; jurisdiction-aware statutory date calculators.

### Compliance (Certificates, Inspections, Documents, Evidence, Coverage, Supplier Docs, Reports)
- L ❌. J/C ❌ **must follow property jurisdiction** — reviewed sets exist for GB/IE/AU/NZ/US/CA; coverage/reports must group by property jurisdiction in a mixed portfolio. M n/a.
- **Need:** property-scoped requirements; mixed-portfolio coverage grouping; certificate wizards already jurisdiction-driven (good) but keyed on workspace → re-point to property.

### Legal (Possession, HMO Licences, EPC Advisory, RRA 2026; wizards New Possession Case, Register HMO Licence)
- L ❌. J ❌ **deepest gap** — E&W only; needs Scotland/NI/IE frameworks (Tier A) + structured packs (Tier B). C n/a. M n/a.
- **Need:** jurisdiction-driven possession + shared-occupancy frameworks (data packs) consumed by the wizards; gate on **property** jurisdiction not workspace; EPC advisory already EU-aware; RRA hidden non-E&W (good).

### Messages (Inbox, Email Templates, Chat bubble, portal messages, Notifications)
- L ❌ **email/notification templates are external-facing** — translate per recipient locale. J 🟡 legal notice templates per jurisdiction. M n/a.
- **Need:** template locale = recipient; jurisdiction-correct legal templates.

### Automations (Recipes, Canvas, Nodes, Integrations, Webhooks, AI Builder, Usage)
- L ❌ node/recipe labels. J 🟡 jurisdiction-conditional triggers (e.g. "gas cert expiring" cadence differs). M 🟡.
- **Need:** translate builder chrome; jurisdiction-aware compliance/legal trigger templates.

### Admin / Settings (cross-cutting)
- **Need:** a real **Translations admin** (the `(admin)/admin/global/translations` route exists — wire it to the catalogue pipeline); per-workspace default jurisdiction + reporting currency + supported portal locales; country pack management for all 45.

---

## 6. Language / translation pipeline (axis 1 — currently ~0%)

This is a discrete, large, mechanical workstream. Recommended approach (keeps the existing dependency-free `t()`):

1. **Key extraction:** introduce a `t()` usage convention + an extraction script that scans `src/**` for user-facing strings and emits a canonical `en-GB.json` (target: the full UI, thousands of keys, sectioned by area). Replace hardcoded JSX strings section-by-section (start with portal + email + Legal/Compliance disclaimers — the externally-read, legally-sensitive copy first).
2. **Catalogue completion:** generate the **12 missing locale catalogues** (it-IT, nl-NL, sv-SE, fi-FI, da-DK, cs-CZ, hr-HR, hu-HU, pt-BR, ja-JP, th-TH, tr-TR) + flesh out fr/de/es. Machine-translate as a base, then mark `reviewed:false` per locale until human-reviewed (mirror the legal review-tier pattern). **Legal/compliance strings are NOT machine-translated for production** — they stay English + jurisdiction disclaimer until professionally translated.
3. **Runtime binding:** user locale → `WorkspaceLocaleProvider` (exists) → `t()`. Portals/emails override to the **recipient's** locale.
4. **Formatters:** consolidate the 4 `formatCurrency` implementations into one locale+currency-aware util; route all money/date/number/area through `Intl`.
5. **Admin tooling:** the global translations page becomes the review surface (missing-key report, per-locale completeness %, reviewed toggle).

**Realistic V1 stance:** ship **English UI fully keyed** + **reviewed catalogues for the languages we can stand behind** (en variants, fr-FR, de-DE, es-ES) + **machine base for the rest behind a "beta translation" flag**, with **portal/email/legal copy prioritised**. Full 22-locale human-reviewed coverage is a staged programme, not a single drop.

---

## 7. Phased build plan to enterprise grade

> Each phase is independently shippable and ends with `tsc` + `npm run build` + a targeted MCP sweep. Ordered by unblocking power.

**Phase 0 — Foundations (unblocks everything)**
- Confirm/add `properties.country_code` + `region_code`; backfill from address; default GB/EW.
- Build `resolveJurisdiction(context)` + `usePropertyJurisdiction()`; consolidate `formatCurrency` → one locale-aware util; add `reportingCurrency` + FX scaffolding.
- Relabel workspace "Jurisdiction" → "Default jurisdiction".

**Phase 1 — Legal frameworks (Tier A) + property-scoped gating**
- `src/lib/legal/possession-framework.ts` + `hmo-framework.ts` (data packs): E&W (refactor existing into pack), Scotland, Northern Ireland, Ireland — researched, citable, reviewed-tier.
- Re-point possession + HMO wizards to render the **property-jurisdiction** framework (routes, grounds, notice periods, licence classes, authority, disclaimer).
- Tier B structured-generic packs (process name + authority + verify-locally) so non-Tier-A non-banned countries get a working generic flow.

**Phase 2 — Compliance property-scoping + frameworks**
- Re-point compliance requirements to property jurisdiction; mixed-portfolio coverage grouping; extend reviewed sets where defensible.

**Phase 3 — Money/tax**
- Invoice tax engine per country (rates from `country_tax_rates`, reverse-charge, sales tax); deposit-scheme logic per jurisdiction; reporting-currency roll-ups + per-property local display.

**Phase 4 — Planning engines**
- Parameterise income/cost/tax/forecast engines by property country (acquisition tax, interest relief, VAT-on-SA); localize profile compliance + AI questions.

**Phase 5 — Language pipeline**
- Key-extraction + section-by-section replacement (portal/email/legal first); complete catalogues; admin review tooling; "beta translation" flag for machine locales.

**Phase 6 — Country packs to 45**
- Extend `COUNTRY_PACKS` (currently 6) to all non-banned countries (terms, property types, tab visibility, disclaimers); restricted/banned wording.

**Phase 7 — Enterprise hardening + full MCP sweep (§8)**

---

## 8. The 100/100 live MCP sweep plan (pages · sections · detail pages · wizards)

The sweep is **not** wizard-only. Matrix dimensions:

- **Surfaces:** every route in `qa-release/route-registry.md` — section overviews, sub-tabs, sub-sub-tabs, **item/detail pages and their sub-tabs**, and every wizard (the full §0 app map).
- **Viewports (8):** 1536×960, 1366×768, 1280×720, 1024×768, 768×1024, 430×932, 390×844, 375×812.
- **Jurisdiction states:** workspace GB-EW · GB-Scotland · GB-NI · IE · an EU country (e.g. ES) · UAE · a restricted (e.g. ZA) · a banned (e.g. RU) — **plus a mixed portfolio** (UK workspace with one ES and one AE property) to prove property-scoped resolution.
- **Locale states:** en-GB · fr-FR · de-DE · es-ES (+ one machine-beta) — verify `t()` binding, no layout break from longer strings (DE/FR expansion), RTL note for AR if ever added.
- **Per surface, assert:** correct jurisdiction content, correct currency/format, translated chrome, no console/hydration errors, no clipped layouts, all interactive elements route, empty/loading/error states, RLS still property+workspace safe.

**Pass bar:** 100/100 per surface per the existing QA matrix scoring, logged in `qa-release/` + screenshots in `release-gated/docs/internationalisation/screenshots/`. Mixed-portfolio is the acceptance test for §4.

**Operational note (AGENTS.md):** claim dev + Chrome MCP ports in `.claude/port-registry.md` before starting; this is a long multi-session sweep.

---

## 9. Decisions needed from the founder before building

1. **Tier A depth confirm:** GB-EW + Scotland + NI + Ireland as the reviewed, day-count jurisdictions for V1? (Recommended — defensible + relevant.)
2. **Tier B stance:** structured-generic (names + authority + "verify locally", **no asserted day-counts**) — confirm we do **not** ship fabricated notice numbers for 39 countries. (Strongly recommended on liability grounds.)
3. **Per-property jurisdiction (§4):** approve making property the jurisdiction spine (workspace = default only). This is the big refactor; everything downstream depends on it.
4. **Translation V1 line:** English fully keyed + reviewed fr/de/es + machine-beta for the rest behind a flag, portal/email/legal copy first? Or hold translation to a later programme and ship jurisdiction/money i18n first?
5. **Sequencing:** Phases 0→4 (jurisdiction/money/legal/compliance — the "law & money" enterprise core) **before** Phase 5 (language)? (Recommended: law & money correctness is the enterprise blocker; language is additive.)
6. **Professional legal/translation review budget:** which jurisdictions/languages get human sign-off for V1 vs ship as "reviewed:false / research-only".

---

## 10. Risk & honesty register (barrister lens)

- **Do not** present machine-translated or unreviewed legal content as authoritative. Every non-Tier-A legal surface carries the research-only disclaimer already in `jurisdiction.ts`.
- **Do not** assert notice-period numbers outside Tier A.
- **Do** keep banned/sanctioned countries hard-blocked (sanctions exposure).
- **Do** keep "this is not legal, tax or financial advice" on every jurisdiction surface — including GB (already done).
- **Property-scoped resolution is a correctness AND a liability fix** — running UK law on a foreign asset is the current worst-case; §4 closes it.

---

## Appendix — confirmed file anchors
- Locale/messages: `src/lib/i18n/{config,messages}.ts`, `src/lib/i18n/locales/*.json`
- Country data: `src/lib/i18n/{country-profiles,country-packs}.ts`, `src/lib/international/countries.ts`
- Jurisdiction resolvers: `src/hooks/{useWorkspaceJurisdiction,useLegalJurisdiction}.ts`, `src/lib/legal/jurisdiction.ts`, `src/lib/compliance/requirements.ts`
- Per-property concept (island): `src/components/jurisdiction/PropertyAddressJurisdiction.tsx`
- Legal wizards: `src/app/(app)/app/legal/possession/new/*`, `src/app/(app)/app/legal/hmo-licences/new/page.tsx`
- Intl DB: `supabase/migrations/20260617080000_country_packs_intl.sql`, `…20260616160000_international_tax.sql`
- Translations admin (to wire): `src/app/(admin)/admin/global/translations`
