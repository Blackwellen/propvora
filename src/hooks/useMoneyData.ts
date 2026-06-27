'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useNotify } from '@/hooks/useNotify'
import { formatCurrency } from '@/lib/utils'

// ─────────────────────────────────────────────
// Real-table rewire (live schema)
// ─────────────────────────────────────────────
// The Money section was originally built against `money_*` tables that do not
// exist in the live DB (every query 42P01'd). This hook layer now maps each
// page-facing row/insert shape onto the REAL live tables and columns:
//   income     -> money_transactions (direction = 'in')   [no income table]
//   expenses   -> expense_records
//   invoices   -> invoices (+ invoice_lines)
//   bills      -> bills (single `status` column)
//   arrears    -> arrears_records
//   deposits   -> deposits
//   forecasts  -> money_forecast_records
//   activity   -> money_transactions (the ledger)
//   transactions -> money_transactions
//   reports / scheduled reports / reconciliation imports / payment settings
//                -> NO live table; queries are 42P01-safe and return empty.
// All page-facing TypeScript types below are unchanged so consuming pages keep
// compiling; mapping happens inside each hook.

const TABLE_MISSING = '42P01'

function isMissingTable(error: unknown): boolean {
  return (error as { code?: string } | null)?.code === TABLE_MISSING
}

// ─────────────────────────────────────────────
// Shared types
// ─────────────────────────────────────────────

export type MoneyStatus = 'received' | 'expected' | 'overdue' | 'planned' | 'reconciled' | 'cancelled'
export type ExpenseStatus = 'paid' | 'planned' | 'overdue' | 'cancelled'
export type CostBehaviour = 'fixed' | 'variable' | 'capital_reno'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'void'
export type InvoiceType = 'rent' | 'service_charge' | 'one_off' | 'deposit' | 'other'
export type BillApprovalStatus = 'pending_review' | 'approved' | 'rejected'
export type BillPaymentStatus = 'unpaid' | 'paid' | 'overdue' | 'scheduled'
export type ArrearsSeverity = 'low' | 'medium' | 'high' | 'critical'
export type ArrearsStatus = 'open' | 'being_chased' | 'payment_plan' | 'resolved' | 'written_off'
export type DepositStatus = 'expected' | 'received' | 'protected' | 'return_due' | 'returned' | 'disputed'
export type ForecastScenario = 'base' | 'optimistic' | 'pessimistic'
export type TransactionStatus = 'unmatched' | 'matched' | 'ignored' | 'posted'
export type ActivityEventType = string

// ─────────────────────────────────────────────
// Row interfaces (page-facing — unchanged)
// ─────────────────────────────────────────────

export interface MoneyIncomeRow {
  id: string
  workspace_id: string
  property_id: string | null
  income_type: string
  amount: number
  expected_date: string
  received_date: string | null
  status: MoneyStatus
  description: string | null
  tenant_id: string | null
  tenancy_id: string | null
  created_at: string
  updated_at: string
}

export interface MoneyExpenseRow {
  id: string
  workspace_id: string
  property_id: string | null
  expense_type: string
  amount: number
  due_date: string
  paid_date: string | null
  status: ExpenseStatus
  cost_behaviour: CostBehaviour | null
  supplier_id: string | null
  description: string | null
  created_at: string
  updated_at: string
  supplier_name?: string | null
  property_name?: string | null
}

export interface MoneyInvoiceRow {
  id: string
  workspace_id: string
  property_id: string | null
  invoice_type: InvoiceType
  status: InvoiceStatus
  amount: number
  paid_amount: number | null
  issue_date: string
  due_date: string
  paid_at: string | null
  contact_id: string | null
  tenancy_id: string | null
  description: string | null
  created_at: string
  updated_at: string
  // joined display fields (optional — present when query includes the join)
  contact_name?: string | null
  property_address?: string | null
}

export interface MoneyBillRow {
  id: string
  workspace_id: string
  property_id: string | null
  supplier_id: string | null
  amount: number
  due_date: string
  approval_status: BillApprovalStatus
  payment_status: BillPaymentStatus
  description: string | null
  reference: string | null
  paid_at: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
  supplier_name?: string | null
  property_name?: string | null
}

