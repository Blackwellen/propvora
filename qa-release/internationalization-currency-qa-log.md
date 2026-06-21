# Internationalisation, Currency & Legal Context QA Log

Last updated: 2026-06-21 (FIX-278 — I18N code audit complete)

## Scoring
5 = correct | 4 = minor issue | 3 = partial | 2 = major | 1 = broken | 0 = not implemented

---

## FIX-278 Session Summary (2026-06-21)

**Scope:** Code-level audit of currency formatting, date locale, and legal context across all workspaces.

**Method:** grep for raw `£` template literals, `toLocaleDateString` locale args, legal entity references, terms/privacy page existence, workspace locale settings, `formatPence` usage.

**Key findings:**
1. **formatPence()** (`src/lib/marketplace/money.ts`) — correctly implemented using `Intl.NumberFormat("en-GB")`, handles null/undefined, supports multi-currency. Confirmed used in: accounting ledger/chart/journal, supplier insights, marketplace public pages, affiliate components, PM payouts.
2. **Raw `£` violations** — 16 files found using `£${x}` template literals instead of `formatPence()`. All produce correct en-GB GBP output. 3 worst offenders in public-facing marketplace/customer components **FIXED**. Remaining 13 files are internal PM tools — deferred as low priority for v1 UK release.
3. **Date formatting** — all 60+ `toLocaleDateString()` calls in codebase pass `"en-GB"` locale argument. No US MM/DD/YYYY found. Score: 5/5.
4. **Legal entity** — `src/lib/legal/company.ts` is correct: Blackwellen Ltd, Co. 16482166, ICO ZC160806, England and Wales, 61 Bridge Street Kington HR5 3DJ. `/legal/terms` and `/legal/privacy` routes confirmed present.
5. **Workspace locale settings** — preferences page live at `/property-manager/workspace-settings/preferences` with 22 locales, 12 currencies, date/timezone/number format selectors. Jurisdiction page also live.
6. **Cookie consent** — not confirmed on public pages. Needed for UK/EU compliance. Flagged for follow-up.

**Files fixed (FIX-278):**
- `src/components/public-marketplace/maps/StaysMapInner.tsx` — map price pins now use `formatPence()`
- `src/components/public-marketplace/maps/ServicesMapInner.tsx` — map price pins and popup prices now use `formatPence()`
- `src/features/customer/components/PropertyCard.tsx` — `gbp()` helper now delegates to `formatPence()`

---

## Currency Pack Registry

| Currency Code | Symbol | Name | Decimal Places | Example Format | Supported Now? | Needs Work? | Notes |
|---------------|--------|------|---------------|---------------|---------------|-------------|-------|
| GBP | £ | British Pound Sterling | 2 | £1,250.00 | YES | No | Default currency. formatPence() + formatMoney() both support. en-GB locale confirmed |
| EUR | € | Euro | 2 | €1,250.00 | Partial | Yes | Workspace settings currency selector includes EUR. formatPence(pence, "EUR") works via Intl |
| USD | $ | US Dollar | 2 | $1,250.00 | Partial | Yes | Currency selector includes USD. No bare USD formatting in UK workspace UI |
| AED | د.إ | UAE Dirham | 2 | AED 1,250.00 | No | Yes | Flag-gated (globalCountryPacks) |
| AUD | A$ | Australian Dollar | 2 | A$1,250.00 | No | Yes | Flag-gated |
| CAD | C$ | Canadian Dollar | 2 | C$1,250.00 | No | Yes | Flag-gated |
| SGD | S$ | Singapore Dollar | 2 | S$1,250.00 | No | Yes | Flag-gated |
| HKD | HK$ | Hong Kong Dollar | 2 | HK$1,250.00 | No | Yes | Flag-gated |
| CHF | CHF | Swiss Franc | 2 | CHF 1,250.00 | No | Yes | Flag-gated |
| JPY | ¥ | Japanese Yen | 0 | ¥125,000 | No | Yes | Flag-gated — 0 decimal places |
| INR | ₹ | Indian Rupee | 2 | ₹1,250.00 | No | Yes | Flag-gated |
| PLN | zł | Polish Złoty | 2 | 1 250,00 zł | No | Yes | Flag-gated |

