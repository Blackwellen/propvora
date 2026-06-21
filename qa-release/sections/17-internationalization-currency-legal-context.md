# Section 17 — Internationalisation / Currency / Legal Context

Coverage for currency formatting, locale-aware date display, and legal-context copy across all workspaces. UK (en-GB / GBP) is the baseline locale. All other locales are additive and controlled via workspace settings or feature flags (`multiCountryPortfolio`, `globalCountryPacks`).

**Scoring:** 5=perfect | 4=minor issue | 3=usable but inconsistent | 2=harms UX | 1=severe | 0=broken/not implemented | N/A=not applicable

---

## Currency Pack Support Table

| Code | Symbol | Name | Decimal Places | Example | Supported? | Needs Work? |
|------|--------|------|---------------|---------|-----------|------------|
| GBP | £ | British Pound | 2 | £1,234.56 | Yes | No |
| USD | $ | US Dollar | 2 | $1,234.56 | Partial | Yes |
| EUR | € | Euro | 2 | €1,234.56 | Partial | Yes |
| CAD | C$ | Canadian Dollar | 2 | C$1,234.56 | No | Yes |
| AUD | A$ | Australian Dollar | 2 | A$1,234.56 | No | Yes |
| NZD | NZ$ | New Zealand Dollar | 2 | NZ$1,234.56 | No | Yes |
| AED | د.إ | UAE Dirham | 2 | د.إ 1,234.56 | No | Yes |
| INR | ₹ | Indian Rupee | 2 | ₹1,234.56 | No | Yes |
| JPY | ¥ | Japanese Yen | 0 | ¥1,235 | No | Yes |
| CHF | CHF | Swiss Franc | 2 | CHF 1,234.56 | No | Yes |
| PLN | zł | Polish Zloty | 2 | 1 234,56 zł | No | Yes |

---

## Locale Pack Support Table

| Pack | Region | Date Format | Currency | Legal Context | Supported? |
|------|--------|-------------|----------|--------------|-----------|
| en-GB | UK | DD/MM/YYYY | GBP | UK baseline | Yes |
| en-US | USA | MM/DD/YYYY | USD | Generic US | No |
| en-AU | Australia | DD/MM/YYYY | AUD | Generic AU | No |
| fr-FR | France | DD/MM/YYYY | EUR | Generic FR | No |
| de-DE | Germany | DD.MM.YYYY | EUR | Generic DE | No |

---

## I18N QA Matrix

| ID | Route | Atom | Currency OK? | Date OK? | Legal OK? | Workspace Setting Used? | Score | Status |
|----|-------|------|-------------|---------|----------|------------------------|-------|--------|
| I18N-PMW-001 | /property-manager | Dashboard KPI cards | GBP hardcoded | DD/MM/YYYY | UK | No WS override | [~] | BROWSER_REQUIRED |
| I18N-PMW-002 | /property-manager/money | Money figures | GBP | - | UK | - | [~] | BROWSER_REQUIRED |
| I18N-PMW-003 | /property-manager/money/income | Income table | GBP | - | UK | - | [~] | BROWSER_REQUIRED |
| I18N-PMW-004 | /property-manager/money/expenses | Expense table | GBP | - | UK | - | [~] | BROWSER_REQUIRED |
| I18N-PMW-005 | /property-manager/compliance | Compliance dates | - | DD/MM/YYYY | UK | - | [~] | BROWSER_REQUIRED |
| I18N-PMW-011 | All PM routes | USD/$ symbols | No bare $ in PM UI | - | - | - | 5 | CODE_CONFIRMED — grep shows no $X.XX in PM UI; FIX-091 fixed USD in automations cost forecast; remaining USD refs are in settings currency dropdowns (legitimate multi-currency support) |
| I18N-SSW-001 | /supplier | Supplier invoice amounts | GBP | - | UK | - | [~] | BROWSER_REQUIRED |
| I18N-STW-001 | /supplier (team) | Team payment amounts | GBP | - | UK | - | [~] | BROWSER_REQUIRED |
| I18N-WS-001 | /property-manager/workspace-settings/preferences | Preferences page | ✅ | ✅ | UK | Yes — saves to workspace_settings.preferences_json | 5 | FIXED (FIX-098) — Language/Preferences page created with language selector (22 locales), currency selector (12 currencies), date format selector (4 options), timezone selector (IANA), number format selector, live preview panel. Saved to workspace_settings.preferences_json upsert (42P01-safe). Nav link added to workspace-settings layout under Configuration group. |
| I18N-WS-002 | /property-manager/workspace-settings/jurisdiction | Jurisdiction page | ✅ | ✅ | UK | Yes — /api/workspace/jurisdiction | 5 | EXISTING — full jurisdiction/locale/currency save flow already live; links back to preferences page |
| I18N-FMTS-001 | src/lib/i18n/format.ts | formatMoney / formatDate | ✅ | ✅ | N/A | formatMoney(amount, currency, locale) | 5 | EXISTING — full Intl.NumberFormat + Intl.DateTimeFormat formatters live; GBP/en-GB byte-identical to legacy moneyPence helper |

---

## QA Protocol for I18N / Currency

1. Verify all GBP amounts render as `£X,XXX.XX` — no raw numbers without currency symbol.
2. Verify all dates render as `DD/MM/YYYY` throughout the PM workspace (not US format).
3. For routes with legal copy (compliance, tenancy agreements, legal section): confirm UK-specific terminology (tenancy vs. lease, Section 21, EPC, etc.).
4. When `multiCountryPortfolio` flag is ON: set a property to a non-GBP country, confirm currency on that property's detail page switches.
5. Check that workspace-level currency setting (if implemented) propagates to all child routes.
6. Confirm no hardcoded `$` or `USD` symbols appear in the UI for UK workspaces.
7. Check number formatting: thousand separators use commas (1,234.56), not periods (1.234,56).