export interface MoneyArrearsRow {
  id: string
  workspace_id: string
  property_id: string | null
  tenant_id: string | null
  tenancy_id: string | null
  tenant_name: string | null
  property_name: string | null
  amount_owed: number
  amount_paid: number
  status: ArrearsStatus
  severity: ArrearsSeverity
  last_chased_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface MoneyDepositRow {
  id: string
  workspace_id: string
  property_id: string | null
  tenant_id: string | null
  tenancy_id: string | null
  tenant_name: string | null
  property_name: string | null
  amount: number
  status: DepositStatus
  scheme: string | null
  scheme_reference: string | null
  protected_at: string | null
  return_due_date: string | null
  returned_at: string | null
  dispute_reason: string | null
  created_at: string
  updated_at: string
}

export interface MoneyForecastRow {
  id: string
  workspace_id: string
  property_id: string | null
  scenario: ForecastScenario
  period_start: string
  period_end: string
  projected_income: number
  projected_expenses: number
  projected_net: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface MoneyTransactionRow {
  id: string
  workspace_id: string
  import_id: string | null
  date: string
  description: string
  amount: number
  status: TransactionStatus
  matched_to_type: string | null
  matched_to_id: string | null
  created_at: string
  updated_at: string
}

export interface MoneyReconciliationImportRow {
  id: string
  workspace_id: string
  filename: string
  imported_at: string
  row_count: number
  matched_count: number
  unmatched_count: number
  status: string
}

export interface MoneyReportRow {
  id: string
  workspace_id: string
  report_type: string
  period_start: string
  period_end: string
  generated_at: string
  file_url: string | null
  parameters: Record<string, unknown>
}

export interface MoneyScheduledReportRow {
  id: string
  workspace_id: string
  report_type: string
  frequency: string
  next_run_at: string
  enabled: boolean
  created_at: string
}

export interface MoneyActivityRow {
  id: string
  workspace_id: string
  event_type: ActivityEventType
  entity_type: string
  entity_id: string
  description: string
  performed_by: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface PaymentSettingsRow {
  id: string
  workspace_id: string
  bank_account_name: string | null
  bank_account_number: string | null
  bank_sort_code: string | null
  payment_reference_prefix: string | null
  auto_reconcile: boolean
  late_payment_fee_pct: number | null
  updated_at: string
}

// ─────────────────────────────────────────────
// Insert / update payload types
// ─────────────────────────────────────────────

export type InsertMoneyIncome = Omit<MoneyIncomeRow, 'id' | 'created_at' | 'updated_at'>
export type InsertMoneyExpense = Omit<MoneyExpenseRow, 'id' | 'created_at' | 'updated_at'>
export type InsertMoneyInvoice = Omit<MoneyInvoiceRow, 'id' | 'created_at' | 'updated_at'>
export type InsertMoneyBill = Omit<MoneyBillRow, 'id' | 'created_at' | 'updated_at'>

// ─────────────────────────────────────────────
// Summary return types
// ─────────────────────────────────────────────

export interface IncomeSummary {
  totalReceived: number
  expected: number
  overdue: number
  planned: number
  reconciled: number
}

export interface ExpensesSummary {
  totalPaid: number
  planned: number
  fixedCosts: number
  variableCosts: number
  capitalReno: number
}

export interface InvoicesSummary {
  totalOutstanding: number
  dueThisWeek: number
  overdue: number
  paidThisMonth: number
  collectionRate: number
}

export interface BillsSummary {
  awaitingReview: number
  approvedToPay: number
  overdue: number
  paidThisMonth: number
  supplierPaymentQueue: number
}

export interface ArrearsSummary {
  totalArrears: number
  openCases: number
  beingChased: number
  onPaymentPlans: number
  resolvedThisMonth: number
}

export interface DepositsSummary {
  totalTracked: number
  protected: number
  expected: number
  returnDue: number
  disputed: number
}

export interface MoneyOverview {
  income: IncomeSummary
  expenses: ExpensesSummary
  invoices: InvoicesSummary
  bills: BillsSummary
  arrears: ArrearsSummary
  deposits: DepositsSummary
}

// ─────────────────────────────────────────────
// Row mappers — real live row → page-facing row
// ─────────────────────────────────────────────

type RawRow = Record<string, unknown>

const num = (v: unknown): number => (typeof v === 'number' ? v : v == null ? 0 : Number(v) || 0)
const str = (v: unknown): string => (v == null ? '' : String(v))
const strN = (v: unknown): string | null => (v == null ? null : String(v))

// money_transactions.category is a fixed enum (money_category). The income page
// offers free-text labels; map them onto the closest allowed enum value.
const MONEY_CATEGORIES = new Set([
  'rent', 'deposit', 'service_charge', 'utility_recharge', 'reimbursement',
  'maintenance', 'compliance', 'cleaning', 'management_fee', 'mortgage',
  'insurance', 'tax', 'professional_fees', 'marketing', 'other',
])
function toMoneyCategory(label: string | null | undefined): string {
  const l = (label ?? '').toLowerCase().trim()
  if (!l) return 'other'
  const snake = l.replace(/[\s/-]+/g, '_')
  if (MONEY_CATEGORIES.has(snake)) return snake
  if (l.includes('rent')) return 'rent'
  if (l.includes('deposit')) return 'deposit'
  if (l.includes('service')) return 'service_charge'
  if (l.includes('utility')) return 'utility_recharge'
  if (l.includes('management') || l.includes('fee')) return 'management_fee'
  if (l.includes('clean')) return 'cleaning'
  if (l.includes('insur')) return 'insurance'
  if (l.includes('maint')) return 'maintenance'
  if (l.includes('tax')) return 'tax'
  return 'other'
}

// money_transactions (direction='in') -> MoneyIncomeRow
function mapTxnToIncome(r: RawRow): MoneyIncomeRow {
  const occurred = str(r.occurred_on)
  return {
    id: str(r.id),
    workspace_id: str(r.workspace_id),
    property_id: strN(r.property_id),
    income_type: str(r.category) || 'Income',
    amount: num(r.amount),
    expected_date: occurred,
    received_date: occurred || null,
    status: 'received',
    description: strN(r.description),
    tenant_id: null,
    tenancy_id: strN(r.tenancy_id),
    created_at: str(r.created_at),
    updated_at: str(r.updated_at),
  }
}

// expense_records -> MoneyExpenseRow
// expense_records.status: draft | pending | paid | void
function expenseStatusFromLive(s: string): ExpenseStatus {
  if (s === 'paid') return 'paid'
  if (s === 'void') return 'cancelled'
  return 'planned' // draft / pending
}
function expenseStatusToLive(s: ExpenseStatus | string): string {
  if (s === 'paid') return 'paid'
  if (s === 'cancelled') return 'void'
  if (s === 'overdue' || s === 'planned') return 'pending'
  return 'pending'
}
function mapExpenseRecord(r: RawRow): MoneyExpenseRow {
  const date = str(r.date)
  const status = expenseStatusFromLive(str(r.status))
  const contactJoin = r.contacts as { display_name?: string } | null | undefined
  const propertyJoin = r.properties as { address_line1?: string } | null | undefined
  return {
    id: str(r.id),
    workspace_id: str(r.workspace_id),
    property_id: strN(r.property_id),
    expense_type: str(r.category) || 'Expense',
    amount: num(r.amount),
    due_date: date,
    paid_date: status === 'paid' ? date || null : null,
    status,
    cost_behaviour: null,
    supplier_id: strN(r.contact_id),
    description: strN(r.description),
    created_at: str(r.created_at),
    updated_at: str(r.created_at),
    supplier_name: contactJoin?.display_name ?? null,
    property_name: propertyJoin?.address_line1 ?? null,
  }
}

// invoices (live) -> MoneyInvoiceRow
// live status: draft|sent|viewed|approved|due|overdue|paid|disputed|cancelled
// live invoice_type: outbound|supplier
function invoiceStatusFromLive(s: string): InvoiceStatus {
  if (s === 'paid') return 'paid'
  if (s === 'overdue') return 'overdue'
  if (s === 'cancelled') return 'cancelled'
  if (s === 'draft') return 'draft'
  return 'sent' // sent/viewed/approved/due/disputed
}
function mapInvoice(r: RawRow): MoneyInvoiceRow {
  const t = str(r.invoice_type)
  const contactJoin = r.contacts as { display_name?: string } | null | undefined
  const propertyJoin = r.properties as { address_line1?: string } | null | undefined
  return {
    id: str(r.id),
    workspace_id: str(r.workspace_id),
    property_id: strN(r.property_id),
    invoice_type: t === 'supplier' ? 'other' : 'rent',
    status: invoiceStatusFromLive(str(r.status)),
    amount: num(r.total),
    paid_amount: r.paid_amount == null ? null : num(r.paid_amount),
    issue_date: str(r.issue_date),
    due_date: str(r.due_date),
    paid_at: strN(r.paid_at),
    contact_id: strN(r.contact_id),
    tenancy_id: null,
    description: strN(r.notes),
    created_at: str(r.created_at),
    updated_at: str(r.updated_at),
    contact_name: contactJoin?.display_name ?? null,
    property_address: propertyJoin?.address_line1 ?? null,
  }
}

// bills (live, single status col) -> MoneyBillRow (approval/payment split)
// live status: draft|received|awaiting_review|approved|scheduled_for_payment|paid|part_paid|overdue|disputed|rejected|cancelled|reconciled
function billStatusToApprovalPayment(s: string): { approval: BillApprovalStatus; payment: BillPaymentStatus } {
  switch (s) {
    case 'paid':
    case 'part_paid':
    case 'reconciled':
      return { approval: 'approved', payment: 'paid' }
    case 'overdue':
      return { approval: 'approved', payment: 'overdue' }
    case 'scheduled_for_payment':
      return { approval: 'approved', payment: 'scheduled' }
    case 'approved':
      return { approval: 'approved', payment: 'unpaid' }
    case 'rejected':
      return { approval: 'rejected', payment: 'unpaid' }
    default: // draft|received|awaiting_review|disputed|cancelled
      return { approval: 'pending_review', payment: 'unpaid' }
  }
}
function mapBill(r: RawRow): MoneyBillRow {
  const { approval, payment } = billStatusToApprovalPayment(str(r.status))
  const supplierJoin = r.contacts as { display_name?: string } | null | undefined
  const propertyJoin = r.properties as { address_line1?: string } | null | undefined
  return {
    id: str(r.id),
    workspace_id: str(r.workspace_id),
    property_id: strN(r.property_id),
    supplier_id: strN(r.supplier_contact_id),
    amount: num(r.total),
    due_date: str(r.due_date),
    approval_status: approval,
    payment_status: payment,
    description: strN(r.notes),
    reference: strN(r.bill_number),
    paid_at: strN(r.paid_at),
    approved_at: strN(r.approved_at),
    created_at: str(r.created_at),
    updated_at: str(r.updated_at),
    supplier_name: supplierJoin?.display_name ?? null,
    property_name: propertyJoin?.address_line1 ?? null,
  }
}

// arrears_records -> MoneyArrearsRow
// live status: open|chasing|payment_plan|part_paid|resolved|written_off|disputed
function arrearsStatusFromLive(s: string): ArrearsStatus {
  switch (s) {
    case 'chasing':
      return 'being_chased'
    case 'payment_plan':
      return 'payment_plan'
    case 'resolved':
      return 'resolved'
    case 'written_off':
      return 'written_off'
    default: // open|part_paid|disputed
      return 'open'
  }
}
function severityFromDays(days: number): ArrearsSeverity {
  if (days >= 60) return 'critical'
  if (days >= 30) return 'high'
  if (days >= 14) return 'medium'
  return 'low'
}
function mapArrears(r: RawRow): MoneyArrearsRow {
  const days = num(r.days_overdue)
  const contactJoin = r.contacts as { display_name?: string } | null | undefined
  const propertyJoin = r.properties as { address_line1?: string } | null | undefined
  return {
    id: str(r.id),
    workspace_id: str(r.workspace_id),
    property_id: strN(r.property_id),
    tenant_id: strN(r.contact_id),
    tenancy_id: strN(r.tenancy_id),
    tenant_name: contactJoin?.display_name ?? null,
    property_name: propertyJoin?.address_line1 ?? null,
    amount_owed: num(r.amount_due),
    amount_paid: num(r.amount_paid),
    status: arrearsStatusFromLive(str(r.status)),
    severity: severityFromDays(days),
    last_chased_at: strN(r.last_chased_at),
    notes: strN(r.notes),
    created_at: str(r.created_at),
    updated_at: str(r.updated_at),
  }
}

// deposits -> MoneyDepositRow
// live status: expected|received|protected|held_by_third_party|paid_to_landlord|returned|part_returned|deducted|disputed|cancelled
function depositStatusFromLive(s: string): DepositStatus {
  switch (s) {
    case 'protected':
      return 'protected'
    case 'returned':
    case 'part_returned':
      return 'returned'
    case 'disputed':
      return 'disputed'
    case 'expected':
      return 'expected'
    default: // received|held_by_third_party|paid_to_landlord|deducted|cancelled
      return 'received'
  }
}
function mapDeposit(r: RawRow): MoneyDepositRow {
  const contactJoin = r.contacts as { display_name?: string } | null | undefined
  const propertyJoin = r.properties as { address_line1?: string } | null | undefined
  return {
    id: str(r.id),
    workspace_id: str(r.workspace_id),
    property_id: strN(r.property_id),
    tenant_id: strN(r.contact_id),
    tenancy_id: strN(r.tenancy_id),
    tenant_name: contactJoin?.display_name ?? null,
    property_name: propertyJoin?.address_line1 ?? null,
    amount: num(r.amount),
    status: depositStatusFromLive(str(r.status)),
    scheme: strN(r.protection_scheme),
    scheme_reference: strN(r.reference_number),
    protected_at: str(r.status) === 'protected' ? strN(r.updated_at) : null,
    return_due_date: strN(r.return_due_date),
    returned_at: str(r.status) === 'returned' ? strN(r.updated_at) : null,
    dispute_reason: null,
    created_at: str(r.created_at),
    updated_at: str(r.updated_at),
  }
}

// money_forecast_records -> MoneyForecastRow
function mapForecast(r: RawRow): MoneyForecastRow {
  const type = str(r.record_type)
  const amount = num(r.forecast_amount)
  return {
    id: str(r.id),
    workspace_id: str(r.workspace_id),
    property_id: strN(r.property_id),
    scenario: 'base',
    period_start: str(r.period_start),
    period_end: str(r.period_end),
    projected_income: type === 'income' ? amount : 0,
    projected_expenses: type === 'expense' ? amount : 0,
    projected_net: type === 'income' ? amount : -amount,
    notes: strN(r.description),
    created_at: str(r.created_at),
    updated_at: str(r.updated_at),
  }
}

// money_transactions -> MoneyTransactionRow
function mapTransaction(r: RawRow): MoneyTransactionRow {
  return {
    id: str(r.id),
    workspace_id: str(r.workspace_id),
    import_id: strN(r.reconciliation_source),
    date: str(r.occurred_on),
    description: str(r.description) || str(r.category),
    amount: num(r.amount),
    status: r.reconciled ? 'matched' : 'unmatched',
    matched_to_type: null,
    matched_to_id: null,
    created_at: str(r.created_at),
    updated_at: str(r.updated_at),
  }
}

// money_transactions -> MoneyActivityRow (ledger as activity feed)
function mapTransactionToActivity(r: RawRow): MoneyActivityRow {
  const dir = str(r.direction)
  const amount = num(r.amount)
  return {
    id: str(r.id),
    workspace_id: str(r.workspace_id),
    event_type: dir === 'in' ? 'income_received' : 'expense_paid',
    entity_type: 'money_transaction',
    entity_id: str(r.id),
    description:
      str(r.description) ||
      `${dir === 'in' ? 'Received' : 'Paid'} ${formatCurrency(amount)} — ${str(r.category)}`,
    performed_by: strN(r.created_by),
    metadata: null,
    created_at: str(r.created_at),
  }
}

// ─────────────────────────────────────────────
// Query key factory
// ─────────────────────────────────────────────

const QK = {
  income: (wsId: string | undefined, filters?: object) => ['money_income', wsId, filters] as const,
  incomeSummary: (wsId: string | undefined) => ['money_income_summary', wsId] as const,
  expenses: (wsId: string | undefined, filters?: object) => ['money_expenses', wsId, filters] as const,
  expensesSummary: (wsId: string | undefined) => ['money_expenses_summary', wsId] as const,
  invoices: (wsId: string | undefined, filters?: object) => ['money_invoices', wsId, filters] as const,
  invoicesSummary: (wsId: string | undefined) => ['money_invoices_summary', wsId] as const,
  bills: (wsId: string | undefined, filters?: object) => ['money_bills', wsId, filters] as const,
  billsSummary: (wsId: string | undefined) => ['money_bills_summary', wsId] as const,
  arrears: (wsId: string | undefined, filters?: object) => ['money_arrears', wsId, filters] as const,
  arrearsSummary: (wsId: string | undefined) => ['money_arrears_summary', wsId] as const,
  deposits: (wsId: string | undefined, filters?: object) => ['money_deposits', wsId, filters] as const,
  depositsSummary: (wsId: string | undefined) => ['money_deposits_summary', wsId] as const,
  forecasts: (wsId: string | undefined, filters?: object) => ['money_forecasts', wsId, filters] as const,
  transactions: (wsId: string | undefined, filters?: object) => ['money_transactions', wsId, filters] as const,
  reconciliationImports: (wsId: string | undefined) => ['money_reconciliation_imports', wsId] as const,
  reports: (wsId: string | undefined) => ['money_reports', wsId] as const,
  scheduledReports: (wsId: string | undefined) => ['money_scheduled_reports', wsId] as const,
  activity: (wsId: string | undefined, filters?: object) => ['money_activity', wsId, filters] as const,
  paymentSettings: (wsId: string | undefined) => ['payment_settings', wsId] as const,
  overview: (wsId: string | undefined) => ['money_overview', wsId] as const,
}

// ─────────────────────────────────────────────
// INCOME  (money_transactions, direction = 'in')
// ─────────────────────────────────────────────

interface IncomeFilters {
  status?: MoneyStatus
  property_id?: string
  income_type?: string
  date_from?: string
  date_to?: string
}

export function useMoneyIncome(
  workspaceId: string | undefined,
  filters?: IncomeFilters
) {
  const supabase = createClient()

  return useQuery<MoneyIncomeRow[]>({
    queryKey: QK.income(workspaceId, filters),
    enabled: !!workspaceId,
    staleTime: 30_000,
    queryFn: async () => {
      let q = supabase
        .from('money_transactions')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .eq('direction', 'in')
        .order('occurred_on', { ascending: false })
        // Bound the list view on this high-volume table; date/property filters
        // narrow further. 500 newest rows is ample for the income screen.
        .limit(500)

      if (filters?.property_id) q = q.eq('property_id', filters.property_id)
      if (filters?.income_type) q = q.eq('category', filters.income_type)
      if (filters?.date_from) q = q.gte('occurred_on', filters.date_from)
      if (filters?.date_to) q = q.lte('occurred_on', filters.date_to)

      const { data, error } = await q
      if (error) {
        if (isMissingTable(error)) return []
        throw error
      }
      return (data ?? []).map(mapTxnToIncome)
    },
  })
}

export function useMoneyIncomeSummary(workspaceId: string | undefined) {
  const supabase = createClient()

  return useQuery<IncomeSummary>({
    queryKey: QK.incomeSummary(workspaceId),
    enabled: !!workspaceId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('money_transactions')
        .select('amount')
        .eq('workspace_id', workspaceId!)
        .eq('direction', 'in')

      const empty = { totalReceived: 0, expected: 0, overdue: 0, planned: 0, reconciled: 0 }
      if (error) {
        if (isMissingTable(error)) return empty
        throw error
      }
      // money_transactions are realized cash movements -> all "received".
      const totalReceived = (data ?? []).reduce((acc, r) => acc + num((r as RawRow).amount), 0)
      return { ...empty, totalReceived }
    },
  })
}

export function useCreateMoneyIncome(workspaceId: string | undefined) {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation<MoneyIncomeRow, Error, InsertMoneyIncome>({
    mutationFn: async (payload) => {
      const occurred = payload.received_date || payload.expected_date || new Date().toISOString().slice(0, 10)
      // category is a fixed enum; keep the human label (if any) in description.
      const description = payload.description ?? (payload.income_type || null)
      const insert = {
        workspace_id: payload.workspace_id,
        direction: 'in',
        category: toMoneyCategory(payload.income_type),
        amount: payload.amount,
        occurred_on: occurred,
        property_id: payload.property_id,
        tenancy_id: payload.tenancy_id,
        description,
      }
      const { data, error } = await supabase
        .from('money_transactions')
        .insert(insert)
        .select()
        .single()
      if (error) throw error
      return mapTxnToIncome(data as RawRow)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.income(workspaceId) })
      qc.invalidateQueries({ queryKey: QK.incomeSummary(workspaceId) })
      qc.invalidateQueries({ queryKey: QK.overview(workspaceId) })
      qc.invalidateQueries({ queryKey: QK.activity(workspaceId) })
      qc.invalidateQueries({ queryKey: QK.transactions(workspaceId) })
    },
  })
}

