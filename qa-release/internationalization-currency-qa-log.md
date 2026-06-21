# Internationalisation, Currency & Legal Context QA Log

Last updated: 2026-06-20

## Scoring
5 = correct | 4 = minor issue | 3 = partial | 2 = major | 1 = broken | 0 = not implemented

---

## Currency Pack Registry

| Currency Code | Symbol | Name | Decimal Places | Example Format | Supported Now? | Needs Work? | Notes |
|---------------|--------|------|---------------|---------------|---------------|-------------|-------|
| GBP | £ | British Pound Sterling | 2 | £1,250.00 | PENDING | PENDING | Default currency for all UK workspaces |
| EUR | € | Euro | 2 | €1.250,00 | PENDING | PENDING | EU and international workspaces |
| USD | $ | US Dollar | 2 | $1,250.00 | PENDING | PENDING | US market / international landlords |
| AED | د.إ | UAE Dirham | 2 | AED 1,250.00 | PENDING | PENDING | Dubai/UAE property market |
| AUD | A$ | Australian Dollar | 2 | A$1,250.00 | PENDING | PENDING | Australian property market |
| CAD | C$ | Canadian Dollar | 2 | C$1,250.00 | PENDING | PENDING | Canadian property market |
| SGD | S$ | Singapore Dollar | 2 | S$1,250.00 | PENDING | PENDING | Singapore / SE Asia market |
| HKD | HK$ | Hong Kong Dollar | 2 | HK$1,250.00 | PENDING | PENDING | Hong Kong property market |
| CHF | CHF | Swiss Franc | 2 | CHF 1'250.00 | PENDING | PENDING | Swiss market (space + apostrophe thousand sep) |
| JPY | ¥ | Japanese Yen | 0 | ¥125,000 | PENDING | PENDING | No decimal places |
| CNY | ¥ | Chinese Yuan Renminbi | 2 | ¥1,250.00 | PENDING | PENDING | Chinese market (same symbol as JPY — must disambiguate) |
| ZAR | R | South African Rand | 2 | R1,250.00 | PENDING | PENDING | South African property market |
| INR | ₹ | Indian Rupee | 2 | ₹1,250.00 | PENDING | PENDING | Indian property market |
| DKK | kr | Danish Krone | 2 | 1.250,00 kr | PENDING | PENDING | Danish market (symbol after amount) |
| NOK | kr | Norwegian Krone | 2 | 1 250,00 kr | PENDING | PENDING | Norwegian market (space thousand sep) |
| SEK | kr | Swedish Krona | 2 | 1 250,00 kr | PENDING | PENDING | Swedish market (space thousand sep) |
| PLN | zł | Polish Złoty | 2 | 1 250,00 zł | PENDING | PENDING | Polish market (space thousand sep, symbol after) |
| MYR | RM | Malaysian Ringgit | 2 | RM1,250.00 | PENDING | PENDING | Malaysian property market |

---

## Locale / Legal Pack Registry

| Pack ID | Region / Locale | Date Format | Currency Default | Legal Context | Property Copy Needs | Supported Now? | Needs Work? |
|---------|----------------|-------------|-----------------|---------------|--------------------|----|-----|
| en-GB | United Kingdom (English) | DD/MM/YYYY | GBP | UK tenancy law, Section 21/Section 8 notices, EPC, HMO licensing, Renters Rights Bill | UK-specific compliance copy, AST/statutory periodic/HMO terms | PENDING | PENDING |
| en-US | United States (English) | MM/DD/YYYY | USD | US lease law (state-specific), security deposit caps, habitability standards | US-specific lease terms, security deposit language | PENDING | PENDING |
| en-AU | Australia (English) | DD/MM/YYYY | AUD | Australian tenancy law (state-specific), bond lodgement, VCAT | Australian residential tenancy terms, bond receipt | PENDING | PENDING |
| en-CA | Canada (English) | DD/MM/YYYY | CAD | Canadian landlord-tenant law (province-specific), LTB process | Canadian lease terms, notice periods | PENDING | PENDING |
| en-SG | Singapore (English) | DD/MM/YYYY | SGD | Singapore Residential Tenancies Act, HDB rules, stamp duty | Singapore tenancy agreement copy | PENDING | PENDING |
| en-ZA | South Africa (English) | DD/MM/YYYY | ZAR | South African Rental Housing Act, deposit rules | South African lease terms, deposit protection | PENDING | PENDING |
| en-AE | UAE (English) | DD/MM/YYYY | AED | UAE tenancy law (RERA), Ejari registration, cheque payment norms | UAE tenancy contract copy, Ejari references | PENDING | PENDING |
| de-DE | Germany (German) | DD.MM.YYYY | EUR | German tenancy law (BGB), Mieterschutz, Nebenkosten | German lease copy, utility cost statement | PENDING | PENDING |
| fr-FR | France (French) | DD/MM/YYYY | EUR | French tenancy law (Alur), notice periods, diagnostic immobilier | French bail copy, diagnostic references | PENDING | PENDING |