---

## Locale / Legal Pack Registry

| Pack ID | Region / Locale | Date Format | Currency Default | Legal Context | Supported Now? | Needs Work? |
|---------|----------------|-------------|-----------------|---------------|----------------|-------------|
| en-GB | United Kingdom (English) | DD/MM/YYYY | GBP | UK tenancy law, Section 21/Section 8, EPC, HMO, Renters Rights Bill | YES — all date/currency formatting confirmed en-GB | No for v1 |
| en-US | United States (English) | MM/DD/YYYY | USD | US lease law | No | Yes — flag-gated |
| en-AU | Australia (English) | DD/MM/YYYY | AUD | Australian tenancy law | No | Yes — flag-gated |
| en-CA | Canada (English) | DD/MM/YYYY | CAD | Canadian landlord-tenant law | No | Yes — flag-gated |

---

## 1. Property Manager Workspace i18n

| ID | Surface | Currency OK? | Date OK? | Legal OK? | Workspace Setting? | Score | Status |
|----|---------|-------------|---------|-----------|-------------------|-------|--------|
| I18N-PMW-001 | Dashboard KPI cards | Raw £ (not formatPence) but correct UK output | en-GB ✅ | UK | No WS override yet | 3 | CODE_AUDIT — raw £ template literals in money pages. Deferred |
| I18N-PMW-002 | /money/income — invoices | Local `fmtGbp` helper (raw £) | en-GB ✅ | UK | — | 3 | CODE_AUDIT — duplicates formatPence. Correct output |
| I18N-PMW-003 | /money/expenses — arrears | `£${amount.toLocaleString()}` | en-GB ✅ | UK | — | 3 | CODE_AUDIT — same pattern. Correct output |
| I18N-PMW-004 | /money/deposits — KPI strip | 5× `£${x.toLocaleString("en-GB")}` | en-GB ✅ | UK | — | 3 | CODE_AUDIT — raw £ pattern. Correct output |
| I18N-PMW-005 | /compliance — certificate dates | — | en-GB ✅ | UK (EPC/EICR/Gas Safe copy) | — | 5 | CODE_CONFIRMED |
| I18N-PMW-006 | /legal/possession — rent amounts | `£${Number(n).toLocaleString("en-GB")}` in 5 files | en-GB ✅ | UK (Section 21/8 copy ✅) | — | 3 | CODE_AUDIT — raw £ in 5 legal flow pages. Correct UK output |
| I18N-PMW-007 | /accounting — ledger/journal | formatPence ✅ | en-GB ✅ | UK | — | 5 | CODE_CONFIRMED — accounting correctly uses formatPence |
| I18N-PMW-008 | /money/bills | `£${x.toLocaleString()}` × 7 | en-GB ✅ | UK | — | 3 | CODE_AUDIT — bills pages use raw £. Correct output |
| I18N-PMW-009 | /planning/income | `"£" + n + "k"` string concat × 2 | en-GB ✅ | UK | — | 3 | CODE_AUDIT — planning uses raw £ string concat |
| I18N-PMW-010 | Workspace settings — currency | ✅ 12 currencies selectable | ✅ 4 date formats | UK default | Yes — preferences_json | 5 | CODE_CONFIRMED — FIX-098 |
| I18N-PMW-011 | All PM routes — no USD | No bare $ in UI ✅ | — | — | — | 5 | CODE_CONFIRMED |
| I18N-PMW-012 | All date surfaces | — | All use toLocaleDateString("en-GB") ✅ | — | — | 5 | CODE_CONFIRMED — 60+ usages, all en-GB |

---

## 2. Supplier Solo Workspace i18n

