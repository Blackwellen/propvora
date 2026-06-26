# Propvora i18n — INTEGRATION & IMPLEMENTATION PLAN (where everything plugs in)

**Compiled:** 2026-06-25 · **Status:** integration map — the "how & where" companion to `v1-i18n-MASTER-BUILD-PLAN.md` (phasing) and `v1-i18n-granular-section-matrix.md` (per-leaf gaps).
**Posture:** PM platform, **not** a legal/tax advisor. Every sourced value renders with an **edit affordance + source chip + permanent, dismissible disclaimer** (see `LIABILITY-disclaimer-and-customizability-plan.md`). This supersedes the old `reviewed`/counsel-signoff gate — there is **one `sourced` tier** and the operator owns the numbers.

---

## 0. What already exists (don't rebuild — wire into it)

Grounded from the codebase, not assumed:

| Concern | Already in repo | Implication |
|---|---|---|
| Money formatter | **`src/lib/i18n` already exports `formatMoney`/`formatMoneyMajor`/`formatDate`** (Intl-based, en-GB default) | The canonical formatter **exists**. Phase-0 money work = **replace the 3 other `formatCurrency` call-sites** to use this, not write a new one. |
| Locale runtime | `src/lib/i18n/context.tsx`, `WorkspaceLocaleProvider.tsx`, `locale.ts`, `config.ts` (`SUPPORTED_LOCALES`, `LOCALE_META`) | `JurisdictionContextProvider` mounts **alongside** the locale provider, not replacing it. |
| Translation catalogue | `messages.ts` + `t()`/`useT()` (only ~69 keys, ~0% wired) | Pipeline = grow the catalogue + swap JSX, infra already there. |
| Country data | `country-profiles.ts` (all 45: locale/currency/format/tax/area), `country-packs.ts` (`COUNTRY_PACKS`, only 6) | Phase-5 = extend `COUNTRY_PACKS` 6→45; profiles already all-45. |
| Country-aware tabs | `tab-config.ts`, `use-country-tabs.ts` | Section tab visibility per country is **already a mechanism** — feed it the active jurisdiction. |
| Address/phone/tax-ID | `components/intl/AddressForm.tsx`, `PhoneInput.tsx`, `address-models.ts`, `phone-format.ts` | Contacts/Add-Property wizards consume these — no new form engine. |
| Country gating UI | `components/intl/CountryGatesBadge.tsx`, `CountryPackWarningBanner.tsx` | The **disclaimer/restricted banner** extends these, not a new component family. |
| Compliance packs | `src/lib/compliance/requirements.ts` (reviewed GB/IE/AU/NZ/US/CA) | Re-key the source from **workspace → property**; extend to EU. |
| Legal packs | `src/lib/legal/jurisdiction.ts` + `LegalJurisdictionGate` | Possession/HMO wizards already gate; feed them property jurisdiction + sourced packs. |
| Per-workspace legal overrides | `workspace_legal_modules` (FIX-478..481) | The **customizability layer** extends this table's payload — override store exists. |

**Net:** this is ~5 central integrations + content packs + a translation pass, **not** 700 page edits.

---

## 1. The two central integration points (everything hangs off these)

### A. `JurisdictionContextProvider` + `useActiveJurisdiction()`
- **Where it mounts:** in `AppShell` (operator) and `PortalPageShell` (portals), wrapping below `WorkspaceLocaleProvider`. New file: `src/lib/jurisdiction/context.tsx`.
- **What it resolves** (precedence): explicit `propertyId` ▸ active section-lens ▸ workspace default ▸ `GB-EW`.
- **Two hooks:**
  - `usePropertyJurisdiction(propertyId)` → **record-true**, locked chip (property detail, tenancy, case, cert, invoice-on-property, planning set).
  - `useActiveJurisdiction({ sectionKey })` → **section-lens**, switchable header control (Compliance/Legal/Money/Portfolio/Home/Calendar overviews).
- **Returns:** `{ countryCode, region, legalPack, compliancePack, countryPack, profile }` — packs come from `resolveValue()` (below).

