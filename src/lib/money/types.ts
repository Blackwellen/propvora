// Income types
export type IncomeType =
  | 'rent' | 'deposit_received' | 'holding_deposit' | 'service_charge'
  | 'utility_recharge' | 'cleaning_recharge' | 'management_fee'
  | 'referral_income' | 'other_income' | 'adjustment'

// Expense types
export type ExpenseType =
  | 'maintenance' | 'repair' | 'renovation' | 'cleaning' | 'utilities'
  | 'council_tax' | 'insurance' | 'broadband' | 'service_charge'
  | 'ground_rent' | 'landlord_rent' | 'mortgage_payment' | 'professional_fees'
  | 'management_fees' | 'marketing' | 'compliance' | 'supplies' | 'other'

// Cost behaviour
export type CostBehaviour =
  | 'fixed' | 'variable' | 'semi_variable' | 'one_off' | 'recurring'
  | 'capital_renovation' | 'repair_maintenance'

// Invoice types
export type InvoiceType =
  | 'tenant_invoice' | 'rent_invoice' | 'supplier_recharge' | 'landlord_charge'
  | 'service_charge_invoice' | 'utility_recharge_invoice' | 'cleaning_recharge_invoice'
  | 'affiliate_invoice' | 'other'

// Invoice statuses
export type InvoiceStatus =
  | 'draft' | 'planned' | 'scheduled' | 'sent' | 'viewed' | 'due' | 'overdue'
  | 'part_paid' | 'paid' | 'disputed' | 'cancelled' | 'reconciled'

// Income statuses
export type IncomeStatus =
  | 'expected' | 'planned' | 'invoiced' | 'due' | 'received' | 'part_received'
  | 'overdue' | 'cancelled' | 'reconciled'

// Expense statuses
export type ExpenseStatus =
  | 'planned' | 'due' | 'approved' | 'paid' | 'part_paid' | 'overdue'
  | 'disputed' | 'cancelled' | 'reconciled'

// Bill types
export type BillType =
  | 'supplier_invoice' | 'maintenance_bill' | 'utility_bill' | 'insurance_bill'
  | 'professional_fee' | 'landlord_rent_bill' | 'mortgage_payment' | 'renovation_bill'
  | 'compliance_bill' | 'other'

// Bill statuses
export type BillStatus =
  | 'draft' | 'received' | 'awaiting_review' | 'approved' | 'scheduled_for_payment'
  | 'paid' | 'part_paid' | 'overdue' | 'disputed' | 'rejected' | 'cancelled' | 'reconciled'

// Arrears statuses
export type ArrearsStatus =
  | 'open' | 'chasing' | 'payment_plan' | 'part_paid' | 'resolved' | 'written_off' | 'disputed'

// Deposit types
export type DepositType =
  | 'tenant_deposit' | 'holding_deposit' | 'landlord_deposit'
  | 'rent_to_rent_landlord_deposit' | 'supplier_deposit' | 'reservation_deposit' | 'other'

// Deposit statuses
export type DepositStatus =
  | 'expected' | 'received' | 'protected' | 'held_by_third_party'
  | 'paid_to_landlord' | 'returned' | 'part_returned' | 'deducted' | 'disputed' | 'cancelled'

// Portal statuses
export type StripeConnectionStatus =
  | 'not_connected' | 'onboarding' | 'active' | 'restricted' | 'test_mode' | 'disabled'

// Affiliate commission statuses
export type AffiliateCommissionStatus =
  | 'pending' | 'approved' | 'payable' | 'paid' | 'held' | 'reversed' | 'cancelled'

// Debt statuses
export type DebtStatus =
  | 'active' | 'review_due' | 'refinance_watch' | 'paid_off' | 'archived'

// Forecast statuses
export type ForecastStatus = 'forecast' | 'planned' | 'confirmed' | 'actual' | 'ignored'

// Reconciliation statuses
export type ReconciliationStatus =
  | 'unmatched' | 'suggested_match' | 'matched' | 'ignored' | 'needs_review' | 'reconciled'

export const INVOICE_STATUS_CONFIG: Record<InvoiceStatus, { label: string; colour: string; bg: string }> = {
  draft:      { label: 'Draft',      colour: 'text-slate-600',   bg: 'bg-slate-100' },
  planned:    { label: 'Planned',    colour: 'text-violet-600',  bg: 'bg-violet-50' },
  scheduled:  { label: 'Scheduled',  colour: 'text-violet-600',  bg: 'bg-violet-50' },
  sent:       { label: 'Sent',       colour: 'text-blue-600',    bg: 'bg-blue-50' },
  viewed:     { label: 'Viewed',     colour: 'text-blue-600',    bg: 'bg-blue-50' },
  due:        { label: 'Due',        colour: 'text-amber-600',   bg: 'bg-amber-50' },
  overdue:    { label: 'Overdue',    colour: 'text-red-600',     bg: 'bg-red-50' },
  part_paid:  { label: 'Part Paid',  colour: 'text-amber-600',   bg: 'bg-amber-50' },
  paid:       { label: 'Paid',       colour: 'text-emerald-600', bg: 'bg-emerald-50' },
  disputed:   { label: 'Disputed',   colour: 'text-red-600',     bg: 'bg-red-50' },
  cancelled:  { label: 'Cancelled',  colour: 'text-slate-500',   bg: 'bg-slate-100' },
  reconciled: { label: 'Reconciled', colour: 'text-emerald-700', bg: 'bg-emerald-50' },
}

