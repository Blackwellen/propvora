# Propvora V1 — Internationalisation MASTER BUILD PLAN (enterprise grade, all 45 countries)

**Author:** Claude Code · 2026-06-25 · **Status:** PLAN approved-in-principle by founder (max scope). Awaiting "start Phase 0".
**Companions:** `v1-enterprise-i18n-audit-and-plan.md` (audit), `v1-i18n-granular-section-matrix.md` (per-leaf gaps).
**Founder directives baked in:**
1. All **45 countries** to full enterprise depth (not "research-tier" as a destination — research is only a *provenance state* until counsel sign-off).
2. **Full real translations** for every supported language (not machine-beta as the end state).
3. **Per-property jurisdiction** is the spine — *and* compliance/legal must follow **whatever you are operating on at that moment** (UAE one minute, UK the next), properly managed.
4. **Country UI packs for all 45.**
5. **Live MCP sweep last.**

---

## 0. The non-negotiable honesty rail (read first)
We build **full-depth content structures for all 45** and research each jurisdiction to the deepest citable accuracy. But statutory legal content (possession grounds, notice-period day-counts, licensing classes, deposit caps) carries a **per-jurisdiction `reviewStatus`**: `reviewed` (human legal sign-off recorded) · `researched` (citable public sources, Propvora-drafted, awaiting sign-off) · `generic` (structure only). The UI **shows full content for every jurisdiction**, but a jurisdiction only loses its "verify with a local professional" banner and earns the green "Reviewed" badge once a real solicitor sign-off row exists. This is exactly how enterprise compliance/legal SaaS (e.g. tax engines, GRC platforms) ship worldwide coverage defensibly. It lets us deliver **all 45 now** without the founder carrying liability for an AI-authored notice period. Sanctioned countries (RU/IR/KP/SY/CU/BY/VE/NI/AF/MM/YE/SD/SO/CN) stay **blocked** — we legally cannot operate there regardless.

---

## 1. THE core design — Active Jurisdiction Context (solves "UAE one minute, UK the next")

This is the keystone. Everything else hangs off it.

### 1.1 Three kinds of surface, three resolution rules
| Surface kind | Examples | Jurisdiction = | Switchable? |
|---|---|---|---|
| **Record-true** | Property detail, Tenancy, Possession case, HMO licence, Certificate, Invoice on a property, Planning set | the **property's** `country_code`/`region_code` (immutable fact of where the asset is) | No — it is what it is. Shown as a locked chip. |
| **Section-lens** | Compliance overview/coverage/reports, Legal overview, Money overview, Portfolio, Calendar, Home | an **active lens** the operator chooses (default = workspace default) **and/or** grouped-by-jurisdiction | **Yes** — header switcher + "All jurisdictions (grouped)". |
| **Context-default** | Workspace settings, Account, global create-menu before a property is chosen | workspace **default** jurisdiction | Changes the default only. |

### 1.2 The mechanism
- `JurisdictionContextProvider` (React context) exposes `useActiveJurisdiction({ propertyId?, sectionKey? })` returning the resolved `{ countryCode, region, legalPack, compliancePack, countryPack, profile, reviewStatus }`.
- **Precedence:** explicit `propertyId` ▸ active section-lens (persisted per user per section) ▸ workspace default ▸ GB-EW.
- **Section lens switcher** = a header control (flag + country name, e.g. "🇦🇪 UAE ▾ | All (grouped)"). Persists to `user_section_jurisdiction_lens` (or localStorage V1) so "show me UAE compliance" sticks until they switch back to UK. This is the literal "one minute UAE, next minute UK" management.
- **Compliance & Legal sections specifically:** default to **All jurisdictions (grouped)** so a mixed portfolio shows every regime, with the lens switcher to focus one. Individual property/cert/case records inside always render **record-true**.
- **Workspace default** is relabelled **"Default jurisdiction (new properties & workspace legal context)"** — it is the fallback and the company's own home regime, never an override of a property's real location.

### 1.3 Why this is correct (barrister + engineer)
A property in Dubai is governed by UAE/RERA law no matter where the managing workspace sits — so record-true is non-negotiable. But an operator *works across* jurisdictions in one session, so section-level views must let them switch lens or see everything grouped. This model gives both, with zero ambiguity about which law applies to which asset.

---