// ─────────────────────────────────────────────
// EXPENSES  (expense_records)
// ─────────────────────────────────────────────

interface ExpensesFilters {
  status?: ExpenseStatus
  property_id?: string
  expense_type?: string
  cost_behaviour?: CostBehaviour
}

export function useMoneyExpenses(
  workspaceId: string | undefined,
  filters?: ExpensesFilters
) {
  const supabase = createClient()

  return useQuery<MoneyExpenseRow[]>({
    queryKey: QK.expenses(workspaceId, filters),
    enabled: !!workspaceId,
    staleTime: 30_000,
    queryFn: async () => {
      let q = supabase
        .from('expense_records')
        .select('*, contacts(display_name), properties(address_line1)')
        .eq('workspace_id', workspaceId!)
        .order('date', { ascending: false })

      if (filters?.status) q = q.eq('status', expenseStatusToLive(filters.status))
      if (filters?.property_id) q = q.eq('property_id', filters.property_id)
      if (filters?.expense_type) q = q.eq('category', filters.expense_type)

      const { data, error } = await q
      if (error) {
        if (isMissingTable(error)) return []
        throw error
      }
      return (data ?? []).map(mapExpenseRecord)
    },
  })
}

export function useMoneyExpensesSummary(workspaceId: string | undefined) {
  const supabase = createClient()

  return useQuery<ExpensesSummary>({
    queryKey: QK.expensesSummary(workspaceId),
    enabled: !!workspaceId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_records')
        .select('status, amount')
        .eq('workspace_id', workspaceId!)

      const empty = { totalPaid: 0, planned: 0, fixedCosts: 0, variableCosts: 0, capitalReno: 0 }
      if (error) {
        if (isMissingTable(error)) return empty
        throw error
      }
      const rows = (data ?? []) as RawRow[]
      const totalPaid = rows.filter((r) => str(r.status) === 'paid').reduce((acc, r) => acc + num(r.amount), 0)
      const planned = rows
        .filter((r) => str(r.status) === 'pending' || str(r.status) === 'draft')
        .reduce((acc, r) => acc + num(r.amount), 0)
      // expense_records has no cost_behaviour column -> fixed/variable/capital remain 0.
      return { totalPaid, planned, fixedCosts: 0, variableCosts: 0, capitalReno: 0 }
    },
  })
}

