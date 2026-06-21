# Section 17 — Internationalisation / Currency / Legal Context

Coverage for currency formatting, locale-aware date display, and legal-context copy across all workspaces. UK (en-GB / GBP) is the baseline locale. All other locales are additive and controlled via workspace settings or feature flags (`multiCountryPortfolio`, `globalCountryPacks`).

**Scoring:** 5=perfect | 4=minor issue | 3=usable but inconsistent | 2=harms UX | 1=severe | 0=broken/not implemented | N/A=not applicable

Last updated: 2026-06-21 (FIX-278 — I18N QA audit complete)

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
| I18N-PMW-001 | /property-manager | Dashboard KPI cards | Raw £ template literals in money/bills, money/deposits pages — uses `£${x.toLocaleString()}` not formatPence | toLocaleDateString("en-GB") used throughout | UK | No WS override | 3 | CODE_AUDIT — PM money pages use raw £ template literals (not formatPence). Acceptable for en-GB-only scope but non-portable. BROWSER_REQUIRED for visual check |
| I18N-PMW-002 | /property-manager/money | Money figures | Mix: some use formatPence (escrow, payouts, ledger), others use raw `£${x}` template literals (bills, invoices, deposits) | en-GB throughout | UK | — | 3 | CODE_AUDIT — inconsistent currency formatting pattern across PM money. Worst offenders: bills/new page, bills/[id] page, deposits page. Not blocking for UK-only v1 |
| I18N-PMW-003 | /property-manager/money/income | Income table | money/invoices/page.tsx has local `fmtGbp` using `£${amount.toLocaleString("en-GB",...)}` — raw £ | en-GB | UK | — | 3 | CODE_AUDIT — local format helper duplicates formatPence; produces correct UK output but not using shared util. Low priority for v1 |
| I18N-PMW-004 | /property-manager/money/expenses | Expense table | money/arrears/page.tsx has `£${amount.toLocaleString()}` | en-GB | UK | — | 3 | CODE_AUDIT — same pattern as income. Correct output, wrong utility |
| I18N-PMW-005 | /property-manager/compliance | Compliance dates | N/A | toLocaleDateString("en-GB") confirmed across all compliance pages | UK (EPC/EICR/Gas Safe copy) | — | 5 | CODE_CONFIRMED — all date displays pass "en-GB" locale |
| I18N-PMW-006 | /property-manager/legal | Legal notices | N/A | toLocaleDateString("en-GB") confirmed | UK (Section 21/Section 8 copy confirmed in possession flow pages) | — | 5 | CODE_CONFIRMED — legal/possession pages use en-GB dates. Section 21/8 references present |
| I18N-PMW-007 | /property-manager/legal/possession/* | Rent amounts in legal flow | legal/possession pages use `£${Number(n).toLocaleString("en-GB")}` — 5 pages with same raw £ pattern | en-GB | UK | — | 3 | CODE_AUDIT — raw £ in legal possession flow. Correct output for UK. Candidate for future refactor to formatPence but not blocking |
| I18N-PMW-008 | /property-manager/money | Rent roll total | Deposits page: `£${liveSummary.totalTracked.toLocaleString("en-GB")}` — raw £ on 5 KPI chips | en-GB | UK | — | 3 | CODE_AUDIT — deposits KPI strip uses raw £. Correct UK output. Not blocking |
| I18N-PMW-009 | /property-manager/planning | Revenue forecast figures | planning/sets/[id]/income/page.tsx: `"£" + (n/1000).toFixed(1)+"k"` and `"£" + n.toLocaleString()` | en-GB | UK | — | 3 | CODE_AUDIT — planning income page has raw £ string concatenation (2 occurrences). Correct UK output |
| I18N-PMW-010 | /property-manager/accounting | Chart of accounts amounts | accounting/ pages confirmed using formatPence (ledger, chart-of-accounts, journal, trial-balance) | en-GB | UK | — | 5 | CODE_CONFIRMED — accounting section correctly imports and uses formatPence throughout |
| I18N-PMW-011 | All PM routes | USD/$ symbols | No bare `$X.XX` patterns in PM UI | — | — | — | 5 | CODE_CONFIRMED — grep shows no USD/$ formatting in PM UI; remaining USD refs are in settings currency dropdowns (legitimate multi-currency support) |
| I18N-PMW-012 | /property-manager/workspace-settings/preferences | Currency/locale settings | ✅ Preferences page live with currency selector (12 currencies), language selector (22 locales) | ✅ Date format selector (4 options) | UK default | Yes — saves to workspace_settings.preferences_json | 5 | EXISTING — FIX-098 confirmed. Full locale/currency/date/timezone/number format settings with live preview panel |
| I18N-PMW-013 | /property-manager/workspace-settings/jurisdiction | Jurisdiction settings | ✅ | ✅ | UK default with jurisdiction picker | Yes — /api/workspace/jurisdiction | 5 | EXISTING — full jurisdiction/locale/currency save flow live |
| I18N-PMW-014 | All money surfaces | No hard-coded £ signs | PARTIAL: marketplace/public and customer workspace use formatPence correctly; PM internal pages have ~15 files using raw £ template literals | — | — | — | 3 | CODE_AUDIT — see violations list below. Worst marketplace/customer offenders FIXED (FIX-278). PM internal raw £ is correct UK output but non-portable |
| I18N-PMW-015 | All date surfaces | Date format consistency | N/A | CONFIRMED: all 60+ date usages in codebase pass "en-GB" to toLocaleDateString() — no US MM/DD/YYYY format found | — | — | 5 | CODE_CONFIRMED — comprehensive grep of toLocaleDateString confirms all use "en-GB" locale argument. No hardcoded date format strings found |
| I18N-SSW-001 | /supplier | Supplier invoice amounts | supplier/insights/page.tsx uses formatPence ✅ | toLocaleDateString("en-GB") | UK | — | 5 | CODE_CONFIRMED — supplier insights uses formatPence correctly |
| I18N-SSW-002 | /supplier/invoices/[id] | Invoice amounts | formatPence confirmed in supplier insights | en-GB | UK | — | 4 | CODE_CONFIRMED — formatPence in use. Minor: quotes/jobs pages not directly verified but no violations found in supplier namespace grep |
| I18N-SSW-003 | /supplier/jobs/[id] | Job value display | No raw £ found in supplier namespace | en-GB | UK | — | 4 | CODE_AUDIT — no raw £ violations in supplier workspace. BROWSER_REQUIRED to confirm full render |
| I18N-SSW-004 | /supplier/jobs/[id] | Job scheduled date | — | toLocaleDateString("en-GB") pattern | UK | — | 4 | CODE_CONFIRMED — en-GB date pattern consistent |
| I18N-SSW-005 | /supplier | Supplier locale settings | Settings accessible in supplier workspace | — | UK | No separate locale setting for supplier | 3 | BROWSER_REQUIRED — supplier workspace has no per-supplier locale override; inherits platform default en-GB |
| I18N-STW-001 | /customer | Customer payment displays | FIXED (FIX-278) — CustomerPropertyCard.tsx was using raw `£${Math.round(pence/100)}` — now uses formatPence | toLocaleDateString("en-GB") | UK | — | 5 | CODE_FIXED — FIX-278: PropertyCard.tsx now uses formatPence |
| I18N-STW-002 | /customer/bookings | Booking KPI strip | BookingsKpiStrip.tsx still uses `£${(totalPence/100).toLocaleString("en-GB")}` — raw £ | en-GB | UK | — | 3 | CODE_AUDIT — raw £ in customer bookings KPI. Correct UK output. Candidate for follow-up refactor |
| I18N-STW-003 | /customer/stays/map | Stay map price pins | FIXED (FIX-278) — StaysMapInner.tsx was using `£${price}` in divIcon HTML — now uses formatPence | — | UK | — | 5 | CODE_FIXED — FIX-278: StaysMapInner.tsx map pins now use formatPence |
| I18N-STW-004 | /services/map | Services map price pins | FIXED (FIX-278) — ServicesMapInner.tsx was using `£${price}` in divIcon HTML — now uses formatPence | — | UK | — | 5 | CODE_FIXED — FIX-278: ServicesMapInner.tsx map pins and popup "From" price now use formatPence |
| I18N-STW-005 | /customer/payments | Payment static data | PaymentsKpiStrip.tsx, PaymentDetailRail.tsx use hardcoded £ strings — static demo values | — | UK | — | 2 | CODE_AUDIT — these are static seed values ("£2,875.00", "£1,650.00" etc). These are hardcoded demo strings not dynamic, already being tracked under data-honesty FIX programme |
| I18N-STW-006 | /customer | Customer date displays | — | Customer workspace uses en-GB dates consistently | UK | — | 5 | CODE_CONFIRMED — customer date displays use en-GB |
| I18N-STW-007 | /customer/lets | Customer lets legal terms | — | — | Tenancy terms use UK terminology (AST references) | — | 4 | CODE_CONFIRMED — UK tenancy terminology in lets section |
| I18N-STW-008 | /customer/settings | Billing currency display | FinanceSection.tsx shows "GBP (£)" as static text | — | UK | — | 4 | CODE_AUDIT — currency correctly shown as GBP. No dynamic locale switching for customer workspace |
| I18N-LEGAL-001 | /legal/terms | Terms of service | N/A | N/A | /legal/terms page present, company details correct | — | 5 | CODE_CONFIRMED — /legal/terms page exists. Blackwellen Ltd company number 16482166 in src/lib/legal/company.ts |
| I18N-LEGAL-002 | /legal/privacy | Privacy policy | N/A | N/A | /legal/privacy page present, ICO number ZC160806 confirmed | — | 5 | CODE_CONFIRMED — /legal/privacy page exists. ICO registration ZC160806, England and Wales jurisdiction in company.ts |
| I18N-LEGAL-003 | src/lib/legal/company.ts | Company details accuracy | N/A | N/A | Blackwellen Ltd (No. 16482166), ICO ZC160806, 61 Bridge Street Kington HR5 3DJ, England and Wales | — | 5 | CODE_CONFIRMED — all legal entity details correct and verified against Companies House 2026-06-13 |
| I18N-LEGAL-004 | src/app/api/ai/chat/route.ts | AI legal disclaimers | N/A | N/A | AI system prompt legal disclaimer required | — | 4 | BROWSER_REQUIRED — AI chat route exists; disclaimer wiring confirmed in FIX-263 (AI copilot section context + legal disclaimers). Score 4 pending browser test of actual disclaimer text rendering |
| I18N-LEGAL-005 | All workspaces | GDPR / data retention | N/A | N/A | /legal/privacy includes GDPR section, data-requests admin route exists | — | 4 | CODE_CONFIRMED — /admin/data-requests route live. Privacy policy covers GDPR. ICO registered. Cookie consent needed on public pages |
| I18N-LEGAL-006 | Public pages | Cookie consent | N/A | N/A | Cookie consent banner required on public marketing pages | — | 3 | CODE_AUDIT — cookie consent banner existence not confirmed. Standard requirement for UK/EU compliance. BROWSER_REQUIRED |
| I18N-WS-001 | /property-manager/workspace-settings/preferences | Preferences page | ✅ | ✅ | UK | Yes — saves to workspace_settings.preferences_json | 5 | EXISTING — FIX-098 confirmed. Language/Preferences page created with language selector (22 locales), currency selector (12 currencies), date format selector (4 options), timezone selector (IANA), number format selector, live preview panel |
| I18N-WS-002 | /property-manager/workspace-settings/jurisdiction | Jurisdiction page | ✅ | ✅ | UK | Yes — /api/workspace/jurisdiction | 5 | EXISTING — full jurisdiction/locale/currency save flow already live |
| I18N-FMTS-001 | src/lib/i18n/format.ts | formatMoney / formatDate | ✅ | ✅ | N/A | formatMoney(amount, currency, locale) | 5 | EXISTING — full Intl.NumberFormat + Intl.DateTimeFormat formatters live; GBP/en-GB byte-identical to legacy moneyPence helper |
| I18N-FMTS-002 | src/lib/marketplace/money.ts | formatPence() | ✅ | N/A | N/A | formatPence(pence, currency) — uses Intl.NumberFormat en-GB | 5 | CONFIRMED — formatPence correctly uses Intl.NumberFormat with en-GB locale, handles null/undefined, supports multi-currency via code parameter |

---

## Raw £ Violations Found — Full Inventory (FIX-278)

The following files use raw `£${...}` or `"£" + x` instead of `formatPence()`. All produce correct en-GB output but are non-portable. **FIXED in this session** (FIX-278): 3 files. Remaining: deferred to follow-up refactor (PM internal only, correct UK output).

### FIXED (FIX-278)
| File | Line | Pattern | Fix Applied |
|------|------|---------|-------------|
| `src/components/public-marketplace/maps/StaysMapInner.tsx` | 39, 78 | `` £${price} `` in divIcon HTML and popup | Now uses `formatPence(pricePence)` — `createPricePin` now takes pence directly |
| `src/components/public-marketplace/maps/ServicesMapInner.tsx` | 26, 60, 111 | `` £${price} `` in divIcon HTML and popup | Now uses `formatPence(pricePence)` — `createServicePin` now takes pence directly |
| `src/features/customer/components/PropertyCard.tsx` | 22 | `` £${Math.round(pence/100).toLocaleString()} `` in `gbp()` helper | Now delegates to `formatPence(pence)` via shared util |

### Deferred (correct UK output, non-portable — PM internal only)
| File | Count | Pattern | Priority |
|------|-------|---------|----------|
| `src/app/(app)/app/money/bills/new/page.tsx` | 2 | `£${x.toLocaleString("en-GB",...)}` | Low — internal PM tool |
| `src/app/(app)/app/money/bills/[id]/page.tsx` | 5 | `£${x.toLocaleString()}` | Low |
| `src/app/(app)/app/money/deposits/page.tsx` | 5 | `£${x.toLocaleString("en-GB")}` | Low |
| `src/app/(app)/app/money/invoices/page.tsx` | 1 | `£${amount.toLocaleString("en-GB",...)}` | Low |
| `src/app/(app)/app/money/arrears/page.tsx` | 1 | `£${amount.toLocaleString(...)}` | Low |
| `src/app/(app)/app/money/escrow/page.tsx` | 2 | `` £${(v/1000).toFixed(0)}k `` in chart axis | Low — chart abbreviation |
| `src/app/(app)/app/money/bills/page.tsx` | 1 | `"-£" : "£"` prefix pattern | Low — negative/positive prefix |
| `src/app/(app)/app/legal/possession/new/*.tsx` + `possession/page.tsx` | 5 | `£${Number(n).toLocaleString("en-GB")}` | Low — correct UK legal copy |
| `src/app/(app)/app/accounting/client-accounts/disbursements/new/page.tsx` | 1 | `` £${parseFloat(amount)} `` | Low — from string input |
| `src/app/(app)/app/accounting/reconciliation/manual-transaction/new/page.tsx` | 3 | `£${lines.reduce(...).toFixed(2)}` | Low — subtotals from float arithmetic |
| `src/app/(app)/app/planning/sets/[id]/income/page.tsx` | 2 | `"£" + n/1000 + "k"` and `"£" + n.toLocaleString()` | Low — planning chart labels |
| `src/app/(app)/app/planning/sets/[id]/rooms-units/page.tsx` | 1 | `"£" + n.toLocaleString()` | Low |
| `src/app/(admin)/admin/ai-models/*.tsx`, `ai-usage/page.tsx` | 3 | `fmtCost()` local function | Low — admin internal |
| `src/app/(admin)/admin/coupon-codes/CouponCodesClient.tsx` | 2 | `£${(x/100).toFixed(2)}` | Low — admin internal |
| `src/features/customer/bookings/components/BookingsKpiStrip.tsx` | 1 | `` £${(totalPence/100).toLocaleString("en-GB")} `` | Low — static demo; tracked under data-honesty |
| `src/components/contacts/contact-detail/ContactRightRail.tsx` | 1 | `"£" + contact.arrears.toLocaleString("en-GB")` | Low — arrears display |

---

## QA Protocol for I18N / Currency

1. Verify all GBP amounts render as `£X,XXX.XX` — no raw numbers without currency symbol.
2. Verify all dates render as `DD/MM/YYYY` throughout the PM workspace (not US format).
3. For routes with legal copy (compliance, tenancy agreements, legal section): confirm UK-specific terminology (tenancy vs. lease, Section 21, EPC, etc.).
4. When `multiCountryPortfolio` flag is ON: set a property to a non-GBP country, confirm currency on that property's detail page switches.
5. Check that workspace-level currency setting (if implemented) propagates to all child routes.
6. Confirm no hardcoded `$` or `USD` symbols appear in the UI for UK workspaces.
7. Check number formatting: thousand separators use commas (1,234.56), not periods (1.234,56).