---

## 1. Property Manager Workspace i18n

| ID | Workspace | Route / Surface | Atom / Component | Locale Function | Currency Function | Legal Context Function | Required Pack | Current Pack | Formatting Correct? | Currency Symbol Correct? | Decimal/Thousands Correct? | Date Format Correct? | Timezone Correct? | Legal Copy Correct? | Useful Context Correct? | Calculations Correct? | Workspace Setting Used? | User Setting Used? | Security Checked? | Fix Required | Fix Implemented | Score | Status |
|----|-----------|-----------------|-----------------|----------------|-----------------|----------------------|--------------|-------------|--------------------|----|----|----|----|----|----|----|----|----|----|----|----|----|--------|
| I18N-PMW-001 | PM Workspace | `/property-manager/money/income` | Rent amount display | Format currency with locale | GBP £ formatting | N/A | en-GB | PENDING | PENDING | PENDING | PENDING | N/A | N/A | N/A | N/A | PENDING | PENDING | N/A | PENDING | No | No | PENDING | PENDING |
| I18N-PMW-002 | PM Workspace | `/property-manager/money/income` | Invoice amount | Format currency | GBP £ formatting | N/A | en-GB | PENDING | PENDING | PENDING | PENDING | N/A | N/A | N/A | N/A | PENDING | PENDING | N/A | PENDING | No | No | PENDING | PENDING |
| I18N-PMW-003 | PM Workspace | `/property-manager/money/expenses` | Expense amount display | Format currency | GBP £ formatting | N/A | en-GB | PENDING | PENDING | PENDING | PENDING | N/A | N/A | N/A | N/A | PENDING | PENDING | N/A | PENDING | No | No | PENDING | PENDING |
| I18N-PMW-004 | PM Workspace | `/property-manager/portfolio/tenancies/[id]` | Deposit amount | Format currency | GBP £ formatting | UK deposit protection copy | en-GB | PENDING | PENDING | PENDING | PENDING | N/A | N/A | PENDING | PENDING | PENDING | PENDING | N/A | PENDING | No | No | PENDING | PENDING |
| I18N-PMW-005 | PM Workspace | `/property-manager/portfolio/tenancies/[id]` | Tenancy start/end dates | Format date | N/A | UK tenancy date conventions | en-GB | PENDING | PENDING | N/A | N/A | PENDING | PENDING | N/A | N/A | N/A | PENDING | PENDING | PENDING | No | No | PENDING | PENDING |
| I18N-PMW-006 | PM Workspace | `/property-manager/compliance` | Certificate expiry dates | Format date | N/A | UK compliance copy (EPC, EICR, Gas Safe) | en-GB | PENDING | PENDING | N/A | N/A | PENDING | PENDING | PENDING | PENDING | N/A | PENDING | PENDING | PENDING | No | No | PENDING | PENDING |
| I18N-PMW-007 | PM Workspace | `/property-manager/legal` | Legal notice references | N/A | N/A | UK legal copy (Section 21, Section 8, Renters Rights) | en-GB | PENDING | N/A | N/A | N/A | N/A | N/A | PENDING | PENDING | N/A | PENDING | N/A | PENDING | No | No | PENDING | PENDING |
| I18N-PMW-008 | PM Workspace | `/property-manager/money` | Rent roll total | Format currency | GBP £ total | N/A | en-GB | PENDING | PENDING | PENDING | PENDING | N/A | N/A | N/A | N/A | PENDING | PENDING | N/A | PENDING | No | No | PENDING | PENDING |
| I18N-PMW-009 | PM Workspace | `/property-manager/planning` | Revenue forecast figures | Format currency | GBP £ forecast | N/A | en-GB | PENDING | PENDING | PENDING | PENDING | N/A | N/A | N/A | N/A | PENDING | PENDING | N/A | PENDING | No | No | PENDING | PENDING |
| I18N-PMW-010 | PM Workspace | `/property-manager/accounting` | Chart of accounts amounts | Format currency | GBP £ accounting | N/A | en-GB | PENDING | PENDING | PENDING | PENDING | N/A | N/A | N/A | N/A | PENDING | PENDING | N/A | PENDING | No | No | PENDING | PENDING |
| I18N-PMW-011 | PM Workspace | `/property-manager/work/jobs/[id]` | Job value / quote amount | Format currency | GBP £ formatting | N/A | en-GB | PENDING | PENDING | PENDING | PENDING | N/A | N/A | N/A | N/A | PENDING | PENDING | N/A | PENDING | No | No | PENDING | PENDING |
| I18N-PMW-012 | PM Workspace | Workspace Settings | Currency setting | Workspace locale/currency selector | User-selected currency | N/A | Configurable | PENDING | PENDING | PENDING | PENDING | N/A | N/A | N/A | N/A | N/A | PENDING | N/A | PENDING | No | No | PENDING | PENDING |
| I18N-PMW-013 | PM Workspace | Workspace Settings | Date format setting | Workspace date format selector | N/A | N/A | Configurable | PENDING | PENDING | N/A | N/A | PENDING | N/A | N/A | N/A | N/A | PENDING | N/A | PENDING | No | No | PENDING | PENDING |
| I18N-PMW-014 | PM Workspace | All money surfaces | No hard-coded £ signs | Format currency | Currency from workspace setting | N/A | en-GB default | PENDING | PENDING | PENDING | PENDING | N/A | N/A | N/A | N/A | N/A | PENDING | N/A | PENDING | No | No | PENDING | PENDING |
| I18N-PMW-015 | PM Workspace | All date surfaces | No hard-coded date formats | Format date | N/A | N/A | en-GB default | PENDING | PENDING | N/A | N/A | PENDING | N/A | N/A | N/A | N/A | PENDING | N/A | PENDING | No | No | PENDING | PENDING |