## 2. Data model & migrations (Phase 0 foundations)

1. **`properties.country_code` (a2) + `properties.region_code`** — guarantee exist; backfill from address/postcode; default `GB`/`EW`. *(Audit: column unconfirmed — verify via Management API, add if missing.)* Index for grouping.
2. **`workspaces.settings`** add `default_country_code`, `default_region`, `reporting_currency` (default GBP), `supported_portal_locales`.
3. **`user_section_jurisdiction_lens`** (user_id, section_key, country_code, region) — RLS self-scoped. (V1 may start localStorage; table for cross-device.)
4. **`jurisdiction_review_signoff`** (jurisdiction_code, module, review_status, reviewer, signed_at, source_citations jsonb) — the provenance ledger that flips a pack from `researched`→`reviewed`. RLS: platform-admin write, workspace read.
5. **`country_tax_rates`** (exists) — populate for all 45; add deposit-rule + acquisition-tax columns or sibling tables (`country_deposit_rules`, `country_acquisition_tax`).
6. **`translation_strings`** (locale, key, value, review_status, updated_by) + **`translation_locales`** (locale, completeness_pct, review_status) — powers the admin translations surface and runtime override over bundled catalogues.
7. **`fx_rates`** (base, quote, rate, as_of) — for reporting-currency roll-ups.

All migrations applied via Management API PAT (project `oovgfknmzjcgbilwumch`), idempotent, with RLS, reproducible from clean DB.

---

## 3. Jurisdiction content packs — full depth for all 45

### 3.1 Pack shape (one schema, every country fills it)
```
LegalFramework {
  countryCode, region, reviewStatus, authority, terminology{landlord,tenant,notice,court},
  possession: { routes:[{ id, localName, basis, grounds:[{ id, name, type, noticeDays|null, citation }], authorityBody }], disclaimer },
  sharedOccupancy: { localName, applies, classes:[{ id, name, threshold, authority, citation }], disclaimer },
  deposit: { scheme, capMonths|null, protectionRequired, prescribedInfo, citation },
  notices: { prescribedForms:[...], serviceMethods:[...] },
  sources:[url...], lastReviewed
}
ComplianceFramework { countryCode, region, requirements:[{ kind, cadence, authority, citation }], reviewStatus }
CountryUIPack { countryCode, terms{...}, propertyTypes[...], tabVisibility{...}, addressModel, currency, areaUnit, dateFormat, taxScheme, disclaimers, reviewStatus }
```
- `noticeDays` is `null` (renders "verify locally") until a `reviewed` sign-off provides the number. Full structure ships for all; numbers ship as they're signed off.

### 3.2 Content production pipeline (per country, repeatable)
1. **Research** deepest citable public statute (gov sources first) → draft pack with `sources[]` + `reviewStatus:"researched"`.
2. **Encode** into the pack module (typed data, no UI).
3. **Self-review** for internal consistency + disclaimers present.
4. **Counsel sign-off gate** → insert `jurisdiction_review_signoff` row → pack flips to `reviewed`, banner downgrades, "Reviewed ✓" badge shows.
- **Order of production (highest value first):** GB-EW (done) → GB-SCT → GB-NI → IE → EU EPC set (FR,ES,DE,IT,NL,BE,AT,PT,SE,FI,DK,CZ,HR,HU,RO,GR) → common-law (AU,NZ,CA,US) → other research (CH,JP,TH,BR,MX,AE,SA,GL) → restricted (TR,IN,ID,ZA,NG,KE,PK; generic-record + restricted banner) → banned (blocked stub).

### 3.3 Country UI packs — all 45 (founder directive)
Extend `COUNTRY_PACKS` (currently 6) to all 45: terminology, property-type taxonomy, tab visibility, address model id, currency, area unit, date format, tax scheme, disclaimers, `reviewStatus`. Banned countries get a blocked pack; restricted get restricted wording. Backed by `country_profiles` (already has locale/currency/format/tax metadata) so the pack only adds the property-domain layer.

---

