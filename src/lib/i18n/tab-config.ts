// Country-specific tab configuration.
// Defines which tabs are visible, their labels, and their order per section per jurisdiction.

export type SectionName = 'compliance' | 'money' | 'portfolio' | 'legal' | 'work' | 'planning'

export interface TabDef {
  key: string
  label: string
  description?: string
  /** Tab is only shown for these country codes. If empty/omitted, shown for all. */
  onlyFor?: string[]
  /** Tab is hidden for these country codes. */
  hiddenFor?: string[]
  /** Order weight — lower = earlier */
  order: number
}

// ── Compliance tabs ────────────────────────────────────────────────────────────
export const COMPLIANCE_TABS: TabDef[] = [
  // Universal
  { key: 'overview',       label: 'Overview',              order: 0 },
  { key: 'certificates',   label: 'Certificates',          order: 1 },
  { key: 'inspections',    label: 'Inspections',           order: 2 },
  { key: 'evidence',       label: 'Evidence',              order: 3 },
  { key: 'coverage',       label: 'Coverage',              order: 4 },
  { key: 'supplier-docs',  label: 'Supplier Docs',         order: 5 },
  { key: 'documents',      label: 'Documents',             order: 6 },
  { key: 'reports',        label: 'Reports',               order: 7 },

  // UK-only
  { key: 'gas_safety',     label: 'Gas Safety (CP12)',     order: 10, onlyFor: ['GB'] },
  { key: 'eicr',           label: 'EICR',                  order: 11, onlyFor: ['GB'] },
  { key: 'epc',            label: 'EPC',                   order: 12, onlyFor: ['GB'] },
  { key: 'right_to_rent',  label: 'Right to Rent',         order: 13, onlyFor: ['GB'] },
  { key: 'hmo_licensing',  label: 'HMO Licensing',         order: 14, onlyFor: ['GB'] },
  { key: 'deposit_protection', label: 'Deposit Protection', order: 15, onlyFor: ['GB'] },
  { key: 'fire_safety',    label: 'Fire Safety',           order: 16, onlyFor: ['GB'] },
  { key: 'legionella',     label: 'Legionella',            order: 17, onlyFor: ['GB'] },

  // England & Wales specific (subset of GB)
  { key: 'section21_tracker', label: 'Section 21 Tracker', order: 20, onlyFor: ['GB'] },
  { key: 'section8_tracker',  label: 'Section 8 Tracker',  order: 21, onlyFor: ['GB'] },

  // USA
  { key: 'fair_housing',    label: 'Fair Housing',         order: 10, onlyFor: ['US'] },
  { key: 'habitability',    label: 'Habitability',         order: 11, onlyFor: ['US'] },
  { key: 'lead_paint',      label: 'Lead Paint',           order: 12, onlyFor: ['US'] },
  { key: 'smoke_co_us',     label: 'Smoke & CO',           order: 13, onlyFor: ['US'] },
  { key: 'security_deposit_us', label: 'Security Deposits', order: 14, onlyFor: ['US'] },
  { key: 'rent_control_us', label: 'Rent Control',         order: 15, onlyFor: ['US', 'CA', 'DE'] },

  // Australia
  { key: 'bond_lodgement',  label: 'Bond Lodgement',       order: 10, onlyFor: ['AU'] },
  { key: 'smoke_alarms_au', label: 'Smoke Alarms',         order: 11, onlyFor: ['AU'] },
  { key: 'pool_safety_au',  label: 'Pool Safety',          order: 12, onlyFor: ['AU'] },
  { key: 'gas_appliances_au', label: 'Gas Appliances',     order: 13, onlyFor: ['AU'] },

  // Germany
  { key: 'heizung',         label: 'Heizungscheck',        order: 10, onlyFor: ['DE'] },
  { key: 'nebenkostenabrechnung', label: 'Betriebskosten', order: 11, onlyFor: ['DE'] },
  { key: 'rauchmelder',     label: 'Rauchwarnmelder',      order: 12, onlyFor: ['DE'] },
  { key: 'mietrecht',       label: 'Mietrecht',            order: 13, onlyFor: ['DE'] },

  // UAE
  { key: 'ejari',           label: 'Ejari Registration',   order: 10, onlyFor: ['AE'] },
  { key: 'dewa',            label: 'DEWA',                 order: 11, onlyFor: ['AE'] },
  { key: 'trakheesi',       label: 'Trakheesi',            order: 12, onlyFor: ['AE'] },

  // Canada
  { key: 'fire_safety_ca',  label: 'Fire Safety',          order: 10, onlyFor: ['CA'] },
  { key: 'smoke_co_ca',     label: 'Smoke & CO',           order: 11, onlyFor: ['CA'] },
]