| ID | Surface | Currency OK? | Date OK? | Legal OK? | Score | Status |
|----|---------|-------------|---------|-----------|-------|--------|
| I18N-SSW-001 | /supplier/insights — amounts | formatPence ✅ | en-GB ✅ | UK | 5 | CODE_CONFIRMED |
| I18N-SSW-002 | /supplier/invoices | No raw £ found in supplier namespace | en-GB ✅ | UK | 4 | CODE_AUDIT — no violations found; BROWSER_REQUIRED |
| I18N-SSW-003 | /supplier/jobs — values | No raw £ in supplier namespace | en-GB ✅ | UK | 4 | CODE_AUDIT |
| I18N-SSW-004 | /supplier/jobs — dates | — | en-GB ✅ | UK | 5 | CODE_CONFIRMED |
| I18N-SSW-005 | Supplier locale setting | No per-supplier locale override — inherits platform default | — | UK | 3 | GAP — supplier cannot change locale/currency independently. Low priority for v1 |

---

## 3. Customer Workspace i18n

| ID | Surface | Currency OK? | Date OK? | Legal OK? | Score | Status |
|----|---------|-------------|---------|-----------|-------|--------|
| I18N-STW-001 | CustomerPropertyCard.tsx | FIXED ✅ — now uses formatPence() | en-GB ✅ | UK | 5 | FIX-278 APPLIED |
| I18N-STW-002 | StaysMapInner — map pins | FIXED ✅ — now uses formatPence() | — | UK | 5 | FIX-278 APPLIED |
| I18N-STW-003 | ServicesMapInner — map pins | FIXED ✅ — now uses formatPence() | — | UK | 5 | FIX-278 APPLIED |
| I18N-STW-004 | BookingsKpiStrip — total spent | `£${(totalPence/100).toLocaleString("en-GB")}` — raw £ | en-GB ✅ | UK | 3 | CODE_AUDIT — correct UK output. Deferred |
| I18N-STW-005 | PaymentsKpiStrip — hardcoded | Hardcoded static strings ("£2,875.00") | — | UK | 2 | DATA_HONESTY — tracked under data-honesty FIX programme; static demo values, not dynamic |
| I18N-STW-006 | Customer date displays | — | en-GB ✅ | UK | 5 | CODE_CONFIRMED |
| I18N-STW-007 | /customer/lets — terms | — | — | UK tenancy terminology (AST) | 4 | CODE_CONFIRMED — UK copy |
| I18N-STW-008 | /customer/settings — currency display | "GBP (£)" static | — | UK | 4 | CODE_AUDIT — correct. No dynamic locale switching for customer |

---

## 4. Legal Context

| ID | Surface | Score | Status |
|----|---------|-------|--------|
| I18N-LEGAL-001 | /legal/terms page | 5 | CODE_CONFIRMED — route exists, company details correct |
| I18N-LEGAL-002 | /legal/privacy page | 5 | CODE_CONFIRMED — route exists, ICO ZC160806 referenced |
| I18N-LEGAL-003 | src/lib/legal/company.ts | 5 | CODE_CONFIRMED — Blackwellen Ltd (16482166), England and Wales, ICO ZC160806 |
| I18N-LEGAL-004 | AI chat — legal disclaimers | 4 | CODE_CONFIRMED — FIX-263 added disclaimers. BROWSER_REQUIRED for copy verification |
| I18N-LEGAL-005 | GDPR / data retention notices | 4 | CODE_CONFIRMED — /admin/data-requests exists, privacy policy covers GDPR. ICO registered |
| I18N-LEGAL-006 | Cookie consent (public pages) | 3 | GAP — cookie consent banner not confirmed present. UK/EU PECR requirement. Needs follow-up |
| I18N-LEGAL-007 | VAT handling | 3 | CODE_AUDIT — bills/invoices show "VAT" label but no automatic VAT calculation confirmed. BROWSER_REQUIRED |