## 4. Money / tax engine (Phase 3)
- **Consolidate** the 4 `formatCurrency` implementations into one `formatMoney(amountMinor, { currency, locale })` (Intl). Replace all call sites.
- **Tax engine** `computeTax({ countryCode, scheme, net, b2b })` → VAT / VAT-OSS / GST / sales-tax / reverse-charge, rates from `country_tax_rates`. Invoices render legal fields + tax per **property** jurisdiction.
- **Deposit engine** `depositRules(jurisdiction)` → scheme, cap, protection, prescribed info (UK TDP · IE RTB · ES fianza · DE Kaution 3-mo · etc.).
- **Acquisition-tax engine** for Planning: SDLT / LBTT (Scotland) / LTT (Wales) / Stamp Duty (IE) / ITP-AJD (ES) / Grunderwerbsteuer (DE) / etc.
- **Reporting currency:** roll-ups convert via `fx_rates` to workspace reporting currency, always showing the property's local amount alongside.

---

## 5. Translation program — full, real, all 22 locales (Phase 5, runs in parallel)
1. **Extraction:** convention + script scans `src/**` for user-facing strings → canonical `en-GB` catalogue (target: whole UI, thousands of keys, namespaced by section). 
2. **Replacement:** section-by-section swap of hardcoded JSX → `t()`. **Order by external exposure & legal sensitivity:** Portal copy → Email/Notification templates → Legal/Compliance disclaimers → Money → each operator section.
3. **Translate all 22 locales for real** (en-GB/US/AU/NZ/IE/CA, fr-FR/CA, de-DE, es-ES, it-IT, nl-NL, sv-SE, fi-FI, da-DK, cs-CZ, hr-HR, hu-HU, pt-BR, ja-JP, th-TH, tr-TR). Production = professional/human-reviewed translation; each string carries `review_status`. **Legal/statutory strings are translated by qualified legal translators only** and gated like the legal packs — never shipped as authoritative until reviewed.
4. **Runtime:** user locale → `WorkspaceLocaleProvider` → `t()` with DB-override over bundled catalogues. **Portals/emails use the recipient's locale**, not the operator's.
5. **Admin:** wire `(admin)/admin/global/translations` to the catalogue — missing-key report, per-locale completeness %, reviewer workflow, publish.
6. **Layout safety:** verify DE/FI/FR string expansion (≈+35%) doesn't break any component in the MCP sweep.

---

## 6. Per-section workstreams (what each delivers)
Driven centrally by §1–§5, so most sections are *wiring + content*, not rebuilds.
- **Home / Portfolio:** jurisdiction chips, per-property currency, mixed-portfolio roll-ups, Add-Property captures country → sets spine.
- **Tenancy / Money:** deposit + arrears + invoice engines per jurisdiction; reporting currency.
- **Compliance:** requirements per **property**; Coverage/Reports default to grouped-by-jurisdiction + lens switcher.
- **Legal:** possession + shared-occupancy wizards render the property-jurisdiction framework; section overview lens-aware.
- **Planning:** acquisition-tax + interest-relief + VAT engines per country; 12 profiles' Compliance/Income/Cost/Forecast/AI tabs parameterised by property country; SA/Holiday/HMO/Commercial/Social-Housing/R2R get jurisdiction-divergent handling.
- **Contacts:** country-aware address/phone/tax-ID forms (engine exists).
- **Portals / Messages:** recipient-locale UI + jurisdiction-correct rights/legal templates.
- **Calendar:** Intl date formatting + jurisdiction statutory date calculators.
- **Automations:** translated builder + jurisdiction-aware compliance/legal trigger templates; Node-Library completeness audit (separate task you flagged).

---

## 7. Phasing & sequencing
| Phase | Delivers | Gate |
|---|---|---|
| **0 Foundations** | property country/region columns + backfill; `JurisdictionContextProvider` + `useActiveJurisdiction`; section-lens switcher; consolidated `formatMoney`; reporting currency + FX scaffold; rename workspace setting | tsc+build; unit tests on resolver precedence |
| **1 Legal frameworks** | `LegalFramework` packs (all 45, full structure; GB-EW/SCT/NI/IE researched-deep first); possession + HMO wizards render property-jurisdiction pack; provenance/sign-off ledger + badges | per-jurisdiction render tests |
| **2 Compliance** | property-scoped requirements; grouped Coverage/Reports; cert wizards re-keyed to property | mixed-portfolio compliance test |
| **3 Money/Tax** | tax + deposit + acquisition-tax engines; invoice/deposit/arrears localized; reporting roll-ups | tax calc unit tests per scheme |
| **4 Planning** | per-country tax/forecast engines; profile tabs parameterised | forecast calc tests |
| **5 Country UI packs (all 45)** | `COUNTRY_PACKS` complete for 45; terms/types/tabs/disclaimers | pack snapshot tests |
| **6 Translation (all 22)** | extraction + replacement + real translations + admin tooling | completeness + layout tests |
| **7 Live MCP sweep** | full pages/sections/detail/wizards × 8 viewports × jurisdictions × locales; **mixed-portfolio acceptance** | 100/100 per surface |