// ── Money tabs ─────────────────────────────────────────────────────────────────
export const MONEY_TABS: TabDef[] = [
  // Universal core
  { key: 'overview',      label: 'Overview',               order: 0 },
  { key: 'income',        label: 'Income',                 order: 1 },
  { key: 'expenses',      label: 'Expenses',               order: 2 },
  { key: 'invoices',      label: 'Invoices',               order: 3 },
  { key: 'bills',         label: 'Bills',                  order: 4 },
  { key: 'escrow',        label: 'Escrow',                 order: 5 },
  { key: 'commissions',   label: 'Commissions',            order: 6 },
  { key: 'payouts',       label: 'Payouts',                order: 7 },
  { key: 'refunds',       label: 'Refunds',                order: 8 },
  { key: 'disputes',      label: 'Disputes',               order: 9 },

  // UK
  { key: 'arrears',       label: 'Arrears',                order: 10, onlyFor: ['GB'] },
  { key: 'deposits',      label: 'Deposits',               order: 11, onlyFor: ['GB'] },
  { key: 'holds',         label: 'Holds',                  order: 12, onlyFor: ['GB'] },
  { key: 'rent-chase',    label: 'Rent Chase',             order: 13, onlyFor: ['GB'] },
  { key: 'service_charges', label: 'Service Charges',      order: 14, onlyFor: ['GB'] },

  // USA
  { key: 'rent_roll_us',  label: 'Rent Roll',              order: 10, onlyFor: ['US'] },
  { key: 'late_fees',     label: 'Late Fees',              order: 11, onlyFor: ['US'] },
  { key: 'security_deposits_us', label: 'Security Deposits', order: 12, onlyFor: ['US'] },
  { key: 'operating_expenses', label: 'Operating Expenses', order: 13, onlyFor: ['US'] },

  // Australia
  { key: 'rent_roll_au',  label: 'Rent Roll',              order: 10, onlyFor: ['AU'] },
  { key: 'bond_au',       label: 'Bond',                   order: 11, onlyFor: ['AU'] },
  { key: 'outgoings',     label: 'Outgoings',              order: 12, onlyFor: ['AU'] },
  { key: 'pm_fees',       label: 'PM Fees',                order: 13, onlyFor: ['AU'] },

  // Germany
  { key: 'miete',         label: 'Miete',                  order: 10, onlyFor: ['DE'] },
  { key: 'kaution',       label: 'Kaution',                order: 11, onlyFor: ['DE'] },
  { key: 'betriebskosten', label: 'Betriebskosten',        order: 12, onlyFor: ['DE'] },
  { key: 'nebenkostenabrechnung_money', label: 'Nebenkostenabrechnung', order: 13, onlyFor: ['DE'] },

  // UAE
  { key: 'rent_cheques',  label: 'Rent Cheques',           order: 10, onlyFor: ['AE'] },
  { key: 'security_deposit_ae', label: 'Security Deposit', order: 11, onlyFor: ['AE'] },
  { key: 'service_charges_ae', label: 'Service Charges',   order: 12, onlyFor: ['AE'] },

  // Canada
  { key: 'rent_ca',       label: 'Rent',                   order: 10, onlyFor: ['CA'] },
  { key: 'deposits_ca',   label: 'Deposits',               order: 11, onlyFor: ['CA'] },
]