---

## 2. Supplier Solo Workspace i18n

| ID | Workspace | Route / Surface | Atom / Component | Locale Function | Currency Function | Legal Context Function | Required Pack | Current Pack | Formatting Correct? | Currency Symbol Correct? | Decimal/Thousands Correct? | Date Format Correct? | Timezone Correct? | Legal Copy Correct? | Useful Context Correct? | Calculations Correct? | Workspace Setting Used? | User Setting Used? | Security Checked? | Fix Required | Fix Implemented | Score | Status |
|----|-----------|-----------------|-----------------|----------------|-----------------|----------------------|--------------|-------------|--------------------|----|----|----|----|----|----|----|----|----|----|----|----|----|--------|
| I18N-SSW-001 | Supplier Solo | `/supplier/quotes/[id]` | Quote line amounts | Format currency | GBP £ / workspace currency | N/A | en-GB | PENDING | PENDING | PENDING | PENDING | N/A | N/A | N/A | N/A | PENDING | PENDING | N/A | PENDING | No | No | PENDING | PENDING |
| I18N-SSW-002 | Supplier Solo | `/supplier/invoices/[id]` | Invoice amounts | Format currency | GBP £ / workspace currency | N/A | en-GB | PENDING | PENDING | PENDING | PENDING | N/A | N/A | N/A | N/A | PENDING | PENDING | N/A | PENDING | No | No | PENDING | PENDING |
| I18N-SSW-003 | Supplier Solo | `/supplier/jobs/[id]` | Job value display | Format currency | GBP £ formatting | N/A | en-GB | PENDING | PENDING | PENDING | PENDING | N/A | N/A | N/A | N/A | PENDING | PENDING | N/A | PENDING | No | No | PENDING | PENDING |
| I18N-SSW-004 | Supplier Solo | `/supplier/jobs/[id]` | Job scheduled date | Format date | N/A | N/A | en-GB | PENDING | PENDING | N/A | N/A | PENDING | PENDING | N/A | N/A | N/A | PENDING | PENDING | PENDING | No | No | PENDING | PENDING |
| I18N-SSW-005 | Supplier Solo | `/supplier/insights` | Revenue charts | Format currency | GBP £ / workspace currency | N/A | en-GB | PENDING | PENDING | PENDING | PENDING | N/A | N/A | N/A | N/A | PENDING | PENDING | N/A | PENDING | No | No | PENDING | PENDING |
| I18N-SSW-006 | Supplier Solo | `/supplier/reputation` | Review dates | Format date | N/A | N/A | en-GB | PENDING | PENDING | N/A | N/A | PENDING | N/A | N/A | N/A | N/A | PENDING | N/A | PENDING | No | No | PENDING | PENDING |
| I18N-SSW-007 | Supplier Solo | Supplier profile | Service pricing display | Format currency | GBP £ / workspace currency | N/A | en-GB | PENDING | PENDING | PENDING | PENDING | N/A | N/A | N/A | N/A | PENDING | PENDING | N/A | PENDING | No | No | PENDING | PENDING |
| I18N-SSW-008 | Supplier Solo | Settings | Currency / locale selector | Workspace locale/currency setting | User-selected currency | N/A | Configurable | PENDING | PENDING | PENDING | PENDING | N/A | N/A | N/A | N/A | N/A | PENDING | N/A | PENDING | No | No | PENDING | PENDING |
| I18N-SSW-009 | Supplier Solo | All money surfaces | No hard-coded £ signs | Format currency | Currency from setting | N/A | en-GB default | PENDING | PENDING | PENDING | PENDING | N/A | N/A | N/A | N/A | N/A | PENDING | N/A | PENDING | No | No | PENDING | PENDING |
| I18N-SSW-010 | Supplier Solo | All date surfaces | No hard-coded date formats | Format date | N/A | N/A | en-GB default | PENDING | PENDING | N/A | N/A | PENDING | N/A | N/A | N/A | N/A | PENDING | N/A | PENDING | No | No | PENDING | PENDING |