### B. `resolveValue(dimension, jurisdiction, context)` — the override chain
- New file: `src/lib/jurisdiction/resolve.ts`. Walks **per-case ▸ per-property ▸ per-workspace ▸ Propvora sourced default ▸ blank** and returns `{ value, source, isOverridden, overrideReason }`.
- Every consuming surface renders the value with a shared **`<SourcedValue>`** wrapper: the number + a **source chip** (cited origin) + an **edit pencil** + the **dismissible disclaimer** trigger. New file: `src/components/jurisdiction/SourcedValue.tsx`.
- Backed by typed packs (one per dimension) built from the `legal-frameworks/`, `tax-frameworks/`, `compliance-frameworks/` sourced docs.

These two files + `SourcedValue` + the disclaimer component are the **entire surface area** most sections touch.

---

## 2. SETTINGS — where the operator configures all of this (explicit founder ask)

Settings is the control plane. Five surfaces, mapped to real/known routes (`/property-manager/workspace-settings`, `/property-manager/settings`, `/property-manager/account-settings`, `(admin)/admin/global`):

| Settings surface | Route | What it controls | New/extend |
|---|---|---|---|
| **Workspace ▸ Region & Jurisdiction** | `workspace-settings` (new tab) | **Default jurisdiction** (relabelled "Default jurisdiction — new properties & workspace legal context"), **reporting currency**, default locale, supported portal locales, date/area-unit defaults | NEW tab; writes `workspaces.settings.default_country_code/region/reporting_currency/supported_portal_locales` |
| **Workspace ▸ Jurisdiction Customisation** | `workspace-settings` (new tab) | Per-jurisdiction **operator overrides**: custom notice periods, deposit caps, extra licensing conditions, recorded exemptions — each badged "workspace-customised, not Propvora-sourced" | NEW; extends `workspace_legal_modules` payload |
| **Workspace ▸ Disclaimers & Notices** | `workspace-settings` (new tab) | View the standing legal disclaimer; manage whether dismissed pop-ups stay dismissed; (admin) edit the workspace addendum text | NEW; reads `user_notice_dismissals` |
| **Account ▸ Language & Region** | `account-settings` | **Per-user locale** (overrides workspace default for that user's own chrome) | extend existing account prefs |
| **Admin ▸ Global ▸ Translations** | `(admin)/admin/global/translations` | Catalogue management: per-locale completeness %, missing-key report, reviewer/publish workflow | wire existing stub to `translation_strings`/`translation_locales` |
| **Admin ▸ Global ▸ Jurisdiction Packs** | `(admin)/admin/global` (new) | Read-only view of every sourced pack + its citations + last-compiled date (provenance transparency) | NEW; reads the typed packs |

**Settings is also where the per-property jurisdiction is *initially set*** — but the authoritative capture is the **Add-Property wizard** (Step 1 country/region), since jurisdiction is a property fact, not a setting. Settings only sets the **default** applied to new properties.

---

## 3. Sections requiring implementation (the register the founder asked for)

Ordered by **risk × external exposure**. Each row = the integration point + the concrete change. "Central" means it's cleared by mounting §1, not per-page work.

### Tier 1 — must ship correct (legal/money exposure)
| Section / leaf | Integration point | Concrete change |
|---|---|---|
| **Legal ▸ Possession wizard** | `usePropertyJurisdiction` + possession pack | Render property-jurisdiction routes/grounds/notice via `resolveValue`; per-case override + reason already designed (master §10b); arrears currency (done FIX-504). |
| **Legal ▸ HMO/shared-occupancy wizard** | `usePropertyJurisdiction` + licensing pack | Render property's shared-occupancy classes/authority; "no licensing in this jurisdiction" empty-state. |
| **Tenancy ▸ Deposit / Money ▸ Deposits** | `depositRules(jurisdiction)` pack | Scheme/cap/protection per property (UK TDP · IE RTB · ES fianza · DE Kaution 3mo); local currency; `SourcedValue` on the cap. |
| **Money ▸ Invoices / New Invoice** | `computeTax()` + property jurisdiction | Legal invoice fields + VAT/GST/sales-tax/reverse-charge per country; currency; number format. |
| **Money ▸ Arrears / Rent Chase** | possession/pre-action pack | Pre-action protocol per jurisdiction (Scotland vs E&W); currency. |
| **Planning ▸ Cost Drivers / Upfront Costs** | `acquisitionTax(jurisdiction)` | SDLT/LBTT/LTT/Stamp Duty/ITP-AJD/Grunderwerbsteuer; currency. |
| **Planning ▸ Example Forecast** | income-tax/interest-relief pack | UK S24 (interest not deductible) vs full-deductibility elsewhere — the biggest forecast divergence; currency. |
| **Portals (Tenant/Landlord/Supplier)** | recipient-locale `t()` + jurisdiction rights | Portal copy in recipient locale; tenant-rights notice per jurisdiction; money local. Top external-facing translation priority. |
| **Messages ▸ Email Templates / Notifications** | recipient-locale catalogue | Templates per recipient locale + jurisdiction-correct legal wording. |

### Tier 2 — central fix clears most of these
| Section | Integration point | Change |
|---|---|---|
| **Home / Portfolio** | section-lens + `formatMoney` | Per-property jurisdiction chips; reporting-currency roll-ups + local; mixed-portfolio grouping. |
| **Add-Property / Add-Unit / Create-Tenancy wizards** | capture + spine | Add-Property Step 1 captures country/region (sets the spine); currency + area-unit from country; tenancy deposit/notice defaults. |
| **Compliance (Overview/Coverage/Reports + cert wizards)** | re-key `useComplianceRequirements` workspace→property | Requirement set per property; Coverage/Reports group-by-jurisdiction; mixed-portfolio. |
| **Work ▸ PPM / Suppliers** | cadence pack + trade-cert pack | PPM cadence per jurisdiction; supplier tax-ID label (VAT/ABN/EIN) + required trade credential (Gas Safe/RGI/Schornsteinfeger). |
| **Contacts wizards** | existing `AddressForm`/`PhoneInput` | Country-aware address/phone/tax-ID (engine exists — wire it). |
| **Calendar** | `formatDate` + statutory date calculators | Localized month/day/first-day; notice-expiry & cert-renewal calculators per jurisdiction. |
| **Money ▸ Income/Expenses/Bills** | `computeTax()` | Tax scheme + currency per property. |

### Tier 3 — chrome translation + parameterisation
| Section | Change |
|---|---|
| **Work ▸ Tasks/Board/Gantt, Activity feeds, Notes** | translate chrome; localized dates (central `t()` + `formatDate`). |
| **Automations builder / Node Library** | translate node labels; jurisdiction-aware compliance/legal trigger templates. |
| **Planning ▸ remaining profile tabs** (all 13 profiles × 8 tabs) | currency + jurisdiction context line; AI grounded on property jurisdiction. |
| **Planning ▸ analytics sub-tabs** (Forecasts, Yield Intelligence, Portfolio Intelligence, Scenario, Conversion, Activity) | **money + jurisdiction-heavy aggregation views** — multi-currency roll-ups via `formatMoney` + FX; Yield/Portfolio Intelligence group-by-jurisdiction; tax model per property feeds forecast/scenario; Conversion currency. |
| **Money ▸ Escrow/Holds/Commissions/Payouts/Refunds/Disputes** | central `formatMoney` + `computeTax`; jurisdiction legality of holds; redress-body refs on Disputes. |
| **Automations ▸ Node Library completeness** | founder open question — audit Node Library for missing nodes; add jurisdiction-aware compliance/legal trigger nodes. Tracked separately. |
| **All ordinary chrome across every section** | translation pass (Phase 6), ordered portal→email→legal→money→operator sections. |

### Out of scope / blocked
- **Tier C restricted** countries (TR/IN/ID/ZA/NG/KE/PK): generic record-keeping + restricted banner only.
- **Tier D banned** (RU/IR/KP/SY/CU/BY/VE/NI/AF/MM/YE/SD/SO/CN): blocked, no tooling.

---

## 4. Data model touchpoints (Phase 0 migrations, via Management API PAT)

1. `properties.country_code` + `region_code` — **verify exist** (audit flagged unconfirmed); add + backfill from address/postcode if missing; index for grouping.
2. `workspaces.settings` — add `default_country_code`, `default_region`, `reporting_currency`, `supported_portal_locales`.
3. `user_section_jurisdiction_lens` (user_id, section_key, country_code, region) — RLS self-scoped; powers the lens switcher persistence (V1 may start localStorage).
4. `possession_cases` — add `notice_period_overridden` (bool), `notice_override_reason` (text), `notice_override_exemption` (text) for the per-case override.
5. `workspace_legal_modules` — extend payload for per-jurisdiction notice/deposit/condition overrides (table exists).
6. `user_notice_dismissals` (user_id, notice_key, dismissed_at) — RLS self-scoped; powers dismissible disclaimer persistence.
7. `translation_strings` + `translation_locales` — powers admin translations + DB override over bundled catalogue.
8. `country_tax_rates` (exists) — populate all 45; sibling `country_deposit_rules`, `country_acquisition_tax` from the sourced docs.
9. `fx_rates` (base, quote, rate, as_of) — reporting-currency roll-ups.

All idempotent, RLS-enforced, reproducible from clean DB. **NOT-NULL jsonb rule applies** — omit empty jsonb cols on insert, never send explicit null.

---

## 5. Build order (so nothing blocks)

| Phase | Delivers | Settings touched |
|---|---|---|
| **0 Foundations** | property country/region + backfill; `JurisdictionContextProvider`/`useActiveJurisdiction`/`usePropertyJurisdiction`; `resolveValue` + `SourcedValue` + **dismissible disclaimer**; consolidate money to `formatMoney`; lens switcher | Workspace ▸ Region & Jurisdiction tab |
| **1 Legal packs** | typed possession + shared-occupancy packs from sourced docs; possession/HMO wizards render property jurisdiction + per-case override | Workspace ▸ Jurisdiction Customisation |
| **2 Compliance** | requirements re-keyed property; grouped Coverage/Reports; cert wizards | — |
| **3 Money/Tax** | tax + deposit + acquisition-tax engines; invoice/deposit/arrears localized; reporting roll-ups | Workspace ▸ Region (reporting currency) |
| **4 Planning** | per-country tax/forecast/interest-relief engines; profile tabs parameterised | — |
| **5 Country UI packs** | `COUNTRY_PACKS` 6→45 | Admin ▸ Jurisdiction Packs (read-only) |
| **6 Translation** | extraction + replacement + 22 locales + admin tooling | Admin ▸ Translations; Account ▸ Language |
| **7 Live MCP sweep (last)** | every route × 8 viewports × jurisdiction/locale states; **mixed-portfolio acceptance (UK+ES+AE)** | — |

**Phase 0 blocks all; 7 is last (founder directive).** Phases 1–6 partially parallelise.

---

## 6. Acceptance test (the one scenario that proves the whole programme)
A **UK workspace with one ES and one AE property** renders, on every relevant leaf:
- the **property's** jurisdiction chip (record-true, locked) on detail/case/cert surfaces,
- the **lens switcher + grouped views** on Compliance/Legal/Money/Portfolio overviews,
- the property's **local currency** (with reporting-currency roll-up alongside),
- every sourced value with **source chip + edit + dismissible disclaimer**,
- across all 8 viewports, zero console/hydration errors, RLS property+workspace safe.

---

> **Start signal:** approve **Phase 0** and I build the jurisdiction engine + `resolveValue`/`SourcedValue` + disclaimer layer + money consolidation + the Workspace ▸ Region & Jurisdiction settings tab, with tsc+build green and resolver unit tests, then proceed phase-by-phase.