// ── Portfolio tabs (per-property view) ────────────────────────────────────────
export const PORTFOLIO_TABS: TabDef[] = [
  { key: 'overview',      label: 'Overview',               order: 0 },
  { key: 'units',         label: 'Units',                  order: 1 },
  { key: 'finances',      label: 'Finances',               order: 5 },
  { key: 'compliance',    label: 'Compliance',             order: 6 },
  { key: 'documents',     label: 'Documents',              order: 7 },
  { key: 'contacts',      label: 'Contacts',               order: 8 },
  { key: 'work',          label: 'Work',                   order: 9 },
  { key: 'activity',      label: 'Activity',               order: 10 },
  { key: 'map',           label: 'Map',                    order: 11 },

  // UK
  { key: 'tenancies',     label: 'Tenancies',              order: 2, onlyFor: ['GB'] },
  { key: 'hmo',           label: 'HMO Details',            order: 3, onlyFor: ['GB'] },

  // USA
  { key: 'leases_us',     label: 'Leases',                 order: 2, onlyFor: ['US'] },
  { key: 'fair_housing_us', label: 'Fair Housing',         order: 3, onlyFor: ['US'] },

  // Australia
  { key: 'tenancy_agreements', label: 'Tenancy Agreements', order: 2, onlyFor: ['AU'] },
  { key: 'bond_au_prop',  label: 'Bond',                   order: 3, onlyFor: ['AU'] },

  // Germany
  { key: 'mietvertraege', label: 'Mietverträge',           order: 2, onlyFor: ['DE'] },
  { key: 'betriebskosten_prop', label: 'Betriebskosten',   order: 3, onlyFor: ['DE'] },

  // UAE
  { key: 'tenancy_contracts', label: 'Tenancy Contracts',  order: 2, onlyFor: ['AE'] },
  { key: 'ejari_prop',    label: 'Ejari',                  order: 3, onlyFor: ['AE'] },

  // Canada
  { key: 'tenancies_ca',  label: 'Tenancies',              order: 2, onlyFor: ['CA'] },
]

// ── Legal tabs ─────────────────────────────────────────────────────────────────
export const LEGAL_TABS: TabDef[] = [
  // Universal
  { key: 'overview',      label: 'Overview',               order: 0 },

  // UK (existing routes)
  { key: 'possession',    label: 'Possession',             order: 1, onlyFor: ['GB'] },
  { key: 'hmo-licences',  label: 'HMO Licences',           order: 2, onlyFor: ['GB'] },
  { key: 'epc-advisory',  label: 'EPC Advisory',           order: 3, onlyFor: ['GB'] },
  { key: 'rra-2026',      label: 'RRA 2026',               order: 4, onlyFor: ['GB'] },

  // USA
  { key: 'eviction_us',   label: 'Eviction Notices',       order: 1, onlyFor: ['US'] },
  { key: 'court_us',      label: 'Court Filings',          order: 2, onlyFor: ['US'] },
  { key: 'fair_housing_legal', label: 'Fair Housing',      order: 3, onlyFor: ['US'] },

  // Australia
  { key: 'termination_au', label: 'Termination Notices',   order: 1, onlyFor: ['AU'] },
  { key: 'tribunal_au',   label: 'State Tribunal',         order: 2, onlyFor: ['AU'] },

  // Germany
  { key: 'kuendigung',    label: 'Kündigung',              order: 1, onlyFor: ['DE'] },
  { key: 'mietgericht',   label: 'Amtsgericht',            order: 2, onlyFor: ['DE'] },

  // UAE
  { key: 'rental_dispute', label: 'Rental Dispute Centre', order: 1, onlyFor: ['AE'] },
  { key: 'rera_ae',       label: 'RERA',                   order: 2, onlyFor: ['AE'] },

  // Canada
  { key: 'ltb_ca',        label: 'LTB / RTB',              order: 1, onlyFor: ['CA'] },
]

/**
 * Filter tabs for the given country code — includes universal tabs + country-specific ones.
 */
export function getTabsForCountry(tabs: TabDef[], countryCode: string): TabDef[] {
  const code = countryCode.toUpperCase()
  return tabs
    .filter(t => {
      if (t.onlyFor && t.onlyFor.length > 0 && !t.onlyFor.includes(code)) return false
      if (t.hiddenFor && t.hiddenFor.includes(code)) return false
      return true
    })
    .sort((a, b) => a.order - b.order)
}