---

## 3. Supplier Team Workspace i18n

| ID | Workspace | Route / Surface | Atom / Component | Locale Function | Currency Function | Legal Context Function | Required Pack | Current Pack | Formatting Correct? | Currency Symbol Correct? | Decimal/Thousands Correct? | Date Format Correct? | Timezone Correct? | Legal Copy Correct? | Useful Context Correct? | Calculations Correct? | Workspace Setting Used? | User Setting Used? | Security Checked? | Fix Required | Fix Implemented | Score | Status |
|----|-----------|-----------------|-----------------|----------------|-----------------|----------------------|--------------|-------------|--------------------|----|----|----|----|----|----|----|----|----|----|----|----|----|--------|
| I18N-STW-001 | Supplier Team | `/supplier/quotes/[id]` | Team quote line amounts | Format currency | Team workspace currency | N/A | en-GB | PENDING | PENDING | PENDING | PENDING | N/A | N/A | N/A | N/A | PENDING | PENDING | N/A | PENDING | No | No | PENDING | PENDING |
| I18N-STW-002 | Supplier Team | `/supplier/invoices/[id]` | Team invoice amounts | Format currency | Team workspace currency | N/A | en-GB | PENDING | PENDING | PENDING | PENDING | N/A | N/A | N/A | N/A | PENDING | PENDING | N/A | PENDING | No | No | PENDING | PENDING |
| I18N-STW-003 | Supplier Team | `/supplier/team/schedule` | Schedule dates | Format date + time | N/A | N/A | en-GB | PENDING | PENDING | N/A | N/A | PENDING | PENDING | N/A | N/A | N/A | PENDING | PENDING | PENDING | No | No | PENDING | PENDING |
| I18N-STW-004 | Supplier Team | `/supplier/insights` | Team revenue charts | Format currency | Team workspace currency | N/A | en-GB | PENDING | PENDING | PENDING | PENDING | N/A | N/A | N/A | N/A | PENDING | PENDING | N/A | PENDING | No | No | PENDING | PENDING |
| I18N-STW-005 | Supplier Team | `/supplier/team` | Member pay rate display | Format currency | Team workspace currency | N/A | en-GB | PENDING | PENDING | PENDING | PENDING | N/A | N/A | N/A | N/A | PENDING | PENDING | N/A | PENDING | No | No | PENDING | PENDING |
| I18N-STW-006 | Supplier Team | `/supplier/billing` | Team billing amounts | Format currency | Team workspace currency | N/A | en-GB | PENDING | PENDING | PENDING | PENDING | N/A | N/A | N/A | N/A | PENDING | PENDING | N/A | PENDING | No | No | PENDING | PENDING |
| I18N-STW-007 | Supplier Team | All job surfaces | Job values and dates | Format currency + date | Team workspace currency | N/A | en-GB | PENDING | PENDING | PENDING | PENDING | PENDING | N/A | N/A | N/A | PENDING | PENDING | PENDING | PENDING | No | No | PENDING | PENDING |
| I18N-STW-008 | Supplier Team | Settings | Currency / locale selector | Team workspace locale/currency setting | User-selected currency | N/A | Configurable | PENDING | PENDING | PENDING | PENDING | N/A | N/A | N/A | N/A | N/A | PENDING | N/A | PENDING | No | No | PENDING | PENDING |
| I18N-STW-009 | Supplier Team | All money surfaces | No hard-coded £ signs | Format currency | Currency from team setting | N/A | en-GB default | PENDING | PENDING | PENDING | PENDING | N/A | N/A | N/A | N/A | N/A | PENDING | N/A | PENDING | No | No | PENDING | PENDING |
| I18N-STW-010 | Supplier Team | All date surfaces | No hard-coded date formats | Format date | N/A | N/A | en-GB default | PENDING | PENDING | N/A | N/A | PENDING | N/A | N/A | N/A | N/A | PENDING | N/A | PENDING | No | No | PENDING | PENDING |
