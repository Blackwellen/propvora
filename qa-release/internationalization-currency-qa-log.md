# Internationalisation & Currency QA Log

## FIX-287 — Enterprise i18n Supabase hardening (2026-06-21)

### Overview
Full end-to-end wiring of i18n preferences to Supabase. `workspace.settings` JSONB is now the single source of truth for currency, locale, dateFormat, timezone. Server action saves to DB. Client hooks read from AuthProvider (no extra API call). Count badges wired to tab navs.

### Files Changed
| File | Change |
|------|--------|
| `src/providers/AuthProvider.tsx` | Added `settings` to workspace Supabase select + Workspace type |
| `src/app/(app)/app/workspace-settings/preferences/page.tsx` | NEW — i18n preferences form (currency, locale, dateFormat, timezone) |
| `src/app/(app)/app/workspace-settings/preferences/actions.ts` | NEW — `saveI18nPreferences` server action writing to `workspaces.settings` |
| `src/app/(app)/app/workspace-settings/layout.tsx` | Added Preferences nav item |
| `src/hooks/useWorkspaceJurisdiction.ts` | NEW — reads from workspace.settings via AuthProvider (no API call) |
| `src/hooks/useFormatCurrency.ts` | NEW — `useFormatCurrency()` hook using workspace currency |
| `src/components/compliance/ComplianceTabNav.tsx` | Added `counts?: Record<string,number>` prop + badge rendering |
| `src/components/money/MoneyTabNav.tsx` | Added `counts?: Record<string,number>` prop + badge rendering |
| `src/components/legal/LegalTabNav.tsx` | Added `counts?: Record<string,number>` prop + badge rendering |

### Wiring Status
| Item | Status |
|------|--------|
| `workspace.settings` column | LIVE DATA (exists in 001_core_schema.sql) |
| `workspace.settings` in AuthProvider select | LIVE DATA |
| `saveI18nPreferences` server action | LIVE DATA — writes to `workspaces.settings` |
| Preferences page form | LIVE DATA |
| `useWorkspaceJurisdiction` hook | LIVE DATA — reads from workspace.settings |
| `useFormatCurrency` hook | LIVE DATA — uses workspace.settings.currency |
| ComplianceTabNav count badges | WIRED (accepts counts prop, ready for real data) |
| MoneyTabNav count badges | WIRED (accepts counts prop, ready for real data) |
| LegalTabNav count badges | WIRED (accepts counts prop, ready for real data) |
| TypeScript | CLEAN (tsc --noEmit exit 0) |

### Score Change
| Area | Before | After |
|------|--------|-------|
| i18n preferences persistence | 1 (broken/not saved) | 4 (live save, minor: URL tab not yet wired) |
| Currency display hook | 2 (hardcoded GBP) | 4 (useFormatCurrency, workspace-aware) |
| Tab badge counts | 0 (not implemented) | 3 (wired, data feeding pending per page) |

---

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