export function useCreateMoneyExpense(workspaceId: string | undefined) {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation<MoneyExpenseRow, Error, InsertMoneyExpense>({
    mutationFn: async (payload) => {
      const insert = {
        workspace_id: payload.workspace_id,
        category: payload.expense_type || 'Expense',
        description: payload.description,
        amount: payload.amount,
        date: payload.due_date || new Date().toISOString().slice(0, 10),
        status: expenseStatusToLive(payload.status),
        property_id: payload.property_id,
        contact_id: payload.supplier_id,
      }
      const { data, error } = await supabase
        .from('expense_records')
        .insert(insert)
        .select()
        .single()
      if (error) throw error
      return mapExpenseRecord(data as RawRow)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.expenses(workspaceId) })
      qc.invalidateQueries({ queryKey: QK.expensesSummary(workspaceId) })
      qc.invalidateQueries({ queryKey: QK.overview(workspaceId) })
    },
  })
}

// ─────────────────────────────────────────────
// INVOICES  (invoices)
// ─────────────────────────────────────────────

interface InvoicesFilters {
  status?: InvoiceStatus
  property_id?: string
  invoice_type?: InvoiceType
}

export function useMoneyInvoices(
  workspaceId: string | undefined,
  filters?: InvoicesFilters
) {
  const supabase = createClient()

  return useQuery<MoneyInvoiceRow[]>({
    queryKey: QK.invoices(workspaceId, filters),
    enabled: !!workspaceId,
    staleTime: 30_000,
    queryFn: async () => {
      let q = supabase
        .from('invoices')
        .select('*, contacts(display_name), properties(address_line1)')
        .eq('workspace_id', workspaceId!)
        .order('issue_date', { ascending: false })

      if (filters?.status) q = q.eq('status', filters.status)
      if (filters?.property_id) q = q.eq('property_id', filters.property_id)

      const { data, error } = await q
      if (error) {
        if (isMissingTable(error)) return []
        throw error
      }
      return (data ?? []).map(mapInvoice)
    },
  })
}

export function useMoneyInvoice(workspaceId: string | undefined, invoiceId: string | undefined) {
  const supabase = createClient()
  return useQuery<MoneyInvoiceRow | null>({
    queryKey: ['money_invoice', workspaceId, invoiceId],
    enabled: !!workspaceId && !!invoiceId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, contacts(display_name), properties(address_line1)')
        .eq('workspace_id', workspaceId!)
        .eq('id', invoiceId!)
        .maybeSingle()
      if (error) {
        if (isMissingTable(error)) return null
        throw error
      }
      return data ? mapInvoice(data as RawRow) : null
    },
  })
}

