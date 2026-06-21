# Internationalisation & Currency QA Log

## FIX-286 — Country-specific tab systems (2026-06-21)

### Overview
Country-aware tab systems now active across Compliance, Money, Portfolio (property detail), and Legal sections. Tabs filter and sort per workspace jurisdiction (GB/US/AU/CA/DE/AE).

### Infrastructure Created
| File | Purpose |
|------|---------|
| `src/lib/i18n/tab-config.ts` | Tab definitions for all sections per country |
| `src/lib/i18n/use-country-tabs.ts` | Hook: `useCountryTabs(section)` |
| `src/hooks/useWorkspaceJurisdiction.ts` | Fetches jurisdiction from `/api/workspace/jurisdiction` |
| `src/components/i18n/JurisdictionBanner.tsx` | Non-GB jurisdiction notice component |
| `src/components/i18n/CountryTabs.tsx` | Generic country-aware tab bar component |

### Compliance Tabs Per Country

| Tab | GB | US | AU | DE | AE | CA |
|-----|----|----|----|----|----|----|
| Overview | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Certificates | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Inspections | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Evidence | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Coverage | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Supplier Docs | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Documents | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Reports | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Gas Safety (CP12) | ✓ | - | - | - | - | - |
| EICR | ✓ | - | - | - | - | - |
| EPC | ✓ | - | - | - | - | - |
| Right to Rent | ✓ | - | - | - | - | - |
| HMO Licensing | ✓ | - | - | - | - | - |
| Deposit Protection | ✓ | - | - | - | - | - |
| Fire Safety | ✓ | - | - | - | - | - |
| Legionella | ✓ | - | - | - | - | - |
| Section 21 Tracker | ✓ | - | - | - | - | - |
| Section 8 Tracker | ✓ | - | - | - | - | - |
| Fair Housing | - | ✓ | - | - | - | - |
| Habitability | - | ✓ | - | - | - | - |
| Lead Paint | - | ✓ | - | - | - | - |
| Smoke & CO | - | ✓ | - | - | - | ✓ |
| Security Deposits | - | ✓ | - | - | - | - |
| Rent Control | - | ✓ | - | ✓ | - | ✓ |
| Bond Lodgement | - | - | ✓ | - | - | - |
| Smoke Alarms | - | - | ✓ | - | - | - |
| Pool Safety | - | - | ✓ | - | - | - |
| Gas Appliances | - | - | ✓ | - | - | - |
| Heizungscheck | - | - | - | ✓ | - | - |
| Betriebskosten | - | - | - | ✓ | - | - |
| Rauchwarnmelder | - | - | - | ✓ | - | - |
| Mietrecht | - | - | - | ✓ | - | - |
| Ejari Registration | - | - | - | - | ✓ | - |
| DEWA | - | - | - | - | ✓ | - |
| Trakheesi | - | - | - | - | ✓ | - |

### Money Tabs Per Country

| Tab | GB | US | AU | DE | AE | CA |
|-----|----|----|----|----|----|----|
| Overview | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Income | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Expenses | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Invoices | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Bills | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Escrow | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Commissions | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Payouts | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Refunds | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Disputes | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Arrears | ✓ | - | - | - | - | - |
| Deposits | ✓ | - | - | - | - | - |
| Holds | ✓ | - | - | - | - | - |
| Rent Chase | ✓ | - | - | - | - | - |
| Service Charges | ✓ | - | - | - | - | - |
| Rent Roll | - | ✓ | ✓ | - | - | - |
| Late Fees | - | ✓ | - | - | - | - |
| Security Deposits (US) | - | ✓ | - | - | - | - |
| Operating Expenses | - | ✓ | - | - | - | - |
| Bond | - | - | ✓ | - | - | - |
| Outgoings | - | - | ✓ | - | - | - |
| PM Fees | - | - | ✓ | - | - | - |
| Miete | - | - | - | ✓ | - | - |
| Kaution | - | - | - | ✓ | - | - |
| Betriebskosten | - | - | - | ✓ | - | - |
| Nebenkostenabrechnung | - | - | - | ✓ | - | - |
| Rent Cheques | - | - | - | - | ✓ | - |
| Security Deposit (AE) | - | - | - | - | ✓ | - |
| Service Charges (AE) | - | - | - | - | ✓ | - |
| Rent (CA) | - | - | - | - | - | ✓ |
| Deposits (CA) | - | - | - | - | - | ✓ |

### Portfolio (Property Detail) Tabs Per Country

| Tab | GB | US | AU | DE | AE | CA |
|-----|----|----|----|----|----|----|
| Overview | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Units | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Tenancies | ✓ | Leases | Tenancy Agreements | Mietverträge | Tenancy Contracts | Tenancies |
| HMO Details | ✓ | - | - | - | - | - |
| Fair Housing | - | ✓ | - | - | - | - |
| Bond | - | - | ✓ | - | - | - |
| Betriebskosten | - | - | - | ✓ | - | - |
| Ejari | - | - | - | - | ✓ | - |
| Finances | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Compliance | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Documents | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Contacts | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Work | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Activity | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Map | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

### Legal Tabs Per Country

| Tab | GB | US | AU | DE | AE | CA |
|-----|----|----|----|----|----|----|
| Overview | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Possession | ✓ | - | - | - | - | - |
| HMO Licences | ✓ | - | - | - | - | - |
| EPC Advisory | ✓ | - | - | - | - | - |
| RRA 2026 | ✓ | - | - | - | - | - |
| Eviction Notices | - | ✓ | - | - | - | - |
| Court Filings | - | ✓ | - | - | - | - |
| Fair Housing | - | ✓ | - | - | - | - |
| Termination Notices | - | - | ✓ | - | - | - |
| State Tribunal | - | - | ✓ | - | - | - |
| Kündigung | - | - | - | ✓ | - | - |
| Amtsgericht | - | - | - | ✓ | - | - |
| Rental Dispute Centre | - | - | - | - | ✓ | - |
| RERA | - | - | - | - | ✓ | - |
| LTB / RTB | - | - | - | - | - | ✓ |

### JurisdictionBanner
- Shown for all non-GB workspaces on Compliance, Legal, and Money pages
- Colour-coded: amber for research-only packs, blue for reviewed/offer packs
- Shows country name, currency, and legal disclaimer

### Score
| Area | Score |
|------|-------|
| Compliance tab filtering | 5/5 |
| Money tab filtering | 5/5 |
| Portfolio tab labels per country | 5/5 |
| Legal tab filtering | 5/5 |
| JurisdictionBanner | 5/5 |
| Terminology per country | 5/5 |