export const BILL_STATUS_CONFIG: Record<BillStatus, { label: string; colour: string; bg: string }> = {
  draft:                 { label: 'Draft',           colour: 'text-slate-600',   bg: 'bg-slate-100' },
  received:              { label: 'Received',        colour: 'text-blue-600',    bg: 'bg-blue-50' },
  awaiting_review:       { label: 'Awaiting Review', colour: 'text-amber-600',   bg: 'bg-amber-50' },
  approved:              { label: 'Approved',        colour: 'text-emerald-600', bg: 'bg-emerald-50' },
  scheduled_for_payment: { label: 'Scheduled',       colour: 'text-violet-600',  bg: 'bg-violet-50' },
  paid:                  { label: 'Paid',            colour: 'text-emerald-600', bg: 'bg-emerald-50' },
  part_paid:             { label: 'Part Paid',       colour: 'text-amber-600',   bg: 'bg-amber-50' },
  overdue:               { label: 'Overdue',         colour: 'text-red-600',     bg: 'bg-red-50' },
  disputed:              { label: 'Disputed',        colour: 'text-red-600',     bg: 'bg-red-50' },
  rejected:              { label: 'Rejected',        colour: 'text-red-600',     bg: 'bg-red-50' },
  cancelled:             { label: 'Cancelled',       colour: 'text-slate-500',   bg: 'bg-slate-100' },
  reconciled:            { label: 'Reconciled',      colour: 'text-emerald-700', bg: 'bg-emerald-50' },
}

export const ARREARS_STATUS_CONFIG: Record<ArrearsStatus, { label: string; colour: string; bg: string }> = {
  open:         { label: 'Open',         colour: 'text-red-600',     bg: 'bg-red-50' },
  chasing:      { label: 'Chasing',      colour: 'text-amber-600',   bg: 'bg-amber-50' },
  payment_plan: { label: 'Payment Plan', colour: 'text-violet-600',  bg: 'bg-violet-50' },
  part_paid:    { label: 'Part Paid',    colour: 'text-amber-600',   bg: 'bg-amber-50' },
  resolved:     { label: 'Resolved',     colour: 'text-emerald-600', bg: 'bg-emerald-50' },
  written_off:  { label: 'Written Off',  colour: 'text-slate-500',   bg: 'bg-slate-100' },
  disputed:     { label: 'Disputed',     colour: 'text-red-600',     bg: 'bg-red-50' },
}

export const INCOME_TYPE_LABELS: Record<IncomeType, string> = {
  rent: 'Rent', deposit_received: 'Deposit Received', holding_deposit: 'Holding Deposit',
  service_charge: 'Service Charge', utility_recharge: 'Utility Recharge',
  cleaning_recharge: 'Cleaning Recharge', management_fee: 'Management Fee',
  referral_income: 'Referral / Affiliate Income', other_income: 'Other Income',
  adjustment: 'Adjustment',
}

export const EXPENSE_TYPE_LABELS: Record<ExpenseType, string> = {
  maintenance: 'Maintenance', repair: 'Repair', renovation: 'Renovation', cleaning: 'Cleaning',
  utilities: 'Utilities', council_tax: 'Council Tax', insurance: 'Insurance',
  broadband: 'Broadband / Telecoms', service_charge: 'Service Charge', ground_rent: 'Ground Rent',
  landlord_rent: 'Landlord Rent', mortgage_payment: 'Mortgage / Debt Payment',
  professional_fees: 'Professional Fees', management_fees: 'Management Fees',
  marketing: 'Marketing', compliance: 'Compliance', supplies: 'Supplies', other: 'Other',
}

export const COST_BEHAVIOUR_LABELS: Record<CostBehaviour, string> = {
  fixed: 'Fixed Cost', variable: 'Variable Cost', semi_variable: 'Semi-Variable Cost',
  one_off: 'One-off Cost', recurring: 'Recurring Cost',
  capital_renovation: 'Capital / Renovation', repair_maintenance: 'Repair / Maintenance',
}

export const DEPOSIT_TYPE_LABELS: Record<DepositType, string> = {
  tenant_deposit: 'Tenant Deposit', holding_deposit: 'Holding Deposit',
  landlord_deposit: 'Landlord Deposit', rent_to_rent_landlord_deposit: 'Rent-to-Rent Landlord Deposit',
  supplier_deposit: 'Supplier Deposit', reservation_deposit: 'Reservation Deposit', other: 'Other',
}