export function useMoneyInvoicesSummary(workspaceId: string | undefined) {
  const supabase = createClient()

  return useQuery<InvoicesSummary>({
    queryKey: QK.invoicesSummary(workspaceId),
    enabled: !!workspaceId,
    staleTime: 30_000,
    queryFn: async () => {
      const empty = { totalOutstanding: 0, dueThisWeek: 0, overdue: 0, paidThisMonth: 0, collectionRate: 0 }
      const { data, error } = await supabase
        .from('invoices')
        .select('status, total, paid_amount, due_date, paid_at')
        .eq('workspace_id', workspaceId!)

      if (error) {
        if (isMissingTable(error)) return empty
        throw error
      }
      const rows = ((data ?? []) as RawRow[]).map((r) => ({
        status: invoiceStatusFromLive(str(r.status)),
        amount: num(r.total),
        paid_amount: num(r.paid_amount),
        due_date: str(r.due_date),
        paid_at: strN(r.paid_at),
      }))

      const now = new Date()
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      const outstanding = rows
        .filter((r) => r.status !== 'paid' && r.status !== 'cancelled' && r.status !== 'void')
        .reduce((acc, r) => acc + (r.amount - r.paid_amount), 0)

      const dueThisWeek = rows
        .filter((r) => {
          const d = new Date(r.due_date)
          return r.status !== 'paid' && d >= now && d <= weekFromNow
        })
        .reduce((acc, r) => acc + (r.amount - r.paid_amount), 0)

      const overdue = rows
        .filter((r) => r.status === 'overdue')
        .reduce((acc, r) => acc + (r.amount - r.paid_amount), 0)

      const paidThisMonth = rows
        .filter((r) => r.status === 'paid' && r.paid_at && r.paid_at >= startOfMonth)
        .reduce((acc, r) => acc + (r.paid_amount || r.amount), 0)

      const totalIssued = rows.reduce((acc, r) => acc + r.amount, 0)
      const totalCollected = rows
        .filter((r) => r.status === 'paid')
        .reduce((acc, r) => acc + (r.paid_amount || r.amount), 0)
      const collectionRate = totalIssued > 0 ? Math.round((totalCollected / totalIssued) * 100) : 0

      return { totalOutstanding: outstanding, dueThisWeek, overdue, paidThisMonth, collectionRate }
    },
  })
}

export function useCreateMoneyInvoice(workspaceId: string | undefined) {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation<MoneyInvoiceRow, Error, InsertMoneyInvoice>({
    mutationFn: async (payload) => {
      const total = payload.amount
      const insert = {
        workspace_id: payload.workspace_id,
        invoice_number: `INV-${Date.now().toString(36).toUpperCase()}`,
        contact_id: payload.contact_id,
        property_id: payload.property_id,
        invoice_type: 'outbound',
        issue_date: payload.issue_date,
        due_date: payload.due_date,
        subtotal: total,
        tax_amount: 0,
        total,
        currency: 'GBP',
        status: payload.status === 'void' ? 'cancelled' : payload.status,
        paid_amount: payload.paid_amount ?? 0,
        paid_at: payload.paid_at,
        notes: payload.description,
      }
      const { data, error } = await supabase
        .from('invoices')
        .insert(insert)
        .select()
        .single()
      if (error) throw error
      return mapInvoice(data as RawRow)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.invoices(workspaceId) })
      qc.invalidateQueries({ queryKey: QK.invoicesSummary(workspaceId) })
      qc.invalidateQueries({ queryKey: QK.overview(workspaceId) })
    },
  })
}

export function useUpdateInvoiceStatus(workspaceId: string | undefined) {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation<MoneyInvoiceRow, Error, { id: string; status: InvoiceStatus; paid_at?: string; paid_amount?: number }>({
    mutationFn: async ({ id, status, paid_at, paid_amount }) => {
      const liveStatus = status === 'void' ? 'cancelled' : status
      const { data, error } = await supabase
        .from('invoices')
        .update({ status: liveStatus, paid_at: paid_at ?? null, paid_amount: paid_amount ?? null })
        .eq('id', id)
        .eq('workspace_id', workspaceId!)
        .select()
        .single()
      if (error) throw error
      return mapInvoice(data as RawRow)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.invoices(workspaceId) })
      qc.invalidateQueries({ queryKey: QK.invoicesSummary(workspaceId) })
      qc.invalidateQueries({ queryKey: QK.overview(workspaceId) })
    },
  })
}

// ─────────────────────────────────────────────
// BILLS  (bills, single status column)
// ─────────────────────────────────────────────

interface BillsFilters {
  approval_status?: BillApprovalStatus
  payment_status?: BillPaymentStatus
  property_id?: string
  supplier_id?: string
}

export function useMoneyBills(
  workspaceId: string | undefined,
  filters?: BillsFilters
) {
  const supabase = createClient()

  return useQuery<MoneyBillRow[]>({
    queryKey: QK.bills(workspaceId, filters),
    enabled: !!workspaceId,
    staleTime: 30_000,
    queryFn: async () => {
      let q = supabase
        .from('bills')
        .select('*, contacts!supplier_contact_id(display_name), properties(address_line1)')
        .eq('workspace_id', workspaceId!)
        .order('due_date', { ascending: true })

      if (filters?.property_id) q = q.eq('property_id', filters.property_id)
      if (filters?.supplier_id) q = q.eq('supplier_contact_id', filters.supplier_id)

      const { data, error } = await q
      if (error) {
        if (isMissingTable(error)) return []
        throw error
      }
      let rows = (data ?? []).map(mapBill)
      if (filters?.approval_status) rows = rows.filter((r) => r.approval_status === filters.approval_status)
      if (filters?.payment_status) rows = rows.filter((r) => r.payment_status === filters.payment_status)
      return rows
    },
  })
}

export function useMoneyBillsSummary(workspaceId: string | undefined) {
  const supabase = createClient()

  return useQuery<BillsSummary>({
    queryKey: QK.billsSummary(workspaceId),
    enabled: !!workspaceId,
    staleTime: 30_000,
    queryFn: async () => {
      const empty = { awaitingReview: 0, approvedToPay: 0, overdue: 0, paidThisMonth: 0, supplierPaymentQueue: 0 }
      const { data, error } = await supabase
        .from('bills')
        .select('status, total, paid_at')
        .eq('workspace_id', workspaceId!)

      if (error) {
        if (isMissingTable(error)) return empty
        throw error
      }
      const rows = ((data ?? []) as RawRow[]).map((r) => {
        const { approval, payment } = billStatusToApprovalPayment(str(r.status))
        return { approval, payment, amount: num(r.total), paid_at: strN(r.paid_at) }
      })

      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      return {
        awaitingReview: rows.filter((r) => r.approval === 'pending_review').length,
        approvedToPay: rows.filter((r) => r.approval === 'approved' && r.payment === 'unpaid').length,
        overdue: rows.filter((r) => r.payment === 'overdue').length,
        paidThisMonth: rows.filter((r) => r.payment === 'paid' && r.paid_at && new Date(r.paid_at) >= startOfMonth).length,
        supplierPaymentQueue: rows
          .filter((r) => r.approval === 'approved' && r.payment === 'unpaid')
          .reduce((acc, r) => acc + r.amount, 0),
      }
    },
  })
}

export function useApproveBill(workspaceId: string | undefined) {
  const supabase = createClient()
  const qc = useQueryClient()
  const { notify, actorId } = useNotify()

  return useMutation<MoneyBillRow, Error, { id: string }>({
    mutationFn: async ({ id }) => {
      const { data, error } = await supabase
        .from('bills')
        .update({ status: 'approved', approved_at: new Date().toISOString() })
        .eq('id', id)
        .eq('workspace_id', workspaceId!)
        .select()
        .single()
      if (error) throw error
      const bill = mapBill(data as RawRow)
      // EVENT: bill approved
      const recipient = (data as { created_by?: string | null }).created_by ?? actorId
      if (recipient) {
        notify('notifyBillApproved', {
          billId: bill.id,
          userId: recipient,
          label: `Bill ${bill.reference ?? ''}`.trim(),
        })
      }
      return bill
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.bills(workspaceId) })
      qc.invalidateQueries({ queryKey: QK.billsSummary(workspaceId) })
    },
  })
}

