# Propvora i18n, Localization & International UX Plan

**Companion to:** `INTERNATIONAL_EXPANSION_MASTER_PLAN.md`, `COUNTRY_LEGAL_PROFILES.md`. **Generated:** 2026-06-15.
**Status:** GATED — eligible only after UK V1 sign-off. **Stack note:** Next.js 16 / React 19 / Tailwind v4 — this is **not** the Next.js in training data; read `node_modules/next/dist/docs/` before implementing locale routing (per `AGENTS.md`).

> ⚠️ Build/planning document. Localization of **legal/tax/consent copy** is not just translation — translated legal text still requires ⚖️/🧾 review per `COUNTRY_LEGAL_PROFILES.md`.

---

## 1. i18n framework choice

**Recommendation: `next-intl` (v4+) with ICU MessageFormat.**

Rationale:
- **Native Next.js App Router support** — the project is App Router (`src/app/(app)/app/...`). next-intl is the most widely adopted App Router i18n library, with `[locale]` segment routing, locale detection, and `generateStaticParams` for marketing pages ([next-intl docs](https://next-intl.dev/docs/getting-started/app-router), [buildwithmatija](https://www.buildwithmatija.com/blog/nextjs-internationalization-guide-next-intl-2025)).
- **ICU MessageFormat** handles the hard cases Propvora has: plurals ("1 property" / "5 properties"), gendered/select strings, and locale-correct **number/date/currency** via `Intl` — essential for a finance-heavy app ([Phrase ICU](https://phrase.com/blog/posts/guide-to-the-icu-message-format/)).
- Localized pathnames (`/pricing` → `/preise`) for the **marketing** site SEO; the **app** itself can stay path-prefixed (`/{locale}/app/...`) without per-route translated slugs.

Avoid mixing libraries. If a non-App-Router constraint emerges at build time, `react-intl` is the ICU-compatible fallback — but default to next-intl.

---

## 2. Locale routing model

| Surface | Strategy |
|---|---|
| **Marketing** (`src/app/...` public: landing, pricing, features, legal, help, faq, contact, affiliate) | `[locale]` prefix + **localized pathnames** for SEO; `generateStaticParams` per supported locale; `hreflang` alternates. |
| **App** (`src/app/(app)/app/...`) | `[locale]` prefix, **canonical English slugs** (no translated app routes — reduces churn); UI strings translated, routes stable. |
| **Locale source of truth** | URL `[locale]` → falls back to `workspace.default_language` → `country_profiles.default_locale` → `Accept-Language` → `en-GB`. |
| **Proxy/middleware** | The auth guard is `src/proxy.ts` (Next 16 renamed middleware→proxy — see memory `reference-proxy-middleware.md`). Locale negotiation must be composed **with** the existing proxy, not replace it. Watch public-route prefix handling. |

**Initial locale set (phase-aligned):** `en-GB` (default), `en-US`, `en-AU`, `en-NZ`, `en-IE`, `en-CA`/`fr-CA`, then EU: `de-DE`, `fr-FR`, `es-ES`, `it-IT`, `nl-NL`, `sv-SE`, `fi-FI`, `da-DK`, `cs-CZ`, `hr-HR`, `hu-HU`, plus `pt-BR`, `ja-JP`, `th-TH`, `tr-TR`. RTL not in the named-market set, but build RTL-ready (see §6).

---

## 3. Translation workflow

```text
1. Extract: all UI strings → ICU message catalogs (messages/{locale}.json), namespaced by section.
2. Source of truth: en-GB catalog authored by product.
3. Machine pre-translate (DeepL/AI) → human/professional review for customer-facing copy.
4. LEGAL/TAX strings: NOT machine-final. Translated T&C / privacy / consent / tax labels
   go through counsel/tax review (COUNTRY_LEGAL_PROFILES lifecycle) before enable.
5. Continuous: a TMS (Crowdin/Lokalise/Phrase) or i18nexus to manage drift; CI check that
   no hardcoded user-facing string ships (lint rule).
```

- **Do not translate** `src/lib/legal/company.ts` entity facts (company number, registered office) — these are legal constants, locale-independent.
- Keep a `messages/_meta.json` recording which legal/consent keys are `reviewed` per locale; the app must **refuse to show** an unreviewed legal string in production and fall back to English + disclaimer.

---

## 4. Formatting: date / number / currency / address / phone

| Concern | Rule | Source |
|---|---|---|
| **Date/number** | `Intl.DateTimeFormat` / `Intl.NumberFormat` keyed to active locale; never hardcode `DD/MM` or `1,000.00`. | `country_profiles.date_format`, `number_format` |
| **Currency** | Display in the relevant currency with `Intl.NumberFormat(locale, {style:'currency', currency})`. Show **both** "charged in your currency" and base-currency equivalent where FX applies. | `default_currency`, property/transaction currency |
| **Area unit** | sqm vs sqft per `measurement_system`/`area_unit`. | profile |
| **Address** | Per-country field set + order via `address_models` (postcode vs zip+state vs none; region label "State"/"Province"/"County"/"Prefecture"). | `address_model_id` |
| **Phone** | E.164 storage; display per `phone_country_code`; validate with libphonenumber. | profile |
| **Names** | Avoid first/last assumptions where possible; single display-name field tolerant of CJK ordering. | — |

---

## 5. Per-country onboarding flow changes

The onboarding must branch (marketplace audit §14 already specifies workspace-type branching). International layer adds a **jurisdiction step**:

```text
Onboarding (operator):
  1. Workspace type (operator/supplier/customer)            [existing plan]
  2. Business country         → sets billing/tax/privacy regime, eligibility check
  3. Eligibility gate         → if BANNED: block; if RESTRICTED: manual-review path
  4. Property countries       → may differ from business country (multi-country portfolio)
  5. Per property-country     → resolve country_profile.property_features_status
                                 (enabled → full pack; research_only → generic mode + banner)
  6. Base/reporting currency + per-property currency toggle
  7. Locale/language
  8. Tailored T&C / EULA / DPA / refund variant  (B2B vs B2C; region)
  9. Consent block            → EU: immediate-start + withdrawal acknowledgement;
                                 US/CA: auto-renewal disclosure; marketing opt-in/out per regime
 10. Tax fields               → VAT/GST/ABN/GSTIN ID capture; B2B reverse-charge eligibility
 11. Data region acknowledgement + subprocessor notice
```

**Surfaces:** `onboarding-flow-design`, `workspace-creation-flow`, `account-type-selection-ui`, `plan-selection-ui`, `cookie-consent-privacy-ui`, `terms-privacy-legal-page-ui`.

---

## 6. RTL & script readiness

- Build with **logical CSS properties** (`margin-inline-start` etc.) and a `dir` attribute driven by locale so Arabic/Hebrew markets (later) need no re-architecture. Tailwind v4 supports logical-property utilities — adopt them now in shared layout primitives.
- Test CJK (`ja-JP`, future `zh`*) for line-break/typography; reserve space for German (long words) and avoid fixed-width text containers (ties to existing `layout-shift-prevention`, `whitespace-and-alignment-system`).

---

## 7. Upgrade / billing UX changes

| Change | Detail |
|---|---|
| **Currency display** | Plan prices shown in customer currency (display) while Stripe charges + reports in base; show FX disclaimer. |
| **Tax-inclusive vs exclusive** | EU B2C typically VAT-inclusive display; US sales-tax added at checkout; show correct convention per region. |
| **VAT-ID / tax-ID field** | B2B customers enter VAT/GST ID → triggers reverse-charge (no VAT) + validates via VIES/registry. |
| **Withdrawal/consent** | EU: "start now & I waive my 14-day withdrawal right" checkbox; **self-service cancel** control (mandatory EU from 19 Jun 2026). US/CA: auto-renewal terms + cancel path. |
| **Country-pack add-on** | "Country pack beta GBP 19/mo/country (Scale+)" only purchasable for `beta`/`enabled` packs. |
| **Eligibility** | Checkout blocks BANNED billing countries; sanctions screen on billing + (Connect) payout country. |

Surfaces: `workspace-settings/subscription`, `workspace-settings/billing`, `workspace-settings/invoices`, `pricing-page-ui`, `subscription-gating-ui`, `refund-cancellation-policy-ui`.

---

## 8. Per-section / route / function international impact map

Legend: **L10n** = locale/format/translation only (low risk). **Tax** = billing/tax logic. **Legal** = country-pack gating ⚖️. **Pay** = payments/currency. **Priv** = privacy/consent. **Disable** = feature hidden outside reviewed packs.

| Route / function | Impact tags | What changes internationally |
|---|---|---|
| `/app` (home/dashboard) | L10n, Pay | Locale formats; multi-currency KPI cards; country-exposure card. |
| `/app/portfolio/properties` | L10n, Legal | `country_code`/`jurisdiction`/`area_unit`/address model per property; "unsupported country — generic mode" banner. |
| `/app/portfolio/tenancies` | Legal, Disable | Tenancy concepts vary; UK tenancy logic gated to GB; generic occupancy record elsewhere. |
| `/app/portfolio/units`, `/leasing`, `/map`, `/gallery`, `/timeline` | L10n | Formats, labels, map locale. |
| `/app/money/income`, `/expenses`, `/invoices`, `/bills` | Tax, Pay, L10n | Multi-currency; VAT/GST/sales-tax fields; B2B reverse-charge; e-invoice formats; tax-ID. |
| `/app/money/deposits` | Legal, Pay | Tenancy-deposit scheme (UK TDP) is **UK-specific** → gated; booking/escrow deposits separate. |
| `/app/money/rent-chase`, `/arrears` | L10n, Legal | Currency; arrears/notice logic is jurisdiction-specific → generic outside GB. |
| `/app/money/affiliate` | Pay, Legal, Priv | Payout-country matrix; sanctions screen of payees; per-country affiliate terms + disclosure; tax forms. |
| `/app/money/stripe`, `/supplier-payments`, `settings/payments-stripe` | Pay | Connect payout-country matrix; local methods; SCA/3DS; FX. |
| `/app/accounting/*` (ledger, accounts, mtd, reconciliation, reports, forecast, client-accounts) | Tax, Pay, Disable | Multi-currency ledger + FX revaluation; country chart templates; **MTD** is UK-only → gated; local tax codes. |
| `/app/compliance/*` (certificates, inspections, renewals, risk, coverage, supplier-docs…) | Legal, Disable | UK gas/electrical/EPC/fire/HMO checks → country-pack rules from `country_compliance_rules`; generic evidence vault where no pack. |
| `/app/legal/rra-2026`, `/hmo-licences`, `/possession`, `/epc-advisory` | Legal, Disable | **Entirely UK-statute** → hidden outside GB packs; generic legal-document/evidence surface only. |
| `/app/legal` (overview/templates) | Legal | Region-correct templates (supplier/booking/marketplace/privacy) per `country_legal_templates`. |
| `/app/work/*` (tasks, jobs, ppm, suppliers, marketplace, complaints) | L10n, Tax, Legal | Local emergency categories; supplier-invoice tax; SLAs by local holidays; marketplace dispatch by property locality. |
| `/app/planning/*` (forecasts, yield-intelligence, scenarios, landlord-offers, conversions) | Tax, Pay, Disable | Currency + tax-regime aware; UK landlord-offer/RRA logic suppressed outside GB. |
| `/app/contacts/*` | Priv, L10n | Per-contact consent/marketing region; address/phone formats; CASL/PECR opt-in vs CAN-SPAM opt-out. |
| `/app/calendar/*` | L10n | Locale dates; per-country holidays; timezone correctness. |
| `/app/portals/*`, `/contacts/portal-access` | Priv, L10n | Tenant/guest/supplier portal privacy notice per region; portal language. |
| `/app/messages/*` | Priv, L10n | Locale; consent for outbound channels. |
| `/app/automations` | Legal | Automations must be context/country-aware; block legal/notice auto-actions outside reviewed packs. |
| `/app/workspace-settings/data`, `/storage`, `/security` | Priv | `data_region`, subprocessors, DSAR/export/delete per regime, breach-clock metadata. |
| `/app/workspace-settings/subscription`, `/billing`, `/invoices`, `/addons` | Tax, Pay | See §7. |
| `/app/workspace-settings/email`, `/notifications` | Priv | Region-aware consent + suppression (CASL/CAN-SPAM/PECR). |
| `/app/account/data-privacy`, `/account/notifications` | Priv | DSAR window, erasure-with-retention-override, opt-out signals (GPC). |
| Admin → Countries / Country Packs / Release Gates | Legal, Tax, Pay, Priv | New control plane: pack status, reviewers, disclosures, eligibility, representatives, sanctions feed. |
| Public marketing (`/`, `/pricing`, `/features`, `/legal`, `/help`, `/faq`, `/contact`, `/affiliate-programme`, `/changelog`, `/walkthrough`) | L10n, Legal | Localized pathnames + hreflang; region-correct legal/pricing/withdrawal copy; EAA accessibility. |
| AI Copilot (`workspace-settings/ai`, `copilot-inbox`) | Legal, Priv | Receives country context; downgrades legal/tax depth + refuses definitive advice when pack `< reviewed`; EU AI Act transparency labels on output. |
| `src/proxy.ts` (auth guard) | L10n | Compose locale negotiation; eligibility/geo block for BANNED at edge. |
| `src/lib/legal/company.ts` | — | Stays canonical English entity facts; **not** translated. |

---

## 9. Sources
- next-intl App Router: https://next-intl.dev/docs/getting-started/app-router · https://www.buildwithmatija.com/blog/nextjs-internationalization-guide-next-intl-2025
- ICU MessageFormat: https://phrase.com/blog/posts/guide-to-the-icu-message-format/
- react-intl/ICU comparison: https://intlpull.com/blog/react-i18next-vs-react-intl-comparison-2026
- Legal/tax/consent specifics: see `INTERNATIONAL_EXPANSION_MASTER_PLAN.md` §11.