Phases 1–6 can partially parallelise; **0 blocks all**; **7 is last** (founder directive).

---

## 8. The 100/100 MCP sweep (Phase 7, last)
Per `v1-enterprise-i18n-audit-and-plan §8`: every route × 8 viewports × jurisdiction states (GB-EW/SCT/NI, IE, ES, AE, ZA-restricted, RU-banned, **mixed portfolio**) × locale states (en-GB/fr/de/es + one more). Assert per surface: correct record-true vs lens jurisdiction, correct currency/format, translated chrome, no console/hydration errors, no clipped layouts (DE/FI expansion), all elements route, RLS property+workspace safe. **Acceptance test:** UK workspace + 1 ES + 1 AE property renders each leaf with the property's jurisdiction/currency/(language) correctly, lens switcher works, grouped views correct — across all 8 viewports, zero errors. Ports claimed in `.claude/port-registry.md`.

---

## 9. Governance, provenance & legal sign-off
- `jurisdiction_review_signoff` is the audit trail: which solicitor/firm reviewed which jurisdiction+module, when, with citations. Until a row exists, the pack shows "researched — verify locally".
- Translation `review_status` mirrors it for languages.
- Founder/legal counsel owns the sign-off gate; engineering ships the structure + researched content; the badge flips on sign-off. **This is the mechanism that makes "all 45 enterprise-grade" both real and defensible.**

---

## 10b. Operator override & exemption customization (founder directive)

Legal defaults are **defaults, not locks.** Real cases carry contractual variations, statutory exemptions, transitional rules and council/region quirks. The operator must be able to change them — safely and auditably.

**Two layers of override:**
1. **Per-case override (in the wizard).** On the possession/notice step, the resolved notice period (e.g. "Scotland — 84 days") is shown as a default; the operator can **override the value** and must add a **reason / exemption note** (free text + optional exemption type, e.g. "contractual 6-month notice", "pre-action protocol variation", "transitional RRA case"). The draft then shows **"Operator-overridden — default was X (reason: …)"**, and an `audit_logs` entry records who/what/why. The override never silently replaces the statutory citation — both are shown.
2. **Per-workspace jurisdiction customization (settings).** Extends the existing `workspace_legal_modules` custom-pack layer (FIX-478..481): a workspace can set its **own default notice periods / grounds labels / extra conditions** for a jurisdiction it operates in (e.g. an agent who always serves longer notice), or record a **local exemption** (a specific council's additional licensing rule). These are clearly badged **"workspace-customised — not Propvora-reviewed"** and never upgrade a `researched` jurisdiction to `reviewed`.

**Guardrails:** overrides are bounded where the statute sets a **minimum** (e.g. you may lengthen but a warning shows if you go below a known statutory minimum — "below the X-day statutory minimum for this ground; verify with your solicitor"). The system warns, does not hard-block (the operator may know an exemption the system doesn't) — but it logs the sub-minimum choice prominently. This matches how a solicitor actually works: defaults + professional judgement + a record of why.

**Data:** `possession_cases` already stores `notice_period_days` + `notes`; add `notice_period_overridden` (bool) + `notice_override_reason` (text) + `notice_override_exemption` (text). `workspace_legal_modules` already supports per-jurisdiction overrides; extend its payload for notice-period defaults.

---

## 11. What I need to start
Approve **Phase 0** (the per-property jurisdiction spine + active-jurisdiction-context + money formatter consolidation). It's self-contained, reversible, unblocks everything, and changes no legal content. I'll deliver it with tsc+build green and resolver unit tests, then move to Phase 1.

> Say **"start Phase 0"** and I begin. I'll work phase-by-phase, building real code each turn (no stubs), updating `qa-release/` + `release-gated/` evidence per phase, and running the full MCP sweep at Phase 7.