export function useMarkBillPaid(workspaceId: string | undefined) {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation<MoneyBillRow, Error, { id: string; paid_at?: string }>({
    mutationFn: async ({ id, paid_at }) => {
      const { data, error } = await supabase
        .from('bills')
        .update({ status: 'paid', paid_at: paid_at ?? new Date().toISOString() })
        .eq('id', id)
        .eq('workspace_id', workspaceId!)
        .select()
        .single()
      if (error) throw error
      return mapBill(data as RawRow)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.bills(workspaceId) })
      qc.invalidateQueries({ queryKey: QK.billsSummary(workspaceId) })
      qc.invalidateQueries({ queryKey: QK.overview(workspaceId) })
    },
  })
}

export function useCreateMoneyBill(workspaceId: string | undefined) {
  const supabase = createClient()
  const qc = useQueryClient()
  const { notify, actorId } = useNotify()

  return useMutation<MoneyBillRow, Error, InsertMoneyBill>({
    mutationFn: async (payload) => {
      const status = payload.approval_status === 'approved' ? 'approved' : 'awaiting_review'
      const insert = {
        workspace_id: payload.workspace_id,
        bill_number: payload.reference || `BILL-${Date.now().toString(36).toUpperCase()}`,
        bill_type: 'supplier',
        supplier_contact_id: payload.supplier_id,
        property_id: payload.property_id,
        status,
        issue_date: new Date().toISOString().slice(0, 10),
        due_date: payload.due_date,
        subtotal: payload.amount,
        tax_amount: 0,
        total: payload.amount,
        currency: 'GBP',
        approved_at: payload.approved_at,
        notes: payload.description,
      }
      const { data, error } = await supabase
        .from('bills')
        .insert(insert)
        .select()
        .single()
      if (error) throw error
      const bill = mapBill(data as RawRow)
      // EVENT: bill due — surface a heads-up to the creator when a dated bill is logged
      if (bill.due_date && actorId) {
        notify('notifyBillDue', {
          billId: bill.id,
          userId: actorId,
          label: `Bill ${bill.reference ?? ''}`.trim(),
          dueDate: bill.due_date,
        })
      }
      return bill
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.bills(workspaceId) })
      qc.invalidateQueries({ queryKey: QK.billsSummary(workspaceId) })
    },
  })
}

// ─────────────────────────────────────────────
// ARREARS  (arrears_records)
// ─────────────────────────────────────────────

interface ArrearsFilters {
  status?: ArrearsStatus
  severity?: ArrearsSeverity
  property_id?: string
}

export function useMoneyArrears(
  workspaceId: string | undefined,
  filters?: ArrearsFilters
) {
  const supabase = createClient()

  return useQuery<MoneyArrearsRow[]>({
    queryKey: QK.arrears(workspaceId, filters),
    enabled: !!workspaceId,
    staleTime: 30_000,
    queryFn: async () => {
      let q = supabase
        .from('arrears_records')
        .select('*, contacts(display_name), properties(address_line1)')
        .eq('workspace_id', workspaceId!)
        .order('amount_outstanding', { ascending: false })

      if (filters?.property_id) q = q.eq('property_id', filters.property_id)

      const { data, error } = await q
      if (error) {
        if (isMissingTable(error)) return []
        throw error
      }
      let rows = (data ?? []).map(mapArrears)
      if (filters?.status) rows = rows.filter((r) => r.status === filters.status)
      if (filters?.severity) rows = rows.filter((r) => r.severity === filters.severity)
      return rows
    },
  })
}

export function useMoneyArrearsSummary(workspaceId: string | undefined) {
  const supabase = createClient()

  return useQuery<ArrearsSummary>({
    queryKey: QK.arrearsSummary(workspaceId),
    enabled: !!workspaceId,
    staleTime: 30_000,
    queryFn: async () => {
      const empty = { totalArrears: 0, openCases: 0, beingChased: 0, onPaymentPlans: 0, resolvedThisMonth: 0 }
      const { data, error } = await supabase
        .from('arrears_records')
        .select('status, amount_due, amount_paid, amount_outstanding, updated_at')
        .eq('workspace_id', workspaceId!)

      if (error) {
        if (isMissingTable(error)) return empty
        throw error
      }
      const rows = ((data ?? []) as RawRow[]).map((r) => ({
        status: arrearsStatusFromLive(str(r.status)),
        outstanding: r.amount_outstanding != null ? num(r.amount_outstanding) : num(r.amount_due) - num(r.amount_paid),
        updated_at: strN(r.updated_at),
      }))

      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      return {
        totalArrears: rows.reduce((acc, r) => acc + r.outstanding, 0),
        openCases: rows.filter((r) => r.status === 'open').length,
        beingChased: rows.filter((r) => r.status === 'being_chased').length,
        onPaymentPlans: rows.filter((r) => r.status === 'payment_plan').length,
        resolvedThisMonth: rows.filter((r) => r.status === 'resolved' && r.updated_at && new Date(r.updated_at) >= startOfMonth).length,
      }
    },
  })
}

// Payload for opening a new rent-chase / arrears case.
export interface InsertMoneyArrears {
  workspace_id: string
  property_id: string | null
  contact_id: string | null
  tenancy_id: string | null
  amount_due: number
  amount_paid?: number
  due_date?: string | null
  notes?: string | null
}

export function useCreateMoneyArrears(workspaceId: string | undefined) {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation<MoneyArrearsRow, Error, InsertMoneyArrears>({
    mutationFn: async (payload) => {
      const daysOverdue = payload.due_date
        ? Math.max(0, Math.floor((Date.now() - new Date(payload.due_date).getTime()) / 86400000))
        : 0
      const amountPaid = payload.amount_paid ?? 0
      // amount_outstanding is a plain (non-generated) column the list sorts by and
      // the summary reads — populate it to keep ordering/aggregates correct.
      const insert = {
        workspace_id: payload.workspace_id,
        property_id: payload.property_id,
        contact_id: payload.contact_id,
        tenancy_id: payload.tenancy_id,
        amount_due: payload.amount_due,
        amount_paid: amountPaid,
        amount_outstanding: payload.amount_due - amountPaid,
        status: 'open',
        days_overdue: daysOverdue,
        notes: payload.notes ?? null,
      }
      const { data, error } = await supabase
        .from('arrears_records')
        .insert(insert)
        .select('*, contacts(display_name), properties(address_line1)')
        .single()
      if (error) throw error
      return mapArrears(data as RawRow)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.arrears(workspaceId) })
      qc.invalidateQueries({ queryKey: QK.arrearsSummary(workspaceId) })
      qc.invalidateQueries({ queryKey: QK.overview(workspaceId) })
      qc.invalidateQueries({ queryKey: QK.activity(workspaceId) })
    },
  })
}

// ─────────────────────────────────────────────
// DEPOSITS  (deposits)
// ─────────────────────────────────────────────

interface DepositsFilters {
  status?: DepositStatus
  property_id?: string
}

export function useMoneyDeposits(
  workspaceId: string | undefined,
  filters?: DepositsFilters
) {
  const supabase = createClient()

  return useQuery<MoneyDepositRow[]>({
    queryKey: QK.deposits(workspaceId, filters),
    enabled: !!workspaceId,
    staleTime: 30_000,
    queryFn: async () => {
      let q = supabase
        .from('deposits')
        .select('*, contacts(display_name), properties(address_line1)')
        .eq('workspace_id', workspaceId!)
        .order('created_at', { ascending: false })

      if (filters?.property_id) q = q.eq('property_id', filters.property_id)

      const { data, error } = await q
      if (error) {
        if (isMissingTable(error)) return []
        throw error
      }
      let rows = (data ?? []).map(mapDeposit)
      if (filters?.status) rows = rows.filter((r) => r.status === filters.status)
      return rows
    },
  })
}

export function useMoneyDepositsSummary(workspaceId: string | undefined) {
  const supabase = createClient()

  return useQuery<DepositsSummary>({
    queryKey: QK.depositsSummary(workspaceId),
    enabled: !!workspaceId,
    staleTime: 30_000,
    queryFn: async () => {
      const empty = { totalTracked: 0, protected: 0, expected: 0, returnDue: 0, disputed: 0 }
      const { data, error } = await supabase
        .from('deposits')
        .select('status, amount')
        .eq('workspace_id', workspaceId!)

      if (error) {
        if (isMissingTable(error)) return empty
        throw error
      }
      const rows = ((data ?? []) as RawRow[]).map((r) => ({ status: depositStatusFromLive(str(r.status)), amount: num(r.amount) }))

      const sumByStatus = (s: DepositStatus) =>
        rows.filter((r) => r.status === s).reduce((acc, r) => acc + r.amount, 0)

      return {
        totalTracked: rows.reduce((acc, r) => acc + r.amount, 0),
        protected: sumByStatus('protected'),
        expected: sumByStatus('expected'),
        returnDue: sumByStatus('return_due'),
        disputed: sumByStatus('disputed'),
      }
    },
  })
}

export interface InsertMoneyDeposit {
  workspace_id: string
  tenant_name: string
  property_address: string
  amount: number
  received_date: string
  status: DepositStatus
  scheme: string | null
  reference?: string | null
  notes?: string | null
}

export function useCreateMoneyDeposit(workspaceId: string | undefined) {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation<MoneyDepositRow, Error, InsertMoneyDeposit>({
    mutationFn: async (payload) => {
      // deposits has no free-text tenant/property name columns; persist supplied
      // context into notes so nothing is silently lost, and store the amount/date/status.
      const insert = {
        workspace_id: payload.workspace_id,
        deposit_type: 'tenancy',
        amount: payload.amount,
        currency: 'GBP',
        status: payload.status === 'returned' ? 'returned' : payload.status === 'protected' ? 'protected' : payload.status === 'expected' ? 'expected' : 'received',
        received_date: payload.received_date,
        // scheme code lives in protection_scheme; reference_number holds the
        // certificate/membership reference the scheme issues on lodgement.
        protection_scheme: payload.scheme,
        reference_number: payload.reference ?? null,
        notes: [payload.tenant_name, payload.property_address, payload.notes].filter(Boolean).join(' — ') || null,
      }
      const { data, error } = await supabase
        .from('deposits')
        .insert(insert)
        .select()
        .single()
      if (error) throw error
      return mapDeposit(data as RawRow)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.deposits(workspaceId) })
      qc.invalidateQueries({ queryKey: QK.depositsSummary(workspaceId) })
      qc.invalidateQueries({ queryKey: QK.overview(workspaceId) })
    },
  })
}

// ─────────────────────────────────────────────
// FORECASTS  (money_forecast_records)
// ─────────────────────────────────────────────

interface ForecastsFilters {
  property_id?: string
  scenario?: ForecastScenario
  period_start?: string
  period_end?: string
}

export function useMoneyForecasts(
  workspaceId: string | undefined,
  filters?: ForecastsFilters
) {
  const supabase = createClient()

  return useQuery<MoneyForecastRow[]>({
    queryKey: QK.forecasts(workspaceId, filters),
    enabled: !!workspaceId,
    staleTime: 60_000,
    queryFn: async () => {
      let q = supabase
        .from('money_forecast_records')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .order('period_start', { ascending: true })

      if (filters?.property_id) q = q.eq('property_id', filters.property_id)
      if (filters?.period_start) q = q.gte('period_start', filters.period_start)
      if (filters?.period_end) q = q.lte('period_end', filters.period_end)

      const { data, error } = await q
      if (error) {
        if (isMissingTable(error)) return []
        throw error
      }
      return (data ?? []).map(mapForecast)
    },
  })
}

// ─────────────────────────────────────────────
// RECONCILIATION  (money_transactions = the ledger)
// ─────────────────────────────────────────────

interface TransactionFilters {
  status?: TransactionStatus
  import_id?: string
}

export function useMoneyTransactions(
  workspaceId: string | undefined,
  filters?: TransactionFilters
) {
  const supabase = createClient()

  return useQuery<MoneyTransactionRow[]>({
    queryKey: QK.transactions(workspaceId, filters),
    enabled: !!workspaceId,
    staleTime: 15_000,
    queryFn: async () => {
      let q = supabase
        .from('money_transactions')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .order('occurred_on', { ascending: false })
        // Bound the transactions list on this high-volume table (newest 500).
        .limit(500)

      // status maps to the boolean `reconciled` column
      if (filters?.status === 'matched' || filters?.status === 'posted') q = q.eq('reconciled', true)
      if (filters?.status === 'unmatched') q = q.eq('reconciled', false)

      const { data, error } = await q
      if (error) {
        if (isMissingTable(error)) return []
        throw error
      }
      return (data ?? []).map(mapTransaction)
    },
  })
}

export function useMoneyReconciliationImports(workspaceId: string | undefined) {
  // No `money_reconciliation_imports` table exists in the live DB.
  return useQuery<MoneyReconciliationImportRow[]>({
    queryKey: QK.reconciliationImports(workspaceId),
    enabled: !!workspaceId,
    staleTime: 30_000,
    queryFn: async () => [],
  })
}

export function useMatchTransaction(workspaceId: string | undefined) {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation<
    MoneyTransactionRow,
    Error,
    { id: string; matched_to_type: string; matched_to_id: string }
  >({
    mutationFn: async ({ id }) => {
      // money_transactions has no matched_to_* columns; mark it reconciled.
      const { data, error } = await supabase
        .from('money_transactions')
        .update({ reconciled: true, reconciled_at: new Date().toISOString() })
        .eq('id', id)
        .eq('workspace_id', workspaceId!)
        .select()
        .single()
      if (error) throw error
      return mapTransaction(data as RawRow)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.transactions(workspaceId) })
    },
  })
}

// ─────────────────────────────────────────────
// REPORTS  (no live table -> 42P01-safe empty)
// ─────────────────────────────────────────────

export function useMoneyReports(workspaceId: string | undefined) {
  return useQuery<MoneyReportRow[]>({
    queryKey: QK.reports(workspaceId),
    enabled: !!workspaceId,
    staleTime: 60_000,
    queryFn: async () => [],
  })
}

export function useMoneyScheduledReports(workspaceId: string | undefined) {
  return useQuery<MoneyScheduledReportRow[]>({
    queryKey: QK.scheduledReports(workspaceId),
    enabled: !!workspaceId,
    staleTime: 60_000,
    queryFn: async () => [],
  })
}

// ─────────────────────────────────────────────
// ACTIVITY  (money_transactions = the ledger feed)
// ─────────────────────────────────────────────

interface ActivityFilters {
  event_type?: ActivityEventType
  entity_type?: string
  limit?: number
}

export function useMoneyActivity(
  workspaceId: string | undefined,
  filters?: ActivityFilters
) {
  const supabase = createClient()

  return useQuery<MoneyActivityRow[]>({
    queryKey: QK.activity(workspaceId, filters),
    enabled: !!workspaceId,
    staleTime: 15_000,
    queryFn: async () => {
      let q = supabase
        .from('money_transactions')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .order('created_at', { ascending: false })

      // Always bound this activity feed; callers may request fewer, but never
      // an unbounded scan of the ledger.
      q = q.limit(filters?.limit ?? 100)

      const { data, error } = await q
      if (error) {
        if (isMissingTable(error)) return []
        throw error
      }
      return (data ?? []).map(mapTransactionToActivity)
    },
  })
}

// ─────────────────────────────────────────────
// PAYMENT SETTINGS  (no live table -> 42P01-safe)
// ─────────────────────────────────────────────

export function usePaymentSettings(workspaceId: string | undefined) {
  return useQuery<PaymentSettingsRow | null>({
    queryKey: QK.paymentSettings(workspaceId),
    enabled: !!workspaceId,
    staleTime: 60_000,
    queryFn: async () => null,
  })
}

export function useUpdatePaymentSettings(workspaceId: string | undefined) {
  const qc = useQueryClient()
  // No payment_settings table in live DB; keep the mutation shape but no-op safely.
  return useMutation<
    PaymentSettingsRow | null,
    Error,
    Partial<Omit<PaymentSettingsRow, 'id' | 'workspace_id' | 'updated_at'>>
  >({
    mutationFn: async () => null,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.paymentSettings(workspaceId) })
    },
  })
}

// ─────────────────────────────────────────────
// OVERVIEW AGGREGATE
// ─────────────────────────────────────────────

export function useMoneyOverview(workspaceId: string | undefined) {
  const supabase = createClient()

  return useQuery<MoneyOverview>({
    queryKey: QK.overview(workspaceId),
    enabled: !!workspaceId,
    staleTime: 30_000,
    queryFn: async () => {
      const [incomeRes, expensesRes, invoicesRes, billsRes, arrearsRes, depositsRes] = await Promise.all([
        supabase.from('money_transactions').select('amount').eq('workspace_id', workspaceId!).eq('direction', 'in'),
        supabase.from('expense_records').select('status, amount').eq('workspace_id', workspaceId!),
        supabase.from('invoices').select('status, total, paid_amount, due_date, paid_at').eq('workspace_id', workspaceId!),
        supabase.from('bills').select('status, total, paid_at').eq('workspace_id', workspaceId!),
        supabase.from('arrears_records').select('status, amount_due, amount_paid, amount_outstanding, updated_at').eq('workspace_id', workspaceId!),
        supabase.from('deposits').select('status, amount').eq('workspace_id', workspaceId!),
      ])

      // Treat 42P01 (missing table) as empty so the overview still renders.
      const safe = (res: { data: unknown; error: unknown }): RawRow[] => {
        if (res.error) {
          if (isMissingTable(res.error)) return []
          throw res.error
        }
        return (res.data as RawRow[]) ?? []
      }

      const incomeRows = safe(incomeRes)
      const expensesRows = safe(expensesRes)
      const invoicesRows = safe(invoicesRes)
      const billsRows = safe(billsRes)
      const arrearsRows = safe(arrearsRes)
      const depositsRows = safe(depositsRes)

      const now = new Date()
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const startOfMonthDate = new Date(now.getFullYear(), now.getMonth(), 1)

      // INCOME
      const totalReceived = incomeRows.reduce((acc, r) => acc + num(r.amount), 0)

      // EXPENSES
      const expTotalPaid = expensesRows.filter((r) => str(r.status) === 'paid').reduce((acc, r) => acc + num(r.amount), 0)
      const expPlanned = expensesRows
        .filter((r) => str(r.status) === 'pending' || str(r.status) === 'draft')
        .reduce((acc, r) => acc + num(r.amount), 0)

      // INVOICES
      const inv = invoicesRows.map((r) => ({
        status: invoiceStatusFromLive(str(r.status)),
        amount: num(r.total),
        paid_amount: num(r.paid_amount),
        due_date: str(r.due_date),
        paid_at: strN(r.paid_at),
      }))
      const invOutstanding = inv
        .filter((r) => r.status !== 'paid' && r.status !== 'cancelled' && r.status !== 'void')
        .reduce((acc, r) => acc + (r.amount - r.paid_amount), 0)
      const invDueThisWeek = inv
        .filter((r) => { const d = new Date(r.due_date); return r.status !== 'paid' && d >= now && d <= weekFromNow })
        .reduce((acc, r) => acc + (r.amount - r.paid_amount), 0)
      const invOverdue = inv
        .filter((r) => r.status === 'overdue')
        .reduce((acc, r) => acc + (r.amount - r.paid_amount), 0)
      const invPaidThisMonth = inv
        .filter((r) => r.status === 'paid' && r.paid_at && r.paid_at >= startOfMonth)
        .reduce((acc, r) => acc + (r.paid_amount || r.amount), 0)
      const totalIssued = inv.reduce((acc, r) => acc + r.amount, 0)
      const totalCollected = inv.filter((r) => r.status === 'paid').reduce((acc, r) => acc + (r.paid_amount || r.amount), 0)
      const collectionRate = totalIssued > 0 ? Math.round((totalCollected / totalIssued) * 100) : 0

      // BILLS
      const bills = billsRows.map((r) => {
        const { approval, payment } = billStatusToApprovalPayment(str(r.status))
        return { approval, payment, amount: num(r.total), paid_at: strN(r.paid_at) }
      })

      // ARREARS
      const arr = arrearsRows.map((r) => ({
        status: arrearsStatusFromLive(str(r.status)),
        outstanding: r.amount_outstanding != null ? num(r.amount_outstanding) : num(r.amount_due) - num(r.amount_paid),
        updated_at: strN(r.updated_at),
      }))

      // DEPOSITS
      const dep = depositsRows.map((r) => ({ status: depositStatusFromLive(str(r.status)), amount: num(r.amount) }))
      const sumDepositsByStatus = (s: DepositStatus) =>
        dep.filter((r) => r.status === s).reduce((acc, r) => acc + r.amount, 0)

      return {
        income: {
          totalReceived,
          expected: 0,
          overdue: 0,
          planned: 0,
          reconciled: 0,
        },
        expenses: {
          totalPaid: expTotalPaid,
          planned: expPlanned,
          fixedCosts: 0,
          variableCosts: 0,
          capitalReno: 0,
        },
        invoices: {
          totalOutstanding: invOutstanding,
          dueThisWeek: invDueThisWeek,
          overdue: invOverdue,
          paidThisMonth: invPaidThisMonth,
          collectionRate,
        },
        bills: {
          awaitingReview: bills.filter((r) => r.approval === 'pending_review').length,
          approvedToPay: bills.filter((r) => r.approval === 'approved' && r.payment === 'unpaid').length,
          overdue: bills.filter((r) => r.payment === 'overdue').length,
          paidThisMonth: bills.filter((r) => r.payment === 'paid' && r.paid_at && new Date(r.paid_at) >= startOfMonthDate).length,
          supplierPaymentQueue: bills
            .filter((r) => r.approval === 'approved' && r.payment === 'unpaid')
            .reduce((acc, r) => acc + r.amount, 0),
        },
        arrears: {
          totalArrears: arr.reduce((acc, r) => acc + r.outstanding, 0),
          openCases: arr.filter((r) => r.status === 'open').length,
          beingChased: arr.filter((r) => r.status === 'being_chased').length,
          onPaymentPlans: arr.filter((r) => r.status === 'payment_plan').length,
          resolvedThisMonth: arr.filter((r) => r.status === 'resolved' && r.updated_at && new Date(r.updated_at) >= startOfMonthDate).length,
        },
        deposits: {
          totalTracked: dep.reduce((acc, r) => acc + r.amount, 0),
          protected: sumDepositsByStatus('protected'),
          expected: sumDepositsByStatus('expected'),
          returnDue: sumDepositsByStatus('return_due'),
          disputed: sumDepositsByStatus('disputed'),
        },
      }
    },
  })
}
